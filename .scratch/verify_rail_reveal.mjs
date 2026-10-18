// Relics & bag (and the Ledger) in the pop-up style: a chip shows its name,
// its description is folded and opens on hover - Headquarters and Market.
// usage: PORT=5173 node .scratch/verify_rail_reveal.mjs [shotPrefix]
import { chromium } from "playwright"
const PORT = process.env.PORT || 5173, SHOT = process.argv[2]
const b = await chromium.launch()
const page = await (await b.newContext({ viewport: { width: 1536, height: 864 } })).newPage()
const errs = []; page.on("pageerror", (e) => errs.push(e.message))
await page.goto(`http://localhost:${PORT}/heartwood`)
await page.evaluate(async () => {
  localStorage.clear()
  const { startRun, serializeRun, RUN_PATH } = await import("/src/services/heartwood/runEngine.js")
  const { RELICS } = await import("/src/data/heartwood/relics.js")
  const { ITEMS } = await import("/src/data/heartwood/items.js")
  const idx = RUN_PATH.findIndex((n) => n.type === "battle" && n.formationId)
  const bench = ["the-fool", "the-magician"].map((defId, i) => ({ key: `b${i}`, defId, upgradeLevel: 0, upgrades: [] }))
  const relic = Object.keys(RELICS)[0], item = Object.keys(ITEMS)[0]
  const rs = { ...startRun("tommy", null, { forcedSeed: 424243 }), nodeIndex: idx, path: RUN_PATH.slice(0, idx + 1), phase: "shop", bench, deployed: ["b0", "b1", null, null], relics: [relic], items: [{ key: 0, defId: item, equippedTo: null, slotIndex: null }], itemKeyCounter: 1, lastSeenAct: 1 }
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(rs)))
  localStorage.setItem("hw-market-view", "table"); localStorage.setItem("hw-layout-tools", "0"); localStorage.setItem("heartwood-story-intro-seen", "true")
})
await page.reload(); await page.waitForTimeout(2600)
const c = {}
const probe = async (scope) => {
  await page.mouse.move(2, 2); await page.waitForTimeout(350)
  const chip = page.locator(`${scope} .hw-rail-chip`).first()
  const h = () => chip.locator(".hw-rail-chip-more").evaluate((e) => Math.round(e.getBoundingClientRect().height))
  const folded = await h()
  await chip.hover(); await page.waitForTimeout(450)
  const opened = await h()
  const text = (await chip.locator(".hw-rail-chip-more").textContent()).trim()
  return folded === 0 && opened > 8 && text.length > 5
}
c.hqChips = (await page.locator(".hwq-root .hw-rail-chip").count()) >= 2
c.hqRelicOrItemOpens = await probe(".hwq-root")
if (SHOT) await page.screenshot({ path: `${SHOT}-hq.png` })
await page.locator(".hwq-visit").click(); await page.waitForTimeout(2600)
c.marketLedgerOpens = await probe(".hwm-root")
if (SHOT) await page.screenshot({ path: `${SHOT}-market.png` })
const pass = Object.values(c).every(Boolean) && errs.length === 0
console.log(JSON.stringify({ c, errs }))
console.log(pass ? "PASS" : "FAIL")
await b.close(); process.exit(pass ? 0 : 1)
