import { chromium } from "playwright"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
await page.goto("http://localhost:5310/heartwood")
await page.waitForSelector(".hw-select-grid button")
await page.click(".hw-select-grid button")
const tutorialNext = page.locator("button.hw-tutorial-next")
if (await tutorialNext.isVisible({ timeout: 2000 }).catch(() => false)) await tutorialNext.click().catch(() => {})
await page.waitForSelector(".hw-run-map", { timeout: 10000 })
await page.waitForTimeout(500)
const info = await page.evaluate(() => ({
  bodyScrollHeight: document.body.scrollHeight,
  viewportHeight: window.innerHeight,
  overflowAmount: document.body.scrollHeight - window.innerHeight,
}))
console.log("SHOP:", JSON.stringify(info))
await page.screenshot({ path: ".scratch/shots/fit-shop.png" })
await browser.close()
