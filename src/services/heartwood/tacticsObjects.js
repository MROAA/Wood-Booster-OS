// Hearthwood Frontier - destructible battlefield objects.
// Objects are terrain types (tacticsTerrain.js TERRAIN, `obj: true`, cost
// Infinity) so blocking/pathing/templates need no special case. What they
// DO lives here: HP, trees falling / burning / spreading fire, barrels and
// spore pods exploding, boulders rolling, ice pillars shattering.
// Barricades (`wall`, HP in state.wallHp) stay as they were and share the
// same attack path. Pure + deterministic (state in, state out); engine
// helpers are imported back (circular, call-time only - like tacticsElements).
//
// State: objHp { key: hp } (missing = full), objFire { key: turnsLeft }
// (burning trees), objChill { key: 1 } (chilled ice pillars),
// tileTimers { key: { turns, revert } } (fire/poison tiles that fade).
import { isOnBoard, samePos, kingAdjacent } from "./targeting"
import { TERRAIN, terrainAt, WALL_MAX_HP } from "./tacticsTerrain"
import { coverAgainst } from "./tacticsCover"
import { emit, getUnit, setUnit, applyDamageWithBlock, checkTacticsBattleEnd, checkEnemyPhase, trySpawnBrood } from "./tacticsEngine"
import { applyElement, abilityElement } from "./tacticsElements"

export const OBJECTS = {
  tree: { name: "Tree", hp: 6, icon: "🌲" },
  barrel: { name: "Powder barrel", hp: 1, icon: "🛢", explosive: "fire" },
  sporepod: { name: "Spore pod", hp: 1, icon: "🍄", explosive: "poison" },
  boulder: { name: "Boulder", hp: 12, icon: "🪨" },
  icepillar: { name: "Ice pillar", hp: 6, icon: "🧊" },
}
export const TREE_FALL_DAMAGE = 4
export const TREE_BURN_TURNS = 2
export const FIRE_ADJ_DAMAGE = 1
export const BARREL_DAMAGE = 4
export const SPORE_DAMAGE = 3
export const BOULDER_DAMAGE = 5
export const SHATTER_DAMAGE = 3
export const FIRE_TILE_TURNS = 2
export const POISON_TILE_TURNS = 3

const ORTHO = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
]
const k = (p) => `${p.row}-${p.col}`
const sign = (n) => (n > 0 ? 1 : n < 0 ? -1 : 0)
const cheb = (a, b) => Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col))
const ended = (s) => s.phase === "won" || s.phase === "lost"
const addLog = (s, line) => (s.log ? { ...s, log: [...s.log, line] } : s)
const fromKey = (key) => {
  const [row, col] = key.split("-").map(Number)
  return { row, col }
}

export function objectAt(state, pos) {
  const t = terrainAt(state, pos)
  return OBJECTS[t] ? t : null
}
export function isObjectTerrain(t) {
  return !!OBJECTS[t]
}
// Anything a unit can swing at: an object or a barricade.
export function isAttackableTile(t) {
  return t === "wall" || !!OBJECTS[t]
}
export function objectMaxHp(type) {
  return type === "wall" ? WALL_MAX_HP : OBJECTS[type]?.hp || 0
}
export function objectHpAt(state, pos) {
  const type = terrainAt(state, pos)
  if (type === "wall") return state.wallHp?.[k(pos)] ?? WALL_MAX_HP
  return state.objHp?.[k(pos)] ?? objectMaxHp(type)
}
export function isBurning(state, pos) {
  return (state.objFire?.[k(pos)] || 0) > 0
}
export function isChilled(state, pos) {
  return !!state.objChill?.[k(pos)]
}
export function hasObjects(state) {
  return Object.values(state.terrain || {}).some((t) => OBJECTS[t] || t === "fire")
}

