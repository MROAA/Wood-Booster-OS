// Headquarters + Market (graphics rounds 4-6): Headquarters is the default
// stance, the Market is trading only, cards show cost / attack / health.
// usage: PORT=5173 node .scratch/verify_market_table.mjs [shotPrefix]
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
  localStorage.setItem("hw-layout-tools", "0")
})
await page.reload({ waitUntil: "domcontentloaded" }); await page.waitForTimeout(1500)
const got = page.locator("button", { hasText: "Got it" }); if (await got.count()) await got.first().click()
const c = {}
const essence = async () => Number((await page.locator(".hw-essence-value").first().textContent()).trim())
const fits = () => page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1 && document.documentElement.scrollWidth <= innerWidth + 1)

// --- Headquarters: the default stance
c.hqIsDefault = (await page.locator(".hwq-root").count()) === 1 && (await page.locator(".hwm-root").count()) === 0
c.hqFits = await fits()
c.hqContinueInView = await page.evaluate(() => document.querySelector(".hwq-root .hwm-continue").getBoundingClientRect().bottom <= innerHeight)
c.hqShowsSquad = (await page.locator(".hwq-cards .hw-card").count()) === 3
c.hqHasCommander = (await page.locator(".hwq-root .hw-commander-cluster").count()) === 1
c.hqHidesOwnedPrice = await page.evaluate(() => [...document.querySelectorAll(".hwq-cards .hw-card-cost")].every((e) => getComputedStyle(e).display === "none"))
// cards: exactly one attack gem, and it is the battle's own attack number
c.cardAttackIsBattleAttack = await page.evaluate(async () => {
  const { attackFromMovePattern } = await import("/src/services/heartwood/tacticsEngine.js")
  const { UNITS } = await import("/src/data/heartwood/units.js")
  const want = ["the-fool", "the-magician", "the-chariot"].map((id) => String(attackFromMovePattern(UNITS[id].movePattern)))
  const got = [...document.querySelectorAll(".hwq-cards .hw-card")].map((card) => [...card.querySelectorAll(".hw-effect-icon")].map((g) => g.textContent.trim()))
  return got.every((g) => g.length === 1) && got.map((g) => g[0]).sort().join() === want.sort().join()
})

// --- to the Market
await page.locator(".hwq-visit").click(); await page.waitForTimeout(2600)
c.marketShown = (await page.locator(".hwm-root").count()) === 1
c.marketFits = await fits()
c.marketCenterFits = await page.evaluate(() => { const el = document.querySelector(".hwm-center"); return el.scrollHeight - el.clientHeight <= 2 })
c.marketTradingOnly = (await page.locator(".hwm-root .hwm-squad, .hwm-root .hwm-continue, .hwm-root .hw-commander-cluster").count()) === 0
c.threeOffers = (await page.locator(".hwm-offers .hw-card").count()) === 3
c.runesOnTitles = (await page.locator("[data-rune]").count()) >= 6
const e0 = await essence()
await page.locator(".hwm-offers .hw-card").first().click(); await page.waitForTimeout(800)
c.buySpendsEssence = (await essence()) < e0
const e2 = await essence()
await page.locator(".hwm-actions button", { hasText: "Reroll" }).click(); await page.waitForTimeout(600)
c.rerollWorks = (await essence()) < e2
if (SHOT) await page.screenshot({ path: `${SHOT}-market.png` })

// --- back home: the bought hero is in the squad; sell one from its card
await page.locator(".hwm-hq-btn").click(); await page.waitForTimeout(600)
c.backToHq = (await page.locator(".hwq-root").count()) === 1
c.boughtHeroInSquad = (await page.locator(".hwq-cards .hw-card").count()) === 4
const e1 = await essence()
await page.locator(".hwq-cards .hw-sell-btn").first().click(); await page.waitForTimeout(600)
c.sellRefunds = (await essence()) > e1
if (SHOT) await page.screenshot({ path: `${SHOT}-hq.png` })

// --- classic layout and back, remembered across reload
await page.locator(".hwq-visit").click(); await page.waitForTimeout(2600)
await page.locator(".hwm-classic-link").click(); await page.waitForTimeout(500)
c.classicReachable = (await page.locator(".hw-shop-3zone-stage").count()) === 1
await page.reload({ waitUntil: "domcontentloaded" }); await page.waitForTimeout(1200)
c.classicRemembered = (await page.locator(".hw-shop-3zone-stage").count()) === 1
await page.locator(".hwm-classic-link--back").click(); await page.waitForTimeout(500)
c.backToTable = (await page.locator(".hwq-root").count()) === 1

// --- Continue (from Headquarters) leaves the stop
await page.locator(".hwq-root .hwm-continue").click(); await page.waitForTimeout(900)
c.continueLeaves = (await page.locator(".hwq-root, .hwm-root").count()) === 0
const pass = Object.values(c).every(Boolean) && errs.length === 0
console.log(JSON.stringify({ c, errs }, null, 1))
console.log(pass ? "PASS" : "FAIL")
await b.close()
process.exit(pass ? 0 : 1)
