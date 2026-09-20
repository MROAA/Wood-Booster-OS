import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

import { apiGet } from "../../api/client"
import EntityFieldEditor from "../hearthwood-studio/EntityFieldEditor"

/*
 * Marc: "haluan kehittää tätä lisää. tykkään ideasta pystyä pelaamaan
 * peliä ja muokkaamaan sitä lennossa" (I want to develop this further -
 * I like the idea of being able to play the game and edit it on the
 * fly). The first version (EditInStudioLink) opened a new tab - real,
 * but still a context switch. This is the "on the fly" version: the
 * SAME field editor Hearthwood Studio's own Single view uses
 * (EntityFieldEditor.jsx - already handles scalars, nested lists via
 * ListFieldEditor, and complex raw-JS fields, with the same
 * preview -> diff -> confirm safety net riskModel.js requires) opens
 * right on top of the game screen you're already looking at. No new
 * tab, no losing your place.
 *
 * After a successful apply, the edited data file has changed on disk -
 * but this page's already-running JS has the OLD content in memory
 * (React state, imported module bindings), so a reload is the only
 * reliable way to actually SEE the new text. That's safe here because
 * the run itself is saved to localStorage continuously
 * (runSaveState.js) - reloading resumes at the exact same point,
 * just reading the freshly-edited content.
 */
export default function QuickEditOverlay({ type, id, onClose }) {
  const [entityDetail, setEntityDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [applied, setApplied] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setErrorMessage("")

      try {
        const data = await apiGet(`/hearthwood-patchbay/entity/${type}/${id}`)

        if (!cancelled) {
          setEntityDetail(data)
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error.message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [type, id])

  function handleApplied() {
    setApplied(true)
  }

  function handleClose() {
    if (applied) {
      window.location.reload()
      return
    }

    onClose?.()
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.6)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          onClick={event => event.stopPropagation()}
          style={{
            background: "var(--hw-panel)",
            border: "1px solid var(--hw-border)",
            borderRadius: 16,
            padding: 20,
            width: "min(640px, 100%)",
            maxHeight: "85vh",
            overflowY: "auto",
            color: "var(--hw-text)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: "var(--hw-rune)" }}>
              Quick Edit — {entityDetail?.name || id}
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="hw-move-btn"
              style={{ padding: "4px 10px", fontSize: 12 }}
            >
              {applied ? "Done — reload to see it" : "Close"}
            </button>
          </div>

          {loading && <div style={{ fontSize: 13, color: "var(--hw-muted)" }}>Loading...</div>}
          {errorMessage && <div style={{ fontSize: 13, color: "#e08080" }}>{errorMessage}</div>}

          {
            entityDetail && (
              <EntityFieldEditor
                type={type}
                entityId={id}
                entityDetail={entityDetail}
                onApplied={handleApplied}
                onPreviewUrlChange={() => {}}
              />
            )
          }

          <div style={{ marginTop: 16, fontSize: 11 }}>
            <a
              href={`/hearthwood-studio?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`}
              target="_blank"
              rel="noreferrer"
              style={{ color: "var(--hw-muted)", textDecoration: "underline", textDecorationStyle: "dotted" }}
            >
              Need more (clone, images)? Open full Studio ↗
            </a>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
