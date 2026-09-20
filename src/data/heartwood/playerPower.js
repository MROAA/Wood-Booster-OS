// Hearthwood Trial - Player Power Score. PRD "Progressiivinen haasteen
// nousu ja skaalaus" (docs/hearthwood-progressive-challenge-prd.md)
// sections 7 / 52 / 72 Phase 1: the DifficultyEngine's first slice -
// score a run's REAL, ABSOLUTE strength across seven components
// (Units + Synergy + Items + Relics + Formation + Economy + Coherence),
// so a threat read can be shown RELATIVE to the build (section 9 / 41-43)
// instead of a bare enemy-only rating.
//
// The THIRD pure run analyzer, alongside buildScore.js's evaluateBuild
// (the deployed squad's SHAPE, 7 clamped 0-10 axes) and playstyle.js's
// evaluatePlaystyle (the run's BEHAVIOUR, 6 clamped 0-100 axes). This one
// is a MAGNITUDE - a raw number per component + a total + a band + a
// ratio vs the run's expected power. A PURE function of runState: reads
// only what's already there, writes nothing, no RUN_SAVE_VERSION bump.
// Nothing in the combat path reads it. Placeholder-first: the W table
// and BASE_EXPECTED below are one edit each to tune.
//
// Section 8 is the load-bearing idea: COHERENCE, not unit count. Six mid
// units that reinforce each other out-rate five strong disjoint ones -
// so `coherence` is a ratio (synergies + shared-tribe fraction + role
// balance) divided by sqrt(bench size), not a sum.

import { UNITS } from "./units"
import { ITEMS } from "./items"
import { RELICS } from "./relics"
import { unitProfile } from "./roles"
import { effectiveRole } from "./items"
import { tribesOf, resolveSynergies, resolveComboSynergies, resolvePositionSynergies } from "./synergies"
import { evaluateBuild } from "./buildScore"
import { ENEMIES } from "./enemies"
import { resolveFormation } from "./formations"
import { THREAT_RATINGS, relativeThreatLabel } from "./threatPreview"
import { difficultyFactorForNode, RUN_PATH } from "../../services/heartwood/runEngine"

export const POWER_COMPONENTS = [
  { id: "unit", label: "Units", icon: "sword" },
  { id: "synergy", label: "Synergy", icon: "leaf" },
  { id: "item", label: "Items", icon: "spark" },
  { id: "relic", label: "Relics", icon: "rune" },
  { id: "formation", label: "Formation", icon: "shield" },
  { id: "economy", label: "Economy", icon: "cosmic" },
  { id: "coherence", label: "Coherence", icon: "heart" },
]

// Fragile < Holding < Strong < Commanding < Overwhelming, by ratio.
export const POWER_BANDS = ["Fragile", "Holding", "Strong", "Commanding", "Overwhelming"]

// total = Σ W[id] * components[id]. One table, placeholder-first.
const W = { unit: 1.0, synergy: 1.4, item: 1.1, relic: 1.0, formation: 0.9, economy: 0.7, coherence: 1.6 }

// Calibrated so a "played the systems" mid-run squad reads ratio ~= 1.0
// against difficultyFactorForNode's ~1.0 -> ~2.3 ramp. One number to tune.
const BASE_EXPECTED = 27

const clamp = (lo, hi, v) => Math.max(lo, Math.min(hi, v))
const tierRank = (def) => (def?.tier === "legendary" ? 4 : def?.tier === "rare" ? 3 : def?.tier === "uncommon" ? 2 : 1)
const relicRank = (r) => (r?.tier === "rare" ? 3 : r?.tier === "uncommon" ? 2 : 1)

const GAP_NOTE = {
  synergy: "no tribe is paying off yet",
  item: "your units are carrying almost no kit",
  relic: "you're light on relics",
  coherence: "strong units, but they don't reinforce each other",
}

