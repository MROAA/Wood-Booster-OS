// Hearthwood - the Four Tellings (First Song PRD §8: conflicting myths,
// evidence, your own interpretation) verify suite.
// Engine: evidence from real story flags (every evidence flag is really set
// by some event / crossroads), belief rules, the Forest's Choice tag, the
// ending's last word. UI: the Story Journal section + Believe button
// (saved), the belief tag on the Forest's Choice, the coda in the ending.
//   PORT=5460 node .scratch/verify_tellings.mjs
import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

const PORT = process.env.PORT || 5460
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
  const MY = await import("/src/services/heartwood/myths.js")
  const D = await import("/src/data/heartwood/myths.js")
  const EV = await import("/src/data/heartwood/events.js")
  const CR = await import("/src/data/heartwood/crossroads.js")
  const CI = await import("/src/data/heartwood/cinematics.js")
  const out = {}
  // every evidence flag is really set somewhere in the game
  const setFlags = new Set()
  for (const e of EV.EVENTS) for (const c of e.choices) for (const f of c.effects || []) if (f.flag) setFlags.add(f.flag)
  for (const cr of Object.values(CR.ACT_CROSSROADS)) for (const c of cr.choices) if (c.flag) setFlags.add(c.flag)
  out.orphanEvidence = Object.keys(D.EVIDENCE).filter((f) => !setFlags.has(f))
  out.endings = D.TELLING_ORDER.map((id) => D.TELLINGS[id].endingId)
  out.endingsExist = out.endings.every((id) => !!CI.cinematicById(id))
  const rs = { storyFlags: { sided_tide: true, heard_the_rememberer: true, read_the_barrow: true } }
  out.counts = MY.tellingsWithEvidence(rs).map((t) => [t.id, t.evidence.length])
  out.noEvidence = MY.believe(rs, "ember").belief ?? null
  const b = MY.believe(rs, "tide")
  out.believed = b.belief
  out.doubted = MY.believe(b, "tide").belief
  out.tagRooted = MY.beliefForEnding(b, "ending-rooted")
  out.tagEmber = MY.beliefForEnding(b, "ending-ember")
  const thin = MY.believe(rs, "stone")
  out.thinTag = MY.beliefForEnding(thin, "ending-hollow")?.borneOut
  const base = CI.cinematicById("ending-rooted")
  const last = (c) => c.lines[c.lines.length - 1]
  out.coda = last(MY.cinematicWithBelief(base, b))
  out.otherWay = last(MY.cinematicWithBelief(CI.cinematicById("ending-ember"), b))
  out.thinLine = last(MY.cinematicWithBelief(CI.cinematicById("ending-hollow"), thin))
  out.noBelief = MY.cinematicWithBelief(base, rs).lines.length === base.lines.length
  out.introUntouched = MY.cinematicWithBelief(CI.cinematicById("intro"), b).lines.length === CI.cinematicById("intro").lines.length
  return out
})

ok(eng.orphanEvidence.length === 0, "T1 every piece of evidence comes from a real choice in the game", eng.orphanEvidence)
ok(new Set(eng.endings).size === 4 && eng.endingsExist, "T2 four tellings, each leaning to a different real ending", eng.endings)
ok(JSON.stringify(eng.counts) === '[["ember",0],["tide",2],["stone",1],["song",0]]', "T3 evidence gathers from the run's own choices", eng.counts)
ok(eng.noEvidence === null && eng.believed === "tide" && eng.doubted === null, "T4 believing needs evidence; believing again lets it go", [eng.noEvidence, eng.believed, eng.doubted])
ok(eng.tagRooted && eng.tagRooted.borneOut === true && eng.tagEmber === null && eng.thinTag === false, "T5 the Forest's Choice marks your belief's path, and whether the evidence agrees", { r: !!eng.tagRooted, e: eng.tagEmber, thin: eng.thinTag })
ok(/Tide Folk/.test(eng.coda.line) && eng.coda.belief === "tide", "T6 your ending, borne out: the telling's own last word", eng.coda)
ok(/chose another way/.test(eng.otherWay.line), "T7 another ending: the forest notes you believed otherwise", eng.otherWay)
ok(/very little/.test(eng.thinLine.line), "T8 believed on thin evidence: a quieter last word", eng.thinLine)
ok(eng.noBelief && eng.introUntouched, "T9 no belief / not an ending: the cinematic is unchanged")

// ---------------- UI ----------------
const seed = (extra) =>
  page.evaluate(async (extra) => {
    localStorage.setItem("heartwood-story-intro-seen", "true")
    const E = await import("/src/services/heartwood/runEngine.js")
    const rs = { ...E.startRun("tommy", null, { forcedSeed: 5 }), storyFlags: { sided_tide: true, heard_the_rememberer: true, read_the_barrow: true }, ...extra }
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(E.serializeRun(rs)))
  }, extra)
await seed({})
await page.reload({ waitUntil: "domcontentloaded" })
await page.waitForSelector(".hw-journal-toggle", { timeout: 15000 }).catch(() => {})
await page.locator(".hw-journal-toggle").first().click()
await page.waitForSelector("[data-tellings]", { timeout: 5000 }).catch(() => {})
ok((await page.locator("[data-tellings] .hw-telling").count()) === 4 && (await page.locator(".hw-telling[data-unheard]").count()) === 2, "U1 the Story Journal shows the four tellings (two not heard yet)")
await page.locator("[data-believe='tide']").first().click()
await page.waitForTimeout(800)
const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("heartwood-run-save-v1")).run.belief)
ok(saved === "tide" && (await page.locator(".hw-telling[data-telling='tide'][data-believed]").count()) >= 1, "U2 'Believe this telling' is saved and shown", saved)
await page.locator("[data-tellings]").first().scrollIntoViewIfNeeded().catch(() => {})
await page.screenshot({ path: `${SHOTS}/tellings_journal.png` })

await seed({ phase: "victory", actFive: "choice", belief: "tide" })
await page.reload({ waitUntil: "domcontentloaded" })
await page.waitForSelector("[data-screen='forest-choice']", { timeout: 15000 }).catch(() => {})
await page.waitForTimeout(1200)
const tag = await page.locator(".hw-forest-choice-path[data-path='rooted'] [data-belief='tide']").innerText().catch(() => "")
ok(/what you believe/.test(tag) && /evidence agrees/.test(tag), "U3 the Forest's Choice: your belief on the Rooted path", tag)
await page.screenshot({ path: `${SHOTS}/tellings_choice.png` })
await page.locator(".hw-forest-choice-path[data-path='rooted']").click()
await page.waitForSelector("[data-screen='story-cinematic']", { timeout: 5000 }).catch(() => {})
let text = ""
for (let k = 0; k < 14; k++) {
  text = await page.locator("[data-screen='story-cinematic']").innerText().catch(() => text)
  if (/Tide Folk/.test(text)) break
  await page.locator(".hw-cinematic-inner").click({ position: { x: 10, y: 10 } }).catch(() => {})
  await page.waitForTimeout(350)
}
ok(/Tide Folk/.test(text), "U4 the ending's last word is the Tide telling's", text.slice(-200))
ok(pageErrors.length === 0, "U5 no page errors", pageErrors)

await browser.close()
const failed = results.filter((r) => !r.ok)
console.log(`verify_tellings: ${results.length - failed.length}/${results.length} passed`)
process.exit(failed.length ? 1 : 0)
