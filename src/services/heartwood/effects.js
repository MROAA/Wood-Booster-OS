// Heartwood Trial - the small composable effect vocabulary every card
// and enemy move is built from. Each primitive is a pure function:
// (state, effect, ctx) -> new state. Adding a new card should never
// require adding a new primitive unless it genuinely needs new game
// behaviour, not just new numbers.
//
// ctx.source is "player" | "enemy" - who is causing the effect.
// effect.target, when present, is an ABSOLUTE side ("player" | "enemy"),
// not relative to the source. When omitted, it defaults to ctx.source
// (i.e. "affects whoever is doing this"). Only "damage" ignores target
// entirely - damage always travels from ctx.source to the opposite side,
// since that's what "damage" means for both a played card and an enemy
// attack intent.

import { CARDS } from "../../data/heartwood/cards"

function otherSide(side) {
  return side === "player" ? "enemy" : "player"
}

function strengthOf(unit) {
  return unit.powers.strength || 0
}

function weakOf(unit) {
  return unit.powers.weak || 0
}

function nameOf(state, side) {
  if (side === "player") return "You"
  return state.enemy.name || "The enemy"
}

// Damage dealt by `source`, landing on the opposite side. Applies
// Strength (flat bonus) and Weak (-25%, rounded down) from the source,
// then subtracts the target's Block before touching HP.
function dealDamage(state, source, baseAmount) {
  const target = otherSide(source)
  const attacker = state[source]
  const defender = state[target]

  let amount = baseAmount + strengthOf(attacker)
  if (weakOf(attacker) > 0) {
    amount = Math.floor(amount * 0.75)
  }
  amount = Math.max(0, amount)

  const blocked = Math.min(defender.block, amount)
  const overflow = amount - blocked

  const nextDefender = {
    ...defender,
    block: defender.block - blocked,
    hp: Math.max(0, defender.hp - overflow),
  }

  const nextState = { ...state, [target]: nextDefender }
  nextState.log = [
    ...state.log,
    `${nameOf(state, source)} deal ${amount} damage${blocked > 0 ? ` (${blocked} blocked)` : ""}.`,
  ]
  return checkBattleEnd(nextState)
}

// HP loss that ignores Block entirely (self-inflicted costs, curse
// on-draw effects). `who` is the absolute side losing HP.
function loseHp(state, who, amount) {
  const unit = state[who]
  const nextUnit = { ...unit, hp: Math.max(0, unit.hp - amount) }
  return checkBattleEnd({
    ...state,
    [who]: nextUnit,
    log: [...state.log, `${nameOf(state, who)} lose ${amount} HP.`],
  })
}

function gainBlock(state, who, amount) {
  const unit = state[who]
  return {
    ...state,
    [who]: { ...unit, block: unit.block + amount },
    log: [...state.log, `${nameOf(state, who)} gain ${amount} Block.`],
  }
}

function gainHeal(state, who, amount) {
  const unit = state[who]
  const healed = Math.min(unit.maxHp, unit.hp + amount) - unit.hp
  return {
    ...state,
    [who]: { ...unit, hp: unit.hp + healed },
    log: [...state.log, `${nameOf(state, who)} heal ${healed}.`],
  }
}

export function checkBattleEnd(state) {
  if (state.phase !== "player" && state.phase !== "enemy") return state
  if (state.enemy.hp <= 0) return { ...state, phase: "won" }
  if (state.player.hp <= 0) return { ...state, phase: "lost" }
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
      rest = applyEffects(rest, def.onDraw, { source: "enemy" }) // curses act as an outside force on the player
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
  const unit = state[who]
  return {
    ...state,
    [who]: { ...unit, powers: { ...unit.powers, [id]: (unit.powers[id] || 0) + amount } },
    log: [...state.log, `${nameOf(state, who)} gain ${amount} ${id}.`],
  }
}

function addTrigger(state, who, trigger, effect) {
  const unit = state[who]
  return { ...state, [who]: { ...unit, triggers: [...(unit.triggers || []), { trigger, effect }] } }
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

function applyEffect(state, effect, ctx) {
  const source = ctx.source
  const target = effect.target || source

  switch (effect.type) {
    case "damage":
      return dealDamage(state, source, effect.amount)
    case "loseHp":
      return loseHp(state, target, effect.amount)
    case "block":
      return gainBlock(state, target, effect.amount)
    case "heal":
      return gainHeal(state, target, effect.amount)
    case "draw":
      return drawCards(state, target, effect.amount)
    case "gainEnergy":
      return gainEnergy(state, effect.amount)
    case "applyBuff":
      return applyBuff(state, target, effect.id, effect.amount)
    case "addTrigger":
      return addTrigger(state, target, effect.trigger, effect.effect)
    case "addCard":
      return addCardToPile(state, effect.pile, effect.defId)
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
export function runTriggers(state, who, trigger) {
  const unit = state[who]
  const matching = (unit.triggers || []).filter((t) => t.trigger === trigger)
  let next = state
  for (const t of matching) {
    if (next.phase === "won" || next.phase === "lost") break
    next = applyEffects(next, [t.effect], { source: who })
  }
  return next
}
