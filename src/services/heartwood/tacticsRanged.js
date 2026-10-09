// Hearthwood Frontier - RANGED heroes + MAGES (the "ranged rework").
// Marc: cover + hit chance made ranged heroes weaker and duller. This
// module gives them their own tools:
//
// - Shared ranged toolkit (every hero whose attack reaches 2+ tiles):
//   Aim (+20% to the next shot) and Suppressing Fire (the target gets
//   -20% to hit, loses its Aim/Overwatch, and moving draws a shot).
// - Archetypes (class `archetype` in classes.js): Sniper (Sentinel),
//   Grenadier (Artillery), Hunter (Ranger, Scout), Suppressor (Trapper),
//   and the Mage family (Spellblade, Frostbinder, Hexer, Alchemist,
//   Ritualist, Chronomancer, Corruptor).
// - Shot rules (read by tacticsCover.hitChance): Aimed, Point blank
//   (a ranged unit shooting an ADJACENT enemy: -25%), Suppressed,
//   Marked (counts as uncovered), arcing / area / beam shots ignore
//   cover, smoke tiles give half cover from every side.
//
// Pure, state in -> state out. Engine helpers are imported back from
// tacticsEngine.js (circular, call-time only - same as tacticsMana.js).
import { CLASSES } from "../../data/heartwood/classes"
import { isOnBoard } from "./targeting"
import { terrainAt } from "./tacticsTerrain"
import { FULL_COVER_TILES, HALF_COVER_TILES, facingSides } from "./tacticsCover"
import { emit, getUnit, setUnit, livingUnits, attackUnit, checkTacticsBattleEnd } from "./tacticsEngine"
import { explode } from "./tacticsObjects"
import { resourceMods } from "./tacticsMana"

// --- Numbers ------------------------------------------------------------------
export const RANGED_RANGE_FLOOR = 3
export const AIM_BONUS = 20
export const POINT_BLANK_PENALTY = 25
export const SUPPRESS_PENALTY = 20
export const ON_THE_MOVE_BONUS = 10
export const SNIPER_HIGH_RANGE = 2
export const SMOKE_TURNS = 2

export const ARCHETYPES = {
  sniper: { id: "sniper", name: "Sniper", icon: "◎", what: "Aims, waits and picks targets off from long range - best standing still on high ground." },
  grenadier: { id: "grenadier", name: "Grenadier", icon: "✹", what: "Lobs explosives over cover and tears cover apart." },
  hunter: { id: "hunter", name: "Hunter", icon: "⌖", what: "Marks prey (a Marked enemy has no cover), keeps moving and bounces shots between targets." },
  suppressor: { id: "suppressor", name: "Suppressor", icon: "⁂", what: "Pins enemies down: suppresses, roots and lays smoke that hides the squad." },
  mage: { id: "mage", name: "Mage", icon: "✦", what: "Spells bend the rules: area spells and beams ignore cover. Mana-hungry but can do a bit of everything." },
}

// Shared toolkit: every ranged hero carries these (unit.rangedKit).
export const RANGED_TOOLKIT = [
  { id: "aim", name: "Aim", icon: "◎", cost: 1, cooldown: 1, mana: 10, target: "self", toolkit: true, text: "Take careful aim: the next shot (attack, skill or Overwatch) gets +20% to hit. Lasts until your next turn." },
  { id: "suppress", name: "Suppressing Fire", icon: "⁂", cost: 1, cooldown: 3, mana: 15, target: "enemy", range: "reach", toolkit: true, text: "Pin an enemy under fire until your next turn: it gets -20% to hit, loses its Aim and Overwatch, and if it moves this hero shoots it." },
]

const cheb = (a, b) => Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col))
const key = (p) => `${p.row}-${p.col}`
const sign = (n) => (n > 0 ? 1 : n < 0 ? -1 : 0)
const addLog = (s, line) => ({ ...s, log: [...(s.log || []), line] })
const ended = (s) => s.phase === "won" || s.phase === "lost"

