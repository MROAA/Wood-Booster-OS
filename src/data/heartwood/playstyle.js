// Hearthwood Trial - Strategic Playstyle profile. PRD "Seed System /
// Strategic Playstyle" 14 / 27: a run's decisions add up to a profile -
// Aggression / Defense / Control / Economy / Risk / Adaptation - that
// EMERGES from what you did, not a class you picked up front (13), and
// can drift as the run goes (27).
//
// A PURE function of runState, exactly like buildScore.js's
// evaluateBuild - reads only what's already there (the whole bench +
// unitProfile, upgrade-branch picks, the Ledger flags, marketLevel,
// essence vs progress, relics, run modifiers, the event log, tribe
// spread), writes nothing, no RUN_SAVE_VERSION bump. Placeholder-first:
// the W table below is one edit to tune. The history-based signals the
// PRD also wants (reroll count, risky routes actually chosen mid-run,
// pivots) need a small additive runState tally - a queued refinement.

import { UNITS } from "./units"
import { unitProfile } from "./roles"
import { effectiveRole } from "./items"
import { tribesOf } from "./synergies"
import { runModifierById } from "./boons"

export const PLAYSTYLE_AXES = [
  { id: "aggression", label: "Aggression", icon: "sword", accent: "--hw-ember" },
  { id: "defense", label: "Defense", icon: "shield", accent: "--hw-stone" },
  { id: "control", label: "Control", icon: "rune", accent: "--hw-rune" },
  { id: "economy", label: "Economy", icon: "spark", accent: "--hw-cosmic" },
  { id: "risk", label: "Risk", icon: "flame", accent: "--hw-hp" },
  { id: "adaptation", label: "Adaptation", icon: "leaf", accent: "--hw-moss" },
]

const CONTROL_TAGS = ["poison", "burn", "weak", "vulnerable", "stun"]
const clamp100 = (n) => Math.max(0, Math.min(100, Math.round(n)))

// Per-axis divisor: raw sum / SCALE * 100, clamped. Tuned so a run that
// commits hard to one axis reads ~60-90 there and a rounded run sits
// mid-30s across the board.
const SCALE = { aggression: 16, defense: 17, control: 11, economy: 15, risk: 10, adaptation: 11 }

const BLURB = {
  aggression: "you build to end fights fast",
  defense: "you build to outlast the fight",
  control: "you build to stop the enemy doing its thing",
  economy: "you build the engine before the army",
  risk: "you take the dangerous line for the bigger prize",
  adaptation: "you keep your options open and shift as the run demands",
}

function benchInfo(runState, entry) {
  const def = UNITS[entry.defId]
  if (!def) return null
  const upgrades = entry.upgrades || []
  const itemIds = (runState.items || []).filter((it) => it.equippedTo === entry.key).map((it) => it.defId)
  const bent = effectiveRole(def.role, itemIds)
  const profile = unitProfile(def, bent && bent !== def.role ? bent : undefined)
  return { def, profile, upgrades, tags: new Set([...(profile?.tags || []), ...upgrades]), tribes: tribesOf(entry.defId, def) }
}

