// Hearthwood Frontier - SIGNATURE MECHANICS (Hero Identity sprint).
// Purpose: every class plays differently - each of the 38 classes has one
// rule of its own (data/heartwood/signatures.js): Momentum, Held Breath,
// Shadowmeld, Doom, Raise the Fallen... built on the class resource where
// it fits, plus the class's signature LEGENDARY item that transforms it.
// Also the single engine entry point for hero personality (tacticsBonds.js).
//
// Unit fields: sig (stacks), sigOn (toggle), sigFx (how many times the
// mechanic fired - QA), sigLegend (classId when its legendary is worn),
// plus per-mechanic marks: sigTarget, sigLast, sigLost, sigPrimed,
// sigAmbush, sigUses, sigRaised, sigLink/sigLinkDmg (summons), and on
// enemies sigQuarryBy, sigStatic, sigDoom/sigDoomBy, sigRigged, sigTetherBy,
// sigSpotted, sigPack, anthem/anthemDmg (heroes).
//
// Opt-in per fight (`state.heroSig`, enableHeroIdentity) - real run fights
// and the prototype; hand-built test states play exactly as before.
// Pure, deterministic, state in -> state out. Engine helpers are imported
// back from tacticsEngine.js (circular, call-time only).
// Public API: enableHeroIdentity, sigOn, signatureOf, sigNumbers,
// sigDamage, sigHitParts, sigAfterHit, sigAfterHitBy, sigOnDamaged,
// sigPreDamage, sigOnUnitFell, sigAfterMove, sigPlayerTurnEnd,
// sigPlayerTurnStart, sigAfterCast, sigTokenText, enemySigMarks.
import { SIGNATURES } from "../../data/heartwood/signatures"
import { enableHeroIdentity } from "./heroIdentity"
import { emit, getUnit, setUnit, livingUnits, applyDamageWithBlock, checkTacticsBattleEnd, deriveTacticsUnit } from "./tacticsEngine"
import { hasMana, gainExternal, gainResource, gainToken } from "./tacticsMana"
import { applySetup, staggerUnit } from "./tacticsDepth"
import { applyElement } from "./tacticsElements"
import * as bonds from "./tacticsBonds"

const cheb = (a, b) => Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col))
const ended = (s) => s.phase === "won" || s.phase === "lost"
const isHero = (u) => !!u && u.side === "player" && !u.structure && !u.npc && !u.ownerId
const addLog = (state, line) => ({ ...state, log: [...(state.log || []), line] })
const call = (state, unitId, label) => emit(state, { kind: "reaction", unitId, label, sig: true })
const STATUS_KEYS = ["poison", "burn", "chill", "frozen", "root", "slow", "weak", "vulnerable", "exposed", "cursed", "mark", "sMark", "stagger", "cbOffBalance", "cbMarked", "cbSoaked", "stun", "silenced", "disarmed", "entangle", "corruption", "sigDoom", "sigStatic"]
const CLEANSE_KEYS = ["poison", "burn", "chill", "frozen", "root", "slow", "weak", "vulnerable", "entangle", "suppressed", "disarmed", "cursed"]

export function sigOn(state) {
  return !!state?.heroSig
}

// A cast in progress: every hit inside it counts as a SKILL hit (class
// skills hit through abilityHit with a bare { name }).
export function beginCast(state, actorId) {
  return sigOn(state) ? { ...state, sigCasting: actorId } : state
}
export function endCast(state) {
  if (!state || state.sigCasting == null) return state
  const { sigCasting: _c, ...rest } = state
  return rest
}
const casting = (state, ctx, actorId) => !!ctx?.skill || (state?.sigCasting != null && state.sigCasting === actorId)

export function signatureOf(u) {
  return u && !u.structure && !u.npc && u.side === "player" && u.classId ? SIGNATURES[u.classId] || null : null
}

// The mechanic's numbers, with the class's legendary worn = transformed.
export function sigNumbers(u) {
  const s = signatureOf(u)
  if (!s) return {}
  const legend = u.sigLegend === s.id ? s.legendary?.n || {} : {}
  return { max: s.max, ...s.n, ...legend }
}
const N = sigNumbers
const has = (u, classId) => !!u && u.classId === classId && isHero(u) && u.hp > 0
const fired = (state, id, patch = {}) => {
  const u = getUnit(state, id)
  return setUnit(state, id, { ...patch, sigFx: (u?.sigFx || 0) + 1 })
}

// --- Enable ---------------------------------------------------------------------
// Pure setup lives in heroIdentity.js (no engine import - runEngine uses it).
export { enableHeroIdentity }

// --- Pure read-outs -------------------------------------------------------------

const scented = (attacker, defender) => defender.side === "enemy" && (defender.hp <= defender.maxHp * (N(attacker).below || 0.5) || defender.stagger > 0)

