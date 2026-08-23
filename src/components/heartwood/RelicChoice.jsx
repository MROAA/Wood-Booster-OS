import { useEffect, useRef, useState } from "react"
import { RELICS, RELIC_REROLL_COST } from "../../data/heartwood/relics"
import { TRIBES } from "../../data/heartwood/synergies"
import { CardGlyph } from "./cardArt"

// The relic-pick beat: same "3 choices or skip" shape as the old
// RewardScreen.jsx, but relics aren't units - no HP/attack numbers, so
// this is its own small card layout instead of reusing UnitCard.jsx.
// Same cost-badge/data-disabled pattern UnitCard.jsx already uses, now
// that relics cost Essence instead of being free.
export default function RelicChoice({ runState, onChoose, onReroll }) {
  const options = (runState.relicOffers || []).map((id) => RELICS[id]).filter(Boolean)
  // Essence flash - same diff-and-clear pattern SquadDraft.jsx's own
  // essence badge already uses, so spending on a Reroll here feels as
  // alive as spending in the shop does.
  const prevEssenceRef = useRef(runState.essence)
  const [essenceFlash, setEssenceFlash] = useState(null)
  useEffect(() => {
    const prev = prevEssenceRef.current
    if (runState.essence !== prev) {
      setEssenceFlash(runState.essence > prev ? "gain" : "spend")
      prevEssenceRef.current = runState.essence
      const timer = setTimeout(() => setEssenceFlash(null), 500)
      return () => clearTimeout(timer)
    }
  }, [runState.essence])

  return (
    <div className="hw-intro">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>A relic waits in the roots</h1>
        <span className="hw-badge hw-essence-badge" data-flash={essenceFlash || undefined} title="Essence">
          <CardGlyph name="spark" className="hw-intent-glyph" />
          {runState.essence}
        </span>
      </div>
      <p className="hw-flavor" style={{ marginTop: 14 }}>
        Choose one to carry for the rest of this run, or leave it behind.
      </p>
      <div className="hw-select-grid hw-deck-preview">
        {options.map((relic) => {
          const disabled = runState.essence < relic.cost
          const anchor = relic.tribeAnchor ? TRIBES[relic.tribeAnchor] : null
          return (
            <div
              key={relic.id}
              className="hw-card hw-card--power"
              data-disabled={disabled}
              onClick={!disabled ? () => onChoose(relic.id) : undefined}
            >
              <div className="hw-card-head">
                <span className="hw-card-cost">{relic.cost}</span>
              </div>
              <CardGlyph name={relic.icon} className="hw-card-glyph" />
              <div className="hw-card-name">{relic.name}</div>
              {/* Tribe-anchor relics (relics.js) only ever reach one
                  tribe - a small icon makes that scope readable at a
                  glance instead of only living in the description
                  sentence below. */}
              {anchor && (
                <div className="hw-tribe-icons">
                  <span className="hw-tribe-icon" style={{ color: anchor.color }} title={anchor.name}>
                    <CardGlyph name={anchor.icon} className="hw-effect-icon-glyph" />
                  </span>
                </div>
              )}
              <div className="hw-card-desc">{relic.description}</div>
            </div>
          )
        })}
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        <button className="hw-move-btn" onClick={() => onChoose(null)}>
          Skip
        </button>
        <button className="hw-move-btn" disabled={runState.essence < RELIC_REROLL_COST} onClick={onReroll}>
          Reroll ({RELIC_REROLL_COST} Essence)
        </button>
      </div>
    </div>
  )
}
