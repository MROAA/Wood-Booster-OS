import { chromium } from "playwright"
const PORT = process.env.PORT || 5911
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1860, height: 960 } })
await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForSelector(".hw-commander-select, .hw-market-columns", { timeout: 15000 })
const commanderCard = page.locator(".hw-commander-card").first()
if (await commanderCard.isVisible({ timeout: 2000 }).catch(() => false)) {
  await commanderCard.click()
  await page.waitForTimeout(900)
}
const guildHallCta = page.locator(".hw-guildhall-cta")
if (await guildHallCta.isVisible({ timeout: 3000 }).catch(() => false)) {
  await guildHallCta.click()
}
await page.waitForSelector(".hw-market-columns", { timeout: 15000 })
await page.waitForTimeout(300)

// Force data-fused/data-tier=rare on the first offer card purely for a visual check of
// the tier-2 frame CSS (not exercising real fusion game logic - that's covered elsewhere).
await page.evaluate(() => {
  const card = document.querySelector(".hw-market-featured-grid .hw-card")
  card.setAttribute("data-fused", "true")
  card.setAttribute("data-tier", "rare")
})
await page.waitForTimeout(200)
const box = await page.locator(".hw-market-featured-grid .hw-card").first().boundingBox()
await page.screenshot({ path: ".scratch/shots/tier2-frame-forced.png", clip: { x: Math.max(0, box.x - 15), y: Math.max(0, box.y - 15), width: box.width + 30, height: box.height + 30 } })
await browser.close()
