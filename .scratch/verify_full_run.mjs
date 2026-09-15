import { chromium } from "playwright"

const PORT = process.env.PORT || 5197
const MAX_FIGHTS = 60

const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text())
})

// Playwright's `locator.isVisible({ timeout })` does NOT actually poll
// or wait - its own type docs say so explicitly ("does not wait for");
// the `timeout` option there is a no-op for this purpose. Every
// present-check in this file (relic/shop/choice/map headers,
// clearToFormation's onFormation check, the end-of-run overlay) was
// written as if it polled, which happened to work back when this
// script was written because each screen transition was fast enough
// to already be in the DOM by the time the next check ran - a real
// fragility that broke the instant the Guild Hall screen (PR #350) and
// CommanderSelect's own confirm-animation (both landed in this
// branch's base after this script was last touched) added extra
// transition time in front of the very first check. `waitFor` DOES
// poll (confirmed against the Playwright type docs and by tracing
// iteration timestamps that showed the old isVisible calls returning
// in single-digit milliseconds regardless of the requested timeout) -
// this thin wrapper replaces every isVisible-with-timeout call below
// with the one that actually waits.
async function waitVisible(locator, timeout) {
  return locator
    .first()
    .waitFor({ state: "visible", timeout })
    .then(() => true)
    .catch(() => false)
}

await page.goto(`http://localhost:${PORT}/heartwood`)
// CommanderSelect.jsx was rebuilt (own .hw-commander-card markup,
// PR history around "commander-select") since this script was last
// touched - the old .hw-select-grid button selector no longer matches
// the character-select screen (every OTHER screen - shop/relic/
// formation/reward - still uses .hw-select-grid, only this first
// screen moved).
await page.waitForSelector(".hw-commander-card")
await page.click(".hw-commander-card")

// Guild Hall (PR #350, merged into this branch's base after this script
// was last touched) - a one-time roster-preview screen between Commander
// Select and the actual first shop visit. Its own CTA button
// (GuildHallScreen.jsx's hw-guildhall-cta) is the only way through it.
const guildHallCta = page.locator("button.hw-guildhall-cta")
if (await waitVisible(guildHallCta, 3000)) {
  await guildHallCta.click().catch(() => {})
}

const tutorialNext = page.locator("button.hw-tutorial-next")
if (await waitVisible(tutorialNext, 2000)) {
  await tutorialNext.click().catch(() => {})
}

async function shopStep() {
  await page.waitForSelector(".hw-card", { timeout: 10000 })
  for (let i = 0; i < 3; i++) {
    const affordable = page.locator(".hw-card[data-disabled=\"false\"]").first()
    if (await affordable.count()) {
      await affordable.click()
      await page.waitForTimeout(100)
    }
  }
  await page.click("button.hw-end-turn:has-text(\"Continue\")")
}

async function relicStepIfPresent() {
  const relicHeader = page.locator("text=/relic waits/i").first()
  if (await waitVisible(relicHeader, 1500)) {
    const affordable = page.locator(".hw-card[data-disabled=\"false\"]").first()
    if (await affordable.count()) {
      await affordable.click().catch(() => {})
    } else {
      await page.click("button:has-text(\"Skip\")").catch(() => {})
    }
    await page.waitForTimeout(200)
    return true
  }
  return false
}

async function shopStepIfPresent() {
  const marketHeader = page.locator("text=/hearthwood market/i").first()
  if (await waitVisible(marketHeader, 1500)) {
    await shopStep()
    return true
  }
  return false
}

// The branching-path pick (FloorChoice.jsx) - 2 options, click either one
// (the first is fine, this regression only cares that a run completes).
async function choiceStepIfPresent() {
  const choiceHeader = page.locator("text=/two paths through the hearthwood/i").first()
  if (await waitVisible(choiceHeader, 1500)) {
    await page.locator(".hw-card--power").first().click().catch(() => {})
    await page.waitForTimeout(200)
    return true
  }
  return false
}

// The "Outer Grove" map interstitial (HeartwoodBattle.jsx's
// showMapAfterShop) - a dedicated, no-purchase step shown once right
// after leaving shop, before whatever phase comes next. Marked with
// its own data-screen attribute specifically so tooling like this
// doesn't have to guess from shared text/class markup.
async function mapStepIfPresent() {
  const mapScreen = page.locator('[data-screen="map-after-shop"]').first()
  if (await waitVisible(mapScreen, 1500)) {
    await page.click("button.hw-end-turn:has-text(\"Continue\")").catch(() => {})
    await page.waitForTimeout(200)
    return true
  }
  return false
}

