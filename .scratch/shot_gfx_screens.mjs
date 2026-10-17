// Graphics round 2 audit: one headless page, the main run screens.
// usage: node .scratch/shot_gfx_screens.mjs <outPrefix> [port]
import { chromium } from "playwright"
const OUT = process.argv[2], PORT = process.argv[3] || 5173
const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
const errs = []; page.on("pageerror", (e) => errs.push(e.message))
await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
for (const phase of ["formation", "shop", "relic", "event", "camp"]) {
  await page.evaluate(async (phase) => {
    localStorage.clear()
    const { startRun, serializeRun, RUN_PATH } = await import("/src/services/heartwood/runEngine.js")
    const idx = RUN_PATH.findIndex((n) => n.type === "battle" && n.formationId)
    const ids = ["the-fool", "the-magician", "the-chariot"]
    const bench = ids.map((defId, i) => ({ key: `b${i}`, defId, upgradeLevel: 0, upgrades: [] }))
    const rs = { ...startRun("tommy", null, { forcedSeed: 424243 }), nodeIndex: idx, path: RUN_PATH.slice(0, idx + 1), phase, bench, deployed: [...bench.map((e) => e.key), null], items: [], lastSeenAct: 1, gold: 30 }
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(rs)))
  }, phase)
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `${OUT}-${phase}.png` })
}
await page.evaluate(() => localStorage.clear())
await page.reload({ waitUntil: "domcontentloaded" }); await page.waitForTimeout(1200)
await page.screenshot({ path: `${OUT}-home.png` })
console.log("errors", errs)
await browser.close()
