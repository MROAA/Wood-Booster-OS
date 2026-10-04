// Hearthwood Frontier - class system (part A). Applies class passives
// and executes class skills (data in data/heartwood/classes.js).
// Pure, deterministic, state in -> state out. Engine helpers are imported
// back from tacticsEngine.js (circular, call-time only - same pattern as
// tacticsRelics.js / tacticsElements.js).
//
// Class statuses live on units as small counters. Every counter drops by
// 1 at the start of each player turn (classPlayerTurnStart), so 1 = "until
// your next turn" and 2 = "for 2 turns". No state.turn needed, which keeps
// the damage mods pure (previewEnemyIntents stays an exact dry-run).
import { CLASSES, classById, fallbackClassId } from "../../data/heartwood/classes"
export { upgradeClassSkill, applySkillUpgrades } from "../../data/heartwood/classes"
import { kingAdjacent, isOnBoard, samePos } from "./targeting"
import { TERRAIN, terrainAt, canReach, WALL_MAX_HP } from "./tacticsTerrain"
import {
  getUnit,
  setUnit,
  emit,
  livingUnits,
  checkTacticsBattleEnd,
  abilityHit,
  applyDamageWithBlock,
  checkEnemyPhase,
  trySpawnBrood,
  deriveTacticsUnit,
  freeCellsNear,
  applyPortableEffect,
} from "./tacticsEngine"
import { applyElement, reactStatus, ENTANGLE_DURATION } from "./tacticsElements"
import { enemySkillsFor } from "./tacticsEnemyAbilities"
import { rollBoulder } from "./tacticsObjects"
import { canAfford, hasMana, manaCostOf } from "./tacticsMana"

const SLOW = 2
const ROOT = 2
const COUNTERS = ["guarded", "zoneGuard", "overwatch", "hunkered", "mark", "sMark", "challenged", "exposed", "silenced", "disarmed", "empower", "cursed", "soulDebt", "appraised", "phased", "frenzy"]
const DEBUFFS = ["poison", "burn", "chill", "frozen", "root", "slow", "weak", "vulnerable", "entangle", "suppressed", "mark", "sMark", "exposed", "silenced", "disarmed", "challenged", "cursed", "soulDebt", "appraised", "corruption"]
const CLEANSED = ["poison", "burn", "chill", "frozen", "root", "slow", "weak", "vulnerable", "entangle", "suppressed", "disarmed", "cursed"]
// Part B: max bonus Essence one fight can pay out (Merchant/Gatherer).
export const BONUS_ESSENCE_CAP = 5
const MERCHANT_BOUNTY_CAP = 3

const dist = (a, b) => Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col))
const sign = (n) => (n > 0 ? 1 : n < 0 ? -1 : 0)
const addLog = (state, line) => ({ ...state, log: [...(state.log || []), line] })
const callout = (state, unitId, label) => emit(state, { kind: "reaction", unitId, label })
const has = (u, passiveId) => !!u && u.classPassive === passiveId
const hpFrac = (u) => u.hp / u.maxHp
const ended = (s) => s.phase === "won" || s.phase === "lost"

function cardinal(dCol, dRow) {
  if (Math.abs(dCol) >= Math.abs(dRow)) return dCol >= 0 ? "E" : "W"
  return dRow >= 0 ? "S" : "N"
}
const BEHIND = { N: { row: 1, col: 0 }, S: { row: -1, col: 0 }, E: { row: 0, col: -1 }, W: { row: 0, col: 1 } }

function tileFree(state, pos, ignoreId = null) {
  if (!isOnBoard(pos, state.grid)) return false
  if (TERRAIN[terrainAt(state, pos)].cost === Infinity) return false
  return !state.units.some((u) => u.hp > 0 && u.id !== ignoreId && samePos(u.pos, pos))
}

function isTaunting(state, u) {
  return u.taunt > 0 || (u.shoutTurn != null && u.shoutTurn === state.turn)
}

// --- Build ------------------------------------------------------------------

// Fields every player unit gets at battle build (deriveTacticsUnit).
export function classFieldsFor(def, side, { commander = false, abilityKind = null } = {}) {
  if (side !== "player" || !def || def.summonOnly) return { classId: null, classPassive: null, classSkills: [], classCds: {} }
  const classId = commander ? "commander" : def.classId || fallbackClassId(def, abilityKind)
  const cls = CLASSES[classId]
  return {
    classId,
    classPassive: cls.passive.id,
    classSkills: cls.skills.map((s) => ({ ...s, classId })),
    classCds: {},
  }
}

export function classSkillById(unit, skillId) {
  return (unit?.classSkills || []).find((s) => s.id === skillId) || null
}

export function classSkillReady(unit, skill) {
  return !!unit && !!skill && unit.hp > 0 && unit.ap >= skill.cost && !((unit.classCds || {})[skill.id] > 0) && canAfford(unit, skill)
}

// --- Skill tree ----------------------------------------------------------------

const FOE_T = {
  stun: (s, id, v) => callout(setUnit(s, id, { stun: Math.max(getUnit(s, id).stun || 0, v) }), id, "Stunned!"),
  root: (s, id) => rootUnit(s, id),
  slow: (s, id) => callout(slowUnit(s, id), id, "Slowed!"),
  poison: (s, id, v) => applyElement(s, id, "poison", v),
  burn: (s, id, v) => applyElement(s, id, "fire", v),
  chill: (s, id, v) => applyElement(s, id, "frost", v),
  expose: (s, id, v) => callout(setUnit(s, id, { exposed: Math.max(getUnit(s, id).exposed || 0, v) }), id, "Exposed!"),
  curse: (s, id, v) => callout(setUnit(s, id, { cursed: Math.max(getUnit(s, id).cursed || 0, v) }), id, "Cursed!"),
  disarm: (s, id, v) => callout(setUnit(s, id, { disarmed: Math.max(getUnit(s, id).disarmed || 0, v) }), id, "Disarmed!"),
  silence: (s, id, v) => callout(setUnit(s, id, { silenced: Math.max(getUnit(s, id).silenced || 0, v) }), id, "Silenced!"),
  mark: (s, id, v) => {
    const u = getUnit(s, id)
    return callout(setUnit(s, id, { mark: Math.max(u.mark || 0, 2), markBonus: Math.max(u.mark > 0 ? u.markBonus || 0 : 0, v) }), id, "Marked!")
  },
  corrupt: (s, id, v) => setUnit(s, id, { corruption: (getUnit(s, id).corruption || 0) + v }),
  dmg: (s, id, v) => flatHit(s, id, v),
}
const ALLY_T = {
  block: (s, id, v) => setUnit(s, id, { block: (getUnit(s, id).block || 0) + v }),
  ward: (s, id, v) => emit(setUnit(s, id, { ward: (getUnit(s, id).ward || 0) + v }), { kind: "ward", targetId: id }),
  ap: (s, id, v) => setUnit(s, id, { ap: getUnit(s, id).ap + v }),
  attack: (s, id, v) => setUnit(s, id, { attack: getUnit(s, id).attack + v }),
  cleanse: (s, id) => {
    const u = getUnit(s, id)
    const patch = {}
    for (const key of CLEANSED) if (u[key] > 0) patch[key] = 0
    return setUnit(s, id, patch)
  },
  taunt: (s, id) => callout(setUnit(s, id, { shoutTurn: s.turn }), id, "Taunt!"),
  resetCd: (s, id, v) => setUnit(s, id, { classCds: { ...(getUnit(s, id).classCds || {}), [v]: 0 } }),
}

// One rider block on one unit (keys picked by FOE_T / ALLY_T / heal).
function fxOn(state, actorId, id, fx) {
  let s = state
  for (const [k, v] of Object.entries(fx)) {
    if (k === "radius" || k === "incl" || v === false || v == null) continue
    const u = getUnit(s, id)
    if (!u || u.hp <= 0 || ended(s)) break
    const foe = u.side !== getUnit(s, actorId)?.side
    if (foe && FOE_T[k]) s = FOE_T[k](s, id, v)
    else if (!foe && k === "heal") s = healUnit(s, getUnit(s, actorId) || u, id, v)
    else if (!foe && ALLY_T[k]) s = ALLY_T[k](s, id, v)
  }
  return s
}

// Skill-tree rider (classes.js SKILL_UPGRADES / SIGNATURE_UPGRADES `fx`),
// run right after the skill itself resolved. Deterministic, state in/out.
export function applySkillFx(state, actorId, targetId, tile, fx, targetFell) {
  const a = getUnit(state, actorId)
  if (!a || !fx) return state
  let s = state
  const t = targetId ? getUnit(s, targetId) : null
  const fell = targetFell ?? (t ? t.hp <= 0 : false)
  const foesOf = (side) => (side === "player" ? "enemy" : "player")
  if (fx.kill && fell) {
    if (fx.kill.ap) s = callout(setUnit(s, actorId, { ap: getUnit(s, actorId).ap + fx.kill.ap }), actorId, `+${fx.kill.ap} AP`)
    if (fx.kill.heal && getUnit(s, actorId).hp > 0) s = healUnit(s, getUnit(s, actorId), actorId, fx.kill.heal)
  }
  if (fx.t && t && !fell) s = fxOn(s, actorId, t.id, fx.t)
  if (fx.splash && t) {
    const ids = livingUnits(s, t.side).filter((u) => u.id !== t.id && !u.structure && kingAdjacent(u.pos, t.pos)).map((u) => u.id)
    for (const id of ids) s = fxOn(s, actorId, id, fx.splash)
  }
  if (fx.self) s = fxOn(s, actorId, actorId, fx.self)
  if (fx.aura) {
    const r = fx.aura.radius || 1
    const me = getUnit(s, actorId)
    const ids = livingUnits(s, me.side).filter((u) => !u.structure && (u.id === actorId ? fx.aura.incl : dist(u.pos, me.pos) <= r)).map((u) => u.id)
    for (const id of ids) s = fxOn(s, actorId, id, fx.aura)
  }
  if (fx.near) {
    const r = fx.near.radius || 1
    const me = getUnit(s, actorId)
    const ids = livingUnits(s, foesOf(me.side)).filter((u) => !u.structure && dist(u.pos, me.pos) <= r).map((u) => u.id)
    for (const id of ids) s = fxOn(s, actorId, id, fx.near)
  }
  if (fx.pet) {
    const c = companionOf(s, getUnit(s, actorId))
    if (c) {
      const { hp = 0, ap = 0, heal = 0 } = fx.pet
      s = setUnit(s, c.id, { maxHp: c.maxHp + hp, hp: c.hp + hp, ap: c.ap + ap })
      if (heal) s = healUnit(s, getUnit(s, actorId), c.id, heal)
    }
  }
  if (fx.tile && tile) {
    const ids = s.units.filter((u) => u.hp > 0 && !u.structure && dist(u.pos, tile) <= 1).map((u) => u.id)
    for (const id of ids) {
      const u = getUnit(s, id)
      const mine = u.side === a.side
      const pick = Object.fromEntries(Object.entries(fx.tile).filter(([k]) => (mine ? ALLY_T[k] : FOE_T[k])))
      s = fxOn(s, actorId, id, pick)
    }
  }
  return checkTacticsBattleEnd(s)
}

