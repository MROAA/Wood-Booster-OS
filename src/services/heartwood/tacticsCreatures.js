// Hearthwood - the forest's creatures in a real tactics fight (First Song
// PRD §6, NAR-04). Data: data/heartwood/creatures.js; the run-side
// Forest Regard: forestRegard.js.
//
//   withForestWardens(battle, regard) - Regard >= +25: a Forest Warden
//     fights beside you; <= -25: a Wrathful Warden fights against you.
//   withShapeshifter(battle, { seed, nodeIndex, act, kind }) - from Act II,
//     some normal fights hide a Shapeshifter as one of the trees
//     (`battle.mimics` { "r-c": enemyId }).
//   Both are called BEFORE the DifficultyEngine (like fate arrivals) so a
//   Warden gets the tier's scaling + AI.
//   shapeshifterTurnEnd(state) - the engine's enemy turn end (via
//     tacticsObjects.forestTurnEnd): each hidden one steps one tile toward
//     your squad (trees don't move - that's the tell), or bursts out when
//     it reaches a hero.
//   revealShapeshifter(state, key, why) - also called when its "tree" is
//     struck (tacticsObjects.damageObject).
// Pure and deterministic (seeded by the run seed + node).
import { CREATURES, WARDEN_THRESHOLD, ROOT_EATER } from "../../data/heartwood/creatures"
import { ENEMIES } from "../../data/heartwood/enemies"
import { UNITS } from "../../data/heartwood/units"
import { streamRng } from "../../data/heartwood/seed"
import { deriveTacticsUnit, freeCellsNear, emit } from "./tacticsEngine"

const keyOf = (p) => `${p.row}-${p.col}`
const posOf = (key) => {
  const [row, col] = key.split("-").map(Number)
  return { row, col }
}
const dist = (a, b) => Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col))
const log = (state, line) => ({ ...state, log: [...(state.log || []), line] })
const OPEN = new Set([undefined, "path", "forest", "rubble", "stump", "ash", "leaves", "log"])
const isHero = (u) => u.side === "player" && u.hp > 0 && !u.structure && !u.npc

// ---- Forest Wardens -----------------------------------------------------------
export function withForestWardens(battle, regard = 0) {
  if (!battle?.units || battle.boss) return battle
  const r = Number(regard) || 0
  if (r >= WARDEN_THRESHOLD) {
    const c = CREATURES.wardenAlly
    if (!UNITS[c.unit]) return battle
    const anchor = battle.units.find((u) => u.id === "player-commander") || battle.units.find(isHero)
    const [pos] = anchor ? freeCellsNear(battle, anchor.pos, 1) : []
    if (!pos) return battle
    const u = deriveTacticsUnit(c.unit, "player", pos, `creature-${c.id}`)
    return log({ ...battle, units: [...battle.units, { ...u, name: c.name, baseAttack: u.attack, creature: "warden", creatureTag: c.tag, fateAlly: true, fateTitle: c.title }] }, `🌲 ${c.name} steps out of the trees - ${c.title.toLowerCase()}.`)
  }
  if (r <= -WARDEN_THRESHOLD) {
    const c = CREATURES.wardenFoe
    if (!ENEMIES[c.enemy]) return battle
    const foe = battle.units.find((u) => u.side === "enemy" && u.hp > 0)
    const origin = foe?.pos || { row: Math.floor(battle.grid.rows / 2), col: 0 }
    const [pos] = freeCellsNear(battle, origin, 1)
    if (!pos) return battle
    const u = deriveTacticsUnit(c.enemy, "enemy", pos, `creature-${c.id}`)
    return log({ ...battle, units: [...battle.units, { ...u, name: c.name, facing: "E", creature: "warden", creatureTag: c.tag, fateRival: true, fateTitle: c.title }] }, `🌲 A ${c.name} comes for you - ${c.title.toLowerCase()}.`)
  }
  return battle
}

