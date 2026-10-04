// Hearthwood Frontier - MANA (step 1). Every hero and every enemy has a
// mana pool; skills cost AP + mana (+ keep their cooldowns). Basic
// attack, move, Overwatch and Hunker Down are free.
//
// Rules (player-facing numbers live in the constants below):
// - Pool by battle role: casters/healers big, tanks small. Starts FULL
//   every fight, never carries over.
// - Regen at the start of each own turn (~10% of the pool), healers and
//   support get a steady bonus on top.
// - Role gains: tanks from damage they block, melee damage dealers on
//   hit (more on a kill), ranged on turn end if they held still (more
//   on high ground / in cover), healers + support when they heal/buff
//   an ally.
// - Overcharge: mana gained above max is stored (cap 50% of max); the
//   next skill spends it all for a bonus (+damage / +heal, or +Block
//   when the skill does neither).
// - Drain: some skills burn or steal mana; potions, relics and a few
//   support skills restore it.
//
// Gating is opt-in: only units that carry a numeric `mana` field are
// limited, and only `enableMana(state)` adds those fields (real run
// fights, the prototype page, the tutorial). Hand-built synthetic test
// states have none, so they behave exactly as before.
// Pure, state in -> state out. Engine helpers are imported back from
// tacticsEngine.js (circular, call-time only, same as tacticsRelics.js).
import { RELICS } from "../../data/heartwood/relics"
import { ITEMS } from "../../data/heartwood/items"
import { defaultManaCost } from "../../data/heartwood/classes"
import { emit, getUnit, setUnit } from "./tacticsEngine"
import { roleOf } from "./tacticsRoles"
import { isHigh } from "./tacticsTerrain"
import { tileCoverSides } from "./tacticsCover"

// --- Numbers ------------------------------------------------------------------

// Pool by mana role (battle role, with damage split melee/ranged).
export const MANA_POOL = { tank: 45, melee: 50, ranged: 55, control: 65, support: 70, healer: 75 }
export const MANA_ROLE_LABEL = {
  tank: "Tank - gains mana from damage it blocks",
  melee: "Melee - gains mana when it hits (more on a kill)",
  ranged: "Ranged - gains mana when it ends a turn without moving (more on high ground / in cover)",
  control: "Control - steady caster pool",
  support: "Support - extra regen, gains mana when it buffs an ally",
  healer: "Healer - extra regen, gains mana when it heals an ally",
}
// Bosses / elites with phases carry a bigger pool.
export const BOSS_POOL_BONUS = 20
// Modest scaling: +3 max mana per hero level above 1.
export const LEVEL_POOL_BONUS = 3
export const REGEN_PCT = 0.1
export const CASTER_REGEN = 3
export const COMMANDER_REGEN = 3
export const OVERCHARGE_PCT = 0.5
// 1 bonus damage/heal/Block per this much stored overcharge (min 1).
export const SURGE_PER = 5
export const GAIN = {
  blockMax: 10, // tank: per hit, up to this much (= what was blocked)
  graze: 3, // tank: a hit turned into a graze by cover
  hit: 5, // melee: per hit
  kill: 10, // melee: extra on a kill
  focus: 5, // ranged: ended the turn without moving
  high: 3, // ranged: ...on high ground
  cover: 3, // ranged: ...next to cover
  support: 6, // healer/support: healed or buffed an ally
}

// Default skill mana cost by AP cost + cooldown (classes.js; a skill's own
// `mana` field always wins). Cheap = 10 (~20-25% of a small pool), big 30-35.
export { defaultManaCost }

// Enemy skill kinds: enrage is free; a slam pays on the windup.
export const ENEMY_MANA_COST = { mend: 15, shield: 10, hex: 15, slam: 25, pounce: 15, summon: 25, enrage: 0, drain: 5 }

export function manaCostOf(skill) {
  if (!skill) return 0
  if (typeof skill.mana === "number") return skill.mana
  if (skill.kind && ENEMY_MANA_COST[skill.kind] != null && skill.target == null) return ENEMY_MANA_COST[skill.kind]
  return defaultManaCost(skill)
}

// --- State helpers --------------------------------------------------------------

