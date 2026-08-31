import { useRef, useState } from "react"

import { apiUpload } from "../../api/client"

import { usePatchPreview } from "./usePatchPreview"
import PatchPreviewPanel from "./PatchPreviewPanel"

/*
 * "Haluan pystyä tuomaan kuvia ja liittämään helposti eri kuvia"
 * (Marc) - shown only for a field entityReader.js named in
 * `identifierKeys` (a bare `image: xImg` reference to a top-of-file
 * import, e.g. every unit's `image`). Upload saves the file straight
 * to disk (imageUpload.js - outside the snapshot/revert pipeline, an
 * unused upload is just an inert extra asset); wiring it into the
 * entity is a normal MEDIUM preview/apply via the "setImportedImage"
 * op, same review UI as every other change here.
 */
function ImageUploadField({ type, entityId, fieldName, onApplied, onPreviewUrlChange }) {
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const {
    result,
    applyMode,
    setApplyMode,
    applying,
    preview,
    discard,
    apply,
  } = usePatchPreview({ onApplied, onPreviewUrlChange })

  async function handleFileChange(event) {
    const file = event.target.files?.[0]

    event.target.value = ""

    if (!file) {
      return
    }

    setUploading(true)
    setErrorMessage("")

    try {
      const formData = new FormData()
      formData.append("type", type)
      formData.append("entityId", entityId)
      formData.append("file", file)

      const uploaded = await apiUpload("/hearthwood-patchbay/upload-image", formData)

      await preview({
        type,
        entityId,
        edits: [{ path: [entityId, fieldName], op: "setImportedImage", importPath: uploaded.importPath }],
      })
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-wide text-[var(--wood-muted)]">{fieldName}</span>

        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="
            rounded-full border border-[var(--wood-border)] px-3 py-1 text-xs
            text-[var(--wood-muted)] transition-opacity disabled:opacity-30
            hover:border-[var(--wood-accent)] hover:text-[var(--wood-text)]
          "
        >
          {uploading ? "Ladataan..." : "🖼 Vaihda kuva"}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

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

export default ImageUploadField
