// Close-up of the Market's Continue plaque. usage: node .scratch/shot_confirm_btn.mjs <out.png> [port]
import { chromium } from "playwright"
const b = await chromium.launch(); const page = await (await b.newContext({ viewport: { width: 1536, height: 864 } })).newPage()
await page.goto(`http://localhost:${process.argv[3] || 5173}/heartwood`)
await page.evaluate(async () => {
  localStorage.clear()
  const { startRun, serializeRun, RUN_PATH } = await import("/src/services/heartwood/runEngine.js")
  const idx = RUN_PATH.findIndex((n) => n.type === "battle" && n.formationId)
  const rs = { ...startRun("tommy", null, { forcedSeed: 424243 }), nodeIndex: idx, path: RUN_PATH.slice(0, idx + 1), phase: "shop", bench: [], deployed: [null, null, null, null], items: [], lastSeenAct: 1 }
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(rs)))
})
await page.reload(); await page.waitForTimeout(1500)
const btn = page.locator(".hw-shop-confirm-btn").first(); await btn.scrollIntoViewIfNeeded(); await page.waitForTimeout(300)
const r = await btn.boundingBox()
await page.screenshot({ path: process.argv[2], clip: { x: r.x - 60, y: r.y - 20, width: r.width + 120, height: r.height + 40 }, scale: "device" })
await b.close()
