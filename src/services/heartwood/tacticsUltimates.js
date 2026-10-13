// Hearthwood Frontier - mana ULTIMATES, Mana Wells and Mana Link
// (difficulty + mana sprint 2; Mana PRD §51 "Ultimate Meter", §68
// "stealing, sharing, drain, environmental resources").
//
// ENEMY ULTIMATES. Elites, bosses and (at higher threat tiers) some
// casters carry a second, glowing ULTIMATE bar (`ultCharge`, 0-100) that
// fills every enemy turn (faster on a Mana Well). At 100 the enemy WINDS
// UP: the board shows ⚠ and the tiles it will hit for a whole player turn,
// then it fires on its next turn. While it channels the bar stops filling,
// so the heroes can BREAK it:
//   - burn / steal / drain ANY of its mana (silence, dispel, soul debt,
//     Mana Storm, the Nullstone relic...),
//   - stun or freeze it,
//   - land one big hit (20%+ of its max HP: "Staggered!"),
//   - kill it - or just step out of the marked tiles.
// The windup + release run inside decideEnemyIntent/applyEnemyIntent, and
// the meter fills inside enemyPhaseStart, so previewEnemyIntents shows it
// exactly.
//
// HERO ULTIMATES. Every hero with a resource BAR (not the Commander - it
// has its own Power) can spend a FULL bar for a role ultimate (1 AP).
// MANA LINK. Support / healer / control heroes and the Commander can pass
// some of their own resource to an ally (free, once a turn) - set up an
// ally's ultimate or a big skill.
// MANA WELLS. Contested board tiles: whoever starts its turn on one draws
// extra resource (tacticsMana.sideTurnRegen) / ultimate charge.
import { emit, getUnit, setUnit, applyDamageWithBlock, checkTacticsBattleEnd, abilityHit } from "./tacticsEngine"
import { hasMana, profileOf, manaRole, gainExternal, burnMana, scaleAmount, resourceLabel } from "./tacticsMana"
import { roleOf } from "./tacticsRoles"
import { enemySkillsFor } from "./tacticsEnemyAbilities"

export const ULT_MAX = 100
// A hit this big (share of max HP) staggers a channeling enemy.
export const STAGGER_PCT = 0.2
// Burn / steal on an enemy also burns this much ultimate charge per point.
export const ULT_BURN_MULT = 1.5
// What a broken ultimate leaves on the bar.
export const ULT_BROKEN_LEFT = 40
// Mana Wells.
export const WELL_GAIN = 12
export const WELL_ULT_GAIN = 15

// --- Enemy ultimates ------------------------------------------------------------------------

export const ENEMY_ULTS = {
  cataclysm: { id: "cataclysm", name: "Cataclysm", icon: "☄", shape: "blast", mult: 1.6, min: 6, range: 6, text: "crushes the marked 3x3 tiles" },
  "dread-nova": { id: "dread-nova", name: "Dread Nova", icon: "✺", shape: "nova", radius: 2, mult: 1.4, min: 5, text: "blasts every tile within 2 of itself" },
  "void-rend": { id: "void-rend", name: "Void Rend", icon: "◐", shape: "blast", mult: 1.2, min: 4, burn: 25, range: 6, text: "tears the marked 3x3 tiles and burns the heroes' mana" },
  "war-chant": { id: "war-chant", name: "War Chant", icon: "♫", shape: "allies", heal: 0.3, block: 4, strength: 2, text: "heals every enemy 30%, gives +4 Block and +2 attack" },
}

const isCasterUnit = (u) => {
  const r = roleOf(u)
  return r === "healer" || r === "support" || r === "control" || ((u.range || 1) > 1 && r !== "tank")
}

function ultKindFor(u, leader) {
  const kinds = new Set(enemySkillsFor(u).map((s) => s.kind))
  if (leader) return (u.range || 1) > 1 || roleOf(u) === "control" ? "cataclysm" : "dread-nova"
  if (kinds.has("drain") || u.resource === "souls") return "void-rend"
  const r = roleOf(u)
  if (r === "healer" || r === "support") return "war-chant"
  return (u.range || 1) > 1 ? "cataclysm" : "dread-nova"
}