// --- small state helpers -------------------------------------------------------
function setTile(state, pos, type) {
  const key = k(pos)
  const terrain = { ...(state.terrain || {}) }
  if (!type || type === "path") delete terrain[key]
  else terrain[key] = type
  const objHp = { ...(state.objHp || {}) }
  const objFire = { ...(state.objFire || {}) }
  const objChill = { ...(state.objChill || {}) }
  delete objHp[key]
  delete objFire[key]
  delete objChill[key]
  return { ...state, terrain, objHp, objFire, objChill }
}

function objEvent(state, fx, pos, label, extra = {}) {
  return emit(state, { kind: "object", fx, pos: { row: pos.row, col: pos.col }, label, ...extra })
}

function unitAt(state, pos) {
  return state.units.find((u) => u.hp > 0 && samePos(u.pos, pos))
}

// Flat hit on a unit (Block soaks it), with the usual fall bookkeeping.
function hurt(state, unitId, amount, why) {
  const t = getUnit(state, unitId)
  if (!t || t.hp <= 0 || ended(state) || amount <= 0) return state
  const r = applyDamageWithBlock(state, unitId, amount)
  let next = addLog(r.next, `${t.name} is hit by ${why} for ${r.remaining}.${r.fell ? " It falls." : ""}`)
  next = checkEnemyPhase(next, unitId)
  if (r.fell) next = trySpawnBrood(next, unitId)
  return next
}

// A timed tile (fire/poison) that reverts to what was under it.
function timedTile(state, pos, type, turns) {
  const key = k(pos)
  const was = state.terrain?.[key] || "path"
  const rule = TERRAIN[was] || TERRAIN.path
  if (rule.cost === Infinity || was === "bridge" || was === "lava") return state
  const prev = state.tileTimers?.[key]
  const revert = prev ? prev.revert : was
  const next = setTile(state, pos, type)
  return { ...next, tileTimers: { ...(next.tileTimers || {}), [key]: { turns, revert } } }
}

// --- damage / destruction ----------------------------------------------------------
// Any source hitting an object tile. dir = travel direction (for tree falls).
export function damageObject(state, pos, amount, dir = null, opts = {}) {
  if (!isOnBoard(pos, state.grid) || ended(state)) return state
  const type = terrainAt(state, pos)
  const key = k(pos)
  if (type === "wall") {
    const hp = Math.max(0, objectHpAt(state, pos) - amount)
    const wallHp = { ...(state.wallHp || {}) }
    if (hp <= 0) {
      delete wallHp[key]
      return addLog(setTile({ ...state, wallHp }, pos, "rubble"), "The barricade is smashed to rubble!")
    }
    // (the board's own barricade diff shows the numbers)
    return { ...state, wallHp: { ...wallHp, [key]: hp } }
  }
  const def = OBJECTS[type]
  if (!def) return state
  if (def.explosive) return explode(state, pos)
  if (type === "icepillar" && isChilled(state, pos)) return shatterPillar(state, pos)
  const hp = Math.max(0, objectHpAt(state, pos) - amount)
  if (hp <= 0) {
    if (type === "tree") return fellTree(state, pos, dir)
    if (type === "icepillar") return shatterPillar(state, pos)
    return objEvent(addLog(setTile(state, pos, "rubble"), `The ${def.name.toLowerCase()} cracks apart.`), "break", pos, "Crumbles!")
  }
  let next = objEvent({ ...state, objHp: { ...(state.objHp || {}), [key]: hp } }, "hit", pos, `-${amount}`)
  if (type === "tree" && opts.fire) next = igniteTree(next, pos)
  if (type === "icepillar" && opts.frost) next = chillPillar(next, pos)
  return next
}

