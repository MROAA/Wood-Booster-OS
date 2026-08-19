import { CARDS } from "../../data/heartwood/cards"
import Card from "./Card"

// `needsTarget`/`candidateCount` let a card that requires a specific
// enemy (any "damage" effect) be disabled when the grid currently has
// zero legal targets for it, e.g. every piece is shielded.
function needsTarget(def) {
  return def.effects.some((e) => e.type === "damage")
}

export default function Hand({ hand, energy, playerBlock, candidateCount, onCardClick, interactive }) {
  return (
    <div className="hw-hand">
      {hand.map((instance) => {
        const def = CARDS[instance.defId]
        const effectiveCost =
          def.costReducedIfBlocked && playerBlock > 0
            ? Math.max(0, def.cost - def.costReducedIfBlocked)
            : def.cost
        const hasLegalTarget = !needsTarget(def) || candidateCount(def) > 0
        const playable = interactive && !def.unplayable && effectiveCost <= energy && hasLegalTarget
        return (
          <Card
            key={instance.instanceId}
            def={def}
            playable={playable}
            onPlay={() => onCardClick(instance.instanceId)}
          />
        )
      })}
    </div>
  )
}
