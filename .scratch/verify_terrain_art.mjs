import { chromium } from "playwright"

// Terrain & object art (TerrainArt.jsx): every terrain/object type renders its
// SVG art, overlays (tint/ring) still paint above it, legend mini icons,
// Blight ooze overlay, reduced-motion swaps to still art, no page errors.
const PORT = process.env.PORT || 5445
const browser = await chromium.launch()
const errs = []
const out = { errors: [] }
const newPage = async (opts = {}) => {
  const p = await browser.newContext({ viewport: { width: 1600, height: 1000 }, ...opts }).then((c) => c.newPage())
  p.on("pageerror", (e) => errs.push(String(e)))
  return p
}
const TYPES = ["water", "bridge", "lava", "poison", "high", "ice", "rock", "forest", "bush", "wall", "rubble", "log", "stump", "ash", "fire", "tree", "barrel", "sporepod", "boulder", "icepillar"]
const OBJ = ["tree", "barrel", "sporepod", "boulder", "icepillar"]

// Real run fight with a gallery of every type (2 tiles each, cols 3-8).
async function galleryPage(opts) {
  const p = await newPage(opts)
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
  await p.evaluate((types) => {
    const save = JSON.parse(localStorage.getItem("heartwood-run-save-v1"))
    const b = save.run.battle
    const terrain = {}
    let i = 0
    for (let row = 0; row < 9; row++)
      for (let c = 3; c <= 8; c += 2) {
        const t = types[i++]
        if (t) {
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
    // Player next to the water tile (0-3) so a move band lands on art.
    const pl = b.units.find((u) => u.side === "player")
    pl.pos = { row: 1, col: 2 }
    b.objFire = { "5-3": 2 }
    b.blight = { "8-6": true, "8-7": true }
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(save))
  }, TYPES)
  await p.reload({ waitUntil: "domcontentloaded" })
  await p.waitForSelector(".hwt-board", { timeout: 20000 })
  await p.waitForTimeout(500)
  return p
}

// 1. Every type renders its art; objects render their sprite.
const p = await galleryPage()
const art = await p.evaluate((types) => {
  const res = {}
  for (const t of types) {
    const cells = [...document.querySelectorAll(`.hwt-cell[data-terrain="${t}"]`)]
    const c = cells[0]
    res[t] = {
      n: cells.length,
      art: c?.getAttribute("data-art"),
      svgBg: !!c && getComputedStyle(c).backgroundImage.includes("data:image/svg+xml"),
      animated: !!c && getComputedStyle(c).backgroundImage.includes("animate"),
      sprite: !!c?.querySelector(`.hwt-object svg[data-art-object="${t}"]`),
      emoji: c?.querySelector(".hwt-object")?.textContent || "",
    }
  }
  return res
}, TYPES)
for (const t of TYPES) {
  const a = art[t]
  if (!(a.n === 2 && a.art === t && a.svgBg)) out.errors.push(`c1 terrain art missing: ${t} ${JSON.stringify(a)}`)
  if (OBJ.includes(t) && !(a.sprite && a.emoji === "")) out.errors.push(`c1 object sprite missing: ${t}`)
}
if (!(art.water.animated && art.lava.animated && art.fire.animated)) out.errors.push("c1b animated art on water/lava/fire")
const burningFlames = await p.locator('.hwt-cell[data-cell="5-3"] .hwt-art-flames').count()
if (burningFlames !== 1) out.errors.push("c1c burning tree shows flames")
// Plain path tiles carry no art.
const pathArt = await p.locator('.hwt-cell[data-terrain="path"][data-art]').count()
if (pathArt !== 0) out.errors.push("c1d path tiles stay plain")

// 2. Overlays paint above the art: move band on an art tile keeps tint layer first + ring.
await p.locator('.hwt-token[data-side="player"]').first().click()
await p.waitForTimeout(250)
const overlay = await p.evaluate(() => {
  const c = document.querySelector(".hwt-cell[data-art][data-move-band]")
  if (!c) return null
  const cs = getComputedStyle(c)
  const bg = cs.backgroundImage
  return { terrain: c.dataset.terrain, band: c.dataset.moveBand, tintFirst: bg.indexOf("linear-gradient") < bg.indexOf("data:image/svg"), ring: cs.boxShadow.includes("inset"), bg: bg.slice(0, 80) }
})
if (!(overlay && overlay.tintFirst && overlay.ring)) out.errors.push(`c2 overlay above art ${JSON.stringify(overlay)}`)
const tokenOnTop = await p.evaluate(() => {
  const t = document.querySelector('.hwt-token[data-side="player"]')
  const r = t.getBoundingClientRect()
  const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)
  return !!hit && t.contains(hit)
})
if (!tokenOnTop) out.errors.push("c2b token clickable/on top")