// modifiedAttackAmount hook (pure): signature damage both ways + personality.
export function sigDamage(attacker, defender, amount, state, ctx = null) {
  if (!sigOn(state) || !(amount > 0) || !attacker || !defender) return amount
  let a = amount
  const skill = casting(state, ctx, attacker.id)
  const melee = cheb(attacker.pos, defender.pos) <= 1
  if (attacker.side === "player" && defender.side === "enemy") {
    const n = N(attacker)
    const st = attacker.sig || 0
    switch (attacker.classId) {
      case "juggernaut":
      case "bruiser":
        if (melee && st > 0) a += st * (n.perStack || 1)
        break
      case "sentinel":
        if (st >= n.max) a = Math.round(a * (n.perfectMult || 1.5))
        break
      case "striker":
        if (skill && st > 0) a += st * (n.perStack || 2)
        break
      case "assassin":
        if (attacker.sigAmbush && attacker.stealth > 0) a = Math.round(a * (n.mult || 1.5))
        break
      case "duelist":
        if (attacker.sigTarget === defender.id && st > 0) a += st * (n.perStack || 1)
        break
      case "ranger":
        if (defender.sigQuarryBy === attacker.id) a += n.dmg || 1
        break
      case "executioner":
        if (st > 0 && scented(attacker, defender)) a += st * (n.perStack || 1)
        break
      case "spellblade": {
        const kind = skill ? "skill" : "attack"
        if (attacker.sigLast && attacker.sigLast !== kind) a += Math.min(n.max, st + 1) * (n.perStack || 1)
        break
      }
      case "engineer":
        if (skill && st >= n.max) a = Math.round(a * (n.mult || 1.5))
        break
      case "shapeshifter":
        if (attacker.sigPrimed) a += n.dmg || 3
        break
      default:
        break
    }
    if (attacker.anthem > 0) a += attacker.anthemDmg || 1
    if (attacker.sigLinkDmg > 0) a += attacker.sigLinkDmg
  }
  if (defender.side === "player" && attacker.side === "enemy" && state?.units) {
    // Guardian's Bulwark zone (the Guardian itself included).
    for (const g of state.units) {
      if (!has(g, "guardian") || !g.sigOn) continue
      if (cheb(g.pos, defender.pos) <= (N(g).radius || 1)) {
        a = Math.max(0, a - (N(g).guard || 1))
        break
      }
    }
    if (defender.classId === "frostbinder" && defender.sig > 0) a = Math.max(0, a - defender.sig * (N(defender).guard || 1))
    if (defender.classId === "spiritwalker" && defender.sigOn) a = Math.max(0, a - (N(defender).guard || 2))
  }
  return bonds.identityAmount(attacker, defender, a, state)
}

// tacticsCover.hitChance parts.
export function sigHitParts(state, attacker, defender, atkPos = attacker?.pos) {
  if (!sigOn(state) || !attacker || !defender || attacker.side !== "player" || defender.side !== "enemy") return []
  const parts = []
  const n = N(attacker)
  if (attacker.classId === "sentinel" && attacker.sig > 0) parts.push({ label: `◎ Held Breath x${attacker.sig}`, value: attacker.sig * (n.aim || 10) })
  if (attacker.classId === "duelist" && n.aim && attacker.sigTarget === defender.id && attacker.sig > 0) parts.push({ label: `⚜ Tempo x${attacker.sig}`, value: attacker.sig * n.aim })
  if (attacker.classId === "ranger" && defender.sigQuarryBy === attacker.id) parts.push({ label: "➹ Quarry", value: n.aim || 10 })
  if (defender.sigSpotted > 0) parts.push({ label: "👁 Spotted", value: defender.sigSpotted })
  let orders = 0
  for (const c of state.units || []) if (has(c, "commander") && c.sig > 0 && cheb(c.pos, atkPos) <= (N(c).radius || 3)) orders = Math.max(orders, c.sig * (N(c).aim || 5))
  if (orders) parts.push({ label: "♛ Battle Orders", value: orders })
  return [...parts, ...bonds.identityHitParts(state, attacker, defender, atkPos)]
}

// --- After a hero's hit lands ----------------------------------------------------

