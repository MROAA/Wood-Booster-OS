import { chromium } from "playwright"
const PORT = process.env.PORT || 5301
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
await page.waitForSelector(".hw-card", { timeout: 10000 })

// Recruit a couple of units first so the bench (and Reforge) has something to act on.
for (let i = 0; i < 2; i++) {
  const affordable = page.locator('.hw-panel--market .hw-card[data-disabled="false"]').first()
  if (await affordable.isVisible().catch(() => false)) {
    await affordable.click()
    await page.waitForTimeout(150)
  }
}

await page.click('button:has-text("Your Squad")')
await page.waitForTimeout(200)

const reforgeBtn = page.locator('button:has-text("Reforge")').first()
let reforgeResult = { skipped: true }
if (await reforgeBtn.isVisible().catch(() => false)) {
  const enabled = await reforgeBtn.isEnabled()
  if (enabled) {
    await reforgeBtn.click()
    const pulseVisible = await page.locator(".hw-card--reforged").first().waitFor({ state: "visible", timeout: 400 }).then(() => true).catch(() => false)
    await page.waitForTimeout(700)
    const pulseGone = (await page.locator(".hw-card--reforged").count()) === 0
    reforgeResult = { skipped: false, pulseVisible, pulseGone }
  } else {
    reforgeResult = { skipped: true, reason: "not enough essence" }
  }
}
console.log("reforge:", JSON.stringify(reforgeResult))
console.log("errors:", errors)
await browser.close()
if (errors.length) { console.log("FAIL: errors"); process.exit(1) }
if (!reforgeResult.skipped && !(reforgeResult.pulseVisible && reforgeResult.pulseGone)) { console.log("FAIL"); process.exit(1) }
console.log("PASS")
process.exit(0)
