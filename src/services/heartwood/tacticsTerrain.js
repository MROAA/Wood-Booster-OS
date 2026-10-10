// Hearthwood Frontier - battlefield features (sprint 3). Terrain rules +
// the seeded map-template generator. Pure: no engine import (the engine
// imports THIS), so there is no cycle.
import { isOnBoard } from "./targeting"

// cost: move cost to ENTER (Infinity = never). Flags drive the rules below.
export const TERRAIN = {
  path: { cost: 1 },
  forest: { cost: 1 },
  rock: { cost: 3 },
  water: { cost: Infinity },
  poison: { cost: 1, grantPoison: 2 },
  high: { cost: 2, high: true },
  wall: { cost: Infinity, wall: true },
  rubble: { cost: 1 },
  bridge: { cost: 1 },
  bush: { cost: 1, cover: true },
  lava: { cost: 1, burn: 3 },
  ice: { cost: 1, slide: true },
  // Destructible objects (tacticsObjects.js): block like a wall, have HP.
  tree: { cost: Infinity, obj: true },
  barrel: { cost: Infinity, obj: true },
  sporepod: { cost: Infinity, obj: true },
  boulder: { cost: Infinity, obj: true },
  icepillar: { cost: Infinity, obj: true },
  // What they leave behind.
  log: { cost: 2 },
  stump: { cost: 1 },
  ash: { cost: 1 },
  fire: { cost: 1, burn: 2 },
  // Chaos sprint: iron spikes (promotion zone skills). Ending a turn here
  // hurts 2; being KNOCKED onto them hurts more (tacticsChaos.js).
  spikes: { cost: 1, burn: 2, spikes: true },
}

export const WALL_MAX_HP = 8
export const HIGH_GROUND_DAMAGE_PCT = 25

// Player-facing name + one-line rule for the tile tooltip.
export const TERRAIN_INFO = {
  forest: { name: "Forest", text: "Open woodland - no effect." },
  rock: { name: "Rocks", text: "Rough ground - costs 3 movement to enter. FULL cover for a hero right next to it." },
  water: { name: "Deep water", text: "Impassable - nobody can stand here. Look for a bridge." },
  poison: { name: "Poison pool", text: "Ending a move here poisons the hero (+2 Poison)." },
  high: { name: "High ground", text: `Costs 2 movement to climb. Ranged heroes here get +1 range; attacks from here into low ground deal +${HIGH_GROUND_DAMAGE_PCT}%.` },
  wall: { name: "Barricade", text: "Blocks movement. FULL cover for a hero right next to it. Either side can attack it (1 AP) - it breaks at 0 HP." },
  rubble: { name: "Rubble", text: "What's left of a broken barricade - walkable. HALF cover for a hero next to it." },
  bridge: { name: "Bridge", text: "The only way across the river - a natural chokepoint." },
  bush: { name: "Tall grass", text: "A hero in the grass can't be targeted from more than 1 tile away. HALF cover for a hero next to it." },
  lava: { name: "Lava", text: "Ending your turn here burns for 3 damage. Walking through is safe." },
  ice: { name: "Ice", text: "Slippery - stepping onto ice slides you 1 more tile in the same direction if it's free." },
  tree: { name: "Tree", text: "Blocks movement. FULL cover for a hero right next to it. Chop it (1 AP) and it falls away from you, crushing the next 2 tiles. Fire burns it down and spreads." },
  barrel: { name: "Powder barrel", text: "Any hit or fire blows it up: damage to everything in the 3x3 around it, and the ground burns." },
  sporepod: { name: "Spore pod", text: "Any hit bursts it: damage + Poison to everything in the 3x3 around it, and poison pools linger." },
  boulder: { name: "Boulder", text: "Blocks movement, FULL cover. Hit it from right next to it to shove it - it rolls until stopped and crushes what it hits." },
  icepillar: { name: "Ice pillar", text: "FULL cover. Frost makes it brittle; the next hit shatters it, hurting and Chilling every hero around it." },
  log: { name: "Fallen log", text: "A felled tree - costs 2 movement to climb over. HALF cover for a hero next to it." },
  stump: { name: "Stump", text: "Where a tree stood - walkable. HALF cover for a hero next to it." },
  ash: { name: "Ash", text: "Burnt ground - walkable." },
  fire: { name: "Flames", text: "Burning ground - ending your turn here burns for 2. Dies down in a couple of turns. Spreads into tall grass." },
  spikes: { name: "Spikes", text: "Iron spikes - ending your turn here hurts for 2, and anyone KNOCKED onto them takes 3." },
}

