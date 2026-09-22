import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

import EditInStudioLink from "./EditInStudioLink"
import { useFreeLayout } from "./useFreeLayout.jsx"

// A scripted story cinematic (cinematics.js) played as a click-to-advance
// dialogue reader. Marc: the story bible's written scenes barely reach
// the player - "ei koukkua eteneä". This is the vehicle for the two
// bookends: the intro before the first shop, and one of three endings
// after the final boss.
//
// Deliberately text-first and quiet: a dark ground tinted by the
// cinematic's `fade`, a speaker + line revealed one at a time, a Skip
// out the corner. `onDone()` is the only exit - the caller decides what
// comes next (first shop / RunEndOverlay).
const FADE_BG = {
  black: "#0a0a0b",
  green: "#0c140c",
  red: "#160c0a",
  violet: "#120c16",
}

export default function StoryCinematic({ cinematic, onDone }) {
  const [i, setI] = useState(0)
  // Free Layout foundation (Stage A, PR 3) - the SAME mechanism as
  // Settings/CommanderSelect/GuildHallScreen, but this screen's root
  // treats ANY click as "advance to the next line" (see `advance`
  // below), so every toolbar/control click here must call
  // e.stopPropagation() too - the hook's own drag handle/hide button
  // already do this internally, but the toolbar buttons below are
  // screen-level JSX and need the same guard added explicitly.
  const layout = useFreeLayout({ screenId: "storyCinematic", keys: ["head", "lines"] })
  if (!cinematic) return null
  const lines = cinematic.lines || []
  const atEnd = i >= lines.length - 1
  const shown = lines.slice(0, i + 1)

  function advance() {
    if (atEnd) onDone?.()
    else setI((n) => Math.min(n + 1, lines.length - 1))
  }

  return (
    <motion.div
      className="hw-root hw-cinematic"
      style={{ "--hw-cine-bg": FADE_BG[cinematic.fade] || FADE_BG.black }}
      data-screen="story-cinematic"
      data-cinematic={cinematic.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      onClick={advance}
    >
      <button
        className="hw-cinematic-skip"
        onClick={(e) => {
          e.stopPropagation()
          onDone?.()
        }}
      >
        Skip
      </button>

      <div style={{ position: "absolute", top: 14, left: 14, zIndex: 1 }} onClick={(e) => e.stopPropagation()}>
        <EditInStudioLink type="cinematics" id={cinematic.id} />
        {import.meta.env.DEV && (
          <div className="hw-free-layout-toolbar" style={{ marginTop: 6, border: "none", padding: 0 }}>
            {!layout.editingLayout ? (
              <button
                className="hw-move-btn"
                onClick={() => layout.startEditing()}
                disabled={layout.loading}
              >
                Edit Layout
              </button>
            ) : (
              <>
                <button className="hw-move-btn" onClick={() => layout.saveLayout()} disabled={layout.saving}>
                  Save Layout
                </button>
                <button className="hw-move-btn" onClick={() => layout.cancelEditing()} disabled={layout.saving}>
                  Cancel
                </button>
              </>
            )}
            <button className="hw-move-btn" onClick={() => layout.resetLayout()} disabled={layout.saving}>
              Reset Layout
            </button>
            {layout.errorMessage && <span className="hw-free-layout-error">{layout.errorMessage}</span>}
          </div>
        )}
      </div>

      <div className="hw-cinematic-inner">
        <div
          ref={layout.containerRef}
          className="hw-free-layout-container"
          style={layout.containerStyle}
          data-free-active={layout.freeActive || undefined}
          data-editing-layout={layout.editingLayout || undefined}
        >
          {layout.renderSection(
            "head",
            cinematic.title && (
              <motion.div
                className="hw-cinematic-head"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="hw-cinematic-title">{cinematic.title}</h1>
                {cinematic.subtitle && <p className="hw-cinematic-subtitle">{cinematic.subtitle}</p>}
              </motion.div>
            )
          )}

          {layout.renderSection(
            "lines",
            <div className="hw-cinematic-lines">
              <AnimatePresence initial={false}>
                {shown.map((ln, idx) => (
                  <motion.div
                    key={idx}
                    className="hw-cinematic-line"
                    data-current={idx === i || undefined}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: idx === i ? 1 : 0.4, y: 0 }}
                    transition={{ duration: 0.35 }}
                  >
                    <span className="hw-cinematic-speaker" data-tone={ln.tone || undefined}>
                      {ln.speaker}
                    </span>
                    <span className="hw-cinematic-text" data-tone={ln.tone || undefined}>
                      {ln.line}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div className="hw-cinematic-prompt">
          {atEnd ? (
            <button
              className="hw-end-turn"
              onClick={(e) => {
                e.stopPropagation()
                onDone?.()
              }}
            >
              Continue
            </button>
          ) : (
            <span className="hw-cinematic-more">click to continue</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
