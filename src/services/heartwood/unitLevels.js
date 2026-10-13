// Unit levels (sprint 3): units (and the Commander) earn XP in real
// tactics fights and level up between fights, picking 1 of 3 perks.
// As a player reads it:
// - +1 XP for every hit that deals damage, +1 for a support ability
//   (heal, shield, aura, rally, shout), +3 for a kill, +2 for still
//   standing when a fight is won.
// - Levels 1-5. XP needed in total: Lv2 6, Lv3 15, Lv4 28, Lv5 45.
// - Each new level: pick 1 of 3 perks (same offer for the same run seed,
//   unit and level). Perks apply in every later tactics fight.
// Skill tree: while the unit still has a skill without an upgrade, a
// level-up offers the 2 branches (A/B) of ONE of its skills (seeded) +
// one stat perk. A branch is permanent and each skill takes only one.
// Stored on the bench entry: `xp` (total) + `perks` (ids, in pick order)
// + `skillUpgrades` ({ skillId: "A"|"B" }, "signature" = its own ability);
// the Commander's on runState `commanderXp` / `commanderPerks` /
// `commanderSkillUpgrades`. Missing = Lv1, 0 XP, no upgrades (old saves
// load unchanged). Pure data + helpers - no imports from either battle engine.
import { streamRng } from "../../data/heartwood/seed"
import { DECLINE_HP, DECLINE_ATTACK } from "../../data/heartwood/hearth"
import { UNITS } from "../../data/heartwood/units"
import { CHARACTERS } from "../../data/heartwood/characters"
import { CLASSES, fallbackClassId, applySkillUpgrades } from "../../data/heartwood/classes"
import { signatureAbilityForDef, signatureUpgrades, upgradeAbility, SIGNATURE_SKILL_KEY } from "./tacticsAbilities"
import { applyMutationsToTactics } from "./mutations"
import { RESOURCES, CLASS_RESOURCE_DEFAULT } from "../../data/heartwood/resources"
import { promotionsFor, PROMOTIONS, PROMOTION_LEVELS } from "../../data/heartwood/promotions"
import { applyPromotionToTactics } from "./promotions"
import { traitFx, applyTraitsToTactics } from "./traits"

export const MAX_LEVEL = 5
// Total XP needed to REACH each level (index = level - 1).
export const LEVEL_XP = [0, 6, 15, 28, 45]
export const XP = { hit: 1, support: 1, kill: 3, survive: 2 }

export const PERKS = {
  swift: { id: "swift", name: "Swift Feet", icon: "👣", text: "+1 movement.", stack: false },
  reach: { id: "reach", name: "Long Reach", icon: "🏹", text: "+1 attack range.", stack: false, rangedOnly: true },
  bark: { id: "bark", name: "Thick Bark", icon: "🌳", text: "+3 max HP.", stack: true },
  edge: { id: "edge", name: "Sharpened", icon: "🗡", text: "+2 attack.", stack: true },
  quick: { id: "quick", name: "Quick Cast", icon: "✧", text: "Its first ability each fight costs 1 less AP.", stack: false, needsAbility: true },
  head: { id: "head", name: "Head Start", icon: "⚡", text: "+1 AP on the first turn of each fight.", stack: false },
  cleave: { id: "cleave", name: "Cleave", icon: "⚔", text: "Basic attacks also hit enemies next to the target for half damage.", stack: false },
  ward: { id: "ward", name: "Warded", icon: "🛡", text: "Starts every fight with 1 Ward (blocks the first hit completely).", stack: false },
  thirst: { id: "thirst", name: "Bloodthirst", icon: "❤", text: "Heals 3 HP whenever it lands a kill.", stack: false },
}
export const PERK_IDS = Object.keys(PERKS)
export const THIRST_HEAL = 3

export function levelForXp(xp) {
  let lv = 1
  for (let i = 1; i < LEVEL_XP.length; i++) if ((xp || 0) >= LEVEL_XP[i]) lv = i + 1
  return lv
}

// { level, xp, into, need } - `into`/`need` for the XP bar (need 0 at max).
export function levelProgress(xp) {
  const total = Math.max(0, xp || 0)
  const level = levelForXp(total)
  if (level >= MAX_LEVEL) return { level, xp: total, into: 0, need: 0 }
  const base = LEVEL_XP[level - 1]
  return { level, xp: total, into: total - base, need: LEVEL_XP[level] - base }
}

