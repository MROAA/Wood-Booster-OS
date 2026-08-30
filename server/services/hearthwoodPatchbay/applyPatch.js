/**
 * Wood-Booster HQ
 * Boosterverse - Hearthwood Patchbay
 *
 * applyPatch.js
 *
 * The orchestrator. Ties the pure pieces (editApplier, riskModel,
 * diffText, nlEditPlanner) to the effectful ones (snapshot, fastGate,
 * previewServer, auditStore, the Spacemonkey toolBus) into the two
 * calls the route exposes:
 *
 *   preview({ prisma, body })            - build + classify + diff +
 *                                          (MEDIUM) live preview + audit row
 *   apply({ prisma, id, applyMode, confirm, typedYes })
 *                                        - gate -> GG backup -> per-file
 *                                          write+.bak -> live-branch commit
 *                                          -> fast gate -> pass: qa_passed
 *                                          / fail: auto-rollback +
 *                                          rolled_back
 *   revert({ prisma, id })               - restore .bak(s) + revert commit
 *   stopPreviewFor(id)                   - stop the shared preview server
 *
 * Phase 1 stops at the fast gate; the async smoke suite is Phase 2.
 */

import { classifyRisk } from "./riskModel.js"
import { createAuditStore } from "./auditStore.js"
import { dataFilePathFor, HEARTHWOOD_STYLE_FILES } from "./paths.js"
import {
    buildProposal,
    buildCssProposal,
    buildWholeFileProposal,
    typeForFile,
} from "./editApplier.js"
import { unifiedDiff } from "./diffText.js"
import { planEdits } from "./nlEditPlanner.js"
import {
    awaitableGitGuardianBackup,
    writeWithBackup,
    revertFromBackup,
    commitToLiveBranch,
    commitRevertToLiveBranch,
} from "./snapshot.js"
import { runFastGate } from "./fastGate.js"
import {
    startPreview,
    stopPreview,
} from "../devStudio/previewServer.js"
import {
    getSpacemonkeyToolBus,
} from "../spacemonkey/spacemonkeyRuntimeBootstrap.js"
import fs from "node:fs"
import path from "node:path"
import { PROJECT_ROOT } from "./paths.js"

const PREVIEW_SET_ID = "hearthwood-patchbay"

const REVERTABLE_STATUSES = new Set(["applied", "qa_passed", "qa_failed"])

function httpError(message, status, extra = {}) {

    const error = new Error(message)

    error.httpStatus = status

    Object.assign(error, extra)

    return error
}

function readLive(relPath) {

    return fs.readFileSync(path.join(PROJECT_ROOT, relPath), "utf8")
}

/* ------------------------------------------------------------------ *
 * proposal resolution
 * ------------------------------------------------------------------ */

/**
 * Resolve a request body into a concrete proposal + metadata.
 * Returns { proposal, editSpec, targetFiles, summary, plannedEdits,
 *           rejectedOps, model }.
 */
