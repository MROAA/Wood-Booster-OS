import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react"
import { UNITS, upgradeCost } from "../../data/heartwood/units"
import { RELICS } from "../../data/heartwood/relics"
import { ITEMS, effectiveRole } from "../../data/heartwood/items"
import { CHARACTERS, COMMANDER_RANK_MAX, commanderRankCost } from "../../data/heartwood/characters"
import { ENEMIES } from "../../data/heartwood/enemies"
import { resolveFormation } from "../../data/heartwood/formations"
import { tribesOf } from "../../data/heartwood/synergies"
import { SHOP_LAYOUT } from "../../data/heartwood/shopLayout"
import { findDualClassFor } from "../../data/heartwood/dualClasses"
import {
  REFORGE_COST,
  RETRAIN_COST,
  effectiveItemSlots,
  MARKET_LEVEL_MAX,
  MARKET_LEVEL_UNLOCKS,
  marketLevelCost,
  MARKET_TIER_MAX,
  MARKET_TIERS,
  marketTierCost,
  marketTierPreview,
  effectiveMarketTier,
  benchTribeCounts,
  difficultyTierForNode,
  RESERVE_CAP,
  DEPLOY_SLOTS,
  RUN_PATH,
  sellRefundFor,
  effectiveSellMult,
  bankInterestFor,
  economyCrewEffects,
  SHOP_INVESTMENTS,
  investmentOwned,
  investmentUnlocked,
  antidoteCost,
  antidoteQueued,
  effectiveRecruitCost,
  MARKET_EVENTS,
  GAMBLE_COST,
} from "../../services/heartwood/runEngine"
import UnitCard from "./UnitCard"
import ItemCard from "./ItemCard"
import UpgradeChoice from "./UpgradeChoice"
import BuildScore from "./BuildScore"
import EconomyCrew from "./EconomyCrew"
import MerchantGreeting from "./MerchantGreeting"
import { CardGlyph } from "./cardArt"
import { startPointerDrag } from "./pointerDrag"
import { usePatchPreview } from "../hearthwood-studio/usePatchPreview"
import { useFreeLayout } from "./useFreeLayout.jsx"
import PatchPreviewPanel from "../hearthwood-studio/PatchPreviewPanel"
import marketBanner from "../../assets/heartwood/battle-bg.jpg"
import hearthwoodLogo from "../../assets/heartwood/hearthwood-logo.png"
// Marc's own Copilot-made plaque buttons (kuvia/ drop, "luon microsoft
// copilotilla napit" / "lisään ne samaan kansioon ja käytät niitä
// uissa" - I'm making the buttons with Copilot, I'll add them to the
// same folder and you use them in the UIs). Each source PNG had a
// "Made with AI" pill baked into its top-right corner that had to be
// alpha-punched out first (plain -fill/-draw did NOT work here - it
// paints over the pixels but leaves alpha untouched, so the badge
// still showed - needed a real -channel A -fx rewrite, verified with
// a pixel sample afterwards). Marc confirmed by name which button
// "hearthwood market.png" replaces (see the Market tab button below);
// "sell.png" is this file's own best-fit read of his instruction to
// find sell.png's real home ("lue nykyinen UI ja löydä paras oikea
// vastine").
//
// Second art-batch pass: Marc, pointing at "yoursquad.png" directly -
// "tämä korvaa your squad napin" (this replaces the Your Squad button)
// - see below. "confirm.png" found a real home too: the "Continue"
// button that leaves the shop and locks in this visit (SquadDraft's
// own bottom CTA) is the closest thing this screen has to a
// leaving-shop confirmation moment, so it gets confirm.png the same
// background-plaque treatment sell.png already established, scoped to
// just this one button via its own modifier class (not the shared
// .hw-end-turn class every other screen's Continue/End Turn button
// also uses). "buy.png"/"trade.png" are STILL sitting uncropped in the
// kuvia/ drop folder, re-checked fresh against the current game (Guild
// Hall, rescaled economy) and still with no honest home: recruiting is
// still a single whole-card click with no discrete "Buy" button
// anywhere (UnitCard.jsx/ItemCard.jsx - only a small `.hw-card-cost`
// price pip, too small to host a whole plaque without either hiding
// the number or looking absurd), and a repo-wide grep for
// trade/exchange/swap turns up nothing - this game has no trading
// concept at all, just recruit/sell. Forcing either in would be
// exactly the "bad fit" this task's own instructions warned against -
// see this PR's description for the full re-investigation.
import marketTabPlaque from "../../assets/heartwood/buttons/market-tab.png"
import sellPlaque from "../../assets/heartwood/buttons/sell-plaque.png"
import yourSquadPlaque from "../../assets/heartwood/buttons/your-squad-plaque.png"
import shopConfirmPlaque from "../../assets/heartwood/buttons/shop-confirm-plaque.png"

