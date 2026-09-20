import { chromium } from "playwright"
const PORT = process.env.PORT || 5237
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForTimeout(600)
await page.click(".hw-select-grid button")
const tutorialNext = page.locator(".hw-tutorial-next")
if (await tutorialNext.isVisible({ timeout: 2000 }).catch(() => false)) await tutorialNext.click().catch(() => {})
await page.waitForTimeout(400)
await page.screenshot({ path: "/tmp/hw_screens/final_shop_1920.png" })
await browser.close()
console.log("done")
