import { chromium } from "playwright"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
await page.goto("http://localhost:5310/heartwood")
await page.waitForSelector(".hw-select-grid button")
await page.click(".hw-select-grid button")
const tutorialNext = page.locator("button.hw-tutorial-next")
if (await tutorialNext.isVisible({ timeout: 2000 }).catch(() => false)) await tutorialNext.click().catch(() => {})
await page.waitForSelector(".hw-run-map", { timeout: 10000 })

// Buy several units/items to grow the bench, then check formation screen overflow.
for (let i = 0; i < 4; i++) {
  const affordable = page.locator(".hw-card[data-disabled=\"false\"]").first()
  if (await affordable.count()) { await affordable.click(); await page.waitForTimeout(80) }
}
let info = await page.evaluate(() => ({
  bodyScrollHeight: document.body.scrollHeight,
  viewportHeight: window.innerHeight,
  overflow: document.body.scrollHeight - window.innerHeight,
}))
console.log("SHOP (after buying):", JSON.stringify(info))
await page.screenshot({ path: ".scratch/shots/fit-shop-full.png" })

await page.click("button.hw-end-turn:has-text(\"Continue\")").catch(() => {})
await page.waitForTimeout(400)
const relicHeader = page.locator("text=/relic waits/i").first()
if (await relicHeader.isVisible({ timeout: 1500 }).catch(() => false)) {
  await page.click("button:has-text(\"Skip\")").catch(() => {})
  await page.waitForTimeout(300)
}
const choiceHeader = page.locator("text=/choose/i").first()
if (await choiceHeader.isVisible({ timeout: 1500 }).catch(() => false)) {
  const opt = page.locator(".hw-card, button").first()
  console.log("hit choice screen")
}

await page.waitForSelector(".hw-deck-preview .hw-card", { timeout: 10000 }).catch(() => {})
info = await page.evaluate(() => ({
  bodyScrollHeight: document.body.scrollHeight,
  viewportHeight: window.innerHeight,
  overflow: document.body.scrollHeight - window.innerHeight,
}))
console.log("FORMATION:", JSON.stringify(info))
await page.screenshot({ path: ".scratch/shots/fit-formation.png" })
await browser.close()