// --- Passive hooks (called from tacticsEngine.js) ---------------------------

function hasAnyStatus(u) {
  return DEBUFFS.some((k) => u[k] > 0)
}

// Final class adjustment to one hit's damage (modifiedAttackAmount).
export function classDamageMod(attacker, defender, amount, facing) {
  if (!(amount > 0) || !attacker || !defender) return amount
  let a = amount
  if (attacker.side === "player") {
    const p = attacker.classPassive
    if (p === "defensive-aim" && !attacker.moved) a += 1
    if (p === "adrenaline") a += Math.floor((1 - hpFrac(attacker)) * 4)
    if (p === "battle-rhythm") a += attacker.rhythm || 0
    if (p === "backstab" && (facing === "side" || facing === "back")) a += 3
    if (p === "steady-aim" && dist(attacker.pos, defender.pos) >= 3) a += 1
    if (p === "siege" && (defender.block > 0 || defender.ward > 0 || defender.bulwark > 0)) a += 2
    if (p === "lockdown" && (defender.root > 0 || defender.slow > 0 || defender.silenced > 0 || defender.entangle > 0)) a += 2
    if (p === "cold-snap" && (defender.chill > 0 || defender.frozen > 0)) a += 2
    if (p === "arcane-edge" && attacker.edge > 0) a += 2
    if (attacker.empower > 0) a += attacker.empowerBonus || 0
    if (defender.challenged > 0 && defender.challengedBy === attacker.id) a += 2
    if (defender.mark > 0) a += defender.markBonus || 0
    if (defender.sMark > 0 && defender.sMarkBy === attacker.id) a += 3
    // Part B
    if (attacker.bonded) a += 1
    if (attacker.frenzy > 0) a += attacker.frenzyBonus || 0
    if (attacker.form === "beast") a += 2
    if (attacker.form === "predator" && hpFrac(defender) < 0.5) a += 3
    if (defender.appraised > 0) a += 1
    if ((defender.corruption || 0) >= 5) a += 2
    if (p === "demolitions" && defender.structure) a += 3
  }
  if (defender.cursed > 0) a += 1
  if (attacker.cursed > 0) a -= 1
  if (defender.exposed > 0) a = Math.floor(a * 1.25)
  if (attacker.disarmed > 0) a = Math.floor(a / 2)
  if (attacker.phased > 0) a = Math.floor(a / 2)
  if (defender.zoneGuard > 0) a -= 1
  if (has(defender, "last-stand") && hpFrac(defender) < 0.5) a -= 1
  if (defender.form === "root") a -= 1
  if (defender.phased > 0) a = 0
  return Math.max(0, a)
}

// Guardian's Stalwart / Juggernaut's Last Stand.
export function immovable(u) {
  return has(u, "stalwart") || (has(u, "last-stand") && hpFrac(u) < 0.5) || u?.form === "root"
}
export function keepsBlockOnSideHit(u) {
  return has(u, "stalwart")
}
export function ignoresFlank(u) {
  return has(u, "foresight")
}
export function wallDamage(u, amount) {
  return has(u, "siege") ? amount * 2 : has(u, "demolitions") ? amount * 3 : amount
}

// Medic's Triage.
export function healAmount(actor, target, amount) {
  const base = has(actor, "triage") && target.hp < target.maxHp / 2 ? Math.round(amount * 1.5) : amount
  // Mana Overcharge: the heal being cast right now is stronger.
  return base + (actor?.surge > 0 ? actor.surge : 0)
}

// A living Guardian that Guarded `target` (attackUnit splits the hit).
export function classGuardFor(state, target) {
  if (!(target.guarded > 0) || !target.guardedBy) return null
  const g = getUnit(state, target.guardedBy)
  if (!g || g.hp <= 0 || g.side !== target.side || g.id === target.id || !kingAdjacent(g.pos, target.pos)) return null
  return { ...g, classGuard: true }
}

// Enemy AI target pool: a Challenged enemy may only attack its living
// challenger (it walks over to it rather than hitting anyone else).
export function filterEnemyTargets(state, enemy, pool) {
  if (!(enemy.challenged > 0) || !enemy.challengedBy) return pool
  const rival = getUnit(state, enemy.challengedBy)
  if (!rival || rival.hp <= 0) return pool
  return pool.filter((u) => u.id === rival.id)
}

// After any successful move (moveUnit): Hold Ground/Defensive Aim flag,
// and a Sentinel's Overwatch shot at an enemy that ends a move in range.
export function afterMove(state, unitId) {
  const mover = getUnit(state, unitId)
  if (!mover || mover.hp <= 0) return state
  if (mover.side === "player") {
    // Scout's Pathfinder / Trailblazer: a free first move.
    let moved
    if (has(mover, "pathfinder") && !mover.pathUsed) moved = callout(setUnit(state, unitId, { moved: true, pathUsed: true, ap: mover.ap + 1 }), unitId, "Pathfinder!")
    else if (mover.freeStep > 0) moved = setUnit(state, unitId, { moved: true, freeStep: 0, ap: mover.ap + 1 })
    else moved = setUnit(state, unitId, { moved: true })
    // XCOM part 1: enemies on Overwatch shoot a player that ends a move in reach.
    return overwatchFire(moved, unitId, "enemy")
  }
  // Part B: hidden traps spring, Rootweaver's Grasping Roots.
  let next = springTrap(state, unitId)
  if (!(getUnit(next, unitId)?.hp > 0) || ended(next)) return next
  for (const r of livingUnits(next, "player")) {
    if (!has(r, "grasping-roots") || r.graspUsed || !kingAdjacent(r.pos, mover.pos)) continue
    const live = getUnit(next, unitId)
    next = setUnit(next, r.id, { graspUsed: true })
    next = setUnit(next, unitId, { root: Math.max(live.root || 0, ROOT) })
    next = callout(addLog(next, `${r.name}'s roots grab ${live.name}!`), unitId, "Rooted!")
    break
  }
  return overwatchFire(next, unitId, "player")
}

// Overwatch (Sentinel class skill + the universal XCOM action): the first
// `watcherSide` unit on watch whose attack reaches the mover's end tile
// fires once with its normal attack, then its watch ends.
function overwatchFire(state, unitId, watcherSide) {
  let next = state
  const mover = getUnit(state, unitId)
  if (!mover || mover.hp <= 0 || ended(state)) return state
  for (const s of livingUnits(state, watcherSide)) {
    if (!(s.overwatch > 0) || s.stun > 0 || s.frozen > 0 || !canReach(next, s, s.pos, mover.pos)) continue
    next = setUnit(next, s.id, { overwatch: 0 })
    next = callout(addLog(next, `${s.name}'s Overwatch fires at ${mover.name}!`), s.id, "Overwatch!")
    const ow = abilityHit(next, s.id, unitId, s.attack, { name: "Overwatch" })
    next = ow.next
    if (s.owRoot && !ow.graze && !ended(next) && getUnit(next, unitId)?.hp > 0) next = rootUnit(next, unitId)
    next = checkTacticsBattleEnd(next)
    break
  }
  return next
}

// Every player hit (attack or skill): Battle Rhythm, Arcane Edge.
export function afterPlayerHit(state, actorId, targetId) {
  const actor = getUnit(state, actorId)
  if (!actor || actor.side !== "player") return state
  let next = state
  if (actor.classPassive === "battle-rhythm") next = setUnit(next, actorId, { rhythm: (actor.rhythm || 0) + 1 })
  if (actor.classPassive === "arcane-edge" && actor.edge > 0) {
    next = setUnit(next, actorId, { edge: 0 })
    const t = getUnit(next, targetId)
    if (t && t.hp > 0 && !ended(next)) next = applyElement(next, targetId, "fire", 1)
  }
  return partBAfterHit(next, actorId, targetId)
}

// Part B on-hit passives + kill bookkeeping (Essence).
function partBAfterHit(state, actorId, targetId) {
  const actor = getUnit(state, actorId)
  const t = getUnit(state, targetId)
  if (!actor || !t || t.side === actor.side) return state
  let next = state
  if (t.hp <= 0) {
    const paid = next.essencePaid || []
    if (paid.includes(t.id)) return next
    let gain = 0
    if (has(actor, "bounty") && (next.merchantBounty || 0) < MERCHANT_BOUNTY_CAP) {
      gain += 1
      next = { ...next, merchantBounty: (next.merchantBounty || 0) + 1 }
    }
    if (t.appraised > 0) gain += 1
    return gain ? addEssence({ ...next, essencePaid: [...paid, t.id] }, actorId, gain) : next
  }
  if (ended(next)) return next
  const p = actor.classPassive
  if (p === "malediction") next = setUnit(next, t.id, { cursed: Math.max(t.cursed || 0, 1) })
  if (p === "corruption") {
    const c = (t.corruption || 0) + 1
    next = setUnit(next, t.id, { corruption: c })
    if (c === 5) next = callout(next, t.id, "Heart Rot!")
  }
  if (p === "interrupt") next = interruptEnemy(next, t.id)
  if (p === "catalyst") next = applyElement(next, t.id, "poison", 1)
  return next
}

