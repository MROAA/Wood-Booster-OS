// Hearthwood - "The forest" meter: how the forest sees you (Forest Regard,
// First Song PRD §6). A -100..100 bar with the current band and what the
// forest's creatures do about it. Rules: services/heartwood/forestRegard.js.
import { regardBand, REGARD_MIN, REGARD_MAX } from "../../data/heartwood/creatures"
import { regardOf } from "../../services/heartwood/forestRegard"
import "./heartwood-creatures.css"

export default function ForestRegard({ runState, compact = false }) {
  const regard = regardOf(runState)
  const band = regardBand(regard)
  const pct = ((regard - REGARD_MIN) / (REGARD_MAX - REGARD_MIN)) * 100
  const last = (runState?.regardLog || []).slice(-1)[0]
  return (
    <div className="hw-forest-regard" data-forest-regard={band.id} data-compact={compact || undefined} style={{ "--hw-regard-colour": band.color }}>
      <div className="hw-forest-regard-head">
        <span className="hw-forest-regard-title">🌲 The forest</span>
        <span className="hw-forest-regard-band">{band.name}</span>
        <span className="hw-forest-regard-num">{regard > 0 ? `+${regard}` : regard}</span>
      </div>
      <div className="hw-forest-regard-bar" aria-hidden="true">
        <span className="hw-forest-regard-mid" />
        <span className="hw-forest-regard-marker" style={{ left: `${pct}%` }} />
      </div>
      {!compact && <div className="hw-forest-regard-text">{band.text}</div>}
      {!compact && last?.why && (
        <div className="hw-forest-regard-last">
          Last: {last.why} ({last.delta > 0 ? `+${last.delta}` : last.delta})
        </div>
      )}
    </div>
  )
}
