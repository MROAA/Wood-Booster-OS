// Hearthwood Frontier - DOTA DEPTH sprint, the fight side:
//  1. ACTIVE ITEMS - buttons on a hero's action bar (gear.js withItemActives
//     puts `itemActives` on the unit): Foxfire Step (blink), Gale Push
//     (force), Sap Burn (mana burn), Cyclone Lift (lift), Heartoak Bark
//     (control immunity), Salve / Moonwell Sip / Glowdust (consumables with
//     uses), Unbind / Unbinding Peal (dispel). Worldseed Scepter is the
//     passive "upgrade your class" item.
//  2. ON-HIT RIDERS from gear fx (true strike, armour shred, Wither, mana
//     burn, cleave, reveal).
//  3. ENEMY KITS that demand an answer (itemBuilds.js COUNTER_KITS):
//     Ironbark (armour), Mist Veil (dodges basic attacks), Mossbloom (heal
//     aura), Seedcaller (summons), Runeshell (magic shell), Shadowmoss
//     (hidden past 1 tile).
//
// Pure + deterministic, state in -> state out. Every enemy-side tick runs
// inside the engine's enemyPhaseStart, so previewEnemyIntents stays an
// exact dry run. Circular import with tacticsEngine.js (like
// tacticsRelics.js) - only used at call time.
import { getUnit, setUnit, emit, livingUnits, applyDamageWithBlock, checkTacticsBattleEnd, checkEnemyPhase, deriveTacticsUnit, freeCellsNear, trySpawnBrood } from "./tacticsEngine"
import { ITEM_ACTIVES, COUNTER_KITS } from "../../data/heartwood/itemBuilds"
import { isOnBoard, samePos } from "./targeting"
import { TERRAIN, terrainAt } from "./tacticsTerrain"
import { knockback } from "./tacticsChaos"
import { manaOn, hasMana, scaleAmount, gainExternal, resourceLabel } from "./tacticsMana"
import { counterKitFor } from "./itemForge"

const dist = (a, b) => Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col))
const log = (state, line) => ({ ...state, log: [...state.log, line] })
const callout = (state, unitId, label) => emit(state, { kind: "reaction", unitId, label })

// Statuses that count as CONTROL (Heartoak Bark / Unbind on an ally).
export const CONTROL_KEYS = ["root", "slow", "stun", "frozen", "chill", "suppressed", "weak", "vulnerable", "entangle", "drained", "suppressFire", "silenced", "hexed"]

export function activeDef(id) {
  return ITEM_ACTIVES[id] || null
}

// The unit's active items, each with its def: [{ ...entry, def }].
export function itemActivesOf(unit) {
  return (unit?.itemActives || []).map((a) => ({ ...a, def: ITEM_ACTIVES[a.id] })).filter((a) => a.def)
}

function entryOf(unit, activeId) {
  return (unit?.itemActives || []).find((a) => a.id === activeId) || null
}

// Mana the active costs THIS hero (0 when the fight has no mana / an
// Alchemist's reagents).
export function activeManaCost(state, unit, def) {
  if (!def?.mana || !manaOn(state) || !hasMana(unit) || unit.reagents) return 0
  return scaleAmount(unit, def.mana)
}

// "1 AP · 10 Mana · 2 uses"
export function activeCostText(state, unit, def, entry = null) {
  const parts = [def.ap ? `${def.ap} AP` : "free"]
  const mana = activeManaCost(state, unit, def)
  if (mana) parts.push(`${mana} ${resourceLabel(unit)}`)
  if (entry && entry.charges != null) parts.push(`${entry.charges} use${entry.charges === 1 ? "" : "s"}`)
  return parts.join(" · ")
}

const isBoss = (state, u) => (u.phases?.length || 0) > 0 || state.boss?.unitId === u.id || !!u.weakPoint
const blinkable = (state, pos) => {
  if (!isOnBoard(pos, state.grid)) return false
  const t = TERRAIN[terrainAt(state, pos)] || TERRAIN.path
  return t.cost !== Infinity && !t.burn && !t.grantPoison
}

