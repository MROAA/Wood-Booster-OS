// The Hearth - persistent home camp between runs. Rules + storage only;
// numbers live in data/heartwood/hearth.js. Everything here is pure
// except load/save (localStorage, try/catch - never breaks a run).
//
// Key: hearthwood-hearth-v1 (separate from run saves + heartwood-meta-v1).
//
// Hearth unit shape:
//   { hid, defId, upgradeLevel, upgrades, xp, perks, skillUpgrades,
//     age, runs, wounded, joinedRun,
//     parents: null, generation: 0, mutations: [],
//     name?, bornRun?, bredRun?, classId?, bias?, affinity?,
//     inheritedPerks: [], inheritedUpgrades: {} }        <- breeding (the Nest)
import { UNITS } from "../../data/heartwood/units"
import { CHARACTERS } from "../../data/heartwood/characters"
import { streamRng } from "../../data/heartwood/seed"
import { levelForXp, heroClassId, heroResourceId, skillTreeFor, PERKS } from "./unitLevels"
import { pickMutation, addMutation } from "./mutations"
import { CLASSES } from "../../data/heartwood/classes"
import { MUTATIONS, BREEDING, MAX_MUTATIONS } from "../../data/heartwood/mutations"
import {
  HEARTH_VERSION, MAX_VETERANS, TRAVEL_HP, OLD_AGE, MAX_DECLINE, ELDER_ESSENCE, MAX_ELDER_BONUS,
  RECRUIT_COST, RECRUIT_OFFERS, MEMORIAL_MAX, HEARTH_ROOMS, CAPACITY_BY_LEVEL, TRAINING_XP_BY_LEVEL,
  WORKSHOP_ESSENCE_BY_LEVEL, roomById, furnitureById, NEST_PAIR_COST, NEST_KIN_RISK, HATCHLING_NAMES,
} from "../../data/heartwood/hearth"

export const HEARTH_KEY = "hearthwood-hearth-v1"
const WOUNDED_HP = 0.25

export function freshHearth() {
  return {
    version: HEARTH_VERSION,
    roster: [],
    memorial: [],
    elders: [], // retired units - later used for breeding
    rooms: Object.fromEntries(HEARTH_ROOMS.map((r) => [r.id, 0])),
    furniture: [],
    permadeath: true,
    runs: 0,
    nextHid: 1,
    recruitUsed: false,
    harvested: [], // run ids already brought home (reload-safe)
    lastReport: null,
    // The Nest: breeding seed + counter, the family book (every parent /
    // hatchling ever, so a family tree survives deaths), the last birth.
    seed: 7919,
    births: 0,
    lineage: {},
    lastBirth: null,
  }
}

const arr = (v) => (Array.isArray(v) ? v : [])

export function normalizeHearth(raw) {
  const base = freshHearth()
  if (!raw || typeof raw !== "object" || raw.version !== HEARTH_VERSION) return base
  const okUnit = (u) => u && typeof u === "object" && UNITS[u.defId]
  const rooms = { ...base.rooms }
  for (const r of HEARTH_ROOMS) {
    const lv = raw.rooms?.[r.id]
    rooms[r.id] = Number.isInteger(lv) ? Math.max(0, Math.min(r.levels.length, lv)) : 0
  }
  return {
    ...base,
    roster: arr(raw.roster).filter(okUnit).map(withHooks),
    memorial: arr(raw.memorial).filter((m) => m && typeof m === "object"),
    elders: arr(raw.elders).filter(okUnit).map(withHooks),
    rooms,
    furniture: arr(raw.furniture).filter((id) => furnitureById(id)),
    permadeath: raw.permadeath !== false,
    runs: Number.isInteger(raw.runs) && raw.runs >= 0 ? raw.runs : 0,
    nextHid: Number.isInteger(raw.nextHid) && raw.nextHid > 0 ? raw.nextHid : 1,
    recruitUsed: !!raw.recruitUsed,
    harvested: arr(raw.harvested).slice(-20),
    lastReport: raw.lastReport && typeof raw.lastReport === "object" ? raw.lastReport : null,
    seed: Number.isInteger(raw.seed) ? raw.seed : base.seed,
    births: Number.isInteger(raw.births) && raw.births >= 0 ? raw.births : 0,
    lineage: raw.lineage && typeof raw.lineage === "object" && !Array.isArray(raw.lineage) ? raw.lineage : {},
    lastBirth: raw.lastBirth && typeof raw.lastBirth === "object" ? raw.lastBirth : null,
  }
}

