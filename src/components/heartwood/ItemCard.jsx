import { CardGlyph } from "./cardArt"

// A small purchasable-or-owned item card - mirrors UnitCard.jsx's
// icon+name+cost shape, but items have none of a unit's fields
// (movePattern/tier/HP), so this stays deliberately lighter than a
// full UnitCard rather than stretching that component to fit both.
export default function ItemCard({ def, selected, disabled, onClick }) {
  return (
    <div
      className="hw-card hw-card--skill hw-item-card"
      data-disabled={!!disabled}
      data-selected={!!selected}
      data-tier={def.tier}
      onClick={!disabled ? onClick : undefined}
      title={def.description}
    >
      <div className="hw-card-head">
        <span className="hw-card-cost">{def.cost}</span>
      </div>
      <CardGlyph name={def.icon} className="hw-card-art" />
      <div className="hw-card-name">
        {def.name}
        {/* Hero Bending (items.js's bendsRoleTo) - runEngine.js's item
            shop rotation now guarantees one of these shows up every
            visit, so it needs to actually stand out from a stat item
            at a glance, not just in the description text below. */}
        {def.bendsRoleTo && (
          <span className="hw-badge hw-badge--bent" title={`Bends the wearer toward ${def.bendsRoleTo}`}>
            Bends
          </span>
        )}
      </div>
      <div className="hw-card-desc">{def.description}</div>
    </div>
  )
}
