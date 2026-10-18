// Relic choice (road screens piece 5). usage: node .scratch/shot_relic.mjs <outPrefix> [port]
import { chromium } from "playwright"
const OUT = process.argv[2], PORT = process.argv[3] || 5173
const b = await chromium.launch()
const page = await (await b.newContext({ viewport: { width: 1536, height: 864 } })).newPage()
const errs = []; page.on("pageerror", (e) => errs.push(e.message))
await page.goto(`http://localhost:${PORT}/heartwood`)
await page.evaluate(async () => {
  localStorage.clear()
  const { startRun, serializeRun, RUN_PATH } = await import("/src/services/heartwood/runEngine.js")
  const { RELICS } = await import("/src/data/heartwood/relics.js")
  const idx = RUN_PATH.findIndex((n) => n.type === "battle" && n.formationId)
  const bench = ["the-fool", "the-magician"].map((defId, i) => ({ key: `b${i}`, defId, upgradeLevel: 0, upgrades: [] }))
  const byTier = (t) => Object.values(RELICS).find((r) => r.tier === t)?.id
  const offers = [byTier("common"), byTier("rare"), byTier("legendary") || byTier("epic")].filter(Boolean)
  const rs = { ...startRun("tommy", null, { forcedSeed: 424243 }), nodeIndex: idx, path: RUN_PATH.slice(0, idx + 1), phase: "relic", relicOffers: offers, bench, deployed: ["b0", "b1", null, null], items: [], lastSeenAct: 1 }
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(rs)))
  localStorage.setItem("hw-layout-tools", "0"); localStorage.setItem("heartwood-story-intro-seen", "true")
})
await page.reload(); await page.waitForTimeout(1500)
const cards = page.locator(".hw-relic-card")
if (await cards.count() > 1) { await cards.nth(1).hover(); await page.waitForTimeout(300) }
await page.screenshot({ path: `${OUT}-1.png` })
const n = await cards.count()
const e0 = await page.evaluate(() => JSON.parse(localStorage.getItem("heartwood-run-save-v1")).run.relics.length)
await cards.first().click(); await page.waitForTimeout(800)
const after = await page.evaluate(() => { const r = JSON.parse(localStorage.getItem("heartwood-run-save-v1")).run; return { relics: r.relics.length, phase: r.phase } })
console.log(JSON.stringify({ cards: n, before: e0, after, errs }))
await b.close()