export function terrainAt(state, pos) {
  return (state.terrain || {})[`${pos.row}-${pos.col}`] || "path"
}

export function terrainRule(state, pos) {
  return TERRAIN[terrainAt(state, pos)] || TERRAIN.path
}

export function isHigh(state, pos) {
  return !!terrainRule(state, pos).high
}

export function wallHpAt(state, pos) {
  const key = `${pos.row}-${pos.col}`
  return state.wallHp?.[key] ?? WALL_MAX_HP
}

function cheb(a, b) {
  return Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col))
}

// Attack range from `pos`: ranged units on high ground reach 1 further.
export function rangeAt(state, unit, pos = unit.pos) {
  // Ranged rework: a Sniper (Deadeye passive) shoots 2 further from high ground.
  const high = unit.range > 1 && isHigh(state, pos)
  return unit.range + (high ? 1 + (unit.classPassive === "defensive-aim" ? 2 : 0) : 0)
}

// Basic reach test used by every attack path: range + tall-grass cover.
export function canReach(state, attacker, attackerPos, targetPos) {
  const dist = cheb(attackerPos, targetPos)
  if (dist > rangeAt(state, attacker, attackerPos)) return false
  if (dist > 1 && terrainRule(state, targetPos).cover) return false
  return true
}

// +25% (min +1) when striking down from high ground onto low ground.
// (Cover is no longer a damage cut - XCOM part 2, tacticsCover.js.)
export function highGroundAmount(state, attackerPos, defenderPos, amount) {
  if (!state || amount <= 0) return amount
  if (isHigh(state, attackerPos) && !isHigh(state, defenderPos)) return amount + Math.max(1, Math.round((amount * HIGH_GROUND_DAMAGE_PCT) / 100))
  return amount
}

// Ice: where a move to `to` really ends. One extra tile in the move's
// dominant direction if that tile is on board, enterable and free.
export function slideLanding(state, moverId, from, to) {
  if (!terrainRule(state, to).slide) return to
  const dCol = to.col - from.col
  const dRow = to.row - from.row
  if (!dCol && !dRow) return to
  const step = Math.abs(dCol) >= Math.abs(dRow) ? { row: 0, col: Math.sign(dCol) } : { row: Math.sign(dRow), col: 0 }
  const next = { row: to.row + step.row, col: to.col + step.col }
  if (!isOnBoard(next, state.grid)) return to
  if (terrainRule(state, next).cost === Infinity) return to
  if (state.units.some((u) => u.id !== moverId && u.hp > 0 && u.pos.row === next.row && u.pos.col === next.col)) return to
  return next
}

// Steps (king moves, units ignored) from every tile to `goal`. Used by
// the AI so it walks to a bridge instead of staring across a river.
// `wallsOpen` treats barricades as walkable (to ask "is a wall in the way?").
export function terrainDistanceField(terrain, grid, goal, wallsOpen = false) {
  const passable = (pos) => {
    const t = TERRAIN[terrain[`${pos.row}-${pos.col}`] || "path"] || TERRAIN.path
    return t.cost !== Infinity || (wallsOpen && (t.wall || t.obj))
  }
  const dist = new Map([[`${goal.row}-${goal.col}`, 0]])
  const queue = [goal]
  while (queue.length) {
    const cur = queue.shift()
    const d = dist.get(`${cur.row}-${cur.col}`)
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const n = { row: cur.row + dr, col: cur.col + dc }
        const key = `${n.row}-${n.col}`
        if ((!dr && !dc) || dist.has(key) || !isOnBoard(n, grid) || !passable(n)) continue
        dist.set(key, d + 1)
        queue.push(n)
      }
    }
  }
  return dist
}

