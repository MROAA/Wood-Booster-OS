// Heartwood Trial - the small composable effect vocabulary every card
// and enemy move is built from. Each primitive is a pure function:
// (state, effect, ctx) -> new state. Adding a new card should never
// require adding a new primitive unless it genuinely needs new game
// behaviour, not just new numbers.
//
// Units are addressed by id: "player" or a specific enemy piece id
// (state.enemies[].id). ctx = { actorId, targetId }: actorId is who is
// causing the effect, targetId is the specific opposing unit this card
// play or enemy move resolved against (always "player" for enemy
// actions; the player-chosen/auto-picked enemy id for a card play).
//
// effect.target selects WHICH unit a non-damage effect applies to:
// omitted/"self" -> ctx.actorId, "target" -> ctx.targetId. "damage"
// ignores effect.target entirely - it always travels actorId -> targetId,
// since that's what a card play or an enemy attack intent means.

import { CARDS } from "../../data/heartwood/cards"
import { resolvePattern, piecesAtPositions } from "./targeting"

// Units are addressed by id across whichever side owns them. The
// autobattler puts the player's whole squad in `state.playerUnits[]`
// (same shape as `state.enemies[]`, ids like "p0"); the older
// single-hero engine still addresses the player via the literal string
// "player" - both are supported here so effects.js stays one shared
// vocabulary for either engine.
export function getUnit(state, id) {
  if (state.playerUnits) {
    const found = state.playerUnits.find((u) => u.id === id)
    if (found) return found
  }
  if (id === "player") return state.player
  return state.enemies.find((e) => e.id === id)
}

export function setUnit(state, id, unit) {
  if (state.playerUnits && state.playerUnits.some((u) => u.id === id)) {
    return { ...state, playerUnits: state.playerUnits.map((u) => (u.id === id ? unit : u)) }
  }
  if (id === "player") return { ...state, player: unit }
  return { ...state, enemies: state.enemies.map((e) => (e.id === id ? unit : e)) }
}

function resolveWho(ctx, targetField) {
  return targetField === "target" ? ctx.targetId : ctx.actorId
}

function strengthOf(unit) {
  return unit.powers.strength || 0
}

function weakOf(unit) {
  return unit.powers.weak || 0
}

// Vulnerable: the defensive mirror of Weak - +25% damage TAKEN instead
// of -25% damage dealt. First status that modifies the defender's side
// of dealDamage rather than the attacker's.
function vulnerableOf(unit) {
  return unit.powers.vulnerable || 0
}

// Fenrir's "Wounded Fury": a conditional bonus, not a flat buff, so it
// can't be expressed as a plain applyBuff stack the way Strength is -
// it depends on the attacker's current HP at the moment of the hit.
function woundedFuryBonus(unit) {
  return unit.powers.woundedFury && unit.hp < unit.maxHp * 0.5 ? 3 : 0
}

// Execute: woundedFuryBonus's mirror on the defender's side - a flat,
// stack-scaled bonus (like Strength, not a %) that only applies once
// the TARGET is already below 30% max HP, rewarding a squad built to
// finish a wounded enemy over one that spreads damage thin. Kept flat
// and threshold-based rather than a crit-chance/dodge-chance roll on
// purpose - Marc: "easy to play but hard to master" - a fixed, readable
// number is something a player can plan a build around; a dice roll
// isn't.
function executeBonus(attacker, defender) {
  const stacks = attacker.powers.execute || 0
  if (!stacks) return 0
  return defender.hp <= defender.maxHp * 0.3 ? stacks : 0
}

function nameOf(state, id) {
  if (id === "player") return "You"
  return getUnit(state, id)?.name || "The enemy"
}

// Per-unit damage/healing totals for the autobattler's post-battle
// summary (see battleStats.js). Keyed by unit id, tracked alongside
// state rather than derived from the log after the fact - the log is
// prose for the player, not a data source. Absent (old turn-based
// engine) or missing entries default to zero, so this is a no-op
// wherever nothing reads `state.stats`.
function recordStat(state, id, field, amount) {
  if (!amount) return state
  const prev = state.stats?.[id] || { damageDealt: 0, healingDone: 0 }
  return { ...state, stats: { ...state.stats, [id]: { ...prev, [field]: prev[field] + amount } } }
}

