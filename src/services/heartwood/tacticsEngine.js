// Hearthwood Frontier (feat/hearthwood-tactics-prototype) - Phase 1 of the
// turn-based pivot Marc chose over the shipping auto-battler ("uusi moottori
// korvaa vanhan"). Fully isolated: no import from autoBattleEngine.js,
// effects.js, or runEngine.js, no localStorage, no save state. The one thing
// it shares with the live game is DATA - real UNITS/ENEMIES defs, read-only,
// converted into a turn-based shape ("kaytetaan olemassaolevia mekaniikkoja
// ja muutetaan tarvittavat uuteen muottiin" - use the existing mechanics,
// convert what needs it into the new mold) rather than hand-authored
// placeholder numbers.
//
// Same "state in, state out" discipline as autoBattleEngine.js: every
// function takes a TacticsState and returns a new one via { ...state, ... },
// nothing here mutates its argument.
//
// TacticsState = {
//   grid: { rows, cols },
//   units: [{ id, side: "player"|"enemy", defId, name, art, image,
//              pos: {row, col}, hp, maxHp, move, range, attack,
//              ap, apMax, block, ability: {id,name,cost,kind,cooldown,...}|null,
//              cooldownRemaining }],
//   phase: "player" | "enemy" | "won" | "lost",
//   turn: number,
//   log: string[],
//   formationId: "default" | "swarm" | "fortress",
// }

import { UNITS } from "../../data/heartwood/units"
import { ENEMIES } from "../../data/heartwood/enemies"
import { isOnBoard, samePos, kingAdjacent, reachableTiles as reachableTilesRaw } from "./targeting"

export const GRID = { rows: 5, cols: 7 }

// Phase 2 ("jatketaan" -> "AP + one real ability per unit"). Every unit now
// spends a shared Action Point budget instead of the old free "one move +
// one attack" pair - apMax 2, the PRD's own example number. Move/Attack/
// Ability each cost AP, so a unit does at most two of those per turn - the
// first genuine "what do I spend this on" decision, which is the whole
// point of the pivot.
const AP_MAX = 2

// The 3 player abilities, converted from each unit's REAL existing kit
// (Marc: "kaytetaan olemassaolevia mekaniikkoja ja muutetaan tarvittavat
// uuteen muottiin") rather than invented from nothing:
//  - bulwark-of-ages already has `aura: { effect: { type:"block", amount:2 } }`
//    (autoBattleEngine.js's applyAuraTick) -> Bulwark Aura grants Block to
//    itself + adjacent allies.
//  - the-fool already has `passive: [{ applyBuff regen 2 }]` -> Regrowth
//    heals itself or an adjacent ally.
//  - hexbreaker is a plain attacker whose real identity is reach ->
//    Focused Shot is a costly (its whole turn), high-damage single hit.
// Enemies get no ability this round (`ability: null`) - no scope creep.
//
// `cooldown` (added this round) - how many of the unit's OWN turns must
// pass after a cast before it's usable again. Ticks down once per player
// turn (see runEnemyTurn's player-phase-return reset), so `cooldown: 2`
// reads as "usable every OTHER turn" - cast on turn N, still cooling on
// N+1, ready again on N+2. Focused Shot (the biggest single payoff) gets
// the longest wait.
const ABILITIES = {
  "bulwark-of-ages": { id: "aura-block", name: "Bulwark Aura", cost: 1, kind: "aura-block", amount: 2, cooldown: 2 },
  "the-fool": { id: "regrowth", name: "Regrowth", cost: 1, kind: "heal", amount: 5, cooldown: 2 },
  hexbreaker: { id: "focused-shot", name: "Focused Shot", cost: 2, kind: "burst", multiplier: 2, cooldown: 3 },
}

