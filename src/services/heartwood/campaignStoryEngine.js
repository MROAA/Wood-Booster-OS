// Hearthwood - THE LONG CAMPAIGN, part 2: the branching story.
//
// Purpose: reads the hand-written story graph (data/heartwood/
// campaignStory.js) against a campaign's story flags.
//
// Responsibilities:
//   - the story slice of a campaign (`c.story`): newStory / normalizeStory
//   - which chapter variant + story region comes next (storyBeat)
//   - which choice scene a story win opens + which options are open
//   - applying a choice to the campaign (applyStoryChoiceCore) - flags,
//     resources, map marks, nemeses, the chronicle, the ending
//   - what the story adds to a mission fight: the faction ally, the
//     hunting nemesis, Overcharge, extra threat (fight fates in the same
//     shape betweenFights.js uses, so tacticsBetweenFights builds them)
//   - region marks (allied / warded / drained / sunk) and their threat
//   - which endings are within reach (endingsInReach)
//
// Dependencies: data/heartwood/campaignStory.js, data/heartwood/enemies.js,
// data/heartwood/units.js, data/heartwood/relics.js. Never imports
// campaignEngine.js (that file calls in here; heroes the story adds are
// made there via the `heroes` list applyStoryChoiceCore returns).
// Pure + deterministic, no storage.
//
// Public API: the exports below. Examples + tests:
// .scratch/verify_campaign_story.mjs.
import {
  FACTIONS, UNIQUE_HEROES, NEMESES, REGION_MODS, STORY_BEATS, CHAPTER_SCENES, STORY_SCENES, ENDINGS, ENDING_ORDER,
  LEY_WARDEN_ALLY, LEY_DRAIN_OVERCHARGE, HOLLOW_ROAD_OVERCHARGE, HUNTS_TO_ROUT, HUNT_EVERY_DAYS, HUNT_FIRST_DELAY,
  HUNT_THREAT_BONUS, START_VARIANTS,
} from "../../data/heartwood/campaignStory"
import { ENEMIES, ACT_ENEMIES } from "../../data/heartwood/enemies"
import { UNITS } from "../../data/heartwood/units"
import { RELICS } from "../../data/heartwood/relics"

const arr = (v) => (Array.isArray(v) ? v : [])
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n))

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export function newStory(variant = null) {
  return {
    flags: {},
    mercy: 0,
    variant: variant && START_VARIANTS[variant] ? variant : null,
    pendingScene: null,
    lastResult: null,
    chronicle: [],
    nemeses: [],
    nextHuntDay: null,
    regionMods: {},
    opened: [],
    ending: null,
  }
}

// Old saves (part 1) have no story; anything malformed is reset to empty.
export function normalizeStory(s) {
  if (!s || typeof s !== "object") return newStory()
  return {
    ...newStory(),
    ...s,
    flags: s.flags && typeof s.flags === "object" ? s.flags : {},
    chronicle: arr(s.chronicle),
    nemeses: arr(s.nemeses).filter((n) => n && NEMESES[n.id]),
    regionMods: s.regionMods && typeof s.regionMods === "object" ? s.regionMods : {},
    opened: arr(s.opened),
    pendingScene: s.pendingScene && STORY_SCENES[s.pendingScene] ? s.pendingScene : null,
  }
}

export const storyOf = (c) => c?.story || newStory()
export const storyFlags = (c) => storyOf(c).flags || {}

// { flag: [values] } - every key must match; `any: [req...]` - one must.
export function matchesReq(flags, req) {
  if (!req) return true
  return Object.entries(req).every(([k, v]) => {
    if (k === "any") return arr(v).some((r) => matchesReq(flags, r))
    return arr(v).includes(flags?.[k])
  })
}

// ---------------------------------------------------------------------------
// Chapters + scenes
// ---------------------------------------------------------------------------

// The chapter's story mission: { title, line, region }.
export function storyBeat(c, chapter = c?.chapter || 1) {
  const list = STORY_BEATS[clamp(chapter, 1, 7)] || STORY_BEATS[1]
  const flags = storyFlags(c)
  return list.find((b) => matchesReq(flags, b.when)) || list[list.length - 1]
}

// The choice scene a chapter's story win opens.
export function sceneForChapter(c, chapter) {
  const list = CHAPTER_SCENES[chapter] || []
  const flags = storyFlags(c)
  return (list.find((s) => matchesReq(flags, s.when)) || list[list.length - 1])?.scene || null
}

export const sceneDef = (id) => STORY_SCENES[id] || null