export function manaOn(state) {
  return !!state?.manaRules
}
export function hasMana(u) {
  return !!u && typeof u.mana === "number"
}
export function manaRole(u) {
  const role = roleOf(u)
  if (role === "dps") return (u.range || 1) > 1 ? "ranged" : "melee"
  return role
}
export function overchargeCap(u) {
  return Math.floor((u?.manaMax || 0) * OVERCHARGE_PCT)
}
export function regenFor(u) {
  if (!hasMana(u)) return 0
  const role = manaRole(u)
  const caster = role === "healer" || role === "support" ? CASTER_REGEN : 0
  const commander = u.id === "player-commander" ? COMMANDER_REGEN : 0
  return Math.round(u.manaMax * REGEN_PCT) + caster + commander + (u.manaRegenBonus || 0)
}
export function canAfford(unit, skill) {
  return !hasMana(unit) || unit.mana >= manaCostOf(skill)
}
// Bonus a skill would get from the stored overcharge right now.
export function surgeFor(u) {
  const oc = u?.overcharge || 0
  return oc > 0 ? Math.max(1, Math.round(oc / SURGE_PER)) : 0
}

// Relic mana effects (relics.js `mana` field), summed for the squad.
export function relicManaFor(relicIds = []) {
  const out = { regen: 0, onHit: 0, startOvercharge: 0, pool: 0 }
  for (const id of relicIds) {
    const m = RELICS[id]?.mana
    if (!m) continue
    for (const k of Object.keys(out)) out[k] += m[k] || 0
  }
  return out
}

// Mana potions a unit carries in (items with `mana.restore`).
export function potionsFrom(itemIds = []) {
  return itemIds.filter((id) => ITEMS[id]?.mana?.restore > 0)
}

function initUnit(u, relic) {
  if (!u || u.structure || u.npc) return u
  const player = u.side === "player"
  const role = manaRole(u)
  const max = MANA_POOL[role] + ((u.phases?.length || 0) > 0 ? BOSS_POOL_BONUS : 0) + (player ? relic.pool : 0) + (u.manaPoolBonus || 0)
  const over = player ? Math.min(Math.floor(max * OVERCHARGE_PCT), relic.startOvercharge) : 0
  return {
    ...u,
    manaMax: max,
    mana: max,
    overcharge: over,
    manaRegenBonus: player ? relic.regen : 0,
    manaOnHit: player ? relic.onHit : 0,
  }
}

// Turns mana on for a fresh battle: every unit starts FULL.
export function enableMana(state, relicIds = []) {
  if (!state?.units) return state
  const relic = relicManaFor(relicIds)
  return { ...state, manaRules: true, manaRelic: relic, units: state.units.map((u) => initUnit(u, relic)) }
}

// Units summoned mid-fight get a full pool the first time it matters.
function ensureAll(state) {
  if (!manaOn(state) || !state.units.some((u) => !hasMana(u) && !u.structure && !u.npc && u.hp > 0)) return state
  const relic = state.manaRelic || relicManaFor()
  return { ...state, units: state.units.map((u) => (hasMana(u) ? u : initUnit(u, relic))) }
}

// --- Gain / spend / drain ----------------------------------------------------------

// Adds mana; anything above max fills the Overcharge meter (capped).
// `label` = show a floating "+N mana" callout (regen stays silent).
export function gainMana(state, unitId, amount, label = null) {
  const u = getUnit(state, unitId)
  if (!manaOn(state) || !hasMana(u) || u.hp <= 0 || !(amount > 0)) return state
  const room = u.manaMax - u.mana
  const toMana = Math.min(room, amount)
  const toOver = Math.max(0, Math.min(overchargeCap(u) - (u.overcharge || 0), amount - toMana))
  if (toMana + toOver <= 0) return state
  const next = setUnit(state, unitId, { mana: u.mana + toMana, overcharge: (u.overcharge || 0) + toOver })
  return label ? emit(next, { kind: "mana", unitId, amount: toMana + toOver, label, overcharge: toOver > 0 }) : next
}

// Burns mana (overcharge first). Returns { next, burned }.
export function burnMana(state, unitId, amount, label = "burn") {
  const u = getUnit(state, unitId)
  if (!manaOn(state) || !hasMana(u) || u.hp <= 0 || !(amount > 0)) return { next: state, burned: 0 }
  const fromOver = Math.min(u.overcharge || 0, amount)
  const fromMana = Math.min(u.mana, amount - fromOver)
  const burned = fromOver + fromMana
  if (!burned) return { next: state, burned: 0 }
  const next = setUnit(state, unitId, { mana: u.mana - fromMana, overcharge: (u.overcharge || 0) - fromOver })
  return { next: emit(next, { kind: "mana", unitId, amount: -burned, label }), burned }
}