// The skill tree of one unit: its class skills (+ the signature), each
// with its A/B branches. [{ id, name, icon, signature, upgrades }]
export function skillTreeFor(def, { commander = false } = {}) {
  const sig = commander ? null : signatureAbilityForDef(def)
  const classId = commander ? "commander" : def?.classId || fallbackClassId(def, sig?.kind)
  const cls = CLASSES[classId]
  const out = (cls?.skills || []).filter((sk) => sk.upgrades).map((sk) => ({ id: sk.id, name: sk.name, icon: sk.icon, signature: false, upgrades: sk.upgrades }))
  const sigUps = signatureUpgrades(sig)
  if (sigUps) out.push({ id: SIGNATURE_SKILL_KEY, name: sig.name, icon: "★", signature: true, upgrades: sigUps })
  return out
}

// The Commander uses key "commander"; everyone else a bench key.
export function levelSubject(runState, key) {
  if (key === "commander") {
    const ch = CHARACTERS[runState.characterId]
    return {
      key, name: ch?.name || "Your Commander", xp: runState.commanderXp || 0, perks: runState.commanderPerks || [],
      skillUpgrades: runState.commanderSkillUpgrades || {}, skills: skillTreeFor(ch, { commander: true }),
      ranged: !!ch?.attackPattern && ch.attackPattern !== "single", hasAbility: false,
      promoPicks: runState.commanderPromo || [], naturalClass: "commander",
    }
  }
  const e = runState.bench.find((b) => b.key === key)
  if (!e) return null
  // Breeding: a hatchling may carry the other parent's class (`classId`).
  const def = UNITS[e.defId] && e.classId && CLASSES[e.classId] ? { ...UNITS[e.defId], classId: e.classId } : UNITS[e.defId]
  return {
    key, name: def?.name || e.defId, xp: e.xp || 0, perks: e.perks || [], skillUpgrades: e.skillUpgrades || {}, skills: def ? skillTreeFor(def) : [],
    inheritedPerks: e.inheritedPerks || [],
    ranged: !!def?.attackPattern && def.attackPattern !== "single", hasAbility: true,
    promoPicks: e.promoPicks || [], naturalClass: heroClassId(e), heroTraits: e.heroTraits || [],
  }
}

// --- Class promotions (data/heartwood/promotions.js) --------------------------
// At Lv3 a hero picks 1 of its natural class's 2 advanced classes; at Lv5
// it MASTERS that path or CROSS-TRAINS (also learns the other path's
// skill). A promotion is its own ceremony, on top of the normal level-up
// choice (it never uses up a perk / skill-branch level).

// 0 = none pending, 1 = the Lv3 pick, 2 = the Lv5 pick.
export function pendingPromotionRank(subject) {
  if (!subject || !promotionsFor(subject.naturalClass).length) return 0
  const lv = levelForXp(subject.xp)
  const picks = subject.promoPicks || []
  if (picks.length === 0 && lv >= PROMOTION_LEVELS[0]) return 1
  if (picks.length === 1 && PROMOTIONS[picks[0]] && lv >= PROMOTION_LEVELS[1]) return 2
  return 0
}

// The first hero (Commander last) with a promotion ceremony waiting.
export function nextPendingPromotion(runState) {
  if (!runState?.bench) return null
  for (const e of runState.bench) {
    const s = levelSubject(runState, e.key)
    if (pendingPromotionRank(s)) return s
  }
  const c = levelSubject(runState, "commander")
  return pendingPromotionRank(c) ? c : null
}

// Offer ids: rank 1 = the 2 promotion ids; rank 2 = "master" | "cross".
export function promotionOffers(subject) {
  const rank = pendingPromotionRank(subject)
  if (rank === 1) return promotionsFor(subject.naturalClass).map((p) => p.id)
  if (rank === 2) return ["master", "cross"]
  return []
}

// Levels already spent (a perk or a skill branch each).
export function spentLevels(subject) {
  return subject.perks.length + Object.keys(subject.skillUpgrades || {}).length
}

// Levels earned but not yet spent on a perk / branch.
export function pendingPerkCount(subject) {
  return subject ? Math.max(0, levelForXp(subject.xp) - 1 - spentLevels(subject)) : 0
}