// info: { fell, graze, skill, melee, facing, targetBefore }
export function sigAfterHit(state, actorId, targetId, info = {}) {
  if (!sigOn(state)) return state
  const actor = getUnit(state, actorId)
  if (!actor || actor.side !== "player") return state
  let next = bonds.trackHit(state, actorId, targetId, !!info.fell)
  const t = getUnit(next, targetId)
  if (!t || t.side !== "enemy") return next
  const alive = t.hp > 0
  const n = N(actor)
  const st = actor.sig || 0
  if (state.sigCasting === actorId) info = { ...info, skill: true }
  const kind = info.skill ? "skill" : "attack"
  // Summons (Pack Tactics: the companion half).
  if (actor.ownerId) {
    const owner = getUnit(next, actor.ownerId)
    if (has(owner, "beastmaster") && alive) next = packHit(next, owner, targetId, "pet")
    return next
  }
  switch (actor.classId) {
    case "juggernaut":
      if (info.melee && st > 0) {
        next = fired(next, actorId, { sig: 0 })
        next = gainExternal(next, actorId, st * (n.rage || 3), "momentum")
        if (alive && st >= (n.staggerAt || 3)) next = staggerUnit(applySetup(next, targetId, "offBalance", actorId), targetId, 1)
        next = call(next, actorId, `➠ Momentum x${st}!`)
      }
      break
    case "sentinel":
      if (st >= n.max) next = call(fired(next, actorId, { sig: 0 }), actorId, "◎ Perfect Shot!")
      break
    case "bruiser":
      if (info.melee && st > 0) {
        const heal = Math.min(actor.maxHp - actor.hp, st * (n.heal || 1))
        next = fired(next, actorId, { sig: 0, hp: actor.hp + Math.max(0, heal) })
        if (heal > 0) next = emit(next, { kind: "heal", actorId, targetId: actorId, amount: heal })
        next = call(gainExternal(next, actorId, st * (n.rage || 5), "grit"), actorId, `✊ Grit x${st}!`)
      }
      break
    case "striker":
      if (info.skill && st > 0) {
        next = fired(next, actorId, { sig: 0 })
        if (alive && st >= (n.staggerAt || 2)) next = staggerUnit(next, targetId, 1)
        next = call(next, actorId, `✧ ${st} Opening${st > 1 ? "s" : ""}!`)
      } else if (!info.skill && alive && !info.graze && hadStatus(info.targetBefore, actorId) && st < n.max) {
        next = call(fired(next, actorId, { sig: st + 1 }), actorId, "✧ Opening")
      }
      break
    case "assassin":
      if (info.fell) {
        next = call(fired(next, actorId, { stealth: Math.max(actor.stealth || 0, n.turns || 1), sigAmbush: true, sigOn: true }), actorId, "☾ Shadowmeld")
      } else if (actor.sigAmbush && actor.stealth > 0) {
        next = fired(next, actorId, { sigAmbush: false, sigOn: false })
        next = call(next, actorId, "☾ Ambush!")
      }
      break
    case "duelist": {
      const same = actor.sigTarget === targetId
      const sig = same ? Math.min(n.max, st + 1) : 1
      next = fired(next, actorId, { sigTarget: alive ? targetId : null, sig: alive ? sig : 0 })
      next = gainResource(next, actorId, n.combo || 1, null)
      if (same && sig >= 2) next = call(next, actorId, `⚜ Tempo x${sig}`)
      break
    }
    case "ranger":
      next = rangerHit(next, actor, targetId, info.fell)
      break
    case "artillery":
      if (actor.sigOn && !info.graze) next = splash(next, actor, t.pos, targetId, n.splash || 1)
      break
    case "executioner":
      if (info.fell) next = call(gainExternal(fired(next, actorId, { sig: Math.min(n.max, st + 1) }), actorId, n.fury || 10, "scent"), actorId, "✝ Bloodscent")
      break
    case "spellblade":
      if (actor.sigLast && actor.sigLast !== kind) next = call(fired(next, actorId, { sig: Math.min(n.max, st + 1), sigLast: kind }), actorId, `✦ Weave x${Math.min(n.max, st + 1)}`)
      else next = setUnit(next, actorId, { sigLast: kind })
      break
    case "shapeshifter":
      if (actor.sigPrimed) next = call(fired(next, actorId, { sigPrimed: false, sigOn: false, block: (actor.block || 0) + (n.block || 2) }), actorId, "🐾 Instinct!")
      break
    case "disruptor":
      if (alive) next = staticHit(next, actor, targetId)
      break
    case "hexer":
      if (alive) {
        const doom = Math.min(n.at || 3, (t.sigDoom || 0) + 1)
        next = setUnit(fired(next, actorId), targetId, { sigDoom: doom, sigDoomBy: actorId })
        if (doom >= (n.at || 3) && (t.sigDoom || 0) < doom) next = call(next, targetId, "⛧ Doomed!")
      }
      break
    case "saboteur":
      if (alive && !(t.sigRigged > 0)) next = call(setUnit(fired(next, actorId), targetId, { sigRigged: n.dmg || 3 }), targetId, "💣 Rigged")
      break
    case "merchant":
      if (alive && st >= (n.cost || 3) && t.hp <= t.maxHp * (n.below || 0.5)) {
        next = setUnit(fired(next, actorId, { sig: st - (n.cost || 3) }), targetId, { stun: Math.max(t.stun || 0, 1) })
        next = call(addLog(next, `${actor.name} bribes ${t.name} - it skips its next turn!`), targetId, "🪙 Bribed!")
      } else if (st < n.max) next = setUnit(next, actorId, { sig: st + 1 })
      break
    case "alchemist":
      if (alive) next = catalyst(next, actor, t, info.targetBefore)
      break
    case "frostbinder":
      if (alive && (t.chill > 0 || t.frozen > 0) && st < n.max) next = call(fired(next, actorId, { sig: st + 1 }), actorId, "❄ Rime")
      break
    case "controller":
      if (alive) {
        next = { ...next, units: next.units.map((u) => (u.sigTetherBy === actorId && u.id !== targetId ? { ...u, sigTetherBy: null } : u)) }
        if (t.sigTetherBy !== actorId) next = call(setUnit(fired(next, actorId, { sigOn: true }), targetId, { sigTetherBy: actorId }), targetId, "⛓ Tethered")
      }
      break
    case "beastmaster":
      if (alive) next = packHit(next, actor, targetId, "master")
      break
    default:
      break
  }
  // Squad-wide: Gambit (any flank), Battle Orders (any kill).
  if (info.facing === "side" || info.facing === "back") {
    for (const tac of livingUnits(next, "player")) if (has(tac, "tactician") && (tac.sig || 0) < N(tac).max) next = call(fired(next, tac.id, { sig: (tac.sig || 0) + 1 }), tac.id, "♞ Gambit")
  }
  if (info.fell) {
    for (const c of livingUnits(next, "player")) if (has(c, "commander") && (c.sig || 0) < N(c).max) next = call(fired(next, c.id, { sig: (c.sig || 0) + 1 }), c.id, "♛ Order!")
  }
  return checkTacticsBattleEnd(next)
}

function hadStatus(t, actorId) {
  if (!t) return false
  const own = t.cbBy || {}
  return STATUS_KEYS.some((k) => {
    if (!(t[k] > 0)) return false
    if (k === "cbMarked") return own.marked !== actorId
    if (k === "cbOffBalance") return own.offBalance !== actorId
    if (k === "cbSoaked") return own.soaked !== actorId
    return true
  })
}

function rangerHit(state, actor, targetId, fell) {
  const n = N(actor)
  let next = state
  const t = getUnit(next, targetId)
  const quarry = livingUnits(next, "enemy").find((e) => e.sigQuarryBy === actor.id)
  if (fell && t.sigQuarryBy === actor.id) {
    next = call(gainExternal(fired(next, actor.id), actor.id, n.focus || 20, "quarry"), actor.id, "➹ Quarry down!")
    return markQuarry(next, actor, t.pos)
  }
  if (!quarry && !fell) next = call(setUnit(fired(next, actor.id, { sigOn: true }), targetId, { sigQuarryBy: actor.id }), targetId, "➹ Quarry")
  return next
}
function markQuarry(state, actor, from) {
  const foes = livingUnits(state, "enemy").filter((e) => !e.structure && e.sigQuarryBy !== actor.id)
  if (!foes.length) return setUnit(state, actor.id, { sigOn: false })
  const nearest = foes.sort((a, b) => cheb(a.pos, from) - cheb(b.pos, from))[0]
  return call(setUnit(state, nearest.id, { sigQuarryBy: actor.id }), nearest.id, "➹ New Quarry")
}