// Damage dealt by `actorId`, landing on `targetId`. Applies Strength
// (flat bonus) and Weak (-25%, rounded down) from the attacker, then
// Vulnerable (+25%, rounded down) from the defender, then Execute
// (flat bonus, only below 30% target HP) after the percentage
// modifiers so it isn't itself scaled by them, then subtracts the
// target's Block before touching HP.
function dealDamage(state, actorId, targetId, baseAmount) {
  const attacker = getUnit(state, actorId)
  const defender = getUnit(state, targetId)
  if (!attacker || !defender) return state

  let amount = baseAmount + strengthOf(attacker) + woundedFuryBonus(attacker)
  if (weakOf(attacker) > 0) {
    amount = Math.floor(amount * 0.75)
  }
  if (vulnerableOf(defender) > 0) {
    amount = Math.floor(amount * 1.25)
  }
  amount += executeBonus(attacker, defender)
  amount = Math.max(0, amount)

  const blocked = Math.min(defender.block, amount)
  const overflow = amount - blocked

  const nextDefender = {
    ...defender,
    block: defender.block - blocked,
    hp: Math.max(0, defender.hp - overflow),
  }

  let nextState = setUnit(state, targetId, nextDefender)
  nextState = recordStat(nextState, actorId, "damageDealt", overflow)
  nextState = {
    ...nextState,
    log: [
      ...state.log,
      `${nameOf(state, actorId)} deal ${amount} damage to ${nameOf(state, targetId)}${blocked > 0 ? ` (${blocked} blocked)` : ""}.`,
    ],
  }

  // onHit (first used by Bramble Ward): whoever just took real damage
  // strikes back at whoever hit them. onDealDamage (first used by
  // Sundering Mark) is its mirror on the other side of the same hit -
  // the attacker gets a hook too, keeping the original actor/target
  // roles instead of reversing them. Both only fire on a hit that
  // actually landed (not fully blocked) - nothing happened worth
  // reacting to otherwise.
  if (overflow > 0) {
    nextState = runTriggers(nextState, targetId, "onHit", { actorId: targetId, targetId: actorId })
    nextState = runTriggers(nextState, actorId, "onDealDamage", { actorId, targetId })
  }

  return checkBattleEnd(nextState)
}

// HP loss that ignores Block entirely (self-inflicted costs, curse
// on-draw effects).
function loseHp(state, who, amount) {
  const unit = getUnit(state, who)
  if (!unit) return state
  const nextUnit = { ...unit, hp: Math.max(0, unit.hp - amount) }
  return checkBattleEnd({
    ...setUnit(state, who, nextUnit),
    log: [...state.log, `${nameOf(state, who)} lose ${amount} HP.`],
  })
}

// Poison: a real damage-over-time status, first new status effect
// beyond Strength/Weak/WoundedFury. Unlike those (which just modify a
// number inside dealDamage), Poison needs its own resolution step -
// there's no "when this unit acts" moment to hang a trigger off for
// every possible poisoned unit, so autoBattleEngine.js calls this once
// per side per round, same automatic-and-universal shape the Block
// reset already uses (not an addTrigger - it needs no per-unit
// opt-in). Ignores Block like any other DOT/self-inflicted loss, then
// decays by 1 - the poison fades over a few rounds instead of ticking
// forever, so it rewards being applied and then racing the clock
// rather than becoming a set-and-forget win condition on its own.
export function tickPoison(state, units) {
  let next = state
  for (const unit of units) {
    if (next.phase !== "player" && next.phase !== "enemy") break
    const current = getUnit(next, unit.id)
    if (!current || current.hp <= 0) continue
    const stacks = current.powers.poison || 0
    if (stacks <= 0) continue
    next = loseHp(next, unit.id, stacks)
    const afterUnit = getUnit(next, unit.id)
    if (!afterUnit) continue
    next = setUnit(next, unit.id, { ...afterUnit, powers: { ...afterUnit.powers, poison: stacks - 1 } })
  }
  return next
}

