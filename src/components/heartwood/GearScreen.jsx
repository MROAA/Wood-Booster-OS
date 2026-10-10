import { CardGlyph } from "./cardArt"
import GearRow from "./GearRow"
import ItemCard from "./ItemCard"
import { ITEMS, RARITY_INFO } from "../../data/heartwood/items"
import { UNITS } from "../../data/heartwood/units"
import { CHARACTERS } from "../../data/heartwood/characters"
import { CLASSES } from "../../data/heartwood/classes"
import { RESOURCES } from "../../data/heartwood/resources"
import { gearRow, rowEffects, fxText, collarIn, equipBlocker, recipeHintText, AURA_LABEL, COMMANDER_KEY } from "../../services/heartwood/gear"
import { heroClassId, heroResourceId } from "../../services/heartwood/unitLevels"
import { effectiveItemSlots, itemSellPrice } from "../../services/heartwood/runEngine"

// Gear sprint - the GEAR SCREEN: one hero's gear row, big. Arrows (or a
// drag) move items along the row, the summary says in plain words what
// the row adds up to (adjacency links, board auras, resource gear), and
// the bag below equips into the first free slot. A Class Collar shows
// "Natural class: X · Wearing: Y collar".
export default function GearScreen({ runState, ownerKey, onClose, onEquip, onUnequip, onMove, onSell }) {
  const slots = effectiveItemSlots(runState)
  const isCommander = ownerKey === COMMANDER_KEY
  const entry = isCommander ? null : runState.bench.find((e) => e.key === ownerKey)
  const def = entry ? UNITS[entry.defId] : null
  const name = isCommander ? CHARACTERS[runState.characterId]?.name || "Commander" : def?.name || "Hero"
  const collar = collarIn(runState.items, ownerKey)
  const natural = entry ? CLASSES[heroClassId(entry)] : null
  const worn = collar ? CLASSES[collar.collarClass] : null
  const resId = worn ? worn.resource : entry ? heroResourceId(entry) : null
  const row = gearRow(runState.items, ownerKey, slots)
  const { fx, auras, links } = rowEffects(row, resId)
  const bag = runState.items.filter((it) => it.equippedTo == null && ITEMS[it.defId])
  const firstFree = row.indexOf(null)

  return (
    <div className="hw-gear-screen-backdrop" onClick={onClose}>
      <div className="hw-gear-screen" data-gear-screen={ownerKey} onClick={(e) => e.stopPropagation()}>
        <button className="hw-gear-close" onClick={onClose} title="Close">
          ✕
        </button>
        <div className="hw-screen-eyebrow">Gear</div>
        <h2 className="hw-gear-title">{name}</h2>
        {!isCommander && natural && (
          <div className="hw-gear-class-line" data-gear-class-line data-collar={collar?.id || undefined}>
            Natural class: {natural.icon} {natural.name}
            {worn && (
              <>
                {" "}· <b>Wearing: {worn.icon} {worn.name} collar</b> - fights as a {worn.name}
              </>
            )}
            {resId && RESOURCES[resId] && <span className="hw-gear-res"> · Resource: {RESOURCES[resId].name}</span>}
          </div>
        )}
        <p className="hw-gear-help">Any item fits any slot - the order is the puzzle. Drag an item onto another slot (or use the arrows) to move it.</p>

        <GearRow items={runState.items} ownerKey={ownerKey} slots={slots} resourceId={resId} onMove={(a, b) => onMove(ownerKey, a, b)} size="big" onSlotClick={() => {}} />

        <div className="hw-gear-slots-detail">
          {row.map((it, i) => {
            const d = it ? ITEMS[it.defId] : null
            return (
              <div key={i} className="hw-gear-detail" data-gear-detail={i}>
                {d ? (
                  <>
                    <ItemCard def={d} />
                    <div className="hw-gear-detail-actions">
                      <button className="hw-move-btn" data-gear-left={i} disabled={i === 0} onClick={() => onMove(ownerKey, i, i - 1)} title="Move left">
                        ◀
                      </button>
                      <button className="hw-move-btn" data-gear-unequip={i} onClick={() => onUnequip(it.key)} title="Back to the bag">
                        Off
                      </button>
                      <button className="hw-move-btn" data-gear-right={i} disabled={i === row.length - 1} onClick={() => onMove(ownerKey, i, i + 1)} title="Move right">
                        ▶
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="hw-gear-empty">Slot {i + 1}: empty</div>
                )}
              </div>
            )
          })}
        </div>

        <div className="hw-gear-summary" data-gear-summary>
          <div>
            <b>This row gives:</b> {fxText(fx) || "nothing yet"}
          </div>
          {links.length > 0 && (
            <div data-gear-links={links.length}>
              <b>Next-to bonuses:</b>{" "}
              {links.map((l, i) => (
                <span key={i} className="hw-gear-summary-link">
                  {ITEMS[row[l.from].defId]?.name} + {ITEMS[row[l.to].defId]?.name}: {l.text}
                  {i < links.length - 1 ? " · " : ""}
                </span>
              ))}
            </div>
          )}
          {auras.length > 0 && (
            <div data-gear-auras={auras.length}>
              <b>Board aura:</b> allies standing next to {name} on the battlefield get {auras.map((a) => AURA_LABEL[a.type]?.(a.amount)).join(", ")}.
            </div>
          )}
        </div>

        <div className="hw-hearth-section-label">Bag</div>
        {bag.length === 0 ? (
          <p className="hw-rail-empty">Nothing in the bag.</p>
        ) : (
          <div className="hw-gear-bag">
            {bag.map((it) => {
              const d = ITEMS[it.defId]
              const blocker = equipBlocker(runState, it.key, ownerKey)
              const hint = recipeHintText(d.id)
              return (
                <div key={it.key} className="hw-gear-bag-item" data-gear-bag={it.defId} style={{ "--hw-rarity": RARITY_INFO[d.rarity]?.color }}>
                  <CardGlyph name={d.icon} className="hw-intent-glyph" />
                  <span title={`${d.description}${hint ? `\nCombines: ${hint}` : ""}`}>{d.name}</span>
                  <button
                    className="hw-move-btn"
                    data-gear-equip={it.key}
                    disabled={!!blocker || firstFree === -1}
                    title={blocker || (firstFree === -1 ? "The row is full - take something off first" : `Put it in slot ${firstFree + 1}`)}
                    onClick={() => onEquip(it.key, ownerKey, firstFree)}
                  >
                    Equip
                  </button>
                  {onSell && (
                    <button className="hw-move-btn" data-gear-sell={it.key} onClick={() => onSell(it.key)} title="Sell it back">
                      Sell +{itemSellPrice(runState, d.id)}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
