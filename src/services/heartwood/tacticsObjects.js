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
// Forest creatures: a Shapeshifter hides as a tree (tacticsCreatures.js).
import { revealShapeshifter, creaturesTurnEnd } from "./tacticsCreatures"
import { isOnBoard, samePos, kingAdjacent } from "./targeting"
import { TERRAIN, terrainAt, WALL_MAX_HP, CUSTOM_OBJECT_IDS } from "./tacticsTerrain"
import { BATTLE_OBJECTS, BREAK_EFFECTS } from "../../data/heartwood/battleObjects"
import { coverAgainst } from "./tacticsCover"
import { emit, getUnit, setUnit, applyDamageWithBlock, checkTacticsBattleEnd, checkEnemyPhase, trySpawnBrood } from "./tacticsEngine"
import { applyElement, abilityElement } from "./tacticsElements"
import { BURNS_TO, FLARES, BREAKS_TO, MOSS_HEAL, LEAF_FLARE_DAMAGE, GLOWCAP_HEAL, FLARE_TURNS, isBurnable, spreadsInto, crushResult, forestSpell, spellAreaTiles } from "./tacticsForest"

export const OBJECTS = {
  tree: { name: "Tree", hp: 6, icon: "🌲" },
  barrel: { name: "Powder barrel", hp: 1, icon: "🛢", explosive: "fire" },
  sporepod: { name: "Spore pod", hp: 1, icon: "🍄", explosive: "poison" },
  boulder: { name: "Boulder", hp: 12, icon: "🪨" },
  icepillar: { name: "Ice pillar", hp: 6, icon: "🧊" },
  // Battlefield piece 3 - the living forest.
  stone: { name: "Runestone", hp: 10, icon: "🗿" },
  glowcap: { name: "Glowcap", hp: 1, icon: "🍄" },
}
// Studio-made objects (data/heartwood/battleObjects.js): `custom` routes
// them through damageCustomObject; blasts also carry `explosive` so fire
// chains, the AI and the chaos knockbacks treat them like barrels/pods.
const BLAST_KIND = { fireBlast: "fire", poisonBurst: "poison" }
for (const id of CUSTOM_OBJECT_IDS) {
  const d = BATTLE_OBJECTS[id]
  OBJECTS[id] = {
    name: d.name || id,
    hp: Math.max(1, Math.min(20, Math.round(Number(d.hp) || 1))),
    icon: d.icon || "❖",
    image: d.image || "",
    custom: true,
    onBreak: d.onBreak,
    power: Math.max(0, Math.round(Number(d.power) || 0)),
    leaves: TERRAIN[d.leaves] && !TERRAIN[d.leaves].obj && TERRAIN[d.leaves].cost !== Infinity ? d.leaves : "rubble",
    ...(BLAST_KIND[d.onBreak] ? { explosive: BLAST_KIND[d.onBreak] } : {}),
  }
}
// How hard a blast object hits (built-ins keep their constants).
export function blastDamage(type) {
  const def = OBJECTS[type]
  if (def?.custom) return def.power
  return def?.explosive === "fire" ? BARREL_DAMAGE : SPORE_DAMAGE
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
// Forest ground the AI weighs (roots snag, dry leaves flare).
const AI_FOREST_GROUND = new Set(["roots", "leaves"])
export function hasObjects(state) {
  return Object.values(state.terrain || {}).some((t) => OBJECTS[t] || t === "fire" || AI_FOREST_GROUND.has(t))
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
// (Exported for tacticsChaos.js - knockback impacts.)
export function hurtUnit(state, unitId, amount, why) {
  return hurt(state, unitId, amount, why)
}
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
export function placeTimedTile(state, pos, type, turns) {
  return timedTile(state, pos, type, turns)
}
function timedTile(state, pos, type, turns) {
  const key = k(pos)
  const was = state.terrain?.[key] || "path"
  const rule = TERRAIN[was] || TERRAIN.path
  if (rule.cost === Infinity || was === "bridge" || was === "lava") return state
  const prev = state.tileTimers?.[key]
  // Battlefield piece 3: fire landing on burnable forest ground catches it
  // (dry leaves flare) and burns down to ash instead of growing back.
  if (type === "fire" && !prev && isBurnable(was)) return igniteGround(state, pos)
  const revert = prev ? prev.revert : was
  const next = setTile(state, pos, type)
  return { ...next, tileTimers: { ...(next.tileTimers || {}), [key]: { turns, revert } } }
}

// Chaos sprint: fire catches TALL GRASS - it becomes flames for a couple
// of turns and burns down to ash (spreading to the grass beside it next round).
// Battlefield piece 3: the same for every burnable forest tile (moss, roots,
// logs, branches, stumps); dry leaves FLARE instead (flareLeaves).
const IGNITE_LINE = {
  bush: "The tall grass catches fire!",
  moss: "The moss smoulders and burns.",
  roots: "The roots catch fire!",
  log: "The fallen log catches fire!",
  branches: "The branches go up in flames!",
  stump: "The stump catches fire!",
}
export function igniteGround(state, pos) {
  if (!isOnBoard(pos, state.grid)) return state
  const t = terrainAt(state, pos)
  if (!isBurnable(t)) return state
  if (FLARES.has(t)) return flareLeaves(state, pos)
  const key = k(pos)
  let next = setTile(state, pos, "fire")
  next = { ...next, tileTimers: { ...(next.tileTimers || {}), [key]: { turns: FIRE_TILE_TURNS, revert: BURNS_TO[t] } } }
  return objEvent(addLog(next, IGNITE_LINE[t] || "The ground catches fire!"), "grassfire", pos, t === "bush" ? "Grass fire!" : "Ablaze!", { tiles: [pos] })
}
export function igniteGrass(state, pos) {
  return isOnBoard(pos, state.grid) && terrainAt(state, pos) === "bush" ? igniteGround(state, pos) : state
}

// Dry leaves: the fire leaps across every connected leaf tile at once,
// scorching whoever stands in them; the flames die after a turn.
function flareLeaves(state, pos) {
  const seen = new Set([k(pos)])
  const queue = [pos]
  const tiles = []
  while (queue.length) {
    const cur = queue.shift()
    tiles.push(cur)
    for (const d of ORTHO) {
      const p = { row: cur.row + d.row, col: cur.col + d.col }
      if (!isOnBoard(p, state.grid) || seen.has(k(p)) || !FLARES.has(terrainAt(state, p))) continue
      seen.add(k(p))
      queue.push(p)
    }
  }
  tiles.sort((a, b) => (k(a) < k(b) ? -1 : 1))
  let next = state
  const timers = {}
  for (const p of tiles) {
    next = setTile(next, p, "fire")
    timers[k(p)] = { turns: FLARE_TURNS, revert: "ash" }
  }
  next = { ...next, tileTimers: { ...(next.tileTimers || {}), ...timers } }
  next = objEvent(addLog(next, `The dry leaves FLARE up (${tiles.length} tile${tiles.length > 1 ? "s" : ""})!`), "flare", pos, "Flare!", { tiles })
  for (const p of tiles) {
    if (ended(next)) break
    const u = unitAt(next, p)
    if (u) next = hurt(next, u.id, LEAF_FLARE_DAMAGE, "the flaring leaves")
  }
  return checkTacticsBattleEnd(next)
}

// Heavy impacts (explosions, a rolling boulder, earth-shaking spells) break
// the ground down one step (tacticsForest CRUSHES_TO): grass/moss/leaves/
// roots flatten, a log splinters into branches, rocks crack to rubble,
// rubble to gravel. Burning or poisoned (timed) tiles are left alone.
export function crushTiles(state, tiles) {
  let next = state
  const changed = []
  for (const p of tiles) {
    if (!isOnBoard(p, next.grid) || next.tileTimers?.[k(p)]) continue
    const into = crushResult(terrainAt(next, p))
    if (!into) continue
    next = setTile(next, p, into)
    changed.push(p)
  }
  return changed.length ? objEvent(next, "crush", changed[0], "Crushed!", { tiles: changed }) : next
}

// Glowcaps pop into healing spores: every unit in the 3x3 heals (both
// sides - timing is the choice); soft moss is left where they grew.
export function bloomGlowcap(state, pos, heal = GLOWCAP_HEAL, leaves = BREAKS_TO.glowcap, line = "The glowcaps burst in a cloud of healing spores!") {
  let next = addLog(setTile(state, pos, leaves), line)
  const area = spellAreaTiles(pos, 1, state.grid)
  next = objEvent(next, "bloom", pos, "Healing spores!", { tiles: area })
  for (const p of area) {
    const u = unitAt(next, p)
    if (!u || u.structure) continue
    const amount = Math.min(u.maxHp - u.hp, heal)
    if (amount <= 0) continue
    next = emit(setUnit(next, u.id, { hp: u.hp + amount }), { kind: "heal", actorId: u.id, targetId: u.id, amount })
  }
  return next
}

// Moss: a unit ending its side's turn on moss recovers MOSS_HEAL.
export function forestTurnEnd(state, side) {
  if (!state.terrain || ended(state)) return state
  let next = state
  for (const u of state.units) {
    if (u.side !== side || u.hp <= 0 || u.structure || u.hp >= u.maxHp) continue
    if (!TERRAIN[terrainAt(state, u.pos)]?.moss) continue
    const heal = Math.min(u.maxHp - u.hp, MOSS_HEAL)
    next = emit(addLog(setUnit(next, u.id, { hp: u.hp + heal }), `${u.name} rests on the moss (+${heal}).`), { kind: "heal", actorId: u.id, targetId: u.id, amount: heal })
  }
  // The forest's creatures act after the enemy turn: hidden Shapeshifters
  // creep (or burst out), Root-Eaters feed.
  return side === "enemy" ? creaturesTurnEnd(next) : next
}

// Spells strike the forest (tacticsForest FOREST_SPELLS): objects in the
// area take the hit (trees fall away from the centre), the element
// reshapes the ground, a quake crushes it. `radius` = the spell's own
// radius field (used when the table says radius: "skill"). `baseline` = the
// terrain before the blow, when the caller already changed tiles itself
// (so one blow never breaks a tile down two steps).
export function forestSpellStrike(state, spellId, center, casterPos, radius = 1, baseline = null) {
  const spec = forestSpell(spellId)
  if (!spec || !center || !state.terrain || ended(state)) return state
  const r = spec.radius === "skill" ? radius || 1 : spec.radius
  const tiles = spellAreaTiles(center, r, state.grid)
  const fire = spec.element === "fire"
  const frost = spec.element === "frost"
  let next = state
  const before = baseline || state.terrain || {}
  for (const p of tiles) {
    if (ended(next)) break
    if (!isAttackableTile(terrainAt(next, p)) || (casterPos && samePos(p, casterPos))) continue
    const from = samePos(p, center) && casterPos ? casterPos : center
    next = damageObject(next, p, spec.power, { row: sign(p.row - from.row), col: sign(p.col - from.col) }, { fire, frost })
  }
  for (const p of tiles) {
    if (ended(next)) break
    const t = terrainAt(next, p)
    if (fire && isBurnable(t)) next = igniteGround(next, p)
    if (frost && t === "water") next = freezeWater(next, p)
    if (frost && t === "icepillar") next = chillPillar(next, p)
  }
  // The quake crushes what was ALREADY lying there - debris this spell just
  // made (a felled tree's stump and log) stays: things break down one step
  // per blow.
  if (spec.quake && !ended(next)) next = crushTiles(next, tiles.filter((p) => (next.terrain?.[k(p)] || "path") === (before[k(p)] || "path")))
  return checkTacticsBattleEnd(next)
}

// Chaos sprint: frost freezes deep WATER into walkable ice (an ice bridge).
export function freezeWater(state, pos) {
  if (!isOnBoard(pos, state.grid) || terrainAt(state, pos) !== "water") return state
  const next = setTile(state, pos, "ice")
  return objEvent(addLog(next, "The water freezes solid - an ice bridge!"), "freeze", pos, "Ice bridge!", { tiles: [pos] })
}

// --- damage / destruction ----------------------------------------------------------
// Any source hitting an object tile. dir = travel direction (for tree falls).
export function damageObject(state, pos, amount, dir = null, opts = {}) {
  if (!isOnBoard(pos, state.grid) || ended(state)) return state
  const type = terrainAt(state, pos)
  const key = k(pos)
  // A Shapeshifter's "tree": striking it drags the creature out.
  if (state.mimics?.[key]) return revealShapeshifter(state, key, "struck")
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
  if (def.custom) return damageCustomObject(state, pos, amount, dir)
  if (type === "glowcap") return bloomGlowcap(state, pos)
  if (def.explosive) return explode(state, pos)
  if (type === "icepillar" && isChilled(state, pos)) return shatterPillar(state, pos)
  const hp = Math.max(0, objectHpAt(state, pos) - amount)
  if (hp <= 0) {
    if (type === "tree") return fellTree(state, pos, dir)
    if (type === "icepillar") return shatterPillar(state, pos)
    return objEvent(addLog(setTile(state, pos, BREAKS_TO[type] || "rubble"), `The ${def.name.toLowerCase()} cracks apart.`), "break", pos, "Crumbles!")
  }
  let next = objEvent({ ...state, objHp: { ...(state.objHp || {}), [key]: hp } }, "hit", pos, `-${amount}`)
  if (type === "tree" && opts.fire) next = igniteTree(next, pos)
  if (type === "icepillar" && opts.frost) next = chillPillar(next, pos)
  return next
}

// A Studio-made object takes the hit; at 0 HP its chosen effect fires.
function damageCustomObject(state, pos, amount, dir) {
  const def = OBJECTS[terrainAt(state, pos)]
  const hp = Math.max(0, objectHpAt(state, pos) - amount)
  if (hp > 0) return objEvent({ ...state, objHp: { ...(state.objHp || {}), [k(pos)]: hp } }, "hit", pos, `-${amount}`)
  const name = def.name.toLowerCase()
  if (def.explosive) return explode(state, pos)
  if (def.onBreak === "healBurst") return bloomGlowcap(state, pos, def.power, def.leaves, `The ${name} bursts - healing spores fill the air!`)
  if (def.onBreak === "iceShards") return shatterPillar(state, pos, def.power, def.leaves, `The ${name} shatters into ice shards!`)
  if (def.onBreak === "fall") return fellTree(state, pos, dir, def.leaves, `Timber! The ${name} comes crashing down.`)
  return objEvent(addLog(setTile(state, pos, def.leaves), `The ${name} cracks apart.`), "break", pos, "Crumbles!")
}

// Timber! The tree topples along `dir`, hitting the next 2 tiles; a
// fallen log is left where it lands, a stump where it stood.
export function fellTree(state, pos, dir, leaves = "stump", line = "Timber! The tree comes crashing down.") {
  const d = dir && (dir.row || dir.col) ? { row: sign(dir.row), col: sign(dir.col) } : { row: 0, col: -1 }
  let next = addLog(setTile(state, pos, leaves), line)
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
export function shatterPillar(state, pos, damage = SHATTER_DAMAGE, leaves = "ice", line = "The ice pillar shatters!") {
  let next = addLog(setTile(state, pos, leaves), line)
  const around = []
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if (dr || dc) around.push({ row: pos.row + dr, col: pos.col + dc })
  next = objEvent(next, "shatter", pos, "Shatter!", { tiles: [pos, ...around.filter((p) => isOnBoard(p, state.grid))] })
  for (const p of around) {
    if (ended(next)) break
    const u = unitAt(next, p)
    if (!u) continue
    next = hurt(next, u.id, damage, "ice shards")
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
  const dmg = blastDamage(type)
  let next = setTile(state, pos, def.custom ? def.leaves : fire ? "ash" : "path")
  const area = []
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    const p = { row: pos.row + dr, col: pos.col + dc }
    if (isOnBoard(p, state.grid)) area.push(p)
  }
  const line = def.custom ? (fire ? `Boom! The ${def.name.toLowerCase()} explodes!` : `Pop! The ${def.name.toLowerCase()} bursts in a toxic cloud!`) : fire ? "Boom! The powder barrel explodes!" : "Pop! The spore pod bursts in a toxic cloud!"
  next = objEvent(addLog(next, line), fire ? "boom" : "spore", pos, fire ? "Boom!" : "Spores!", { tiles: area })
  for (const p of area) {
    if (ended(next)) break
    const u = unitAt(next, p)
    if (u) {
      next = hurt(next, u.id, dmg, fire ? "the blast" : "the spores")
      if (!fire && getUnit(next, u.id)?.hp > 0) next = setUnit(next, u.id, { poison: (getUnit(next, u.id).poison || 0) + 2 })
    }
  }
  // Battlefield piece 3: the blast reshapes the ground around it - a fire
  // blast sets burnable forest ground alight (dry leaves flare), any blast
  // crushes the rest one step (rocks -> rubble, logs -> branches...).
  for (const p of area) {
    if (ended(next) || samePos(p, pos) || OBJECTS[terrainAt(next, p)]) continue
    if (fire && isBurnable(terrainAt(next, p))) next = igniteGround(next, p)
    else next = crushTiles(next, [p])
  }
  if (ended(next)) return checkTacticsBattleEnd(next)
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
  // Chaos sprint: a fire blast sets the tall grass in the 3x3 alight.
  if (fire) for (const p of area) if (!ended(next) && terrainAt(next, p) === "bush") next = igniteGrass(next, p)
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
  // Battlefield piece 3: it flattens what it rolls over.
  next = crushTiles(next, path.slice(0, -1))
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
// Chaos sprint: fire also lights the tall grass the unit stands in; frost
// freezes the deep water next to the unit into ice.
export function elementNear(state, pos, element) {
  if (!pos || (element !== "fire" && element !== "frost")) return state
  let next = state
  if (element === "fire" && isBurnable(terrainAt(next, pos))) next = igniteGround(next, pos)
  for (const d of ORTHO) {
    const p = { row: pos.row + d.row, col: pos.col + d.col }
    if (!isOnBoard(p, next.grid)) continue
    const t = terrainAt(next, p)
    if (element === "fire" && t === "tree") next = igniteTree(next, p)
    if (element === "frost" && t === "icepillar") next = chillPillar(next, p)
    if (element === "frost" && t === "water") next = freezeWater(next, p)
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
    else if (spreadsInto(t)) next = igniteGround(next, p)
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

// Telegraph (board): tiles the fire will catch when the turn ends - what
// burning trees and flames spread into next tick (objectsRoundTick).
export function fireSpreadTargets(state) {
  const keys = new Set()
  const sources = [...Object.keys(state.objFire || {}), ...Object.entries(state.terrain || {}).filter(([, t]) => t === "fire").map(([key]) => key)]
  for (const key of sources) {
    const pos = fromKey(key)
    for (const d of ORTHO) {
      const p = { row: pos.row + d.row, col: pos.col + d.col }
      if (!isOnBoard(p, state.grid)) continue
      const t = terrainAt(state, p)
      if ((t === "tree" && !isBurning(state, p)) || OBJECTS[t]?.explosive === "fire" || spreadsInto(t)) keys.add(k(p))
    }
  }
  return keys
}

// --- enemy AI helpers --------------------------------------------------------------------
// Tile penalty: next to a burning tree or an explosive.
export function aiObjectTilePenalty(state, pos) {
  if (!state.terrain) return 0
  let pen = 0
  // Battlefield piece 3: roots stop you; dry leaves next to a fire flare.
  const own = state.terrain[k(pos)]
  if (own === "roots") pen += 4
  if (own === "leaves" && nearFire(state, pos)) pen += 12
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    if (!dr && !dc) continue
    const p = { row: pos.row + dr, col: pos.col + dc }
    const t = state.terrain[k(p)]
    if (t === "tree" && isBurning(state, p)) pen += 15
    else if (OBJECTS[t]?.explosive) pen += 6
  }
  return pen
}

function nearFire(state, pos) {
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    const p = { row: pos.row + dr, col: pos.col + dc }
    const t = state.terrain?.[k(p)]
    if (t === "fire" || (t === "tree" && isBurning(state, p))) return true
  }
  return false
}

// Explosives worth setting off from `pos`: players in the blast, no allies.
export function aiExplosiveTargets(state, enemy, pos, range) {
  const out = []
  for (const [key, t] of Object.entries(state.terrain || {})) {
    if (!OBJECTS[t]?.explosive) continue
    const at = fromKey(key)
    if (cheb(pos, at) > range) continue
    const dmg = blastDamage(t)
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
  if (type === "tree") return `Tree (${hp}/${max} HP): blocks movement. FULL cover for a hero right next to it (-40% to be hit from that side). Chop it down (1 AP) and it FALLS away from you: ${TREE_FALL_DAMAGE} damage to whoever stands on the next 2 tiles, leaving a log. Fire sets it ablaze for ${TREE_BURN_TURNS} turns - it scorches neighbours and spreads to trees beside it.${isBurning(state, pos) ? ` BURNING: ${state.objFire[k(pos)]} turn(s) left.` : ""}`
  if (type === "barrel") return `Powder barrel: any hit (or fire) blows it up - ${BARREL_DAMAGE} damage to everything in the 3x3 around it, and the ground burns for ${FIRE_TILE_TURNS} turns.`
  if (type === "sporepod") return `Spore pod: any hit bursts it - ${SPORE_DAMAGE} damage and +2 Poison to everything in the 3x3 around it; poison pools linger ${POISON_TILE_TURNS} turns.`
  if (type === "boulder") return `Boulder (${hp}/${max} HP): blocks movement. Hit it from right next to it (1 AP) to SHOVE it - it rolls away until something stops it, dealing ${BOULDER_DAMAGE} to what it hits.`
  if (type === "stone") return `Runestone (${hp}/${max} HP): an old mossy standing stone - blocks movement, FULL cover for a hero right next to it. The toughest thing on the field; it cracks into rubble (half cover).`
  if (type === "glowcap") return `Glowcap: any hit pops it - healing spores restore ${GLOWCAP_HEAL} HP to EVERY unit in the 3x3 around it (yours and theirs), leaving soft moss. Pop it when your heroes are close and theirs aren't.`
  if (OBJECTS[type].custom) {
    const def = OBJECTS[type]
    const src = BATTLE_OBJECTS[type]
    const effect = BREAK_EFFECTS[def.onBreak].text.replace("{power}", def.power)
    return `${def.name} (${hp}/${max} HP): blocks movement. FULL cover for a hero right next to it. Break it: ${effect}${src?.note ? ` ${src.note}` : ""}`
  }
  if (type === "icepillar") return `Ice pillar (${hp}/${max} HP): Frost (a Frost attack, or Chill landing next to it) makes it brittle; the next hit shatters it - ${SHATTER_DAMAGE} damage + 1 Chill to every hero around it.${isChilled(state, pos) ? " BRITTLE: the next hit shatters it!" : ""}`
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
  // Studio-made objects ("Try it in a practice battle"): along the open
  // bottom row, then the free middle tiles.
  const slots = ["8-4", "8-6", "8-8", "8-10", "2-4", "6-4", "0-8", "3-9", "6-9", "2-10"]
  CUSTOM_OBJECT_IDS.forEach((id, i) => { if (slots[i]) terrain[slots[i]] = id })
  return terrain
}
export function withObjectShowcase(state) {
  return { ...state, terrain: objectShowcaseTerrain(), wallHp: {}, objHp: {}, objFire: {}, objChill: {}, tileTimers: {}, objectShowcase: true }
}
