import { BUILD_SETS } from "../../data/heartwood/buildSets"
import { CardGlyph } from "./cardArt"

// The celebration when a build set reaches a new 2 / 4 / 6 tier
// (buildSets.js). `tierKeys` = ["wellspring:2", ...] newly reached;
// the player taps it away (onDone acks them so it never repeats).
export default function SetTierBanner({ tierKeys, onDone }) {
  const entries = (tierKeys || [])
    .map((k) => {
      const [id, n] = k.split(":")
      const set = BUILD_SETS[id]
      return set ? { set, tier: Number(n), bonus: set.tiers[n] } : null
    })
    .filter(Boolean)
  if (!entries.length) return null
  return (
    <div className="hw-set-tier-overlay" role="dialog" aria-label="Set bonus unlocked" onClick={onDone}>
      {entries.map(({ set, tier, bonus }) => (
        <div key={`${set.id}:${tier}`} className="hw-set-tier-banner" data-set={set.id} style={{ "--hw-set": set.color }}>
          <div className="hw-set-tier-rays" aria-hidden="true" />
          <CardGlyph name={set.icon} className="hw-set-tier-glyph" />
          <div className="hw-set-tier-eyebrow">Set bonus · {tier} pieces</div>
          <div className="hw-set-tier-name">{set.name}</div>
          <div className="hw-set-tier-text">{bonus?.text}</div>
        </div>
      ))}
      <button type="button" className="hw-set-tier-ok" onClick={onDone}>
        Onward
      </button>
    </div>
  )
}
