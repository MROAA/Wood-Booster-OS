// Hearthwood Trial - build evaluation. PRD "Unit Roles, Build System"
// sections 18 / 30-31: don't give the player one "POWER 94" number -
// rate the deployed squad on seven axes, name its core unit, and flag
// its biggest gap, so every shop is a real "improve the build or fix
// its weakness?" decision (PRD 42).
//
// The first real consumer of roles.js's unitProfile. A PURE function of
// runState - reads only what's already there (deployed / bench / the
// three Ledger-investment flags), writes nothing back, no save bump.
// Placeholder-first: the weight table below is one edit to tune.

import { UNITS } from "./units"
import { unitProfile } from "./roles"
import { effectiveRole } from "./items"
import { tribesOf, resolveSynergies, resolveComboSynergies, resolvePositionSynergies } from "./synergies"

export const SCORE_DIMS = [
  { id: "survivability", label: "Survivability", icon: "shield" },
  { id: "damage", label: "Damage", icon: "sword" },
  { id: "sustain", label: "Sustain", icon: "heart" },
  { id: "control", label: "Control", icon: "rune" },
  { id: "synergy", label: "Synergy", icon: "leaf" },
  { id: "economy", label: "Economy", icon: "spark" },
  { id: "scaling", label: "Scaling", icon: "cosmic" },
]

const CONTROL_TAGS = ["poison", "burn", "weak", "vulnerable", "stun"]
const clamp10 = (n) => Math.max(0, Math.min(10, Math.round(n)))

function totalOf(def, type) {
  return (def.movePattern || []).filter((m) => m.type === type).reduce((s, m) => s + (m.amount || 0), 0)
}

// Everything about one deployed unit the scorer needs.
function deployedInfo(runState, benchKey, slotIndex) {
  const entry = runState.bench.find((e) => e.key === benchKey)
  const def = entry && UNITS[entry.defId]
  if (!def) return null
  const upgrades = entry.upgrades || []
  const itemIds = (runState.items || []).filter((it) => it.equippedTo === benchKey).map((it) => it.defId)
  const bent = effectiveRole(def.role, itemIds)
  const profile = unitProfile(def, bent && bent !== def.role ? bent : undefined)
  const tags = new Set([...(profile?.tags || []), ...upgrades])
  return {
    def,
    slotIndex,
    profile,
    upgrades,
    tribes: tribesOf(entry.defId, def),
    maxHp: def.maxHp || 0,
    attack: totalOf(def, "attack"),
    block: totalOf(def, "block"),
    heal: totalOf(def, "heal"),
    tags,
  }
}

