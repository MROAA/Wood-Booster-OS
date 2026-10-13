// Hearthwood Frontier - CHAOS COMBOS (Mewgenics flavour, fully deterministic).
// Purpose: knockback that MEANS something. A unit knocked back into:
//   lava        -> lands in it: 3 damage + 2 Burn ("Into the lava!")
//   flames      -> lands in it: 2 Burn
//   poison pool -> lands in it: +2 Poison
//   spikes      -> lands on them: 3 damage ("Impaled!")
//   ice         -> keeps sliding 1 more tile
//   deep water  -> a small enemy DROWNS; anyone else splashes: 2 damage + 1 Chill, stays put
//   another unit-> both take 2 impact damage ("Crash!")
//   a barrel / spore pod -> it takes 2 impact and the object EXPLODES
//   a tree      -> it takes 2 impact and the tree FALLS the way it was pushed
//   a boulder   -> it takes 2 impact and the boulder ROLLS on
//   a barricade / ice pillar / board edge -> 2 impact (the object takes 2 too)
// Every step is called out ("Chain x2: Crash!") and a whole chain of 2+
// gets a "Chain reaction xN!" banner. Pure: state in -> state out, so the
// enemy preview dry-runs it exactly. Engine helpers are imported back
// (circular, call-time only - same pattern as tacticsObjects.js).
// Public API: knockback, blockedPushSideEffects, knockbackPreview,
// aiKnockbackRisk, hasKnockTool, CHAOS.
import { isOnBoard, samePos } from "./targeting"
import { TERRAIN, terrainAt } from "./tacticsTerrain"
import { emit, getUnit, setUnit, livingUnits, checkTacticsBattleEnd, checkEnemyPhase, trySpawnBrood } from "./tacticsEngine"
import { OBJECTS, explode, fellTree, rollBoulder, damageObject, hurtUnit } from "./tacticsObjects"
import { applyElement } from "./tacticsElements"
import { immovable } from "./tacticsClasses"

export const CHAOS = {
  impact: 2, // into a unit / object / edge (both sides of a crash)
  lava: 3, // landed in lava
  lavaBurn: 2,
  fireBurn: 2,
  poison: 2,
  spikes: 3,
  splash: 2, // a big unit knocked into deep water
  drownMaxHp: 14, // enemies with at most this max HP drown in deep water
}

const ended = (s) => s.phase === "won" || s.phase === "lost"
const sign = (n) => (n > 0 ? 1 : n < 0 ? -1 : 0)
const addLog = (s, line) => (s.log ? { ...s, log: [...s.log, line] } : s)
const unitAt = (state, pos, exceptId) => state.units.find((u) => u.hp > 0 && u.id !== exceptId && samePos(u.pos, pos))

// Unit-vector direction from `from` to `to` (8 directions), or null.
export function pushDir(from, to) {
  const d = { row: sign(to.row - from.row), col: sign(to.col - from.col) }
  return d.row || d.col ? d : null
}

function stands(u) {
  return !u || u.structure || u.stubborn || immovable(u) || (u.phases?.length || 0) > 0
}

// One numbered callout of the chain.
function step(state, ctx, unitId, label, pos, extra = {}) {
  ctx.n += 1
  const text = ctx.n > 1 ? `Chain x${ctx.n}: ${label}` : label
  return emit(state, { kind: "chaos", unitId, label: text, step: ctx.n, tiles: pos ? [{ row: pos.row, col: pos.col }] : [], ...extra })
}

function impact(state, unitId, amount, why) {
  const u = getUnit(state, unitId)
  if (!u || u.hp <= 0 || ended(state)) return state
  return hurtUnit(state, unitId, amount + (u.clumsy ? 1 : 0), why)
}

// Small enemies drown outright in deep water.
function canDrown(u) {
  return u.side === "enemy" && !u.npc && !(u.phases?.length > 0) && (u.maxHp || 0) <= CHAOS.drownMaxHp
}

function drown(state, unitId) {
  const u = getUnit(state, unitId)
  let next = setUnit(state, unitId, { hp: 0 })
  next = emit(addLog(next, `${u.name} sinks beneath the water and is gone.`), { kind: "damage", targetId: unitId, amount: u.hp, fell: true })
  next = checkEnemyPhase(next, unitId)
  next = trySpawnBrood(next, unitId)
  return checkTacticsBattleEnd(next)
}

// What lies at `dest` for a unit being pushed there.
function blockerAt(state, dest, moverId) {
  if (!isOnBoard(dest, state.grid)) return { kind: "edge" }
  const other = unitAt(state, dest, moverId)
  if (other) return { kind: "unit", unit: other }
  const t = terrainAt(state, dest)
  if (OBJECTS[t]) return { kind: "object", type: t }
  if (t === "wall") return { kind: "wall" }
  if (t === "water") return { kind: "water" }
  if ((TERRAIN[t] || TERRAIN.path).cost === Infinity) return { kind: "wall" }
  return null
}

