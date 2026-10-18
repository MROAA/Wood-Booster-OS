// Forest reactions on an open middle tile (no card in the way), mid-animation.
import { chromium } from "playwright"
const OUT = process.argv[2], PORT = process.argv[3] || 5449
const b = await chromium.launch()
const page = await (await b.newContext({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 2 })).newPage()
await page.goto(`http://localhost:${PORT}/heartwood-tactics`)
await page.waitForSelector(".hwt-board"); await page.waitForTimeout(1500); await page.mouse.move(3, 3)
const cell = page.locator('.hwt-cell[data-cell="6-6"]')
const bx = await cell.boundingBox()
for (const [kind, ms] of [["hit", 200], ["heal", 380], ["root", 420], ["frost", 420], ["fire", 330], ["poison", 500], ["spirit", 450], ["rustle", 220]]) {
  await page.evaluate(async (kind) => {
    const R = await import("/src/components/heartwood/forestReactions.js")
    const B = await import("/src/data/heartwood/battleBiomes.js")
    R.forestReact(kind, R.feetOfTile({ row: 6, col: 6 }), B.biomeForBattle({}).detail.colours, "bush")
  }, kind)
  await page.waitForTimeout(ms)
  await page.screenshot({ path: `${OUT}-${kind}.png`, clip: { x: bx.x - 60, y: bx.y - 60, width: bx.width + 120, height: bx.height + 100 } })
  await page.waitForTimeout(1500)
}
await b.close()
