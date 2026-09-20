import { chromium } from "playwright"

const PORT = process.env.PORT || 5495
const errors = []
const results = {}

const browser = await chromium.launch()
// Marc's correction, mid-session: his real usable page area is ~1860x960
// once browser chrome (tabs/address bar/sidebar/taskbar) is subtracted
// from a 1920x1080 window - NOT a clean 1920x1080 viewport. Fit checks
// from here on target 0px overflow at 1860x960, not 1080.
const page = await browser.newPage({ viewport: { width: 1860, height: 960 } })
page.on("pageerror", (e) => errors.push(`pageerror: ${e}`))
page.on("console", (msg) => { if (msg.type() === "error") errors.push(`console: ${msg.text()}`) })

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForSelector(".hw-commander-select, .hw-market-columns", { timeout: 15000 })

const commanderCard = page.locator(".hw-commander-card").first()
if (await commanderCard.isVisible({ timeout: 2000 }).catch(() => false)) {
  await commanderCard.click()
  await page.waitForTimeout(900)
}
const tutorialNext = page.locator("button.hw-tutorial-next")
if (await tutorialNext.isVisible({ timeout: 2000 }).catch(() => false)) {
  await tutorialNext.click().catch(() => {})
}
const guildHallCta = page.locator(".hw-guildhall-cta")
if (await guildHallCta.isVisible({ timeout: 3000 }).catch(() => false)) {
  await guildHallCta.click()
}
await page.waitForSelector(".hw-market-columns", { timeout: 15000 })
await page.waitForTimeout(300)

// --- Fit check BEFORE any interaction (.hw-root's own scrollHeight vs
// clientHeight, not document.body - body under-reports on this app's
// overflow:hidden root) ---
results.fitOnArrival = await page.evaluate(() => {
  const root = document.querySelector(".hw-root")
  if (!root) return { error: "no .hw-root found" }
  return { scrollHeight: root.scrollHeight, clientHeight: root.clientHeight, overflowPx: root.scrollHeight - root.clientHeight }
})

await page.screenshot({ path: ".scratch/shots/plaque-market-tab-arrival.png" })

// --- Market tab button: visible, styled, clickable ---
const marketBtn = page.locator(".hw-market-tab-btn")
results.marketBtnVisible = await marketBtn.isVisible().catch(() => false)
results.marketBtnImgSrc = await marketBtn.locator("img").getAttribute("src").catch(() => null)
results.marketBtnActiveOnArrival = await marketBtn.getAttribute("data-active")

// Switch to squad tab and back via the real buttons (click-through, not
// just visual inspection - Marc's own reinforcement mid-task).
await page.locator(".hw-tab-row--squad button", { hasText: "Your Squad" }).click()
await page.waitForTimeout(200)
results.squadTabVisibleAfterClick = await page.locator(".hw-panel--squad").isVisible()
results.marketBtnActiveAfterSquadClick = await marketBtn.getAttribute("data-active")

await marketBtn.click()
await page.waitForTimeout(200)
results.marketTabVisibleAfterClick = await page.locator(".hw-panel--market").isVisible()
results.marketBtnActiveAfterMarketClick = await marketBtn.getAttribute("data-active")

await page.screenshot({ path: ".scratch/shots/plaque-market-tab-active.png" })

// --- Recruit a unit (exercises the market grid, unrelated to the
// plaque work but a real regression risk if the tab restructure broke
// anything nearby) ---
const offerCards = page.locator(".hw-market-featured-grid .hw-card")
const offerCount = await offerCards.count()
let recruited = false
for (let i = 0; i < offerCount; i++) {
  const card = offerCards.nth(i)
  const disabled = await card.getAttribute("data-disabled")
  if (disabled !== "true") {
    await card.click()
    recruited = true
    break
  }
}
results.recruitClicked = recruited
await page.waitForTimeout(400)

// --- Sell button: visible, styled with the plaque background, clickable ---
await page.locator(".hw-tab-row--squad button", { hasText: "Your Squad" }).click()
await page.waitForTimeout(300)
const sellBtn = page.locator(".hw-sell-btn").first()
results.sellBtnVisible = await sellBtn.isVisible().catch(() => false)
results.sellBtnBackgroundImage = await sellBtn.evaluate((el) => getComputedStyle(el).backgroundImage).catch(() => null)
const benchCountBefore = await page.locator(".hw-panel--squad .hw-select-grid .hw-card").count()
await page.screenshot({ path: ".scratch/shots/plaque-sell-btn-before-sale.png" })
if (results.sellBtnVisible) {
  await sellBtn.click()
  await page.waitForTimeout(300)
}
const benchCountAfter = await page.locator(".hw-panel--squad .hw-select-grid .hw-card").count()
results.sellReducedBenchCount = benchCountBefore > benchCountAfter

await page.screenshot({ path: ".scratch/shots/plaque-sell-btn.png" })

// --- Final fit check after all the interaction above ---
results.fitFinal = await page.evaluate(() => {
  const root = document.querySelector(".hw-root")
  if (!root) return { error: "no .hw-root found" }
  return { scrollHeight: root.scrollHeight, clientHeight: root.clientHeight, overflowPx: root.scrollHeight - root.clientHeight }
})

results.errors = errors
console.log(JSON.stringify(results, null, 2))
await browser.close()