// The unit couldn't move into `dest`: crash into what is there.
function crash(state, ctx, unitId, dest, dir) {
  const u = getUnit(state, unitId)
  const b = blockerAt(state, dest, unitId)
  if (!u || !b || ended(state)) return state
  let next = state
  if (b.kind === "water") {
    if (canDrown(u)) return drown(step(next, ctx, unitId, "Drowned!", dest), unitId)
    next = step(next, ctx, unitId, "Splash!", dest)
    next = impact(next, unitId, CHAOS.splash, "the cold water")
    return getUnit(next, unitId)?.hp > 0 && !ended(next) ? applyElement(next, unitId, "frost", 1) : next
  }
  if (b.kind === "unit") {
    next = step(next, ctx, unitId, "Crash!", dest)
    next = addLog(next, `${u.name} is slammed into ${b.unit.name}!`)
    next = impact(next, unitId, CHAOS.impact, "the crash")
    return impact(next, b.unit.id, CHAOS.impact, "the crash")
  }
  if (b.kind === "object") {
    next = impact(next, unitId, CHAOS.impact, `the ${OBJECTS[b.type].name.toLowerCase()}`)
    if (ended(next)) return next
    if (OBJECTS[b.type].explosive) return explode(step(next, ctx, unitId, b.type === "barrel" ? "Into the barrel - BOOM!" : "Into the spore pod!", dest), dest)
    if (b.type === "tree") return fellTree(step(next, ctx, unitId, "Timber!", dest), dest, dir)
    if (b.type === "boulder") return rollBoulder(step(next, ctx, unitId, "Boulder away!", dest), dest, getUnit(next, unitId).pos).next
    return damageObject(step(next, ctx, unitId, "Smack!", dest), dest, CHAOS.impact, dir)
  }
  next = step(next, ctx, unitId, b.kind === "edge" ? "Thud!" : "Smack!", dest)
  next = impact(next, unitId, CHAOS.impact, b.kind === "edge" ? "the hard ground" : "the wall")
  if (b.kind === "wall" && isOnBoard(dest, next.grid) && terrainAt(next, dest) === "wall" && !ended(next)) next = damageObject(next, dest, CHAOS.impact, dir)
  return next
}

// The unit just landed on `pos`: hazards take hold. Returns { next, stop, slide }.
function land(state, ctx, unitId, pos) {
  const t = terrainAt(state, pos)
  if (t === "lava") {
    let next = step(state, ctx, unitId, "Into the lava!", pos)
    next = impact(next, unitId, CHAOS.lava, "the lava")
    if (getUnit(next, unitId)?.hp > 0 && !ended(next)) next = applyElement(next, unitId, "fire", CHAOS.lavaBurn)
    return { next, stop: true }
  }
  if (t === "fire") return { next: applyElement(step(state, ctx, unitId, "Into the flames!", pos), unitId, "fire", CHAOS.fireBurn), stop: true }
  if (t === "poison") {
    const next = step(state, ctx, unitId, "Into the poison!", pos)
    return { next: setUnit(next, unitId, { poison: (getUnit(next, unitId).poison || 0) + CHAOS.poison }), stop: true }
  }
  if (t === "spikes") return { next: impact(step(state, ctx, unitId, "Impaled!", pos), unitId, CHAOS.spikes, "the spikes"), stop: true }
  if (t === "ice") return { next: state, stop: false, slide: true }
  return { next: state, stop: false }
}

// Knock `targetId` `tiles` tiles along `dir` (a unit vector). Stops at the
// first hazard / blocker. `actorId` is only for the log. Deterministic.
export function knockback(state, actorId, targetId, dir, tiles = 1) {
  const t0 = getUnit(state, targetId)
  if (!t0 || t0.hp <= 0 || !dir || ended(state)) return state
  if (stands(t0)) return emit(state, { kind: "reaction", unitId: targetId, label: "Stands firm!" })
  const seq0 = state.eventSeq || 0
  const ctx = { n: 0 }
  let next = state
  let left = tiles
  let slid = false
  while (left > 0 && !ended(next)) {
    const u = getUnit(next, targetId)
    if (!u || u.hp <= 0) break
    const dest = { row: u.pos.row + dir.row, col: u.pos.col + dir.col }
    if (blockerAt(next, dest, targetId)) {
      next = crash(next, ctx, targetId, dest, dir)
      break
    }
    next = setUnit(next, targetId, { pos: dest })
    if (ctx.n === 0 && left === tiles) next = emit(next, { kind: "reaction", unitId: targetId, label: "Knocked back!" })
    left -= 1
    const r = land(next, ctx, targetId, dest)
    next = r.next
    if (r.stop) break
    if (r.slide && left === 0 && !slid) {
      slid = true
      left = 1
    }
  }
  // A real chain (2+ things happened): one big banner + a log line.
  const chain = (next.events || []).filter((e) => e.seq > seq0 && (e.kind === "chaos" || (e.kind === "object" && ["boom", "spore", "fall", "roll", "shatter", "grassfire"].includes(e.fx)))).length
  if (chain >= 2) next = emit(addLog(next, `Chain reaction x${chain}!`), { kind: "chaos", unitId: targetId, label: `Chain reaction x${chain}!`, chain, big: true, tiles: [] })
  return checkTacticsBattleEnd(next)
}

