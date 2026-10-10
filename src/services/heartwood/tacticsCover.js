// Hearthwood Frontier - XCOM part 2: cover + hit chance (with GRAZE).
// Pure. The ONE cover rule: a unit is covered from a direction when the
// tile right next to it on that side is a cover source. Cover only
// changes the hit chance; a "miss" is a GRAZE (half damage, no riders).
// Only active when `state.hitRolls` is true (the real game + prototype
// page set it); hand-built test states stay exact (no rolls).
import { terrainAt, isHigh } from "./tacticsTerrain"
import { deterministicRoll } from "./tacticsEngine"
import { shotMods, smokeAt, consumeAim } from "./tacticsRanged"
import { auraOn } from "./gear"

export const COVER = { NONE: 0, HALF: 1, FULL: 2, HUNKERED: 3 }
export const COVER_NAME = ["No cover", "Half cover", "Full cover", "Full cover (hunkered)"]
// Tiles that shield a unit standing next to them.
export const FULL_COVER_TILES = new Set(["rock", "wall", "boulder", "tree", "icepillar"])
export const HALF_COVER_TILES = new Set(["log", "bush", "stump", "rubble", "barrel", "sporepod"])
export const COVER_HIT_PENALTY = [0, 20, 40, 55]
export const BASE_HIT = 85
export const RANGE_FALLOFF = 5 // per tile beyond 2
export const FACING_HIT_BONUS = { front: 0, side: 10, back: 15 }
export const HIGH_GROUND_HIT_BONUS = 10
export const MIN_HIT = 15
export const MAX_HIT = 100

const DIRS = { N: { row: -1, col: 0 }, S: { row: 1, col: 0 }, E: { row: 0, col: 1 }, W: { row: 0, col: -1 } }
const cheb = (a, b) => Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col))

export function rollsOn(state) {
  return !!state?.hitRolls && !state.noGraze
}

// Real run fights + the prototype page (never tutorials / test states).
export function withHitRolls(state) {
  return state && !state.noGraze ? { ...state, hitRolls: true } : state
}

// 0 / 1 / 2 for the tile itself as a cover SOURCE.
export function coverSourceAt(state, pos) {
  if (!state?.grid || pos.row < 0 || pos.col < 0 || pos.row >= state.grid.rows || pos.col >= state.grid.cols) return 0
  const t = terrainAt(state, pos)
  return FULL_COVER_TILES.has(t) ? 2 : HALF_COVER_TILES.has(t) ? 1 : 0
}

// Cover on each side of a tile: { N, S, E, W } (0/1/2). Board shields use this.
export function tileCoverSides(state, pos) {
  const out = {}
  for (const [d, v] of Object.entries(DIRS)) out[d] = coverSourceAt(state, { row: pos.row + v.row, col: pos.col + v.col })
  return out
}

// The sides of `defPos` that face `atkPos` (a side counts when the attacker
// is beyond it on that axis and not far off to the flank).
export function facingSides(defPos, atkPos) {
  const dRow = atkPos.row - defPos.row
  const dCol = atkPos.col - defPos.col
  const out = []
  if (dCol && 2 * Math.abs(dCol) >= Math.abs(dRow)) out.push(dCol > 0 ? "E" : "W")
  if (dRow && 2 * Math.abs(dRow) >= Math.abs(dCol)) out.push(dRow > 0 ? "S" : "N")
  return out
}

// Melee rework: an ally standing behind a SHIELD WALL (or a Bastion) tank
// counts the tank as HALF cover on that side.
const DIR_LIST = Object.entries({ N: { row: -1, col: 0 }, S: { row: 1, col: 0 }, E: { row: 0, col: 1 }, W: { row: 0, col: -1 } })
export function shieldWallSides(state, defPos, defender) {
  const sides = {}
  if (!defender || !state?.units) return sides
  for (const [d, v] of DIR_LIST) {
    const p = { row: defPos.row + v.row, col: defPos.col + v.col }
    const tank = state.units.find((u) => u.hp > 0 && u.id !== defender.id && u.side === defender.side && u.shieldWall > 0 && u.pos.row === p.row && u.pos.col === p.col)
    if (tank) sides[d] = 1
  }
  return sides
}

function sidesFor(state, defPos, defender) {
  const sides = tileCoverSides(state, defPos)
  const wall = shieldWallSides(state, defPos, defender)
  for (const d of Object.keys(wall)) sides[d] = Math.max(sides[d], wall[d])
  return sides
}