function makeUlt(u, kindId, spec, leader) {
  const def = ENEMY_ULTS[kindId]
  const boss = leader && (spec.kind === "boss" || spec.kind === "miniboss")
  const amount = def.mult ? Math.max(def.min, Math.round((u.attack || 0) * def.mult * (boss ? 1.25 : 1))) : 0
  return { id: def.id, name: def.name, icon: def.icon, shape: def.shape, radius: def.radius || 1, range: def.range || 0, burn: def.burn || 0, amount, gain: spec.ultGain + (leader ? 5 : 0), boss }
}

// Hand out ultimates for a fight (tacticsDifficulty.applyDifficulty).
export function assignUltimates(state, spec) {
  const wants = spec.ult || []
  if (!wants.length) return state
  const enemies = state.units.filter((u) => u.side === "enemy" && u.hp > 0 && !u.structure && !u.npc)
  if (!enemies.length) return state
  const give = new Map()
  if (wants.includes(spec.kind) && spec.kind !== "battle") {
    const leader = (state.boss?.unitId && enemies.find((u) => u.id === state.boss.unitId)) || [...enemies].sort((a, b) => b.maxHp - a.maxHp || (a.id < b.id ? -1 : 1))[0]
    give.set(leader.id, makeUlt(leader, ultKindFor(leader, true), spec, true))
  }
  const casterSlots = wants.filter((w) => w === "caster").length
  if (casterSlots) {
    const casters = enemies.filter((u) => !give.has(u.id) && isCasterUnit(u)).sort((a, b) => b.maxHp - a.maxHp || (a.id < b.id ? -1 : 1))
    for (const u of casters.slice(0, casterSlots)) give.set(u.id, makeUlt(u, ultKindFor(u, false), spec, false))
  }
  if (!give.size) return state
  return { ...state, units: state.units.map((u) => (give.has(u.id) ? { ...u, ult: give.get(u.id), ultCharge: Math.min(ULT_MAX - 1, spec.ultStart || 0), ultArmed: null } : u)) }
}

const cheb = (a, b) => Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col))
const onBoard = (state, p) => p.row >= 0 && p.col >= 0 && p.row < state.grid.rows && p.col < state.grid.cols
function square(state, center, r) {
  const out = []
  for (let dr = -r; dr <= r; dr++) for (let dc = -r; dc <= r; dc++) {
    const p = { row: center.row + dr, col: center.col + dc }
    if (onBoard(state, p)) out.push(p)
  }
  return out
}
const isWell = (state, pos) => (state.terrain || {})[`${pos.row}-${pos.col}`] === "manawell"
const heroesAlive = (state) => state.units.filter((u) => u.side === "player" && u.hp > 0 && !u.structure)

// Enemy phase start (inside the engine's shared enemyPhaseStart): every
// enemy with an ultimate fills its bar; a channeling one does not.
export function enemyUltTick(state) {
  if (!state.units.some((u) => u.ult)) return state
  let next = state
  for (const u of state.units) {
    if (u.side !== "enemy" || u.hp <= 0 || !u.ult || u.ultArmed) continue
    const gain = u.ult.gain + (isWell(state, u.pos) ? WELL_ULT_GAIN : 0)
    const charge = Math.min(ULT_MAX, (u.ultCharge || 0) + gain)
    if (charge !== u.ultCharge) next = setUnit(next, u.id, { ultCharge: charge })
  }
  return next
}

// Where a blast lands: the hero tile that catches the most heroes in its
// 3x3 (ties: the first in unit order). null = nobody in reach.
function blastCenter(state, enemy) {
  const heroes = heroesAlive(state)
  let best = null
  for (const h of heroes) {
    if (cheb(enemy.pos, h.pos) > enemy.ult.range) continue
    const hits = heroes.filter((o) => cheb(o.pos, h.pos) <= 1).length
    if (!best || hits > best.hits) best = { center: { row: h.pos.row, col: h.pos.col }, hits }
  }
  return best?.center || null
}