export function evaluateBuild(runState) {
  const deployed = (runState?.deployed || [])
    .map((key, i) => (key === null ? null : deployedInfo(runState, key, i)))
    .filter(Boolean)
  const n = deployed.length
  const zeros = Object.fromEntries(SCORE_DIMS.map((d) => [d.id, 0]))

  if (n === 0) {
    return { deployedCount: 0, scores: zeros, core: null, notes: ["Place units to see your build take shape."] }
  }

  const has = (info, ...roles) => roles.includes(info.profile?.primary) || roles.includes(info.profile?.secondary)
  const tag = (info, t) => info.tags.has(t)
  const sum = (fn) => deployed.reduce((s, info) => s + fn(info), 0)

  // Tribe / synergy state (same helpers FormationScreen uses).
  const tribeCounts = {}
  for (const info of deployed) for (const t of info.tribes) tribeCounts[t] = (tribeCounts[t] || 0) + 1
  const activeSynergies = resolveSynergies(tribeCounts)
  const activeCombos = resolveComboSynergies(tribeCounts)
  const slotTribes = {}
  for (const info of deployed) slotTribes[info.slotIndex] = info.tribes
  const positionHits = resolvePositionSynergies(slotTribes)
  // one-off-threshold partials: a tribe at exactly (nextTier.count - 1)
  const nearMiss = Object.entries(tribeCounts).filter(([, c]) => c >= 2).length

  const raw = {
    // Survivability is MITIGATION (tanks, shields, block), not raw HP -
    // every 4-unit squad has HP, so it's weighted lightly.
    survivability:
      sum((i) => (i.profile?.primary === "tank" ? 3.5 : i.profile?.secondary === "tank" ? 2 : 0)) +
      sum((i) => (tag(i, "shield") ? 1 : 0) + (tag(i, "frontline") ? 1 : 0)) +
      sum((i) => i.maxHp) / 70 +
      sum((i) => i.block) / 5,
    damage:
      sum((i) => i.attack) / 8 +
      sum((i) => (has(i, "dps", "assassin") ? 2 : 0)) +
      sum((i) => (tag(i, "aoe") || tag(i, "execute") || tag(i, "chain") ? 0.8 : 0)),
    sustain:
      sum((i) => (i.profile?.primary === "healer" ? 3 : i.profile?.primary === "support" ? 1.5 : 0)) +
      sum((i) => (i.profile?.secondary === "healer" || i.profile?.secondary === "support" ? 1 : 0)) +
      sum((i) => i.heal) / 4 +
      sum((i) => (tag(i, "regen") || tag(i, "lifelink") || tag(i, "aura") ? 1 : 0)),
    control:
      sum((i) => (i.profile?.primary === "control" ? 3 : i.profile?.primary === "debuffer" ? 2 : 0)) +
      sum((i) => (i.profile?.secondary === "control" || i.profile?.secondary === "debuffer" ? 1 : 0)) +
      sum((i) => (CONTROL_TAGS.some((t) => i.tags.has(t)) ? 1 : 0)),
    synergy: activeSynergies.length * 2 + activeCombos.length * 1.5 + positionHits.length + nearMiss * 0.5,
    economy:
      sum((i) => i.upgrades.filter((u) => u === "economy").length) * 3 +
      sum((i) => (has(i, "economy") ? 2 : 0)) +
      ((runState.recruitDiscount || 0) > 0 ? 1 : 0) +
      ((runState.shopSlotBonus || 0) > 0 ? 1 : 0) +
      ((runState.ledgerWinBonus || 0) > 0 ? 1 : 0),
    scaling:
      sum((i) => (tag(i, "scaling") ? 2 : 0)) +
      sum((i) => i.upgrades.filter((u) => u === "power" || u === "synergy").length) * 0.6 +
      sum((i) => (i.def.growth ? 3 : 0)) +
      sum((i) => (has(i, "assassin") ? 0.5 : 0)) +
      sum((i) => (tag(i, "aoe") ? 0.4 : 0)),
  }
  const scores = Object.fromEntries(SCORE_DIMS.map((d) => [d.id, clamp10(raw[d.id])]))

  // Core: highest (tierRank*10 + tag overlap with dominant tribe*2 + cost/100).
  const dominant = Object.entries(tribeCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
  const tierRank = (def) => (def.tier === "legendary" ? 4 : def.tier === "rare" ? 3 : def.tier === "uncommon" ? 2 : 1)
  const coreInfo = [...deployed].sort((a, b) => {
    const va = tierRank(a.def) * 10 + (a.tribes.includes(dominant) ? 2 : 0) + (a.def.recruitCost || 0) / 100
    const vb = tierRank(b.def) * 10 + (b.tribes.includes(dominant) ? 2 : 0) + (b.def.recruitCost || 0) / 100
    return vb - va
  })[0]
  const core = coreInfo
    ? { name: coreInfo.def.name, why: coreInfo.profile?.strengths?.[0] || "carries this squad" }
    : null

  // Notes - the <=2 most severe gaps, in priority order.
  const hasTank = deployed.some((i) => has(i, "tank"))
  const hasHealer = deployed.some((i) => has(i, "healer"))
  const notes = []
  const push = (t) => notes.length < 2 && notes.push(t)
  if (!hasTank && n >= 3) push("No real front line")
  if (scores.damage <= 2) push("Not enough damage to close a fight")
  if (!hasHealer && scores.sustain <= 2 && scores.damage >= 5) push("Nothing to keep the squad standing")
  if (scores.synergy === 0 && n >= 3) push("Your units don't share a tribe")
  if (scores.scaling <= 1 && n === 4) push("Nothing that grows in a long fight")
  if (scores.control === 0 && n === 4) push("No answer to a dangerous enemy")
  if (!notes.length) push("A rounded squad - no glaring gap")

  return { deployedCount: n, scores, core, notes }
}