// The options of a scene with `blocked` = why it can't be picked (or null).
export function sceneOptions(c, sceneId) {
  const scene = sceneDef(sceneId)
  if (!scene) return []
  const flags = storyFlags(c)
  return scene.options.map((o) => ({ ...o, blocked: matchesReq(flags, o.requires) ? null : o.locked || "Not open to you." }))
}

// Endings whose final option is open for these flags (the fallback always is).
export function endingsInReach(flags) {
  const opts = STORY_SCENES["last-root"].options
  return ENDING_ORDER.filter((id) => {
    const o = opts.find((x) => x.effects?.ending === id)
    return o && matchesReq(flags, o.requires)
  })
}

// ---------------------------------------------------------------------------
// Map marks + regions
// ---------------------------------------------------------------------------

export const regionMod = (c, regionId) => storyOf(c).regionMods?.[regionId] || null
export const regionSunk = (c, regionId) => regionMod(c, regionId) === "sunk"
export function storyThreatMult(c, regionId) {
  const m = REGION_MODS[regionMod(c, regionId)]
  return m ? m.threatMult : 1
}
export const storyOpened = (c, regionId) => arr(storyOf(c).opened).includes(regionId)

// The faction whose home this region is, if that faction is your ally.
export function alliedFaction(c) {
  return FACTIONS[storyFlags(c).ally] || null
}

// ---------------------------------------------------------------------------
// Nemeses
// ---------------------------------------------------------------------------

export const activeNemeses = (c) => arr(storyOf(c).nemeses).filter((n) => !n.routed)

export function nemesisEnemy(nemesisId, act) {
  const def = NEMESES[nemesisId]
  const want = def?.enemies?.[clamp(act, 1, 7) - 1]
  if (want && ENEMIES[want]) return want
  return (ACT_ENEMIES[clamp(act, 1, 7)] || []).find((id) => ENEMIES[id]) || "mist-growler"
}

// The nemesis a new Hunter mission is for (round-robin by day).
export function huntNemesisFor(c) {
  const list = activeNemeses(c)
  if (!list.length) return null
  return list[(c.day || 0) % list.length]
}

export function huntDue(c) {
  const s = storyOf(c)
  return activeNemeses(c).length > 0 && s.nextHuntDay != null && c.day >= s.nextHuntDay
}

export function scheduleNextHunt(c) {
  return { ...c, story: { ...storyOf(c), nextHuntDay: c.day + HUNT_EVERY_DAYS } }
}

// A Hunter mission won: the nemesis is beaten once more; at HUNTS_TO_ROUT it leaves.
export function beatNemesis(c, nemesisId) {
  const s = storyOf(c)
  const lines = []
  const nemeses = s.nemeses.map((n) => {
    if (n.id !== nemesisId || n.routed) return n
    const beaten = (n.beaten || 0) + 1
    if (beaten >= HUNTS_TO_ROUT) {
      lines.push(`${NEMESES[n.id].icon} ${NEMESES[n.id].routed}`)
      return { ...n, beaten, routed: true, routedDay: c.day }
    }
    lines.push(`${NEMESES[n.id].icon} ${NEMESES[n.id].name} is beaten back - but not gone. (${beaten}/${HUNTS_TO_ROUT})`)
    return { ...n, beaten }
  })
  return { c: { ...c, story: { ...s, nemeses } }, lines }
}

// ---------------------------------------------------------------------------
// What the story adds to a mission fight
// ---------------------------------------------------------------------------

// Ally fate (the betweenFights.js instance shape - tacticsBetweenFights
// reads `kind`, `unit`, `allyName`, `title`, `wait`, `done`).
export function storyAllyFate(c, mission) {
  if (!mission) return null
  const flags = storyFlags(c)
  const faction = alliedFaction(c)
  const mk = (unit, allyName, title, id) =>
    UNITS[unit] ? { uid: `story-${id}@${mission.id}`, id: `story-${id}`, kind: "ally", unit, allyName, title, wait: 0, left: 1, done: false } : null
  if (faction && (mission.type === "story" || mission.type === "hunt" || mission.type === "allied" || mission.regionId === faction.region)) {
    return mk(faction.allyUnit, faction.allyName, faction.name, faction.id)
  }
  if (flags.ley === "ward" && mission.type === "ley") return mk(LEY_WARDEN_ALLY.unit, LEY_WARDEN_ALLY.name, "The Ley Wardens", "wardens")
  return null
}