export function ultTiles(state, enemy, armed = enemy.ultArmed) {
  const ult = enemy.ult
  if (!ult) return []
  if (ult.shape === "nova") return square(state, enemy.pos, ult.radius || 2)
  if (ult.shape === "allies") return state.units.filter((u) => u.side === "enemy" && u.hp > 0).map((u) => ({ row: u.pos.row, col: u.pos.col }))
  return armed?.tiles || []
}

function intentBase(enemy, phase, tiles, extra = {}) {
  const u = enemy.ult
  return { kind: "ultimate", phase, ultId: u.id, name: u.name, icon: u.icon, shape: u.shape, amount: u.amount, burn: u.burn, tiles, ...extra }
}

// Top of decideEnemyIntent. `decide` = the engine's decideEnemyIntent
// (for the action that follows a windup). null = no ultimate business.
export function ultimateIntent(state, enemy, decide) {
  if (!enemy?.ult) return null
  if (enemy.ultArmed) {
    // The action right after the windup (same turn) is a normal one.
    if (enemy.ultArmed.turn === state.turn) return null
    if ((enemy.ultCharge || 0) >= ULT_MAX) return intentBase(enemy, "release", ultTiles(state, enemy))
    return intentBase(enemy, "fizzle", [])
  }
  if ((enemy.ultCharge || 0) < ULT_MAX) return null
  let armed
  if (enemy.ult.shape === "blast") {
    const center = blastCenter(state, enemy)
    if (!center) return null
    armed = { center, tiles: square(state, center, 1), turn: state.turn }
  } else armed = { center: { ...enemy.pos }, tiles: [], turn: state.turn }
  const armedState = setUnit(state, enemy.id, { ultArmed: armed })
  const then = decide(armedState, enemy.id)
  return intentBase(enemy, "windup", enemy.ult.shape === "blast" ? armed.tiles : ultTiles(armedState, getUnit(armedState, enemy.id), armed), { center: armed.center, armed, then })
}

const addLog = (state, line) => ({ ...state, log: [...(state.log || []), line] })

// applyEnemyIntent for kind "ultimate". `act` = the engine's applyEnemyIntent.
export function applyUltimateIntent(state, enemyId, intent, act) {
  const enemy = getUnit(state, enemyId)
  if (!enemy || enemy.hp <= 0 || !enemy.ult) return state
  if (intent.phase === "windup") {
    let next = setUnit(state, enemyId, { ultArmed: intent.armed })
    next = emit(addLog(next, `${enemy.name} gathers its power - ${enemy.ult.name} fires NEXT turn! Break it or get clear.`), { kind: "reaction", unitId: enemyId, label: `⚠ ${enemy.ult.name}` })
    return intent.then ? act(next, enemyId, intent.then) : next
  }
  if (intent.phase === "fizzle") {
    const next = setUnit(state, enemyId, { ultArmed: null, ap: 0 })
    return emit(addLog(next, `${enemy.name}'s ${enemy.ult.name} collapses - it reels from the backlash.`), { kind: "reaction", unitId: enemyId, label: "Fizzled!" })
  }
  return releaseUltimate(state, enemyId, intent.tiles)
}

