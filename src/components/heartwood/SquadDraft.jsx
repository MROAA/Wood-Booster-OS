import { useEffect, useRef, useState } from "react"
import { UNITS, upgradeCost } from "../../data/heartwood/units"
import { RELICS } from "../../data/heartwood/relics"
import { ITEMS, effectiveRole } from "../../data/heartwood/items"
import { CHARACTERS, COMMANDER_RANK_MAX, commanderRankCost } from "../../data/heartwood/characters"
import { ENEMIES } from "../../data/heartwood/enemies"
import { resolveFormation } from "../../data/heartwood/formations"
import { tribesOf } from "../../data/heartwood/synergies"
import { findDualClassFor } from "../../data/heartwood/dualClasses"
import {
  REFORGE_COST,
  RETRAIN_COST,
  effectiveItemSlots,
  MARKET_LEVEL_MAX,
  MARKET_LEVEL_UNLOCKS,
  marketLevelCost,
  benchTribeCounts,
  difficultyTierForNode,
  RESERVE_CAP,
  DEPLOY_SLOTS,
  RUN_PATH,
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
  // Item shop rotation (runEngine.js's rollItemShop/itemOffers) -
  // fresh selection every visit, guaranteed to include a Bending item
  // when one exists, instead of always showing the whole catalog.
  const itemOffers = (runState.itemOffers || []).map((id) => ITEMS[id]).filter(Boolean)
  const commander = CHARACTERS[runState.characterId]
  const commanderRank = runState.commanderRank || 0
  const rankCost = commanderRankCost(commanderRank)
  const marketLevel = runState.marketLevel || 1
  const marketCost = marketLevelCost(marketLevel)
  const activePower = commander?.activePower
  const activePowerUsed = !!runState.activePowerUsedThisShop
  const primed = (runState.pendingActiveEffects || []).length > 0
  // "Up next" preview - RUN_PATH's own SHAPE (which position is shop/
  // relic/battle/miniboss/boss) is still fixed and known ahead of time,
  // but since the branching-path work (runEngine.js's advanceToNextNode)
  // a "battle" position's actual enemy is no longer decided until the
  // player picks it at a choice screen - runState.path itself only
  // holds nodes already visited, so path[nodeIndex + 1] doesn't exist
  // yet. Anchors (miniboss/boss/relic) stay fully previewable exactly
  // as before (their content was never a choice); a "battle" position
  // shows a generic cue instead of a specific enemy name.
  const nextTemplate = RUN_PATH[runState.nodeIndex + 1]
  const nextFormation =
    nextTemplate && nextTemplate.type !== "battle" ? resolveFormation(nextTemplate.formationId || nextTemplate.enemyId) : null
  const nextLabel =
    nextTemplate?.type === "boss"
      ? "Boss"
      : nextTemplate?.type === "miniboss"
        ? `Miniboss: ${ENEMIES[nextTemplate.enemyId]?.name || ""}`
        : nextTemplate?.type === "relic"
          ? "Relic"
          : nextTemplate?.type === "battle"
            ? "A fight - you'll choose which"
            : nextFormation?.name || ENEMIES[nextFormation?.pieces?.[0]?.defId]?.name
  // Progressive-difficulty indicator (Marc: "the game has to have
  // progressive feel to it so it becomes more difficult") -
  // difficultyFactorForNode below has scaled enemy stats since the
  // earlier balance pass, but purely as a backend multiplier with
  // nothing on screen to say so. Same tier breakpoints as that ramp's
  // own progress curve, so this badge is an honest readout, not
  // decoration bolted onto a number it doesn't track.
  const difficultyTier = difficultyTierForNode(runState.nodeIndex, RUN_PATH.length)
  // Tribe-match highlight (Battlegrounds/TFT "this fits your board") -
  // computed from the whole bench, not just deployed units, since at
  // shop time the player may not have finished placing this visit's
  // squad yet.
  const ownedTribes = benchTribeCounts(runState)
  // Reserve vs Bench (Marc, direct: "bench on jotka taistelevat
  // commanderin kanssa ja reservissä on ei taistelevia hahmoja" - the
  // fighting squad is "bench," everything else owned is "reserve").
  // `deployed` already IS that fighting squad; reserveCount is simply
  // everything owned minus whatever's currently deployed.
  const deployedCount = runState.deployed.filter((k) => k !== null).length
  const reserveCount = runState.bench.length - deployedCount
  // Dual-Class (dualClasses.js, roadmap task 19): every currently
  // DEPLOYED unit's defId, same "deployed only" scope the tribe tracker
  // above already uses (ownedTribes is bench-wide on purpose, this is
  // deliberately narrower) - a combo only actually fires in battle once
  // both partners are placed on the grid together, so the bench card
  // should show the same thing the fight will actually do, not "you
  // happen to own both somewhere."
  const deployedDefIds = runState.deployed
    .filter((k) => k !== null)
    .map((key) => runState.bench.find((e) => e.key === key)?.defId)
    .filter(Boolean)
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
  // Purchase confirmation (Marc's PRD sect. 9/18-20/31: "selkeä
  // visuaalinen kuittaus osto/equip-toiminnoille" - a clear visual
  // confirmation for purchase/equip actions), moss-colored (this game's
  // "a good thing happened" color) and applied to the new bench entry
  // itself, same mechanism/effect as justFusedKey right below - a plain
  // recruit and a fusion are both just "a new bench key that wasn't
  // there last render," so they share one diffing effect. See that
  // effect for why this targets the bench and not the shop offer card.
  const [justPurchasedKey, setJustPurchasedKey] = useState(null)
  const [showRetrain, setShowRetrain] = useState(false)
  // Equip flow: click a bag item to select it, then click a slot pip on
  // any bench unit to equip it there (or click a filled pip directly,
  // with nothing selected, to unequip) - the same "click source, click
  // target" gesture FormationScreen.jsx already teaches for placing a
  // unit on the battlefield.
  const [selectedItemKey, setSelectedItemKey] = useState(null)
  const [justEquippedSlot, setJustEquippedSlot] = useState(null)
  const selectedItem = selectedItemKey !== null ? runState.items.find((it) => it.key === selectedItemKey) : null
  const selectedItemDef = selectedItem ? ITEMS[selectedItem.defId] : null
  // Market/Squad tabs (Marc, after a real 1920x1080 measurement showed
  // ~400-600px of vertical overflow with a stocked shop and a real
  // bench both visible: "kaiken pitää mahtua näytölle ilman
  // scrollausta" - everything needs to fit without scrolling. Asked
  // him to pick between tabs, shrinking every card, or scoping the
  // scroll to just one panel - he picked tabs). Market and Your Squad
  // used to render stacked in one always-visible column; now only one
  // shows at a time, selected here. Defaults to "market" since that's
  // the panel with actual purchase decisions to make on arrival.
  const [activeTab, setActiveTab] = useState("market")
  const otherCommanders = Object.values(CHARACTERS).filter((c) => c.id !== runState.characterId)
  const prevBenchKeysRef = useRef(new Set(runState.bench.map((e) => e.key)))
  // Essence badge flash - every purchase/sale in this shop changes the
  // number, but it used to just silently re-render as a new digit, the
  // one "state that visibly changes constantly" spot this whole
  // animation pass (Marc: "everything needs to be animated") had
  // missed. Diffs against the previous render the same way the fusion-
  // detection effect above already does, rather than a CSS class that
  // can't react to a same-element value change on its own.
  const prevEssenceRef = useRef(runState.essence)
  const [essenceFlash, setEssenceFlash] = useState(null)
  useEffect(() => {
    const prev = prevEssenceRef.current
    if (runState.essence !== prev) {
      setEssenceFlash(runState.essence > prev ? "gain" : "spend")
      prevEssenceRef.current = runState.essence
      const timer = setTimeout(() => setEssenceFlash(null), 500)
      return () => clearTimeout(timer)
    }
  }, [runState.essence])

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
    const newEntries = runState.bench.filter((e) => !prevKeys.has(e.key))
    prevBenchKeysRef.current = new Set(runState.bench.map((e) => e.key))
    const fusedEntry = newEntries.find((e) => UNITS[e.defId]?.fusedFrom)
    if (fusedEntry) {
      setJustFusedKey(fusedEntry.key)
      const timer = setTimeout(() => setJustFusedKey((cur) => (cur === fusedEntry.key ? null : cur)), 900)
      return () => clearTimeout(timer)
    }
    // Purchase confirmation (Marc's PRD sect. 9/18-20/31: "selkeä
    // visuaalinen kuittaus osto/equip-toiminnoille"). A first attempt
    // flashed the shop OFFER card itself the instant its onClick fired,
    // the same handler-sets-a-flag trick Reforge below uses - but
    // recruitUnit (runEngine.js) filters the bought def straight out of
    // shopOffers as part of the same state update, so that card's own
    // DOM node is gone before or in the same frame as the flag ever
    // painting. Confirmed with a real Playwright run (not assumed):
    // Essence genuinely dropped, but `.hw-card--purchased` never
    // appeared. The correct target is the same place Fusion's own
    // confirmation already looks - the BENCH, diffed the identical way
    // - since a plain recruit is just "a new bench entry that isn't a
    // fusion result," not a separate kind of event.
    const recruitedEntry = newEntries[0]
    if (recruitedEntry) {
      setJustPurchasedKey(recruitedEntry.key)
      const timer = setTimeout(() => setJustPurchasedKey((cur) => (cur === recruitedEntry.key ? null : cur)), 550)
      return () => clearTimeout(timer)
    }
  }, [runState.bench])

  // Buying an item (onBuyItem, "For sale" -> Items) used to leave the
  // player stranded on the Market tab with zero visible way to equip
  // what they just bought - the bag list and every item-slot pip (bar
  // the Commander's, which sit outside the tabs) only exist on the
  // "Your Squad" tab, and the "equip it from the bag on the right"
  // hint text above the Items grid is stale copy from before this
  // screen had tabs at all (there is no "right" anymore, just two
  // panels that swap). Marc bought an item, watched Essence drop, and
  // had no way to tell the equip step even existed - not a broken
  // equipItem call, a genuinely undiscoverable one.
  //
  // Fix is auto-SELECT, not auto-switch: forcibly jumping to the Squad
  // tab the instant an item is bought was the first attempt, but it
  // yanks the player away from the Market tab mid-shopping (buying an
  // item, then still meaning to recruit another unit right after) - a
  // new annoyance in place of the old one. Auto-selecting the item and
  // showing the pending-equip banner below (which lives outside the
  // tab-gated panels, so it's visible on either tab) gets the same
  // "what do I do now" answer on screen without moving the player's
  // tab out from under them; the banner's own "Go to Your Squad"
  // button (only shown while still on Market) is the explicit next
  // click when they're ready for it. Detected the same diff-before/
  // after way the fusion effect above already does: a fresh item key
  // that wasn't in the bag last render means buyItem just ran.
  const prevItemKeysRef = useRef(new Set(runState.items.map((it) => it.key)))
  useEffect(() => {
    const prevKeys = prevItemKeysRef.current
    const boughtItem = runState.items.find((it) => !prevKeys.has(it.key))
    prevItemKeysRef.current = new Set(runState.items.map((it) => it.key))
    if (boughtItem) {
      setSelectedItemKey(boughtItem.key)
    }
  }, [runState.items])

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
      // Equipping used to only flash the tiny slot pip itself - easy to
      // miss, and didn't read as "this unit just got stronger" the way
      // Reforge's full-card pulse does. Reuses that same rune-colored
      // pulse on the unit's own card (only for a real bench unit, not
      // the "commander" sentinel key, which has no UnitCard to flash)
      // rather than inventing a third card-pulse animation just for
      // this - Reforge and Equip are both "this unit's gear/stats just
      // changed", so sharing the visual language keeps the vocabulary
      // small on purpose (Marc's own "hillitty minimalistinen" anchor).
      if (benchKey !== "commander") {
        setJustReforgedKey(benchKey)
        setTimeout(() => setJustReforgedKey((cur) => (cur === benchKey ? null : cur)), 500)
      }
    } else if (occupiedByKey != null) {
      onUnequipItem(occupiedByKey)
    }
  }

  return (
    <div className="hw-intro hw-market-stage">
      {/* paddingRight/flexWrap keep this row's right-aligned badges clear
          of the fixed .hw-exit-link corner button (HeartwoodBattle.jsx) -
          it's position:fixed outside document flow, so nothing here
          pushes it aside on its own; adding the difficulty badge below
          made this row wide enough to collide with it for the first time. */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", paddingRight: 130 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>The Hearthwood Market</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* key={difficultyTier.name}: without it this is the same DOM
              node across every render, so crossing into a new tier
              mid-run (the color/text just updating) never replayed
              hw-section-fade-in's mount animation - the exact "state
              changed but nothing moved" gap Marc's "everything needs to
              be animated" rule targets. Keying by name forces a real
              remount the moment the tier itself changes, not on every
              re-render for an unrelated reason. */}
          <span
            key={difficultyTier.name}
            className="hw-badge hw-section-fade-in"
            style={{ color: difficultyTier.color, borderColor: difficultyTier.color }}
            title="How far into the run you are - the Hearthwood grows more dangerous the deeper you go"
          >
            <CardGlyph name="moonGlyph" className="hw-intent-glyph" />
            {difficultyTier.name}
          </span>
          {nextLabel && (
            <span className="hw-badge hw-section-fade-in" title="What you'll face right after this shop visit">
              Next: {nextLabel}
            </span>
          )}
          {/* Resource UI (PRD's Resource UI principle, Marc: "hehkuva
              orbi/kide" - a glowing orb/crystal, not a bare number in
              a circle). Same runState.essence value and essenceFlash
              gain/spend trigger as the old .hw-essence-badge, just a
              heavier, medallion-based visual container around them -
              see heartwood.css's .hw-essence-display block for the
              full reasoning. */}
          <span className="hw-essence-display" data-flash={essenceFlash || undefined} title="Essence">
            <span className="hw-essence-orb">
              <CardGlyph name="spark" className="hw-essence-orb-glyph" />
            </span>
            <span className="hw-essence-value">{runState.essence}</span>
          </span>
        </div>
      </div>

      <div className="hw-section-fade-in" style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
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

      <div className="hw-tab-row">
        <button
          className="hw-move-btn"
          data-active={activeTab === "market"}
          onClick={() => setActiveTab("market")}
        >
          Market
        </button>
        <button
          className="hw-move-btn"
          data-active={activeTab === "squad"}
          onClick={() => setActiveTab("squad")}
        >
          Your Squad ({runState.bench.length})
        </button>
      </div>

      {/* Equip prompt: the required visible cue that something is
          selected and waiting for a target, same job the "primed" badge
          above does for the Commander's Active Power. Placed outside
          the tab-gated panels below (hw-market-columns) so it's on
          screen on EITHER tab - the instant buying an item auto-selects
          it (see the item-detection effect above), whichever tab the
          player was shopping on, and stays visible if they instead
          select a bag item by hand while already on the Squad tab. */}
      {selectedItemDef && (
        <div className="hw-hint hw-hint--pending" style={{ marginTop: 10 }}>
          <span>
            <CardGlyph name={selectedItemDef.icon} className="hw-intent-glyph" /> {selectedItemDef.name} selected -{" "}
            {activeTab === "squad"
              ? "click an empty item slot on a unit below (or the Commander's slots above) to equip it."
              : "the Commander's slots above are ready now, or switch tabs to equip it onto a recruited unit."}
          </span>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            {activeTab !== "squad" && (
              <button className="hw-hint-cancel" onClick={() => setActiveTab("squad")}>
                Go to Your Squad
              </button>
            )}
            <button className="hw-hint-cancel" onClick={() => setSelectedItemKey(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="hw-market-columns">
        <div className="hw-panel hw-panel--market" hidden={activeTab !== "market"}>
          <div className="hw-panel-title">Market - spend Essence here</div>
          <p className="hw-flavor" style={{ marginTop: 4 }}>
            Recruit who you can afford, or move on.
          </p>

          <div className="hw-section-label">For sale</div>
          {/* hw-market-featured-grid: the one deliberately-featured
              moment on this screen (problem 2, "korttien asettelu/
              koko") - bigger, golden-ratio-sized cards (--hw-fib-9,
              same 233px this game's other "important choice" screen,
              CommanderSelect.jsx, already uses). Scoped to just this
              grid - the Items grid and the Your Squad/bench grid
              below keep their existing card size on purpose. */}
          <div className="hw-select-grid hw-deck-preview hw-market-featured-grid">
            {offers.map((def) => {
              const owned = runState.bench.filter((e) => e.defId === def.id).length
              const willFuse = owned >= 2
              const reserveFull = !willFuse && runState.bench.length >= DEPLOY_SLOTS + RESERVE_CAP
              const tribeMatch = tribesOf(def.id, def).some((t) => (ownedTribes[t] || 0) > 0)
              return (
                <div key={def.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <UnitCard
                    def={def}
                    disabled={runState.essence < def.recruitCost || reserveFull}
                    onClick={() => onRecruit(def.id)}
                    tribeMatch={tribeMatch}
                    frozen={!!runState.frozen}
                  />
                  {willFuse && (
                    <div
                      className="hw-badge"
                      style={{ justifyContent: "center", fontSize: 11, color: "var(--hw-ember)", borderColor: "var(--hw-ember)" }}
                      title="You already own 2 - recruiting this one fuses all 3 into a stronger Tier 2 unit"
                    >
                      Fuses now! ({owned}/3 owned)
                    </div>
                  )}
                  {reserveFull && (
                    <div
                      className="hw-badge"
                      style={{ justifyContent: "center", fontSize: 11, color: "var(--hw-hp)", borderColor: "var(--hw-hp)" }}
                      title={`Reserve is full (${RESERVE_CAP}/${RESERVE_CAP}) - sell or fuse to make room`}
                    >
                      Reserve full
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

          <div className="hw-market-divider" />
          <div className="hw-section-label">
            Items
          </div>
          <p style={{ fontSize: 12, color: "var(--hw-muted)", marginTop: -4 }}>
            Gear for a specific unit - buying one selects it automatically, ready to equip onto the Commander above
            or a unit on the Your Squad tab. Rotates fresh every visit - always includes at least one Bending item.
          </p>
          <div className="hw-select-grid hw-deck-preview">
            {itemOffers.map((def) => (
              <ItemCard key={def.id} def={def} disabled={runState.essence < def.cost} onClick={() => onBuyItem(def.id)} />
            ))}
          </div>
        </div>

        <div className="hw-panel hw-panel--squad" hidden={activeTab !== "squad"}>
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

          <div className="hw-section-label">
            Your Squad - {deployedCount} on the Bench (fighting), {reserveCount}/{RESERVE_CAP} in Reserve
          </div>
          <p style={{ fontSize: 12, color: "var(--hw-muted)", marginTop: -4 }}>
            Recruit 3 copies of the same unit to fuse it into a stronger version - find them in the shop. Units not
            on the Bench sit in Reserve until you place them on the battlefield.
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
          // Dual-Class (dualClasses.js): only checked against OTHER
          // deployed defIds (this unit's own entry contributes nothing
          // to its own combo - a combo always needs a genuinely
          // different partner unit), only meaningful while this entry
          // itself is actually deployed (a benched, undeployed unit
          // isn't in the fight the combo would apply to).
          const dualClass =
            def && runState.deployed.includes(entry.key)
              ? findDualClassFor(entry.defId, deployedDefIds, UNITS)
              : null
          return (
            <div key={entry.key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div
                className={
                  justFusedKey === entry.key
                    ? "hw-card--fused"
                    : justReforgedKey === entry.key
                      ? "hw-card--reforged"
                      : justPurchasedKey === entry.key
                        ? "hw-card--purchased"
                        : undefined
                }
              >
                <UnitCard def={def} disabled role={bentRole} bent={bentRole !== def?.role} dualClass={dualClass} />
              </div>
              {runState.deployed.includes(entry.key) && (
                <div
                  className="hw-badge hw-badge--active"
                  style={{ justifyContent: "center", fontSize: 11 }}
                  title="Currently fighting, deployed to the battlefield - not sitting in Reserve"
                >
                  On the Bench (fighting)
                </div>
              )}
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
              {/* Marc: "kaiken pitää mahtua näytölle ilman scrollausta"
                  (everything needs to fit on screen without scrolling) -
                  Reforge and Sell used to stack as 2 separate full-width
                  buttons, the single biggest per-card height cost on the
                  bench (a 5-unit bench could run 600px+ tall). Side by
                  side instead, same click targets/labels, half the
                  vertical footprint - shorter text ("Reforge"/"Sell"
                  alone, cost moved to the tooltip) so 2 buttons still
                  fit a 150px card without wrapping. */}
              <div style={{ display: "flex", gap: 4 }}>
                {canReforge && (
                  <button
                    className="hw-move-btn"
                    style={{ fontSize: 11, padding: "4px 6px", flex: 1 }}
                    disabled={runState.essence < REFORGE_COST}
                    onClick={() => handleReforge(entry.key)}
                    title={`Swap ${def?.name} for a different random unit of the same tier (${REFORGE_COST} Essence)`}
                  >
                    Reforge
                  </button>
                )}
                <button
                  className="hw-move-btn"
                  style={{ fontSize: 11, padding: "4px 6px", flex: 1 }}
                  onClick={() => handleSell(entry.key)}
                  title={`Sell ${def?.name} back for ${sellRefund} Essence`}
                >
                  Sell (+{sellRefund})
                </button>
              </div>
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
