// Heartwood Trial - the run layer for the autobattler. Pure functions
// only, same pattern as the rest of this engine. Drives the fixed path
// (shop -> formation -> auto-battle, repeated, ending on the Spacemonkey
// boss) and owns the player's bench/deployment/Essence/fusion - none of
// which autoBattleEngine.js knows or cares about; it only ever sees a
// plain list of deployed unit ids.
//
// Bench entries are `{ key, defId }`, not bare unit ids: fusion removes
// and adds bench entries (three copies -> one Tier 2 copy), which would
// silently corrupt a plain array-index-based deploy scheme the moment
// it spliced. `deployed` stores those stable keys instead, so a slot
// still points at the right unit (or clears itself) no matter how the
// bench array reshuffles underneath it.

import { UNITS, STARTER_UNITS, TIER2_SUFFIX, UPGRADE_MAX_LEVEL, upgradeCost } from "../../data/heartwood/units"
import { RELICS, relicPool, RELIC_REROLL_COST } from "../../data/heartwood/relics"
import { ITEMS, ITEM_SLOTS } from "../../data/heartwood/items"
import { CHARACTERS, commanderRankCost } from "../../data/heartwood/characters"
import { startAutoBattle, resolveRound, autoResolveBattle } from "./autoBattleEngine"

// enemies.js's 7 mooks are used both solo and recombined into
// formations.js's 6 multi-piece encounters - "Mist Growler Pack" and
// "The Undertow" (no shielding - real swarms), "Bark Brute's Stand",
// "Twin Watch" and "Siren's Bodyguard" (shielding puzzles - now that
// shielding actually does something, see the frontmost()/
// randomLiving() fix in autoBattleEngine.js) sit between the existing
// solo fights so a run escalates from solo -> solo -> swarm -> solo ->
// solo -> poison solo -> single shield puzzle -> Siren shield puzzle ->
// second swarm -> double shield puzzle -> full escort -> boss. Three
// "relic" nodes (relics.js) are spaced through the run - a real
// structural choice mechanic, not just more units/enemies, added after
// Marc said the game still felt "boring and simple" despite several
// content rounds: volume alone wasn't the gap, a genuine new layer was.
const RUN_PATH = [
  { type: "shop" },
  { type: "battle", enemyId: "rotwood-husk" },
  { type: "shop" },
  { type: "battle", enemyId: "drowned-siren" },
  { type: "shop" },
  { type: "battle", enemyId: "mist-growler" },
  { type: "shop" },
  { type: "battle", formationId: "mist-growler-pack" },
  { type: "relic" },
  { type: "shop" },
  { type: "battle", enemyId: "bark-brute" },
  { type: "shop" },
  { type: "battle", enemyId: "moss-troll" },
  { type: "shop" },
  { type: "battle", enemyId: "bloomrot-stalker" },
  { type: "shop" },
  { type: "battle", enemyId: "rootbind-thicket" },
  { type: "shop" },
  { type: "battle", enemyId: "witherfang" },
  { type: "shop" },
  { type: "battle", enemyId: "thornspite" },
  { type: "shop" },
  { type: "battle", enemyId: "bramblehide" },
  { type: "shop" },
  { type: "battle", formationId: "bark-brutes-stand" },
  { type: "shop" },
  { type: "battle", formationId: "sirens-bodyguard" },
  { type: "relic" },
  { type: "shop" },
  { type: "battle", formationId: "the-undertow" },
  { type: "shop" },
  { type: "battle", formationId: "twin-watch" },
  { type: "shop" },
  { type: "battle", formationId: "rune-wardens-escort" },
  { type: "relic" },
  { type: "shop" },
  { type: "boss", enemyId: "spacemonkey" },
]

// Marc: "essenceä on liian vähän siinä pitää olla ekonomia" (there's
// too little Essence, there needs to be a real economy) - raised
// right after Items became an 8th thing to spend on (recruit/reroll,
// Upgrade, Commander Rank-Up, Relic Upgrade/Reroll, Reforge, Retrain,
// now Items), on top of an income rate that hadn't moved since the
// original shop/formation/auto-resolve pivot. Bumped both the starting
// stake and the per-win payout by 50% so a run has real room to spend
// across units, items, and relics without every purchase feeling like
// the last affordable one - same "just give more, don't rebalance
// every individual cost" lever already used once before for HP (see
// TIER_HP's own note in units.js) when the game felt too tight.
const START_ESSENCE = 5
const WIN_ESSENCE = 6
const FORMATION_BONUS_ESSENCE = 2
const SHOP_SIZE = 4
const REROLL_BASE_COST = 1
const DEPLOY_SLOTS = 4