// --- Families ---------------------------------------------------------------------
export function archetypeIdOf(classId) {
  return CLASSES[classId]?.archetype || null
}
export function isMageClass(classId) {
  return archetypeIdOf(classId) === "mage"
}
export function archetypeOf(unit) {
  const id = unit?.side === "player" ? archetypeIdOf(unit.classId) : null
  return id ? ARCHETYPES[id] : null
}
// Ranged archetypes + mages shoot from 3 tiles, whatever the unit's def says.
export function classRangeFloor(classId) {
  return archetypeIdOf(classId) ? RANGED_RANGE_FLOOR : 1
}
export function isRangedHero(u) {
  return !!u && u.side === "player" && !u.structure && !u.npc && (u.range || 1) > 1
}
// Build-time fields (deriveTacticsUnit): range floor + the shared toolkit.
export function rangedFieldsFor(unit) {
  if (!unit || unit.side !== "player" || unit.structure || unit.npc) return unit
  const range = Math.max(unit.range || 1, classRangeFloor(unit.classId))
  const next = { ...unit, range }
  return isRangedHero(next) ? { ...next, rangedKit: RANGED_TOOLKIT.map((s) => ({ ...s, classId: unit.classId })) } : next
}

// --- Shot modifiers (tacticsCover.hitChance) -------------------------------------
// What a skill's shot does to the roll: aim bonus / ignore cover.
export function shotForSkill(skill) {
  if (!skill) return null
  if (skill.shot) return skill.shot
  if (skill.beam) return { ignoreCover: true, coverLabel: "Beam - cover doesn't help" }
  if (skill.indirect) return { ignoreCover: true, coverLabel: "Arcing shot - cover doesn't help" }
  if (skill.area) return { ignoreCover: true, coverLabel: "Area spell - cover doesn't help" }
  if (skill.aim) return { aim: skill.aim, label: skill.name }
  return null
}

// Extra hit % parts for one shot + whether cover is ignored.
export function shotMods(attacker, defender, dist, shot = null) {
  const parts = []
  let ignoreCover = false
  let coverLabel = null
  const player = attacker.side === "player"
  if (attacker.aimed > 0) parts.push({ label: "Aimed", value: AIM_BONUS })
  if (shot?.aim) parts.push({ label: shot.label || "Precise shot", value: shot.aim })
  if (dist <= 1 && (attacker.range || 1) > 1 && !attacker.structure) parts.push({ label: "Point blank (ranged)", value: -POINT_BLANK_PENALTY })
  if (attacker.suppressFire > 0) parts.push({ label: "Suppressed", value: -SUPPRESS_PENALTY })
  if (player && attacker.classPassive === "steady-aim" && attacker.moved && dist > 1) parts.push({ label: "On the move", value: ON_THE_MOVE_BONUS })
  // Resources step 2: Focus / breakpoint / Nature State accuracy.
  parts.push(...resourceMods(attacker).parts)
  const noFalloff = player && attacker.classPassive === "defensive-aim" && !attacker.moved
  if (shot?.ignoreCover) {
    ignoreCover = true
    coverLabel = shot.coverLabel || "Ignores cover"
  } else if (defender.mark > 0) {
    ignoreCover = true
    coverLabel = "Marked - no cover"
  }
  return { parts, ignoreCover, coverLabel, noFalloff }
}

// Melee rework: ENGAGED - a shooter with an enemy melee fighter right next
// to it can't Aim or go on Overwatch (and still shoots point blank, -25%).
export function isEngaged(state, unit) {
  if (!state?.units || !unit || unit.structure || (unit.range || 1) <= 1) return false
  return state.units.some(
    (e) => e.hp > 0 && e.side !== unit.side && !e.structure && !e.npc && (e.range || 1) === 1 && e.attack > 0 && !(e.stun > 0) && !(e.frozen > 0) && cheb(e.pos, unit.pos) <= 1,
  )
}

// The next shot spends the Aim.
export function consumeAim(state, attackerId) {
  const u = getUnit(state, attackerId)
  return u && u.aimed > 0 ? setUnit(state, attackerId, { aimed: 0 }) : state
}

