// Hearthwood Frontier - DOTA DEPTH 2, the fight side:
//  1. TALENTS (data/heartwood/talents.js) + NEUTRAL ITEMS
//     (data/heartwood/neutrals.js) folded onto a hero at fight start
//     (applyTalentsToUnit / applyNeutralToUnit, called by
//     unitLevels.applyLevelsToTactics) and their riders in the fight: a
//     2nd skill charge, a rider after a skill, resource back per cast / hit
//     / kill, a Mana Shield, the first skill for free.
//  2. Five more ENEMY KITS (itemBuilds.js COUNTER_KITS): Bloodfang
//     (lifesteal), Splitting Spores (split on death), Burrower (digs in),
//     Thornmirror (reflects the first skill each turn), Hushcap (silence
//     aura).
//  3. ENEMY TALENTS (itemBuilds.js ENEMY_TALENTS): elites / minibosses /
//     bosses at higher threat tiers get small visible upgrades.
//
// Pure + deterministic, state in -> state out. Every enemy-side tick runs
// inside the engine's enemyPhaseStart / the shared enemy action code, so
// previewEnemyIntents stays an exact dry run. Circular import with
// tacticsEngine.js (like tacticsItems.js) - only used at call time.
import { getUnit, setUnit, emit, livingUnits, applyDamageWithBlock, checkTacticsBattleEnd } from "./tacticsEngine"
import { talentById } from "../../data/heartwood/talents"
import { NEUTRAL_ITEMS } from "../../data/heartwood/neutrals"
import { COUNTER_KITS, ENEMY_TALENTS, ENEMY_TALENT_COUNT } from "../../data/heartwood/itemBuilds"
import { manaOn, hasMana, scaleAmount, gainExternal, gainMana, manaCostOf, burnMana, profileOf, resourceLabel } from "./tacticsMana"
import { applySkillFx } from "./tacticsClasses"

const dist = (a, b) => Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col))
const log = (state, line) => ({ ...state, log: [...state.log, line] })
const callout = (state, unitId, label) => emit(state, { kind: "reaction", unitId, label })
const kitOf = (u) => (u?.kit ? COUNTER_KITS[u.kit] : null)

// --- 1. talents + neutrals at fight start -----------------------------------------

// Fold one rider block (talent / neutral `fx`) onto a built tactics unit.
// `skills` = the class skills match the talent's class (not a collar).
export function applyRider(u, fx, { skills = true, label = "Talent" } = {}) {
  if (!fx) return u
  let next = { ...u }
  if (fx.hp) {
    next.maxHp = Math.max(1, next.maxHp + fx.hp)
    next.hp = Math.max(1, Math.min(next.maxHp, next.hp + fx.hp))
  }
  if (fx.attack) {
    next.attack = Math.max(0, next.attack + fx.attack)
    next.baseAttack = Math.max(0, (next.baseAttack ?? u.attack) + fx.attack)
  }
  if (fx.move) next.move = Math.max(1, next.move + fx.move)
  if (fx.ward) next.ward = (next.ward || 0) + fx.ward
  if (fx.headAp) next.ap = (next.ap || 0) + fx.headAp
  const bar = typeof next.manaMax === "number" && !next.reagents
  if (fx.manaPool && bar) {
    const add = Math.max(1, scaleAmount(next, fx.manaPool))
    const inverted = profileOf(next)?.special === "inverted"
    next.manaMax += add
    if (!inverted) next.mana = Math.min(next.manaMax, (next.mana || 0) + add)
  }
  if (fx.regen && typeof next.manaMax === "number") next.manaRegenBonus = (next.manaRegenBonus || 0) + fx.regen
  const mods = [...(next.extraMods || [])]
  if (fx.cheaper) mods.push({ when: "always", cheaper: fx.cheaper, label })
  for (const m of fx.mods || []) mods.push({ label, ...m })
  if (mods.length !== (next.extraMods || []).length) next.extraMods = mods
  const tal = { ...(next.tal || {}) }
  for (const k of ["castMana", "hitMana", "killMana", "killHeal", "manaShield"]) if (fx[k]) tal[k] = (tal[k] || 0) + fx[k]
  if (fx.manaShield) tal.manaShield = Math.min(60, tal.manaShield)
  if (fx.firstFree) tal.firstFree = true
  if (Object.keys(tal).length) next.tal = tal
  if (skills && fx.sk != null) next = patchSkill(next, fx, label)
  return next
}