function currentNode(runState) {
  return runState.path[runState.nodeIndex]
}

function phaseForNode(node) {
  if (node?.type === "shop") return "shop"
  if (node?.type === "relic") return "relic"
  return "formation"
}

// 3 choices, never a relic already owned (relics don't stack with
// themselves, just with each other) - same shuffle-and-slice shape
// rollShop already uses.
function rollRelics(ownedRelicIds) {
  const pool = relicPool().filter((r) => !ownedRelicIds.includes(r.id))
  const shuffled = [...pool]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, 3).map((r) => r.id)
}

// Only base-tier units are ever purchasable - a Tier 2 unit has
// recruitCost: null (it's only reachable by fusing three base copies),
// so it must never appear as a shop offer. summonOnly units (e.g.
// Spirit Wolf) are excluded the same way - they're only gained via a
// Summoner's own battle-start passive, never bought directly.
function rollShop() {
  const pool = Object.values(UNITS).filter((u) => !u.fusedFrom && !u.summonOnly)
  const shuffled = [...pool]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, SHOP_SIZE).map((u) => u.id)
}

// Three owned copies of the same base unit combine into one Tier 2
// copy (see units.js's makeTier2) - repeats until no group of 3+
// remains, so recruiting a unit that completes two fusions at once
// (rare, but possible after a lucky bench) resolves fully in one step.
// Any deploy slot pointing at a consumed copy is cleared, not silently
// reassigned - fusing takes a unit off the field, the player re-places
// the upgraded version deliberately.
// `items` (runEngine.js's item bag - see equipItem/unequipItem) is
// threaded through fusion the same way `deployed` already is: any
// item equipped to a consumed bench key returns to the bag (unequipped,
// not destroyed) instead of being left pointing at a key that no
// longer exists on the bench - same "investment doesn't carry over"
// rule Reforge already applies to upgradeLevel.
function tryFuseOnce(bench, deployed, items, nextKey) {
  const groups = {}
  for (const entry of bench) {
    if (UNITS[entry.defId].displayTier === 2) continue
    ;(groups[entry.defId] ||= []).push(entry)
  }
  for (const [defId, entries] of Object.entries(groups)) {
    if (entries.length < 3) continue
    const consumed = new Set(entries.slice(0, 3).map((e) => e.key))
    const nextBench = [
      ...bench.filter((e) => !consumed.has(e.key)),
      { key: nextKey, defId: `${defId}${TIER2_SUFFIX}`, upgradeLevel: 0 },
    ]
    const nextDeployed = deployed.map((k) => (consumed.has(k) ? null : k))
    const nextItems = items.map((it) => (consumed.has(it.equippedTo) ? { ...it, equippedTo: null, slotIndex: null } : it))
    return { bench: nextBench, deployed: nextDeployed, items: nextItems, nextKey: nextKey + 1, changed: true }
  }
  return { bench, deployed, items, nextKey, changed: false }
}

function fuseAll(bench, deployed, items, nextKey) {
  let state = { bench, deployed, items, nextKey, changed: true }
  while (state.changed) {
    state = tryFuseOnce(state.bench, state.deployed, state.items, state.nextKey)
  }
  return state
}

export function startRun(characterId) {
  const bench = STARTER_UNITS.map((defId, i) => ({ key: i, defId, upgradeLevel: 0 }))
  return {
    characterId,
    bench,
    benchKeyCounter: bench.length,
    deployed: Array.from({ length: DEPLOY_SLOTS }, (_, i) => (i < bench.length ? bench[i].key : null)),
    essence: START_ESSENCE,
    path: RUN_PATH,
    nodeIndex: 0,
    phase: "shop",
    shopOffers: rollShop(),
    rerollCost: REROLL_BASE_COST,
    battle: null,
    relics: [],
    relicOffers: null,
    relicLevels: {},
    commanderRank: 0,
    // Items (items.js): a shared owned bag, separate from the bench -
    // `equippedTo`/`slotIndex` point at a bench key + slot index (see
    // equipItem/unequipItem below) or sit null while unequipped.
    items: [],
    itemKeyCounter: 0,
  }
}

