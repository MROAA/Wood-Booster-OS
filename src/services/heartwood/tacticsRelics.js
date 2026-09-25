// Hearthwood Frontier - relics & items DURING a tactics fight.
// createRunTacticsBattle already copies the auto-battle twin's start
// state; this file carries the in-fight parts too (extra powers, onHit /
// turnEnd triggers, per-turn ticks, on-kill Chain, Spore Spread, Evade,
// Stun, Dampen, Sunder, Cleanse) and names the relic/item that fired
// via a "reaction" callout. Engine helpers are imported back from
// tacticsEngine.js (circular, only used at call time).
import { RELICS } from "../../data/heartwood/relics"
import { ITEMS } from "../../data/heartwood/items"
import {
  emit,
  getUnit,
  setUnit,
  livingUnits,
  applyDamageWithBlock,
  applyPortableEffect,
  checkTacticsBattleEnd,
  checkEnemyPhase,
  trySpawnBrood,
} from "./tacticsEngine"

// Powers the tactics engine did not read before (player side).
const PLAYER_POWER_IDS = ["evade", "ascendant", "chainDamage", "sporeSpread", "burn", "dampen"]
// Enemy side: only what relics put on enemies (Silenced Bell).
const ENEMY_POWER_IDS = ["stun"]
export const RELIC_TRIGGER_KINDS = ["turnStart", "onDealDamage", "onHit", "turnEnd"]

// Stat-like applyBuff ids handled as plain `unit[id] += amount`.
const STACK_IDS = ["poison", "burn", "dampen", "stun", "evade", "ascendant", "chainDamage", "sporeSpread"]
// Same order as effects.js's sunder / cleanse.
const SUNDERABLE_IDS = ["ward", "revive", "taunt", "execute", "shatter", "strength"]
const CLEANSABLE_IDS = ["stun", "poison", "weak", "vulnerable", "dampen"]

const LABELS = { chainDamage: "Chain!", sporeSpread: "Spores!", evade: "Evade!", ascendant: "Ascend!", regen: "Regen!" }

function effectKey(trigger, effect) {
  return `${trigger}|${effect.type}|${effect.id || ""}`
}

// Which owned relics / equipped items could have produced this unit's
// triggers and powers - matched by shape (not amount, so relic levels
// still match). Items first: startAutoBattle applies them first.
function sourceDefs(twin, relicIds) {
  return [...(twin.itemIds || []).map((id) => ITEMS[id]), ...(relicIds || []).map((id) => RELICS[id])].filter(Boolean)
}

// Called once per unit from createRunTacticsBattle, after the auto-start
// overlay: extra powers + source-tagged triggers.
export function relicOverlayPatch(unit, twin, relicIds) {
  const powers = twin.powers || {}
  if (unit.side === "enemy") {
    return Object.fromEntries(ENEMY_POWER_IDS.map((id) => [id, powers[id] || 0]))
  }
  const defs = sourceDefs(twin, relicIds)
  const pool = []
  const relicSources = {}
  for (const def of defs) {
    for (const e of def.effects || []) {
      if (e.type === "addTrigger") pool.push({ key: effectKey(e.trigger, e.effect), name: def.name, used: false })
      else if (e.type === "applyBuff" && !relicSources[e.id]) relicSources[e.id] = def.name
    }
  }
  const triggers = (unit.triggers || []).map((t) => {
    const hit = pool.find((p) => !p.used && p.key === effectKey(t.trigger, t.effect))
    if (!hit) return t
    hit.used = true
    return { ...t, source: hit.name }
  })
  const stats = Object.fromEntries(PLAYER_POWER_IDS.map((id) => [id, powers[id] || 0]))
  // Evade only from relics/items: Gale units' own/synergy dodge is
  // already modelled as Sidestep (nimble), so it isn't doubled here.
  const sourcedEvade = defs.reduce(
    (n, def) => n + (def.effects || []).filter((e) => e.type === "applyBuff" && e.id === "evade").reduce((m, e) => m + (e.amount || 0), 0),
    0,
  )
  stats.evade = Math.min(stats.evade, sourcedEvade)
  return {
    ...stats,
    triggers,
    relicSources,
    evadedThisRound: false,
  }
}

// The floating callout + one log line. Skips an exact repeat of the
// previous event so one hit with two same-relic triggers pops once.
export function relicCallout(state, unitId, source, logLine) {
  const label = source.endsWith("!") ? source : `${source}!`
  const last = state.events?.[state.events.length - 1]
  let next = state
  if (!(last && last.kind === "reaction" && last.unitId === unitId && last.label === label)) {
    next = emit(state, { kind: "reaction", unitId, label, relic: true })
  }
  return logLine ? { ...next, log: [...next.log, logLine] } : next
}

