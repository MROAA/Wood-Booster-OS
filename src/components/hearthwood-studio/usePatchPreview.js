import { useState } from "react"

import { apiPost, apiDelete } from "../../api/client"

/*
 * Yhteinen preview -> review -> apply/discard -tila. NlChangeBox
 * (instruction) ja EntityFieldEditor (edits[]) syöttävät eri rungon
 * POST /preview:lle mutta jakavat saman kierron sen jälkeen - eriytetty
 * tänne kun toinen kuluttaja (kenttäeditori) ilmestyi, jotta apply/
 * discard-logiikka ei elä kahtena hieman erilaisena kopiona.
 */
export function usePatchPreview({ onApplied, onPreviewUrlChange } = {}) {
  const [result, setResult] = useState(null)
  const [applyMode, setApplyMode] = useState("live")
  const [previewing, setPreviewing] = useState(false)
  const [applying, setApplying] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  async function stopActivePreview(current) {
    const row = current ?? result

    if (row?.patchId && row?.previewUrl) {
      try {
        await apiDelete(`/hearthwood-patchbay/${row.patchId}/preview`)
      } catch {
        // esikatvelupalvelin sammuu itsestäänkin 10 min käyttämättömänä
      }
    }
  }

  async function preview(body) {
    setPreviewing(true)
    setErrorMessage("")

    try {
      await stopActivePreview()

      const data = await apiPost("/hearthwood-patchbay/preview", body)

      setResult(data)
      setApplyMode(data.risk?.allowedModes?.includes("live") ? "live" : "pr")
      onPreviewUrlChange?.(data.previewUrl || null)

      return data
    } catch (error) {
      setErrorMessage(error.message)
      return null
    } finally {
      setPreviewing(false)
    }
  }

  async function discard() {
    await stopActivePreview()
    setResult(null)
    onPreviewUrlChange?.(null)
  }

  async function apply() {
    if (!result?.patchId) {
      return
    }

    setApplying(true)
    setErrorMessage("")

    try {
      const row = await apiPost(`/hearthwood-patchbay/${result.patchId}/apply`, {
        applyMode: "live",
        confirm: true,
      })

      // Tell the Studio page how it went (StudioToast in HearthwoodStudio.jsx):
      // Marc needs a plain "it's in the game" - or "it was undone".
      window.dispatchEvent(new CustomEvent("hw-studio-applied", { detail: { status: row?.status || "applied", patchId: result.patchId } }))

      onPreviewUrlChange?.(null)
      setResult(null)
      onApplied?.()
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setApplying(false)
    }
  }

  return {
    result,
    applyMode,
    setApplyMode,
    previewing,
    applying,
    errorMessage,
    preview,
    discard,
    apply,
  }
}
