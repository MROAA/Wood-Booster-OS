/*
 * Status labels for BloodmoorPatch rows. Ported from
 * hearthwood-studio/patchStatusLabels.js - same state machine shape
 * (previewing -> applied -> qa_passed / rolled_back, see
 * applyPatch.js), no "pr_open"/"pr_merged" states since Bloodmoor v1
 * has no PR mode.
 */

export const PATCH_STATUS_LABELS = {
  draft: "Draft",
  previewing: "Previewing",
  applied: "Applied",
  qa_passed: "Checks passed",
  qa_failed: "Checks failed",
  rolled_back: "Auto-rolled back",
  reverted: "Reverted",
}

export const PATCH_STATUS_TONE = {
  draft: "text-[var(--wood-muted)]",
  previewing: "text-amber-400",
  applied: "text-emerald-400",
  qa_passed: "text-emerald-400",
  qa_failed: "text-red-400",
  rolled_back: "text-red-400",
  reverted: "text-[var(--wood-muted)]",
}

export const RISK_TONE = {
  LOW: "border-emerald-800 text-emerald-400",
  MEDIUM: "border-amber-800 text-amber-400",
  HIGH: "border-red-900 text-red-400",
  CRITICAL: "border-red-900 bg-red-950/40 text-red-300",
}

export const REVERTABLE_STATUSES = new Set(["applied", "qa_passed", "qa_failed"])
