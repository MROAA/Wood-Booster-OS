import { UNITS } from "../../data/heartwood/units"
import UnitCard from "./UnitCard"
import { CardGlyph } from "./cardArt"

// The shop node: recruit whoever you can afford, reroll the rest,
// leave when ready. No forced pick-one - unlike the old card-reward
// screen, a shop lets you walk away empty-handed or buy several.
export default function SquadDraft({ runState, onRecruit, onReroll, onContinue, showIntro, onDismissIntro }) {
  const offers = runState.shopOffers.map((id) => UNITS[id])

  return (
    <div className="hw-intro">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>The Heartwood Market</h1>
        <span className="hw-badge hw-essence-badge" title="Essence">
          <CardGlyph name="spark" className="hw-intent-glyph" />
          {runState.essence}
        </span>
      </div>

      {showIntro && (
        <div className="hw-hint hw-hint--tutorial" style={{ marginTop: 14 }}>
          <span>
            Recruit units, place up to 4 on the grid, then watch them fight automatically. Win to earn Essence and
            press on - lose, and the run ends.
          </span>
          <div className="hw-tutorial-actions">
            <button className="hw-tutorial-next" onClick={onDismissIntro}>
              Got it
            </button>
          </div>
        </div>
      )}

      <p className="hw-flavor" style={{ marginTop: 14 }}>
        Recruit who you can afford, or move on.
      </p>

      <div className="hw-section-label">For sale</div>
      <div className="hw-select-grid hw-deck-preview">
        {offers.map((def) => (
          <UnitCard key={def.id} def={def} disabled={runState.essence < def.recruitCost} onClick={() => onRecruit(def.id)} />
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
        <button
          className="hw-move-btn"
          disabled={runState.essence < runState.rerollCost || offers.length === 0}
          onClick={onReroll}
        >
          Reroll ({runState.rerollCost} Essence)
        </button>
        <button className="hw-end-turn" onClick={onContinue}>
          Continue
        </button>
      </div>

      <div className="hw-section-label" style={{ marginTop: 20 }}>
        Your bench ({runState.bench.length})
      </div>
      <div className="hw-select-grid hw-deck-preview">
        {runState.bench.map((entry) => (
          <UnitCard key={entry.key} def={UNITS[entry.defId]} disabled />
        ))}
      </div>
    </div>
  )
}