// The first unit (Commander last) with an unspent level, or null.
export function nextPendingLevelUp(runState) {
  if (!runState?.bench) return null
  for (const e of runState.bench) {
    const s = levelSubject(runState, e.key)
    if (pendingPerkCount(s) > 0) return s
  }
  const c = levelSubject(runState, "commander")
  return pendingPerkCount(c) > 0 ? c : null
}

// 3 perk ids for this subject's next level - seeded by run seed + key + level.
export function perkOffers(runState, subject) {
  const level = spentLevels(subject) + 2
  const pool = PERK_IDS.filter((id) => {
    const p = PERKS[id]
    if (!p.stack && (subject.perks.includes(id) || (subject.inheritedPerks || []).includes(id))) return false
    if (p.rangedOnly && !subject.ranged) return false
    if (p.needsAbility && !subject.hasAbility) return false
    return true
  })
  const rng = streamRng(runState.seed || 0, "levels", `${subject.key}:${level}`)
  const out = []
  while (out.length < 3 && pool.length) out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0])
  return out
}

// Skill-tree offer ids: "up:<skillId>:<A|B>".
export function upgradeOfferId(skillId, branch) {
  return `up:${skillId}:${branch}`
}
export function parseOffer(id) {
  const m = /^up:(.+):([AB])$/.exec(id || "")
  return m ? { kind: "upgrade", skillId: m[1], branch: m[2] } : { kind: "perk", perkId: id }
}

// The level-up choice (2-3 cards): both branches of ONE not-yet-upgraded
// skill (seeded by run seed + key + level) + the first stat perk offer.
// No skill left to upgrade = 3 stat perks, as before.
export function levelOffers(runState, subject) {
  const perks = perkOffers(runState, subject)
  const open = (subject.skills || []).filter((sk) => !subject.skillUpgrades?.[sk.id])
  if (!open.length) return perks
  const level = spentLevels(subject) + 2
  const rng = streamRng(runState.seed || 0, "levels", `${subject.key}:${level}:tree`)
  const sk = open[Math.floor(rng() * open.length)]
  return [upgradeOfferId(sk.id, "A"), upgradeOfferId(sk.id, "B"), ...perks.slice(0, 1)]
}

// Stat side of the perks, applied to a tactics unit at fight start; the
// behaviour perks (cleave/quick/thirst) are read by tacticsEngine.js.
function applyPerks(u, perks, xp) {
  const n = (id) => perks.filter((p) => p === id).length
  const hpUp = 3 * n("bark")
  const atkUp = 2 * n("edge")
  const quick = perks.includes("quick") && u.ability
  return {
    ...u,
    xpStart: xp,
    xpGained: 0,
    level: levelForXp(xp),
    perks,
    maxHp: u.maxHp + hpUp,
    hp: u.hp + hpUp,
    attack: u.attack + atkUp,
    baseAttack: (u.baseAttack ?? u.attack) + atkUp,
    move: u.move + (perks.includes("swift") ? 1 : 0),
    range: u.range + (perks.includes("reach") && u.range > 1 ? 1 : 0),
    ap: u.ap + (perks.includes("head") ? 1 : 0),
    ward: (u.ward || 0) + (perks.includes("ward") ? 1 : 0),
    ...(quick ? { quickCast: true, ability: { ...u.ability, cost: Math.max(0, u.ability.cost - 1) } } : {}),
  }
}

// Skill tree: fold chosen branches into the unit's class skills + signature.
function applyTree(u, ups) {
  if (!ups || !Object.keys(ups).length) return u
  const next = applySkillUpgrades(u, ups)
  const sig = ups[SIGNATURE_SKILL_KEY]
  return { ...next, skillUpgrades: ups, ...(sig && u.ability ? { ability: upgradeAbility(u.ability, sig) } : {}) }
}

