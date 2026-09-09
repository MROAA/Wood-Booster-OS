// Hearthwood Trial - the enemy threat preview. Enemy Ecosystem PRD
// 50-51: before a fight, tell the player WHAT KIND of problem this is -
// a danger rating, the threat that dominates, and the concrete
// mechanics to expect - so the fight can be planned for, not just
// walked into.
//
// The companion to counterplay.js (#428): that says "does your kit
// have the answer" (evaluateMatchup -> the "Next fight" checkrow); this
// says "here is the problem". A PURE function of the FormationScreen's
// already-computed previewBattleEnemies() array + runState + the node -
// no combat/engine change, nothing written back, no RUN_SAVE_VERSION
// bump. Placeholder-first: one rating heuristic + one mechanics table.

import { ENEMIES } from "./enemies"
import { UNITS } from "./units"
import { enemyThreatsFor, evaluateMatchup, THREATS, THREAT_LABEL, THREAT_ANSWER } from "./counterplay"

export const THREAT_RATINGS = ["Routine", "Real", "Dangerous", "Severe", "Deadly"] // rating 1..5

const arr = (x) => (Array.isArray(x) ? x : x ? [x] : [])
const clamp = (lo, hi, v) => Math.max(lo, Math.min(hi, v))
const CONTROL_IDS = ["stun", "slow", "taunt", "weak", "silence", "dampen"]
const DOT_IDS = ["poison", "burn", "bleed"]
const LABEL = { weak: "Weak", poison: "Poison", burn: "Burn", bleed: "Bleed", slow: "Slow", stun: "Stun", dampen: "Dampen", silence: "Silence", vulnerable: "Vulnerable", taunt: "Taunt" }

// The raw per-enemy pressure numbers used by the rating.
function enemyStats(e, runState) {
  const def = runState?.battle?.enemyDefs?.[e.defId] || ENEMIES[e.defId] || UNITS[e.defId] || {}
  const steps = arr(def.movePattern)
  const maxAtk = Math.max(0, ...steps.filter((m) => m.type === "attack").map((m) => m.amount || 0))
  return { def, maxHp: e.maxHp ?? def.maxHp ?? 30, maxAtk }
}

// Ordered so the "Expect:" line is stable. Each entry: [test(def, ctx), phrase].
const MECH = [
  [(d) => arr(d.movePattern).some((m) => m.type === "debuff" && DOT_IDS.includes(m.id)), (d) => `Applies ${LABEL[dotId(d)] || "Poison"}`],
  [(d) => arr(d.movePattern).some((m) => m.type === "debuff" && CONTROL_IDS.includes(m.id)), (d) => `Applies ${LABEL[ctrlId(d)] || "Weak"}`],
  [(d) => arr(d.passive).some((p) => p.type === "applyBuff" && (p.id === "shatter" || p.id === "sunder")) || arr(d.movePattern).some((m) => m.type === "sunder"), () => "Strips your Block"],
  [(d) => arr(d.movePattern).some((m) => m.type === "heal") || arr(d.passive).some((p) => p.type === "applyBuff" && (p.id === "regen" || p.id === "revive")), () => "Heals itself"],
  [(d) => d.hunter, () => "Hunts your weakest"],
  [(d) => d.attackPattern && d.attackPattern !== "single", () => "Hits every square"],
  [(d) => Array.isArray(d.phases) && d.phases.length > 0, () => "Shifts phase when hurt"],
  [(d) => d.moveSelect === "weightedRandom", () => "Unpredictable moves"],
]
const dotId = (d) => arr(d.movePattern).find((m) => m.type === "debuff" && DOT_IDS.includes(m.id))?.id
const ctrlId = (d) => arr(d.movePattern).find((m) => m.type === "debuff" && CONTROL_IDS.includes(m.id))?.id

// Base severity of each archetype when ranking primary/secondary.
// A full swarm is a more pressing "what kind of problem is this" than a
// stray back-row piece - it outranks backline (bumped when the-brood /
// the-teeming made "backline" edge out "A swarm" by 0.1).
const SEVERITY = { control: 1.4, hunters: 1.25, armor: 1.2, swarm: 1.15, sustain: 1.1, poison: 1.0, backline: 0.85 }

