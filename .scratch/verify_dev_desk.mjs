// Dev desk in Headquarters: visible only with the Studio switch on, opens
// a hero's quick editor in place, and its Studio links land on the right
// view / type. usage: PORT=5173 node .scratch/verify_dev_desk.mjs [shotPrefix]
import { chromium } from "playwright"
const PORT = process.env.PORT || 5173, SHOT = process.argv[2]
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1536, height: 864 } })
const page = await ctx.newPage()
const errs = []; page.on("pageerror", (e) => errs.push(e.message))
const seed = (tools) => page.evaluate(async (tools) => {
  localStorage.clear()
  const { startRun, serializeRun, RUN_PATH } = await import("/src/services/heartwood/runEngine.js")
  const idx = RUN_PATH.findIndex((n) => n.type === "battle" && n.formationId)
  const bench = ["the-fool", "the-magician", "the-chariot"].map((defId, i) => ({ key: `b${i}`, defId, upgradeLevel: 0, upgrades: [] }))
  const rs = { ...startRun("tommy", null, { forcedSeed: 424243 }), nodeIndex: idx, path: RUN_PATH.slice(0, idx + 1), phase: "shop", bench, deployed: [...bench.map((e) => e.key), null], items: [], lastSeenAct: 1 }
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(rs)))
  localStorage.setItem("hw-market-view", "table"); localStorage.setItem("hw-layout-tools", tools)
}, tools)
await page.goto(`http://localhost:${PORT}/heartwood`)
const c = {}
await seed("0"); await page.reload(); await page.waitForTimeout(1500)
c.hiddenForPlayers = !(await page.locator(".hwq-devdesk").isVisible())
await seed("1"); await page.reload(); await page.waitForTimeout(1500)
c.visibleWithSwitch = await page.locator(".hwq-devdesk").isVisible()
c.oneChipPerHero = (await page.locator(".hwq-devdesk-chips").first().locator("button").count()) === 3
await page.locator(".hwq-devdesk-toggle").click(); await page.waitForTimeout(200)
const allLinks = await page.locator(".hwq-devdesk-cat a").count()
const { ALL_TYPES } = await page.evaluate(async () => ({ ALL_TYPES: (await import("/src/components/hearthwood-studio/entityTypes.js")).ALL_TYPES.length }))
c.everyStudioTypeListed = allLinks === ALL_TYPES
c.hqStillFits = await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1)
if (SHOT) await page.screenshot({ path: `${SHOT}-desk.png` })
await page.locator(".hwq-devdesk-chips").first().locator("button").first().click(); await page.waitForTimeout(1500)
c.heroEditorOpensInPlace = (await page.locator(".hwq-root").count()) === 1 && (await page.evaluate(() => document.body.innerText.length)) > 0
if (SHOT) await page.screenshot({ path: `${SHOT}-quickedit.png` })
// Studio deep links
const href = (sel) => page.locator(sel).first().getAttribute("href")
const themeHref = await page.locator(".hwq-devdesk a", { hasText: "Colours" }).getAttribute("href")
const relicHref = await page.locator('.hwq-devdesk-cat a[href*="type=relics"]').getAttribute("href")
const studio = await ctx.newPage(); studio.on("pageerror", (e) => errs.push("studio: " + e.message))
await studio.goto(`http://localhost:${PORT}${themeHref}`); await studio.waitForTimeout(2500)
c.themeLinkOpensTheme = (await studio.locator("text=Card feel").count()) > 0 || (await studio.locator("text=Click a color").count()) > 0
if (SHOT) await studio.screenshot({ path: `${SHOT}-studio-theme.png` })
await studio.goto(`http://localhost:${PORT}${relicHref}`); await studio.waitForTimeout(2500)
c.typeLinkOpensList = await studio.evaluate(() => /relic/i.test(document.body.innerText))
if (SHOT) await studio.screenshot({ path: `${SHOT}-studio-relics.png` })
const pass = Object.values(c).every(Boolean) && errs.length === 0
console.log(JSON.stringify({ c, errs: errs.slice(0, 5) }, null, 1))
console.log(pass ? "PASS" : "FAIL")
await b.close()
process.exit(pass ? 0 : 1)
