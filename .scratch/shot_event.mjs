// Event screen (road screens piece 1). usage: node .scratch/shot_event.mjs <outPrefix> [port]
import { chromium } from "playwright"
const OUT = process.argv[2], PORT = process.argv[3] || 5173
const b = await chromium.launch()
const page = await (await b.newContext({ viewport: { width: 1536, height: 864 } })).newPage()
const errs = []; page.on("pageerror", (e) => errs.push(e.message))
await page.goto(`http://localhost:${PORT}/heartwood`)
await page.evaluate(async () => {
  localStorage.clear()
  const { startRun, serializeRun, RUN_PATH } = await import("/src/services/heartwood/runEngine.js")
  const idx = RUN_PATH.findIndex((n) => n.type === "battle" && n.formationId)
  const bench = ["the-fool", "the-magician", "the-chariot"].map((defId, i) => ({ key: `b${i}`, defId, upgradeLevel: 0, upgrades: [] }))
  const rs = { ...startRun("tommy", null, { forcedSeed: 424243 }), nodeIndex: idx, path: RUN_PATH.slice(0, idx + 1), phase: "event", bench, deployed: [...bench.map((e) => e.key), null], items: [], lastSeenAct: 1 }
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(rs)))
  localStorage.setItem("hw-layout-tools", "0"); localStorage.setItem("heartwood-story-intro-seen", "true")
})
await page.reload(); await page.waitForTimeout(1500)
await page.screenshot({ path: `${OUT}-1.png` })
await page.locator(".hw-event-choice").nth(1).hover(); await page.waitForTimeout(300)
await page.screenshot({ path: `${OUT}-2-hover.png` })
await page.locator(".hw-event-choice").first().click(); await page.waitForTimeout(600)
await page.screenshot({ path: `${OUT}-3-result.png` })
const fits = await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1)
await page.locator(".hw-event-continue").click(); await page.waitForTimeout(700)
const left = await page.evaluate(() => JSON.parse(localStorage.getItem("heartwood-run-save-v1")).run.phase)
console.log(JSON.stringify({ errs, fits, phaseAfter: left }))
await b.close()
