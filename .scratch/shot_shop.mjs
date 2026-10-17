// Market screen at Marc's real 1920x1080. usage: node .scratch/shot_shop.mjs <outPrefix> [port]
import { chromium } from "playwright"
const OUT = process.argv[2], PORT = process.argv[3] || 5173
const b = await chromium.launch(); const page = await (await b.newContext({ viewport: { width: Number(process.env.W || 1920), height: Number(process.env.H || 1080) } })).newPage()
const errs = []; page.on("pageerror", (e) => errs.push(e.message))
await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
await page.evaluate(async () => {
  localStorage.clear()
  const { startRun, serializeRun, RUN_PATH } = await import("/src/services/heartwood/runEngine.js")
  const idx = RUN_PATH.findIndex((n) => n.type === "battle" && n.formationId)
  const bench = ["the-fool", "the-magician", "the-chariot"].map((defId, i) => ({ key: `b${i}`, defId, upgradeLevel: 0, upgrades: [] }))
  const rs = { ...startRun("tommy", null, { forcedSeed: 424243 }), nodeIndex: idx, path: RUN_PATH.slice(0, idx + 1), phase: "shop", bench, deployed: [...bench.map((e) => e.key), null], items: [], lastSeenAct: 1 }
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(rs)))
})
await page.reload({ waitUntil: "domcontentloaded" }); await page.waitForTimeout(1500)
const got = page.locator("button", { hasText: "Got it" }); if (await got.count()) await got.first().click()
await page.waitForTimeout(300)
await page.screenshot({ path: `${OUT}-1.png` })
await page.mouse.wheel(0, 900); await page.waitForTimeout(400)
await page.screenshot({ path: `${OUT}-2.png` })
const probe = await page.evaluate(() => { const g = document.querySelector(".hw-market-featured-grid, .hwm-offers"); const c = document.querySelector(".hwm-center"); return { centerOverflow: c ? c.scrollHeight - c.clientHeight : null, kids: g ? [...g.children].map((c) => Math.round(c.getBoundingClientRect().height)) : null, docH: document.documentElement.scrollHeight, view: document.querySelector(".hwm-root") ? "table" : "classic" } }); console.log(JSON.stringify(probe))
console.log("errors", errs, "scrollW", await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]))
await b.close()
