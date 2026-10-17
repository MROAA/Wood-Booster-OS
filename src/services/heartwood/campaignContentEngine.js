// Hearthwood - THE LONG CAMPAIGN, content sprint (the campaign side).
//
// Purpose: makes the 20-hour campaign full and varied:
//   - new MISSION KINDS (escort / Mana Well / fleeing caster / captives /
//     night raid / mana storm / two fronts) turn up in place of some plain
//     fights, plus one NAMED FOE (mini-boss) per chapter;
//   - each chapter's own ENEMY ROSTER and BATTLEFIELD feature;
//   - hand-written CHAPTER EVENTS and WORLD EVENTS on the world map, with
//     choices, costs and LASTING effects (Overcharge, Essence, threat,
//     enemy strength, healing, an ally or a rival in your next mission).
// Responsibilities: the per-mission content fields, the mission's fight
// spec (runState.campaignOps, read by tacticsCampaignOps.js), the day tick
// for events + lasting effects, event choices, and the fight aftermath
// (freed captives join, a Ley-Cutter's cut line, shards, a Named Foe beaten).
// Dependencies: data (campaign.js, campaignContent.js, campaignBosses.js,
// items/relics/enemies), seed.js. Helpers that make heroes are INJECTED by
// campaignEngine.js (no import back - no cycle).
// Pure + deterministic: every roll is streamRng(seed, "world", salt) on its
// OWN salts, so the base mission rolls (and old saves' seeds) never move.
// Public API: contentOf, specialMissionType, missionContentFields,
// contentReward, maybeSpawnWarlord, missionNode, missionOpsSpec,
// contentDayTick, eventOptions, chooseContentEvent, dismissEventResult,
// contentOvercharge, contentEnemyBonus, contentEssenceMult, contentThreatMult,
// contentHealBonus, contentFates, contentAftermath, lastingList, eventDef.
// Tests: .scratch/verify_campaign_content.mjs (ENGINE_ONLY=1).
import { streamRng } from "../../data/heartwood/seed"
import { MISSION_TYPES, CAMPAIGN_REGIONS, LEY_LINES, regionDef } from "../../data/heartwood/campaign"
import {
  SPECIAL_MISSIONS, SPECIAL_CHANCE, CHAPTER_ROSTER_CHANCE, CHAPTER_MAP_CHANCE, WARLORD_AFTER_WINS, CHAPTER_CONTENT,
  CHAPTER_EVENTS, WORLD_EVENTS, LASTING_KINDS, CHAPTER_EVENT_CHANCE, WORLD_EVENT_CHANCE, WORLD_EVENT_FIRST_DAY,
  NIGHT_ESSENCE_MULT, WARLORD_DOOM_RELIEF,
} from "../../data/heartwood/campaignContent"
import { CAMPAIGN_BOSS_FIGHTS, bossIdForChapter } from "../../data/heartwood/campaignBosses"
import { ENEMIES } from "../../data/heartwood/enemies"
import { ITEMS, itemPool } from "../../data/heartwood/items"
import { RELICS, relicPool } from "../../data/heartwood/relics"
import { UNITS } from "../../data/heartwood/units"

const arr = (v) => (Array.isArray(v) ? v : [])
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n))
const rngFor = (c, salt) => streamRng(c.seed, "world", salt)
const pick = (list, rng) => (list.length ? list[Math.floor(rng() * list.length)] : null)

export const CONTENT_TYPES = ["escort", "well", "assassinate", "liberate", "night", "storm", "twofront", "warlord"]
const ALL_EVENTS = [...Object.values(CHAPTER_EVENTS).flat(), ...WORLD_EVENTS]
export const eventDef = (id) => ALL_EVENTS.find((e) => e.id === id) || null

export function contentOf(c) {
  const x = c?.content || {}
  return {
    events: arr(x.events),
    seen: arr(x.seen),
    effects: arr(x.effects),
    warlords: x.warlords && typeof x.warlords === "object" ? x.warlords : {},
    lastEvent: x.lastEvent || null,
    nextUid: Number.isInteger(x.nextUid) ? x.nextUid : 1,
  }
}
const withContent = (c, patch) => ({ ...c, content: { ...contentOf(c), ...patch } })

// ---------------------------------------------------------------------------
// Missions
// ---------------------------------------------------------------------------