// Timber! The tree topples along `dir`, hitting the next 2 tiles; a
// fallen log is left where it lands, a stump where it stood.
export function fellTree(state, pos, dir) {
  const d = dir && (dir.row || dir.col) ? { row: sign(dir.row), col: sign(dir.col) } : { row: 0, col: -1 }
  let next = addLog(setTile(state, pos, "stump"), `Timber! The tree comes crashing down.`)
  const tiles = []
  for (let i = 1; i <= 2; i++) {
    const p = { row: pos.row + d.row * i, col: pos.col + d.col * i }
    if (!isOnBoard(p, next.grid)) break
    tiles.push(p)
  }
  next = objEvent(next, "fall", pos, "Timber!", { dir: d, tiles: [pos, ...tiles] })
  for (const p of tiles) {
    if (ended(next)) break
    const t = terrainAt(next, p)
    const u = unitAt(next, p)
    if (u) next = hurt(next, u.id, TREE_FALL_DAMAGE, "the falling tree")
    if (isAttackableTile(t)) {
      next = damageObject(next, p, TREE_FALL_DAMAGE, d)
      break
    }
    if ((TERRAIN[t] || TERRAIN.path).cost === Infinity) break
    if (!["bridge", "lava", "fire"].includes(t)) next = setTile(next, p, "log")
  }
  return checkTacticsBattleEnd(next)
}

export function igniteTree(state, pos) {
  if (terrainAt(state, pos) !== "tree" || isBurning(state, pos)) return state
  const next = { ...state, objFire: { ...(state.objFire || {}), [k(pos)]: TREE_BURN_TURNS } }
  return objEvent(addLog(next, "A tree catches fire!"), "burn", pos, "Ablaze!", { tiles: [pos] })
}

function chillPillar(state, pos) {
  if (terrainAt(state, pos) !== "icepillar" || isChilled(state, pos)) return state
  const next = { ...state, objChill: { ...(state.objChill || {}), [k(pos)]: 1 } }
  return objEvent(addLog(next, "The ice pillar frosts over - the next hit shatters it."), "chill", pos, "Brittle!", { tiles: [pos] })
}

// Shatter: shards hit every unit next to it and Chill them; ice is left behind.
export function shatterPillar(state, pos) {
  let next = addLog(setTile(state, pos, "ice"), "The ice pillar shatters!")
  const around = []
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if (dr || dc) around.push({ row: pos.row + dr, col: pos.col + dc })
  next = objEvent(next, "shatter", pos, "Shatter!", { tiles: [pos, ...around.filter((p) => isOnBoard(p, state.grid))] })
  for (const p of around) {
    if (ended(next)) break
    const u = unitAt(next, p)
    if (!u) continue
    next = hurt(next, u.id, SHATTER_DAMAGE, "ice shards")
    if (getUnit(next, u.id)?.hp > 0 && !ended(next)) next = applyElement(next, u.id, "frost", 1)
  }
  return checkTacticsBattleEnd(next)
}

// Boom! 3x3 blast; barrels leave fire, spore pods leave poison. Chains.
export function explode(state, pos) {
  const type = terrainAt(state, pos)
  const def = OBJECTS[type]
  if (!def?.explosive) return state
  const fire = def.explosive === "fire"
  const dmg = fire ? BARREL_DAMAGE : SPORE_DAMAGE
  let next = setTile(state, pos, fire ? "ash" : "path")
  const area = []
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    const p = { row: pos.row + dr, col: pos.col + dc }
    if (isOnBoard(p, state.grid)) area.push(p)
  }
  next = objEvent(addLog(next, fire ? "Boom! The powder barrel explodes!" : "Pop! The spore pod bursts in a toxic cloud!"), fire ? "boom" : "spore", pos, fire ? "Boom!" : "Spores!", { tiles: area })
  for (const p of area) {
    if (ended(next)) break
    const u = unitAt(next, p)
    if (u) {
      next = hurt(next, u.id, dmg, fire ? "the blast" : "the spores")
      if (!fire && getUnit(next, u.id)?.hp > 0) next = setUnit(next, u.id, { poison: (getUnit(next, u.id).poison || 0) + 2 })
    }
  }
  // Leftover tiles: centre + the 4 sides.
  for (const p of [pos, ...ORTHO.map((d) => ({ row: pos.row + d.row, col: pos.col + d.col }))]) {
    if (!isOnBoard(p, next.grid) || OBJECTS[terrainAt(next, p)]) continue
    next = fire ? timedTile(next, p, "fire", FIRE_TILE_TURNS) : timedTile(next, p, "poison", POISON_TILE_TURNS)
  }
  // Other objects in the blast: trees catch fire (barrels) / take the hit.
  for (const p of area) {
    if (ended(next) || samePos(p, pos)) continue
    const t = terrainAt(next, p)
    if (!isAttackableTile(t)) continue
    if (t === "tree" && fire) next = igniteTree(next, p)
    else next = damageObject(next, p, dmg, { row: p.row - pos.row, col: p.col - pos.col })
  }
  return checkTacticsBattleEnd(next)
}