function addEssence(state, actorId, n) {
  const have = state.bonusEssence || 0
  const gain = Math.min(n, BONUS_ESSENCE_CAP - have)
  if (gain <= 0) return state
  const next = { ...state, bonusEssence: have + gain }
  return callout(addLog(next, `+${gain} Essence after the fight.`), actorId, `+${gain} Essence`)
}

// Disruptor: cancel a wind-up / Ancient charge, push skills back.
function interruptEnemy(state, id, turns = 1) {
  const t = getUnit(state, id)
  if (!t || t.hp <= 0 || t.side !== "enemy") return state
  const patch = {}
  const skillCd = { ...(t.skillCd || {}) }
  for (const sk of enemySkillsFor(t)) skillCd[sk.id] = Math.min(4, (skillCd[sk.id] || 0) + turns)
  patch.skillCd = skillCd
  let broke = false
  if (t.windup) {
    patch.windup = null
    broke = true
  }
  if (t.charge && t.chargeCounter < t.charge.turns) {
    patch.chargeCounter = t.charge.turns
    broke = true
  }
  const next = setUnit(state, id, patch)
  return broke ? callout(addLog(next, `${t.name}'s wind-up is interrupted!`), id, "Interrupted!") : next
}

// A kill (grantStrengthOnKill): Finisher's Momentum, Chain of Command.
export function onKill(state, actorId) {
  const actor = getUnit(state, actorId)
  if (!actor || actor.side !== "player") return state
  let next = state
  if (actor.classPassive === "finishers-momentum" && !actor.momentumUsed && actor.hp > 0) {
    next = setUnit(next, actorId, { ap: actor.ap + 1, momentumUsed: true })
    next = callout(addLog(next, `${actor.name}'s Finisher's Momentum: +1 AP!`), actorId, "Momentum!")
  }
  for (const c of livingUnits(next, "player")) {
    if (c.classPassive !== "chain-of-command") continue
    const cds = {}
    for (const [k, v] of Object.entries(c.classCds || {})) cds[k] = Math.max(0, v - 1)
    next = setUnit(next, c.id, { classCds: cds })
  }
  return next
}

// After an enemy's (non-reaction) attack: Soul Debt, Interrupted Ritual,
// then the Duelist's Riposte.
export function riposte(state, attackerId, targetId) {
  let next = state
  const a0 = getUnit(next, attackerId)
  if (a0 && a0.hp > 0 && a0.soulDebt > 0 && !ended(next)) {
    next = callout(addLog(next, `${a0.name} pays its Soul Debt!`), attackerId, "Soul Debt!")
    next = flatHit(next, attackerId, a0.soulDebtDmg || 3)
  }
  const t0 = getUnit(next, targetId)
  if (t0 && t0.hp > 0 && has(t0, "interrupted-ritual") && t0.ritual > 0 && !ended(next)) next = releaseRitual(next, targetId, true)
  return duelRiposte(next, attackerId, targetId)
}

function duelRiposte(state, attackerId, targetId) {
  const t = getUnit(state, targetId)
  const a = getUnit(state, attackerId)
  if (!t || !a || t.hp <= 0 || a.hp <= 0 || ended(state)) return state
  if (t.classPassive !== "riposte" || t.riposteUsed || a.side !== "enemy" || dist(a.pos, t.pos) > 1) return state
  let next = setUnit(state, targetId, { riposteUsed: true })
  next = callout(next, targetId, "Riposte!")
  return abilityHit(next, targetId, attackerId, Math.ceil(t.attack / 2), { name: "Riposte" }).next
}

// After a successful cast (signature or class skill): Uplift, Gentle
// Hands, Arcane Edge.
export function afterCast(state, actorId, targetId, skill) {
  const actor = getUnit(state, actorId)
  if (!actor || !skill) return state
  let next = state
  const target = targetId ? getUnit(next, targetId) : null
  const allyTarget = target && target.side === actor.side && target.hp > 0
  if (actor.classPassive === "uplift" && allyTarget) next = setUnit(next, target.id, { block: (target.block || 0) + 1 })
  if (actor.classPassive === "gentle-hands" && allyTarget && (skill.kind === "heal" || skill.id === "lingering-bloom")) {
    next = setUnit(next, target.id, { block: (getUnit(next, target.id).block || 0) + 1 })
  }
  if (actor.classPassive === "arcane-edge" && getUnit(next, actorId).hp > 0) next = setUnit(next, actorId, { edge: 1 })
  return next
}

// End of the player's turn (top of enemyPhaseStart): Hold Ground.
export function classPlayerTurnEnd(state) {
  let next = state
  for (const u of livingUnits(state, "player")) {
    if (u.classPassive !== "hold-ground" || u.moved) continue
    next = callout(setUnit(next, u.id, { block: (u.block || 0) + 2 }), u.id, "Hold Ground!")
  }
  return partBTurnEnd(next)
}

// Part B end-of-turn effects - inside enemyPhaseStart, so the enemy
// preview dry-runs them exactly (turret shots, charges...).
function partBTurnEnd(state) {
  let next = state
  // Chronomancer's Rewind remembers HP from this moment.
  for (const u of livingUnits(next, "player")) next = setUnit(next, u.id, { rewindHp: u.hp })
  next = detonateCharges(next)
  if (ended(next)) return next
  for (const tur of livingUnits(next, "player").filter((u) => u.turret)) {
    const t = getUnit(next, tur.id)
    if (!t || t.hp <= 0 || ended(next)) continue
    const foes = livingUnits(next, "enemy").filter((e) => dist(e.pos, t.pos) <= t.turretReach)
    if (!foes.length) continue
    const target = foes.reduce((b, e) => (dist(e.pos, t.pos) < dist(b.pos, t.pos) ? e : b))
    next = callout(next, t.id, "Turret!")
    next = abilityHit(next, t.id, target.id, t.turretAttack, { name: "Turret" }).next
    next = checkTacticsBattleEnd(next)
  }
  if (ended(next)) return next
  for (const u0 of livingUnits(next, "player")) {
    const u = getUnit(next, u0.id)
    if (!u || u.hp <= 0) continue
    const p = u.classPassive
    if (p === "field-repairs") next = fieldRepairs(next, u)
    if (p === "veil" && !livingUnits(next, "enemy").some((e) => !e.structure && dist(e.pos, u.pos) <= 2)) {
      next = callout(setUnit(next, u.id, { block: (u.block || 0) + 2 }), u.id, "Veil!")
    }
    if (p === "purity") {
      let any = false
      for (const a of livingUnits(next, "player")) {
        if (a.id !== u.id && !kingAdjacent(a.pos, u.pos)) continue
        const key = CLEANSED.find((k) => a[k] > 0)
        if (!key) continue
        next = setUnit(next, a.id, { [key]: 0 })
        any = true
      }
      if (any) next = callout(next, u.id, "Purity!")
    }
    if (p === "forage" && u.hp < u.maxHp && nearGreen(next, u.pos)) {
      next = callout(healUnit(next, u, u.id, 2), u.id, "Forage!")
    }
    if (p === "resonance") {
      const fx = (u.triggers || []).filter((t) => t.source && (t.trigger === "turnEnd" || t.trigger === "turnStart"))
      for (const t of fx) next = applyPortableEffect(next, u.id, t.effect)
      if (fx.length) next = callout(addLog(next, `${u.name}'s relics resonate.`), u.id, "Resonance!")
    }
  }
  return next
}

function nearGreen(state, pos) {
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const p = { row: pos.row + dr, col: pos.col + dc }
      if (isOnBoard(p, state.grid) && ["forest", "bush"].includes(terrainAt(state, p))) return true
    }
  }
  return false
}

function fieldRepairs(state, eng) {
  let next = state
  for (const tur of livingUnits(next, "player").filter((x) => x.turret && x.ownerId === eng.id && x.hp < x.maxHp)) {
    next = setUnit(next, tur.id, { hp: Math.min(tur.maxHp, tur.hp + 2) })
  }
  const wallHp = { ...(next.wallHp || {}) }
  let fixed = false
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const key = `${eng.pos.row + dr}-${eng.pos.col + dc}`
      if ((next.terrain || {})[key] !== "wall") continue
      const hp = wallHp[key] ?? WALL_MAX_HP
      if (hp < WALL_MAX_HP) {
        wallHp[key] = Math.min(WALL_MAX_HP, hp + 2)
        fixed = true
      }
    }
  }
  return fixed ? { ...next, wallHp } : next
}

// Saboteur's Explosive Charges blow at the end of the player's turn.
function detonateCharges(state) {
  const charges = state.classCharges || []
  if (!charges.length) return state
  let next = { ...state, classCharges: [] }
  for (const c of charges) {
    const owner = getUnit(next, c.ownerId)
    next = emit(addLog(next, `${owner?.name || "A charge"}'s Explosive Charge blows!`), { kind: "aoe", actorId: c.ownerId })
    const terrain = { ...(next.terrain || {}) }
    const wallHp = { ...(next.wallHp || {}) }
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const key = `${c.row + dr}-${c.col + dc}`
        if (terrain[key] === "wall") {
          terrain[key] = "rubble"
          delete wallHp[key]
        }
      }
    }
    next = { ...next, terrain, wallHp }
    const ids = livingUnits(next, "enemy").filter((e) => dist(e.pos, c) <= 1).map((e) => e.id)
    for (const id of ids) if (!ended(next)) next = flatHit(next, id, c.damage)
    next = checkTacticsBattleEnd(next)
  }
  return next
}

