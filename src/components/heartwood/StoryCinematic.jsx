import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

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

      <div className="hw-cinematic-inner">
        {cinematic.title && (
          <motion.div
            className="hw-cinematic-head"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="hw-cinematic-title">{cinematic.title}</h1>
            {cinematic.subtitle && <p className="hw-cinematic-subtitle">{cinematic.subtitle}</p>}
          </motion.div>
        )}

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
