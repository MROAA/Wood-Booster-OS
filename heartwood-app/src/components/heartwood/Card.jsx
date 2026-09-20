import { motion } from "framer-motion"
import { CardGlyph } from "./cardArt"

const ICON_BY_EFFECT = { damage: "sword", block: "shield", heal: "heart", draw: "drawIcon", loseHp: "heart" }
const NEGATIVE_EFFECT = { loseHp: true }

// A row of icon+number pairs above the description - lets the numbers
// that matter be read before the sentence, not instead of it. A
// turn-repeating power (addTrigger, e.g. The Emperor) is unwrapped to
// its inner effect and gets a small "/turn" suffix rather than its own
// separate representation.
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

// Icons alone read as unclear on their own ("pelkät kuvakkeet ei
// toimi") - the description line is what actually explains a card, the
// icons just let the key numbers be scanned before reading it. Keeping
// both means no separate mechanic-tag system is needed anymore - the
// description sentence already says "Exhaust", "Ignores shielding",
// etc., so a second tag row saying the same thing would be the
// opposite of minimal.
export default function Card({ def, playable, selected, onPlay }) {
  return (
    <motion.div
      layout
      className={`hw-card hw-card--${def.type}`}
      data-disabled={!playable}
      data-selected={!!selected}
      onClick={playable ? onPlay : undefined}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ y: -170, opacity: 0, scale: 0.6, transition: { duration: 0.35, ease: "easeIn" } }}
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
      <div className="hw-card-desc">{def.description}</div>
    </motion.div>
  )
}
