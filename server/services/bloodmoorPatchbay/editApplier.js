/**
 * Wood-Booster HQ
 * Boosterverse - Bloodmoor Patchbay
 *
 * editApplier.js
 *
 * Turns a set of edit ops into a concrete proposed file text - WITHOUT
 * writing anything. The real write is snapshot.js's job. Runs
 * `tools/patchbay/apply-edit.mjs` (inside Bloodmoor's own repo, cwd set
 * there) to do the actual "AST to locate, string-splice to edit" work.
 *
 *   buildProposal({ type, entityId, edits, filePath? })
 *   buildWholeFileProposal({ filePath, proposedCode })  -> escape hatch
 *
 * Every result: { filePath, originalCode, proposedCode, appliedOps,
 * rejectedOps }.
 */

import path from "node:path"
import fs from "node:fs"
import { execFile } from "node:child_process"
import { promisify } from "node:util"

import { PROJECT_ROOT, ENTITY_TYPES, dataFilePathFor } from "./paths.js"

const execFileAsync = promisify(execFile)

const APPLY_SCRIPT = path.join(PROJECT_ROOT, "tools", "patchbay", "apply-edit.mjs")

const TIMEOUT_MS = 15000

const MAX_BUFFER_BYTES = 8_000_000

function readFile(relPath) {

    return fs.readFileSync(path.join(PROJECT_ROOT, relPath), "utf8")

}

/** entity type for a data file basename, or null. */
export function typeForFile(relPath) {

    const base = path.basename(String(relPath || ""))

    for (const [type, entry] of Object.entries(ENTITY_TYPES)) {

        if (entry.file.endsWith(base)) {

            return type

        }
    }

    return null

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

/**
 * buildProposal({ type, entityId, edits, filePath? })
 * `entityId` is informational - the ops' `path` already carries it.
 */
export async function buildProposal({ type, entityId, edits, filePath } = {}) {

    const entry = ENTITY_TYPES[type]

    const relPath = filePath || dataFilePathFor(type)

    if (!relPath) {

        throw new Error(`buildProposal: unknown entity type "${type}"`)

    }

    const originalCode = readFile(relPath)

    const result = await runApplyScript({
        filePath: relPath,
        exportName: entry ? entry.exportName : undefined,
        kind: entry ? entry.kind : undefined,
        edits,
    })

    return {
        filePath: relPath,
        entityId: entityId ?? (Array.isArray(edits) && edits[0] && edits[0].path
            ? edits[0].path[0]
            : null),
        originalCode,
        proposedCode: result.proposedCode ?? originalCode,
        appliedOps: result.applied || [],
        rejectedOps: result.rejected || [],
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
    }
}

export default { buildProposal, buildWholeFileProposal, typeForFile }