// The class skill a talent points at (class skills first - promotion
// skills are appended after them and never counted).
function patchSkill(u, fx, label) {
  const own = (u.classSkills || []).filter((s) => !s.promo)
  const target = own[fx.sk]
  if (!target) return u
  const s = { ...target }
  if (fx.cd) s.cooldown = Math.max(1, (s.cooldown || 1) + fx.cd)
  if (fx.manaCut && typeof s.mana === "number") s.mana = Math.max(0, Math.round((s.mana * (100 - fx.manaCut)) / 100))
  if (fx.ap) s.cost = Math.max(0, (s.cost || 0) + fx.ap)
  if (fx.range && typeof s.range === "number") s.range += fx.range
  if (fx.radius && typeof s.radius === "number") s.radius += fx.radius
  if (fx.charges) s.charges = Math.max(s.charges || 1, fx.charges)
  if (fx.skillFx) s.talentFx = [...(s.talentFx || []), fx.skillFx]
  s.talentMarks = [...(s.talentMarks || []), label]
  return { ...u, classSkills: u.classSkills.map((x) => (x === target ? s : x)) }
}

// Talents (ids "class:tierSide") onto a hero. `natural` = its natural
// class: under a Class Collar the skill changes sleep (the rest works).
export function applyTalentsToUnit(u, ids, natural) {
  const list = (ids || []).map(talentById).filter(Boolean)
  if (!list.length) return u
  const awake = !natural || u.classId === natural
  let next = { ...u, talents: list.map((t) => t.id) }
  for (const t of list) next = applyRider(next, t.fx, { skills: awake && t.classId === u.classId, label: t.name })
  return awake ? next : { ...next, talentDormant: true }
}

export function applyNeutralToUnit(u, neutralId) {
  const n = NEUTRAL_ITEMS[neutralId]
  if (!n) return u
  return { ...applyRider(u, n.fx, { skills: false, label: n.name }), neutral: n.id }
}

// --- 2. in the fight ----------------------------------------------------------------

// Hushcap: a hero within its radius can't cast (items + attacks still work).
export function hushedNow(state, unit) {
  if (!unit || unit.side !== "player" || !state?.units) return null
  for (const e of state.units) {
    if (e.side !== "enemy" || e.hp <= 0 || e.kit !== "hush" || e.hushBroken > 0 || e.burrowed > 0) continue
    if (dist(e.pos, unit.pos) <= (COUNTER_KITS.hush.radius || 2)) return e
  }
  return null
}

// Wraps the engine's castAbility (`base`): the Hushcap gate, the cast
// marker (so hits inside a skill aren't "basic hits"), then charges, the
// talent riders, resource back, kills and the Thornmirror bounce.
export function castWithTalents(state, actorId, targetId, skillId, base) {
  const who = getUnit(state, actorId)
  if (who && who.side === "player" && state.phase === "player" && hushedNow(state, who)) return state
  const marked = { ...state, talentCasting: actorId }
  const out = base(marked, actorId, targetId, skillId)
  if (out === marked) return state
  const { talentCasting: _c, ...clean } = out
  return afterTalentCast(state, clean, actorId, targetId, skillId)
}