// --- Smoke --------------------------------------------------------------------------
export function smokeAt(state, pos) {
  return (state?.smoke?.[key(pos)] || 0) > 0
}
export function blastTiles(state, center) {
  const out = []
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const p = { row: center.row + dr, col: center.col + dc }
      if (isOnBoard(p, state.grid)) out.push(p)
    }
  }
  return out
}
export function addSmoke(state, cells, turns = SMOKE_TURNS) {
  const smoke = { ...(state.smoke || {}) }
  for (const p of cells) smoke[key(p)] = Math.max(smoke[key(p)] || 0, turns)
  return { ...state, smoke }
}

// --- Visual events (TacticsFx) -------------------------------------------------
// fx: "arc" (lobbed), "beam" (a line), "ricochet", "suppress", "smoke".
export function emitShot(state, fx, from, to, tiles = null, actorId = null) {
  return emit(state, { kind: "shot", fx, actorId, from: { ...from }, to: { ...to }, tiles: tiles ? tiles.map((p) => ({ ...p })) : [{ ...to }] })
}

// --- Beams ---------------------------------------------------------------------------
export function lineDirOf(from, to) {
  const dr = to.row - from.row
  const dc = to.col - from.col
  if (dr === 0 && dc === 0) return null
  if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return null
  return { dr: sign(dr), dc: sign(dc) }
}
// Tiles a beam crosses toward `to` (row/column/diagonal), up to `range`;
// a barricade stops it. [] when `to` isn't on a straight line.
export function beamTiles(state, from, to, range) {
  const dir = lineDirOf(from, to)
  if (!dir) return []
  const out = []
  for (let i = 1; i <= range; i++) {
    const p = { row: from.row + dir.dr * i, col: from.col + dir.dc * i }
    if (!isOnBoard(p, state.grid) || terrainAt(state, p) === "wall") break
    out.push(p)
  }
  return out
}

// --- Cover breaking ----------------------------------------------------------------
// One "shred" step: full cover -> half, half -> none. Barrels / spore
// pods blow up instead.
const SHRED_FULL = { rock: "rubble", tree: "stump", boulder: "rubble", icepillar: "ice", wall: "rubble" }
const SHRED_HALF = { log: "path", bush: "path", stump: "path", rubble: "path" }

function setTileClean(state, pos, kind) {
  const k = key(pos)
  const strip = (m) => {
    if (!m || !(k in m)) return m
    const c = { ...m }
    delete c[k]
    return c
  }
  return { ...state, terrain: { ...(state.terrain || {}), [k]: kind }, wallHp: strip(state.wallHp), objHp: strip(state.objHp), objFire: strip(state.objFire), objChill: strip(state.objChill) }
}

export function shredTile(state, pos, steps = 1) {
  let s = state
  for (let i = 0; i < steps; i++) {
    if (ended(s)) break
    const t = terrainAt(s, pos)
    if (t === "barrel" || t === "sporepod") return explode(s, pos)
    const to = SHRED_FULL[t] || SHRED_HALF[t]
    if (!to) break
    s = setTileClean(s, pos, to)
    s = emit(addLog(s, `The ${t === "wall" ? "barricade" : t} is blasted apart!`), { kind: "object", fx: "break", pos: { ...pos }, label: "Shredded!", tiles: [{ ...pos }] })
  }
  return checkTacticsBattleEnd(s)
}

// Cover sources next to `defPos` on the sides facing `atkPos`.
export function coverSourcesToward(state, defPos, atkPos) {
  const D = { N: { row: -1, col: 0 }, S: { row: 1, col: 0 }, E: { row: 0, col: 1 }, W: { row: 0, col: -1 } }
  const out = []
  for (const side of facingSides(defPos, atkPos)) {
    const p = { row: defPos.row + D[side].row, col: defPos.col + D[side].col }
    if (!isOnBoard(p, state.grid)) continue
    const t = terrainAt(state, p)
    if (FULL_COVER_TILES.has(t) || HALF_COVER_TILES.has(t) || t === "wall") out.push(p)
  }
  return out
}

