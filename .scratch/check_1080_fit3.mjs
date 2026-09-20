import { chromium } from "playwright"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
await page.goto("http://localhost:5310/heartwood")
await page.waitForSelector(".hw-select-grid button")
await page.click(".hw-select-grid button")
const tutorialNext = page.locator("button.hw-tutorial-next")
if (await tutorialNext.isVisible({ timeout: 2000 }).catch(() => false)) await tutorialNext.click().catch(() => {})
await page.waitForSelector(".hw-run-map", { timeout: 10000 })
for (let i = 0; i < 4; i++) {
  const affordable = page.locator(".hw-card[data-disabled=\"false\"]").first()
  if (await affordable.count()) { await affordable.click(); await page.waitForTimeout(80) }
}
const info = await page.evaluate(() => {
  const root = document.querySelector(".hw-root")
  return {
    rootScrollHeight: root.scrollHeight,
    rootClientHeight: root.clientHeight,
    canScroll: root.scrollHeight > root.clientHeight,
  }
})
console.log("BEFORE SCROLL:", JSON.stringify(info))
// Try actually scrolling the .hw-root element to the bottom and screenshot.
await page.evaluate(() => document.querySelector(".hw-root").scrollTo(0, 99999))
await page.waitForTimeout(300)
await page.screenshot({ path: ".scratch/shots/fit-scrolled-bottom.png" })
console.log("done")
await browser.close()
