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

import { UNITS, unitDefWithUpgrade, scaleEffect } from "../../data/heartwood/units"
import { ENEMIES } from "../../data/heartwood/enemies"
import { CHARACTERS, commanderPassiveWithRank } from "../../data/heartwood/characters"
import { resolveFormation } from "../../data/heartwood/formations"
import { RELICS } from "../../data/heartwood/relics"
import { ITEMS } from "../../data/heartwood/items"
import { tribesOf, SYNERGY_TIERS } from "../../data/heartwood/synergies"
import { applyEffects, runTriggers, getUnit, setUnit, tickPoison, tickRegen } from "./effects"
import { isShielded, kingAdjacent } from "./targeting"

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

// The Commander's own fixed 5th slot (autoBattleEngine.js's
// startAutoBattle) - separate from the 4 recruited-unit slots above,
// always the same square, not something the player assigns/reorders.
// The other empty forward corner (row 1, col 0/2 are the only cells
// SLOT_POSITIONS doesn't already use) - isShielded (targeting.js) is
// already column-generic, so this correctly shields whatever recruit
// ends up at (row 2, col 0) the same way (row 1, col 1) already
// shields (row 2, col 1), with zero changes needed there.
const COMMANDER_POSITION = { row: 1, col: 0 }

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
    case "sunder":
      return [{ type: "sunder", target: "target" }]
    case "cleanse":
      // Deliberately no `target: "target"` - cleanse acts on the unit's
      // OWN negative statuses, and resolveWho already defaults an
      // omitted target to ctx.actorId (self). Sunder needs "target"
      // (the enemy); cleanse needs the opposite, so it stays omitted.
      return [{ type: "cleanse" }]
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
export function startAutoBattle(
  characterId,
  deployedUnits,
  enemyFormationOrId,
  relicIds = [],
  commanderRank = 0,
  relicLevels = {},
  commanderItemIds = [],
  pendingEffects = [],
  difficultyFactor = 1,
) {
  const formation = resolveFormation(enemyFormationOrId)
  const character = CHARACTERS[characterId]

  // Difficulty scaling (runEngine.js's startFormationBattle, ramping
  // with how far into the run this fight is) - Marc: "pelin pitää olla
  // vaikea mutta ei mahdoton... pelaajan pitää tehdä toimiva build
  // voittaakseen" (the game needs to be hard but not impossible - the
  // player needs to build a working build to win), confirmed after a
  // stress test showed a bot that ignores every system this session
  // built (Market Level, tribes, relics, Commander Active) won exactly
  // as often as one that uses all of them - the base recruited squad
  // alone already cleared the whole run, so nothing built this session
  // had real pressure behind it. Cached once per enemy defId here
  // (same "compute once, read every round" precedent state.commanderDef
  // already set for the Commander) rather than left to ENEMIES[defId]'s
  // raw stats, since resolveRound's own enemy actSide call re-resolves
  // a def fresh every round - the scaled movePattern amounts need to
  // exist somewhere it'll actually find them, not just at spawn.
  const enemyDefs = {}
  for (const defId of new Set(formation.pieces.map((p) => p.defId))) {
    const base = ENEMIES[defId]
    enemyDefs[defId] =
      difficultyFactor === 1
        ? base
        : {
            ...base,
            maxHp: Math.round(base.maxHp * difficultyFactor),
            movePattern: base.movePattern.map((m) => scaleEffect(m, difficultyFactor)),
            passive: base.passive
              ? base.passive.map((p) =>
                  p.type === "addTrigger" ? { ...p, effect: scaleEffect(p.effect, difficultyFactor) } : scaleEffect(p, difficultyFactor),
                )
              : base.passive,
          }
  }

  const enemies = formation.pieces.map((piece, i) => {
    const def = enemyDefs[piece.defId]
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
  const recruitedUnits = deployedUnits.map((entry, i) => {
    const defId = typeof entry === "string" ? entry : entry.defId
    const upgradeLevel = typeof entry === "string" ? 0 : entry.upgradeLevel || 0
    const itemIds = typeof entry === "string" ? [] : entry.itemIds || []
    const def = unitDefWithUpgrade(UNITS[defId], upgradeLevel)
    const id = `p${i}`
    effectiveDefs[id] = def
    return freshUnit({
      id,
      defId,
      upgradeLevel,
      itemIds,
      name: def.name,
      hp: def.maxHp,
      maxHp: def.maxHp,
      pos: SLOT_POSITIONS[i] || { row: 1, col: i },
      moveIndex: 0,
      intent: computeIntent(def, 0),
    })
  })

  // The Commander deploys as a real 5th unit, always at its own fixed
  // slot - not recruited, not something the player assigns, but a
  // full participant in the same passive/item/turn loops every
  // recruited unit goes through (see the per-unit loop just below).
  // `defId: null` deliberately never resolves against UNITS - it has
  // its own def (`character`) instead, same fields (movePattern/
  // attackPattern/haste/passive) as any unit.js entry.
  effectiveDefs.commander = character
  const commanderUnit = freshUnit({
    id: "commander",
    defId: null,
    itemIds: commanderItemIds,
    name: character.name,
    art: character.art,
    hp: character.maxHp,
    maxHp: character.maxHp,
    pos: COMMANDER_POSITION,
    moveIndex: 0,
    intent: computeIntent(character, 0),
  })

  const playerUnits = [...recruitedUnits, commanderUnit]

  let state = {
    round: 1,
    phase: "player",
    grid: GRID,
    playerUnits,
    enemies,
    stats: {},
    roundEvents: [],
    // Cached so every later per-round def lookup (resolveRound's own
    // actSide call, applyRallyHealTick) can resolve the Commander's
    // own def without a UNITS[defId] lookup - the Commander's
    // `defId` is deliberately null since it isn't in UNITS at all.
    commanderDef: character,
    // Cached the same way - the DIFFICULTY-SCALED enemy defs built
    // above, so resolveRound's own enemy actSide call reads the scaled
    // movePattern amounts every round instead of ENEMIES[defId]'s raw,
    // unscaled stats.
    enemyDefs,
    log: [`The fight begins. ${formation.name || enemies[0]?.name || "The enemy"} stands ready.`],
  }

  // Enemies can carry a battle-start passive too, the same one-time
  // self-targeting grant player units already get via def.passive just
  // below - previously only player units could have one, so no enemy
  // could ever come pre-armed with something like Shatter the way
  // Ironbark/Stoneheart already come pre-armed with Taunt.
  for (const e of enemies) {
    const def = enemyDefs[e.defId]
    if (def.passive?.length) {
      state = applyEffects(state, def.passive, { actorId: e.id, targetId: e.id })
    }
  }

  // Each deployed unit's own passive (ported from its old power-card
  // addTrigger effect) applies once, the same mechanism a character's
  // startEffects already used for a one-time battle-start bonus.
  for (const u of playerUnits) {
    const def = effectiveDefs[u.id]
    if (def.passive?.length) {
      state = applyEffects(state, def.passive, { actorId: u.id, targetId: u.id })
    }
    // Rally (units.js's rallyAdjacent, e.g. Ashenhorn): the roster's
    // first positional passive - targets OTHER deployed units whose
    // grid position is Chebyshev-adjacent to this one, not itself, so
    // it's resolved here against playerUnits' actual pos values rather
    // than through the uniform self-targeting loop above.
    if (def.rallyAdjacent) {
      for (const other of playerUnits) {
        if (other.id === u.id) continue
        if (kingAdjacent(u.pos, other.pos)) {
          state = applyEffects(state, [{ type: "applyBuff", id: def.rallyAdjacent.id, amount: def.rallyAdjacent.amount }], {
            actorId: other.id,
            targetId: other.id,
          })
        }
      }
    }
    // Items (items.js, runEngine.js's buyItem/equipItem): gear equipped
    // to THIS specific bench unit only, applied the same self-targeting
    // way a unit's own passive is above - an item is deliberately just
    // a smaller, single-target echo of an existing relic, not a new
    // engine mechanic.
    for (const itemId of u.itemIds) {
      const item = ITEMS[itemId]
      if (item?.effects?.length) {
        state = applyEffects(state, item.effects, { actorId: u.id, targetId: u.id })
      }
    }
  }

  // Summon (units.js's summon field, e.g. Beastcaller): a real extra
  // entry in state.playerUnits, not a stat buff, spawned into whichever
  // deploy slot the summoner itself didn't take. Runs after the passive/
  // Rally loop above but before the Commander/relic loops below, and
  // those loops read from state.playerUnits (the live roster) rather
  // than the captured `playerUnits` const specifically so a freshly
  // summoned creature still gets the Commander's squadPassive and any
  // equipped relics, the same way every recruited unit does - it's a
  // full squad member from the moment it exists, not a lesser bonus.
  // Deliberately a one-shot at battle start (no cap-tracking needed):
  // there's only ever one deploy slot to fill, so it can only happen
  // once regardless of movePattern/moveIndex.
  for (const u of playerUnits) {
    const def = effectiveDefs[u.id]
    if (!def.summon) continue
    const occupied = new Set(state.playerUnits.map((p) => `${p.pos.row}-${p.pos.col}`))
    const freeSlot = SLOT_POSITIONS.find((slot) => !occupied.has(`${slot.row}-${slot.col}`))
    if (!freeSlot) {
      state = { ...state, log: [...state.log, `${u.name} has no room left to summon a companion.`] }
      continue
    }
    const summonDef = UNITS[def.summon.defId]
    const summoned = freshUnit({
      id: `p-summon-${u.id}`,
      defId: def.summon.defId,
      name: summonDef.name,
      hp: summonDef.maxHp,
      maxHp: summonDef.maxHp,
      pos: freeSlot,
      moveIndex: 0,
      intent: computeIntent(summonDef, 0),
      summoned: true,
    })
    state = {
      ...state,
      playerUnits: [...state.playerUnits, summoned],
      log: [...state.log, `${u.name} calls a ${summonDef.name} to the battlefield!`],
    }
  }

  // The Commander's own signature effect applies to every unit in the
  // squad, not just one hero - this is what makes choosing Tommy vs.
  // Aatos vs. Fenrir actually matter in the autobattler. Scaled by
  // commanderRank (characters.js's Rank-Up, a run-long Essence sink
  // mirroring units.js's per-unit Upgrade) before it's applied.
  const squadPassive = commanderPassiveWithRank(character, commanderRank)
  if (squadPassive.length) {
    for (const u of state.playerUnits) {
      state = applyEffects(state, squadPassive, { actorId: u.id, targetId: u.id })
    }
  }

  // Relics (relics.js) stack on top of the Commander's squadPassive,
  // same self-targeting mechanism - a run can carry multiple relics at
  // once, each applying to every deployed unit. Scaled by relicLevels
  // (runEngine.js's Relic Upgrade, an Essence sink mirroring Unit
  // Upgrade/Commander Rank-Up) the same way commanderPassiveWithRank
  // scales a squadPassive, just inlined here since relics have no
  // single owning def object the way a Commander does.
  for (const relicId of relicIds) {
    const relic = RELICS[relicId]
    const level = relicLevels[relicId] || 0
    const factor = 1 + level * 0.25
    const scaledEffects =
      level && relic?.effects?.length
        ? relic.effects.map((e) => (e.type === "addTrigger" ? { ...e, effect: scaleEffect(e.effect, factor) } : scaleEffect(e, factor)))
        : relic?.effects
    // Tribe-anchor relics (relics.js's tribeAnchor, e.g. Thorn's
    // Wrath): reach only units of that one tribe instead of the whole
    // squad, same "narrower but stronger" precedent tribeAnchor's own
    // comment in relics.js sets. tribesOf naturally excludes the
    // Commander (its def has no fusedFrom/matching UNIT_TRIBES entry)
    // and resolves a summoned creature's tribe via UNITS[u.defId] since
    // effectiveDefs only ever covers recruited units + the Commander.
    const targets = relic?.tribeAnchor
      ? state.playerUnits.filter((u) => tribesOf(u.defId, effectiveDefs[u.id] || UNITS[u.defId]).includes(relic.tribeAnchor))
      : state.playerUnits
    if (scaledEffects?.length) {
      for (const u of targets) {
        state = applyEffects(state, scaledEffects, { actorId: u.id, targetId: u.id })
      }
    }
    // Bulwark Standard: not a uniform per-unit effect like every other
    // relic, so it's handled here instead of via `effects` - Taunt
    // goes to whichever deployed unit currently has the highest maxHp
    // (ties broken by deploy order), same one-time battle-start timing
    // as Stoneheart's own passive grant.
    if (relic?.tauntHighestHp && state.playerUnits.length) {
      const tankiest = state.playerUnits.reduce((best, u) => (u.maxHp > best.maxHp ? u : best), state.playerUnits[0])
      state = applyEffects(state, [{ type: "applyBuff", id: "taunt", amount: 1 }], {
        actorId: tankiest.id,
        targetId: tankiest.id,
      })
    }
  }

  // Tribe synergies (synergies.js's UNIT_TRIBES/SYNERGY_TIERS) - counted
  // from the RECRUITED squad only (recruitedUnits, captured before the
  // Commander/summons were added to playerUnits): the Commander has no
  // tribe of its own, and a summoned creature wasn't something the
  // player shopped for, so neither should count toward "what tribe did
  // you build." Applied to state.playerUnits (the live roster, same as
  // every loop above) so a freshly summoned creature still benefits
  // from an active synergy, matching the precedent every other
  // squad-wide source (Commander squadPassive, relics) already set.
  const tribeCounts = {}
  for (const u of recruitedUnits) {
    for (const t of tribesOf(u.defId, effectiveDefs[u.id])) tribeCounts[t] = (tribeCounts[t] || 0) + 1
  }
  for (const [tribeId, count] of Object.entries(tribeCounts)) {
    const tiers = SYNERGY_TIERS[tribeId] || []
    const activeTier = [...tiers].reverse().find((t) => count >= t.count)
    if (activeTier?.effects?.length) {
      for (const u of state.playerUnits) {
        state = applyEffects(state, activeTier.effects, { actorId: u.id, targetId: u.id })
      }
    }
  }

  // Commander Active Power (characters.js's activePower, runEngine.js's
  // activateCommanderPower/startFormationBattle): queued during the shop
  // phase, applied here - the start of the very next battle - then
  // discarded. Same self-targeting squad-wide loop every other source
  // above already uses.
  if (pendingEffects.length) {
    for (const u of state.playerUnits) {
      state = applyEffects(state, pendingEffects, { actorId: u.id, targetId: u.id })
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
        const targetWasAlive = (getUnit(next, targetId)?.hp || 0) > 0
        next = applyEffects(next, intentToEffects(acting.intent, attackPattern), { actorId: unit.id, targetId })

        // Chain (units.js's chainDamage): if a single-target attack was
        // the killing blow, immediately strike a different living
        // enemy too - a second, distinct way to reward finishing blows
        // alongside Execute, but as a bonus hit on someone else instead
        // of extra damage on the same target. Scoped to attackPattern
        // "single" only - a pattern-attacker's applyPatternDamage can
        // kill several targets in one action, where "who died" is
        // already ambiguous enough without layering a chain on top.
        // `acting.powers.chainDamage` (an item/relic-granted stack, via
        // the exact same generic `applyBuff` mechanism every other
        // itemizable mechanic uses) is checked ALONGSIDE the unit's own
        // baked-in `def.chainDamage` rather than instead of it - a unit
        // that already has Chain built in can still get MORE from an
        // item, the two add together instead of one overriding the
        // other. Previously chainDamage was the one mechanic on the
        // roster with no item/relic path at all, since it lived purely
        // on the def rather than in the generic effects/powers system.
        const chainAmount = (def.chainDamage || 0) + (acting.powers.chainDamage || 0)
        if (
          side === "player" &&
          attackPattern === "single" &&
          chainAmount > 0 &&
          acting.intent.type === "attack" &&
          targetWasAlive &&
          next.phase === "player" &&
          (getUnit(next, targetId)?.hp || 0) <= 0
        ) {
          const survivors = targetPool(next).filter((e) => e.hp > 0)
          if (survivors.length) {
            const chainTarget = survivors.reduce((low, e) => (e.hp < low.hp ? e : low), survivors[0])
            next = applyEffects(next, [{ type: "damage", amount: chainAmount }], {
              actorId: unit.id,
              targetId: chainTarget.id,
            })
          }
        }

        // Spore Spread (units.js's sporeSpread): when this unit's own
        // debuff step applies Poison, the same stack count also seeds
        // onto a different living enemy - "sieniverkosto levittää
        // efektejä" (a fungal network spreads effects), the Mycelist
        // class's identity. Picks the lowest-HP other living enemy,
        // same deterministic convention Chain already uses, rather
        // than anything random. `acting.powers.sporeSpread` (an item/
        // relic-granted flag, same `applyBuff`-as-boolean shape Taunt/
        // Ward already use) is checked alongside `def.sporeSpread` -
        // only matters for a unit whose own movePattern already applies
        // Poison (a handful of units share that debuff move), but for
        // those it's a real choice: spread it even without drafting
        // Mycelist specifically.
        if (
          side === "player" &&
          (def.sporeSpread || acting.powers.sporeSpread) &&
          acting.intent.type === "debuff" &&
          acting.intent.id === "poison" &&
          next.phase === "player"
        ) {
          const others = targetPool(next).filter((e) => e.hp > 0 && e.id !== targetId)
          if (others.length) {
            const spreadTarget = others.reduce((low, e) => (e.hp < low.hp ? e : low), others[0])
            // target: "target" is required - applyBuff defaults an
            // omitted target to ctx.actorId (self), which would poison
            // Mycelist itself instead of the intended spread target
            // (caught via testing before shipping, not guessed at).
            next = applyEffects(next, [{ type: "applyBuff", id: "poison", target: "target", amount: acting.intent.amount }], {
              actorId: unit.id,
              targetId: spreadTarget.id,
            })
          }
        }

        // Haste (units.js's haste): the unit acts a second time in the
        // same round instead of once - a structurally different kind
        // of "more damage" from Strength/Execute/Chain (all of which
        // make ONE hit bigger or add a bonus one), this makes the
        // whole action repeat. Picks a fresh target via frontmost()
        // rather than reusing targetId, so a Haste unit that just
        // killed its target doesn't waste the second swing on a
        // corpse. Deliberately doesn't itself trigger Chain again -
        // one follow-up mechanic calling another gets hard to reason
        // about fast, and Haste's own value already comes from a
        // second full action, not from stacking with every other
        // finishing-blow mechanic too.
        if (side === "player" && attackPattern === "single" && def.haste && acting.intent.type === "attack" && next.phase === "player") {
          const secondTargetId = frontmost(next, targetPool(next))
          if (secondTargetId) {
            next = applyEffects(next, intentToEffects(acting.intent, attackPattern), { actorId: unit.id, targetId: secondTargetId })
          }
        }
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

// rallyHeal (units.js, e.g. Sapkeeper): mends adjacent allies every
// round instead of once at battle start (a one-time grant would be a
// no-op - units are always at full HP when a fight starts). Re-derives
// each unit's effective def from its own upgradeLevel every round,
// same reason resolveRound's own actSide calls do, so an Upgraded
// Sapkeeper's aura scales like everything else.
function applyRallyHealTick(state) {
  let next = state
  for (const u of next.playerUnits) {
    if (u.hp <= 0) continue
    const def = u.id === "commander" ? next.commanderDef : unitDefWithUpgrade(UNITS[u.defId], u.upgradeLevel || 0)
    if (!def.rallyHeal) continue
    for (const other of next.playerUnits) {
      if (other.id === u.id || other.hp <= 0) continue
      if (kingAdjacent(u.pos, other.pos)) {
        next = applyEffects(next, [{ type: "heal", amount: def.rallyHeal }], { actorId: other.id, targetId: other.id })
      }
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
    // Reset each round, same as the log's own "Round N." marker -
    // effects.js's dealDamage appends to this as attacks resolve;
    // AutoBattleView.jsx reads it after the round lands to stage the
    // attacker-lunge animation for exactly this round's hits.
    roundEvents: [],
    playerUnits: state.playerUnits.map((u) => (u.hp > 0 ? { ...u, block: 0 } : u)),
  }

  // Poison ticks for both sides at the top of the round, before anyone
  // acts - whoever was poisoned last round pays for it now, same
  // "resolve automatically, no opt-in" shape the Block reset uses.
  next = tickPoison(next, next.playerUnits)
  if (next.phase !== "player") return next
  next = tickPoison(next, next.enemies)
  if (next.phase !== "player") return next

  // Regen (effects.js) - Poison's mirror, same "resolve automatically,
  // decay by 1" shape, healing instead of damaging.
  next = tickRegen(next, next.playerUnits)
  if (next.phase !== "player") return next
  next = tickRegen(next, next.enemies)
  if (next.phase !== "player") return next

  next = applyRallyHealTick(next)
  if (next.phase !== "player") return next

  // Re-deriving each player unit's effective def from its own stored
  // upgradeLevel every round (rather than reading a shared registry by
  // defId) is what makes Upgrade actually persist round to round -
  // two copies of the same base unit at different upgrade levels stay
  // distinct, and next-round intent recomputation (further down in
  // actSide) sees the boosted movePattern amounts, not the base ones.
  next = actSide(
    next,
    next.playerUnits,
    (u) => (u.id === "commander" ? next.commanderDef : unitDefWithUpgrade(UNITS[u.defId], u.upgradeLevel || 0)),
    (s) => s.enemies,
    "player",
  )
  if (next.phase !== "player") return next

  next = { ...next, enemies: next.enemies.map((e) => (e.hp > 0 ? { ...e, block: 0 } : e)) }
  next = actSide(next, next.enemies, (u) => next.enemyDefs?.[u.defId] || ENEMIES[u.defId], (s) => s.playerUnits, "enemy")
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
