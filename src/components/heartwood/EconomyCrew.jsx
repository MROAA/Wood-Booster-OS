import { useMemo } from "react"
import { economyCrew, economyCrewEffects } from "../../services/heartwood/runEngine"
import { CardGlyph } from "./cardArt"

// The Economy crew panel (economy.js, Economy System PRD 30-31). Shows
// which economy units are on the board right now and the flat run-layer
// edge each one is buying you - recruits cheaper, interest sooner, wins
// paying more, rerolls held flat. Pure display; renders nothing until an
// economy unit is actually deployed (the effects only apply while
// deployed). The recruit-cost labels, the interest badge and the win
// preview already move on their own - this panel is the "why".
export default function EconomyCrew({ runState }) {
  const { crew, effects } = useMemo(
    () => ({ crew: economyCrew(runState), effects: economyCrewEffects(runState) }),
    [runState],
  )
  if (crew.length === 0) return null

  const lineFor = (role) => {
    switch (role) {
      case "merchant":
        return `recruits −${Math.round(effects.recruitPct * 100)}%`
      case "banker":
        return `interest from ${effects.interestThreshold}`
      case "forager":
        return `+${effects.winBonus} Essence / win`
      case "toll-warden":
        return "reroll cost holds flat"
      default:
        return null
    }
  }

  return (
    <div className="hw-rail-section hw-economy-crew" aria-label="Economy crew">
      <div className="hw-section-label hw-rail-label">Economy crew</div>
      <div className="hw-rail-list">
        {crew.map((u) => (
          <div className="hw-economy-crew-row" key={u.key} title={`${u.label} - active while deployed`}>
            <CardGlyph name="cosmic" className="hw-intent-glyph" />
            <span className="hw-economy-crew-name">{u.label}</span>
            <span className="hw-economy-crew-effect">{lineFor(u.role)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
