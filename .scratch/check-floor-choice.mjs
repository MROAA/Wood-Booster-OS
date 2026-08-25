import { chromium } from "playwright"
const PORT = process.env.PORT || 5310
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } })
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })
await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForTimeout(500)
const startBtn = page.locator("button", { hasText: /Tommy|Begin|Start/i }).first()
if (await startBtn.count()) await startBtn.click()
await page.waitForTimeout(500)
const commanderCard = page.locator(".hw-select-grid >> text=Tommy").first()
if (await commanderCard.count()) {
  await commanderCard.click()
  await page.waitForTimeout(400)
  const confirmBtn = page.locator("button", { hasText: /Begin|Start/i }).first()
  if (await confirmBtn.count()) await confirmBtn.click()
}
await page.waitForTimeout(600)
// Leave the shop immediately to reach the first choice floor.
await page.locator("button.hw-end-turn", { hasText: "Continue" }).click()
await page.waitForTimeout(600)
await page.screenshot({ path: "/tmp/floor-choice.png", fullPage: true })
const title = await page.locator("h1").first().textContent()
console.log("Screen title:", title)
console.log("errors:", errors)
// Click the first option and confirm we land on FormationScreen.
const cards = page.locator(".hw-select-grid.hw-deck-preview > .hw-card")
const cardCount = await cards.count()
console.log("choice card count:", cardCount)
if (cardCount > 0) {
  await cards.nth(0).click()
  await page.waitForTimeout(600)
  const nextTitle = await page.locator("h1").first().textContent()
  console.log("After choosing, screen title:", nextTitle)
  await page.screenshot({ path: "/tmp/after-floor-choice.png", fullPage: true })
}
console.log("errors after choose:", errors)
await browser.close()
