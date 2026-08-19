import { CARDS } from "../../data/heartwood/cards"
import { cardNeedsTarget } from "../../services/heartwood/targeting"
import Card from "./Card"

export default function Hand({ hand, energy, playerBlock, candidateCount, onCardClick, interactive }) {
  return (
    <div className="hw-hand">
      {hand.map((instance) => {
        const def = CARDS[instance.defId]
        const effectiveCost =
          def.costReducedIfBlocked && playerBlock > 0
            ? Math.max(0, def.cost - def.costReducedIfBlocked)
            : def.cost
        const hasLegalTarget = !cardNeedsTarget(def) || candidateCount(def) > 0
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
