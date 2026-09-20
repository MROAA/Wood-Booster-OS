import UnifiedDiffView from "./UnifiedDiffView"
import { RISK_TONE } from "./patchStatusLabels"

/*
 * Review + confirm for a pending proposal - shared by NlChangeBox.jsx
 * and SheetView.jsx (see usePatchPreview.js). Purely presentational.
 *
 * Simplified from hearthwood-studio/PatchPreviewPanel.jsx: no
 * live/PR apply-mode toggle - Bloodmoor v1 only has "live" apply, and a
 * HIGH/CRITICAL-risk change (engine code, critical files) simply can't
 * be applied through this tool yet (see riskModel.js / applyPatch.js) -
 * it shows here as a disabled Apply button with the reason in the risk
 * chip's own tier.
 */
function PatchPreviewPanel({ result, onDiscard, onApply, applying }) {
  if (!result) {
    return null
  }

  const hasPlannedEdits = Array.isArray(result.plannedEdits) && result.plannedEdits.length > 0
  const hasRejectedOps = Array.isArray(result.rejectedOps) && result.rejectedOps.length > 0
  const tier = result.risk?.tier
  const canApply = tier === "LOW" || tier === "MEDIUM"

  return (
    <div className="space-y-3 rounded-xl border border-[var(--wood-border)] bg-[var(--wood-panel)] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${RISK_TONE[tier] || ""}`}>
          {tier || "?"}
        </span>

        {result.model && <span className="text-xs text-[var(--wood-muted)]">model: {result.model}</span>}

        {
          !canApply && (
            <span className="text-xs text-red-400">
              can't be auto-applied - ask Claude to make this change directly
            </span>
          )
        }
      </div>

      {
        result.risk?.reasons?.length > 0 && (
          <ul className="list-disc space-y-0.5 pl-4 text-xs text-[var(--wood-muted)]">
            {result.risk.reasons.map((reason, index) => <li key={index}>{reason}</li>)}
          </ul>
        )
      }

      {
        hasPlannedEdits && (
          <div className="space-y-1">
            <div className="text-xs font-semibold text-[var(--wood-text)]">Planned changes:</div>
            <ul className="list-disc space-y-0.5 pl-4 text-xs text-[var(--wood-text)]">
              {
                result.plannedEdits.map((edit, index) => (
                  <li key={index} className="font-mono">
                    {Array.isArray(edit.path) ? edit.path.join(" → ") : "?"}: {String(edit.value)}
                  </li>
                ))
              }
            </ul>
          </div>
        )
      }

      {
        hasRejectedOps && (
          <div className="rounded-lg border border-amber-900 bg-amber-950/20 p-2 text-xs text-amber-300">
            ⚠ These couldn't be done automatically:
            <ul className="mt-1 list-disc pl-4">
              {
                result.rejectedOps.map((rejected, index) => (
                  <li key={index}>
                    {Array.isArray(rejected.path) ? rejected.path.join(" → ") : ""}
                    {rejected.reason ? ` — ${rejected.reason}` : ""}
                  </li>
                ))
              }
            </ul>
          </div>
        )
      }

      <UnifiedDiffView diff={result.diff} />

      <div className="flex gap-2">
        <button
          type="button"
          disabled={applying}
          onClick={onDiscard}
          className="
            rounded-full border border-[var(--wood-border)] px-4 py-1.5 text-sm
            text-[var(--wood-muted)] transition-opacity disabled:opacity-30
            hover:text-[var(--wood-text)]
          "
        >
          Discard
        </button>

        <button
          type="button"
          disabled={!canApply || applying}
          onClick={onApply}
          className="
            rounded-full border border-emerald-700 bg-emerald-900/40 px-4 py-1.5
            text-sm font-medium text-emerald-300 transition-opacity
            disabled:cursor-not-allowed disabled:opacity-30
          "
        >
          {applying ? "Applying..." : "Confirm & apply"}
        </button>
      </div>
    </div>
  )
}

export default PatchPreviewPanel
