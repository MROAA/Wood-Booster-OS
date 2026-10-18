// No Finnish visible in the game (Marc: "ei suomea näkyviin pelissä") -
// scans the rendered text of Headquarters and the Market.
// usage: PORT=5173 node .scratch/verify_no_finnish.mjs
import { chromium } from "playwright"
const PORT = process.env.PORT || 5173
const b = await chromium.launch()
const page = await (await b.newContext({ viewport: { width: 1536, height: 864 } })).newPage()
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
await page.reload(); await page.waitForTimeout(1500)
const hq = await page.evaluate(() => document.body.innerText)
await page.locator(".hwq-visit").click(); await page.waitForTimeout(2600)
const market = await page.evaluate(() => document.body.innerText)
const hits = [...new Set([hq, market].join("\n").split("\n").filter((l) => /[äöÄÖ]|\b(markkinat|sankarit|varusteet|joukko|päämaja|kauppias|matka|aarteet|sijoitukset|päällikkö|vara|kokoonpano|saavutte)\b/i.test(l)))]
console.log(JSON.stringify({ hits }))
console.log(hits.length === 0 ? "PASS" : "FAIL")
await b.close()
process.exit(hits.length === 0 ? 0 : 1)
