// Heartwood Trial - the autobattler resolution engine. Pure functions
// only, same discipline as the turn-based engine it supersedes for
// combat: (state, args) -> new state. The one real idea here is that
// enemies in this game have never been player-controlled - they've
// always executed a movePattern automatically every turn. This engine
// just applies that exact model to the player's squad too, instead of
// a hand of cards.
//
// state shape: { round, phase, grid, playerUnits: [], enemies: [], log }
// phase stays "player" for the whole fight (satisfies effects.js's
// checkBattleEnd guard) until it flips to "won"/"lost" - there's no
// real "whose turn" distinction to track once nothing needs player
// input.

import { UNITS, unitDefWithUpgrade } from "../../data/heartwood/units"
import { ENEMIES } from "../../data/heartwood/enemies"
import { CHARACTERS, commanderPassiveWithRank } from "../../data/heartwood/characters"
import { resolveFormation } from "../../data/heartwood/formations"
import { RELICS } from "../../data/heartwood/relics"
import { applyEffects, runTriggers, getUnit, setUnit, tickPoison } from "./effects"
import { isShielded } from "./targeting"

const GRID = { rows: 3, cols: 3 }
const MAX_ROUNDS = 30

// Up to 3 deploy slots fill the back rank (one per column); a 4th
// falls back to the center of the middle row - the only board square
// the first 3 don't already occupy.
const SLOT_POSITIONS = [
  { row: 2, col: 0 },
  { row: 2, col: 1 },
  { row: 2, col: 2 },
  { row: 1, col: 1 },
]

function freshUnit(overrides) {
  return { block: 0, powers: {}, triggers: [], ...overrides }
}

// Identical decision logic to the turn-based engine's computeIntent -
// "sequence" cycles deterministically, "weightedRandom" rolls each
// time - now shared by both sides instead of enemies only.
function computeIntent(def, moveIndex) {
  if (def.moveSelect === "sequence") {
    return def.movePattern[moveIndex % def.movePattern.length]
  }
  const totalWeight = def.movePattern.reduce((sum, m) => sum + (m.weight || 1), 0)
  let roll = Math.random() * totalWeight
  for (const move of def.movePattern) {
    roll -= move.weight || 1
    if (roll <= 0) return move
  }
  return def.movePattern[0]
}

// attackPattern !== "single" reuses effects.js's existing pattern
// fan-out (applyPatternDamage) exactly as Rook's Charge/Bishop's Slash/
// Knight's Leap already used it - every square the shape reaches gets
// hit, no per-target selection needed since there's no player to ask.
function intentToEffects(intent, attackPattern) {
  switch (intent.type) {
    case "attack":
      return [
        { type: "damage", amount: intent.amount, ...(attackPattern !== "single" ? { pattern: attackPattern } : {}) },
      ]
    case "block":
      return [{ type: "block", amount: intent.amount }]
    case "heal":
      return [{ type: "heal", amount: intent.amount }]
    case "debuff":
      return [{ type: "applyBuff", target: "target", id: intent.id, amount: intent.amount }]
    default:
      return []
  }
}

// Both target-pickers now actually respect isShielded (targeting.js) -
// previously neither did, which meant the "shielded" badge shown in
// the UI was cosmetic for every unit except the 3 pattern-attackers
// that deliberately bypass it. Falling back to the full living pool
// only if every candidate is somehow shielded (shouldn't happen given
// SLOT_POSITIONS/formation layouts, but keeps a target resolvable
// rather than stalling the fight if it ever did).
function unshieldedOrAll(state, living) {
  const unshielded = living.filter((u) => !isShielded(state, u.id))
  return unshielded.length ? unshielded : living
}

// The enemy "front rank" fiction already established by the shielding
// rule (lower row = closer to the front) becomes the actual single-
// target choice here: a squad's attack lands on the frontmost living,
// unshielded opposing piece.
function frontmost(state, units) {
  const living = units.filter((u) => u.hp > 0)
  if (!living.length) return null
  const pool = unshieldedOrAll(state, living)
  return [...pool].sort((a, b) => a.pos.row - b.pos.row || a.pos.col - b.pos.col)[0].id
}

