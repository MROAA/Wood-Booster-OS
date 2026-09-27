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
import { kingAdjacent, isOnBoard, samePos } from "./targeting"
import { TERRAIN, terrainAt, canReach } from "./tacticsTerrain"
import { getUnit, setUnit, emit, livingUnits, checkTacticsBattleEnd, abilityHit } from "./tacticsEngine"
import { applyElement, ENTANGLE_DURATION } from "./tacticsElements"

const SLOW = 2
const COUNTERS = ["guarded", "zoneGuard", "overwatch", "mark", "sMark", "challenged", "exposed", "silenced", "disarmed", "empower"]
const DEBUFFS = ["poison", "burn", "chill", "frozen", "root", "slow", "weak", "vulnerable", "entangle", "suppressed", "mark", "sMark", "exposed", "silenced", "disarmed", "challenged"]
const CLEANSED = ["poison", "burn", "chill", "frozen", "root", "slow", "weak", "vulnerable", "entangle", "suppressed", "disarmed"]

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
  return !!unit && !!skill && unit.hp > 0 && unit.ap >= skill.cost && !((unit.classCds || {})[skill.id] > 0)
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
  }
  if (defender.exposed > 0) a = Math.floor(a * 1.25)
  if (attacker.disarmed > 0) a = Math.floor(a / 2)
  if (defender.zoneGuard > 0) a -= 1
  if (has(defender, "last-stand") && hpFrac(defender) < 0.5) a -= 1
  return Math.max(0, a)
}

// Guardian's Stalwart / Juggernaut's Last Stand.
export function immovable(u) {
  return has(u, "stalwart") || (has(u, "last-stand") && hpFrac(u) < 0.5)
}
export function keepsBlockOnSideHit(u) {
  return has(u, "stalwart")
}
export function ignoresFlank(u) {
  return has(u, "foresight")
}
export function wallDamage(u, amount) {
  return has(u, "siege") ? amount * 2 : amount
}

// Medic's Triage.
export function healAmount(actor, target, amount) {
  return has(actor, "triage") && target.hp < target.maxHp / 2 ? Math.round(amount * 1.5) : amount
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
  if (mover.side === "player") return setUnit(state, unitId, { moved: true })
  let next = state
  for (const s of livingUnits(state, "player")) {
    if (!(s.overwatch > 0) || !canReach(next, s, s.pos, mover.pos)) continue
    const live = getUnit(next, unitId)
    if (!live || live.hp <= 0 || ended(next)) break
    next = setUnit(next, s.id, { overwatch: 0 })
    next = callout(addLog(next, `${s.name}'s Overwatch fires at ${live.name}!`), s.id, "Overwatch!")
    next = abilityHit(next, s.id, unitId, s.attack, { name: "Overwatch" }).next
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
  return next
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

// Duelist's Riposte: struck in melee by an enemy -> half-damage return hit.
export function riposte(state, attackerId, targetId) {
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
      if (u.classCds) {
        const cds = {}
        for (const [k, v] of Object.entries(u.classCds)) cds[k] = Math.max(0, v - 1)
        patch.classCds = cds
      }
      if (u.exhausted > 0) {
        patch.ap = Math.max(0, u.ap - 1)
        patch.exhausted = 0
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
    default:
      return true
  }
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
  return abilityHit(state, actorId, targetId, Math.max(0, Math.round(base)), skill)
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
  overwatch(s, a) {
    return addLog(setUnit(s, a.id, { overwatch: 1 }), `${a.name} takes aim and watches the field.`)
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
    s = hit(s, a.id, t.id, Math.ceil(a.attack * k.mult), { name: "Double Strike" }).next
    return hit(s, a.id, t.id, Math.ceil(getUnit(s, a.id).attack * k.mult), { name: "Double Strike" }).next
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
}

// Cast one class skill. Returns `state` unchanged when not allowed.
export function castClassSkill(state, actorId, targetId, skillId) {
  const actor = getUnit(state, actorId)
  if (!actor || actor.hp <= 0 || state.phase !== actor.side) return state
  const skill = classSkillById(actor, skillId)
  if (!skill || !classSkillReady(actor, skill)) return state
  let target = null
  if (skill.target !== "self") {
    target = classSkillTargets(state, actorId, skill).find((u) => u.id === targetId)
    if (!target) return state
  }
  let next = setUnit(state, actorId, { ap: actor.ap - skill.cost, classCds: { ...(actor.classCds || {}), [skill.id]: skill.cooldown } })
  next = callout(next, actorId, `${skill.name}!`)
  next = HANDLERS[skill.id](next, getUnit(next, actorId), target ? getUnit(next, target.id) : null, skill)
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
  return `${skill.cost} AP`
}
