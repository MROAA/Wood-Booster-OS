/**
 * Wood-Booster HQ
 * Boosterverse - Hearthwood Patchbay
 *
 * editApplier.js
 *
 * Turns a set of edit ops into a concrete proposed file text - WITHOUT
 * writing anything. The real write is the server's job (snapshot.js ->
 * writeCodeChangeSkill). The heart of the deterministic path:
 * "AST to locate, string-splice to edit", run in the repo-root
 * `scripts/hearthwood-apply-edit.mjs` subprocess (root node_modules).
 *
 *   buildProposal({ type, entityId, edits })  -> data-file op edits
 *   buildCssProposal({ selector, prop, value }) -> one CSS value tweak
 *   buildWholeFileProposal({ filePath, proposedCode }) -> escape hatch
 *
 * Every result: { filePath, originalCode, proposedCode, appliedOps,
 * rejectedOps }.
 *
 * If the subprocess is unavailable, a single-scalar op falls back to a
 * brace-aware in-process string anchor (plan A1's "in-process fallback
 * for the single simplest case").
 */

import path from "node:path"
import fs from "node:fs"
import { execFile } from "node:child_process"
import { promisify } from "node:util"

import {
    PROJECT_ROOT,
    ENTITY_TYPES,
    dataFilePathFor,
    HEARTHWOOD_STYLE_FILES,
} from "./paths.js"

const execFileAsync = promisify(execFile)

const APPLY_SCRIPT = path.join(
    PROJECT_ROOT,
    "scripts",
    "hearthwood-apply-edit.mjs",
)

const TIMEOUT_MS = 15000

const MAX_BUFFER_BYTES = 8_000_000

function readFile(relPath) {

    return fs.readFileSync(path.join(PROJECT_ROOT, relPath), "utf8")
}

/** type name for a data file basename, or null. */
export function typeForFile(relPath) {

    const base = path.basename(String(relPath || ""))

    for (const [type, entry] of Object.entries(ENTITY_TYPES)) {

        if (entry.file === base) {

            return type

        }
    }

    return null
}

function exportNameForFile(relPath) {

    const type = typeForFile(relPath)

    return type ? ENTITY_TYPES[type].exportName : null
}

async function runApplyScript(payload) {

    const child = execFileAsync(process.execPath, [APPLY_SCRIPT], {
        cwd: PROJECT_ROOT,
        timeout: TIMEOUT_MS,
        maxBuffer: MAX_BUFFER_BYTES,
    })

    if (child.child && child.child.stdin) {

        child.child.stdin.write(JSON.stringify(payload))
        child.child.stdin.end()

    }

    let stdout = ""

    try {

        stdout = (await child).stdout || ""

    } catch (error) {

        stdout = error.stdout || ""

        if (!stdout) {

            throw new Error(error.message || "apply-edit subprocess failed")

        }
    }

    const parsed = JSON.parse(stdout)

    if (parsed && parsed.error && !Array.isArray(parsed.rejected)) {

        throw new Error(parsed.error)

    }

    return parsed
}

/* ------------------------------------------------------------------ *
 * in-process fallback: exactly one `op:"set"` scalar on an existing key
 * ------------------------------------------------------------------ */

function isSingleScalarSet(edits) {

    return Array.isArray(edits)
        && edits.length === 1
        && edits[0]
        && edits[0].op === "set"
        && Array.isArray(edits[0].path)
        && edits[0].path.length === 2
        && edits[0].path.every(seg => typeof seg === "string")
}

function literalText(value) {

    if (value === null) {

        return "null"

    }

    const t = typeof value

    if (t === "number" || t === "boolean") {

        return String(value)

    }

    return JSON.stringify(value)
}

/**
 * Brace-aware string-anchor splice for `[entityKey, fieldKey]` set.
 * Locates the entity's object body by brace-depth from its key, then
 * replaces the field's value token. Returns { proposedCode, applied } or
 * throws.
 */