// Start of each player turn (after Block/AP reset): counters tick,
// cooldowns tick, Lingering Bloom heals, Stim exhaustion, Stabilize ends.
export function classPlayerTurnStart(state) {
  let next = state
  for (const u of state.units) {
    if (u.hp <= 0) continue
    const patch = {}
    for (const k of COUNTERS) if (u[k] > 0) patch[k] = u[k] - 1
    if (u.side === "player") {
      patch.moved = false
      patch.rhythm = 0
      patch.edge = 0
      patch.riposteUsed = false
      patch.momentumUsed = false
      patch.graspUsed = false
      patch.pathUsed = false
      patch.freeStep = 0
      if (u.classCds) {
        const cds = {}
        const tick = has(u, "temporal-flow") ? 2 : 1
        for (const [k, v] of Object.entries(u.classCds)) cds[k] = Math.max(0, v - tick)
        patch.classCds = cds
      }
      if (u.exhausted > 0) {
        patch.ap = Math.max(0, u.ap - 1)
        patch.exhausted = 0
      }
      if (u.hasted > 0) {
        patch.ap = (patch.ap ?? u.ap) + 1
        patch.hasted = 0
      }
      if (u.stabilized > 0) {
        patch.stabilized = 0
        if ((u.revive || 0) > (u.stabBase || 0)) patch.revive = u.stabBase || 0
      }
    }
    if (Object.keys(patch).length) next = setUnit(next, u.id, patch)
    if (u.side === "player" && u.hot > 0) {
      const live = getUnit(next, u.id)
      const healed = Math.min(live.maxHp, live.hp + (u.hotAmount || 0))
      next = setUnit(next, u.id, { hp: healed, hot: u.hot - 1 })
      if (healed > live.hp) next = emit(addLog(next, `${live.name} blooms for ${healed - live.hp}.`), { kind: "heal", actorId: u.id, targetId: u.id, amount: healed - live.hp })
    }
  }
  // Beastmaster's Pack Bond: a fallen companion enrages its master.
  for (const b of livingUnits(next, "player")) {
    if (!has(b, "pack-bond")) continue
    const lost = next.units.filter((c) => c.ownerId === b.id && c.hp <= 0 && !c.mourned)
    if (!lost.length) continue
    for (const c of lost) next = setUnit(next, c.id, { mourned: true })
    const live = getUnit(next, b.id)
    next = setUnit(next, b.id, { attack: live.attack + 2 * lost.length, classCds: { ...(live.classCds || {}), "call-companion": 0 } })
    next = callout(addLog(next, `${b.name} howls for its fallen companion (+2 attack).`), b.id, "Pack Bond!")
  }
  return next
}

// --- Targeting ---------------------------------------------------------------

function inRange(state, actor, target, skill) {
  if (skill.range === "reach") return canReach(state, actor, actor.pos, target.pos)
  return dist(actor.pos, target.pos) <= skill.range
}

function lineDir(from, to) {
  const dr = to.row - from.row
  const dc = to.col - from.col
  if (dr === 0 && dc === 0) return null
  if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return null
  return { dr: sign(dr), dc: sign(dc) }
}

function chargePath(state, actor, target) {
  const dir = lineDir(actor.pos, target.pos)
  if (!dir) return null
  const d = dist(actor.pos, target.pos)
  const landing = { row: target.pos.row - dir.dr, col: target.pos.col - dir.dc }
  for (let i = 1; i < d; i++) {
    const p = { row: actor.pos.row + dir.dr * i, col: actor.pos.col + dir.dc * i }
    if (!tileFree(state, p, actor.id)) return null
  }
  return { landing, travel: d - 1 }
}

function shadowLanding(state, target) {
  const off = BEHIND[target.facing || "W"]
  const pos = { row: target.pos.row + off.row, col: target.pos.col + off.col }
  return tileFree(state, pos) ? pos : null
}

function blinkLanding(state, actor, target, range) {
  if (kingAdjacent(actor.pos, target.pos)) return actor.pos
  if (actor.root > 0) return null
  let best = null
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const pos = { row: target.pos.row + dr, col: target.pos.col + dc }
      if ((dr === 0 && dc === 0) || !tileFree(state, pos, actor.id)) continue
      const d = dist(actor.pos, pos)
      if (d > range) continue
      if (!best || d < best.d) best = { d, pos }
    }
  }
  return best ? best.pos : null
}

// Per-skill extra target rules.
function skillAllows(state, actor, target, skill) {
  switch (skill.id) {
    case "charge":
      return !!chargePath(state, actor, target)
    case "shadow-step":
      return !actor.root && !!shadowLanding(state, target)
    case "arcane-dash":
      return !!blinkLanding(state, actor, target, skill.range)
    case "piercing-beam":
      return !!lineDir(actor.pos, target.pos)
    case "coordinated-strike":
      return livingUnits(state, actor.side).some((u) => u.id !== actor.id && !u.npc && kingAdjacent(u.pos, target.pos))
    case "pull":
      return !immovable(target)
    case "formation-shift":
      return !actor.root && !target.npc
    case "hunt": {
      const c = companionOf(state, actor)
      return !!c && !!blinkLanding(state, c, target, skill.reach)
    }
    case "swarm-command":
      return swarmOf(state, actor, target).length > 0
    case "spirit-offering":
      return actor.hp > skill.hpCost
    case "rewind":
      return (target.rewindHp || 0) > target.hp
    case "consume-curse":
      return curseDamage(target) > 0
    case "spread-corruption":
      return livingUnits(state, target.side).some((u) => u.id !== target.id && !u.structure && kingAdjacent(u.pos, target.pos))
    default:
      return true
  }
}

// Self skills with a precondition (UI greys them out when false).
function selfAllows(state, actor, skill) {
  switch (skill.id) {
    case "summon-spirit":
    case "call-companion":
      return !companionOf(state, actor) && freeCellsNear(state, actor.pos, 1).length > 0
    case "sacrificial-summon":
    case "frenzy":
      return !!companionOf(state, actor)
    case "complete-ritual":
      return actor.ritual > 0
    case "begin-ritual":
      return (actor.ritual || 0) < skill.max
    case "beast-form":
      return actor.form !== "beast"
    case "root-form":
      return actor.form !== "root"
    case "predator-form":
      return actor.form !== "predator"
    case "forbidden-relic":
      return actor.hp > skill.hpCost
    default:
      return true
  }
}

// The one living summon a Summoner/Beastmaster controls.
function companionOf(state, actor) {
  return state.units.find((u) => u.hp > 0 && u.side === actor.side && u.ownerId === actor.id && !u.structure) || null
}

function swarmOf(state, actor, target) {
  return livingUnits(state, actor.side).filter((u) => (u.isSpirit || u.ownerId) && !u.structure && canReach(state, u, u.pos, target.pos))
}

const AILMENTS = ["poison", "burn", "chill", "root", "slow", "weak", "entangle", "cursed", "exposed"]
function curseDamage(t) {
  return 2 * (t.corruption || 0) + AILMENTS.filter((k) => t[k] > 0).length
}

// Tile skills: every tile the skill may target right now.
function tileAllows(state, actor, pos, skill) {
  if (!isOnBoard(pos, state.grid) || dist(actor.pos, pos) > skill.range) return false
  const key = `${pos.row}-${pos.col}`
  if (skill.tile === "any") return true
  if (skill.tile === "crossing") return ["water", "lava", "rock"].includes(terrainAt(state, pos))
  // "empty": walkable, nobody standing there, no trap yet.
  if (!tileFree(state, pos) || (state.classTraps || {})[key]) return false
  if (skill.id === "deploy-turret") return !state.units.some((u) => u.hp > 0 && u.turret && u.ownerId === actor.id)
  return true
}

export function classSkillTiles(state, actorId, skill) {
  const actor = getUnit(state, actorId)
  if (!actor || actor.hp <= 0 || !skill || skill.target !== "tile") return []
  const tiles = []
  for (let row = 0; row < state.grid.rows; row++) {
    for (let col = 0; col < state.grid.cols; col++) if (tileAllows(state, actor, { row, col }, skill)) tiles.push({ row, col })
  }
  return tiles
}

// Ready AND has something to act on (UI button state).
export function classSkillUsable(state, unit, skill) {
  if (!classSkillReady(unit, skill)) return false
  if (skill.target === "self") return selfAllows(state, unit, skill)
  if (skill.target === "tile") return classSkillTiles(state, unit.id, skill).length > 0
  return true
}

// Valid clicked targets for a class skill right now ([] for self skills).
export function classSkillTargets(state, actorId, skill) {
  const actor = getUnit(state, actorId)
  if (!actor || actor.hp <= 0 || !skill || skill.target === "self") return []
  if (skill.target === "ally") {
    return livingUnits(state, actor.side).filter(
      (u) => !(skill.noSelf && u.id === actorId) && !u.structure && dist(u.pos, actor.pos) <= skill.range && skillAllows(state, actor, u, skill),
    )
  }
  const foes = livingUnits(state, actor.side === "player" ? "enemy" : "player").filter((u) => !u.structure || skill.range === "reach")
  const taunters = foes.filter((u) => isTaunting(state, u))
  return (taunters.length ? taunters : foes).filter((u) => inRange(state, actor, u, skill) && skillAllows(state, actor, u, skill))
}

// --- Execution ---------------------------------------------------------------

function hit(state, actorId, targetId, base, skill) {
  const t = getUnit(state, targetId)
  if (!t || t.hp <= 0 || ended(state)) return { next: state, fell: false }
  // XCOM part 2: a GRAZE skips the skill's riders - handlers gate riders
  // on `fell`, so it reads as true on a graze (`killed` = a real kill).
  const r = abilityHit(state, actorId, targetId, Math.max(0, Math.round(base)), skill)
  return { next: r.next, fell: r.fell || !!r.graze, killed: r.fell, graze: !!r.graze }
}

function slowUnit(state, id) {
  const u = getUnit(state, id)
  return u && u.hp > 0 ? setUnit(state, id, { slow: (u.slow || 0) + SLOW }) : state
}

function moveTo(state, id, pos, facing) {
  const patch = { pos, moved: true }
  if (facing) patch.facing = facing
  return setUnit(state, id, patch)
}

function healUnit(state, actor, targetId, amount) {
  const live = getUnit(state, targetId)
  const healed = Math.min(live.maxHp, live.hp + healAmount(actor, live, amount))
  let next = setUnit(state, targetId, { hp: healed })
  if (has(actor, "gentle-hands")) next = setUnit(next, targetId, { block: (live.block || 0) + 1 })
  return emit(addLog(next, `${actor.name} mends ${live.name} for ${healed - live.hp}.`), { kind: "heal", actorId: actor.id, targetId, amount: healed - live.hp })
}

// Elemental Strike's element for a turn: Fire, Frost, Nature, repeat.
export function elementOfTurn(turn) {
  const cycle = [
    ["fire", 2],
    ["frost", 1],
    ["nature", ENTANGLE_DURATION],
  ]
  return cycle[(Math.max(1, turn || 1) - 1) % 3]
}