function afterTalentCast(before, state, actorId, targetId, skillId) {
  const was = getUnit(before, actorId)
  let next = state
  const me = getUnit(next, actorId)
  if (!was || !me) return next
  const skill = skillId ? (was.classSkills || []).find((s) => s.id === skillId) || null : null
  // A 2nd charge: the recharge only starts once every charge is spent.
  if (skill?.charges > 1 && me.hp > 0) {
    const used = ((me.chargesUsed || {})[skill.id] || 0) + 1
    if (used < skill.charges) {
      next = setUnit(next, actorId, { classCds: { ...(me.classCds || {}), [skill.id]: 0 }, chargesUsed: { ...(me.chargesUsed || {}), [skill.id]: used } })
      next = callout(next, actorId, `Charge ${skill.charges - used} left`)
    } else next = setUnit(next, actorId, { chargesUsed: { ...(me.chargesUsed || {}), [skill.id]: 0 } })
  }
  // Talent riders on the skill (the skill-tree fx vocabulary).
  if (skill?.talentFx?.length && next.phase === "player") {
    const tgt = typeof targetId === "string" && getUnit(next, targetId) ? targetId : null
    const tile = !tgt && targetId ? (typeof targetId === "string" ? { row: Number(targetId.split("-")[0]), col: Number(targetId.split("-")[1]) } : targetId) : null
    const tBefore = tgt ? getUnit(before, tgt) : null
    for (const fx of skill.talentFx) {
      if (next.phase !== "player") break
      next = applySkillFx(next, actorId, tgt, tile, fx, tBefore ? tBefore.hp > 0 && (getUnit(next, tgt)?.hp ?? 0) <= 0 : undefined)
    }
  }
  const tal = was.tal || {}
  if (skill && getUnit(next, actorId)?.hp > 0 && manaOn(next) && hasMana(was)) {
    // Opening Gambit / Glimmer Moth: the first class skill is free.
    if (tal.firstFree && !was.firstFreeUsed) {
      const cost = skill.spend === "all" ? Math.max(0, was.mana - (getUnit(next, actorId).mana || 0)) : manaCostOf(skill, was)
      next = setUnit(next, actorId, { firstFreeUsed: true })
      if (cost > 0 && profileOf(was)?.special !== "inverted") next = gainMana(next, actorId, cost, "free cast")
    }
    if (tal.castMana) next = gainExternal(next, actorId, tal.castMana, "echo")
  }
  next = killRewards(before, next, actorId)
  next = reflectBounce(before, next, actorId)
  return checkTacticsBattleEnd(next)
}

// Kill rewards for every foe that fell between `before` and `state`.
function killRewards(before, state, actorId) {
  const me = getUnit(state, actorId)
  const tal = me?.tal
  if (!tal || !(tal.killMana || tal.killHeal) || me.hp <= 0) return state
  const kills = before.units.filter((u) => u.side !== me.side && u.hp > 0 && !u.structure && (getUnit(state, u.id)?.hp ?? 0) <= 0).length
  if (!kills) return state
  let next = state
  if (tal.killMana) next = gainExternal(next, actorId, tal.killMana * kills, "kill")
  if (tal.killHeal) {
    const live = getUnit(next, actorId)
    const hp = Math.min(live.maxHp, live.hp + tal.killHeal * kills)
    if (hp > live.hp) next = emit(setUnit(next, actorId, { hp }), { kind: "heal", actorId, targetId: actorId, amount: hp - live.hp })
  }
  return next
}

// Thornmirror: the first skill that hurts it each turn bounces back.
function reflectBounce(before, state, actorId) {
  const me = getUnit(state, actorId)
  if (!me || me.side !== "player" || me.hp <= 0) return state
  let next = state
  for (const e of before.units) {
    if (e.side !== "enemy" || e.kit !== "reflect" || e.reflectUsed || e.reflectBroken > 0) continue
    const live = getUnit(next, e.id)
    const lost = e.hp - Math.max(0, live?.hp ?? 0)
    if (!(lost > 0)) continue
    const dmg = Math.max(1, Math.round((lost * (COUNTER_KITS.reflect.pct || 50)) / 100))
    next = setUnit(next, e.id, { reflectUsed: true })
    next = callout(next, e.id, "Reflected!")
    next = log(next, `${e.name}'s Thornmirror throws ${dmg} back at ${me.name}.`)
    const r = applyDamageWithBlock(next, actorId, dmg)
    next = r.next
    if (getUnit(next, actorId)?.hp <= 0) break
  }
  return next
}

