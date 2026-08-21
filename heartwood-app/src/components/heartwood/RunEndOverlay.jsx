import { motion } from "framer-motion"
import { CardGlyph } from "./cardArt"
import { ENEMIES } from "../../data/heartwood/enemies"

// Distinct from the per-fight ResultOverlay.jsx (which still plays out
// after each individual battle) - this is the run's actual ending,
// reached only after the Spacemonkey boss (victory) or a loss anywhere
// along the path (permadeath). One button: start over.
export default function RunEndOverlay({ phase, onNewRun }) {
  if (phase !== "victory" && phase !== "defeat") return null
  const won = phase === "victory"

  return (
    <motion.div
      className="hw-overlay"
      data-outcome={won ? "won" : "lost"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.6, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, maxWidth: 440, textAlign: "center" }}
      >
        <CardGlyph
          name={won ? "the-sun" : "the-tower"}
          className="hw-overlay-glyph"
          style={{ color: won ? "var(--hw-moss)" : "var(--hw-hp)" }}
        />
        <div className="hw-overlay-title" style={{ color: won ? "var(--hw-moss)" : "var(--hw-hp)" }}>
          {won ? "The Heartwood Falls Silent" : "The Trial Ends Here"}
        </div>
        <p className="hw-flavor">
          {won
            ? ENEMIES.spacemonkey.victoryLine
            : "The Heartwood keeps no memory of you. Another trial can always begin fresh."}
        </p>
        <button className="hw-end-turn" onClick={onNewRun}>
          New Run
        </button>
      </motion.div>
    </motion.div>
  )
}