// --- Part B helpers -----------------------------------------------------------

// Flat damage (traps, charges, Soul Debt): Block still soaks it.
function flatHit(state, targetId, amount) {
  const t = getUnit(state, targetId)
  if (!t || t.hp <= 0 || ended(state)) return state
  const r = applyDamageWithBlock(state, targetId, amount)
  let next = addLog(r.next, `${t.name} takes ${r.remaining}.${r.fell ? " It falls." : ""}`)
  next = checkEnemyPhase(next, targetId)
  if (r.fell) next = trySpawnBrood(next, targetId)
  return checkTacticsBattleEnd(next)
}

// A visible "throw" at an enemy for skills that deal no direct damage.
function strikeFx(state, a, t, name) {
  return emit(state, { kind: "strike", actorId: a.id, targetId: t.id, ranged: dist(a.pos, t.pos) > 1, ability: name })
}

function rootUnit(state, id) {
  const u = getUnit(state, id)
  if (!u || u.hp <= 0) return state
  return reactStatus(callout(setUnit(state, id, { root: Math.max(u.root || 0, ROOT) }), id, "Rooted!"), id, "root")
}

function setTerrain(state, pos, kind, hp) {
  const key = `${pos.row}-${pos.col}`
  const terrain = { ...(state.terrain || {}), [key]: kind }
  const wallHp = { ...(state.wallHp || {}) }
  if (kind === "wall") wallHp[key] = hp ?? WALL_MAX_HP
  else delete wallHp[key]
  return { ...state, terrain, wallHp }
}

const GRASSABLE = new Set(["path", "forest", "rubble"])
function growGrass(state, cells) {
  let next = state
  for (const p of cells) if (isOnBoard(p, next.grid) && GRASSABLE.has(terrainAt(next, p))) next = setTerrain(next, p, "bush")
  return next
}

// A static player-side piece (Decoy, Turret): npc so it never counts as
// the squad, structure so heals/buffs skip it.
function placeStructure(state, owner, pos, uid, def, patch) {
  const base = deriveTacticsUnit(uid, "player", pos, uid, def)
  const piece = {
    ...base,
    move: 0,
    range: 0,
    attack: 0,
    baseAttack: 0,
    ap: 0,
    apMax: 0,
    npc: true,
    structure: true,
    classId: null,
    classPassive: null,
    classSkills: [],
    ability: null,
    ...patch,
  }
  return { ...state, units: [...state.units, piece] }
}

function summonWolf(state, a, extra = {}) {
  const [pos] = freeCellsNear(state, a.pos, 1)
  if (!pos) return state
  const uid = `${a.id}-summon-${state.turn || 0}-${state.units.length}`
  const wolf = { ...deriveTacticsUnit("spirit-wolf", "player", pos, uid), ap: 0, ownerId: a.id, ...extra }
  const next = { ...state, units: [...state.units, wolf] }
  return callout(addLog(next, `${a.name} calls a ${wolf.name}!`), uid, "Summoned!")
}

// Hidden traps spring when an enemy ends a move on them.
function springTrap(state, unitId) {
  const u = getUnit(state, unitId)
  const key = `${u.pos.row}-${u.pos.col}`
  const trap = (state.classTraps || {})[key]
  if (!trap) return state
  const traps = { ...state.classTraps }
  delete traps[key]
  let next = callout(addLog({ ...state, classTraps: traps }, `${u.name} springs a hidden trap!`), unitId, "Trap!")
  if (trap.kind === "thorn") {
    next = flatHit(next, unitId, trap.damage)
    if (getUnit(next, unitId)?.hp > 0 && !ended(next)) next = rootUnit(next, unitId)
    if (trap.poison && getUnit(next, unitId)?.hp > 0 && !ended(next)) next = applyElement(next, unitId, "poison", trap.poison)
  } else {
    next = applyElement(next, unitId, "poison", trap.amount)
    if (trap.root && getUnit(next, unitId)?.hp > 0 && !ended(next)) next = rootUnit(next, unitId)
  }
  const owner = getUnit(next, trap.ownerId)
  if (has(owner, "ambush-network") && !ended(next)) {
    const others = livingUnits(next, "enemy").filter((e) => e.id !== unitId && !e.structure && kingAdjacent(e.pos, u.pos)).map((e) => e.id)
    for (const id of others) next = flatHit(next, id, 2)
  }
  return next
}

// Ritualist: spend the stacks (early release = half power, adjacent only).
function releaseRitual(state, id, early) {
  const a = getUnit(state, id)
  const n = a.ritual || 0
  const rite = classSkillById(a, "complete-ritual") || {}
  const per = rite.damage || 3
  let next = setUnit(state, id, { ritual: 0 })
  const radius = early ? 1 : 3
  const dmg = early ? Math.ceil((per * n) / 2) : per * n
  next = emit(addLog(next, early ? `${a.name}'s ritual breaks and lashes out!` : `${a.name} completes the ritual!`), { kind: "aoe", actorId: id })
  if (early) next = callout(next, id, "Ritual breaks!")
  const foes = livingUnits(next, "enemy").filter((e) => !e.structure && dist(e.pos, a.pos) <= radius).map((e) => e.id)
  for (const f of foes) next = flatHit(next, f, dmg)
  if (!early && !ended(next)) {
    for (const u of livingUnits(next, "player")) if (!u.structure && dist(u.pos, a.pos) <= radius) next = healUnit(next, a, u.id, (rite.heal || 2) * n)
  }
  return next
}

function stripBuffs(t) {
  const patch = { block: 0, ward: 0, regen: 0, taunt: 0, bulwark: 0 }
  const earned = t.baseAttack != null && t.attack > t.baseAttack
  if (earned) patch.attack = t.baseAttack
  const count = ["block", "ward", "regen", "taunt", "bulwark"].filter((k) => t[k] > 0).length + (earned ? 1 : 0)
  return { patch, count }
}

