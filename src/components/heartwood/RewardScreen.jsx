import { useMemo } from "react"
import Card from "./Card"
import { rewardPool } from "../../services/heartwood/runEngine"

function pickThree(pool) {
  const shuffled = [...pool]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, 3)
}

// The deck-building beat: one card at a time, chosen from the real
// Arcana pool - no separate reward-card system, just Card.jsx reused
// exactly as it already is on the deck-preview grid.
export default function RewardScreen({ runState, onChoose }) {
  const options = useMemo(() => pickThree(rewardPool(runState)), [runState.nodeIndex])

  return (
    <div className="hw-intro">
      <h1 style={{ fontSize: 22, marginBottom: 6 }}>A card remembers you</h1>
      <p className="hw-flavor">Choose one to carry with you, or leave all three behind.</p>
      <div className="hw-select-grid hw-deck-preview">
        {options.map((def) => (
          <Card key={def.id} def={def} playable onPlay={() => onChoose(def.id)} />
        ))}
      </div>
      <button className="hw-move-btn" onClick={() => onChoose(null)} style={{ marginTop: 12 }}>
        Skip
      </button>
    </div>
  )
}
