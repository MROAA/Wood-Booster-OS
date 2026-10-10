// Hearthwood Frontier - the UNIVERSAL RESOURCE ENGINE (Mana & Skill
// Resource PRD; step 1 = mana, step 2 = class resource profiles).
//
// Every hero and every enemy carries ONE resource, run by this file from
// a data profile (data/heartwood/resources.js): Arcane Mana, Rage, Fury,
// Combo, Shadow, Holy Power, Focus, Nature, Spirit, Souls, Hex Power,
// Corruption, Blood, Reagents, Inspiration, Frost Mana. A class picks its
// profile with `resource` in classes.js; enemies get one from their kit
// (warriors = Rage, necromantic = Souls, everyone else = Arcane Mana).
//
// The unit fields stay the step-1 ones so every older path keeps working:
//   mana / manaMax  = the resource's current value / cap
//   overcharge      = stored overflow (profiles with `overflow` only)
//   resource        = the profile id
// plus a few profile-specific ones (natureState, reagents, berserk...).
//
// Rules:
// - Skills cost AP + resource (+ keep their cooldowns). Basic attack,
//   move, Overwatch and Hunker Down are free, and every profile can be
//   BUILT by playing (attacks, defending, helping...) - never "wait".
// - Spending modes (skill `spend`): fixed price, "pct" (% of max), or
//   "all" (ALL-IN: needs the price, spends everything, scales with it).
// - Breakpoints at 25/50/75/100% of max add bonuses while reached.
// - Classic mana (Arcane) keeps step 1: starts full, ~10% regen, role
//   gains, Overcharge, Commander ultimate on a full bar (Inspiration now).
//
// Gating is opt-in: only units that carry a numeric `mana` field are
// limited, and only `enableMana(state)` adds those fields (real run
// fights, the prototype page, the tutorial). Hand-built synthetic test
// states have none, so they behave exactly as before.
// Pure, state in -> state out, deterministic. Engine helpers are imported
// back from tacticsEngine.js (circular, call-time only).
import { RELICS } from "../../data/heartwood/relics"
import { ITEMS } from "../../data/heartwood/items"
import { CLASSES, defaultManaCost } from "../../data/heartwood/classes"
import { RESOURCES, CLASS_RESOURCE_DEFAULT, NATURE_SHIFT, NATURE_STATES, REAGENT_KINDS, ENEMY_NECRO_WORDS } from "../../data/heartwood/resources"
import { emit, getUnit, setUnit, applyDamageWithBlock, checkTacticsBattleEnd } from "./tacticsEngine"
import { roleOf } from "./tacticsRoles"
import { isHigh, terrainAt } from "./tacticsTerrain"
import { tileCoverSides } from "./tacticsCover"
import { isMageClass } from "./tacticsRanged"
import { enemySkillsFor } from "./tacticsEnemyAbilities"
import { auraOn } from "./gear"

// --- Numbers ------------------------------------------------------------------

// Classic mana pool by mana role (battle role, with damage split melee/ranged).
export const MANA_POOL = { tank: 45, melee: 50, ranged: 55, control: 65, support: 70, healer: 75 }
export const MANA_ROLE_LABEL = {
  tank: "Tank - gains mana from damage it blocks",
  melee: "Melee - gains mana when it hits (more on a kill)",
  ranged: "Ranged - gains mana when it ends a turn without moving (more on high ground / in cover)",
  control: "Control - steady caster pool",
  support: "Support - extra regen, gains mana when it buffs an ally",
  healer: "Healer - extra regen, gains mana when it heals an ally",
}
// Bosses / elites with phases carry a bigger pool.
export const BOSS_POOL_BONUS = 20
// Modest scaling: +3 max mana per hero level above 1.
export const LEVEL_POOL_BONUS = 3
export const REGEN_PCT = 0.1
export const CASTER_REGEN = 3
export const COMMANDER_REGEN = 3
export const OVERCHARGE_PCT = 0.5
// 1 bonus damage/heal/Block per this much stored overcharge (min 1).
export const SURGE_PER = 5
export const GAIN = {
  blockMax: 10, // tank: per hit, up to this much (= what was blocked)
  graze: 3, // tank: a hit turned into a graze by cover
  hit: 5, // melee: per hit
  kill: 10, // melee: extra on a kill
  focus: 5, // ranged: ended the turn without moving
  high: 3, // ranged: ...on high ground
  cover: 3, // ranged: ...next to cover
  support: 6, // healer/support: healed or buffed an ally
}
// Empowered (a 100% breakpoint): the skill hits / heals this much harder.
export const EMPOWER_MULT = 1.5
// Berserk (Rage at 100): own turns it lasts, and its damage multiplier.
export const BERSERK_TURNS = 2
export const BERSERK_MULT = 1.5
// Grand Curse (Hex at 100): damage to each cursed foe + how far it reaches.
export const GRAND_CURSE = { damage: 3, radius: 3, exposed: 2 }
// Reagent combos (Volatile Mixture).
export const VENOM_DAMAGE = 3

// Default skill mana cost by AP cost + cooldown (classes.js; a skill's own
// `mana` field always wins). Cheap = 10 (~20-25% of a small pool), big 30-35.
export { defaultManaCost }

// Enemy skill kinds: enrage is free; a slam pays on the windup.
export const ENEMY_MANA_COST = { mend: 15, shield: 10, hex: 15, slam: 25, pounce: 15, summon: 25, enrage: 0, drain: 5, suppress: 10, spot: 10, volley: 15 }

// --- Profiles ---------------------------------------------------------------------

const CASTER_KINDS = new Set(["mend", "hex", "shield", "summon", "drain", "suppress", "spot", "volley"])

// Enemies use the profile that fits their kit.
export function enemyResourceId(u) {
  const id = String(u?.defId || "").toLowerCase()
  if (ENEMY_NECRO_WORDS.some((w) => id.includes(w))) return "souls"
  const caster = enemySkillsFor(u).some((s) => CASTER_KINDS.has(s.kind))
  const role = roleOf(u)
  if (!caster && (u.range || 1) === 1 && (role === "dps" || role === "tank")) return "rage"
  return "arcane"
}

export function classResourceId(classId) {
  return CLASSES[classId]?.resource || CLASS_RESOURCE_DEFAULT[classId] || "arcane"
}

export function resourceIdOf(u) {
  if (!u) return "arcane"
  if (u.resource && RESOURCES[u.resource]) return u.resource
  if (u.side === "enemy") return enemyResourceId(u)
  return u.classId ? classResourceId(u.classId) : "arcane"
}

export function profileOf(u) {
  return RESOURCES[resourceIdOf(u)] || RESOURCES.arcane
}
export function profileById(id) {
  return RESOURCES[id] || RESOURCES.arcane
}

