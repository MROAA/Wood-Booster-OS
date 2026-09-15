import { useState } from "react"

import { usePatchPreview } from "./usePatchPreview"
import PatchPreviewPanel from "./PatchPreviewPanel"

/*
 * Marcin ensisijainen syöttöpolku: "kerro suomeksi mitä haluat
 * muuttaa" -> POST /preview {type,entityId,instruction} -> tässä
 * näytetään suunnitellut muutokset + hylätyt + diff suomeksi ennen
 * kuin mitään sovelletaan (aina preview+confirm, ks. nlEditPlanner.js:n
 * kova validaattori - Ollama ei koskaan kirjoita suoraan).
 */
function NlChangeBox({ type, entityId, entityLabel, onApplied, onPreviewUrlChange }) {
  const [instruction, setInstruction] = useState("")

  const {
    result,
    applyMode,
    setApplyMode,
    previewing,
    applying,
    errorMessage,
    preview,
    discard,
    apply,
  } = usePatchPreview({ onApplied, onPreviewUrlChange })

  const disabled = !entityId

  async function handlePreview() {
    if (!instruction.trim() || disabled) {
      return
    }

    await preview({ type, entityId, instruction: instruction.trim() })
  }

  async function handleApply() {
    await apply()
    setInstruction("")
  }

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

      <PatchPreviewPanel
        result={result}
        applyMode={applyMode}
        onApplyModeChange={setApplyMode}
        onDiscard={discard}
        onApply={handleApply}
        applying={applying}
      />
    </div>
  )
}

export default NlChangeBox