// Boulder shoved from `from`: rolls away until blocked, crushing what stops it.
export function rollBoulder(state, pos, from) {
  const d = { row: sign(pos.row - from.row), col: sign(pos.col - from.col) }
  if (!d.row && !d.col) return { next: state, moved: false }
  let cur = pos
  const path = []
  let stopper = null
  for (let i = 0; i < 12; i++) {
    const p = { row: cur.row + d.row, col: cur.col + d.col }
    if (!isOnBoard(p, state.grid)) break
    const u = unitAt(state, p)
    const t = terrainAt(state, p)
    if (u || isAttackableTile(t)) {
      stopper = { pos: p, unitId: u?.id }
      break
    }
    if ((TERRAIN[t] || TERRAIN.path).cost === Infinity) break
    cur = p
    path.push(p)
  }
  if (!path.length) return { next: state, moved: false }
  const hp = objectHpAt(state, pos)
  let next = setTile(setTile(state, pos, "path"), cur, "boulder")
  if (hp < OBJECTS.boulder.hp) next = { ...next, objHp: { ...(next.objHp || {}), [k(cur)]: hp } }
  next = objEvent(addLog(next, `The boulder rolls ${path.length} tile(s)!`), "roll", cur, stopper ? "Crash!" : "Rumble!", { from: { ...pos }, dir: d, tiles: [pos, ...path] })
  if (stopper?.unitId) next = hurt(next, stopper.unitId, BOULDER_DAMAGE, "the rolling boulder")
  else if (stopper) next = damageObject(next, stopper.pos, BOULDER_DAMAGE, d)
  return { next: checkTacticsBattleEnd(next), moved: true }
}

// --- the 1-AP attack (either side) ---------------------------------------------------
// Returns null when `pos` isn't an object (caller keeps the wall path).
export function attackObject(state, actor, pos, amount) {
  const type = objectAt(state, pos)
  if (!type) return null
  const tag = abilityElement(actor)
  const fire = tag?.element === "fire" || (actor.className || "").toLowerCase().includes("pyro")
  const frost = tag?.element === "frost"
  const d = { row: pos.row - actor.pos.row, col: pos.col - actor.pos.col }
  if (type === "boulder" && cheb(actor.pos, pos) === 1) {
    const rolled = rollBoulder(state, pos, actor.pos)
    if (rolled.moved) return addLog(rolled.next, `${actor.name} shoves the boulder!`)
  }
  const next = addLog(state, `${actor.name} strikes the ${OBJECTS[type].name.toLowerCase()} (${amount}).`)
  return damageObject(next, pos, amount, d, { fire, frost })
}

// --- element hooks (tacticsElements.applyElement) --------------------------------------
// Fire landing on a unit sets the trees beside it alight; frost chills pillars.
export function elementNear(state, pos, element) {
  if (!pos || (element !== "fire" && element !== "frost") || !hasObjects(state)) return state
  let next = state
  for (const d of ORTHO) {
    const p = { row: pos.row + d.row, col: pos.col + d.col }
    if (!isOnBoard(p, next.grid)) continue
    const t = terrainAt(next, p)
    if (element === "fire" && t === "tree") next = igniteTree(next, p)
    if (element === "frost" && t === "icepillar") next = chillPillar(next, p)
  }
  return next
}