function flat(state, targetId, amount) {
  const t = getUnit(state, targetId)
  if (!t || t.hp <= 0 || !(amount > 0) || ended(state)) return state
  const hit = applyDamageWithBlock(state, targetId, amount)
  return checkTacticsBattleEnd(addLog(hit.next, `${t.name} takes ${hit.remaining}.${hit.fell ? " It falls." : ""}`))
}

function splash(state, actor, center, skipId, amount) {
  let next = fired(state, actor.id)
  const foes = livingUnits(next, "enemy").filter((e) => e.id !== skipId && !e.structure && cheb(e.pos, center) <= 1).map((e) => e.id)
  if (!foes.length) return next
  next = call(next, actor.id, "⛬ Splash!")
  for (const id of foes) next = flat(next, id, amount)
  return next
}

function staticHit(state, actor, targetId) {
  const n = N(actor)
  const t = getUnit(state, targetId)
  const s = (t.sigStatic || 0) + 1
  let next = fired(state, actor.id)
  if (s < (n.at || 3)) return setUnit(next, targetId, { sigStatic: s })
  const cds = { ...(t.skillCd || {}) }
  for (const k of Object.keys(cds)) cds[k] = cds[k] + (n.cd || 2)
  for (const sk of t.enemySkills || []) cds[sk.id || sk] = (cds[sk.id || sk] || 0) + (n.cd || 2)
  next = setUnit(next, targetId, { sigStatic: 0, skillCd: cds, drained: Math.max(t.drained || 0, 1) })
  return call(addLog(next, `${t.name} short-circuits - its skills stall and it loses 1 AP next turn!`), targetId, "⚡ Short-circuit!")
}

function catalyst(state, actor, t0, seen) {
  const n = N(actor)
  const t = seen || t0
  const kind = t.burn > 0 ? "fire" : t.chill > 0 || t.frozen > 0 ? "frost" : t.poison > 0 ? "poison" : null
  if (!kind) return state
  const before = getUnit(state, actor.id)?.mana
  const next = gainToken(state, actor.id, kind, n.tokens || 1, "catalyst")
  return getUnit(next, actor.id)?.mana !== before ? call(fired(next, actor.id), actor.id, "⚗ Catalyst") : next
}

function packHit(state, master, targetId, who) {
  const t = getUnit(state, targetId)
  const pack = { ...(t.sigPack || {}), [who]: state.turn }
  if (pack.master !== state.turn || pack.pet !== state.turn) return setUnit(state, targetId, { sigPack: pack })
  const n = N(master)
  let next = setUnit(fired(state, master.id), targetId, { sigPack: {}, exposed: Math.max(t.exposed || 0, n.turns || 2), ...(n.slow ? { slow: Math.max(t.slow || 0, 2) } : {}) })
  next = addLog(next, `${master.name} and its companion maul ${t.name} - it is Exposed!`)
  return call(next, targetId, "🐺 Mauled!")
}

// --- An enemy's hit on a hero (attackUnit) -----------------------------------------

export function sigAfterHitBy(state, enemyId, heroId, info = {}) {
  if (!sigOn(state)) return state
  let next = bonds.trackHitBy(state, enemyId, heroId)
  const h = getUnit(next, heroId)
  const e = getUnit(next, enemyId)
  if (!h || !e || h.side !== "player") return next
  // Guardian's Bulwark: a soaked hit in the zone builds Holy Power.
  for (const g of livingUnits(next, "player")) {
    if (!has(g, "guardian") || !g.sigOn || cheb(g.pos, h.pos) > (N(g).radius || 1)) continue
    next = gainResource(fired(next, g.id), g.id, N(g).holy || 1, "bulwark")
    break
  }
  const n = N(h)
  if (h.classId === "warden" && h.hp > 0) {
    const thorns = Math.min(n.max, (h.sig || 0) + (n.perHit || 1))
    next = fired(next, heroId, { sig: thorns })
    if (info.melee && e.hp > 0 && thorns > 0) next = flat(call(next, heroId, `✲ Thorns ${thorns}!`), enemyId, thorns)
  }
  if (h.classId === "frostbinder" && h.sig > 0 && info.melee && e.hp > 0 && !ended(next)) {
    next = applyElement(fired(next, heroId, { sig: h.sig - 1 }), enemyId, "frost", 1)
  }
  if (h.classId === "duelist" && h.sig > 0 && h.sigTarget !== enemyId) next = setUnit(next, heroId, { sig: h.sig - 1 })
  return next
}

// --- Damage taken (applyDamageWithBlock) -----------------------------------------------

// Before a hit lands on a hero: a Relic-Keeper's charge soaks part of it.
export function sigPreDamage(state, targetId, amount) {
  if (!sigOn(state) || !(amount > 0)) return { state, amount }
  const t = getUnit(state, targetId)
  if (!isHero(t)) return { state, amount }
  for (const k of livingUnits(state, "player")) {
    const n = N(k)
    if (!has(k, "relic-keeper") || !(k.sig > 0) || amount < (n.minHit || 4) || cheb(k.pos, t.pos) > (n.radius || 2)) continue
    const soak = Math.min(amount - 1, n.soak || 2)
    let next = fired(state, k.id, { sig: k.sig - 1 })
    next = gainExternal(call(next, targetId, `⚱ Relic soaks ${soak}`), k.id, n.mana || 10, "relic")
    return { state: next, amount: amount - soak }
  }
  return { state, amount }
}

