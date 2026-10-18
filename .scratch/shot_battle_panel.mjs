// Battle side panel: selected hero folded vs hovered.
// usage: node .scratch/shot_battle_panel.mjs <outPrefix> [port]
import { chromium } from "playwright"
const OUT = process.argv[2], PORT = process.argv[3] || 5173
const b = await chromium.launch()
const page = await (await b.newContext({ viewport: { width: 1536, height: 864 } })).newPage()
const errs = []; page.on("pageerror", (e) => errs.push(e.message))
await page.goto(`http://localhost:${PORT}/heartwood`)
await page.evaluate(async () => {
  localStorage.clear()
  const E = await import("/src/services/heartwood/runEngine.js")
  const bench = ["the-fool", "the-magician", "the-chariot"].map((defId, i) => ({ key: i, defId, upgradeLevel: 0, upgrades: [] }))
  const rs = E.chooseFloorEncounter(E.leaveShop({ ...E.startRun("tommy", null, { forcedSeed: 424243 }), bench, deployed: [0, 1, 2, null], benchKeyCounter: 3 }), 0)
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(E.serializeRun(rs)))
  localStorage.setItem("hw-layout-tools", "0"); localStorage.setItem("heartwood-story-intro-seen", "true"); localStorage.setItem("hw-tactics-training-offered", "1")
})
await page.reload(); await page.waitForTimeout(1500)
await page.locator(".hw-tactics-start").click(); await page.waitForTimeout(1200)
const begin = page.locator(".hwt-begin-battle"); if (await begin.count()) await begin.click()
await page.waitForTimeout(2600)
await page.locator('.hwt-token[data-selectable="true"]').first().click(); await page.waitForTimeout(500)
await page.mouse.move(700, 500); await page.waitForTimeout(400)
const panel = await page.locator(".hwt-panel").boundingBox()
const clip = { x: panel.x, y: panel.y, width: panel.width, height: Math.min(864 - panel.y, panel.height) }
const h = () => page.locator(".hwt-selected-card").evaluate((e) => Math.round(e.getBoundingClientRect().height))
const folded = await h()
await page.screenshot({ path: `${OUT}-folded.png`, clip })
await page.locator(".hwt-selected-card").hover(); await page.waitForTimeout(600)
const opened = await h()
await page.screenshot({ path: `${OUT}-open.png`, clip })
console.log(JSON.stringify({ folded, opened, errs }))
await b.close()
