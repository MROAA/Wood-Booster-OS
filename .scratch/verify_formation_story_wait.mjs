import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

// Hearthwood - run-flow + story polish (fix/hearthwood-formation-story-wait):
//  1. FormationScreen: the 5s auto-start timer is HELD on a stop that
//     carries story to read (a Trial intro, or a hand-authored node
//     `beat`) - it waits for the player to press Start Battle. A routine
//     fight still auto-starts.
//  2. RunMap RunRail: shows only the CURRENT Act's stretch, not all 7.
//  3. trials.js: the 4 deep-Act Trial intro/victory lines were half
//     Finnish - now fully English.
// Display/content only - no engine/save change; fairness is a smoke check.

const PORT = process.env.PORT || 5371
const SHOT = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-story-wait/.scratch/shots"
await mkdir(SHOT, { recursive: true })

const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1536, height: 1000 } })).newPage()
const errs = []
page.on("pageerror", (e) => errs.push(String(e)))
page.on("console", (m) => m.type() === "error" && errs.push(m.text()))
await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForSelector(".hw-commander-card", { timeout: 20000 })

// --- 1. trials.js is all English ------------------------------------
const dataOut = await page.evaluate(async () => {
  const { TRIALS } = await import("/src/data/heartwood/trials.js")
  const FINNISH = /(Sinä|sinä|sydän|tyhjyy|metsä|korruptio|täytyy|[äöÄÖ])/
  const bad = []
  for (const [id, t] of Object.entries(TRIALS)) {
    for (const k of ["introLine", "victoryLine", "defeatLine", "beat"]) {
      if (t[k] && FINNISH.test(t[k])) bad.push(`${id}.${k}`)
    }
  }
  return {
    bad,
    rootkeeperIntro: TRIALS.rootkeeper?.introLine || "",
    hollowKingVictory: TRIALS["hollow-king"]?.victoryLine || "",
  }
})
console.log("trials English check - bad fields:", dataOut.bad)
console.log("  rootkeeper intro:", dataOut.rootkeeperIntro)
console.log("  hollow-king victory:", dataOut.hollowKingVictory)

// --- helper: seed a run at a given RUN_PATH index + phase ----------
async function seed(nodeIndex, phase = "formation") {
  await page.evaluate(
    async ({ nodeIndex, phase }) => {
      const engine = await import("/src/services/heartwood/runEngine.js")
      const { RUN_PATH } = engine
      let run = engine.startRun("tommy", null, { forcedSeed: 0x5701 })
      run = {
        ...run,
        nodeIndex,
        path: RUN_PATH.slice(0, nodeIndex + 1),
        phase,
        lastSeenAct: 7,
        bench: [
          { key: 1, defId: "strength", upgrades: [], upgradeLevel: 0, wins: 0 },
          { key: 2, defId: "the-fool", upgrades: [], upgradeLevel: 0, wins: 0 },
        ],
        deployed: [1, 2, null, null],
        items: [],
      }
      localStorage.setItem("heartwood-run-save-v1", JSON.stringify(engine.serializeRun(run)))
      localStorage.setItem("heartwood-story-intro-seen", "1")
      localStorage.setItem("heartwood-coach-enabled-v1", "false")
    },
    { nodeIndex, phase },
  )
  await page.reload()
}

// find the RUN_PATH indices we need
const idx = await page.evaluate(async () => {
  const { RUN_PATH } = await import("/src/services/heartwood/runEngine.js")
  const trial = RUN_PATH.findIndex((n) => n.trialId === "rootkeeper")
  // a plain battle formation node with no trialId and no authored beat
  const plain = RUN_PATH.findIndex(
    (n, i) => n.type === "battle" && n.formationId && !n.trialId && !n.beat && i > 5,
  )
  // a shop node deep in Act III (past ~60% of the run)
  const total = RUN_PATH.length
  const shop = RUN_PATH.findIndex((n, i) => n.type === "shop" && i / total > 0.62 && i / total < 0.8)
  return { trial, plain, shop, total }
})
console.log("indices:", idx)

// --- 2a. a Trial node HOLDS the timer (waits for a click) ----------
await seed(idx.trial, "formation")
await page.waitForSelector(".hw-intro", { timeout: 20000 })
const trialTitle = await page.$eval(".hw-screen-title", (el) => el.textContent.trim()).catch(() => "")
await page.waitForTimeout(7000) // well past AUTO_START_DELAY_MS (5000)
const stillFormationTrial = await page.$(".hw-intro")
const battleAppeared = await page.$(".hw-arena")
const waitHint = await page.$("text=the fight begins when you're ready")
console.log(`trial node: title="${trialTitle}" stillFormation=${!!stillFormationTrial} battleAppeared=${!!battleAppeared} waitHint=${!!waitHint}`)

// --- 2b. a plain battle node STILL auto-starts --------------------
let plainAutoStarted = null
if (idx.plain >= 0) {
  await seed(idx.plain, "formation")
  await page.waitForSelector(".hw-intro", { timeout: 20000 })
  await page.waitForTimeout(7000)
  plainAutoStarted = !(await page.$(".hw-intro")) && !!(await page.$(".hw-arena"))
  console.log(`plain node (idx ${idx.plain}): autoStarted=${plainAutoStarted}`)
} else {
  console.log("plain node: none found (skipped)")
}

// --- 3. RunRail shows ONE act ------------------------------------
await seed(idx.shop, "shop")
await page.waitForSelector(".hw-run-rail", { timeout: 20000 }).catch(() => {})
await page.waitForTimeout(500)
const railActs = await page.$$eval(".hw-run-rail-act", (els) =>
  els.map((e) => e.querySelector(".hw-run-rail-act-no")?.textContent?.trim() || e.textContent.trim().slice(0, 20)),
)
const railHead = await page.$eval(".hw-run-rail-step", (el) => el.textContent.trim()).catch(() => "")
console.log(`RunRail: ${railActs.length} act segment(s) -> ${JSON.stringify(railActs)} | head="${railHead}"`)
await page.screenshot({ path: `${SHOT}/story_wait_rail.png` })

await browser.close()

const pass =
  errs.length === 0 &&
  dataOut.bad.length === 0 &&
  /^"Stop\. You\.\.\. stranger/.test(dataOut.rootkeeperIntro) && // the English rewrite
  /child of the void/.test(dataOut.hollowKingVictory) &&
  !!stillFormationTrial &&
  !battleAppeared &&
  !!waitHint &&
  (idx.plain < 0 || plainAutoStarted === true) &&
  railActs.length === 1
console.log("\npageErrors:", errs.length, errs.slice(0, 6))
console.log(pass ? "✅ verify_formation_story_wait PASS" : "❌ verify_formation_story_wait FAIL")
process.exit(pass ? 0 : 1)
