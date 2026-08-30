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

import { PROJECT_ROOT } from "../server/services/hearthwoodPatchbay/paths.js"
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

/**
 * Walk `pathSegments` from `rootObject` (an ObjectExpression) to the
 * value node it addresses. The first segment names a Property key in the
 * root map; each following segment is either an object key or a numeric
 * array index. Returns { node } or { error }.
 */
function resolvePath(rootObject, pathSegments) {

    let current = rootObject

    for (let i = 0; i < pathSegments.length; i += 1) {

        const segment = pathSegments[i]

        if (!current) {

            return { error: `path stopped at a missing node before "${segment}"` }

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

        return {
            error: `cannot descend into a ${current.type} with "${segment}"`,
        }
    }

    return { node: current }
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

    if (!rootInit || rootInit.type !== "ObjectExpression") {

        return {
            ok: false,
            proposedCode: source,
            applied,
            rejected: edits.map(edit => ({
                path: edit.path || null,
                reason:
                    `export const ${exportName} is not an object literal map`,
            })),
        }
    }

    const magic = new MagicString(source)

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

                const needsComma = !before.endsWith("{") && !before.endsWith(",")

                const text = `${needsComma ? "," : ""}\n${block},\n`

                magic.appendLeft(insertAt, text)

                applied.push({ path: editPath, oldText: "", newText: text })

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

            const resolved = resolvePath(rootInit, editPath)

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
