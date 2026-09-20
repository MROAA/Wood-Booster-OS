import { chromium } from "playwright"
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1860, height: 960 } })
const page = await ctx.newPage()
await page.goto("http://localhost:5183/heartwood", { waitUntil: "domcontentloaded" })
await page.evaluate(async () => {
  const { startRun, serializeRun, RUN_PATH } = await import("/src/services/heartwood/runEngine.js")
  const rs = { ...startRun("tommy", null), nodeIndex: 0, phase: "shop", path: RUN_PATH.slice(0, 1), relics: ["heartsbloom-seed"], items: [] }
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(rs)))
  localStorage.setItem("heartwood-story-intro-seen", "true")
})
await page.reload({ waitUntil: "domcontentloaded" })
await page.waitForTimeout(1000)
await page.screenshot({ path: "/tmp/center_reorder_default.png" })
await browser.close()