// --- round tick (engine enemyPhaseStart; preview runs it too) ---------------------------
// Burning trees scorch neighbours and spread; fire tiles light trees;
// timed tiles fade. Deterministic key order.
export function objectsRoundTick(state) {
  const timers = state.tileTimers || {}
  const fireKeys = Object.keys(state.objFire || {}).sort()
  if (!fireKeys.length && !Object.keys(timers).length) return state
  let next = state
  // 1. Burning trees.
  const spreadTo = []
  for (const key of fireKeys) {
    if (ended(next)) break
    const pos = fromKey(key)
    if (terrainAt(next, pos) !== "tree") continue
    for (const u of next.units.filter((x) => x.hp > 0 && kingAdjacent(x.pos, pos))) next = hurt(next, u.id, FIRE_ADJ_DAMAGE, "the burning tree")
    for (const d of ORTHO) {
      const p = { row: pos.row + d.row, col: pos.col + d.col }
      if (isOnBoard(p, next.grid)) spreadTo.push(p)
    }
    const left = (next.objFire?.[key] || 0) - 1
    if (left <= 0) next = objEvent(addLog(setTile(next, pos, "ash"), "A burnt tree collapses into ash."), "ash", pos, "Ash", { tiles: [pos] })
    else next = { ...next, objFire: { ...next.objFire, [key]: left } }
  }
  // 2. Fire tiles light neighbouring trees/barrels too.
  for (const [key, t] of Object.entries(next.terrain || {}).sort(([a], [b]) => (a < b ? -1 : 1))) {
    if (t !== "fire") continue
    const pos = fromKey(key)
    for (const d of ORTHO) {
      const p = { row: pos.row + d.row, col: pos.col + d.col }
      if (isOnBoard(p, next.grid)) spreadTo.push(p)
    }
  }
  for (const p of spreadTo) {
    if (ended(next)) break
    const t = terrainAt(next, p)
    if (t === "tree") next = igniteTree(next, p)
    else if (OBJECTS[t]?.explosive === "fire") next = explode(next, p)
  }
  // 3. Timed tiles fade.
  const tileTimers = {}
  let terrain = { ...(next.terrain || {}) }
  for (const [key, tm] of Object.entries(next.tileTimers || {})) {
    if (tm.turns - 1 > 0) tileTimers[key] = { ...tm, turns: tm.turns - 1 }
    else if (terrain[key] === "fire" || terrain[key] === "poison") {
      if (!tm.revert || tm.revert === "path") delete terrain[key]
      else terrain[key] = tm.revert === "fire" ? "ash" : tm.revert
    }
  }
  return checkTacticsBattleEnd({ ...next, terrain, tileTimers })
}

// --- enemy AI helpers --------------------------------------------------------------------
// Tile penalty: next to a burning tree or an explosive.
export function aiObjectTilePenalty(state, pos) {
  if (!state.terrain) return 0
  let pen = 0
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    if (!dr && !dc) continue
    const p = { row: pos.row + dr, col: pos.col + dc }
    const t = state.terrain[k(p)]
    if (t === "tree" && isBurning(state, p)) pen += 15
    else if (OBJECTS[t]?.explosive) pen += 6
  }
  return pen
}

