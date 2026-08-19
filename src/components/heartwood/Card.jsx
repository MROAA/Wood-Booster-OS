import { motion } from "framer-motion"
import { CardGlyph } from "./cardArt"

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
      <div className="hw-card-desc">{def.description}</div>
    </motion.div>
  )
}
