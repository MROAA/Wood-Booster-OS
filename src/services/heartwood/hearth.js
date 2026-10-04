// The Hearth - persistent home camp between runs. Rules + storage only;
// numbers live in data/heartwood/hearth.js. Everything here is pure
// except load/save (localStorage, try/catch - never breaks a run).
//
// Key: hearthwood-hearth-v1 (separate from run saves + heartwood-meta-v1).
//
// Hearth unit shape:
//   { hid, defId, upgradeLevel, upgrades, xp, perks, skillUpgrades,
//     age, runs, wounded, joinedRun,
//     parents: null, generation: 0, mutations: [] }   <- breeding hooks
import { UNITS } from "../../data/heartwood/units"
import { CHARACTERS } from "../../data/heartwood/characters"
import { streamRng } from "../../data/heartwood/seed"
import { levelForXp } from "./unitLevels"
import {
  HEARTH_VERSION, MAX_VETERANS, TRAVEL_HP, OLD_AGE, MAX_DECLINE, ELDER_ESSENCE, MAX_ELDER_BONUS,
  RECRUIT_COST, RECRUIT_OFFERS, MEMORIAL_MAX, HEARTH_ROOMS, CAPACITY_BY_LEVEL, TRAINING_XP_BY_LEVEL,
  WORKSHOP_ESSENCE_BY_LEVEL, roomById, furnitureById,
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
  }
}

function withHooks(u) {
  return {
    upgradeLevel: 0, xp: 0, age: 0, runs: 0, wounded: false, parents: null, generation: 0,
    ...u,
    upgrades: arr(u.upgrades), perks: arr(u.perks), mutations: arr(u.mutations),
    skillUpgrades: u.skillUpgrades && typeof u.skillUpgrades === "object" ? u.skillUpgrades : {},
  }
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
export const unitName = (u) => UNITS[u?.defId]?.name || u?.defId || "Someone"

// ---- spending (Acorns live in metaState; caller deducts `cost`) ------
export function roomUpgradeCost(h, roomId) {
  const room = roomById(roomId)
  const lv = roomLevel(h, roomId)
  return room && lv < room.levels.length ? room.levels[lv].cost : null
}
export function upgradeRoom(h, roomId, acorns) {
  const cost = roomUpgradeCost(h, roomId)
  if (cost == null || acorns < cost) return null
  return { hearth: { ...h, rooms: { ...h.rooms, [roomId]: roomLevel(h, roomId) + 1 } }, cost }
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