// The player roster (real names/art/HP; move/range/attack are DERIVED below
// from the unit's actual movePattern/attackPattern, not invented). Player
// always starts at the right edge, rows 1/2/3, col 6 - unaffected by which
// enemy formation is chosen below.
const PLAYER_DEF_IDS = ["bulwark-of-ages", "the-fool", "hexbreaker"]
const START_ROWS = [1, 2, 3]

// Phase 3's first slice ("jatketaan" -> "1-2 more enemy archetypes"): two
// of the 9 shipped auto-battler archetypes, ported with their REAL ids/HP/
// attack/synergy numbers (read directly from formations.js/enemies.js, not
// guessed) rather than invented ones - the same "kaytetaan olemassaolevia
// mekaniikkoja" discipline as every prior Frontier round.
//  - swarm ("the-brood", formations.js) - 4 bodies, synergy "Strength in
//    numbers" = a FLAT, ONE-TIME +1 Strength to every piece at battle
//    start (explicitly not a per-round ramp in the shipped mechanic - a
//    compounding version was found archetype-hostile and flattened).
//    Outnumbers the player 4-to-3, the archetype's whole identity.
//  - fortress ("the-bulwark", formations.js) - 3 very tough bodies,
//    synergy "The wall holds firm" = a flat +3 Block every round (granted
//    at the start of each enemy phase - see endPlayerTurn - so it's live
//    to absorb the player's NEXT attacks; Block already resets to 0 for
//    every other reason in this engine, so a flat overwrite each enemy
//    phase already IS "resets then re-applies", matching the real
//    mechanic with no extra reset step needed).
// Known simplification: Mossmender's real kit also self-heals - enemy
// abilities are still out of scope (Phase 2's call), so that part of the
// archetype isn't reproduced yet. Its HP/Block carry over faithfully.
export const ENEMY_FORMATIONS = {
  default: {
    id: "default",
    name: "The Frontier Test Squad",
    description: "The roster this Frontier opened with - a wall, a claw, and a hoard.",
    enemyDefIds: ["ironmaw", "sapling-attendant", "hoardling"],
    rows: [1, 2, 3],
    swarmBonus: false,
    fortressBlock: 0,
  },
  swarm: {
    id: "swarm",
    name: "The Brood",
    description: "Not one thing to fight. A dozen small ones, and every one of them is still a mouth.",
    enemyDefIds: ["sporelet", "mire-gnat", "sporelet", "mire-gnat"],
    rows: [0, 1, 2, 3],
    swarmBonus: true,
    fortressBlock: 0,
  },
  fortress: {
    id: "fortress",
    name: "The Bulwark",
    description: "Two wardens shoulder to shoulder, and a mender behind them stitching every crack shut before you can widen it.",
    enemyDefIds: ["oakshell-warden", "oakshell-warden", "mossmender"],
    rows: [1, 2, 3],
    swarmBonus: false,
    fortressBlock: 3,
  },
}

// Reads the def's own already-authored movePattern for its attack amount
// (averaged if it swings more than once) - the same numbers the auto-
// battler already uses, not a fresh guess. A pure-support kit with no
// attack step (rare) falls back to a token 3.
function attackFromMovePattern(movePattern) {
  const steps = (movePattern || []).filter((m) => m.type === "attack")
  if (!steps.length) return 3
  return Math.round(steps.reduce((sum, m) => sum + (m.amount || 0), 0) / steps.length)
}

// A pattern attacker (rook/bishop/knight - the auto-battler's existing
// "hits past the front line" mechanic) converts into "has real reach" here;
// everyone else is melee range 1. The exact number (3) is a placeholder
// conversion rule for this prototype, not a final one - Phase 3 (wiring the
// real roster in) is where this gets a considered pass.
function rangeFromAttackPattern(attackPattern) {
  return attackPattern && attackPattern !== "single" ? 3 : 1
}

