import { chromium } from "playwright"

const PORT = process.env.PORT || 5310
const shotDir = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-heartwood-taunt/.scratch/shots"

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForSelector(".hw-select-grid button")
await page.screenshot({ path: `${shotDir}/01-select-commander.png` })

await page.click(".hw-select-grid button")
const tutorialNext = page.locator("button.hw-tutorial-next")
if (await tutorialNext.isVisible({ timeout: 2000 }).catch(() => false)) await tutorialNext.click().catch(() => {})
await page.waitForSelector(".hw-card[data-disabled=\"false\"]", { timeout: 10000 })
await page.waitForTimeout(500)
await page.screenshot({ path: `${shotDir}/02-shop.png`, fullPage: false })

// Recruit whatever's affordable.
const affordable = page.locator(".hw-deck-preview .hw-card[data-disabled=\"false\"]").first()
if (await affordable.isVisible().catch(() => false)) {
  await affordable.click()
  await page.waitForTimeout(400)
}
await page.screenshot({ path: `${shotDir}/03-after-recruit.png` })

// Continue to formation.
const continueBtn = page.locator("button.hw-end-turn")
await continueBtn.click()
await page.waitForTimeout(500)
await page.screenshot({ path: `${shotDir}/04-formation.png` })

// Start battle.
const startBattleBtn = page.locator("button:has-text(\"Start Battle\")")
if (await startBattleBtn.isVisible().catch(() => false)) {
  await startBattleBtn.click()
  await page.waitForTimeout(3000)
  await page.screenshot({ path: `${shotDir}/05-battle.png` })
}

console.log("errors:", errors)
await browser.close()
console.log(errors.length === 0 ? "PASS: no console/page errors during click-through" : `FAIL: ${errors.length} errors`)
process.exit(errors.length === 0 ? 0 : 1)
