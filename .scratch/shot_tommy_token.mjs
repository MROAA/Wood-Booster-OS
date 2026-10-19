import { chromium } from "playwright"
const PORT = process.env.PORT || 5199
const b = await chromium.launch()
const page = await (await b.newContext({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 3 })).newPage()
await page.goto(`http://localhost:${PORT}/heartwood`)
await page.evaluate(async () => {
  localStorage.clear()
  localStorage.setItem("hw-layout-tools", "0"); localStorage.setItem("heartwood-story-intro-seen", "true"); localStorage.setItem("hw-tactics-training-offered", "1")
  const E = await import("/src/services/heartwood/runEngine.js")
  const bench = ["the-fool", "the-magician", "the-chariot"].map((defId, i) => ({ key: i, defId, upgradeLevel: 0, upgrades: [] }))
  const rs = E.chooseFloorEncounter(E.leaveShop({ ...E.startRun("tommy", null, { forcedSeed: 424243 }), bench, deployed: [0, 1, 2, null], benchKeyCounter: 3 }), 0)
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(E.serializeRun(rs)))
})
await page.reload(); await page.waitForTimeout(1500)
await page.locator(".hw-tactics-start").click(); await page.waitForTimeout(1200)
if (await page.locator(".hwt-begin-battle").count()) await page.locator(".hwt-begin-battle").click()
await page.waitForTimeout(3500)
const tok = page.locator('.hwt-token[data-unit-id="player-commander"]')
const bb = await tok.boundingBox()
const clip = { x: bb.x - 30, y: bb.y - 30, width: bb.width + 60, height: bb.height + 60 }
await page.screenshot({ path: ".scratch/shots/tommy_tok_neutral.png", clip })
for (const m of ["hurt", "joy", "defeat"]) {
  await page.evaluate((m) => document.querySelector('.hwt-token[data-unit-id="player-commander"] img')?.setAttribute("data-mood", m), m)
  await page.waitForTimeout(250)
  await page.screenshot({ path: `.scratch/shots/tommy_tok_${m}.png`, clip })
}
console.log(JSON.stringify(bb), await tok.evaluate((t) => t.querySelector(".hwt-token-art").outerHTML.slice(0, 300)))
await b.close()