// Burn, and the actor gains what was taken.
export function stealMana(state, actorId, targetId, amount) {
  const { next, burned } = burnMana(state, targetId, amount, "drain")
  return burned ? gainMana(next, actorId, burned, "steal") : next
}

function addLog(state, line) {
  return { ...state, log: [...(state.log || []), line] }
}

// --- Player skills -------------------------------------------------------------------

// Before a skill: park the overcharge bonus on the caster as `surge`
// (modifiedAttackAmount + healAmount read it during the cast).
export function primeSurge(state, actorId, skill) {
  const u = getUnit(state, actorId)
  if (!hasMana(u) || !(manaCostOf(skill) > 0)) return state
  const surge = surgeFor(u)
  return surge ? setUnit(state, actorId, { surge }) : state
}

const ALLY_SIG_KINDS = new Set(["heal", "shield-ally", "rally", "aura-block"])

// After a successful skill: pay the mana, spend the overcharge (bonus
// fallback = Block when the skill neither hit nor healed), apply the
// skill's own mana effect (`manaFx`: burn / steal / restore) and the
// healer/support "helped an ally" gain.
export function afterSkillCast(state, actorId, targetId, skill, seqBefore) {
  const before = getUnit(state, actorId)
  if (!hasMana(before)) return clearSurge(state, actorId)
  let next = state
  const cost = manaCostOf(skill)
  const surge = before.surge || 0
  next = setUnit(next, actorId, { mana: Math.max(0, before.mana - cost), ...(surge ? { overcharge: 0, surge: 0 } : {}) })
  if (surge) {
    const fresh = (next.events || []).filter((e) => e.seq > seqBefore)
    const used = fresh.some((e) => (e.kind === "strike" && e.actorId === actorId) || (e.kind === "heal" && e.actorId === actorId) || (e.kind === "damage" && e.targetId !== actorId))
    if (!used) next = setUnit(next, actorId, { block: (getUnit(next, actorId).block || 0) + surge })
    next = emit(addLog(next, `${before.name}'s Overcharge surges (+${surge}${used ? "" : " Block"}).`), { kind: "mana", unitId: actorId, amount: 0, label: "overcharge", text: `Overcharge +${surge}!` })
  }
  const fx = skill?.manaFx
  const target = targetId && typeof targetId === "string" ? getUnit(next, targetId) : null
  if (fx && target && target.hp > 0) {
    if (fx.restore && target.side === before.side) {
      next = gainMana(next, target.id, fx.restore, "restore")
      next = addLog(next, `${before.name} restores ${fx.restore} mana to ${target.name}.`)
    }
    if (fx.burn && target.side !== before.side) {
      const r = burnMana(next, target.id, fx.burn)
      next = r.burned ? addLog(r.next, `${before.name} burns ${r.burned} of ${target.name}'s mana.`) : r.next
    }
    if (fx.steal && target.side !== before.side) {
      const had = getUnit(next, target.id)
      next = stealMana(next, actorId, target.id, fx.steal)
      const lost = (had.mana + (had.overcharge || 0)) - (getUnit(next, target.id).mana + (getUnit(next, target.id).overcharge || 0))
      if (lost) next = addLog(next, `${before.name} steals ${lost} mana from ${target.name}.`)
    }
  }
  // Healer / support: helping an ally (not itself) pays back.
  const role = manaRole(before)
  const allySkill = skill?.target === "ally" || ALLY_SIG_KINDS.has(skill?.kind)
  const helpedOther = target ? target.side === before.side && target.id !== actorId : allySkill
  if ((role === "healer" || role === "support") && allySkill && helpedOther) next = gainMana(next, actorId, GAIN.support, "support")
  return next
}

function clearSurge(state, actorId) {
  const u = getUnit(state, actorId)
  return u && u.surge ? setUnit(state, actorId, { surge: 0 }) : state
}

// Why a skill can't be cast for mana reasons ("" = it can).
export function manaBlockReason(unit, skill) {
  if (!hasMana(unit)) return ""
  const cost = manaCostOf(skill)
  return unit.mana < cost ? `Needs ${cost} mana (has ${unit.mana})` : ""
}

// --- Potions -------------------------------------------------------------------------------

export const POTION_AP = 1

export function potionOf(unit) {
  const id = (unit?.potions || []).find((p) => !(unit.potionsUsed || []).includes(p))
  return id ? ITEMS[id] : null
}