// Explosives worth setting off from `pos`: players in the blast, no allies.
export function aiExplosiveTargets(state, enemy, pos, range) {
  const out = []
  for (const [key, t] of Object.entries(state.terrain || {})) {
    if (!OBJECTS[t]?.explosive) continue
    const at = fromKey(key)
    if (cheb(pos, at) > range) continue
    const dmg = t === "barrel" ? BARREL_DAMAGE : SPORE_DAMAGE
    let value = 0
    let players = 0
    let allies = 0
    for (const u of state.units) {
      if (u.hp <= 0) continue
      const upos = u.id === enemy.id ? pos : u.pos
      if (cheb(upos, at) > 1) continue
      if (u.side === "player") {
        players++
        value += 3 * Math.min(dmg, u.hp) + (dmg >= u.hp ? 300 : 0) + (u.npc ? 0 : 10)
      } else allies++
    }
    if (players && !allies) out.push({ pos: at, type: t, value })
  }
  return out.sort((a, b) => b.value - a.value || (k(a.pos) < k(b.pos) ? -1 : 1))
}

// Ranged units like cover toward the nearest player (legacy AI path,
// hit rolls off; the one cover rule lives in tacticsCover.js).
export function aiTreeCoverBonus(state, pos, nearestPlayerPos) {
  if (!nearestPlayerPos || !state.terrain) return 0
  return coverAgainst(state, pos, nearestPlayerPos) > 0 ? 6 : 0
}

// --- player-facing text -------------------------------------------------------------------
export function describeObjectTile(state, pos) {
  const type = terrainAt(state, pos)
  if (!OBJECTS[type]) return null
  const hp = objectHpAt(state, pos)
  const max = objectMaxHp(type)
  if (type === "tree") return `Tree (${hp}/${max} HP): blocks movement. FULL cover for a unit right next to it (-40% to be hit from that side). Chop it down (1 AP) and it FALLS away from you: ${TREE_FALL_DAMAGE} damage to whoever stands on the next 2 tiles, leaving a log. Fire sets it ablaze for ${TREE_BURN_TURNS} turns - it scorches neighbours and spreads to trees beside it.${isBurning(state, pos) ? ` BURNING: ${state.objFire[k(pos)]} turn(s) left.` : ""}`
  if (type === "barrel") return `Powder barrel: any hit (or fire) blows it up - ${BARREL_DAMAGE} damage to everything in the 3x3 around it, and the ground burns for ${FIRE_TILE_TURNS} turns.`
  if (type === "sporepod") return `Spore pod: any hit bursts it - ${SPORE_DAMAGE} damage and +2 Poison to everything in the 3x3 around it; poison pools linger ${POISON_TILE_TURNS} turns.`
  if (type === "boulder") return `Boulder (${hp}/${max} HP): blocks movement. Hit it from right next to it (1 AP) to SHOVE it - it rolls away until something stops it, dealing ${BOULDER_DAMAGE} to what it hits.`
  if (type === "icepillar") return `Ice pillar (${hp}/${max} HP): Frost (a Frost attack, or Chill landing next to it) makes it brittle; the next hit shatters it - ${SHATTER_DAMAGE} damage + 1 Chill to every unit around it.${isChilled(state, pos) ? " BRITTLE: the next hit shatters it!" : ""}`
  return null
}

// Prototype showcase (?objects=1): every object in reach of the squad.
export const OBJECT_SHOWCASE_ROWS = [
  "....TT......",
  "....T...B...",
  "......B.....",
  "....T.......",
  "...T....O...",
  "....T.......",
  "......S.....",
  "...Y....Y...",
  "............",
]
const SHOWCASE_CHARS = { T: "tree", B: "barrel", S: "sporepod", O: "boulder", Y: "icepillar" }
export function objectShowcaseTerrain() {
  const terrain = {}
  OBJECT_SHOWCASE_ROWS.forEach((line, r) => [...line].forEach((ch, c) => { if (SHOWCASE_CHARS[ch]) terrain[`${r}-${c}`] = SHOWCASE_CHARS[ch] }))
  return terrain
}
export function withObjectShowcase(state) {
  return { ...state, terrain: objectShowcaseTerrain(), wallHp: {}, objHp: {}, objFire: {}, objChill: {}, tileTimers: {}, objectShowcase: true }
}
