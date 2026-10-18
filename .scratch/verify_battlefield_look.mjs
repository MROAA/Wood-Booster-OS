// Battlefield piece 2 - "the look" (docs/hearthwood-battlefield-plan.md).
// Biome registry, forest floor layer (details + patches + corner roots),
// ambient life (drifting leaves, butterflies, sun shafts), dusk per turn,
// readability + click-through, reduced motion, determinism.
// usage: PORT=5446 node .scratch/verify_battlefield_look.mjs
import { chromium } from "playwright"
const PORT = process.env.PORT || 5446
const b = await chromium.launch()
const page = await (await b.newContext({ viewport: { width: 1536, height: 864 } })).newPage()
const errs = []
page.on("pageerror", (e) => errs.push(e.message))
const results = []
const ok = (name, pass, info = "") => results.push({ name, pass: !!pass, info })

// 1. Pure layer: registry + layout rules, recomputed independently.
await page.goto(`http://localhost:${PORT}/heartwood`)
const pure = await page.evaluate(async () => {
  const B = await import("/src/data/heartwood/battleBiomes.js")
  const L = await import("/src/components/heartwood/forestFloorLayout.js")
  const biome = B.biomeForAct(1)
  const grid = { rows: 9, cols: 12 }
  const terrain = { "2-4": "tree", "4-6": "water", "5-5": "bush", "0-0": "rock" }
  const a = L.floorDetailLayout(biome, grid, terrain, 12345)
  const again = L.floorDetailLayout(biome, grid, terrain, 12345)
  const other = L.floorDetailLayout(biome, grid, terrain, 999)
  const KNOWN = ["leaf", "leaves", "flower", "toadstool", "chanterelle", "pebbles", "fern", "twig", "berries", "cone", "mosstuft"]
  const tileOf = (d) => ({ col: Math.floor((d.x - L.PAD) / L.STEP), row: Math.floor((d.y - L.PAD) / L.STEP) })
  const details = a.filter((d) => d.kind !== "patch")
  const onTerrain = details.filter((d) => {
    const t = tileOf(d)
    return terrain[`${t.row}-${t.col}`]
  })
  // centre 30% of a tile must stay free for the unit
  const inCentre = details.filter((d) => {
    const fx = (d.x - L.PAD - tileOf(d).col * L.STEP) / L.CELL
    const fy = (d.y - L.PAD - tileOf(d).row * L.STEP) / L.CELL
    return fx > 0.35 && fx < 0.65 && fy > 0.35 && fy < 0.65
  })
  // nature gathers around things: tiles next to the tree vs far open tiles
  const near = (r, c) => details.filter((d) => tileOf(d).row === r && tileOf(d).col === c).length
  const nearTree = [near(1, 3), near(1, 4), near(1, 5), near(2, 3), near(2, 5), near(3, 3), near(3, 4), near(3, 5)].reduce((s, n) => s + n, 0) / 8
  const allKindsKnown =
    Object.keys(biome.detail.weights).every((k) => KNOWN.includes(k)) &&
    Object.values(biome.detail.near).every((w) => Object.keys(w).every((k) => KNOWN.includes(k)))
  const style = L.biomeBoardStyle(biome)
  return {
    biomeId: biome.id,
    battleDefault: B.biomeForBattle({}).id,
    battleExplicit: B.biomeForBattle({ biome: "autumnwood" }).id,
    unknownFallsBack: B.biomeForBattle({ biome: "nope" }).id,
    count: details.length,
    patches: a.filter((d) => d.kind === "patch").length,
    deterministic: JSON.stringify(a) === JSON.stringify(again),
    saltVaries: JSON.stringify(a) !== JSON.stringify(other),
    onTerrain: onTerrain.length,
    inCentre: inCentre.length,
    kindsUsed: [...new Set(details.map((d) => d.kind))].filter((k) => !KNOWN.includes(k)),
    allKindsKnown,
    nearTree,
    styleKeys: Object.keys(style),
    mossUrl: style["--hwt-moss-blots"].startsWith('url("data:image/svg+xml,'),
  }
})
ok("registry: Act 1 + default + explicit + unknown id all resolve to Autumnwood", pure.biomeId === "autumnwood" && pure.battleDefault === "autumnwood" && pure.battleExplicit === "autumnwood" && pure.unknownFallsBack === "autumnwood")
ok("layout is deterministic for the same salt and varies with the salt", pure.deterministic && pure.saltVaries)
ok("no floor detail ever sits on a terrain tile", pure.onTerrain === 0, `onTerrain=${pure.onTerrain}`)
ok("the middle of every tile stays free for the unit", pure.inCentre === 0, `inCentre=${pure.inCentre}`)
ok("every detail kind in the biome has art", pure.allKindsKnown && pure.kindsUsed.length === 0, JSON.stringify(pure.kindsUsed))
ok("the floor is rich (>=60 details, >=15 patches on a 12x9 board)", pure.count >= 60 && pure.patches >= 15, `details=${pure.count} patches=${pure.patches}`)
ok("nature gathers around a tree (busier next to it)", pure.nearTree >= 1.5, `avg per tile next to tree=${pure.nearTree.toFixed(2)}`)
ok("biome palette becomes board CSS properties (valid svg urls)", pure.mossUrl && ["--hwt-floor-a", "--hwt-litter-blots", "--hwt-biome-light"].every((k) => pure.styleKeys.includes(k)))