function gainBlock(state, who, amount) {
  const unit = getUnit(state, who)
  if (!unit) return state
  return {
    ...setUnit(state, who, { ...unit, block: unit.block + amount }),
    log: [...state.log, `${nameOf(state, who)} gain ${amount} Block.`],
  }
}

function gainHeal(state, who, amount) {
  const unit = getUnit(state, who)
  if (!unit) return state
  const healed = Math.min(unit.maxHp, unit.hp + amount) - unit.hp
  let nextState = setUnit(state, who, { ...unit, hp: unit.hp + healed })
  nextState = recordStat(nextState, who, "healingDone", healed)
  return {
    ...nextState,
    log: [...state.log, `${nameOf(state, who)} heal ${healed}.`],
  }
}

// Win = every enemy piece dead. Dead pieces stay in `state.enemies`
// (stable ids for React keys / shielding recomputation) rather than
// being removed.
export function checkBattleEnd(state) {
  if (state.phase !== "player" && state.phase !== "enemy") return state
  if (state.enemies.every((e) => e.hp <= 0)) return { ...state, phase: "won" }
  const playerDefeated = state.playerUnits ? state.playerUnits.every((u) => u.hp <= 0) : state.player.hp <= 0
  if (playerDefeated) return { ...state, phase: "lost" }
  return state
}

