// Hearthwood - the Lost Expedition (First Song PRD §5) verify suite.
// Engine: the four events (camp, barrow, seer's heir, jarl's oath-stone),
// their chain gates, every choice's real consequences, the barrow rival
// fighting in a real tactics battle, the heir as an ally. UI: the event
// header names the thread, the journal records it.
//   PORT=5455 node .scratch/verify_expedition.mjs
import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

const PORT = process.env.PORT || 5455
const SHOTS = process.env.SHOTS || ".scratch/shots"
await mkdir(SHOTS, { recursive: true })
const results = []
const ok = (cond, name, extra) => {
  results.push({ ok: !!cond, name })
  if (!cond) console.log("FAIL:", name, extra !== undefined ? JSON.stringify(extra) : "")
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1536, height: 864 } })
const pageErrors = []
page.on("pageerror", (e) => pageErrors.push(e.message))
await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
await page.waitForTimeout(1500)

const eng = await page.evaluate(async () => {
  const E = await import("/src/services/heartwood/runEngine.js")
  const EV = await import("/src/data/heartwood/events.js")
  const BF = await import("/src/services/heartwood/betweenFights.js")
  const M = await import("/src/services/heartwood/tacticsRealMatchup.js")
  const out = {}
  const ids = ["longship-camp", "shieldmaiden-barrow", "the-seers-heir", "the-jarls-oath-stone"]
  const evs = ids.map((id) => EV.EVENTS.find((e) => e.id === id))
  out.exist = evs.map((e) => (e ? [e.act, e.requiresFlag || null, /Lost Expedition/.test(e.tag || "")] : null))
  const nodeOfAct = (act) => E.RUN_PATH.findIndex((n, i) => n.type === "event" && E.actIndexForNode(i, E.RUN_PATH.length) === act)
  // A run standing on this event (every other same-Act event already seen).
  const on = (id, extra = {}) => {
    const ev = EV.EVENTS.find((e) => e.id === id)
    const idx = nodeOfAct(ev.act)
    const seen = EV.EVENTS.filter((e) => e.act === ev.act && e.id !== id).map((e) => e.id)
    const rs = { ...E.startRun("tommy", null, { forcedSeed: 9 }), nodeIndex: idx, path: E.RUN_PATH.slice(0, idx + 1), phase: "event", seenEvents: seen, runes: [], essence: 100, regard: 0, bench: [{ key: "b0", defId: "the-fool", upgradeLevel: 0, upgrades: [] }], deployed: ["b0", null, null, null], items: [], ...extra }
    return { rs, picked: E.eventForNode(rs).id }
  }
  const choose = (id, i, extra) => {
    const { rs, picked } = on(id, extra)
    return { picked, next: E.resolveEventChoice(rs, i) }
  }
  // camp
  let r = choose("longship-camp", 0)
  out.campPicked = r.picked
  out.campChest = r.next.items.length
  r = choose("longship-camp", 1)
  out.campLog = { runes: r.next.runes.length, flag: !!r.next.storyFlags?.read_the_camp_log }
  r = choose("longship-camp", 2)
  out.campBurn = { essence: r.next.essence, regard: r.next.regard }
  // barrow
  r = choose("shieldmaiden-barrow", 0)
  const rival = (r.next.fates || []).find((f) => f.id === "barrow-wight-rival")
  out.barrowOpen = { relics: r.next.relics.length, rival: rival ? [rival.enemyId, rival.rivalName] : null }
  r = choose("shieldmaiden-barrow", 1)
  out.barrowOffer = { essence: r.next.essence, boon: (r.next.runModifiers || []).includes("stoneblood") }
  r = choose("shieldmaiden-barrow", 2)
  out.barrowRead = { flag: !!r.next.storyFlags?.read_the_barrow, regard: r.next.regard }
  // gates
  out.heirWithout = on("the-seers-heir").picked
  out.heirWith = on("the-seers-heir", { storyFlags: { read_the_camp_log: true } }).picked
  out.oathWithout = on("the-jarls-oath-stone").picked
  out.oathWith = on("the-jarls-oath-stone", { storyFlags: { read_the_barrow: true } }).picked
  // heir
  r = choose("the-seers-heir", 0, { storyFlags: { read_the_camp_log: true } })
  const ally = BF.fateAllyForFight(r.next)
  out.heirAlly = ally ? [ally.unit, ally.allyName] : null
  r = choose("the-seers-heir", 1, { storyFlags: { read_the_camp_log: true } })
  out.heirAsk = { flag: !!r.next.storyFlags?.knows_the_four_promises, runes: r.next.runes.length }
  // oath-stone
  r = choose("the-jarls-oath-stone", 0, { storyFlags: { read_the_barrow: true } })
  out.oathNoRune = r.next.phase === "event"
  r = choose("the-jarls-oath-stone", 0, { storyFlags: { read_the_barrow: true }, runes: ["bond", "echo"] })
  out.oathBreak = { runes: r.next.runes, boon: (r.next.runModifiers || []).includes("grove-warded"), regard: r.next.regard, flag: !!r.next.storyFlags?.broke_the_jarls_oath }
  r = choose("the-jarls-oath-stone", 1, { storyFlags: { read_the_barrow: true } })
  out.oathSwear = { boon: (r.next.runModifiers || []).includes("milestone-oath"), bane: (r.next.runModifiers || []).includes("name-burden"), regard: r.next.regard }
  // the barrow rival in a real fight
  const opened = choose("shieldmaiden-barrow", 0).next
  const fightIdx = E.RUN_PATH.findIndex((n, i) => i > opened.nodeIndex && n.type === "battle" && n.formationId)
  let rs = { ...opened, phase: "formation", nodeIndex: fightIdx, path: E.RUN_PATH.slice(0, fightIdx + 1), bench: [{ key: "b0", defId: "the-fool", upgradeLevel: 0, upgrades: [] }], deployed: ["b0", null, null, null] }
  // wait 1: tick one won fight, then it is due
  rs = BF.tickFatesAfterFight(rs)
  out.rivalDue = !!BF.fateRivalForFight(rs)
  const b = E.startTacticsFormationBattle(rs, (s) => M.buildRunTacticsBattle(rs, s)).battle
  const foe = b?.units.find((u) => u.fateRival)
  out.rivalOnBoard = foe ? [foe.defId, foe.name, foe.side] : null
  return out
})

