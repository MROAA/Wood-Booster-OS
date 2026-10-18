// One real fight per story Act, to see each Act's biome on the battlefield.
// usage: node .scratch/shot_act_biomes.mjs <outPrefix> [port] [acts=1,2,3,4,5,6]
import { chromium } from "playwright"
const OUT = process.argv[2], PORT = process.argv[3] || 5452
const ACTS = (process.argv[4] || "1,2,3,4,5,6").split(",").map(Number)
const b = await chromium.launch()
const errs = []
const result = {}
for (const act of ACTS) {
  const page = await (await b.newContext({ viewport: { width: 1536, height: 864 } })).newPage()
  page.on("pageerror", (e) => errs.push(`act${act}: ${e.message}`))
  await page.goto(`http://localhost:${PORT}/heartwood`)
  const info = await page.evaluate(async (act) => {
    localStorage.clear()
    const E = await import("/src/services/heartwood/runEngine.js")
    const idx = E.RUN_PATH.findIndex((n, i) => n.type === "battle" && E.actIndexForNode(i, E.RUN_PATH.length) === act)
    if (idx < 0) return null
    const bench = ["the-fool", "the-magician", "the-chariot"].map((defId, i) => ({ key: `b${i}`, defId, upgradeLevel: 0, upgrades: [] }))
    const rs = { ...E.startRun("tommy", null, { forcedSeed: 424256 + act }), nodeIndex: idx, path: E.RUN_PATH.slice(0, idx + 1), phase: "formation", bench, deployed: [bench[0].key, bench[1].key, bench[2].key, null], items: [], lastSeenAct: act }
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(E.serializeRun(rs)))
    localStorage.setItem("hw-layout-tools", "0"); localStorage.setItem("heartwood-story-intro-seen", "true"); localStorage.setItem("hw-tactics-training-offered", "1")
    return { idx }
  }, act)
  if (!info) { result[act] = "no battle node"; continue }
  await page.reload(); await page.waitForTimeout(1500)
  await page.locator(".hw-tactics-start").click(); await page.waitForTimeout(1500)
  await page.mouse.move(3, 3); await page.waitForTimeout(1200)
  const biome = await page.evaluate(() => document.querySelector(".hwt-board")?.dataset.biome)
  result[act] = { idx: info.idx, biome }
  const board = await page.locator(".hwt-board").boundingBox()
  await page.screenshot({ path: `${OUT}-act${act}.png`, clip: board })
  await page.close()
}
console.log(JSON.stringify({ result, errs }))
await b.close()
