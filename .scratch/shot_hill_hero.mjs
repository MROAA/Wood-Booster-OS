// A hero standing on high ground (lift + shadow) next to the hill art.
import { chromium } from "playwright"
const OUT = process.argv[2], PORT = process.argv[3] || 5450
const b = await chromium.launch()
const page = await (await b.newContext({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1.5 })).newPage()
await page.goto(`http://localhost:${PORT}/heartwood`)
await page.evaluate(async () => {
  localStorage.clear()
  const E = await import("/src/services/heartwood/runEngine.js")
  const bench = ["the-fool", "the-magician", "the-chariot"].map((defId, i) => ({ key: i, defId, upgradeLevel: 0, upgrades: [] }))
  const rs = E.chooseFloorEncounter(E.leaveShop({ ...E.startRun("tommy", null, { forcedSeed: 424250 }), bench, deployed: [0, 1, 2, null], benchKeyCounter: 3 }), 0)
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(E.serializeRun(rs)))
  localStorage.setItem("hw-layout-tools", "0"); localStorage.setItem("heartwood-story-intro-seen", "true"); localStorage.setItem("hw-tactics-training-offered", "1")
})
await page.reload(); await page.waitForTimeout(1500)
await page.locator(".hw-tactics-start").click(); await page.waitForTimeout(1200)
const begin = page.locator(".hwt-begin-battle"); if (await begin.count()) await begin.click()
await page.waitForTimeout(2000)
// walk a hero toward the hill until it stands on a high tile (max 4 turns)
let on = false
for (let t = 0; t < 4 && !on; t++) {
  for (let k = 0; k < 4 && !on; k++) {
    const heroes = page.locator('.hwt-token[data-selectable="true"]')
    if (!(await heroes.count())) break
    await heroes.nth(k % (await heroes.count())).click(); await page.waitForTimeout(250)
    const target = await page.evaluate(() => {
      const opts = [...document.querySelectorAll(".hwt-cell[data-move-band]")]
      const high = opts.find((c) => c.dataset.terrain === "high" && !c.querySelector(".hwt-token"))
      if (high) return high.dataset.cell
      const highs = [...document.querySelectorAll('.hwt-cell[data-terrain="high"]')].map((c) => c.dataset.cell.split("-").map(Number))
      let best = null, bd = 99
      for (const c of opts) { const [r, col] = c.dataset.cell.split("-").map(Number); for (const [hr, hc] of highs) { const d = Math.max(Math.abs(hr - r), Math.abs(hc - col)); if (d < bd && !c.querySelector(".hwt-token")) { bd = d; best = c.dataset.cell } } }
      return best
    })
    if (!target) { await page.keyboard.press("Escape"); continue }
    await page.locator(`.hwt-cell[data-cell="${target}"]`).click(); await page.waitForTimeout(700)
    on = await page.evaluate(() => !!document.querySelector('.hwt-cell[data-terrain="high"] > .hwt-token'))
  }
  if (!on) { await page.locator(".hwt-end-turn").click(); await page.waitForTimeout(4500) }
}
await page.mouse.move(3, 3); await page.waitForTimeout(400)
const cell = await page.evaluate(() => document.querySelector('.hwt-cell[data-terrain="high"] > .hwt-token')?.parentElement.dataset.cell || null)
console.log(JSON.stringify({ on, cell }))
if (cell) {
  const bx = await page.locator(`.hwt-cell[data-cell="${cell}"]`).boundingBox()
  await page.screenshot({ path: `${OUT}.png`, clip: { x: bx.x - 120, y: bx.y - 100, width: bx.width + 240, height: bx.height + 200 } })
}
await b.close()