// True when some walkable route (walls/water blocked) joins col 0 to the last col.
export function sidesConnected(terrain, grid) {
  for (let row = 0; row < grid.rows; row++) {
    const field = terrainDistanceField(terrain, grid, { row, col: 0 })
    for (let r = 0; r < grid.rows; r++) if (field.has(`${r}-${grid.cols - 1}`)) return true
  }
  return false
}

// ===== Map templates =========================================================
// Each builds features inside the middle columns [lo, hi] (spawn columns
// stay clear). `rng` is a seeded stream so the same seed = the same map.
const pick = (rng, list) => list[Math.floor(rng() * list.length)]
const between = (rng, a, b) => a + Math.floor(rng() * (b - a + 1))

// Destructibles: drop `count` objects on free tiles (after the template's
// own features, so earlier rolls - and the old layout - stay the same).
function scatterObjects(rng, grid, lo, hi, place, type, count) {
  for (let i = 0; i < count; i++) place(between(rng, 0, grid.rows - 1), between(rng, lo, hi), type)
}

// A small cluster of trees (orthogonal neighbours, so fire can spread).
function treeCluster(rng, grid, lo, hi, place, size) {
  let r = between(rng, 0, grid.rows - 1)
  let c = between(rng, lo, hi)
  for (let i = 0; i < size; i++) {
    place(r, c, "tree")
    if (rng() < 0.5) r = Math.min(grid.rows - 1, Math.max(0, r + (rng() < 0.5 ? -1 : 1)))
    else c = Math.min(hi, Math.max(lo, c + (rng() < 0.5 ? -1 : 1)))
  }
}

function riverCrossing(rng, grid, lo, hi, set, place) {
  const col = between(rng, lo + 1, hi - 1)
  for (let row = 0; row < grid.rows; row++) set(row, col, "water")
  const bridges = rng() < 0.5 ? 1 : 2
  const first = between(rng, 1, grid.rows - 2)
  set(first, col, "bridge")
  if (bridges === 2) set((first + between(rng, 3, grid.rows - 3)) % grid.rows, col, "bridge")
  for (let i = 0; i < 3; i++) set(between(rng, 0, grid.rows - 1), col + (rng() < 0.5 ? -1 : 1), "bush")
  set(between(rng, 0, grid.rows - 1), col + 1, "high")
  if (place) scatterObjects(rng, grid, lo, hi, place, "tree", 2)
}

function hillFort(rng, grid, lo, hi, set, place) {
  const top = between(rng, 2, grid.rows - 5)
  const col = between(rng, lo + 1, hi - 2)
  for (let r = top; r < top + 3; r++) for (let c = col; c < col + 2; c++) set(r, c, "high")
  // Palisade on the fort's player-facing side, one gap left open.
  const gap = between(rng, top, top + 2)
  for (let r = top; r < top + 3; r++) if (r !== gap) set(r, col + 2, "wall")
  set(top - 1, col, "bush")
  set(top + 3, col + 1, "bush")
  if (place) {
    place(top + 1, col - 1, "barrel")
    scatterObjects(rng, grid, lo, hi, place, "boulder", 1)
  }
}

function ruinedWalls(rng, grid, lo, hi, set, place) {
  const segments = between(rng, 2, 3)
  for (let s = 0; s < segments; s++) {
    const col = between(rng, lo, hi)
    const start = between(rng, 0, grid.rows - 3)
    const len = between(rng, 2, 3)
    for (let r = start; r < start + len; r++) set(r, col, "wall")
    set(start + len, col, "rubble")
  }
  set(between(rng, 0, grid.rows - 1), between(rng, lo, hi), "high")
  set(between(rng, 0, grid.rows - 1), between(rng, lo, hi), "high")
  if (place) {
    scatterObjects(rng, grid, lo, hi, place, "barrel", 2)
    scatterObjects(rng, grid, lo, hi, place, "boulder", 2)
  }
}