// 3. Legend: one mini icon per item, matching its kind.
const legend = await p.evaluate(() =>
  [...document.querySelectorAll(".hwt-terrain-legend-item")].map((el) => ({ kind: el.dataset.kind, icon: el.querySelector(".hwt-legend-icon")?.dataset.artIcon, text: el.textContent })),
)
if (!(legend.length >= TYPES.length && legend.every((l) => l.icon === l.kind))) out.errors.push(`c3 legend icons ${JSON.stringify(legend)}`)
if (!legend.some((l) => l.text === "Tree")) out.errors.push("c3b legend text unchanged")

// 4. Blight ooze overlay is the SVG art.
const blight = await p.evaluate(() => getComputedStyle(document.querySelector('.hwt-cell[data-blight="true"]'), "::after").backgroundImage.includes("data:image/svg"))
if (!blight) out.errors.push("c4 blight art")
await p.screenshot({ path: new URL("./terrain-art/verify-gallery.png", import.meta.url).pathname })
await p.context().close()

// 5. Reduced motion: still art (no <animate>).
const rp = await galleryPage({ reducedMotion: "reduce" })
const still = await rp.evaluate(() => {
  const c = document.querySelector('.hwt-cell[data-terrain="water"]')
  const bg = getComputedStyle(c).backgroundImage
  return { svg: bg.includes("data:image/svg"), animated: bg.includes("animate") }
})
if (!(still.svg && !still.animated)) out.errors.push(`c5 reduced motion still art ${JSON.stringify(still)}`)
await rp.context().close()

// 6. Prototype showcase + a boss arena.
const sp = await newPage()
await sp.goto(`http://localhost:${PORT}/heartwood-tactics?objects=1`, { waitUntil: "domcontentloaded" })
await sp.waitForSelector(".hwt-board", { timeout: 20000 })
await sp.waitForTimeout(400)
const show = await sp.evaluate(() => ({
  objects: document.querySelectorAll(".hwt-object").length,
  sprites: document.querySelectorAll(".hwt-object svg[data-art-object]").length,
}))
if (!(show.objects === 12 && show.sprites === 12)) out.errors.push(`c6 showcase sprites ${JSON.stringify(show)}`)
await sp.goto(`http://localhost:${PORT}/heartwood-tactics?boss=wyrmgall`, { waitUntil: "domcontentloaded" })
await sp.waitForSelector(".hwt-board", { timeout: 20000 })
await sp.waitForTimeout(400)
const boss = await sp.evaluate(() => ({
  water: document.querySelectorAll('.hwt-cell[data-art="water"]').length,
  bridge: document.querySelectorAll('.hwt-cell[data-art="bridge"]').length,
}))
if (!(boss.water > 0 && boss.bridge > 0)) out.errors.push(`c6b boss arena art ${JSON.stringify(boss)}`)

out.art = art
out.overlay = overlay
out.show = show
out.boss = boss
await browser.close()
out.pageErrors = errs
if (errs.length) out.errors.push(`page errors: ${errs.length}`)
console.log(JSON.stringify({ errors: out.errors, overlay, show, boss, pageErrors: errs }, null, 1))
console.log(out.errors.length ? "FAIL" : "PASS")
process.exit(out.errors.length ? 1 : 0)
