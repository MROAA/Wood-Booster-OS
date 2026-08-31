/**
 * Wood-Booster HQ
 * Boosterverse - Hearthwood Patchbay
 *
 * scripts/hearthwood-apply-edit.mjs
 *
 * Pure stdin-JSON -> stdout-JSON. NEVER writes disk. The server does the
 * real write (through writeCodeChangeSkill) - this script only produces
 * the proposed file text.
 *
 * "AST to locate, string-splice to edit": the file is parsed once with
 * `parseAst`, the target value node's byte range is found by walking a
 * key path, and ONLY that range is overwritten with `magic-string`.
 * Everything else - comments, whitespace, key order, trailing commas -
 * stays byte-identical. A file is never regenerated from its AST.
 *
 * stdin:
 *   {
 *     "filePath": "src/data/heartwood/enemies.js",
 *     "exportName": "ENEMIES",                 // optional for CSS
 *     "edits": [
 *       { "path": ["rotwood-husk", "maxHp"], "op": "set", "value": 40 },
 *       { "path": ["ENEMIES"], "op": "addKey", "key": "new-foe",
 *         "block": "  \"new-foe\": { id: \"new-foe\", maxHp: 20 }" },
 *       { "selector": ".hw-root", "prop": "--hw-hp",
 *         "op": "set", "value": "#c0392b" }      // CSS
 *     ]
 *   }
 *
 * stdout:
 *   { ok, proposedCode,
 *     applied:  [ { path, oldText, newText } ],
 *     rejected: [ { path, reason } ] }
 *
 * Exit code is non-zero only when the source file itself cannot be
 * parsed (a rejected individual edit is not a process failure).
 */

import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import { parseAst } from "vite"
import MagicString from "magic-string"
import postcss from "postcss"

import { PROJECT_ROOT, FACTORY_SIGNATURES } from "../server/services/hearthwoodPatchbay/paths.js"
import { declValueRange } from "./hearthwood-read-styles.mjs"

/* ------------------------------------------------------------------ *
 * shared
 * ------------------------------------------------------------------ */

function readStdin() {

    try {

        const raw = fs.readFileSync(0, "utf8").trim()

        return raw ? JSON.parse(raw) : {}

    } catch {

        return {}

    }
}

/** Serialize a scalar JS value to its literal source text. */
function literalText(value) {

    if (value === null) {

        return "null"

    }

    const t = typeof value

    if (t === "number" || t === "boolean") {

        return String(value)

    }

    if (t === "string") {

        return JSON.stringify(value)

    }

    throw new Error(`unsupported value type for a scalar set: ${t}`)
}

