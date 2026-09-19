import { useState } from "react"

import { apiPost } from "../../api/client"

/*
 * Shared preview -> review -> apply/discard state, used by both
 * NlChangeBox (instruction) and SheetView (edits[]). Simplified from
 * hearthwood-studio/usePatchPreview.js: no live-preview-server
 * integration (out of scope for this pass - Bloodmoor's own dev server
 * picks up an applied change via its own HMR once it's written to
 * disk), so there's no previewUrl/stopActivePreview plumbing here.
 */
export function usePatchPreview({ onApplied } = {}) {
  const [result, setResult] = useState(null)
  const [previewing, setPreviewing] = useState(false)
  const [applying, setApplying] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  async function preview(body) {
    setPreviewing(true)
    setErrorMessage("")

    try {
      const data = await apiPost("/bloodmoor-patchbay/preview", body)
      setResult(data)
      return data
    } catch (error) {
      setErrorMessage(error.message)
      return null
    } finally {
      setPreviewing(false)
    }
  }

  function discard() {
    setResult(null)
  }

  async function apply() {
    if (!result?.patchId) {
      return
    }

    setApplying(true)
    setErrorMessage("")

    try {
      await apiPost(`/bloodmoor-patchbay/${result.patchId}/apply`, { confirm: true })
      setResult(null)
      onApplied?.()
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setApplying(false)
    }
  }

  return { result, previewing, applying, errorMessage, preview, discard, apply }
}
