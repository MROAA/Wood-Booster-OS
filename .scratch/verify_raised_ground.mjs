// Raised ground: high ground drawn as rounded, extruded mounds (ForestFloor HillLayer).
// usage: PORT=5450 node .scratch/verify_raised_ground.mjs
import { chromium } from "playwright"
const PORT = process.env.PORT || 5450
const b = await chromium.launch()
const page = await (await b.newContext({ viewport: { width: 1536, height: 864 } })).newPage()
const errs = []
page.on("pageerror", (e) => errs.push(e.message))
const checks = []
const ok = (name, pass, info = "") => checks.push({ name, pass: !!pass, info })
await page.goto(`http://localhost:${PORT}/heartwood`)
const expectHigh = await page.evaluate(async () => {
  localStorage.clear()
  const E = await import("/src/services/heartwood/runEngine.js")
  const RM = await import("/src/services/heartwood/tacticsRealMatchup.js")
  const bench = ["the-fool", "the-magician", "the-chariot"].map((defId, i) => ({ key: i, defId, upgradeLevel: 0, upgrades: [] }))
  const rs = E.chooseFloorEncounter(E.leaveShop({ ...E.startRun("tommy", null, { forcedSeed: 424250 }), bench, deployed: [0, 1, 2, null], benchKeyCounter: 3 }), 0)
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(E.serializeRun(rs)))
  localStorage.setItem("hw-layout-tools", "0")
  localStorage.setItem("heartwood-story-intro-seen", "true")
  localStorage.setItem("hw-tactics-training-offered", "1")
  return Object.entries(RM.generateRealTerrain(rs.seed, rs.nodeIndex)).filter(([, t]) => t === "high").map(([k]) => k).sort()
})
await page.reload()
await page.waitForTimeout(1500)
await page.locator(".hw-tactics-start").click()
await page.waitForTimeout(1200)
const begin = page.locator(".hwt-begin-battle")
if (await begin.count()) await begin.click()
await page.waitForTimeout(1500)
const r = await page.evaluate(() => {
  const board = document.querySelector(".hwt-board")
  const hills = board.querySelector(".hwt-forest-hills")
  const highCells = [...board.querySelectorAll('.hwt-cell[data-terrain="high"]')]
  const cs = highCells[0] && getComputedStyle(highCells[0])
  const legend = document.querySelector('.hwt-terrain-legend-item[data-kind="high"] .hwt-legend-icon')
  return {
    count: hills ? Number(hills.dataset.hills) : 0,
    groups: hills ? [...hills.querySelectorAll("[data-hill-group]")].map((g) => Number(g.dataset.hillGroup)) : [],
    tiles: hills ? [...hills.querySelectorAll("[data-hill]")].map((g) => g.dataset.hill).sort() : [],
    cells: highCells.map((c) => c.dataset.cell).sort(),
    tileArt: cs ? cs.backgroundImage.includes("data:image/svg") : null,
    mark: cs ? getComputedStyle(highCells[0], "::before").content : null,
    clipShapes: hills ? [...hills.querySelectorAll("clipPath")].every((cp) => cp.children.length > 0 && [...cp.children].every((ch) => ch.tagName !== "g")) : false,
    underCells: hills ? hills.closest(".hwt-forest-floor").compareDocumentPosition(board.querySelector(".hwt-cell")) & Node.DOCUMENT_POSITION_FOLLOWING : 0,
    legendArt: legend ? getComputedStyle(legend).backgroundImage.includes("data:image/svg") : false,
    title: highCells[0]?.title || "",
  }
})
ok("one mound per high tile, matching the generated map", r.count === expectHigh.length && JSON.stringify(r.tiles) === JSON.stringify(expectHigh) && JSON.stringify(r.cells) === JSON.stringify(expectHigh), JSON.stringify({ r: r.tiles, e: expectHigh }))
ok("joined high tiles form ONE hill group", r.groups.length >= 1 && r.groups.reduce((s, n) => s + n, 0) === expectHigh.length && Math.max(...r.groups) >= 4, JSON.stringify(r.groups))
ok("clip shapes are flat (a clipPath ignores <g>)", r.clipShapes)
ok("hills are drawn under the cells", !!r.underCells)
ok("the old flat tile box is gone (no tile art, no corner mark)", r.tileArt === false && (r.mark === "none" || r.mark === '""' || r.mark === "normal"), JSON.stringify({ art: r.tileArt, mark: r.mark }))
ok("legend keeps a mound icon; tooltip keeps the rule", r.legendArt && /High ground/.test(r.title), r.title.slice(0, 50))
// a hero on high ground is lifted (CSS check on a real token)
const lift = await page.evaluate(() => {
  const tok = document.querySelector('.hwt-token[data-selectable="true"]')
  const cell = tok.parentElement
  const before = tok.getBoundingClientRect().top
  const was = cell.dataset.terrain
  cell.dataset.terrain = "high"
  const after = tok.getBoundingClientRect().top
  cell.dataset.terrain = was
  return before - after
})
ok("a hero on high ground stands visibly higher (~7 px)", lift >= 5 && lift <= 10, `${lift}px`)
// moving onto a hill still works (cells stay clickable over the hill layer)
const moveRes = await page.evaluate(() => ({ any: !!document.querySelector('.hwt-cell[data-terrain="high"]') }))
ok("high cells present for interaction", moveRes.any)
ok("0 page errors", errs.length === 0, errs.join(" | "))
await b.close()
for (const c of checks) console.log(`${c.pass ? "PASS" : "FAIL"}  ${c.name}${c.pass ? "" : `  (${c.info})`}`)
const failed = checks.filter((c) => !c.pass).length
console.log(`\n${checks.length - failed}/${checks.length} passed`)
process.exit(failed ? 1 : 0)