export function recruitUnit(runState, unitDefId) {
  const def = UNITS[unitDefId]
  if (!def || runState.essence < def.recruitCost || !runState.shopOffers.includes(unitDefId)) return runState

  const withNew = [...runState.bench, { key: runState.benchKeyCounter, defId: unitDefId, upgradeLevel: 0 }]
  const fused = fuseAll(withNew, runState.deployed, runState.items, runState.benchKeyCounter + 1)

  return {
    ...runState,
    essence: runState.essence - def.recruitCost,
    bench: fused.bench,
    deployed: fused.deployed,
    items: fused.items,
    benchKeyCounter: fused.nextKey,
    shopOffers: runState.shopOffers.filter((id) => id !== unitDefId),
  }
}

// A second Essence sink alongside recruiting/relics - Marc: "i need to
// make a build out of relics/upgrades and stuff then the game
// proceeds". Spends Essence to permanently strengthen one owned unit
// (up to UPGRADE_MAX_LEVEL stacks, cost rising per level), independent
// of and stacking with Fusion - see units.js's unitDefWithUpgrade for
// how the bonus is actually applied at battle start.
export function upgradeUnit(runState, benchKey) {
  const entry = runState.bench.find((e) => e.key === benchKey)
  if (!entry) return runState
  const level = entry.upgradeLevel || 0
  const cost = upgradeCost(level)
  if (cost === null || runState.essence < cost) return runState
  return {
    ...runState,
    essence: runState.essence - cost,
    bench: runState.bench.map((e) => (e.key === benchKey ? { ...e, upgradeLevel: level + 1 } : e)),
  }
}

export const REFORGE_COST = 2

// A fifth Essence sink (after recruit/reroll, Unit Upgrade, Commander
// Rank-Up, Relic Upgrade/Reroll): swaps one bench unit for a different
// random unit of the same tier, flat cost - "I don't want this one
// after all, but I've already committed the recruit cost" without a
// full reroll of the whole shop. Deliberately resets upgradeLevel to 0
// - it's a genuinely different unit afterward, not the same one
// wearing a new name, so carrying prior Essence investment over would
// be an odd fit. Fused (Tier 2) units can't be reforged - swapping
// away three units' worth of recruiting/fusing effort for a random
// base unit would be a strict downgrade trap, not a real choice.
export function reforgeUnit(runState, benchKey) {
  const entry = runState.bench.find((e) => e.key === benchKey)
  if (!entry || runState.essence < REFORGE_COST) return runState
  const currentDef = UNITS[entry.defId]
  if (!currentDef || currentDef.displayTier === 2) return runState
  const pool = Object.values(UNITS).filter((u) => !u.fusedFrom && !u.summonOnly && u.tier === currentDef.tier && u.id !== entry.defId)
  if (!pool.length) return runState
  const newDef = pool[Math.floor(Math.random() * pool.length)]
  return {
    ...runState,
    essence: runState.essence - REFORGE_COST,
    bench: runState.bench.map((e) => (e.key === benchKey ? { ...e, defId: newDef.id, upgradeLevel: 0 } : e)),
    // Same "a genuinely different unit afterward" rule as the
    // upgradeLevel reset above - any equipped items return to the bag
    // rather than staying attached to a unit that's no longer the one
    // the player geared up.
    items: runState.items.map((it) => (it.equippedTo === benchKey ? { ...it, equippedTo: null, slotIndex: null } : it)),
  }
}

// A seventh Essence sink, and the first that isn't "strengthen
// something you already committed to" - buying an item just adds it
// to the owned bag (items.js's ITEMS), unequipped. Equipping/moving/
// unequipping afterward is free (see equipItem/unequipItem below),
// same "pay once, rearrange freely" shape a deployed unit's formation
// slot already has via assignToSlot/clearSlot.
export function buyItem(runState, itemDefId) {
  const def = ITEMS[itemDefId]
  if (!def || runState.essence < def.cost) return runState
  return {
    ...runState,
    essence: runState.essence - def.cost,
    items: [...runState.items, { key: runState.itemKeyCounter, defId: itemDefId, equippedTo: null, slotIndex: null }],
    itemKeyCounter: runState.itemKeyCounter + 1,
  }
}

// Relics (relics.js) can grant every unit extra slots (Artificer's
// Ledger, itemSlotBonus) on top of the flat ITEM_SLOTS base - read
// here rather than inlined at both call sites (equipItem's range
// check, SquadDraft.jsx's slot-pip rendering) so the two can never
// drift out of sync with each other.
export function effectiveItemSlots(runState) {
  const bonus = runState.relics.reduce((sum, id) => sum + (RELICS[id]?.itemSlotBonus || 0), 0)
  return ITEM_SLOTS + bonus
}

