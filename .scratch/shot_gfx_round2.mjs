import { chromium } from "playwright"
const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
await page.goto(`http://localhost:5191/heartwood`, { waitUntil: "domcontentloaded" })
await page.evaluate(async () => {
  const { startRun, serializeRun, RUN_PATH } = await import("/src/services/heartwood/runEngine.js")
  const idx = RUN_PATH.findIndex((n) => n.type === "battle" && n.formationId)
  const ids = ["the-fool", "the-magician", "the-chariot"]
  const bench = ids.map((defId, i) => ({ key: `b${i}`, defId, upgradeLevel: 0, upgrades: [] }))
  const rs = { ...startRun("tommy", null, { forcedSeed: 424243 }), nodeIndex: idx, path: RUN_PATH.slice(0, idx + 1), phase: "formation", bench, deployed: [...bench.map((e) => e.key), null], items: [], lastSeenAct: 1 }
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(rs)))
})
await page.reload({ waitUntil: "domcontentloaded" }); await page.waitForTimeout(1200)
await page.locator(".hw-tactics-start").click(); await page.waitForTimeout(800)
await page.locator(".hwt-begin-battle").click(); await page.waitForTimeout(800)
await page.locator('.hwt-token[data-selectable="true"]').first().click(); await page.waitForTimeout(400)
const OUT = process.argv[2]
const errs = []; page.on("pageerror", (e) => errs.push(e.message))
await page.screenshot({ path: `${OUT}-a-selected.png` })
const panel = await page.locator(".hwt-panel").boundingBox()
await page.screenshot({ path: `${OUT}-b-panel.png`, clip: { x: panel.x, y: panel.y, width: panel.width, height: Math.min(900 - panel.y, panel.height) } })
await page.locator(".hwt-res-rules summary").first().click().catch(() => {})
await page.waitForTimeout(200)
await page.screenshot({ path: `${OUT}-c-panel-open.png`, clip: { x: panel.x, y: panel.y, width: panel.width, height: Math.min(900 - panel.y, panel.height) } })
// end turns until an enemy strike plays; grab frames mid-animation
for (let t = 0; t < 4; t++) {
  await page.locator(".hwt-end-turn").click()
  for (let f = 0; f < 10; f++) {
    await page.waitForTimeout(110)
    if (await page.locator(".hwt-splat").count()) { await page.screenshot({ path: `${OUT}-d-splat-${t}-${f}.png` }); }
  }
  if (await page.locator(".hwt-end-turn:not(:disabled)").count() === 0) await page.waitForTimeout(2500)
}
console.log("errors", errs)
await browser.close()