function inProcessSingleScalar(source, edits) {

    const [entityKey, fieldKey] = edits[0].path

    const value = edits[0].value

    // Find `"entityKey"` or `entityKey` used as an object key.
    const keyPatterns = [
        new RegExp(`(["'])${escapeRe(entityKey)}\\1\\s*:`),
        new RegExp(`(^|[^\\w$])${escapeRe(entityKey)}\\s*:`, "m"),
    ]

    let keyMatch = null

    for (const pattern of keyPatterns) {

        keyMatch = pattern.exec(source)

        if (keyMatch) {

            break

        }
    }

    if (!keyMatch) {

        throw new Error(`in-process fallback: entity key "${entityKey}" not found`)

    }

    const braceStart = source.indexOf("{", keyMatch.index + keyMatch[0].length - 1)

    if (braceStart === -1) {

        throw new Error("in-process fallback: entity object brace not found")

    }

    let depth = 0

    let braceEnd = -1

    for (let i = braceStart; i < source.length; i += 1) {

        const ch = source[i]

        if (ch === "{") {

            depth += 1

        } else if (ch === "}") {

            depth -= 1

            if (depth === 0) {

                braceEnd = i
                break

            }
        }
    }

    if (braceEnd === -1) {

        throw new Error("in-process fallback: unbalanced braces")

    }

    const body = source.slice(braceStart, braceEnd + 1)

    const fieldRe = new RegExp(
        `(["']?${escapeRe(fieldKey)}["']?\\s*:\\s*)(-?\\d+(?:\\.\\d+)?|"[^"\\n]*"|'[^'\\n]*'|true|false|null)`,
    )

    const fieldMatch = fieldRe.exec(body)

    if (!fieldMatch) {

        throw new Error(`in-process fallback: scalar field "${fieldKey}" not found`)

    }

    const oldText = fieldMatch[2]

    const newText = literalText(value)

    const absoluteStart = braceStart + fieldMatch.index + fieldMatch[1].length

    const proposedCode =
        source.slice(0, absoluteStart)
        + newText
        + source.slice(absoluteStart + oldText.length)

    return {
        proposedCode,
        applied: [{ path: edits[0].path, oldText, newText }],
    }
}

function escapeRe(text) {

    return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/* ------------------------------------------------------------------ *
 * public builders
 * ------------------------------------------------------------------ */

/**
 * buildProposal({ type, entityId, edits, filePath? })
 * `entityId` is informational - the ops' `path` already carries it.
 */
export async function buildProposal({ type, entityId, edits, filePath } = {}) {

    const relPath = filePath || dataFilePathFor(type)

    if (!relPath) {

        throw new Error(`buildProposal: unknown entity type "${type}"`)

    }

    const originalCode = readFile(relPath)

    const exportName = exportNameForFile(relPath)

    let result

    try {

        result = await runApplyScript({
            filePath: relPath,
            exportName,
            edits,
        })

    } catch (subprocessError) {

        if (isSingleScalarSet(edits)) {

            try {

                const fallback = inProcessSingleScalar(originalCode, edits)

                return {
                    filePath: relPath,
                    entityId: entityId ?? (edits[0].path[0]),
                    originalCode,
                    proposedCode: fallback.proposedCode,
                    appliedOps: fallback.applied,
                    rejectedOps: [],
                    usedFallback: true,
                }

            } catch (fallbackError) {

                throw new Error(
                    `apply-edit subprocess failed (${subprocessError.message}) `
                    + `and in-process fallback failed (${fallbackError.message})`,
                )
            }
        }

        throw subprocessError

    }

    return {
        filePath: relPath,
        entityId: entityId ?? (Array.isArray(edits) && edits[0] && edits[0].path
            ? edits[0].path[0]
            : null),
        originalCode,
        proposedCode: result.proposedCode ?? originalCode,
        appliedOps: result.applied || [],
        rejectedOps: result.rejected || [],
        usedFallback: false,
    }
}

/**
 * buildCssProposal({ selector, prop, value, filePath? })
 */
export async function buildCssProposal({
    selector,
    prop,
    value,
    filePath = HEARTHWOOD_STYLE_FILES[0],
} = {}) {

    const originalCode = readFile(filePath)

    const result = await runApplyScript({
        filePath,
        edits: [{ selector, prop, op: "set", value }],
    })

    return {
        filePath,
        originalCode,
        proposedCode: result.proposedCode ?? originalCode,
        appliedOps: result.applied || [],
        rejectedOps: result.rejected || [],
        usedFallback: false,
    }
}

/**
 * buildWholeFileProposal({ filePath, proposedCode })
 * No parsing, no splicing - the caller supplied the entire new file.
 */
export function buildWholeFileProposal({ filePath, proposedCode } = {}) {

    if (!filePath) {

        throw new Error("buildWholeFileProposal: filePath is required")

    }

    let originalCode = ""

    try {

        originalCode = readFile(filePath)

    } catch {

        originalCode = ""

    }

    return {
        filePath,
        originalCode,
        proposedCode: String(proposedCode ?? ""),
        appliedOps: [{ path: [filePath], op: "wholeFile" }],
        rejectedOps: [],
        usedFallback: false,
    }
}

export default { buildProposal, buildCssProposal, buildWholeFileProposal, typeForFile }
