// Path choice (road screens piece 3). usage: node .scratch/shot_choice.mjs <outPrefix> [port]
import { chromium } from "playwright"
const OUT = process.argv[2], PORT = process.argv[3] || 5173
const b = await chromium.launch()
const page = await (await b.newContext({ viewport: { width: 1536, height: 864 } })).newPage()
const errs = []; page.on("pageerror", (e) => errs.push(e.message))
await page.goto(`http://localhost:${PORT}/heartwood`)
const info = await page.evaluate(async () => {
  localStorage.clear()
  const E = await import("/src/services/heartwood/runEngine.js")
  const bench = ["the-fool", "the-magician", "the-chariot"].map((defId, i) => ({ key: i, defId, upgradeLevel: 0, upgrades: [] }))
  const rs = E.leaveShop({ ...E.startRun("tommy", null, { forcedSeed: 424243 }), bench, deployed: [0, 1, 2, null], benchKeyCounter: 3 })
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(E.serializeRun(rs)))
  localStorage.setItem("hw-layout-tools", "0"); localStorage.setItem("heartwood-story-intro-seen", "true"); localStorage.setItem("hw-tactics-training-offered", "1")
  return { phase: rs.phase, n: (rs.floorChoices || []).length }
})
await page.reload(); await page.waitForTimeout(1600)
await page.screenshot({ path: `${OUT}-1.png` })
const cards = page.locator(".hw-route-card")
if (await cards.count()) { await cards.nth(1).hover(); await page.waitForTimeout(300); await page.screenshot({ path: `${OUT}-2-hover.png` }) }
const fits = await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1)
console.log(JSON.stringify({ info, cards: await cards.count(), fits, errs }))
await b.close()