function withHooks(u) {
  const obj = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {})
  const out = {
    upgradeLevel: 0, xp: 0, age: 0, runs: 0, wounded: false, parents: null, generation: 0,
    ...u,
    upgrades: arr(u.upgrades), perks: arr(u.perks),
    mutations: arr(u.mutations).filter((id) => MUTATIONS[id]).slice(0, MAX_MUTATIONS),
    skillUpgrades: obj(u.skillUpgrades),
    inheritedPerks: arr(u.inheritedPerks).filter((id) => PERKS[id]),
    inheritedUpgrades: obj(u.inheritedUpgrades),
  }
  if (out.classId && !CLASSES[out.classId]) delete out.classId
  return out
}

export function loadHearth() {
  try {
    const raw = localStorage.getItem(HEARTH_KEY)
    return raw ? normalizeHearth(JSON.parse(raw)) : freshHearth()
  } catch {
    return freshHearth()
  }
}

export function saveHearth(hearth) {
  try {
    localStorage.setItem(HEARTH_KEY, JSON.stringify({ ...hearth, version: HEARTH_VERSION }))
  } catch {
    // storage full/disabled - the Hearth just won't persist
  }
}

// ---- derived numbers -------------------------------------------------
const has = (h, id) => arr(h.furniture).includes(id)
export const roomLevel = (h, id) => h.rooms?.[id] || 0
export function rosterCapacity(h) {
  return CAPACITY_BY_LEVEL[roomLevel(h, "barracks")] + (has(h, "bunk") ? 1 : 0)
}
export function trainingXp(h) {
  return TRAINING_XP_BY_LEVEL[roomLevel(h, "training")] + (has(h, "rack") ? 2 : 0)
}
export function travelHp(h) {
  if (roomLevel(h, "infirmary") >= 2) return 1
  return has(h, "kettle") ? 0.9 : TRAVEL_HP
}
export function elderBonus(h) {
  return ELDER_ESSENCE * Math.min(MAX_ELDER_BONUS, arr(h.elders).length)
}
export function startEssenceBonus(h) {
  return WORKSHOP_ESSENCE_BY_LEVEL[roomLevel(h, "workshop")] + (has(h, "map") ? 5 : 0) + elderBonus(h)
}
// Old age: 0 until OLD_AGE, then 1 step per run (max MAX_DECLINE).
export function declineSteps(age) {
  return Math.max(0, Math.min(MAX_DECLINE, (age || 0) - OLD_AGE + 1))
}
export const canRetire = (u) => (u?.age || 0) >= 3
export const unitName = (u) => {
  const def = UNITS[u?.defId]?.name || u?.defId || "Someone"
  return u?.name ? `${u.name} (${def})` : def
}

// ---- spending (Acorns live in metaState; caller deducts `cost`) ------
export function roomUpgradeCost(h, roomId) {
  const room = roomById(roomId)
  const lv = roomLevel(h, roomId)
  return room && lv < room.levels.length ? room.levels[lv].cost : null
}
export function upgradeRoom(h, roomId, acorns) {
  const cost = roomUpgradeCost(h, roomId)
  if (cost == null || acorns < cost) return null
  const next = { ...h, rooms: { ...h.rooms, [roomId]: roomLevel(h, roomId) + 1 } }
  // Infirmary built: everyone at home is patched up right away.
  if (roomId === "infirmary") next.roster = h.roster.map((u) => (u.wounded ? { ...u, wounded: false } : u))
  return { hearth: next, cost }
}
export function buyFurniture(h, id, acorns) {
  const f = furnitureById(id)
  if (!f || has(h, id) || acorns < f.cost) return null
  return { hearth: { ...h, furniture: [...arr(h.furniture), id] }, cost: f.cost }
}

