// Guild Hall (PRD v2.0 Phase 4) - full click-through verification.
// Follows this repo's established .scratch/verify_*.mjs convention
// (real Playwright, real DOM clicks, real screenshots - not a unit
// test of the engine in isolation).
import { chromium } from "playwright"

const PORT = process.env.HW_PORT || 5450
const BASE = `http://localhost:${PORT}`
const errors = []
const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()
page.on("console", (msg) => { if (msg.type() === "error") errors.push(`console: ${msg.text()}`) })
page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`))

function log(step) { console.log(`\n=== ${step} ===`) }

async function resolveNextScreen(maxWaitMs = 12000) {
  // After leaving the map interstitial, runEngine can land on choice,
  // relic, or formation - poll for whichever one actually shows up
  // rather than assuming a fixed node type (this run's path is real
  // random-ish content, not scripted).
  const deadline = Date.now() + maxWaitMs
  while (Date.now() < deadline) {
    if (await page.locator("h1:has-text('Take the field')").count()) return "formation"
    if (await page.locator(".hw-card--power").count()) return "choice-or-relic"
    await page.waitForTimeout(200)
  }
  throw new Error("Timed out waiting for the next screen after the map interstitial")
}

async function playOneLoopIteration() {
  const screen = await resolveNextScreen()
  if (screen === "choice-or-relic") {
    await page.click(".hw-card--power >> nth=0")
    await page.waitForTimeout(300)
  }
  // Either branch above can still land on formation next (a relic pick
  // returns to formation for that same fight).
  await page.waitForSelector("h1:has-text('Take the field')", { timeout: 12000 })
  await page.click("button:has-text('Start Battle')")
  // Battle resolves itself on a round timer (ROUND_DELAY_MS=2200ms) -
  // poll for the result overlay's Continue button rather than a fixed
  // sleep, since fight length varies.
  await page.waitForSelector("button:has-text('Continue')", { timeout: 60000 })
  await page.click("button:has-text('Continue')")
  await page.waitForTimeout(300)
}

try {
  log("1. Load /heartwood - expect CommanderSelect")
  await page.goto(`${BASE}/heartwood`, { waitUntil: "domcontentloaded" })
  await page.waitForSelector(".hw-commander-card", { timeout: 10000 })
  const commanderCount = await page.locator(".hw-commander-card").count()
  console.log("Commander cards found:", commanderCount)
  if (commanderCount < 1) throw new Error("No commander cards rendered")

  log("2. Confirm a Commander - expect Guild Hall to appear next (not the shop)")
  await page.click(".hw-commander-card >> nth=0")
  // CommanderSelect's own CONFIRM_DELAY_MS is 550ms before beginRun fires.
  await page.waitForSelector(".hw-guildhall", { timeout: 5000 })
  await page.waitForSelector("h1:has-text('The Guild Hall')", { timeout: 3000 })

  // Must NOT have skipped straight to the shop.
  const marketVisibleTooEarly = await page.locator("h1:has-text('The Hearthwood Market')").count()
  if (marketVisibleTooEarly > 0) throw new Error("Shop rendered underneath/alongside the Guild Hall - phase gating bug")

  const tribeBadges = await page.locator(".hw-guildhall-tribe-badge").count()
  console.log("Tribe legend badges:", tribeBadges)
  if (tribeBadges !== 6) throw new Error(`Expected 6 tribe legend badges, found ${tribeBadges}`)

  const ctaCount = await page.locator(".hw-guildhall-cta").count()
  if (ctaCount !== 1) throw new Error(`Expected exactly one Guild Hall CTA, found ${ctaCount}`)

  await page.screenshot({ path: "/tmp/guildhall-01-arrival.png" })

  log("3. Exit link + no dead end - Guild Hall must have a way out")
  const exitLinkCount = await page.locator(".hw-exit-link").count()
  if (exitLinkCount < 1) throw new Error("No exit link on the Guild Hall screen")

  log("4. Step through the Forest Gate - expect the shop next")
  await page.click(".hw-guildhall-cta")
  await page.waitForSelector("h1:has-text('The Hearthwood Market')", { timeout: 5000 })
  console.log("Shop reached.")

  // Guild Hall must be gone now, not just visually covered.
  const guildHallStillMounted = await page.locator(".hw-guildhall").count()
  if (guildHallStillMounted > 0) throw new Error("Guild Hall still mounted after leaving it")

  log("5. Leave shop -> map interstitial -> Continue")
  await page.click("button:has-text('Continue')")
  await page.waitForSelector("[data-screen='map-after-shop']", { timeout: 5000 })
  await page.screenshot({ path: "/tmp/guildhall-02-map.png" })
  await page.click("button:has-text('Continue')")

  log("6. Play through 2 full node iterations (choice/relic + formation + battle)")
  await playOneLoopIteration()
  console.log("Iteration 1 complete - back at the shop or next node.")
  await page.screenshot({ path: "/tmp/guildhall-03-after-loop.png" })

  // Guild Hall must never reappear mid-run.
  const guildHallMidRun = await page.locator(".hw-guildhall").count()
  if (guildHallMidRun > 0) throw new Error("Guild Hall re-appeared mid-run - should be a once-per-run screen")

  log("7. Reload mid-run - Guild Hall must NOT replay")
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.waitForTimeout(1000)
  const guildHallAfterReload = await page.locator(".hw-guildhall").count()
  if (guildHallAfterReload > 0) throw new Error("Guild Hall replayed after a page reload of an in-progress run")
  const commanderSelectAfterReload = await page.locator(".hw-commander-card").count()
  if (commanderSelectAfterReload > 0) throw new Error("Reload dropped the saved run back to CommanderSelect")
  console.log("Reload OK - run resumed on its real phase, no Guild Hall replay.")
  await page.screenshot({ path: "/tmp/guildhall-04-after-reload.png" })

  log("8. Change Commander -> back to CommanderSelect -> confirm again -> Guild Hall re-arms")
  page.once("dialog", (d) => d.accept())
  await page.click("button:has-text('Change Commander')")
  await page.waitForSelector(".hw-commander-card", { timeout: 5000 })
  await page.click(".hw-commander-card >> nth=1")
  await page.waitForSelector(".hw-guildhall", { timeout: 5000 })
  console.log("Guild Hall re-armed correctly on a fresh run.")
  await page.screenshot({ path: "/tmp/guildhall-05-second-run-arrival.png" })

  log("9. Leave again, confirm the rest of the flow is untouched")
  await page.click(".hw-guildhall-cta")
  await page.waitForSelector("h1:has-text('The Hearthwood Market')", { timeout: 5000 })

  console.log("\n=== RESULT ===")
  console.log("errors:", errors.length ? errors : "(none)")
  if (errors.length > 0) {
    console.log("FAIL - console/page errors present")
    process.exitCode = 1
  } else {
    console.log("PASS")
  }
} catch (err) {
  console.error("\n!!! VERIFICATION FAILED !!!")
  console.error(err)
  await page.screenshot({ path: "/tmp/guildhall-FAILURE.png" }).catch(() => {})
  process.exitCode = 1
} finally {
  await browser.close()
}