// The signature Shove keeps its own "slams into it" bonus damage on the
// TARGET when the tile behind is blocked; this adds the world's side of
// the crash (the other unit takes impact, barrels blow, trees fall, small
// enemies drown in deep water).
export function blockedPushSideEffects(state, targetId, dest, dir) {
  const u = getUnit(state, targetId)
  if (!u || u.hp <= 0 || ended(state) || stands(u)) return state
  const b = blockerAt(state, dest, targetId)
  if (!b || b.kind === "edge" || b.kind === "wall") return state
  if (b.kind === "object" && b.type === "boulder") return state // the engine already rolls it
  const ctx = { n: 0 }
  if (b.kind === "water") return canDrown(u) ? drown(step(state, ctx, targetId, "Drowned!", dest), targetId) : applyElement(step(state, ctx, targetId, "Splash!", dest), targetId, "frost", 1)
  if (b.kind === "unit") return impact(addLog(step(state, ctx, targetId, "Crash!", dest), `${u.name} is slammed into ${b.unit.name}!`), b.unit.id, CHAOS.impact, "the crash")
  if (OBJECTS[b.type]?.explosive) return explode(step(state, ctx, targetId, b.type === "barrel" ? "Into the barrel - BOOM!" : "Into the spore pod!", dest), dest)
  if (b.type === "tree") return fellTree(step(state, ctx, targetId, "Timber!", dest), dest, dir)
  return damageObject(step(state, ctx, targetId, "Smack!", dest), dest, CHAOS.impact, dir)
}

// --- AI ----------------------------------------------------------------------------

// Net HP swing of a knockback for `side` (+ = good for that side): damage
// dealt to the other side minus damage to its own, kills weigh extra.
// Damage-over-time it inflicted counts too (Burn 1.5 each, Poison 1, Chill 2).
export function knockbackPreview(state, actorId, targetId, dir, tiles, side) {
  const before = new Map(state.units.map((u) => [u.id, u]))
  const after = knockback(state, actorId, targetId, dir, tiles)
  let value = 0
  for (const u of after.units) {
    const was = before.get(u.id)
    if (!was) continue
    const lost = Math.max(0, was.hp - Math.max(0, u.hp))
    const dot = 1.5 * Math.max(0, (u.burn || 0) - (was.burn || 0)) + Math.max(0, (u.poison || 0) - (was.poison || 0)) + 2 * Math.max(0, (u.chill || 0) - (was.chill || 0))
    if (!lost && !dot) continue
    const sign2 = u.side === side ? -1 : 1
    value += sign2 * (lost + dot + (u.hp <= 0 && was.hp > 0 ? 25 : 0))
  }
  return value
}

// Does this player unit carry a knockback tool (Shove signature, Shoulder
// Check, a promotion knock skill)?
export function hasKnockTool(u) {
  if (!u || u.hp <= 0) return false
  if (u.ability?.kind === "push") return true
  return (u.classSkills || []).some((s) => s.id === "shoulder-check" || (s.promo && s.kind === "knock"))
}

const RISK = { lava: 12, fire: 7, poison: 6, spikes: 8, unit: 3, barrel: 10, sporepod: 8, tree: 4, water: 6, drown: 40 }

// Tile penalty for an enemy standing on `pos`: the worst place a player
// knocker that can reach it next turn could push it into.
export function aiKnockbackRisk(state, enemy, pos) {
  if (stands(enemy)) return 0
  const knockers = livingUnits(state, "player").filter(hasKnockTool)
  if (!knockers.length) return 0
  let worst = 0
  for (const k of knockers) {
    const d = Math.max(Math.abs(k.pos.row - pos.row), Math.abs(k.pos.col - pos.col))
    if (d === 0 || d > (k.move || 0) + 1) continue
    const dir = pushDir(k.pos, pos)
    const dest = { row: pos.row + dir.row, col: pos.col + dir.col }
    let risk = 0
    if (isOnBoard(dest, state.grid)) {
      const other = unitAt(state, dest, enemy.id)
      const t = terrainAt(state, dest)
      if (other && other.side === "enemy") risk = RISK.unit
      else if (t === "water") risk = canDrown(enemy) ? RISK.drown : RISK.water
      else risk = RISK[t] || 0
    }
    if (risk > worst) worst = risk
  }
  return worst
}