// Enemies focus-fire a random living, unshielded squad member instead
// of a deterministic column - the more interesting version of "no
// shield," and now a real defensive choice: a unit placed in the
// forward slot (row 1, col 1) shields whatever's placed directly
// behind it (row 2, col 1) from this roll entirely.
// Taunt: a different tool from shielding for the same "protect the
// squad" goal - shielding protects one specific back slot regardless
// of who's standing there, Taunt protects everyone else regardless of
// position by forcing the roll onto whichever unit carries it. Checked
// before the shielded-filtered random pool, since a taunting unit
// should draw fire even if it also happens to be sitting in a
// technically-shielded square.
function randomLiving(state, units) {
  const living = units.filter((u) => u.hp > 0)
  if (!living.length) return null
  const taunters = living.filter((u) => (u.powers.taunt || 0) > 0)
  const pool = taunters.length ? taunters : unshieldedOrAll(state, living)
  return pool[Math.floor(Math.random() * pool.length)].id
}

// `deployedUnits` is up to 4 entries, either a bare unit id from
// units.js or `{ defId, upgradeLevel }` (runEngine.js's
// startFormationBattle sends the latter; the bare-id form still works
// for anything - tests included - that doesn't care about upgrades).
// `characterId` selects the Commander whose squadPassive (see
// characters.js) applies to every deployed unit - this is the whole
// reason a Commander is chosen at all; previously it was cosmetic
// only. `relicIds` (see relics.js) apply the same way, stacking with
// the Commander's own squadPassive rather than replacing it.
export function startAutoBattle(characterId, deployedUnits, enemyFormationOrId, relicIds = [], commanderRank = 0) {
  const formation = resolveFormation(enemyFormationOrId)

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

  // Applying UPGRADE_MAX_LEVEL stacks (units.js's unitDefWithUpgrade)
  // here, once, means every downstream read of this unit's stats -
  // HP, movePattern damage, and (in the loop just below) its passive -
  // is already the boosted version, with no separate "is this unit
  // upgraded" branch anywhere else in the engine.
  const effectiveDefs = {}
  const playerUnits = deployedUnits.map((entry, i) => {
    const defId = typeof entry === "string" ? entry : entry.defId
    const upgradeLevel = typeof entry === "string" ? 0 : entry.upgradeLevel || 0
    const def = unitDefWithUpgrade(UNITS[defId], upgradeLevel)
    const id = `p${i}`
    effectiveDefs[id] = def
    return freshUnit({
      id,
      defId,
      upgradeLevel,
      name: def.name,
      hp: def.maxHp,
      maxHp: def.maxHp,
      pos: SLOT_POSITIONS[i] || { row: 1, col: i },
      moveIndex: 0,
      intent: computeIntent(def, 0),
    })
  })

  let state = {
    round: 1,
    phase: "player",
    grid: GRID,
    playerUnits,
    enemies,
    stats: {},
    log: [`The fight begins. ${formation.name || enemies[0]?.name || "The enemy"} stands ready.`],
  }

  // Each deployed unit's own passive (ported from its old power-card
  // addTrigger effect) applies once, the same mechanism a character's
  // startEffects already used for a one-time battle-start bonus.
  for (const u of playerUnits) {
    const def = effectiveDefs[u.id]
    if (def.passive?.length) {
      state = applyEffects(state, def.passive, { actorId: u.id, targetId: u.id })
    }
  }

  // The Commander's own signature effect applies to every unit in the
  // squad, not just one hero - this is what makes choosing Tommy vs.
  // Aatos vs. Fenrir actually matter in the autobattler. Scaled by
  // commanderRank (characters.js's Rank-Up, a run-long Essence sink
  // mirroring units.js's per-unit Upgrade) before it's applied.
  const character = CHARACTERS[characterId]
  const squadPassive = commanderPassiveWithRank(character, commanderRank)
  if (squadPassive.length) {
    for (const u of playerUnits) {
      state = applyEffects(state, squadPassive, { actorId: u.id, targetId: u.id })
    }
  }

  // Relics (relics.js) stack on top of the Commander's squadPassive,
  // same self-targeting mechanism - a run can carry multiple relics at
  // once, each applying to every deployed unit.
  for (const relicId of relicIds) {
    const relic = RELICS[relicId]
    if (relic?.effects?.length) {
      for (const u of playerUnits) {
        state = applyEffects(state, relic.effects, { actorId: u.id, targetId: u.id })
      }
    }
    // Bulwark Standard: not a uniform per-unit effect like every other
    // relic, so it's handled here instead of via `effects` - Taunt
    // goes to whichever deployed unit currently has the highest maxHp
    // (ties broken by deploy order), same one-time battle-start timing
    // as Stoneheart's own passive grant.
    if (relic?.tauntHighestHp && playerUnits.length) {
      const tankiest = playerUnits.reduce((best, u) => (u.maxHp > best.maxHp ? u : best), playerUnits[0])
      state = applyEffects(state, [{ type: "applyBuff", id: "taunt", amount: 1 }], {
        actorId: tankiest.id,
        targetId: tankiest.id,
      })
    }
  }

  return state
}

