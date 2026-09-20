/*
 * Tila-selitteet HearthwoodPatch-riveille. Eri sanasto kuin
 * devstudio/statusLabels.js (CodeChangeDraft), koska Patchbaylla on
 * oma tilakone (previewing -> applied -> qa_running -> qa_passed /
 * rolled_back, ks. applyPatch.js).
 */

export const PATCH_STATUS_LABELS = {
  draft: "Draft",
  previewing: "Previewing",
  applied: "Applied",
  qa_running: "Checking...",
  qa_passed: "Check passed",
  qa_failed: "Check failed",
  rolled_back: "Rolled back automatically",
  reverted: "Reverted",
  pr_open: "Pull Request opened",
  pr_merged: "Merged",
  failed: "Failed",
}

export const PATCH_STATUS_TONE = {
  draft: "text-[var(--wood-muted)]",
  previewing: "text-amber-400",
  applied: "text-emerald-400",
  qa_running: "text-amber-400",
  qa_passed: "text-emerald-400",
  qa_failed: "text-red-400",
  rolled_back: "text-red-400",
  reverted: "text-[var(--wood-muted)]",
  pr_open: "text-amber-400",
  pr_merged: "text-emerald-400",
  failed: "text-red-400",
}

export const RISK_TONE = {
  LOW: "border-emerald-800 text-emerald-400",
  MEDIUM: "border-amber-800 text-amber-400",
  HIGH: "border-red-900 text-red-400",
  CRITICAL: "border-red-900 bg-red-950/40 text-red-300",
}

export const REVERTABLE_STATUSES = new Set(["applied", "qa_passed", "qa_failed"])
