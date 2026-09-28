import { chromium } from "playwright"
import { mkdirSync } from "node:fs"
// Screenshot helper for the terrain-art round: prototype showcase, boss arenas, and a
// real-run "gallery" battle with every terrain/object type. Usage: node shots_terrain_art.mjs <tag>
const PORT = process.env.PORT || 5445
const TAG = process.argv[2] || "shot"
const DIR = new URL("./terrain-art/", import.meta.url).pathname
mkdirSync(DIR, { recursive: true })
const browser = await chromium.launch()
const errs = []
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } })
const p = await ctx.newPage()
p.on("pageerror", (e) => errs.push(String(e)))
const board = async (name) => {
  await p.waitForTimeout(600)
  await p.locator(".hwt-board").screenshot({ path: `${DIR}${TAG}-${name}.png` })
}

await p.goto(`http://localhost:${PORT}/heartwood-tactics?objects=1`, { waitUntil: "domcontentloaded" })
await p.waitForSelector(".hwt-board", { timeout: 20000 })
await board("objects")
for (const b of (process.env.BOSSES || "deepwarden,thornmaw,wyrmgall").split(",")) {
  await p.goto(`http://localhost:${PORT}/heartwood-tactics?boss=${b}`, { waitUntil: "domcontentloaded" })
  await p.waitForSelector(".hwt-board", { timeout: 20000 })
  await board(`boss-${b}`)
}
// Gallery via a real run save.
await p.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
await p.evaluate(async () => {
  const { startRun, serializeRun, RUN_PATH, actIndexForNode } = await import("/src/services/heartwood/runEngine.js")
  const idx = RUN_PATH.findIndex((n) => n.type === "battle" && n.formationId)
  const rs = {
    ...startRun("tommy", null, { forcedSeed: 777 }),
    nodeIndex: idx,
    path: RUN_PATH.slice(0, idx + 1),
    phase: "formation",
    bench: [{ key: "b0", defId: "the-fool", upgradeLevel: 0, upgrades: [] }],
    deployed: ["b0", null, null, null],
    items: [],
    lastSeenAct: actIndexForNode(idx, RUN_PATH.length),
  }
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(rs)))
})
await p.reload({ waitUntil: "domcontentloaded" })
await p.waitForTimeout(600)
await p.locator(".hw-tactics-start").click()
await p.waitForTimeout(500)
await p.locator(".hwt-begin-battle").click()
await p.waitForTimeout(300)
await p.evaluate(() => {
  const save = JSON.parse(localStorage.getItem("heartwood-run-save-v1"))
  const b = save.run.battle
  const types = ["water", "bridge", "lava", "poison", "high", "ice", "rock", "forest", "bush", "wall", "rubble", "log", "stump", "ash", "fire", "tree", "barrel", "sporepod", "boulder", "icepillar", "tree", "icepillar", "path"]
  const terrain = {}
  let i = 0
  for (let row = 0; row < 9; row++)
    for (let c = 3; c <= 8; c += 2) {
      const t = types[i++ % types.length]
      if (t !== "path") {
        terrain[`${row}-${c}`] = t
        terrain[`${row}-${c + 1}`] = t
      }
    }
  b.terrain = terrain
  let r = 0
  for (const u of b.units) {
    u.pos = { row: r % 9, col: u.side === "player" ? 1 : 10 + (r >= 9 ? 1 : 0) }
    r++
  }
  // one player standing on high ground / water-ish tiles to judge token readability
  const pl = b.units.find((u) => u.side === "player")
  if (pl) pl.pos = { row: 1, col: 4 }
  b.objFire = { "5-3": 2 }
  b.objChill = { "7-5": 1 }
  b.tileTimers = { "4-7": { turns: 2, revert: "ash" } }
  b.blight = { "7-7": true, "7-8": true, "8-3": true, "8-4": true }
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(save))
})
await p.reload({ waitUntil: "domcontentloaded" })
await p.waitForSelector(".hwt-board", { timeout: 20000 })
await board("gallery")
await p.locator('.hwt-token[data-side="player"]').first().click().catch(() => {})
await board("gallery-selected")
await p.locator(".hwt-terrain-legend").screenshot({ path: `${DIR}${TAG}-legend.png` }).catch(() => {})
await p.screenshot({ path: `${DIR}${TAG}-full.png` })
console.log(JSON.stringify({ errs }))
await browser.close()