// Valid targets: units ([unit]) or, for "tile" actives, tiles ([{row,col}]).
export function itemActiveTargets(state, unitId, activeId) {
  const actor = getUnit(state, unitId)
  const def = ITEM_ACTIVES[activeId]
  if (!actor || actor.hp <= 0 || !def) return []
  const foes = livingUnits(state, actor.side === "player" ? "enemy" : "player").filter((u) => !u.structure && !(u.lifted > 0) && !shroudedFrom(u, actor) && dist(u.pos, actor.pos) <= def.range)
  const allies = livingUnits(state, actor.side).filter((u) => !u.structure && dist(u.pos, actor.pos) <= def.range)
  if (def.target === "self") return [actor]
  if (def.target === "ally") return allies
  if (def.target === "enemy") return def.id === "cyclone-lift" ? foes.filter((u) => !isBoss(state, u)) : foes
  if (def.target === "any") return [...foes, ...allies.filter((u) => u.id !== actor.id && (def.id !== "gale-push" || !u.npc))]
  if (def.target === "tile") {
    if (actor.root > 0) return []
    const out = []
    for (let r = actor.pos.row - def.range; r <= actor.pos.row + def.range; r++)
      for (let c = actor.pos.col - def.range; c <= actor.pos.col + def.range; c++) {
        const pos = { row: r, col: c }
        if (samePos(pos, actor.pos) || !blinkable(state, pos)) continue
        if (state.units.some((u) => u.hp > 0 && samePos(u.pos, pos))) continue
        out.push(pos)
      }
    return out
  }
  return []
}

// Why the button is greyed (plain English), or null when it can be used.
export function itemActiveBlocker(state, unit, activeId) {
  const entry = entryOf(unit, activeId)
  const def = ITEM_ACTIVES[activeId]
  if (!entry || !def || !unit) return "No such item."
  if (state.phase !== "player" || unit.side !== "player" || unit.hp <= 0) return "Not now."
  if (entry.charges === 0) return "Used up."
  if (entry.cd > 0) return `Recharging (${entry.cd}).`
  if ((unit.ap || 0) < def.ap) return `Needs ${def.ap} AP.`
  const mana = activeManaCost(state, unit, def)
  if (mana > (unit.mana || 0)) return `Needs ${mana} ${resourceLabel(unit)} (has ${unit.mana || 0}).`
  if (def.target === "tile" && unit.root > 0) return "Rooted - can't blink."
  if (def.target !== "self" && !itemActiveTargets(state, unit.id, activeId).length) return "Nothing in range."
  return null
}

function clearControl(state, unitId) {
  const u = getUnit(state, unitId)
  const patch = {}
  for (const k of CONTROL_KEYS) if (u[k] > 0) patch[k] = 0
  return Object.keys(patch).length ? setUnit(state, unitId, patch) : null
}

function burnMana(state, targetId, amount) {
  const t = getUnit(state, targetId)
  const mana = hasMana(t) ? Math.min(t.mana, amount) : 0
  const ult = Math.min(t.ultCharge || 0, amount)
  const patch = {}
  if (mana) patch.mana = t.mana - mana
  if (ult) patch.ultCharge = t.ultCharge - ult
  if (t.shellMax > 0) Object.assign(patch, { shell: 0, shellBroken: Math.max(t.shellBroken || 0, 1) })
  return { state: Object.keys(patch).length ? setUnit(state, targetId, patch) : state, burned: mana + ult, cracked: t.shell > 0 }
}

function hurt(state, targetId, amount) {
  const res = applyDamageWithBlock(state, targetId, amount)
  let next = res.next
  next = checkEnemyPhase(next, targetId)
  if (res.fell) next = trySpawnBrood(next, targetId)
  return { next, remaining: res.remaining, fell: res.fell }
}