function actSide(state, actingUnits, getDef, targetPool, side) {
  let next = state
  for (const unit of actingUnits) {
    if (next.phase !== "player") break
    const current = getUnit(next, unit.id)
    if (!current || current.hp <= 0) continue

    next = runTriggers(next, unit.id, "turnStart")
    if (next.phase !== "player") break
    let acting = getUnit(next, unit.id)
    if (!acting || acting.hp <= 0) continue

    // Stun: a genuinely different kind of mechanic from every status
    // so far (Strength/Weak/Vulnerable/WoundedFury/Poison all just
    // change a number) - it skips the unit's action outright. Their
    // turnStart trigger (if any - a heal, a block grant) still fired
    // above, and their queued intent is deliberately left untouched
    // here (moveIndex/nextIntent only advance past the block below) so
    // the same telegraphed move is still waiting once they're free
    // again, instead of being silently replaced. One stack = skip
    // exactly one action.
    if ((acting.powers.stun || 0) > 0) {
      next = setUnit(next, unit.id, { ...acting, powers: { ...acting.powers, stun: acting.powers.stun - 1 } })
      next = { ...next, log: [...next.log, `${acting.name} is stunned and skips this turn.`] }
      continue
    }

    const def = getDef(acting)

    // AoE: the one intent type that never goes through frontmost/
    // randomLiving at all - it hits every living unit in the pool
    // directly, so Taunt (which only redirects a single-target pick)
    // and shielding (which only filters that same pick) can't do
    // anything against it. Spacemonkey's signature move, deliberately:
    // the boss fight is where "stack the whole squad behind one
    // taunting tank" should stop being a free win.
    if (acting.intent.type === "aoe") {
      for (const target of targetPool(next)) {
        if (next.phase !== "player") break
        if (target.hp <= 0) continue
        next = applyEffects(next, [{ type: "damage", amount: acting.intent.amount }], {
          actorId: unit.id,
          targetId: target.id,
        })
      }
    } else {
      const attackPattern = side === "player" ? def.attackPattern || "single" : "single"
      const targetId = side === "player" ? frontmost(next, targetPool(next)) : randomLiving(next, targetPool(next))
      if (targetId) {
        next = applyEffects(next, intentToEffects(acting.intent, attackPattern), { actorId: unit.id, targetId })
      }
    }
    if (next.phase !== "player") break

    next = runTriggers(next, unit.id, "turnEnd")
    if (next.phase !== "player") break
    const afterAction = getUnit(next, unit.id)
    if (!afterAction || afterAction.hp <= 0) continue

    const nextMoveIndex = afterAction.moveIndex + 1
    const nextIntent = computeIntent(def, nextMoveIndex)
    next =
      side === "player"
        ? {
            ...next,
            playerUnits: next.playerUnits.map((u) =>
              u.id === afterAction.id ? { ...u, moveIndex: nextMoveIndex, intent: nextIntent } : u,
            ),
          }
        : {
            ...next,
            enemies: next.enemies.map((e) =>
              e.id === afterAction.id ? { ...e, moveIndex: nextMoveIndex, intent: nextIntent } : e,
            ),
          }
  }
  return next
}

