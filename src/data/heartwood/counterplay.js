// Hearthwood Trial - counterplay tags. PRD "Unit Roles / Build System"
// 33: every enemy build has a counter (High Armour <- Armour pen;
// Summoner/swarm <- AoE; Heavy Healing <- pressure; Poison <- Cleanse;
// Control <- Resistance; Back-line threat <- Reach). The analysis layer
// says what SHAPE your squad is (buildScore) and WHY a fight went the
// way it did (battleAnalysis) - this says, BEFORE a fight, whether your
// build has an answer to the enemy you're about to face.
//
// A PURE function of the FormationScreen's already-computed enemy
// preview + runState - no combat/engine change, nothing written back,
// no RUN_SAVE_VERSION bump. The "answers" are real EXISTING interactions
// (an AoE attacker genuinely hits every swarm body; a shatter unit
// genuinely strips block) - this only makes them legible pre-fight.
// Placeholder-first: 6 threat/answer pairs + one derivation each.

import { UNITS } from "./units"
import { ENEMIES } from "./enemies"
import { CHARACTERS } from "./characters"
import { RELICS } from "./relics"
import { unitProfile, unitTargetProfile } from "./roles"
import { effectiveRole } from "./items"
import { evaluateBuild } from "./buildScore"
import { runModifierById } from "./boons"

export const THREATS = [
  { id: "armor", label: "Heavy armour", icon: "stone", answer: "an armour-breaker (Shatter / Sunder)" },
  { id: "swarm", label: "A swarm", icon: "wolf", answer: "an AoE / chain attacker" },
  { id: "sustain", label: "Enemy healing", icon: "heart", answer: "burst or a damage-over-time" },
  { id: "poison", label: "Poison / burn", icon: "leaf", answer: "a cleanse or heavy regen" },
  { id: "control", label: "Control", icon: "spark", answer: "Ward / Bulwark / Evade" },
  { id: "backline", label: "A back-line threat", icon: "gale", answer: "reach (an assassin / pattern attacker)" },
  { id: "hunters", label: "Hunts your weak", icon: "fox", answer: "a taunt, a decoy, or a bodyguard" },
  { id: "coven", label: "A buffing enabler", icon: "rune", answer: "focus the caster - reach, an executioner, or a Sunder" },
  { id: "brood", label: "Splits when killed", icon: "wolf", answer: "AoE / chain, or Execute the small ones" },
  { id: "cult", label: "A ritual pack", icon: "flame", answer: "burst the pack, reach the leader, or stun it to stall the rite" },
  { id: "collectors", label: "Takes your buffs", icon: "spark", answer: "burst it fast, a Sunder to take it back, or flat bodies with nothing to steal" },
  { id: "ancients", label: "A charging colossus", icon: "flame", answer: "burst it, stun it, stagger it in one heavy round, or brace the squad for the hit" },
]

export const THREAT_LABEL = Object.fromEntries(THREATS.map((t) => [t.id, t.label]))
export const THREAT_ANSWER = Object.fromEntries(THREATS.map((t) => [t.id, t.answer]))

// Signature enemies whose real kit reads wrong from raw signals, or
// that Marc wants pinned. Grows a unit at a time.
export const THREAT_OVERRIDES = {
  spacemonkey: ["armor", "control"],
  "the-gorging-maw": ["armor", "sustain"],
  "the-iron-sentinel": ["armor"],
  // Specialist enemies (feat/hearthwood-threat-preview) - raw signals
  // already catch these, pinned so the threat preview never mis-ranks.
  "dawn-zealot": ["sustain"],
  plaguebearer: ["poison", "sustain"],
}

const CONTROL_IDS = ["stun", "slow", "taunt", "weak", "silence", "dampen"]
const DOT_IDS = ["poison", "burn", "bleed"]
const arr = (x) => (Array.isArray(x) ? x : x ? [x] : [])
const stepsOf = (def) => arr(def?.movePattern)
const passivesOf = (def) => arr(def?.passive)
const grants = (def, ...ids) => passivesOf(def).some((p) => p.type === "applyBuff" && ids.includes(p.id))