// Use an active. `target` = a unit id, or "row-col" / {row,col} for a tile.
export function castItemActive(state, unitId, activeId, target = null) {
  const actor = getUnit(state, unitId)
  const def = ITEM_ACTIVES[activeId]
  if (itemActiveBlocker(state, actor, activeId)) return state
  const entry = entryOf(actor, activeId)
  let tile = null
  let tgt = null
  if (def.target === "tile") {
    const pos = typeof target === "string" ? { row: Number(target.split("-")[0]), col: Number(target.split("-")[1]) } : target
    if (!pos || !itemActiveTargets(state, unitId, activeId).some((p) => samePos(p, pos))) return state
    tile = pos
  } else if (def.target === "self") tgt = actor
  else {
    tgt = itemActiveTargets(state, unitId, activeId).find((u) => u.id === target) || null
    if (!tgt) return state
  }
  // Pay: AP, mana, recharge, a use.
  const mana = activeManaCost(state, actor, def)
  const used = entry.charges != null ? { itemChargesUsed: { ...(actor.itemChargesUsed || {}), [entry.itemKey]: ((actor.itemChargesUsed || {})[entry.itemKey] || 0) + 1 } } : {}
  let next = setUnit(state, unitId, {
    ap: actor.ap - def.ap,
    ...(mana ? { mana: actor.mana - mana } : {}),
    itemActives: actor.itemActives.map((a) => (a.id === activeId ? { ...a, cd: def.cooldown || 0, charges: a.charges != null ? a.charges - 1 : null } : a)),
    ...used,
  })
  next = callout(next, unitId, `${def.name}!`)
  const name = actor.name
  switch (def.id) {
    case "foxfire-step":
      next = setUnit(next, unitId, { pos: tile })
      next = log(next, `${name} vanishes in foxfire and reappears ${dist(actor.pos, tile)} tiles away.`)
      break
    case "gale-push": {
      const dir = { row: Math.sign(tgt.pos.row - actor.pos.row), col: Math.sign(tgt.pos.col - actor.pos.col) }
      next = log(next, `${name}'s Gale Push throws ${tgt.name} back!`)
      next = knockback(next, unitId, tgt.id, dir, def.amount || 2)
      break
    }
    case "mana-burn": {
      const b = burnMana(next, tgt.id, def.amount || 25)
      next = b.state
      const dmg = Math.max(4, Math.ceil(b.burned / 2))
      next = log(next, `${name} drinks ${b.burned} from ${tgt.name}${b.cracked ? " and cracks its Runeshell" : ""} - ${dmg} damage.`)
      next = callout(next, tgt.id, "Mana burned!")
      next = hurt(next, tgt.id, dmg).next
      break
    }
    case "cyclone-lift":
      next = setUnit(next, tgt.id, { lifted: 1, stun: (getUnit(next, tgt.id).stun || 0) + 1 })
      next = callout(next, tgt.id, "Lifted!")
      next = log(next, `${name}'s Cyclone Lift sweeps ${tgt.name} into the air - it can't be hit and loses its next turn.`)
      break
    case "heartoak-bark":
      next = clearControl(next, unitId) || next
      next = setUnit(next, unitId, { ctrlImmune: Math.max(getUnit(next, unitId).ctrlImmune || 0, def.turns || 2) })
      next = log(next, `${name}'s bark hardens - no root, slow, stun or shove can take hold for ${def.turns || 2} turns.`)
      break
    case "salve": {
      const live = getUnit(next, tgt.id)
      const healed = Math.min(live.maxHp, live.hp + (def.amount || 8))
      next = setUnit(next, tgt.id, { hp: healed })
      next = emit(next, { kind: "heal", actorId: unitId, targetId: tgt.id, amount: healed - live.hp })
      next = log(next, `${name} applies a Sapling Salve - ${tgt.name} heals ${healed - live.hp}.`)
      break
    }
    case "moonwell":
      next = gainExternal(next, unitId, def.amount || 30, "potion")
      next = log(next, `${name} sips from the Moonwell Flask (+${scaleAmount(actor, def.amount || 30)} ${resourceLabel(actor)}).`)
      break
    case "glowdust": {
      let n = 0
      for (const u of livingUnits(next, "enemy")) {
        if (!u.shroud || dist(u.pos, actor.pos) > def.range) continue
        next = callout(setUnit(next, u.id, { revealed: Math.max(u.revealed || 0, def.turns || 2) }), u.id, "Revealed!")
        n++
      }
      next = log(next, `${name} throws Glowdust - ${n ? `${n} hidden foe${n > 1 ? "s" : ""} revealed` : "nothing hides nearby"}.`)
      break
    }
    case "unbind":
    case "unbind-peal":
      if (tgt.side === actor.side) {
        next = clearControl(next, tgt.id) || next
        next = log(next, `${name} unbinds ${tgt.name} - roots, slows and hexes fall away.`)
      } else {
        const t = getUnit(next, tgt.id)
        next = setUnit(next, tgt.id, { shell: 0, shellBroken: t.shellMax > 0 ? Math.max(t.shellBroken || 0, def.turns || 2) : t.shellBroken || 0, ward: 0, regen: 0, blurCharges: 0 })
        next = callout(next, tgt.id, "Dispelled!")
        next = log(next, `${name} unbinds ${tgt.name} - its magic is stripped${t.shellMax > 0 ? ` and its Runeshell can't regrow for ${def.turns || 2} turns` : ""}.`)
      }
      break
    default:
      return state
  }
  return checkTacticsBattleEnd(next)
}

// --- passives in the damage pipeline -----------------------------------------------

// Lifted (untouchable), Ironbark armour, Runeshell soak. Called first thing
// in applyDamageWithBlock.
export function itemPreDamage(state, targetId, amount) {
  const t = getUnit(state, targetId)
  if (!t || !(amount > 0)) return { state, amount }
  if (t.lifted > 0) return { state: log(state, `${t.name} is lifted out of reach.`), amount: 0 }
  let next = state
  if (t.armor > 0) amount = Math.max(1, amount - t.armor)
  if (t.shell > 0) {
    const soak = Math.min(t.shell, amount)
    amount -= soak
    next = setUnit(next, targetId, { shell: t.shell - soak })
    next = callout(next, targetId, t.shell - soak > 0 ? `Shell -${soak}` : "Shell breaks!")
    next = log(next, `${t.name}'s Runeshell soaks ${soak}${t.shell - soak > 0 ? "" : " and shatters"}.`)
  }
  return { state: next, amount }
}

// Mist Veil: the first N basic attacks on it each turn miss (true strike
// cuts through). Returns the new state when the attack is dodged, else null.
export function blurDodge(state, actorId, targetId) {
  const a = getUnit(state, actorId)
  const t = getUnit(state, targetId)
  if (!a || !t || a.side === t.side || !(t.blurCharges > 0)) return null
  if (a.trueStrike) return null
  let next = setUnit(state, targetId, { blurCharges: t.blurCharges - 1 })
  next = callout(next, targetId, "Mist - miss!")
  return checkTacticsBattleEnd(log(next, `${a.name}'s blow passes through ${t.name}'s Mist Veil (${t.blurCharges - 1} left this turn).`))
}

// On-hit riders of a landed basic attack (shred, Wither, mana burn).
export function itemAfterHit(state, actorId, targetId) {
  const a = getUnit(state, actorId)
  const t = getUnit(state, targetId)
  if (!a || !t || t.hp <= 0 || a.side === t.side) return state
  let next = state
  if (a.gearShred > 0 && t.armor > 0) {
    const left = Math.max(0, t.armor - a.gearShred)
    next = callout(setUnit(next, targetId, { armor: left }), targetId, "Shred!")
    next = log(next, `${a.name} splits ${t.name}'s bark - armour ${t.armor} -> ${left}.`)
  }
  if (a.gearWither > 0) {
    if (!(t.withered > 0)) next = callout(next, targetId, "Withered!")
    next = setUnit(next, targetId, { withered: Math.max(getUnit(next, targetId).withered || 0, a.gearWither) })
  }
  if (a.gearManaBurn > 0) {
    const b = burnMana(next, targetId, a.gearManaBurn)
    next = b.state
    if (b.cracked) next = log(callout(next, targetId, "Shell cracked!"), `${a.name}'s hit cracks ${t.name}'s Runeshell.`)
  }
  return next
}

// Hidden by Shadowmoss from this attacker (reveal / adjacency / a lantern
// bearer's own sight lift it). Also read by tacticsClasses.hiddenFrom.
export function shroudedFrom(target, attacker, atkPos = attacker?.pos) {
  if (!target?.shroud || target.revealed > 0 || !attacker || !atkPos) return false
  const d = dist(atkPos, target.pos)
  return d > 1 && !(attacker.gearReveal >= d)
}

// --- enemy kits ------------------------------------------------------------------

const kitOf = (u) => (u?.kit ? COUNTER_KITS[u.kit] : null)

// Start of every enemy turn (inside enemyPhaseStart: preview == real):
// Runeshells regrow, Mossbloom heals, Seedcallers call a Seedling.
export function itemEnemyPhaseStart(state) {
  let next = state
  for (const e of livingUnits(state, "enemy")) {
    const kit = kitOf(e)
    if (!kit) continue
    const live = getUnit(next, e.id)
    if (!live || live.hp <= 0) continue
    if (kit.id === "runeshell" && live.shellMax > 0 && !(live.shellBroken > 0) && live.shell < live.shellMax) {
      next = callout(setUnit(next, e.id, { shell: live.shellMax }), e.id, "Shell regrows")
      next = log(next, `${live.name}'s Runeshell regrows (${live.shellMax}).`)
    }
    if (kit.id === "bloom") {
      const healed = []
      for (const o of livingUnits(next, "enemy")) {
        if (o.structure || dist(o.pos, live.pos) > kit.radius || o.hp >= o.maxHp) continue
        if (o.withered > 0) {
          next = callout(next, o.id, "Withered - no heal")
          continue
        }
        const amt = o.id === live.id ? Math.ceil(kit.heal / 2) : kit.heal
        const hp = Math.min(o.maxHp, o.hp + amt)
        next = emit(setUnit(next, o.id, { hp }), { kind: "heal", actorId: live.id, targetId: o.id, amount: hp - o.hp })
        healed.push(`${o.name} +${hp - o.hp}`)
      }
      if (healed.length) next = log(next, `${live.name}'s Mossbloom mends the pack (${healed.join(", ")}).`)
    }
    if (kit.id === "seed" && state.turn % kit.every === 0) {
      const mine = livingUnits(next, "enemy").filter((u) => u.seedOf === live.id).length
      const crowd = livingUnits(next, "enemy").length
      const cell = mine < kit.cap && crowd < 8 ? freeCellsNear(next, live.pos, 1)[0] : null
      if (cell && kit.minion) {
        const uid = `${live.id}-seed${state.turn}`
        const base = deriveTacticsUnit(kit.minion, "enemy", cell, uid)
        const hp = Math.max(4, Math.round(base.maxHp / 2))
        const sprout = { ...base, name: "Seedling", hp, maxHp: hp, seedOf: live.id, summoned: true, facing: live.facing }
        next = { ...next, units: [...next.units, sprout] }
        next = callout(next, live.id, "Seedcall!")
        next = log(next, `${live.name} calls a Seedling from the soil.`)
      }
    }
  }
  return next
}

// After every enemy action (real turn and preview): a hero under Heartoak
// Bark sheds whatever control just landed.
export function scrubControl(state) {
  let next = state
  for (const u of state.units) {
    if (u.side !== "player" || u.hp <= 0 || !(u.ctrlImmune > 0)) continue
    const cleared = clearControl(next, u.id)
    if (cleared) next = log(callout(cleared, u.id, "Unbending!"), `${u.name}'s Heartoak Bark shrugs it off.`)
  }
  return next
}

// The player's turn comes back: recharges tick, lifts end, reveals /
// Withers / broken shells count down, Mist Veils refill, lanterns shine.
export function itemPlayerTurnStart(state) {
  if (!state.units.some((u) => u.itemActives || u.kit || u.lifted || u.ctrlImmune || u.withered || u.revealed)) return state
  let next = {
    ...state,
    units: state.units.map((u) => {
      if (u.side === "player") {
        const patch = {}
        if (u.itemActives?.some((a) => a.cd > 0)) patch.itemActives = u.itemActives.map((a) => (a.cd > 0 ? { ...a, cd: a.cd - 1 } : a))
        if (u.ctrlImmune > 0) patch.ctrlImmune = u.ctrlImmune - 1
        return Object.keys(patch).length ? { ...u, ...patch } : u
      }
      const kit = kitOf(u)
      const patch = {}
      if (u.lifted > 0) patch.lifted = 0
      if (u.revealed > 0) patch.revealed = u.revealed - 1
      if (u.withered > 0) patch.withered = u.withered - 1
      if (u.shellBroken > 0) patch.shellBroken = u.shellBroken - 1
      if (kit?.id === "mist") patch.blurCharges = kit.dodges
      return Object.keys(patch).length ? { ...u, ...patch } : u
    }),
  }
  return revealAura(next)
}

function revealAura(state) {
  let next = state
  for (const h of livingUnits(state, "player")) {
    if (!(h.gearReveal > 0)) continue
    for (const e of livingUnits(next, "enemy")) {
      if (!e.shroud || e.revealed > 0 || dist(e.pos, h.pos) > h.gearReveal) continue
      next = callout(setUnit(next, e.id, { revealed: 1 }), e.id, "Revealed!")
    }
  }
  return next
}

// --- battle start ----------------------------------------------------------------

// Enemy kits for this Act (layered) + the Worldseed Scepter's class upgrade.
export function prepareItemsForBattle(battle, act = 1) {
  if (!battle?.units) return battle
  const units = battle.units.map((u) => {
    if (u.side === "enemy") {
      const kit = counterKitFor(u.defId, act)
      if (!kit) return u
      const k = { kit: kit.id }
      if (kit.id === "ironbark") k.armor = kit.armor
      if (kit.id === "mist") k.blurCharges = kit.dodges
      if (kit.id === "runeshell") Object.assign(k, { shell: kit.shell, shellMax: kit.shell })
      if (kit.id === "shroud") k.shroud = true
      return { ...u, ...k }
    }
    if (u.side === "player" && u.scepter) return scepterUpgrade(u)
    return u
  })
  return revealAura({ ...battle, units, itemKits: units.some((u) => u.kit) || undefined })
}

const up = (n, f = 1.5) => (typeof n === "number" ? Math.round(n * f * 100) / 100 : n)
export function scepterUpgrade(u) {
  const next = { ...u, gearCheaper: Math.min(60, (u.gearCheaper || 0) + 20) }
  if (u.ability) {
    next.ability = {
      ...u.ability,
      cooldown: Math.max(0, (u.ability.cooldown || 0) - 1),
      ...(typeof u.ability.multiplier === "number" ? { multiplier: up(u.ability.multiplier) } : {}),
      ...(typeof u.ability.amount === "number" ? { amount: Math.round(u.ability.amount * 1.5) } : {}),
      ...(typeof u.ability.bonus === "number" ? { bonus: Math.round(u.ability.bonus * 1.5) } : {}),
      scepter: true,
    }
  }
  if (u.classSkills?.length) next.classSkills = u.classSkills.map((s, i) => (i === 0 ? { ...s, cooldown: Math.max(1, (s.cooldown || 1) - 1), scepter: true } : s))
  return next
}

// QA hook (withLowEnemyHp): every enemy kit off.
export function itemQa(state) {
  return { ...state, units: state.units.map((u) => (u.side === "enemy" && u.kit ? { ...u, kit: null, armor: 0, shell: 0, shellMax: 0, blurCharges: 0, shroud: false } : u)) }
}

// The fight's spent uses: { itemKey: n } per unit, folded back onto the run
// items by runEngine.recordFightAftermath.
export function chargesUsedIn(battle) {
  const out = {}
  for (const u of battle?.units || []) for (const [k, n] of Object.entries(u.itemChargesUsed || {})) out[k] = (out[k] || 0) + n
  return out
}
