// Hearthwood Frontier - smarter enemies (difficulty sprint 2). Two layers
// on top of the engine's scored enemy AI (decideEnemyIntent):
//
// 1. INTELLIGENCE TIER (tacticsDifficulty AI_TRAITS, Progressive Challenge
//    PRD §14): focus fire on wounded heroes, fall back when badly hurt,
//    take cover from shooters, go around tanks, guard casters, spread out
//    against area attacks, lie in ambush.
// 2. BEHAVIOUR PROFILES (Marc: "enemies feel alike"): every enemy plays a
//    readable part - Berserker, Assassin, Guardian, Caster, Swarmer,
//    Summoner, Marksman - picked from its kit, shown on its token.
//
// Only fights with a DifficultyEngine spec (state.difficulty: real runs,
// the prototype's ?threat=N) use any of this; hand-built test states and
// the QA hook (difficultyQa) play exactly as before. Everything is a pure
// score bonus - deterministic, so previewEnemyIntents stays an exact
// dry-run of the real enemy turn.
import { roleOf } from "./tacticsRoles"
import { enemySkillsFor } from "./tacticsEnemyAbilities"
import { coverAgainst } from "./tacticsCover"
import { isHigh } from "./tacticsTerrain"
import { hasAiTrait } from "./tacticsDifficulty"

// --- Behaviour profiles ------------------------------------------------------------------

export const BEHAVIORS = {
  berserker: { id: "berserker", name: "Berserker", icon: "🪓", text: "charges the nearest hero and never backs down" },
  assassin: { id: "assassin", name: "Assassin", icon: "🗡", text: "dives your backline and your most wounded heroes" },
  guardian: { id: "guardian", name: "Guardian", icon: "🛡", text: "body-blocks for its allies and punishes whoever threatens them" },
  caster: { id: "caster", name: "Caster", icon: "✧", text: "keeps its distance and channels from safety" },
  swarmer: { id: "swarmer", name: "Swarmer", icon: "⁂", text: "surrounds one hero with its pack" },
  summoner: { id: "summoner", name: "Summoner", icon: "❖", text: "hides behind the others while its minions fight" },
  marksman: { id: "marksman", name: "Marksman", icon: "➶", text: "seeks high ground and cover, then picks you off" },
}
export const BEHAVIOR_IDS = Object.keys(BEHAVIORS)

// Picked from the enemy's own kit (pure; a unit's own `behavior` wins).
export function behaviorOf(unit, state = null) {
  if (!unit || unit.side !== "enemy" || unit.structure) return null
  if (unit.behavior && BEHAVIORS[unit.behavior]) return unit.behavior
  const kinds = new Set(enemySkillsFor(unit).map((s) => s.kind))
  const role = roleOf(unit)
  const ranged = (unit.range || 1) > 1
  if (kinds.has("summon")) return "summoner"
  if (role === "tank") return "guardian"
  if (role === "healer" || role === "support" || role === "control") return ranged || kinds.has("mend") ? "caster" : "guardian"
  if (ranged) return kinds.has("hex") || kinds.has("drain") || kinds.has("volley") ? "caster" : "marksman"
  if (kinds.has("enrage") || kinds.has("shove")) return "berserker"
  if (kinds.has("pounce") || unit.skirmisher) return "assassin"
  // Packs of the same small beast swarm.
  const pack = state ? state.units.filter((u) => u.side === "enemy" && u.hp > 0 && u.defId === unit.defId).length : 1
  if (pack >= 2 || unit.maxHp <= 22) return "swarmer"
  return unit.maxHp >= 40 ? "berserker" : "assassin"
}

export function behaviorInfo(unit, state = null) {
  const id = behaviorOf(unit, state)
  return id ? BEHAVIORS[id] : null
}

// Profiles are live only in a difficulty fight that isn't the QA hook.
export function behaviorsOn(state) {
  return !!state?.difficulty && !state.difficulty.qa
}
const activeBehavior = (state, enemy) => (behaviorsOn(state) ? behaviorOf(enemy, state) : null)

// --- Shared reads ------------------------------------------------------------------------------

