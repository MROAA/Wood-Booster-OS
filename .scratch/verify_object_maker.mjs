import { chromium } from "playwright"

// Object Maker (Studio-made battlefield objects, battleObjects.js):
// registration, every "what happens when it breaks" effect, map spawning
// (own seeded salt, earlier layers untouched), showcase + board render.
const PORT = process.env.PORT || 5445
const browser = await chromium.launch()
const errs = []
const out = { errors: [] }
const e = out.errors
const newPage = async () => {
  const p = await browser.newContext({ viewport: { width: 1536, height: 864 } }).then((c) => c.newPage())
  p.on("pageerror", (err) => errs.push(String(err)))
  return p
}

const page = await newPage()
await page.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
await page.waitForSelector(".hwt-board", { timeout: 20000 })

const r = await page.evaluate(async () => {
  const E = await import("/src/services/heartwood/tacticsEngine.js")
  const O = await import("/src/services/heartwood/tacticsObjects.js")
  const T = await import("/src/services/heartwood/tacticsTerrain.js")
  const RM = await import("/src/services/heartwood/tacticsRealMatchup.js")
  const RE = await import("/src/services/heartwood/runEngine.js")
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
  const mk = (tpl, id, side, row, col, extra = {}) => ({
    ...tpl, ...clean, id, side, name: id, pos: { row, col }, hp: 30, maxHp: 30, attack: 8, baseAttack: 8, range: 1, move: 2,
    facing: side === "player" ? "W" : "E", ...extra,
  })
  const P = (id, row, col, extra) => mk(pTpl, id, "player", row, col, extra)
  const En = (id, row, col, extra) => mk(eTpl, id, "enemy", row, col, extra)
  const st = (units, terrain = {}) => ({ ...base, units, terrain, wallHp: {}, phase: "player", turn: 1, log: [], events: [], eventSeq: 0, relicIds: [] })
  const hpOf = (s, id) => s.units.find((u) => u.id === id).hp
  const idle = () => En("idle", 8, 0, { move: 0, hp: 99, maxHp: 99, attack: 0 })
  // Test-only objects for the effects the shipped example doesn't use.
  const inject = (id, def) => {
    O.OBJECTS[id] = { name: id, icon: "❖", image: "", custom: true, power: 0, leaves: "rubble", ...def }
    if (def.explosive === undefined) delete O.OBJECTS[id].explosive
    T.TERRAIN[id] = { cost: Infinity, obj: true }
  }
  inject("t-crumble", { hp: 3, onBreak: "crumble", leaves: "rubble" })
  inject("t-heal", { hp: 1, onBreak: "healBurst", power: 6, leaves: "moss" })
  inject("t-ice", { hp: 2, onBreak: "iceShards", power: 4, leaves: "ice" })
  inject("t-fire", { hp: 1, onBreak: "fireBlast", power: 5, leaves: "ash", explosive: "fire" })
  inject("t-fall", { hp: 1, onBreak: "fall", leaves: "leaves" })
  const res = {}

  // 1. The shipped example is registered as a real object everywhere.
  res.reg = {
    ids: T.CUSTOM_OBJECT_IDS, obj: O.OBJECTS["wasp-nest"], terrain: T.TERRAIN["wasp-nest"], info: T.TERRAIN_INFO["wasp-nest"],
    builtInTree: O.OBJECTS.tree, attackable: O.isAttackableTile("wasp-nest"),
    blocks: !E.reachableTilesFor(st([P("m", 4, 8, { move: 2 }), idle()], { "4-7": "wasp-nest" }), "m").some((t) => t.row === 4 && t.col === 7),
    describe: O.describeObjectTile(st([idle()], { "4-7": "wasp-nest" }), { row: 4, col: 7 }),
  }
  // 2. Wasp nest = poison burst, power 2: damage + poison, leaves "path" + a poison pool.
  {
    const s = st([P("a", 4, 9, { range: 3 }), En("e1", 3, 6), idle()], { "4-7": "wasp-nest" })
    const b = E.attackWall(s, "a", { row: 4, col: 7 })
    res.wasp = { dmg: 30 - hpOf(b, "e1"), poison: b.units.find((u) => u.id === "e1").poison, center: b.terrain["4-7"] || "path", spore: b.events.some((x) => x.kind === "object" && x.fx === "spore"), log: b.log.join(" | ") }
  }
  // 3. Crumble with 3 HP: a weak hit chips it, a strong one breaks it to rubble.
  {
    const s = st([P("a", 4, 8, { attack: 2 }), idle()], { "4-7": "t-crumble" })
    const chip = E.attackWall(s, "a", { row: 4, col: 7 })
    const brk = E.attackWall(st([P("a", 4, 8, { attack: 8 }), idle()], { "4-7": "t-crumble" }), "a", { row: 4, col: 7 })
    res.crumble = { chipT: chip.terrain["4-7"], chipHp: O.objectHpAt(chip, { row: 4, col: 7 }), brokeT: brk.terrain["4-7"], ev: brk.events.some((x) => x.kind === "object" && x.fx === "break") }
  }
  // 4. Heal burst power 6: heals everyone in the 3x3, leaves moss.
  {
    const s = st([P("a", 4, 8, { hp: 10 }), En("e", 3, 6, { hp: 28 }), idle()], { "4-7": "t-heal" })
    const b = E.attackWall(s, "a", { row: 4, col: 7 })
    res.heal = { a: hpOf(b, "a"), e: hpOf(b, "e"), t: b.terrain["4-7"], ev: b.events.some((x) => x.kind === "object" && x.fx === "bloom") }
  }
  // 5. Ice shards power 4: hp 2 -> two hits; damage + chill around, leaves ice.
  {
    const s = st([P("a", 4, 8, { attack: 8 }), En("e", 5, 6), idle()], { "4-7": "t-ice" })
    const b = E.attackWall(s, "a", { row: 4, col: 7 })
    res.ice = { e: 30 - hpOf(b, "e"), chill: b.units.find((u) => u.id === "e").chill, p: 30 - hpOf(b, "a"), t: b.terrain["4-7"], ev: b.events.some((x) => x.kind === "object" && x.fx === "shatter") }
  }
  // 6. Fire blast power 5: damage, fire tiles, chains into a barrel.
  {
    const s = st([P("a", 4, 10, { range: 3 }), En("e1", 3, 6), idle()], { "4-7": "t-fire", "5-8": "barrel" })
    const b = E.attackWall(s, "a", { row: 4, col: 7 })
    res.fire = { e1: 30 - hpOf(b, "e1"), side: b.terrain["4-6"], barrelGone: b.terrain["5-8"] !== "barrel", boom: b.events.filter((x) => x.kind === "object" && x.fx === "boom").length, log: b.log.some((l) => l.includes("The t-fire explodes")) }
    res.fire.aiDmg = O.blastDamage("t-fire")
  }
  // 7. Fall: topples west from an east hit, crushing 2 tiles; its own leftover.
  {
    const s = st([P("p", 4, 8), En("e1", 4, 6), idle()], { "4-7": "t-fall" })
    const b = E.attackWall(s, "p", { row: 4, col: 7 })
    res.fall = { t: b.terrain["4-7"], log1: b.terrain["4-6"], e1: 30 - hpOf(b, "e1"), ev: b.events.some((x) => x.kind === "object" && x.fx === "fall") }
  }
  // 8. Built-ins untouched by the hook (the full destructibles suite covers the rest).
  {
    const g = E.attackWall(st([P("a", 4, 8), En("e", 3, 6), idle()], { "4-7": "glowcap" }), "a", { row: 4, col: 7 })
    const sp = E.attackWall(st([P("a", 4, 9, { range: 3 }), En("e1", 3, 6), idle()], { "4-7": "sporepod" }), "a", { row: 4, col: 7 })
    res.builtin = { glowT: g.terrain["4-7"], spore: 30 - hpOf(sp, "e1"), sporeDmg: O.blastDamage("sporepod"), barrelDmg: O.blastDamage("barrel") }
  }
  // 9. Map spawning: the example ships OFF (perBattle 0); switched on, wasp
  // nests (fromAct 2) appear only from Act II on; earlier layers identical.
  {
    const BO = await import("/src/data/heartwood/battleObjects.js")
    const offTerrain = JSON.stringify(RM.generateRealTerrain(11, 30))
    const shippedOff = BO.BATTLE_OBJECTS["wasp-nest"].perBattle === 0 && !offTerrain.includes("wasp-nest")
    BO.BATTLE_OBJECTS["wasp-nest"].perBattle = 1
    const nodes = RE.RUN_PATH.length
    const act1 = [...Array(nodes).keys()].find((n) => RE.actIndexForNode(n, nodes) === 1)
    const act2 = [...Array(nodes).keys()].find((n) => RE.actIndexForNode(n, nodes) === 2)
    const count = (t) => Object.values(t).filter((v) => v === "wasp-nest").length
    const seeds = [11, 22, 33, 44, 55, 66, 77, 88]
    let act2Nests = 0
    let identical = true
    let connected = true
    for (const seed of seeds) {
      const layered = RM.generateForestDressing(seed, act2, RM.generateBaseTerrain(seed, act2))
      const real = RM.generateRealTerrain(seed, act2)
      act2Nests += count(real)
      for (const [key, v] of Object.entries(layered)) if (real[key] !== v) identical = false
      if (!T.sidesConnected(real, E.GRID)) connected = false
    }
    const a1 = seeds.map((seed) => count(RM.generateRealTerrain(seed, act1)))
    BO.BATTLE_OBJECTS["wasp-nest"].perBattle = 0
    res.spawn = { shippedOff, act1, act2, act1Nests: a1.reduce((x, y) => x + y, 0), act2Nests, identical, connected, stable: JSON.stringify(RM.generateRealTerrain(5, act2)) === JSON.stringify(RM.generateRealTerrain(5, act2)) }
  }
  return res
})
out.r = r
const c = (ok, label) => { if (!ok) e.push(label) }
c(r.reg.ids.includes("wasp-nest") && r.reg.obj?.custom && r.reg.obj.explosive === "poison" && r.reg.terrain?.obj && r.reg.info?.name === "Wasp nest", "c1 registered")
c(r.reg.builtInTree.name === "Tree" && !r.reg.builtInTree.custom && r.reg.attackable && r.reg.blocks, "c1b blocks / built-in tree unchanged")
c(r.reg.describe?.startsWith("Wasp nest (1/1 HP)") && r.reg.describe.includes("2 damage and +2 Poison"), "c1c tooltip")
c(r.wasp.dmg === 2 && r.wasp.poison === 2 && r.wasp.spore && r.wasp.log.includes("The wasp nest bursts"), "c2 wasp poison burst")
c(r.crumble.chipT === "t-crumble" && r.crumble.chipHp === 1 && r.crumble.brokeT === "rubble" && r.crumble.ev, "c3 crumble + hp")
c(r.heal.a === 16 && r.heal.e === 30 && r.heal.t === "moss" && r.heal.ev, "c4 heal burst")
c(r.ice.e === 4 && r.ice.chill >= 1 && r.ice.p === 4 && r.ice.t === "ice" && r.ice.ev, "c5 ice shards")
c(r.fire.e1 === 5 && r.fire.side === "fire" && r.fire.barrelGone && r.fire.boom === 2 && r.fire.log && r.fire.aiDmg === 5, "c6 fire blast + chain")
c(r.fall.t === "leaves" && r.fall.log1 === "log" && r.fall.e1 === 4 && r.fall.ev, "c7 fall")
c(r.builtin.glowT === "moss" && r.builtin.spore === 3 && r.builtin.sporeDmg === 3 && r.builtin.barrelDmg === 4, "c8 built-ins unchanged")
c(r.spawn.shippedOff && r.spawn.act1Nests === 0 && r.spawn.act2Nests === 8 && r.spawn.identical && r.spawn.connected && r.spawn.stable, "c9 map spawning")

