import { chromium } from "playwright"
const PORT = process.env.PORT || 5911
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1860, height: 960 } })
const results = {}

function fitCheck() {
  return page.evaluate(() => {
    const root = document.querySelector(".hw-root")
    if (!root) return { error: "no root" }
    return { scrollHeight: root.scrollHeight, clientHeight: root.clientHeight, overflowPx: root.scrollHeight - root.clientHeight }
  })
}

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

// Recruit the SAME unit 3 times to trigger a Tier-2 fusion (data-fused)
for (let i = 0; i < 6; i++) {
  const firstCard = page.locator(".hw-market-featured-grid .hw-card").first()
  const disabled = await firstCard.getAttribute("data-disabled")
  if (disabled !== "true") {
    const name = await firstCard.locator(".hw-card-name").innerText().catch(() => null)
    await firstCard.click()
    await page.waitForTimeout(300)
    results[`recruit_${i}`] = name
  }
}

results.fitMarketAfterRecruit = await fitCheck()
await page.screenshot({ path: ".scratch/shots/market-after-recruit.png" })

// Go to Your Squad tab, check for a fused (data-fused=true) card
await page.locator(".hw-squad-tab-btn").click()
await page.waitForTimeout(300)
const fusedCount = await page.locator('.hw-card[data-fused="true"]').count()
results.fusedCount = fusedCount
results.fitSquadTab = await fitCheck()
await page.screenshot({ path: ".scratch/shots/squad-tab.png" })
if (fusedCount > 0) {
  const box = await page.locator('.hw-card[data-fused="true"]').first().boundingBox()
  await page.screenshot({ path: ".scratch/shots/squad-tab-fused.png", clip: box ? { x: Math.max(0, box.x - 20), y: Math.max(0, box.y - 20), width: box.width + 40, height: box.height + 40 } : undefined })
}

console.log(JSON.stringify(results, null, 2))
await browser.close()