// After a unit lost HP.
export function sigOnDamaged(state, targetId, lost) {
  if (!sigOn(state) || !(lost > 0)) return state
  const t = getUnit(state, targetId)
  if (!t) return state
  let next = state
  if (isHero(t)) {
    next = bonds.trackDamaged(next, targetId)
    if (t.classId === "bruiser" && t.hp > 0) {
      const n = N(t)
      const per = n.hpPer || 3
      const total = (t.sigLost || 0) + lost
      const gain = Math.floor(total / per)
      const sig = Math.min(n.max, (t.sig || 0) + gain)
      next = setUnit(next, targetId, { sigLost: total % per, sig })
      if (sig > (t.sig || 0)) next = call(fired(next, targetId), targetId, `✊ Grit ${sig}`)
    }
  }
  if (t.hp <= 0) next = sigOnUnitFell(next, targetId)
  return next
}

// Someone fell: Rigged bombs, Spreading Rot, Raise the Fallen, Soul Link.
export function sigOnUnitFell(state, deadId) {
  const d = getUnit(state, deadId)
  if (!sigOn(state) || !d || d.hp > 0 || d.sigDeadDone) return state
  let next = setUnit(state, deadId, { sigDeadDone: true })
  if (d.side === "enemy") {
    if (d.sigRigged > 0) {
      const bomber = livingUnits(next, "player").find((u) => u.classId === "saboteur") || null
      next = call(addLog(next, `${d.name} was rigged - it explodes!`), deadId, "💥 Boom!")
      if (bomber) next = fired(next, bomber.id)
      for (const e of livingUnits(next, "enemy").filter((x) => !x.structure && cheb(x.pos, d.pos) <= 1).map((x) => x.id)) next = flat(next, e, d.sigRigged)
    }
    if ((d.corruption || 0) > 0) {
      const rotter = livingUnits(next, "player").find((u) => u.classId === "corruptor" && !u.ownerId)
      if (rotter) {
        const n = N(rotter)
        const near = livingUnits(next, "enemy").filter((x) => !x.structure && cheb(x.pos, d.pos) <= (n.radius || 1))
        for (const x of near) next = setUnit(next, x.id, { corruption: (x.corruption || 0) + (n.amount || 2) })
        if (near.length) next = call(fired(next, rotter.id), deadId, "☣ Rot spreads!")
        const r = getUnit(next, rotter.id)
        if (hasMana(r) && r.mana > 0) next = setUnit(next, rotter.id, { mana: Math.max(0, r.mana - (n.cool || 10)) })
      }
    }
    for (const r of livingUnits(next, "player")) {
      if (!has(r, "ritualist") || ended(next)) continue
      const n = N(r)
      if ((r.sigRaised || 0) >= n.max || cheb(r.pos, d.pos) > (n.radius || 3) || !hasMana(r) || r.mana < (n.cost || 10)) continue
      if (next.units.some((u) => u.hp > 0 && u.pos.row === d.pos.row && u.pos.col === d.pos.col)) continue
      next = raiseThrall(next, r, d)
      break
    }
  } else if (d.ownerId && d.sigLink > 0) {
    const owner = getUnit(next, d.ownerId)
    if (has(owner, "summoner")) {
      const n = N(owner)
      next = setUnit(fired(next, owner.id), owner.id, { block: (owner.block || 0) + d.sigLink * (n.block || 2) })
      next = call(gainExternal(next, owner.id, n.spirit || 20, "soul link"), owner.id, "✺ Soul Link")
    }
  }
  return next
}

function raiseThrall(state, r, corpse) {
  const n = N(r)
  const uid = `${r.id}-thrall-${state.turn || 0}-${state.units.length}`
  const base = deriveTacticsUnit("spirit-wolf", "player", { ...corpse.pos }, uid)
  const thrall = { ...base, name: "Risen Thrall", thrall: true, raisedFrom: corpse.name, hp: n.hp || 8, maxHp: n.hp || 8, attack: n.attack || 3, baseAttack: n.attack || 3, ap: 0, ownerId: r.id, facing: r.facing }
  let next = { ...state, units: [...state.units, thrall] }
  next = setUnit(fired(next, r.id), r.id, { mana: r.mana - (n.cost || 10), sigRaised: (r.sigRaised || 0) + 1, sig: (r.sigRaised || 0) + 1 })
  next = emit(next, { kind: "mana", unitId: r.id, amount: -(n.cost || 10), label: "raise", res: "Souls" })
  return call(addLog(next, `${r.name} raises ${corpse.name} as a Risen Thrall!`), uid, "☠ Risen!")
}

// --- Movement --------------------------------------------------------------------------

export function sigAfterMove(state, unitId, from) {
  if (!sigOn(state)) return state
  const u = getUnit(state, unitId)
  if (!u || u.hp <= 0 || !from) return state
  let next = state
  const tiles = cheb(from, u.pos)
  if (u.side === "player" && isHero(u) && tiles > 0) {
    const n = N(u)
    if (u.classId === "juggernaut" && (u.sig || 0) < n.max) next = call(fired(next, unitId, { sig: Math.min(n.max, (u.sig || 0) + tiles) }), unitId, `➠ Momentum ${Math.min(n.max, (u.sig || 0) + tiles)}`)
    if (u.classId === "sentinel" && u.sig > 0 && u.stance !== "focus") next = setUnit(next, unitId, { sig: 0 })
    if (u.classId === "artillery" && u.sigOn) next = setUnit(next, unitId, { sigOn: false })
    if (u.classId === "scout") next = spotEnemies(next)
  }
  if (u.side === "enemy" && !u.structure) {
    for (const tr of livingUnits(next, "player")) {
      if (ended(next)) break
      if (!has(tr, "trapper") || !(tr.sigUses > 0) || cheb(tr.pos, u.pos) > 1) continue
      const n = N(tr)
      next = setUnit(fired(next, tr.id, { sigUses: tr.sigUses - 1 }), unitId, { root: Math.max(getUnit(next, unitId).root || 0, 2) })
      next = gainExternal(call(addLog(next, `${u.name} walks into ${tr.name}'s snare line!`), unitId, "🕸 Snared!"), tr.id, n.focus || 10, "snare")
      if (n.dmg) next = flat(next, unitId, n.dmg)
      break
    }
    const e = getUnit(next, unitId)
    const holder = e?.sigTetherBy ? getUnit(next, e.sigTetherBy) : null
    if (e && e.hp > 0 && has(holder, "controller") && cheb(holder.pos, e.pos) > (N(holder).leash || 2) && !ended(next)) {
      next = setUnit(fired(next, holder.id), unitId, { slow: Math.max(e.slow || 0, 2) })
      next = flat(call(addLog(next, `${holder.name}'s tether snaps ${e.name} back!`), unitId, "⛓ Tether snaps!"), unitId, N(holder).dmg || 3)
    }
  }
  return next
}

