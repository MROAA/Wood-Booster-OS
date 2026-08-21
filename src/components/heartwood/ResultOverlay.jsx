import { motion } from "framer-motion"
import { CardGlyph } from "./cardArt"

export default function ResultOverlay({ phase, enemyName, stats, essenceOnWin, onContinue }) {
  if (phase !== "won" && phase !== "lost") return null

  const won = phase === "won"
  const showStats = stats && (stats.totalDamage > 0 || stats.totalHealing > 0)

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
        {won && essenceOnWin != null && (
          <div className="hw-badge hw-essence-badge" title="Essence earned">
            <CardGlyph name="spark" className="hw-intent-glyph" />
            +{essenceOnWin} Essence
          </div>
        )}
        {showStats && (
          <div className="hw-battle-stats">
            <div className="hw-battle-stats-row">
              <span>Damage dealt</span>
              <span>{stats.totalDamage}</span>
            </div>
            <div className="hw-battle-stats-row">
              <span>Healing done</span>
              <span>{stats.totalHealing}</span>
            </div>
            {stats.topUnit && stats.topUnit.damageDealt + stats.topUnit.healingDone > 0 && (
              <div className="hw-battle-stats-row">
                <span>Top unit</span>
                <span>{stats.topUnit.name}</span>
              </div>
            )}
          </div>
        )}
        <div style={{ display: "flex", gap: 12 }}>
          <button className="hw-end-turn" onClick={onContinue}>Continue</button>
        </div>
      </motion.div>
    </motion.div>
  )
}