function keyName(keyNode, computed) {

    if (computed || !keyNode) {

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

/* ------------------------------------------------------------------ *
 * JS path (parseAst + magic-string)
 * ------------------------------------------------------------------ */

function findExportInit(ast, exportName) {

    for (const node of ast.body) {

        const varDecl = node.type === "ExportNamedDeclaration"
            && node.declaration
            && node.declaration.type === "VariableDeclaration"
            ? node.declaration
            : (node.type === "VariableDeclaration" ? node : null)

        if (!varDecl) {

            continue

        }

        for (const decl of varDecl.declarations) {

            if (
                decl.id
                && decl.id.type === "Identifier"
                && decl.id.name === exportName
            ) {

                return decl.init

            }
        }
    }

    return null
}

/** Find a top-level `const <name> = <init>` (exported or not). */
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

/**
 * Finds the Property node for `key` in a map ObjectExpression, resolving
 * through `{ ...IDENTIFIER }` spreads against other top-level object
 * literals in the file (units.js: `UNITS = {...BASE_UNITS,
 * ...TIER2_UNITS}`) - mirrors hearthwood-read-entities.mjs's walkMap()
 * `absorb()`, which the reader already needs for the exact same reason.
 * Without this, every write against a spread-composed map would 404 on
 * its very first path segment even though the reader can see the key.
 */
function findMapProperty(mapNode, ast, key, depth = 0) {

    if (!mapNode || mapNode.type !== "ObjectExpression" || depth > 4) {

        return null

    }

    for (const prop of mapNode.properties) {

        if (prop.type === "Property" && keyName(prop.key, prop.computed) === key) {

            return prop

        }

        if (
            (prop.type === "SpreadElement" || prop.type === "ExperimentalSpreadProperty")
            && prop.argument
            && prop.argument.type === "Identifier"
        ) {

            const found = findMapProperty(findLocalInit(ast, prop.argument.name), ast, key, depth + 1)

            if (found) {

                return found

            }
        }
    }

    return null
}

/**
 * Finds an ArrayExpression element by the same rule
 * hearthwood-read-entities.mjs's walkArray() assigns ids with: the
 * element's own string "id" property if it has one, else the array
 * index (as a string). Only meaningful at the top level (path segment
 * 0) - a plain-array export's entities, not a nested array field.
 */
function findArrayElementByIdOrIndex(arrayNode, segment) {

    const wanted = String(segment)

    for (const [index, element] of arrayNode.elements.entries()) {

        if (!element) {

            continue

        }

        if (element.type === "ObjectExpression") {

            const idProp = element.properties.find(
                p => p.type === "Property" && keyName(p.key, p.computed) === "id",
            )

            if (
                idProp
                && idProp.value.type === "Literal"
                && typeof idProp.value.value === "string"
                && idProp.value.value === wanted
            ) {

                return element

            }
        }

        if (String(index) === wanted) {

            // Only reachable when nothing had a matching string "id" -
            // matches the reader's own fallback order.
            const hasAnyId = element.type === "ObjectExpression" && element.properties.some(
                p => p.type === "Property" && keyName(p.key, p.computed) === "id",
            )

            if (!hasAnyId) {

                return element

            }
        }
    }

    return null

}

/**
 * Walk `pathSegments` from `rootObject` (the root map's ObjectExpression)
 * to the value node it addresses. The first segment names an entity key
 * in the root map (resolved through spreads via findMapProperty); each
 * following segment is an object key, a numeric array index, or a
 * factory-call argument/option name. Returns { node } or { error }.
 */
function resolvePath(rootObject, pathSegments, ast) {

    let current = rootObject

    for (let i = 0; i < pathSegments.length; i += 1) {

        const segment = pathSegments[i]

        if (!current) {

            return { error: `path stopped at a missing node before "${segment}"` }

        }

        if (i === 0 && current.type === "ObjectExpression") {

            const key = String(segment)

            const prop = findMapProperty(current, ast, key)

            if (!prop) {

                return { error: `key "${key}" not found` }

            }

            current = prop.value

            continue

        }

        if (i === 0 && current.type === "ArrayExpression") {

            // A plain-array export (dualClasses.js/tutorial.js). The
            // reader (hearthwood-read-entities.mjs's walkArray) uses each
            // element's own string "id" field as the entity id when one
            // exists, falling back to the array index only when it
            // doesn't (tutorial.js) - mirror that exact rule here so a
            // path segment resolves to the same element the browser saw.
            const element = findArrayElementByIdOrIndex(current, segment)

            if (!element) {

                return { error: `no array element matches "${segment}"` }

            }

            current = element

            continue

        }

        if (current.type === "ObjectExpression") {

            const key = String(segment)

            const prop = current.properties.find(
                p => p.type === "Property" && keyName(p.key, p.computed) === key,
            )

            if (!prop) {

                return { error: `key "${key}" not found` }

            }

            current = prop.value

            continue

        }

        if (current.type === "ArrayExpression") {

            const index = Number(segment)

            if (!Number.isInteger(index) || index < 0) {

                return { error: `"${segment}" is not an array index` }

            }

            if (index >= current.elements.length) {

                return { error: `array index ${index} out of range` }

            }

            current = current.elements[index]

            continue

        }

        if (current.type === "CallExpression") {

            // units.js style: unit(id, name, art, cost, role, movePattern,
            // opts). `segment` names either a positional argument
            // (FACTORY_SIGNATURES) or a key inside the trailing opts
            // object - same two-tier lookup hearthwood-read-entities.mjs
            // uses to report these fields in the first place.
            const calleeName = current.callee && current.callee.type === "Identifier"
                ? current.callee.name
                : null

            const signature = calleeName ? FACTORY_SIGNATURES[calleeName] : null

            if (!signature) {

                return {
                    error: `factory call "${calleeName || "?"}" has no known signature`,
                }
            }

            const positionalIndex = signature.positional.indexOf(String(segment))

            if (positionalIndex !== -1) {

                const argNode = current.arguments[positionalIndex]

                if (!argNode) {

                    return { error: `argument for "${segment}" is missing` }

                }

                current = argNode

                continue

            }

            const optsNode = current.arguments[signature.optsArgIndex]

            if (!optsNode || optsNode.type !== "ObjectExpression") {

                return { error: `"${segment}" not found - no options object on this call` }

            }

            const key = String(segment)

            const prop = optsNode.properties.find(
                p => p.type === "Property" && keyName(p.key, p.computed) === key,
            )

            if (!prop) {

                return { error: `key "${key}" not found in factory options` }

            }

            current = prop.value

            continue

        }

        return {
            error: `cannot descend into a ${current.type} with "${segment}"`,
        }
    }

    return { node: current }
}

/** Byte offset right after the last top-level `import ...` statement. */
function findLastImportEnd(ast) {

    let end = 0

    for (const node of ast.body) {

        if (node.type === "ImportDeclaration") {

            end = node.end

        }
    }

    return end

}

/** Is `name` already bound by a top-level import's local specifier? */
function importIdentifierExists(ast, name) {

    for (const node of ast.body) {

        if (node.type !== "ImportDeclaration") {

            continue

        }

        for (const spec of node.specifiers) {

            if (spec.local && spec.local.name === name) {

                return true

            }
        }
    }

    return false

}

/**
 * entityId -> camelCase + "Img", matching this file's own existing
 * import-naming convention exactly (`ember-stag` -> `emberStagImg`,
 * `the-fool` -> `theFoolImg`) so a swapped-in image reads like it was
 * always there.
 */
function toImportIdentifierBase(entityId) {

    const parts = String(entityId).split(/[^a-zA-Z0-9]+/).filter(Boolean)

    const camel = parts
        .map((part, index) => index === 0
            ? part.toLowerCase()
            : part[0].toUpperCase() + part.slice(1).toLowerCase())
        .join("")

    return `${camel}Img`

}

/** A free (not already imported) identifier name for entityId's image. */
function uniqueImportIdentifier(ast, entityId, reservedInThisRun) {

    const base = toImportIdentifierBase(entityId)

    if (!importIdentifierExists(ast, base) && !reservedInThisRun.has(base)) {

        return base

    }

    let suffix = 2

    while (
        importIdentifierExists(ast, `${base}${suffix}`)
        || reservedInThisRun.has(`${base}${suffix}`)
    ) {

        suffix += 1

    }

    return `${base}${suffix}`

}

function applyJsEdits({ source, exportName, edits }) {

    const ast = parseAst(source)

    const applied = []

    const rejected = []

    if (!exportName) {

        return {
            ok: false,
            proposedCode: source,
            applied,
            rejected: edits.map(edit => ({
                path: edit.path || null,
                reason: "exportName is required for a JS edit",
            })),
        }
    }

    const rootInit = findExportInit(ast, exportName)

    // Most maps are ObjectExpression; dualClasses.js/tutorial.js export a
    // plain ArrayExpression instead (paths.js's own ENTITY_TYPES notes
    // this) - resolvePath()/the addKey insertion-point logic both already
    // handle either root shape structurally, so only truly unsupported
    // roots (a factory call at the TOP level, a computed expression, ...)
    // are rejected here.
    if (!rootInit || (rootInit.type !== "ObjectExpression" && rootInit.type !== "ArrayExpression")) {

        return {
            ok: false,
            proposedCode: source,
            applied,
            rejected: edits.map(edit => ({
                path: edit.path || null,
                reason:
                    `export const ${exportName} is not an object or array literal`,
            })),
        }
    }

    const magic = new MagicString(source)

    const reservedIdentifiers = new Set()

    for (const edit of edits) {

        const editPath = Array.isArray(edit.path) ? edit.path : []

        try {

            if (edit.op === "addKey") {

                // path === [mapName]; insert a rendered block just before
                // the map's closing brace.
                const block = String(edit.block || "").replace(/\s+$/, "")

                if (!block) {

                    rejected.push({ path: editPath, reason: "addKey needs a non-empty block" })
                    continue

                }

                const insertAt = rootInit.end - 1

                const before = source.slice(0, insertAt).replace(/\s+$/, "")

                const needsComma = !before.endsWith("{") && !before.endsWith("[") && !before.endsWith(",")

                const text = `${needsComma ? "," : ""}\n${block},\n`

                magic.appendLeft(insertAt, text)

                applied.push({ path: editPath, oldText: "", newText: text })

                continue

            }

            if (edit.op === "setImportedImage") {

                // path === [entityId, fieldName]; fieldName's current
                // value must already be an Identifier (an existing
                // `image: xImg`-style import reference) - this only
                // swaps which import it points to, it never adds the
                // field to an entity that doesn't have it yet.
                if (editPath.length !== 2) {

                    rejected.push({ path: editPath, reason: "setImportedImage needs [entityId, fieldName]" })
                    continue

                }

                const importPath = String(edit.importPath || "")

                if (!importPath) {

                    rejected.push({ path: editPath, reason: "importPath is required" })
                    continue

                }

                const resolvedImage = resolvePath(rootInit, editPath, ast)

                if (resolvedImage.error) {

                    rejected.push({ path: editPath, reason: resolvedImage.error })
                    continue

                }

                const imageTarget = resolvedImage.node

                if (imageTarget.type !== "Identifier") {

                    rejected.push({
                        path: editPath,
                        reason: `target is a ${imageTarget.type}, expected an existing image identifier reference`,
                    })
                    continue

                }

                const identifierName = uniqueImportIdentifier(ast, editPath[0], reservedIdentifiers)

                reservedIdentifiers.add(identifierName)

                const importLine = `\nimport ${identifierName} from "${importPath}"`

                magic.appendLeft(findLastImportEnd(ast), importLine)

                magic.overwrite(imageTarget.start, imageTarget.end, identifierName)

                applied.push({ path: editPath, oldText: imageTarget.name, newText: identifierName })

                continue

            }

            if (edit.op === "setRaw") {

                // Wholesale-replace ANY node's exact source text - the
                // generic escape hatch for the complex fields "set" can
                // never touch (movePattern, effects, passives, a whole
                // per-tribe synergy tier array, ...). path.length===1
                // targets the entire entity's value (synergies.js: each
                // tribe's value IS the array, no wrapper object to
                // descend into); longer paths resolve exactly like "set"
                // (through object fields / factory-call args-or-opts /
                // array indices) but accept any node shape, not just
                // scalars. Safety: the substitution is trial-run through
                // parseAst against the ORIGINAL source before being
                // accepted - malformed replacement text is rejected
                // outright, never silently written.
                if (editPath.length < 1) {

                    rejected.push({ path: editPath, reason: "empty path" })
                    continue

                }

                const newText = String(edit.value ?? "")

                if (!newText.trim()) {

                    rejected.push({ path: editPath, reason: "setRaw needs non-empty replacement text" })
                    continue

                }

                let rawTarget

                if (editPath.length === 1) {

                    if (rootInit.type === "ObjectExpression") {

                        const prop = findMapProperty(rootInit, ast, String(editPath[0]))

                        if (!prop) {

                            rejected.push({ path: editPath, reason: `key "${editPath[0]}" not found` })
                            continue

                        }

                        rawTarget = prop.value

                    } else {

                        const element = findArrayElementByIdOrIndex(rootInit, editPath[0])

                        if (!element) {

                            rejected.push({ path: editPath, reason: `no array element matches "${editPath[0]}"` })
                            continue

                        }

                        rawTarget = element

                    }

                } else {

                    const resolvedRaw = resolvePath(rootInit, editPath, ast)

                    if (resolvedRaw.error) {

                        rejected.push({ path: editPath, reason: resolvedRaw.error })
                        continue

                    }

                    rawTarget = resolvedRaw.node

                }

                const trialSource = source.slice(0, rawTarget.start) + newText + source.slice(rawTarget.end)

                try {

                    parseAst(trialSource)

                } catch (parseError) {

                    rejected.push({
                        path: editPath,
                        reason: `korvaava teksti ei ole kelvollista JavaScriptia: ${parseError.message}`,
                    })
                    continue

                }

                const rawOldText = source.slice(rawTarget.start, rawTarget.end)

                magic.overwrite(rawTarget.start, rawTarget.end, newText)

                applied.push({ path: editPath, oldText: rawOldText, newText })

                continue

            }

            if (edit.op !== "set") {

                rejected.push({ path: editPath, reason: `unsupported op "${edit.op}"` })
                continue

            }

            if (editPath.length < 1) {

                rejected.push({ path: editPath, reason: "empty path" })
                continue

            }

            const resolved = resolvePath(rootInit, editPath, ast)

            if (resolved.error) {

                rejected.push({ path: editPath, reason: resolved.error })
                continue

            }

            const target = resolved.node

            // Only scalar literal targets are splice-safe.
            const isScalarTarget =
                (target.type === "Literal"
                    && (target.value === null
                        || ["string", "number", "boolean"].includes(typeof target.value)))
                || (target.type === "UnaryExpression"
                    && (target.operator === "-" || target.operator === "+")
                    && target.argument
                    && target.argument.type === "Literal"
                    && typeof target.argument.value === "number")

            if (!isScalarTarget) {

                rejected.push({
                    path: editPath,
                    reason:
                        `target is a ${target.type}, not a scalar literal `
                        + "- use whole-file mode",
                })
                continue

            }

            const oldText = source.slice(target.start, target.end)

            const newText = literalText(edit.value)

            if (oldText === newText) {

                rejected.push({ path: editPath, reason: "value is unchanged" })
                continue

            }

            magic.overwrite(target.start, target.end, newText)

            applied.push({ path: editPath, oldText, newText })

        } catch (error) {

            rejected.push({
                path: editPath,
                reason: String(error && error.message || error),
            })
        }
    }

    return {
        ok: applied.length > 0,
        proposedCode: magic.toString(),
        applied,
        rejected,
    }
}

/* ------------------------------------------------------------------ *
 * CSS path (postcss + magic-string)
 * ------------------------------------------------------------------ */

function normalizeSelector(selector) {

    return String(selector || "").replace(/\s+/g, " ").trim()
}

function applyCssEdits({ source, absPath, edits }) {

    const root = postcss.parse(source, { from: absPath })

    const magic = new MagicString(source)

    const applied = []

    const rejected = []

    for (const edit of edits) {

        const label = [edit.selector, edit.prop]

        if (edit.op && edit.op !== "set") {

            rejected.push({ path: label, reason: `unsupported op "${edit.op}"` })
            continue

        }

        const wantSelector = normalizeSelector(edit.selector)

        const wantProp = String(edit.prop || "")

        let matchDecl = null

        root.walkRules(rule => {

            if (normalizeSelector(rule.selector) !== wantSelector) {

                return

            }

            rule.walkDecls(decl => {

                if (decl.prop === wantProp) {

                    matchDecl = decl

                }
            })
        })

        if (!matchDecl) {

            rejected.push({
                path: label,
                reason: `no "${wantProp}" declaration under "${edit.selector}"`,
            })
            continue

        }

        const range = declValueRange(matchDecl)

        if (!range) {

            rejected.push({ path: label, reason: "postcss gave no value offset" })
            continue

        }

        const [start, end] = range

        const oldText = source.slice(start, end)

        const newText = String(edit.value)

        if (oldText === newText) {

            rejected.push({ path: label, reason: "value is unchanged" })
            continue

        }

        magic.overwrite(start, end, newText)

        applied.push({ path: label, oldText, newText })

    }

    return {
        ok: applied.length > 0,
        proposedCode: magic.toString(),
        applied,
        rejected,
    }
}

/* ------------------------------------------------------------------ *
 * public function
 * ------------------------------------------------------------------ */

export function applyEdit(input) {

    const relPath = String(input.filePath || "").replace(/^[/\\]+/, "")

    if (!relPath) {

        throw new Error("filePath is required")

    }

    const absPath = path.join(PROJECT_ROOT, relPath)

    const source = fs.readFileSync(absPath, "utf8")

    const edits = Array.isArray(input.edits) ? input.edits : []

    const isCss = relPath.endsWith(".css")
        || edits.some(edit => edit && edit.selector && edit.prop)

    if (isCss) {

        return applyCssEdits({ source, absPath, edits })

    }

    return applyJsEdits({ source, exportName: input.exportName, edits })
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

        const result = applyEdit(readStdin())

        process.stdout.write(JSON.stringify(result))
    } catch (error) {

        process.stdout.write(JSON.stringify({
            ok: false,
            error: String(error && error.message || error),
        }))

        process.exitCode = 1

    }
}
