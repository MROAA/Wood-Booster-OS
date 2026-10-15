// Hearthwood - THE LONG CAMPAIGN (part 1). One save, many evenings.
//
// Purpose: the XCOM-style strategic layer around the tactics fights - a
// day counter, a world map of regions whose threat rises while you look
// away, expiring missions, a doom clock, a big roster with fatigue and
// healing that take days, permadeath + a Memorial, and a Hearth base
// whose rooms take days to build.
//
// Responsibilities:
//   - campaign state + save shape (createCampaign / serializeCampaign /
//     deserializeCampaign; storage key CAMPAIGN_SAVE_KEY)
//   - the day loop (advanceDay): healing, fatigue, training, building,
//     threat, doom, mission spawn + expiry, recruit offers, game over
//   - a mission's fight: missionRunState builds an ordinary run state for
//     ONE fight so the existing bridge (runEngine.startTacticsFormationBattle
//     + tacticsRealMatchup.buildRunTacticsBattle) builds it - heroes, relics,
//     gear, identity, levels, mana, difficulty, fates and sets all work
//     exactly as in the Expedition run. resolveMission reads the result
//     back (runEngine.campaignFightAftermath) and applies permadeath.
//
// Dependencies: runEngine (startRun, RUN_PATH, actIndexForNode,
// campaignFightAftermath, chooseLevelPerk, choosePromotion, equipItem,
// unequipItem), traits/heroIdentity (rolls), seed.js streamRng.
// Pure + deterministic: every roll is streamRng(seed, "world", salt).
// No localStorage here except loadCampaign/saveCampaign/clearCampaign
// and the unlock store (try/catch, never throws).
//
// Public API: see the exports below. Examples: .scratch/verify_campaign.mjs.
import { UNITS } from "../../data/heartwood/units"
import { CHARACTERS } from "../../data/heartwood/characters"
import { ITEMS, itemPool } from "../../data/heartwood/items"
import { relicPool } from "../../data/heartwood/relics"
import { streamRng } from "../../data/heartwood/seed"
import { roomById } from "../../data/heartwood/hearth"
import {
  CAMPAIGN_VERSION, CAMPAIGN_SAVE_KEY, CAMPAIGN_UNLOCKS_KEY, CAMPAIGN_DIFFICULTIES, DEFAULT_DIFFICULTY,
  THREAT_THREATENED, THREAT_FALLEN, CAMPAIGN_REGIONS, CAMPAIGN_ROADS, MISSION_TYPES, STORY_CHAPTERS, MAX_CHAPTER,
  STORY_AFTER_WINS, DOOM_PER_FALL, DOOM_PER_WIPE, DOOM_EVERY_DAYS, DOOM_STORY_RELIEF, FALLEN_ENEMY_BONUS,
  DOOM_ENEMY_BONUS, IGNORED_THREAT, FAILED_THREAT, FALLEN_NEIGHBOUR_THREAT, START_ROSTER, SQUAD_MIN, SQUAD_MAX,
  TIRED_DAYS, DEPLOY_MIN_HP, HEAL_PER_DAY, RECRUIT_BASE_COST, RECRUIT_COST_PER_CHAPTER, ROOKIE_OFFERS_ON_WIPE,
  ATTUNE_COST, ATTUNE_MANA, ATTUNE_MAX, LEY_MISSION_OVERCHARGE, LEY_REGION_OVERCHARGE, CAMPAIGN_ROOMS,
  ROSTER_CAP_BY_LEVEL, HEAL_BONUS_BY_LEVEL, TRAINING_XP_BY_DAY, LEY_WELL_MANA, LEY_WELL_OVERCHARGE,
  RECRUIT_EVERY_DAYS, RECRUIT_OFFER_COUNT, HERO_NAMES, CAMPAIGN_UNLOCKS, campaignRoomDef, regionDef,
} from "../../data/heartwood/campaign"
import {
  startRun, RUN_PATH, actIndexForNode, campaignFightAftermath, chooseLevelPerk, choosePromotion, equipItem, unequipItem,
} from "./runEngine"
import { rollTraits } from "./traits"
import { rollQuirks, identityOf } from "./heroIdentity"
import { levelForXp } from "./unitLevels"

const arr = (v) => (Array.isArray(v) ? v : [])
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n))
const rngFor = (c, salt) => streamRng(c.seed, "world", salt)
const pick = (list, rng) => (list.length ? list[Math.floor(rng() * list.length)] : null)

// ---------------------------------------------------------------------------
// Hero pool + RUN_PATH lookups
// ---------------------------------------------------------------------------

const RECRUITABLE = (tier) =>
  Object.values(UNITS).filter((u) => u.tier === tier && u.classId && !u.fusedFrom && !u.summonOnly && !u.evolvedFrom && u.recruitCost != null)

// RUN_PATH node indexes by Act + node type (computed once).
const NODES_BY_ACT = (() => {
  const out = {}
  RUN_PATH.forEach((n, i) => {
    const act = actIndexForNode(i, RUN_PATH.length)
    const slot = (out[act] ||= { battle: [], elite: [], story: [] })
    if (n.type === "battle") slot.battle.push(i)
    if (n.type === "elite") slot.elite.push(i)
    if (n.type === "elite" || n.type === "miniboss" || n.type === "boss") slot.story.push(i)
  })
  return out
})()