// Drink one carried mana potion (1 AP, consumed - removed from the run
// after the fight). Overflow becomes Overcharge.
export function drinkPotion(state, unitId) {
  const u = getUnit(state, unitId)
  if (!u || u.hp <= 0 || state.phase !== u.side || !hasMana(u) || u.ap < POTION_AP) return state
  const potion = potionOf(u)
  if (!potion) return state
  let next = setUnit(state, unitId, { ap: u.ap - POTION_AP, potionsUsed: [...(u.potionsUsed || []), potion.id] })
  next = gainMana(next, unitId, potion.mana.restore, "potion")
  return addLog(next, `${u.name} drinks a ${potion.name} (+${potion.mana.restore} mana).`)
}

// --- Turn hooks ---------------------------------------------------------------------------

// Start of a side's own turn: regen (silent - the bar shows it).
export function sideTurnRegen(state, side) {
  if (!manaOn(state)) return state
  let next = ensureAll(state)
  for (const u of next.units) {
    if (u.side !== side || u.hp <= 0 || !hasMana(u)) continue
    next = gainMana(next, u.id, regenFor(u))
  }
  return next
}

// End of the player's turn (inside enemyPhaseStart, so the enemy
// preview sees it too): ranged heroes that held still focus.
export function playerTurnEndFocus(state) {
  if (!manaOn(state)) return state
  let next = state
  for (const u of state.units) {
    if (u.side !== "player" || u.hp <= 0 || !hasMana(u) || u.moved || manaRole(u) !== "ranged") continue
    let amount = GAIN.focus
    if (isHigh(state, u.pos)) amount += GAIN.high
    if (Object.values(tileCoverSides(state, u.pos)).some((v) => v > 0)) amount += GAIN.cover
    next = gainMana(next, u.id, amount, "focus")
  }
  return next
}

// Enemy phase start (shared with previewEnemyIntents): focus + enemy regen.
export function enemyPhaseMana(state) {
  if (!manaOn(state)) return state
  return sideTurnRegen(playerTurnEndFocus(state), "enemy")
}

// --- Combat gains -------------------------------------------------------------------------

// A hit landed (every damage path funnels through the engine's
// checkOnDealDamageTriggers): melee gains, more on a kill; relic on-hit.
export function onDealDamage(state, actorId, targetId, remaining) {
  if (!manaOn(state)) return state
  const actor = getUnit(state, actorId)
  const target = getUnit(state, targetId)
  if (!hasMana(actor) || actor.hp <= 0 || !target || target.side === actor.side) return state
  let amount = actor.manaOnHit || 0
  if (manaRole(actor) === "melee") amount += GAIN.hit + (target.hp <= 0 ? GAIN.kill : 0)
  return amount > 0 && remaining >= 0 ? gainMana(state, actorId, amount, target.hp <= 0 ? "kill" : "hit") : state
}

// Damage absorbed by Block / Bulwark / Ward: a tank turns it into mana.
export function onBlocked(state, targetId, absorbed) {
  if (!manaOn(state) || !(absorbed > 0)) return state
  const t = getUnit(state, targetId)
  if (!hasMana(t) || t.hp <= 0 || manaRole(t) !== "tank") return state
  return gainMana(state, targetId, Math.min(GAIN.blockMax, absorbed), "block")
}

// Cover turned a hit into a graze: a tank counts it as blocked.
export function onGraze(state, targetId) {
  if (!manaOn(state)) return state
  const t = getUnit(state, targetId)
  if (!hasMana(t) || t.hp <= 0 || manaRole(t) !== "tank") return state
  return gainMana(state, targetId, GAIN.graze, "block")
}

// --- Commander ultimate -------------------------------------------------------------------

export function ultimateReady(commander) {
  return hasMana(commander) && commander.mana >= commander.manaMax
}

// --- After the fight --------------------------------------------------------------------------

// Potions drunk in a fight, per unit id: [itemDefId...].
export function potionsUsedIn(battle) {
  const out = {}
  for (const u of battle?.units || []) if (u.potionsUsed?.length) out[u.id] = u.potionsUsed
  return out
}

// One-line summary for tooltips.
export function manaSummary(u) {
  if (!hasMana(u)) return ""
  const oc = u.overcharge > 0 ? ` +${u.overcharge} overcharge` : ""
  return `Mana ${u.mana}/${u.manaMax}${oc} · +${regenFor(u)} per turn`
}