function releaseUltimate(state, enemyId, tiles) {
  const enemy = getUnit(state, enemyId)
  const ult = enemy.ult
  let next = setUnit(state, enemyId, { ultArmed: null, ultCharge: 0, ap: 0 })
  next = emit(addLog(next, `${enemy.name} unleashes ${ult.name}!`), { kind: "combo", unitId: enemyId, label: `${ult.icon} ${ult.name.toUpperCase()}!`, big: true, combo: "ultimate", tiles })
  if (ult.shape === "allies") {
    for (const a of next.units.filter((u) => u.side === "enemy" && u.hp > 0)) {
      const heal = Math.min(a.maxHp - a.hp, Math.round(a.maxHp * (ENEMY_ULTS[ult.id]?.heal || 0.3)))
      next = setUnit(next, a.id, { hp: a.hp + heal, block: (a.block || 0) + (ENEMY_ULTS[ult.id]?.block || 4), attack: a.attack + (ENEMY_ULTS[ult.id]?.strength || 2) })
      if (heal > 0) next = emit(next, { kind: "heal", actorId: enemyId, targetId: a.id, amount: heal })
    }
    return addLog(next, `Every enemy is healed, braced and enraged.`)
  }
  const keys = new Set(tiles.map((t) => `${t.row}-${t.col}`))
  const victims = next.units.filter((u) => u.side === "player" && u.hp > 0 && keys.has(`${u.pos.row}-${u.pos.col}`)).map((u) => u.id)
  for (const id of victims) {
    if (next.phase === "won" || next.phase === "lost") break
    const live = getUnit(next, id)
    if (!live || live.hp <= 0) continue
    const r = applyDamageWithBlock(next, id, ult.amount)
    next = addLog(r.next, `${ult.name} hits ${live.name} for ${r.remaining}.${r.fell ? " It falls." : ""}`)
    if (ult.burn) next = burnMana(next, id, ult.burn, "void").next
    next = checkTacticsBattleEnd(next)
  }
  if (!victims.length) next = addLog(next, `${ult.name} hits nothing - your heroes got clear.`)
  return checkTacticsBattleEnd(next)
}

// A channel is broken (burn, stun, stagger, interrupt): no release.
export function breakUltimate(state, unitId, why = "broken") {
  const u = getUnit(state, unitId)
  if (!u || !u.ultArmed) return state
  const tiles = u.ultArmed.tiles?.length ? u.ultArmed.tiles : ultTiles(state, u)
  const next = setUnit(state, unitId, { ultArmed: null, ultCharge: Math.min(u.ultCharge || 0, ULT_BROKEN_LEFT) })
  return emit(addLog(next, `${u.name}'s ${u.ult.name} is ${why === "stagger" ? "staggered out of it" : why === "stun" ? "stunned away" : "broken"}!`), {
    kind: "combo",
    unitId,
    label: why === "stagger" ? "Staggered! Ultimate broken" : "Ultimate broken!",
    big: true,
    combo: "ult-break",
    tiles,
  })
}

// Burn / steal on an enemy eats its ultimate charge too; a channeling
// one is broken by ANY burn.
export function burnUltimate(state, unitId, amount) {
  const u = getUnit(state, unitId)
  if (!u || !u.ult || u.hp <= 0 || !(amount > 0)) return state
  if (u.ultArmed) return breakUltimate(state, unitId, "burn")
  const lost = Math.min(u.ultCharge || 0, Math.round(amount * ULT_BURN_MULT))
  if (!lost) return state
  return emit(setUnit(state, unitId, { ultCharge: (u.ultCharge || 0) - lost }), { kind: "mana", unitId, amount: -lost, label: "ult-burn", text: `-${lost} ⚠ ultimate` })
}

// A big hit on a channeling enemy staggers it.
export function maybeStagger(state, unitId, lost) {
  const u = getUnit(state, unitId)
  if (!u || !u.ultArmed || u.hp <= 0 || !(lost >= Math.max(1, Math.round(u.maxHp * STAGGER_PCT)))) return state
  return breakUltimate(state, unitId, "stagger")
}

// UI: everything the board needs about one enemy's ultimate.
export function ultStatus(unit) {
  if (!unit?.ult) return null
  const pct = Math.round(((unit.ultCharge || 0) / ULT_MAX) * 100)
  const def = ENEMY_ULTS[unit.ult.id]
  const what = unit.ult.shape === "allies" ? def.text : `${def.text}${unit.ult.amount ? ` for ${unit.ult.amount}` : ""}`
  return {
    ...unit.ult,
    pct,
    armed: !!unit.ultArmed,
    text: `${unit.ult.icon} ${unit.ult.name}: ${what}. Bar ${unit.ultCharge || 0}/${ULT_MAX} (+${unit.ult.gain} a turn).${unit.ultArmed ? " CHANNELING - fires next enemy turn. Burn its mana, stun it, or hit it for 20%+ of its HP to break it." : ""}`,
  }
}