// The node a mission of `kind` fights at Act `act` (seeded pick).
export function missionNodeIndex(act, kind, rng) {
  const a = clamp(act, 1, 7)
  if (kind === "story") {
    // The strongest fight of the Act (its miniboss / boss / last elite).
    for (let x = a; x >= 1; x--) if (NODES_BY_ACT[x]?.story.length) return NODES_BY_ACT[x].story[NODES_BY_ACT[x].story.length - 1]
  }
  if (kind === "elite") {
    for (const x of [a, a + 1, a - 1, a + 2, a - 2]) {
      const list = NODES_BY_ACT[x]?.elite
      if (list?.length) return pick(list, rng)
    }
  }
  return pick(NODES_BY_ACT[a]?.battle || NODES_BY_ACT[1].battle, rng)
}

export function difficultyOf(c) {
  return CAMPAIGN_DIFFICULTIES[c?.difficulty] || CAMPAIGN_DIFFICULTIES[DEFAULT_DIFFICULTY]
}

// ---------------------------------------------------------------------------
// Heroes
// ---------------------------------------------------------------------------

function heroName(c, rng) {
  const used = new Set([...arr(c.roster), ...arr(c.memorial)].map((h) => h.name))
  const free = HERO_NAMES.filter((n) => !used.has(n))
  const name = pick(free.length ? free : HERO_NAMES, rng)
  return free.length ? name : `${name} ${["II", "III", "IV", "V"][Math.floor(rng() * 4)]}`
}

// A brand-new hero (bench-entry shape, so runEngine / UnitCard read it as-is).
export function makeHero(c, defId, salt, extra = {}) {
  const rng = rngFor(c, `hero:${salt}`)
  const key = c.nextKey
  const hero = {
    key,
    defId,
    name: heroName(c, rng),
    upgradeLevel: 0,
    upgrades: [],
    xp: 0,
    perks: [],
    skillUpgrades: {},
    mutations: [],
    heroTraits: rollTraits(c.seed, `campaign:${key}:${defId}`),
    identity: { ...identityOf({}), quirks: rollQuirks(c.seed, `campaign:${key}:${defId}`) },
    hpPct: 1,
    joinedDay: c.day,
    tiredUntil: 0,
    missions: 0,
    attune: 0,
    ...extra,
  }
  return { c: { ...c, nextKey: key + 1 }, hero }
}

function recruitTierFor(c, rng) {
  const lv = roomLevel(c, "recruitment")
  const roll = rng()
  if ((c.chapter >= 5 || lv >= 3) && roll < 0.2) return "rare"
  if ((c.chapter >= 3 || lv >= 2) && roll < 0.45) return "uncommon"
  return "common"
}

function rollRecruitDef(c, rng, tier = "common", exclude = []) {
  const pool = RECRUITABLE(tier).filter((u) => !exclude.includes(u.id))
  return (pick(pool.length ? pool : RECRUITABLE("common"), rng) || {}).id
}

export function recruitCost(c) {
  return RECRUIT_BASE_COST + RECRUIT_COST_PER_CHAPTER * ((c.chapter || 1) - 1)
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export function loadCampaignUnlocks() {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(CAMPAIGN_UNLOCKS_KEY) : null
    const v = raw ? JSON.parse(raw) : null
    return Array.isArray(v) ? v.filter((id) => typeof id === "string") : []
  } catch {
    return []
  }
}

export function saveCampaignUnlocks(ids) {
  try {
    localStorage.setItem(CAMPAIGN_UNLOCKS_KEY, JSON.stringify([...new Set(arr(ids))]))
  } catch {
    // storage blocked - unlocks just won't persist
  }
}

// Commanders a new campaign may pick: every unlocked one (Grove unlocks +
// campaign unlocks), never a locked card.
export function campaignCommanderIds(metaUnlocked = [], campaignUnlocks = []) {
  const extra = new Set([...arr(metaUnlocked), ...arr(campaignUnlocks).filter((u) => u.startsWith("commander:")).map((u) => u.slice(10))])
  return Object.values(CHARACTERS)
    .filter((ch) => !ch.locked || extra.has(ch.id))
    .map((ch) => ch.id)
}

export function createCampaign({ commanderId = "tommy", difficulty = DEFAULT_DIFFICULTY, seed = 1, unlocks = [] } = {}) {
  const diff = CAMPAIGN_DIFFICULTIES[difficulty] ? difficulty : DEFAULT_DIFFICULTY
  let c = {
    version: CAMPAIGN_VERSION,
    seed: seed >>> 0,
    commanderId: CHARACTERS[commanderId] ? commanderId : "tommy",
    difficulty: diff,
    status: "active", // "active" | "won" | "lost"
    lostReason: null,
    day: 1,
    chapter: 1,
    chapterWins: 0,
    doom: 0,
    essence: CAMPAIGN_DIFFICULTIES[diff].startEssence,
    leyShards: 0,
    regions: CAMPAIGN_REGIONS.map((r) => ({ id: r.id, threat: r.home ? 5 : 15 + Math.floor(streamRng(seed, "world", `start:${r.id}`)() * 15), fallen: false })),
    missions: [],
    nextMissionId: 1,
    roster: [],
    nextKey: 1,
    commander: { hpPct: 1, wounded: false, xp: 0, perks: [], skillUpgrades: {}, promo: [] },
    memorial: [],
    hearth: { rooms: Object.fromEntries(CAMPAIGN_ROOMS.map((r) => [r.id, 0])), building: null },
    recruitOffers: [],
    nextRecruitDay: 1,
    items: [],
    itemKeyCounter: 1,
    relics: [],
    unlocks: [],
    stats: { missionsWon: 0, missionsLost: 0, regionsLost: 0, heroesLost: 0, recruited: 0 },
    log: [],
    lastDayReport: null,
    lastAftermath: null,
    activeMission: null,
  }
  // Starting roster: distinct classes from the common pool.
  const seasoned = arr(unlocks).includes("start:seasoned")
  const rng = rngFor(c, "start-roster")
  const usedClasses = new Set()
  const pool = RECRUITABLE("common")
  for (let tries = 0; c.roster.length < START_ROSTER && tries < 200; tries++) {
    const u = pick(pool, rng)
    if (!u || usedClasses.has(u.classId)) continue
    usedClasses.add(u.classId)
    const made = makeHero(c, u.id, `start:${c.roster.length}`, seasoned ? { xp: 6 } : {})
    c = { ...made.c, roster: [...made.c.roster, made.hero] }
  }
  c = rollRecruitOffers(c)
  c = spawnMissions(c, 3)
  return { ...c, log: [`Day 1. ${CHARACTERS[c.commanderId]?.name || "The Commander"} lights the Hearth. The Rot is already moving.`] }
}