// Resolves exactly one round: the whole player squad acts (in deployed
// order), then the whole enemy squad acts (in formation order) - same
// two-phase shape the turn-based engine already used, just with a
// squad on each side instead of one hero.
export function resolveRound(state) {
  let next = {
    ...state,
    log: [...state.log, `Round ${state.round}.`],
    playerUnits: state.playerUnits.map((u) => (u.hp > 0 ? { ...u, block: 0 } : u)),
  }

  // Poison ticks for both sides at the top of the round, before anyone
  // acts - whoever was poisoned last round pays for it now, same
  // "resolve automatically, no opt-in" shape the Block reset uses.
  next = tickPoison(next, next.playerUnits)
  if (next.phase !== "player") return next
  next = tickPoison(next, next.enemies)
  if (next.phase !== "player") return next

  // Re-deriving each player unit's effective def from its own stored
  // upgradeLevel every round (rather than reading a shared registry by
  // defId) is what makes Upgrade actually persist round to round -
  // two copies of the same base unit at different upgrade levels stay
  // distinct, and next-round intent recomputation (further down in
  // actSide) sees the boosted movePattern amounts, not the base ones.
  next = actSide(next, next.playerUnits, (u) => unitDefWithUpgrade(UNITS[u.defId], u.upgradeLevel || 0), (s) => s.enemies, "player")
  if (next.phase !== "player") return next

  next = { ...next, enemies: next.enemies.map((e) => (e.hp > 0 ? { ...e, block: 0 } : e)) }
  next = actSide(next, next.enemies, (u) => ENEMIES[u.defId], (s) => s.playerUnits, "enemy")
  if (next.phase !== "player") return next

  const round = next.round + 1

  // The round cap used to live only in autoResolveBattle's loop below,
  // which meant a heavy block/heal squad could soft-lock the fight
  // forever if the player stepped through "Next Round" by hand instead
  // of clicking Auto-Resolve - found via a real stress-test stall (a
  // defense-heavy squad against Rune Warden's Escort still had 3 units
  // alive at round 31, phase stuck on "player" indefinitely) that got
  // materially more likely once shielding started protecting units for
  // longer. Living here in resolveRound instead means every path hits
  // the same safety net. Ties (and the player's own benefit of the
  // doubt) go to the player - forcing "lost" on an exhausted stalemate
  // where the player was actually ahead would be a worse failure mode
  // than the rare case of an undeserved win.
  if (round > MAX_ROUNDS) {
    const playerHp = next.playerUnits.reduce((sum, u) => sum + u.hp, 0)
    const enemyHp = next.enemies.reduce((sum, e) => sum + e.hp, 0)
    return {
      ...next,
      round,
      phase: playerHp >= enemyHp ? "won" : "lost",
      log: [...next.log, "The fight drags on too long - exhaustion decides it."],
    }
  }

  return { ...next, round }
}

// Fast-forwards a whole fight to its conclusion - the "Auto-Resolve"
// button. A round cap guards against a pathological standoff (e.g. two
// pure-block squads) rather than looping forever.
export function autoResolveBattle(state) {
  let next = state
  let rounds = 0
  while (next.phase === "player" && rounds < MAX_ROUNDS) {
    next = resolveRound(next)
    rounds++
  }
  return next
}

// Post-battle summary for ResultOverlay - only the player squad's own
// numbers matter here (it's "what did my build actually do," not a
// full combat log dump). Top unit ranks by damage+healing combined so
// a pure healer can still show up as MVP in a fight it carried.
export function summarizeBattle(state) {
  const entries = state.playerUnits.map((u) => {
    const s = state.stats?.[u.id] || { damageDealt: 0, healingDone: 0 }
    return { id: u.id, name: u.name, damageDealt: s.damageDealt, healingDone: s.healingDone }
  })
  const totalDamage = entries.reduce((sum, e) => sum + e.damageDealt, 0)
  const totalHealing = entries.reduce((sum, e) => sum + e.healingDone, 0)
  const topUnit = entries.reduce(
    (best, e) => (!best || e.damageDealt + e.healingDone > best.damageDealt + best.healingDone ? e : best),
    null,
  )
  return { entries, totalDamage, totalHealing, topUnit }
}