// The shop node: recruit whoever you can afford, reroll the rest,
// leave when ready. No forced pick-one - unlike the old card-reward
// screen, a shop lets you walk away empty-handed or buy several.
export default function SquadDraft({
  runState,
  onRecruit,
  onReroll,
  onGamble,
  onAntidote,
  onContinue,
  onRankUp,
  onUpgradeRelic,
  onReforge,
  onSell,
  onUpgradeUnit,
  onRetrain,
  onBuyItem,
  onEquipItem,
  onUnequipItem,
  onLevelUpMarket,
  onAdvanceMarketTier,
  onToggleFreeze,
  onUseCommanderActive,
  onBuyInvestment,
  onReclaimBuyback,
  showIntro,
  onDismissIntro,
  // 3-zone shop layout (Marc's sketch: "UI ei vielä hyödynnä kaikkea
  // tilaa" - the shop clustered in the centre with big empty margins
  // left/right). `mapSlot` is HeartwoodBattle's <RunMap/> rendered into
  // the RIGHT rail so the run map stays visible during the shop, not
  // just between phases. The LEFT rail (owned relics + item bag) is
  // built here in renderOwnedRail() since every piece of data it needs
  // is already in scope.
  mapSlot,
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
  const marketTier = runState.marketTier || 1
  const effTier = effectiveMarketTier(runState)
  const tierCost = marketTierCost(marketTier)
  const tierPreview = marketTierPreview(effTier)
  // Market Events (runEngine.js's MARKET_EVENTS, feat/hearthwood-market-events):
  // this shop stop is a special market (or null on a plain stop). Re-skins
  // the shop + locks Reroll/Freeze for the Blackroot Market.
  const marketEvent = runState.marketEvent || null
  const marketEventDef = marketEvent ? MARKET_EVENTS[marketEvent] : null
  const marketEventLocked = !!marketEventDef?.lockReroll
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
  // Your Squad tab: the bench array holds every owned unit, deployed and
  // reserve interleaved. Split it here so the tab can show two clearly
  // separated groups instead of one flat grid (Marc: "unit/reservi on
  // epaselva your squad valilehdessa... ne pitaa eritta paremmin").
  const deployedEntries = runState.bench.filter((e) => runState.deployed.includes(e.key))
  const reserveEntries = runState.bench.filter((e) => !runState.deployed.includes(e.key))
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
  // The per-unit Upgrade pick (UpgradeChoice overlay) - holds the bench
  // key currently being upgraded, or null.
  const [upgradingKey, setUpgradingKey] = useState(null)
  // Equip flow: click a bag item to select it, then click a slot pip on
  // any bench unit to equip it there (or click a filled pip directly,
  // with nothing selected, to unequip) - the same "click source, click
  // target" gesture FormationScreen.jsx already teaches for placing a
  // unit on the battlefield.
  const [selectedItemKey, setSelectedItemKey] = useState(null)
  const [justEquippedSlot, setJustEquippedSlot] = useState(null)
  // Free-position rail layout (Marc: "haluan tämän raahaa mihin
  // tahansa tasolle" - I want this at the drag-it-anywhere level -
  // then, once the left rail's 4 sections had it: "i want to be able
  // to move all of the pieces how i like"). ONE "Edit Layout" session
  // (`editingLayout`) covers BOTH rails - the left rail's 4 named
  // sections and the right rail's single map block; `layoutDraft`
  // holds every key from both rails' in-progress {x,y} at once, seeded
  // either from a previously-saved layout or from the CURRENT flow
  // positions (measured via `sectionRefs`, one shared bucket keyed by
  // name across both rails - "map" is as valid a key as "ledger") so
  // turning Edit Layout on is a visual no-op before anything is
  // actually dragged. Each rail gets its own ref (for its own
  // position:relative anchor) and its own computed height, since
  // they're independent containers.
  const [editingLayout, setEditingLayout] = useState(false)
  const [layoutDraft, setLayoutDraft] = useState(null)
  const [leftRailHeight, setLeftRailHeight] = useState(null)
  const [rightRailHeight, setRightRailHeight] = useState(null)
  const leftRailRef = useRef(null)
  const rightRailRef = useRef(null)
  const sectionRefs = useRef({})
  const {
    result: layoutResult,
    applyMode: layoutApplyMode,
    setApplyMode: setLayoutApplyMode,
    previewing: layoutPreviewing,
    applying: layoutApplying,
    errorMessage: layoutErrorMessage,
    preview: previewLayout,
    discard: discardLayoutPreview,
    apply: applyLayout,
  } = usePatchPreview({
    onApplied: () => {
      setEditingLayout(false)
      setLayoutDraft(null)
    },
  })
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
  // Free Layout foundation, extended into the Market tab's own content
  // (Marc: "haluan keskittyä nyt market osion muokattavuuden
  // parantamiseen... minun pitää muokkaa siitä itselleni mukavan
  // näköinen" - I want to focus on the Market's editability now,
  // I need to make it look nice to myself). Uses the SAME generalized
  // useFreeLayout.jsx hook the other 6 screens already use (DB-backed,
  // not this file's own older RAILS/shopLayout.js mechanism which the
  // left/right rails still use) - this is new content this session
  // hasn't touched before, so it starts on the newer, more scalable
  // mechanism rather than extending the older file-patching one.
  // Called unconditionally here (top of the component, same reasoning
  // as HeartwoodBattle.jsx's own mapStripLayout) even though its own
  // toolbar only ever renders while activeTab === "market" - the
  // .hw-panel--market panel is always MOUNTED (just `hidden` when not
  // active), so gating the TOOLBAR's render inside that panel is
  // enough to guarantee startEditing() never measures a hidden block;
  // the hook call itself doesn't need to be conditional too.
  // Round 2 of "every button individually" (Marc's own words: "haluan
  // liikuttaa niitä vapaasti kaikkia yksitellen") - split the shop
  // action row's ONE combined "shopActions" key into 5 (each button,
  // plus the Gamble reveal banner, on its own). Old saved DB rows
  // keyed "shopActions" simply go inert - savedFreePositions() needs
  // every CURRENT key filled, so this correctly falls back to flow
  // mode until Marc re-runs Edit Layout for the new key set.
  // "recruitGrid"/"itemsGrid" moved OUT to their own dedicated
  // marketRecruitLayout/marketItemLayout scopes below (round 3, slot-
  // based positioning) - a grid's own CSS Grid layout doesn't mix well
  // with this scope's plain flow-root container, and each grid's own
  // slots need independent per-card positions, not one shared block.
  const marketTabLayout = useFreeLayout({
    screenId: "marketTabContent",
    keys: ["rerollBtn", "freezeBtn", "gambleBtn", "antidoteBtn", "gambleReveal"],
  })
  // Round 3 ("every button individually", the harder half deferred from
  // round 2): individual positioning for the 3 recruit-offer cards and
  // the 3 item-offer cards. SHOP_SIZE/ITEM_SHOP_SIZE (runEngine.js) are
  // fixed constants - always exactly 3 slots each - so "slot index N,
  // whichever unit/item currently fills it" is a stable, positionable
  // concept the same way the shop action buttons are. Container refs
  // attach DIRECTLY to the existing .hw-market-featured-grid/
  // .hw-market-items-grid divs (both real CSS Grid, `display:grid`) -
  // no wrapper div, no scoped CSS override needed: containerStyle only
  // ever sets position/height inline, never touching `display`, so the
  // grid's own auto-fit track layout survives untouched in flow mode,
  // and simply stops mattering once children go position:absolute in
  // free mode (an absolutely-positioned grid child is removed from
  // grid layout entirely, same as it would be from flex/block flow).
  const marketRecruitLayout = useFreeLayout({
    screenId: "marketRecruitSlots",
    keys: ["slot0", "slot1", "slot2"],
  })
  const marketItemLayout = useFreeLayout({
    screenId: "marketItemSlots",
    keys: ["slot0", "slot1", "slot2"],
  })
  // Header widgets (Market Level / Market Tier / Commander cluster) -
  // each widget stays internally fused (Marc explicitly asked for that
  // grouping earlier - see .hw-market-level-widget's own comment), but
  // the 4 widgets/pieces can now move independently of each other.
  // Lives OUTSIDE .hw-shop-3zone entirely (always visible, no tab
  // gating needed) - see its render site below for the inline-style-
  // merge trick used instead of a scoped CSS override.
  const marketHeaderLayout = useFreeLayout({
    screenId: "marketHeaderWidgets",
    keys: ["marketLevelWidget", "marketTierWidget", "tierPreview", "commanderCluster"],
  })
  // The Market/Squad tab TOGGLE buttons themselves (centerSections.tabs
  // below) - always visible, outside any hidden panel.
  const marketTabButtonsLayout = useFreeLayout({
    screenId: "marketTabButtons",
    keys: ["marketTabBtn", "squadTabBtn"],
  })
  // The Continue button - last child of .hw-shop-center, always
  // visible regardless of active tab. Single-key scope, same value as
  // every other lone-block scope in Stage A: relocate or hide it.
  const marketContinueLayout = useFreeLayout({
    screenId: "marketContinueBtn",
    keys: ["continueBtn"],
  })
  // Squad tab, PR B of the same round. Two SEPARATE scopes since
  // buildScore/itemBag and the deployed/reserve split live in visually
  // distinct parts of the panel - see each scope's own render site
  // below for the exact wrapper each one uses.
  const squadTopLayout = useFreeLayout({
    screenId: "squadTabTop",
    keys: ["buildScore", "itemBag"],
  })
  const squadSplitLayout = useFreeLayout({
    screenId: "squadTabSplit",
    keys: ["squadDeployed", "squadReserve"],
  })
  // Round 3 ("every button individually", the bench half): individual
  // positioning for each CARD within the deployed/reserve groups above
  // (squadSplitLayout itself only positions the two GROUP SECTIONS
  // relative to each other - unchanged, still separate from this).
  // DEPLOY_SLOTS=4 is a hard, never-changing cap. Reserve's cap
  // (RESERVE_CAP + benchCapBonus) sounds unbounded but isn't -
  // benchCapBonus only ever comes from 2 ONE-TIME meta-progression
  // perks ("Wide Bench" +2, "Deep Reserves" +1, metaPerks.js, each
  // "bought once and kept" per that file's own comment) - a confirmed
  // hard maximum of RESERVE_CAP(6) + 3 = 9 reserve slots, ever. Slots
  // beyond the CURRENT count render an empty (zero-footprint) wrapper,
  // same pattern as the Market's item-offer slots.
  const squadDeployedSlots = useFreeLayout({
    screenId: "squadDeployedSlots",
    keys: ["slot0", "slot1", "slot2", "slot3"],
  })
  const squadReserveSlots = useFreeLayout({
    screenId: "squadReserveSlots",
    keys: ["slot0", "slot1", "slot2", "slot3", "slot4", "slot5", "slot6", "slot7", "slot8"],
  })
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

  // One recruit-offer card. Extracted from its old inline .map (round 3
  // of "every button individually" - slot-based positioning for the 3
  // recruit-offer cards) so each of the 3 fixed slots can call this
  // independently instead of one shared .map over the whole array.
  function renderRecruitCard(def) {
    const owned = runState.bench.filter((e) => e.defId === def.id).length
    const willFuse = owned >= 2
    const reserveCap = RESERVE_CAP + (runState.benchCapBonus || 0)
    const reserveFull = !willFuse && runState.bench.length >= DEPLOY_SLOTS + reserveCap
    const tribeMatch = tribesOf(def.id, def).some((t) => (ownedTribes[t] || 0) > 0)
    return (
      // Real bug caught during this pass's own 1860x960 iteration (not
      // eyeballed - a live Playwright re-roll loop reproduced it):
      // "Fuses now!"/"Reserve full" used to be a normal flow sibling
      // below the card, adding ~19px to just THAT one wrapper - but CSS
      // Grid stretches every row item to the row's tallest (this grid
      // never overrides align-items), so the instant ANY one of the 3
      // offers rolled with this badge, the WHOLE row grew by the same
      // amount, even the 2 cards with no badge at all - a purely
      // conditional, random-per-visit height contribution the fit
      // budget had no way to account for. Now an absolute overlay
      // (position relative lives here on the wrapper, same pattern
      // UnitCard's own .hw-frost-badge already uses) pinned to the
      // bottom of the card instead of pushing it - zero layout-height
      // cost regardless of which offers roll it.
      <div style={{ position: "relative" }}>
        <UnitCard
          def={def}
          disabled={runState.essence < effectiveRecruitCost(runState, def) || reserveFull}
          onClick={() => onRecruit(def.id)}
          tribeMatch={tribeMatch}
          frozen={!!runState.frozen}
          costOverride={effectiveRecruitCost(runState, def)}
        />
        {willFuse && (
          <div
            className="hw-badge hw-card-overlay-badge"
            style={{ color: "var(--hw-ember)", borderColor: "var(--hw-ember)" }}
            title="You already own 2 - recruiting this one fuses all 3 into a stronger Tier 2 unit"
          >
            Fuses now! ({owned}/3 owned)
          </div>
        )}
        {reserveFull && (
          <div
            className="hw-badge hw-card-overlay-badge"
            style={{ color: "var(--hw-hp)", borderColor: "var(--hw-hp)" }}
            title={`Reserve is full (${reserveCap}/${reserveCap}) - sell or fuse to make room`}
          >
            Reserve full
          </div>
        )}
      </div>
    )
  }

  // One owned-unit card, shared by both Your Squad groups (fighting /
  // reserve) below. Pulled out of an inline .map so the deployed and
  // reserve lists render identical cards - the only difference between
  // the two groups is which section they sit in and the quiet dim on
  // the reserve grid, nothing about the card itself.
  function renderBenchCard(entry) {
    const def = UNITS[entry.defId]
    const canReforge = def?.displayTier !== 2
    // Upgrade (upgrades.js): branch picks recorded on entry.upgrades;
    // level is its length, capped at UPGRADE_MAX_LEVEL. Fused units
    // can't upgrade (same as reforge).
    const upLevel = (entry.upgrades || []).length
    const upCost = upgradeCost(upLevel)
    const canUpgrade = def?.displayTier !== 2 && upCost !== null
    // Fusion progress: 3 owned copies of the same base unit merge
    // into a Tier 2 copy automatically (runEngine.js's fuseAll).
    const copiesOwned = def?.displayTier !== 2 ? runState.bench.filter((e) => e.defId === entry.defId).length : 0
    const equippedItems = runState.items.filter((it) => it.equippedTo === entry.key)
    const sellRefund = sellRefundFor(def, effectiveSellMult(runState))
    // Hero Bending (items.js's bendsRoleTo/effectiveRole) - a Bending
    // item equipped here visibly overwrites this card's role-accent/
    // label, not just its stats.
    const bentRole = def ? effectiveRole(def.role, equippedItems.map((it) => it.defId)) : def?.role
    // Dual-Class (dualClasses.js): only meaningful while this entry is
    // actually deployed (a benched, undeployed unit isn't in the fight
    // the combo would apply to).
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
          <UnitCard def={def} disabled role={bentRole} bent={bentRole !== def?.role} dualClass={dualClass} entry={entry} />
        </div>
        <div
          className="hw-item-slots"
          data-pending={!!selectedItemDef}
          title="Item slots - click a bag item above, then click a slot to equip it"
        >
          {Array.from({ length: maxItemSlots }, (_, slotIndex) => {
            const equipped = equippedItems.find((it) => it.slotIndex === slotIndex)
            const itemDef = equipped ? ITEMS[equipped.defId] : null
            return (
              <span
                key={slotIndex}
                className={`hw-item-slot${itemDef ? " hw-item-slot--filled" : ""}${
                  justEquippedSlot === `${entry.key}-${slotIndex}` ? " hw-card--reforged" : ""
                }`}
                title={itemDef ? `${itemDef.name} - click to unequip` : selectedItemDef ? `Equip ${selectedItemDef.name} here` : "Empty item slot"}
                onClick={() => handleSlotClick(entry.key, slotIndex, equipped ? equipped.key : null)}
              >
                {itemDef ? <CardGlyph name={itemDef.icon} className="hw-intent-glyph" /> : <span className="hw-item-slot-plus">+</span>}
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
        {/* Upgrade — the PRD's "level-up = a strategic choice". Its own
            row above Reforge/Sell so the branch pick reads as the
            unit's identity decision, not a churn action. */}
        {def?.displayTier !== 2 && (
          <button
            className="hw-move-btn hw-upgrade-btn"
            style={{ fontSize: 11, padding: "4px 6px", width: "100%" }}
            disabled={!canUpgrade || runState.essence < (upCost ?? Infinity)}
            onClick={() => setUpgradingKey(entry.key)}
            title={canUpgrade ? `Pick an upgrade branch for ${def?.name} (${upCost} Essence)` : `${def?.name} is fully upgraded`}
          >
            {canUpgrade ? `Upgrade (+${upCost})` : "Maxed"}
            {upLevel > 0 && <span className="hw-upgrade-btn-lv"> · Lv {upLevel}</span>}
          </button>
        )}
        {/* Reforge + Sell side by side - half the vertical footprint of
            two stacked full-width buttons (this screen's zero-scroll
            budget), same click targets/labels. */}
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
            className="hw-move-btn hw-sell-btn"
            style={{ fontSize: 11, padding: "4px 6px", flex: 1 }}
            onClick={() => handleSell(entry.key)}
            title={`Sell ${def?.name} back for ${sellRefund} Essence`}
          >
            Sell (+{sellRefund})
          </button>
        </div>
      </div>
    )
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

  // LEFT rail of the 3-zone shop layout: everything the player already
  // OWNS - relics + the item bag - pulled out of the old inline strip
  // that sat between the header and the tabs (Marc's sketch labels this
  // column "Items / Relics"). Compact chips rather than full RelicChoice
  // / ItemCard renders on purpose: Marc wants the rails "clear but
  // surfaces a lot of info at once ... small info-dense pieces", and a
  // single narrow column of full cards would push most of the list
  // below the fold. Relic Upgrade still works from here (same
  // onUpgradeRelic the inline strip called); an unequipped bag item is
  // click-to-select, feeding the same selectedItemKey / equip-prompt
  // flow the Your Squad tab's own bag list already drives.
  // Marc: "haluaisin siirtää market osiossa nappeja ja asioita eri
  // paikkoihin... kuin wordpress elementeillä" (I'd like to move
  // buttons and things around in the market section, like WordPress
  // elements) - these 4 named sections render in whatever order
  // shopLayout.js's SHOP_LAYOUT.market.leftRailOrder lists them,
  // editable in Hearthwood Studio like any other list field. Falls
  // back to this same default order if that data is ever missing/
  // malformed, and silently skips any key it doesn't recognize -
  // a typo in the Studio can't crash the market.
  const DEFAULT_LEFT_RAIL_ORDER = ["ledger", "buyback", "relics", "items"]

  // Phase 2 (Marc: "i want to be able to move all of the pieces how i
  // like"): the right rail's map joins the same free-position
  // mechanism the left rail's 4 sections already have, generalized
  // instead of duplicated - a lesson this session has learned more
  // than once (the Studio reader's own `classifyField` saga: 3
  // separately-copied classification loops drifted out of sync
  // twice). `keys` is what each rail's positions object needs ALL of
  // to count as "saved" (the all-or-nothing check below); `field` is
  // which SHOP_LAYOUT.market property holds them. The center market/
  // squad panel deliberately has no entry here - investigated and
  // confirmed too risky for this treatment as-is (fluid width, two
  // differently-shaped panels sharing one tab-toggled slot, a card
  // component with its own hover animation).
  const RAILS = {
    left: { keys: DEFAULT_LEFT_RAIL_ORDER, field: "leftRailPositions", ref: leftRailRef, setHeight: setLeftRailHeight },
    right: { keys: ["map"], field: "rightRailPositions", ref: rightRailRef, setHeight: setRightRailHeight },
  }

  // `leftRailPositions`/`rightRailPositions` each only take effect
  // once ALL of that rail's own keys have a saved {x,y} - one clean
  // all-or-nothing check per rail, so a section mid-migration can
  // never end up half in flow, half absolute. The two rails are
  // independent: the map can be free-positioned while the left rail
  // is still in flow mode, or vice versa.
  function savedFreePositions(rail) {
    const positions = SHOP_LAYOUT.market?.[rail.field]

    const complete = positions
      && rail.keys.every((key) => positions[key] && typeof positions[key].x === "number" && typeof positions[key].y === "number")

    return complete ? positions : null
  }

  const leftFreeActive = editingLayout || Boolean(savedFreePositions(RAILS.left))
  const rightFreeActive = editingLayout || Boolean(savedFreePositions(RAILS.right))

  // Entering Edit Layout should be a visual no-op before anything is
  // actually dragged - if a rail already has a saved layout, start
  // from it; otherwise CAPTURE that rail's sections' current on-screen
  // (flow-mode) positions, relative to ITS OWN container, so the first
  // frame of "free mode" looks identical to the flow layout it
  // replaced. Runs for both rails into the one shared `layoutDraft`.
  function startEditingLayout() {
    const captured = {}

    for (const rail of [RAILS.left, RAILS.right]) {
      const saved = savedFreePositions(rail)

      if (saved) {
        Object.assign(captured, saved)
        continue
      }

      const railRect = rail.ref.current?.getBoundingClientRect()

      for (const key of rail.keys) {
        const el = sectionRefs.current[key]
        const rect = el?.getBoundingClientRect()

        captured[key] = rect && railRect
          ? { x: Math.round(rect.left - railRect.left), y: Math.round(rect.top - railRect.top) }
          : { x: 0, y: 0 }
      }
    }

    setLayoutDraft(captured)
    setEditingLayout(true)
  }

  function cancelEditingLayout() {
    setEditingLayout(false)
    setLayoutDraft(null)
    discardLayoutPreview()
  }

  function handleSectionDragStart(e, key) {
    e.preventDefault()

    const origin = layoutDraft[key]

    startPointerDrag(e, (dx, dy) => {
      setLayoutDraft((previous) => ({ ...previous, [key]: { x: origin.x + dx, y: origin.y + dy } }))
    })
  }

  async function handleSaveLayout() {
    // `leftRailPositions`/`rightRailPositions` both start as `{}` with
    // none of their keys present yet, so a plain `op:"set"` on a
    // nested path like ["market","rightRailPositions","map","x"] can't
    // work - "set" only updates an EXISTING scalar leaf, it can't
    // create a key that isn't already there. `setRaw` replacing the
    // WHOLE positions object in one shot works whether it's currently
    // empty (first save) or already populated (a later re-save), so
    // it's the one mechanism for both rails.
    const edits = [RAILS.left, RAILS.right].map((rail) => {
      const body = rail.keys
        .map((key) => `    ${key}: { x: ${layoutDraft[key].x}, y: ${layoutDraft[key].y} }`)
        .join(",\n")

      return { path: ["market", rail.field], op: "setRaw", value: `{\n${body},\n  }` }
    })

    await previewLayout({ type: "shopLayout", entityId: "market", edits })
  }

  async function handleResetLayout() {
    await previewLayout({
      type: "shopLayout",
      entityId: "market",
      edits: [RAILS.left, RAILS.right].map((rail) => ({ path: ["market", rail.field], op: "setRaw", value: "{}" })),
    })
  }

  // Absolutely-positioned children contribute zero height to their
  // parent, so a rail's own box would otherwise collapse to nothing
  // while its free mode is active - measure that rail's own sections'
  // rendered height and set the tallest bottom edge as its explicit
  // height. Re-runs whenever the draft positions change (dragging) or
  // the underlying content does (runState), matching what would have
  // naturally driven the rail's height in flow mode. One effect for
  // both rails - each rail's own `setHeight` only fires from its own
  // branch of the loop.
  useLayoutEffect(() => {
    for (const [rail, active] of [[RAILS.left, leftFreeActive], [RAILS.right, rightFreeActive]]) {
      if (!active) {
        rail.setHeight(null)
        continue
      }

      const heights = rail.keys.map((key) => {
        const el = sectionRefs.current[key]
        const pos = layoutDraft ? layoutDraft[key] : SHOP_LAYOUT.market?.[rail.field]?.[key]

        return el && pos ? pos.y + el.offsetHeight : 0
      })

      rail.setHeight(Math.max(0, ...heights))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leftFreeActive, rightFreeActive, layoutDraft, runState])

  // Shared by renderOwnedRail() (the left rail's 4 sections) and the
  // right rail's own single map block below - wraps `content` in a
  // ref-bearing div REGARDLESS of mode (see renderOwnedRail's own
  // comment for why: `sectionRefs` needs a live measurement even in
  // flow mode, for `startEditingLayout()` to capture from), absolutely
  // positioned with a drag handle once `freeActive` is true AND that
  // key already has a saved/draft position.
  function renderPositionedSection(rail, key, content, freeActive) {
    if (!content) {
      return null
    }

    const pos = freeActive ? (layoutDraft ? layoutDraft[key] : SHOP_LAYOUT.market?.[rail.field]?.[key]) : null

    return (
      <div
        key={key}
        ref={(el) => {
          sectionRefs.current[key] = el
        }}
        className={pos ? "hw-shop-rail-section-positioned" : undefined}
        style={pos ? { position: "absolute", left: pos.x, top: pos.y } : undefined}
      >
        {editingLayout && pos && (
          <div
            className="hw-shop-rail-drag-handle"
            onMouseDown={(e) => handleSectionDragStart(e, key)}
            title="Drag to reposition"
          >
            ⠿
          </div>
        )}
        {content}
      </div>
    )
  }

  const DEFAULT_CENTER_ORDER = ["greeting", "tutorialHint", "evolutionNotice", "tabs", "equipPrompt", "marketEventBanner"]

  function renderCenterSections() {
    const centerSections = {
      // The traveling merchant (merchant.js / MerchantGreeting) - a
      // named face + one hand-authored line that shifts with the Act,
      // the forest's state and the squad's dominant tribe, so the
      // market reads as a place in the story, not a silent stall.
      greeting: () => <MerchantGreeting key="greeting" runState={runState} />,

      tutorialHint: () =>
        showIntro && (
          <div key="tutorialHint" className="hw-hint hw-hint--tutorial" style={{ marginTop: 3 }}>
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
        ),

      // One-shot notice for units that evolved on the last win
      // (runEngine.applyEvolutions -> runState.lastEvolved, cleared on
      // leaveShop). Evolution has no overlay of its own - ResultOverlay
      // renders BEFORE resolveBattleOutcome runs - so the first shop
      // screen after the win is where the player is told. Same
      // .hw-hint language as the equip banner below.
      evolutionNotice: () =>
        runState.lastEvolved?.length > 0 && (
          <div key="evolutionNotice" className="hw-hint hw-hint--evolved" style={{ marginTop: 3 }}>
            <span>
              <span className="hw-evolve-mark hw-evolve-mark--close">&#9650;</span>{" "}
              {runState.lastEvolved.map((e) => `${e.from} grew into a ${e.to}`).join(" · ")}.
            </span>
          </div>
        ),

      // Marc, asked directly which button "hearthwood market.png"
      // should replace, confirmed: this tab toggle - and asked for it
      // centered above the panel ("keskitä se sivulle yläosioon"), not
      // left-aligned next to Your Squad the way the plain pill used to
      // sit. Market + Your Squad merged back into ONE row (was two
      // stacked rows - a real fit regression at Marc's actual
      // 1860x960 browser budget). Round 2: Marc, live, annotating a
      // screenshot of exactly this row - "noita nappeja isommaksi"
      // (make those buttons bigger) - both buttons grew from 38px to
      // 64px tall and Your Squad became an image button too
      // (yourSquadPlaque, same treatment as Market) rather than
      // staying a plain text pill next to a much showier neighbor.
      // The bench count can't live inside the plaque art since it
      // changes every recruit/sell, so it rides along as its own
      // small corner badge instead.
      tabs: () => (
        <Fragment key="tabs">
          {/* Free Layout, round 2 ("every button individually") - always
              visible (not behind any hidden tab panel). Deliberately a
              BLOCK-LEVEL sibling of .hw-tab-row--market-art, not nested
              inside it - real bug caught live during this pass's own
              verification: nesting the toolbar INSIDE the flex row made
              it a flex ITEM sharing the row's finite width with the
              free-layout-container, so the container (and both buttons
              inside it) visibly shifted ~60px sideways the instant
              editingLayout swapped the toolbar from 2 buttons to 3
              (Edit Layout -> Save/Cancel/Reset), since the wider toolbar
              flex-shrank its neighbor. Keeping it a plain block sibling
              means its width never competes with the row's own layout. */}
          {import.meta.env.DEV && (
            <div className="hw-free-layout-toolbar">
              {!marketTabButtonsLayout.editingLayout ? (
                <button className="hw-move-btn" onClick={marketTabButtonsLayout.startEditing} disabled={marketTabButtonsLayout.loading}>
                  Edit Layout
                </button>
              ) : (
                <>
                  <button className="hw-move-btn" onClick={marketTabButtonsLayout.saveLayout} disabled={marketTabButtonsLayout.saving}>
                    Save Layout
                  </button>
                  <button className="hw-move-btn" onClick={marketTabButtonsLayout.cancelEditing} disabled={marketTabButtonsLayout.saving}>
                    Cancel
                  </button>
                </>
              )}
              <button className="hw-move-btn" onClick={marketTabButtonsLayout.resetLayout} disabled={marketTabButtonsLayout.saving}>
                Reset Layout
              </button>
              {marketTabButtonsLayout.errorMessage && (
                <span className="hw-free-layout-error">{marketTabButtonsLayout.errorMessage}</span>
              )}
            </div>
          )}
          <div className="hw-tab-row hw-tab-row--market-art">
            <div
              ref={marketTabButtonsLayout.containerRef}
              className="hw-free-layout-container"
              style={marketTabButtonsLayout.containerStyle}
              data-free-active={marketTabButtonsLayout.freeActive || undefined}
              data-editing-layout={marketTabButtonsLayout.editingLayout || undefined}
            >
              {marketTabButtonsLayout.renderSection(
                "marketTabBtn",
                <button
                  className="hw-market-tab-btn"
                  data-active={activeTab === "market"}
                  onClick={() => setActiveTab("market")}
                  aria-label="Market"
                  title="Market"
                >
                  <img src={marketTabPlaque} alt="" />
                  {/* Visually-hidden text node, not just an aria-label - keeps
                      this button findable by visible text the same way every
                      other tab/action button in this game is (including by
                      existing Playwright specs like .scratch/verify_market_
                      redesign.mjs's `hasText: "Market"` locator), even though
                      the plaque art itself already reads "HEARTHWOOD MARKET"
                      to a sighted player. */}
                  <span className="hw-sr-only">Market</span>
                </button>
              )}
              {marketTabButtonsLayout.renderSection(
                "squadTabBtn",
                <button
                  className="hw-squad-tab-btn"
                  data-active={activeTab === "squad"}
                  onClick={() => setActiveTab("squad")}
                  aria-label={`Your Squad (${runState.bench.length})`}
                  title="Your Squad"
                >
                  <img src={yourSquadPlaque} alt="" />
                  <span className="hw-squad-count-badge" title={`${runState.bench.length} on the bench`}>
                    {runState.bench.length}
                  </span>
                  <span className="hw-sr-only">Your Squad ({runState.bench.length})</span>
                </button>
              )}
            </div>
          </div>
        </Fragment>
      ),

      // Equip prompt: the required visible cue that something is
      // selected and waiting for a target, same job the "primed" badge
      // above does for the Commander's Active Power. Placed outside
      // the tab-gated panels (hw-market-columns) so it's on screen on
      // EITHER tab - the instant buying an item auto-selects it,
      // whichever tab the player was shopping on, and stays visible if
      // they instead select a bag item by hand while already on the
      // Squad tab.
      equipPrompt: () =>
        selectedItemDef && (
          <div key="equipPrompt" className="hw-hint hw-hint--pending" style={{ marginTop: 10 }}>
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
        ),

      // Market Event banner (feat/hearthwood-market-events): when this
      // shop stop rolled a special market, a re-skinned strip above the
      // columns naming it, its flavour, and its catch. `data-tone`
      // drives the accent (gold / moss / curse). Placed here (outside
      // the tab-gated panels) so it's on screen on either tab, same as
      // the equip prompt above.
      marketEventBanner: () =>
        marketEventDef && (
          <div key="marketEventBanner" className="hw-market-event-banner" data-tone={marketEventDef.tone}>
            <div className="hw-market-event-name">{marketEventDef.name}</div>
            <div className="hw-market-event-blurb">{marketEventDef.blurb}</div>
            <div className="hw-market-event-effect">{marketEventDef.effect}</div>
          </div>
        ),
    }

    const order = SHOP_LAYOUT.market?.centerOrder || DEFAULT_CENTER_ORDER

    return order.map((key) => centerSections[key]?.() ?? null)
  }

  function renderOwnedRail() {
    const relics = runState.relics || []
    const items = runState.items || []
    const buyback = runState.buyback

    const sections = {
      // The Ledger (runEngine.SHOP_INVESTMENTS): one-time, run-wide
      // shop buys - a "standing decisions" home in the left rail,
      // distinct from the this-visit for-sale cards in the centre.
      // Same chip + inline-cost-button shape as the Relics list
      // below, with a "✓" owned state mirroring its "MAX".
      // Tiering pass (Marc: "pitkä lista... liikaa kerralla
      // harkittavaksi" - too long a list to weigh at once): only
      // investments already unlocked (investmentUnlocked - gated on
      // EITHER Market Level or Market Tier, whichever the entry
      // itself specifies as the more logical pairing) are listed at
      // all, an owned one always stays visible regardless (both
      // meters only ever increase, so nothing can un-unlock), and a
      // quiet count of what's still locked replaces the rest - never
      // naming them, so there's nothing new to weigh, just a promise
      // that more arrives as the run grows. EconomyCrew (economy.js -
      // which deployed units are buying you a run-layer edge right
      // now, renders nothing until one is on the board) stays paired
      // with the Ledger rather than its own reorderable slot - it's a
      // quiet economy-status readout, not a "section" in Marc's own
      // sketch of this column.
      ledger: () => (
        <div key="ledger">
          <div className="hw-rail-section hw-rail-section--ledger">
            <div className="hw-section-label hw-rail-label">The Ledger</div>
            <div className="hw-rail-list">
              {Object.entries(SHOP_INVESTMENTS)
                .filter(([id]) => investmentOwned(runState, id) || investmentUnlocked(runState, id))
                .map(([id, inv]) => {
                  const owned = investmentOwned(runState, id)
                  return (
                    <div key={id} className="hw-rail-chip" title={inv.desc} data-owned={owned || undefined}>
                      <CardGlyph name="rune" className="hw-intent-glyph" />
                      <span className="hw-rail-chip-name">{inv.name}</span>
                      {owned ? (
                        <span className="hw-rail-chip-max">✓</span>
                      ) : (
                        <button
                          className="hw-move-btn hw-rail-upgrade"
                          disabled={runState.essence < inv.cost}
                          onClick={() => onBuyInvestment(id)}
                          title={`${inv.desc} - ${inv.cost} Essence, one time`}
                        >
                          <CardGlyph name="spark" className="hw-intent-glyph" />
                          {inv.cost}
                        </button>
                      )}
                    </div>
                  )
                })}
            </div>
            {(() => {
              const lockedCount = Object.entries(SHOP_INVESTMENTS).filter(
                ([id]) => !investmentOwned(runState, id) && !investmentUnlocked(runState, id),
              ).length
              return lockedCount > 0 ? (
                <p className="hw-rail-empty" title="More Ledger investments unlock as your Market Level and Market Tier grow.">
                  +{lockedCount} more as the market grows
                </p>
              ) : null
            })()}
          </div>
          <EconomyCrew runState={runState} />
        </div>
      ),

      // Buyback (runEngine.sellUnit / reclaimBuyback): the last unit
      // sold, reclaimable at its refund price. Only shown once you've
      // sold something.
      buyback: () =>
        buyback ? (
          <div key="buyback" className="hw-rail-section hw-rail-section--buyback">
            <div className="hw-section-label hw-rail-label">Buyback</div>
            <div className="hw-rail-list">
              <div className="hw-rail-chip" title="Reclaim the last unit you sold, at the price it refunded. It comes back with no upgrades.">
                <CardGlyph name={UNITS[buyback.defId]?.art} className="hw-intent-glyph" />
                <span className="hw-rail-chip-name">{UNITS[buyback.defId]?.name || buyback.defId}</span>
                <button
                  className="hw-move-btn hw-rail-upgrade"
                  disabled={runState.essence < buyback.price}
                  onClick={() => onReclaimBuyback()}
                  title={`Reclaim ${UNITS[buyback.defId]?.name || "this unit"} - ${buyback.price} Essence`}
                >
                  <CardGlyph name="spark" className="hw-intent-glyph" />
                  {buyback.price}
                </button>
              </div>
            </div>
          </div>
        ) : null,

      relics: () => (
        <div key="relics" className="hw-rail-section">
          <div className="hw-section-label hw-rail-label">
            Relics <span className="hw-rail-count">{relics.length}</span>
          </div>
          {relics.length === 0 ? (
            <p className="hw-rail-empty">No relics yet.</p>
          ) : (
            <div className="hw-rail-list">
              {relics.map((id) => {
                const def = RELICS[id]
                const level = (runState.relicLevels || {})[id] || 0
                const cost = upgradeCost(level)
                return (
                  <div key={id} className="hw-rail-chip" title={def?.description}>
                    {def?.image ? (
                      <img src={def.image} alt="" className="hw-intent-glyph" />
                    ) : (
                      <CardGlyph name={def?.icon} className="hw-intent-glyph" />
                    )}
                    <span className="hw-rail-chip-name">
                      {def?.name}
                      {level > 0 ? ` +${level}` : ""}
                    </span>
                    {cost === null ? (
                      <span className="hw-rail-chip-max">MAX</span>
                    ) : (
                      <button
                        className="hw-move-btn hw-rail-upgrade"
                        disabled={runState.essence < cost}
                        onClick={() => onUpgradeRelic(id)}
                        title={`Permanently strengthen ${def?.name} (level ${level} -> ${level + 1}) - ${cost} Essence`}
                      >
                        <CardGlyph name="spark" className="hw-intent-glyph" />
                        {cost}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ),

      items: () => (
        <div key="items" className="hw-rail-section">
          <div className="hw-section-label hw-rail-label">
            Items <span className="hw-rail-count">{items.length}</span>
          </div>
          {items.length === 0 ? (
            <p className="hw-rail-empty">No items yet.</p>
          ) : (
            <div className="hw-rail-list">
              {items.map((it) => {
                const def = ITEMS[it.defId]
                const equippedName =
                  it.equippedTo === "commander"
                    ? commander?.name || "Commander"
                    : it.equippedTo != null
                      ? UNITS[runState.bench.find((e) => e.key === it.equippedTo)?.defId]?.name || "Equipped"
                      : null
                const selectable = it.equippedTo == null
                const isSelected = selectedItemKey === it.key
                return (
                  <div
                    key={it.key}
                    className={`hw-rail-chip hw-rail-chip--item${selectable ? " hw-rail-chip--selectable" : ""}${
                      isSelected ? " hw-rail-chip--selected" : ""
                    }`}
                    title={def?.description}
                    onClick={selectable ? () => handleBagItemClick(it.key) : undefined}
                  >
                    {def?.image ? (
                      <img src={def.image} alt="" className="hw-intent-glyph" />
                    ) : (
                      <CardGlyph name={def?.icon} className="hw-intent-glyph" />
                    )}
                    <span className="hw-rail-chip-name">{def?.name}</span>
                    {def?.bendsRoleTo && (
                      <span className="hw-badge hw-badge--bent hw-rail-chip-tag" title={`Bends the wearer toward ${def.bendsRoleTo}`}>
                        Bends
                      </span>
                    )}
                    {equippedName ? (
                      <span className="hw-rail-chip-eq" title={`Equipped to ${equippedName}`}>
                        {equippedName}
                      </span>
                    ) : (
                      <span className="hw-rail-chip-eq hw-rail-chip-eq--free">Unequipped</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ),
    }

    const order = SHOP_LAYOUT.market?.leftRailOrder || DEFAULT_LEFT_RAIL_ORDER

    // `leftRailOrder` keeps deciding DOM/tab order and paint order
    // (which section draws on top if two ever overlap) regardless of
    // mode - free positioning only changes HOW a section is wrapped
    // (absolute left/top vs plain flow), never the order it's visited
    // in.
    return <>{order.map((key) => renderPositionedSection(RAILS.left, key, sections[key]?.(), leftFreeActive))}</>
  }

  const upgradingEntry = upgradingKey != null ? runState.bench.find((e) => e.key === upgradingKey) : null

  return (
    <div className="hw-intro hw-market-stage hw-shop-3zone-stage">
      {upgradingEntry && (
        <UpgradeChoice
          unit={upgradingEntry}
          essence={runState.essence}
          onPick={(branchId) => {
            onUpgradeUnit(upgradingEntry.key, branchId)
            setUpgradingKey(null)
          }}
          onCancel={() => setUpgradingKey(null)}
        />
      )}
      {/* paddingRight/flexWrap keep this row's right-aligned badges clear
          of the fixed top-right utility cluster (HeartwoodBattle.jsx's
          utilityBar - exit link + How to Play + Change Commander) - it's
          position:fixed outside document flow, so nothing here pushes it
          aside on its own. 130px was sized for the exit link alone;
          utilityBar growing to 3 buttons wide (still Marc's own ask - see
          that component's comment - just wider than one link) needed the
          same clearance recalculated, not a cosmetic tweak. */}
      {/* hw-market-top-row: added this pass purely as a CSS scoping
          hook (Marc sent a heavily-annotated screenshot circling
          almost the entire screen, including this whole row, captioned
          "tee muokkaukset UIhin tän mukaisesti" - make the UI edits
          according to this - i.e. "bigger" applies here too, not just
          the plaques/Continue/cards named explicitly earlier) - lets
          heartwood.css grow just THIS row's badges/essence display
          without touching the shared .hw-badge class every other
          screen's badges also use. */}
      <div className="hw-market-top-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", paddingRight: 420 }}>
        <h1 className="hw-screen-title" style={{ fontSize: "var(--hw-fs-xl)", marginBottom: 0 }}>
          The Hearthwood Market
        </h1>
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
          {/* Essence interest (runEngine.bankInterest): the Essence you
              KEEP grows a little each victory, capped. Recomputed every
              render, so the number visibly shrinks/grows the instant you
              recruit / reroll / sell - the save-vs-spend tension made
              literal. Below the threshold it shows a muted prompt so the
              mechanic is discoverable rather than silent. */}
          {bankInterestFor(runState) > 0 ? (
            <span
              className="hw-essence-interest"
              title="Interest - Essence you keep grows a little with every victory. Spend it down and this shrinks."
            >
              &#9650; +{bankInterestFor(runState)}
            </span>
          ) : (
            <span
              className="hw-essence-interest hw-essence-interest--dormant"
              title={`Interest - keep ${economyCrewEffects(runState).interestThreshold}+ Essence and it grows a little with every victory.`}
            >
              save {economyCrewEffects(runState).interestThreshold}+ to earn interest
            </span>
          )}
        </div>
      </div>

      {/* Free Layout, round 2 ("every button individually") - always
          visible (outside .hw-shop-3zone entirely), so this toolbar
          renders unconditionally, same as the tab-buttons scope above. */}
      {import.meta.env.DEV && (
        <div className="hw-free-layout-toolbar">
          {!marketHeaderLayout.editingLayout ? (
            <button className="hw-move-btn" onClick={marketHeaderLayout.startEditing} disabled={marketHeaderLayout.loading}>
              Edit Layout
            </button>
          ) : (
            <>
              <button className="hw-move-btn" onClick={marketHeaderLayout.saveLayout} disabled={marketHeaderLayout.saving}>
                Save Layout
              </button>
              <button className="hw-move-btn" onClick={marketHeaderLayout.cancelEditing} disabled={marketHeaderLayout.saving}>
                Cancel
              </button>
            </>
          )}
          <button className="hw-move-btn" onClick={marketHeaderLayout.resetLayout} disabled={marketHeaderLayout.saving}>
            Reset Layout
          </button>
          {marketHeaderLayout.errorMessage && (
            <span className="hw-free-layout-error">{marketHeaderLayout.errorMessage}</span>
          )}
        </div>
      )}
      {/* This row already used an INLINE style object (not a CSS class),
          so merging {...base, width:"100%", ...containerStyle} preserves
          flow-mode layout exactly (inline style always wins the cascade)
          and switches cleanly to position:relative once free-active -
          width:100% keeps the box from shrinking once children go
          absolute, same reasoning as the tab-buttons scope's scoped CSS
          override above, just done inline here since this row has no
          class of its own to hang a scoped rule off of. */}
      <div
        ref={marketHeaderLayout.containerRef}
        className="hw-section-fade-in hw-free-layout-container"
        style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 3, flexWrap: "wrap", width: "100%", ...marketHeaderLayout.containerStyle }}
        data-free-active={marketHeaderLayout.freeActive || undefined}
        data-editing-layout={marketHeaderLayout.editingLayout || undefined}
      >
        {marketHeaderLayout.renderSection(
          "marketLevelWidget",
          /* Market Level (Battlegrounds/Guildrun-style tavern tier) -
             raises the shop's rarity ceiling (runEngine.js's
             rollShop/MARKET_LEVEL_UNLOCKS). Marc, direct: "market lvl
             on keskeinen osa pelin kehitystä ja siksi saa tärkeän
             asemapaikan" (Market Level is central to the run's
             progression and deserves an important position) - was one
             .hw-badge indistinguishable from every other badge in the
             row. Now its own bordered widget with real tier pips
             (●●○, not just "1/3" as text) and the Level Up action
             fused into the SAME box, so "this pip row and this button
             are one system" is visible at a glance instead of reading
             as two separate, coincidentally-adjacent controls. Kept
             fused here too (this round only splits DIFFERENT widgets
             apart from each other, not a widget's own internal pip+
             button pairing - see this file's plan notes). */
          <div className="hw-market-level-widget" title={`Unlocks: ${(MARKET_LEVEL_UNLOCKS[marketLevel] || []).join(", ")} tier units in the shop`}>
            <span className="hw-market-level-label">Market</span>
            <span className="hw-market-level-pips">
              {Array.from({ length: MARKET_LEVEL_MAX }, (_, i) => (
                <span key={i} className="hw-market-level-pip" data-filled={i < marketLevel} />
              ))}
            </span>
            {marketCost === null ? (
              <span className="hw-badge" style={{ fontSize: 11 }}>MAX</span>
            ) : (
              <button
                className="hw-move-btn hw-strip-btn"
                disabled={runState.essence < marketCost}
                onClick={onLevelUpMarket}
                title={`Unlock ${MARKET_LEVEL_UNLOCKS[marketLevel + 1]?.slice(-1)[0]}-tier units in future shop rolls`}
              >
                Level Up
                <span className="hw-cost-inline">
                  <CardGlyph name="spark" className="hw-intent-glyph" />
                  {marketCost}
                </span>
              </button>
            )}
          </div>
        )}

        {marketHeaderLayout.renderSection(
          "marketTierWidget",
          /* Market TIER (feat/hearthwood-market-tiers) - the SECOND market
             axis, a sibling of the Level widget above. Level raises the
             rarity ceiling; Tier unlocks new KINDS of unit (a specialist
             sub-pool). Advancing a Tier is a pure Essence sink that buys
             options, not stats. */
          <div
            className="hw-market-tier-widget"
            title={`Market Tier ${effTier}: ${MARKET_TIERS[effTier]?.name}. ${
              tierPreview ? `Next: ${tierPreview.name} (${tierPreview.cost}) - ${tierPreview.unlocks.join("; ")}` : "Max Tier."
            }`}
          >
            <span className="hw-market-tier-label">Tier</span>
            <span className="hw-market-tier-pips">
              {Array.from({ length: MARKET_TIER_MAX }, (_, i) => (
                <span key={i} className="hw-market-tier-pip" data-filled={i < effTier} data-charter={(i >= marketTier && i < effTier) || undefined} />
              ))}
            </span>
            <span className="hw-market-tier-name">{MARKET_TIERS[effTier]?.name}</span>
            {tierCost === null ? (
              <span className="hw-badge" style={{ fontSize: 11 }}>MAX</span>
            ) : (
              <button
                className="hw-move-btn hw-strip-btn"
                disabled={runState.essence < tierCost}
                onClick={onAdvanceMarketTier}
                title={`Advance to ${MARKET_TIERS[marketTier + 1]?.name} - unlocks ${MARKET_TIERS[marketTier + 1]?.unlocks.join("; ")}`}
              >
                Advance
                <span className="hw-cost-inline">
                  <CardGlyph name="spark" className="hw-intent-glyph" />
                  {tierCost}
                </span>
              </button>
            )}
          </div>
        )}

        {tierPreview &&
          marketHeaderLayout.renderSection(
            "tierPreview",
            <span className="hw-market-tier-preview">
              Next Tier: {tierPreview.name} — {tierPreview.unlocks[0]}
            </span>
          )}

        {marketHeaderLayout.renderSection(
          "commanderCluster",
          /* Commander cluster - deliberately separated from the Market
             widget above (own container + a visual divider) so Rank Up
             reads as "about your commander", never "the other Level
             Up button". Kept fused internally, same reasoning as the
             Market Level widget above. */
          <div className="hw-commander-cluster">
            <span className="hw-badge" title={commander?.description}>
              <CardGlyph name={commander?.art} className="hw-intent-glyph" />
              {commander?.name} · Rank {commanderRank}
            </span>
            {commanderBentRole && (
              <span className="hw-badge hw-badge--bent" title={`Bent to ${commanderBentRole}`}>
                Bent: {commanderBentRole}
              </span>
            )}
            {rankCost === null ? (
              <span className="hw-badge" style={{ fontSize: 11 }}>Rank MAX</span>
            ) : (
              <button
                className="hw-move-btn hw-strip-btn"
                disabled={runState.essence < rankCost}
                onClick={onRankUp}
                title={`Permanently strengthen ${commander?.name}'s squad passive (rank ${commanderRank} -> ${commanderRank + 1})`}
              >
                Rank Up
                <span className="hw-cost-inline">
                  <CardGlyph name="spark" className="hw-intent-glyph" />
                  {rankCost}
                </span>
              </button>
            )}
            {activePower && (
              <>
                <button
                  className="hw-move-btn hw-strip-btn"
                  data-active={primed}
                  disabled={activePowerUsed || runState.essence < activePower.cost}
                  onClick={onUseCommanderActive}
                  title={activePower.description}
                >
                  {activePower.name}
                  <span className="hw-cost-inline">
                    <CardGlyph name="spark" className="hw-intent-glyph" />
                    {activePower.cost}
                  </span>
                </button>
                {primed && (
                  <span className="hw-badge hw-badge--active" title={activePower.description}>
                    {activePower.name} primed - next battle
                  </span>
                )}
              </>
            )}
            <button
              className="hw-move-btn hw-strip-btn"
              data-active={showRetrain}
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
                sentinel instead of a real bench key. Kept inside
                commanderCluster this round - its own slot count
                (effectiveItemSlots) can grow mid-run via upgrades, the
                same "not a fixed set" problem as the recruit/item/bench
                grids, deliberately deferred to that later round. */}
            <div
              className="hw-item-slots"
              data-pending={!!selectedItemDef}
              title="Commander's item slots - click a bag item above, then click a slot to equip it"
            >
              {Array.from({ length: maxItemSlots }, (_, slotIndex) => {
                const equipped = runState.items.find((it) => it.equippedTo === "commander" && it.slotIndex === slotIndex)
                const itemDef = equipped ? ITEMS[equipped.defId] : null
                return (
                  <span
                    key={slotIndex}
                    className={`hw-item-slot${itemDef ? " hw-item-slot--filled" : ""}${
                      justEquippedSlot === `commander-${slotIndex}` ? " hw-card--reforged" : ""
                    }`}
                    title={itemDef ? `${itemDef.name} - click to unequip` : selectedItemDef ? `Equip ${selectedItemDef.name} here` : "Empty item slot"}
                    onClick={() => handleSlotClick("commander", slotIndex, equipped ? equipped.key : null)}
                  >
                    {itemDef ? <CardGlyph name={itemDef.icon} className="hw-intent-glyph" /> : <span className="hw-item-slot-plus">+</span>}
                  </span>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bounded banner (see .hw-market-stage's own comment for the
          "why" - replaces the ambient page background that used to
          bleed through this exact gap). Reuses the same rune-lit
          World Tree art as the battle screen's own background - one
          consistent "what Hearthwood looks like" image across
          screens, just framed here instead of full-bleed. */}
      <div className="hw-market-banner">
        <img src={marketBanner} alt="" />
        {/* Marc: "haluan logon näkyville johonkin" (I want the logo
            visible somewhere) - this banner is the one bounded,
            branded moment on the whole screen, so it does double
            duty rather than adding a second element purely for the
            logo. */}
        <img src={hearthwoodLogo} alt="Hearthwood" className="hw-market-banner-logo" />
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

      {/* ===== 3-ZONE SHOP LAYOUT =====
          Marc's sketch: a full-width layout with the owned Items/Relics
          in a LEFT rail, the Market / Your Squad panel in the CENTRE,
          and the run Map in a RIGHT rail (visible during the shop, not
          only between phases). The header/commander strip/banner above
          stay full-width; only the shopping content below is split into
          the three columns. Rails scroll internally - the PAGE never
          scrolls at Marc's 1536x864 (his standing hard rule). */}
      <div className="hw-shop-3zone">
        <aside
          className={`hw-shop-rail hw-shop-rail--left${leftFreeActive ? " hw-shop-rail--free-layout" : ""}${editingLayout ? " hw-shop-rail--editing-layout" : ""}`}
          aria-label="Owned relics and items"
        >
          {
            // Dev-only (never in a real build) - Marc: "haluan tämän
            // raahaa mihin tahansa tasolle". Lives INSIDE the <aside>
            // (not a wrapper around it) so `.hw-shop-rail--left` stays
            // the direct grid child the <=1240px breakpoint's own
            // `order` rule depends on.
            import.meta.env.DEV && (
              <div className="hw-shop-layout-toolbar">
                {!editingLayout ? (
                  <button type="button" className="hw-move-btn" onClick={startEditingLayout}>
                    Edit Layout
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="hw-move-btn"
                      disabled={layoutPreviewing || layoutApplying}
                      onClick={handleSaveLayout}
                    >
                      {layoutPreviewing ? "Previewing..." : "Save Layout"}
                    </button>
                    <button type="button" className="hw-move-btn" disabled={layoutApplying} onClick={cancelEditingLayout}>
                      Cancel
                    </button>
                    <button type="button" className="hw-move-btn" disabled={layoutPreviewing || layoutApplying} onClick={handleResetLayout}>
                      Reset Layout
                    </button>
                  </>
                )}

                {layoutErrorMessage && <div className="hw-shop-layout-error">{layoutErrorMessage}</div>}

                {layoutResult && (
                  <div className="hw-shop-layout-preview">
                    <PatchPreviewPanel
                      result={layoutResult}
                      applyMode={layoutApplyMode}
                      onApplyModeChange={setLayoutApplyMode}
                      onDiscard={discardLayoutPreview}
                      onApply={applyLayout}
                      applying={layoutApplying}
                    />
                  </div>
                )}
              </div>
            )
          }

          <div
            ref={leftRailRef}
            className="hw-shop-rail-sections"
            style={leftFreeActive ? { position: "relative", height: leftRailHeight ?? undefined } : undefined}
          >
            {renderOwnedRail()}
          </div>
        </aside>

        <div className="hw-shop-center">
          {/* Reorderable "chrome" above the actual shop content -
              Phase 3 of the WordPress-style layout work (Marc, choosing
              "simple reordering" for this column over free positioning):
              `SHOP_LAYOUT.market.centerOrder` decides which of these
              named pieces renders first, same plain order-array
              mechanism `leftRailOrder` already uses for the left rail.
              `.hw-market-columns` and the Continue button below stay
              FIXED - see renderCenterSections() for why. */}
          {renderCenterSections()}

      <div className="hw-market-columns">
        <div className="hw-panel hw-panel--market" hidden={activeTab !== "market"}>
          {/* The old "Recruit who you can afford, or move on." flavor
              line below the title was pure decorative prose - it told
              the player nothing the panel title ("Market - spend
              Essence here") and the "For sale" label right under it
              didn't already say. Cut to make room for the actual
              info-density growth this pass is about (Marc: "UI
              minimalistiseksi mutta informaaliseksi" - minimalist but
              informational - every pixel should go to real
              information, not decoration): bigger portraits/icons on
              the cards below, not a caption above them. */}
          <div className="hw-panel-title">Market - spend Essence here</div>

          <div>
            <div className="hw-section-label">For sale</div>
            {/* hw-market-featured-grid: the one deliberately-featured
                moment on this screen (problem 2, "korttien asettelu/
                koko") - bigger, golden-ratio-sized cards (--hw-fib-9,
                same 233px this game's other "important choice" screen,
                CommanderSelect.jsx, already uses). Scoped to just this
                grid - the Items grid and the Your Squad/bench grid
                below keep their existing card size on purpose.
                Free Layout, round 3 (individual card slots) - own
                dedicated scope (marketRecruitLayout), own toolbar,
                attached directly to this grid div (see its own hook
                comment for why no wrapper/scoped CSS override is
                needed here). Deliberately a SIBLING of marketTabLayout's
                own container below, not nested inside it - real bug
                caught live: nesting it inside meant this grid's own
                (normal-flow) height wasn't counted by marketTabLayout's
                free-mode height calc (which only sums ITS OWN keys),
                so the grid would visually overflow that container's
                shorter explicit height the moment marketTabLayout went
                free-active. */}
            {import.meta.env.DEV && (
              <div className="hw-free-layout-toolbar">
                {!marketRecruitLayout.editingLayout ? (
                  <button className="hw-move-btn" onClick={marketRecruitLayout.startEditing} disabled={marketRecruitLayout.loading}>
                    Edit Layout
                  </button>
                ) : (
                  <>
                    <button className="hw-move-btn" onClick={marketRecruitLayout.saveLayout} disabled={marketRecruitLayout.saving}>
                      Save Layout
                    </button>
                    <button className="hw-move-btn" onClick={marketRecruitLayout.cancelEditing} disabled={marketRecruitLayout.saving}>
                      Cancel
                    </button>
                  </>
                )}
                <button className="hw-move-btn" onClick={marketRecruitLayout.resetLayout} disabled={marketRecruitLayout.saving}>
                  Reset Layout
                </button>
                {marketRecruitLayout.errorMessage && (
                  <span className="hw-free-layout-error">{marketRecruitLayout.errorMessage}</span>
                )}
              </div>
            )}
            <div
              ref={marketRecruitLayout.containerRef}
              className="hw-select-grid hw-deck-preview hw-market-featured-grid"
              style={marketRecruitLayout.containerStyle}
              data-free-active={marketRecruitLayout.freeActive || undefined}
              data-editing-layout={marketRecruitLayout.editingLayout || undefined}
            >
              {[0, 1, 2].map((i) => marketRecruitLayout.renderSection(`slot${i}`, offers[i] ? renderRecruitCard(offers[i]) : null))}
            </div>
          </div>

          {/* Free Layout foundation, Market tab (see marketTabLayout's
              own comment above) - only ever rendered/clickable while
              this panel is actually visible, since the whole panel is
              `hidden` otherwise; that alone is enough to guarantee
              startEditing() never measures a hidden block. */}
          {import.meta.env.DEV && (
            <div className="hw-free-layout-toolbar">
              {!marketTabLayout.editingLayout ? (
                <button className="hw-move-btn" onClick={marketTabLayout.startEditing} disabled={marketTabLayout.loading}>
                  Edit Layout
                </button>
              ) : (
                <>
                  <button className="hw-move-btn" onClick={marketTabLayout.saveLayout} disabled={marketTabLayout.saving}>
                    Save Layout
                  </button>
                  <button className="hw-move-btn" onClick={marketTabLayout.cancelEditing} disabled={marketTabLayout.saving}>
                    Cancel
                  </button>
                </>
              )}
              <button className="hw-move-btn" onClick={marketTabLayout.resetLayout} disabled={marketTabLayout.saving}>
                Reset Layout
              </button>
              {marketTabLayout.errorMessage && (
                <span className="hw-free-layout-error">{marketTabLayout.errorMessage}</span>
              )}
            </div>
          )}
          <div
            ref={marketTabLayout.containerRef}
            className="hw-free-layout-container"
            style={marketTabLayout.containerStyle}
            data-free-active={marketTabLayout.freeActive || undefined}
            data-editing-layout={marketTabLayout.editingLayout || undefined}
          >
            {/* Free Layout, round 2 ("every button individually", Marc's
                own words: "haluan liikuttaa niitä vapaasti kaikkia
                yksitellen") - the old single "shopActions" key is now 5:
                each button plus the Gamble reveal banner. This plain flex
                row (NOT itself a .hw-free-layout-section, no position of
                its own) is what keeps the 4 buttons sitting in a normal
                horizontal row in FLOW mode - once free-active, each
                button's wrapper goes position:absolute and escapes this
                row entirely, positioning relative to marketTabLayout's
                own top-level container (the nearest POSITIONED ancestor -
                this row deliberately stays position:static so it never
                becomes one itself). */}
            <div style={{ marginTop: 3, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {marketTabLayout.renderSection(
                "rerollBtn",
                <button
                  className="hw-move-btn"
                  disabled={runState.essence < runState.rerollCost || offers.length === 0 || marketEventLocked}
                  onClick={onReroll}
                  title={marketEventLocked ? `${marketEventDef.name}: no Reroll this stop - take what's shown` : undefined}
                >
                  Reroll ({runState.rerollCost} Essence)
                </button>
              )}
              {/* Freeze (runEngine.js's toggleFreeze) - keeps this offer
                  set into the next shop visit instead of it re-rolling
                  automatically. A one-shot flag (consumed on the next
                  regen), so `data-active` just reflects whether it's
                  currently armed. */}
              {marketTabLayout.renderSection(
                "freezeBtn",
                <button
                  className="hw-move-btn"
                  data-active={!!runState.frozen && !marketEventLocked}
                  disabled={marketEventLocked}
                  onClick={onToggleFreeze}
                  title={marketEventLocked ? `${marketEventDef.name}: no Freeze this stop` : "Keep these offers when you next visit the shop"}
                >
                  {runState.frozen && !marketEventLocked ? "Frozen ✓" : "Freeze"}
                </button>
              )}
              {/* The Gamble (Marc: "the game needs also gamble mechanic") -
                  spend Essence for an UNCHOSEN random item or relic
                  instead of picking from the 3 offers above. Always
                  available (no Blackroot-style lock - it's not tied to
                  the unit-offer roll at all), repeatable like Reroll. */}
              {marketTabLayout.renderSection(
                "gambleBtn",
                onGamble && (
                  <button
                    className="hw-move-btn hw-gamble-btn"
                    disabled={runState.essence < GAMBLE_COST}
                    onClick={onGamble}
                    title="Wager Essence for a random item - or, rarely, a relic you could never otherwise buy"
                  >
                    Gamble ({GAMBLE_COST} Essence)
                  </button>
                )
              )}
              {/* Field Antidote (runEngine.js's buyAntidote, feat/hearthwood-rot):
                  a one-fight squad-wide Regen, the answer to a Rot pack's poison
                  drip. One queued at a time; cost climbs per Act. */}
              {marketTabLayout.renderSection(
                "antidoteBtn",
                onAntidote && (
                  <button
                    className="hw-move-btn hw-antidote-btn"
                    data-active={antidoteQueued(runState) || undefined}
                    disabled={!antidoteQueued(runState) && runState.essence < antidoteCost(runState)}
                    onClick={onAntidote}
                    title="Your whole squad starts the next battle with Regen - out-drips an opening poison spike"
                  >
                    {antidoteQueued(runState) ? "Antidote ✓" : `Field Antidote (${antidoteCost(runState)})`}
                  </button>
                )
              )}
            </div>

            {/* The Gamble's own reveal - a one-shot callout naming what
                just came out (an item name, or a relic name in the rarer
                "cosmic" tone reused from the Ragpicker's Market banner,
                since a relic here is the jackpot outcome). Cleared by
                leaveShop, so it only ever shows the LATEST pull, never a
                stale one from a prior visit. Its own key now, "each
                individually" per Marc's exact words. */}
            {marketTabLayout.renderSection(
              "gambleReveal",
              runState.lastGambleReward && (
                <div
                  className="hw-gamble-reveal"
                  data-tone={runState.lastGambleReward.kind === "relic" ? "cosmic" : "plain"}
                >
                  {runState.lastGambleReward.kind === "relic"
                    ? `Jackpot! You won ${RELICS[runState.lastGambleReward.defId]?.name}.`
                    : `You won ${ITEMS[runState.lastGambleReward.defId]?.name}.`}
                </div>
              )
            )}
          </div>

          {/* Deliberately a SIBLING of marketTabLayout's own container
              above, not nested inside it - same "normal-flow height not
              counted by the other scope's free-mode height calc" reason
              the recruit grid above is also a sibling, not a child. */}
          <div>
            <div className="hw-market-divider" />
            <div className="hw-section-label" title="Gear for a specific unit - buying one selects it automatically, ready to equip onto the Commander or a unit on the Your Squad tab. Rotates fresh every visit - always includes at least one Bending item.">
              Items
            </div>
            {/* Free Layout, round 3 (individual card slots) - own
                dedicated scope (marketItemLayout), same pattern as
                the recruit grid above. */}
            {import.meta.env.DEV && (
              <div className="hw-free-layout-toolbar">
                {!marketItemLayout.editingLayout ? (
                  <button className="hw-move-btn" onClick={marketItemLayout.startEditing} disabled={marketItemLayout.loading}>
                    Edit Layout
                  </button>
                ) : (
                  <>
                    <button className="hw-move-btn" onClick={marketItemLayout.saveLayout} disabled={marketItemLayout.saving}>
                      Save Layout
                    </button>
                    <button className="hw-move-btn" onClick={marketItemLayout.cancelEditing} disabled={marketItemLayout.saving}>
                      Cancel
                    </button>
                  </>
                )}
                <button className="hw-move-btn" onClick={marketItemLayout.resetLayout} disabled={marketItemLayout.saving}>
                  Reset Layout
                </button>
                {marketItemLayout.errorMessage && (
                  <span className="hw-free-layout-error">{marketItemLayout.errorMessage}</span>
                )}
              </div>
            )}
            <div
              ref={marketItemLayout.containerRef}
              className="hw-select-grid hw-deck-preview hw-market-items-grid"
              style={marketItemLayout.containerStyle}
              data-free-active={marketItemLayout.freeActive || undefined}
              data-editing-layout={marketItemLayout.editingLayout || undefined}
            >
              {[0, 1, 2].map((i) =>
                marketItemLayout.renderSection(
                  `slot${i}`,
                  itemOffers[i] ? (
                    <ItemCard def={itemOffers[i]} disabled={runState.essence < itemOffers[i].cost} onClick={() => onBuyItem(itemOffers[i].id)} />
                  ) : null
                )
              )}
            </div>
          </div>
        </div>

        <div className="hw-panel hw-panel--squad" hidden={activeTab !== "squad"}>
          <div className="hw-panel-title">Your Squad - already owned</div>

          {/* Free Layout foundation, Squad tab, top scope (buildScore +
              itemBag) - same "toolbar lives inside the hidden-toggled
              panel" reasoning as the Market tab's own toolbar above. */}
          {import.meta.env.DEV && (
            <div className="hw-free-layout-toolbar">
              {!squadTopLayout.editingLayout ? (
                <button className="hw-move-btn" onClick={squadTopLayout.startEditing} disabled={squadTopLayout.loading}>
                  Edit Layout
                </button>
              ) : (
                <>
                  <button className="hw-move-btn" onClick={squadTopLayout.saveLayout} disabled={squadTopLayout.saving}>
                    Save Layout
                  </button>
                  <button className="hw-move-btn" onClick={squadTopLayout.cancelEditing} disabled={squadTopLayout.saving}>
                    Cancel
                  </button>
                </>
              )}
              <button className="hw-move-btn" onClick={squadTopLayout.resetLayout} disabled={squadTopLayout.saving}>
                Reset Layout
              </button>
              {squadTopLayout.errorMessage && (
                <span className="hw-free-layout-error">{squadTopLayout.errorMessage}</span>
              )}
            </div>
          )}
          <div
            ref={squadTopLayout.containerRef}
            className="hw-free-layout-container"
            style={squadTopLayout.containerStyle}
            data-free-active={squadTopLayout.freeActive || undefined}
            data-editing-layout={squadTopLayout.editingLayout || undefined}
          >
            {squadTopLayout.renderSection(
              "buildScore",
              /* Build evaluation (buildScore.js) - visible while
                 recruiting so a shop is "improve the build or fix its
                 weakness?" */
              <BuildScore runState={runState} />
            )}

            {squadTopLayout.renderSection(
              "itemBag",
              runState.items.length > 0 && (
                <div>
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
                </div>
              )
            )}
          </div>

          {/* Your Squad split into two clearly separated groups: the
              units actually fighting (keys in runState.deployed) vs the
              ones sitting in Reserve. Before this they rendered in ONE
              flat grid in raw bench order, deployed and reserve
              interleaved, told apart only by a small per-card "On the
              Bench (fighting)" badge - Marc: "unit/reservi on epaselva
              your squad valilehdessa... ne pitaa eritta paremmin" (the
              deployed/reserve distinction is unclear on the Your Squad
              tab, they need separating better). Now: two labelled
              groups with a quiet vertical divider, the reserve grid
              gently dimmed, a count on each heading. Side by side, not
              stacked - this screen's strict zero-scroll budget can't
              afford a second full card row. */}
          <div className="hw-section-label">
            Your Squad - {deployedCount}/{DEPLOY_SLOTS} fighting, {reserveCount}/{RESERVE_CAP + (runState.benchCapBonus || 0)} in reserve
          </div>
          <p style={{ fontSize: 12, color: "var(--hw-muted)", marginTop: -4 }}>
            Recruit 3 copies of the same unit to fuse it into a stronger version - find them in the shop.
          </p>

          {/* Free Layout foundation, Squad tab, split scope
              (squadDeployed/squadReserve). .hw-squad-split is a
              3-column CSS Grid (auto / 1px divider / minmax(0,1fr)) -
              wrapping it one level deeper the way every other block
              does would break that grid entirely, so this scope
              attaches its containerRef/containerStyle DIRECTLY onto
              THIS SAME div (a second className, not a new element): in
              flow mode containerStyle is undefined, so
              .hw-squad-split's own grid CSS applies completely
              undisturbed; only in free mode does the inline
              position:relative override it. The divider only makes
              sense between two ADJACENT things, so it's hidden once
              this scope is actually free-active - a deliberate
              simplification, not a bug. */}
          {import.meta.env.DEV && (
            <div className="hw-free-layout-toolbar">
              {!squadSplitLayout.editingLayout ? (
                <button className="hw-move-btn" onClick={squadSplitLayout.startEditing} disabled={squadSplitLayout.loading}>
                  Edit Layout
                </button>
              ) : (
                <>
                  <button className="hw-move-btn" onClick={squadSplitLayout.saveLayout} disabled={squadSplitLayout.saving}>
                    Save Layout
                  </button>
                  <button className="hw-move-btn" onClick={squadSplitLayout.cancelEditing} disabled={squadSplitLayout.saving}>
                    Cancel
                  </button>
                </>
              )}
              <button className="hw-move-btn" onClick={squadSplitLayout.resetLayout} disabled={squadSplitLayout.saving}>
                Reset Layout
              </button>
              {squadSplitLayout.errorMessage && (
                <span className="hw-free-layout-error">{squadSplitLayout.errorMessage}</span>
              )}
            </div>
          )}
          {/* .hw-squad-split's OWN CSS turned out (found live, not
              assumed from a single reading) to ALREADY be overridden
              unconditionally by a more specific `.hw-shop-3zone
              .hw-squad-split { display:flex; flex-direction:column;
              gap:8px }` rule elsewhere in this file - the 3-column
              CSS Grid this plan expected is dead code, never actually
              wins the cascade, and .hw-squad-split-divider is ALREADY
              always `display:none` unconditionally too. So the
              STANDARD wrapper pattern (a new .hw-free-layout-container
              div, one level inside .hw-squad-split, matching that
              SAME real flex-column+gap layout) is exactly right here -
              no need to attach to .hw-squad-split directly, and no
              need to conditionally hide the divider (it was already
              invisible). Attaching directly to .hw-squad-split, tried
              first, put THREE competing display rules on one element
              and produced a real, measured 65px position bug. */}
          <div className="hw-squad-split">
            <div
              ref={squadSplitLayout.containerRef}
              className="hw-free-layout-container"
              style={squadSplitLayout.containerStyle}
              data-free-active={squadSplitLayout.freeActive || undefined}
              data-editing-layout={squadSplitLayout.editingLayout || undefined}
            >
              {squadSplitLayout.renderSection(
                "squadDeployed",
                <section className="hw-squad-group">
                  <div className="hw-section-label hw-squad-group-label">
                    On the bench &middot; fighting
                    <span className="hw-squad-group-count">{deployedCount}/{DEPLOY_SLOTS}</span>
                  </div>
                  {deployedEntries.length === 0 && (
                    <p className="hw-squad-group-empty">No units placed yet - deploy them on the battlefield screen.</p>
                  )}
                  {/* Free Layout, round 3 (individual card slots) - own
                      dedicated scope (squadDeployedSlots), attached
                      directly to this grid div (a real CSS Grid, same
                      "no wrapper needed" reasoning as the Market's
                      recruit/item slot grids). Grid always renders now
                      (not swapped out for the empty-message paragraph
                      above) so it's a stable positioning anchor even at
                      0 units - each slot's own empty wrapper has zero
                      visual footprint regardless. */}
                  {import.meta.env.DEV && (
                    <div className="hw-free-layout-toolbar">
                      {!squadDeployedSlots.editingLayout ? (
                        <button className="hw-move-btn" onClick={squadDeployedSlots.startEditing} disabled={squadDeployedSlots.loading}>
                          Edit Layout
                        </button>
                      ) : (
                        <>
                          <button className="hw-move-btn" onClick={squadDeployedSlots.saveLayout} disabled={squadDeployedSlots.saving}>
                            Save Layout
                          </button>
                          <button className="hw-move-btn" onClick={squadDeployedSlots.cancelEditing} disabled={squadDeployedSlots.saving}>
                            Cancel
                          </button>
                        </>
                      )}
                      <button className="hw-move-btn" onClick={squadDeployedSlots.resetLayout} disabled={squadDeployedSlots.saving}>
                        Reset Layout
                      </button>
                      {squadDeployedSlots.errorMessage && (
                        <span className="hw-free-layout-error">{squadDeployedSlots.errorMessage}</span>
                      )}
                    </div>
                  )}
                  <div
                    ref={squadDeployedSlots.containerRef}
                    className="hw-select-grid hw-deck-preview hw-squad-group-grid"
                    style={squadDeployedSlots.containerStyle}
                    data-free-active={squadDeployedSlots.freeActive || undefined}
                    data-editing-layout={squadDeployedSlots.editingLayout || undefined}
                  >
                    {[0, 1, 2, 3].map((i) =>
                      squadDeployedSlots.renderSection(`slot${i}`, deployedEntries[i] ? renderBenchCard(deployedEntries[i]) : null)
                    )}
                  </div>
                </section>
              )}

              <div className="hw-squad-split-divider" aria-hidden="true" />

              {squadSplitLayout.renderSection(
                "squadReserve",
                <section className="hw-squad-group hw-squad-group--reserve">
                  <div className="hw-section-label hw-squad-group-label">
                    In reserve &middot; not fighting
                    <span className="hw-squad-group-count">{reserveCount}/{RESERVE_CAP + (runState.benchCapBonus || 0)}</span>
                  </div>
                  {reserveEntries.length === 0 && <p className="hw-squad-group-empty">Reserve is empty.</p>}
                  {/* Free Layout, round 3 - own dedicated scope
                      (squadReserveSlots), 9 keys - the confirmed hard
                      max (RESERVE_CAP=6 + at most +3 from the two
                      one-time "Wide Bench"/"Deep Reserves" meta perks,
                      see this file's hook-site comment). */}
                  {import.meta.env.DEV && (
                    <div className="hw-free-layout-toolbar">
                      {!squadReserveSlots.editingLayout ? (
                        <button className="hw-move-btn" onClick={squadReserveSlots.startEditing} disabled={squadReserveSlots.loading}>
                          Edit Layout
                        </button>
                      ) : (
                        <>
                          <button className="hw-move-btn" onClick={squadReserveSlots.saveLayout} disabled={squadReserveSlots.saving}>
                            Save Layout
                          </button>
                          <button className="hw-move-btn" onClick={squadReserveSlots.cancelEditing} disabled={squadReserveSlots.saving}>
                            Cancel
                          </button>
                        </>
                      )}
                      <button className="hw-move-btn" onClick={squadReserveSlots.resetLayout} disabled={squadReserveSlots.saving}>
                        Reset Layout
                      </button>
                      {squadReserveSlots.errorMessage && (
                        <span className="hw-free-layout-error">{squadReserveSlots.errorMessage}</span>
                      )}
                    </div>
                  )}
                  <div
                    ref={squadReserveSlots.containerRef}
                    className="hw-select-grid hw-deck-preview hw-squad-group-grid hw-squad-reserve-cards"
                    style={squadReserveSlots.containerStyle}
                    data-free-active={squadReserveSlots.freeActive || undefined}
                    data-editing-layout={squadReserveSlots.editingLayout || undefined}
                  >
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) =>
                      squadReserveSlots.renderSection(`slot${i}`, reserveEntries[i] ? renderBenchCard(reserveEntries[i]) : null)
                    )}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* confirm.png (Marc's Copilot plaque, re-investigated this
          round - see this PR's description for buy.png/trade.png's
          own "still no honest home" writeups): this Continue button is
          the closest thing this screen has to a leaving-shop
          confirmation moment - the player is done recruiting/selling
          and locking that in before the next fight. Scoped to its own
          modifier class (hw-shop-confirm-btn), not the shared
          .hw-end-turn class every OTHER screen's Continue/End Turn
          button also uses - Battle/ResultOverlay/GuildHallScreen/
          FormationScreen keep their plain look untouched.
          Round 2 (market-scale-up pass): Marc - "continue
          keskitetään... ja tuplasti isompi" (center it, also 2x
          bigger). Checked first: this wrapper had no text-align or
          justify-content at all, so the button was actually sitting
          left-aligned, not "already centered" - display:flex +
          justify-content:center here is the actual fix; the "2x
          bigger" half lives in .hw-shop-confirm-btn's own padding/
          font-size (heartwood.css).
          Free Layout, round 2 ("every button individually") - a single-
          key scope, same value as every other lone-block scope in Stage
          A: relocate or hide it. Always visible (last child of
          .hw-shop-center, outside any tab gating), so the toolbar renders
          unconditionally. width:"100%" in the base style (kept in BOTH
          modes, containerStyle never sets its own width) avoids the same
          centering-shift trap as the tab-buttons scope above - this
          wrapper's justify-content:center always centers a full-width
          box, so the button's captured x/y origin never moves between
          flow and free mode. */}
          {import.meta.env.DEV && (
            <div className="hw-free-layout-toolbar">
              {!marketContinueLayout.editingLayout ? (
                <button className="hw-move-btn" onClick={marketContinueLayout.startEditing} disabled={marketContinueLayout.loading}>
                  Edit Layout
                </button>
              ) : (
                <>
                  <button className="hw-move-btn" onClick={marketContinueLayout.saveLayout} disabled={marketContinueLayout.saving}>
                    Save Layout
                  </button>
                  <button className="hw-move-btn" onClick={marketContinueLayout.cancelEditing} disabled={marketContinueLayout.saving}>
                    Cancel
                  </button>
                </>
              )}
              <button className="hw-move-btn" onClick={marketContinueLayout.resetLayout} disabled={marketContinueLayout.saving}>
                Reset Layout
              </button>
              {marketContinueLayout.errorMessage && (
                <span className="hw-free-layout-error">{marketContinueLayout.errorMessage}</span>
              )}
            </div>
          )}
          <div
            ref={marketContinueLayout.containerRef}
            className="hw-free-layout-container"
            style={{ marginTop: 6, display: "flex", justifyContent: "center", width: "100%", ...marketContinueLayout.containerStyle }}
            data-free-active={marketContinueLayout.freeActive || undefined}
            data-editing-layout={marketContinueLayout.editingLayout || undefined}
          >
            {marketContinueLayout.renderSection(
              "continueBtn",
              <button className="hw-end-turn hw-shop-confirm-btn" onClick={onContinue}>
                Continue
              </button>
            )}
          </div>
        </div>

        <aside
          className={`hw-shop-rail hw-shop-rail--right${rightFreeActive ? " hw-shop-rail--free-layout" : ""}${editingLayout ? " hw-shop-rail--editing-layout" : ""}`}
          aria-label="Run map"
        >
          <div
            ref={rightRailRef}
            className="hw-shop-rail-sections"
            style={rightFreeActive ? { position: "relative", height: rightRailHeight ?? undefined } : undefined}
          >
            {renderPositionedSection(RAILS.right, "map", mapSlot, rightFreeActive)}
          </div>
        </aside>
      </div>
    </div>
  )
}