// --- Turn hooks (inside the engine's shared phase starts: the preview is exact) --------

// End of the player's turn (inside enemyPhaseStart).
export function sigPlayerTurnEnd(state) {
  if (!sigOn(state)) return state
  let next = state
  for (const u0 of livingUnits(state, "player")) {
    if (ended(next)) break
    const u = getUnit(next, u0.id)
    if (!isHero(u) || u.hp <= 0) continue
    const n = N(u)
    switch (u.classId) {
      case "guardian": {
        const on = !u.moved || u.stance === "defensive"
        if (on !== !!u.sigOn) next = on ? call(fired(next, u.id, { sigOn: true }), u.id, "🛡 Bulwark") : setUnit(next, u.id, { sigOn: false })
        break
      }
      case "sentinel":
        if ((!u.moved || u.stance === "focus") && (u.sig || 0) < n.max) next = call(gainExternal(fired(next, u.id, { sig: (u.sig || 0) + 1 }), u.id, n.focus || 5, "breath"), u.id, `◎ Breath ${(u.sig || 0) + 1}`)
        break
      case "artillery":
        if (!u.moved && !u.sigOn) next = call(fired(next, u.id, { sigOn: true }), u.id, "⛬ Braced")
        else if (u.moved) next = setUnit(next, u.id, { sigOn: false })
        break
      case "spiritwalker": {
        const near = livingUnits(next, "enemy").some((e) => !e.structure && cheb(e.pos, u.pos) <= 1)
        if (near) next = call(gainExternal(fired(next, u.id, { sigOn: false }), u.id, n.spirit || 10, "anchor"), u.id, "☁ Anchored")
        else next = call(fired(next, u.id, { sigOn: true }), u.id, "☁ Ethereal")
        break
      }
      case "gatherer":
        if (u.moved) {
          const sig = (u.sig || 0) + 1
          next = setUnit(next, u.id, { sig: Math.min(n.max, sig) })
          if (sig >= n.max) next = berry(setUnit(next, u.id, { sig: 0 }), u, n)
          else next = call(fired(next, u.id), u.id, `🌾 Forage ${sig}`)
        }
        break
      case "trapper":
        next = setUnit(next, u.id, { sigUses: n.uses || 1 })
        break
      default:
        break
    }
  }
  return next
}

function berry(state, u, n) {
  const hurt = livingUnits(state, "player").filter((a) => !a.structure && !a.npc && cheb(a.pos, u.pos) <= (n.radius || 2) && a.hp < a.maxHp)
  let next = fired(state, u.id)
  if (!hurt.length) return call(next, u.id, "🌾 Berries (no one hurt)")
  const t = hurt.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0]
  const amount = Math.min(t.maxHp - t.hp, n.heal || 4)
  next = emit(setUnit(next, t.id, { hp: t.hp + amount }), { kind: "heal", actorId: u.id, targetId: t.id, amount })
  return call(addLog(next, `${u.name} shares a Wild Berry with ${t.name} (+${amount}).`), t.id, "🌾 Wild Berry!")
}

// Start of the player's turn (end of runEnemyTurn).
export function sigPlayerTurnStart(state) {
  if (!sigOn(state)) return state
  let next = state
  // Anthem fades; zones / ethereal / instinct-windows reset.
  next = {
    ...next,
    units: next.units.map((u) => {
      if (u.side !== "player" || u.hp <= 0) return u
      const p = {}
      if (u.anthem > 0) p.anthem = u.anthem - 1
      if (u.classId === "guardian" && u.sigOn && !u.ownerId) p.sigOn = false
      if (u.classId === "spiritwalker" && u.sigOn && !u.ownerId) p.sigOn = false
      return Object.keys(p).length ? { ...u, ...p } : u
    }),
  }
  for (const u0 of livingUnits(state, "player")) {
    if (ended(next)) break
    const u = getUnit(next, u0.id)
    if (!u || u.hp <= 0) continue
    if (u.ownerId) continue
    const n = N(u)
    switch (u.classId) {
      case "medic": {
        const count = Math.min(n.max, livingUnits(next, "player").filter((a) => isHero(a) && cheb(a.pos, u.pos) <= (n.radius || 3) && a.hp <= a.maxHp / 2).length)
        next = setUnit(next, u.id, { sig: count })
        if (count > 0) next = call(gainExternal(fired(next, u.id), u.id, count * (n.blood || 5), "triage"), u.id, `✚ Triage ${count}`)
        break
      }
      case "rootweaver": {
        const rooted = livingUnits(next, "enemy").filter((e) => !e.structure && e.root > 0 && cheb(e.pos, u.pos) <= (n.radius || 3)).map((e) => e.id)
        if (!rooted.length) break
        next = call(fired(next, u.id, { sig: rooted.length }), u.id, "🌿 Strangleroots")
        for (const id of rooted) {
          next = flat(next, id, n.dmg || 1)
          next = gainExternal(next, u.id, n.nature || 4, null)
        }
        break
      }
      case "chronomancer":
        if ((u.sig || 0) >= n.max) next = call(fired(next, u.id, { sig: 0, ap: u.ap + (n.ap || 1) }), u.id, `⧗ +${n.ap || 1} AP`)
        break
      case "summoner":
        for (const s of livingUnits(next, "player").filter((x) => x.ownerId === u.id)) {
          const link = Math.min(n.max, (s.sigLink || 0) + 1)
          next = setUnit(next, s.id, { sigLink: link, sigLinkDmg: link * (n.perStack || 1) })
          if (link > (s.sigLink || 0)) next = call(fired(next, u.id, { sig: link }), s.id, `✺ Link ${link}`)
        }
        break
      case "cleanser":
        next = cleanse(next, u, n)
        break
      default:
        break
    }
  }
  // Doom falls on your turn.
  for (const e of livingUnits(next, "enemy")) {
    if (ended(next)) break
    const by = e.sigDoomBy ? getUnit(next, e.sigDoomBy) : null
    if (!by || !(e.sigDoom >= (N(by).at || 3))) continue
    next = setUnit(fired(next, by.id), e.id, { sigDoom: 0 })
    next = flat(call(addLog(next, `Doom falls on ${e.name}!`), e.id, "⛧ DOOM!"), e.id, N(by).dmg || 5)
  }
  if (ended(next)) return next
  return bonds.identityTurnStart(spotEnemies(next))
}

