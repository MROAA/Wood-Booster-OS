import { useEffect, useRef, useState } from "react"
import { UNITS, upgradeCost } from "../../data/heartwood/units"
import { RELICS } from "../../data/heartwood/relics"
import { ITEMS, itemPool, effectiveRole } from "../../data/heartwood/items"
import { CHARACTERS, COMMANDER_RANK_MAX, commanderRankCost } from "../../data/heartwood/characters"
import { ENEMIES } from "../../data/heartwood/enemies"
import { resolveFormation } from "../../data/heartwood/formations"
import { tribesOf } from "../../data/heartwood/synergies"
import {
  REFORGE_COST,
  RETRAIN_COST,
  effectiveItemSlots,
  MARKET_LEVEL_MAX,
  MARKET_LEVEL_UNLOCKS,
  marketLevelCost,
  benchTribeCounts,
} from "../../services/heartwood/runEngine"
import UnitCard from "./UnitCard"
import ItemCard from "./ItemCard"
import { CardGlyph } from "./cardArt"

// The shop node: recruit whoever you can afford, reroll the rest,
// leave when ready. No forced pick-one - unlike the old card-reward
// screen, a shop lets you walk away empty-handed or buy several.
export default function SquadDraft({
  runState,
  onRecruit,
  onReroll,
  onContinue,
  onRankUp,
  onUpgradeRelic,
  onReforge,
  onSell,
  onRetrain,
  onBuyItem,
  onEquipItem,
  onUnequipItem,
  onLevelUpMarket,
  onToggleFreeze,
  onUseCommanderActive,
  showIntro,
  onDismissIntro,
}) {
  const offers = runState.shopOffers.map((id) => UNITS[id])
  const commander = CHARACTERS[runState.characterId]
  const commanderRank = runState.commanderRank || 0
  const rankCost = commanderRankCost(commanderRank)
  const marketLevel = runState.marketLevel || 1
  const marketCost = marketLevelCost(marketLevel)
  const activePower = commander?.activePower
  const activePowerUsed = !!runState.activePowerUsedThisShop
  const primed = (runState.pendingActiveEffects || []).length > 0
  // "Up next" preview - RUN_PATH (runEngine.js) is fixed and fully
  // known ahead of time, so the fight right after this shop visit is
  // always resolvable from runState.path/nodeIndex alone. A real
  // pre-battle planning cue (recruit differently knowing a swarm vs. a
  // single shielding puzzle is coming) that cost nothing new to derive
  // - same resolveFormation lookup FormationScreen.jsx already uses
  // for the CURRENT fight, one node further ahead.
  const nextNode = runState.path[runState.nodeIndex + 1]
  const nextFormation = nextNode ? resolveFormation(nextNode.formationId || nextNode.enemyId) : null
  const nextLabel = nextNode?.type === "boss" ? "Boss" : nextFormation?.name || ENEMIES[nextFormation?.pieces?.[0]?.defId]?.name
  // Tribe-match highlight (Battlegrounds/TFT "this fits your board") -
  // computed from the whole bench, not just deployed units, since at
  // shop time the player may not have finished placing this visit's
  // squad yet.
  const ownedTribes = benchTribeCounts(runState)
  // Hero Bending on the Commander: it has no baseline `role` (see
  // characters.js) to contrast against the way a recruited unit does,
  // so this is just "does ANY equipped Commander item carry
  // bendsRoleTo" rather than a from/to comparison.
  const commanderItemDefIds = runState.items.filter((it) => it.equippedTo === "commander").map((it) => it.defId)
  const commanderBentRole = effectiveRole(null, commanderItemDefIds)
  // Artificer's Ledger (relics.js) grants every unit a bonus slot on
  // top of the base ITEM_SLOTS - same effectiveItemSlots helper
  // equipItem's own range check uses, so the pips shown here can never
  // drift out of sync with what's actually equippable.
  const maxItemSlots = effectiveItemSlots(runState)
  const [justReforgedKey, setJustReforgedKey] = useState(null)
  const [justFusedKey, setJustFusedKey] = useState(null)
  const [showRetrain, setShowRetrain] = useState(false)
  // Equip flow: click a bag item to select it, then click a slot pip on
  // any bench unit to equip it there (or click a filled pip directly,
  // with nothing selected, to unequip) - the same "click source, click
  // target" gesture FormationScreen.jsx already teaches for placing a
  // unit on the battlefield.
  const [selectedItemKey, setSelectedItemKey] = useState(null)
  const [justEquippedSlot, setJustEquippedSlot] = useState(null)
  const otherCommanders = Object.values(CHARACTERS).filter((c) => c.id !== runState.characterId)
  const prevBenchKeysRef = useRef(new Set(runState.bench.map((e) => e.key)))

  // Fusion (runEngine.js's fuseAll) has always run silently the moment
  // a 3rd copy is recruited - no player-visible moment at all, just
  // three bench cards replaced by one on the next render. Marc:
  // "mergeeminen pitää animoida ja se pitää tehdä visuaalisesti
  // hienoksi" (the merging needs to be animated and made visually
  // nice) - detected the same way FloatingNumbers detects any other
  // event, by diffing before/after, since recruitUnit's fire-and-
  // forget setRunState call doesn't hand back "did a fusion just
  // happen" directly.
  useEffect(() => {
    const prevKeys = prevBenchKeysRef.current
    const fusedEntry = runState.bench.find((e) => !prevKeys.has(e.key) && UNITS[e.defId]?.fusedFrom)
    prevBenchKeysRef.current = new Set(runState.bench.map((e) => e.key))
    if (fusedEntry) {
      setJustFusedKey(fusedEntry.key)
      const timer = setTimeout(() => setJustFusedKey((cur) => (cur === fusedEntry.key ? null : cur)), 900)
      return () => clearTimeout(timer)
    }
  }, [runState.bench])

  function handleReforge(benchKey) {
    onReforge(benchKey)
    setJustReforgedKey(benchKey)
    setTimeout(() => setJustReforgedKey((cur) => (cur === benchKey ? null : cur)), 500)
  }

  function handleSell(benchKey) {
    onSell(benchKey)
  }

  function handleBagItemClick(itemKey) {
    setSelectedItemKey((cur) => (cur === itemKey ? null : itemKey))
  }

  function handleSlotClick(benchKey, slotIndex, occupiedByKey) {
    // selectedItemKey can legitimately be 0 (an item's own key counter
    // starts at 0, same as a bench key's own counter) - a truthy check
    // would silently treat "item 0 selected" as "nothing selected."
    if (selectedItemKey !== null) {
      onEquipItem(selectedItemKey, benchKey, slotIndex)
      setSelectedItemKey(null)
      setJustEquippedSlot(`${benchKey}-${slotIndex}`)
      setTimeout(() => setJustEquippedSlot((cur) => (cur === `${benchKey}-${slotIndex}` ? null : cur)), 500)
    } else if (occupiedByKey != null) {
      onUnequipItem(occupiedByKey)
    }
  }

  return (
    <div className="hw-intro">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>The Heartwood Market</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {nextLabel && (
            <span className="hw-badge" title="What you'll face right after this shop visit">
              Next: {nextLabel}
            </span>
          )}
          <span className="hw-badge hw-essence-badge" title="Essence">
            <CardGlyph name="spark" className="hw-intent-glyph" />
            {runState.essence}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        {/* Market Level (Battlegrounds/Guildrun-style tavern tier) -
            raises the shop's rarity ceiling (runEngine.js's
            rollShop/MARKET_LEVEL_UNLOCKS). Shown next to Essence since
            it's the run's other core economy dial. */}
        <span
          className="hw-badge"
          title={`Unlocks: ${(MARKET_LEVEL_UNLOCKS[marketLevel] || []).join(", ")} tier units in the shop`}
        >
          Market Lv {marketLevel}/{MARKET_LEVEL_MAX}
        </span>
        {marketCost === null ? (
          <span className="hw-badge" style={{ fontSize: 11 }}>Market MAX</span>
        ) : (
          <button
            className="hw-move-btn"
            style={{ fontSize: 11, padding: "4px 8px" }}
            disabled={runState.essence < marketCost}
            onClick={onLevelUpMarket}
            title={`Unlock ${MARKET_LEVEL_UNLOCKS[marketLevel + 1]?.slice(-1)[0]}-tier units in future shop rolls`}
          >
            Level Up ({marketCost} Essence)
          </button>
        )}
        <span className="hw-badge" title={commander?.description}>
          <CardGlyph name={commander?.art} className="hw-intent-glyph" />
          {commander?.name} · Rank {commanderRank}
        </span>
        {/* Hero Bending on the Commander (items.js's bendsRoleTo) -
            the Commander has no UnitCard here (just this text badge),
            so the "Bent" cue that a bench unit gets on its card face
            needs its own equivalent rather than silently having no
            visible marker at all when a Bending item lands on the
            Commander specifically. */}
        {commanderBentRole && (
          <span className="hw-badge hw-badge--bent" title={`Bent to ${commanderBentRole}`}>
            Bent: {commanderBentRole}
          </span>
        )}
        {rankCost === null ? (
          <span className="hw-badge" style={{ fontSize: 11 }}>Rank MAX</span>
        ) : (
          <button
            className="hw-move-btn"
            style={{ fontSize: 11, padding: "4px 8px" }}
            disabled={runState.essence < rankCost}
            onClick={onRankUp}
            title={`Permanently strengthen ${commander?.name}'s squad passive (rank ${commanderRank} -> ${commanderRank + 1})`}
          >
            Rank Up ({rankCost} Essence)
          </button>
        )}
        {/* Commander Active Power (characters.js's activePower) - a
            "hero power" on top of the Commander's always-on
            squadPassive, once per shop visit, queued for the very next
            battle only (runEngine.js's activateCommanderPower). The
            "primed" badge is the required visible cue that something
            is queued before the effect itself fires in battle. */}
        {activePower && (
          <>
            <button
              className="hw-move-btn"
              data-active={primed}
              style={{ fontSize: 11, padding: "4px 8px" }}
              disabled={activePowerUsed || runState.essence < activePower.cost}
              onClick={onUseCommanderActive}
              title={activePower.description}
            >
              {activePower.name} ({activePower.cost} Essence)
            </button>
            {primed && (
              <span className="hw-badge hw-badge--active" title={activePower.description}>
                {activePower.name} primed - next battle
              </span>
            )}
          </>
        )}
        <button
          className="hw-move-btn"
          style={{ fontSize: 11, padding: "4px 8px" }}
          onClick={() => setShowRetrain((cur) => !cur)}
          title="Switch to a different Commander for the rest of this run"
        >
          Retrain...
        </button>
        {/* The Commander is a real 5th deployed unit now (Marc: "se
            commander on pelattava hahmo pelissä... jota voi
            synergisoida buildilla ja itemeillä" - the Commander is a
            playable character you can synergize with the build and
            items) - same item-slot pips and click-to-equip flow every
            bench unit already has, just keyed to the "commander"
            sentinel instead of a real bench key. */}
        <div className="hw-item-slots" title="Commander's item slots - click a bag item above, then click a slot to equip it">
          {Array.from({ length: maxItemSlots }, (_, slotIndex) => {
            const equipped = runState.items.find((it) => it.equippedTo === "commander" && it.slotIndex === slotIndex)
            const itemDef = equipped ? ITEMS[equipped.defId] : null
            return (
              <span
                key={slotIndex}
                className={`hw-item-slot${itemDef ? " hw-item-slot--filled" : ""}${
                  justEquippedSlot === `commander-${slotIndex}` ? " hw-card--reforged" : ""
                }`}
                title={itemDef ? `${itemDef.name} - click to unequip` : "Empty slot"}
                onClick={() => handleSlotClick("commander", slotIndex, equipped ? equipped.key : null)}
              >
                {itemDef ? <CardGlyph name={itemDef.icon} className="hw-intent-glyph" /> : null}
              </span>
            )
          })}
        </div>
      </div>

      {showRetrain && (
        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          {otherCommanders.map((c) => (
            <button
              key={c.id}
              className="hw-move-btn"
              style={{ fontSize: 11, padding: "4px 8px" }}
              disabled={runState.essence < RETRAIN_COST}
              onClick={() => {
                onRetrain(c.id)
                setShowRetrain(false)
              }}
              title={c.description}
            >
              <CardGlyph name={c.art} className="hw-intent-glyph" /> {c.name} ({RETRAIN_COST} Essence)
            </button>
          ))}
        </div>
      )}

      {runState.relics.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          {runState.relics.map((id) => {
            const level = (runState.relicLevels || {})[id] || 0
            const cost = upgradeCost(level)
            return (
              <span key={id} className="hw-badge" title={RELICS[id]?.description} style={{ gap: 6 }}>
                <CardGlyph name={RELICS[id]?.icon} className="hw-intent-glyph" />
                {RELICS[id]?.name}
                {level > 0 && ` +${level}`}
                {cost === null ? (
                  <span style={{ fontSize: 10, opacity: 0.8 }}>MAX</span>
                ) : (
                  <button
                    className="hw-move-btn"
                    style={{ fontSize: 10, padding: "2px 6px" }}
                    disabled={runState.essence < cost}
                    onClick={() => onUpgradeRelic(id)}
                    title={`Permanently strengthen ${RELICS[id]?.name} (level ${level} -> ${level + 1})`}
                  >
                    Upgrade ({cost})
                  </button>
                )}
              </span>
            )
          })}
        </div>
      )}

      {showIntro && (
        <div className="hw-hint hw-hint--tutorial" style={{ marginTop: 14 }}>
          <span>
            Recruit units, place up to 4 on the grid, then watch them fight automatically. Win to earn Essence and
            press on - lose, and the run ends.
          </span>
          <div className="hw-tutorial-actions">
            <button className="hw-tutorial-next" onClick={onDismissIntro}>
              Got it
            </button>
          </div>
        </div>
      )}

      <div className="hw-market-columns">
        <div className="hw-panel hw-panel--market">
          <div className="hw-panel-title">Market - spend Essence here</div>
          <p className="hw-flavor" style={{ marginTop: 4 }}>
            Recruit who you can afford, or move on.
          </p>

          <div className="hw-section-label">For sale</div>
          <div className="hw-select-grid hw-deck-preview">
            {offers.map((def) => {
              const owned = runState.bench.filter((e) => e.defId === def.id).length
              const tribeMatch = tribesOf(def.id, def).some((t) => (ownedTribes[t] || 0) > 0)
              return (
                <div key={def.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <UnitCard
                    def={def}
                    disabled={runState.essence < def.recruitCost}
                    onClick={() => onRecruit(def.id)}
                    tribeMatch={tribeMatch}
                  />
                  {owned >= 2 && (
                    <div
                      className="hw-badge"
                      style={{ justifyContent: "center", fontSize: 11, color: "var(--hw-ember)", borderColor: "var(--hw-ember)" }}
                      title="You already own 2 - recruiting this one fuses all 3 into a stronger Tier 2 unit"
                    >
                      Fuses now! ({owned}/3 owned)
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div style={{ marginTop: 6, display: "flex", gap: 8 }}>
            <button
              className="hw-move-btn"
              disabled={runState.essence < runState.rerollCost || offers.length === 0}
              onClick={onReroll}
            >
              Reroll ({runState.rerollCost} Essence)
            </button>
            {/* Freeze (runEngine.js's toggleFreeze) - keeps this offer
                set into the next shop visit instead of it re-rolling
                automatically. A one-shot flag (consumed on the next
                regen), so `data-active` just reflects whether it's
                currently armed. */}
            <button className="hw-move-btn" data-active={!!runState.frozen} onClick={onToggleFreeze} title="Keep these offers when you next visit the shop">
              {runState.frozen ? "Frozen ✓" : "Freeze"}
            </button>
          </div>

          <div className="hw-section-label" style={{ marginTop: 20 }}>
            Items
          </div>
          <p style={{ fontSize: 12, color: "var(--hw-muted)", marginTop: -4 }}>
            Gear for a specific unit - buy, then equip it from the bag on the right.
          </p>
          <div className="hw-select-grid hw-deck-preview">
            {itemPool().map((def) => (
              <ItemCard key={def.id} def={def} disabled={runState.essence < def.cost} onClick={() => onBuyItem(def.id)} />
            ))}
          </div>
        </div>

        <div className="hw-panel hw-panel--squad">
          <div className="hw-panel-title">Your Squad - already owned</div>

          {runState.items.length > 0 && (
            <>
              <p style={{ fontSize: 12, color: "var(--hw-muted)", marginTop: 4, marginBottom: 4 }}>
                Your items ({runState.items.filter((it) => it.equippedTo === null).length} unequipped) - click one,
                then click a slot below to equip it.
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                {runState.items
                  .filter((it) => it.equippedTo === null)
                  .map((it) => {
                    const def = ITEMS[it.defId]
                    return (
                      <span
                        key={it.key}
                        className="hw-badge"
                        style={{
                          cursor: "pointer",
                          gap: 6,
                          color: selectedItemKey === it.key ? "var(--hw-ember)" : undefined,
                          borderColor: selectedItemKey === it.key ? "var(--hw-ember)" : undefined,
                        }}
                        title={def?.description}
                        onClick={() => handleBagItemClick(it.key)}
                      >
                        <CardGlyph name={def?.icon} className="hw-intent-glyph" />
                        {def?.name}
                      </span>
                    )
                  })}
              </div>
            </>
          )}

          <div className="hw-section-label">Your bench ({runState.bench.length})</div>
          <p style={{ fontSize: 12, color: "var(--hw-muted)", marginTop: -4 }}>
            Recruit 3 copies of the same unit to fuse it into a stronger version - find them in the shop.
          </p>
          <div className="hw-select-grid hw-deck-preview">
            {runState.bench.map((entry) => {
          const def = UNITS[entry.defId]
          const canReforge = def?.displayTier !== 2
          // Fusion progress: 3 owned copies of the same base unit merge
          // into a Tier 2 copy automatically (runEngine.js's fuseAll).
          // Shown from the first copy owned now that Fusion is the
          // ONLY way a unit gets stronger (Marc: "Upgrade-nappi on
          // turha... haluan RNG elementin... unitti pitää löytää ja
          // sitten se päivittyy kun niitä on kolme" - the Upgrade
          // button is pointless, I want an RNG element - the unit
          // needs to be found and then it upgrades once there are
          // three - removed the direct-purchase Upgrade sink entirely
          // in favor of this being the one, more prominent progression
          // path) - only for base-tier units, a Tier 2 unit has no
          // further fusion target.
          const copiesOwned = def?.displayTier !== 2 ? runState.bench.filter((e) => e.defId === entry.defId).length : 0
          const equippedItems = runState.items.filter((it) => it.equippedTo === entry.key)
          const sellRefund = def?.recruitCost != null ? Math.ceil(def.recruitCost / 2) : 2
          // Hero Bending (items.js's bendsRoleTo/effectiveRole,
          // Guildrun's "hero bending" - Marc: "saman idean haluan
          // heartwoodiin kuin Guildrunissa") - a Bending item equipped
          // here visibly overwrites this card's role-accent/label, not
          // just its stats.
          const bentRole = def ? effectiveRole(def.role, equippedItems.map((it) => it.defId)) : def?.role
          return (
            <div key={entry.key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div
                className={
                  justFusedKey === entry.key ? "hw-card--fused" : justReforgedKey === entry.key ? "hw-card--reforged" : undefined
                }
              >
                <UnitCard def={def} disabled role={bentRole} bent={bentRole !== def?.role} />
              </div>
              <div className="hw-item-slots" title="Item slots - click a bag item above, then click a slot to equip it">
                {Array.from({ length: maxItemSlots }, (_, slotIndex) => {
                  const equipped = equippedItems.find((it) => it.slotIndex === slotIndex)
                  const itemDef = equipped ? ITEMS[equipped.defId] : null
                  return (
                    <span
                      key={slotIndex}
                      className={`hw-item-slot${itemDef ? " hw-item-slot--filled" : ""}${
                        justEquippedSlot === `${entry.key}-${slotIndex}` ? " hw-card--reforged" : ""
                      }`}
                      title={itemDef ? `${itemDef.name} - click to unequip` : "Empty slot"}
                      onClick={() => handleSlotClick(entry.key, slotIndex, equipped ? equipped.key : null)}
                    >
                      {itemDef ? <CardGlyph name={itemDef.icon} className="hw-intent-glyph" /> : null}
                    </span>
                  )
                })}
              </div>
              {def?.displayTier !== 2 && (
                <div
                  className="hw-badge"
                  style={{ justifyContent: "center", fontSize: 11, color: "var(--hw-ember)", borderColor: "var(--hw-ember)" }}
                  title="3 owned copies of the same unit fuse automatically into a stronger Tier 2 version"
                >
                  Fusion {copiesOwned}/3
                </div>
              )}
              {canReforge && (
                <button
                  className="hw-move-btn"
                  style={{ fontSize: 11, padding: "4px 6px" }}
                  disabled={runState.essence < REFORGE_COST}
                  onClick={() => handleReforge(entry.key)}
                  title={`Swap ${def?.name} for a different random unit of the same tier`}
                >
                  Reforge ({REFORGE_COST} Essence)
                </button>
              )}
              <button
                className="hw-move-btn"
                style={{ fontSize: 11, padding: "4px 6px" }}
                onClick={() => handleSell(entry.key)}
                title={`Sell ${def?.name} back for ${sellRefund} Essence`}
              >
                Sell (+{sellRefund} Essence)
              </button>
            </div>
          )
        })}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 20 }}>
        <button className="hw-end-turn" onClick={onContinue}>
          Continue
        </button>
      </div>
    </div>
  )
}
