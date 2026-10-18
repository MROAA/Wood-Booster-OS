// Card turn frames: Headquarters opening (backs -> faces) and a Market visit.
// usage: node .scratch/shot_card_turn.mjs <outPrefix> [port]
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
  const bench = ["the-fool", "the-magician", "the-chariot", "the-hermit"].map((defId, i) => ({ key: `b${i}`, defId, upgradeLevel: 0, upgrades: [] }))
  const rs = { ...startRun("tommy", null, { forcedSeed: 424243 }), nodeIndex: idx, path: RUN_PATH.slice(0, idx + 1), phase: "shop", bench, deployed: ["b0", "b1", "b2", "b3"], items: [], lastSeenAct: 1 }
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(rs)))
  localStorage.setItem("hw-market-view", "table"); localStorage.setItem("hw-layout-tools", "0")
})
await page.reload({ waitUntil: "domcontentloaded" })
await page.waitForSelector(".hwq-cards > *", { timeout: 15000 })
for (const [n, t] of [["a", 380], ["b", 230], ["c", 200]]) {
  await page.waitForTimeout(t)
  const r = await page.locator(".hwq-cards").first().boundingBox()
  await page.screenshot({ path: `${OUT}-hq-${n}.png`, clip: { x: r.x, y: r.y, width: r.width, height: 340 } })
}
await page.waitForTimeout(1500)
const settled = await page.evaluate(() => [...document.querySelectorAll(".hwq-cards > *")].every((el) => getComputedStyle(el, "::after").visibility === "hidden" && getComputedStyle(el).opacity === "1"))
await page.locator(".hwq-visit").click()
await page.waitForTimeout(1650)
const r = await page.locator(".hwm-offers").boundingBox()
await page.screenshot({ path: `${OUT}-market-turn.png`, clip: r })
console.log(JSON.stringify({ settled, errs }))
await b.close()