const cheb = (a, b) => Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col))
const living = (state, side) => state.units.filter((u) => u.side === side && u.hp > 0)
const heroes = (state) => living(state, "player").filter((u) => !u.structure)
const moveOf = (u) => (u.slow > 0 ? Math.max(1, (u.move || 0) - 1) : u.move || 0)
const exposureAt = (state, pos) => heroes(state).filter((u) => u.attack > 0 && cheb(u.pos, pos) <= moveOf(u) + (u.range || 1)).length
const nearestHeroDist = (state, pos) => Math.min(99, ...heroes(state).map((h) => cheb(h.pos, pos)))
const isCaster = (u) => {
  const r = roleOf(u)
  return r === "healer" || r === "support" || r === "control" || ((u.range || 1) > 1 && r !== "tank")
}

// Area attacks in the squad (class skills / signature with an area).
const AOE_KINDS = new Set(["cleave", "aoe", "aura-block", "nova", "whirlwind", "blast"])
const aoeCache = new WeakMap()
export function squadHasAoe(state) {
  if (aoeCache.has(state.units)) return aoeCache.get(state.units)
  const yes = heroes(state).some(
    (u) => AOE_KINDS.has(u.ability?.kind) || (u.classSkills || []).some((sk) => sk.radius > 0 || sk.area || sk.aoe || AOE_KINDS.has(sk.kind) || /nova|blast|storm|quake|cleave|whirl|volley|barrage/i.test(sk.id || "")),
  )
  aoeCache.set(state.units, yes)
  return yes
}

// --- Retreat ----------------------------------------------------------------------------------

export const RETREAT_HP = 0.35
export function isRetreating(state, enemy) {
  if (!hasAiTrait(state, "retreat") || state.difficulty?.qa) return false
  if (!enemy || enemy.structure || (enemy.phases?.length || 0) > 0 || enemy.ult?.boss) return false
  if (activeBehavior(state, enemy) === "berserker") return false
  return enemy.hp <= enemy.maxHp * RETREAT_HP
}

// --- Score bonuses -------------------------------------------------------------------------------

// Who to walk toward (no hit this turn).
export function focusBonus(state, enemy, target) {
  if (!state?.difficulty || state.difficulty.qa) return 0
  let b = 0
  const hurt = 1 - target.hp / target.maxHp
  if (hasAiTrait(state, "focus")) b += 20 * hurt + (target.wounded ? 8 : 0)
  if (hasAiTrait(state, "flank") && roleOf(target) === "tank") b -= 25
  switch (activeBehavior(state, enemy)) {
    case "berserker":
      b -= 6 * cheb(enemy.pos, target.pos)
      break
    case "assassin":
      b += ((target.range || 1) > 1 || ["healer", "support", "control"].includes(roleOf(target)) ? 25 : 0) + 25 * hurt + 3 * cheb(enemy.pos, target.pos)
      break
    case "swarmer":
      b += 8 * living(state, "enemy").filter((e) => e.id !== enemy.id && cheb(e.pos, target.pos) <= 1).length
      break
    default:
  }
  return b
}

// An attack on `target` from `pos`.
export function attackBonus(state, enemy, target, { killP = 0, facing = "front" } = {}) {
  if (!state?.difficulty || state.difficulty.qa || target.structure) return 0
  let b = 0
  const hurt = 1 - target.hp / target.maxHp
  if (hasAiTrait(state, "focus")) b += 25 * hurt + (target.wounded ? 10 : 0)
  if (hasAiTrait(state, "flank")) {
    if (roleOf(target) === "tank" && killP < 1) b -= 18
    if (facing === "side") b += 4
    if (facing === "back") b += 8
  }
  if (isRetreating(state, enemy) && killP < 0.5) b -= 300
  switch (activeBehavior(state, enemy)) {
    case "berserker": {
      const nearest = Math.min(...heroes(state).map((h) => cheb(enemy.pos, h.pos)))
      if (cheb(enemy.pos, target.pos) <= nearest) b += 15
      break
    }
    case "assassin":
      b += ((target.range || 1) > 1 || ["healer", "support", "control"].includes(roleOf(target)) ? 18 : 0) + 20 * hurt + (facing === "back" ? 6 : 0)
      break
    case "guardian": {
      const guarded = living(state, "enemy").some((e) => e.id !== enemy.id && isCaster(e) && cheb(e.pos, target.pos) <= 2)
      if (guarded) b += 12
      break
    }
    case "swarmer":
      b += Math.min(30, 10 * living(state, "enemy").filter((e) => e.id !== enemy.id && cheb(e.pos, target.pos) <= 1).length)
      break
    default:
  }
  return b
}

