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

/**
 * Marc: "haluan että siinä näkyy vanha kuva selvästi esillä" (the
 * image-upload field should clearly show the CURRENT image, not just
 * a bare "change image" button). An `identifierKeys` field (e.g.
 * `image: hollowveilImg`) only ever exposed the FIELD NAME to the
 * frontend before this - never what the identifier actually points
 * to - so there was nothing to render an <img> from. Maps every
 * top-level `import xImg from "../../assets/heartwood/..."` to its
 * import path, keyed by local name, so identifier-ref fields can be
 * resolved back to an actual file the frontend can display.
 */
function buildImportMap(ast) {

    const map = new Map()

    for (const node of ast.body) {

        if (node.type !== "ImportDeclaration" || typeof node.source?.value !== "string") {

            continue

        }

        for (const specifier of node.specifiers || []) {

            if (specifier.type === "ImportDefaultSpecifier" && specifier.local?.name) {

                map.set(specifier.local.name, node.source.value)

            }
        }
    }

    return map

}

/**
 * Resolves an import's own source string (e.g.
 * "../../assets/heartwood/units/hollowveil.jpg", relative to the data
 * file's own directory) into a PROJECT_ROOT-relative path (e.g.
 * "src/assets/heartwood/units/hollowveil.jpg") - Vite's dev server
 * serves the whole source tree at root-relative URLs, so prefixing
 * this with "/" is a real, loadable <img src> for the SAME app the
 * Studio page itself renders inside (HearthwoodStudio.jsx is just
 * another route in the game's own Vite app, not a separate server).
 */
