// Battlefield piece 6 - skills that shape the forest (tacticsForest FOREST_SHAPING).
// usage: PORT=5453 node .scratch/verify_forest_shaping.mjs
import { chromium } from "playwright"
const PORT = process.env.PORT || 5453
const b = await chromium.launch()
const page = await (await b.newContext({ viewport: { width: 1536, height: 864 } })).newPage()
const errs = []
page.on("pageerror", (e) => errs.push(String(e)))
const checks = []
const ok = (name, pass, info = "") => checks.push({ name, pass: !!pass, info })
await page.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
await page.waitForSelector(".hwt-board", { timeout: 20000 })
const r = await page.evaluate(async () => {
  const E = await import("/src/services/heartwood/tacticsEngine.js")
  const F = await import("/src/services/heartwood/tacticsForest.js")
  const T = await import("/src/services/heartwood/tacticsTerrain.js")
  const C = await import("/src/data/heartwood/classes.js")
  const U = await import("/src/services/heartwood/tacticsUltimates.js")
  const base = E.createTacticsBattle()
  const clean = {
    block: 0, ward: 0, revive: 0, bulwark: 0, taunt: 0, poison: 0, weak: 0, vulnerable: 0, slow: 0, root: 0,
    suppressed: 0, stun: 0, execute: 0, shatter: 0, woundedFury: 0, leech: false, poisonOnHit: 0, nimble: false,
    phases: [], phaseIndex: 0, triggers: [], aoeMove: null, charge: null, covenAura: null, cultRitual: null,
    cultFodder: false, broodSplit: null, className: null, classPassive: null, classSkills: [], ap: 2, apMax: 2, regen: 0, strength: 0, enemySkills: [],
    haste: false, spiritbound: false, guardian: false, wary: false, burn: 0, chill: 0, frozen: 0, entangle: 0, ability: null,
  }
  const pTpl = base.units.find((u) => u.side === "player")
  const eTpl = base.units.find((u) => u.side === "enemy")
  const mk = (tpl, id, side, row, col, extra = {}) => ({ ...tpl, ...clean, id, side, name: id, pos: { row, col }, hp: 30, maxHp: 30, attack: 8, baseAttack: 8, range: 1, move: 2, facing: side === "player" ? "W" : "E", ...extra })
  const P = (id, row, col, extra) => mk(pTpl, id, "player", row, col, extra)
  const En = (id, row, col, extra) => mk(eTpl, id, "enemy", row, col, extra)
  const st = (units, terrain = {}) => ({ ...base, units, terrain, wallHp: {}, objHp: {}, objFire: {}, objChill: {}, tileTimers: {}, phase: "player", turn: 1, log: [], events: [], eventSeq: 0, relicIds: [] })
  const idle = () => En("idle", 8, 0, { move: 0, hp: 99, maxHp: 99, attack: 0 })
  const skillOf = (cls, id) => ({ ...C.CLASSES[cls].skills.find((x) => x.id === id), classId: cls })
  const hero = (id, row, col, cls, skillId, extra = {}) => P(id, row, col, { classId: cls, classSkills: [skillOf(cls, skillId)], classCds: {}, ...extra })
  const count = (s, type) => Object.values(s.terrain).filter((t) => t === type).length
  const keysOf = (s, type) => Object.entries(s.terrain).filter(([, t]) => t === type).map(([k]) => k).sort()
  const res = {}
  const findCls = (skillId) => Object.entries(C.CLASSES).find(([, c]) => c.skills.some((x) => x.id === skillId))?.[0]

  // 1. Thorn Boundary: roots on 4 open tiles around the Warden, water untouched
  {
    const s = st([hero("w", 4, 6, "warden", "thorn-boundary"), En("e", 2, 6, { move: 0, attack: 0 }), idle()], { "3-5": "water", "4-5": "stone" })
    const c = E.castAbility(s, "w", null, "thorn-boundary")
    res.thorn = { roots: count(c, "roots"), keys: keysOf(c, "roots"), water: c.terrain["3-5"], stone: c.terrain["4-5"], self: c.terrain["4-6"] || "path", ev: c.events.some((e) => e.fx === "grow" && e.grow === "roots") }
  }
  // 2. Growing Wall: wall + roots next to it
  {
    const cls = findCls("growing-wall")
    const s = st([hero("g", 4, 9, cls, "growing-wall", { mana: 100, manaMax: 100 }), idle()], {})
    const c = E.castAbility(s, "g", "4-7", "growing-wall")
    res.wall = { cls, wall: c.terrain["4-7"], roots: count(c, "roots"), adjacent: keysOf(c, "roots").every((k) => { const [r, col] = k.split("-").map(Number); return Math.max(Math.abs(r - 4), Math.abs(col - 7)) === 1 }) }
  }
  // 3. Group Renewal: moss under the healer and adjacent allies only
  {
    const cls = findCls("group-renewal")
    const s = st([hero("h", 4, 6, cls, "group-renewal", { mana: 100, manaMax: 100 }), P("a1", 4, 7, { hp: 20 }), P("a2", 3, 6, { hp: 20 }), P("far", 0, 0), idle()], {})
    const c = E.castAbility(s, "h", null, "group-renewal")
    res.renew = { cls, moss: keysOf(c, "moss"), far: c.terrain["0-0"] || "path" }
  }
  // 4. Lingering Bloom: moss under the target ally
  {
    const cls = findCls("lingering-bloom")
    const s = st([hero("h", 4, 6, cls, "lingering-bloom", { mana: 100, manaMax: 100 }), P("a1", 4, 8, { hp: 20 }), idle()], {})
    const c = E.castAbility(s, "h", "a1", "lingering-bloom")
    res.bloom = { cls, under: c.terrain["4-8"] }
  }
  // 5. Overgrow: grass + one glowcap on empty ground, never on a unit, sides stay joined
  {
    const cls = findCls("overgrow")
    const s = st([hero("o", 4, 8, cls, "overgrow", { mana: 100, manaMax: 100 }), En("e", 4, 5, { move: 0, attack: 0 }), idle()], {})
    const c = E.castAbility(s, "o", "4-6", "overgrow")
    const caps = keysOf(c, "glowcap")
    res.overgrow = { cls, caps, bush: count(c, "bush"), onUnit: caps.some((k) => c.units.some((u) => u.hp > 0 && `${u.pos.row}-${u.pos.col}` === k)), joined: T.sidesConnected(c.terrain, c.grid) }
  }
  // 6. Whirlwind: dry leaves around the hero
  {
    const cls = findCls("heavy-swing")
    const s = st([hero("x", 4, 6, cls, "heavy-swing", { mana: 100, manaMax: 100, rage: 100 }), En("e", 4, 5, { move: 0, attack: 0 }), idle()], {})
    const c = E.castAbility(s, "x", "e", "heavy-swing")
    res.whirl = { cls, changed: c !== s, leaves: count(c, "leaves") }
  }
  // 7. Ultimates
  {
    const w = P("w", 4, 6, { classId: "warden", mana: 100, manaMax: 100, ap: 2 })
    const s = st([w, En("e", 2, 6, { move: 0, attack: 0 }), idle()], {})
    const c = U.castHeroUltimate(s, "w")
    res.grove = { info: U.heroUltInfo(w)?.id, roots: count(c, "roots") }
    const h = P("h", 4, 6, { classId: "healer", mana: 100, manaMax: 100, ap: 2, hp: 10 })
    const s2 = st([h, P("a1", 5, 7, { hp: 10 }), P("far", 0, 11), idle()], {})
    const c2 = U.castHeroUltimate(s2, "h")
    res.well = { info: U.heroUltInfo(h)?.id, moss: keysOf(c2, "moss") }
  }
  // 9. Topple: a Juggernaut pushes a runestone over away from itself; a
  //    Guardian only chips it; into water = a stepping-stone crossing
  {
    const j = P("j", 4, 5, { classId: "juggernaut", ap: 2 })
    const c = E.attackWall(st([j, En("e", 4, 7, { move: 0, attack: 0 }), idle()], { "4-6": "stone" }), "j", { row: 4, col: 6 })
    const g = E.attackWall(st([P("g", 4, 5, { classId: "guardian", ap: 2 }), En("e", 4, 7, { move: 0, attack: 0 }), idle()], { "4-6": "stone" }), "g", { row: 4, col: 6 })
    const w = E.attackWall(st([P("j", 4, 5, { classId: "bruiser", ap: 2 }), idle()], { "4-6": "stone", "4-7": "water" }), "j", { row: 4, col: 6 })
    const blocked = E.attackWall(st([P("j", 4, 5, { classId: "juggernaut", ap: 2 }), idle()], { "4-6": "stone", "4-7": "tree" }), "j", { row: 4, col: 6 })
    res.topple = {
      from: c.terrain["4-6"], land: c.terrain["4-7"], eHp: c.units.find((u) => u.id === "e").hp, ev: c.events.some((e) => e.fx === "topple"),
      guard: g.terrain["4-6"], guardE: g.units.find((u) => u.id === "e").hp,
      water: w.terrain["4-7"], blocked: blocked.terrain["4-6"], tree: blocked.terrain["4-7"],
    }
  }
  // 10. Ground Breaker quakes the ground, but a barricade it crumbles stays rubble (one blow = one step)
  {
    const s = st([hero("j", 4, 6, "juggernaut", "ground-breaker", { mana: 100, manaMax: 100, rage: 100 }), idle()], { "4-7": "wall", "3-6": "leaves", "5-5": "rock" })
    const c = E.castAbility(s, "j", null, "ground-breaker")
    res.quake = { wall: c.terrain["4-7"], leaves: c.terrain["3-6"] || "path", rock: c.terrain["5-5"] }
  }
  // 11. Mana crystal: a hit breaks it (4 HP), gravel left, every hero within 1 gains resource
  {
    const s = st([P("a", 4, 5, { classId: "guardian", ap: 2, attack: 8, mana: 0, manaMax: 100 }), P("b", 3, 7, { classId: "healer", mana: 0, manaMax: 100 }), P("far", 0, 0, { classId: "healer", mana: 0, manaMax: 100 }), idle()], { "4-6": "crystal" })
    const c = E.attackWall({ ...s, manaRules: true }, "a", { row: 4, col: 6 })
    const U = (id) => c.units.find((u) => u.id === id)
    res.crystal = { tile: c.terrain["4-6"], a: U("a").mana, b: U("b").mana, far: U("far").mana, ev: c.events.some((e) => e.fx === "crystal"), full: T.TERRAIN.crystal?.obj === true }
  }
  // 12. Ground answers elements: ash +1 Burn, ice +1 Chill (and not on plain ground)
  {
    const El = await import("/src/services/heartwood/tacticsElements.js")
    const mkS = (tile) => st([P("a", 4, 4), En("e", 4, 6, { move: 0, attack: 0 }), idle()], tile ? { "4-6": tile } : {})
    const burnAsh = El.applyElement(mkS("ash"), "e", "fire", 1).units.find((u) => u.id === "e").burn
    const burnPlain = El.applyElement(mkS(null), "e", "fire", 1).units.find((u) => u.id === "e").burn
    const iceS = El.applyElement(mkS("ice"), "e", "frost", 1)
    const ice = iceS.units.find((u) => u.id === "e")
    const plain = El.applyElement(mkS(null), "e", "frost", 1).units.find((u) => u.id === "e")
    res.ground = { burnAsh, burnPlain, iceChill: (ice.chill || 0) + (ice.frozen ? 10 : 0), plainChill: plain.chill || 0, callout: iceS.events.some((e) => e.kind === "reaction" && /Frozen pool/.test(e.label)) }
  }
  // 8. Table sanity: every entry names a real terrain piece and a known placement
  res.table = Object.entries(F.FOREST_SHAPING).map(([id, sp]) => ({ id, ok: !!T.TERRAIN[sp.grow] && ["around-self", "around-target", "under-allies", "under-target"].includes(sp.on) && sp.count > 0 && sp.text?.length > 10 }))
  return res
})
ok("Thorn Boundary: 4 roots around the Warden, never on water / objects / its own tile, grow event", r.thorn.roots === 4 && r.thorn.water === "water" && r.thorn.stone === "stone" && r.thorn.self === "path" && r.thorn.ev, JSON.stringify(r.thorn))
ok("Growing Wall: the wall plus up to 3 roots right next to it", r.wall.wall === "wall" && r.wall.roots >= 1 && r.wall.roots <= 3 && r.wall.adjacent, JSON.stringify(r.wall))
ok("Group Renewal: healing moss under the healer and the adjacent allies only", JSON.stringify(r.renew.moss) === JSON.stringify(["3-6", "4-6", "4-7"]) && r.renew.far === "path", JSON.stringify(r.renew))
ok("Lingering Bloom: moss under the ally", r.bloom.under === "moss", JSON.stringify(r.bloom))
ok("Overgrow: grass + one glowcap on empty ground, sides still joined", r.overgrow.caps.length === 1 && r.overgrow.bush >= 1 && !r.overgrow.onUnit && r.overgrow.joined, JSON.stringify(r.overgrow))
ok("Whirlwind: dry leaves kicked up around the hero", r.whirl.changed && r.whirl.leaves >= 1 && r.whirl.leaves <= 3, JSON.stringify(r.whirl))
ok("Grove Sanctum ultimate: a ring of roots", r.grove.info === "grove-sanctum" && r.grove.roots >= 1 && r.grove.roots <= 6, JSON.stringify(r.grove))
ok("Wellspring ultimate: moss under the heroes it heals (not out of range)", r.well.info === "wellspring" && r.well.moss.includes("4-6") && r.well.moss.includes("5-7") && !r.well.moss.includes("0-11"), JSON.stringify(r.well))
ok("Topple: a Juggernaut fells a runestone onto the next tile (4 dmg, rubble on both)", r.topple.from === "rubble" && r.topple.land === "rubble" && r.topple.eHp === 26 && r.topple.ev, JSON.stringify(r.topple))
ok("Topple: a Guardian only chips it; into water = crossing; a tree behind it = no topple", r.topple.guard === "stone" && r.topple.guardE === 30 && r.topple.water === "rubble" && r.topple.blocked === "stone" && r.topple.tree === "tree", JSON.stringify(r.topple))
ok("Ground Breaker quakes the ground once (barricade -> rubble, not gravel; leaves scattered; rocks crack)", r.quake.wall === "rubble" && r.quake.leaves === "path" && r.quake.rock === "rubble", JSON.stringify(r.quake))
ok("Mana crystal: breaks to gravel, heroes within 1 gain resource, far ones don't", r.crystal.tile === "gravel" && r.crystal.a > 0 && r.crystal.b > 0 && r.crystal.far === 0 && r.crystal.ev && r.crystal.full, JSON.stringify(r.crystal))
ok("Charred ground +1 Burn, frozen pool +1 Chill (callout), plain ground unchanged", r.ground.burnAsh === r.ground.burnPlain + 1 && r.ground.iceChill > r.ground.plainChill && r.ground.callout, JSON.stringify(r.ground))
ok("every shaping entry is valid data", r.table.every((t) => t.ok), JSON.stringify(r.table.filter((t) => !t.ok)))

