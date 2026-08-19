import { motion } from "framer-motion"
import { CardGlyph, formatPowerLabel } from "./cardArt"

const ICON_BY_EFFECT = { damage: "sword", block: "shield", heal: "heart", draw: "drawIcon", loseHp: "heart" }
const NEGATIVE_EFFECT = { loseHp: true }

// A row of icon+number pairs, promoted to the card's main visual - the
// point is to read "sword 12" at a glance instead of parsing a
// sentence. A turn-repeating power (addTrigger, e.g. The Emperor) is
// unwrapped to its inner effect and gets a small "/turn" suffix rather
// than its own separate representation.
function iconEntries(effects) {
  const entries = []
  for (const e of effects) {
    if (e.type === "addTrigger" && ICON_BY_EFFECT[e.effect?.type]) {
      entries.push({ type: e.effect.type, amount: e.effect.amount, perTurn: true })
    } else if (ICON_BY_EFFECT[e.type] && typeof e.amount === "number") {
      entries.push({ type: e.type, amount: e.amount })
    }
  }
  return entries
}

function EffectIcons({ effects }) {
  const entries = iconEntries(effects)
  if (entries.length === 0) return null
  return (
    <div className="hw-effect-icons">
      {entries.map((e, i) => (
        <span key={i} className="hw-effect-icon" data-negative={!!NEGATIVE_EFFECT[e.type]}>
          <CardGlyph name={ICON_BY_EFFECT[e.type]} className="hw-effect-icon-glyph" />
          {NEGATIVE_EFFECT[e.type] ? "-" : ""}
          {e.amount}
          {e.perTurn ? "/turn" : ""}
        </span>
      ))}
    </div>
  )
}

// A handful of short tags for whatever the icon row can't say -
// exhaust/once/pattern flags, and the few effect types with no icon
// (random outcomes, repositioning, energy, buffs other than the
// damage/block/heal/draw set). Labels, not sentences.
function mechanicTags(def) {
  const tags = []
  if (def.pattern === "knight") tags.push("Knight move")
  if (def.pattern === "rook") tags.push("Whole row")
  if (def.pattern === "bishop") tags.push("Diagonals")
  if (def.costReducedIfBlocked) tags.push("Cheaper if Blocked")
  if (def.unplayable) tags.push("Unplayable")
  for (const e of def.effects) {
    if (e.type === "random") tags.push("Random")
    else if (e.type === "move") tags.push("Reposition")
    else if (e.type === "gainEnergy") tags.push(`Energy +${e.amount}`)
    else if (e.type === "discardHandThenDraw") tags.push("Redraw hand")
    else if (e.type === "applyBuff") tags.push(`${formatPowerLabel(e.id)} +${e.amount}`)
  }
  if (def.exhaust) tags.push("Exhaust")
  if (def.once) tags.push("Once per fight")
  return tags
}

export default function Card({ def, playable, selected, onPlay }) {
  const tags = mechanicTags(def)
  return (
    <motion.div
      className={`hw-card hw-card--${def.type}`}
      data-disabled={!playable}
      data-selected={!!selected}
      onClick={playable ? onPlay : undefined}
      whileHover={playable ? { y: -8 } : undefined}
      whileTap={playable ? { scale: 0.97 } : undefined}
      title={def.flavor}
    >
      <div className="hw-card-head">
        <span className="hw-card-cost">{def.cost}</span>
      </div>
      <CardGlyph name={def.art} className="hw-card-art" />
      <div className="hw-card-name">{def.name}</div>
      <EffectIcons effects={def.effects} />
      {tags.length > 0 && (
        <div className="hw-card-tags">
          {tags.map((tag) => (
            <span key={tag} className="hw-card-tag">
              {tag}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  )
}