const special = (u, what) => profileOf(u).special === what

// External amounts (potions, relics, drains) are written for a 100-ish
// bar; small pools (pips, counters, tokens) get them scaled down.
export function scaleAmount(u, n) {
  const max = u?.manaMax || 100
  if (max >= 40 || !(n > 0)) return n
  return Math.max(1, Math.round((n * max) / 100))
}

// --- State helpers --------------------------------------------------------------

export function manaOn(state) {
  return !!state?.manaRules
}
export function hasMana(u) {
  return !!u && typeof u.mana === "number"
}
export function manaRole(u) {
  const role = roleOf(u)
  if (role === "dps") return (u.range || 1) > 1 ? "ranged" : "melee"
  return role
}
export function overchargeCap(u) {
  // Gear (Overflow Chalice): extra overflow room, on any bar.
  return (profileOf(u).overflow ? Math.floor((u?.manaMax || 0) * OVERCHARGE_PCT) : 0) + (u?.gearOverflow || 0)
}
export function resourceLabel(u) {
  return profileOf(u).short
}
export function resourceName(u) {
  return profileOf(u).name
}
// "12 Rage" / "2 Holy" / "20 mana".
export function costText(u, n) {
  return `${n} ${hasMana(u) ? resourceLabel(u) : "mana"}`
}

// Spirit: what active summons hold back from the bar.
export function reservedFor(state, u) {
  if (!state?.units || !u || !special(u, "reserve")) return 0
  let sum = 0
  for (const x of state.units) {
    if (x.hp <= 0 || x.upkeepBy !== u.id || !(x.upkeep > 0)) continue
    if (x.upkeepWhile && !(x[x.upkeepWhile] > 0)) continue
    // Gear (Ancestor Beads): each summon holds back less.
    sum += Math.max(0, x.upkeep - (u.gearUpkeep || 0))
  }
  return Math.min(u.manaMax || 0, sum)
}
function capFor(state, u) {
  return Math.max(0, (u.manaMax || 0) - reservedFor(state, u))
}

export function regenFor(u) {
  if (!hasMana(u)) return 0
  const prof = profileOf(u)
  if (prof.gain?.role) {
    const role = manaRole(u)
    const caster = role === "healer" || role === "support" ? CASTER_REGEN : 0
    const commander = u.id === "player-commander" ? COMMANDER_REGEN : 0
    return Math.round(u.manaMax * ((prof.regenPct ?? 10) / 100)) + (prof.regen || 0) + caster + commander + (u.manaRegenBonus || 0)
  }
  const bloom = u.natureState === "bloom" ? NATURE_STATES.bloom.regen || 0 : 0
  return (prof.regen || 0) + Math.round((u.manaMax * (prof.regenPct || 0)) / 100) + bloom + scaleAmount(u, u.manaRegenBonus || 0)
}

// --- Breakpoints + bonuses ---------------------------------------------------------

export function resourcePct(u) {
  if (!hasMana(u) || !(u.manaMax > 0)) return 0
  return Math.round((u.mana / u.manaMax) * 100)
}
export function reachedBreakpoints(u) {
  if (!hasMana(u)) return []
  const pct = resourcePct(u)
  return (profileOf(u).breakpoints || []).filter((b) => pct >= b.at)
}
export function furyTier(u) {
  if (!hasMana(u) || !special(u, "tiers")) return null
  const pct = resourcePct(u)
  let tier = null
  for (const t of profileOf(u).tiers || []) if (pct >= t.at) tier = t
  return tier
}

const ZERO = Object.freeze({ dmg: 0, aim: 0, heal: 0, guard: 0, taken: 0, skillPct: 0, cheaper: 0, mult: 1, parts: [] })

// Everything the unit's resource adds right now (breakpoints, Fury tier,
// Nature State, Berserk). Read by the damage / hit / heal / cost math.
export function resourceMods(u) {
  if (!hasMana(u)) return ZERO
  const out = { dmg: 0, aim: 0, heal: 0, guard: 0, taken: 0, skillPct: 0, cheaper: 0, mult: 1, parts: [] }
  const add = (fx, label) => {
    for (const k of ["dmg", "aim", "heal", "guard", "taken", "skillPct", "cheaper"]) if (fx[k]) out[k] += fx[k]
    if (fx.aim) out.parts.push({ label, value: fx.aim })
  }
  const prof = profileOf(u)
  for (const b of reachedBreakpoints(u)) add(b, `${prof.short} ${b.at}%`)
  const tier = furyTier(u)
  if (tier) add(tier, tier.name)
  if (u.natureState && NATURE_STATES[u.natureState]) add(NATURE_STATES[u.natureState], `${NATURE_STATES[u.natureState].name} state`)
  // Gear: Focus Lens (bonus while the bar is at least half full) +
  // Quickening Ring (cheaper skills).
  if ((u.gearHighDmg || u.gearHighAim) && resourcePct(u) >= (u.gearHighAt || 50)) add({ dmg: u.gearHighDmg || 0, aim: u.gearHighAim || 0 }, "Focus Lens")
  if (u.gearCheaper > 0) add({ cheaper: u.gearCheaper }, "Gear")
  if (u.berserk > 0) out.mult = BERSERK_MULT
  return out
}

// One-line list of the bonuses active right now (tooltips).
export function bonusText(u) {
  if (!hasMana(u)) return ""
  const m = resourceMods(u)
  const out = []
  if (m.dmg) out.push(`+${m.dmg} damage`)
  if (m.aim) out.push(`+${m.aim}% to hit`)
  if (m.heal) out.push(`+${m.heal} healing`)
  if (m.guard) out.push(`takes ${m.guard} less`)
  if (m.taken) out.push(`takes ${m.taken} more`)
  if (m.skillPct) out.push(`skills +${m.skillPct}%`)
  if (m.cheaper) out.push(`skills ${m.cheaper}% cheaper`)
  if (u.berserk > 0) out.push("BERSERK +50% damage")
  const bp = reachedBreakpoints(u)
  if (bp.some((b) => b.empower)) out.push("next skill EMPOWERED")
  if (bp.some((b) => b.grand)) out.push("next skill sets off a GRAND CURSE")
  return out.join(", ")
}

// --- Costs ----------------------------------------------------------------------------

// A class skill is priced in its class's own resource; signatures,
// the ranged toolkit and enemy kinds are mana-priced and get scaled.
function nativePrice(skill) {
  if (!skill?.classId || skill.toolkit) return false
  return (CLASSES[skill.classId]?.skills || []).some((s) => s.id === skill.id)
}

