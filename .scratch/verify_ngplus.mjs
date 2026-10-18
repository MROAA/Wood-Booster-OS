// Hearthwood - New Game+ "the forest remembers" (First Song PRD §8, NAR-07)
// verify suite. Engine: the meta store's forestMemory (record / sanitize),
// a new run shaped by it (cycle, carried regard, extra runes), remembered
// truths opening story gates in a different order, the returning
// traveller's cairn, The New Verse gate + engine guard. UI: a real run end
// writes forestMemory; the run panel note; the Forest's Choice with the
// fourth path locked (first journey) and open (return journey) -> its
// ending cinematic.
//   PORT=5458 node .scratch/verify_ngplus.mjs
import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

const PORT = process.env.PORT || 5458
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
  localStorage.clear()
  const E = await import("/src/services/heartwood/runEngine.js")
  const FM = await import("/src/services/heartwood/forestMemory.js")
  const MS = await import("/src/services/heartwood/metaState.js")
  const EV = await import("/src/data/heartwood/events.js")
  const CI = await import("/src/data/heartwood/cinematics.js")
  const out = {}
  out.fresh = MS.loadMeta().forestMemory
  localStorage.setItem("heartwood-meta-v1", JSON.stringify({ version: 1, forestMemory: { cycle: "x", lore: ["read_the_barrow", "not-a-truth"], endings: [3, "ending-rooted"], lastRegard: "?" } }))
  out.sanitized = MS.loadMeta().forestMemory
  localStorage.clear()
  // record
  const lost = FM.recordForestMemory(null, { storyFlags: { read_the_camp_log: true, sealed_hollow_tree: true }, regard: 30 }, false)
  const won = FM.recordForestMemory(lost, { storyFlags: { read_the_barrow: true }, chosenEnding: "ending-rooted", regard: -12 }, true)
  out.lost = lost
  out.won = won
  // new runs
  const run = (mem, seed = 5) => E.startRun("tommy", null, { forcedSeed: seed, forestMemory: mem })
  const first = run(null)
  out.first = { cycle: first.cycle, remembered: first.rememberedLore, regard: first.regard, runes: first.runes.length }
  const ng1 = run({ cycle: 1, lore: ["read_the_camp_log"], endings: ["ending-rooted"], lastRegard: 45 })
  out.ng1 = { cycle: ng1.cycle, regard: ng1.regard, runes: ng1.runes, flags: ng1.storyFlags }
  out.ng2 = run({ cycle: 2, lore: [], endings: [], lastRegard: -90 })
  out.ng2 = { regard: out.ng2.regard, runes: out.ng2.runes.length, uniq: new Set(out.ng2.runes).size }
  out.ng5runes = run({ cycle: 5, lore: [], endings: [], lastRegard: 0 }).runes.length
  // story gates in a different order
  const at = (rs, act, id) => {
    const idx = E.RUN_PATH.findIndex((n, i) => n.type === "event" && E.actIndexForNode(i, E.RUN_PATH.length) === act)
    const seen = EV.EVENTS.filter((e) => e.act === act && e.id !== id).map((e) => e.id)
    return E.eventForNode({ ...rs, nodeIndex: idx, seenEvents: seen }).id
  }
  out.heirFirstJourney = at(first, 3, "the-seers-heir")
  out.heirRemembered = at(ng1, 3, "the-seers-heir")
  out.cairnFirst = at(first, 1, "the-cairn-you-built")
  out.cairnReturn = at(ng1, 1, "the-cairn-you-built")
  // The New Verse
  out.nv0 = FM.newVerseStatus(first)
  out.nv3 = FM.newVerseStatus({ ...ng1, rememberedLore: ["read_the_camp_log", "read_the_barrow"], storyFlags: { heard_the_name: true } })
  out.nv4 = FM.newVerseStatus({ ...ng1, rememberedLore: ["read_the_camp_log", "read_the_barrow"], storyFlags: { heard_the_name: true, knows_the_four_promises: true } })
  out.guardClosed = E.chooseForestPath({ ...first, actFive: "choice" }, "ending-newverse").actFive
  out.guardOpen = E.chooseForestPath({ ...ng1, actFive: "choice", rememberedLore: ["read_the_camp_log", "read_the_barrow", "heard_the_name", "knows_the_four_promises"] }, "ending-newverse").chosenEnding
  out.cine = !!CI.cinematicById("ending-newverse")?.lines?.length
  return out
})

