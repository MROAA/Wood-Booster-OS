import { useState } from "react"

import { apiPost, apiDelete } from "../../api/client"

import ApplyModeToggle from "./ApplyModeToggle"
import UnifiedDiffView from "./UnifiedDiffView"
import { RISK_TONE } from "./patchStatusLabels"

/*
 * Marcin ensisijainen syöttöpolku: "kerro suomeksi mitä haluat
 * muuttaa" -> POST /preview {type,entityId,instruction} -> tässä
 * näytetään suunnitellut muutokset + hylätyt + diff suomeksi ennen
 * kuin mitään sovelletaan (aina preview+confirm, ks. nlEditPlanner.js:n
 * kova validaattori - Ollama ei koskaan kirjoita suoraan).
 */
function NlChangeBox({ type, entityId, entityLabel, onApplied, onPreviewUrlChange }) {
  const [instruction, setInstruction] = useState("")
  const [previewing, setPreviewing] = useState(false)
  const [applying, setApplying] = useState(false)
  const [result, setResult] = useState(null)
  const [applyMode, setApplyMode] = useState("live")
  const [errorMessage, setErrorMessage] = useState("")

  const disabled = !entityId

  async function stopActivePreview() {
    if (result?.patchId && result?.previewUrl) {
      try {
        await apiDelete(`/hearthwood-patchbay/${result.patchId}/preview`)
      } catch {
        // esikatvelupalvelin sammuu itsestäänkin 10 min käyttämättömänä
      }
    }
  }

  async function handlePreview() {
    if (!instruction.trim() || disabled) {
      return
    }

    setPreviewing(true)
    setErrorMessage("")

    try {
      await stopActivePreview()

      const data = await apiPost("/hearthwood-patchbay/preview", {
        type,
        entityId,
        instruction: instruction.trim(),
      })

      setResult(data)
      setApplyMode(data.risk?.allowedModes?.includes("live") ? "live" : "pr")
      onPreviewUrlChange?.(data.previewUrl || null)
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setPreviewing(false)
    }
  }

  async function handleDiscard() {
    await stopActivePreview()
    setResult(null)
    onPreviewUrlChange?.(null)
  }

  async function handleApply() {
    if (!result?.patchId) {
      return
    }

    setApplying(true)
    setErrorMessage("")

    try {
      await apiPost(`/hearthwood-patchbay/${result.patchId}/apply`, {
        applyMode: "live",
        confirm: true,
      })

      onPreviewUrlChange?.(null)
      setResult(null)
      setInstruction("")
      onApplied?.()
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setApplying(false)
    }
  }

  const hasPlannedEdits = Array.isArray(result?.plannedEdits) && result.plannedEdits.length > 0
  const hasRejectedOps = Array.isArray(result?.rejectedOps) && result.rejectedOps.length > 0
  const canApply = result && result.risk?.allowedModes?.includes("live") && applyMode === "live"

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--wood-muted)]">
          Omin sanoin{entityLabel ? ` — ${entityLabel}` : ""}
        </label>

        <textarea
          value={instruction}
          onChange={event => setInstruction(event.target.value)}
          disabled={disabled}
          placeholder={
            disabled
              ? "Valitse ensin entiteetti vasemmalta."
              : "Esim. \"tee tästä hieman kovempi\" tai \"nosta hintaa 20 essenssillä\"..."
          }
          rows={3}
          className="
            wood-scroll w-full resize-none rounded-xl border border-[var(--wood-border)]
            bg-[var(--wood-bg)] p-3 text-sm text-[var(--wood-text)] outline-none
            placeholder:text-[var(--wood-muted)] focus:border-[var(--wood-accent)]
            disabled:opacity-50
          "
        />

        <div className="mt-2 flex justify-end">
          <button
            type="button"
            disabled={disabled || previewing || !instruction.trim()}
            onClick={handlePreview}
            className="
              rounded-full border border-[var(--wood-accent)] bg-[var(--wood-accent)]
              px-4 py-1.5 text-sm font-medium text-[#17120c] transition-opacity
              disabled:cursor-not-allowed disabled:opacity-30
            "
          >
            {previewing ? "Esikatsellaan..." : "Esikatsele muutos"}
          </button>
        </div>
      </div>

      {errorMessage && <div className="text-xs text-red-300">{errorMessage}</div>}

      {
        result && (
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

            <ApplyModeToggle risk={result.risk} value={applyMode} onChange={setApplyMode} />

            <div className="flex gap-2">
              <button
                type="button"
                disabled={applying}
                onClick={handleDiscard}
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
                onClick={handleApply}
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
    </div>
  )
}

export default NlChangeBox
