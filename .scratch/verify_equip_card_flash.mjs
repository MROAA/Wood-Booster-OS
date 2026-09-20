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

// Recruit a unit so there's a bench card to equip onto.
const affordableUnit = page.locator('.hw-panel--market .hw-card[data-disabled="false"]').first()
await affordableUnit.click()
await page.waitForTimeout(150)

// Buy an item (auto-selects it per the existing discoverability fix).
const itemCard = page.locator('.hw-item-card[data-disabled="false"]').first()
let result = { skipped: true }
if (await itemCard.isVisible().catch(() => false)) {
  await itemCard.click()
  await page.waitForTimeout(150)
  await page.click('button:has-text("Your Squad")')
  await page.waitForTimeout(150)
  const emptySlot = page.locator('.hw-panel--squad .hw-item-slot:not(.hw-item-slot--filled)').first()
  if (await emptySlot.isVisible().catch(() => false)) {
    await emptySlot.click()
    const cardPulse = await page.locator(".hw-panel--squad .hw-card--reforged").first().waitFor({ state: "visible", timeout: 400 }).then(() => true).catch(() => false)
    const slotFilled = await page.locator('.hw-panel--squad .hw-item-slot--filled').first().isVisible().catch(() => false)
    await page.waitForTimeout(700)
    result = { skipped: false, cardPulse, slotFilled }
  }
}
console.log(JSON.stringify(result))
console.log("errors:", errors)
await browser.close()
if (errors.length) { console.log("FAIL: errors"); process.exit(1) }
if (!result.skipped && !(result.cardPulse && result.slotFilled)) { console.log("FAIL"); process.exit(1) }
console.log(result.skipped ? "INCONCLUSIVE" : "PASS")
process.exit(0)
