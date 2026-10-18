// Market + Päämaja screens (graphics round 5). usage: node .scratch/shot_hq.mjs <outPrefix> [port]
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
  const ids = ["the-fool", "the-magician", "the-chariot", "the-hermit", "the-star"]
  const bench = ids.map((defId, i) => ({ key: `b${i}`, defId, upgradeLevel: 0, upgrades: [] }))
  const rs = { ...startRun("tommy", null, { forcedSeed: 424243 }), nodeIndex: idx, path: RUN_PATH.slice(0, idx + 1), phase: "shop", bench, deployed: ["b0", "b1", "b2", "b3"], items: [], lastSeenAct: 1 }
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(rs)))
  localStorage.setItem("hw-market-view", "table"); localStorage.setItem("hw-layout-tools", "0")
})
await page.reload({ waitUntil: "domcontentloaded" })
await page.waitForSelector(".hwq-root", { timeout: 15000 }); await page.waitForTimeout(2200); await page.mouse.move(2, 2)
await page.screenshot({ path: `${OUT}-0-hq-default.png` })
await page.locator(".hwq-visit").click(); await page.waitForTimeout(500)
await page.screenshot({ path: `${OUT}-1-arrival.png` })
await page.waitForTimeout(2200)
await page.screenshot({ path: `${OUT}-2-market.png` })
await page.locator(".hwm-hq-btn").click(); await page.waitForTimeout(700)
await page.screenshot({ path: `${OUT}-3-hq.png` })
console.log(JSON.stringify({ errs, hq: await page.locator(".hwq-root").count(), cards: await page.locator(".hwq-cards .hw-card").count() }))
await b.close()