// 2. The real battle.
await page.evaluate(async () => {
  localStorage.clear()
  const E = await import("/src/services/heartwood/runEngine.js")
  const bench = ["the-fool", "the-magician", "the-chariot"].map((defId, i) => ({ key: i, defId, upgradeLevel: 0, upgrades: [] }))
  const rs = E.chooseFloorEncounter(E.leaveShop({ ...E.startRun("tommy", null, { forcedSeed: 424243 }), bench, deployed: [0, 1, 2, null], benchKeyCounter: 3 }), 0)
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(E.serializeRun(rs)))
  localStorage.setItem("hw-layout-tools", "0")
  localStorage.setItem("heartwood-story-intro-seen", "true")
  localStorage.setItem("hw-tactics-training-offered", "1")
})
await page.reload()
await page.waitForTimeout(1500)
await page.locator(".hw-tactics-start").click()
await page.waitForTimeout(1200)
const begin = page.locator(".hwt-begin-battle")
if (await begin.count()) await begin.click()
await page.waitForTimeout(1500)

const snap = () =>
  page.evaluate(() => {
    const board = document.querySelector(".hwt-board")
    const floor = board.querySelector(".hwt-forest-floor")
    const firstCell = board.querySelector(".hwt-cell")
    const details = [...board.querySelectorAll(".hwt-forest-details [data-detail]")]
    const terrainCells = [...board.querySelectorAll(".hwt-cell[data-terrain]")].filter((c) => c.dataset.terrain && c.dataset.terrain !== "path")
    // any detail whose centre falls inside a terrain cell's box?
    const boxes = terrainCells.map((c) => c.getBoundingClientRect())
    const detailOnTerrain = details.filter((d) => {
      const r = d.getBoundingClientRect()
      const cx = r.x + r.width / 2
      const cy = r.y + r.height / 2
      return boxes.some((bx) => cx > bx.x + 6 && cx < bx.right - 6 && cy > bx.y + 6 && cy < bx.bottom - 6)
    }).length
    return {
      biome: board.dataset.biome,
      phase: board.dataset.phase,
      floorFirst: !!floor && floor.compareDocumentPosition(firstCell) & Node.DOCUMENT_POSITION_FOLLOWING ? true : false,
      floorPointer: floor && getComputedStyle(floor).pointerEvents,
      floorBox: floor && floor.getBoundingClientRect().width / board.getBoundingClientRect().width,
      nodes: floor ? floor.querySelectorAll("*").length : 0,
      details: details.length,
      roots: board.querySelectorAll(".hwt-forest-roots > g").length,
      detailKeys: details.map((d) => d.getAttribute("transform")),
      detailOnTerrain,
      dusk: board.querySelector(".hwt-ambience")?.style.getPropertyValue("--hwt-dusk"),
      leaves: board.querySelectorAll(".hwt-drift-leaf").length,
      butterflies: board.querySelectorAll(".hwt-butterfly").length,
      shafts: board.querySelectorAll(".hwt-sun-shafts span").length,
      bg: getComputedStyle(board).backgroundImage.includes("data:image/svg+xml"),
    }
  })