export function evaluateThreat(previewEnemies, runState, node) {
  const living = (previewEnemies || []).filter((e) => (e.hp ?? 1) > 0)
  if (!living.length) {
    return { rating: 1, ratingLabel: THREAT_RATINGS[0], primary: null, secondary: null, mechanics: [], note: "" }
  }

  // --- rating -------------------------------------------------------
  // Purely about the enemy (their scaled HP already encodes the Act's
  // difficulty ramp) + roster size + a bounded attack term + the node
  // kind - NOT the player's squad, since this panel shows while the
  // squad is still being placed. One W table.
  const stats = living.map((e) => enemyStats(e, runState))
  const totalHp = stats.reduce((s, x) => s + x.maxHp, 0)
  const totalAtk = stats.reduce((s, x) => s + x.maxAtk, 0)
  const hpScore = (totalHp / 130) * 0.9
  const sizeScore = clamp(0, 1.5, (living.length - 1) * 0.4)
  const atkScore = clamp(0, 1.4, totalAtk / 22) * 0.8
  const nodeBump = node?.type === "elite" || node?.type === "miniboss" ? 1 : 0
  let rating = clamp(1, 5, Math.round(1 + hpScore + sizeScore + atkScore + nodeBump))
  if (node?.type === "boss") rating = Math.max(rating, 5)

  // --- primary / secondary --------------------------------------------
  const threatSet = enemyThreatsFor(previewEnemies, runState)
  const ranked = THREATS.map((t) => t.id)
    .filter((id) => threatSet.has(id))
    .map((id) => {
      const frac = living.filter((e) => {
        const d = ENEMIES[e.defId] || UNITS[e.defId]
        return exhibits(d, id, living.length)
      }).length / living.length
      return { id, score: (SEVERITY[id] || 1) + frac }
    })
    .sort((a, b) => b.score - a.score)
  const asLead = (id) => (id ? { id, label: THREAT_LABEL[id] || id } : null)
  let primary = asLead(ranked[0]?.id)
  const secondary = asLead(ranked[1]?.id)
  if (!primary) {
    const meanAtk = totalAtk / Math.max(1, living.length)
    const hpHeavy = totalHp / Math.max(1, living.length) >= 55 && meanAtk < 7
    primary = { id: "raw", label: hpHeavy ? "A grind" : "Raw damage" }
  }

  // --- mechanics -----------------------------------------------------
  const mechanics = []
  for (const [test, phrase] of MECH) {
    for (const e of living) {
      const d = ENEMIES[e.defId] || UNITS[e.defId]
      if (d && test(d)) {
        const p = phrase(d)
        if (!mechanics.includes(p)) mechanics.push(p)
        break
      }
    }
    if (mechanics.length >= 4) break
  }
  if (mechanics.length < 4 && living.length >= 4 && !mechanics.includes("Comes in numbers")) {
    mechanics.push("Comes in numbers")
  }

  // --- note --------------------------------------------------------
  let note = ""
  if (primary.id === "raw") {
    note = "↳ Trade fast — nothing here rewards a long fight"
  } else {
    const m = evaluateMatchup(previewEnemies, runState)
    if (m.gaps.includes(primary.id)) note = `↳ Bring ${THREAT_ANSWER[primary.id]}`
    else if (m.covered.includes(primary.id)) note = "↳ Your kit already answers this"
    else note = `↳ Wants ${THREAT_ANSWER[primary.id]}`
  }

  return { rating, ratingLabel: THREAT_RATINGS[rating - 1], primary, secondary, mechanics: mechanics.slice(0, 4), note }
}

// Does def `d` exhibit archetype `id` (for the primary/secondary frac).
function exhibits(d, id, livingCount) {
  if (!d) return false
  const steps = arr(d.movePattern)
  switch (id) {
    case "swarm":
      return livingCount >= 4
    case "backline":
      return true // roster-level in enemyThreatsFor; treat as shared
    case "armor": {
      const blockMax = Math.max(0, ...steps.filter((m) => m.type === "block").map((m) => m.amount || 0))
      return blockMax >= 10 || arr(d.passive).some((p) => p.type === "applyBuff" && ["bulwark", "ward"].includes(p.id))
    }
    case "sustain":
      return steps.some((m) => m.type === "heal") || arr(d.passive).some((p) => p.type === "applyBuff" && ["regen", "revive"].includes(p.id))
    case "hunters":
      return !!d.hunter
    case "control":
      return steps.some((m) => m.type === "debuff" && CONTROL_IDS.includes(m.id))
    case "poison":
      return steps.some((m) => m.type === "debuff" && DOT_IDS.includes(m.id))
    default:
      return false
  }
}