function shuffle(cards) {
  const result = [...cards]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// Draws `amount` cards from drawPile into hand, reshuffling discardPile
// into drawPile when it runs out. Fires each drawn curse's onDraw
// effects immediately (e.g. Rot). MVP: only the player ever has a hand.
export function drawCards(state, who, amount) {
  if (who !== "player") return state

  let drawPile = [...state.drawPile]
  let discardPile = [...state.discardPile]
  let hand = [...state.hand]
  let log = [...state.log]
  let rest = { ...state }

  for (let i = 0; i < amount; i++) {
    if (drawPile.length === 0) {
      if (discardPile.length === 0) break
      drawPile = shuffle(discardPile)
      discardPile = []
      log = [...log, "The discard pile is shuffled back into the draw pile."]
    }
    const instance = drawPile.shift()
    hand = [...hand, instance]

    const def = CARDS[instance.defId]
    if (def?.onDraw?.length) {
      rest = { ...rest, drawPile, discardPile, hand, log }
      // The curse itself is the "actor" harming the player who drew it.
      rest = applyEffects(rest, def.onDraw, { actorId: "player", targetId: "player" })
      drawPile = rest.drawPile
      discardPile = rest.discardPile
      hand = rest.hand
      log = rest.log
      if (rest.phase === "lost") break
    }
  }

  return { ...rest, drawPile, discardPile, hand, log }
}

function gainEnergy(state, amount) {
  return {
    ...state,
    energy: { ...state.energy, current: state.energy.current + amount },
    log: [...state.log, `You gain ${amount} Energy.`],
  }
}

function applyBuff(state, who, id, amount) {
  const unit = getUnit(state, who)
  if (!unit) return state
  return {
    ...setUnit(state, who, { ...unit, powers: { ...unit.powers, [id]: (unit.powers[id] || 0) + amount } }),
    log: [...state.log, `${nameOf(state, who)} gain ${amount} ${id}.`],
  }
}

function addTrigger(state, who, trigger, effect) {
  const unit = getUnit(state, who)
  if (!unit) return state
  return setUnit(state, who, { ...unit, triggers: [...(unit.triggers || []), { trigger, effect }] })
}

function addCardToPile(state, pile, defId) {
  const instance = { instanceId: state.instanceIdCounter, defId }
  return {
    ...state,
    instanceIdCounter: state.instanceIdCounter + 1,
    [pile]: [...state[pile], instance],
    log: [...state.log, `${CARDS[defId]?.name || defId} is added to the discard pile.`],
  }
}

function moveUnit(state, who, pos) {
  const unit = getUnit(state, who)
  if (!unit) return state
  return {
    ...setUnit(state, who, { ...unit, pos }),
    log: [...state.log, `${nameOf(state, who)} move.`],
  }
}

// Applies a list of effects in order, threading state through each one,
// stopping early if the battle has just ended.
export function applyEffects(state, effects, ctx) {
  let next = state
  for (const effect of effects) {
    if (next.phase === "won" || next.phase === "lost") break
    next = applyEffect(next, effect, ctx)
  }
  return next
}

// Fans a damage effect out across every position a pattern (rook/
// bishop/knight) resolves to, from the actor's current square. This is
// what lets Rook's Charge/Bishop's Slash hit several pieces at once and
// lets Knight's Leap bypass shielding - patterns resolve targets from
// geometry, never from legalSingleTargets, so the shield check never
// runs for them.
function resolvePatternTargetIds(state, effect, ctx) {
  const actor = getUnit(state, ctx.actorId)
  if (!actor) return []
  const squares = resolvePattern(state, effect.pattern, actor.pos)
  return piecesAtPositions(state, squares)
}

function applyPatternDamage(state, effect, ctx) {
  const candidates = resolvePatternTargetIds(state, effect, ctx)
  const targets =
    effect.patternSelect === "one" ? candidates.filter((id) => id === ctx.targetId) : candidates

  let next = state
  for (const targetId of targets) {
    next = dealDamage(next, ctx.actorId, targetId, effect.amount)
    if (next.phase === "won" || next.phase === "lost") break
  }
  return next
}

function applyEffect(state, effect, ctx) {
  const who = resolveWho(ctx, effect.target)

  switch (effect.type) {
    case "damage":
      if (effect.pattern) return applyPatternDamage(state, effect, ctx)
      return dealDamage(state, ctx.actorId, ctx.targetId, effect.amount)
    case "loseHp":
      return loseHp(state, who, effect.amount)
    case "block":
      return gainBlock(state, who, effect.amount)
    case "heal":
      return gainHeal(state, who, effect.amount)
    case "draw":
      return drawCards(state, who, effect.amount)
    case "gainEnergy":
      return gainEnergy(state, effect.amount)
    case "applyBuff":
      return applyBuff(state, who, effect.id, effect.amount)
    case "addTrigger":
      return addTrigger(state, who, effect.trigger, effect.effect)
    case "addCard":
      return addCardToPile(state, effect.pile, effect.defId)
    case "move":
      return moveUnit(state, who, effect.pos)
    case "discardHandThenDraw": {
      const discarded = state.hand
      const withDiscard = { ...state, hand: [], discardPile: [...state.discardPile, ...discarded] }
      return drawCards(withDiscard, "player", effect.amount ?? discarded.length)
    }
    case "random": {
      const choice = effect.options[Math.floor(Math.random() * effect.options.length)]
      return applyEffects(state, choice, ctx)
    }
    default:
      return state
  }
}

// Runs every registered trigger for `who` matching `trigger` ("turnStart"
// | "turnEnd"). Powers like The Emperor/Temperance/The Star register
// these once when played; this just fires them each relevant turn.
// `ctxOverride` lets a caller supply a different actor/target than the
// usual "who acts on themself" shape turnStart/turnEnd triggers use -
// needed for onHit (see dealDamage below), where the unit that got hit
// is the one retaliating, and the original attacker is the target.
export function runTriggers(state, who, trigger, ctxOverride) {
  const unit = getUnit(state, who)
  if (!unit) return state
  const matching = (unit.triggers || []).filter((t) => t.trigger === trigger)
  let next = state
  for (const t of matching) {
    if (next.phase === "won" || next.phase === "lost") break
    next = applyEffects(next, [t.effect], ctxOverride || { actorId: who, targetId: who })
  }
  return next
}