function powerLabel(unit, id) {
  return unit.relicSources?.[id] || LABELS[id] || id
}

// applyPortableEffect's fallback: returns a unit patch, or null.
export function relicEffectPatch(unit, effect) {
  if (effect.type === "applyBuff" && STACK_IDS.includes(effect.id)) {
    return { [effect.id]: (unit[effect.id] || 0) + (effect.amount || 0) }
  }
  if (effect.type === "sunder") {
    const id = SUNDERABLE_IDS.find((k) => (k === "strength" ? unit.attack > (unit.baseAttack ?? unit.attack) : (unit[k] || 0) > 0))
    if (!id) return null
    return id === "strength" ? { attack: unit.attack - 1 } : { [id]: unit[id] - 1 }
  }
  if (effect.type === "cleanse") {
    const id = CLEANSABLE_IDS.find((k) => (unit[k] || 0) > 0)
    return id ? { [id]: unit[id] - 1 } : null
  }
  return null
}

export function describeRelicEffect(effect) {
  if (effect.type === "sunder") return "strips a buff"
  if (effect.type === "cleanse") return "shakes off an ailment"
  if (effect.type === "damage") return "strikes back"
  if (effect.type !== "applyBuff") return null
  const words = {
    poison: "poisons the wound",
    burn: "sets it burning",
    dampen: "dulls its strikes",
    stun: "stuns it",
    regen: "starts to mend",
    heal: "steadies itself",
  }
  return words[effect.id] || null
}

// Dampen: the dampened attacker's hits shrink by its stack count.
export function dampenedAmount(attacker, amount) {
  return attacker.dampen > 0 ? Math.max(0, amount - attacker.dampen) : amount
}

// Evade (effects.js): a stack dodges one hit, at most one per round.
// Returns a full applyDamageWithBlock-shaped result, or null.
export function tryEvade(state, targetId, amount) {
  const target = getUnit(state, targetId)
  if (!(amount > 0) || !(target.evade > 0) || target.evadedThisRound) return null
  let next = setUnit(state, targetId, { evade: target.evade - 1, evadedThisRound: true })
  next = relicCallout(next, targetId, powerLabel(target, "evade"), `${target.name} slips aside - the hit misses.`)
  return { next, absorbed: 0, armourUsed: 0, remaining: 0, fell: false, revived: false }
}

// Log/callout for a fired, source-tagged trigger (turnStart/onDealDamage).
export function noteTrigger(state, unitId, trigger) {
  return trigger.source ? relicCallout(state, unitId, trigger.source) : state
}

// Spore Spread: poison a relic/item just put on the target also lands
// on the lowest-HP other living enemy (auto: on a poison debuff).
export function spreadSpores(state, actorId, targetId, effect) {
  const actor = getUnit(state, actorId)
  if (!actor || actor.side !== "player" || !(actor.sporeSpread > 0)) return state
  if (!(effect.type === "applyBuff" && effect.id === "poison" && effect.target === "target")) return state
  const others = livingUnits(state, "enemy").filter((u) => u.id !== targetId)
  if (!others.length) return state
  const spread = others.reduce((low, u) => (u.hp < low.hp ? u : low), others[0])
  const next = setUnit(state, spread.id, { poison: (spread.poison || 0) + (effect.amount || 0) })
  return relicCallout(next, spread.id, powerLabel(actor, "sporeSpread"), `Spores drift from ${actor.name} onto ${spread.name} (+${effect.amount} poison).`)
}

function killFollowUps(state, victimId, fell) {
  let next = checkEnemyPhase(state, victimId)
  if (fell) next = trySpawnBrood(next, victimId)
  return next
}

// onHit (Bramble Ward etc.): a player unit that just took real damage
// fires its onHit triggers back at the attacker. Enemy onHit passives
// stay inert (enemy lane).
export function fireOnHit(state, victimId, attackerId, remaining) {
  if (!(remaining > 0)) return state
  const victim = getUnit(state, victimId)
  if (!victim || victim.side !== "player") return state
  let next = state
  for (const t of victim.triggers || []) {
    if (t.trigger !== "onHit") continue
    if (next.phase === "won" || next.phase === "lost") break
    const attacker = getUnit(next, attackerId)
    if (!attacker || attacker.hp <= 0) break
    if (t.effect.type === "damage") {
      const hit = applyDamageWithBlock(next, attackerId, t.effect.amount || 0)
      next = relicCallout(hit.next, victimId, t.source || "Thorns", `${victim.name} strikes back at ${attacker.name} for ${hit.remaining}.${hit.fell ? " It falls." : ""}`)
      next = killFollowUps(next, attackerId, hit.fell)
    } else {
      const recipientId = t.effect.target === "target" ? attackerId : victimId
      next = applyPortableEffect(next, recipientId, t.effect)
      next = relicCallout(next, victimId, t.source || "Retaliate", `${victim.name} ${describeRelicEffect(t.effect) || "answers the blow"}.`)
    }
  }
  return checkTacticsBattleEnd(next)
}