// ---------------------------------------------------------------------------
// Derived numbers
// ---------------------------------------------------------------------------

export const roomLevel = (c, id) => c?.hearth?.rooms?.[id] || 0
export const rosterCap = (c) => ROSTER_CAP_BY_LEVEL[roomLevel(c, "barracks")] ?? ROSTER_CAP_BY_LEVEL[0]
export const healPerDay = (c) => HEAL_PER_DAY + (HEAL_BONUS_BY_LEVEL[roomLevel(c, "infirmary")] || 0)
export const trainingXpPerDay = (c) => TRAINING_XP_BY_DAY[roomLevel(c, "training")] || 0
export const leyWellMana = (c) => LEY_WELL_MANA[roomLevel(c, "leywell")] || 0
export const doomMax = (c) => difficultyOf(c).doomMax
export const regionState = (c, id) => {
  const r = arr(c.regions).find((x) => x.id === id)
  if (!r) return "safe"
  if (r.fallen) return "fallen"
  return r.threat >= THREAT_THREATENED ? "threatened" : "safe"
}
export const fallenCount = (c) => arr(c.regions).filter((r) => r.fallen).length

// The extra DifficultyEngine score every campaign fight gets: the chosen
// difficulty, each fallen region, and how full the doom clock is.
export function campaignThreatBonus(c) {
  return difficultyOf(c).enemyBonus + FALLEN_ENEMY_BONUS * fallenCount(c) + Math.floor((DOOM_ENEMY_BONUS * clamp(c.doom, 0, doomMax(c))) / doomMax(c))
}

export function missionAct(c, regionId) {
  const def = regionDef(regionId)
  return clamp((c.chapter || 1) + (def?.offset || 0), 1, 7)
}

// Room display: the campaign reuses the Hearth's own room names/icons.
export function roomInfo(id) {
  const def = campaignRoomDef(id)
  const hearth = roomById(id)
  return { ...def, name: def?.name || hearth?.name || id, icon: def?.icon || hearth?.icon || "🏠" }
}

// Why a hero can't go on a mission (plain English), or null.
export function heroBlocker(c, hero) {
  if (!hero) return "Not found."
  if ((hero.tiredUntil || 0) > c.day) {
    const d = hero.tiredUntil - c.day
    return `Tired - ${d} day${d > 1 ? "s" : ""}`
  }
  if ((hero.hpPct ?? 1) < DEPLOY_MIN_HP) return `Wounded - ${daysToHeal(c, hero)} day${daysToHeal(c, hero) > 1 ? "s" : ""}`
  return null
}

export function daysToHeal(c, hero, target = DEPLOY_MIN_HP) {
  const missing = target - (hero.hpPct ?? 1)
  return missing <= 0 ? 0 : Math.ceil(missing / healPerDay(c))
}

export const availableHeroes = (c) => arr(c.roster).filter((h) => !heroBlocker(c, h))

export function squadLimits(c) {
  const free = availableHeroes(c).length
  return { min: Math.max(1, Math.min(SQUAD_MIN, free)), max: SQUAD_MAX, free }
}

// ---------------------------------------------------------------------------
// Missions
// ---------------------------------------------------------------------------

function rewardFor(type, act, region, rng, c) {
  const r = { essence: 0, leyShards: 0, recruit: false, item: null, relic: null }
  if (type === "fight") r.essence = 120 + 30 * act
  if (type === "elite") {
    r.essence = 200 + 40 * act
    r.item = pick(itemPool().filter((i) => i.rarity === "rare" || i.rarity === "epic"), rng)?.id || null
  }
  if (type === "rescue") {
    r.essence = 60 + 20 * act
    r.recruit = true
  }
  if (type === "supply") {
    r.essence = 260 + 50 * act
    r.item = pick(itemPool().filter((i) => i.rarity === "common" || i.rarity === "uncommon"), rng)?.id || null
  }
  if (type === "ley") {
    r.essence = 80 + 20 * act
    r.leyShards = 1 + Math.floor(act / 3) + (region?.ley ? 1 : 0)
  }
  if (type === "story") {
    r.essence = 300 + 50 * act
    r.leyShards = 1
    const owned = new Set(arr(c.relics))
    r.relic = pick(relicPool().filter((x) => !owned.has(x.id)), rng)?.id || null
  }
  if (type === "retake") {
    r.essence = 150 + 30 * act
  }
  return r
}

function makeMission(c, type, regionId, rng) {
  const t = MISSION_TYPES[type]
  const region = regionDef(regionId)
  const act = type === "story" ? clamp(c.chapter, 1, 7) : missionAct(c, regionId)
  const nodeIndex = missionNodeIndex(act, t.node, rng)
  const [lo, hi] = t.expiry || [0, 0]
  const id = c.nextMissionId
  const story = type === "story" ? STORY_CHAPTERS[c.chapter - 1] : null
  const mission = {
    id,
    type,
    regionId,
    act,
    nodeIndex,
    nodeType: RUN_PATH[nodeIndex]?.type || "battle",
    seed: (Math.floor(rng() * 0x7fffffff) ^ (c.seed + id * 2654435761)) >>> 0,
    spawnedDay: c.day,
    expiresDay: t.expiry ? c.day + lo + Math.floor(rng() * (hi - lo + 1)) : null,
    title: story ? story.title : `${t.name} - ${region?.short || regionId}`,
    line: story ? story.line : t.blurb,
    chapter: story ? c.chapter : null,
    reward: rewardFor(type, act, region, rng, c),
  }
  return { c: { ...c, nextMissionId: id + 1, missions: [...arr(c.missions), mission] }, mission }
}