// 10. Board: the showcase shows the wasp nest with its emoji sprite + tooltip.
{
  const p = await newPage()
  await p.goto(`http://localhost:${PORT}/heartwood-tactics?objects=1`, { waitUntil: "domcontentloaded" })
  await p.waitForSelector(".hwt-board", { timeout: 20000 })
  await p.waitForTimeout(500)
  const cell = p.locator(".hwt-cell").nth(8 * 12 + 4)
  const ui = {
    object: await cell.getAttribute("data-object"),
    sprite: await cell.locator('[data-custom-object="true"] text').textContent().catch(() => null),
    title: await cell.getAttribute("title"),
    legend: await p.locator(".hwt-terrain-legend-item").allTextContents(),
    unitsOnObjects: await p.evaluate(() => [...document.querySelectorAll(".hwt-cell[data-object]")].filter((el) => el.querySelector(".hwt-token")).length),
  }
  await p.screenshot({ path: new URL("./shots/object_maker_board.png", import.meta.url).pathname }).catch(() => {})
  await p.close()
  out.ui = ui
  c(ui.object === "wasp-nest" && ui.sprite === "🐝" && ui.title?.startsWith("Wasp nest") && ui.legend.some((l) => l.includes("Wasp nest")) && ui.unitsOnObjects === 0, "c10 board render")
}

out.pageErrors = errs
await browser.close()
console.log(JSON.stringify(out, null, 2))
console.log(out.errors.length === 0 && errs.length === 0 ? "ALL PASS" : "FAIL")
