// Mid-animation snapshots of every forest reaction next to a hero.
import { chromium } from "playwright"
const OUT = process.argv[2], PORT = process.argv[3] || 5449
const b = await chromium.launch()
const page = await (await b.newContext({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 2 })).newPage()
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
await page.locator(".hw-tactics-start").click(); await page.waitForTimeout(1200)
const begin = page.locator(".hwt-begin-battle"); if (await begin.count()) await begin.click()
await page.waitForTimeout(2500); await page.mouse.move(3, 3)
const tok = await page.locator('.hwt-token[data-selectable="true"]').first().boundingBox()
for (const [kind, ms] of [["hit", 260], ["heal", 380], ["root", 330], ["frost", 420], ["fire", 330], ["poison", 500], ["spirit", 500], ["rustle", 230]]) {
  await page.evaluate(async ({ kind, id }) => {
    const R = await import("/src/components/heartwood/forestReactions.js")
    const B = await import("/src/data/heartwood/battleBiomes.js")
    R.forestReact(kind, R.feetOfUnit(id), B.biomeForBattle({}).detail.colours, "bush")
  }, { kind, id: await page.locator('.hwt-token[data-selectable="true"]').first().getAttribute("data-unit-id") })
  await page.waitForTimeout(ms)
  await page.screenshot({ path: `${OUT}-${kind}.png`, clip: { x: tok.x - 50, y: tok.y - 70, width: tok.width + 100, height: tok.height + 110 } })
  await page.waitForTimeout(1500)
}
await b.close()