export function missionCap(c) {
  return Math.min(6, 3 + Math.floor((c.chapter || 1) / 2))
}

// Spawns up to `count` missions (seeded by day). A story mission appears
// once the chapter has enough wins; a fallen region can be retaken.
export function spawnMissions(c0, count = 1) {
  let c = c0
  const rng = rngFor(c, `spawn:${c.day}:${c.nextMissionId}`)
  if (c.chapterWins >= STORY_AFTER_WINS && c.chapter <= MAX_CHAPTER && !arr(c.missions).some((m) => m.type === "story")) {
    const front = [...CAMPAIGN_REGIONS].reverse().find((r) => !r.home && !arr(c.regions).find((x) => x.id === r.id)?.fallen)
    c = makeMission(c, "story", front?.id || "crownless", rng).c
  }
  const regular = () => arr(c.missions).filter((m) => m.type !== "story").length
  for (let n = 0; n < count && regular() < missionCap(c); n++) {
    const open = arr(c.regions).filter((r) => !r.fallen)
    const fallen = arr(c.regions).filter((r) => r.fallen && !arr(c.missions).some((m) => m.regionId === r.id))
    if (fallen.length && rng() < 0.25) {
      c = makeMission(c, "retake", pick(fallen, rng).id, rng).c
      continue
    }
    if (!open.length) break
    // Weighted by threat: the regions in trouble shout loudest.
    const total = open.reduce((s, r) => s + r.threat + 20, 0)
    let roll = rng() * total
    let region = open[open.length - 1]
    for (const r of open) {
      roll -= r.threat + 20
      if (roll < 0) {
        region = r
        break
      }
    }
    const def = regionDef(region.id)
    const t = rng()
    let type = "fight"
    if (def?.ley && t < 0.4) type = "ley"
    else if (region.threat >= THREAT_THREATENED && t < 0.6) type = "elite"
    else if (t < 0.72) type = "fight"
    else if (t < 0.86) type = "supply"
    else type = "rescue"
    c = makeMission(c, type, region.id, rng).c
  }
  return c
}

// ---------------------------------------------------------------------------
// Recruiting
// ---------------------------------------------------------------------------

export function rollRecruitOffers(c0, { rookies = 0 } = {}) {
  let c = c0
  const lv = roomLevel(c, "recruitment")
  const rng = rngFor(c, `recruits:${c.day}:${c.nextKey}:${rookies}`)
  const count = rookies || RECRUIT_OFFER_COUNT[lv]
  const offers = []
  for (let i = 0; i < count; i++) {
    const defId = rollRecruitDef(c, rng, rookies ? "common" : recruitTierFor(c, rng), offers.map((o) => o.defId))
    if (!defId) continue
    offers.push({ id: `${c.day}:${i}:${rookies ? "r" : "o"}`, defId, cost: rookies ? 0 : recruitCost(c), rookie: !!rookies, traits: rollTraits(c.seed, `offer:${c.day}:${i}:${defId}`) })
  }
  c = {
    ...c,
    recruitOffers: rookies ? [...offers, ...arr(c.recruitOffers)] : offers,
    nextRecruitDay: rookies ? c.nextRecruitDay : c.day + RECRUIT_EVERY_DAYS[lv],
  }
  return c
}

export function recruitBlocker(c, offerId) {
  const o = arr(c.recruitOffers).find((x) => x.id === offerId)
  if (!o) return "That recruit has moved on."
  if (arr(c.roster).length >= rosterCap(c)) return "The Barracks are full."
  if (c.essence < o.cost) return `Needs ${o.cost} Essence.`
  return null
}

export function recruitHero(c0, offerId) {
  if (recruitBlocker(c0, offerId)) return c0
  const o = c0.recruitOffers.find((x) => x.id === offerId)
  const made = makeHero(c0, o.defId, `recruit:${offerId}`, { heroTraits: o.traits })
  const c = made.c
  return {
    ...c,
    essence: c.essence - o.cost,
    roster: [...c.roster, made.hero],
    recruitOffers: c.recruitOffers.filter((x) => x.id !== offerId),
    stats: { ...c.stats, recruited: (c.stats?.recruited || 0) + 1 },
    log: [...arr(c.log), `${made.hero.name} the ${UNITS[o.defId]?.name || o.defId} joins the Hearth.`].slice(-40),
  }
}

// Ley Shards -> a permanent deeper mana pool on one hero.
export function attuneBlocker(c, key) {
  const h = arr(c.roster).find((x) => x.key === key)
  if (!h) return "Not found."
  if ((h.attune || 0) >= ATTUNE_MAX) return "Fully attuned."
  if ((c.leyShards || 0) < ATTUNE_COST) return `Needs ${ATTUNE_COST} Ley Shard.`
  return null
}

export function attuneHero(c, key) {
  if (attuneBlocker(c, key)) return c
  return {
    ...c,
    leyShards: c.leyShards - ATTUNE_COST,
    roster: c.roster.map((h) => (h.key === key ? { ...h, attune: (h.attune || 0) + 1 } : h)),
  }
}

export const heroManaBonus = (c, h) => leyWellMana(c) + ATTUNE_MANA * (h?.attune || 0)