// ---- Shapeshifters --------------------------------------------------------------
export function withShapeshifter(battle, { seed = 0, nodeIndex = 0, act = 1, kind = "battle" } = {}) {
  const c = CREATURES.shapeshifter
  if (!battle?.units || battle.boss || kind !== "battle" || act < c.fromAct || !ENEMIES[c.enemy]) return battle
  const rng = streamRng(seed, "creature", `${nodeIndex}:shapeshifter`)
  if (rng() >= c.chance) return battle
  const { rows, cols } = battle.grid
  const occupied = new Set(battle.units.filter((u) => u.hp > 0).map((u) => keyOf(u.pos)))
  const middle = (col) => col >= 2 && col <= cols - 5
  const terrain = battle.terrain || {}
  let spots = Object.keys(terrain).filter((key) => terrain[key] === "tree" && middle(posOf(key).col) && !occupied.has(key))
  let planted = false
  if (!spots.length) {
    // No tree to hide among: it plants itself as one (on open ground).
    for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
      const key = keyOf({ row, col })
      if (middle(col) && OPEN.has(terrain[key]) && !occupied.has(key)) spots.push(key)
    }
    planted = true
  }
  if (!spots.length) return battle
  spots.sort()
  const key = spots[Math.floor(rng() * spots.length) % spots.length]
  const next = {
    ...battle,
    terrain: planted ? { ...terrain, [key]: "tree" } : terrain,
    mimics: { ...(battle.mimics || {}), [key]: c.enemy },
    creatureHint: c.hint,
  }
  return log(next, `🌲 Something in the treeline is watching you.`)
}

export function hiddenShapeshifters(state) {
  return Object.keys(state?.mimics || {})
}

function freshTerrain(state, removeKey, addKey) {
  const terrain = { ...(state.terrain || {}) }
  if (removeKey) delete terrain[removeKey]
  if (addKey) terrain[addKey] = "tree"
  const strip = (m) => {
    const out = { ...(m || {}) }
    if (removeKey) delete out[removeKey]
    return out
  }
  return { ...state, terrain, objHp: strip(state.objHp), objFire: strip(state.objFire), objChill: strip(state.objChill) }
}

export function revealShapeshifter(state, key, why = "found") {
  const enemyId = state?.mimics?.[key]
  if (!enemyId) return state
  const c = CREATURES.shapeshifter
  const pos = posOf(key)
  const mimics = { ...state.mimics }
  delete mimics[key]
  let next = freshTerrain({ ...state, mimics }, key, null)
  const n = (state.shapeshiftersRevealed || 0) + 1
  const base = deriveTacticsUnit(enemyId, "enemy", pos, `creature-shapeshifter-${n}`)
  const d = state.difficulty
  const maxHp = d ? Math.max(1, Math.round(base.maxHp * (d.hp || 1))) : base.maxHp
  const attack = d && base.attack > 0 ? base.attack + (d.atk || 0) : base.attack
  const unit = { ...base, name: c.name, maxHp, hp: maxHp, attack, baseAttack: attack, facing: "E", creature: "shapeshifter", creatureTag: "Shapeshifter", mana: base.mana ?? 0, manaMax: base.manaMax ?? 0 }
  next = { ...next, units: [...next.units, unit], shapeshiftersRevealed: n }
  next = log(next, `🌲 ${c.reveal} A ${c.name} ${why === "struck" ? "tears free of the bark it wore" : "lunges out of the treeline"}!`)
  next = emit(next, { kind: "object", fx: "break", pos, label: c.reveal, tiles: [pos] })
  return emit(next, { kind: "reaction", unitId: unit.id, label: c.reveal })
}

// Enemy turn end: reveal next to a hero, otherwise creep one step closer.
export function shapeshifterTurnEnd(state) {
  const keys = hiddenShapeshifters(state)
  if (!keys.length) return state
  let next = state
  for (const key of keys) {
    const pos = posOf(key)
    const heroes = next.units.filter(isHero)
    if (!heroes.length) break
    const nearest = Math.min(...heroes.map((h) => dist(h.pos, pos)))
    if (nearest <= 1) {
      next = revealShapeshifter(next, key, "ambush")
      continue
    }
    const occupied = new Set(next.units.filter((u) => u.hp > 0).map((u) => keyOf(u.pos)))
    let best = null
    for (const dr of [-1, 0, 1]) for (const dc of [-1, 0, 1]) {
      if (!dr && !dc) continue
      const p = { row: pos.row + dr, col: pos.col + dc }
      if (p.row < 0 || p.col < 0 || p.row >= next.grid.rows || p.col >= next.grid.cols) continue
      const k = keyOf(p)
      if (occupied.has(k) || !OPEN.has((next.terrain || {})[k]) || next.mimics[k]) continue
      const d = Math.min(...heroes.map((h) => dist(h.pos, p)))
      if (!best || d < best.d || (d === best.d && k < best.k)) best = { p, k, d }
    }
    if (!best || best.d >= nearest) continue
    const mimics = { ...next.mimics }
    delete mimics[key]
    mimics[best.k] = state.mimics[key]
    next = freshTerrain({ ...next, mimics }, key, best.k)
    next = log(next, "🌲 Leaves rustle. One of the trees is closer than it was.")
    next = emit(next, { kind: "object", fx: "roll", pos: best.p, label: "Rustle...", tiles: [pos, best.p] })
  }
  return next
}

