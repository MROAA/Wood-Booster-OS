import { motion } from "framer-motion"
import { CardGlyph } from "./cardArt"

const ICON_BY_EFFECT = { damage: "sword", block: "shield", heal: "heart", draw: "drawIcon" }

// A row of icon+number pairs summarizing what a card does, so it reads
// visually (sword=12) instead of requiring the sentence below to be
// read first. Effects without a simple icon (random, moves, triggers)
// are silently skipped here - the text description still covers them.
function EffectIcons({ effects }) {
  const shown = effects.filter((e) => ICON_BY_EFFECT[e.type] && typeof e.amount === "number")
  if (shown.length === 0) return null
  return (
    <div className="hw-effect-icons">
      {shown.map((e, i) => (
        <span key={i} className="hw-effect-icon">
          <CardGlyph name={ICON_BY_EFFECT[e.type]} className="hw-effect-icon-glyph" />
          {e.amount}
        </span>
      ))}
    </div>
  )
}

export default function Card({ def, playable, onPlay }) {
  return (
    <motion.div
      className={`hw-card hw-card--${def.type}`}
      data-disabled={!playable}
      onClick={playable ? onPlay : undefined}
      whileHover={playable ? { y: -8 } : undefined}
      whileTap={playable ? { scale: 0.97 } : undefined}
      title={def.flavor}
    >
      <div className="hw-card-head">
        <span className="hw-card-cost">{def.cost}</span>
        <span className="hw-badge">{def.type}</span>
      </div>
      <CardGlyph name={def.art} className="hw-card-glyph" />
      <div className="hw-card-name">{def.name}</div>
      <EffectIcons effects={def.effects} />
      <div className="hw-card-desc">{def.description}</div>
    </motion.div>
  )
}
