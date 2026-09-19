/**
 * Wood-Booster HQ
 * Boosterverse - Bloodmoor Patchbay
 *
 * applyPatch.js
 *
 * The orchestrator. Ties the pure pieces (editApplier, riskModel,
 * diffText, nlEditPlanner) to the effectful ones (snapshot, fastGate,
 * auditStore) into the three calls the route exposes:
 *
 *   preview({ prisma, body })   - build + classify + diff + audit row
 *   apply({ prisma, id, confirm, typedYes })
 *                                - gate -> per-file write+.bak ->
 *                                  live-branch commit -> fast gate ->
 *                                  pass: qa_passed / fail: auto-rollback
 *   revert({ prisma, id })      - restore .bak(s) + revert commit
 *
 * Differences from Hearthwood Patchbay's applyPatch.js: no Spacemonkey
 * toolBus (snapshot.js writes directly - editing a data file doesn't
 * need the AI runtime up), no live-preview server (out of scope for
 * this pass - see the plan), no Git Guardian call, and HIGH/CRITICAL
 * risk changes are rejected outright rather than routed to a PR mode
 * (Bloodmoor has no GitHub remote / PR pipeline set up yet - those
 * changes stay a normal "ask Claude" task).
 */

import { classifyRisk } from "./riskModel.js"
import { createAuditStore } from "./auditStore.js"
import { dataFilePathFor } from "./paths.js"
import { buildProposal, buildWholeFileProposal, typeForFile } from "./editApplier.js"
import { unifiedDiff } from "./diffText.js"
import { planEdits } from "./nlEditPlanner.js"
import {
    writeWithBackup,
    revertFromBackup,
    commitToLiveBranch,
    commitRevertToLiveBranch,
} from "./snapshot.js"
import { runFastGate } from "./fastGate.js"

const REVERTABLE_STATUSES = new Set(["applied", "qa_passed", "qa_failed"])

function httpError(message, status, extra = {}) {

    const error = new Error(message)

    error.httpStatus = status

    Object.assign(error, extra)

    return error

}

/* ------------------------------------------------------------------ *
 * proposal resolution
 * ------------------------------------------------------------------ */

async function resolveProposal(body) {

    const { type, entityId, edits, instruction, wholeFile } = body || {}

    if (wholeFile && wholeFile.filePath) {

        const proposal = buildWholeFileProposal({
            filePath: wholeFile.filePath,
            proposedCode: wholeFile.proposedCode,
        })

        return {
            proposal,
            editSpec: { mode: "wholeFile", filePath: wholeFile.filePath, proposedCode: wholeFile.proposedCode },
            targetFiles: [wholeFile.filePath],
            summary: `whole-file edit: ${wholeFile.filePath}`,
        }
    }

    if (instruction && type && entityId) {

        const plan = await planEdits({ type, entityId, instruction })

        if (plan.edits.length === 0) {

            const relPath = dataFilePathFor(type)

            const proposal = await buildProposal({ type, entityId, edits: [] })

            return {
                proposal,
                editSpec: { ops: [] },
                targetFiles: [relPath],
                summary: instruction,
                plannedEdits: [],
                rejectedOps: plan.rejected,
                model: plan.model,
            }
        }

        const proposal = await buildProposal({ type, entityId, edits: plan.edits })

        return {
            proposal,
            editSpec: { ops: plan.edits },
            targetFiles: [proposal.filePath],
            summary: instruction,
            plannedEdits: plan.edits,
            rejectedOps: [...plan.rejected, ...(proposal.rejectedOps || [])],
            model: plan.model,
        }
    }

    if (Array.isArray(edits) && edits.length > 0) {

        const relPath = type ? dataFilePathFor(type) : null

        const proposal = await buildProposal({ type, entityId, edits, filePath: relPath || undefined })

        return {
            proposal,
            editSpec: { ops: edits },
            targetFiles: [proposal.filePath],
            summary:
                `${type || typeForFile(proposal.filePath) || "data"}`
                + (entityId ? `/${entityId}` : "")
                + ": "
                + edits.map(e => (Array.isArray(e.path) ? e.path.join(".") : "?")).join(", "),
            rejectedOps: proposal.rejectedOps || [],
        }
    }

    throw httpError("preview requires one of { edits }, { instruction }, { wholeFile }", 400)

}

/* ------------------------------------------------------------------ *
 * preview
 * ------------------------------------------------------------------ */

export async function preview({ prisma, body }) {

    const store = createAuditStore(prisma)

    const resolved = await resolveProposal(body || {})

    const { proposal, editSpec, targetFiles, summary } = resolved

    const risk = classifyRisk({ targetFiles, editSpec })

    const diff = unifiedDiff(proposal.filePath, proposal.originalCode, proposal.proposedCode)

    const row = await store.create({
        summary,
        applyMode: "live",
        risk: risk.tier,
        status: "previewing",
        targetFiles,
        editSpec,
        diff: diff || null,
        model: resolved.model || null,
        createdBy: "bloodmoor-patchbay",
    })

    return {
        patchId: row.id,
        risk,
        diff,
        targetFiles,
        plannedEdits: resolved.plannedEdits,
        rejectedOps: resolved.rejectedOps,
        model: resolved.model,
    }
}