function benchInfo(runState, entry) {
  const def = UNITS[entry.defId]
  if (!def) return null
  const upgrades = entry.upgrades || []
  const itemIds = (runState.items || []).filter((it) => it.equippedTo === entry.key).map((it) => it.defId)
  const bent = effectiveRole(def.role, itemIds)
  const profile = unitProfile(def, bent && bent !== def.role ? bent : undefined)
  const attackTotal = (def.movePattern || []).filter((m) => m.type === "attack").reduce((s, m) => s + (m.amount || 0), 0)
  return {
    def,
    key: entry.key,
    profile,
    upgrades,
    tribes: tribesOf(entry.defId, def),
    maxHp: def.maxHp || 0,
    attackTotal,
    deployed: (runState.deployed || []).includes(entry.key),
  }
}

// { total, expected, ratio, band, components: {id: number}, lead, gap: {id, note} }
export function evaluatePlayerPower(runState) {
  const bench = (runState?.bench || []).map((e) => benchInfo(runState, e)).filter(Boolean)
  const zeros = Object.fromEntries(POWER_COMPONENTS.map((c) => [c.id, 0]))
  const nodeIndex = runState?.nodeIndex || 0
  const expected = BASE_EXPECTED * difficultyFactorForNode(nodeIndex, RUN_PATH.length)

  if (!bench.length) {
    return {
      total: 0,
      expected,
      ratio: 0,
      band: POWER_BANDS[0],
      components: zeros,
      lead: null,
      gap: { id: "unit", note: "Recruit a squad." },
    }
  }

  const deployedInfos = bench.filter((u) => u.deployed)
  const deployedCount = deployedInfos.length || bench.length

  // --- tribe / synergy state (same resolvers evaluateBuild uses) -----
  const deployedTribeCounts = {}
  for (const u of deployedInfos) for (const t of u.tribes) deployedTribeCounts[t] = (deployedTribeCounts[t] || 0) + 1
  const activeSynergies = resolveSynergies(deployedTribeCounts).length
  const activeCombos = resolveComboSynergies(deployedTribeCounts).length
  const slotTribes = {}
  ;(runState.deployed || []).forEach((key, i) => {
    if (key == null) return
    const u = bench.find((b) => b.key === key)
    if (u) slotTribes[i] = u.tribes
  })
  const positionHits = resolvePositionSynergies(slotTribes).length

  // --- components (raw magnitudes, ~0-20 each) -----------------------
  const unit =
    bench.reduce(
      (s, u) => s + (u.maxHp / 45 + u.attackTotal / 6 + tierRank(u.def) + u.upgrades.length * 0.5) * (u.deployed ? 1 : 0.4),
      0,
    )

  const synergy = activeSynergies * 3 + activeCombos * 2 + positionHits * 1

  const equipped = (runState.items || []).filter((it) => it.equippedTo && it.equippedTo !== "commander")
  const item = equipped.reduce((s, it) => s + (ITEMS[it.defId]?.cost || 100) / 90 + 0.5, 0)

  const relicLevels = runState.relicLevels || {}
  const relic = (runState.relics || []).reduce(
    (s, id) => s + relicRank(RELICS[id]) + (relicLevels[id] || 0) * 0.5,
    0,
  )

  const build = evaluateBuild(runState)
  const hasFrontTank =
    (runState.deployed || [])[3] != null &&
    (() => {
      const u = bench.find((b) => b.key === (runState.deployed || [])[3])
      return u && (u.profile?.primary === "tank" || u.profile?.secondary === "tank")
    })()
  const formation = (build.positioning?.matched || 0) * 1.5 + (hasFrontTank ? 2 : 0)

  const economy =
    ((runState.marketLevel || 1) - 1) * 2 +
    (runState.commanderRank || 0) * 1.5 +
    ((runState.recruitDiscount || 0) > 0 ? 1.5 : 0) +
    ((runState.shopSlotBonus || 0) > 0 ? 1.5 : 0) +
    ((runState.ledgerWinBonus || 0) > 0 ? 1.5 : 0) +
    clamp(0, 4, (runState.essence || 0) / (nodeIndex + 1) / 40)

  // Coherence (PRD 8): a RATIO, not a count. High for a lean squad whose
  // units reinforce each other; low for a pile of disjoint strong bodies.
  const topTribes = Object.entries(deployedTribeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([t]) => t)
  const sharedTribeFraction =
    deployedCount > 0
      ? deployedInfos.filter((u) => u.tribes.some((t) => topTribes.includes(t))).length / deployedCount
      : 0
  const roleBuckets = { tank: 0, damage: 0, sustain: 0, control: 0 }
  for (const u of deployedInfos) {
    const p = u.profile?.primary
    if (p === "tank") roleBuckets.tank++
    else if (p === "dps" || p === "assassin") roleBuckets.damage++
    else if (p === "healer" || p === "support") roleBuckets.sustain++
    else if (p === "control" || p === "debuffer") roleBuckets.control++
  }
  const covered = Object.values(roleBuckets).filter((n) => n > 0).length
  const roleBalance = covered / 4 // 0..1: how many of the 4 role pillars are present
  const coherence =
    (activeSynergies * 2 + sharedTribeFraction * 3 + roleBalance * 2) / Math.sqrt(bench.length)

  const components = { unit, synergy, item, relic, formation, economy, coherence }
  for (const k of Object.keys(components)) components[k] = Math.max(0, Math.round(components[k] * 10) / 10)

  const total = Math.round(POWER_COMPONENTS.reduce((s, c) => s + W[c.id] * components[c.id], 0))
  const ratio = Math.round((total / Math.max(1, expected)) * 100) / 100
  const band = POWER_BANDS[clamp(0, 4, Math.round((ratio - 0.55) / 0.28))]

  const lead = [...POWER_COMPONENTS].sort((a, b) => W[b.id] * components[b.id] - W[a.id] * components[a.id])[0].id
  const controllable = ["synergy", "item", "relic", "coherence"]
  const gapId = [...controllable].sort((a, b) => components[a] - components[b])[0]

  return {
    total,
    expected: Math.round(expected),
    ratio,
    band,
    components,
    lead,
    gap: { id: gapId, note: GAP_NOTE[gapId] || "shore this up" },
  }
}