export function manaCostOf(skill, unit = null) {
  if (!skill) return 0
  let base
  if (typeof skill.mana === "number") base = skill.mana
  else if (skill.kind && ENEMY_MANA_COST[skill.kind] != null && skill.target == null) base = ENEMY_MANA_COST[skill.kind]
  else base = defaultManaCost(skill)
  if (!hasMana(unit)) return base
  const prof = profileOf(unit)
  if (!nativePrice(skill)) {
    const scale = prof.costScale ?? 1
    base = base > 0 && scale > 0 ? Math.max(1, Math.round(base * scale)) : 0
  }
  if (skill.spend === "pct") base = Math.ceil(((unit.manaMax || 0) * (skill.pct || 0)) / 100)
  const cheaper = resourceMods(unit).cheaper
  if (cheaper && base > 0) base = Math.max(1, Math.round((base * (100 - cheaper)) / 100))
  return base
}

export function canAfford(unit, skill) {
  if (!hasMana(unit)) return true
  const cost = manaCostOf(skill, unit)
  if (special(unit, "inverted")) return cost <= 0 || unit.mana + cost <= unit.manaMax
  if (skill?.spend === "all") return unit.mana >= Math.max(cost, 1)
  return unit.mana >= cost
}

// Bonus a skill would get from the stored overcharge right now.
export function surgeFor(u) {
  const oc = u?.overcharge || 0
  return oc > 0 ? Math.max(1, Math.round(oc / SURGE_PER)) : 0
}

// Relic resource effects (relics.js `mana` field), summed for the squad.
export function relicManaFor(relicIds = []) {
  const out = { regen: 0, onHit: 0, startOvercharge: 0, pool: 0, bloodChalice: 0, soulLantern: 0 }
  for (const id of relicIds) {
    const m = RELICS[id]?.mana
    if (!m) continue
    for (const k of Object.keys(out)) out[k] += m[k] || 0
  }
  return out
}

// Mana potions a unit carries in (items with `mana.restore`).
export function potionsFrom(itemIds = []) {
  return itemIds.filter((id) => ITEMS[id]?.mana?.restore > 0)
}

// --- Reagent tokens --------------------------------------------------------------------

const TOKEN_ORDER = ["fire", "frost", "poison", "arcane"]
function tokenTotal(t) {
  return TOKEN_ORDER.reduce((s, k) => s + (t?.[k] || 0), 0)
}
export function tokensOf(u) {
  return { fire: 0, frost: 0, poison: 0, arcane: 0, ...(u?.reagents || {}) }
}
export function gainToken(state, unitId, kind, n = 1, label = "reagent") {
  const u = getUnit(state, unitId)
  if (!manaOn(state) || !hasMana(u) || u.hp <= 0 || !special(u, "tokens") || !REAGENT_KINDS[kind]) return state
  const cap = profileOf(u).tokenMax || 2
  const t = tokensOf(u)
  const add = Math.max(0, Math.min(n, cap - t[kind]))
  if (!add) return state
  t[kind] += add
  const next = setUnit(state, unitId, { reagents: t, mana: tokenTotal(t) })
  return label ? emit(next, { kind: "mana", unitId, amount: add, label, res: REAGENT_KINDS[kind].name, token: kind }) : next
}
function setTokens(state, unitId, t) {
  return setUnit(state, unitId, { reagents: t, mana: tokenTotal(t) })
}

// --- Init -------------------------------------------------------------------------------

function initUnit(u, relic) {
  if (!u || u.structure || u.npc) return u
  const player = u.side === "player"
  const resource = resourceIdOf(u)
  const prof = profileById(resource)
  let max
  if (!(prof.max > 0)) {
    // Classic mana: a hero's class sets its pool (classes.js `manaPool`);
    // enemies and class-less units go by battle role.
    const classPool = player ? CLASSES[u.classId]?.manaPool : null
    const base = typeof classPool === "number" ? classPool : MANA_POOL[manaRole(u)]
    max = base + ((u.phases?.length || 0) > 0 ? BOSS_POOL_BONUS : 0) + (player ? relic.pool : 0) + (u.manaPoolBonus || 0)
  } else {
    max = prof.max + (player && prof.max >= 50 ? relic.pool : 0)
  }
  const startPct = player ? prof.startPct : (prof.enemyStartPct ?? prof.startPct)
  let mana = Math.round((max * (startPct ?? 100)) / 100)
  const extra = {}
  if (prof.special === "tokens") {
    const t = { fire: 0, frost: 0, poison: 0, arcane: 0, ...(prof.startTokens || {}) }
    extra.reagents = t
    mana = tokenTotal(t)
  }
  if (prof.special === "states") extra.natureState = null
  const over = player && prof.overflow ? Math.min(Math.floor(max * OVERCHARGE_PCT), relic.startOvercharge) : 0
  return {
    ...u,
    resource,
    manaMax: max,
    mana,
    overcharge: over,
    manaRegenBonus: player ? relic.regen : 0,
    manaOnHit: player ? relic.onHit : 0,
    resActive: false,
    hurtSince: false,
    ...extra,
  }
}

// Turns resources on for a fresh battle (every unit at its profile's start).
export function enableMana(state, relicIds = []) {
  if (!state?.units) return state
  const relic = relicManaFor(relicIds)
  return { ...state, manaRules: true, manaRelic: relic, units: state.units.map((u) => initUnit(u, relic)) }
}

// Units summoned mid-fight get their resource the first time it matters.
function ensureAll(state) {
  if (!manaOn(state) || !state.units.some((u) => !hasMana(u) && !u.structure && !u.npc && u.hp > 0)) return state
  const relic = state.manaRelic || relicManaFor()
  return { ...state, units: state.units.map((u) => (hasMana(u) ? u : initUnit(u, relic))) }
}

// --- Gain / spend / drain ----------------------------------------------------------

function crossedText(u, before, after) {
  const prof = profileOf(u)
  const was = before.manaMax > 0 ? (before.mana / before.manaMax) * 100 : 0
  const now = after.manaMax > 0 ? (after.mana / after.manaMax) * 100 : 0
  const hit = (prof.breakpoints || []).filter((b) => was < b.at && now >= b.at).pop()
  return hit ? `${prof.short} ${hit.at}%: ${hit.name}!` : ""
}

