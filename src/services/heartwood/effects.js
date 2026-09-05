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

// Shatter: Execute's mirror, checked against the target's current
// Block instead of its HP - a flat, stack-scaled bonus that only
// applies while the target is still holding any Block, rewarding a
// build that punishes a defensive unit for turtling up instead of
// just grinding through its Block at the normal rate. Same "fixed,
// readable number, not a dice roll" shape every conditional bonus in
// the roster already follows.
function shatterBonus(attacker, defender) {
  const stacks = attacker.powers.shatter || 0
  if (!stacks) return 0
  return defender.block > 0 ? stacks : 0
}

// Bulwark (Stone tribe): persistent flat armour. Unlike Block - which
// resolveRound zeroes at the top of every round - a Bulwark stack lives
// in `powers` and is NEVER spent or decremented, so it soaks a fixed
// amount off every hit for the whole battle. Real Block is spent first
// (see dealDamage), Bulwark only absorbs what's left. Deliberately not
// in SUNDERABLE_IDS for v1 - Stone is meant to feel immovable. Flat and
// readable, same "plan a build around a fixed number" shape as Strength.
function bulwarkOf(unit) {
  return unit.powers.bulwark || 0
}

// Dampen (Tide tribe): a flat reduction on the ATTACKER's outgoing
// damage - the mirror of Strength, and distinct from Weak (which is a
// -25% multiplier). Doesn't decay on its own (Tide = relentless), but
// it IS in CLEANSABLE_IDS so a squad has an answer to it. Subtracted
// after Execute/Shatter, before the Block step.
function dampenOf(unit) {
  return unit.powers.dampen || 0
}