// A landed attack (attackUnit): resource per basic hit / kill for heroes;
// Bloodfang lifesteal + Mana Siphon for enemies.
export function talentAfterHit(state, actorId, targetId, { dealt = 0, fell = false } = {}) {
  const a = getUnit(state, actorId)
  const t = getUnit(state, targetId)
  if (!a || !t || a.side === t.side) return state
  let next = state
  if (a.side === "player") {
    const tal = a.tal
    if (!tal || state.talentCasting === actorId || a.hp <= 0) return state
    if (tal.hitMana && dealt > 0) next = gainExternal(next, actorId, tal.hitMana, "sap")
    if (fell) next = killRewards({ ...state, units: state.units.map((u) => (u.id === targetId ? { ...u, hp: 1 } : u)) }, next, actorId)
    return next
  }
  // Enemy side (runs in the real enemy turn AND the preview's dry run).
  const kit = kitOf(a)
  if (kit?.id === "bloodfang" && dealt > 0 && a.hp > 0 && a.hp < a.maxHp) {
    if (a.withered > 0) next = callout(next, actorId, "Withered - no lifesteal")
    else {
      const hp = Math.min(a.maxHp, a.hp + Math.max(1, Math.ceil((dealt * kit.steal) / 100)))
      next = emit(setUnit(next, actorId, { hp }), { kind: "heal", actorId, targetId: actorId, amount: hp - a.hp })
      next = log(next, `${a.name} drinks ${hp - a.hp} from the wound.`)
    }
  }
  if (a.enemyTalents?.includes("mana-siphon") && dealt > 0 && t.hp > 0 && hasMana(t)) {
    const r = burnMana(next, targetId, scaleAmount(t, ENEMY_TALENTS["mana-siphon"].siphon), "siphon")
    next = r.next
    if (r.burned) next = log(next, `${a.name}'s Mana Siphon drains ${r.burned} ${resourceLabel(t)} from ${t.name}.`)
  }
  return next
}

// Damage pipeline (from tacticsItems.itemPreDamage): a burrowed foe is out
// of reach; a hero's Mana Shield pays part of the hit from its resource.
export function talentPreDamage(state, targetId, amount) {
  const t = getUnit(state, targetId)
  if (!t || !(amount > 0)) return { state, amount }
  if (t.burrowed > 0 && !(t.revealed > 0)) return { state: log(state, `${t.name} is underground.`), amount: 0 }
  const pct = t.tal?.manaShield
  if (!pct || !manaOn(state) || !hasMana(t) || !(t.mana > 0) || t.reagents) return { state, amount }
  const special = profileOf(t)?.special
  if (special === "inverted" || special === "tokens") return { state, amount }
  const per = Math.max(1, scaleAmount(t, 4))
  const soak = Math.min(Math.floor((amount * pct) / 100), Math.floor(t.mana / per))
  if (!(soak > 0)) return { state, amount }
  let next = setUnit(state, targetId, { mana: t.mana - soak * per })
  next = emit(next, { kind: "mana", unitId: targetId, amount: -soak * per, label: "shield", text: `Mana Shield -${soak}`, res: resourceLabel(t) })
  return { state: next, amount: amount - soak }
}

