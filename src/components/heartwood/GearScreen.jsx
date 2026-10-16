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
import { effectiveItemSlots, itemSellPrice, runActNow } from "../../services/heartwood/runEngine"
// Dota depth sprint: build paths + forging.
import { buildPathsFor, chosenBuildId, pathProgress, forgeBlocker, recipePartsText } from "../../services/heartwood/itemForge"
import { BUILD_TIERS } from "../../data/heartwood/itemBuilds"

// Dota depth sprint - the BUILD PATH view: pick one of the hero's 2-3
// paths, see each step (what it needs, what you have) and forge it.
function BuildPathView({ runState, ownerKey, onChooseBuild, onForge }) {
  const paths = buildPathsFor(runState, ownerKey)
  if (!paths.length) return null
  const act = runActNow(runState)
  const chosen = chosenBuildId(runState, ownerKey)
  const path = paths.find((p) => p.id === chosen) || paths[0]
  return (
    <div className="hw-build-view" data-build-path-view={ownerKey} data-chosen={chosen || undefined}>
      <div className="hw-hearth-section-label">Build path</div>
      <div className="hw-build-paths">
        {paths.map((p) => (
          <button
            key={p.id}
            type="button"
            className="hw-build-path-btn"
            data-build-path={p.id}
            data-chosen={p.id === chosen || undefined}
            disabled={!onChooseBuild}
            onClick={() => onChooseBuild?.(ownerKey, p.id)}
            title={`${p.text}${p.id === chosen ? " (chosen - click again to clear)" : " Choose it: the shop marks the parts it still needs."}`}
          >
            {p.icon} {p.name}
          </button>
        ))}
      </div>
      <p className="hw-build-path-text">
        {path.text}
        {!chosen && " Pick a path and the shop will mark its parts."}
      </p>
      <div className="hw-build-steps">
        {pathProgress(runState, path).map((step) => {
          const d = ITEMS[step.itemId]
          const why = step.recipe ? forgeBlocker(runState, step.recipe.id, act) : null
          return (
            <div key={step.itemId} className="hw-build-step" data-build-step={step.itemId} data-have={step.have || undefined}>
              <div className="hw-build-step-name">
                {step.have ? "✓ " : ""}
                {d?.name}
              </div>
              <div className="hw-build-step-tier">
                {BUILD_TIERS[d?.buildTier]?.name || ""}
                {step.recipe ? ` · ${recipePartsText(step.recipe)}` : ""}
              </div>
              {step.parts.map((part, i) => (
                <span key={i} className="hw-build-part" data-have={part.have || undefined}>
                  {part.have ? "✓" : "○"} {ITEMS[part.itemId]?.name}
                </span>
              ))}
              {step.recipe && !step.have && onForge && (
                <div className="hw-build-forge">
                  <button className="hw-move-btn" data-forge={step.recipe.id} disabled={!!why} onClick={() => onForge(step.recipe.id, ownerKey)} title={why || `Forge ${d?.name}: uses the parts${step.recipe.cost ? ` and ${step.recipe.cost} Essence` : ""}.`}>
                    ⚒ Forge{step.recipe.cost ? ` (-${step.recipe.cost})` : ""}
                  </button>
                  {why && <span className="hw-build-why">{why}</span>}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Gear sprint - the GEAR SCREEN: one hero's gear row, big. Arrows (or a
// drag) move items along the row, the summary says in plain words what
// the row adds up to (adjacency links, board auras, resource gear), and
// the bag below equips into the first free slot. A Class Collar shows
// "Natural class: X · Wearing: Y collar".
export default function GearScreen({ runState, ownerKey, onClose, onEquip, onUnequip, onMove, onSell, onForge, onChooseBuild }) {
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

        <BuildPathView runState={runState} ownerKey={ownerKey} onChooseBuild={onChooseBuild} onForge={onForge} />

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
                <div key={it.key} className="hw-gear-bag-item" data-gear-bag={it.defId} data-signature={d.kind === "signature" || undefined} style={{ "--hw-rarity": RARITY_INFO[d.rarity]?.color }}>
                  <CardGlyph name={d.icon} className="hw-intent-glyph" />
                  <span title={`${d.description}${hint ? `\nCombines: ${hint}` : ""}`}>
                    {d.kind === "signature" ? "★ " : ""}
                    {d.name}
                  </span>
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
