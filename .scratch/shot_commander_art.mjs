// Screenshots: Headquarters at a market stop (Continue plaque), HQ from an
// event (Back plaque), and the Commander select (the new paintings).
import { chromium } from "playwright"
const PORT = process.env.PORT || 5173, OUT = process.argv[2]
const b = await chromium.launch()
const page = await (await b.newContext({ viewport: { width: 1536, height: 864 } })).newPage()
const errs = []; page.on("pageerror", (e) => errs.push(e.message))
const seed = (phase, cmd) => page.evaluate(async ([phase, cmd]) => {
  localStorage.clear()
  const { startRun, serializeRun, RUN_PATH } = await import("/src/services/heartwood/runEngine.js")
  const idx = RUN_PATH.findIndex((n) => n.type === "battle" && n.formationId)
  const bench = ["the-fool", "the-magician", "the-chariot"].map((defId, i) => ({ key: `b${i}`, defId, upgradeLevel: 0, upgrades: [] }))
  const rs = { ...startRun(cmd, null, { forcedSeed: 424243 }), nodeIndex: idx, path: RUN_PATH.slice(0, idx + 1), phase, bench, deployed: [...bench.map((e) => e.key), null], items: [], lastSeenAct: 1 }
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(rs)))
  localStorage.setItem("hw-market-view", "table"); localStorage.setItem("hw-layout-tools", "0")
  localStorage.setItem("hw-tactics-training-offered", "1")
}, [phase, cmd])
await page.goto(`http://localhost:${PORT}/heartwood`)
await seed("shop", "aatos"); await page.reload(); await page.waitForTimeout(1800)
await page.screenshot({ path: `${OUT}-hq-shop.png` })
await seed("event", "fenrir"); await page.reload(); await page.waitForTimeout(1500)
await page.locator(".hw-hq-open-btn").click(); await page.waitForTimeout(800)
await page.screenshot({ path: `${OUT}-hq-back.png` })
await page.locator(".hwq-return").hover(); await page.waitForTimeout(300)
await page.locator(".hwq-return").screenshot({ path: `${OUT}-back-hover.png` })
await seed("formation", "repo"); await page.reload(); await page.waitForTimeout(1500)
await page.locator(".hw-tactics-start").click(); await page.waitForTimeout(1500)
await page.screenshot({ path: `${OUT}-battle-repo.png` })
await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(1500)
await page.screenshot({ path: `${OUT}-title.png` })
console.log(JSON.stringify({ errs }))
await b.close()