ok(eng.exist.every((e) => e && e[2]) && JSON.stringify(eng.exist.map((e) => e[0])) === "[1,2,3,4]", "X1 four Lost Expedition events, Acts I-IV, tagged", eng.exist)
ok(eng.campPicked === "longship-camp" && eng.campChest === 1, "X2 the camp's sea-chest gives an item", eng.campChest)
ok(eng.campLog.runes === 1 && eng.campLog.flag, "X3 reading the tally-stick: a rune + the camp log", eng.campLog)
ok(eng.campBurn.essence === 140 && eng.campBurn.regard === -6, "X4 burning the camp: Essence, but the forest's regard drops", eng.campBurn)
ok(eng.barrowOpen.relics >= 1 && eng.barrowOpen.rival && eng.barrowOpen.rival[0] === "bonewarden", "X5 opening the barrow: a relic AND the Shieldmaiden hunts you", eng.barrowOpen)
ok(eng.barrowOffer.essence === 60 && eng.barrowOffer.boon, "X6 an offering: Stoneblood boon", eng.barrowOffer)
ok(eng.barrowRead.flag && eng.barrowRead.regard === 3, "X7 reading the barrow's runes: the oath-stone thread", eng.barrowRead)
ok(eng.heirWithout !== "the-seers-heir" && eng.heirWith === "the-seers-heir", "X8 the seer's heir only comes after the camp log", [eng.heirWithout, eng.heirWith])
ok(eng.oathWithout !== "the-jarls-oath-stone" && eng.oathWith === "the-jarls-oath-stone", "X9 the oath-stone only after the barrow's runes", [eng.oathWithout, eng.oathWith])
ok(eng.heirAlly && eng.heirAlly[1] === "Seer's Heir", "X10 the heir walks with you as an ally", eng.heirAlly)
ok(eng.heirAsk.flag && eng.heirAsk.runes === 1, "X11 asking the heir: lore + a rune", eng.heirAsk)
ok(eng.oathNoRune, "X12 breaking the oath needs a rune")
ok(JSON.stringify(eng.oathBreak.runes) === '["echo"]' && eng.oathBreak.boon && eng.oathBreak.regard === 10 && eng.oathBreak.flag, "X13 breaking the oath: a rune spent, Grove-Warded, the forest +10", eng.oathBreak)
ok(eng.oathSwear.boon && eng.oathSwear.bane && eng.oathSwear.regard === -5, "X14 swearing on it: strength AND a burden", eng.oathSwear)
ok(eng.rivalDue && eng.rivalOnBoard && eng.rivalOnBoard[0] === "bonewarden" && /Shieldmaiden/.test(eng.rivalOnBoard[1]) && eng.rivalOnBoard[2] === "enemy", "X15 the Barrow Shieldmaiden really fights you", eng.rivalOnBoard)

