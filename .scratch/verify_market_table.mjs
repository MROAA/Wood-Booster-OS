// Market table (graphics round 4): the redesigned Market works end to end.
// usage: PORT=5194 node .scratch/verify_market_table.mjs [shotPrefix]
import { chromium } from "playwright"
const PORT = process.env.PORT || 5173, SHOT = process.argv[2]
const b = await chromium.launch()
const page = await (await b.newContext({ viewport: { width: 1536, height: 864 } })).newPage()
const errs = []; page.on("pageerror", (e) => errs.push(e.message))
await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
await page.evaluate(async () => {
  localStorage.clear()
  const { startRun, serializeRun, RUN_PATH } = await import("/src/services/heartwood/runEngine.js")
  const idx = RUN_PATH.findIndex((n) => n.type === "battle" && n.formationId)
  const bench = ["the-fool", "the-magician", "the-chariot"].map((defId, i) => ({ key: `b${i}`, defId, upgradeLevel: 0, upgrades: [] }))
  const rs = { ...startRun("tommy", null, { forcedSeed: 424243 }), nodeIndex: idx, path: RUN_PATH.slice(0, idx + 1), phase: "shop", bench, deployed: [...bench.map((e) => e.key), null], items: [], lastSeenAct: 1 }
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(rs)))
  localStorage.setItem("hw-market-view", "table") // suites default to classic
})
await page.reload({ waitUntil: "domcontentloaded" }); await page.waitForTimeout(1500)
const got = page.locator("button", { hasText: "Got it" }); if (await got.count()) await got.first().click()
const c = {}
const essence = async () => Number((await page.locator(".hwm-root .hw-essence-value").textContent()).trim())
c.tableShown = (await page.locator(".hwm-root").count()) === 1
c.noPageScroll = await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1 && document.documentElement.scrollWidth <= innerWidth + 1)
c.centerFits = await page.evaluate(() => { const el = document.querySelector(".hwm-center"); return el.scrollHeight - el.clientHeight <= 2 })
c.threeOffers = (await page.locator(".hwm-offers .hw-card").count()) === 3
c.squadChips = (await page.locator(".hwm-chip:not(.hwm-chip--empty)").count()) === 3
c.runesOnTitles = (await page.locator("[data-rune]").count()) >= 6
// buy the first affordable hero
const e0 = await essence()
const chipsBefore = await page.locator(".hwm-chip:not(.hwm-chip--empty)").count()
await page.locator(".hwm-offers .hw-card").first().click(); await page.waitForTimeout(700)
c.buySpendsEssence = (await essence()) < e0
c.buyAddsToSquad = (await page.locator(".hwm-chip:not(.hwm-chip--empty)").count()) === chipsBefore + 1
// open a squad hero: its full card + Sell
await page.locator(".hwm-chip:not(.hwm-chip--empty)").first().click(); await page.waitForTimeout(300)
c.inspectorOpens = (await page.locator(".hwm-inspector .hw-card").count()) === 1 && (await page.locator(".hwm-inspector .hw-sell-btn").count()) === 1
if (SHOT) await page.screenshot({ path: `${SHOT}-inspector.png` })
const e1 = await essence()
await page.locator(".hwm-inspector .hw-sell-btn").click(); await page.waitForTimeout(600)
c.sellRefunds = (await essence()) > e1
// reroll changes essence
const e2 = await essence()
await page.locator(".hwm-actions button", { hasText: "Reroll" }).click(); await page.waitForTimeout(500)
c.rerollWorks = (await essence()) < e2
// classic layout and back, remembered across reload
await page.locator(".hwm-classic-link").click(); await page.waitForTimeout(500)
c.classicReachable = (await page.locator(".hw-shop-3zone-stage").count()) === 1
await page.reload({ waitUntil: "domcontentloaded" }); await page.waitForTimeout(1200)
c.classicRemembered = (await page.locator(".hw-shop-3zone-stage").count()) === 1
await page.locator(".hwm-classic-link--back").click(); await page.waitForTimeout(500)
c.backToTable = (await page.locator(".hwm-root").count()) === 1
// Continue leaves the shop
await page.locator(".hwm-continue").click(); await page.waitForTimeout(900)
c.continueLeaves = (await page.locator(".hwm-root").count()) === 0
const pass = Object.values(c).every(Boolean) && errs.length === 0
console.log(JSON.stringify({ c, errs }, null, 1))
console.log(pass ? "PASS" : "FAIL")
await b.close()
process.exit(pass ? 0 : 1)