// Cover level of a defender at `defPos` against an attack from `atkPos`.
// Adjacent (melee) attacks go around cover. High ground attacker: one
// step less. Hunkered: one step more (full becomes "hunkered full").
export function coverAgainst(state, defPos, atkPos, { hunkered = false, defender = null } = {}) {
  const sides = sidesFor(state, defPos, defender)
  // Ranged rework: smoke = half cover from every side vs ranged attacks.
  const terrain = cheb(defPos, atkPos) <= 1 ? 0 : Math.max(smokeAt(state, defPos) ? 1 : 0, ...facingSides(defPos, atkPos).map((d) => sides[d]))
  let level = Math.min(3, terrain + (hunkered ? 1 : 0))
  if (isHigh(state, atkPos) && !isHigh(state, defPos)) level = Math.max(0, level - 1)
  return level
}

// Has cover somewhere, but none toward this attacker = flanked.
export function isFlanked(state, defPos, atkPos, defender = null) {
  if (cheb(defPos, atkPos) <= 1 || smokeAt(state, defPos)) return false
  // Gear board aura (Watch Lantern): allies next to the bearer can't be flanked.
  if (defender && auraOn(state, defender, "noFlank", defPos) > 0) return false
  const sides = sidesFor(state, defPos, defender)
  const any = Object.values(sides).some((v) => v > 0)
  return any && !facingSides(defPos, atkPos).some((d) => sides[d] > 0)
}

// Full hit-chance breakdown. `facing` = front/side/back (engine's facing).
// `shot` = a skill's shot rules (tacticsRanged.shotForSkill): aim bonus,
// ignore cover. Aim / point blank / suppressed / marked: tacticsRanged.
export function hitChance(state, attacker, defender, facing = "front", atkPos = attacker.pos, shot = null) {
  if (defender.structure) return { chance: 100, cover: 0, flanked: false, parts: [] }
  const dist = cheb(atkPos, defender.pos)
  const mods = shotMods(attacker, defender, dist, shot)
  const rawCover = coverAgainst(state, defender.pos, atkPos, { hunkered: defender.hunkered > 0, defender })
  const cover = mods.ignoreCover ? 0 : rawCover
  const high = isHigh(state, atkPos) && !isHigh(state, defender.pos)
  const falloff = mods.noFalloff ? 0 : RANGE_FALLOFF * Math.max(0, dist - 2)
  const base = dist <= 1 ? BASE_HIT : BASE_HIT - falloff
  const parts = [{ label: dist <= 1 ? "Melee" : `Range ${dist}${mods.noFalloff && dist > 2 ? " (Deadeye: no loss)" : ""}`, value: base }]
  if (cover) parts.push({ label: COVER_NAME[cover], value: -COVER_HIT_PENALTY[cover] })
  else if (rawCover && mods.coverLabel) parts.push({ label: mods.coverLabel, value: 0 })
  if (FACING_HIT_BONUS[facing]) parts.push({ label: facing === "back" ? "From behind" : "Side attack", value: FACING_HIT_BONUS[facing] })
  if (high) parts.push({ label: "High ground", value: HIGH_GROUND_HIT_BONUS })
  parts.push(...mods.parts)
  // Gear board aura (War Banner): allies next to the bearer aim better.
  const banner = attacker.side === "player" ? auraOn(state, attacker, "aim", atkPos) : 0
  if (banner) parts.push({ label: "Banner aura", value: banner })
  const raw = parts.reduce((s, p) => s + p.value, 0)
  const wallPart = cover && Object.keys(shieldWallSides(state, defender.pos, defender)).length > 0 ? parts.find((p) => p.label === COVER_NAME[cover]) : null
  if (wallPart) wallPart.label += " (Shield Wall)"
  return { chance: Math.max(MIN_HIT, Math.min(MAX_HIT, raw)), cover, flanked: !mods.ignoreCover && isFlanked(state, defender.pos, atkPos, defender), parts }
}

export function grazeAmount(amount) {
  return amount > 0 ? Math.max(1, Math.floor(amount / 2)) : amount
}

// One deterministic roll. Returns { state (roll counter +1), graze, chance }.
// Seeded by turn + attacker + target + a per-battle counter, so a preview
// dry-run and the real resolution see the same result.
export function rollHit(state, attacker, defender, facing = "front", shot = null) {
  // Ranged rework: the shot spends the shooter's Aim either way.
  const spent = consumeAim(state, attacker.id)
  if (!rollsOn(state) || defender.structure) return { state: spent, graze: false, chance: null }
  const { chance } = hitChance(state, attacker, defender, facing, attacker.pos, shot)
  const seq = state.rollSeq || 0
  const roll = deterministicRoll(state.turn || 1, `hit:${attacker.id}>${defender.id}#${seq}`)
  return { state: { ...spent, rollSeq: seq + 1 }, graze: roll * 100 >= chance, chance }
}

// " (72%)" / " (72%, GRAZE)" log suffix.
export function rollNote(roll) {
  if (roll?.chance == null) return ""
  return roll.graze ? ` (GRAZE, ${roll.chance}% to hit)` : ` (${roll.chance}%)`
}