async function resolveProposal(body) {

    const { type, entityId, edits, instruction, wholeFile } = body || {}

    // ---- whole-file escape hatch ----
    if (wholeFile && wholeFile.filePath) {

        const proposal = buildWholeFileProposal({
            filePath: wholeFile.filePath,
            proposedCode: wholeFile.proposedCode,
        })

        return {
            proposal,
            editSpec: {
                mode: "wholeFile",
                filePath: wholeFile.filePath,
                proposedCode: wholeFile.proposedCode,
            },
            targetFiles: [wholeFile.filePath],
            summary: `koko tiedoston muokkaus: ${wholeFile.filePath}`,
        }
    }

    // ---- natural-language instruction ----
    if (instruction && type && entityId) {

        const plan = await planEdits({ type, entityId, instruction })

        if (plan.edits.length === 0) {

            const relPath = dataFilePathFor(type)

            const original = readLive(relPath)

            return {
                proposal: {
                    filePath: relPath,
                    originalCode: original,
                    proposedCode: original,
                    appliedOps: [],
                    rejectedOps: plan.rejected,
                },
                editSpec: { ops: [] },
                targetFiles: [relPath],
                summary: instruction,
                plannedEdits: [],
                rejectedOps: plan.rejected,
                model: plan.model,
            }
        }

        const proposal = await buildProposal({
            type,
            entityId,
            edits: plan.edits,
        })

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

    // ---- explicit edit ops ----
    if (Array.isArray(edits) && edits.length > 0) {

        const isCss = edits.some(e => e && e.selector && e.prop)

        if (isCss) {

            const first = edits[0]

            const proposal = await buildCssProposal({
                selector: first.selector,
                prop: first.prop,
                value: first.value,
                filePath: first.filePath || HEARTHWOOD_STYLE_FILES[0],
            })

            return {
                proposal,
                editSpec: { ops: edits },
                targetFiles: [proposal.filePath],
                summary:
                    `CSS: ${first.selector} { ${first.prop} }`,
                rejectedOps: proposal.rejectedOps || [],
            }
        }

        const relPath = type ? dataFilePathFor(type) : null

        const proposal = await buildProposal({
            type,
            entityId,
            edits,
            filePath: relPath || undefined,
        })

        return {
            proposal,
            editSpec: { ops: edits },
            targetFiles: [proposal.filePath],
            summary:
                `${type || typeForFile(proposal.filePath) || "data"}`
                + (entityId ? `/${entityId}` : "")
                + ": "
                + edits
                    .map(e => (Array.isArray(e.path) ? e.path.join(".") : "?"))
                    .join(", "),
            rejectedOps: proposal.rejectedOps || [],
        }
    }

    throw httpError(
        "preview vaatii joko { edits }, { instruction } tai { wholeFile }",
        400,
    )
}

/* ------------------------------------------------------------------ *
 * preview
 * ------------------------------------------------------------------ */

export async function preview({ prisma, body }) {

    const store = createAuditStore(prisma)

    const resolved = await resolveProposal(body || {})

    const { proposal, editSpec, targetFiles, summary } = resolved

    const risk = classifyRisk({ targetFiles, editSpec })

    const diff = unifiedDiff(
        proposal.filePath,
        proposal.originalCode,
        proposal.proposedCode,
    )

    let previewUrl = null

    if (risk.tier === "MEDIUM" && diff) {

        try {

            const started = await startPreview({
                setId: PREVIEW_SET_ID,
                files: [{
                    filePath: proposal.filePath,
                    action: "modify",
                    proposedCode: proposal.proposedCode,
                }],
            })

            previewUrl = started.url || null

        } catch (previewError) {

            console.warn(
                "[hearthwood-patchbay] live preview failed to start:",
                previewError.message,
            )

            previewUrl = null
        }
    }

    const row = await store.create({
        summary,
        applyMode: body && body.applyMode === "pr" ? "pr" : "live",
        risk: risk.tier,
        status: "previewing",
        targetFiles,
        editSpec,
        diff: diff || null,
        model: resolved.model || null,
        createdBy: "patchbay",
    })

    return {
        patchId: row.id,
        risk,
        diff,
        targetFiles,
        previewUrl,
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

        return buildWholeFileProposal({
            filePath: spec.filePath || row.targetFiles[0],
            proposedCode: spec.proposedCode,
        })
    }

    const ops = Array.isArray(spec.ops) ? spec.ops : []

    if (ops.some(o => o && o.selector && o.prop)) {

        const first = ops[0]

        return buildCssProposal({
            selector: first.selector,
            prop: first.prop,
            value: first.value,
            filePath: first.filePath || row.targetFiles[0],
        })
    }

    const relPath = row.targetFiles[0]

    return buildProposal({
        type: typeForFile(relPath),
        filePath: relPath,
        edits: ops,
    })
}

export async function apply({ prisma, id, applyMode = "live", confirm, typedYes }) {

    const store = createAuditStore(prisma)

    const row = await store.get(id)

    if (!row) {

        throw httpError("patchia ei löytynyt", 404)

    }

    if (!["previewing", "draft"].includes(row.status)) {

        throw httpError(
            `patch on jo tilassa "${row.status}" - ei voida soveltaa uudelleen`,
            409,
        )
    }

    const risk = classifyRisk({
        targetFiles: row.targetFiles,
        editSpec: row.editSpec,
    })

    // ---- gate ----
    if (applyMode !== "live") {

        throw httpError("vain applyMode:\"live\" on tuettu vaiheessa 1", 400)

    }

    if (risk.tier === "HIGH" || risk.tier === "CRITICAL") {

        throw httpError("tämä muutos vaatii PR-tilan", 409, {
            code: "requires_pr",
            allowedModes: ["pr"],
        })
    }

    if (risk.tier === "MEDIUM" && confirm !== true) {

        throw httpError(
            "MEDIUM-riskin muutos vaatii nimenomaisen vahvistuksen (confirm:true)",
            409,
            { code: "confirm_required", allowedModes: risk.allowedModes },
        )
    }

    if (risk.requiresTypeYes && typedYes !== "YES") {

        throw httpError("kirjoita YES vahvistaaksesi", 409, {
            code: "type_yes_required",
        })
    }

    const toolBus = getSpacemonkeyToolBus()

    if (!toolBus) {

        throw httpError("Spacemonkey-moottorit eivät ole vielä käynnistyneet", 503)

    }

    const proposal = await rebuildProposal(row)

    if (proposal.proposedCode === proposal.originalCode) {

        throw httpError("ei sovellettavia muutoksia (ehdotus === nykyinen tiedosto)", 409, {
            code: "no_changes",
        })
    }

    const diff = unifiedDiff(
        proposal.filePath,
        proposal.originalCode,
        proposal.proposedCode,
    )

    // Phase 1 is always single-file; keep the loop shape for later.
    const fileWrites = [{
        filePath: proposal.filePath,
        proposedCode: proposal.proposedCode,
        liveContent: proposal.originalCode,
    }]

    // 1. Git Guardian whole-tree checkpoint (best-effort).
    const gg = await awaitableGitGuardianBackup()

    // 2. Per-file .bak + write.
    const backupPaths = []

    for (const write of fileWrites) {

        const result = await writeWithBackup({
            toolBus,
            filePath: write.filePath,
            proposedCode: write.proposedCode,
            liveContent: write.liveContent,
        })

        backupPaths.push(result.backupPath)
    }

    // 3. Commit to hearthwood-patchbay/live (HEAD untouched).
    let liveCommit = null

    try {

        liveCommit = await commitToLiveBranch({
            files: row.targetFiles,
            summary: row.summary,
            code: row.code,
        })

    } catch (commitError) {

        console.warn(
            "[hearthwood-patchbay] live-branch commit failed (non-fatal):",
            commitError.message,
        )
    }

    await store.update(id, {
        status: "applied",
        diff,
        backupPaths,
        gitGuardianRef: gg ? gg.ref : null,
        liveCommit,
    })

    // 4. Fast gate.
    const qa = await runFastGate({ changedFiles: row.targetFiles })

    const passed = qa.lint.ok && qa.build.ok

    if (passed) {

        return store.update(id, {
            status: "qa_passed",
            qaResult: { lint: qa.lint, build: qa.build },
            qaFinishedAt: new Date(),
        })
    }

    // 5. Auto-rollback.
    const rollbackErrors = []

    for (let i = fileWrites.length - 1; i >= 0; i -= 1) {

        try {

            await revertFromBackup({
                toolBus,
                filePath: fileWrites[i].filePath,
                proposedCode: fileWrites[i].proposedCode,
                backupPath: backupPaths[i],
            })

        } catch (revertError) {

            rollbackErrors.push(revertError.message)

        }
    }

    try {

        await commitRevertToLiveBranch({
            files: row.targetFiles,
            summary: row.summary,
            code: row.code,
        })

    } catch (commitError) {

        rollbackErrors.push(`revert commit: ${commitError.message}`)

    }

    return store.update(id, {
        status: "rolled_back",
        qaResult: {
            lint: qa.lint,
            build: qa.build,
            rollbackErrors,
        },
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

        throw httpError("patchia ei löytynyt", 404)

    }

    if (!REVERTABLE_STATUSES.has(row.status)) {

        throw httpError(
            `patchia ei voi peruuttaa tilassa "${row.status}"`,
            409,
        )
    }

    const toolBus = getSpacemonkeyToolBus()

    if (!toolBus) {

        throw httpError("Spacemonkey-moottorit eivät ole vielä käynnistyneet", 503)

    }

    const proposal = await rebuildProposal(row)

    const backupPaths = Array.isArray(row.backupPaths) ? row.backupPaths : []

    const files = row.targetFiles || []

    for (let i = 0; i < files.length; i += 1) {

        await revertFromBackup({
            toolBus,
            filePath: files[i],
            proposedCode: proposal.proposedCode,
            backupPath: backupPaths[i] ?? null,
        })
    }

    let revertCommit = null

    try {

        revertCommit = await commitRevertToLiveBranch({
            files,
            summary: row.summary,
            code: row.code,
        })

    } catch (commitError) {

        console.warn(
            "[hearthwood-patchbay] revert commit failed (non-fatal):",
            commitError.message,
        )
    }

    const updated = await store.update(id, {
        status: "reverted",
        liveCommit: revertCommit || row.liveCommit,
    })

    return { status: "reverted", files, row: updated }
}

/* ------------------------------------------------------------------ *
 * preview lifecycle
 * ------------------------------------------------------------------ */

export async function stopPreviewFor() {

    return stopPreview(PREVIEW_SET_ID)
}

export default { preview, apply, revert, stopPreviewFor }