/* ------------------------------------------------------------------ *
 * apply
 * ------------------------------------------------------------------ */

async function rebuildProposal(row) {

    const spec = row.editSpec || {}

    if (spec.mode === "wholeFile") {

        return buildWholeFileProposal({ filePath: spec.filePath || row.targetFiles[0], proposedCode: spec.proposedCode })

    }

    const ops = Array.isArray(spec.ops) ? spec.ops : []

    const relPath = row.targetFiles[0]

    return buildProposal({ type: typeForFile(relPath), filePath: relPath, edits: ops })

}

export async function apply({ prisma, id, confirm, typedYes }) {

    const store = createAuditStore(prisma)

    const row = await store.get(id)

    if (!row) {

        throw httpError("patch not found", 404)

    }

    if (!["previewing", "draft"].includes(row.status)) {

        throw httpError(`patch is already in status "${row.status}" - cannot re-apply`, 409)

    }

    const risk = classifyRisk({ targetFiles: row.targetFiles, editSpec: row.editSpec })

    if (risk.tier === "HIGH" || risk.tier === "CRITICAL") {

        throw httpError(
            "this change touches game engine code or a critical file and can't be auto-applied - "
            + "ask Claude to make this code change directly instead",
            409,
            { code: "not_live_appliable", riskTier: risk.tier },
        )
    }

    if (risk.tier === "MEDIUM" && confirm !== true) {

        throw httpError(
            "a MEDIUM-risk change needs explicit confirmation (confirm:true)",
            409,
            { code: "confirm_required" },
        )
    }

    if (risk.requiresTypeYes && typedYes !== "YES") {

        throw httpError("type YES to confirm", 409, { code: "type_yes_required" })

    }

    const proposal = await rebuildProposal(row)

    if (proposal.proposedCode === proposal.originalCode) {

        throw httpError("nothing to apply (proposal === current file)", 409, { code: "no_changes" })

    }

    const diff = unifiedDiff(proposal.filePath, proposal.originalCode, proposal.proposedCode)

    const fileWrites = [{
        filePath: proposal.filePath,
        proposedCode: proposal.proposedCode,
        liveContent: proposal.originalCode,
    }]

    const backupPaths = []

    for (const write of fileWrites) {

        const result = await writeWithBackup(write)

        backupPaths.push(result.backupPath)

    }

    let liveCommit = null

    try {

        liveCommit = await commitToLiveBranch({ files: row.targetFiles, summary: row.summary, code: row.code })

    } catch (commitError) {

        console.warn("[bloodmoor-patchbay] live-branch commit failed (non-fatal):", commitError.message)

    }

    await store.update(id, { status: "applied", diff, backupPaths, liveCommit })

    const qa = await runFastGate({ changedFiles: row.targetFiles })

    const passed = qa.lint.ok && qa.build.ok

    if (passed) {

        return store.update(id, {
            status: "qa_passed",
            qaResult: { lint: qa.lint, build: qa.build },
            qaFinishedAt: new Date(),
        })
    }

    const rollbackErrors = []

    for (let i = fileWrites.length - 1; i >= 0; i -= 1) {

        try {

            await revertFromBackup({
                filePath: fileWrites[i].filePath,
                proposedCode: fileWrites[i].proposedCode,
                backupPath: backupPaths[i],
            })

        } catch (revertError) {

            rollbackErrors.push(revertError.message)

        }
    }

    try {

        await commitRevertToLiveBranch({ files: row.targetFiles, summary: row.summary, code: row.code })

    } catch (commitError) {

        rollbackErrors.push(`revert commit: ${commitError.message}`)

    }

    return store.update(id, {
        status: "rolled_back",
        qaResult: { lint: qa.lint, build: qa.build, rollbackErrors },
        qaFinishedAt: new Date(),
    })
}

/* ------------------------------------------------------------------ *
 * revert
 * ------------------------------------------------------------------ */

export async function revert({ prisma, id }) {

    const store = createAuditStore(prisma)

    const row = await store.get(id)

    if (!row) {

        throw httpError("patch not found", 404)

    }

    if (!REVERTABLE_STATUSES.has(row.status)) {

        throw httpError(`patch cannot be reverted in status "${row.status}"`, 409)

    }

    const proposal = await rebuildProposal(row)

    const backupPaths = Array.isArray(row.backupPaths) ? row.backupPaths : []

    const files = row.targetFiles || []

    for (let i = 0; i < files.length; i += 1) {

        await revertFromBackup({
            filePath: files[i],
            proposedCode: proposal.proposedCode,
            backupPath: backupPaths[i] ?? null,
        })

    }

    let revertCommit = null

    try {

        revertCommit = await commitRevertToLiveBranch({ files, summary: row.summary, code: row.code })

    } catch (commitError) {

        console.warn("[bloodmoor-patchbay] revert commit failed (non-fatal):", commitError.message)

    }

    const updated = await store.update(id, { status: "reverted", liveCommit: revertCommit || row.liveCommit })

    return { status: "reverted", files, row: updated }

}

export default { preview, apply, revert }