function defThreats(def) {
  if (!def) return []
  const out = []
  const steps = stepsOf(def)
  const blockMax = Math.max(0, ...steps.filter((m) => m.type === "block").map((m) => m.amount || 0))
  if (blockMax >= 10 || grants(def, "bulwark", "ward")) out.push("armor")
  if (steps.some((m) => m.type === "heal") || grants(def, "regen", "revive")) out.push("sustain")
  if (steps.some((m) => m.type === "debuff" && CONTROL_IDS.includes(m.id))) out.push("control")
  if (steps.some((m) => m.type === "debuff" && DOT_IDS.includes(m.id))) out.push("poison")
  // Hunters (feat/hearthwood-hunters): the piece's targeting is flipped
  // to hit your softest unit - see autoBattleEngine.js's threatTarget.
  if (def.hunter) out.push("hunters")
  // Coven (feat/hearthwood-coven): the Matron behind the shield buffs
  // every other living enemy each round - see autoBattleEngine.js's
  // applyCovenTick. Kill it first (reach / an executioner / a Sunder) or
  // the pack snowballs.
  if (def.covenAura) out.push("coven")
  // Brood (feat/hearthwood-brood): dies into smaller copies of itself
  // (effects.js's broodSplit). A single-target grind doubles the body
  // count - AoE / chain clears the spawns, Execute drops the low-HP ones.
  if (def.broodSplit) out.push("brood")
  // Cult (feat/hearthwood-cult): the Ritual Warden sacrifices its own
  // fodder every few rounds to buff the rest - see autoBattleEngine.js's
  // applyCultTick. Race the rite, reach the Warden, or stun it to stall.
  if (def.cultRitual) out.push("cult")
  // Collectors (feat/hearthwood-collectors): every hit steals a stack of
  // one of your buffs for itself - see effects.js's leech(). Burst it,
  // Sunder it back, or field flat bodies with nothing to take.
  if (def.leech) out.push("collectors")
  // Ancients (feat/hearthwood-ancients): a slow colossus winding up ONE
  // telegraphed squad-wide hit on a visible countdown - see
  // autoBattleEngine.js's applyAncientCharge. Kill it, stun it (the count
  // holds), stagger it (a heavy round resets the count), or brace for it.
  if (def.charge) out.push("ancients")
  return out
}

// The threats the next fight actually presents. `previewEnemies` is the
// FormationScreen's previewBattleEnemies() array (scaled battle.enemies).
export function enemyThreatsFor(previewEnemies, runState) {
  const living = (previewEnemies || []).filter((e) => (e.hp ?? 1) > 0)
  const threats = new Set()
  if (living.length >= 4) threats.add("swarm")
  if (living.some((e) => (e.pos?.row ?? 0) >= 1)) threats.add("backline")
  for (const e of living) {
    const def = runState?.battle?.enemyDefs?.[e.defId] || ENEMIES[e.defId] || UNITS[e.defId]
    for (const t of THREAT_OVERRIDES[e.defId] || defThreats(def)) threats.add(t)
  }
  return threats
}

function deployedInfos(runState) {
  return (runState?.deployed || [])
    .filter((k) => k !== null)
    .map((key) => {
      const entry = (runState.bench || []).find((e) => e.key === key)
      const def = entry && UNITS[entry.defId]
      if (!def) return null
      const itemIds = (runState.items || []).filter((it) => it.equippedTo === key).map((it) => it.defId)
      const bent = effectiveRole(def.role, itemIds)
      const profile = unitProfile(def, bent && bent !== def.role ? bent : undefined)
      const applies = (...ids) =>
        stepsOf(def).some((m) => m.type === "debuff" && ids.includes(m.id)) ||
        passivesOf(def).some((p) => p.type === "applyBuff" && ids.includes(p.id))
      return { def, profile, tags: new Set(profile?.tags || []), applies, targetProfile: unitTargetProfile(def, bent && bent !== def.role ? bent : undefined) }
    })
    .filter(Boolean)
}

