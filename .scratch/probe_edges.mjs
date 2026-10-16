import { chromium } from "playwright"
const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
await page.goto(`http://localhost:5191/heartwood`, { waitUntil: "domcontentloaded" })
await page.evaluate(async () => {
  const { startRun, serializeRun, RUN_PATH } = await import("/src/services/heartwood/runEngine.js")
  const idx = RUN_PATH.findIndex((n) => n.type === "battle" && n.formationId)
  const ids = ["the-fool", "the-magician", "the-chariot"]
  const bench = ids.map((defId, i) => ({ key: `b${i}`, defId, upgradeLevel: 0, upgrades: [] }))
  const rs = { ...startRun("tommy", null, { forcedSeed: 424243 }), nodeIndex: idx, path: RUN_PATH.slice(0, idx + 1), phase: "formation", bench, deployed: [...bench.map((e) => e.key), null], items: [], lastSeenAct: 1 }
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(rs)))
})
await page.reload({ waitUntil: "domcontentloaded" }); await page.waitForTimeout(1200)
await page.locator(".hw-tactics-start").click(); await page.waitForTimeout(800)
await page.locator(".hwt-begin-battle").click(); await page.waitForTimeout(800)
await page.locator('.hwt-token[data-selectable="true"]').first().click(); await page.waitForTimeout(400)
const r = await page.evaluate(() => {
  const cells = [...document.querySelectorAll(".hwt-cell")]
  return cells.map((c, i) => {
    const e = c.querySelector(".hwt-band-edge")
    return { i, r: Math.floor(i / 12), c: i % 12, band: c.dataset.moveBand || "", art: c.dataset.art || "", edge: e ? e.style.borderWidth : "" }
  }).filter((x) => x.band || x.edge)
})
const grid = {}
for (const x of r) grid[`${x.r}-${x.c}`] = x
for (let row = 0; row < 12; row++) {
  let line = ""
  for (let col = 0; col < 12; col++) { const x = grid[`${row}-${col}`]; line += x ? (x.band === "blue" ? "B" : x.band === "yellow" ? "Y" : "?") + (x.edge ? "*" : " ") : ". " }
  console.log(line)
}
console.log(r.filter(x=>x.band==="yellow").slice(0,8))
await browser.close()
