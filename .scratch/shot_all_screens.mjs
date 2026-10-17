// UI audit: every main Hearthwood screen at Marc's real 1536x864.
// usage: node .scratch/shot_all_screens.mjs <outPrefix> [port]
import { chromium } from "playwright"
const OUT = process.argv[2], PORT = process.argv[3] || 5173
const b = await chromium.launch()
const page = await (await b.newContext({ viewport: { width: 1536, height: 864 } })).newPage()
const errs = []; page.on("pageerror", (e) => errs.push(e.message))
await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
const seed = (phase) => page.evaluate(async (phase) => {
  localStorage.clear()
  const { startRun, serializeRun, RUN_PATH } = await import("/src/services/heartwood/runEngine.js")
  const idx = RUN_PATH.findIndex((n) => n.type === "battle" && n.formationId)
  const bench = ["the-fool", "the-magician", "the-chariot"].map((defId, i) => ({ key: `b${i}`, defId, upgradeLevel: 0, upgrades: [] }))
  const rs = { ...startRun("tommy", null, { forcedSeed: 424243 }), nodeIndex: idx, path: RUN_PATH.slice(0, idx + 1), phase, bench, deployed: [...bench.map((e) => e.key), null], items: [], lastSeenAct: 1 }
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(rs)))
  localStorage.setItem("hw-tactics-training-offered", "1")
}, phase)
for (const phase of ["event", "relic", "camp", "choice"]) {
  await seed(phase); await page.reload({ waitUntil: "domcontentloaded" }); await page.waitForTimeout(1400)
  await page.screenshot({ path: `${OUT}-${phase}.png` })
}
await seed("formation"); await page.reload({ waitUntil: "domcontentloaded" }); await page.waitForTimeout(1400)
await page.locator(".hw-tactics-start").click(); await page.waitForTimeout(1000)
await page.screenshot({ path: `${OUT}-deploy.png` })
await page.locator(".hwt-begin-battle").click(); await page.waitForTimeout(2200)
await page.locator('.hwt-token[data-selectable="true"]').first().click(); await page.waitForTimeout(500)
await page.screenshot({ path: `${OUT}-battle.png` })
console.log("errors", errs)
await b.close()