// Equips an owned item onto one of a bench unit's item slots (see
// effectiveItemSlots above - may be more than the base ITEM_SLOTS with
// Artificer's Ledger owned). Free - the Essence cost was already paid
// on purchase. If the target slot already holds a different item, that
// one is bumped back to the bag first (a slot can only ever hold one
// item), same "drop something new in, the old one comes out" swap
// FormationScreen.jsx's deploy slots already do.
export function equipItem(runState, itemKey, benchKey, slotIndex) {
  const item = runState.items.find((it) => it.key === itemKey)
  if (!item || slotIndex < 0 || slotIndex >= effectiveItemSlots(runState) || !runState.bench.some((e) => e.key === benchKey)) return runState
  return {
    ...runState,
    items: runState.items.map((it) => {
      if (it.key === itemKey) return { ...it, equippedTo: benchKey, slotIndex }
      if (it.equippedTo === benchKey && it.slotIndex === slotIndex) return { ...it, equippedTo: null, slotIndex: null }
      return it
    }),
  }
}

// Returns an equipped item to the bag. Free, same reasoning as
// equipItem above.
export function unequipItem(runState, itemKey) {
  return {
    ...runState,
    items: runState.items.map((it) => (it.key === itemKey ? { ...it, equippedTo: null, slotIndex: null } : it)),
  }
}

// A third Essence sink, spent on the Commander instead of a bench unit
// - same shape as upgradeUnit above (rising cost, capped levels), see
// characters.js's commanderRankCost/commanderPassiveWithRank.
export function rankUpCommander(runState) {
  const rank = runState.commanderRank || 0
  const cost = commanderRankCost(rank)
  if (cost === null || runState.essence < cost) return runState
  return { ...runState, essence: runState.essence - cost, commanderRank: rank + 1 }
}

export const RETRAIN_COST = 4

// A sixth Essence sink, but a genuinely different kind from the other
// five (all of which strengthen something you already have): Retrain
// lets a player pivot the whole run's identity mid-draft, switching to
// a different Commander if the bench they've drawn doesn't fit the one
// they started with. commanderRank resets to 0 - it was Essence spent
// scaling up the OLD Commander's specific squadPassive, which has no
// meaning against a different one, same "no carried investment"
// precedent Reforge already established for a bench unit's
// upgradeLevel.
export function retrainCommander(runState, newCharacterId) {
  if (newCharacterId === runState.characterId || !CHARACTERS[newCharacterId]) return runState
  if (runState.essence < RETRAIN_COST) return runState
  return {
    ...runState,
    essence: runState.essence - RETRAIN_COST,
    characterId: newCharacterId,
    commanderRank: 0,
  }
}

// A fourth Essence sink: spend on an owned relic instead of a bench
// unit or the Commander - same cost curve as Unit Upgrade (units.js's
// upgradeCost/UPGRADE_MAX_LEVEL, reused directly rather than a near-
// identical duplicate), scaling that relic's effect via
// autoBattleEngine.js's per-relic-level factor. Only affects a relic
// you already own - relics.js's rollRelics already prevents owning a
// duplicate, so relicId here always maps to at most one entry.
export function upgradeRelic(runState, relicId) {
  if (!runState.relics.includes(relicId)) return runState
  const level = runState.relicLevels[relicId] || 0
  const cost = upgradeCost(level)
  if (cost === null || runState.essence < cost) return runState
  return {
    ...runState,
    essence: runState.essence - cost,
    relicLevels: { ...runState.relicLevels, [relicId]: level + 1 },
  }
}

export function rerollShop(runState) {
  if (runState.essence < runState.rerollCost) return runState
  return {
    ...runState,
    essence: runState.essence - runState.rerollCost,
    shopOffers: rollShop(),
    rerollCost: runState.rerollCost + 1,
  }
}

export function leaveShop(runState) {
  const nodeIndex = runState.nodeIndex + 1
  return { ...runState, nodeIndex, phase: phaseForNode(runState.path[nodeIndex]) }
}

export function assignToSlot(runState, slotIndex, benchKey) {
  const deployed = runState.deployed.map((k) => (k === benchKey ? null : k))
  deployed[slotIndex] = benchKey
  return { ...runState, deployed }
}

