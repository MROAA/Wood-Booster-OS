import { chromium } from "playwright"

const PORT = process.env.PORT || 5391
const OUT = process.env.OUT || "before"

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForSelector(".hw-commander-select, .hw-select-grid button, .hw-commander-card", { timeout: 15000 })

// Pick a commander if we're on the select screen.
const commanderCard = page.locator(".hw-commander-card").first()
if (await commanderCard.isVisible({ timeout: 2000 }).catch(() => false)) {
  await commanderCard.click()
  await page.waitForTimeout(900)
}

const tutorialNext = page.locator("button.hw-tutorial-next")
if (await tutorialNext.isVisible({ timeout: 2000 }).catch(() => false)) {
  await tutorialNext.click().catch(() => {})
}

await page.waitForSelector(".hw-market-columns, .hw-panel--market", { timeout: 15000 })
await page.waitForTimeout(600)

await page.screenshot({ path: `.scratch/shots/${OUT}-market-tab.png` })

const squadTabBtn = page.locator(".hw-tab-row button", { hasText: "Your Squad" })
if (await squadTabBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
  await squadTabBtn.click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: `.scratch/shots/${OUT}-squad-tab.png` })
}

const info = await page.evaluate(() => ({
  bodyScrollHeight: document.body.scrollHeight,
  viewportHeight: window.innerHeight,
  overflowAmount: document.body.scrollHeight - window.innerHeight,
}))

console.log(OUT, JSON.stringify({ info, errors }))
await browser.close()
