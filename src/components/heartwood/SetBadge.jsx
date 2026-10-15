import { BUILD_SETS, SET_TIERS } from "../../data/heartwood/buildSets"
import { CardGlyph } from "./cardArt"

// A build-set family chip for a relic / gear card (buildSets.js): which
// family the piece belongs to, how many of that family you already own,
// and the next tier it pushes toward - so the shop reads as "plan toward".
export default function SetBadge({ setId, owned = 0, isOwnedPiece = false }) {
  const set = BUILD_SETS[setId]
  if (!set) return null
  const after = isOwnedPiece ? owned : owned + 1
  const next = SET_TIERS.find((n) => n > owned)
  const completes = !isOwnedPiece && next && after >= next
  return (
    <div
      className="hw-set-badge"
      data-set={set.id}
      data-completes={completes || undefined}
      style={{ "--hw-set": set.color }}
      title={`${set.name} set: ${set.blurb} You own ${owned}.${next ? ` ${next} pieces: ${set.tiers[next].text}` : " Set complete!"}`}
    >
      <CardGlyph name={set.icon} className="hw-set-badge-glyph" />
      <span className="hw-set-badge-name">{set.name}</span>
      <span className="hw-set-badge-count">
        {owned}/{next || SET_TIERS[SET_TIERS.length - 1]}
      </span>
      {completes && <span className="hw-set-badge-next">→ tier {next}!</span>}
    </div>
  )
}