export function recruitOffers(h) {
  const pool = Object.values(UNITS)
    .filter((u) => u.tier === "common" && !u.fusedFrom && !u.summonOnly && !u.evolvedFrom)
    .map((u) => u.id)
    .sort()
  const rng = streamRng(h.runs || 0, "hearth", "recruit")
  const out = []
  while (out.length < Math.min(RECRUIT_OFFERS, pool.length)) {
    const id = pool[Math.floor(rng() * pool.length)]
    if (!out.includes(id)) out.push(id)
  }
  return out
}
export function recruitAtHome(h, defId, acorns) {
  if (h.recruitUsed || acorns < RECRUIT_COST) return null
  if (!recruitOffers(h).includes(defId) || h.roster.length >= rosterCapacity(h)) return null
  const unit = withHooks({ hid: h.nextHid, defId, joinedRun: h.runs })
  return { hearth: { ...h, roster: [...h.roster, unit], nextHid: h.nextHid + 1, recruitUsed: true }, cost: RECRUIT_COST }
}

export function retireUnit(h, hid) {
  const u = h.roster.find((x) => x.hid === hid)
  if (!u || !canRetire(u)) return h
  return { ...h, roster: h.roster.filter((x) => x.hid !== hid), elders: [...arr(h.elders), { ...u, retiredRun: h.runs }] }
}
export function releaseUnit(h, hid) {
  return { ...h, roster: h.roster.filter((x) => x.hid !== hid) }
}
export function setPermadeath(h, on) {
  return { ...h, permadeath: !!on }
}

// ---- run start -------------------------------------------------------
// What startRun needs (runEngine reads meta.hearthStart): bench-ready
// veteran entries (no key yet) + the starting Essence bonus.
export function hearthStartFor(h, vetIds = []) {
  const picks = vetIds
    .slice(0, MAX_VETERANS)
    .map((id) => h.roster.find((u) => u.hid === id))
    .filter(Boolean)
  const xpUp = trainingXp(h)
  const travel = travelHp(h)
  const veterans = picks.map((u) => {
    const wounded = !!u.wounded && roomLevel(h, "infirmary") < 1
    const hp = wounded ? WOUNDED_HP : travel
    return {
      defId: u.defId,
      upgradeLevel: u.upgradeLevel || 0,
      upgrades: [...u.upgrades],
      xp: (u.xp || 0) + xpUp,
      perks: [...u.perks],
      skillUpgrades: { ...u.skillUpgrades },
      ...(hp < 1 ? { hpPct: hp } : {}),
      ...(wounded ? { wounded: true } : {}),
      hearthId: u.hid,
      veteran: true,
      // Breeding + mutations ride along into the run (unitLevels applies them).
      ...(u.mutations?.length ? { mutations: [...u.mutations] } : {}),
      ...(u.classId ? { classId: u.classId } : {}),
      ...(u.bias ? { bias: { ...u.bias } } : {}),
      ...(u.affinity ? { affinity: { ...u.affinity } } : {}),
      ...(u.inheritedPerks?.length ? { inheritedPerks: [...u.inheritedPerks] } : {}),
      ...(Object.keys(u.inheritedUpgrades || {}).length ? { inheritedUpgrades: { ...u.inheritedUpgrades } } : {}),
      age: u.age || 0,
      ...(declineSteps(u.age) ? { agePenalty: declineSteps(u.age) } : {}),
    }
  })
  return { veterans, essenceBonus: startEssenceBonus(h) }
}

// ---- run end ---------------------------------------------------------
// Bench keys of units that fell in the run's final (lost) fight.
export function fallenKeys(runState) {
  const battle = runState?.battle
  const tactics = Array.isArray(battle?.units)
  const list = tactics ? battle.units : battle?.playerUnits
  if (!Array.isArray(list)) return new Set()
  const keys = (runState.deployed || []).filter((k) => k !== null && runState.bench.some((e) => e.key === k))
  const out = new Set()
  keys.forEach((k, i) => {
    const e = runState.bench.find((b) => b.key === k)
    const u = list.find((x) => x.id === (tactics ? `player-${e.defId}-${i}` : `p${i}`))
    if (u && u.hp <= 0) out.add(k)
  })
  return out
}

