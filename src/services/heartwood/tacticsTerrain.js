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
}

export const WALL_MAX_HP = 8
export const HIGH_GROUND_DAMAGE_PCT = 25

// Player-facing name + one-line rule for the tile tooltip.
export const TERRAIN_INFO = {
  forest: { name: "Forest", text: "Open woodland - no effect." },
  rock: { name: "Rocks", text: "Rough ground - costs 3 movement to enter." },
  water: { name: "Deep water", text: "Impassable - nobody can stand here. Look for a bridge." },
  poison: { name: "Poison pool", text: "Ending a move here poisons the unit (+2 Poison)." },
  high: { name: "High ground", text: `Costs 2 movement to climb. Ranged units here get +1 range; attacks from here into low ground deal +${HIGH_GROUND_DAMAGE_PCT}%.` },
  wall: { name: "Barricade", text: "Blocks movement. Either side can attack it (1 AP) - it breaks at 0 HP." },
  rubble: { name: "Rubble", text: "What's left of a broken barricade - walkable." },
  bridge: { name: "Bridge", text: "The only way across the river - a natural chokepoint." },
  bush: { name: "Tall grass", text: "A unit in the grass can't be targeted from more than 1 tile away." },
  lava: { name: "Lava", text: "Ending your turn here burns for 3 damage. Walking through is safe." },
  ice: { name: "Ice", text: "Slippery - stepping onto ice slides you 1 more tile in the same direction if it's free." },
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
  return unit.range + (unit.range > 1 && isHigh(state, pos) ? 1 : 0)
}

// Basic reach test used by every attack path: range + tall-grass cover.
export function canReach(state, attacker, attackerPos, targetPos) {
  const dist = cheb(attackerPos, targetPos)
  if (dist > rangeAt(state, attacker, attackerPos)) return false
  if (dist > 1 && terrainRule(state, targetPos).cover) return false
  return true
}

// +25% (min +1) when striking down from high ground onto low ground.
export function highGroundAmount(state, attackerPos, defenderPos, amount) {
  if (!state || !isHigh(state, attackerPos) || isHigh(state, defenderPos) || amount <= 0) return amount
  return amount + Math.max(1, Math.round((amount * HIGH_GROUND_DAMAGE_PCT) / 100))
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
    return t.cost !== Infinity || (wallsOpen && t.wall)
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

function riverCrossing(rng, grid, lo, hi, set) {
  const col = between(rng, lo + 1, hi - 1)
  for (let row = 0; row < grid.rows; row++) set(row, col, "water")
  const bridges = rng() < 0.5 ? 1 : 2
  const first = between(rng, 1, grid.rows - 2)
  set(first, col, "bridge")
  if (bridges === 2) set((first + between(rng, 3, grid.rows - 3)) % grid.rows, col, "bridge")
  for (let i = 0; i < 3; i++) set(between(rng, 0, grid.rows - 1), col + (rng() < 0.5 ? -1 : 1), "bush")
  set(between(rng, 0, grid.rows - 1), col + 1, "high")
}

function hillFort(rng, grid, lo, hi, set) {
  const top = between(rng, 2, grid.rows - 5)
  const col = between(rng, lo + 1, hi - 2)
  for (let r = top; r < top + 3; r++) for (let c = col; c < col + 2; c++) set(r, c, "high")
  // Palisade on the fort's player-facing side, one gap left open.
  const gap = between(rng, top, top + 2)
  for (let r = top; r < top + 3; r++) if (r !== gap) set(r, col + 2, "wall")
  set(top - 1, col, "bush")
  set(top + 3, col + 1, "bush")
}

function ruinedWalls(rng, grid, lo, hi, set) {
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
}

function forestGlade(rng, grid, lo, hi, set) {
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
}

function emberField(rng, grid, lo, hi, set) {
  for (let i = 0; i < 3; i++) {
    const r = between(rng, 0, grid.rows - 2)
    const c = between(rng, lo, hi - 1)
    set(r, c, "lava")
    set(r + (rng() < 0.5 ? 1 : 0), c + 1, "lava")
  }
  for (let i = 0; i < 2; i++) set(between(rng, 0, grid.rows - 1), between(rng, lo, hi), "high")
  set(between(rng, 0, grid.rows - 1), between(rng, lo, hi), "wall")
}

function frozenFord(rng, grid, lo, hi, set) {
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

// Builds one template's terrain map inside cols [lo, hi].
export function buildTemplateTerrain(template, rng, grid, lo, hi) {
  const terrain = {}
  const set = (row, col, type) => {
    if (row < 0 || row >= grid.rows || col < lo || col > hi) return
    terrain[`${row}-${col}`] = type
  }
  template.build(rng, grid, lo, hi, set)
  for (const key of Object.keys(terrain)) if (terrain[key] === "path") delete terrain[key]
  return terrain
}

export function pickTemplate(rng, act) {
  return pick(rng, templatesForAct(act))
}