// Start of every enemy turn (inside enemyPhaseStart: preview == real):
// Burrowers surface, Second Wind / Bloodrage fire once.
export function talentEnemyPhaseStart(state) {
  let next = state
  for (const e of livingUnits(state, "enemy")) {
    const live = getUnit(next, e.id)
    if (!live || live.hp <= 0) continue
    if (live.burrowed > 0) {
      next = callout(setUnit(next, e.id, { burrowed: 0 }), e.id, "Surfaces!")
      next = log(next, `${live.name} bursts up out of the ground.`)
    }
    const ets = live.enemyTalents || []
    if (!ets.length || live.hp * 2 >= live.maxHp) continue
    const fired = live.etFired || []
    if (ets.includes("second-wind") && !fired.includes("second-wind")) {
      const now = getUnit(next, e.id)
      const hp = Math.min(now.maxHp, now.hp + Math.round(now.maxHp * ENEMY_TALENTS["second-wind"].secondWind))
      next = emit(setUnit(next, e.id, { hp, etFired: [...(getUnit(next, e.id).etFired || []), "second-wind"] }), { kind: "heal", actorId: e.id, targetId: e.id, amount: hp - now.hp })
      next = log(callout(next, e.id, "Second Wind!"), `${now.name} catches its Second Wind (+${hp - now.hp} HP).`)
    }
    if (ets.includes("bloodrage") && !fired.includes("bloodrage")) {
      const now = getUnit(next, e.id)
      const add = ENEMY_TALENTS.bloodrage.bloodrage
      next = setUnit(next, e.id, { attack: now.attack + add, baseAttack: (now.baseAttack ?? now.attack) + add, etFired: [...(now.etFired || []), "bloodrage"] })
      next = log(callout(next, e.id, "Bloodrage!"), `${now.name} flies into a Bloodrage (+${add} attack).`)
    }
  }
  return next
}

// The player's turn comes back: Burrowers dig in (every other turn),
// Thornmirrors re-arm, dispels wear off.
export function talentPlayerTurnStart(state) {
  if (!state.units.some((u) => u.kit === "burrow" || u.kit === "reflect" || u.kit === "hush")) return state
  let next = state
  for (const u of state.units) {
    if (u.side !== "enemy" || u.hp <= 0) continue
    const patch = {}
    if (u.kit === "reflect") {
      if (u.reflectUsed) patch.reflectUsed = false
      if (u.reflectBroken > 0) patch.reflectBroken = u.reflectBroken - 1
    }
    if (u.kit === "hush" && u.hushBroken > 0) patch.hushBroken = u.hushBroken - 1
    if (u.kit === "burrow") {
      const cycle = (u.burrowCycle || 0) + 1
      patch.burrowCycle = cycle
      if (cycle % 2 === 1) patch.burrowed = 1
    }
    if (!Object.keys(patch).length) continue
    next = setUnit(next, u.id, patch)
    if (patch.burrowed) next = log(callout(next, u.id, "Burrows!"), `${u.name} digs in underground.`)
  }
  return next
}

// Unbind on a foe: Thornmirror / Hushcap are switched off for N turns.
export function dispelKit(state, targetId, turns = 2) {
  const t = getUnit(state, targetId)
  if (!t) return state
  if (t.kit === "reflect") return setUnit(state, targetId, { reflectBroken: Math.max(t.reflectBroken || 0, turns) })
  if (t.kit === "hush") return setUnit(state, targetId, { hushBroken: Math.max(t.hushBroken || 0, turns) })
  if (t.kit === "burrow" && t.burrowed > 0) return setUnit(state, targetId, { burrowed: 0 })
  return state
}

// --- 3. kits + enemy talents at battle start ---------------------------------------

// Fields a kit puts on its unit at the start of the fight.
export function kitStartFields(kit) {
  if (kit.id === "splitter") return { broodSplit: { count: kit.count, hpFactor: kit.hpFactor, maxGen: 1 } }
  if (kit.id === "burrow") return { burrowCycle: 0, burrowed: 0 }
  return {}
}

const hash = (s) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