function cleanse(state, u, n) {
  const pool = livingUnits(state, "player").filter((a) => !a.structure && !a.npc && cheb(a.pos, u.pos) <= (n.radius || 2))
  const score = (a) => CLEANSE_KEYS.filter((k) => a[k] > 0).length
  let next = state
  let washed = 0
  for (let i = 0; i < (n.count || 1); i++) {
    const t = pool.map((a) => getUnit(next, a.id)).filter((a) => score(a) > 0).sort((a, b) => score(b) - score(a))[0]
    if (!t) break
    const key = CLEANSE_KEYS.find((k) => t[k] > 0)
    next = call(setUnit(next, t.id, { [key]: 0 }), t.id, `✧ Cleansed ${key}`)
    washed++
  }
  if (!washed) return next
  return gainExternal(fired(next, u.id, { sig: (u.sig || 0) + washed }), u.id, (n.insp || 10) * washed, "purity")
}

// Scout: every enemy within reach of a Scout is Spotted (the value = +aim).
function spotEnemies(state) {
  if (!sigOn(state)) return state
  const scouts = state.units.filter((u) => has(u, "scout"))
  let changed = false
  const units = state.units.map((e) => {
    if (e.side !== "enemy") return e
    let aim = 0
    for (const s of scouts) if (e.hp > 0 && cheb(s.pos, e.pos) <= (N(s).radius || 4)) aim = Math.max(aim, N(s).aim || 10)
    if ((e.sigSpotted || 0) === aim) return e
    changed = true
    return { ...e, sigSpotted: aim }
  })
  if (!changed) return state
  const next = { ...state, units }
  return scouts.length ? scouts.reduce((s, sc) => setUnit(s, sc.id, { sig: units.filter((e) => e.side === "enemy" && e.hp > 0 && e.sigSpotted > 0).length, sigFx: (getUnit(s, sc.id).sigFx || 0) + 1 }), next) : next
}

// --- After a cast (castAbility wrapper; `before` = the state before the cast) ----------

export function sigAfterCast(before, after, actorId, targetId, _skill) {
  if (!sigOn(after) || after === before) return after
  const b = getUnit(before, actorId)
  let next = bonds.trackHeals(before, after, actorId)
  const a = getUnit(next, actorId)
  if (!a || !b || !isHero(b)) return next
  const n = N(b)
  const st = b.sig || 0
  const healed = before.units.filter((x) => x.side === "player" && !x.structure && x.hp > 0 && (getUnit(next, x.id)?.hp || 0) > x.hp).map((x) => x.id)
  const allyTarget = targetId ? getUnit(next, targetId) : null
  const helped = allyTarget && allyTarget.side === "player" && allyTarget.hp > 0 && allyTarget.id !== actorId ? [allyTarget.id] : []
  switch (b.classId) {
    case "engineer":
      if (st >= n.max) {
        next = fired(next, actorId, { sig: 0, ap: a.ap + (n.ap || 1) })
        next = call(next, actorId, "⚙ Overclock!")
        if (n.burn > 0) next = flat(call(next, actorId, "♨ Overheat"), actorId, n.burn)
      } else next = setUnit(next, actorId, { sig: st + 1 })
      break
    case "chronomancer":
      if (st < n.max) next = call(fired(next, actorId, { sig: st + 1 }), actorId, `⧗ Tick ${st + 1}`)
      break
    case "tactician":
      if (st >= n.max) next = call(fired(next, actorId, { sig: 0, ap: a.ap + (n.ap || 1) }), actorId, "♞ Gambit pays!")
      break
    case "shapeshifter":
      if ((a.form || null) !== (b.form || null)) next = call(fired(next, actorId, { sigPrimed: true, sigOn: true }), actorId, "🐾 Instinct primed")
      break
    case "spellblade":
      next = setUnit(next, actorId, { sigLast: "skill" })
      break
    case "healer":
      if (healed.length) {
        for (const id of healed) {
          const x = getUnit(next, id)
          if (x.hp >= x.maxHp) next = setUnit(next, id, { block: (x.block || 0) + (n.block || 2) })
        }
        if (st >= n.max) {
          next = fired(next, actorId, { sig: 0 })
          const around = livingUnits(next, "player").filter((x) => !x.structure && !x.npc && healed.some((h) => cheb(getUnit(next, h).pos, x.pos) <= 1) && x.hp < x.maxHp)
          for (const x of around) {
            const amount = Math.min(x.maxHp - x.hp, n.burst || 2)
            next = emit(setUnit(next, x.id, { hp: x.hp + amount }), { kind: "heal", actorId, targetId: x.id, amount })
          }
          next = call(next, actorId, "❀ Bloom!")
        } else next = call(fired(next, actorId, { sig: st + 1 }), actorId, `❀ Seed ${st + 1}`)
      }
      break
    case "medic":
      if (healed.length && st > 0) {
        for (const id of healed) {
          const x = getUnit(next, id)
          const amount = Math.min(x.maxHp - x.hp, st * (n.perStack || 1))
          if (amount > 0) next = emit(setUnit(next, id, { hp: x.hp + amount }), { kind: "heal", actorId, targetId: id, amount })
        }
        next = call(fired(next, actorId), actorId, `✚ Triage +${st}`)
      }
      break
    case "buffer": {
      const allies = [...new Set([...helped, ...healed.filter((id) => id !== actorId)])]
      if (!allies.length) break
      for (const id of allies) next = setUnit(next, id, { anthem: n.turns || 2, anthemDmg: n.dmg || 1 })
      next = call(next, allies[0], `♫ Anthem +${n.dmg || 1}`)
      const verse = st + 1
      if (verse >= n.max) {
        next = fired(next, actorId, { sig: 0 })
        for (const x of livingUnits(next, "player").filter((x) => !x.structure && cheb(x.pos, a.pos) <= (n.radius || 2))) next = setUnit(next, x.id, { block: (x.block || 0) + (n.block || 2) })
        next = call(next, actorId, "♫ CRESCENDO!")
      } else next = fired(next, actorId, { sig: verse })
      break
    }
    default:
      break
  }
  return checkTacticsBattleEnd(next)
}