const HANDLERS = {
  guard(s, a, t) {
    s = setUnit(s, t.id, { guarded: 1, guardedBy: a.id })
    s = emit(s, { kind: "ward", targetId: t.id })
    return addLog(s, `${a.name} guards ${t.name} - it will take half of every blow aimed at it.`)
  },
  "shield-wall"(s, a, _t, k) {
    s = setUnit(s, a.id, { block: (a.block || 0) + k.self })
    for (const u of livingUnits(s, a.side)) if (u.id !== a.id && kingAdjacent(u.pos, a.pos)) s = setUnit(s, u.id, { block: (u.block || 0) + k.allies })
    return addLog(s, `${a.name} raises a Shield Wall.`)
  },
  "warden-zone"(s, a, _t, k) {
    for (const u of livingUnits(s, a.side)) if (u.id === a.id || kingAdjacent(u.pos, a.pos)) s = setUnit(s, u.id, { zoneGuard: 1, block: (u.block || 0) + k.block })
    return addLog(s, `${a.name} claims the ground - allies nearby are warded.`)
  },
  "thorn-boundary"(s, a, _t, k) {
    const foes = livingUnits(s, a.side === "player" ? "enemy" : "player").filter((u) => !u.structure && dist(u.pos, a.pos) <= k.radius)
    for (const f of foes) {
      s = hit(s, a.id, f.id, k.damage, k).next
      s = slowUnit(s, f.id)
    }
    return s
  },
  charge(s, a, t) {
    const path = chargePath(s, a, t)
    s = setUnit(s, a.id, { root: 0, slow: 0 })
    if (path.travel > 0) s = moveTo(s, a.id, path.landing, cardinal(t.pos.col - path.landing.col, t.pos.row - path.landing.row))
    s = addLog(s, `${a.name} charges ${path.travel} tile(s)!`)
    return hit(s, a.id, t.id, getUnit(s, a.id).attack + path.travel, { name: "Charge" }).next
  },
  "ground-breaker"(s, a) {
    const foes = livingUnits(s, a.side === "player" ? "enemy" : "player").filter((u) => kingAdjacent(u.pos, a.pos))
    for (const f of foes) {
      s = hit(s, a.id, f.id, a.attack, { name: "Ground Breaker" }).next
      s = slowUnit(s, f.id)
    }
    const terrain = { ...(s.terrain || {}) }
    const wallHp = { ...(s.wallHp || {}) }
    let broke = 0
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const key = `${a.pos.row + dr}-${a.pos.col + dc}`
        if (terrain[key] === "wall") {
          terrain[key] = "rubble"
          delete wallHp[key]
          broke++
        }
      }
    }
    if (broke) s = addLog({ ...s, terrain, wallHp }, `The barricade crumbles under ${a.name}!`)
    return s
  },
  overwatch(s, a, _t, k) {
    return addLog(setUnit(s, a.id, { overwatch: 1, owRoot: !!k?.owRoot }), `${a.name} takes aim and watches the field.`)
  },
  "mark-intruder"(s, a, t) {
    s = setUnit(s, t.id, { sMark: 2, sMarkBy: a.id })
    return callout(addLog(s, `${a.name} marks ${t.name} as an intruder.`), t.id, "Marked!")
  },
  "heavy-swing"(s, a, t) {
    const others = livingUnits(s, t.side).filter((u) => u.id !== t.id && !u.structure && kingAdjacent(u.pos, a.pos)).map((u) => u.id)
    s = hit(s, a.id, t.id, a.attack, { name: "Heavy Swing" }).next
    for (const id of others) s = hit(s, a.id, id, Math.ceil(getUnit(s, a.id).attack / 2), { name: "Heavy Swing" }).next
    return s
  },
  "shoulder-check"(s, a, t) {
    const from = { ...t.pos }
    const dest = { row: t.pos.row + sign(t.pos.row - a.pos.row), col: t.pos.col + sign(t.pos.col - a.pos.col) }
    const r = hit(s, a.id, t.id, Math.ceil(a.attack / 2), { name: "Shoulder Check" })
    s = r.next
    const live = getUnit(s, t.id)
    if (!r.fell && live && samePos(live.pos, from) && !immovable(live) && tileFree(s, dest)) {
      s = callout(setUnit(s, t.id, { pos: dest }), t.id, "Knocked back!")
      if (!(getUnit(s, a.id).root > 0)) s = moveTo(s, a.id, from, getUnit(s, a.id).facing)
    }
    return s
  },
  "double-strike"(s, a, t, k) {
    for (let i = 0; i < (k.hits || 2); i++) s = hit(s, a.id, t.id, Math.ceil(getUnit(s, a.id).attack * k.mult), { name: "Double Strike" }).next
    return s
  },
  "exploit-opening"(s, a, t, k) {
    return hit(s, a.id, t.id, a.attack + (hasAnyStatus(t) ? k.bonus : 0), { name: "Exploit Opening" }).next
  },
  "shadow-step"(s, a, t) {
    const pos = shadowLanding(s, t)
    s = moveTo(s, a.id, pos, t.facing || "W")
    return callout(addLog(s, `${a.name} steps out of the shadows behind ${t.name}!`), a.id, "Shadow Step!")
  },
  execution(s, a, t, k) {
    return hit(s, a.id, t.id, hpFrac(t) < k.below ? a.attack * k.mult : a.attack, { name: "Execution" }).next
  },
  challenge(s, a, t) {
    s = setUnit(s, t.id, { challenged: 2, challengedBy: a.id })
    return callout(addLog(s, `${a.name} challenges ${t.name} to a duel!`), t.id, "Challenged!")
  },
  disarm(s, a, t) {
    const r = hit(s, a.id, t.id, Math.ceil(a.attack / 2), { name: "Disarm" })
    if (r.fell) return r.next
    return callout(setUnit(r.next, t.id, { disarmed: 1 }), t.id, "Disarmed!")
  },
  "hunters-mark"(s, a, t, k) {
    s = setUnit(s, t.id, { mark: Math.max(t.mark || 0, 2), markBonus: Math.max(t.mark > 0 ? t.markBonus || 0 : 0, k.bonus) })
    return callout(addLog(s, `${a.name} marks ${t.name} for the hunt.`), t.id, "Hunted!")
  },
  "retreat-shot"(s, a, t, k) {
    s = hit(s, a.id, t.id, a.attack, { name: "Retreat Shot" }).next
    const me = getUnit(s, a.id)
    if (!me || me.hp <= 0 || me.root > 0 || ended(s)) return s
    const dr = sign(me.pos.row - t.pos.row)
    const dc = sign(me.pos.col - t.pos.col)
    let dest = null
    for (let i = 1; i <= k.steps; i++) {
      const p = { row: me.pos.row + dr * i, col: me.pos.col + dc * i }
      if (!tileFree(s, p, a.id)) break
      dest = p
    }
    return dest ? moveTo(s, a.id, dest, me.facing) : s
  },
  "piercing-beam"(s, a, t, k) {
    const dir = lineDir(a.pos, t.pos)
    const ids = []
    for (let i = 1; i <= k.range; i++) {
      const p = { row: a.pos.row + dir.dr * i, col: a.pos.col + dir.dc * i }
      if (!isOnBoard(p, s.grid) || terrainAt(s, p) === "wall") break
      const u = s.units.find((x) => x.hp > 0 && x.side !== a.side && samePos(x.pos, p))
      if (u) ids.push(u.id)
    }
    for (const id of ids) s = hit(s, a.id, id, getUnit(s, a.id).attack, { name: "Piercing Beam" }).next
    return s
  },
  "suppression-fire"(s, a, t, k) {
    const ids = [t.id, ...livingUnits(s, t.side).filter((u) => u.id !== t.id && !u.structure && kingAdjacent(u.pos, t.pos)).map((u) => u.id)]
    for (const id of ids) {
      s = hit(s, a.id, id, k.damage, { name: "Suppression Fire" }).next
      s = slowUnit(s, id)
    }
    return s
  },
  execute(s, a, t, k) {
    return hit(s, a.id, t.id, hpFrac(t) < k.below ? a.attack * k.mult : a.attack, { name: "Execute" }).next
  },
  sever(s, a, t) {
    s = setUnit(s, t.id, { ward: 0, revive: 0, regen: 0 })
    s = callout(addLog(s, `${a.name} severs ${t.name}'s last defenses.`), t.id, "Severed!")
    return hit(s, a.id, t.id, a.attack, { name: "Sever" }).next
  },
  "elemental-strike"(s, a, t) {
    const [element, amount] = elementOfTurn(s.turn)
    const r = hit(s, a.id, t.id, a.attack, { name: "Elemental Strike" })
    return r.fell || ended(r.next) ? r.next : applyElement(r.next, t.id, element, amount)
  },
  "arcane-dash"(s, a, t, k) {
    const pos = blinkLanding(s, a, t, k.range)
    if (!samePos(pos, a.pos)) s = moveTo(s, a.id, pos, cardinal(t.pos.col - pos.col, t.pos.row - pos.row))
    const r = hit(s, a.id, t.id, a.attack + k.bonus, { name: "Arcane Dash" })
    return r.fell || ended(r.next) ? r.next : applyElement(r.next, t.id, "frost", 1)
  },
  "group-renewal"(s, a, _t, k) {
    for (const u of livingUnits(s, a.side)) if (u.id === a.id || kingAdjacent(u.pos, a.pos)) s = healUnit(s, a, u.id, k.amount)
    return s
  },
  "lingering-bloom"(s, a, t, k) {
    s = healUnit(s, a, t.id, k.amount)
    return setUnit(s, t.id, { hot: k.turns, hotAmount: k.amount })
  },
  stabilize(s, a, t) {
    const live = getUnit(s, t.id)
    s = setUnit(s, t.id, { stabilized: 1, stabBase: live.revive || 0, revive: (live.revive || 0) + 1 })
    return callout(addLog(s, `${a.name} stabilizes ${t.name} - it won't fall this round.`), t.id, "Stabilized!")
  },
  cleanse(s, a, t, k) {
    const patch = {}
    for (const key of CLEANSED) if (t[key] > 0) patch[key] = 0
    s = setUnit(s, t.id, patch)
    s = callout(addLog(s, `${a.name} cleanses ${t.name}.`), t.id, "Cleansed!")
    return healUnit(s, a, t.id, k.amount)
  },
  "emergency-stim"(s, a, t) {
    s = setUnit(s, t.id, { ap: t.ap + 1, exhausted: 1 })
    return callout(addLog(s, `${a.name} stims ${t.name}: +1 AP now, -1 AP next turn.`), t.id, "+1 AP")
  },
  empower(s, a, t, k) {
    s = setUnit(s, t.id, { empower: 1, empowerBonus: k.bonus })
    return callout(addLog(s, `${a.name} empowers ${t.name} (+${k.bonus} damage this turn).`), t.id, "Empowered!")
  },
  "coordinated-strike"(s, a, t) {
    const helpers = livingUnits(s, a.side).filter((u) => u.id !== a.id && !u.npc && kingAdjacent(u.pos, t.pos)).map((u) => u.id)
    for (const id of helpers) s = hit(s, id, t.id, Math.ceil(getUnit(s, id).attack / 2), { name: "Coordinated Strike" }).next
    return s
  },
  "tactical-order"(s, a, t) {
    s = setUnit(s, t.id, { ap: t.ap + 1 })
    return callout(addLog(s, `${a.name} orders ${t.name} forward: +1 AP!`), t.id, "+1 AP")
  },
  "focus-target"(s, a, t, k) {
    s = setUnit(s, t.id, { mark: Math.max(t.mark || 0, 1), markBonus: Math.max(t.mark > 0 ? t.markBonus || 0 : 0, k.bonus) })
    return callout(addLog(s, `${a.name}: "Focus ${t.name}!"`), t.id, "Focus!")
  },
  "hold-formation"(s, a, _t, k) {
    for (const u of livingUnits(s, a.side)) if (!u.structure) s = setUnit(s, u.id, { block: (u.block || 0) + k.block })
    return addLog(s, `${a.name}: "Hold formation!" Every ally gains +${k.block} Block.`)
  },
  "reveal-weakness"(s, a, t) {
    s = setUnit(s, t.id, { exposed: 2 })
    return callout(addLog(s, `${a.name} spots a weakness in ${t.name}.`), t.id, "Exposed!")
  },
  "formation-shift"(s, a, t) {
    const ap = { ...a.pos }
    s = setUnit(s, a.id, { pos: { ...t.pos }, moved: true })
    s = setUnit(s, t.id, { pos: ap })
    return addLog(s, `${a.name} and ${t.name} swap places.`)
  },
  silence(s, a, t) {
    const r = hit(s, a.id, t.id, Math.ceil(a.attack / 2), { name: "Silence" })
    if (r.fell) return r.next
    return callout(setUnit(r.next, t.id, { silenced: 2 }), t.id, "Silenced!")
  },
  pull(s, a, t, k) {
    let pos = { ...t.pos }
    for (let i = 0; i < k.steps; i++) {
      if (kingAdjacent(pos, a.pos)) break
      const p = { row: pos.row + sign(a.pos.row - pos.row), col: pos.col + sign(a.pos.col - pos.col) }
      if (!tileFree(s, p, t.id)) break
      pos = p
    }
    if (!samePos(pos, t.pos)) s = setUnit(s, t.id, { pos })
    s = slowUnit(s, t.id)
    return callout(addLog(s, `${a.name} drags ${t.name} closer.`), t.id, "Pulled!")
  },
  "frost-bolt"(s, a, t) {
    const r = hit(s, a.id, t.id, a.attack, { name: "Frost Bolt" })
    if (r.fell || ended(r.next)) return r.next
    return slowUnit(applyElement(r.next, t.id, "frost", 1), t.id)
  },
  shatter(s, a, t) {
    const mult = t.frozen > 0 ? 2 : t.chill > 0 ? 1.5 : 1
    return hit(s, a.id, t.id, a.attack * mult, { name: "Shatter" }).next
  },
  "frozen-ground"(s, a, t) {
    const terrain = { ...(s.terrain || {}) }
    const icy = new Set(["path", "forest", "rubble", "bush", "poison"])
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const p = { row: t.pos.row + dr, col: t.pos.col + dc }
        if (isOnBoard(p, s.grid) && icy.has(terrainAt(s, p))) terrain[`${p.row}-${p.col}`] = "ice"
      }
    }
    s = addLog({ ...s, terrain }, `${a.name} freezes the ground around ${t.name}.`)
    const chilled = livingUnits(s, t.side).filter((u) => !u.structure && dist(u.pos, t.pos) <= 1).map((u) => u.id)
    for (const id of chilled) if (!ended(s)) s = applyElement(s, id, "frost", 1)
    return s
  },

  // ---- Part B -------------------------------------------------------------
  "root-snare"(s, a, t, k) {
    const r = hit(s, a.id, t.id, k.damage, { name: "Root Snare" })
    return r.fell || ended(r.next) ? r.next : rootUnit(r.next, t.id)
  },
  "growing-wall"(s, a, pos, k) {
    s = addLog(setTerrain(s, pos, "wall", k.hp), `${a.name} grows a thorny wall.`)
    const near = livingUnits(s, "enemy").filter((e) => !e.structure && kingAdjacent(e.pos, pos)).map((e) => e.id)
    for (const id of near) s = rootUnit(s, id)
    return s
  },
  "vine-bridge"(s, a, pos) {
    return addLog(setTerrain(s, pos, "bridge"), `${a.name} weaves a vine bridge.`)
  },
  dispel(s, a, t, k) {
    const { patch, count } = stripBuffs(t)
    s = callout(addLog(setUnit(strikeFx(s, a, t, "Dispel"), t.id, patch), `${a.name} dispels ${count} buff(s) from ${t.name}.`), t.id, "Dispelled!")
    return hit(s, a.id, t.id, k.damage, { name: "Dispel" }).next
  },
  displace(s, a, t, k) {
    const dr = sign(t.pos.row - a.pos.row)
    const dc = sign(t.pos.col - a.pos.col)
    let pos = t.pos
    let blocked = false
    let boulder = null
    for (let i = 0; i < k.steps; i++) {
      const p = { row: pos.row + dr, col: pos.col + dc }
      if (!tileFree(s, p, t.id)) {
        blocked = true
        if (isOnBoard(p, s.grid) && terrainAt(s, p) === "boulder") boulder = { at: p, from: pos }
        break
      }
      pos = p
    }
    s = strikeFx(s, a, t, "Displace")
    if (!samePos(pos, t.pos)) {
      s = callout(addLog(setUnit(s, t.id, { pos }), `${a.name} displaces ${t.name}.`), t.id, "Displaced!")
      s = springTrap(s, t.id)
    }
    // Destructibles: displaced into a boulder - the boulder rolls on.
    if (boulder) s = rollBoulder(s, boulder.at, boulder.from).next
    return blocked && getUnit(s, t.id)?.hp > 0 ? flatHit(s, t.id, k.bonus) : s
  },
  "static-disruption"(s, a, t) {
    const r = hit(s, a.id, t.id, Math.ceil(a.attack / 2), { name: "Static Disruption" })
    if (r.fell) return r.next
    return callout(setUnit(r.next, t.id, { drained: 1 }), t.id, "-1 AP")
  },
  "thorn-trap"(s, a, pos, k) {
    const traps = { ...(s.classTraps || {}), [`${pos.row}-${pos.col}`]: { kind: "thorn", ownerId: a.id, damage: k.damage, poison: k.poison || 0 } }
    return addLog({ ...s, classTraps: traps }, `${a.name} hides a thorn trap.`)
  },
  "poison-mine"(s, a, pos, k) {
    const traps = { ...(s.classTraps || {}), [`${pos.row}-${pos.col}`]: { kind: "poison", ownerId: a.id, amount: k.amount, root: !!k.root } }
    return addLog({ ...s, classTraps: traps }, `${a.name} buries a poison mine.`)
  },
  decoy(s, a, pos, k) {
    const uid = `decoy-${a.id}-${s.units.length}`
    s = placeStructure(s, a, pos, uid, { name: "Decoy", art: "wood", maxHp: k.hp }, { taunt: 1, decoy: true })
    return callout(addLog(s, `${a.name} sets up a Decoy.`), uid, "Decoy!")
  },
  vulnerability(s, a, t) {
    s = setUnit(strikeFx(s, a, t, "Vulnerability"), t.id, { exposed: Math.max(t.exposed || 0, 2) })
    return callout(addLog(s, `${a.name} hexes ${t.name} - it's Exposed.`), t.id, "Exposed!")
  },
  "hex-chain"(s, a, t, k) {
    const ids = [t.id, ...livingUnits(s, t.side).filter((u) => u.id !== t.id && !u.structure && kingAdjacent(u.pos, t.pos)).map((u) => u.id)]
    for (const id of ids) {
      s = hit(s, a.id, id, k.damage, { name: "Hex Chain" }).next
      const u = getUnit(s, id)
      if (u && u.hp > 0) s = callout(setUnit(s, id, { cursed: Math.max(u.cursed || 0, 2) }), id, "Cursed!")
    }
    return s
  },
  "soul-debt"(s, a, t, k) {
    s = setUnit(strikeFx(s, a, t, "Soul Debt"), t.id, { soulDebt: 2, soulDebtDmg: k.damage })
    return callout(addLog(s, `${t.name} now owes a Soul Debt.`), t.id, "Soul Debt!")
  },
  "summon-spirit"(s, a) {
    return summonWolf(s, a, has(a, "spirit-bond") ? { bonded: true } : {})
  },
  "sacrificial-summon"(s, a, _t, k) {
    const sp = companionOf(s, a)
    const heal = Math.min(5, sp.hp)
    s = emit(callout(setUnit(s, sp.id, { hp: 0 }), sp.id, "Burst!"), { kind: "aoe", actorId: sp.id })
    s = addLog(s, `${a.name} sacrifices ${sp.name} - it bursts!`)
    const foes = livingUnits(s, "enemy").filter((e) => !e.structure && kingAdjacent(e.pos, sp.pos)).map((e) => e.id)
    for (const id of foes) s = flatHit(s, id, k.damage)
    return ended(s) ? s : healUnit(s, a, a.id, heal)
  },
  "swarm-command"(s, a, t) {
    for (const u of swarmOf(s, a, t)) s = hit(s, u.id, t.id, getUnit(s, u.id).attack, { name: "Swarm Command" }).next
    return s
  },
  "call-companion"(s, a) {
    return summonWolf(s, a)
  },
  hunt(s, a, t, k) {
    const c = companionOf(s, a)
    const pos = blinkLanding(s, c, t, k.reach)
    if (!samePos(pos, c.pos)) s = moveTo(s, c.id, pos, cardinal(t.pos.col - pos.col, t.pos.row - pos.row))
    s = callout(s, c.id, "Hunt!")
    return hit(s, c.id, t.id, getUnit(s, c.id).attack + k.bonus, { name: "Hunt" }).next
  },
  frenzy(s, a, _t, k) {
    const c = companionOf(s, a)
    s = setUnit(s, c.id, { ap: c.ap + 1, frenzy: 1, frenzyBonus: k.bonus })
    return callout(addLog(s, `${c.name} goes into a frenzy!`), c.id, "Frenzy!")
  },
  "poison-flask"(s, a, t, k) {
    s = strikeFx(s, a, t, "Poison Flask")
    const ids = [t.id, ...livingUnits(s, t.side).filter((u) => u.id !== t.id && !u.structure && kingAdjacent(u.pos, t.pos)).map((u) => u.id)]
    for (const id of ids) if (!ended(s)) s = applyElement(s, id, "poison", k.amount)
    return callout(addLog(s, `${a.name}'s flask bursts - poison everywhere.`), t.id, "Poisoned!")
  },
  "volatile-mixture"(s, a, t, k) {
    const r = hit(s, a.id, t.id, a.attack, { name: "Volatile Mixture" })
    return r.fell || ended(r.next) ? r.next : applyElement(r.next, t.id, "fire", k.amount)
  },
  transmute(s, a, t) {
    const amount = (t.block || 0) + (t.regen || 0)
    s = setUnit(strikeFx(s, a, t, "Transmute"), t.id, { block: 0, regen: 0 })
    s = callout(addLog(s, `${a.name} transmutes ${t.name}'s defenses into ${amount} Poison.`), t.id, "Transmuted!")
    return amount > 0 ? applyElement(s, t.id, "poison", amount) : s
  },
  "mark-threat"(s, a, t, k) {
    s = setUnit(strikeFx(s, a, t, "Mark Threat"), t.id, { mark: Math.max(t.mark || 0, 2), markBonus: Math.max(t.mark > 0 ? t.markBonus || 0 : 0, k.bonus) })
    return callout(addLog(s, `${a.name} marks ${t.name} as the threat.`), t.id, "Marked!")
  },
  trailblazer(s, a, _t, k) {
    for (const u of livingUnits(s, a.side)) {
      if (u.structure || dist(u.pos, a.pos) > k.radius) continue
      s = setUnit(s, u.id, { root: 0, slow: 0, freeStep: 1 })
    }
    return addLog(s, `${a.name} blazes a trail - the next move is free.`)
  },
  sabotage(s, a, t) {
    s = callout(setUnit(s, t.id, { block: 0, ward: 0, bulwark: 0 }), t.id, "Sabotaged!")
    return hit(s, a.id, t.id, a.attack, { name: "Sabotage" }).next
  },
  "explosive-charge"(s, a, pos, k) {
    const charges = [...(s.classCharges || []), { row: pos.row, col: pos.col, ownerId: a.id, damage: k.damage }]
    return addLog({ ...s, classCharges: charges }, `${a.name} plants an Explosive Charge - it blows when you end the turn.`)
  },
  "smoke-bomb"(s, a, pos) {
    const cells = []
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) cells.push({ row: pos.row + dr, col: pos.col + dc })
    return addLog(growGrass(s, cells), `${a.name}'s Smoke Bomb covers the ground.`)
  },
  "deploy-turret"(s, a, pos, k) {
    const uid = `turret-${a.id}-${s.units.length}`
    s = placeStructure(s, a, pos, uid, { name: "Turret", art: "stone", maxHp: k.hp }, { turret: true, ownerId: a.id, turretAttack: k.attack, turretReach: k.reach })
    return callout(addLog(s, `${a.name} deploys a Turret.`), uid, "Turret!")
  },
  "build-barricade"(s, a, pos) {
    return addLog(setTerrain(s, pos, "wall", WALL_MAX_HP), `${a.name} builds a barricade.`)
  },
  "spirit-step"(s, a, pos) {
    s = moveTo(s, a.id, pos, a.facing)
    return callout(addLog(s, `${a.name} steps through the spirit world.`), a.id, "Spirit Step!")
  },
  "phase-shift"(s, a, t) {
    s = setUnit(s, t.id, { phased: 1 })
    return callout(addLog(s, `${t.name} phases out of the world.`), t.id, "Phased!")
  },
  "return-to-hearth"(s, a, _t, k) {
    const [pos] = freeCellsNear(s, { row: a.pos.row, col: s.grid.cols - 1 }, 1)
    if (pos) s = moveTo(s, a.id, pos, "W")
    s = callout(addLog(s, `${a.name} returns to the hearth.`), a.id, "Home!")
    return healUnit(s, a, a.id, k.amount)
  },
  "begin-ritual"(s, a, _t, k) {
    const n = Math.min(k.max, (a.ritual || 0) + 1)
    return callout(addLog(setUnit(s, a.id, { ritual: n }), `${a.name} channels the ritual (${n}).`), a.id, `Ritual ${n}`)
  },
  "complete-ritual"(s, a) {
    return releaseRitual(s, a.id, false)
  },
  "spirit-offering"(s, a, t, k) {
    s = setUnit(s, a.id, { hp: Math.max(1, a.hp - k.hpCost) })
    s = setUnit(s, t.id, { ap: t.ap + 1 })
    return callout(addLog(s, `${a.name} offers blood: ${t.name} gains +1 AP.`), t.id, "+1 AP")
  },
  "haste-time"(s, a, t) {
    return callout(addLog(setUnit(s, t.id, { hasted: 1 }), `${a.name} hastens ${t.name}: +1 AP next turn.`), t.id, "Hasted!")
  },
  "slow-time"(s, a, t) {
    s = interruptEnemy(slowUnit(strikeFx(s, a, t, "Slow Time"), t.id), t.id, 2)
    return callout(addLog(s, `${a.name} slows time around ${t.name}.`), t.id, "Slowed!")
  },
  rewind(s, a, t) {
    const healed = Math.min(t.maxHp, t.rewindHp)
    s = emit(setUnit(s, t.id, { hp: healed }), { kind: "heal", actorId: a.id, targetId: t.id, amount: healed - t.hp })
    return callout(addLog(s, `${a.name} rewinds ${t.name}'s wounds (+${healed - t.hp}).`), t.id, "Rewind!")
  },
  "beast-form"(s, a) {
    return shift(s, a, "beast", 0)
  },
  "root-form"(s, a, _t, k) {
    return shift(s, a, "root", k.block)
  },
  "predator-form"(s, a) {
    return shift(s, a, "predator", 0)
  },
  "consume-curse"(s, a, t) {
    const dmg = curseDamage(t)
    const patch = { corruption: 0 }
    for (const key of AILMENTS) if (t[key] > 0 && key !== "exposed") patch[key] = 0
    s = callout(setUnit(s, t.id, patch), t.id, "Consumed!")
    return hit(s, a.id, t.id, dmg, { name: "Consume Curse" }).next
  },
  "invert-blessing"(s, a, t) {
    const { patch, count } = stripBuffs(t)
    s = setUnit(strikeFx(s, a, t, "Invert Blessing"), t.id, { ...patch, corruption: (t.corruption || 0) + count })
    return callout(addLog(s, `${a.name} inverts ${count} blessing(s) on ${t.name}.`), t.id, "Inverted!")
  },
  "spread-corruption"(s, a, t) {
    s = strikeFx(s, a, t, "Spread Corruption")
    const near = livingUnits(s, t.side).filter((u) => u.id !== t.id && !u.structure && kingAdjacent(u.pos, t.pos)).map((u) => u.id)
    for (const id of near) {
      const u = getUnit(s, id)
      s = setUnit(s, id, { corruption: (u.corruption || 0) + Math.floor((t.corruption || 0) / 2) })
      if (t.poison > 0 && !ended(s)) s = applyElement(s, id, "poison", t.poison)
      if (t.burn > 0 && !ended(s)) s = applyElement(s, id, "fire", t.burn)
      s = callout(s, id, "Corrupted!")
    }
    return s
  },
  "emergency-supply"(s, a, t, k) {
    s = healUnit(s, a, t.id, k.amount)
    const live = getUnit(s, t.id)
    return callout(setUnit(s, t.id, { block: (live.block || 0) + k.block }), t.id, "Supplied!")
  },
  appraise(s, a, t) {
    s = setUnit(strikeFx(s, a, t, "Appraise"), t.id, { appraised: 2 })
    return callout(addLog(s, `${a.name} appraises ${t.name} - worth +1 Essence if it falls soon.`), t.id, "Appraised!")
  },
  "relic-transfer"(s, a, t) {
    const fx = (a.triggers || []).filter((x) => x.source)
    if (!fx.length) {
      s = setUnit(s, t.id, { block: (t.block || 0) + 2 })
      return callout(addLog(s, `${a.name} has no relic to share - ${t.name} gets +2 Block.`), t.id, "+2 Block")
    }
    s = setUnit(s, t.id, { triggers: [...(t.triggers || []), ...fx.map((x) => ({ ...x, transferred: true }))] })
    return callout(addLog(s, `${a.name} passes ${fx.length} relic effect(s) to ${t.name}.`), t.id, "Relic!")
  },
  "forbidden-relic"(s, a, _t, k) {
    s = setUnit(s, a.id, { hp: a.hp - k.hpCost, attack: a.attack + k.bonus })
    return callout(addLog(s, `${a.name} grips the Forbidden Relic (-${k.hpCost} HP, +${k.bonus} attack).`), a.id, "Forbidden!")
  },
  purge(s, a, t) {
    const patch = {}
    for (const key of CLEANSED) if (t[key] > 0) patch[key] = 0
    const n = Object.keys(patch).length
    s = callout(addLog(setUnit(s, t.id, patch), `${a.name} purges ${n} ailment(s) from ${t.name}.`), t.id, "Purged!")
    return n ? healUnit(s, a, t.id, n) : s
  },
  "purifying-light"(s, a, _t, k) {
    for (const u of livingUnits(s, a.side)) {
      if (u.structure || dist(u.pos, a.pos) > k.radius) continue
      const key = CLEANSED.find((c) => u[c] > 0)
      s = setUnit(s, u.id, { block: (u.block || 0) + k.block, ...(key ? { [key]: 0 } : {}) })
    }
    s = emit(s, { kind: "aoe", actorId: a.id })
    const foes = livingUnits(s, "enemy").filter((e) => !e.structure && dist(e.pos, a.pos) <= k.radius && (e.cursed > 0 || e.corruption > 0)).map((e) => e.id)
    for (const id of foes) s = hit(s, a.id, id, k.damage, { name: "Purifying Light" }).next
    return s
  },
  scavenge(s, a, t, k) {
    const r = hit(s, a.id, t.id, a.attack, { name: "Scavenge" })
    if (!r.killed) return r.next
    s = healUnit(r.next, a, a.id, k.amount)
    return addEssence(s, a.id, 1)
  },
  overgrow(s, a, pos) {
    const cells = [pos, { row: pos.row - 1, col: pos.col }, { row: pos.row + 1, col: pos.col }, { row: pos.row, col: pos.col - 1 }, { row: pos.row, col: pos.col + 1 }]
    return addLog(growGrass(s, cells), `${a.name} makes the grass grow tall.`)
  },
}