// After the value changed: breakpoint callout + Berserk / Storm triggers.
function afterChange(state, unitId, before) {
  let next = state
  const u = getUnit(next, unitId)
  if (!u) return next
  const text = crossedText(u, before, u)
  if (text) next = emit(next, { kind: "mana", unitId, amount: 0, label: "breakpoint", text, res: resourceLabel(u) })
  const prof = profileOf(u)
  if (prof.special === "berserk" && u.mana >= u.manaMax && before.mana < before.manaMax && !(u.berserk > 0)) {
    next = setUnit(next, unitId, { berserk: BERSERK_TURNS })
    next = emit(addLog(next, `${u.name} goes BERSERK! (+50% damage for ${BERSERK_TURNS} turns)`), { kind: "reaction", unitId, label: "BERSERK!" })
  }
  if (prof.special === "states" && u.mana >= u.manaMax && before.mana < before.manaMax && u.natureState !== "storm") {
    next = setUnit(next, unitId, { natureState: "storm" })
    next = emit(addLog(next, `${u.name}'s Nature overflows - the Storm answers!`), { kind: "reaction", unitId, label: "Storm!" })
  }
  return next
}

// Adds resource; profiles with `overflow` store the excess as Overcharge.
// Inverted (Corruption) units are PURIFIED by a gain from outside.
// `label` = show a floating "+N Rage" callout (regen stays silent).
export function gainMana(state, unitId, amount, label = null) {
  const u = getUnit(state, unitId)
  if (!manaOn(state) || !hasMana(u) || u.hp <= 0 || !(amount > 0)) return state
  if (special(u, "inverted")) return state
  if (special(u, "tokens")) return state
  // Gear (Wellspring Torc): every gain the hero earns by playing (the
  // labeled ones - regen stays silent) builds a little more.
  if (label && u.gearResGain > 0) amount += scaleAmount(u, u.gearResGain)
  const cap = capFor(state, u)
  const room = Math.max(0, cap - u.mana)
  const toMana = Math.min(room, amount)
  const toOver = profileOf(u).overflow || u.gearOverflow > 0 ? Math.max(0, Math.min(overchargeCap(u) - (u.overcharge || 0), amount - toMana)) : 0
  if (toMana + toOver <= 0) return state
  let next = setUnit(state, unitId, { mana: u.mana + toMana, overcharge: (u.overcharge || 0) + toOver })
  if (label) next = emit(next, { kind: "mana", unitId, amount: toMana + toOver, label, overcharge: toOver > 0, res: resourceLabel(u) })
  return afterChange(next, unitId, u)
}

// A gain written for a 100-bar (potions, relics, restore skills): scaled
// for small pools; tokens get Arcane reagents; Corruption is purified.
export function gainExternal(state, unitId, amount, label = null) {
  const u = getUnit(state, unitId)
  if (!manaOn(state) || !hasMana(u) || u.hp <= 0 || !(amount > 0)) return state
  if (special(u, "inverted")) return loseResource(state, unitId, amount, label ? "purify" : null)
  if (special(u, "tokens")) {
    let next = state
    const n = scaleAmount(u, amount)
    for (let i = 0; i < n; i++) next = gainToken(next, unitId, TOKEN_ORDER[(3 + i) % 4], 1, label)
    return next
  }
  return gainMana(state, unitId, scaleAmount(u, amount), label)
}

// Removes resource without a drain (decay, losses). Inverted: lowers it.
function loseResource(state, unitId, amount, label = null) {
  const u = getUnit(state, unitId)
  if (!hasMana(u) || !(amount > 0) || !(u.mana > 0)) return state
  if (special(u, "tokens")) return state
  const lost = Math.min(u.mana, amount)
  let next = setUnit(state, unitId, { mana: u.mana - lost })
  if (label) next = emit(next, { kind: "mana", unitId, amount: -lost, label, res: resourceLabel(u) })
  return next
}

// Burns resource (overcharge first). Returns { next, burned }. Small
// pools are hit proportionally; non-drainable profiles (pips, tokens,
// Corruption) are immune.
export function burnMana(state, unitId, amount, label = "burn") {
  const u = getUnit(state, unitId)
  if (!manaOn(state) || !hasMana(u) || u.hp <= 0 || !(amount > 0) || !profileOf(u).drainable) return { next: state, burned: 0 }
  const want = scaleAmount(u, amount)
  const fromOver = Math.min(u.overcharge || 0, want)
  const fromMana = Math.min(u.mana, want - fromOver)
  const burned = fromOver + fromMana
  if (!burned) return { next: state, burned: 0 }
  const next = setUnit(state, unitId, { mana: u.mana - fromMana, overcharge: (u.overcharge || 0) - fromOver })
  return { next: emit(next, { kind: "mana", unitId, amount: -burned, label, res: resourceLabel(u) }), burned }
}

// Burn, and the actor gains what was taken (in its own resource).
export function stealMana(state, actorId, targetId, amount) {
  const { next, burned } = burnMana(state, targetId, amount, "drain")
  return burned ? gainExternal(next, actorId, burned, "steal") : next
}

// Who an enemy Mana Leech is worth draining.
export function drainableUnit(u) {
  return hasMana(u) && profileOf(u).drainable && (u.manaMax || 0) >= 40
}

function addLog(state, line) {
  return { ...state, log: [...(state.log || []), line] }
}

// --- Player skills -------------------------------------------------------------------

// Before a skill: park the cast's bonuses on the caster -
//   surge      = stored Overcharge (+damage/heal, else +Block)
//   castBonus  = ALL-IN scaling (+damage/heal per amount spent)
//   allInSpent = how much an ALL-IN skill spends (handlers read it)
//   castPct    = breakpoint / Fury tier skill damage %
//   empowered  = a 100% breakpoint: x1.5
export function primeSurge(state, actorId, skill) {
  const u = getUnit(state, actorId)
  if (!hasMana(u)) return state
  const cost = manaCostOf(skill, u)
  const patch = {}
  const surge = cost > 0 ? surgeFor(u) : 0
  if (surge) patch.surge = surge
  if (skill?.spend === "all") {
    const spent = special(u, "tokens") ? u.mana : Math.max(cost, u.mana)
    patch.allInSpent = spent
    const per = skill.allIn?.per || 0
    const steps = per > 0 ? Math.floor(spent / per) : 0
    const bonus = steps * Math.max(skill.allIn?.dmg || 0, skill.allIn?.heal || 0)
    if (bonus) patch.castBonus = bonus
  }
  const mods = resourceMods(u)
  if (mods.skillPct) patch.castPct = mods.skillPct
  const bp = reachedBreakpoints(u)
  if (bp.some((b) => b.empower) && !special(u, "inverted")) patch.empowered = true
  if (bp.some((b) => b.grand)) patch.grandReady = true
  return Object.keys(patch).length ? setUnit(state, actorId, patch) : state
}

const ALLY_SIG_KINDS = new Set(["heal", "shield-ally", "rally", "aura-block"])
const DEBUFF_KEYS = ["cursed", "exposed", "slow", "root", "weak", "vulnerable", "silenced", "disarmed", "mark", "soulDebt", "corruption", "poison", "burn", "chill", "frozen", "stun", "suppressFire", "appraised", "challenged", "provoked"]
const debuffScore = (u) => DEBUFF_KEYS.reduce((s, k) => s + ((u[k] || 0) > 0 ? 1 : 0), 0)

