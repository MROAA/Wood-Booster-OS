// Unit panel under the battlefield: deployment (no selection), a selected
// hero on the player's turn, and an inspected enemy.
import { chromium } from "playwright"
const OUT = process.argv[2], PORT = process.argv[3] || 5451
const b = await chromium.launch()
const page = await (await b.newContext({ viewport: { width: 1536, height: 864 } })).newPage()
const errs = []; page.on("pageerror", (e) => errs.push(e.message))
await page.goto(`http://localhost:${PORT}/heartwood`)
await page.evaluate(async () => {
  localStorage.clear()
  const E = await import("/src/services/heartwood/runEngine.js")
  const bench = ["the-fool", "the-magician", "the-chariot"].map((defId, i) => ({ key: i, defId, upgradeLevel: 0, upgrades: [] }))
  const rs = E.chooseFloorEncounter(E.leaveShop({ ...E.startRun("tommy", null, { forcedSeed: 424256 }), bench, deployed: [0, 1, 2, null], benchKeyCounter: 3 }), 0)
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(E.serializeRun(rs)))
  localStorage.setItem("hw-layout-tools", "0"); localStorage.setItem("heartwood-story-intro-seen", "true"); localStorage.setItem("hw-tactics-training-offered", "1")
})
await page.reload(); await page.waitForTimeout(1500)
await page.locator(".hw-tactics-start").click(); await page.waitForTimeout(1500)
await page.mouse.move(3, 3)
const shotPanel = async (name) => {
  const p = page.locator(".hwt-unit-panel")
  await p.scrollIntoViewIfNeeded()
  await page.waitForTimeout(300)
  await p.screenshot({ path: `${OUT}-${name}.png` })
}
await shotPanel("deploy")
const begin = page.locator(".hwt-begin-battle"); if (await begin.count()) await begin.click()
await page.waitForTimeout(2200)
await page.locator('.hwt-token[data-selectable="true"]').first().click(); await page.waitForTimeout(500)
await page.mouse.move(3, 3)
await shotPanel("selected")
await page.screenshot({ path: `${OUT}-full.png`, fullPage: true })
await page.keyboard.press("Escape"); await page.waitForTimeout(200)
// click an enemy token (not in range) to inspect it
await page.locator('.hwt-board').click({ position: { x: 5, y: 5 } }).catch(() => {})
await page.locator('.hwt-token[data-side="enemy"]').first().click(); await page.waitForTimeout(400)
await page.mouse.move(3, 3)
await shotPanel("enemy")
console.log(JSON.stringify({ errs }))
await b.close()