function forestGlade(rng, grid, lo, hi, set, place) {
  for (let i = 0; i < 3; i++) {
    const r = between(rng, 0, grid.rows - 2)
    const c = between(rng, lo, hi - 1)
    set(r, c, "bush")
    set(r + 1, c, "bush")
    set(r, c + 1, rng() < 0.5 ? "bush" : "forest")
  }
  const pr = between(rng, 1, grid.rows - 2)
  const pc = between(rng, lo, hi)
  set(pr, pc, "water")
  set(pr + 1, pc, "water")
  set(between(rng, 0, grid.rows - 1), between(rng, lo, hi), "high")
  if (place) {
    treeCluster(rng, grid, lo, hi, place, 4)
    treeCluster(rng, grid, lo, hi, place, 3)
    scatterObjects(rng, grid, lo, hi, place, "tree", 2)
    scatterObjects(rng, grid, lo, hi, place, "sporepod", 1)
  }
}

function emberField(rng, grid, lo, hi, set, place) {
  for (let i = 0; i < 3; i++) {
    const r = between(rng, 0, grid.rows - 2)
    const c = between(rng, lo, hi - 1)
    set(r, c, "lava")
    set(r + (rng() < 0.5 ? 1 : 0), c + 1, "lava")
  }
  for (let i = 0; i < 2; i++) set(between(rng, 0, grid.rows - 1), between(rng, lo, hi), "high")
  set(between(rng, 0, grid.rows - 1), between(rng, lo, hi), "wall")
  if (place) scatterObjects(rng, grid, lo, hi, place, "barrel", 2)
}

function frozenFord(rng, grid, lo, hi, set, place) {
  const col = between(rng, lo + 1, hi - 2)
  for (let row = 0; row < grid.rows; row++) {
    set(row, col, "ice")
    set(row, col + 1, rng() < 0.6 ? "ice" : "path")
  }
  const pool = between(rng, 0, grid.rows - 3)
  set(pool, col - 1, "water")
  set(pool + 1, col - 1, "water")
  set(between(rng, 0, grid.rows - 1), col + 2, "high")
  set(between(rng, 0, grid.rows - 1), col - 1, "bush")
  if (place) {
    place(between(rng, 0, grid.rows - 1), col - 1, "icepillar")
    place(between(rng, 0, grid.rows - 1), col + 2, "icepillar")
    scatterObjects(rng, grid, lo, hi, place, "icepillar", 1)
  }
}

// minAct: the first Act a template can appear in.
export const MAP_TEMPLATES = [
  { id: "river-crossing", name: "River Crossing", minAct: 1, build: riverCrossing },
  { id: "hill-fort", name: "Hill Fort", minAct: 1, build: hillFort },
  { id: "ruined-walls", name: "Ruined Walls", minAct: 1, build: ruinedWalls },
  { id: "forest-glade", name: "Forest Glade", minAct: 1, build: forestGlade },
  { id: "frozen-ford", name: "Frozen Ford", minAct: 2, build: frozenFord },
  { id: "ember-field", name: "Ember Field", minAct: 3, build: emberField },
]

export function templatesForAct(act) {
  return MAP_TEMPLATES.filter((t) => act >= t.minAct)
}

// Builds one template's terrain map inside cols [lo, hi]. `place` puts a
// destructible object on a still-empty tile only if the sides stay joined
// (objects block, so the path-exists guarantee counts them).
export function buildTemplateTerrain(template, rng, grid, lo, hi, withObjects = true) {
  const terrain = {}
  const set = (row, col, type) => {
    if (row < 0 || row >= grid.rows || col < lo || col > hi) return
    terrain[`${row}-${col}`] = type
  }
  const place = (row, col, type) => {
    const key = `${row}-${col}`
    if (row < 0 || row >= grid.rows || col < lo || col > hi || (terrain[key] && terrain[key] !== "path")) return
    terrain[key] = type
    if (!sidesConnected(terrain, grid)) delete terrain[key]
  }
  template.build(rng, grid, lo, hi, set, withObjects ? place : null)
  for (const key of Object.keys(terrain)) if (terrain[key] === "path") delete terrain[key]
  return terrain
}

export function pickTemplate(rng, act) {
  return pick(rng, templatesForAct(act))
}
