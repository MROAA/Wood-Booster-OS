import { useEffect, useRef, useState } from "react"

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
function ImageUploadField({ type, entityId, fieldName, currentImagePath, onApplied, onPreviewUrlChange }) {
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  // Marc: "haluan että siinä näkyy vanha kuva selvästi esillä ja se
  // päivittyy uuteen jos vaihdan sen" (the old image should be clearly
  // shown, and update to the new one once changed). `localPreviewUrl`
  // is an object URL for the JUST-PICKED file - shown immediately, no
  // need to wait on the upload+preview round-trip - and is the SAME
  // image the pending patch would actually write if applied. Falls
  // back to `currentImagePath` (this round: hearthwood-read-
  // entities.mjs now resolves an identifier field's own import back to
  // a real, Vite-servable root-relative asset path) when nothing new
  // has been picked yet.
  const [localPreviewUrl, setLocalPreviewUrl] = useState(null)

  useEffect(() => {
    // A newly selected entity (or a reverted/applied patch reloading
    // entityDetail) means any local pick from a PREVIOUS entity is
    // stale - drop it so the shown image goes back to that entity's
    // own real one.
    setLocalPreviewUrl(null)
  }, [type, entityId, fieldName])

  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl)
      }
    }
  }, [localPreviewUrl])

  const displayedImageUrl = localPreviewUrl || (currentImagePath ? `/${currentImagePath}` : null)

  const {
    result,
    applyMode,
    setApplyMode,
    applying,
    preview,
    discard: discardPreview,
    apply,
  } = usePatchPreview({ onApplied, onPreviewUrlChange })

  // A discarded preview never got written - the shown image should
  // fall back to the real current one, not keep displaying the
  // rejected pick.
  function discard() {
    setLocalPreviewUrl(null)
    discardPreview()
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0]

    event.target.value = ""

    if (!file) {
      return
    }

    setUploading(true)
    setErrorMessage("")
    // Show the picked file immediately - don't wait on the upload/
    // preview round-trip to answer "did the image actually change".
    setLocalPreviewUrl(URL.createObjectURL(file))

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
      // The upload/preview never landed - don't keep showing a picked
      // file as if it were live; fall back to the real current image.
      setLocalPreviewUrl(null)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {
          displayedImageUrl
            ? (
              <img
                src={displayedImageUrl}
                alt={fieldName}
                className="h-14 w-14 shrink-0 rounded-lg border border-[var(--wood-border)] object-cover bg-[var(--wood-bg)]"
              />
            )
            : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-dashed border-[var(--wood-border)] text-[10px] text-[var(--wood-muted)]">
                No image
              </div>
            )
        }

        <div className="flex flex-col gap-1">
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
            {uploading ? "Uploading..." : "🖼 Change image"}
          </button>
        </div>

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