// ---------------------------------------------------------------------------
// Hearth building
// ---------------------------------------------------------------------------

export function buildCost(c, roomId) {
  const def = campaignRoomDef(roomId)
  const lv = roomLevel(c, roomId)
  const step = def?.levels[lv]
  return step ? { essence: step.cost, shards: step.shards || 0, days: step.days, level: lv + 1, text: step.text } : null
}

export function buildBlocker(c, roomId) {
  const cost = buildCost(c, roomId)
  if (!cost) return "Fully built."
  if (c.hearth?.building) return "The builders are busy."
  if (c.essence < cost.essence) return `Needs ${cost.essence} Essence.`
  if ((c.leyShards || 0) < cost.shards) return `Needs ${cost.shards} Ley Shard${cost.shards > 1 ? "s" : ""}.`
  return null
}

export function startBuild(c, roomId) {
  if (buildBlocker(c, roomId)) return c
  const cost = buildCost(c, roomId)
  return {
    ...c,
    essence: c.essence - cost.essence,
    leyShards: (c.leyShards || 0) - cost.shards,
    hearth: { ...c.hearth, building: { roomId, level: cost.level, doneDay: c.day + cost.days } },
  }
}

// ---------------------------------------------------------------------------
// The day loop
// ---------------------------------------------------------------------------

function pushLog(c, lines) {
  return { ...c, log: [...arr(c.log), ...lines].slice(-40) }
}

// Passes one day. `restingKeys` = heroes who did NOT just fight (the
// Training Hall only teaches those). Returns the new campaign with a
// `lastDayReport` (plain lines for the day's news).
export function advanceDay(c0, { fought = [] } = {}) {
  if (c0.status !== "active") return c0
  let c = { ...c0, day: c0.day + 1 }
  const lines = []
  const day = c.day
  const diff = difficultyOf(c)

  // Heal + train the roster; the Commander heals too.
  const heal = healPerDay(c)
  const xp = trainingXpPerDay(c)
  c = {
    ...c,
    roster: c.roster.map((h) => {
      let next = h
      if ((h.hpPct ?? 1) < 1) next = { ...next, hpPct: Math.min(1, (h.hpPct ?? 1) + heal) }
      if (xp > 0 && !fought.includes(h.key) && (h.tiredUntil || 0) <= day) {
        const before = levelForXp(next.xp || 0)
        next = { ...next, xp: (next.xp || 0) + xp }
        if (levelForXp(next.xp) > before) lines.push(`🎯 ${h.name} trained up to Level ${levelForXp(next.xp)} at the Hearth.`)
      }
      return next
    }),
    commander: {
      ...c.commander,
      hpPct: Math.min(1, (c.commander?.hpPct ?? 1) + heal),
      wounded: (c.commander?.hpPct ?? 1) + heal < DEPLOY_MIN_HP ? c.commander?.wounded : false,
    },
  }
  for (const h of c0.roster) if ((h.tiredUntil || 0) === day) lines.push(`${h.name} is rested and ready.`)

  // Building.
  const b = c.hearth?.building
  if (b && b.doneDay <= day) {
    const info = roomInfo(b.roomId)
    c = { ...c, hearth: { rooms: { ...c.hearth.rooms, [b.roomId]: b.level }, building: null } }
    lines.push(`🔨 ${info.icon} ${info.name} Level ${b.level} is finished.`)
  }

  // Missions left unanswered expire - their region pays for it.
  const expired = arr(c.missions).filter((m) => m.expiresDay != null && m.expiresDay < day)
  if (expired.length) {
    c = { ...c, missions: c.missions.filter((m) => !expired.includes(m)) }
    for (const m of expired) {
      if (m.type !== "retake") c = bumpThreat(c, m.regionId, IGNORED_THREAT)
      lines.push(`⌛ ${m.title} went unanswered. ${regionDef(m.regionId)?.short} grows darker.`)
    }
  }

  // Threat creeps up everywhere (faster as doom fills).
  const doomPush = 1 + 0.5 * (c.doom / doomMax(c))
  for (const r of CAMPAIGN_REGIONS) {
    const st = c.regions.find((x) => x.id === r.id)
    if (!st || st.fallen) continue
    const fallenNear = CAMPAIGN_ROADS.filter(([a, bb]) => (a === r.id || bb === r.id) && c.regions.find((x) => x.id === (a === r.id ? bb : a))?.fallen).length
    const ahead = r.offset > c.chapter ? 0.5 : 1
    c = bumpThreat(c, r.id, diff.threatRate * r.threatMult * doomPush * ahead + FALLEN_NEIGHBOUR_THREAT * fallenNear, true)
  }

  // Regions that crossed 100 fall.
  c = settleFalls(c, lines)

  // The doom clock ticks on its own.
  if (day % DOOM_EVERY_DAYS === 0) {
    c = { ...c, doom: c.doom + 1 }
    lines.push("☾ The Rot spreads on its own. Doom +1.")
  }

  // Recruits come by.
  if (day >= c.nextRecruitDay) {
    c = rollRecruitOffers(c)
    lines.push(`📯 ${c.recruitOffers.length} new recruits are waiting at the Hearth.`)
  }

  // New missions.
  const before = c.missions.length
  c = spawnMissions(c, c.missions.length < 2 ? 2 : 1)
  if (c.missions.length > before) lines.push(`🗺 ${c.missions.length - before} new mission${c.missions.length - before > 1 ? "s" : ""} on the map.`)

  c = checkGameOver(c)
  return pushLog({ ...c, lastDayReport: { day, lines } }, [`Day ${day}.`, ...lines])
}