// No `move` stat exists anywhere in the live data (there is no movement in
// an auto-battle) - this is the one genuinely new number Phase 1 adds, and
// it's still derived from an existing signal (how tanky the piece is)
// rather than picked per-unit by hand: heavier bodies plant themselves,
// lighter ones cover ground.
function moveFromMaxHp(maxHp) {
  return maxHp >= 40 ? 2 : 3
}

// `uid` is an explicit, caller-supplied unique id - required now that a
// formation can repeat a defId (the Swarm fields 2 Sporelets, the
// Fortress fields 2 Oakshell Wardens); deriving an id from `defId` alone
// would collide two enemies onto the same id and corrupt every id-keyed
// lookup (getUnit/setUnit, React key/layoutId).
function deriveTacticsUnit(defId, side, pos, uid) {
  const def = side === "enemy" ? ENEMIES[defId] : UNITS[defId]
  const maxHp = def.maxHp
  return {
    id: uid,
    side,
    defId,
    name: def.name,
    art: def.art,
    image: def.image || null,
    pos,
    hp: maxHp,
    maxHp,
    move: moveFromMaxHp(maxHp),
    range: rangeFromAttackPattern(def.attackPattern),
    attack: attackFromMovePattern(def.movePattern),
    ap: AP_MAX,
    apMax: AP_MAX,
    block: 0,
    ability: side === "player" ? ABILITIES[defId] || null : null,
    cooldownRemaining: 0,
  }
}

export function createTacticsBattle(formationId = "default") {
  const formation = ENEMY_FORMATIONS[formationId] || ENEMY_FORMATIONS.default
  const units = [
    ...PLAYER_DEF_IDS.map((defId, i) =>
      deriveTacticsUnit(defId, "player", { row: START_ROWS[i], col: GRID.cols - 1 }, `player-${defId}-${i}`),
    ),
    ...formation.enemyDefIds.map((defId, i) =>
      deriveTacticsUnit(defId, "enemy", { row: formation.rows[i], col: 0 }, `enemy-${defId}-${i}`),
    ),
  ]
  // Swarm's real synergy: a FLAT, one-time +1 Strength to every piece at
  // battle start - not multiplied by headcount, matching the shipped
  // mechanic precisely (the aggregate effect scales with body count, the
  // per-unit grant does not).
  const withSwarmBonus = formation.swarmBonus
    ? units.map((u) => (u.side === "enemy" ? { ...u, attack: u.attack + 1 } : u))
    : units
  return {
    grid: GRID,
    units: withSwarmBonus,
    phase: "player",
    turn: 1,
    log: [`${formation.name}. The Frontier opens. Your turn.`],
    formationId: formation.id,
  }
}

function getUnit(state, id) {
  return state.units.find((u) => u.id === id)
}

function setUnit(state, id, patch) {
  return { ...state, units: state.units.map((u) => (u.id === id ? { ...u, ...patch } : u)) }
}

function livingUnits(state, side) {
  return state.units.filter((u) => u.side === side && u.hp > 0)
}

function chebyshevDist(a, b) {
  return Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col))
}

// Reachable tiles for a unit right now: the grid's own BFS, blocked by
// every OTHER living piece on the board (either side - you can't walk
// through anyone).
export function reachableTilesFor(state, unitId) {
  const unit = getUnit(state, unitId)
  if (!unit || unit.hp <= 0) return []
  const occupied = state.units.filter((u) => u.id !== unitId && u.hp > 0).map((u) => u.pos)
  return reachableTilesRaw(occupied, unit.pos, unit.move, state.grid)
}

// Enemies (or allies) within the unit's range of its CURRENT tile - a
// prototype-simple range check (Chebyshev, same metric kingAdjacent uses
// for its single-step case), not yet a real line-of-sight system.
export function attackableTargets(state, unitId) {
  const unit = getUnit(state, unitId)
  if (!unit || unit.hp <= 0) return []
  return state.units.filter(
    (u) => u.side !== unit.side && u.hp > 0 && chebyshevDist(unit.pos, u.pos) <= unit.range,
  )
}