// Called by runEngine.startTacticsFormationBattle on the built battle.
export function applyLevelsToTactics(battle, runState) {
  if (!battle?.units) return battle
  const keys = runState.deployed.filter((k) => k !== null && runState.bench.some((e) => e.key === k))
  const byId = {}
  keys.forEach((k, i) => {
    const e = runState.bench.find((b) => b.key === k)
    // Breeding: traits inherited from the parents ride along with the
    // hero's own perks / skill branches (its own pick wins on a clash).
    byId[`player-${e.defId}-${i}`] = {
      xp: e.xp || 0,
      perks: [...(e.inheritedPerks || []), ...(e.perks || [])],
      ups: { ...(e.inheritedUpgrades || {}), ...(e.skillUpgrades || {}) },
      age: e.agePenalty || 0,
      mutations: e.mutations || [],
      breedFx: mergeFx(breedFxFor(e), traitFx(e.heroTraits)),
      traits: e.heroTraits || [],
      promo: e.promoPicks || [],
      natural: heroClassId(e),
    }
  })
  byId["player-commander"] = { xp: runState.commanderXp || 0, perks: runState.commanderPerks || [], ups: runState.commanderSkillUpgrades || {}, promo: runState.commanderPromo || [], natural: "commander" }
  return {
    ...battle,
    units: battle.units.map((u) => {
      const b = byId[u.id]
      if (!b) return u
      const leveled = levelMana(applyAge(applyPerks(applyTree(u, b.ups), b.perks, b.xp), b.age), b.xp)
      // Mutations (+ the hatchling's stat bias / resource affinity + traits' numbers).
      const mutated = b.mutations?.length || b.breedFx ? applyMutationsToTactics(leveled, b.mutations, b.breedFx) : leveled
      // Traits (traits.js): conditional bonuses + run-level extras.
      const traited = b.traits?.length ? applyTraitsToTactics(mutated, b.traits) : mutated
      // Promotions (promotions.js): stats, title, + skill/passive/twist on the natural class.
      return b.promo?.length ? applyPromotionToTactics(traited, b.promo, b.natural) : traited
    }),
  }
}

function mergeFx(a, b) {
  if (!a) return b || null
  if (!b) return a
  const out = { ...a }
  for (const [k, v] of Object.entries(b)) out[k] = (out[k] || 0) + v
  return out
}

// Breeding: a hatchling's small stat bias + its resource affinity, as
// mutation-style fx ({ hp, attack, manaMax | manaRegen }), or null.
// The affinity works in full when it matches the hero's own resource
// (e.g. a Rage affinity on a Rage hero), at half strength otherwise.
export function breedFxFor(e) {
  const fx = {}
  if (e?.bias?.hp) fx.hp = e.bias.hp
  if (e?.bias?.attack) fx.attack = e.bias.attack
  const a = e?.affinity
  if (a) {
    const full = a.resource === heroResourceId(e)
    const part = (n) => (full ? n : Math.sign(n) * Math.max(1, Math.round(Math.abs(n) / 2)))
    if (a.max) fx.manaMax = part(a.max)
    if (a.regen) fx.manaRegen = part(a.regen)
  }
  return Object.keys(fx).length ? fx : null
}

// A bench / hearth hero's class (a hatchling's own `classId` wins).
export function heroClassId(e) {
  if (e?.classId && CLASSES[e.classId]) return e.classId
  const def = UNITS[e?.defId]
  if (!def) return null
  return def.classId || fallbackClassId(def, signatureAbilityForDef(def)?.kind)
}

// The resource profile id that hero's class runs on ("rage", "arcane"...).
export function heroResourceId(e) {
  const cid = heroClassId(e)
  const id = CLASSES[cid]?.resource || CLASS_RESOURCE_DEFAULT[cid] || "arcane"
  return RESOURCES[id] ? id : "arcane"
}

// Mana step 1: modest pool scaling, +3 max mana per level above 1 (only
// when the fight runs with mana - the unit then carries `manaMax`).
const LEVEL_MANA = 3
function levelMana(u, xp) {
  if (typeof u.manaMax !== "number") return u
  const add = LEVEL_MANA * (levelForXp(xp || 0) - 1)
  return add > 0 ? { ...u, manaMax: u.manaMax + add, mana: u.mana + add } : u
}

// The Hearth: an old veteran (bench entry `agePenalty` steps) fights a
// little weaker - -2 max HP and -1 attack per step (data/heartwood/hearth.js).
function applyAge(u, steps) {
  if (!steps) return u
  const hpDown = Math.min(u.maxHp - 1, DECLINE_HP * steps)
  const atkDown = Math.min(Math.max(0, u.attack - 1), DECLINE_ATTACK * steps)
  return {
    ...u,
    agePenalty: steps,
    maxHp: u.maxHp - hpDown,
    hp: Math.max(1, Math.min(u.hp, u.maxHp - hpDown)),
    attack: u.attack - atkDown,
    baseAttack: (u.baseAttack ?? u.attack) - atkDown,
  }
}
