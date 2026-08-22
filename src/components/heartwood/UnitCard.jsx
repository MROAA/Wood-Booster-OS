import { CardGlyph } from "./cardArt"

const ICON_BY_MOVE = { attack: "sword", block: "shield", heal: "heart" }
const ROLE_ACCENT = { dps: "attack", tank: "power", support: "skill", hybrid: "skill" }

// The same icon+number-then-a-line reading pattern proven readable for
// cards this session, reused for units - a unit's movePattern already
// carries the same sword/shield/heart vocabulary a card's effects did.
// `def.image`, when present, renders as a full portrait instead of the
// small SVG glyph medallion - bigger, more atmospheric card, same info
// underneath. Falls back to the glyph for every unit without one yet.
export default function UnitCard({ def, selected, disabled, onClick }) {
  const moves = def.movePattern.filter((m) => ICON_BY_MOVE[m.type])
  return (
    <div
      className={`hw-card hw-card--${ROLE_ACCENT[def.role] || "skill"}`}
      data-disabled={!!disabled}
      data-selected={!!selected}
      data-portrait={!!def.image}
      onClick={!disabled ? onClick : undefined}
      title={def.name}
    >
      <div className="hw-card-head">
        <span className="hw-card-cost">{def.recruitCost ?? "★"}</span>
      </div>
      {def.image ? (
        <img src={def.image} alt="" className="hw-card-portrait" />
      ) : (
        <CardGlyph name={def.art} className="hw-card-art" />
      )}
      <div className="hw-card-name">{def.name}</div>
      <div className="hw-effect-icons">
        {moves.map((m, i) => (
          <span key={i} className="hw-effect-icon">
            <CardGlyph name={ICON_BY_MOVE[m.type]} className="hw-effect-icon-glyph" />
            {m.amount}
          </span>
        ))}
      </div>
      <div className="hw-card-desc">
        {def.tier[0].toUpperCase() + def.tier.slice(1)}
        {def.displayTier === 2 ? " Tier 2" : ""} &middot; HP {def.maxHp}
        {def.attackPattern !== "single" ? ` · ${def.attackPattern}` : ""}
        {def.haste ? " · haste" : ""}
      </div>
    </div>
  )
}
