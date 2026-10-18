// Biomes per story Act (battleBiomes.js BIOME_FOR_ACT): data, generator,
// and a real fight in every Act drawn in its biome.
// usage: PORT=5452 node .scratch/verify_act_biomes.mjs
import { chromium } from "playwright"
const PORT = process.env.PORT || 5452
const b = await chromium.launch()
const errs = []
const checks = []
const ok = (name, pass, info = "") => checks.push({ name, pass: !!pass, info })
const KINDS = ["leaf", "leaves", "flower", "toadstool", "chanterelle", "pebbles", "fern", "twig", "berries", "cone", "mosstuft", "reeds", "lily", "deadtwig", "ash", "ember", "snowtuft", "icecrystal", "shard", "glowmote"]
const SPECIES = ["birch", "aspen", "spruce", "willow", "dead", "spruce-snow", "birch-frost", "birch-sun", "echo"]
const FOREST = ["moss", "leaves", "roots", "stone", "glowcap", "sporepod", "icepillar"]
const EXPECT = { 1: "autumnwood", 2: "mirefall", 3: "woundedgrove", 4: "frostroot", 5: "sunspire", 6: "echo", 7: "echo" }

const page = await (await b.newContext({ viewport: { width: 1536, height: 864 } })).newPage()
page.on("pageerror", (e) => errs.push(e.message))
await page.goto(`http://localhost:${PORT}/heartwood`)
const data = await page.evaluate(async ({ KINDS, SPECIES, FOREST, EXPECT }) => {
  const B = await import("/src/data/heartwood/battleBiomes.js")
  const T = await import("/src/services/heartwood/tacticsTerrain.js")
  const RM = await import("/src/services/heartwood/tacticsRealMatchup.js")
  const E = await import("/src/services/heartwood/runEngine.js")
  const out = { mapping: {}, shape: [], gen: {} }
  for (const [act, id] of Object.entries(EXPECT)) out.mapping[act] = B.biomeForAct(Number(act)).id === id
  for (const bio of Object.values(B.BIOMES)) {
    const p = bio.palette
    const kinds = [...Object.keys(bio.detail.weights), ...Object.values(bio.detail.near || {}).flatMap((w) => Object.keys(w))]
    out.shape.push({
      id: bio.id,
      palette: !!(p.floorA && p.floorB && p.moss?.length === 3 && p.litter?.length === 3 && p.light && p.hill?.top?.length === 2 && p.hill.cliff?.length === 2),
      kindsOk: kinds.every((k) => KINDS.includes(k)),
      badKinds: kinds.filter((k) => !KINDS.includes(k)),
      trees: (bio.trees || []).every((t) => SPECIES.includes(t)) && (bio.trees || []).length > 0,
      dressing: (bio.dressing || []).every((d) => T.TERRAIN[d.type] && d.clumps.length === 2 && d.size.length === 2),
      ambient: !!bio.ambient?.drift && bio.ambient.driftColours?.length > 0,
    })
  }
  // generator: each Act scatters its OWN biome's pieces (and only those, beyond the base layer)
  for (const act of [2, 3, 4, 5, 6]) {
    const bio = B.biomeForAct(act)
    const want = new Set(bio.dressing.map((d) => d.type))
    const idxs = E.RUN_PATH.map((n, i) => i).filter((i) => E.actIndexForNode(i, E.RUN_PATH.length) === act).slice(0, 4)
    const seen = new Set()
    let foreign = 0
    let cut = 0
    let nonDet = 0
    for (let seed = 1; seed <= 25; seed++) {
      for (const idx of idxs) {
        const base = RM.generateBaseTerrain(seed * 7919, idx)
        const t = RM.generateRealTerrain(seed * 7919, idx)
        for (const [k, type] of Object.entries(t)) {
          if (base[k] === type) continue
          if (FOREST.includes(type)) {
            if (want.has(type)) seen.add(type)
            else foreign++
          }
        }
        if (!T.sidesConnected(t, { rows: 9, cols: 12 })) cut++
        if (seed <= 3 && JSON.stringify(t) !== JSON.stringify(RM.generateRealTerrain(seed * 7919, idx))) nonDet++
      }
    }
    out.gen[act] = { want: [...want].sort(), seen: [...seen].sort(), foreign, cut, nonDet }
  }
  return out
}, { KINDS, SPECIES, FOREST, EXPECT })
ok("every Act maps to its story biome", Object.values(data.mapping).every(Boolean), JSON.stringify(data.mapping))
for (const sh of data.shape) ok(`biome ${sh.id}: palette, details with art, trees, dressing, ambient all valid`, sh.palette && sh.kindsOk && sh.trees && sh.dressing && sh.ambient, JSON.stringify(sh))
for (const [act, g] of Object.entries(data.gen)) ok(`Act ${act}: generator scatters this biome's own pieces only, crossable, deterministic`, g.foreign === 0 && g.cut === 0 && g.nonDet === 0 && g.want.every((t) => g.seen.includes(t) || t === "stone"), JSON.stringify(g))