function checkTacticsBattleEnd(state) {
  if (state.phase === "won" || state.phase === "lost") return state
  if (livingUnits(state, "enemy").length === 0) return { ...state, phase: "won", log: [...state.log, "Every enemy has fallen. Victory."] }
  if (livingUnits(state, "player").length === 0) return { ...state, phase: "lost", log: [...state.log, "The squad has fallen."] }
  return state
}

export function moveUnit(state, unitId, targetPos) {
  const unit = getUnit(state, unitId)
  if (!unit || unit.hp <= 0 || unit.ap < 1) return state
  if (state.phase !== unit.side) return state
  if (!isOnBoard(targetPos, state.grid)) return state
  const legal = reachableTilesFor(state, unitId)
  if (!legal.some((p) => samePos(p, targetPos))) return state
  return setUnit(state, unitId, { pos: targetPos, ap: unit.ap - 1 })
}

// Reuses the live game's own Block model (effects.js's dealDamage: absorb
// then deplete) rather than inventing a new mitigation shape.
function applyDamageWithBlock(state, targetId, amount) {
  const target = getUnit(state, targetId)
  const absorbed = Math.min(target.block, amount)
  const remaining = amount - absorbed
  const nextHp = Math.max(0, target.hp - remaining)
  const next = setUnit(state, targetId, { block: target.block - absorbed, hp: nextHp })
  return { next, absorbed, remaining, fell: nextHp <= 0 }
}

export function attackUnit(state, actorId, targetId) {
  const actor = getUnit(state, actorId)
  const target = getUnit(state, targetId)
  if (!actor || !target || actor.hp <= 0 || target.hp <= 0 || actor.ap < 1) return state
  if (state.phase !== actor.side || actor.side === target.side) return state
  if (chebyshevDist(actor.pos, target.pos) > actor.range) return state
  let next = setUnit(state, actorId, { ap: actor.ap - 1 })
  const { next: hit, absorbed, remaining, fell } = applyDamageWithBlock(next, targetId, actor.attack)
  next = hit
  const absorbedNote = absorbed > 0 ? ` (absorbed ${absorbed})` : ""
  const fellNote = fell ? " It falls." : ""
  next = { ...next, log: [...next.log, `${actor.name} strikes ${target.name} for ${remaining}.${absorbedNote}${fellNote}`] }
  return checkTacticsBattleEnd(next)
}

// castAbility(state, actorId, targetId?) - the 3 kinds of ability an
// acting player unit can spend AP on instead of a plain Move/Attack.
export function castAbility(state, actorId, targetId) {
  const actor = getUnit(state, actorId)
  if (!actor || actor.hp <= 0 || !actor.ability) return state
  if (state.phase !== actor.side) return state
  const ability = actor.ability
  if (actor.ap < ability.cost || actor.cooldownRemaining > 0) return state

  if (ability.kind === "aura-block") {
    let next = setUnit(state, actorId, { ap: actor.ap - ability.cost, cooldownRemaining: ability.cooldown })
    const recipients = state.units.filter(
      (u) => u.hp > 0 && u.side === actor.side && (u.id === actorId || kingAdjacent(u.pos, actor.pos)),
    )
    for (const u of recipients) {
      const live = getUnit(next, u.id)
      next = setUnit(next, u.id, { block: live.block + ability.amount })
    }
    return { ...next, log: [...next.log, `${actor.name} raises ${ability.name}.`] }
  }

  if (ability.kind === "heal") {
    const target = getUnit(state, targetId)
    if (!target || target.hp <= 0 || target.side !== actor.side) return state
    if (target.id !== actorId && !kingAdjacent(target.pos, actor.pos)) return state
    let next = setUnit(state, actorId, { ap: actor.ap - ability.cost, cooldownRemaining: ability.cooldown })
    const live = getUnit(next, target.id)
    const healedHp = Math.min(live.maxHp, live.hp + ability.amount)
    next = setUnit(next, target.id, { hp: healedHp })
    return { ...next, log: [...next.log, `${actor.name} mends ${target.name} for ${healedHp - live.hp}.`] }
  }

  if (ability.kind === "burst") {
    const target = getUnit(state, targetId)
    if (!target || target.hp <= 0 || target.side === actor.side) return state
    if (chebyshevDist(actor.pos, target.pos) > actor.range) return state
    let next = setUnit(state, actorId, { ap: actor.ap - ability.cost, cooldownRemaining: ability.cooldown })
    const amount = actor.attack * ability.multiplier
    const { next: hit, absorbed, remaining, fell } = applyDamageWithBlock(next, target.id, amount)
    next = hit
    const absorbedNote = absorbed > 0 ? ` (absorbed ${absorbed})` : ""
    const fellNote = fell ? " It falls." : ""
    next = { ...next, log: [...next.log, `${actor.name} unleashes ${ability.name} on ${target.name} for ${remaining}!${absorbedNote}${fellNote}`] }
    return checkTacticsBattleEnd(next)
  }

  return state
}