// The threats your kit has an answer to.
export function buildAnswersFor(runState) {
  const units = deployedInfos(runState)
  const relics = (runState?.relics || []).map((id) => RELICS[id]).filter(Boolean)
  const mods = (runState?.runModifiers || []).map(runModifierById).filter(Boolean)
  const modGrants = (...ids) => mods.some((m) => arr(m.effects).some((e) => e.type === "applyBuff" && ids.includes(e.id)))
  const relicGrants = (...ids) => relics.some((r) => arr(r.squadBuff?.effects || r.effects).some((e) => e?.type === "applyBuff" && ids.includes(e.id)))
  const commander = CHARACTERS[runState?.characterId]
  const commanderCleanse = arr(commander?.startEffects).some(
    (e) => e.type === "cleanse" || (e.type === "addTrigger" && e.effect?.type === "cleanse"),
  ) || /shrug|cleanse|ailment/i.test(commander?.description || "")

  const covered = new Set()
  const anyUnit = (fn) => units.some(fn)

  if (anyUnit((u) => u.tags.has("shatter") || u.applies("shatter", "sunder", "vulnerable"))) covered.add("armor")
  if (anyUnit((u) => (u.def.attackPattern && u.def.attackPattern !== "single") || u.tags.has("aoe") || u.def.chainDamage))
    covered.add("swarm")
  if ((evaluateBuild(runState).scores?.damage || 0) >= 6 || anyUnit((u) => u.applies("poison", "burn") || u.tags.has("poison") || u.tags.has("burn")))
    covered.add("sustain")
  if (
    anyUnit((u) => u.applies("cleanse") || u.tags.has("cleanse")) ||
    commanderCleanse ||
    modGrants("regen") ||
    units.filter((u) => u.tags.has("regen")).length >= 2
  )
    covered.add("poison")
  if (anyUnit((u) => u.applies("ward", "bulwark", "evade") || u.tags.has("shield")) || relicGrants("ward", "bulwark", "evade") || modGrants("ward", "bulwark", "evade"))
    covered.add("control")
  if (anyUnit((u) => u.targetProfile === "executioner" || u.profile?.primary === "assassin" || (u.def.attackPattern && u.def.attackPattern !== "single")))
    covered.add("backline")
  // Coven (feat/hearthwood-coven): reach past the shield and delete the
  // caster - a pattern attacker or an executioner snipes it, a Sunder
  // strips the stacked Strength off the pack. (Sunder is usually an
  // onDealDamage trigger, not a plain debuff step, so check the derived
  // tag too - `applies` only sees debuff steps / applyBuff passives.)
  if (
    anyUnit(
      (u) =>
        u.targetProfile === "executioner" ||
        u.profile?.primary === "assassin" ||
        (u.def.attackPattern && u.def.attackPattern !== "single") ||
        u.tags.has("sunder") ||
        u.applies("sunder"),
    )
  )
    covered.add("coven")
  // Brood (feat/hearthwood-brood): AoE / chain / a pattern attacker
  // clears a mother AND its spawns in one swing; Execute drops the
  // ~15-HP hatchlings on contact.
  if (
    anyUnit(
      (u) =>
        (u.def.attackPattern && u.def.attackPattern !== "single") ||
        u.tags.has("aoe") ||
        u.def.chainDamage ||
        u.tags.has("execute") ||
        u.applies("execute"),
    )
  )
    covered.add("brood")
  // Hunters (feat/hearthwood-hunters): a taunt / decoy pulls the pack, a
  // bodyguard (`guard`) steps in front, and the Bulwark Standard /
  // Rearguard relics both hand a defensive unit the enemy's attention.
  if (
    anyUnit((u) => u.applies("taunt") || u.tags.has("taunt") || u.def.guard) ||
    relics.some((r) => r?.tauntHighestHp || r?.guardLowestHp)
  )
    covered.add("hunters")

  // Cult (feat/hearthwood-cult): stall the rite (a Stun on the Warden, or
  // the Silenced Bell relic), reach the Warden / clear the fodder (a
  // pattern or chain attacker), out-scale it (`growth`), or just burst
  // the pack before the rite lands (damage score >= 6).
  if (
    anyUnit(
      (u) =>
        u.applies("stun") ||
        u.tags.has("stun") ||
        (u.def.attackPattern && u.def.attackPattern !== "single") ||
        u.def.chainDamage ||
        u.def.growth ||
        u.tags.has("scaling"),
    ) ||
    relics.some((r) => r?.stunHighestHp) ||
    (evaluateBuild(runState).scores?.damage || 0) >= 6
  )
    covered.add("cult")

  // Collectors (feat/hearthwood-collectors): burst it before it
  // accumulates (damage score >= 6), Sunder back what it stole, or field
  // a unit built for the theft (`vengeful` - it answers each steal).
  if (
    (evaluateBuild(runState).scores?.damage || 0) >= 6 ||
    anyUnit((u) => u.applies("sunder") || u.tags.has("sunder") || u.def.vengeful || u.tags.has("vengeful"))
  )
    covered.add("collectors")

  // Ancients (feat/hearthwood-ancients): burst it before the count lands
  // (damage score >= 6 - that also staggers it in a heavy round), stun it
  // to hold the count, or brace the squad with Ward / Bulwark for the hit.
  if (
    (evaluateBuild(runState).scores?.damage || 0) >= 6 ||
    anyUnit(
      (u) =>
        u.applies("stun") ||
        u.tags.has("stun") ||
        u.applies("ward", "bulwark") ||
        u.tags.has("shield"),
    ) ||
    relicGrants("ward", "bulwark") ||
    modGrants("ward", "bulwark") ||
    relics.some((r) => r?.bracedSquad)
  )
    covered.add("ancients")

  return covered
}

// { threats, covered, gaps } - threats the next fight presents, which
// your kit answers, which it doesn't.
export function evaluateMatchup(previewEnemies, runState) {
  const threatSet = enemyThreatsFor(previewEnemies, runState)
  const threats = THREATS.map((t) => t.id).filter((id) => threatSet.has(id))
  if (!threats.length) return { threats: [], covered: [], gaps: [] }
  const answers = buildAnswersFor(runState)
  return {
    threats,
    covered: threats.filter((t) => answers.has(t)),
    gaps: threats.filter((t) => !answers.has(t)),
  }
}
