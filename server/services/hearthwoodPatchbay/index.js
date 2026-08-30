/**
 * Wood-Booster HQ
 * Boosterverse - Hearthwood Patchbay
 *
 * Barrel module. Phase 0 exposes only the foundations:
 *   - classifyRisk       (riskModel.js)  - risk tier + gate for a change
 *   - createAuditStore   (auditStore.js) - CRUD for the HearthwoodPatch model
 *   - path constants     (paths.js)      - data/engine/critical path maps
 *
 * Phase 1 adds the read/apply/snapshot/gate/orchestrator layer.
 */

export { classifyRisk } from "./riskModel.js"

export * from "./paths.js"

export { createAuditStore } from "./auditStore.js"

export {
    listEntities,
    getEntity,
    listStyleRules,
    getStyleRule,
} from "./entityReader.js"

export {
    buildProposal,
    buildCssProposal,
    buildWholeFileProposal,
    typeForFile,
} from "./editApplier.js"

export { unifiedDiff } from "./diffText.js"

export { planEdits } from "./nlEditPlanner.js"

export {
    awaitableGitGuardianBackup,
    writeWithBackup,
    revertFromBackup,
    commitToLiveBranch,
    commitRevertToLiveBranch,
} from "./snapshot.js"

export { runFastGate } from "./fastGate.js"

export {
    preview,
    apply,
    revert,
    stopPreviewFor,
} from "./applyPatch.js"