// a real fight in each Act
for (const act of [1, 2, 3, 4, 5, 6]) {
  const p = await (await b.newContext({ viewport: { width: 1536, height: 864 } })).newPage()
  p.on("pageerror", (e) => errs.push(`act${act}: ${e.message}`))
  await p.goto(`http://localhost:${PORT}/heartwood`)
  await p.evaluate(async (act) => {
    localStorage.clear()
    const E = await import("/src/services/heartwood/runEngine.js")
    const idx = E.RUN_PATH.findIndex((n, i) => n.type === "battle" && E.actIndexForNode(i, E.RUN_PATH.length) === act)
    const bench = ["the-fool", "the-magician", "the-chariot"].map((defId, i) => ({ key: `b${i}`, defId, upgradeLevel: 0, upgrades: [] }))
    const rs = { ...E.startRun("tommy", null, { forcedSeed: 424256 + act }), nodeIndex: idx, path: E.RUN_PATH.slice(0, idx + 1), phase: "formation", bench, deployed: [bench[0].key, bench[1].key, bench[2].key, null], items: [], lastSeenAct: act }
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(E.serializeRun(rs)))
    localStorage.setItem("hw-layout-tools", "0")
    localStorage.setItem("heartwood-story-intro-seen", "true")
    localStorage.setItem("hw-tactics-training-offered", "1")
  }, act)
  await p.reload()
  await p.waitForTimeout(1500)
  await p.locator(".hw-tactics-start").click()
  await p.waitForTimeout(1500)
  const r = await p.evaluate(async (act) => {
    const B = await import("/src/data/heartwood/battleBiomes.js")
    const bio = B.biomeForAct(act)
    const board = document.querySelector(".hwt-board")
    const kinds = [...board.querySelectorAll(".hwt-forest-details [data-detail]")].map((e) => e.dataset.detail)
    const species = [...board.querySelectorAll('svg[data-art-object="tree"]')].map((e) => e.dataset.species)
    const amb = board.querySelector(".hwt-ambience")
    return {
      biome: board.dataset.biome,
      want: bio.id,
      details: kinds.length,
      kindsInBiome: kinds.every((k) => k in bio.detail.weights || Object.values(bio.detail.near || {}).some((w) => k in w)),
      species,
      speciesOk: species.every((s) => bio.trees.includes(s)),
      drift: amb?.dataset.drift,
      wantDrift: bio.ambient.drift,
      mist: !!amb?.querySelector(".hwt-ambience-mist"),
      wantMist: !!bio.ambient.mist,
      firefly: amb?.style.getPropertyValue("--hwt-firefly-rgb"),
      floorA: board.style.getPropertyValue("--hwt-floor-a"),
      wantFloor: bio.palette.floorA,
    }
  }, act)
  ok(`Act ${act} fight is drawn in ${r.want}: floor, details, trees, ambient`, r.biome === r.want && r.details >= 40 && r.kindsInBiome && r.speciesOk && r.drift === r.wantDrift && r.mist === r.wantMist && r.floorA === r.wantFloor && !!r.firefly, JSON.stringify(r))
  await p.close()
}
ok("0 page errors", errs.length === 0, errs.join(" | "))
await b.close()
for (const c of checks) console.log(`${c.pass ? "PASS" : "FAIL"}  ${c.name}${c.pass ? "" : `  (${c.info})`}`)
const failed = checks.filter((c) => !c.pass).length
console.log(`\n${checks.length - failed}/${checks.length} passed`)
process.exit(failed ? 1 : 0)
