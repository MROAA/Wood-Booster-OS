import { CARDS } from "../../data/heartwood/cards"
import Card from "./Card"

export default function Hand({ hand, energy, playerBlock, onPlayCard, interactive }) {
  return (
    <div className="hw-hand">
      {hand.map((instance) => {
        const def = CARDS[instance.defId]
        const effectiveCost =
          def.costReducedIfBlocked && playerBlock > 0
            ? Math.max(0, def.cost - def.costReducedIfBlocked)
            : def.cost
        const playable = interactive && !def.unplayable && effectiveCost <= energy
        return (
          <Card
            key={instance.instanceId}
            def={def}
            playable={playable}
            onPlay={() => onPlayCard(instance.instanceId)}
          />
        )
      })}
    </div>
  )
}