// ---------------- UI ----------------
await page.evaluate(async () => {
  localStorage.setItem("heartwood-story-intro-seen", "true")
  const E = await import("/src/services/heartwood/runEngine.js")
  const EV = await import("/src/data/heartwood/events.js")
  const idx = E.RUN_PATH.findIndex((n, i) => n.type === "event" && E.actIndexForNode(i, E.RUN_PATH.length) === 1)
  const seen = EV.EVENTS.filter((e) => e.act === 1 && e.id !== "longship-camp").map((e) => e.id)
  const rs = { ...E.startRun("tommy", null, { forcedSeed: 9 }), nodeIndex: idx, path: E.RUN_PATH.slice(0, idx + 1), phase: "event", seenEvents: seen, bench: [], deployed: [null, null, null, null], items: [], lastSeenAct: 1 }
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(E.serializeRun(rs)))
})
await page.reload({ waitUntil: "domcontentloaded" })
await page.waitForSelector(".hw-event-choice", { timeout: 15000 }).catch(() => {})
const header = await page.locator("[data-screen] h1, h1").first().innerText().catch(() => "")
const body = await page.locator("body").innerText()
ok(/Longship Camp/.test(header) && /lost expedition/i.test(body), "U1 the event screen names the thread: The Lost Expedition", header)
await page.screenshot({ path: `${SHOTS}/expedition_camp.png` })
await page.locator(".hw-event-choice").nth(1).click()
await page.waitForTimeout(500)
ok(/tally-stick|camp log/i.test(await page.locator("body").innerText()), "U2 choosing shows the hand-written result")
await page.locator(".hw-event-continue").click()
await page.waitForTimeout(1200)
const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("heartwood-run-save-v1")).run)
ok(saved.storyFlags?.read_the_camp_log && saved.runes.length === 2, "U3 the choice really applied (flag + rune in the save)", { flags: saved.storyFlags, runes: saved.runes })
const journal = await page.evaluate(async () => {
  const L = await import("/src/data/heartwood/storyLog.js")
  const rs = JSON.parse(localStorage.getItem("heartwood-run-save-v1")).run
  return JSON.stringify(L.buildJournal(rs))
})
ok(/four names, four promises/.test(journal), "U4 the Story Journal records it")
ok(pageErrors.length === 0, "U5 no page errors", pageErrors)

await browser.close()
const failed = results.filter((r) => !r.ok)
console.log(`verify_expedition: ${results.length - failed.length}/${results.length} passed`)
process.exit(failed.length ? 1 : 0)