function resolveImportAssetPath(importSource) {

    if (!importSource || !importSource.startsWith(".")) {

        // A bare/package specifier - not a repo-relative asset, nothing
        // to resolve (never seen in practice for these image imports,
        // but never crash on an unexpected shape).
        return null

    }

    const dataFileDir = path.posix.dirname(HEARTHWOOD_DATA_DIR + "/x")

    return path.posix.normalize(path.posix.join(dataFileDir, importSource))

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

/** Every element is an ObjectExpression - a "records" array (choices, lines, effects...). */
function isListOfObjects(node) {

    return node.type === "ArrayExpression"
        && node.elements.length > 0
        && node.elements.every(el => el && el.type === "ObjectExpression")

}

/** Every element is a splice-safe scalar - a "lines" array (a merchant's greeting pool...). */
function isListOfScalars(node) {

    return node.type === "ArrayExpression"
        && node.elements.length > 0
        && node.elements.every(el => el && scalarValue(el))

}

/**
 * Walks an ObjectExpression's own properties into `fields`/`complexKeys`/
 * `identifierKeys` (mutated in place) - shared between a plain entity
 * object literal and a factory call's trailing options object, so the
 * two don't drift into slightly different field-classification rules.
 *
 * Marc: "valintaikkunan ja muut tarinanhaarat ei vielä ole
 * muokattavissa" (the choice window and other story branches aren't
 * editable yet) - a `choices`/`lines`/`effects`-style array of records
 * used to fall straight into the generic "complex" raw-JS bucket below,
 * with no way to edit just one choice's own label/result text without
 * hand-editing the whole array as one blob. `kind: "list"` instead
 * recurses this SAME function over each element, so a list item's own
 * fields are just as scalar-editable as a top-level entity's - and if
 * one of THOSE fields is itself a records array (an event choice's own
 * `effects`), it becomes a nested list too. `depth` guards against
 * runaway recursion on something pathological; real data never nests
 * more than 2-3 levels (entity -> choices -> effects).
 */
function collectObjectFields(objNode, fields, complexKeys, identifierKeys, importMap, depth = 0) {

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
            // upload endpoint). `value` (this round) resolves the
            // identifier back to an actual asset path so the CURRENT
            // image can be shown, not just a bare upload button.
            const importSource = importMap ? importMap.get(field.value.name) : null

            fields[fk] = {
                value: resolveImportAssetPath(importSource),
                kind: "identifier",
                range: [field.value.start, field.value.end],
            }

            complexKeys.push(fk)
            identifierKeys.push(fk)

        } else if (depth < 3 && isListOfObjects(field.value)) {

            const items = field.value.elements.map(el => {

                const itemFields = {}
                const itemComplexKeys = []
                const itemIdentifierKeys = []

                collectObjectFields(el, itemFields, itemComplexKeys, itemIdentifierKeys, importMap, depth + 1)

                return {
                    fields: itemFields,
                    complexKeys: itemComplexKeys,
                    identifierKeys: itemIdentifierKeys,
                    range: [el.start, el.end],
                }
            })

            fields[fk] = {
                value: null,
                kind: "list",
                range: [field.value.start, field.value.end],
                items,
            }

            complexKeys.push(fk)

        } else if (depth < 3 && isListOfScalars(field.value)) {

            const items = field.value.elements.map(el => {

                const scalarEl = scalarValue(el)

                return { value: scalarEl.value, kind: scalarEl.kind, range: [el.start, el.end] }
            })

            fields[fk] = {
                value: null,
                kind: "list",
                range: [field.value.start, field.value.end],
                items,
            }

            complexKeys.push(fk)

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
function entityFromProperty(prop, importMap) {

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

        collectObjectFields(value, fields, complexKeys, identifierKeys, importMap)

        if (fields.name && fields.name.kind === "string") {

            name = fields.name.value

        } else if (fields.text && fields.text.kind === "string") {

            // No dedicated display name (storyLog.js's FLAG_LABELS: an
            // id -> { act, text } entry, no "name" field of its own) -
            // the flavor/body text itself is the only human-readable
            // thing to show in the browser list instead of the raw id.
            name = fields.text.value

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

                    const importSource = importMap ? importMap.get(argNode.name) : null

                    fields[argName] = {
                        value: resolveImportAssetPath(importSource),
                        kind: "identifier",
                        range: [argNode.start, argNode.end],
                    }

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

                collectObjectFields(optsNode, fields, complexKeys, identifierKeys, importMap)

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

    } else if (value && scalarValue(value)) {

        // A flat map entry (id -> bare scalar, e.g. storyLog.js's
        // FLAG_LABELS: id -> sentence string) has no sub-object to pull
        // fields from - the value itself IS the one editable field.
        // Exposed under a synthetic "text" key so the field editor can
        // treat it like any other scalar; resolvePath in
        // hearthwood-apply-edit.mjs mirrors this by returning the map
        // entry's own value node for any trailing path segment here.
        const scalar = scalarValue(value)

        fields.text = {
            value: scalar.value,
            kind: scalar.kind,
            range: [value.start, value.end],
        }

        if (scalar.kind === "string") {

            name = scalar.value

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

    const importMap = buildImportMap(ast)

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

            const record = entityFromProperty(prop, importMap)

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
function walkArray(arrayNode, ast) {

    const entities = []

    const importMap = buildImportMap(ast)

    arrayNode.elements.forEach((element, index) => {

        if (!element) {

            return

        }

        const fields = {}

        const complexKeys = []

        const identifierKeys = []

        let name = null

        let id = String(index)

        if (element.type === "ObjectExpression") {

            // Same field-classification rules a map-keyed entity gets
            // (collectObjectFields) - was its own simplified duplicate
            // that never learned the "list" kind (events.js's own
            // `choices` stayed a raw-JS blob - Marc: "valintaikkunan...
            // ei vielä ole muokattavissa"), which the two silently drifted
            // out of sync on.
            collectObjectFields(element, fields, complexKeys, identifierKeys, importMap)

            if (fields.id && fields.id.kind === "string") {

                id = fields.id.value

            }

            if (fields.name && fields.name.kind === "string") {

                name = fields.name.value

            }

        } else {

            complexKeys.push(`<${element.type}>`)

        }

        entities.push({
            id,
            name,
            fields,
            complexKeys,
            identifierKeys,
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

    // `input.source`, when given, is read INSTEAD of the file on disk -
    // lets a caller (currently just the test suite) sanity-check a
    // proposed edit's result by walking it exactly like the real file,
    // without writing anything.
    const source = typeof input.source === "string"
        ? input.source
        : fs.readFileSync(path.join(PROJECT_ROOT, relPath), "utf8")

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

        entities = walkArray(initNode, ast)

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
    function backfillComplexText(fieldsObj) {

        for (const field of Object.values(fieldsObj)) {

            if (field.kind === "complex" && Array.isArray(field.range)) {

                field.value = source.slice(field.range[0], field.range[1])

            } else if (field.kind === "list" && Array.isArray(field.items)) {

                // A list item is either a records object (its own
                // `.fields`, recurse the same way) or a bare scalar (no
                // `.fields` to backfill into).
                for (const item of field.items) {

                    if (item.fields) {

                        backfillComplexText(item.fields)

                    }
                }
            }
        }
    }

    for (const entity of entities) {

        backfillComplexText(entity.fields)

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
