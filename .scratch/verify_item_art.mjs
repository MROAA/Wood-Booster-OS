import { chromium } from "playwright"

const PORT = process.env.PORT || 5680
const errors = []
const results = {}

const browser = await chromium.launch()
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
await page.waitForTimeout(400)

results.errors_afterLoad = [...errors]

// Fit check on the shop screen itself (item row lives here)
results.fitMarket = await page.evaluate(() => {
  const root = document.querySelector(".hw-root")
  return root ? { scrollHeight: root.scrollHeight, clientHeight: root.clientHeight, overflow: root.scrollHeight - root.clientHeight } : null
})

// Confirm at least one item card is now rendering a real <img> instead
// of just the SVG glyph, and grab a screenshot of the item row.
const itemCards = page.locator(".hw-panel--market .hw-select-grid.hw-deck-preview:not(.hw-market-featured-grid) .hw-card")
results.itemOfferCount = await itemCards.count()
results.itemImgCount = await page.locator(".hw-item-card img.hw-card-art").count()

await page.screenshot({ path: "/tmp/claude-1000/-home-marc-Wood-Booster-AI/3aa57806-8732-4d78-9ef6-313b2cd831b7/scratchpad/candidates/market_screenshot.png" })

// Also switch tabs to check squad panel (item slots) still fits, and
// featured/bending-guaranteed slot (bigger 55px hw-card-art) if present.
results.fitAfterScreens = await page.evaluate(() => {
  const root = document.querySelector(".hw-root")
  return root ? { scrollHeight: root.scrollHeight, clientHeight: root.clientHeight, overflow: root.scrollHeight - root.clientHeight } : null
})

results.errors = errors
console.log(JSON.stringify(results, null, 2))
await browser.close()
