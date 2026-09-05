import { usePatchPreview } from "./usePatchPreview"
import PatchPreviewPanel from "./PatchPreviewPanel"

/*
 * "Poista entiteetti" - removeKey (hearthwood-apply-edit.mjs), the
 * mirror of CloneEntityForm's addKey. A browser confirm() gates even
 * opening the preview (this is destructive, unlike every other edit
 * here which is additive/scoped) - the normal preview+diff+confirm
 * flow is the second, real safety net.
 */
function DeleteEntityButton({ type, entityId, entityLabel, onApplied, onPreviewUrlChange }) {
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

  async function handleClick() {
    if (!window.confirm(`Poista "${entityLabel || entityId}" kokonaan? Voit vielä perua ennen "Vahvista ja sovella" -painiketta.`)) {
      return
    }

    await preview({ type, entityId, edits: [{ path: [entityId], op: "removeKey" }] })
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={previewing}
        onClick={handleClick}
        className="
          rounded-full border border-red-900 px-3 py-1 text-xs text-red-400
          transition-opacity disabled:opacity-30 hover:bg-red-950/30
        "
      >
        🗑 Poista entiteetti
      </button>

      {errorMessage && <div className="text-xs text-red-300">{errorMessage}</div>}

      <PatchPreviewPanel
        result={result}
        applyMode={applyMode}
        onApplyModeChange={setApplyMode}
        onDiscard={discard}
        onApply={apply}
        applying={applying}
      />
    </div>
  )
}

export default DeleteEntityButton
