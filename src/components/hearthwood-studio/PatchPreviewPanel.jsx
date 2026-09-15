import ApplyModeToggle from "./ApplyModeToggle"
import UnifiedDiffView from "./UnifiedDiffView"
import { RISK_TONE } from "./patchStatusLabels"

/*
 * Ehdotuksen tarkistus + vahvistus - jaettu NlChangeBox.jsx:n ja
 * EntityFieldEditor.jsx:n kesken (ks. usePatchPreview.js). Puhtaasti
 * esittävä: kaikki tila ja API-kutsut omistaa kutsuja.
 */
function PatchPreviewPanel({ result, applyMode, onApplyModeChange, onDiscard, onApply, applying }) {
  if (!result) {
    return null
  }

  const hasPlannedEdits = Array.isArray(result.plannedEdits) && result.plannedEdits.length > 0
  const hasRejectedOps = Array.isArray(result.rejectedOps) && result.rejectedOps.length > 0
  const canApply = result.risk?.allowedModes?.includes("live") && applyMode === "live"

  return (
    <div className="space-y-3 rounded-xl border border-[var(--wood-border)] bg-[var(--wood-panel)] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${RISK_TONE[result.risk?.tier] || ""}`}>
          {result.risk?.tier || "?"}
        </span>

        {
          result.model && (
            <span className="text-xs text-[var(--wood-muted)]">malli: {result.model}</span>
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
            <div className="text-xs font-semibold text-[var(--wood-text)]">Suunnitellut muutokset:</div>
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
            ⚠ Näitä ei voitu tehdä automaattisesti - käytä koko tiedoston muokkausta tai Claudea:
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

      <ApplyModeToggle risk={result.risk} value={applyMode} onChange={onApplyModeChange} />

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
          Hylkää
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
          {applying ? "Sovelletaan..." : "Vahvista ja sovella"}
        </button>
      </div>
    </div>
  )
}

export default PatchPreviewPanel
