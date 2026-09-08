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
import { ITEMS, effectiveRole } from "../../data/heartwood/items"
import { unitProfile, positionFitForSlot, POSITION_BONUS } from "../../data/heartwood/roles"
import { ARENAS } from "../../data/heartwood/arenas"
import { moodRailFor } from "../../data/heartwood/moods"
import { tribesOf, SYNERGY_TIERS, resolveComboSynergies, resolvePositionSynergies } from "../../data/heartwood/synergies"
import { findDualClassFor, applyDualClassGrant } from "../../data/heartwood/dualClasses"
import { applyEffects, runTriggers, getUnit, setUnit, tickPoison, tickRegen, tickBurn, tickAscendant } from "./effects"
import { isShielded, kingAdjacent } from "./targeting"
// RAMP_CAP: the difficulty ramp's total budget, defined in runEngine.js
// alongside difficultyFactorForNode. Imported (not re-declared) so this
// file's ramp-progress normalizer below can never drift from the curve
// that produced the factor. runEngine.js already imports from this
// file, so this is a deliberate, safe circular reference - RAMP_CAP is
// only read inside a function, long after both modules finish loading.
import { RAMP_CAP } from "./runEngine"

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

// The Crownless mirror (startAutoBattle's `mirrorSquad`) lays the player's
// cloned squad across the enemy's own rows 0-1, off-centre columns (same
// no-knight-move-reaches-(1,1) reasoning every shielding formation uses).
const MIRROR_POSITIONS = [
  { row: 0, col: 0 },
  { row: 0, col: 2 },
  { row: 1, col: 0 },
  { row: 1, col: 2 },
]

function freshUnit(overrides) {
  return { block: 0, powers: {}, triggers: [], ...overrides }
}