// A plain fight / rescue may become one of the new kinds (from Day 2).
export function specialMissionType(c, type, regionId) {
  if ((type !== "fight" && type !== "rescue") || (c.day || 1) < 2) return type
  const rng = rngFor(c, `content-special:${c.day}:${c.nextMissionId}`)
  if (rng() >= SPECIAL_CHANCE) return type
  const open = SPECIAL_MISSIONS.filter((s) => (c.chapter || 1) >= s.from).map((s) => s.type)
  // Rescues lean toward freeing captives; ley regions toward the storm.
  if (type === "rescue" && rng() < 0.6) return "liberate"
  if (regionDef(regionId)?.ley && open.includes("storm") && rng() < 0.4) return "storm"
  return pick(open, rng) || type
}

// Extra fields a mission carries (its own salt: the mission's base rolls never move).
export function missionContentFields(c, type, regionId, id) {
  const chapter = clamp(c.chapter || 1, 1, 7)
  const rng = rngFor(c, `content-mission:${id}`)
  const out = { chapterOf: chapter }
  const chapterDef = CHAPTER_CONTENT[chapter]
  if (type === "warlord") {
    const bossId = bossIdForChapter(chapter)
    const fight = CAMPAIGN_BOSS_FIGHTS[bossId]
    if (fight) {
      out.bossId = bossId
      out.title = `${fight.name} - ${regionDef(regionId)?.short || regionId}`
      out.line = ENEMIES[bossId]?.introLine || fight.title
    }
    return out
  }
  const rosterRoll = rng()
  const mapRoll = rng()
  const rosterPick = rng()
  // New kinds always field the chapter's roster; plain fights half the time.
  const rosterKinds = [...CONTENT_TYPES, "fight", "supply", "rescue", "ley", "breach"]
  if (rosterKinds.includes(type) && (CONTENT_TYPES.includes(type) || ((c.day || 1) >= 2 && rosterRoll < CHAPTER_ROSTER_CHANCE))) {
    out.roster = chapterDef.rosters[Math.floor(rosterPick * chapterDef.rosters.length)]
  }
  if (type !== "story" && type !== "retake" && (CONTENT_TYPES.includes(type) || ((c.day || 1) >= 2 && mapRoll < CHAPTER_MAP_CHANCE))) out.feature = chapterDef.feature
  return out
}

// Rewards for the new kinds (no rolls on the base stream).
export function contentReward(type, act, c, id) {
  const r = {}
  const rng = rngFor(c, `content-reward:${id}`)
  if (type === "escort") Object.assign(r, { essence: 110 + 25 * act, leyShards: 1 })
  if (type === "well") Object.assign(r, { essence: 90 + 20 * act, leyShards: 2 })
  if (type === "assassinate") Object.assign(r, { essence: 140 + 30 * act, item: pick(itemPool().filter((i) => i.rarity === "rare"), rng)?.id || null })
  if (type === "liberate") Object.assign(r, { essence: 60 + 15 * act, captives: 2 })
  if (type === "night") Object.assign(r, { essence: Math.round((120 + 30 * act) * NIGHT_ESSENCE_MULT) })
  if (type === "storm") Object.assign(r, { essence: 100 + 25 * act, leyShards: 2 })
  if (type === "twofront") Object.assign(r, { essence: 150 + 35 * act })
  if (type === "warlord") {
    const owned = new Set(arr(c.relics))
    Object.assign(r, {
      essence: 260 + 50 * act,
      leyShards: 2,
      item: pick(itemPool().filter((i) => i.rarity === "rare" || i.rarity === "epic"), rng)?.id || null,
      relic: pick(relicPool().filter((x) => !owned.has(x.id)), rng)?.id || null,
    })
  }
  return r
}