// --- Hero ultimates -----------------------------------------------------------------------------

export const HERO_ULTS = {
  tank: { id: "unbreakable", name: "Unbreakable", icon: "⛨", target: "self", text: "+12 Block, and +6 Block to every ally next to it." },
  melee: { id: "onslaught", name: "Onslaught", icon: "⚔", target: "enemy", reach: 1, mult: 2.5, text: "A crushing blow on an adjacent enemy: 2.5x attack, ignores cover, +40% to hit." },
  ranged: { id: "deadeye", name: "Deadeye", icon: "➶", target: "enemy", reachPlus: 1, mult: 2, text: "A perfect shot (range +1): 2x attack, ignores cover, +40% to hit." },
  healer: { id: "renewal", name: "Renewal", icon: "✚", target: "self", radius: 3, heal: 10, text: "Heals every hero within 3 tiles for 10 and cures their Poison." },
  support: { id: "mana-surge", name: "Mana Surge", icon: "✦", target: "self", radius: 3, gift: 30, text: "Every other hero within 3 tiles gains +30 of its resource (small pools less) - set up their big skills." },
  control: { id: "mana-storm", name: "Mana Storm", icon: "⚡", target: "enemy", reach: 4, damage: 4, burn: 30, text: "Strikes an enemy within 4 tiles and everything next to it: 4 damage, burns 30 mana, breaks ultimates, Slows." },
}
const ULT_SHOT = { ignoreCover: true, aim: 40, label: "Ultimate", coverLabel: "Ultimate - ignores cover" }

export function heroUltInfo(unit) {
  if (!unit || unit.side !== "player" || unit.id === "player-commander" || unit.npc || unit.structure || !hasMana(unit)) return null
  const prof = profileOf(unit)
  if (prof.special === "inverted" || prof.special === "tokens" || !(unit.manaMax > 0)) return null
  return HERO_ULTS[manaRole(unit)] || HERO_ULTS.melee
}

export function heroUltReady(state, unit) {
  const info = heroUltInfo(unit)
  return !!info && state.phase === "player" && unit.hp > 0 && unit.ap >= 1 && unit.mana >= unit.manaMax
}

export function heroUltTargets(state, unitId) {
  const u = getUnit(state, unitId)
  const info = heroUltInfo(u)
  if (!info || info.target !== "enemy") return []
  const reach = info.reach || (u.range || 1) + (info.reachPlus || 0)
  return state.units.filter((e) => e.side === "enemy" && e.hp > 0 && cheb(e.pos, u.pos) <= reach)
}