// Dual-Class (dualClasses.js, roadmap task 19): the shared resolution
// step every per-round def re-derive already needs, layered right after
// Upgrade in the exact same "compute the effective def fresh" spots
// Upgrade's own unitDefWithUpgrade already runs (startAutoBattle's
// initial effectiveDefs build, applyRallyHealTick, resolveRound's own
// actSide call) - a single shared helper so all 3 spots can never drift
// out of sync with each other, same discipline effectiveItemSlots
// (runEngine.js) already documents for its own callers.
// `upgrades` is the bench entry's chosen-branch array (upgrades.js /
// units.js's unitDefWithUpgrade). A bare number is still accepted
// (legacy `upgradeLevel` -> that many `power` picks).
function effectiveUnitDef(defId, upgrades, deployedDefIds) {
  const base = unitDefWithUpgrade(UNITS[defId], upgrades)
  const dualClass = findDualClassFor(defId, deployedDefIds, UNITS)
  return dualClass ? applyDualClassGrant(base, defId, dualClass, UNITS) : base
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

// Threat targeting (PRD "Strategic Combat System V2" 6-7). Enemies used
// to focus-fire a UNIFORMLY RANDOM unshielded squad member - the one
// bit of in-combat RNG the design mandate says shouldn't exist, and it
// meant a tank was no safer to stand next to than a glass cannon. Now
// every player unit carries a deterministic Threat value and the enemy
// hits the highest. Pure + recomputed each pick from live state -
// nothing persisted, no save bump. Every weight is in this one table,
// placeholder-first.
const THREAT = {
  // Only `tank` spikes - that's the mechanic's point. The rest sit in a
  // tight 38-45 band so a tank-less squad's round-1 target is decided
  // mostly by the pos tie-break (front-left first), i.e. close to the
  // old "hit the front" feel, and the fight length holds. A first pass
  // with a wide role spread + heavy dmg/heal weighting ran aatos ~-17 pp
  // on the RUNS=100 gate (its sustain squads had the healer focused
  // first every fight and folded); this band + the low weights below
  // brought it back.
  role: { tank: 100, healer: 45, support: 40, control: 42, debuffer: 42, dps: 40, assassin: 40, summoner: 40, economy: 38 },
  commander: 42, // no UNITS def -> a flat middle base
  dmgW: 0.12, // running damageDealt this fight (state.stats) - a carry that keeps hitting slowly climbs the order
  healW: 0.15, // running healingDone - an out-healing mender climbs a little too (PRD 6), but not enough to be deleted first
  taunt: 400, // per stack: a large ADDITIVE, not a hard override (PRD 7 - taunt is a priority modifier, leaves room for a future ignore-taunt assassin)
  front: 8, // pos.row <= 1 (the one forward slot) draws a little extra - ties into positioning (PR #422)
}

export function unitThreat(state, unit) {
  const def = unit.id === "commander" ? state.commanderDef : UNITS[unit.defId]
  const base = unit.id === "commander" ? THREAT.commander : (def && THREAT.role[unitProfile(def).primary]) || 40
  const s = state.stats?.[unit.id] || {}
  return (
    base +
    Math.round((s.damageDealt || 0) * THREAT.dmgW) +
    Math.round((s.healingDone || 0) * THREAT.healW) +
    ((unit.powers?.taunt || 0) > 0 ? THREAT.taunt * unit.powers.taunt : 0) +
    ((unit.pos?.row ?? 2) <= 1 ? THREAT.front : 0)
  )
}

// The enemy's single-target pick. Taunt still bypasses shielding and
// hard-forces the pool (a taunter draws fire from a technically-shielded
// square too - the old random pool's rule). Otherwise: the enemy works
// DOWN the squad in threat order - round 1 hits the highest-threat unit,
// round 2 the next, wrapping; as units fall the pool shrinks and the
// top survivors get hit every round. `nth` = this attacker's index in
// the round's turn order (actSide passes 0, 1, 2 ...) so a multi-enemy
// volley SPREADS across the squad instead of every enemy computing the
// same round-number index and dog-piling one unit.
//
// Why not pure argmax? That tested ~13-16 pp below `development` on the
// RUNS=100 gate (the bot's squads have no forward tank to soak a
// deterministic focus, so its damage dealers got deleted and it
// snowballed). And round-number-only (no `nth`) sank the sustain
// Commander ~17 pp: a whole enemy volley landing on one unit per round
// outpaced its per-round heals. Threat order + per-attacker offset
// spreads damage the way the old uniform-random pick did (fight length
// holds) while still making threat matter - highest-threat is hit
// first - and stays fully deterministic, no RNG.
function threatTarget(state, units, nth = 0) {
  const living = units.filter((u) => u.hp > 0)
  if (!living.length) return null
  const taunters = living.filter((u) => (u.powers.taunt || 0) > 0)
  const pool = taunters.length ? taunters : unshieldedOrAll(state, living)
  const sorted = [...pool].sort(
    (a, b) =>
      unitThreat(state, b) - unitThreat(state, a) ||
      a.pos.row - b.pos.row ||
      a.pos.col - b.pos.col ||
      (a.id < b.id ? -1 : 1),
  )
  return sorted[((state.round || 1) - 1 + nth) % sorted.length].id
}

// The unit the enemy's next attack lands on - for the board's targeting
// cue (offset 0 = this round's first attacker).
export function topThreatTargetId(state) {
  return threatTarget(state, state.playerUnits || [])
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
  arenaId = null,
  // Forest Mood (moods.js): the world's posture (restless | purified |
  // corrupted, set by the Act crossroads) becomes a live, escalating
  // per-battle meter. Only the starting value / rail differ by state;
  // the meter itself lives on the battle object and climbs each round
  // in resolveRound's checkForestMood.
  forestState = "restless",
  // The Crownless (Act V - runEngine.startCrownlessBattle): a real 1:1
  // mirror of the player's own deployed squad on the enemy side. When
  // given (deployedUnits shape: [{ defId, upgradeLevel, itemIds }]), the
  // enemy pieces are built from UNIT defs via the exact same
  // effectiveUnitDef -> freshUnit path the player's own recruits use,
  // instead of from `enemyFormationOrId`'s ENEMIES pieces. `enemyFormationOrId`
  // stays as the fallback for an empty squad. v1 limitation: haste /
  // chainDamage / rallyAdjacent / summon are player-side-only in actSide,
  // so the mirror clones stats + movePattern + passives, not those.
  mirrorSquad = null,
) {
  const useMirror = Array.isArray(mirrorSquad) && mirrorSquad.length > 0
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
  // Enemy "pieces": from the mirror squad (UNIT defs) or the formation
  // (ENEMIES defs). Same downstream shape either way.
  const mirrorDefIds = useMirror ? mirrorSquad.map((e) => e.defId) : []
  const enemyPieceSpecs = useMirror
    ? mirrorSquad.map((entry, i) => ({
        defId: entry.defId,
        pos: MIRROR_POSITIONS[i] || { row: 0, col: i % 3 },
        upgrades: entry.upgrades || [],
        itemIds: entry.itemIds || [],
      }))
    : formation.pieces.map((p) => ({ ...p, upgrades: [], itemIds: [] }))

  const scaleDefFor = (base) =>
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

  const enemyDefs = {}
  for (const defId of new Set(enemyPieceSpecs.map((p) => p.defId))) {
    const spec = enemyPieceSpecs.find((p) => p.defId === defId)
    const base = useMirror ? effectiveUnitDef(defId, spec.upgrades, mirrorDefIds) : ENEMIES[defId]
    enemyDefs[defId] = scaleDefFor(base)
  }

  const enemies = enemyPieceSpecs.map((piece, i) => {
    const def = enemyDefs[piece.defId]
    return freshUnit({
      id: `e${i}`,
      defId: piece.defId,
      itemIds: piece.itemIds,
      name: useMirror ? `Echo of ${def.name}` : def.name,
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
  // Dual-Class (dualClasses.js): every deployed unit's OWN defId, read
  // once here so findDualClassFor has the full deployed roster to check
  // each unit's partner against - computed before the per-unit map
  // below since a unit needs to see every OTHER deployed defId, not
  // just its own.
  const deployedDefIds = deployedUnits.map((entry) => (typeof entry === "string" ? entry : entry.defId))

  const effectiveDefs = {}
  const recruitedUnits = deployedUnits.map((entry, i) => {
    const defId = typeof entry === "string" ? entry : entry.defId
    // `upgrades` is the chosen-branch array; fall back to the legacy
    // numeric `upgradeLevel` if that's all the caller passed.
    const upgrades = typeof entry === "string" ? [] : entry.upgrades || entry.upgradeLevel || 0
    const itemIds = typeof entry === "string" ? [] : entry.itemIds || []
    const def = effectiveUnitDef(defId, upgrades, deployedDefIds)
    const id = `p${i}`
    effectiveDefs[id] = def
    return freshUnit({
      id,
      defId,
      upgrades,
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
    // Readability recap (summarizeBattle -> ResultOverlay): the lowest
    // the living squad's HP% ever dipped this fight. Write-only - the
    // sim never reads it back.
    lowestSquadHpPct: 100,
    // Cached so every later per-round def lookup (resolveRound's own
    // actSide call, applyRallyHealTick) can resolve the Commander's
    // own def without a UNITS[defId] lookup - the Commander's
    // `defId` is deliberately null since it isn't in UNITS at all.
    commanderDef: character,
    // Cached the same way (Dual-Class, dualClasses.js) - resolveRound's
    // own per-round def re-derive and applyRallyHealTick both need the
    // full deployed roster to check each unit's partner against, not
    // just their own defId, so it's computed once here rather than
    // re-derived from playerUnits every round (which would also have to
    // filter out the Commander and any mid-battle Summon each time).
    deployedDefIds,
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

  // Enemy formation synergy (formations.js's optional `synergy`): a
  // multi-piece formation that fights as a unit gets a squad-wide
  // battle-start bonus to every living piece, the mirror of the
  // player's own tribe synergies. Only fires with 2+ pieces (a
  // synthesized 1-enemy formation never has one anyway).
  if (formation.synergy?.effects?.length && enemies.length >= 2) {
    state = { ...state, enemySynergyLabel: formation.synergy.label }
    for (const e of state.enemies) {
      state = applyEffects(state, formation.synergy.effects, { actorId: e.id, targetId: e.id })
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
    // Growth (units.js's `growth`, e.g. World-Ash Elder): a thin alias
    // for "gains Ascendant N at battle start" - effects.js's
    // tickAscendant then adds that many Strength every round in
    // resolveRoundInner. No new tick; this is just the authoring /
    // card-display name for the scaling-carry archetype.
    if (def.growth) {
      state = applyEffects(state, [{ type: "applyBuff", id: "ascendant", amount: def.growth.amount }], {
        actorId: u.id,
        targetId: u.id,
      })
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
    // Synergy upgrade branch (upgrades.js): a unit with it counts as
    // +1 toward each of its tribes (effectiveDefs[u.id].synergyBonus).
    const weight = 1 + (effectiveDefs[u.id]?.synergyBonus || 0)
    for (const t of tribesOf(u.defId, effectiveDefs[u.id])) tribeCounts[t] = (tribeCounts[t] || 0) + weight
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

  // Cross-tribe combos (synergies.js's COMBO_SYNERGIES) - counted from
  // the same recruited-squad tribeCounts, applied squad-wide exactly
  // like a tribe tier.
  for (const combo of resolveComboSynergies(tribeCounts)) {
    for (const u of state.playerUnits) {
      state = applyEffects(state, combo.effects, { actorId: u.id, targetId: u.id })
    }
  }

  // Formation / positional synergies (synergies.js's POSITION_SYNERGIES).
  // recruitedUnits[i] sits in SLOT_POSITIONS[i] and has id `p${i}`, so
  // slot index -> tribe tags and slot index -> unit id are both direct.
  const slotTribes = {}
  recruitedUnits.forEach((u, i) => {
    slotTribes[i] = tribesOf(u.defId, effectiveDefs[u.id])
  })
  for (const hit of resolvePositionSynergies(slotTribes)) {
    const targets =
      hit.scope === "squad"
        ? state.playerUnits
        : hit.slots.map((i) => state.playerUnits.find((u) => u.id === `p${i}`)).filter(Boolean)
    for (const u of targets) {
      state = applyEffects(state, hit.effects, { actorId: u.id, targetId: u.id })
    }
  }

  // Conditional passives (units.js's `conditionalPassive`, e.g. The
  // Thorn Throne / Deepwood Sovereign): a battle-start self-buff that
  // only lands when the squad you built - or where you placed this unit -
  // meets its `when`. Evaluated here, after tribeCounts are tallied and
  // units are in their final SLOT_POSITIONS, so both squad-shaped and
  // position-shaped conditions resolve against the real board. Read from
  // recruitedUnits (id `p${i}`) so the Commander / summons never qualify.
  // Player-side only, same v1 limitation as growth / aura / rallyAdjacent.
  for (const ru of recruitedUnits) {
    const cond = effectiveDefs[ru.id]?.conditionalPassive
    if (!cond) continue
    const live = state.playerUnits.find((u) => u.id === ru.id)
    if (!live) continue
    if (evalUnitCondition(cond.when, { pos: live.pos, tribeCounts, squadSize: recruitedUnits.length })) {
      state = applyEffects(state, cond.effect, { actorId: ru.id, targetId: ru.id })
    }
  }

  // Positioning as a role mechanic (roles.js's positionFitForSlot /
  // POSITION_BONUS - PRD "Unit Roles" 20-21). recruitedUnits[i] sits in
  // SLOT_POSITIONS[i]; a unit deployed to its preferred position (tanks
  // forward = slot 3, everyone else back = slots 0-2) gets a single
  // battle-start stack of a role-appropriate buff. Out of position gets
  // nothing - no penalty. Player-side only, same v1 limit as the loops
  // above.
  recruitedUnits.forEach((ru, i) => {
    const base = UNITS[ru.defId]
    if (!base) return
    const bent = effectiveRole(base.role, ru.itemIds || [])
    const profile = unitProfile(base, bent && bent !== base.role ? bent : undefined)
    if (positionFitForSlot(profile.position, i) !== "in") return
    const bonus = POSITION_BONUS[profile.primary]
    if (!bonus) return
    state = applyEffects(state, [{ type: "applyBuff", id: bonus.id, amount: bonus.amount }], {
      actorId: ru.id,
      targetId: ru.id,
    })
    state = { ...state, log: [...state.log, `${base.name} is in position.`] }
  })

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

  state = scaleEnemyHpToSquadDps(state, effectiveDefs, difficultyFactor)

  // Arena hazard (arenas.js) - a per-battle modifier on the whole
  // field, applied AFTER the DPS-based enemy HP scaling so it lands as
  // a raw overlay on an already-balanced fight, the way a Slay the
  // Spire room modifier does. `scope` picks which side(s) it hits.
  const arena = arenaId ? ARENAS.find((a) => a.id === arenaId) : null
  if (arena?.effects?.length) {
    state = { ...state, arenaId, arenaName: arena.name }
    const hit = []
    if (arena.scope === "player" || arena.scope === "both") hit.push(...state.playerUnits)
    if (arena.scope === "enemy" || arena.scope === "both") hit.push(...state.enemies)
    for (const u of hit) {
      state = applyEffects(state, arena.effects, { actorId: u.id, targetId: u.id })
    }
    state = { ...state, log: [...state.log, `Arena: ${arena.name}. ${arena.description}`] }
  }

  // Forest Mood (moods.js) - seed the meter from the world's posture.
  // No tier fires at battle start (every rail's `start` sits below its
  // first tier's `at`); the meter only escalates in resolveRound's
  // checkForestMood, one step per round.
  const moodRail = moodRailFor(forestState)
  state = { ...state, forestState, forestMood: moodRail.start, forestMoodFired: [], forestMoodAnnounce: null }

  return state
}

// A unit's average damage PER ROUND, not per attack move - a
// [block, heal, attack] "sequence" pattern only actually swings 1 turn
// in 3, and a "weightedRandom" one only as often as its own weight
// share, so averaging over the whole pattern (not just the attack
// entries) is what "damage per round" actually means.
function averageAttackAmount(def) {
  if (!def?.movePattern?.length) return 0
  if (def.moveSelect === "weightedRandom") {
    const totalWeight = def.movePattern.reduce((sum, m) => sum + (m.weight || 1), 0)
    const weightedDamage = def.movePattern.reduce((sum, m) => sum + (m.type === "attack" ? m.amount * (m.weight || 1) : 0), 0)
    return totalWeight ? weightedDamage / totalWeight : 0
  }
  const totalDamage = def.movePattern.reduce((sum, m) => sum + (m.type === "attack" ? m.amount : 0), 0)
  return totalDamage / def.movePattern.length
}

// Marc, live, right after auto-deploy (recruitUnit, runEngine.js)
// shipped and made every player's squad actually fully-deployed for
// the first time: "balancing is off now the units destroy enemies so
// fast" - then, after a first pass at just raising the ramp (which
// hurt sustain-Commanders disproportionately, see the comment on
// difficultyFactorForNode above), the real ask: "this needs to be
// incremental to the progress the player is making and match the
// level of dps they put out." The run-progress ramp above answers the
// first half; this answers the second - enemy HP now also reacts to
// how hard THIS SPECIFIC squad actually hits, not just a flat
// per-fight number tuned against an average build. A strong, well-
// itemized squad faces tankier enemies; a weak one still gets exactly
// the progress-based baseline it always did (this only ever RAISES
// HP above that baseline, never lowers it - a weak build isn't
// punished further, only a strong one is asked to work for its win).
//
// Estimates total squad DPS-per-round from the FULLY buffed
// state.playerUnits (every passive/item/relic/tribe/Commander/active-
// power effect above has already applied by this point in the
// function, so u.powers.strength is the real number this fight will
// actually swing with, not a base-stat guess). Sets a target fight
// LENGTH in rounds - shorter early, longer late, matching "the game
// has to have progressive feel to it" the same way the HP ramp
// already does - then raises the formation's total HP pool to that
// target if the squad's real DPS would otherwise clear it faster,
// redistributing across pieces in their existing relative proportion
// (a shielded tank keeps its relatively higher share of HP either way).
function scaleEnemyHpToSquadDps(state, effectiveDefs, difficultyFactor) {
  if (!state.enemies.length) return state

  let squadDps = 0
  for (const u of state.playerUnits) {
    const def = u.id === "commander" ? state.commanderDef : effectiveDefs[u.id]
    if (!def) continue
    const perHit = averageAttackAmount(def) + (u.powers.strength || 0)
    squadDps += perHit * (def.haste ? 2 : 1)
  }
  if (squadDps <= 0) return state

  // First attempt (4-9 target rounds, no cap) was a severe
  // overcorrection, caught the same way the ramp overcorrection was:
  // a fresh fairness pass before shipping, not assumed safe because it
  // "made sense" on paper. Win rates across all 4 Commanders collapsed
  // to 0-20% - this HP boost compounds with enemy DAMAGE also already
  // scaling via difficultyFactor (more rounds means more enemy attacks
  // land too), so the combined effect was much harsher than either
  // lever alone. Cut the target-round range roughly in half (2 early,
  // 3.5 late) and added a hard 1.5x cap on the boost itself.
  //
  // That cap turned out to be the wrong lever, found via Marc's own
  // live report right after: "if u purchase units they just win
  // everything." Root cause traced to a real gap in every fairness
  // pass this session had ever run - NONE of them ever bought or
  // equipped items (a whole separate power layer), so every past
  // win-rate number was measured against a weaker squad than a real
  // engaged player actually builds. A fresh pass that DOES buy/equip
  // items showed 92-100% across all 4 Commanders even before touching
  // this cap - and a direct check on a heavily-itemized squad (+5
  // Strength per unit) confirmed the 1.5x ceiling was actively
  // binding, capping enemy HP well below what the squad's real,
  // measured DPS called for. Raised to 3x - still a real ceiling (an
  // absurd, degenerate stack can't demand infinite HP), but one an
  // itemized squad has to actually threaten before it matters, rather
  // than one an average squad never notices and a strong one hits
  // immediately. Re-verified both ways: the no-items fairness pass
  // (never approached 1.5x, so unaffected) and the with-items pass
  // (which needed the higher ceiling) both re-run clean before this
  // shipped.
  // Marc, live, twice in a row after the 2x cap shipped: "the game is
  // still the same" / "enemies needs to be much stronger and scale
  // with the player." A direct measurement (not a guess) of a real
  // item-buying run showed why: squad DPS already exceeds a 2x-scaled
  // baseline by fight ONE, meaning the cap had been binding for every
  // single fight of the run, start to finish - raising it from 1.5 to
  // 2 was too small a move to ever be felt. Marc also explicitly said
  // "its important that the run can also fail" - a hard cap that
  // protects every build equally, no matter how far past baseline its
  // real DPS sits, is fundamentally in tension with that: it's a
  // ceiling on how hard the game can ever get, regardless of how
  // strong the player becomes.
  //
  // Removed the cap. The earlier reasoning for having one (an
  // uncapped first attempt at a MUCH bigger 4-9 round target crashed
  // every Commander to 0-20%) doesn't actually apply here - that
  // collapse came from the target-round range being too aggressive
  // everywhere, not from the absence of a cap specifically once the
  // range itself is reasonable. Re-verified directly: uncapped at
  // THIS range only ever hurt Fenrir's own no-items win rate (36%),
  // and that's Fenrir's own established identity biting - lowest HP
  // of the 4, "the fight gets worse for you the longer it goes" - a
  // longer fight costing Fenrir more than the others isn't a scaling
  // bug, it's the character working as designed. Left as a known,
  // accepted tension rather than nerfing every OTHER Commander's
  // scaling to protect one whose whole identity is "not built to
  // survive a long fight" in the first place.
  //
  // Marc, live, right after the damage-scaling fix landed: "the game
  // doesnt feel challenging enough it feels like my decisions have no
  // impact." A real structural problem, not just a magnitude one -
  // targeting a FIXED round count (3-6, same for every squad) means a
  // squad that built well and a squad that barely tried both take the
  // same number of rounds to win, because the enemy's own toughness
  // was scaled to match whichever one showed up. That's the opposite
  // of "decisions matter" - a genuinely stronger build should clear a
  // fight FASTER and more comfortably than a weak one, not get an
  // automatically tankier opponent that erases the advantage. Cut the
  // target-round floor from 3-6 down to 1.5-2.5, so this mechanism
  // only ever intervenes against a build strong enough to threaten an
  // near-instant, 1-round kill (still a real backstop against
  // trivializing the game entirely) - a normal or even strong build
  // that clears a fight in 2-3 rounds now just... does, and feels like
  // it, instead of getting quietly rubber-banded back to a fixed
  // target every time.
  // This divisor MUST equal runEngine.js's difficultyFactorForNode
  // cap - it's how this function reads back "how far into the ramp is
  // this fight" from the raw multiplier; a stale copy here would read
  // a mid-run fight as already 100% ramped, maxing targetRounds out
  // long before the run's actual end. Was a hand-synced literal
  // (0.65 -> 1.3 -> 0.75); now imported as RAMP_CAP so the two
  // physically cannot drift.
  const progress = Math.min(1, Math.max(0, (difficultyFactor - 1) / RAMP_CAP))
  const targetRounds = 1.5 + progress * 1
  const targetTotalHp = squadDps * targetRounds

  const currentTotalHp = state.enemies.reduce((sum, e) => sum + e.maxHp, 0)
  if (targetTotalHp <= currentTotalHp) return state

  const scale = targetTotalHp / currentTotalHp

  // Marc, live, right after this shipped: "now the enemy doesnt deal
  // any dmg" / "it feels like there is no game if there is no
  // possibility to lose" / "the enemies need to scale with the
  // player." A real design gap, not a phantom - this function only
  // ever scaled enemy HP. A strong squad's kills WERE taking longer
  // (the actual, intended effect), but the enemy's own THREAT never
  // grew to match - a bigger sponge that still hits for the same flat
  // number gets relatively LESS dangerous the longer a fight runs, not
  // more, since the squad gets that many more rounds of its own
  // heal/block/kill output for free. "Scale with the player" has to
  // cut both ways: tougher AND more dangerous, or the game trends
  // toward unlosable exactly as reported.
  //
  // Scales each enemy's own movePattern/passive attack damage by the
  // same measured signal already driving the HP boost - reusing
  // `scale` directly rather than a second independent formula, so a
  // squad strong enough to demand more enemy HP faces a
  // proportionally more dangerous enemy too, not two separately-tuned
  // numbers that can drift apart. Dampened by sqrt (Marc: "there can
  // be multiple enemies during a combat" - a 3-piece formation where
  // EVERY piece also hits proportionally harder compounds fast just
  // from having more attackers already; sqrt keeps a single-target
  // fight's threat rising close to linearly with scale while keeping a
  // multi-piece formation from also multiplying that same boost by 3
  // simultaneous attackers on top of it).
  const damageScale = scale ** 0.2
  const enemyDefs = { ...state.enemyDefs }
  for (const [defId, def] of Object.entries(enemyDefs)) {
    enemyDefs[defId] = {
      ...def,
      movePattern: def.movePattern.map((m) => scaleEffect(m, damageScale)),
      // Same addTrigger-unwrapping shape the ramp's own enemyDefs
      // construction already uses (this file, startAutoBattle) -
      // an addTrigger wrapper has no `amount` of its own, only its
      // inner `effect` does, so scaling the wrapper directly would
      // silently no-op a repeating enemy passive like a turnStart
      // self-heal/self-block.
      passive: def.passive
        ? def.passive.map((p) => (p.type === "addTrigger" ? { ...p, effect: scaleEffect(p.effect, damageScale) } : scaleEffect(p, damageScale)))
        : def.passive,
    }
  }

  return {
    ...state,
    enemyDefs,
    // Each enemy's `intent` (the attack/block/debuff preview the UI
    // already shows before it acts) was computed at construction time,
    // BEFORE this function ever ran - still pointing at the OLD,
    // unscaled movePattern entry. Left alone, round 1's intent badge
    // would promise the pre-scaling number while the actual hit (which
    // reads enemyDefs fresh every round) lands for the new, larger
    // one - a real "the UI lied to me" gap, not just a rounding
    // difference.
    enemies: state.enemies.map((e) => {
      const hp = Math.round(e.maxHp * scale)
      return { ...e, hp, maxHp: hp, intent: computeIntent(enemyDefs[e.defId], e.moveIndex) }
    }),
  }
}

function actSide(state, actingUnits, getDef, targetPool, side) {
  let next = state
  // How many enemy single-target attacks have resolved this round -
  // offsets threatTarget so a multi-enemy volley spreads across the
  // squad instead of every enemy hitting the same round-index unit.
  let enemyAttackN = 0
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
    // threatTarget at all - it hits every living unit in the pool
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
      const targetId =
        side === "player" ? frontmost(next, targetPool(next)) : threatTarget(next, targetPool(next), enemyAttackN++)
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
    const def = u.id === "commander" ? next.commanderDef : effectiveUnitDef(u.defId, u.upgrades || [], next.deployedDefIds || [])
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

// aura (units.js's `aura`, e.g. Bulwark of Ages / Emberbanner): every
// round, `aura.effect` (a single applyEffects entry - block / heal /
// applyBuff) lands on each living Chebyshev-adjacent ally. The per-round
// mirror of rallyAdjacent's one-shot battle-start grant, and structured
// exactly like applyRallyHealTick above (same per-round def re-derive so
// an Upgraded aura scales, same kingAdjacent loop). Player-side only.
function applyAuraTick(state) {
  let next = state
  for (const u of next.playerUnits) {
    if (u.hp <= 0) continue
    const def = u.id === "commander" ? next.commanderDef : effectiveUnitDef(u.defId, u.upgrades || [], next.deployedDefIds || [])
    if (!def.aura?.effect) continue
    for (const other of next.playerUnits) {
      if (other.id === u.id || other.hp <= 0) continue
      if (kingAdjacent(u.pos, other.pos)) {
        next = applyEffects(next, [def.aura.effect], { actorId: other.id, targetId: other.id })
      }
    }
  }
  return next
}

// Predicate for units.js's `conditionalPassive.when` - one shape per
// call (the authoring format is a single-key object). Deliberately tiny:
// a richer condition language is a later PRD slice, not this round.
function evalUnitCondition(when, ctx) {
  if (!when) return false
  if (when.tribeCount) return (ctx.tribeCounts[when.tribeCount.tribe] || 0) >= when.tribeCount.min
  if (when.frontRow) return ctx.pos?.row === 1
  if (when.backRow) return ctx.pos?.row === 2
  if (when.squadSize) return ctx.squadSize >= when.squadSize.min
  return false
}

// Resolves exactly one round: the whole player squad acts (in deployed
// order), then the whole enemy squad acts (in formation order) - same
// two-phase shape the turn-based engine already used, just with a
// squad on each side instead of one hero.
// Boss / miniboss phase mechanics (enemies.js's optional `phases`).
// When a boss first drops to or below a phase's `atHpPct` of its max
// HP, that phase's `effects` apply to the boss once (a self-buff,
// summon, whatever the effect vocabulary allows) and `announce` is
// logged + surfaced for a one-shot UI banner. Tracked per-piece via
// `phasesFired` so it never re-triggers. Checked once per round after
// both sides have acted.
function checkBossPhases(state) {
  let next = state
  let announce = null
  for (const e of next.enemies) {
    const def = next.enemyDefs?.[e.defId] || ENEMIES[e.defId]
    if (!def?.phases?.length || e.hp <= 0) continue
    const fired = new Set(e.phasesFired || [])
    const hpPct = e.hp / e.maxHp
    for (let i = 0; i < def.phases.length; i++) {
      const phase = def.phases[i]
      if (fired.has(i) || hpPct > phase.atHpPct) continue
      fired.add(i)
      const live = next.enemies.find((x) => x.id === e.id)
      next = setUnit(next, e.id, { ...live, phasesFired: [...fired] })
      if (phase.effects?.length) {
        next = applyEffects(next, phase.effects, { actorId: e.id, targetId: e.id })
      }
      if (phase.announce) {
        announce = phase.announce
        next = { ...next, log: [...next.log, `${e.name}: ${phase.announce}`] }
      }
    }
  }
  return announce ? { ...next, bossPhaseAnnounce: announce } : { ...next, bossPhaseAnnounce: null }
}

// Forest Mood (moods.js) - the deterministic sibling of checkBossPhases.
// Called once per round after both sides act: the meter climbs a FIXED
// `step` (never random), and any tier whose `at` it has now reached
// fires once - its effects hit the field (arena-style, scope-picked),
// its `announce` surfaces for a one-shot banner. `forestMoodFired`
// tracks tier indices so a tier never re-triggers. Fully skipped for a
// battle started without a forestState rail (older saves / direct
// engine calls default it to "restless", so this only no-ops if the
// meter fields were never seeded at all).
export function checkForestMood(state) {
  if (typeof state.forestMood !== "number") return { ...state, forestMoodAnnounce: null }
  const rail = moodRailFor(state.forestState || "restless")
  const mood = state.forestMood + rail.step
  const fired = new Set(state.forestMoodFired || [])
  let next = state
  let announce = null
  for (let i = 0; i < rail.tiers.length; i++) {
    const tier = rail.tiers[i]
    if (fired.has(i) || mood < tier.at) continue
    fired.add(i)
    announce = tier.announce
    const hit = []
    if (tier.scope !== "enemy") hit.push(...next.playerUnits.filter((u) => u.hp > 0))
    if (tier.scope !== "player") hit.push(...next.enemies.filter((e) => e.hp > 0))
    for (const u of hit) {
      next = applyEffects(next, tier.effects, { actorId: u.id, targetId: u.id })
    }
    next = { ...next, log: [...next.log, `The forest ${tier.name.toLowerCase()}: ${tier.announce}.`] }
  }
  return { ...next, forestMood: mood, forestMoodFired: [...fired], forestMoodAnnounce: announce }
}

// Readability recap: fold the living squad's current HP% into the
// running low-water mark. Applied at every resolveRound exit (there are
// several early returns), so "closest call" catches a mid-round wipe
// (0%) as readily as a scary round the squad survived. Pure read of
// hp/maxHp; writes only `lowestSquadHpPct`, which nothing in the sim
// reads back.
function foldSquadLow(s) {
  const units = s.playerUnits || (s.player ? [s.player] : [])
  const maxHp = units.reduce((n, u) => n + (u.maxHp || 0), 0)
  if (!maxHp) return s
  const hp = units.reduce((n, u) => n + Math.max(0, u.hp || 0), 0)
  const pct = (hp / maxHp) * 100
  const low = Math.min(s.lowestSquadHpPct ?? 100, pct)
  return low === (s.lowestSquadHpPct ?? 100) ? s : { ...s, lowestSquadHpPct: low }
}

export function resolveRound(state) {
  return foldSquadLow(resolveRoundInner(state))
}

function resolveRoundInner(state) {
  let next = {
    ...state,
    log: [...state.log, `Round ${state.round}.`],
    // Reset each round, same as the log's own "Round N." marker -
    // effects.js's dealDamage appends to this as attacks resolve;
    // AutoBattleView.jsx reads it after the round lands to stage the
    // attacker-lunge animation for exactly this round's hits.
    roundEvents: [],
    // Block resets every round; evadedThisRound resets with it so a Gale
    // unit's one-dodge-per-round (effects.js's Evade) refreshes.
    playerUnits: state.playerUnits.map((u) => (u.hp > 0 ? { ...u, block: 0, evadedThisRound: false } : u)),
  }

  // Poison ticks for both sides at the top of the round, before anyone
  // acts - whoever was poisoned last round pays for it now, same
  // "resolve automatically, no opt-in" shape the Block reset uses.
  next = tickPoison(next, next.playerUnits)
  if (next.phase !== "player") return next
  next = tickPoison(next, next.enemies)
  if (next.phase !== "player") return next

  // Burn (effects.js) - Poison's louder cousin, halves each round
  // instead of decaying by 1. Same top-of-round, both-sides shape.
  next = tickBurn(next, next.playerUnits)
  if (next.phase !== "player") return next
  next = tickBurn(next, next.enemies)
  if (next.phase !== "player") return next

  // Regen (effects.js) - Poison's mirror, same "resolve automatically,
  // decay by 1" shape, healing instead of damaging.
  next = tickRegen(next, next.playerUnits)
  if (next.phase !== "player") return next
  next = tickRegen(next, next.enemies)
  if (next.phase !== "player") return next

  // Ascendant (effects.js) - Cosmic's scaling buff: every holder gains
  // its stack in permanent Strength each round. Applied after the DOT/
  // HOT ticks so a unit that dies to Burn this round doesn't ascend.
  next = tickAscendant(next, next.playerUnits)
  if (next.phase !== "player") return next
  next = tickAscendant(next, next.enemies)
  if (next.phase !== "player") return next

  next = applyRallyHealTick(next)
  if (next.phase !== "player") return next

  next = applyAuraTick(next)
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
    (u) => (u.id === "commander" ? next.commanderDef : effectiveUnitDef(u.defId, u.upgrades || [], next.deployedDefIds || [])),
    (s) => s.enemies,
    "player",
  )
  if (next.phase !== "player") return next

  next = { ...next, enemies: next.enemies.map((e) => (e.hp > 0 ? { ...e, block: 0, evadedThisRound: false } : e)) }
  next = actSide(next, next.enemies, (u) => next.enemyDefs?.[u.defId] || ENEMIES[u.defId], (s) => s.playerUnits, "enemy")
  if (next.phase !== "player") return next

  next = checkBossPhases(next)
  if (next.phase !== "player") return next

  next = checkForestMood(next)
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
    return {
      id: u.id,
      name: u.name,
      damageDealt: s.damageDealt || 0,
      healingDone: s.healingDone || 0,
      biggestHit: s.biggestHit || 0,
    }
  })
  const totalDamage = entries.reduce((sum, e) => sum + e.damageDealt, 0)
  const totalHealing = entries.reduce((sum, e) => sum + e.healingDone, 0)
  const topUnit = entries.reduce(
    (best, e) => (!best || e.damageDealt + e.healingDone > best.damageDealt + best.healingDone ? e : best),
    null,
  )
  // Readability recap (ResultOverlay): the hardest single swing anyone
  // on the squad landed, and the closest the squad came to wiping.
  const hardest = entries.reduce((best, e) => (e.biggestHit > (best?.biggestHit || 0) ? e : best), null)
  const biggestHit = hardest && hardest.biggestHit > 0 ? { name: hardest.name, amount: hardest.biggestHit } : null
  const closestMoment = Math.round(state.lowestSquadHpPct ?? 100)
  return { entries, totalDamage, totalHealing, topUnit, biggestHit, closestMoment }
}