// The chapter's Named Foe: once the chapter has enough wins, until beaten.
export function maybeSpawnWarlord(c, { makeMission, regionLive }) {
  const content = contentOf(c)
  const chapter = c.chapter || 1
  if (c.status !== "active" || (c.chapterWins || 0) < WARLORD_AFTER_WINS || content.warlords[chapter] === "beaten") return c
  if (arr(c.missions).some((m) => m.type === "warlord") || !bossIdForChapter(chapter)) return c
  const live = arr(c.regions).filter((r) => !r.fallen && regionLive(c, r.id) && !regionDef(r.id)?.home)
  if (!live.length) return c
  const rng = rngFor(c, `content-warlord:${c.day}:${chapter}`)
  // The region in most trouble hosts it.
  const region = [...live].sort((a, b) => b.threat - a.threat)[0]
  const made = makeMission(c, "warlord", region.id, rng)
  return withContent({ ...made.c, log: [...arr(made.c.log), `👑 ${made.mission.title.split(" - ")[0]} has been seen near ${regionDef(region.id)?.short}.`].slice(-40) }, { warlords: { ...content.warlords, [chapter]: "seen" } })
}

// The RUN_PATH node a mission fights, with its roster / Named Foe swapped in.
export function missionNode(m, node) {
  if (!node) return node
  const formationId = m?.bossId || m?.roster
  if (!formationId) return node
  const { enemyId: _e, trialId: _t, ...rest } = node
  return { ...rest, formationId }
}

// The fight spec (runState.campaignOps) for tacticsCampaignOps.applyCampaignOps.
export function missionOpsSpec(c, m) {
  if (!m) return null
  return {
    kind: CONTENT_TYPES.includes(m.type) ? m.type : null,
    chapter: m.chapterOf || c.chapter || 1,
    act: m.act || 1,
    feature: m.feature || null,
    seed: m.seed >>> 0,
    title: m.title,
  }
}

// ---------------------------------------------------------------------------
// Lasting effects
// ---------------------------------------------------------------------------

const lasting = (c, kind) => contentOf(c).effects.filter((e) => e.kind === kind && e.untilDay >= (c.day || 1))
export const contentOvercharge = (c) => lasting(c, "overcharge").reduce((s, e) => s + (e.amount || 0), 0)
export const contentEnemyBonus = (c) => lasting(c, "enemyBonus").reduce((s, e) => s + (e.amount || 0), 0)
export const contentEssenceMult = (c) => lasting(c, "essenceMult").reduce((s, e) => s * (e.mult || 1), 1)
export const contentHealBonus = (c) => lasting(c, "heal").reduce((s, e) => s + (e.amount || 0), 0)
export const contentThreatMult = (c, regionId) => lasting(c, "threatMult").filter((e) => !e.region || e.region === regionId).reduce((s, e) => s * (e.mult || 1), 1)

export function lastingList(c) {
  return contentOf(c).effects
    .filter((e) => e.untilDay >= (c.day || 1))
    .map((e) => ({ ...e, icon: LASTING_KINDS[e.kind]?.icon || "✦", text: LASTING_KINDS[e.kind]?.word(e) || e.kind, daysLeft: e.untilDay - (c.day || 1) + 1 }))
}

