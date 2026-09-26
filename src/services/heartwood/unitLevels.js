// Unit levels (sprint 3): units (and the Commander) earn XP in real
// tactics fights and level up between fights, picking 1 of 3 perks.
// As a player reads it:
// - +1 XP for every hit that deals damage, +1 for a support ability
//   (heal, shield, aura, rally, shout), +3 for a kill, +2 for still
//   standing when a fight is won.
// - Levels 1-5. XP needed in total: Lv2 6, Lv3 15, Lv4 28, Lv5 45.
// - Each new level: pick 1 of 3 perks (same offer for the same run seed,
//   unit and level). Perks apply in every later tactics fight.
// Stored on the bench entry: `xp` (total) + `perks` (ids, in pick order);
// the Commander's on runState `commanderXp` / `commanderPerks`. Missing =
// Lv1, 0 XP (old saves load unchanged). Pure data + helpers - no imports
// from either battle engine.
import { streamRng } from "../../data/heartwood/seed"
import { UNITS } from "../../data/heartwood/units"
import { CHARACTERS } from "../../data/heartwood/characters"

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

// The Commander uses key "commander"; everyone else a bench key.
export function levelSubject(runState, key) {
  if (key === "commander") {
    const ch = CHARACTERS[runState.characterId]
    return { key, name: ch?.name || "Your Commander", xp: runState.commanderXp || 0, perks: runState.commanderPerks || [], ranged: !!ch?.attackPattern && ch.attackPattern !== "single", hasAbility: false }
  }
  const e = runState.bench.find((b) => b.key === key)
  if (!e) return null
  const def = UNITS[e.defId]
  return { key, name: def?.name || e.defId, xp: e.xp || 0, perks: e.perks || [], ranged: !!def?.attackPattern && def.attackPattern !== "single", hasAbility: true }
}

// Levels earned but not yet spent on a perk.
export function pendingPerkCount(subject) {
  return subject ? Math.max(0, levelForXp(subject.xp) - 1 - subject.perks.length) : 0
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
  const level = subject.perks.length + 2
  const pool = PERK_IDS.filter((id) => {
    const p = PERKS[id]
    if (!p.stack && subject.perks.includes(id)) return false
    if (p.rangedOnly && !subject.ranged) return false
    if (p.needsAbility && !subject.hasAbility) return false
    return true
  })
  const rng = streamRng(runState.seed || 0, "levels", `${subject.key}:${level}`)
  const out = []
  while (out.length < 3 && pool.length) out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0])
  return out
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

// Called by runEngine.startTacticsFormationBattle on the built battle.
export function applyLevelsToTactics(battle, runState) {
  if (!battle?.units) return battle
  const keys = runState.deployed.filter((k) => k !== null && runState.bench.some((e) => e.key === k))
  const byId = {}
  keys.forEach((k, i) => {
    const e = runState.bench.find((b) => b.key === k)
    byId[`player-${e.defId}-${i}`] = { xp: e.xp || 0, perks: e.perks || [] }
  })
  byId["player-commander"] = { xp: runState.commanderXp || 0, perks: runState.commanderPerks || [] }
  return { ...battle, units: battle.units.map((u) => (byId[u.id] ? applyPerks(u, byId[u.id].perks, byId[u.id].xp) : u)) }
}