// Evade (Gale tribe): dodges an incoming hit outright, at most one per
// round. Each dodge spends one stack, so `evade N` is exactly N total
// dodges a player can count on - not a dodge CHANCE (no roll, same
// "fixed number, not a dice roll" rule Execute/Shatter follow). The
// per-round cap is enforced by `unit.evadedThisRound`, which
// autoBattleEngine.js's resolveRound clears for every living unit on
// both sides alongside the Block reset.
function evadeOf(unit) {
  return unit.powers.evade || 0
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

// roundEvents: a lightweight per-round record of "who attacked whom"
// (reset each round by autoBattleEngine.js's resolveRound, same as the
// log's own "Round N." reset), used by AutoBattleView.jsx to stage an
// attacker-lunge animation - Marc: "autobattle animoidaan samaan
// tapaan kuin heartstonen battlegroundsissa" (the autobattle should
// animate the same way Hearthstone Battlegrounds does, where the
// attacking piece visibly moves toward its target). Structural
// (actorId/targetId), not parsed from the log's free text, since two
// owned copies of the same unit share a name and would make text-
// matching ambiguous - exactly the kind of unit that Fusion actively
// encourages owning.
//
// `extra` (kind/amount) added later, same call sites - Marc: "haluan
// silleen että jokaisen hahmon damage näytetään erikseen" (want each
// character's damage shown separately). Previously FloatingNumbers.jsx
// only ever diffed HP before/after a whole round, so 2+ attackers
// landing on the same target in one round collapsed into a single
// combined number. This is the one choke point every dealDamage call
// already passes through, so it's also the cheapest place to record
// enough per-hit detail (kind, the actual HP-affecting amount) for
// FloatingNumbers to spawn one popup per hit instead of one per round.
function recordAttackEvent(state, actorId, targetId, extra = {}) {
  return { ...state, roundEvents: [...(state.roundEvents || []), { actorId, targetId, ...extra }] }
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

  // Evade (Gale): the first hit a unit would take each round simply
  // misses - checked before Ward so a dodge is spent before a Ward
  // stack would be. Spends one Evade stack and sets evadedThisRound
  // (resolveRound clears it), so a second hit the same round lands
  // normally. No triggers fire on a missed hit, same as a Ward.
  if (evadeOf(defender) > 0 && !defender.evadedThisRound) {
    const nextDefender = {
      ...defender,
      evadedThisRound: true,
      powers: { ...defender.powers, evade: evadeOf(defender) - 1 },
    }
    return recordAttackEvent(
      {
        ...setUnit(state, targetId, nextDefender),
        log: [...state.log, `${nameOf(state, targetId)} slips aside - the hit misses.`],
      },
      actorId,
      targetId,
      { kind: "evade" },
    )
  }

  // Ward: a stack that fully negates the next hit - a different tool
  // from Block, which absorbs up to its own pool and lets overflow
  // through. A Ward stack cancels the ENTIRE hit regardless of size,
  // then is consumed, checked before any of the damage math below so
  // Execute/Vulnerable never get a chance to matter against a warded
  // hit either. No onHit/onDealDamage triggers fire, matching the
  // existing rule that they only fire on a hit that actually landed.
  const wards = defender.powers.ward || 0
  if (wards > 0) {
    const nextDefender = { ...defender, powers: { ...defender.powers, ward: wards - 1 } }
    return recordAttackEvent(
      {
        ...setUnit(state, targetId, nextDefender),
        log: [...state.log, `${nameOf(state, targetId)}'s Ward absorbs the hit completely.`],
      },
      actorId,
      targetId,
      { kind: "ward" },
    )
  }

  let amount = baseAmount + strengthOf(attacker) + woundedFuryBonus(attacker)
  if (weakOf(attacker) > 0) {
    amount = Math.floor(amount * 0.75)
  }
  if (vulnerableOf(defender) > 0) {
    amount = Math.floor(amount * 1.25)
  }
  amount += executeBonus(attacker, defender) + shatterBonus(attacker, defender)
  // Dampen (Tide): flat reduction from the attacker's side, after every
  // bonus so it bites into the final number, before Block.
  amount = Math.max(0, amount - dampenOf(attacker))

  // Bulwark (Stone): persistent armour. Real Block is spent first, then
  // Bulwark absorbs whatever is left - but Bulwark is never decremented,
  // so it keeps soaking the same amount every hit, all battle.
  const armour = bulwarkOf(defender)
  const blocked = Math.min(defender.block + armour, amount)
  const blockSpent = Math.min(defender.block, blocked)
  const overflow = amount - blocked

  // Revive: a stack consumed exactly once, the moment a hit would
  // otherwise drop the unit to 0 - it has to be caught right here,
  // before the ordinary Math.max(0, ...) clamp, since that clamp is
  // what "dead" means everywhere else in the engine (checkBattleEnd,
  // every hp <= 0 filter). A unit already at 0 doesn't get a second
  // revive off a follow-up hit - defender.hp > 0 guards that.
  const rawHp = defender.hp - overflow
  const revives = defender.powers.revive || 0
  const revived = rawHp <= 0 && defender.hp > 0 && revives > 0

  // Only real Block is spent; Bulwark (armourUsed) soaked the rest and
  // stays at full strength for the next hit.
  const armourUsed = blocked - blockSpent
  const nextDefender = {
    ...defender,
    block: defender.block - blockSpent,
    hp: revived ? 1 : Math.max(0, rawHp),
    powers: revived ? { ...defender.powers, revive: revives - 1 } : defender.powers,
  }

  let nextState = setUnit(state, targetId, nextDefender)
  nextState = recordStat(nextState, actorId, "damageDealt", overflow)
  // amount: the actual HP-affecting overflow, same number the old
  // diff-based popup showed - a fully-blocked hit (overflow 0) still
  // records an event (so a peer session skimming roundEvents can see
  // the swing happened), but FloatingNumbers.jsx skips spawning a
  // popup for it, same as the diff-based approach never showed one
  // for a hit that changed nothing.
  nextState = recordAttackEvent(nextState, actorId, targetId, { kind: "damage", amount: overflow })
  nextState = {
    ...nextState,
    log: [
      ...state.log,
      `${nameOf(state, actorId)} deal ${amount} damage to ${nameOf(state, targetId)}${
        blocked > 0
          ? ` (${blockSpent} blocked${armourUsed > 0 ? `, ${armourUsed} turned by Bulwark` : ""})`
          : ""
      }.`,
      ...(revived ? [`${nameOf(state, targetId)} clings to life at 1 HP!`] : []),
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

// Regen: Poison's mirror on the support side of the roster - a real
// heal-over-time status, distinct from a flat repeating `heal` trigger
// (Mosswarden's Charm/Sapmend Vial) the same way Poison is distinct
// from a flat repeating `damage` trigger - it decays by 1 each round
// instead of running forever, so it rewards a burst of stacks applied
// up front (a Rally, a relic, an item) rather than becoming a
// set-and-forget sustain. Same automatic, no-opt-in resolution shape
// as tickPoison - called once per side per round from resolveRound.
export function tickRegen(state, units) {
  let next = state
  for (const unit of units) {
    if (next.phase !== "player" && next.phase !== "enemy") break
    const current = getUnit(next, unit.id)
    if (!current || current.hp <= 0) continue
    const stacks = current.powers.regen || 0
    if (stacks <= 0) continue
    next = gainHeal(next, unit.id, stacks)
    const afterUnit = getUnit(next, unit.id)
    if (!afterUnit) continue
    next = setUnit(next, unit.id, { ...afterUnit, powers: { ...afterUnit.powers, regen: stacks - 1 } })
  }
  return next
}

// Burn (Ember tribe): Poison's louder cousin. Where Poison decays by a
// flat 1 each round (a long, steady drip), Burn HALVES each round after
// it ticks - a big opening flare that dies fast: Burn 8 -> 8, 4, 2, 1,
// 0. Distinct to read (a fire that flares and gutters, not a poison
// that lingers) and self-terminating with no extra counter field.
// Ignores Block, same as Poison.
export function tickBurn(state, units) {
  let next = state
  for (const unit of units) {
    if (next.phase !== "player" && next.phase !== "enemy") break
    const current = getUnit(next, unit.id)
    if (!current || current.hp <= 0) continue
    const stacks = current.powers.burn || 0
    if (stacks <= 0) continue
    next = loseHp(next, unit.id, stacks)
    const afterUnit = getUnit(next, unit.id)
    if (!afterUnit) continue
    next = setUnit(next, unit.id, { ...afterUnit, powers: { ...afterUnit.powers, burn: Math.floor(stacks / 2) } })
  }
  return next
}

// Ascendant (Cosmic tribe): a scaling win condition, no RNG. At the top
// of every round, each unit holding Ascendant permanently gains that
// many Strength - Ascendant 2 on the squad is +2 Strength every round,
// snowballing a long fight. The Ascendant stack itself doesn't change,
// so the growth is linear and fully predictable (a player can count the
// rounds), the "plan a build around a fixed number" rule Execute and
// Strength already follow.
export function tickAscendant(state, units) {
  let next = state
  for (const unit of units) {
    if (next.phase !== "player" && next.phase !== "enemy") break
    const current = getUnit(next, unit.id)
    if (!current || current.hp <= 0) continue
    const asc = current.powers.ascendant || 0
    if (asc <= 0) continue
    next = setUnit(next, unit.id, {
      ...current,
      powers: { ...current.powers, strength: (current.powers.strength || 0) + asc },
    })
    next = { ...next, log: [...next.log, `${nameOf(next, unit.id)} ascends - +${asc} Strength.`] }
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

// Sunder: the enemy side's answer to the growing pile of player-side
// buffs (Ward, Revive, Taunt, Execute, Strength) - strips one stack of
// whichever the target currently has, checked in this priority order
// so a squad leaning on defensive tools (Ward/Revive/Taunt) gets hit
// where it actually hurts before a purely offensive Strength stack.
// Real counterplay in the same spirit as Spacemonkey's AoE countering
// Taunt-stacking, just a per-hit tool any enemy can carry instead of
// a boss-only signature move.
const SUNDERABLE_IDS = ["ward", "revive", "taunt", "execute", "shatter", "strength"]

function sunder(state, who) {
  const unit = getUnit(state, who)
  if (!unit) return state
  const id = SUNDERABLE_IDS.find((k) => (unit.powers[k] || 0) > 0)
  if (!id) {
    return { ...state, log: [...state.log, `${nameOf(state, who)} has nothing to sunder.`] }
  }
  const label = id.charAt(0).toUpperCase() + id.slice(1)
  return {
    ...setUnit(state, who, { ...unit, powers: { ...unit.powers, [id]: unit.powers[id] - 1 } }),
    log: [...state.log, `${nameOf(state, who)} loses a stack of ${label}.`],
  }
}

// Cleanse: Sunder's mirror, strips this unit's OWN first negative
// status instead of an enemy's positive one - the roster's first
// self-cleaning tool against Poison/Weak/Vulnerable/Stun, all of which
// previously just had to be outlasted. Same "first match in priority
// order, log a distinct no-op line if nothing to strip" shape as
// Sunder, reusing the exact pattern rather than inventing a new one.
const CLEANSABLE_IDS = ["stun", "poison", "weak", "vulnerable", "dampen"]

function cleanse(state, who) {
  const unit = getUnit(state, who)
  if (!unit) return state
  const id = CLEANSABLE_IDS.find((k) => (unit.powers[k] || 0) > 0)
  if (!id) {
    return { ...state, log: [...state.log, `${nameOf(state, who)} has nothing to cleanse.`] }
  }
  const label = id.charAt(0).toUpperCase() + id.slice(1)
  return {
    ...setUnit(state, who, { ...unit, powers: { ...unit.powers, [id]: unit.powers[id] - 1 } }),
    log: [...state.log, `${nameOf(state, who)} cleanses a stack of ${label}.`],
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
    case "sunder":
      return sunder(state, who)
    case "cleanse":
      return cleanse(state, who)
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
// | "turnEnd"). Powers like Stonecrown/Stillbark/Glowmoss register
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