// An ally / rival from an event rides into the next mission (betweenFights fate shape).
export function contentFates(c, m) {
  if (!m) return []
  const out = []
  const ally = lasting(c, "ally").find((e) => UNITS[e.unit])
  if (ally) out.push({ uid: `content-${ally.uid}@${m.id}`, id: `content-${ally.uid}`, kind: "ally", unit: ally.unit, allyName: ally.name, title: ally.title, wait: 0, left: 1, done: false })
  const rival = lasting(c, "rival").find((e) => ENEMIES[e.enemyId])
  if (rival) out.push({ uid: `content-${rival.uid}@${m.id}`, id: `content-${rival.uid}`, kind: "rival", enemyId: rival.enemyId, rivalName: rival.name, title: rival.title, wait: 0, left: 1, done: false })
  return out
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

function eventRegion(c, ev, rng, regionLive) {
  const live = arr(c.regions).filter((r) => !r.fallen && regionLive(c, r.id))
  if (ev.region === "home") return live.find((r) => regionDef(r.id)?.home)?.id || null
  const field = live.filter((r) => !regionDef(r.id)?.home)
  if (ev.region === "ley") {
    const ley = field.filter((r) => regionDef(r.id)?.ley)
    if (ley.length) return pick(ley, rng).id
  }
  return pick(field, rng)?.id || null
}

// One day: lasting effects fade, unanswered events lapse, maybe a new event.
export function contentDayTick(c0, { regionLive, recruit }) {
  let c = c0
  const lines = []
  const day = c.day
  let content = contentOf(c)
  // Lasting effects run out.
  const fading = content.effects.filter((e) => e.untilDay < day)
  if (fading.length) {
    content = { ...content, effects: content.effects.filter((e) => e.untilDay >= day) }
    for (const e of fading) if (e.label) lines.push(`${LASTING_KINDS[e.kind]?.icon || "✦"} ${e.label} fades.`)
  }
  c = withContent(c, content)
  // Unanswered events lapse (some leave a mark).
  for (const ev of contentOf(c).events.filter((x) => x.expiresDay < day)) {
    const def = eventDef(ev.id)
    c = withContent(c, { events: contentOf(c).events.filter((x) => x.uid !== ev.uid) })
    lines.push(`⌛ ${def?.title || "An event"} passed unanswered.`)
    if (def?.ignore?.effects) c = applyContentEffects(c, def.ignore.effects, ev.regionId, { regionLive, recruit }, `ignore:${ev.uid}`).c
  }
  // A new event (one at a time).
  if (c.status === "active" && !contentOf(c).events.length) {
    const rng = rngFor(c, `content-event:${day}`)
    const seen = contentOf(c).seen
    const chapterRoll = rng()
    const worldRoll = rng()
    const chapterList = arr(CHAPTER_EVENTS[c.chapter]).filter((e) => !seen.includes(e.id) && (e.minWins || 0) <= (c.chapterWins || 0))
    let ev = null
    if (chapterList.length && chapterRoll < CHAPTER_EVENT_CHANCE) ev = chapterList[0]
    else if (day >= WORLD_EVENT_FIRST_DAY && worldRoll < WORLD_EVENT_CHANCE) {
      const fresh = WORLD_EVENTS.filter((e) => !seen.includes(e.id))
      ev = pick(fresh.length ? fresh : WORLD_EVENTS, rng)
    }
    const regionId = ev ? eventRegion(c, ev, rng, regionLive) : null
    if (ev && regionId) {
      const cc = contentOf(c)
      const inst = { uid: cc.nextUid, id: ev.id, regionId, day, expiresDay: day + (ev.days || 2) }
      c = withContent(c, { events: [...cc.events, inst], seen: [...new Set([...cc.seen, ev.id])], nextUid: cc.nextUid + 1 })
      lines.push(`${ev.icon} ${ev.title} - near ${regionDef(regionId)?.short || regionId}. Open it on the map.`)
    }
  }
  return { c, lines }
}

// An event's options with their blocks (can't pay).
export function eventOptions(c, uid) {
  const inst = contentOf(c).events.find((e) => e.uid === uid)
  const def = inst ? eventDef(inst.id) : null
  if (!def) return []
  return def.options.map((o) => {
    let blocked = null
    if (o.cost?.essence && (c.essence || 0) < o.cost.essence) blocked = `Needs ${o.cost.essence} Essence`
    if (o.cost?.leyShards && (c.leyShards || 0) < o.cost.leyShards) blocked = `Needs ${o.cost.leyShards} Ley Shard${o.cost.leyShards > 1 ? "s" : ""}`
    return { ...o, blocked }
  })
}

// Picks an option. `helpers` = { regionLive, recruit(c, tier, salt) -> { c, hero } }.
export function chooseContentEvent(c0, uid, optionId, helpers) {
  const inst = contentOf(c0).events.find((e) => e.uid === uid)
  const def = inst ? eventDef(inst.id) : null
  const opt = eventOptions(c0, uid).find((o) => o.id === optionId)
  if (!def || !opt || opt.blocked || c0.status !== "active") return c0
  let c = withContent(c0, { events: contentOf(c0).events.filter((e) => e.uid !== uid) })
  const applied = applyContentEffects(c, opt.effects || {}, inst.regionId, helpers, `event:${uid}`)
  c = applied.c
  c = withContent(c, { lastEvent: { uid, id: def.id, optionId: opt.id, title: def.title, icon: def.icon, label: opt.label, result: opt.result, lines: applied.lines, day: c.day } })
  return { ...c, log: [...arr(c.log), `${def.icon} ${def.title}: ${opt.label}.`].slice(-40) }
}

export const dismissEventResult = (c) => withContent(c, { lastEvent: null })

function bumpRegion(c, regionId, n, regionLive) {
  return {
    ...c,
    regions: arr(c.regions).map((r) => (r.id === regionId && !r.fallen && regionLive(c, r.id) ? { ...r, threat: clamp(r.threat + n, 0, 99) } : r)),
  }
}

// Applies an effect object; returns { c, lines } (plain-English lines for the result card).
export function applyContentEffects(c0, eff, regionId, { regionLive, recruit }, salt) {
  let c = c0
  const lines = []
  const rng = rngFor(c, `content-effect:${salt}`)
  const here = regionDef(regionId)?.short || "here"
  const sign = (n) => (n > 0 ? `+${n}` : `${n}`)
  if (eff.essence) {
    c = { ...c, essence: Math.max(0, (c.essence || 0) + eff.essence) }
    lines.push(`${sign(eff.essence)} Essence`)
  }
  if (eff.leyShards) {
    c = { ...c, leyShards: Math.max(0, (c.leyShards || 0) + eff.leyShards) }
    lines.push(`${sign(eff.leyShards)} Ley Shard${Math.abs(eff.leyShards) > 1 ? "s" : ""}`)
  }
  if (eff.doom) {
    c = { ...c, doom: Math.max(0, (c.doom || 0) + eff.doom) }
    lines.push(`Doom ${sign(eff.doom)}`)
  }
  if (eff.threatHere && regionId) {
    c = bumpRegion(c, regionId, eff.threatHere, regionLive)
    lines.push(`${here} threat ${sign(eff.threatHere)}`)
  }
  for (const [id, n] of Object.entries(eff.threat || {})) {
    if (!regionLive(c, id)) continue
    c = bumpRegion(c, id, n, regionLive)
    lines.push(`${regionDef(id)?.short || id} threat ${sign(n)}`)
  }
  if (eff.threatAll) {
    for (const r of CAMPAIGN_REGIONS) c = bumpRegion(c, r.id, eff.threatAll, regionLive)
    lines.push(`Every region's threat ${sign(eff.threatAll)}`)
  }
  if (eff.healAll) {
    c = { ...c, roster: arr(c.roster).map((h) => ({ ...h, hpPct: 1 })), commander: { ...c.commander, hpPct: 1 } }
    lines.push("Every hero heals to full")
  }
  if (eff.hurtAll) {
    c = { ...c, roster: arr(c.roster).map((h) => ({ ...h, hpPct: Math.max(0.05, (h.hpPct ?? 1) - eff.hurtAll) })) }
    lines.push(`Every hero -${Math.round(eff.hurtAll * 100)}% HP`)
  }
  if (eff.xpAll) {
    c = { ...c, roster: arr(c.roster).map((h) => ({ ...h, xp: (h.xp || 0) + eff.xpAll })) }
    lines.push(`Every hero +${eff.xpAll} XP`)
  }
  if (eff.tire) {
    const ready = arr(c.roster).filter((h) => (h.tiredUntil || 0) <= c.day && (h.hpPct ?? 1) >= 0.5).slice(0, eff.tire)
    const keys = new Set(ready.map((h) => h.key))
    c = { ...c, roster: arr(c.roster).map((h) => (keys.has(h.key) ? { ...h, tiredUntil: c.day + 1 } : h)) }
    if (ready.length) lines.push(`${ready.map((h) => h.name).join(" and ")} rest${ready.length === 1 ? "s" : ""} a day`)
  }
  if (eff.recruit && recruit) {
    const made = recruit(c, eff.recruit, salt)
    c = made.c
    lines.push(made.hero ? `${made.hero.name} the ${UNITS[made.hero.defId]?.name || "hero"} joins the Hearth` : "No room in the Barracks - they find work elsewhere")
  }
  if (eff.item) {
    const pool = itemPool().filter((i) => (eff.item === "rare" ? i.rarity === "rare" || i.rarity === "epic" : i.rarity === "common" || i.rarity === "uncommon"))
    const it = pick(pool, rng)
    if (it) {
      const key = c.itemKeyCounter || 1
      c = { ...c, items: [...arr(c.items), { key, defId: it.id, equippedTo: null, slotIndex: null }], itemKeyCounter: key + 1 }
      lines.push(`Gear: ${ITEMS[it.id].name}`)
    }
  }
  if (eff.relic) {
    const owned = new Set(arr(c.relics))
    const rel = pick(relicPool().filter((x) => !owned.has(x.id)), rng)
    if (rel) {
      c = { ...c, relics: [...arr(c.relics), rel.id] }
      lines.push(`Relic: ${RELICS[rel.id]?.name || rel.id}`)
    }
  }
  if (eff.mendLine) {
    const cut = arr(c.ley?.cut)
    const line = LEY_LINES.find((l) => cut.includes(l.id) && (l.a === regionId || l.b === regionId)) || LEY_LINES.find((l) => cut.includes(l.id))
    if (line) {
      c = { ...c, ley: { ...(c.ley || {}), cut: cut.filter((id) => id !== line.id) } }
      lines.push(`The ${regionDef(line.a)?.short}-${regionDef(line.b)?.short} ley line is mended`)
    } else lines.push("No cut ley lines to mend - the song settles into the ground")
  }
  for (const L of [eff.lasting].flat().filter(Boolean)) {
    const cc = contentOf(c)
    const e = { ...L, uid: cc.nextUid, untilDay: c.day + (L.days || 3) - 1, label: L.label || L.title || L.name }
    c = withContent(c, { effects: [...cc.effects, e], nextUid: cc.nextUid + 1 })
    lines.push(LASTING_KINDS[e.kind]?.word(e) + (e.kind === "ally" || e.kind === "rival" ? "" : ` (${L.days || 3} days)`))
  }
  return { c, lines }
}

// ---------------------------------------------------------------------------
// After a mission fight
// ---------------------------------------------------------------------------

// `res` = tacticsCampaignOps.campaignOpsResult(battle). Returns { c, lines, rewards }.
export function contentAftermath(c0, m, res, won, { recruit }) {
  let c = c0
  const lines = []
  const rewards = []
  if (!m) return { c, lines, rewards }
  // One-fight allies / rivals are spent (win or lose); a beaten rival pays its bounty.
  const content = contentOf(c)
  const fates = contentFates(c, m)
  const spent = new Set(fates.map((f) => Number(String(f.id).replace("content-", ""))))
  if (spent.size) {
    const rival = content.effects.find((e) => e.kind === "rival" && spent.has(e.uid))
    c = withContent(c, { effects: content.effects.filter((e) => !spent.has(e.uid)) })
    if (rival && won && rival.bounty) {
      c = { ...c, essence: (c.essence || 0) + rival.bounty }
      rewards.push(`Bounty: +${rival.bounty} Essence (${rival.name})`)
    }
  }
  if (res) {
    if (res.freed > 0 && recruit) {
      for (let i = 0; i < res.freed; i++) {
        const made = recruit(c, "common", `captive:${m.id}:${i}`)
        c = made.c
        if (made.hero) rewards.push(`${made.hero.name} the ${UNITS[made.hero.defId]?.name} - freed from a Rot cage - joins you`)
      }
    }
    if (res.leySevered > 0) {
      const cut = arr(c.ley?.cut)
      const line = LEY_LINES.find((l) => !cut.includes(l.id) && (l.a === m.regionId || l.b === m.regionId))
      if (line) {
        c = { ...c, ley: { ...(c.ley || {}), cut: [...cut, line.id] } }
        lines.push(`✂ The Ley-Cutter's knife went deep: the ${regionDef(line.a)?.short}-${regionDef(line.b)?.short} ley line is CUT.`)
      }
    }
    if (res.shardsTaken > 0 && won) {
      c = { ...c, leyShards: (c.leyShards || 0) + res.shardsTaken }
      rewards.push(`+${res.shardsTaken} Ley Shard${res.shardsTaken > 1 ? "s" : ""} from a Shard Hoarder`)
    }
  }
  if (m.type === "warlord" && won) {
    const ch = m.chapterOf || c.chapter
    c = withContent({ ...c, doom: Math.max(0, (c.doom || 0) - WARLORD_DOOM_RELIEF) }, { warlords: { ...contentOf(c).warlords, [ch]: "beaten" } })
    lines.push(`👑 ${CAMPAIGN_BOSS_FIGHTS[m.bossId]?.name || "The Named Foe"} is beaten. The chapter breathes easier. Doom -${WARLORD_DOOM_RELIEF}.`)
  }
  return { c, lines, rewards }
}

export const isContentType = (type) => CONTENT_TYPES.includes(type)
export const missionTypeDef = (type) => MISSION_TYPES[type] || null
