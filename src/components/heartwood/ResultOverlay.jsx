import { motion } from "framer-motion"
import { CardGlyph } from "./cardArt"

export default function ResultOverlay({ phase, enemyName, stats, essenceOnWin, victoryLine, onContinue }) {
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
            ? victoryLine || `${enemyName} falls still. The runes dim, and the forest holds its breath.`
            : `The dark closes in. ${enemyName} was stronger than the trial allowed for.`}
        </p>
        {won && essenceOnWin != null && (
          <div className="hw-badge hw-essence-badge" title="Essence earned">
            <CardGlyph name="spark" className="hw-intent-glyph" />
            +{essenceOnWin} Essence
          </div>
        )}
        {showStats && (
          <div className="hw-recap">
            <div className="hw-recap-highlights">
              {stats.biggestHit && (
                <div className="hw-recap-highlight">
                  <span className="hw-recap-highlight-label">Biggest hit</span>
                  <span className="hw-recap-highlight-value">
                    {stats.biggestHit.name} <strong>{stats.biggestHit.amount}</strong>
                  </span>
                </div>
              )}
              {stats.topUnit && stats.topUnit.damageDealt + stats.topUnit.healingDone > 0 && (
                <div className="hw-recap-highlight">
                  <span className="hw-recap-highlight-label">MVP</span>
                  <span className="hw-recap-highlight-value">{stats.topUnit.name}</span>
                </div>
              )}
              {stats.closestMoment != null && (
                <div className="hw-recap-highlight">
                  <span className="hw-recap-highlight-label">Closest call</span>
                  <span className="hw-recap-highlight-value">
                    <strong>{stats.closestMoment}%</strong> squad HP
                  </span>
                </div>
              )}
            </div>

            {/* Each unit's own contribution - Marc: "jokaisen hahmon
                damage näytetään erikseen", now at fight's end too. */}
            {(() => {
              const rows = (stats.entries || []).filter((e) => e.damageDealt + e.healingDone > 0)
              const max = rows.reduce((m, e) => Math.max(m, e.damageDealt + e.healingDone), 1)
              return rows.length ? (
                <div className="hw-recap-bars">
                  {rows
                    .sort((a, b) => b.damageDealt + b.healingDone - (a.damageDealt + a.healingDone))
                    .map((e) => (
                      <div className="hw-recap-bar-row" key={e.id}>
                        <span className="hw-recap-bar-name">{e.name}</span>
                        <span className="hw-recap-bar-track">
                          <span
                            className="hw-recap-bar-fill hw-recap-bar-fill--dmg"
                            style={{ width: `${(e.damageDealt / max) * 100}%` }}
                          />
                          {e.healingDone > 0 && (
                            <span
                              className="hw-recap-bar-fill hw-recap-bar-fill--heal"
                              style={{ width: `${(e.healingDone / max) * 100}%` }}
                            />
                          )}
                        </span>
                        <span className="hw-recap-bar-num">{e.damageDealt || e.healingDone}</span>
                      </div>
                    ))}
                </div>
              ) : null
            })()}

            <div className="hw-recap-totals">
              <span>{stats.totalDamage} dmg</span>
              {stats.totalHealing > 0 && <span>{stats.totalHealing} healed</span>}
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: 12 }}>
          <button className="hw-end-turn" onClick={onContinue}>Continue</button>
        </div>
      </motion.div>
    </motion.div>
  )
}