function bumpThreat(c, regionId, amount, raw = false) {
  return {
    ...c,
    regions: c.regions.map((r) => (r.id === regionId && !r.fallen ? { ...r, threat: clamp(raw ? r.threat + amount : Math.round(r.threat + amount), 0, THREAT_FALLEN) } : r)),
  }
}

function settleFalls(c0, lines) {
  let c = c0
  for (const r of c.regions) {
    if (r.fallen || r.threat < THREAT_FALLEN) continue
    const def = regionDef(r.id)
    c = {
      ...c,
      doom: c.doom + DOOM_PER_FALL,
      regions: c.regions.map((x) => (x.id === r.id ? { ...x, threat: THREAT_FALLEN, fallen: true, fellDay: c.day } : x)),
      missions: c.missions.filter((m) => m.regionId !== r.id || m.type === "story"),
      stats: { ...c.stats, regionsLost: (c.stats?.regionsLost || 0) + 1 },
    }
    lines.push(`🔥 ${def?.name} has FALLEN to the Rot. Doom +${DOOM_PER_FALL}. Every fight grows harder.`)
  }
  return c
}

export function checkGameOver(c) {
  if (c.status !== "active") return c
  if (c.regions.find((r) => r.id === "hearthstead")?.fallen) return { ...c, status: "lost", lostReason: "The Hearthstead fell. There is no home left to come back to." }
  if (c.doom >= doomMax(c)) return { ...c, status: "lost", lostReason: "The doom clock struck. The Rot has the whole forest now." }
  return c
}

// ---------------------------------------------------------------------------
// A mission's fight
// ---------------------------------------------------------------------------

export function squadBlocker(c, missionId, squadKeys) {
  const m = arr(c.missions).find((x) => x.id === missionId)
  if (!m) return "That mission is gone."
  if (c.status !== "active") return "The campaign is over."
  const keys = arr(squadKeys)
  const { min, max } = squadLimits(c)
  if (new Set(keys).size !== keys.length) return "A hero can only go once."
  if (keys.length < min) return `Pick at least ${min} hero${min > 1 ? "es" : ""}.`
  if (keys.length > max) return `At most ${max} heroes.`
  for (const k of keys) {
    const h = c.roster.find((x) => x.key === k)
    const why = heroBlocker(c, h)
    if (why) return `${h?.name || "A hero"}: ${why}.`
  }
  return null
}

// Builds an ordinary run state for ONE fight, so the Expedition's own
// fight bridge (startTacticsFormationBattle + buildRunTacticsBattle) builds
// the mission: the squad is the bench, every hero deployed, the Act's
// real RUN_PATH node, the campaign's relics + gear, the Commander's
// level/HP, Ley mana bonuses and the campaign threat bonus.
export function missionRunState(c, missionId, squadKeys) {
  const m = c.missions.find((x) => x.id === missionId)
  if (!m) return null
  const region = regionDef(m.regionId)
  const base = startRun(c.commanderId, null, { forcedSeed: m.seed })
  const bench = squadKeys.map((k) => c.roster.find((h) => h.key === k)).filter(Boolean).map((h) => ({ ...h, manaBonus: heroManaBonus(c, h) }))
  const node = RUN_PATH[m.nodeIndex]
  const overcharge = (m.type === "ley" ? LEY_MISSION_OVERCHARGE : 0) + (region?.ley ? LEY_REGION_OVERCHARGE : 0) + (LEY_WELL_OVERCHARGE[roomLevel(c, "leywell")] || 0)
  return {
    ...base,
    nodeIndex: m.nodeIndex,
    path: [...RUN_PATH.slice(0, m.nodeIndex), node],
    phase: "formation",
    bench,
    benchKeyCounter: c.nextKey,
    deployed: bench.map((h) => h.key),
    items: arr(c.items),
    itemKeyCounter: c.itemKeyCounter,
    essence: 0,
    relics: arr(c.relics),
    commanderXp: c.commander?.xp || 0,
    commanderPerks: arr(c.commander?.perks),
    commanderSkillUpgrades: c.commander?.skillUpgrades || {},
    commanderPromo: arr(c.commander?.promo),
    commanderHpPct: c.commander?.hpPct ?? 1,
    commanderWounded: false,
    campOvercharge: overcharge,
    lastSeenAct: m.act,
    // Read by tacticsRealMatchup.difficultyForRunNode (DifficultyEngine score).
    campaignThreat: campaignThreatBonus(c),
    campaignMissionId: m.id,
  }
}

// Locks in the chosen squad and stores the built fight. `buildFight`
// (injected, so this file never imports the tactics engine) = runState ->
// runState with `battle` (runEngine.startTacticsFormationBattle + bridge).
export function launchMission(c, missionId, squadKeys, buildFight) {
  if (squadBlocker(c, missionId, squadKeys)) return c
  const run = missionRunState(c, missionId, squadKeys)
  const fought = buildFight ? buildFight(run) : run
  if (!fought?.battle) return c
  return { ...c, activeMission: { missionId, squadKeys: [...squadKeys], run: fought }, lastAftermath: null }
}

export function updateMissionBattle(c, battle) {
  if (!c.activeMission) return c
  return { ...c, activeMission: { ...c.activeMission, run: { ...c.activeMission.run, battle } } }
}