// The enemy talent ids a leader of this def gets at this threat tier.
export function enemyTalentsFor(defId, tier, count) {
  const ids = Object.keys(ENEMY_TALENTS)
  const n = Math.min(ids.length, count ?? ENEMY_TALENT_COUNT[tier] ?? 0)
  if (!n) return []
  const start = hash(`${defId}:${tier}`) % ids.length
  const out = []
  for (let i = 0; out.length < n && i < ids.length * 3; i++) {
    const id = ids[(start + i * 3) % ids.length]
    if (!out.includes(id)) out.push(id)
  }
  return out
}

// Elite / miniboss / boss fights at threat T2+: the strongest foe (and at
// T4+ the next one too) get their talents. Deterministic per def + tier.
export function assignEnemyTalents(battle) {
  const d = battle?.difficulty
  if (!d || battle.depthQa || !["elite", "miniboss", "boss"].includes(d.kind)) return battle
  const n = ENEMY_TALENT_COUNT[d.tier] || 0
  if (!n) return battle
  const leaders = battle.units
    .filter((u) => u.side === "enemy" && u.hp > 0 && !u.structure && !u.npc && !u.summoned)
    .sort((a, b) => b.maxHp - a.maxHp || (a.id < b.id ? -1 : 1))
    .slice(0, d.tier >= 4 ? 2 : 1)
  if (!leaders.length) return battle
  const picks = new Map(leaders.map((u, i) => [u.id, enemyTalentsFor(u.defId || u.id, d.tier, i === 0 ? n : 1)]))
  return {
    ...battle,
    enemyTalentsOn: true,
    units: battle.units.map((u) => {
      const ids = picks.get(u.id)
      if (!ids?.length) return u
      const bump = { attack: 0, move: 0, armor: 0, shell: 0 }
      for (const id of ids) {
        const t = ENEMY_TALENTS[id]
        bump.attack += t.attack || 0
        bump.move += t.move || 0
        bump.armor += t.armor || 0
        bump.shell += t.shell || 0
      }
      return {
        ...u,
        enemyTalents: ids,
        etBump: bump,
        attack: u.attack + bump.attack,
        ...(typeof u.baseAttack === "number" ? { baseAttack: u.baseAttack + bump.attack } : {}),
        move: (u.move || 0) + bump.move,
        armor: (u.armor || 0) + bump.armor,
        shell: (u.shell || 0) + bump.shell,
      }
    }),
  }
}

// The Threat panel read: [{ unitId, name, talents: [def] }].
export function enemyTalentRead(battle) {
  return (battle?.units || [])
    .filter((u) => u.side === "enemy" && u.hp > 0 && u.enemyTalents?.length)
    .map((u) => ({ unitId: u.id, name: u.name, talents: u.enemyTalents.map((id) => ENEMY_TALENTS[id]).filter(Boolean) }))
}

// QA hook companion (withLowEnemyHp, via tacticsItems.itemQa): the new
// kits + enemy talents off.
export function talentQa(u) {
  if (u.side !== "enemy") return u
  let next = u
  if (u.enemyTalents?.length) {
    const b = u.etBump || {}
    next = {
      ...next,
      enemyTalents: [],
      etBump: null,
      attack: Math.max(0, next.attack - (b.attack || 0)),
      move: Math.max(1, (next.move || 1) - (b.move || 0)),
      armor: Math.max(0, (next.armor || 0) - (b.armor || 0)),
      shell: Math.max(0, (next.shell || 0) - (b.shell || 0)),
    }
  }
  if (u.kit === "splitter") next = { ...next, broodSplit: null }
  if (u.burrowed || u.burrowCycle != null) next = { ...next, burrowed: 0, burrowCycle: null }
  return next
}

// Board / UI: how a talent changed a skill ("2 charges · -1 recharge").
export function talentSkillNote(skill) {
  if (!skill?.talentMarks?.length) return ""
  return skill.talentMarks.join(", ")
}