// Brings a finished run's survivors home. `won` = victory. Returns
// { hearth, report } - report = plain lists for the UI. Idempotent per runId.
export function harvestRun(h, runState, won, runId) {
  if (!runState || !Array.isArray(runState.bench)) return { hearth: h, report: null }
  const id = String(runId ?? runState.seed ?? "")
  if (id && arr(h.harvested).includes(id)) return { hearth: h, report: h.lastReport }
  const fell = won ? new Set() : fallenKeys(runState)
  const heal = roomLevel(h, "infirmary") >= 1
  let nextHid = h.nextHid
  const report = { won, home: [], fallen: [], parted: [], noRoom: [], aged: [] }
  const commander = CHARACTERS[runState.characterId]?.name || null
  const memorial = [...arr(h.memorial)]
  const updated = new Map() // hid -> unit
  const fresh = []

  for (const e of runState.bench) {
    if (!UNITS[e.defId]) continue
    const prev = e.hearthId != null ? h.roster.find((u) => u.hid === e.hearthId) : null
    const level = levelForXp(e.xp)
    const died = fell.has(e.key) && h.permadeath
    if (died) {
      memorial.unshift({
        name: unitName(e), defId: e.defId, level, age: (prev?.age || 0) + 1, run: h.runs + 1,
        commander, veteran: !!prev,
      })
      report.fallen.push(unitName(e))
      if (prev) updated.set(prev.hid, null)
      continue
    }
    const unit = withHooks({
      ...(prev || { hid: nextHid++, joinedRun: h.runs + 1 }),
      defId: e.defId, // evolutions change the def - keep the grown form
      upgradeLevel: e.upgradeLevel || 0,
      upgrades: arr(e.upgrades),
      xp: e.xp || 0,
      perks: arr(e.perks),
      skillUpgrades: e.skillUpgrades || {},
      // Mutations grown during the run come home too.
      mutations: Array.isArray(e.mutations) ? e.mutations : arr(prev?.mutations),
      age: (prev?.age || 0) + 1,
      runs: (prev?.runs || 0) + 1,
      wounded: heal ? false : !!(e.wounded || fell.has(e.key)),
    })
    if (declineSteps(unit.age) > declineSteps(unit.age - 1)) report.aged.push(unitName(unit))
    if (prev) updated.set(prev.hid, unit)
    else fresh.push(unit)
  }

  // Veterans that went out but are no longer on the bench were sold or
  // merged into a stronger unit - they leave the Hearth.
  for (const hid of arr(runState.hearthVeteranIds)) {
    if (!updated.has(hid)) {
      const u = h.roster.find((x) => x.hid === hid)
      if (u) {
        report.parted.push(unitName(u))
        updated.set(hid, null)
      }
    }
  }

  const roster = h.roster.map((u) => (updated.has(u.hid) ? updated.get(u.hid) : u)).filter(Boolean)
  report.home = roster.filter((u) => updated.get(u.hid)).map(unitName)
  // New arrivals fill the Barracks, best first; the rest stay behind.
  const cap = rosterCapacity(h)
  const sorted = [...fresh].sort((a, b) => (b.xp || 0) - (a.xp || 0))
  for (const u of sorted) {
    if (roster.length < cap) {
      roster.push(u)
      report.home.push(unitName(u))
    } else report.noRoom.push(unitName(u))
  }

  const hearth = {
    ...h,
    roster,
    memorial: memorial.slice(0, MEMORIAL_MAX),
    nextHid,
    runs: h.runs + 1,
    recruitUsed: false,
    harvested: id ? [...arr(h.harvested), id].slice(-20) : arr(h.harvested),
    lastReport: report,
  }
  return { hearth, report }
}

// ---- the Nest: breeding -------------------------------------------------
// Two heroes at home (roster or Elders) raise a hatchling. Deterministic:
// hearth `seed` + the pair + the birth counter (tests reproduce).
export const allHeroes = (h) => [...arr(h.roster), ...arr(h.elders)]
export function heroByHid(h, hid) {
  return allHeroes(h).find((u) => u.hid === hid) || null
}
// A hero or a family-book entry (parents that died or left stay listed).
export function lineageEntry(h, hid) {
  return heroByHid(h, hid) || h.lineage?.[hid] || null
}
export function parentsOf(h, hid) {
  return arr(lineageEntry(h, hid)?.parents)
}

// hid -> how many generations up (self = 0), up to `depth`.
export function ancestorDepths(h, hid, depth = 4) {
  const out = new Map([[hid, 0]])
  let wave = [hid]
  for (let d = 1; d <= depth; d++) {
    const next = []
    for (const id of wave) {
      for (const p of parentsOf(h, id)) {
        if (out.has(p)) continue
        out.set(p, d)
        next.push(p)
      }
    }
    wave = next
  }
  return out
}

