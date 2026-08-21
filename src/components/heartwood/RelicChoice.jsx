import { RELICS, RELIC_REROLL_COST } from "../../data/heartwood/relics"
import { CardGlyph } from "./cardArt"

// The relic-pick beat: same "3 choices or skip" shape as the old
// RewardScreen.jsx, but relics aren't units - no HP/attack numbers, so
// this is its own small card layout instead of reusing UnitCard.jsx.
// Same cost-badge/data-disabled pattern UnitCard.jsx already uses, now
// that relics cost Essence instead of being free.
export default function RelicChoice({ runState, onChoose, onReroll }) {
  const options = (runState.relicOffers || []).map((id) => RELICS[id]).filter(Boolean)

  return (
    <div className="hw-intro">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>A relic waits in the roots</h1>
        <span className="hw-badge hw-essence-badge" title="Essence">
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
