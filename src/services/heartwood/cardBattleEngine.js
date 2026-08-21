// Heartwood Trial - the battle engine. Pure functions only: every
// function takes a state (+ args) and returns a new state, or `null` for
// an illegal move. No React, no classes - mirrors the pattern already
// established by spiderSolitaireEngine.js so this stays testable and UI
// agnostic.

import { CARDS } from "../../data/heartwood/cards"
import { ENEMIES } from "../../data/heartwood/enemies"
import { resolveFormation } from "../../data/heartwood/formations"
import { CHARACTERS } from "../../data/heartwood/characters"
import { applyEffects, drawCards, runTriggers, checkBattleEnd, getUnit, setUnit } from "./effects"

const STARTING_ENERGY = 3
const STARTING_HAND_SIZE = 5
const HAND_SIZE_PER_TURN = 5
const GRID = { rows: 3, cols: 3 }

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

// Picks a piece's next move and returns the telegraphed intent shape
// used by the UI. Committing the choice here (rather than at the moment
// the move resolves) is what makes weightedRandom enemies still honor
// "intent shown one turn ahead".
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
      return [{ type: "applyBuff", target: "target", id: intent.id, amount: intent.amount }]
    default:
      return []
  }
}

export function startBattle(characterId, formationOrEnemyId, deckDefIds) {
  const character = CHARACTERS[characterId]
  const formation = resolveFormation(formationOrEnemyId)

  const enemies = formation.pieces.map((piece, i) => {
    const def = ENEMIES[piece.defId]
    return freshUnit({
      id: `e${i}`,
      defId: piece.defId,
      name: def.name,
      hp: def.maxHp,
      maxHp: def.maxHp,
      pos: piece.pos,
      moveIndex: 0,
      intent: computeIntent(def, 0),
    })
  })

  const drawPile = shuffle(deckDefIds.map((defId, i) => ({ instanceId: i, defId })))

  let state = {
    turn: 1,
    phase: "player",
    grid: GRID,
    energy: { current: STARTING_ENERGY, max: STARTING_ENERGY },
    player: freshUnit({
      name: character.name,
      characterId: character.id,
      hp: character.maxHp,
      maxHp: character.maxHp,
      pos: formation.playerStart,
      movedThisTurn: false,
    }),
    enemies,
    drawPile,
    hand: [],
    discardPile: [],
    exhaustPile: [],
    usedOnce: [],
    log: [`Turn 1 begins. ${formation.name || enemies[0].name} blocks the way.`],
    instanceIdCounter: deckDefIds.length,
  }

  state = drawCards(state, "player", STARTING_HAND_SIZE)
  state = applyEffects(state, character.startEffects, { actorId: "player", targetId: "player" })
  return state
}

// `targetId` is optional: if omitted, the first living enemy piece is
// auto-targeted (preserves today's one-click play for single-enemy
// fights; the grid UI will pass an explicit id once it exists).
export function playCard(state, instanceId, targetId) {
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

  const resolvedTargetId = targetId || state.enemies.find((e) => e.hp > 0)?.id

  let next = {
    ...state,
    hand: state.hand.filter((c) => c.instanceId !== instanceId),
    energy: { ...state.energy, current: state.energy.current - effectiveCost },
    log: [...state.log, `You play ${def.name}.`],
  }

  next = applyEffects(next, def.effects, { actorId: "player", targetId: resolvedTargetId })

  const pile = def.exhaust ? "exhaustPile" : "discardPile"
  next = { ...next, [pile]: [...next[pile], instance] }
  if (def.once) {
    next = { ...next, usedOnce: [...next.usedOnce, def.id] }
  }

  return next
}

function startEnemyTurn(state) {
  let next = {
    ...state,
    phase: "enemy",
    enemies: state.enemies.map((e) => (e.hp > 0 ? { ...e, block: 0 } : e)),
  }

  for (const piece of state.enemies) {
    if (next.phase !== "enemy") break

    const current = getUnit(next, piece.id)
    if (!current || current.hp <= 0) continue

    next = runTriggers(next, piece.id, "turnStart")
    if (next.phase !== "enemy") break

    let acting = getUnit(next, piece.id)
    if (!acting || acting.hp <= 0) continue

    // Zugzwang: a Guard intent is suppressed once, then the debuff is
    // spent. Consumed here rather than as a new effect primitive - it's
    // a one-off interaction between an existing power and intent
    // resolution, not a general-purpose behavior.
    let effectiveIntent = acting.intent
    if ((acting.powers.zugzwang || 0) > 0 && acting.intent.type === "block") {
      effectiveIntent = { type: "block", amount: 0 }
      next = setUnit(next, piece.id, {
        ...acting,
        powers: { ...acting.powers, zugzwang: acting.powers.zugzwang - 1 },
      })
      acting = getUnit(next, piece.id)
    }

    next = applyEffects(next, intentToEffects(effectiveIntent), { actorId: piece.id, targetId: "player" })
    if (next.phase !== "enemy") break

    const afterAction = getUnit(next, piece.id)
    if (!afterAction || afterAction.hp <= 0) continue

    const def = ENEMIES[afterAction.defId]
    const nextMoveIndex = afterAction.moveIndex + 1
    next = {
      ...next,
      enemies: next.enemies.map((e) =>
        e.id === afterAction.id
          ? { ...e, moveIndex: nextMoveIndex, intent: computeIntent(def, nextMoveIndex) }
          : e,
      ),
    }
  }

  return next
}

function startPlayerTurn(state) {
  let next = {
    ...state,
    phase: "player",
    turn: state.turn + 1,
    player: { ...state.player, block: 0, movedThisTurn: false },
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

// A free, once-per-turn repositioning action - not a card, not
// energy-gated. Moves the player to an adjacent empty square.
export function moveTo(state, pos) {
  if (state.phase !== "player" || state.player.movedThisTurn) return null
  return {
    ...state,
    player: { ...state.player, pos, movedThisTurn: true },
    log: [...state.log, "You reposition."],
  }
}
