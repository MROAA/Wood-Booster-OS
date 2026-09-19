import { useState } from "react"

import { usePatchPreview } from "./usePatchPreview"
import PatchPreviewPanel from "./PatchPreviewPanel"

/*
 * Plain-language edit box: "tell me what to change" -> POST /preview
 * {type,entityId,instruction} -> shows planned edits + rejected ones +
 * diff before anything is applied (nlEditPlanner.js's hard validator
 * means the local model never writes directly - every candidate edit is
 * re-checked against the entity's real scalar fields).
 */
function NlChangeBox({ type, entityId, entityLabel, onApplied }) {
  const [instruction, setInstruction] = useState("")

  const { result, previewing, applying, errorMessage, preview, discard, apply } = usePatchPreview({ onApplied })

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
          Tell it what to change{entityLabel ? ` — ${entityLabel}` : ""}
        </label>

        <textarea
          value={instruction}
          onChange={event => setInstruction(event.target.value)}
          disabled={disabled}
          placeholder={
            disabled
              ? "Select an entity on the left first."
              : "e.g. \"make this hit a bit harder\" or \"drop the cooldown by 20%\"..."
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
              px-4 py-1.5 text-sm font-medium text-white transition-opacity
              disabled:cursor-not-allowed disabled:opacity-30
            "
          >
            {previewing ? "Previewing..." : "Preview change"}
          </button>
        </div>
      </div>

      {errorMessage && <div className="text-xs text-red-300">{errorMessage}</div>}

      <PatchPreviewPanel result={result} onDiscard={discard} onApply={handleApply} applying={applying} />
    </div>
  )
}

export default NlChangeBox