ok(eng.fresh && eng.fresh.cycle === 0 && eng.fresh.lore.length === 0, "N1 a fresh meta store: the forest has never met you", eng.fresh)
ok(eng.sanitized.cycle === 0 && JSON.stringify(eng.sanitized.lore) === '["read_the_barrow"]' && JSON.stringify(eng.sanitized.endings) === '["ending-rooted"]' && eng.sanitized.lastRegard === 0, "N2 a broken store is cleaned, never crashes", eng.sanitized)
ok(eng.lost.cycle === 0 && JSON.stringify(eng.lost.lore) === '["read_the_camp_log"]' && eng.lost.lastRegard === 30, "N3 a LOST run still teaches truths (not a cycle)", eng.lost)
ok(eng.won.cycle === 1 && eng.won.lore.length === 2 && JSON.stringify(eng.won.endings) === '["ending-rooted"]' && eng.won.lastRegard === -12, "N4 a WON run counts a cycle and its ending", eng.won)
ok(eng.first.cycle === 0 && eng.first.remembered.length === 0 && eng.first.regard === 0 && eng.first.runes === 1, "N5 a first journey is unchanged", eng.first)
ok(eng.ng1.cycle === 1 && eng.ng1.regard === 15 && eng.ng1.runes.length === 2 && !eng.ng1.flags?.read_the_camp_log, "N6 a return journey: regard carried (a third), +1 rune, remembered truths NOT written as this run's flags", eng.ng1)
ok(eng.ng2.regard === -20 && eng.ng2.runes === 3 && eng.ng2.uniq === 3 && eng.ng5runes === 3, "N7 carried regard capped at 20, extra runes capped (pouch of 3)", { ng2: eng.ng2, ng5: eng.ng5runes })
ok(eng.heirFirstJourney !== "the-seers-heir" && eng.heirRemembered === "the-seers-heir", "N8 a remembered truth opens a story link early (different order)", [eng.heirFirstJourney, eng.heirRemembered])
ok(eng.cairnFirst !== "the-cairn-you-built" && eng.cairnReturn === "the-cairn-you-built", "N9 only a returning traveller finds the cairn", [eng.cairnFirst, eng.cairnReturn])
ok(!eng.nv0.open && !eng.nv0.returning && !eng.nv3.open && eng.nv3.known === 3 && eng.nv4.open && eng.nv4.known === 4, "N10 The New Verse: return journey + 4 truths (remembered + learned)", { nv0: eng.nv0, nv3: eng.nv3, nv4: eng.nv4 })
ok(eng.guardClosed === "choice" && eng.guardOpen === "ending-newverse", "N11 the engine refuses The New Verse when it isn't open", [eng.guardClosed, eng.guardOpen])
ok(eng.cine, "N12 The New Verse has its own ending cinematic")

// ---------------- UI ----------------
// A real run end writes forestMemory into the meta store.
await page.evaluate(async () => {
  localStorage.clear()
  localStorage.setItem("heartwood-story-intro-seen", "true")
  const E = await import("/src/services/heartwood/runEngine.js")
  const rs = { ...E.startRun("tommy", null, { forcedSeed: 5 }), phase: "defeat", storyFlags: { read_the_camp_log: true, read_the_barrow: true }, regard: 21 }
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(E.serializeRun(rs)))
})
await page.reload({ waitUntil: "domcontentloaded" })
await page.waitForTimeout(2500)
const written = await page.evaluate(() => JSON.parse(localStorage.getItem("heartwood-meta-v1") || "null")?.forestMemory)
ok(written && written.lore.length === 2 && written.cycle === 0 && written.lastRegard === 21, "U1 a real run end saves what the forest remembers", written)