export function endPlayerTurn(state) {
  if (state.phase !== "player") return state
  // Enemy AP resets here (symmetry/future-proofing - enemies still just
  // move/attack every turn this round, so this is mostly inert today).
  // The Fortress's real synergy ("The wall holds firm" - a flat +3 Block
  // every round) is granted here too: this is the start of the enemy's
  // own round, so the Block is live to absorb the PLAYER's attacks on
  // their NEXT turn. Nothing else ever grants enemy Block, so a flat
  // overwrite to the formation's fixed amount already IS "resets then
  // re-applies this round's grant" - the real mechanic, no separate reset.
  const fortressBlock = ENEMY_FORMATIONS[state.formationId]?.fortressBlock || 0
  const next = {
    ...state,
    phase: "enemy",
    units: state.units.map((u) => (u.side === "enemy" ? { ...u, ap: u.apMax, block: fortressBlock } : u)),
    log: [...state.log, "Enemy turn."],
  }
  return runEnemyTurn(next)
}

// A deliberately simple scripted AI (Phase 1's job is proving the PLAYER's
// turn feels good, not shipping a clever opponent): if a living player unit
// is already in range, attack the weakest one in range; otherwise step
// toward the nearest living player unit and re-check range from the new
// tile. One decision per enemy, in roster order.
//
// Split into a pure decision (decideEnemyIntent) and a mutation that acts
// on that decision (applyEnemyIntent) so BOTH the real enemy turn AND the
// player-facing intent telegraph (previewEnemyIntents, below) run through
// the exact same logic - there is no second "what will the enemy do" model
// that could drift out of sync with what actually happens.
function decideEnemyIntent(state, enemyId) {
  const enemy = getUnit(state, enemyId)
  if (!enemy || enemy.hp <= 0) return { kind: "hold" }

  const inRange = attackableTargets(state, enemyId)
  if (inRange.length) {
    const weakest = inRange.reduce((w, u) => (u.hp < w.hp ? u : w), inRange[0])
    return { kind: "attack", targetId: weakest.id }
  }

  const targets = livingUnits(state, "player")
  if (!targets.length) return { kind: "hold" }
  const options = [enemy.pos, ...reachableTilesFor(state, enemyId)]
  const nearestDistFrom = (pos) => Math.min(...targets.map((t) => chebyshevDist(pos, t.pos)))
  const best = options.reduce((w, pos) => (nearestDistFrom(pos) < nearestDistFrom(w) ? pos : w), options[0])
  if (samePos(best, enemy.pos)) return { kind: "hold" }

  // What WOULD be in range from `best`, without actually moving there -
  // a hypothetical read, same Chebyshev check attackableTargets uses.
  const afterMove = state.units.filter(
    (u) => u.side !== enemy.side && u.hp > 0 && chebyshevDist(best, u.pos) <= enemy.range,
  )
  if (afterMove.length) {
    const weakest = afterMove.reduce((w, u) => (u.hp < w.hp ? u : w), afterMove[0])
    return { kind: "move-attack", to: best, targetId: weakest.id }
  }
  return { kind: "move", to: best }
}

