// Hearthwood - THE LEY NETWORK (mana sprint 3, the Long Campaign).
//
// Purpose: coloured ley LINES join the world-map regions
// (data/heartwood/campaign.js LEY_LINES). A line is LIVE when both of its
// regions are held (open, not fallen, not Threatened, not sunk) and it is
// not cut. The live lines that link back to the Hearthstead are your
// NETWORK; its STRENGTH (lines, Warded ones count double, a Drain surge
// adds 3) gives every mission fight:
//   - start mana: +4 per strength (as start Overcharge, max 32),
//   - regen: +1 per 2 strength (max 4),
//   - colours: every line colour in the network makes that colour's
//     skills 15% cheaper (tacticsManaColours.leyCostCut).
// The Rot tries to CUT lines: a LEY BREACH mission (expires in 2-3 days)
// appears on a network line every few days; ignore or lose it and the line
// is cut. Winning a Ley Site mends a cut line touching its region.
// Story (Ward/Drain ley choice): Warded regions' lines count double and
// can't be breached; Drained ley SURGES (+3 strength for 5 days), then the
// lines touching drained regions decay one by one.
// Responsibilities: network maths, the daily ley tick (breach spawn,
// expiry cuts, drain decay), mission results, fight bonuses.
// Dependencies: campaignEngine (region state, makeMission - call-time),
// campaignStoryEngine (story flags / region marks), seed.js.
// Public API: leyNetwork, leyFightBonus, leyDayTick, leyMissionResult,
// leyOnStoryChoice, leyLineState. Pure + deterministic.
// Tests: .scratch/verify_mana_3.mjs (ENGINE_ONLY=1).
import { LEY_LINES, LEY, THREAT_THREATENED, regionDef } from "../../data/heartwood/campaign"
import { MANA_COLOURS } from "../../data/heartwood/manaColours"
import { streamRng } from "../../data/heartwood/seed"
import { regionMod, storyFlags } from "./campaignStoryEngine"

const arr = (v) => (Array.isArray(v) ? v : [])

export const leyOf = (c) => ({ cut: arr(c?.ley?.cut), drainDay: c?.ley?.drainDay ?? null, nextBreachDay: c?.ley?.nextBreachDay ?? null })

// A region is "held" for the ley: open, not fallen / sunk, not Threatened.
// `open` is injected (campaignEngine.regionLive) so this file never imports it.
function heldFn(c, open) {
  return (id) => {
    const r = arr(c.regions).find((x) => x.id === id)
    if (!r || r.fallen || !open(c, id)) return false
    if (regionMod(c, id) === "sunk") return false
    return (r.threat || 0) < THREAT_THREATENED
  }
}

const touches = (line, id) => line.a === id || line.b === id

export function drainSurgeOn(c) {
  const d = leyOf(c).drainDay
  return d != null && storyFlags(c).ley === "drain" && c.day - d < LEY.drainSurgeDays
}

// Every line with its state: live / cut / dormant (an end not held), warded, connected.
export function leyLineState(c, open) {
  const held = heldFn(c, open)
  const cut = new Set(leyOf(c).cut)
  const lines = LEY_LINES.map((l) => {
    const warded = regionMod(c, l.a) === "warded" || regionMod(c, l.b) === "warded"
    const drained = regionMod(c, l.a) === "drained" || regionMod(c, l.b) === "drained"
    const isCut = cut.has(l.id)
    const live = !isCut && held(l.a) && held(l.b)
    return { ...l, cut: isCut, live, warded, drained, connected: false }
  })
  // Connected = reachable from the Hearthstead over live lines.
  const reach = new Set(held("hearthstead") ? ["hearthstead"] : [])
  for (let changed = true; changed; ) {
    changed = false
    for (const l of lines) {
      if (!l.live || l.connected) continue
      if (reach.has(l.a) || reach.has(l.b)) {
        l.connected = true
        reach.add(l.a)
        reach.add(l.b)
        changed = true
      }
    }
  }
  return lines
}

// The network + what it gives a fight.
export function leyNetwork(c, open) {
  const lines = leyLineState(c, open)
  const net = lines.filter((l) => l.connected)
  const surge = drainSurgeOn(c) ? LEY.drainSurge : 0
  const strength = net.reduce((s, l) => s + (l.warded ? 2 : 1), 0) + (net.length ? surge : 0)
  const colours = [...new Set(net.map((l) => l.colour))].sort()
  return {
    lines,
    size: net.length,
    strength,
    surge: net.length ? surge : 0,
    startMana: Math.min(LEY.startMax, LEY.startPerStrength * strength),
    regen: Math.min(LEY.regenMax, Math.floor(strength / LEY.regenEvery)),
    colours,
    regions: [...new Set(net.flatMap((l) => [l.a, l.b]))],
  }
}

// What one mission fight gets from the network (missionRunState).
export function leyFightBonus(c, open) {
  const n = leyNetwork(c, open)
  return { strength: n.strength, startMana: n.startMana, regen: n.regen, colours: n.colours, size: n.size }
}

