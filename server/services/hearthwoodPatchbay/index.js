/**
 * Wood-Booster HQ
 * Boosterverse - Hearthwood Patchbay
 *
 * Barrel module. Phase 0 exposes only the foundations:
 *   - classifyRisk       (riskModel.js)  - risk tier + gate for a change
 *   - createAuditStore   (auditStore.js) - CRUD for the HearthwoodPatch model
 *   - path constants     (paths.js)      - data/engine/critical path maps
 *
 * Later phases add entityReader / editApplier / snapshot / fastGate /
 * applyPatch etc. and re-export them here.
 */

export { classifyRisk } from "./riskModel.js"

export * from "./paths.js"

export { createAuditStore } from "./auditStore.js"