// Chain (Cascading Wound etc.): a player's killing blow spills its
// chainDamage onto the lowest-HP surviving enemy.
export function fireChain(state, actorId, fell) {
  const actor = getUnit(state, actorId)
  if (!fell || !actor || actor.side !== "player" || !(actor.chainDamage > 0)) return state
  if (state.phase === "won" || state.phase === "lost") return state
  const survivors = livingUnits(state, "enemy")
  if (!survivors.length) return state
  const target = survivors.reduce((low, u) => (u.hp < low.hp ? u : low), survivors[0])
  const hit = applyDamageWithBlock(state, target.id, actor.chainDamage)
  let next = relicCallout(hit.next, actorId, powerLabel(actor, "chainDamage"), `${actor.name}'s blow chains into ${target.name} for ${hit.remaining}.${hit.fell ? " It falls." : ""}`)
  next = killFollowUps(next, target.id, hit.fell)
  return checkTacticsBattleEnd(next)
}

// All relic reactions to one landed hit (attackUnit / enemy AoE).
export function relicAfterHit(state, actorId, targetId, remaining, fell, extraVictims = []) {
  let next = fireOnHit(state, targetId, actorId, remaining)
  for (const v of extraVictims) next = fireOnHit(next, v.id, actorId, v.remaining)
  return fireChain(next, actorId, fell)
}

// turnEnd triggers (unit passives like Glowmoss) for `side`.
export function relicTurnEnd(state, side) {
  let next = state
  for (const unit of livingUnits(state, side)) {
    for (const t of unit.triggers || []) {
      if (t.trigger !== "turnEnd") continue
      const live = getUnit(next, unit.id)
      if (!live || live.hp <= 0) continue
      next = applyPortableEffect(next, unit.id, t.effect)
      next = t.source ? relicCallout(next, unit.id, t.source, `${live.name}: ${t.source}.`) : next
    }
  }
  return next
}

function tickDamage(state, unit, stacks, what, decayed) {
  const nextHp = Math.max(0, unit.hp - stacks)
  const next = setUnit(state, unit.id, { hp: nextHp, [what]: decayed })
  return { ...next, log: [...next.log, `${unit.name} takes ${stacks} ${what} damage.${nextHp <= 0 ? " It falls." : ""}`] }
}

// Start of `side`'s turn: relic-driven ticks the engine had no loop for.
//  enemy: Poison (relic-applied; the engine only ticked players) + Burn.
//  player: Regen (the engine only ticked enemies) + Burn + Ascendant,
//          and the once-per-round Evade resets.
export function relicTurnStart(state, side) {
  let next = state
  let damaged = false
  for (const unit of livingUnits(state, side)) {
    let live = getUnit(next, unit.id)
    if (side === "enemy" && live.poison > 0) {
      next = tickDamage(next, live, live.poison, "poison", live.poison - 1)
      damaged = true
      live = getUnit(next, unit.id)
    }
    if (live.hp > 0 && live.burn > 0) {
      next = tickDamage(next, live, live.burn, "burn", Math.floor(live.burn / 2))
      damaged = true
      live = getUnit(next, unit.id)
    }
    if (side !== "player" || live.hp <= 0) continue
    if (live.evadedThisRound) next = setUnit(next, unit.id, { evadedThisRound: false })
    if (live.regen > 0) {
      const healedHp = Math.min(live.maxHp, live.hp + live.regen)
      next = setUnit(next, unit.id, { hp: healedHp, regen: live.regen - 1 })
      next = relicCallout(next, unit.id, powerLabel(live, "regen"), `${live.name} mends ${healedHp - live.hp} from regeneration.`)
    }
    if (live.ascendant > 0) {
      const cur = getUnit(next, unit.id)
      next = setUnit(next, unit.id, { attack: cur.attack + live.ascendant })
      next = relicCallout(next, unit.id, powerLabel(live, "ascendant"), `${live.name} ascends - +${live.ascendant} attack.`)
    }
  }
  return damaged ? checkTacticsBattleEnd(next) : next
}

// Stun: a stunned unit spends one stack and skips its whole action.
// Returns the new state, or null when the unit is not stunned.
export function spendStun(state, unitId) {
  const unit = getUnit(state, unitId)
  if (!unit || !(unit.stun > 0)) return null
  const next = setUnit(state, unitId, { stun: unit.stun - 1 })
  return relicCallout(next, unitId, "Stunned!", `${unit.name} is stunned and skips this turn.`)
}