// Relic, shop, and choice screens share the .hw-deck-preview/.hw-card
// markup, and any of them can appear zero or more times before the
// real formation screen depending on RUN_PATH - loop through whichever
// pre-battle screens show up instead of assuming a fixed order.
async function clearToFormation() {
  const startBattleBtn = page.locator("button.hw-end-turn:has-text(\"Start Battle\")")
  for (let i = 0; i < 6; i++) {
    const onFormation = await waitVisible(startBattleBtn, 1000)
    if (onFormation) return true
    const wasMap = await mapStepIfPresent()
    if (wasMap) continue
    const wasChoice = await choiceStepIfPresent()
    if (wasChoice) continue
    const wasRelic = await relicStepIfPresent()
    if (wasRelic) continue
    const wasShop = await shopStepIfPresent()
    if (wasShop) continue
    break
  }
  return waitVisible(startBattleBtn, 3000)
}

async function formationAndBattleStep() {
  await page.waitForSelector(".hw-deck-preview .hw-card", { timeout: 10000 })
  // Click only currently-UNdeployed cards (data-selected="false"), up
  // to 4 times - the starters are pre-deployed by default, and since
  // the Essence bump (PR #229) the shop step above can now reliably
  // afford 3 recruits per visit, growing the bench past 4 almost every
  // time. A blind "click the first N by index" toggles the ALREADY-
  // deployed starters OFF first and only deploys the new recruits from
  // index 4 onward, netting far fewer than 4 actually deployed -
  // caught via this exact bug turning 12/13 wins into 3 losses in a
  // row once recruiting 3 a visit became reliable. Targeting undeployed
  // cards directly is deploy-state-safe regardless of bench order.
  for (let i = 0; i < 4; i++) {
    const undeployed = page.locator(".hw-deck-preview .hw-card[data-selected=\"false\"]").first()
    if (!(await undeployed.count())) break
    await undeployed.click().catch(() => {})
    await page.waitForTimeout(80)
  }
  const startBtn = page.locator("button.hw-end-turn:has-text(\"Start Battle\")")
  await startBtn.waitFor({ timeout: 5000 })
  await startBtn.click()

  // Battles now play out round-by-round on a timer (ROUND_DELAY_MS in
  // AutoBattleView.jsx) instead of resolving instantly. A stalemate can
  // legitimately run the full MAX_ROUNDS cap (30, autoBattleEngine.js) -
  // 30 * 2200ms = 66s - confirmed live at the wyrmgall miniboss, which
  // reliably grinds to the cap. 25s was too tight and produced 3
  // consecutive deterministic timeouts at that exact fight that looked
  // like HMR flake but weren't; 80s covers the real worst case.
  await page.waitForSelector(".hw-overlay", { timeout: 80000 })
  const outcome = await page.locator(".hw-overlay").getAttribute("data-outcome")
  await page.click("button:has-text(\"Continue\")")
  return outcome
}

const outcomes = []
let runEnded = false

for (let fight = 0; fight < MAX_FIGHTS && !runEnded; fight++) {
  const reachedFormation = await clearToFormation()
  if (!reachedFormation) {
    outcomes.push("ERROR:never reached formation screen")
    break
  }

  const outcome = await formationAndBattleStep().catch((e) => `ERROR:${e.message}`)
  outcomes.push(outcome)

  const newRunBtn = await waitVisible(page.locator("button:has-text(\"New Run\")"), 1500)
  if (newRunBtn) runEnded = true

  if (String(outcome).startsWith("ERROR")) break
}

console.log(JSON.stringify({ outcomes, runEnded, errorCount: errors.length, errors: errors.slice(0, 10) }, null, 2))

await browser.close()

if (errors.length) {
  console.log("FAIL: console/page errors present during full run")
  process.exit(1)
}
if (outcomes.some((o) => String(o).startsWith("ERROR"))) {
  console.log("FAIL: a fight step errored out")
  process.exit(1)
}
console.log("PASS: full run regression completed with zero console errors")
process.exit(0)
