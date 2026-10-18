// Frames of the animated detail reveal on a Headquarters hero card.
// usage: node .scratch/shot_reveal_anim.mjs <outPrefix> [port]
import { chromium } from "playwright"
const OUT = process.argv[2], PORT = process.argv[3] || 5173
const b = await chromium.launch()
const page = await (await b.newContext({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 2 })).newPage()
await page.goto(`http://localhost:${PORT}/heartwood`)
await page.evaluate(async () => {
  localStorage.clear()
  const { startRun, serializeRun, RUN_PATH } = await import("/src/services/heartwood/runEngine.js")
  const idx = RUN_PATH.findIndex((n) => n.type === "battle" && n.formationId)
  const bench = ["the-fool", "the-magician", "the-chariot"].map((defId, i) => ({ key: `b${i}`, defId, upgradeLevel: 0, upgrades: [] }))
  const rs = { ...startRun("tommy", null, { forcedSeed: 424243 }), nodeIndex: idx, path: RUN_PATH.slice(0, idx + 1), phase: "shop", bench, deployed: [...bench.map((e) => e.key), null], items: [], lastSeenAct: 1 }
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(rs)))
  localStorage.setItem("hw-market-view", "table"); localStorage.setItem("hw-layout-tools", "0")
})
await page.reload(); await page.waitForTimeout(2600); await page.mouse.move(2, 2); await page.waitForTimeout(300)
const box = await page.locator(".hwq-cards > *").first().boundingBox()
const clip = { x: box.x - 6, y: box.y - 6, width: box.width + 12, height: 560 }
await page.screenshot({ path: `${OUT}-0.png`, clip })
await page.locator(".hwq-cards > *").first().hover()
for (const t of [90, 120, 400]) { await page.waitForTimeout(t); await page.screenshot({ path: `${OUT}-${t}.png`, clip }) }
await b.close()
