/**
 * Wood-Booster HQ
 * Boosterverse - Hearthwood Patchbay
 *
 * scripts/hearthwood-read-entities.mjs
 *
 * Pure stdin/argv-JSON -> stdout-JSON. NEVER writes disk.
 *
 * Reads one of the hand-written Hearthwood data ES modules
 * (src/data/heartwood/<file>.js), parses it with vite's `parseAst`
 * (ESTree + byte offsets, from the repo-root node_modules only - the
 * Express server can't resolve it, which is exactly why this runs as a
 * spawned root script), walks the exported entity map and reports every
 * entity's id, display name, scalar fields and complex (array/object)
 * key names, plus the byte range the entity occupies in the source.
 *
 * The data files are PARSED, never imported: units.js does
 * `import img from "...jpg"` at the top, so importing it from Node would
 * throw. Leading `import` statements are tolerated and ignored (R9).
 *
 * Usage:
 *   node scripts/hearthwood-read-entities.mjs --type enemies
 *   echo '{"type":"enemies"}' | node scripts/hearthwood-read-entities.mjs
 *   echo '{"file":"enemies.js","exportName":"ENEMIES"}' | node ...
 *
 * Output shape:
 *   {
 *     type, file, exportName,
 *     entities: [
 *       { id, name,
 *         fields: { <scalarKey>: { value, kind, range: [start,end] } },
 *         complexKeys: [ ... ],
 *         sourceRange: [start, end] }
 *     ]
 *   }
 *
 * Exit code is non-zero only on a parse failure or bad input.
 */

import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import { parseAst } from "vite"

import {
    PROJECT_ROOT,
    HEARTHWOOD_DATA_DIR,
    ENTITY_TYPES,
    FACTORY_SIGNATURES,
} from "../server/services/hearthwoodPatchbay/paths.js"

/* ------------------------------------------------------------------ *
 * input parsing
 * ------------------------------------------------------------------ */

function readStdin() {

    try {

        const raw = fs.readFileSync(0, "utf8").trim()

        return raw ? JSON.parse(raw) : {}

    } catch {

        return {}

    }
}

function parseArgv(argv) {

    const out = {}

    for (let i = 0; i < argv.length; i += 1) {

        const arg = argv[i]

        if (arg === "--type") {

            out.type = argv[i + 1]
            i += 1

        } else if (arg === "--file") {

            out.file = argv[i + 1]
            i += 1

        } else if (arg === "--export") {

            out.exportName = argv[i + 1]
            i += 1

        }
    }

    return out
}

/**
 * Resolve { type } | { file, exportName } -> { file, exportName, type }.
 */
function resolveTarget(input) {

    if (input.type) {

        const entry = ENTITY_TYPES[input.type]

        if (!entry) {

            throw new Error(`unknown entity type: ${input.type}`)

        }

        return {
            type: input.type,
            file: entry.file,
            exportName: entry.exportName,
        }
    }

    if (input.file && input.exportName) {

        return {
            type: input.type || null,
            file: path.basename(input.file),
            exportName: input.exportName,
        }
    }

    throw new Error(
        "input requires either { type } or { file, exportName }",
    )
}

/* ------------------------------------------------------------------ *
 * AST helpers
 * ------------------------------------------------------------------ */

/** Property key -> string name, or null if computed / unsupported. */
function keyName(keyNode, computed) {

    if (computed) {

        return null

    }

    if (!keyNode) {

        return null

    }

    if (keyNode.type === "Literal") {

        return String(keyNode.value)

    }

    if (keyNode.type === "Identifier") {

        return keyNode.name

    }

    return null
}

/**
 * A scalar literal value node -> { value, kind }, or null if the node is
 * not a plain string / number / boolean / null literal. Negative numbers
 * arrive as UnaryExpression("-", Literal) and are handled here too.
 */
function scalarValue(node) {

    if (!node) {

        return null

    }

    if (node.type === "Literal") {

        if (node.value === null && node.raw === "null") {

            return { value: null, kind: "null" }

        }

        const t = typeof node.value

        if (t === "string" || t === "number" || t === "boolean") {

            return { value: node.value, kind: t }

        }

        return null
    }

    if (
        node.type === "UnaryExpression"
        && (node.operator === "-" || node.operator === "+")
        && node.argument
        && node.argument.type === "Literal"
        && typeof node.argument.value === "number"
    ) {

        const magnitude = node.argument.value

        return {
            value: node.operator === "-" ? -magnitude : magnitude,
            kind: "number",
        }
    }

    return null
}

/** Find the `export const <exportName> = <init>` initializer node. */
function findExportInit(ast, exportName) {

    for (const node of ast.body) {

        if (
            node.type === "ExportNamedDeclaration"
            && node.declaration
            && node.declaration.type === "VariableDeclaration"
        ) {

            for (const decl of node.declaration.declarations) {

                if (
                    decl.id
                    && decl.id.type === "Identifier"
                    && decl.id.name === exportName
                ) {

                    return decl.init

                }
            }
        }
    }

    return null
}