const s1 = await snap()
ok("real battle: board drawn in Autumnwood, phase exposed", s1.biome === "autumnwood" && s1.phase === "player", `${s1.biome}/${s1.phase}`)
ok("forest floor is drawn BEFORE the cells (units paint on top) and covers the board", s1.floorFirst && Math.abs(s1.floorBox - 1) < 0.01, `first=${s1.floorFirst} w=${s1.floorBox}`)
ok("forest floor never catches clicks", s1.floorPointer === "none")
ok("four corner root groups + a rich floor", s1.roots === 4 && s1.details >= 50, `roots=${s1.roots} details=${s1.details}`)
ok("no detail centre lands on a terrain tile in the real battle", s1.detailOnTerrain === 0, `n=${s1.detailOnTerrain}`)
ok("light layer: <=2500 static svg nodes (performance budget)", s1.nodes > 0 && s1.nodes <= 2500, `nodes=${s1.nodes}`)
ok("ambient life from the biome: 6 drifting leaves, 2 butterflies, 3 sun shafts", s1.leaves === 6 && s1.butterflies === 2 && s1.shafts === 3, `${s1.leaves}/${s1.butterflies}/${s1.shafts}`)
ok("dusk starts at 0 on turn 1", s1.dusk === "0.00", s1.dusk)
ok("floor texture layers render", s1.bg)

// Clicking through the floor still selects a hero; the floor stays put.
await page.evaluate(() => { document.querySelector(".hwt-forest-details [data-detail]").__probe = 1 })
const tok = page.locator('.hwt-token[data-selectable="true"]').first()
await tok.click()
await page.waitForTimeout(400)
const selected = await page.locator('.hwt-token[data-selected="true"]').count()
const s2 = await snap()
ok("selecting a hero works through the floor layer", selected === 1)
const kept = await page.evaluate(() => document.querySelector(".hwt-forest-details [data-detail]").__probe === 1)
ok("the floor is not re-drawn when a hero is selected (same DOM nodes)", kept)
ok("floor details do not move when the board re-renders", JSON.stringify(s2.detailKeys) === JSON.stringify(s1.detailKeys))

// End turn -> turn 2: dusk deepens.
await page.keyboard.press("Escape")
await page.locator(".hwt-end-turn").click()
await page.waitForFunction(() => document.querySelector(".hwt-board")?.dataset.phase === "player" && document.querySelector(".hwt-ambience")?.style.getPropertyValue("--hwt-dusk") !== "0.00", null, { timeout: 20000 }).catch(() => {})
const s3 = await snap()
ok("dusk deepens on turn 2 (0.10)", s3.dusk === "0.10", s3.dusk)

// Reduced motion: drifting leaves + butterflies hidden, shafts still.
await page.evaluate(() => document.documentElement.classList.add("hw-reduce-motion"))
const rm = await page.evaluate(() => ({
  leaf: getComputedStyle(document.querySelector(".hwt-drift-leaf")).display,
  fly: getComputedStyle(document.querySelector(".hwt-butterfly")).display,
  shaft: getComputedStyle(document.querySelector(".hwt-sun-shafts span")).animationName,
}))
ok("reduced motion stills the forest", rm.leaf === "none" && rm.fly === "none" && rm.shaft === "none", JSON.stringify(rm))

ok("0 page errors", errs.length === 0, errs.join(" | "))
await b.close()
for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.info ? `  (${r.info})` : ""}`)
const failed = results.filter((r) => !r.pass).length
console.log(`\n${results.length - failed}/${results.length} passed`)
process.exit(failed ? 1 : 0)
