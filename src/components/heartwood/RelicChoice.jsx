import { RELICS } from "../../data/heartwood/relics"
import { CardGlyph } from "./cardArt"

// The relic-pick beat: same "3 choices or skip" shape as the old
// RewardScreen.jsx, but relics aren't units - no HP/attack numbers, so
// this is its own small card layout instead of reusing UnitCard.jsx.
export default function RelicChoice({ runState, onChoose }) {
  const options = (runState.relicOffers || []).map((id) => RELICS[id]).filter(Boolean)

  return (
    <div className="hw-intro">
      <h1 style={{ fontSize: 22, marginBottom: 6 }}>A relic waits in the roots</h1>
      <p className="hw-flavor">Choose one to carry for the rest of this run, or leave it behind.</p>
      <div className="hw-select-grid hw-deck-preview">
        {options.map((relic) => (
          <div key={relic.id} className="hw-card hw-card--power" onClick={() => onChoose(relic.id)}>
            <CardGlyph name={relic.icon} className="hw-card-glyph" />
            <div className="hw-card-name">{relic.name}</div>
            <div className="hw-card-desc">{relic.description}</div>
          </div>
        ))}
      </div>
      <button className="hw-move-btn" onClick={() => onChoose(null)} style={{ marginTop: 12 }}>
        Skip
      </button>
    </div>
  )
}
