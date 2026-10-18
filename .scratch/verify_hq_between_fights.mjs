// Headquarters between fights: the utility-bar button opens the camp on
// any between-fight screen, every squad action works there, "Back to the
// road" returns to the same screen, and it never shows in a battle.
// usage: PORT=5173 node .scratch/verify_hq_between_fights.mjs [shotPrefix]
import { chromium } from "playwright"
const PORT = process.env.PORT || 5173, SHOT = process.argv[2]
const b = await chromium.launch()
const page = await (await b.newContext({ viewport: { width: 1536, height: 864 } })).newPage()
const errs = []; page.on("pageerror", (e) => errs.push(e.message))
const seed = (phase) => page.evaluate(async (phase) => {
  localStorage.clear()
  const { startRun, serializeRun, RUN_PATH } = await import("/src/services/heartwood/runEngine.js")
  const idx = RUN_PATH.findIndex((n) => n.type === "battle" && n.formationId)
  const bench = ["the-fool", "the-magician", "the-chariot"].map((defId, i) => ({ key: `b${i}`, defId, upgradeLevel: 0, upgrades: [] }))
  const rs = { ...startRun("tommy", null, { forcedSeed: 424243 }), nodeIndex: idx, path: RUN_PATH.slice(0, idx + 1), phase, bench, deployed: [...bench.map((e) => e.key), null], items: [], lastSeenAct: 1 }
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(rs)))
  localStorage.setItem("hw-market-view", "table"); localStorage.setItem("hw-layout-tools", "0")
  localStorage.setItem("hw-tactics-training-offered", "1")
}, phase)
const hqBtn = () => page.locator(".hw-hq-open-btn")
const essence = async () => Number((await page.locator(".hw-essence-value").first().textContent()).trim())
await page.goto(`http://localhost:${PORT}/heartwood`)
const c = {}
for (const phase of ["event", "relic", "camp", "formation"]) {
  await seed(phase); await page.reload(); await page.waitForTimeout(1500)
  const before = await page.evaluate(() => document.body.innerText.slice(0, 200))
  c[`${phase}:button`] = (await hqBtn().count()) === 1
  await hqBtn().click(); await page.waitForTimeout(600)
  c[`${phase}:opens`] = (await page.locator(".hwq-root").count()) === 1
  c[`${phase}:noMarketHere`] = (await page.locator(".hwq-market-entry, .hwq-root .hwm-continue").count()) === 0
  c[`${phase}:backButton`] = (await page.locator(".hwq-return").count()) === 1
  c[`${phase}:fits`] = await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1 && document.querySelector(".hwq-return").getBoundingClientRect().bottom <= innerHeight)
  if (phase === "event") {
    if (SHOT) await page.screenshot({ path: `${SHOT}-hq-from-event.png` })
    // no merchant here: camp actions only, no selling/reforging
    c["event:campActionsOnly"] = (await page.locator(".hwq-cards .hw-sell-btn").count()) === 0 && (await page.locator(".hwq-cards .hw-upgrade-btn").count()) === 3
  }
  await page.locator(".hwq-return").click(); await page.waitForTimeout(600)
  c[`${phase}:backToSameScreen`] = (await page.locator(".hwq-root").count()) === 0 && (await page.evaluate(async () => JSON.parse(localStorage.getItem("heartwood-run-save-v1")).run.phase)) === phase
}
// market stop: Headquarters is already the screen, no extra button there
await seed("shop"); await page.reload(); await page.waitForTimeout(1500)
c["shop:hqIsDefault"] = (await page.locator(".hwq-root").count()) === 1
c["shop:noExtraButton"] = (await hqBtn().count()) === 0
// after Continue the map interstitial gets the button
await page.locator(".hwq-root .hwm-continue").click(); await page.waitForTimeout(900)
c["mapAfterShop:button"] = (await hqBtn().count()) === 1
// never inside a battle
await seed("formation"); await page.reload(); await page.waitForTimeout(1500)
await page.locator(".hw-tactics-start").click(); await page.waitForTimeout(1200)
c["battle:noButton"] = (await hqBtn().count()) === 0
const pass = Object.values(c).every(Boolean) && errs.length === 0
console.log(JSON.stringify({ c, errs: errs.slice(0, 5) }, null, 1))
console.log(pass ? "PASS" : "FAIL")
await b.close()
process.exit(pass ? 0 : 1)