// After a successful skill: pay (fixed / % / ALL-IN; Corruption ADDS),
// spend the overcharge, clear the cast bonuses, then the profile's own
// cast gains (builders, Nature State, reagents, helping, cursing...).
export function afterSkillCast(state, actorId, targetId, skill, seqBefore, before0 = null) {
  const before = getUnit(state, actorId)
  if (!hasMana(before)) return clearSurge(state, actorId)
  let next = state
  const prof = profileOf(before)
  const cost = manaCostOf(skill, before)
  const surge = before.surge || 0
  const clear = { surge: 0, castBonus: 0, castPct: 0, empowered: false, allInSpent: 0, grandReady: false }
  if (prof.special === "inverted") {
    next = setUnit(next, actorId, { mana: Math.min(before.manaMax, before.mana + cost), ...clear })
    if (cost > 0) next = emit(next, { kind: "mana", unitId: actorId, amount: cost, label: "corrupt", text: `+${cost} Corruption`, res: prof.short })
  } else if (prof.special === "tokens" && skill?.spend === "all") {
    next = setTokens(setUnit(next, actorId, clear), actorId, { fire: 0, frost: 0, poison: 0, arcane: 0 })
  } else {
    const spent = skill?.spend === "all" ? before.mana : Math.min(before.mana, cost)
    next = setUnit(next, actorId, { mana: Math.max(0, before.mana - spent), ...(surge ? { overcharge: 0 } : {}), ...clear })
    if (skill?.spend === "all" && spent > 0) next = emit(next, { kind: "mana", unitId: actorId, amount: -spent, label: "all-in", text: `ALL-IN -${spent} ${prof.short}`, res: prof.short })
  }
  if (surge) {
    const fresh = (next.events || []).filter((e) => e.seq > seqBefore)
    const used = fresh.some((e) => (e.kind === "strike" && e.actorId === actorId) || (e.kind === "heal" && e.actorId === actorId) || (e.kind === "damage" && e.targetId !== actorId))
    if (!used) next = setUnit(next, actorId, { block: (getUnit(next, actorId).block || 0) + surge })
    next = emit(addLog(next, `${before.name}'s Overcharge surges (+${surge}${used ? "" : " Block"}).`), { kind: "mana", unitId: actorId, amount: 0, label: "overcharge", text: `Overcharge +${surge}!` })
  }
  if (before.empowered) next = emit(next, { kind: "mana", unitId: actorId, amount: 0, label: "breakpoint", text: "Empowered!" })
  // Hex at 100: the Grand Curse goes off with this skill.
  if (before.grandReady && next.phase === before.side) next = grandCurse(next, actorId, targetId)
  const fx = skill?.manaFx
  const target = targetId && typeof targetId === "string" ? getUnit(next, targetId) : null
  if (fx && target && target.hp > 0) {
    if (fx.restore && target.side === before.side) {
      next = gainExternal(next, target.id, fx.restore, "restore")
      next = addLog(next, `${before.name} restores ${fx.restore} mana to ${target.name}.`)
    }
    if (fx.burn && target.side !== before.side) {
      const r = burnMana(next, target.id, fx.burn)
      next = r.burned ? addLog(r.next, `${before.name} burns ${r.burned} of ${target.name}'s ${resourceLabel(target)}.`) : r.next
    }
    if (fx.steal && target.side !== before.side) {
      const had = getUnit(next, target.id)
      next = stealMana(next, actorId, target.id, fx.steal)
      const lost = had.mana + (had.overcharge || 0) - (getUnit(next, target.id).mana + (getUnit(next, target.id).overcharge || 0))
      if (lost) next = addLog(next, `${before.name} steals ${lost} ${resourceLabel(had)} from ${target.name}.`)
    }
  }
  next = castGains(next, actorId, target, skill, seqBefore, before0)
  // Spirit: a new summon's reserve takes its room right away.
  const live = getUnit(next, actorId)
  if (live && prof.special === "reserve" && live.mana > capFor(next, live)) next = setUnit(next, actorId, { mana: capFor(next, live) })
  return next
}

// The profile's cast gains.
function castGains(state, actorId, target, skill, seqBefore, before0) {
  let next = state
  const me = getUnit(next, actorId)
  if (!me || me.hp <= 0) return next
  const prof = profileOf(me)
  const g = prof.gain || {}
  const allySkill = skill?.target === "ally" || ALLY_SIG_KINDS.has(skill?.kind)
  const helpedOther = target ? target.side === me.side && target.id !== actorId : allySkill
  const fresh = (next.events || []).filter((e) => e.seq > seqBefore)
  const healedAlly = fresh.some((e) => e.kind === "heal" && e.actorId === actorId && e.targetId !== actorId && getUnit(next, e.targetId)?.side === me.side && e.amount > 0)
  // Classic mana (step 1): healer / support helping an ally pays back.
  if (g.role) {
    const role = manaRole(me)
    if ((role === "healer" || role === "support") && allySkill && helpedOther) next = gainMana(next, actorId, GAIN.support, "support")
  }
  if (g.spell && fresh.some((e) => (e.kind === "strike" || e.kind === "heal") && e.actorId === actorId)) next = gainMana(next, actorId, g.spell)
  if (skill?.gen > 0) next = gainMana(next, actorId, skill.gen, "build")
  if (g.heal && healedAlly) next = gainMana(next, actorId, g.heal, "heal")
  if (g.buff && allySkill && helpedOther && !healedAlly) next = gainMana(next, actorId, g.buff, "inspire")
  if (g.allyHelp && allySkill && helpedOther) next = gainMana(next, actorId, g.allyHelp, "bond")
  // Hex: every foe this skill cursed / weakened.
  if ((g.debuff || g.chill || g.freeze) && before0) {
    let cursed = 0
    let chilled = 0
    let froze = 0
    for (const u of next.units) {
      if (u.side === me.side || u.structure) continue
      const was = before0.units.find((x) => x.id === u.id)
      if (!was) continue
      if (debuffScore(u) > debuffScore(was) || (u.cursed || 0) > (was.cursed || 0) || (u.exposed || 0) > (was.exposed || 0)) cursed++
      if ((u.chill || 0) > (was.chill || 0)) chilled++
      if ((u.frozen || 0) > (was.frozen || 0)) froze++
    }
    if (g.debuff && cursed) next = gainMana(next, actorId, g.debuff * cursed, "hex")
    if (g.chill && chilled) next = gainMana(next, actorId, g.chill * chilled, "chill")
    if (g.freeze && froze) next = gainMana(next, actorId, g.freeze * froze, "freeze")
  }
  // Nature: the skill switches the Nature State (+ a nature-skill gain).
  if (prof.special === "states" && NATURE_SHIFT[skill?.id]) {
    const state2 = NATURE_SHIFT[skill.id]
    const live = getUnit(next, actorId)
    if (live.natureState !== state2) {
      next = setUnit(next, actorId, { natureState: state2 })
      next = emit(next, { kind: "reaction", unitId: actorId, label: `${NATURE_STATES[state2].icon} ${NATURE_STATES[state2].name}` })
    }
    if (g.nature) next = gainMana(next, actorId, g.nature)
  }
  // Reagents: flasks gather tokens.
  if (prof.special === "tokens" && skill?.brew) {
    for (const [kind, n] of Object.entries(skill.brew)) next = gainToken(next, actorId, kind, n)
    const t = target && getUnit(next, target.id)
    if (skill.id === "poison-flask" && t && t.burn > 0) next = gainToken(next, actorId, "fire", 1)
  }
  return next
}