// UI: a shaping skill wears the leaf marker + tooltip line in the unit panel
await page.goto(`http://localhost:${PORT}/heartwood`)
await page.evaluate(async () => {
  localStorage.clear()
  const E = await import("/src/services/heartwood/runEngine.js")
  const bench = ["the-fool", "the-magician", "the-chariot"].map((defId, i) => ({ key: i, defId, upgradeLevel: 0, upgrades: [] }))
  const rs = E.chooseFloorEncounter(E.leaveShop({ ...E.startRun("tommy", null, { forcedSeed: 424256 }), bench, deployed: [0, 1, 2, null], benchKeyCounter: 3 }), 0)
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
await page.waitForTimeout(1800)
let ui = null
for (const id of await page.$$eval('.hwt-token[data-selectable="true"]', (els) => els.map((e) => e.dataset.unitId))) {
  await page.locator(`.hwt-token[data-unit-id="${id}"]`).click()
  await page.waitForTimeout(300)
  ui = await page.evaluate(() => {
    const btn = document.querySelector(".hwt-unit-panel .hwt-skill-btn[data-forest]")
    return btn ? { grow: btn.dataset.forest, leaf: !!btn.querySelector(".hwt-skill-forest"), title: btn.getAttribute("title") || "" } : null
  })
  if (ui) break
}
ok("a forest-shaping skill shows the 🌿 marker and explains it", ui && ui.leaf && /Shapes the forest/.test(ui.title), JSON.stringify(ui))
await page.locator(".hwt-unit-panel").screenshot({ path: ".scratch/shots/forest_shaping_panel.png" }).catch(() => {})
ok("0 page errors", errs.length === 0, errs.join(" | "))
await b.close()
for (const c of checks) console.log(`${c.pass ? "PASS" : "FAIL"}  ${c.name}${c.pass ? "" : `  (${c.info})`}`)
const failed = checks.filter((c) => !c.pass).length
console.log(`\n${checks.length - failed}/${checks.length} passed`)
process.exit(failed ? 1 : 0)
