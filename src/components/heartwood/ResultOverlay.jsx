import { motion } from "framer-motion"
import { CardGlyph } from "./cardArt"

export default function ResultOverlay({ phase, enemyName, onRetry, onChooseAnother }) {
  if (phase !== "won" && phase !== "lost") return null

  const won = phase === "won"

  return (
    <motion.div
      className="hw-overlay"
      data-outcome={phase}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.6, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}
      >
        <CardGlyph
          name={won ? "the-sun" : "the-tower"}
          className="hw-overlay-glyph"
          style={{ color: won ? "var(--hw-moss)" : "var(--hw-hp)" }}
        />
        <div className="hw-overlay-title" style={{ color: won ? "var(--hw-moss)" : "var(--hw-hp)" }}>
          {won ? "Victory" : "Defeat"}
        </div>
        <p className="hw-flavor">
          {won
            ? `${enemyName} falls still. The runes dim, and the forest holds its breath.`
            : `The dark closes in. ${enemyName} was stronger than the trial allowed for.`}
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="hw-end-turn" onClick={onRetry}>Fight Again</button>
          <button
            className="hw-end-turn"
            style={{ background: "var(--hw-panel)", color: "var(--hw-text)", border: "1px solid var(--hw-border)" }}
            onClick={onChooseAnother}
          >
            Choose Another Enemy
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