// --- UI read-outs ------------------------------------------------------------------

// The hero token chip: { icon, text, value, on, title } or null.
export function sigToken(state, u) {
  const s = signatureOf(u)
  if (!s || !sigOn(state) || u.ownerId) return null
  const n = N(u)
  let value = u.sig || 0
  let on = value > 0
  if (s.gauge === "toggle") on = !!u.sigOn || (s.id === "assassin" && u.sigAmbush && u.stealth > 0)
  if (s.id === "ranger") on = (state.units || []).some((e) => e.hp > 0 && e.sigQuarryBy === u.id)
  if (s.id === "controller") on = (state.units || []).some((e) => e.hp > 0 && e.sigTetherBy === u.id)
  if (s.id === "ritualist") value = u.sigRaised || 0
  if (s.id === "relic-keeper" || s.id === "ritualist") on = value > 0
  const legend = u.sigLegend === s.id ? ` · ★ ${s.legendary.name}: ${s.legendary.text}` : ""
  const full = s.gauge === "pips" && value >= n.max
  return { id: s.id, icon: s.icon, name: s.name, gauge: s.gauge, value, max: n.max, on, full, title: `${s.icon} ${s.name}${s.gauge === "pips" ? ` (${value}/${n.max})` : ""}: ${s.text}${legend}` }
}

// Marks a signature leaves on an enemy (board badges): [{ key, icon, title }].
export function enemySigMarks(state, e) {
  if (!sigOn(state) || !e || e.side !== "enemy" || e.hp <= 0) return []
  const out = []
  if (e.sigQuarryBy) out.push({ key: "quarry", icon: "➹", title: "Quarry - the Ranger deals more and aims better against it" })
  if (e.sigDoom > 0) out.push({ key: "doom", icon: `⛧${e.sigDoom}`, title: `Doom ${e.sigDoom}/3 - at 3 it takes heavy damage at the start of your turn` })
  if (e.sigStatic > 0) out.push({ key: "static", icon: `⚡${e.sigStatic}`, title: `Static ${e.sigStatic} - at 3 it short-circuits (skills stall, -1 AP)` })
  if (e.sigRigged > 0) out.push({ key: "rigged", icon: "💣", title: `Rigged - explodes for ${e.sigRigged} on everything next to it when it dies` })
  if (e.sigTetherBy) out.push({ key: "tether", icon: "⛓", title: "Tethered - moving away from the Controller snaps it back (damage + Slow)" })
  if (e.sigSpotted > 0) out.push({ key: "spotted", icon: "👁", title: `Spotted - every hero gets +${e.sigSpotted}% to hit against it` })
  for (const h of state.units || []) {
    if (h.classId === "executioner" && isHero(h) && h.hp > 0 && scented(h, e)) {
      out.push({ key: "scent", icon: "🩸", title: "Scented - the Executioner smells blood (+damage per Scent)" })
      break
    }
  }
  return out
}

// Hero-side extras that show on the token (Anthem, Ethereal...).
export function heroSigMarks(state, u) {
  if (!sigOn(state) || !u || u.side !== "player" || u.hp <= 0) return []
  const out = []
  if (u.anthem > 0) out.push({ key: "anthem", icon: "♫", title: `Anthem: +${u.anthemDmg || 1} damage (${u.anthem} turn${u.anthem > 1 ? "s" : ""})` })
  if (u.thrall) out.push({ key: "thrall", icon: "☠", title: `Risen Thrall${u.raisedFrom ? ` (once ${u.raisedFrom})` : ""} - raised by necromancy, fights for you` })
  if (u.sigLink > 0) out.push({ key: "link", icon: `✺${u.sigLink}`, title: `Soul Link ${u.sigLink}: +${u.sigLinkDmg} damage` })
  const fear = bonds.fearOf(state, u)
  if (fear) out.push({ key: "fear", icon: "😨", title: `${fear.quirk.name}: ${fear.quirk.text}` })
  return out
}

// What a signature does, one line (cards, help).
export function sigTokenText(classId) {
  const s = SIGNATURES[classId]
  return s ? `${s.icon} ${s.name}: ${s.text}` : ""
}