// Coefficient of relationship: parent+child / full siblings 0.5, half
// siblings / grandparent 0.25, cousins 0.125, strangers 0.
export function kinship(h, a, b) {
  if (a == null || b == null || a === b) return 0
  const A = ancestorDepths(h, a)
  const B = ancestorDepths(h, b)
  const common = [...A.keys()].filter((id) => B.has(id))
  // Only the closest shared ancestors count (not their own ancestors).
  const closest = common.filter((c) => !common.some((x) => x !== c && ancestorDepths(h, x).has(c)))
  const r = closest.reduce((s, c) => s + Math.pow(0.5, A.get(c) + B.get(c)), 0)
  return Math.min(1, r)
}
export function kinLabel(r) {
  if (r >= 0.5) return "Close family"
  if (r >= 0.25) return "Related"
  if (r > 0) return "Distant cousins"
  return "Unrelated"
}

export const nestLevel = (h) => roomLevel(h, "nest")
export function breedCost(h) {
  return NEST_PAIR_COST[nestLevel(h)] ?? null
}
export function badMutationChance(h, a, b) {
  return Math.min(0.9, BREEDING.badBase + BREEDING.badPerKin * kinship(h, a, b) * (NEST_KIN_RISK[nestLevel(h)] ?? 1))
}
export const bredThisCycle = (h, u) => u?.bredRun === h.runs

// Why a pairing can't happen (plain English), or null when it can.
export function breedBlocker(h, a, b, acorns) {
  if (!nestLevel(h)) return "Build the Nest first."
  const A = heroByHid(h, a)
  const B = heroByHid(h, b)
  if (!A || !B) return "Pick two heroes."
  if (a === b) return "Pick two different heroes."
  if (bredThisCycle(h, A) || bredThisCycle(h, B)) return "Each hero can raise one hatchling per run. Come back after the next run."
  if (h.roster.length >= rosterCapacity(h)) return "The Barracks are full - make room for the hatchling first."
  if (acorns < breedCost(h)) return `Not enough Acorns (${breedCost(h)} needed).`
  return null
}

// Every trait a parent could pass on: its perks + skill branches.
function traitPool(u) {
  const out = []
  for (const id of [...arr(u.perks), ...arr(u.inheritedPerks)]) if (PERKS[id] && !out.some((t) => t.perk === id)) out.push({ perk: id })
  for (const [skillId, branch] of Object.entries({ ...(u.inheritedUpgrades || {}), ...(u.skillUpgrades || {}) })) out.push({ skillId, branch })
  return out
}

const isRangedDef = (def) => !!def?.attackPattern && def.attackPattern !== "single"

