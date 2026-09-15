import { useEffect, useRef, useState } from "react"
import { RELICS, RELIC_REROLL_COST } from "../../data/heartwood/relics"
import { TRIBES } from "../../data/heartwood/synergies"
import { benchTribeCounts } from "../../services/heartwood/runEngine"
import { CardGlyph } from "./cardArt"

// The relic-pick beat: same "3 choices or skip" shape as the old
// RewardScreen.jsx, but relics aren't units - no HP/attack numbers, so
// this is its own small card layout instead of reusing UnitCard.jsx.
// Same cost-badge/data-disabled pattern UnitCard.jsx already uses, now
// that relics cost Essence instead of being free.
export default function RelicChoice({ runState, onChoose, onReroll }) {
  const options = (runState.relicOffers || []).map((id) => RELICS[id]).filter(Boolean)
  // Tribe-match highlight (same benchTribeCounts/hw-card[data-tribe-
  // match] treatment SquadDraft.jsx's shop offers already use) - a
  // tribe-anchor relic that matches a tribe you've already invested in
  // gets the same moss ring, so "does this actually fit my build" reads
  // here too, not just when recruiting units.
  const ownedTribes = benchTribeCounts(runState)
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
          const tribeMatch = !!anchor && (ownedTribes[relic.tribeAnchor] || 0) > 0
          return (
            <div
              key={relic.id}
              className="hw-card hw-card--power"
              data-disabled={disabled}
              data-tribe-match={tribeMatch}
              // Rarity glow (relics.js's own tier reclassification pass,
              // Marc: "harvinaiset on parempia" - rare ones are better) -
              // this is the exact same .hw-card[data-tier] selector
              // UnitCard.jsx already renders under, so a rare relic now
              // gets the identical ember glow/sparkle a rare UNIT already
              // has, no parallel visual system invented for it. Common
              // stays glow-free by the same CSS rule's own restraint.
              data-tier={relic.tier}
              onClick={!disabled ? () => onChoose(relic.id) : undefined}
            >
              <div className="hw-card-head">
                <span className="hw-card-cost">{relic.cost}</span>
              </div>
              {/* Real icon art (relics.js's own kuvia-folder pass,
                  mirroring ItemCard.jsx's def.image-vs-glyph branch) -
                  falls back to the SVG glyph for the rare relic the art
                  pass genuinely couldn't match. */}
              {relic.image ? (
                <img src={relic.image} alt="" className="hw-card-glyph" />
              ) : (
                <CardGlyph name={relic.icon} className="hw-card-glyph" />
              )}
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
              {/* Tier word, same "Rare"/"Uncommon"/"Common" prefix
                  UnitCard.jsx's own hw-card-desc already leads with -
                  the glow above is the at-a-glance signal, this is the
                  same information in text for anyone who can't (or
                  doesn't want to) rely on color alone. */}
              <div className="hw-card-desc">
                {relic.tier[0].toUpperCase() + relic.tier.slice(1)} · {relic.description}
              </div>
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