export function castHeroUltimate(state, unitId, targetId = null) {
  const u = getUnit(state, unitId)
  if (!u || !heroUltReady(state, u)) return state
  const info = heroUltInfo(u)
  if (info.target === "enemy" && !heroUltTargets(state, unitId).some((e) => e.id === targetId)) return state
  const spent = u.mana
  let next = setUnit(state, unitId, { mana: 0, ap: u.ap - 1 })
  next = emit(next, { kind: "mana", unitId, amount: -spent, label: "ultimate", text: `ULTIMATE -${spent} ${resourceLabel(u)}` })
  const tiles = []
  if (info.id === "unbreakable") {
    next = setUnit(next, unitId, { block: (u.block || 0) + 12 })
    tiles.push(u.pos)
    for (const a of next.units.filter((x) => x.side === "player" && x.hp > 0 && x.id !== unitId && cheb(x.pos, u.pos) <= 1)) {
      next = setUnit(next, a.id, { block: (a.block || 0) + 6 })
      tiles.push(a.pos)
    }
  } else if (info.id === "onslaught" || info.id === "deadeye") {
    const t = getUnit(next, targetId)
    tiles.push(t.pos)
    next = abilityHit(next, unitId, targetId, Math.round((u.attack || 1) * info.mult), { name: info.name, shot: ULT_SHOT }).next
  } else if (info.id === "renewal") {
    for (const a of next.units.filter((x) => x.side === "player" && x.hp > 0 && cheb(x.pos, u.pos) <= info.radius)) {
      const heal = Math.min(a.maxHp - a.hp, info.heal)
      next = setUnit(next, a.id, { hp: a.hp + heal, poison: 0 })
      tiles.push(a.pos)
      if (heal > 0) next = emit(next, { kind: "heal", actorId: unitId, targetId: a.id, amount: heal })
    }
  } else if (info.id === "mana-surge") {
    for (const a of next.units.filter((x) => x.side === "player" && x.hp > 0 && x.id !== unitId && cheb(x.pos, u.pos) <= info.radius)) {
      next = gainExternal(next, a.id, info.gift, "surge")
      tiles.push(a.pos)
    }
  } else if (info.id === "mana-storm") {
    const center = getUnit(next, targetId).pos
    for (const e of next.units.filter((x) => x.side === "enemy" && x.hp > 0 && cheb(x.pos, center) <= 1).map((x) => x.id)) {
      if (next.phase === "won" || next.phase === "lost") break
      const live = getUnit(next, e)
      if (!live || live.hp <= 0) continue
      tiles.push(live.pos)
      next = burnMana(next, e, info.burn, "storm").next
      const r = applyDamageWithBlock(next, e, info.damage)
      next = r.next
      if (getUnit(next, e)?.hp > 0) next = setUnit(next, e, { slow: Math.max(getUnit(next, e).slow || 0, 2) })
      next = checkTacticsBattleEnd(next)
    }
  }
  next = emit(addLog(next, `${u.name} unleashes ${info.name}!`), { kind: "combo", unitId, label: `${info.icon} ${info.name.toUpperCase()}!`, big: true, combo: "hero-ult", tiles })
  // Echo Prism relic: part of the bar comes back.
  const refund = state.manaRelic?.ultRefund || 0
  if (refund > 0 && getUnit(next, unitId)?.hp > 0) next = gainExternal(next, unitId, Math.round((u.manaMax * refund) / 100), "echo")
  return checkTacticsBattleEnd(next)
}

// --- Mana Link -----------------------------------------------------------------------------------

export const LINK_GIVE = 20
export const LINK_RANGE = 3

export function canLinkFrom(unit) {
  if (!unit || unit.side !== "player" || unit.hp <= 0 || !hasMana(unit) || unit.npc) return false
  const prof = profileOf(unit)
  if (prof.special === "inverted" || prof.special === "tokens") return false
  const role = manaRole(unit)
  return unit.id === "player-commander" || role === "support" || role === "healer" || role === "control"
}

export function linkCost(unit) {
  return scaleAmount(unit, LINK_GIVE)
}

export function manaLinkTargets(state, unitId) {
  const u = getUnit(state, unitId)
  if (!canLinkFrom(u) || u.linkUsed || state.phase !== "player" || u.mana < linkCost(u)) return []
  return state.units.filter((a) => a.side === "player" && a.hp > 0 && a.id !== unitId && hasMana(a) && !a.npc && cheb(a.pos, u.pos) <= LINK_RANGE && profileOf(a).special !== "inverted" && (a.mana < a.manaMax || profileOf(a).overflow))
}

export function manaLink(state, fromId, toId) {
  if (!manaLinkTargets(state, fromId).some((a) => a.id === toId)) return state
  const u = getUnit(state, fromId)
  const cost = linkCost(u)
  const give = LINK_GIVE + (state.manaRelic?.linkBonus || 0)
  let next = setUnit(state, fromId, { mana: u.mana - cost, linkUsed: true })
  next = emit(next, { kind: "mana", unitId: fromId, amount: -cost, label: "link", res: resourceLabel(u) })
  const before = getUnit(next, toId)
  next = gainExternal(next, toId, give, "link")
  const after = getUnit(next, toId)
  next = emit(next, { kind: "combo", unitId: toId, label: after.mana >= after.manaMax && before.mana < before.manaMax ? "Mana Link - FULL!" : "Mana Link", combo: "mana-link", tiles: [u.pos, after.pos] })
  return addLog(next, `${u.name} links its power to ${after.name} (+${scaleAmount(after, give)} ${resourceLabel(after)}).`)
}