// Rival fate: a Hunter mission's nemesis, or the first active nemesis
// turning up at a story mission (a stronger enemy group).
export function storyRivalFate(c, mission) {
  if (!mission) return null
  let id = null
  if (mission.type === "hunt") id = mission.nemesisId
  else if (mission.type === "story") id = activeNemeses(c)[0]?.id || null
  const def = NEMESES[id]
  if (!def) return null
  return {
    uid: `story-nemesis-${id}@${mission.id}`,
    id: `story-nemesis-${id}`,
    kind: "rival",
    enemyId: nemesisEnemy(id, mission.act || 1),
    rivalName: def.rivalName,
    title: def.title,
    wait: 0,
    left: 1,
    done: false,
  }
}

export function storyFates(c, mission) {
  return [storyAllyFate(c, mission), storyRivalFate(c, mission)].filter(Boolean)
}

// Extra Overcharge every fight gets from the story (drained ley, a Hollow Road start).
export function storyOvercharge(c) {
  const s = storyOf(c)
  return (s.flags?.ley === "drain" ? LEY_DRAIN_OVERCHARGE : 0) + (s.variant === "hollow-road" ? HOLLOW_ROAD_OVERCHARGE : 0)
}

export const storyThreatBonus = (mission) => (mission?.type === "hunt" ? HUNT_THREAT_BONUS : 0)

// ---------------------------------------------------------------------------
// Applying a choice
// ---------------------------------------------------------------------------

// Opens the scene a chapter's story win earned (called by resolveMission).
export function queueChapterScene(c, chapterWon) {
  const sceneId = sceneForChapter(c, chapterWon)
  if (!sceneId) return c
  return { ...c, story: { ...storyOf(c), pendingScene: sceneId, lastResult: null } }
}

// Applies the option to the campaign EXCEPT making heroes (the caller
// does that from `heroes`). Returns { c, heroes, lines } or null when the
// option can't be picked. Plain-English `lines` go to the chronicle.
export function applyStoryChoiceCore(c0, optionId) {
  const s0 = storyOf(c0)
  const scene = sceneDef(s0.pendingScene)
  if (!scene) return null
  const opt = sceneOptions(c0, scene.id).find((o) => o.id === optionId)
  if (!opt || opt.blocked) return null
  const e = opt.effects || {}
  let c = c0
  let s = { ...s0, flags: { ...s0.flags, ...(e.flags || {}) }, mercy: (s0.mercy || 0) + (e.mercy || 0) }
  const heroes = []
  if (e.essence) c = { ...c, essence: Math.max(0, (c.essence || 0) + e.essence) }
  if (e.leyShards) c = { ...c, leyShards: Math.max(0, (c.leyShards || 0) + e.leyShards) }
  if (e.doom) c = { ...c, doom: Math.max(0, (c.doom || 0) + e.doom) }
  if (e.relic && RELICS[e.relic] && !arr(c.relics).includes(e.relic)) c = { ...c, relics: [...arr(c.relics), e.relic] }
  if (e.xpAll) c = { ...c, roster: arr(c.roster).map((h) => ({ ...h, xp: (h.xp || 0) + e.xpAll })) }
  if (e.healAll) c = { ...c, roster: arr(c.roster).map((h) => ({ ...h, hpPct: 1 })), commander: { ...c.commander, hpPct: 1 } }
  if (e.hero && UNIQUE_HEROES[e.hero]) heroes.push(e.hero)
  if (e.regionMods) {
    s = { ...s, regionMods: { ...s.regionMods, ...e.regionMods } }
    // A sunk region is gone: its missions with it.
    const sunk = Object.entries(e.regionMods).filter(([, m]) => m === "sunk").map(([id]) => id)
    if (sunk.length) {
      c = {
        ...c,
        missions: arr(c.missions).filter((m) => !sunk.includes(m.regionId) || m.type === "story"),
        regions: arr(c.regions).map((r) => (sunk.includes(r.id) ? { ...r, threat: 0, fallen: false } : r)),
      }
    }
    // A drained region's Ley Sites dry up on the spot.
    const drained = Object.entries(e.regionMods).filter(([, m]) => m === "drained").map(([id]) => id)
    if (drained.length) c = { ...c, missions: arr(c.missions).filter((m) => !(m.type === "ley" && drained.includes(m.regionId))) }
  }
  if (e.threat || e.threatAll) {
    c = {
      ...c,
      regions: arr(c.regions).map((r) => {
        if (r.fallen || s.regionMods[r.id] === "sunk") return r
        const d = (e.threat?.[r.id] || 0) + (e.threatAll || 0)
        return d ? { ...r, threat: clamp(r.threat + d, 0, 99) } : r
      }),
    }
  }
  if (e.open) s = { ...s, opened: [...new Set([...arr(s.opened), ...e.open])] }
  if (e.nemesis && NEMESES[e.nemesis]) {
    const others = s.nemeses.filter((n) => n.id !== e.nemesis)
    s = {
      ...s,
      nemeses: [...others, { id: e.nemesis, since: c.day, beaten: 0, routed: false }],
      nextHuntDay: s.nextHuntDay != null && s.nextHuntDay > c.day ? s.nextHuntDay : c.day + HUNT_FIRST_DELAY,
    }
  }
  if (e.endNemesis) {
    s = { ...s, nemeses: s.nemeses.map((n) => (n.id === e.endNemesis ? { ...n, routed: true, routedDay: c.day } : n)) }
    c = { ...c, missions: arr(c.missions).filter((m) => !(m.type === "hunt" && m.nemesisId === e.endNemesis)) }
  }
  const unlock = e.ending && ENDINGS[e.ending] ? ENDINGS[e.ending].unlock : null
  if (e.ending && ENDINGS[e.ending]) s = { ...s, ending: e.ending }
  const entry = { chapter: scene.chapter, day: c.day, sceneId: scene.id, optionId: opt.id }
  s = {
    ...s,
    pendingScene: null,
    lastResult: { sceneId: scene.id, optionId: opt.id, heroes: [...heroes] },
    chronicle: [...arr(s.chronicle), entry],
  }
  c = { ...c, story: s }
  if (unlock && !arr(c.unlocks).includes(unlock)) c = { ...c, unlocks: [...arr(c.unlocks), unlock] }
  return { c, heroes, unlock }
}

