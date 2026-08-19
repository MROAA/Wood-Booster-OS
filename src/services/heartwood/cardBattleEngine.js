// Heartwood Trial - the battle engine. Pure functions only: every
// function takes a state (+ args) and returns a new state, or `null` for
// an illegal move. No React, no classes - mirrors the pattern already
// established by spiderSolitaireEngine.js so this stays testable and UI
// agnostic.

import { CARDS } from "../../data/heartwood/cards"
import { ENEMIES } from "../../data/heartwood/enemies"
import { applyEffects, drawCards, runTriggers, checkBattleEnd } from "./effects"

const STARTING_ENERGY = 3
const STARTING_HAND_SIZE = 5
const HAND_SIZE_PER_TURN = 5
const PLAYER_MAX_HP = 60

function shuffle(cards) {
  const result = [...cards]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function freshUnit(overrides) {
  return { block: 0, powers: {}, triggers: [], ...overrides }
}

// Picks the enemy's next move and returns the telegraphed intent shape
// used by EnemyPanel. Committing the choice here (rather than at the
// moment the move resolves) is what makes weightedRandom enemies still
// honor "intent shown one turn ahead".
function computeIntent(def, moveIndex) {
  if (def.moveSelect === "sequence") {
    return def.movePattern[moveIndex % def.movePattern.length]
  }
  // weightedRandom
  const totalWeight = def.movePattern.reduce((sum, m) => sum + (m.weight || 1), 0)
  let roll = Math.random() * totalWeight
  for (const move of def.movePattern) {
    roll -= move.weight || 1
    if (roll <= 0) return move
  }
  return def.movePattern[0]
}

function intentToEffects(intent) {
  switch (intent.type) {
    case "attack":
      return [{ type: "damage", amount: intent.amount }]
    case "block":
      return [{ type: "block", amount: intent.amount }]
    case "debuff":
      return [{ type: "applyBuff", target: intent.target, id: intent.id, amount: intent.amount }]
    default:
      return []
  }
}

export function startBattle(enemyId, deckDefIds) {
  const enemyDef = ENEMIES[enemyId]

  const drawPile = shuffle(
    deckDefIds.map((defId, i) => ({ instanceId: i, defId })),
  )

  let state = {
    turn: 1,
    phase: "player",
    energy: { current: STARTING_ENERGY, max: STARTING_ENERGY },
    player: freshUnit({ name: "Spacemonkey", hp: PLAYER_MAX_HP, maxHp: PLAYER_MAX_HP }),
    enemy: freshUnit({
      id: enemyDef.id,
      name: enemyDef.name,
      hp: enemyDef.maxHp,
      maxHp: enemyDef.maxHp,
      moveIndex: 0,
      intent: computeIntent(enemyDef, 0),
    }),
    drawPile,
    hand: [],
    discardPile: [],
    exhaustPile: [],
    usedOnce: [],
    log: [`Turn 1 begins. ${enemyDef.name} blocks the way.`],
    instanceIdCounter: deckDefIds.length,
  }

  state = drawCards(state, "player", STARTING_HAND_SIZE)
  return state
}

export function playCard(state, instanceId) {
  if (state.phase !== "player") return null

  const instance = state.hand.find((c) => c.instanceId === instanceId)
  if (!instance) return null

  const def = CARDS[instance.defId]
  if (!def || def.unplayable) return null
  if (def.once && state.usedOnce.includes(def.id)) return null

  const effectiveCost =
    def.costReducedIfBlocked && state.player.block > 0
      ? Math.max(0, def.cost - def.costReducedIfBlocked)
      : def.cost

  if (effectiveCost > state.energy.current) return null

  let next = {
    ...state,
    hand: state.hand.filter((c) => c.instanceId !== instanceId),
    energy: { ...state.energy, current: state.energy.current - effectiveCost },
    log: [...state.log, `You play ${def.name}.`],
  }

  next = applyEffects(next, def.effects, { source: "player" })

  const pile = def.exhaust ? "exhaustPile" : "discardPile"
  next = { ...next, [pile]: [...next[pile], instance] }
  if (def.once) {
    next = { ...next, usedOnce: [...next.usedOnce, def.id] }
  }

  return next
}

function startEnemyTurn(state) {
  let next = { ...state, phase: "enemy", enemy: { ...state.enemy, block: 0 } }
  next = runTriggers(next, "enemy", "turnStart")
  if (next.phase !== "enemy") return next

  next = applyEffects(next, intentToEffects(state.enemy.intent), { source: "enemy" })
  if (next.phase !== "enemy") return next

  const enemyDef = ENEMIES[next.enemy.id]
  const nextMoveIndex = next.enemy.moveIndex + 1
  next = {
    ...next,
    enemy: { ...next.enemy, moveIndex: nextMoveIndex, intent: computeIntent(enemyDef, nextMoveIndex) },
  }
  return next
}

function startPlayerTurn(state) {
  let next = {
    ...state,
    phase: "player",
    turn: state.turn + 1,
    player: { ...state.player, block: 0 },
    energy: { ...state.energy, current: state.energy.max },
    log: [...state.log, `Turn ${state.turn + 1} begins.`],
  }
  next = runTriggers(next, "player", "turnStart")
  if (next.phase !== "player") return next

  next = drawCards(next, "player", HAND_SIZE_PER_TURN)
  return checkBattleEnd(next)
}

// Ends the player's turn and resolves the full enemy turn, landing back
// in the player's turn (or a won/lost state) - callers never see the
// intermediate "enemy" phase, since there's nothing for them to do
// during it in this MVP.
export function endTurn(state) {
  if (state.phase !== "player") return null

  let next = {
    ...state,
    discardPile: [...state.discardPile, ...state.hand],
    hand: [],
    log: [...state.log, "You end your turn."],
  }
  next = runTriggers(next, "player", "turnEnd")
  if (next.phase !== "player") return next

  next = startEnemyTurn(next)
  if (next.phase !== "enemy") return next

  return startPlayerTurn(next)
}