// { scores: {axis: 0..100}, dominant, secondary, blurb }
export function evaluatePlaystyle(runState) {
  const bench = (runState?.bench || []).map((e) => benchInfo(runState, e)).filter(Boolean)
  const zeros = Object.fromEntries(PLAYSTYLE_AXES.map((a) => [a.id, 0]))

  if (!bench.length) {
    return { scores: zeros, dominant: null, secondary: null, blurb: "Your run hasn't taken shape yet." }
  }

  const sum = (fn) => bench.reduce((s, u) => s + fn(u), 0)
  const is = (u, ...roles) => roles.includes(u.profile?.primary) || roles.includes(u.profile?.secondary)
  const tag = (u, ...ts) => ts.some((t) => u.tags.has(t))
  const branch = (id) => sum((u) => u.upgrades.filter((b) => b === id).length)

  const nodeIndex = runState.nodeIndex || 0
  const essence = runState.essence || 0
  const mods = (runState.runModifiers || []).map(runModifierById).filter(Boolean)
  const path = runState.path || []
  const hardNodes = path.filter((n) => n && (n.type === "elite" || n.type === "miniboss")).length
  const tribeSpread = new Set(bench.flatMap((u) => u.tribes)).size
  const branchSpread = new Set(bench.flatMap((u) => u.upgrades)).size
  const primarySpread = new Set(bench.map((u) => u.profile?.primary).filter(Boolean)).size
  // Decision history (runEngine.js's runState.styleLog - PR #427). What
  // the profile can't see from a snapshot: rerolls + mid-run swaps ->
  // adaptation, long grind wins -> defense, peak Essence -> economy.
  const sl = runState.styleLog || {}
  const styleN = (k) => sl[k] || 0

  const raw = {
    aggression:
      sum((u) => (is(u, "dps", "assassin") ? 2 : 0)) +
      sum((u) => (tag(u, "aoe", "execute", "chain") ? 1 : 0)) +
      branch("power") * 2 +
      (runState.commanderRank || 0) +
      sum((u) => (tag(u, "scaling") || u.def.growth ? 1 : 0)),
    defense:
      sum((u) => (is(u, "tank") ? 2 : is(u, "healer", "support") ? 1.5 : 0)) +
      sum((u) => (tag(u, "shield", "frontline", "regen", "aura") ? 1 : 0)) +
      branch("defense") * 2 +
      branch("synergy") * 1.5 +
      Math.min(6, styleN("grinds")) * 2,
    control:
      sum((u) => (is(u, "control", "debuffer") ? 2 : 0)) +
      sum((u) => (CONTROL_TAGS.some((t) => u.tags.has(t)) ? 1 : 0)) +
      branch("utility") * 2,
    economy:
      ((runState.recruitDiscount || 0) > 0 ? 3 : 0) +
      ((runState.shopSlotBonus || 0) > 0 ? 3 : 0) +
      ((runState.ledgerWinBonus || 0) > 0 ? 3 : 0) +
      branch("economy") * 3 +
      sum((u) => (is(u, "economy") ? 2 : 0)) +
      ((runState.marketLevel || 1) - 1) * 1.5 +
      Math.max(0, (styleN("maxEssence") || essence) / (nodeIndex + 1) - 70) / 35,
    risk:
      mods.filter((m) => m.kind === "bane").length * 3 +
      hardNodes * 2 +
      (nodeIndex >= 6 && essence < 40 ? 3 : 0) +
      (runState.honoredMemory ? 1 : 0),
    adaptation:
      Math.min(6, (runState.eventLog || []).length) * 1 +
      (tribeSpread >= 3 ? tribeSpread - 1 : 0) +
      (branchSpread >= 3 ? branchSpread : 0) +
      (primarySpread >= 3 ? primarySpread : 0) +
      Object.values(runState.seen || {}).reduce((s, arr) => s + (arr?.length || 0), 0) * 0.15 +
      Math.min(8, styleN("rerolls")) * 1.1 +
      Math.min(5, styleN("pivots")) * 2,
  }

  const scores = Object.fromEntries(PLAYSTYLE_AXES.map((a) => [a.id, clamp100((raw[a.id] / SCALE[a.id]) * 100)]))
  const ranked = [...PLAYSTYLE_AXES].map((a) => a.id).sort((a, b) => scores[b] - scores[a])
  const dominant = scores[ranked[0]] > 0 ? ranked[0] : null
  const secondary = dominant && scores[ranked[1]] > 0 ? ranked[1] : null

  let blurb
  if (!dominant) blurb = "Your run hasn't taken shape yet."
  else if (secondary && scores[secondary] >= scores[dominant] - 12)
    blurb = `Mostly ${labelOf(dominant)}, with strong ${labelOf(secondary)} - ${BLURB[dominant]}.`
  else blurb = `${labelOf(dominant)} - ${BLURB[dominant]}.`

  return { scores, dominant, secondary, blurb }
}

function labelOf(id) {
  return PLAYSTYLE_AXES.find((a) => a.id === id)?.label || id
}