// Hex Power at 100: every Cursed / Exposed foe near the target is hit.
function grandCurse(state, actorId, targetId) {
  let next = state
  const a = getUnit(next, actorId)
  const center = (targetId && typeof targetId === "string" && getUnit(next, targetId)?.pos) || a.pos
  next = emit(addLog(next, `${a.name}'s hexes converge - GRAND CURSE!`), { kind: "aoe", actorId })
  next = emit(next, { kind: "reaction", unitId: actorId, label: "GRAND CURSE!" })
  const ids = next.units
    .filter((u) => u.hp > 0 && u.side !== a.side && !u.structure && (u.cursed > 0 || u.exposed > 0) && Math.max(Math.abs(u.pos.row - center.row), Math.abs(u.pos.col - center.col)) <= GRAND_CURSE.radius)
    .map((u) => u.id)
  for (const id of ids) {
    if (next.phase === "won" || next.phase === "lost") break
    const u = getUnit(next, id)
    if (!u || u.hp <= 0) continue
    next = setUnit(next, id, { exposed: Math.max(u.exposed || 0, GRAND_CURSE.exposed) })
    const r = applyDamageWithBlock(next, id, GRAND_CURSE.damage)
    next = addLog(r.next, `${u.name} withers under the Grand Curse (${r.remaining}).${r.fell ? " It falls." : ""}`)
    next = checkTacticsBattleEnd(next)
  }
  const live = getUnit(next, actorId)
  next = setUnit(next, actorId, { mana: 0 })
  return emit(next, { kind: "mana", unitId: actorId, amount: -live.mana, label: "grand", res: resourceLabel(live) })
}

function clearSurge(state, actorId) {
  const u = getUnit(state, actorId)
  return u && (u.surge || u.castBonus || u.castPct || u.empowered || u.allInSpent)
    ? setUnit(state, actorId, { surge: 0, castBonus: 0, castPct: 0, empowered: false, allInSpent: 0 })
    : state
}

// Why a skill can't be cast for resource reasons ("" = it can).
export function manaBlockReason(unit, skill) {
  if (!hasMana(unit)) return ""
  const cost = manaCostOf(skill, unit)
  const label = resourceLabel(unit)
  if (special(unit, "inverted")) return cost > 0 && unit.mana + cost > unit.manaMax ? `Corruption too high (${unit.mana} + ${cost} > ${unit.manaMax})` : ""
  if (skill?.spend === "all" && unit.mana < Math.max(cost, 1)) return `Needs ${Math.max(cost, 1)}+ ${label} (has ${unit.mana})`
  return unit.mana < cost ? `Needs ${cost} ${label} (has ${unit.mana})` : ""
}

// "12 Rage" / "ALL-IN 30+ Rage" / "+20 Corruption" for buttons.
export function skillCostText(unit, skill) {
  if (!hasMana(unit)) return ""
  const cost = manaCostOf(skill, unit)
  const label = resourceLabel(unit)
  if (special(unit, "inverted")) return cost > 0 ? `+${cost} ${label}` : "free"
  if (skill?.spend === "all") return `ALL-IN ${Math.max(cost, 1)}+ ${label}`
  if (skill?.spend === "pct") return `${cost} ${label} (${skill.pct}%)`
  return cost > 0 ? `${cost} ${label}` : skill?.gen > 0 ? `+${skill.gen} ${label}` : "free"
}

// --- Blood: Sacrifice -------------------------------------------------------------------

export function canSacrifice(state, unitId) {
  const u = getUnit(state, unitId)
  return !!u && u.hp > 1 && state.phase === u.side && hasMana(u) && special(u, "sacrifice") && !u.sacrificeUsed && u.mana < u.manaMax
}
export function sacrificeCost(u) {
  const prof = profileOf(u)
  return Math.max(2, Math.round(((u?.maxHp || 0) * (prof.sacrificePct || 10)) / 100))
}

// Free, once a turn: pay HP for Blood (Blood Chalice adds more).
export function sacrifice(state, unitId) {
  if (!canSacrifice(state, unitId)) return state
  const u = getUnit(state, unitId)
  const prof = profileOf(u)
  const hpCost = Math.min(u.hp - 1, sacrificeCost(u))
  const bonus = (state.manaRelic?.bloodChalice || 0) > 0 ? 10 : 0
  let next = setUnit(state, unitId, { hp: u.hp - hpCost, sacrificeUsed: true })
  next = emit(next, { kind: "damage", targetId: unitId, amount: hpCost })
  next = gainMana(next, unitId, (prof.sacrificeGain || 30) + bonus, "sacrifice")
  return addLog(next, `${u.name} sacrifices ${hpCost} HP for Blood.`)
}

// --- Potions -------------------------------------------------------------------------------

export const POTION_AP = 1

export function potionOf(unit) {
  const id = (unit?.potions || []).find((p) => !(unit.potionsUsed || []).includes(p))
  return id ? ITEMS[id] : null
}

// Drink one carried mana potion (1 AP, consumed - removed from the run
// after the fight). Overflow becomes Overcharge.
export function drinkPotion(state, unitId) {
  const u = getUnit(state, unitId)
  if (!u || u.hp <= 0 || state.phase !== u.side || !hasMana(u) || u.ap < POTION_AP) return state
  const potion = potionOf(u)
  if (!potion) return state
  let next = setUnit(state, unitId, { ap: u.ap - POTION_AP, potionsUsed: [...(u.potionsUsed || []), potion.id] })
  next = gainExternal(next, unitId, potion.mana.restore, "potion")
  return addLog(next, `${u.name} drinks a ${potion.name} (+${scaleAmount(u, potion.mana.restore)} ${resourceLabel(u)}).`)
}