// Scout Ahead (runEngine.js's scoutAhead) - a LIGHT threat-band estimate
// for an upcoming battle node, plus your power read relative to it. No
// startAutoBattle dry-run: reads the authored formation/enemy pieces
// directly and scales by the run's difficulty ramp. A band, not a
// promise (branching paths can still swap the encounter).
export function scoutReport(runState, targetNodeIndex) {
  const node = RUN_PATH[targetNodeIndex]
  if (!node) return null
  const formation = resolveFormation(node.formationId || node.enemyId)
  const pieces = formation?.pieces || []
  const defs = pieces.map((p) => ENEMIES[p.defId]).filter(Boolean)
  const totalHp = defs.reduce((s, d) => s + (d.maxHp || 30), 0)
  const totalAtk = defs.reduce(
    (s, d) => s + Math.max(0, ...(d.movePattern || []).filter((m) => m.type === "attack").map((m) => m.amount || 0)),
    0,
  )
  const factor = difficultyFactorForNode(targetNodeIndex, RUN_PATH.length)
  // Same shape as threatPreview.js's rating, scaled by the ramp and the
  // node kind, mapped onto the 1-5 ratings.
  const hpScore = (totalHp * factor) / 130
  const sizeScore = Math.min(1.5, (Math.max(1, pieces.length) - 1) * 0.4)
  const atkScore = Math.min(1.6, (totalAtk * factor) / 22)
  const nodeBump = node.type === "elite" || node.type === "miniboss" ? 1 : node.type === "boss" ? 2 : 0
  const rating = Math.max(1, Math.min(5, Math.round(1 + hpScore + sizeScore + atkScore + nodeBump)))

  const power = evaluatePlayerPower(runState)
  return {
    kind: node.type,
    rating,
    ratingLabel: THREAT_RATINGS[rating - 1],
    relative: relativeThreatLabel(power.ratio, rating - 1),
  }
}
