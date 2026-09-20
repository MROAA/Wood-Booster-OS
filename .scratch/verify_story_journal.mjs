import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

const PORT = process.env.PORT || 5328
const SHOT_DIR = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-hw-journal/.scratch/shots"
await mkdir(SHOT_DIR, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
await page.waitForTimeout(400)

const eng = await page.evaluate(async () => {
  const t = Date.now()
  const E = await import("/src/services/heartwood/runEngine.js?t=" + t)
  const S = await import("/src/data/heartwood/storyLog.js?t=" + t)
  const out = {}

  // fresh run -> empty journal, but valid shape
  const j0 = S.buildJournal(E.startRun("tommy"))
  out.freshEmpty = j0.events.length === 0 && j0.crossroads.length === 0 && j0.milestones.length === 0 && j0.forest.state === "restless"

  // resolveEventChoice writes eventLog
  let rs = E.startRun("tommy")
  rs = { ...rs, phase: "event", nodeIndex: 11, path: rs.path.concat(Array(11).fill({ type: "shop" })) }
  const ev = E.eventForNode(rs)
  const after = E.resolveEventChoice(rs, 0)
  out.eventLogged = (after.eventLog || []).length === 1 && after.eventLog[0].title === ev.title && !!after.eventLog[0].choice

  // a crossroads pick shows in journal.crossroads with its grant
  let rc = E.startRun("tommy")
  rc = E.resolveActCrossroads({ ...rc, nodeIndex: 20, lastSeenAct: 1, phase: "shop", path: rc.path.concat(Array(20).fill({ type: "shop" })) }, 2, "purify")
  const jc = S.buildJournal(rc)
  out.crossroadsRow = jc.crossroads.length === 1 && jc.crossroads[0].act === 2 && !!jc.crossroads[0].grant && jc.forest.state === "purified"

  // a storyFlag with a label shows as a milestone; one without doesn't
  const jf = S.buildJournal({ ...E.startRun("tommy"), storyFlags: { heard_the_name: true, some_internal_plumbing_flag: true } })
  out.milestoneFiltered = jf.milestones.length === 1 && jf.milestones[0].includes("Hollow King")

  // save/restore keeps eventLog; legacy save without it still loads
  const ser = E.serializeRun(after)
  const de = E.deserializeRun(ser)
  out.roundTrip = (de?.eventLog || []).length === 1
  const legacy = E.serializeRun(after)
  delete legacy.run.eventLog
  out.legacyLoads = !!E.deserializeRun(legacy)

  // FLAG_LABELS keys are all real event flags (spot check a few)
  out.labelsSane = ["sealed_hollow_tree", "heard_the_name", "cut_the_toll_root"].every((k) => S.FLAG_LABELS[k])

  return out
})
console.log(JSON.stringify(eng, null, 2))

// --- DOM: journal toggle on the run map, populated after choices -----
await page.evaluate(async () => {
  const t = Date.now()
  const E = await import("/src/services/heartwood/runEngine.js?t=" + t)
  let rs = E.startRun("tommy", null, { forcedSeed: 5 })
  // stuff an eventLog + an allegiance + a flag directly
  rs = E.resolveActCrossroads(
    { ...rs, nodeIndex: 20, lastSeenAct: 1, phase: "shop", path: rs.path.concat(Array(20).fill({ type: "shop" })) },
    2, "purify",
  )
  rs = {
    ...rs,
    eventLog: [
      { id: "hollow-tree", title: "The Hollow Tree", choice: "Reach in and take it.", result: "Your fingers close on a smooth cold thing...", act: 1 },
    ],
    storyFlags: { ...rs.storyFlags, heard_the_name: true },
  }
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(E.serializeRun(rs)))
})
await page.reload()
await page.waitForTimeout(800)
const tn = page.locator("button.hw-tutorial-next")
if (await tn.isVisible({ timeout: 500 }).catch(() => false)) { await tn.click(); await page.waitForTimeout(200) }

const toggle = page.locator(".hw-journal-toggle")
const toggleVisible = await toggle.isVisible().catch(() => false)
const countBadge = await page.locator(".hw-journal-count").textContent().catch(() => null)
await toggle.click()
await page.waitForTimeout(400)
const sections = await page.locator(".hw-journal-section-label").allTextContents()
const crossroadsEntry = await page.locator(".hw-journal-section .hw-journal-entry-head").first().textContent().catch(() => null)
const grantShown = await page.locator(".hw-journal-grant").count()
const milestoneShown = await page.locator(".hw-journal-milestones li").count()
await page.locator(".hw-run-rail, .hw-run-map").first().screenshot({ path: `${SHOT_DIR}/story_journal_open.png` })
console.log("journal DOM:", { toggleVisible, countBadge, sections, crossroadsEntry, grantShown, milestoneShown })

const pass =
  eng.freshEmpty && eng.eventLogged && eng.crossroadsRow && eng.milestoneFiltered &&
  eng.roundTrip && eng.legacyLoads && eng.labelsSane &&
  toggleVisible && countBadge === "3" &&
  sections.includes("Crossroads") && sections.includes("What you carry") &&
  grantShown >= 1 && milestoneShown === 1 &&
  errors.length === 0

console.log("errors:", JSON.stringify(errors))
console.log(pass ? "RESULT: PASS" : "RESULT: FAIL")
await browser.close()
process.exit(pass ? 0 : 1)