// --- Turn hooks ---------------------------------------------------------------------------

function nearGreen(state, pos) {
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const p = { row: pos.row + dr, col: pos.col + dc }
      if (p.row < 0 || p.col < 0 || p.row >= state.grid.rows || p.col >= state.grid.cols) continue
      if (["forest", "bush"].includes(terrainAt(state, p))) return true
    }
  }
  return false
}

// Start of a side's own turn: decay, regen and the "start of turn"
// gains (calm Shadow, grove Nature, Hex suffering), Berserk ticks.
export function sideTurnRegen(state, side) {
  if (!manaOn(state)) return state
  let next = ensureAll(state)
  for (const u0 of next.units) {
    if (u0.side !== side || u0.hp <= 0 || !hasMana(u0)) continue
    const prof = profileOf(u0)
    const g = prof.gain || {}
    const patch = { resActive: false, hurtSince: false }
    if (u0.sacrificeUsed) patch.sacrificeUsed = false
    if (u0.berserk > 0) {
      patch.berserk = u0.berserk - 1
      if (patch.berserk === 0) next = emit(next, { kind: "reaction", unitId: u0.id, label: "Berserk fades" })
    }
    // Decay first ("cools down when not fighting" for idle profiles).
    if (prof.decay > 0 && !(u0.berserk > 0) && (prof.decayWhen !== "idle" || !u0.resActive) && u0.mana > 0) {
      const lost = Math.min(u0.mana, prof.decay)
      patch.mana = u0.mana - lost
    }
    next = setUnit(next, u0.id, patch)
    const u = getUnit(next, u0.id)
    next = gainMana(next, u.id, regenFor(u))
    if (g.calm && !u0.hurtSince) next = gainMana(next, u.id, g.calm, "calm")
    if (g.grove && nearGreen(next, u.pos)) next = gainMana(next, u.id, g.grove)
    if (g.suffering) {
      const n = next.units.filter((e) => e.hp > 0 && e.side !== u.side && e.cursed > 0).length
      if (n) next = gainMana(next, u.id, g.suffering * n, "suffering")
    }
    // Gear: Bloodletter's Lancet (HP into resource) + Incense aura.
    const lancet = getUnit(next, u.id)
    if (lancet.gearTapRes > 0 && lancet.hp > 1) {
      const paid = Math.min(lancet.hp - 1, lancet.gearTapHp || 0)
      next = gainExternal(setUnit(next, u.id, { hp: lancet.hp - paid }), u.id, lancet.gearTapRes, "lancet")
    }
    const incense = auraOn(next, getUnit(next, u.id), "res")
    if (incense > 0) next = gainExternal(next, u.id, incense, "incense")
    // Spirit: a summon that appeared since may have shrunk the room.
    const live = getUnit(next, u.id)
    const cap = capFor(next, live)
    if (live.mana > cap) next = setUnit(next, u.id, { mana: cap })
  }
  return next
}

// End of the player's turn (inside enemyPhaseStart, so the enemy
// preview sees it too): heroes that held still focus.
export function playerTurnEndFocus(state) {
  if (!manaOn(state)) return state
  let next = state
  for (const u of state.units) {
    if (u.side !== "player" || u.hp <= 0 || !hasMana(u) || u.moved) continue
    const g = profileOf(u).gain || {}
    const covered = Object.values(tileCoverSides(state, u.pos)).some((v) => v > 0)
    if (g.role) {
      // Ranged rework: mages channel the same way when they hold still.
      if (!(manaRole(u) === "ranged" || isMageClass(u.classId))) continue
      let amount = GAIN.focus
      if (isHigh(state, u.pos)) amount += GAIN.high
      if (covered) amount += GAIN.cover
      next = gainMana(next, u.id, amount, "focus")
    } else if (g.still) {
      let amount = g.still
      if (isHigh(state, u.pos)) amount += g.high || 0
      if (covered) amount += g.cover || 0
      next = gainMana(next, u.id, amount, "focus")
    }
  }
  return next
}

// Enemy phase start (shared with previewEnemyIntents): focus + enemy regen.
export function enemyPhaseMana(state) {
  if (!manaOn(state)) return state
  return sideTurnRegen(playerTurnEndFocus(state), "enemy")
}

// --- Combat gains -------------------------------------------------------------------------

function facingOf(attacker, defender) {
  if (!defender?.facing || defender.classPassive === "foresight") return "front"
  const dCol = attacker.pos.col - defender.pos.col
  const dRow = attacker.pos.row - defender.pos.row
  const dir = Math.abs(dCol) >= Math.abs(dRow) ? (dCol >= 0 ? "E" : "W") : dRow >= 0 ? "S" : "N"
  if (dir === defender.facing) return "front"
  const opp = { N: "S", S: "N", E: "W", W: "E" }[defender.facing]
  return dir === opp ? "back" : "side"
}

// A hit landed (every damage path funnels through the engine's
// checkOnDealDamageTriggers): the attacker's profile hit gains.
export function onDealDamage(state, actorId, targetId, remaining) {
  if (!manaOn(state)) return state
  const actor = getUnit(state, actorId)
  const target = getUnit(state, targetId)
  if (!hasMana(actor) || actor.hp <= 0 || !target || target.side === actor.side || remaining < 0) return state
  let next = setUnit(state, actorId, { resActive: true })
  const prof = profileOf(actor)
  const g = prof.gain || {}
  const killed = target.hp <= 0
  const dist = Math.max(Math.abs(actor.pos.row - target.pos.row), Math.abs(actor.pos.col - target.pos.col))
  let amount = 0
  if (g.role && manaRole(actor) === "melee") amount += GAIN.hit + (killed ? GAIN.kill : 0)
  if (!g.role) {
    amount += g.hit || 0
    if (dist <= 1) amount += g.meleeHit || 0
    else amount += g.rangedHit || 0
    const facing = facingOf(actor, target)
    if (facing === "side") amount += g.flank || 0
    if (facing === "back") amount += g.back || 0
    if (killed) amount += g.kill || 0
  }
  next = gainMana(next, actorId, amount, killed ? "kill" : "hit")
  if (actor.manaOnHit) next = gainExternal(next, actorId, actor.manaOnHit, "hit")
  // Reagents: a hit gathers a token by the target's state.
  if (prof.special === "tokens" && remaining > 0) next = gainToken(next, actorId, target.burn > 0 ? "fire" : target.chill > 0 || target.frozen > 0 ? "frost" : "poison", 1)
  // Allies who feed on kills (Inspiration).
  if (killed) {
    for (const ally of next.units) {
      if (ally.side !== actor.side || ally.id === actorId || ally.hp <= 0 || !hasMana(ally)) continue
      const ag = profileOf(ally).gain || {}
      if (ag.allyKill) next = gainMana(next, ally.id, ag.allyKill, "rally")
    }
  }
  return next
}