/** Find a top-level `const <name> = <init>` (no export) initializer. */
function findLocalInit(ast, name) {

    for (const node of ast.body) {

        const varDecl = node.type === "VariableDeclaration"
            ? node
            : (node.type === "ExportNamedDeclaration"
                && node.declaration
                && node.declaration.type === "VariableDeclaration"
                ? node.declaration
                : null)

        if (!varDecl) {

            continue

        }

        for (const decl of varDecl.declarations) {

            if (
                decl.id
                && decl.id.type === "Identifier"
                && decl.id.name === name
            ) {

                return decl.init

            }
        }
    }

    return null
}

/** A bare `image: emberStagImg` reference to a top-of-file import. */
function isIdentifierRef(node) {

    return !!node && node.type === "Identifier"

}

/**
 * Walks an ObjectExpression's own properties into `fields`/`complexKeys`/
 * `identifierKeys` (mutated in place) - shared between a plain entity
 * object literal and a factory call's trailing options object, so the
 * two don't drift into slightly different field-classification rules.
 */
function collectObjectFields(objNode, fields, complexKeys, identifierKeys) {

    for (const field of objNode.properties) {

        if (field.type !== "Property") {

            complexKeys.push("<spread>")
            continue

        }

        const fk = keyName(field.key, field.computed)

        if (fk == null) {

            continue

        }

        const scalar = scalarValue(field.value)

        if (scalar) {

            fields[fk] = {
                value: scalar.value,
                kind: scalar.kind,
                range: [field.value.start, field.value.end],
            }

        } else if (isIdentifierRef(field.value)) {

            // A reference to a top-of-file `import xImg from "..."` -
            // not splice-safe as a scalar "set" (editApplier.js), but
            // worth naming distinctly from other complex keys so the
            // frontend can offer an image-upload control specifically
            // for these (see balanceRunner.js's sibling, the image
            // upload endpoint).
            complexKeys.push(fk)
            identifierKeys.push(fk)

        } else {

            // Not scalar-editable via "set", but still splice-safe via
            // the generic "setRaw" op (hearthwood-apply-edit.mjs) - a
            // range here lets readEntities() fill in the exact source
            // text below, so the frontend can show/edit it as raw JS
            // without a bespoke UI per mechanic shape (movePattern,
            // effects, passives, ...).
            complexKeys.push(fk)

            fields[fk] = {
                value: null,
                kind: "complex",
                range: [field.value.start, field.value.end],
            }

        }
    }
}

/**
 * Turn a single map Property (key -> value) into an entity record.
 * `value` may be an object literal (the normal case), a recognized
 * factory call (units.js `unit(...)` - FACTORY_SIGNATURES), an
 * unrecognized factory call (best-effort id/name only), or something
 * else we can only name.
 */
function entityFromProperty(prop) {

    const id = keyName(prop.key, prop.computed)

    if (id == null) {

        return null

    }

    const value = prop.value

    const fields = {}

    const complexKeys = []

    const identifierKeys = []

    let name = null

    if (value && value.type === "ObjectExpression") {

        collectObjectFields(value, fields, complexKeys, identifierKeys)

        if (fields.name && fields.name.kind === "string") {

            name = fields.name.value

        }

    } else if (value && value.type === "CallExpression") {

        const calleeName = value.callee && value.callee.type === "Identifier"
            ? value.callee.name
            : null

        const signature = calleeName ? FACTORY_SIGNATURES[calleeName] : null

        if (signature) {

            const args = value.arguments || []

            signature.positional.forEach((argName, index) => {

                const argNode = args[index]

                if (!argNode) {

                    return

                }

                const scalar = scalarValue(argNode)

                if (scalar) {

                    fields[argName] = {
                        value: scalar.value,
                        kind: scalar.kind,
                        range: [argNode.start, argNode.end],
                    }

                } else if (isIdentifierRef(argNode)) {

                    complexKeys.push(argName)
                    identifierKeys.push(argName)

                } else {

                    complexKeys.push(argName)

                    fields[argName] = {
                        value: null,
                        kind: "complex",
                        range: [argNode.start, argNode.end],
                    }

                }
            })

            const optsNode = args[signature.optsArgIndex]

            if (optsNode && optsNode.type === "ObjectExpression") {

                collectObjectFields(optsNode, fields, complexKeys, identifierKeys)

            }

            if (fields.name && fields.name.kind === "string") {

                name = fields.name.value

            }

        } else {

            // Unrecognized factory - best-effort id/name from leading
            // string-literal args; not field-editable.
            const strArgs = (value.arguments || [])
                .filter(a => a.type === "Literal" && typeof a.value === "string")
                .map(a => a.value)

            if (strArgs.length >= 2) {

                name = strArgs[1]

            }

            complexKeys.push("<factory-call>")

        }

    } else if (value) {

        complexKeys.push(`<${value.type}>`)

    }

    return {
        id,
        name,
        fields,
        complexKeys,
        identifierKeys,
        sourceRange: [prop.start, prop.end],
    }
}

