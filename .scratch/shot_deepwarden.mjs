import { chromium } from "playwright"
const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
await page.goto("http://localhost:5398/heartwood-tactics", { waitUntil: "domcontentloaded" })
await page.waitForSelector(".hwt-board")
await page.locator(".hwt-formation-btn", { hasText: "Deepwarden" }).click()
await page.waitForTimeout(400)
await page.screenshot({ path: ".scratch/shots/deepwarden.png" })
await browser.close()
