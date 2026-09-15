import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

const PORT = process.env.PORT || 5326
const SHOT_DIR = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-hw-cine/.scratch/shots"
await mkdir(SHOT_DIR, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
await page.waitForTimeout(400)

// --- Engine/data: endingIdForRun tally --------------------------------
const eng = await page.evaluate(async () => {
  const t = Date.now()
  const E = await import("/src/services/heartwood/runEngine.js?t=" + t)
  const C = await import("/src/data/heartwood/cinematics.js?t=" + t)
  const out = {}
  out.ids = Object.keys(C.CINEMATICS).sort()
  const base = E.startRun("tommy")
  out.noneRun = C.endingIdForRun(base) // -> rooted (canonical default)
  out.rooted = C.endingIdForRun({ ...base, runModifiers: ["rite-purified", "echo-refused"], forestState: "purified" })
  out.ember = C.endingIdForRun({ ...base, runModifiers: ["rite-strengthened", "side-ember"] })
  out.hollow = C.endingIdForRun({ ...base, runModifiers: ["hollow-accepted"], forestState: "corrupted" })
  // hollow-accepted weighs 2 + corrupted 1 = 3 hollow vs 0 -> hollow even alone
  out.hollowAloneVsOneRooted = C.endingIdForRun({ ...base, runModifiers: ["hollow-accepted", "side-tide"] })
  out.introLineCount = C.CINEMATICS.intro.lines.length
  out.endingsHaveTitles = ["ending-rooted", "ending-ember", "ending-hollow"].every((k) => C.CINEMATICS[k].title && C.CINEMATICS[k].lines.length >= 3)
  return out
})
console.log(JSON.stringify(eng, null, 2))

// --- DOM: intro plays before first shop, advances, is once-ever ------
await page.evaluate(() => { try { localStorage.clear() } catch {} })
await page.evaluate(async () => {
  const t = Date.now()
  const E = await import("/src/services/heartwood/runEngine.js?t=" + t)
  const rs = E.startRun("tommy")
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(E.serializeRun(rs)))
})
await page.reload()
await page.waitForTimeout(800)
const introVisible = await page.locator('[data-screen="story-cinematic"][data-cinematic="intro"]').isVisible().catch(() => false)
const firstSpeaker = await page.locator(".hw-cinematic-speaker").first().textContent().catch(() => null)
await page.screenshot({ path: `${SHOT_DIR}/intro_cinematic.png` })
// advance through by clicking the backdrop
let linesShown = await page.locator(".hw-cinematic-line").count()
for (let k = 0; k < 8; k++) {
  const continueBtn = page.locator(".hw-cinematic-prompt .hw-end-turn")
  if (await continueBtn.isVisible().catch(() => false)) break
  await page.locator(".hw-cinematic-inner").click({ position: { x: 10, y: 10 } })
  await page.waitForTimeout(150)
}
const linesAtEnd = await page.locator(".hw-cinematic-line").count()
const continueVisible = await page.locator(".hw-cinematic-prompt .hw-end-turn").isVisible().catch(() => false)
await page.locator(".hw-cinematic-prompt .hw-end-turn").click()
await page.waitForTimeout(500)
const introGone = !(await page.locator('[data-screen="story-cinematic"]').isVisible().catch(() => false))
const seenFlag = await page.evaluate(() => { try { return localStorage.getItem("heartwood-story-intro-seen") } catch { return null } })
// reload - intro must NOT replay
await page.reload()
await page.waitForTimeout(700)
const introReplayed = await page.locator('[data-screen="story-cinematic"][data-cinematic="intro"]').isVisible().catch(() => false)
console.log("intro:", { introVisible, firstSpeaker, linesShown, linesAtEnd, continueVisible, introGone, seenFlag, introReplayed })

// --- DOM: a won run plays the ending cinematic before RunEndOverlay --
await page.evaluate(async () => {
  const t = Date.now()
  const E = await import("/src/services/heartwood/runEngine.js?t=" + t)
  let rs = E.startRun("tommy")
  rs = {
    ...rs,
    phase: "victory",
    nodeIndex: 40,
    runModifiers: ["hollow-accepted", "echo-taken"],
    forestState: "corrupted",
    path: rs.path.concat(Array(40).fill({ type: "battle" })),
  }
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(E.serializeRun(rs)))
})
await page.reload()
await page.waitForTimeout(900)
const endingVisible = await page.locator('[data-screen="story-cinematic"]').isVisible().catch(() => false)
const endingId = await page.locator('[data-screen="story-cinematic"]').getAttribute("data-cinematic").catch(() => null)
const endingTitle = await page.locator(".hw-cinematic-title").textContent().catch(() => null)
await page.screenshot({ path: `${SHOT_DIR}/ending_cinematic.png` })
// skip to end
for (let k = 0; k < 10; k++) {
  const cb = page.locator(".hw-cinematic-prompt .hw-end-turn")
  if (await cb.isVisible().catch(() => false)) { await cb.click(); break }
  await page.locator(".hw-cinematic-inner").click({ position: { x: 10, y: 10 } })
  await page.waitForTimeout(120)
}
await page.waitForTimeout(500)
const runEndVisible = await page.locator(".hw-runend, [class*='runend'], .hw-run-end").first().isVisible().catch(() => false)
const cinematicGone = !(await page.locator('[data-screen="story-cinematic"]').isVisible().catch(() => false))
console.log("ending:", { endingVisible, endingId, endingTitle, cinematicGone, runEndVisible })

const pass =
  eng.ids.length === 4 &&
  eng.noneRun === "ending-rooted" && eng.rooted === "ending-rooted" &&
  eng.ember === "ending-ember" && eng.hollow === "ending-hollow" &&
  eng.hollowAloneVsOneRooted === "ending-hollow" &&
  eng.introLineCount >= 4 && eng.endingsHaveTitles &&
  introVisible && continueVisible && introGone && seenFlag === "true" && introReplayed === false &&
  linesAtEnd > linesShown &&
  endingVisible && endingId === "ending-hollow" && endingTitle === "The Hollow Crown" &&
  cinematicGone &&
  errors.length === 0

console.log("errors:", JSON.stringify(errors))
console.log(pass ? "RESULT: PASS" : "RESULT: FAIL")
await browser.close()
process.exit(pass ? 0 : 1)
