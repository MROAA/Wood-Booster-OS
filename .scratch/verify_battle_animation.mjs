import { chromium } from "playwright"

const PORT = process.env.PORT || 5204

const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForSelector(".hw-select-grid button")
await page.click(".hw-select-grid button")
const tutorialNext = page.locator("button.hw-tutorial-next")
if (await tutorialNext.isVisible({ timeout: 2000 }).catch(() => false)) await tutorialNext.click().catch(() => {})

await page.waitForSelector(".hw-card[data-disabled=\"false\"]", { timeout: 10000 })
for (let i = 0; i < 3; i++) {
  const affordable = page.locator(".hw-card[data-disabled=\"false\"]").first()
  if (await affordable.count()) { await affordable.click(); await page.waitForTimeout(100) }
}
await page.click("button.hw-end-turn:has-text(\"Continue\")")

await page.waitForSelector(".hw-deck-preview .hw-card", { timeout: 10000 })
const benchCards = page.locator(".hw-deck-preview .hw-card")
const benchCount = await benchCards.count()
for (let i = 0; i < benchCount; i++) { await benchCards.nth(i).click().catch(() => {}); await page.waitForTimeout(80) }

const startBtn = page.locator("button.hw-end-turn:has-text(\"Start Battle\")")
await startBtn.waitFor({ timeout: 5000 })

const t0 = Date.now()
await startBtn.click()

// Immediately after clicking, the fight should NOT be already decided
// - the hint should show "Round 1..." (mid-fight), not "The fight is
// decided" (Marc's original complaint: an instant jump with no
// visible animation). Check within the first ~150ms, before the first
// round-advance timer (550ms) could have fired.
await page.waitForTimeout(100)
const hintEarly = await page.locator(".hw-hint").innerText().catch(() => "")

// Watch for at least one floating damage/heal/block number appearing
// during the fight - proof FloatingNumbers actually has something to
// diff against now, unlike the old instant-resolve flow.
const sawFloatingNumber = await page
  .waitForSelector("[class*='hw-floating-number']", { timeout: 3000 })
  .then(() => true)
  .catch(() => false)

// Now wait for the fight to actually conclude.
await page.waitForSelector(".hw-overlay", { timeout: 20000 })
const elapsedMs = Date.now() - t0
const outcome = await page.locator(".hw-overlay").getAttribute("data-outcome")

console.log(JSON.stringify({ hintEarly, sawFloatingNumber, elapsedMs, outcome, errors }, null, 2))
await browser.close()

if (errors.length) {
  console.log("FAIL: console/page errors present")
  process.exit(1)
}
const hintOk = hintEarly.toLowerCase().includes("round")
const timingOk = elapsedMs > 500 // at least one round-delay elapsed, proving it's not instant
if (hintOk && sawFloatingNumber && timingOk) {
  console.log("PASS: battle plays out round-by-round with visible animation, still zero clicks")
  process.exit(0)
} else {
  console.log("FAIL", { hintOk, sawFloatingNumber, timingOk })
  process.exit(1)
}
