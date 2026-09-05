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
 * Is `name` bound by ANY top-level declaration - function (units.js's
 * own `function unit(...)`), class, or `const/let/var` (findLocalInit).
 * Used only for the addKey/addField identifier-safety check
 * (validateBlockValue) - findLocalInit alone would wrongly flag `unit`
 * as unknown and block every unit clone.
 */
function isTopLevelBinding(ast, name) {

    if (findLocalInit(ast, name)) {

        return true

    }

    for (const node of ast.body) {

        if (
            (node.type === "FunctionDeclaration" || node.type === "ClassDeclaration")
            && node.id
            && node.id.name === name
        ) {

            return true

        }
    }

    return false

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
function findMapPropertyWithContainer(mapNode, ast, key, depth = 0) {

    if (!mapNode || mapNode.type !== "ObjectExpression" || depth > 4) {

        return null

    }

    for (let index = 0; index < mapNode.properties.length; index += 1) {

        const prop = mapNode.properties[index]

        if (prop.type === "Property" && keyName(prop.key, prop.computed) === key) {

            return { container: mapNode, index, prop }

        }

        if (
            (prop.type === "SpreadElement" || prop.type === "ExperimentalSpreadProperty")
            && prop.argument
            && prop.argument.type === "Identifier"
        ) {

            const found = findMapPropertyWithContainer(findLocalInit(ast, prop.argument.name), ast, key, depth + 1)

            if (found) {

                return found

            }
        }
    }

    return null
}

/** Thin wrapper over findMapPropertyWithContainer() for callers that only need the Property node itself. */
function findMapProperty(mapNode, ast, key) {

    const found = findMapPropertyWithContainer(mapNode, ast, key)

    return found ? found.prop : null

}

/**
 * The byte range to delete in order to remove `properties[index]` from a
 * properties/elements list, taking exactly one adjacent comma with it
 * (the trailing one if a later sibling exists, else the leading one) so
 * the result never has a dangling/missing comma. Shared by removeField
 * (an object's own properties) and removeKey (a map's entity entries) -
 * same shape, same comma bookkeeping either way.
 */
function removalRange(properties, index) {

    const target = properties[index]

    if (index < properties.length - 1) {

        return [target.start, properties[index + 1].start]

    }

    if (index > 0) {

        return [properties[index - 1].end, target.end]

    }

    return [target.start, target.end]

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

const KNOWN_GLOBAL_IDENTIFIERS = new Set(["undefined", "NaN", "Infinity"])

/**
 * Recursively collects every `Identifier` appearing in a VALUE position
 * inside `node` (object/array/property values) into `out`, skipping
 * Property keys (unless computed) - the two places a `{ Husk }`-style
 * bare reference to an undefined variable could otherwise sneak past
 * "is this valid JS?" and only blow up at runtime (exactly what
 * happened: `{ Husk }` is valid ESTree shorthand-property syntax, oxlint
 * has no reason to look at an object literal generated by a splice, and
 * `vite build` never evaluates the module - only the running game does).
 */
function collectValueIdentifiers(node, out) {

    if (!node || typeof node !== "object") {

        return

    }

    if (Array.isArray(node)) {

        for (const child of node) {

            collectValueIdentifiers(child, out)

        }

        return

    }

    if (node.type === "Identifier") {

        out.add(node.name)
        return

    }

    if (node.type === "Property") {

        if (node.computed) {

            collectValueIdentifiers(node.key, out)

        }

        collectValueIdentifiers(node.value, out)
        return

    }

    for (const key of Object.keys(node)) {

        if (key === "start" || key === "end" || key === "loc" || key === "range" || key === "type") {

            continue

        }

        const value = node[key]

        if (value && typeof value === "object") {

            collectValueIdentifiers(value, out)

        }
    }
}

/**
 * Validates a raw `addKey`/`addField` block BEFORE it is spliced in.
 * Both ops' `block` is a single `"key": value` (addKey) or `key: value`
 * (addField) Property, not a bare value - wrapping it as `({<block>})`
 * turns it into a one-property ObjectExpression so it can be parsed and
 * walked the same way either op shapes it.
 *
 * (1) the block must parse as valid JS at all - addKey/addField never
 *     validated even syntax until now, relying entirely on the
 *     downstream fast-gate's `vite build`, which only runs AFTER the
 *     file is already written; (2) every bare Identifier the block's
 *     value references (`image: emberStagImg`, or the `{ Husk }`
 *     shorthand-property bug this specifically guards against) must
 *     resolve to either a real top-of-file import or a top-level const
 *     already in the file - anything else parses fine and passes
 *     oxlint/vite build, then throws ReferenceError the moment the game
 *     actually reads that entity.
 * Returns { ok: true } or { ok: false, reason }.
 */
function validateBlockValue(block, ast) {

    let wrapped

    try {

        wrapped = parseAst(`({${block}})`)

    } catch (parseError) {

        return { ok: false, reason: `lohko ei ole kelvollista JavaScriptia: ${parseError.message}` }

    }

    const expressionStatement = wrapped.body[0]

    const objectNode = expressionStatement && expressionStatement.expression

    const property = objectNode && objectNode.type === "ObjectExpression"
        ? objectNode.properties[0]
        : null

    const valueNode = property && property.value

    if (!valueNode) {

        return { ok: false, reason: "lohko ei ole muotoa \"avain\": arvo" }

    }

    const identifiers = new Set()

    collectValueIdentifiers(valueNode, identifiers)

    for (const name of identifiers) {

        if (KNOWN_GLOBAL_IDENTIFIERS.has(name)) {

            continue

        }

        if (importIdentifierExists(ast, name) || isTopLevelBinding(ast, name)) {

            continue

        }

        return {
            ok: false,
            reason: `tuntematon muuttuja "${name}" - se ei ole importattu eikä määritelty tässä tiedostossa`,
        }
    }

    return { ok: true }

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

                const keyValidation = validateBlockValue(block, ast)

                if (!keyValidation.ok) {

                    rejected.push({ path: editPath, reason: keyValidation.reason })
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

            if (edit.op === "addField") {

                // path === [entityId]; key+block describe a brand-new
                // property to insert - into the entity's own object, or
                // (unit()-style factory calls) its trailing options
                // object. Rejects if the key already exists ("set" is
                // the right op for an existing field).
                if (editPath.length !== 1) {

                    rejected.push({ path: editPath, reason: "addField needs [entityId]" })
                    continue

                }

                const fieldKey = String(edit.key || "")

                if (!fieldKey) {

                    rejected.push({ path: editPath, reason: "addField needs a non-empty key" })
                    continue

                }

                const fieldBlock = String(edit.block || "").replace(/\s+$/, "")

                if (!fieldBlock) {

                    rejected.push({ path: editPath, reason: "addField needs a non-empty block" })
                    continue

                }

                const fieldValidation = validateBlockValue(fieldBlock, ast)

                if (!fieldValidation.ok) {

                    rejected.push({ path: editPath, reason: fieldValidation.reason })
                    continue

                }

                let addFieldContainer

                if (rootInit.type === "ObjectExpression") {

                    const targetProp = findMapProperty(rootInit, ast, String(editPath[0]))

                    if (!targetProp) {

                        rejected.push({ path: editPath, reason: `key "${editPath[0]}" not found` })
                        continue

                    }

                    if (targetProp.value.type === "ObjectExpression") {

                        addFieldContainer = targetProp.value

                    } else if (targetProp.value.type === "CallExpression") {

                        const calleeName = targetProp.value.callee && targetProp.value.callee.type === "Identifier"
                            ? targetProp.value.callee.name
                            : null

                        const signature = calleeName ? FACTORY_SIGNATURES[calleeName] : null

                        if (!signature) {

                            rejected.push({ path: editPath, reason: `factory call "${calleeName || "?"}" has no known signature` })
                            continue

                        }

                        const optsNode = targetProp.value.arguments[signature.optsArgIndex]

                        if (!optsNode || optsNode.type !== "ObjectExpression") {

                            rejected.push({ path: editPath, reason: "no options object on this factory call" })
                            continue

                        }

                        addFieldContainer = optsNode

                    } else {

                        rejected.push({ path: editPath, reason: `cannot add a field to a ${targetProp.value.type}` })
                        continue

                    }

                } else {

                    const element = findArrayElementByIdOrIndex(rootInit, editPath[0])

                    if (!element || element.type !== "ObjectExpression") {

                        rejected.push({ path: editPath, reason: "target entity is not an object literal" })
                        continue

                    }

                    addFieldContainer = element

                }

                const existingProp = addFieldContainer.properties.find(
                    p => p.type === "Property" && keyName(p.key, p.computed) === fieldKey,
                )

                if (existingProp) {

                    rejected.push({ path: editPath, reason: `key "${fieldKey}" already exists - use "set" instead` })
                    continue

                }

                const fieldInsertAt = addFieldContainer.end - 1

                const fieldBefore = source.slice(0, fieldInsertAt).replace(/\s+$/, "")

                const fieldNeedsComma = !fieldBefore.endsWith("{") && !fieldBefore.endsWith(",")

                const fieldText = `${fieldNeedsComma ? "," : ""}\n${fieldBlock},\n`

                magic.appendLeft(fieldInsertAt, fieldText)

                applied.push({ path: [...editPath, fieldKey], oldText: "", newText: fieldText })

                continue

            }

            if (edit.op === "removeField") {

                // path === [entityId, fieldName]. Same container
                // resolution as addField, then deletes exactly one
                // adjacent comma along with the property (removalRange)
                // so the result is never left with a dangling/missing one.
                if (editPath.length !== 2) {

                    rejected.push({ path: editPath, reason: "removeField needs [entityId, fieldName]" })
                    continue

                }

                const [rfEntityId, rfFieldKey] = editPath

                let removeFieldContainer

                if (rootInit.type === "ObjectExpression") {

                    const targetProp = findMapProperty(rootInit, ast, String(rfEntityId))

                    if (!targetProp) {

                        rejected.push({ path: editPath, reason: `key "${rfEntityId}" not found` })
                        continue

                    }

                    if (targetProp.value.type === "ObjectExpression") {

                        removeFieldContainer = targetProp.value

                    } else if (targetProp.value.type === "CallExpression") {

                        const calleeName = targetProp.value.callee && targetProp.value.callee.type === "Identifier"
                            ? targetProp.value.callee.name
                            : null

                        const signature = calleeName ? FACTORY_SIGNATURES[calleeName] : null

                        if (!signature) {

                            rejected.push({ path: editPath, reason: `factory call "${calleeName || "?"}" has no known signature` })
                            continue

                        }

                        if (signature.positional.includes(String(rfFieldKey))) {

                            rejected.push({
                                path: editPath,
                                reason: `"${rfFieldKey}" is a required positional argument - cannot remove it`,
                            })
                            continue

                        }

                        const optsNode = targetProp.value.arguments[signature.optsArgIndex]

                        if (!optsNode || optsNode.type !== "ObjectExpression") {

                            rejected.push({ path: editPath, reason: "no options object on this factory call" })
                            continue

                        }

                        removeFieldContainer = optsNode

                    } else {

                        rejected.push({ path: editPath, reason: `cannot remove a field from a ${targetProp.value.type}` })
                        continue

                    }

                } else {

                    const element = findArrayElementByIdOrIndex(rootInit, rfEntityId)

                    if (!element || element.type !== "ObjectExpression") {

                        rejected.push({ path: editPath, reason: "target entity is not an object literal" })
                        continue

                    }

                    removeFieldContainer = element

                }

                const fieldIndex = removeFieldContainer.properties.findIndex(
                    p => p.type === "Property" && keyName(p.key, p.computed) === String(rfFieldKey),
                )

                if (fieldIndex === -1) {

                    rejected.push({ path: editPath, reason: `key "${rfFieldKey}" not found` })
                    continue

                }

                const [fieldRemoveStart, fieldRemoveEnd] = removalRange(removeFieldContainer.properties, fieldIndex)

                const removedFieldText = source.slice(fieldRemoveStart, fieldRemoveEnd)

                magic.remove(fieldRemoveStart, fieldRemoveEnd)

                applied.push({ path: editPath, oldText: removedFieldText, newText: "" })

                continue

            }

            if (edit.op === "removeKey") {

                // path === [entityId]; removes the WHOLE entity from the
                // root map/array (through spreads for an object root, by
                // string id or index for an array root).
                if (editPath.length !== 1) {

                    rejected.push({ path: editPath, reason: "removeKey needs [entityId]" })
                    continue

                }

                if (rootInit.type === "ObjectExpression") {

                    const found = findMapPropertyWithContainer(rootInit, ast, String(editPath[0]))

                    if (!found) {

                        rejected.push({ path: editPath, reason: `key "${editPath[0]}" not found` })
                        continue

                    }

                    const [keyRemoveStart, keyRemoveEnd] = removalRange(found.container.properties, found.index)

                    const removedKeyText = source.slice(keyRemoveStart, keyRemoveEnd)

                    magic.remove(keyRemoveStart, keyRemoveEnd)

                    applied.push({ path: editPath, oldText: removedKeyText, newText: "" })

                    continue

                }

                const wantedId = String(editPath[0])

                let elementIndex = -1

                for (let i = 0; i < rootInit.elements.length; i += 1) {

                    const el = rootInit.elements[i]

                    if (el && el.type === "ObjectExpression") {

                        const idProp = el.properties.find(
                            p => p.type === "Property" && keyName(p.key, p.computed) === "id",
                        )

                        if (idProp && idProp.value.type === "Literal" && idProp.value.value === wantedId) {

                            elementIndex = i
                            break

                        }
                    }
                }

                if (elementIndex === -1 && /^\d+$/.test(wantedId)) {

                    elementIndex = Number(wantedId)

                }

                if (elementIndex === -1 || !rootInit.elements[elementIndex]) {

                    rejected.push({ path: editPath, reason: `no array element matches "${wantedId}"` })
                    continue

                }

                const [elRemoveStart, elRemoveEnd] = removalRange(rootInit.elements, elementIndex)

                const removedElText = source.slice(elRemoveStart, elRemoveEnd)

                magic.remove(elRemoveStart, elRemoveEnd)

                applied.push({ path: editPath, oldText: removedElText, newText: "" })

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