// --- Day tick ------------------------------------------------------------------------------

// `makeMission` + `open` injected by campaignEngine.advanceDay; `expired` =
// the missions that just expired unanswered (breaches among them cut lines).
export function leyDayTick(c0, { open, makeMission, expired = [] }) {
  let c = { ...c0, ley: leyOf(c0) }
  const lines = []
  const cutLine = (id, why) => {
    if (c.ley.cut.includes(id)) return
    c = { ...c, ley: { ...c.ley, cut: [...c.ley.cut, id] } }
    const l = LEY_LINES.find((x) => x.id === id)
    lines.push(`⚡ The ${lineName(l)} ley line is CUT (${why}). Your ley network shrinks.`)
  }
  // Story: a Drain recorded on the first day after the choice.
  if (storyFlags(c).ley === "drain" && c.ley.drainDay == null) c = { ...c, ley: { ...c.ley, drainDay: c.day - 1 } }
  // Breaches left unanswered cut their line.
  for (const m of arr(expired)) if (m.type === "breach" && m.lineId) cutLine(m.lineId, "the breach went unanswered")
  // Drained ley: after the surge, one drained line decays every few days.
  const d = c.ley.drainDay
  if (d != null && storyFlags(c).ley === "drain") {
    const since = c.day - d - LEY.drainSurgeDays
    if (since >= 0 && since % LEY.drainDecayEvery === 0) {
      const decay = LEY_LINES.find((l) => !c.ley.cut.includes(l.id) && (regionMod(c, l.a) === "drained" || regionMod(c, l.b) === "drained"))
      if (decay) cutLine(decay.id, "the drained ley withers")
    }
  }
  // A new breach every few days on a network line (never a Warded one).
  const due = c.day >= LEY.breachFirstDay && (c.ley.nextBreachDay == null || c.day >= c.ley.nextBreachDay)
  const active = arr(c.missions).some((m) => m.type === "breach")
  if (due && !active) {
    const targets = leyLineState(c, open).filter((l) => l.connected && !l.warded)
    if (targets.length) {
      const rng = streamRng(c.seed, "world", `ley-breach:${c.day}`)
      const line = targets[Math.floor(rng() * targets.length)]
      const region = line.a === "hearthstead" ? line.b : line.a
      c = makeMission(c, "breach", region, rng, { lineId: line.id }).c
      lines.push(`⚡ The Rot is cutting the ${lineName(line)} ley line near ${regionDef(region)?.short}. Stop it before the breach closes.`)
    }
    c = { ...c, ley: { ...c.ley, nextBreachDay: c.day + LEY.breachEvery } }
  }
  return { c, lines }
}

export function lineName(l) {
  if (!l) return "a"
  return `${regionDef(l.a)?.short || l.a}-${regionDef(l.b)?.short || l.b}`
}

// A mission's result: a lost breach cuts its line; a won Ley Site mends one.
export function leyMissionResult(c0, mission, won) {
  if (!mission) return { c: c0, lines: [] }
  let c = { ...c0, ley: leyOf(c0) }
  const lines = []
  if (mission.type === "breach" && mission.lineId) {
    const l = LEY_LINES.find((x) => x.id === mission.lineId)
    if (won) lines.push(`✦ The ${lineName(l)} ley line holds.`)
    else if (!c.ley.cut.includes(mission.lineId)) {
      c = { ...c, ley: { ...c.ley, cut: [...c.ley.cut, mission.lineId] } }
      lines.push(`⚡ The ${lineName(l)} ley line is CUT. Your ley network shrinks.`)
    }
  }
  if (mission.type === "ley" && won) {
    const mend = LEY_LINES.find((l) => c.ley.cut.includes(l.id) && touches(l, mission.regionId) && regionMod(c, l.a) !== "drained" && regionMod(c, l.b) !== "drained")
    if (mend) {
      c = { ...c, ley: { ...c.ley, cut: c.ley.cut.filter((id) => id !== mend.id) } }
      lines.push(`✦ The ley spring mends the ${lineName(mend)} line.`)
    }
  }
  return { c, lines }
}

// Story choice: Warding mends the warded regions' lines; Draining starts the surge clock.
export function leyOnStoryChoice(c0, before) {
  const was = storyFlags(before).ley
  const now = storyFlags(c0).ley
  if (was === now) return c0
  let c = { ...c0, ley: leyOf(c0) }
  if (now === "ward") c = { ...c, ley: { ...c.ley, cut: c.ley.cut.filter((id) => { const l = LEY_LINES.find((x) => x.id === id); return !(l && (regionMod(c, l.a) === "warded" || regionMod(c, l.b) === "warded")) }) } }
  if (now === "drain") c = { ...c, ley: { ...c.ley, drainDay: c.day } }
  return c
}

export const colourName = (id) => MANA_COLOURS[id]?.name || id
