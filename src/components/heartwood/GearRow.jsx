import { Fragment, useEffect, useRef, useState } from "react"
import { CardGlyph } from "./cardArt"
import { ITEMS, RARITY_INFO, GEAR_KINDS } from "../../data/heartwood/items"
import { gearRow, rowEffects, recipeFor } from "../../services/heartwood/gear"

// Gear sprint: one hero's (or the Commander's) gear ROW - the Backpack
// Battles puzzle in a strip. Each slot shows the item; a glowing link
// between two slots means an adjacency bonus is ON (hover for what it
// does); a ⚗ between two slots means those two will fuse.
//   click an empty slot with a bag item picked -> equip it there
//   click a filled slot -> back to the bag (old behaviour, kept)
//   DRAG a filled slot onto another slot of the same row -> reorder
const SHORT = { attack: "atk", manaRegen: "res/turn", manaMax: "max res", aim: "% hit", hp: "HP" }
function linkLabel(l) {
  if (l.boost) return `+${l.boost}%`
  const [k, v] = Object.entries(l.bonus || {})[0] || []
  return k ? `+${v} ${SHORT[k] || k}` : "+"
}

export default function GearRow({ items, ownerKey, slots, resourceId = null, selectedItemDef, justEquippedSlot, onSlotClick, onMove, size = "small" }) {
  const row = gearRow(items, ownerKey, slots)
  const { links, boosts } = rowEffects(row, resourceId)
  const active = new Set(links.flatMap((l) => [l.from, l.to]))
  const [dragFrom, setDragFrom] = useState(null)
  const dragRef = useRef(null)
  const moveRef = useRef(onMove)
  moveRef.current = onMove

  useEffect(() => {
    if (dragFrom === null) return undefined
    const up = (e) => {
      const from = dragRef.current
      dragRef.current = null
      setDragFrom(null)
      const el = document.elementFromPoint(e.clientX, e.clientY)?.closest?.("[data-gear-slot]")
      if (!el || el.dataset.gearOwner !== String(ownerKey)) return
      const to = Number(el.dataset.gearSlot)
      if (Number.isInteger(to) && to !== from) moveRef.current?.(from, to)
    }
    window.addEventListener("pointerup", up)
    return () => window.removeEventListener("pointerup", up)
  }, [dragFrom, ownerKey])

  return (
    <div className={`hw-gear-row hw-gear-row--${size}`} data-gear-owner={ownerKey} data-pending={!!selectedItemDef || undefined} data-dragging={dragFrom !== null || undefined}>
      {row.map((it, i) => {
        const def = it ? ITEMS[it.defId] : null
        const link = links.find((l) => (l.from === i && l.to === i + 1) || (l.from === i + 1 && l.to === i))
        const recipe = def && row[i + 1] ? recipeFor(it.defId, row[i + 1].defId) : null
        const title = def
          ? `${def.name} (${RARITY_INFO[def.rarity]?.name} ${GEAR_KINDS[def.kind]?.name || ""}) - ${def.description}\nDrag to another slot to move it; click to take it off.`
          : selectedItemDef
            ? `Equip ${selectedItemDef.name} here`
            : "Empty gear slot"
        return (
          <Fragment key={i}>
            <span
              className={`hw-gear-slot${def ? " is-filled" : ""}${justEquippedSlot === `${ownerKey}-${i}` ? " hw-card--reforged" : ""}`}
              data-gear-slot={i}
              data-gear-owner={ownerKey}
              data-item={def?.id}
              data-rarity={def?.rarity}
              data-kind={def?.kind}
              data-adj-active={active.has(i) || undefined}
              data-boosted={boosts[i] ? boosts[i] : undefined}
              data-drag-from={dragFrom === i || undefined}
              style={def ? { "--hw-rarity": RARITY_INFO[def.rarity]?.color } : undefined}
              title={title}
              onPointerDown={
                def && onMove
                  ? (e) => {
                      if (e.button !== 0) return
                      dragRef.current = i
                      setDragFrom(i)
                    }
                  : undefined
              }
              onClick={() => onSlotClick?.(i, it ? it.key : null)}
            >
              {def ? (
                def.image ? (
                  <img src={def.image} alt="" className="hw-intent-glyph" draggable={false} />
                ) : (
                  <CardGlyph name={def.icon} className="hw-intent-glyph" />
                )
              ) : (
                <span className="hw-item-slot-plus">+</span>
              )}
              {def?.kind === "collar" && <span className="hw-gear-collar-dot" title="Class Collar" />}
            </span>
            {i < row.length - 1 && (link || recipe) && (
              <span
                className={`hw-gear-link${recipe ? " is-recipe" : ""}`}
                data-gear-link={link ? `${Math.min(link.from, link.to)}-${Math.max(link.from, link.to)}` : undefined}
                title={recipe ? `These two fuse into ${ITEMS[recipe.result]?.name}` : `${ITEMS[row[link.from].defId]?.name}: ${link.text}`}
              >
                {recipe ? "⚗" : linkLabel(link)}
              </span>
            )}
          </Fragment>
        )
      })}
    </div>
  )
}
