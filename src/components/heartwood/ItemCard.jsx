import { CardGlyph } from "./cardArt"
import { RARITY_INFO, GEAR_KINDS } from "../../data/heartwood/items"
import { CLASSES } from "../../data/heartwood/classes"
import { recipeHintText } from "../../services/heartwood/gear"

// A small purchasable-or-owned item card - mirrors UnitCard.jsx's
// icon+name+cost shape, but items have none of a unit's fields
// (movePattern/tier/HP), so this stays deliberately lighter than a
// full UnitCard rather than stretching that component to fit both.
//
// Gear sprint: a RARITY frame (Common / Rare / Epic / Legendary), the
// gear kind (Weapon / Offhand / Armor / Charm / Collar), and plain-English
// lines for what makes gear interesting - row adjacency ("Next to: ..."),
// board auras ("Aura: ..."), recipes ("Combines: ...") and collars.
// `locked` / `onToggleLock`: the shop's per-offer lock.
export default function ItemCard({ def, selected, disabled, onClick, locked, onToggleLock }) {
  const rarity = RARITY_INFO[def.rarity] || RARITY_INFO.common
  const kind = GEAR_KINDS[def.kind]
  const combines = recipeHintText(def.id)
  const collarClass = def.kind === "collar" ? CLASSES[def.collarClass] : null
  return (
    <div
      className="hw-card hw-card--skill hw-item-card"
      data-disabled={!!disabled}
      data-selected={!!selected}
      data-tier={def.tier}
      data-rarity={def.rarity}
      data-item-id={def.id}
      data-locked={locked || undefined}
      style={{ "--hw-rarity": rarity.color }}
      onClick={!disabled ? onClick : undefined}
      title={def.description}
    >
      <div className="hw-card-head">
        <span className="hw-card-cost">{def.cost}</span>
        <span className="hw-item-rarity" data-rarity={def.rarity}>
          {rarity.name}
        </span>
        {onToggleLock && (
          <button
            type="button"
            className="hw-item-lock"
            data-item-lock={locked ? "on" : "off"}
            title={locked ? "Locked - stays in the shop through rerolls and into your next visit. Click to unlock." : "Lock this offer so a reroll or the next visit keeps it"}
            onClick={(e) => {
              e.stopPropagation()
              onToggleLock()
            }}
          >
            {locked ? "🔒" : "🔓"}
          </button>
        )}
      </div>
      {/* Real icon art (this round's own kuvia-folder pass, mirroring
          UnitCard.jsx's def.image-vs-glyph branch) - falls back to the
          SVG glyph for every item the art pass didn't find a plausible
          match for, exactly like a unit without a portrait yet. */}
      {def.image ? (
        <img src={def.image} alt="" className="hw-card-art" />
      ) : (
        <CardGlyph name={def.icon} className="hw-card-art" />
      )}
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
      {kind && (
        <div className="hw-item-kind" data-kind={def.kind}>
          {kind.name}
        </div>
      )}
      <div className="hw-card-desc">{def.description}</div>
      {collarClass && (
        <div className="hw-item-line hw-item-line--collar" data-collar-class={collarClass.id}>
          {collarClass.icon} Class: {collarClass.name}
        </div>
      )}
      {def.adj && (
        <div className="hw-item-line hw-item-line--adj" data-item-adj>
          ⟷ Next to it: {def.adj.text}
        </div>
      )}
      {def.aura && (
        <div className="hw-item-line hw-item-line--aura" data-item-aura={def.aura.type}>
          ◌ Aura: {def.aura.text}
        </div>
      )}
      {combines && (
        <div className="hw-item-line hw-item-line--recipe" data-recipe-hint title="Put these side by side in one hero's gear row">
          ⚗ Combines: {combines}
        </div>
      )}
    </div>
  )
}
