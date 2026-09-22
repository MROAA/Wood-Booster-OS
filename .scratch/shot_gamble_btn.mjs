import { chromium } from "playwright"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1860, height: 960 } })
await page.goto("http://localhost:5192/heartwood", { waitUntil: "domcontentloaded" })
await page.evaluate(async () => {
  const { startRun, serializeRun, RUN_PATH } = await import("/src/services/heartwood/runEngine.js")
  const rs = { ...startRun("tommy", null), nodeIndex: 0, phase: "shop", path: RUN_PATH.slice(0, 1), relics: ["heartsbloom-seed"], items: [] }
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(rs)))
  localStorage.setItem("heartwood-story-intro-seen", "true")
})
await page.reload({ waitUntil: "domcontentloaded" })
await page.waitForSelector(".hw-gamble-btn", { timeout: 8000 })
await page.waitForTimeout(500)
const btn = page.locator(".hw-gamble-btn")
await btn.screenshot({ path: "/tmp/gamble_btn.png" })
await browser.close()