// The hatchling of A x B (pure, seeded). Returns the new hero.
export function hatchling(h, a, b) {
  const A = heroByHid(h, a)
  const B = heroByHid(h, b)
  const [lo, hi] = a < b ? [a, b] : [b, a]
  const rng = streamRng(h.seed ?? 0, "breed", `${lo}:${hi}:${h.births || 0}`)
  const leadIsA = rng() < 0.5
  const lead = leadIsA ? A : B
  const other = leadIsA ? B : A
  const defId = lead.defId
  // Class: the lead parent's, or rarely the OTHER parent's (cross-class).
  const leadClass = heroClassId(lead)
  const otherClass = heroClassId(other)
  const cross = !!otherClass && otherClass !== leadClass && rng() < BREEDING.crossClassChance
  const classId = cross ? otherClass : leadClass
  const natural = heroClassId({ defId })
  // Stat bias: stronger parents give a slightly sturdier hatchling.
  const lvA = levelForXp(A.xp)
  const lvB = levelForXp(B.xp)
  const swing = [-1, 0, 1][Math.floor(rng() * 3)]
  const bias = {
    hp: Math.max(-2, Math.min(3, Math.round(((lvA + lvB) / 2 - 1) / 2) + swing)),
    attack: Math.max(-1, Math.min(2, (lvA >= 4 && lvB >= 4 ? 1 : 0) + (rng() < 0.25 ? 1 : 0) - (rng() < 0.2 ? 1 : 0))),
  }
  // One trait from each parent (a skill branch only if the hatchling's class has that skill).
  const tree = skillTreeFor({ ...UNITS[defId], classId })
  const inheritedPerks = []
  const inheritedUpgrades = {}
  const traits = []
  for (const parent of [A, B]) {
    const pool = traitPool(parent).filter((t) =>
      t.perk
        ? !inheritedPerks.includes(t.perk) && !(PERKS[t.perk].rangedOnly && !isRangedDef(UNITS[defId]))
        : tree.some((sk) => sk.id === t.skillId && sk.upgrades?.[t.branch]) && !inheritedUpgrades[t.skillId],
    )
    if (!pool.length) continue
    const t = pool[Math.floor(rng() * pool.length)]
    if (t.perk) {
      inheritedPerks.push(t.perk)
      traits.push({ from: parent.hid, text: `${PERKS[t.perk].icon} ${PERKS[t.perk].name}` })
    } else {
      inheritedUpgrades[t.skillId] = t.branch
      const sk = tree.find((x) => x.id === t.skillId)
      traits.push({ from: parent.hid, text: `★ ${sk.upgrades[t.branch].name}` })
    }
  }
  // Resource affinity: from one parent - its own affinity (50%) or its resource.
  const src = rng() < 0.5 ? A : B
  const kept = !!src.affinity && rng() < 0.5
  const affinity = kept
    ? { ...src.affinity }
    : { resource: heroResourceId(src), ...(rng() < 0.5 ? { max: BREEDING.affinityMax } : { regen: BREEDING.affinityRegen }) }
  // Mutations: each parent's may pass on; a fresh one; close kin risk a bad one.
  let mutations = []
  for (const id of [...arr(A.mutations), ...arr(B.mutations)]) if (rng() < BREEDING.inheritChance) mutations = addMutation(mutations, id)
  if (rng() < BREEDING.freshChance) mutations = addMutation(mutations, pickMutation(rng, { kind: "any", exclude: mutations }))
  if (rng() < badMutationChance(h, a, b)) mutations = addMutation(mutations, pickMutation(rng, { kind: "bad", exclude: mutations }))
  const name = HATCHLING_NAMES[Math.floor(rng() * HATCHLING_NAMES.length)]
  return withHooks({
    hid: h.nextHid,
    defId,
    name,
    joinedRun: h.runs,
    bornRun: h.runs,
    parents: [A.hid, B.hid],
    generation: Math.max(A.generation || 0, B.generation || 0) + 1,
    ...(classId && classId !== natural ? { classId } : {}),
    bias,
    affinity,
    inheritedPerks,
    inheritedUpgrades,
    mutations,
    traits,
  })
}

const bookEntry = (u) => ({ name: unitName(u), defId: u.defId, parents: u.parents || null, generation: u.generation || 0 })

// Pair two heroes at the Nest. Returns { hearth, cost, child } or null.
export function breedHeroes(h, a, b, acorns) {
  if (breedBlocker(h, a, b, acorns)) return null
  const cost = breedCost(h)
  const child = hatchling(h, a, b)
  const mark = (u) => (u.hid === a || u.hid === b ? { ...u, bredRun: h.runs } : u)
  const hearth = {
    ...h,
    roster: [...h.roster.map(mark), child],
    elders: arr(h.elders).map(mark),
    nextHid: h.nextHid + 1,
    births: (h.births || 0) + 1,
    lineage: { ...(h.lineage || {}), [a]: bookEntry(heroByHid(h, a)), [b]: bookEntry(heroByHid(h, b)), [child.hid]: bookEntry(child) },
    lastBirth: { hid: child.hid, name: unitName(child), parents: [unitName(heroByHid(h, a)), unitName(heroByHid(h, b))] },
  }
  return { hearth, cost, child }
}

// Family tree for the hero card: self -> parents -> grandparents.
export function familyTree(h, hid, depth = 2) {
  const node = (id, d) => {
    const e = lineageEntry(h, id)
    if (!e) return { hid: id, name: "Unknown", gone: true, parents: [] }
    const alive = !!heroByHid(h, id)
    return {
      hid: id,
      name: alive ? unitName(e) : e.name || unitName(e),
      gone: !alive,
      generation: e.generation || 0,
      parents: d < depth ? arr(e.parents).map((p) => node(p, d + 1)) : [],
    }
  }
  return node(hid, 0)
}