// ---- Root-Eaters ------------------------------------------------------------------
// The run says it arrives in this fight (rootEater.js rootEaterArrivesNow).
// It surfaces beside the enemy line and chews up the ground around it.
function eatAround(state, pos, limit) {
  const terrain = { ...(state.terrain || {}) }
  let trees = 0
  let eaten = 0
  for (const dr of [-1, 0, 1]) for (const dc of [-1, 0, 1]) {
    if (eaten >= limit) break
    const p = { row: pos.row + dr, col: pos.col + dc }
    if (p.row < 0 || p.col < 0 || p.row >= state.grid.rows || p.col >= state.grid.cols) continue
    const k = keyOf(p)
    if ((state.mimics || {})[k]) continue
    const t = terrain[k]
    const into = ROOT_EATER.eats[t]
    if (!into) continue
    if (t === "tree") trees++
    terrain[k] = into
    eaten++
  }
  return { state: { ...state, terrain, creatureTreesEaten: (state.creatureTreesEaten || 0) + trees }, eaten }
}

export function withRootEater(battle) {
  if (!battle?.units || battle.boss || !ENEMIES[ROOT_EATER.enemy]) return battle
  const foe = battle.units.find((u) => u.side === "enemy" && u.hp > 0)
  const origin = foe?.pos || { row: Math.floor(battle.grid.rows / 2), col: 1 }
  const [pos] = freeCellsNear(battle, origin, 1)
  if (!pos) return battle
  const base = deriveTacticsUnit(ROOT_EATER.enemy, "enemy", pos, "creature-root-eater")
  const maxHp = Math.max(1, Math.round(base.maxHp * ROOT_EATER.hpMult))
  const unit = { ...base, name: ROOT_EATER.name, maxHp, hp: maxHp, facing: "E", creature: "rooteater", creatureTag: ROOT_EATER.name }
  const eaten = eatAround({ ...battle, units: [...battle.units, unit], rootEaterArrived: true }, pos, 9).state
  return log(eaten, `🪱 ${ROOT_EATER.surface}`)
}

// Enemy turn end: each Root-Eater eats one tile of wood or roots next to it
// and heals on it. Eaten trees don't count against you (the forest knows).
export function rootEaterTurnEnd(state) {
  const eaters = (state?.units || []).filter((u) => u.creature === "rooteater" && u.hp > 0)
  let next = state
  for (const u of eaters) {
    const before = next.terrain || {}
    const res = eatAround(next, u.pos, 1)
    if (!res.eaten) continue
    const changed = Object.keys(res.state.terrain).find((k) => res.state.terrain[k] !== before[k])
    const live = res.state.units.find((x) => x.id === u.id)
    const hp = Math.min(live.maxHp, live.hp + ROOT_EATER.feedHeal)
    next = { ...res.state, units: res.state.units.map((x) => (x.id === u.id ? { ...x, hp } : x)) }
    next = log(next, `🪱 The ${ROOT_EATER.name} chews through the roots (+${hp - live.hp} HP).`)
    if (changed) next = emit(next, { kind: "object", fx: "crush", pos: posOf(changed), label: "Crunch!", tiles: [posOf(changed)] })
    next = emit(next, { kind: "reaction", unitId: u.id, label: "Crunch!" })
  }
  return next
}

// Everything the forest's creatures do after the enemy turn.
export function creaturesTurnEnd(state) {
  return rootEaterTurnEnd(shapeshifterTurnEnd(state))
}
