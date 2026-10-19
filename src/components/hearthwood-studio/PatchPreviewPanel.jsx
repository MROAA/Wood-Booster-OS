import { useState } from "react"

import ApplyModeToggle from "./ApplyModeToggle"
import UnifiedDiffView from "./UnifiedDiffView"
import { RISK_TONE } from "./patchStatusLabels"
import { plainChanges, plainWhere, SAFETY_WORDS } from "./plainWords"

/*
 * Ehdotuksen tarkistus + vahvistus - jaettu kaikkien Studion editorien
 * kesken (ks. usePatchPreview.js). Puhtaasti esittävä.
 *
 * Marc, 2026-10-19: "en ole kovin hyvä IT-juttujen kanssa". The default
 * view is plain: what changes (before -> after in words), one calm line
 * about safety, and two buttons. Risk tier, model, reasons, the code diff
 * and the Live/PR switch moved under "Technical details" (closed).
 */
function PatchPreviewPanel({ result, applyMode, onApplyModeChange, onDiscard, onApply, applying }) {
  const [showTech, setShowTech] = useState(false)

  if (!result) {
    return null
  }

  const planned = Array.isArray(result.plannedEdits) ? result.plannedEdits : []
  const rejected = Array.isArray(result.rejectedOps) ? result.rejectedOps : []
  const pairs = plainChanges(result.diff)
  const liveAllowed = result.risk?.allowedModes?.includes("live")
  const canApply = liveAllowed && applyMode === "live"
  const tier = result.risk?.tier

  return (
    <div className="space-y-3 rounded-xl border border-[var(--wood-accent)] bg-[var(--wood-panel)] p-4" data-testid="patch-review">
      <div className="text-sm font-semibold text-[var(--wood-text)]">Check your change before it goes into the game</div>

      {
        pairs.length > 0 ? (
          <div className="space-y-2" data-testid="patch-review-changes">
            {
              pairs.map((pair, index) => (
                <div key={index} className="grid gap-1 rounded-lg border border-[var(--wood-border)] bg-[var(--wood-bg)] p-2 text-xs">
                  {planned[index] && <div className="text-[10px] uppercase tracking-wide text-[var(--wood-muted)]">{plainWhere(planned[index].path)}</div>}
                  {pair.before && <div className="text-[var(--wood-muted)] line-through decoration-[var(--wood-border)]">{pair.before}</div>}
                  <div className="text-[var(--wood-text)]">{pair.after || <span className="italic text-[var(--wood-muted)]">(removed)</span>}</div>
                </div>
              ))
            }
            {planned.length > pairs.length && <div className="text-[11px] text-[var(--wood-muted)]">…and {planned.length - pairs.length} more.</div>}
          </div>
        ) : planned.length > 0 ? (
          <ul className="space-y-1 text-xs text-[var(--wood-text)]" data-testid="patch-review-changes">
            {planned.map((edit, index) => <li key={index}>{plainWhere(edit.path)}: <b>{String(edit.value)}</b></li>)}
          </ul>
        ) : (
          <div className="text-xs text-[var(--wood-muted)]">Nothing would change.</div>
        )
      }

      {
        rejected.length > 0 && (
          <div className="rounded-lg border border-amber-900 bg-amber-950/20 p-2 text-xs text-amber-300" data-testid="patch-review-rejected">
            Some of this couldn't be done here:
            <ul className="mt-1 list-disc pl-4">
              {rejected.map((item, index) => <li key={index}>{plainWhere(item.path)}{item.reason ? ` - ${item.reason}` : ""}</li>)}
            </ul>
          </div>
        )
      }

      <div className="text-xs text-[var(--wood-muted)]" data-testid="patch-review-safety">{SAFETY_WORDS[tier] || SAFETY_WORDS.MEDIUM}</div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!canApply || applying}
          onClick={onApply}
          data-testid="patch-review-apply"
          className="rounded-full border border-[var(--wood-accent)] bg-[var(--wood-accent)] px-5 py-1.5 text-sm font-medium text-[#17120c] transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
        >
          {applying ? "Putting it in..." : "Put it in the game"}
        </button>

        <button
          type="button"
          disabled={applying}
          onClick={onDiscard}
          data-testid="patch-review-discard"
          className="rounded-full border border-[var(--wood-border)] px-4 py-1.5 text-sm text-[var(--wood-muted)] transition-opacity hover:text-[var(--wood-text)] disabled:opacity-30"
        >
          Don't change
        </button>
      </div>

      <div>
        <button type="button" onClick={() => setShowTech(open => !open)} className="text-[11px] text-[var(--wood-muted)] underline decoration-dotted hover:text-[var(--wood-text)]" data-testid="patch-review-tech-toggle">
          {showTech ? "Hide technical details" : "Technical details"}
        </button>
      </div>

      {
        showTech && (
          <div className="space-y-3 rounded-lg border border-dashed border-[var(--wood-border)] p-3" data-testid="patch-review-tech">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${RISK_TONE[tier] || ""}`}>{tier || "?"}</span>
              {result.model && <span className="text-xs text-[var(--wood-muted)]">model: {result.model}</span>}
            </div>
            {
              result.risk?.reasons?.length > 0 && (
                <ul className="list-disc space-y-0.5 pl-4 text-xs text-[var(--wood-muted)]">
                  {result.risk.reasons.map((reason, index) => <li key={index}>{reason}</li>)}
                </ul>
              )
            }
            {
              planned.length > 0 && (
                <ul className="list-disc space-y-0.5 pl-4 font-mono text-xs text-[var(--wood-text)]">
                  {planned.map((edit, index) => <li key={index}>{Array.isArray(edit.path) ? edit.path.join(" → ") : "?"}: {String(edit.value)}</li>)}
                </ul>
              )
            }
            <UnifiedDiffView diff={result.diff} />
            <ApplyModeToggle risk={result.risk} value={applyMode} onChange={onApplyModeChange} />
          </div>
        )
      }
    </div>
  )
}

export default PatchPreviewPanel