function applyEnemyIntent(state, enemyId, intent) {
  if (intent.kind === "attack") return attackUnit(state, enemyId, intent.targetId)
  if (intent.kind === "move") return moveUnit(state, enemyId, intent.to)
  if (intent.kind === "move-attack") {
    const moved = moveUnit(state, enemyId, intent.to)
    return attackUnit(moved, enemyId, intent.targetId)
  }
  return state
}

function decideAndActEnemy(state, enemyId) {
  return applyEnemyIntent(state, enemyId, decideEnemyIntent(state, enemyId))
}

// The player-facing telegraph: what every living enemy currently intends,
// computed by dry-running the exact same decide-then-apply pipeline
// runEnemyTurn uses, on a scratch copy of the state - never the real one.
// Each enemy's decision runs against the OUTCOME of every earlier enemy's
// (also-hypothetical) action, so a later enemy's shown intent already
// accounts for an earlier one's telegraphed kill or repositioning - this
// is what makes the read trustworthy for a 2+-enemy turn, not just the
// first actor. Called fresh every render during the player's phase; never
// persisted, so it can never go stale.
//
// The scratch copy's phase is forced to "enemy" for the run (discarded
// with the rest of scratch when this returns) - moveUnit/attackUnit both
// gate on `state.phase === unit.side`, so a scratch left at "player" would
// silently refuse every hypothetical enemy action, degrading this into
// independent per-enemy reads instead of a real sequential preview.
export function previewEnemyIntents(state) {
  let scratch = { ...state, phase: "enemy" }
  const intents = []
  for (const enemy of state.units.filter((u) => u.side === "enemy" && u.hp > 0)) {
    if (scratch.phase !== "enemy") break
    const intent = decideEnemyIntent(scratch, enemy.id)
    intents.push({ enemyId: enemy.id, intent })
    scratch = applyEnemyIntent(scratch, enemy.id, intent)
  }
  return intents
}

export function runEnemyTurn(state) {
  let next = state
  for (const enemy of state.units.filter((u) => u.side === "enemy" && u.hp > 0)) {
    if (next.phase !== "enemy") break
    next = decideAndActEnemy(next, enemy.id)
  }
  if (next.phase !== "enemy") return next
  // Player AP AND Block reset exactly here - Block granted during a player
  // turn must survive through the FOLLOWING enemy turn (that's when it
  // protects against incoming hits) and only fades once it's the player's
  // turn again. Re-scopes the live game's "resets every round" rule from
  // "every round" to "every time it's this side's turn again." Cooldowns
  // count down at this SAME checkpoint - once per the player's own turn
  // coming back around, so a cooldown of 2 plays out as "usable every
  // other turn" (cast on turn N, still cooling on N+1, ready on N+2).
  return {
    ...next,
    phase: "player",
    turn: next.turn + 1,
    units: next.units.map((u) =>
      u.side === "player" ? { ...u, ap: u.apMax, block: 0, cooldownRemaining: Math.max(0, u.cooldownRemaining - 1) } : u,
    ),
    log: [...next.log, `Turn ${next.turn + 1}. Your turn.`],
  }
}

// A QA-only hook (see HeartwoodTactics.jsx's ?debugLowHp=1) - never a real
// feature, just lets a verification pass or a quick manual check reach a
// win/loss without grinding real attack rounds first.
export function withLowEnemyHp(state) {
  return { ...state, units: state.units.map((u) => (u.side === "enemy" ? { ...u, hp: 1, maxHp: u.maxHp } : u)) }
}