// The chronicle, ready to show: what you chose and what it did.
export function chronicleEntries(c) {
  return arr(storyOf(c).chronicle).map((e) => {
    const scene = sceneDef(e.sceneId)
    const opt = scene?.options.find((o) => o.id === e.optionId)
    return { ...e, title: scene?.title || e.sceneId, icon: scene?.icon || "📜", label: opt?.label || e.optionId, say: opt?.say || "", stakes: opt?.stakes || [], result: opt?.result || "" }
  })
}

// A short plain-English "where the story stands" summary for the chronicle.
export function storyStanding(c) {
  const s = storyOf(c)
  const f = s.flags || {}
  const out = []
  const faction = alliedFaction(c)
  if (faction) out.push({ icon: faction.icon, text: `${faction.name} are your allies. Their warriors fight beside you in ${faction.region === "emberwrack" ? "Emberwrack" : faction.region === "mistfen" ? "Mistfen" : "the Deepening"} and every story mission.` })
  if (f.ley === "ward") out.push({ icon: "✦", text: "The Ley Wardens stand with you. Ley regions are Warded; Ley Sites pay an extra shard." })
  if (f.ley === "drain") out.push({ icon: "✦", text: `You drained the ley. Every fight starts +${LEY_DRAIN_OVERCHARGE} Overcharge.` })
  if (f.void === "sunk") out.push({ icon: "🌑", text: "The Hollow Ley is sunk under the King's flood." })
  if (f.void === "carried") out.push({ icon: "🌑", text: "You carry the Hollow King's dark." })
  if (f.void === "shared") out.push({ icon: "🌑", text: "The whole forest holds the Hollow King's dark, a little everywhere." })
  if (f.echo === "carried") out.push({ icon: "✧", text: "Spacemonkey's memory walks with you." })
  const herald = { spared: "You spared Maura the Rot-Herald.", broken: "You broke Maura's staff.", captive: "Maura is your prisoner.", ally: "Maura fights beside you.", regent: "Maura guards the empty throne.", betrayed: "You struck Maura down - she lived.", gone: "Maura laid down the thorn crown and left.", slain: "Maura is dead." }[f.herald]
  if (herald) out.push({ icon: "🥀", text: herald })
  for (const n of arr(s.nemeses)) {
    const def = NEMESES[n.id]
    out.push({ icon: def.icon, text: n.routed ? `${def.name} has been driven off.` : `${def.name} hunts you. (${n.beaten || 0}/${HUNTS_TO_ROUT} beaten)`, bad: !n.routed })
  }
  return out
}

export { FACTIONS, UNIQUE_HEROES, NEMESES, REGION_MODS, ENDINGS, ENDING_ORDER, START_VARIANTS, STORY_SCENES }
