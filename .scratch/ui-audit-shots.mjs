import { chromium } from "playwright"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } })
await page.goto("http://localhost:5310/heartwood", { waitUntil: "domcontentloaded" })
await page.waitForSelector(".hw-select-grid button", { timeout: 15000 })
await page.screenshot({ path: ".scratch/shots/01-select.png" })
await page.click(".hw-select-grid button")
const tutorialNext = page.locator("button.hw-tutorial-next")
if (await tutorialNext.isVisible({ timeout: 2000 }).catch(() => false)) {
  for (let i = 0; i < 6; i++) {
    if (!(await tutorialNext.isVisible({ timeout: 500 }).catch(() => false))) break
    await tutorialNext.click().catch(() => {})
    await page.waitForTimeout(200)
  }
}
await page.waitForTimeout(500)
await page.screenshot({ path: ".scratch/shots/02-shop.png", fullPage: true })

// Recruit a couple units then go to formation screen if a "fight" button exists
const recruitBtns = await page.locator(".hw-card:not([data-disabled='true'])").all()
for (let i = 0; i < Math.min(2, recruitBtns.length); i++) {
  await recruitBtns[i].click().catch(() => {})
  await page.waitForTimeout(200)
}
const leaveShop = page.locator("button", { hasText: /fight|leave|continue|battle/i }).first()
if (await leaveShop.isVisible({ timeout: 1000 }).catch(() => false)) {
  await leaveShop.click().catch(() => {})
  await page.waitForTimeout(500)
}
await page.screenshot({ path: ".scratch/shots/03-formation.png", fullPage: true })

const startBattle = page.locator("button", { hasText: /start|begin|fight/i }).first()
if (await startBattle.isVisible({ timeout: 1000 }).catch(() => false)) {
  await startBattle.click().catch(() => {})
}
await page.waitForTimeout(1200)
await page.screenshot({ path: ".scratch/shots/04-battle.png", fullPage: true })
await browser.close()