// --- Ricochet -------------------------------------------------------------------------
export function ricochetTarget(state, from, side, exclude, radius) {
  let best = null
  for (const u of livingUnits(state, side)) {
    if (u.structure || exclude.includes(u.id)) continue
    const d = cheb(u.pos, from)
    if (d > radius) continue
    if (!best || d < best.d || (d === best.d && (u.pos.row < best.u.pos.row || (u.pos.row === best.u.pos.row && u.pos.col < best.u.pos.col)))) best = { u, d }
  }
  return best ? best.u : null
}

// --- Suppression ---------------------------------------------------------------------
// `targetId` is pinned under `shooterId`'s fire until the shooter's side
// starts its next turn: -20% to hit, its Aim and Overwatch are lost,
// and moving draws one reaction shot.
export function suppressUnit(state, shooterId, targetId) {
  const shooter = getUnit(state, shooterId)
  const t = getUnit(state, targetId)
  if (!shooter || !t || t.hp <= 0) return state
  let s = setUnit(state, targetId, { suppressFire: 1, suppressBy: shooterId, suppressSide: shooter.side, aimed: 0, overwatch: 0 })
  s = emit(s, { kind: "reaction", unitId: targetId, label: "Suppressed!" })
  return addLog(s, `${shooter.name} pins ${t.name} down under fire (-${SUPPRESS_PENALTY}% to hit, moving draws a shot).`)
}

// After any move: a suppressed unit that moved eats one shot (the line
// of fire is already set up - no reach check, range falloff still applies).
export function afterMoveSuppression(state, moverId) {
  const m = getUnit(state, moverId)
  if (!m || m.hp <= 0 || !(m.suppressFire > 0) || ended(state)) return state
  const shooter = getUnit(state, m.suppressBy)
  let s = setUnit(state, moverId, { suppressFire: 0, suppressBy: null })
  if (!shooter || shooter.hp <= 0 || shooter.stun > 0 || shooter.frozen > 0 || !(shooter.attack > 0)) return s
  s = emit(addLog(s, `${shooter.name}'s suppressing fire catches ${m.name} on the move!`), { kind: "reaction", unitId: shooter.id, label: "Suppressing fire!" })
  return attackUnit(s, shooter.id, moverId, { isReaction: true })
}

// --- Turn hooks ----------------------------------------------------------------------
function clearFor(state, side) {
  let s = state
  for (const u of state.units) {
    if (u.hp <= 0) continue
    const patch = {}
    if (u.suppressFire > 0 && u.suppressSide === side) Object.assign(patch, { suppressFire: 0, suppressBy: null })
    if (u.aimed > 0 && u.side === side) patch.aimed = 0
    if (Object.keys(patch).length) s = setUnit(s, u.id, patch)
  }
  return s
}

// Start of the player's turn (classPlayerTurnStart): heroes' old Aim
// lapses, their suppression ends, smoke thins out.
export function rangedPlayerTurnStart(state) {
  let s = clearFor(state, "player")
  if (s.smoke && Object.keys(s.smoke).length) {
    const smoke = {}
    for (const [k, v] of Object.entries(s.smoke)) if (v - 1 > 0) smoke[k] = v - 1
    s = { ...s, smoke }
  }
  return s
}

// Start of the enemy phase (enemyPhaseStart - the preview sees it too).
export function rangedEnemyPhaseStart(state) {
  return clearFor(state, "enemy")
}

// One-line player-facing summary of a unit's ranged statuses (tooltips).
export function rangedStatusText(u, state = null) {
  const out = []
  if (u.aimed > 0) out.push(`Aiming: next shot +${AIM_BONUS}% to hit`)
  if (u.suppressFire > 0) out.push(`Suppressed: -${SUPPRESS_PENALTY}% to hit, moving draws a shot`)
  if (u.mark > 0) out.push("Marked: counts as having no cover")
  if (state && isEngaged(state, u)) out.push("ENGAGED: an enemy fighter is next to it - no Aim, no Overwatch")
  if (state && smokeAt(state, u.pos)) out.push("In smoke: half cover from every side vs ranged")
  return out.join(" · ")
}
