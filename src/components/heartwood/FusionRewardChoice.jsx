// Fusion reward (docs/hearthwood-fusion-design.md) - after three heroes
// fuse, pick one of three rewards. Shown by SquadDraft's piece_overlays,
// so it appears on the Market, in Headquarters and on the classic layout.
// Data: runState.pendingFusionRewards[0] (runEngine's rollFusionReward);
// applying: runEngine's chooseFusionReward via onChoose(rewardId).
import { UNITS } from "../../data/heartwood/units"
import { FUSION_REWARDS } from "../../services/heartwood/runEngine"
import { CardGlyph } from "./cardArt"
import "./fusion-reward.css"

export default function FusionRewardChoice({ reward, onChoose }) {
  if (!reward) return null
  const hero = UNITS[reward.defId]
  return (
    <div className="hw-fusion-overlay" role="dialog" aria-label="Fusion reward">
      <div className="hw-fusion-panel" data-tier={reward.tier}>
        <div className="hw-fusion-burst" aria-hidden="true" />
        <span className="hw-fusion-kicker">Fusion · Tier {reward.tier}</span>
        <h2 className="hw-fusion-title">{hero?.name || "Your hero"}</h2>
        <p className="hw-fusion-sub">Three became one. Choose a reward.</p>
        <div className="hw-fusion-options">
          {reward.options.map((opt) => {
            const kind = FUSION_REWARDS[opt.id]
            if (!kind) return null
            return (
              <button key={opt.id} type="button" className="hw-fusion-option" data-reward={opt.id} onClick={() => onChoose(opt.id)}>
                <span className="hw-fusion-option-gem">
                  <CardGlyph name={kind.icon} className="hw-fusion-option-icon" />
                </span>
                <span className="hw-fusion-option-name">{kind.name}</span>
                <span className="hw-fusion-option-text">{kind.text(opt)}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