// Where to stand.
export function tileBonus(state, enemy, pos) {
  if (!state?.difficulty || state.difficulty.qa) return 0
  let b = 0
  const hs = heroes(state)
  if (!hs.length) return 0
  const nearest = nearestHeroDist(state, pos)
  if (hasAiTrait(state, "cover")) {
    for (const h of hs) {
      if ((h.range || 1) <= 1 || !(h.attack > 0) || cheb(h.pos, pos) > moveOf(h) + h.range) continue
      b += 3 * coverAgainst(state, pos, h.pos)
    }
  }
  if (isRetreating(state, enemy)) b += 6 * Math.min(4, nearest) - 3 * exposureAt(state, pos)
  const allies = living(state, "enemy").filter((e) => e.id !== enemy.id && !e.structure)
  if (hasAiTrait(state, "flank") && roleOf(enemy) !== "tank") {
    b -= 5 * hs.filter((h) => roleOf(h) === "tank" && h.range === 1 && cheb(h.pos, pos) <= 1).length
  }
  if (hasAiTrait(state, "protect") && !isCaster(enemy)) {
    const guards = allies.filter((a) => isCaster(a) && cheb(a.pos, pos) <= 1 && exposureAt(state, a.pos) > 0).length
    b += Math.min(10, 5 * guards)
  }
  if (hasAiTrait(state, "spread") && squadHasAoe(state)) {
    b -= 4 * allies.filter((a) => cheb(a.pos, pos) <= 1).length
  }
  // Mana Wells pull casters and anyone charging an ultimate.
  if ((state.terrain || {})[`${pos.row}-${pos.col}`] === "manawell" && (enemy.ult || isCaster(enemy))) b += 6
  switch (activeBehavior(state, enemy)) {
    case "guardian": {
      const covering = allies.filter((a) => a.id !== enemy.id && cheb(a.pos, pos) <= 1 && nearestHeroDist(state, a.pos) > nearest).length
      b += Math.min(16, 8 * covering)
      break
    }
    case "caster":
      b += nearest <= 1 ? -10 : nearest === 2 ? -4 : 3
      if (pos.row === enemy.pos.row && pos.col === enemy.pos.col) b += 3
      break
    case "summoner": {
      b -= 6 * exposureAt(state, pos)
      const shield = allies.some((a) => cheb(a.pos, pos) <= 2 && nearestHeroDist(state, a.pos) < nearest)
      if (shield) b += 5
      break
    }
    case "marksman":
      if (isHigh(state, pos)) b += 6
      for (const h of hs) if (cheb(h.pos, pos) <= moveOf(h) + (h.range || 1)) b += 2 * coverAgainst(state, pos, h.pos)
      break
    case "swarmer":
      for (const h of hs) {
        if (cheb(h.pos, pos) !== 1) continue
        b += 5 * allies.filter((a) => cheb(a.pos, h.pos) <= 1).length
      }
      break
    default:
  }
  return b
}

// How hard the approach option pulls toward the focus (1 = normal).
export function approachWeight(state, enemy) {
  if (!state?.difficulty || state.difficulty.qa) return 1
  if (isRetreating(state, enemy)) return 0
  const beh = activeBehavior(state, enemy)
  if (beh === "berserker") return 1.5
  if (beh === "summoner") return 0.3
  if (beh === "caster") return 0.6
  return 1
}

// Tier 4: a melee enemy with no strike this turn holds a guarded spot in
// ambush (Overwatch) instead of walking into the squad's reach. Not two
// turns in a row, and only while healthy.
export function shouldAmbush(state, enemy, moveTo) {
  if (!hasAiTrait(state, "ambush") || state.difficulty?.qa) return false
  if (!enemy || (enemy.range || 1) > 1 || !(enemy.attack > 0) || enemy.ap < 1 || enemy.structure) return false
  if (activeBehavior(state, enemy) === "berserker") return false
  if (enemy.hp < enemy.maxHp * 0.5 || (enemy.ambushTurn != null && state.turn - enemy.ambushTurn < 2)) return false
  const dest = moveTo || enemy.pos
  const hs = heroes(state)
  const close = hs.some((h) => cheb(h.pos, enemy.pos) <= moveOf(h) + 1)
  return close && exposureAt(state, dest) >= 2
}