// Reads the finished (or abandoned) fight back into the campaign.
// `retreat` = the squad pulled out mid-fight (survivors live, mission fails).
export function resolveMission(c0, { retreat = false } = {}) {
  const am = c0.activeMission
  if (!am?.run?.battle) return c0
  const m = c0.missions.find((x) => x.id === am.missionId)
  const battle = am.run.battle
  const won = !retreat && battle.phase === "won"
  const fightBattle = won ? battle : { ...battle, phase: "lost" }
  const after = campaignFightAftermath(am.run, fightBattle)
  const units = arr(battle.units)
  const deployedKeys = am.run.deployed
  const unitOf = (h, i) => units.find((u) => u.id === `player-${h.defId}-${i}`)
  const deaths = []
  const survivors = new Map()
  am.run.bench.forEach((h, i) => {
    const u = unitOf(h, deployedKeys.indexOf(h.key))
    const fresh = after.bench.find((b) => b.key === h.key) || h
    if (u && u.hp <= 0) {
      const killer = units.find((x) => x.id === u.lastHitBy)
      deaths.push({
        key: h.key,
        name: h.name,
        defId: h.defId,
        classId: h.classId || UNITS[h.defId]?.classId || null,
        level: levelForXp(fresh.xp || 0),
        joinedDay: h.joinedDay ?? 1,
        diedDay: c0.day,
        daysServed: Math.max(1, c0.day - (h.joinedDay ?? 1) + 1),
        missions: (h.missions || 0) + 1,
        kills: identityOf(fresh).career.kills,
        cause: `Fell to ${killer?.name || "the Rot"} - ${m?.title || "a mission"}`,
        scars: identityOf(fresh).scars,
      })
    } else {
      survivors.set(h.key, { ...fresh, hpPct: Math.max(0.05, fresh.hpPct ?? 1), wounded: false, tiredUntil: c0.day + 1 + TIRED_DAYS, missions: (h.missions || 0) + 1 })
    }
    void i
  })
  const deadKeys = new Set(deaths.map((d) => d.key))
  const cmdFell = (units.find((u) => u.id === "player-commander")?.hp ?? 1) <= 0
  const wipe = deaths.length > 0 && deaths.length === am.run.bench.length
  const fight = (lines) => arr(lines).filter(Boolean)
  let c = {
    ...c0,
    activeMission: null,
    roster: c0.roster.filter((h) => !deadKeys.has(h.key)).map((h) => survivors.get(h.key) || h),
    memorial: [...arr(c0.memorial), ...deaths],
    // Gear: the fight's bag (drops added, potions drunk); the fallen's gear comes home.
    items: arr(after.items).map((it) => (deadKeys.has(it.equippedTo) ? { ...it, equippedTo: null, slotIndex: null } : it)),
    itemKeyCounter: after.itemKeyCounter || c0.itemKeyCounter,
    essence: c0.essence + Math.max(0, (after.essence || 0) - (am.run.essence || 0)),
    commander: {
      ...c0.commander,
      hpPct: Math.max(0.1, after.commanderHpPct ?? c0.commander.hpPct),
      xp: after.commanderXp ?? c0.commander.xp,
    },
    stats: {
      ...c0.stats,
      missionsWon: (c0.stats?.missionsWon || 0) + (won ? 1 : 0),
      missionsLost: (c0.stats?.missionsLost || 0) + (won ? 0 : 1),
      heroesLost: (c0.stats?.heroesLost || 0) + deaths.length,
    },
  }
  const lines = []
  const rewards = []
  if (won && m) {
    c = { ...c, missions: c.missions.filter((x) => x.id !== m.id) }
    const r = m.reward || {}
    if (r.essence) {
      c = { ...c, essence: c.essence + r.essence }
      rewards.push(`+${r.essence} Essence`)
    }
    if (r.leyShards) {
      c = { ...c, leyShards: (c.leyShards || 0) + r.leyShards }
      rewards.push(`+${r.leyShards} Ley Shard${r.leyShards > 1 ? "s" : ""}`)
    }
    if (r.item && ITEMS[r.item]) {
      c = { ...c, items: [...c.items, { key: c.itemKeyCounter, defId: r.item, equippedTo: null, slotIndex: null }], itemKeyCounter: c.itemKeyCounter + 1 }
      rewards.push(`${ITEMS[r.item].name}`)
    }
    if (r.relic && !c.relics.includes(r.relic)) {
      c = { ...c, relics: [...c.relics, r.relic] }
      rewards.push(`Relic: ${r.relic.replace(/-/g, " ")}`)
    }
    if (r.recruit && c.roster.length < rosterCap(c)) {
      const rng = rngFor(c, `rescue:${m.id}`)
      const made = makeHero(c, rollRecruitDef(c, rng, recruitTierFor(c, rng)), `rescue:${m.id}`)
      c = { ...made.c, roster: [...made.c.roster, made.hero], stats: { ...made.c.stats, recruited: (made.c.stats?.recruited || 0) + 1 } }
      rewards.push(`${made.hero.name} the ${UNITS[made.hero.defId]?.name} joins you`)
    }
    if (m.type === "retake") {
      c = { ...c, doom: Math.max(0, c.doom - 2), regions: c.regions.map((x) => (x.id === m.regionId ? { ...x, fallen: false, threat: 60 } : x)) }
      lines.push(`⚑ ${regionDef(m.regionId)?.name} is yours again. Doom -2.`)
    } else {
      c = bumpThreat(c, m.regionId, -MISSION_TYPES[m.type].threatDrop)
    }
    if (m.type === "story") {
      const next = c.chapter + 1
      c = { ...c, doom: Math.max(0, c.doom - DOOM_STORY_RELIEF), chapter: Math.min(MAX_CHAPTER, next), chapterWins: 0 }
      if (next > MAX_CHAPTER) c = { ...c, status: "won" }
      else lines.push(`📜 Chapter ${next} begins. The road goes deeper - and the fights get harder.`)
      c = earnUnlocks(c, next)
    } else {
      c = { ...c, chapterWins: (c.chapterWins || 0) + 1 }
    }
  } else if (m) {
    // A failed mission: gone, and the region feels it.
    c = { ...c, missions: c.missions.filter((x) => x.id !== m.id || x.type === "story") }
    if (m.type !== "retake") c = bumpThreat(c, m.regionId, FAILED_THREAT)
    lines.push(retreat ? "You pulled the squad out. The mission is lost." : "The mission failed.")
  }
  if (wipe) {
    c = { ...c, doom: c.doom + DOOM_PER_WIPE }
    c = rollRecruitOffers(c, { rookies: ROOKIE_OFFERS_ON_WIPE })
    lines.push(`The whole squad is gone. Doom +${DOOM_PER_WIPE}. Word spreads - ${ROOKIE_OFFERS_ON_WIPE} rookies offer to take their place, free.`)
  }
  const aftermath = {
    missionId: m?.id,
    title: m?.title || "Mission",
    type: m?.type,
    regionId: m?.regionId,
    outcome: won ? "won" : retreat ? "retreat" : "lost",
    day: c0.day,
    deaths,
    wipe,
    rewards,
    // The run's "fell and is Wounded" lines don't apply here (the fallen are dead).
    lines: [...lines, ...(cmdFell ? [`${CHARACTERS[c0.commanderId]?.name || "The Commander"} fell, and was carried home to rest.`] : []), ...fight(after.lastAftermath).filter((l) => !/fell and is Wounded/.test(l)), ...fight(after.lastMutations)],
    levelUps: arr(after.lastLevelUps),
    survivors: [...survivors.values()].map((h) => ({ key: h.key, name: h.name, defId: h.defId, hpPct: h.hpPct })),
  }
  // The mission took the day.
  c = settleFalls(c, aftermath.lines)
  c = advanceDay(checkGameOver(c), { fought: am.squadKeys })
  return { ...checkGameOver(c), lastAftermath: aftermath }
}