export function clearSlot(runState, slotIndex) {
  const deployed = [...runState.deployed]
  deployed[slotIndex] = null
  return { ...runState, deployed }
}

export function startFormationBattle(runState) {
  const node = currentNode(runState)
  const deployed = runState.deployed
    .filter((key) => key !== null)
    .map((key) => runState.bench.find((e) => e.key === key))
    .filter(Boolean)
    .map((entry) => ({
      defId: entry.defId,
      upgradeLevel: entry.upgradeLevel || 0,
      itemIds: runState.items.filter((it) => it.equippedTo === entry.key).map((it) => it.defId),
    }))
  const battle = startAutoBattle(
    runState.characterId,
    deployed,
    node.enemyId || node.formationId,
    runState.relics,
    runState.commanderRank || 0,
    runState.relicLevels || {},
  )
  return { ...runState, phase: "battle", battle }
}

// A relic node only ever offers 3 choices, rolled once - this lets the
// player pay to see a fresh 3 instead, the same "spend Essence for
// another option" shape rerollShop already gives the unit shop.
export function rerollRelicOffers(runState) {
  if (runState.essence < RELIC_REROLL_COST) return runState
  return {
    ...runState,
    essence: runState.essence - RELIC_REROLL_COST,
    relicOffers: rollRelics(runState.relics),
  }
}

// Leaving a "relic" node: `relicId` is null for Skip. Relics don't
// stack with themselves, so rollRelics already excludes anything
// already owned - no need to guard against picking a duplicate here.
// `relicId: null` is always Skip, free. A real pick costs Essence
// (relics.js's RELIC_COST) - if the player can't afford it, treat the
// click as a no-op rather than silently letting them take it anyway
// (same "just don't respond" guard recruitUnit already uses for an
// unaffordable unit).
export function chooseRelic(runState, relicId) {
  if (relicId) {
    const relic = RELICS[relicId]
    if (!relic || runState.essence < relic.cost) return runState
  }

  const essence = relicId ? runState.essence - RELICS[relicId].cost : runState.essence
  const relics = relicId ? [...runState.relics, relicId] : runState.relics
  const nodeIndex = runState.nodeIndex + 1
  const nextNode = runState.path[nodeIndex]
  return {
    ...runState,
    essence,
    relics,
    nodeIndex,
    phase: phaseForNode(nextNode),
    shopOffers: nextNode?.type === "shop" ? rollShop() : runState.shopOffers,
    rerollCost: REROLL_BASE_COST,
    relicOffers: null,
  }
}

export function advanceRound(runState) {
  return { ...runState, battle: resolveRound(runState.battle) }
}

export function autoResolve(runState) {
  return { ...runState, battle: autoResolveBattle(runState.battle) }
}

// Permadeath: any loss ends the run. A regular win banks Essence and
// moves to the next node; the boss's win ends the run in victory.
// A formation fight (multiple pieces, often a shielding puzzle) is a
// harder win than a solo mook - Marc asked for the game to feel more
// rewarding, and a flat payout regardless of difficulty never
// reflected that. Exported so the UI can show "you'll earn N Essence"
// on the victory screen itself (see ResultOverlay.jsx), not just apply
// it silently - the same number resolveBattleOutcome actually pays out.
export function essenceForWin(runState, node) {
  const essenceBonus = runState.relics.reduce((sum, id) => sum + (RELICS[id]?.essenceBonus || 0), 0)
  const difficultyBonus = node?.formationId ? FORMATION_BONUS_ESSENCE : 0
  return WIN_ESSENCE + difficultyBonus + essenceBonus
}

export function resolveBattleOutcome(runState) {
  const battle = runState.battle
  if (!battle) return runState

  if (battle.phase === "lost") return { ...runState, phase: "defeat" }

  if (battle.phase === "won") {
    const node = currentNode(runState)
    if (node.type === "boss") return { ...runState, phase: "victory" }

    const nodeIndex = runState.nodeIndex + 1
    const nextNode = runState.path[nodeIndex]
    return {
      ...runState,
      essence: runState.essence + essenceForWin(runState, node),
      nodeIndex,
      phase: phaseForNode(nextNode),
      shopOffers: nextNode?.type === "shop" ? rollShop() : runState.shopOffers,
      relicOffers: nextNode?.type === "relic" ? rollRelics(runState.relics) : runState.relicOffers,
      rerollCost: REROLL_BASE_COST,
      battle: null,
    }
  }

  return runState
}