// Forest's Choice, first journey: the fourth path shows, locked.
const choiceState = (mem, flags) =>
  page.evaluate(async ({ mem, flags }) => {
    const E = await import("/src/services/heartwood/runEngine.js")
    const rs = { ...E.startRun("tommy", null, { forcedSeed: 5, forestMemory: mem }), phase: "victory", actFive: "choice", storyFlags: flags }
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(E.serializeRun(rs)))
  }, { mem, flags })
await choiceState(null, {})
await page.reload({ waitUntil: "domcontentloaded" })
await page.waitForSelector("[data-screen='forest-choice']", { timeout: 15000 }).catch(() => {})
const lockedText = await page.locator(".hw-forest-choice-path[data-path='newverse']").innerText().catch(() => "")
ok((await page.locator(".hw-forest-choice-path").count()) === 4 && (await page.locator(".hw-forest-choice-path[data-path='newverse'][data-locked]").count()) === 1 && /return journey/i.test(lockedText), "U2 first journey: The New Verse shows, locked, saying why", lockedText)
await page.screenshot({ path: `${SHOTS}/ngplus_choice_locked.png` })

// Return journey with enough truths: open -> its cinematic.
await choiceState({ cycle: 1, lore: ["read_the_camp_log", "read_the_barrow", "heard_the_name"], endings: ["ending-rooted"], lastRegard: 30 }, { knows_the_four_promises: true })
await page.reload({ waitUntil: "domcontentloaded" })
await page.waitForSelector("[data-screen='forest-choice']", { timeout: 15000 }).catch(() => {})
ok((await page.locator(".hw-forest-choice-path[data-path='newverse']:not([data-locked])").count()) === 1, "U3 return journey + 4 truths: The New Verse is open")
await page.screenshot({ path: `${SHOTS}/ngplus_choice_open.png` })
await page.locator(".hw-forest-choice-path[data-path='newverse']").click()
await page.waitForTimeout(1200)
const cine = await page.locator("[data-screen='story-cinematic']").getAttribute("data-cinematic").catch(() => null)
ok(cine === "ending-newverse", "U4 choosing it plays The New Verse", cine)

// Run panel note on a return journey (fork screen shows RunBuildPanel).
await page.evaluate(async () => {
  const E = await import("/src/services/heartwood/runEngine.js")
  const BF = await import("/src/services/heartwood/betweenFights.js")
  const pool = E.RUN_PATH.filter((n) => n.type === "battle" && n.formationId)
  const rs = { ...E.startRun("tommy", null, { forcedSeed: 5, forestMemory: { cycle: 1, lore: ["read_the_camp_log"], endings: [], lastRegard: 0 } }), phase: "choice", nodeIndex: 0, path: E.RUN_PATH.slice(0, 1), battlePool: pool.slice(2, 6), floorChoices: BF.decorateRouteOptions(pool.slice(0, 2), { seed: 5, nodeIndex: 1, act: 1 }) }
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(E.serializeRun(rs)))
})
await page.reload({ waitUntil: "domcontentloaded" })
await page.waitForSelector("[data-forest-memory]", { timeout: 15000 }).catch(() => {})
const note = await page.locator("[data-forest-memory]").first().innerText().catch(() => "")
ok(/Return journey 2/.test(note) && /longship camp/.test(note), "U5 the run panel: return journey + what the forest remembers", note)
await page.locator("[data-forest-memory]").first().scrollIntoViewIfNeeded().catch(() => {})
await page.screenshot({ path: `${SHOTS}/ngplus_panel.png` })
ok(pageErrors.length === 0, "U6 no page errors", pageErrors)

await browser.close()
const failed = results.filter((r) => !r.ok)
console.log(`verify_ngplus: ${results.length - failed.length}/${results.length} passed`)
process.exit(failed.length ? 1 : 0)