// HP actually lost to a hit (applyDamageWithBlock): Rage/Fury from pain,
// Shadow broken, Blood from nearby wounds, Souls from deaths, relics.
export function onDamaged(state, targetId, lost) {
  if (!manaOn(state)) return state
  const t = getUnit(state, targetId)
  if (!t) return state
  let next = state
  if (lost > 0 && hasMana(t)) {
    next = setUnit(next, targetId, { resActive: true, hurtSince: true })
    const g = profileOf(t).gain || {}
    if (t.hp > 0 && g.taken) next = gainMana(next, targetId, Math.min(g.takenCap || 99, lost * g.taken), "pain")
    if (t.hp > 0 && g.takenLoss) next = loseResource(next, targetId, g.takenLoss, "exposed")
    // Blood Chalice: heroes with a bar turn lost HP into their resource.
    if (t.hp > 0 && t.side === "player" && (state.manaRelic?.bloodChalice || 0) > 0 && (t.manaMax || 0) >= 50) next = gainMana(next, targetId, lost, "chalice")
    // Gear (Rage Drum): every hit taken builds resource.
    if (t.hp > 0 && t.gearHurtGain > 0) next = gainExternal(next, targetId, t.gearHurtGain, "drum")
  }
  if (lost > 0) {
    for (const b of next.units) {
      if (b.hp <= 0 || !hasMana(b) || b.side !== t.side) continue
      const g = profileOf(b).gain || {}
      if (!g.bleed) continue
      const d = Math.max(Math.abs(b.pos.row - t.pos.row), Math.abs(b.pos.col - t.pos.col))
      if (d <= (g.bleedRange ?? 2)) next = gainMana(next, b.id, Math.min(g.bleedCap || 99, lost * g.bleed), "bleed")
    }
  }
  if (getUnit(next, targetId)?.hp <= 0) next = onDeath(next, targetId)
  return next
}

// Someone fell: Souls users nearby gather; Soul Lantern feeds the squad.
function onDeath(state, deadId) {
  let next = state
  const d = getUnit(next, deadId)
  if (!d || d.soulCounted || d.structure) return next
  next = setUnit(next, deadId, { soulCounted: true })
  for (const s of next.units) {
    if (s.hp <= 0 || !hasMana(s) || s.id === deadId) continue
    const prof = profileOf(s)
    const dist = Math.max(Math.abs(s.pos.row - d.pos.row), Math.abs(s.pos.col - d.pos.col))
    const g = prof.gain || {}
    if (g.death || g.allyDeath) {
      if (dist > (prof.deathRange || 4)) continue
      const n = d.side === s.side ? g.allyDeath || 0 : g.death || 0
      if (n) next = gainMana(next, s.id, n, "souls")
    }
    if (s.side === "player" && d.side === "enemy" && (next.manaRelic?.soulLantern || 0) > 0 && dist <= 4) next = gainExternal(next, s.id, 5, "lantern")
  }
  return next
}

// Damage absorbed by Block / Bulwark / Ward: tanks / Holy turn it into power.
export function onBlocked(state, targetId, absorbed) {
  if (!manaOn(state) || !(absorbed > 0)) return state
  const t = getUnit(state, targetId)
  if (!hasMana(t) || t.hp <= 0) return state
  const g = profileOf(t).gain || {}
  if (g.role) return manaRole(t) === "tank" ? gainMana(state, targetId, Math.min(GAIN.blockMax, absorbed), "block") : state
  return g.block ? gainMana(state, targetId, g.block, "block") : state
}

// Cover turned a hit into a graze: counts as blocked.
export function onGraze(state, targetId) {
  if (!manaOn(state)) return state
  const t = getUnit(state, targetId)
  if (!hasMana(t) || t.hp <= 0) return state
  const g = profileOf(t).gain || {}
  if (g.role) return manaRole(t) === "tank" ? gainMana(state, targetId, GAIN.graze, "block") : state
  return g.block ? gainMana(state, targetId, g.block, "block") : state
}

// It took a blow for an ally (Bodyguard / Intercept).
export function onGuard(state, guardianId) {
  if (!manaOn(state)) return state
  const t = getUnit(state, guardianId)
  if (!hasMana(t) || t.hp <= 0) return state
  const g = profileOf(t).gain || {}
  return g.guard ? gainMana(state, guardianId, g.guard, "guard") : state
}

// Generic +N of the unit's own resource (class passives, riposte...).
export function gainResource(state, unitId, n, label = null) {
  return gainMana(state, unitId, n, label)
}

// Volatile Mixture: what the thrown reagents make.
export function reagentCombos(t) {
  const out = []
  if (t.fire > 0 && t.poison > 0) out.push("venom")
  if (t.frost > 0 && t.poison > 0) out.push("freezing")
  if (t.fire > 0 && t.frost > 0) out.push("steam")
  if (t.arcane > 0) out.push("arcane")
  return out
}

// --- Commander ultimate -------------------------------------------------------------------

export function ultimateReady(commander) {
  return hasMana(commander) && commander.mana >= commander.manaMax
}

// --- After the fight --------------------------------------------------------------------------

// Potions drunk in a fight, per unit id: [itemDefId...].
export function potionsUsedIn(battle) {
  const out = {}
  for (const u of battle?.units || []) if (u.potionsUsed?.length) out[u.id] = u.potionsUsed
  return out
}

// One-line summary for tooltips.
export function manaSummary(u, state = null) {
  if (!hasMana(u)) return ""
  const prof = profileOf(u)
  if (prof.special === "tokens") {
    const t = tokensOf(u)
    return `${prof.name}: ${TOKEN_ORDER.filter((k) => t[k] > 0).map((k) => `${t[k]} ${REAGENT_KINDS[k].name}`).join(", ") || "empty"}`
  }
  const oc = u.overcharge > 0 ? ` +${u.overcharge} overcharge` : ""
  const reserved = state ? reservedFor(state, u) : 0
  const res = reserved ? ` (${reserved} reserved)` : ""
  const regen = regenFor(u)
  const nat = u.natureState && NATURE_STATES[u.natureState] ? ` · ${NATURE_STATES[u.natureState].name} state` : ""
  const tier = furyTier(u)
  return `${prof.name} ${u.mana}/${u.manaMax}${oc}${res}${regen ? ` · +${regen} per turn` : ""}${prof.decay ? ` · -${prof.decay} per turn${prof.decayWhen === "idle" ? " when idle" : ""}` : ""}${nat}${tier ? ` · ${tier.name}` : ""}${u.berserk > 0 ? " · BERSERK" : ""}`
}
