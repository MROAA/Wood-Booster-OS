// Graphics audit screenshots of the live /heartwood route (not a verify suite).
// usage: node .scratch/shot_graphics_audit.mjs <outPrefix> [port]
import { chromium } from "playwright"
const OUT = process.argv[2] || "/tmp/gfx"
const PORT = process.argv[3] || 5173
const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
const errs = []
page.on("pageerror", (e) => errs.push(e.message))
const shot = (n) => page.screenshot({ path: `${OUT}-${n}.png` })

await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
await page.evaluate(() => localStorage.clear())
await page.reload({ waitUntil: "domcontentloaded" })
await page.waitForTimeout(1500)
await shot("1-home")

await page.evaluate(async () => {
  const { startRun, serializeRun, RUN_PATH } = await import("/src/services/heartwood/runEngine.js")
  const idx = RUN_PATH.findIndex((n) => n.type === "battle" && n.formationId)
  const ids = ["the-fool", "the-magician", "the-chariot"]
  const bench = ids.map((defId, i) => ({ key: `b${i}`, defId, upgradeLevel: 0, upgrades: [] }))
  const rs = { ...startRun("tommy", null, { forcedSeed: 424243 }), nodeIndex: idx, path: RUN_PATH.slice(0, idx + 1), phase: "formation", bench, deployed: [...bench.map((e) => e.key), null], items: [], lastSeenAct: 1 }
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(rs)))
})
await page.reload({ waitUntil: "domcontentloaded" })
await page.waitForTimeout(1500)
await shot("2-formation")

await page.locator(".hw-tactics-start").click()
await page.waitForTimeout(1200)
await shot("3-deploy")
const begin = page.locator(".hwt-begin-battle")
if (await begin.count()) await begin.click()
await page.waitForTimeout(1200)
await shot("4-battle")
const tok = page.locator('.hwt-token[data-selectable="true"]').first()
if (await tok.count()) {
  await tok.click()
  await page.waitForTimeout(500)
  await shot("5-selected")
  const b = await page.locator(".hwt-board").boundingBox()
  await page.screenshot({ path: `${OUT}-6-zoom.png`, clip: { x: b.x, y: b.y, width: Math.min(700, b.width), height: Math.min(500, b.height) } })
}
console.log("errors", errs)
await browser.close()
