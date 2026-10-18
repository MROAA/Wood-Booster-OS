// Battle board close-ups for the battle-graphics work.
// usage: [SEED=n] node .scratch/shot_battle_board.mjs <outPrefix> [port]
import { chromium } from "playwright"
const OUT = process.argv[2], PORT = process.argv[3] || 5173
const b = await chromium.launch()
const page = await (await b.newContext({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1.5 })).newPage()
const errs = []; page.on("pageerror", (e) => errs.push(e.message))
await page.goto(`http://localhost:${PORT}/heartwood`)
await page.evaluate(async (SEED) => {
  localStorage.clear()
  const E = await import("/src/services/heartwood/runEngine.js")
  const bench = ["the-fool", "the-magician", "the-chariot"].map((defId, i) => ({ key: i, defId, upgradeLevel: 0, upgrades: [] }))
  const rs = E.chooseFloorEncounter(E.leaveShop({ ...E.startRun("tommy", null, { forcedSeed: SEED }), bench, deployed: [0, 1, 2, null], benchKeyCounter: 3 }), 0)
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(E.serializeRun(rs)))
  localStorage.setItem("hw-layout-tools", "0"); localStorage.setItem("heartwood-story-intro-seen", "true"); localStorage.setItem("hw-tactics-training-offered", "1")
}, Number(process.env.SEED || 424243))
await page.reload(); await page.waitForTimeout(1500)
await page.locator(".hw-tactics-start").click(); await page.waitForTimeout(1200)
const begin = page.locator(".hwt-begin-battle"); if (await begin.count()) await begin.click()
await page.waitForTimeout(2600); await page.mouse.move(5, 5)
const board = await page.locator(".hwt-board").boundingBox()
await page.screenshot({ path: `${OUT}-board.png`, clip: board })
await page.locator('.hwt-token[data-selectable="true"]').first().click(); await page.waitForTimeout(500)
await page.screenshot({ path: `${OUT}-selected.png`, clip: board })
const tok = await page.locator('.hwt-token[data-selectable="true"]').first().boundingBox()
await page.screenshot({ path: `${OUT}-token.png`, clip: { x: tok.x - 60, y: tok.y - 60, width: tok.width + 120, height: tok.height + 120 } })
console.log(JSON.stringify({ errs, board }))
await b.close()