function earnUnlocks(c, chapterReached) {
  const got = CAMPAIGN_UNLOCKS.filter((u) => chapterReached >= u.chapter && !arr(c.unlocks).includes(u.id)).map((u) => u.id)
  return got.length ? { ...c, unlocks: [...arr(c.unlocks), ...got] } : c
}

// ---------------------------------------------------------------------------
// Level-ups + gear through the run engine's own helpers (a "view" run state)
// ---------------------------------------------------------------------------

export function campaignRunView(c) {
  return {
    characterId: c.commanderId,
    seed: c.seed,
    bench: c.roster,
    deployed: [],
    items: arr(c.items),
    itemKeyCounter: c.itemKeyCounter,
    relics: arr(c.relics),
    commanderXp: c.commander?.xp || 0,
    commanderPerks: arr(c.commander?.perks),
    commanderSkillUpgrades: c.commander?.skillUpgrades || {},
    commanderPromo: arr(c.commander?.promo),
  }
}

function foldView(c, rs) {
  return {
    ...c,
    roster: rs.bench,
    items: rs.items,
    commander: { ...c.commander, xp: rs.commanderXp, perks: rs.commanderPerks, skillUpgrades: rs.commanderSkillUpgrades, promo: rs.commanderPromo },
  }
}

export const campaignChooseLevelPerk = (c, key, perkId) => foldView(c, chooseLevelPerk(campaignRunView(c), key, perkId))
export const campaignChoosePromotion = (c, key, offerId) => foldView(c, choosePromotion(campaignRunView(c), key, offerId))
export const campaignEquip = (c, itemKey, ownerKey, slot) => foldView(c, equipItem(campaignRunView(c), itemKey, ownerKey, slot))
export const campaignUnequip = (c, itemKey) => foldView(c, unequipItem(campaignRunView(c), itemKey))

// ---------------------------------------------------------------------------
// Save
// ---------------------------------------------------------------------------

export function serializeCampaign(c) {
  if (!c) return null
  return { version: CAMPAIGN_VERSION, savedAt: Date.now(), campaign: c }
}

export function deserializeCampaign(saved) {
  if (!saved || saved.version !== CAMPAIGN_VERSION) return null
  const c = saved.campaign
  if (!c || typeof c !== "object") return null
  if (!CHARACTERS[c.commanderId] || !CAMPAIGN_DIFFICULTIES[c.difficulty]) return null
  if (!Number.isInteger(c.day) || c.day < 1) return null
  if (!Array.isArray(c.roster) || !Array.isArray(c.regions) || !Array.isArray(c.missions)) return null
  if (!["active", "won", "lost"].includes(c.status)) return null
  return {
    ...c,
    roster: c.roster.filter((h) => h && UNITS[h.defId]),
    memorial: arr(c.memorial),
    items: arr(c.items).filter((it) => it && ITEMS[it.defId]),
    relics: arr(c.relics),
    unlocks: arr(c.unlocks),
    recruitOffers: arr(c.recruitOffers).filter((o) => o && UNITS[o.defId]),
    log: arr(c.log),
    activeMission: c.activeMission?.run?.battle ? c.activeMission : null,
  }
}

export function loadCampaign() {
  try {
    const raw = localStorage.getItem(CAMPAIGN_SAVE_KEY)
    return raw ? deserializeCampaign(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

export function saveCampaign(c) {
  try {
    if (c) localStorage.setItem(CAMPAIGN_SAVE_KEY, JSON.stringify(serializeCampaign(c)))
  } catch {
    // storage full / blocked - the campaign just won't persist
  }
}

export function clearCampaign() {
  try {
    localStorage.removeItem(CAMPAIGN_SAVE_KEY)
  } catch {
    // ignore
  }
}

export { CAMPAIGN_REGIONS, CAMPAIGN_ROADS, MISSION_TYPES, CAMPAIGN_DIFFICULTIES, CAMPAIGN_ROOMS, THREAT_FALLEN, THREAT_THREATENED, SQUAD_MAX }