/**
 * Walk an ObjectExpression map into entity records, resolving
 * `{ ...IDENTIFIER }` spreads against other top-level object literals in
 * the same file (units.js: `UNITS = { ...BASE_UNITS, ...TIER2_UNITS }`).
 * Spreads that can't be statically resolved are skipped.
 */
function walkMap(mapNode, ast) {

    const entities = []

    const seen = new Set()

    function absorb(objNode, depth) {

        if (!objNode || objNode.type !== "ObjectExpression" || depth > 4) {

            return

        }

        for (const prop of objNode.properties) {

            if (prop.type === "SpreadElement" || prop.type === "ExperimentalSpreadProperty") {

                const arg = prop.argument

                if (arg && arg.type === "Identifier") {

                    absorb(findLocalInit(ast, arg.name), depth + 1)

                }

                continue

            }

            if (prop.type !== "Property") {

                continue

            }

            const record = entityFromProperty(prop)

            if (record && !seen.has(record.id)) {

                seen.add(record.id)
                entities.push(record)

            }
        }
    }

    absorb(mapNode, 0)

    return entities
}

/** Walk an ArrayExpression export (dualClasses.js, tutorial.js). */
function walkArray(arrayNode) {

    const entities = []

    arrayNode.elements.forEach((element, index) => {

        if (!element) {

            return

        }

        const fields = {}

        const complexKeys = []

        let name = null

        let id = String(index)

        if (element.type === "ObjectExpression") {

            for (const field of element.properties) {

                if (field.type !== "Property") {

                    continue

                }

                const fk = keyName(field.key, field.computed)

                if (fk == null) {

                    continue

                }

                const scalar = scalarValue(field.value)

                if (scalar) {

                    fields[fk] = {
                        value: scalar.value,
                        kind: scalar.kind,
                        range: [field.value.start, field.value.end],
                    }

                    if (fk === "id" && scalar.kind === "string") {

                        id = scalar.value

                    }

                    if (fk === "name" && scalar.kind === "string") {

                        name = scalar.value

                    }

                } else {

                    complexKeys.push(fk)

                    fields[fk] = {
                        value: null,
                        kind: "complex",
                        range: [field.value.start, field.value.end],
                    }

                }
            }

        } else {

            complexKeys.push(`<${element.type}>`)

        }

        entities.push({
            id,
            name,
            fields,
            complexKeys,
            identifierKeys: [],
            sourceRange: [element.start, element.end],
        })
    })

    return entities
}

/* ------------------------------------------------------------------ *
 * public function
 * ------------------------------------------------------------------ */

export function readEntities(input) {

    const target = resolveTarget(input)

    const relPath = `${HEARTHWOOD_DATA_DIR}/${target.file}`

    const absPath = path.join(PROJECT_ROOT, relPath)

    const source = fs.readFileSync(absPath, "utf8")

    const ast = parseAst(source)

    const initNode = findExportInit(ast, target.exportName)

    if (!initNode) {

        throw new Error(
            `export const ${target.exportName} not found in ${relPath}`,
        )
    }

    let entities = []

    if (initNode.type === "ObjectExpression") {

        entities = walkMap(initNode, ast)

    } else if (initNode.type === "ArrayExpression") {

        entities = walkArray(initNode)

    } else {

        throw new Error(
            `export ${target.exportName} is a ${initNode.type}, `
            + "not an object/array literal - cannot walk it",
        )
    }

    // Fill in each `kind: "complex"` field's exact source text now that
    // `source` is in scope - kept as a post-pass rather than threading
    // `source` through every walk function, since only the final text is
    // needed (not during AST traversal itself). This is what
    // EntityFieldEditor.jsx shows/edits raw and what a "setRaw" op
    // ultimately replaces.
    for (const entity of entities) {

        for (const field of Object.values(entity.fields)) {

            if (field.kind === "complex" && Array.isArray(field.range)) {

                field.value = source.slice(field.range[0], field.range[1])

            }
        }
    }

    return {
        type: target.type,
        file: relPath,
        exportName: target.exportName,
        entities,
    }
}

/* ------------------------------------------------------------------ *
 * CLI entry
 * ------------------------------------------------------------------ */

function isMain() {

    const invoked = process.argv[1]

    if (!invoked) {

        return false

    }

    return path.resolve(invoked) === path.resolve(new URL(import.meta.url).pathname)
}

if (isMain()) {

    try {

        const input = { ...readStdin(), ...parseArgv(process.argv.slice(2)) }

        const result = readEntities(input)

        process.stdout.write(JSON.stringify(result))
    } catch (error) {

        process.stdout.write(JSON.stringify({ error: String(error && error.message || error) }))

        process.exitCode = 1

    }
}
