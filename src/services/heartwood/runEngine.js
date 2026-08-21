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

import { UNITS, STARTER_UNITS, TIER2_SUFFIX } from "../../data/heartwood/units"
import { startAutoBattle, resolveRound, autoResolveBattle } from "./autoBattleEngine"

// enemies.js's 6 mooks are used both solo and recombined into
// formations.js's 5 multi-piece encounters - "Mist Growler Pack" (two
// equal threats, no shielding - a real swarm), "Bark Brute's Stand",
// "Twin Watch" and "Siren's Bodyguard" (shielding puzzles - now that
// shielding actually does something, see the frontmost()/
// randomLiving() fix in autoBattleEngine.js) sit between the existing
// solo fights so a run escalates from solo -> solo -> swarm -> solo ->
// solo -> single shield puzzle -> Siren shield puzzle -> double shield
// puzzle -> full escort -> boss.
const RUN_PATH = [
  { type: "shop" },
  { type: "battle", enemyId: "rotwood-husk" },
  { type: "shop" },
  { type: "battle", enemyId: "drowned-siren" },
  { type: "shop" },
  { type: "battle", enemyId: "mist-growler" },
  { type: "shop" },
  { type: "battle", formationId: "mist-growler-pack" },
  { type: "shop" },
  { type: "battle", enemyId: "bark-brute" },
  { type: "shop" },
  { type: "battle", enemyId: "moss-troll" },
  { type: "shop" },
  { type: "battle", formationId: "bark-brutes-stand" },
  { type: "shop" },
  { type: "battle", formationId: "sirens-bodyguard" },
  { type: "shop" },
  { type: "battle", formationId: "twin-watch" },
  { type: "shop" },
  { type: "battle", formationId: "rune-wardens-escort" },
  { type: "shop" },
  { type: "boss", enemyId: "spacemonkey" },
]

const START_ESSENCE = 3
const WIN_ESSENCE = 4
const SHOP_SIZE = 4
const REROLL_BASE_COST = 1
const DEPLOY_SLOTS = 4

function currentNode(runState) {
  return runState.path[runState.nodeIndex]
}

function phaseForNode(node) {
  return node?.type === "shop" ? "shop" : "formation"
}

// Only base-tier units are ever purchasable - a Tier 2 unit has
// recruitCost: null (it's only reachable by fusing three base copies),
// so it must never appear as a shop offer.
function rollShop() {
  const pool = Object.values(UNITS).filter((u) => !u.fusedFrom)
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
function tryFuseOnce(bench, deployed, nextKey) {
  const groups = {}
  for (const entry of bench) {
    if (UNITS[entry.defId].displayTier === 2) continue
    ;(groups[entry.defId] ||= []).push(entry)
  }
  for (const [defId, entries] of Object.entries(groups)) {
    if (entries.length < 3) continue
    const consumed = new Set(entries.slice(0, 3).map((e) => e.key))
    const nextBench = [...bench.filter((e) => !consumed.has(e.key)), { key: nextKey, defId: `${defId}${TIER2_SUFFIX}` }]
    const nextDeployed = deployed.map((k) => (consumed.has(k) ? null : k))
    return { bench: nextBench, deployed: nextDeployed, nextKey: nextKey + 1, changed: true }
  }
  return { bench, deployed, nextKey, changed: false }
}

function fuseAll(bench, deployed, nextKey) {
  let state = { bench, deployed, nextKey, changed: true }
  while (state.changed) {
    state = tryFuseOnce(state.bench, state.deployed, state.nextKey)
  }
  return state
}

export function startRun(characterId) {
  const bench = STARTER_UNITS.map((defId, i) => ({ key: i, defId }))
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
  }
}

export function recruitUnit(runState, unitDefId) {
  const def = UNITS[unitDefId]
  if (!def || runState.essence < def.recruitCost || !runState.shopOffers.includes(unitDefId)) return runState

  const withNew = [...runState.bench, { key: runState.benchKeyCounter, defId: unitDefId }]
  const fused = fuseAll(withNew, runState.deployed, runState.benchKeyCounter + 1)

  return {
    ...runState,
    essence: runState.essence - def.recruitCost,
    bench: fused.bench,
    deployed: fused.deployed,
    benchKeyCounter: fused.nextKey,
    shopOffers: runState.shopOffers.filter((id) => id !== unitDefId),
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
  const deployedIds = runState.deployed
    .filter((key) => key !== null)
    .map((key) => runState.bench.find((e) => e.key === key)?.defId)
    .filter(Boolean)
  const battle = startAutoBattle(runState.characterId, deployedIds, node.enemyId || node.formationId)
  return { ...runState, phase: "battle", battle }
}

export function advanceRound(runState) {
  return { ...runState, battle: resolveRound(runState.battle) }
}

export function autoResolve(runState) {
  return { ...runState, battle: autoResolveBattle(runState.battle) }
}

// Permadeath: any loss ends the run. A regular win banks Essence and
// moves to the next node; the boss's win ends the run in victory.
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
      essence: runState.essence + WIN_ESSENCE,
      nodeIndex,
      phase: phaseForNode(nextNode),
      shopOffers: nextNode?.type === "shop" ? rollShop() : runState.shopOffers,
      rerollCost: REROLL_BASE_COST,
      battle: null,
    }
  }

  return runState
}