function shift(s, a, form, block) {
  const b = (a.block || 0) + block + (has(a, "form-mastery") ? 2 : 0)
  s = setUnit(s, a.id, { form, block: b })
  const name = { beast: "Beast", root: "Root", predator: "Predator" }[form]
  return callout(addLog(s, `${a.name} shifts into ${name} Form.`), a.id, `${name} Form!`)
}

// Cast one class skill. Returns `state` unchanged when not allowed.
export function castClassSkill(state, actorId, targetId, skillId) {
  const actor = getUnit(state, actorId)
  if (!actor || actor.hp <= 0 || state.phase !== actor.side) return state
  const skill = classSkillById(actor, skillId)
  if (!skill || !classSkillReady(actor, skill)) return state
  let target = null
  let tile = null
  if (skill.target === "tile") {
    // targetId is "row-col" (or a {row, col}).
    const [row, col] = typeof targetId === "string" ? targetId.split("-").map(Number) : [targetId?.row, targetId?.col]
    tile = { row, col }
    if (!tileAllows(state, actor, tile, skill)) return state
  } else if (skill.target === "self") {
    if (!selfAllows(state, actor, skill)) return state
  } else {
    target = classSkillTargets(state, actorId, skill).find((u) => u.id === targetId)
    if (!target) return state
  }
  let next = setUnit(state, actorId, { ap: actor.ap - skill.cost, classCds: { ...(actor.classCds || {}), [skill.id]: skill.cooldown } })
  next = callout(next, actorId, `${skill.name}!`)
  next = HANDLERS[skill.id](next, getUnit(next, actorId), tile || (target ? getUnit(next, target.id) : null), skill)
  if (skill.upgrade?.fx && !ended(next)) next = applySkillFx(next, actorId, target?.id || null, tile, skill.upgrade.fx)
  next = afterCast(next, actorId, target?.id || null, skill)
  return checkTacticsBattleEnd(next)
}

// UI helpers.
export function classInfoFor(unit) {
  return classById(unit?.classId)
}
export function classSkillStatus(unit, skill) {
  const cd = (unit?.classCds || {})[skill.id] || 0
  if (cd > 0) return `Recharging (${cd})`
  if (unit.ap < skill.cost) return `Needs ${skill.cost} AP`
  if (hasMana(unit) && unit.mana < manaCostOf(skill)) return `Needs ${manaCostOf(skill)} mana`
  return hasMana(unit) ? `${skill.cost} AP · ${manaCostOf(skill)} mana` : `${skill.cost} AP`
}
