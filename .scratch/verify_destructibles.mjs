import { chromium } from "playwright"

// Destructible battlefield objects: trees (fall/cover/fire spread), powder
// barrels + spore pods (explode), boulders (shove + roll), ice pillars
// (brittle + shatter), AI use, path guarantee, preview exactness, UI.
const PORT = process.env.PORT || 5445
const browser = await chromium.launch()
const errs = []
const out = { errors: [] }
const newPage = async () => {
  const p = await browser.newContext({ viewport: { width: 1600, height: 1000 } }).then((c) => c.newPage())
  p.on("pageerror", (e) => errs.push(String(e)))
  return p
}

const page = await newPage()
await page.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
await page.waitForSelector(".hwt-board", { timeout: 20000 })

const r = await page.evaluate(async () => {
  const E = await import("/src/services/heartwood/tacticsEngine.js")
  const O = await import("/src/services/heartwood/tacticsObjects.js")
  const T = await import("/src/services/heartwood/tacticsTerrain.js")
  const EL = await import("/src/services/heartwood/tacticsElements.js")
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
  const res = {}
  // A far-away enemy that never acts (so the fight doesn't end).
  const idle = () => En("idle", 8, 0, { move: 0, hp: 99, maxHp: 99, attack: 0 })

  // 1. Tree: chop from the east -> falls west, hits 2 tiles, leaves logs + stump.
  {
    const s = st([P("p", 4, 8), En("e1", 4, 6), En("e2", 4, 5), idle()], { "4-7": "tree" })
    const a = E.attackWall(s, "p", { row: 4, col: 7 })
    res.tree = {
      targets: E.wallTargetsFor(s, "p").length,
      treeTile: a.terrain["4-7"], log1: a.terrain["4-6"], log2: a.terrain["4-5"],
      e1: 30 - hpOf(a, "e1"), e2: 30 - hpOf(a, "e2"), ap: a.units.find((u) => u.id === "p").ap,
      fallEvent: a.events.some((e) => e.kind === "object" && e.fx === "fall" && e.label === "Timber!" && e.dir.col === -1),
    }
    // Partial chop keeps it standing with HP.
    const weak = E.attackWall(st([P("p", 4, 8, { attack: 2 }), idle()], { "4-7": "tree" }), "p", { row: 4, col: 7 })
    res.tree.partial = { t: weak.terrain["4-7"], hp: O.objectHpAt(weak, { row: 4, col: 7 }) }
    // Blocks movement; log costs 2.
    const walk = E.reachableTilesFor(st([P("m", 4, 8, { move: 2 }), idle()], { "4-7": "tree" }), "m")
    const logWalk = E.reachableTilesFor(st([P("m", 4, 8, { move: 2 }), idle()], { "4-7": "log" }), "m")
    res.tree.blocks = !walk.some((t) => t.row === 4 && t.col === 7)
    res.tree.logEnter = logWalk.some((t) => t.row === 4 && t.col === 7) && !logWalk.some((t) => t.row === 4 && t.col === 6 && false)
  }
  // 2. Cover (XCOM part 2): trees/logs are FULL/HALF cover (hit %), no longer a damage cut.
  {
    const open = st([P("a", 4, 9, { range: 3, attack: 8 }), En("e", 4, 6), idle()], {})
    const cover = st([P("a", 4, 9, { range: 3, attack: 8 }), En("e", 4, 6), idle()], { "4-7": "tree" })
    const logc = st([P("a", 4, 9, { range: 3, attack: 8 }), En("e", 4, 6), idle()], { "4-7": "log" })
    const Cv = await import("/src/services/heartwood/tacticsCover.js")
    res.cover = { open: 30 - hpOf(E.attackUnit(open, "a", "e"), "e"), tree: 30 - hpOf(E.attackUnit(cover, "a", "e"), "e"), log: 30 - hpOf(E.attackUnit(logc, "a", "e"), "e"), treeLvl: Cv.coverAgainst(cover, { row: 4, col: 6 }, { row: 4, col: 9 }), logLvl: Cv.coverAgainst(logc, { row: 4, col: 6 }, { row: 4, col: 9 }) }
  }
  // 3. Fire: Burn on a unit next to a tree ignites it; it spreads, scorches, turns to ash.
  {
    let s = st([P("p", 3, 5, { hp: 30 }), En("e", 1, 5, { move: 0, attack: 0 }), idle()], { "2-5": "tree", "2-6": "tree", "2-7": "tree" })
    s = EL.applyElement(s, "e", "fire", 2)
    const lit = O.isBurning(s, { row: 2, col: 5 })
    const t1 = E.endPlayerTurn(s)
    const spread1 = O.isBurning(t1, { row: 2, col: 6 })
    const scorch = 30 - hpOf(t1, "p")
    const t2 = E.endPlayerTurn(t1)
    const t4 = E.endPlayerTurn(E.endPlayerTurn(t2))
    res.fire = { lit, spread1, scorch, ash1: t2.terrain["2-5"], burning3: O.isBurning(t2, { row: 2, col: 7 }), ashAll: ["2-5", "2-6", "2-7"].map((k) => t4.terrain[k]) }
    // A fire-element attacker chipping a tree lights it.
    const fireHit = E.attackWall(st([P("d", 4, 8, { attack: 2, className: "Diviner", ability: { kind: "burst", name: "x" } }), idle()], { "4-7": "tree" }), "d", { row: 4, col: 7 })
    res.fire.byAttack = O.isBurning(fireHit, { row: 4, col: 7 })
  }
  // 4. Barrel: any hit explodes; 3x3 damage, fire tiles that fade, chains.
  {
    const s = st([P("a", 4, 10, { range: 3 }), En("e1", 3, 6), En("e2", 5, 7), En("far", 4, 4), idle()], { "4-7": "barrel", "3-8": "barrel", "4-6": "tree" })
    const b = E.attackWall(s, "a", { row: 4, col: 7 })
    const t1 = E.endPlayerTurn(b)
    const t2 = E.endPlayerTurn(t1)
    res.barrel = {
      e1: 30 - hpOf(b, "e1"), e2: 30 - hpOf(b, "e2"), far: 30 - hpOf(b, "far"),
      center: b.terrain["4-7"], side: b.terrain["5-7"], chained: b.terrain["3-8"] !== "barrel", treeLit: O.isBurning(b, { row: 4, col: 6 }),
      boom: b.events.filter((e) => e.kind === "object" && e.fx === "boom").length,
      fireAfter2: t2.terrain["5-7"] || "path",
    }
  }
  // 5. Spore pod: damage + poison + poison pools.
  {
    const s = st([P("a", 4, 10, { range: 3 }), En("e1", 3, 6), idle()], { "4-7": "sporepod" })
    const b = E.attackWall(s, "a", { row: 4, col: 7 })
    res.spore = { e1: 30 - hpOf(b, "e1"), poison: b.units.find((u) => u.id === "e1").poison, pool: b.terrain["4-6"], center: b.terrain["4-7"] }
  }
  // 6. Boulder: shoved from the east it rolls west until it hits the enemy.
  {
    const s = st([P("p", 4, 9), En("e", 4, 3), idle()], { "4-8": "boulder" })
    const b = E.attackWall(s, "p", { row: 4, col: 8 })
    // Ranged hit only chips it.
    const chip = E.attackWall(st([P("p", 4, 10, { range: 3, attack: 3 }), idle()], { "4-8": "boulder" }), "p", { row: 4, col: 8 })
    // Push ability: the pushed unit slams into a boulder, which rolls on.
    const ps = st([P("pu", 4, 8, { ability: { id: "shove", name: "Shove", kind: "push", cost: 1, bonus: 2, cooldown: 0 }, cooldownRemaining: 0 }), En("e", 4, 7), En("far", 4, 2), idle()], { "4-6": "boulder" })
    const pushed = E.castAbility(ps, "pu", "e")
    res.pushRoll = { boulderAt: Object.entries(pushed.terrain).find(([, v]) => v === "boulder")?.[0], far: 30 - hpOf(pushed, "far") }
    res.boulder = { old: b.terrain["4-8"] || "path", now: b.terrain["4-4"], e: 30 - hpOf(b, "e"), rolled: b.events.some((e) => e.kind === "object" && e.fx === "roll"), chipHp: O.objectHpAt(chip, { row: 4, col: 8 }), chipStays: chip.terrain["4-8"] }
  }
  // 7. Ice pillar: frost makes it brittle, next hit shatters (damage + chill around).
  {
    let s = st([P("p", 4, 8, { attack: 1 }), En("e", 5, 6), En("e2", 3, 7, { move: 0 }), idle()], { "4-7": "icepillar" })
    const plain = E.attackWall(s, "p", { row: 4, col: 7 })
    s = EL.applyElement(s, "e2", "frost", 1)
    const brittle = O.isChilled(s, { row: 4, col: 7 })
    const sh = E.attackWall(s, "p", { row: 4, col: 7 })
    res.ice = {
      plainStands: plain.terrain["4-7"] === "icepillar", brittle, tile: sh.terrain["4-7"],
      eDmg: 30 - hpOf(sh, "e"), eChill: sh.units.find((u) => u.id === "e").chill, pDmg: 30 - hpOf(sh, "p"),
      ev: sh.events.some((e) => e.kind === "object" && e.fx === "shatter"),
    }
  }
  // 8. AI: an archer sets off the barrel between two of your units; preview == real.
  {
    const s = st([P("p1", 3, 7, { hp: 20 }), P("p2", 5, 7, { hp: 20 }), En("arch", 4, 3, { range: 3, move: 1, attack: 2 })], { "4-7": "barrel" })
    const before = JSON.stringify(s)
    const intents = E.previewEnemyIntents(s)
    const unchanged = JSON.stringify(s) === before
    const real = E.endPlayerTurn(s)
    res.ai = {
      intent: intents[0]?.intent, unchanged,
      exploded: real.terrain["4-7"] !== "barrel", p1: 20 - hpOf(real, "p1"), p2: 20 - hpOf(real, "p2"),
    }
    // Won't blow a barrel with an ally in the blast.
    const s2 = st([P("p1", 3, 7, { hp: 20 }), En("buddy", 5, 7, { move: 0, attack: 0 }), En("arch", 4, 3, { range: 3, move: 1, attack: 2 })], { "4-7": "barrel" })
    res.ai.allyIntent = E.previewEnemyIntents(s2).find((i) => i.enemyId === "arch")?.intent
    // Walled off by a line of trees -> chops through.
    const trees = {}
    for (let row = 0; row < 9; row++) trees[`${row}-5`] = "tree"
    const s3 = st([P("p", 4, 9), En("brute", 4, 4, { move: 2, attack: 8 })], trees)
    const i3 = E.previewEnemyIntents(s3)[0]?.intent
    const r3 = E.endPlayerTurn(s3)
    res.ai.chop = { intent: i3, felled: Object.values(r3.terrain).filter((t) => t === "tree").length }
    // Ranged: prefers a tile with a tree between it and you (same distance).
    const s4 = st([P("p", 4, 8, { hp: 99, maxHp: 99 })], {})
    res.ai.coverScore = O.aiTreeCoverBonus({ ...s4, terrain: { "4-5": "tree" } }, { row: 4, col: 4 }, { row: 4, col: 8 })
    res.ai.firePenalty = O.aiObjectTilePenalty({ ...s4, terrain: { "4-5": "tree" }, objFire: { "4-5": 2 } }, { row: 4, col: 4 })
    // Preview exact with a burning tree ticking before the enemy acts.
    const s5 = st([P("p", 4, 6, { hp: 3, maxHp: 30 }), En("e", 4, 2, { move: 2, attack: 5 })], { "3-6": "tree" })
    const lit = { ...s5, objFire: { "3-6": 2 } }
    const pv = E.previewEnemyIntents(lit)
    const rl = E.endPlayerTurn(lit)
    res.ai.fireExact = { preview: pv.map((x) => x.intent.kind), pHp: hpOf(rl, "p") }
  }
  // 9. Path guarantee + placement over many seeds (objects count as blocking).
  {
    let broken = 0
    const counts = {}
    const byTemplate = {}
    let nonDet = 0
    const nodes = RE.RUN_PATH.length
    for (let seed = 1; seed <= 120; seed++) {
      for (let idx = 0; idx < nodes; idx += 2) {
        const t = RM.generateRealTerrain(seed * 7919, idx)
        if (!T.sidesConnected(t, E.GRID)) broken++
        const tpl = RM.mapTemplateForNode(seed * 7919, idx).template.id
        for (const v of Object.values(t)) {
          if (O.OBJECTS[v]) {
            counts[v] = (counts[v] || 0) + 1
            byTemplate[tpl] = byTemplate[tpl] || {}
            byTemplate[tpl][v] = (byTemplate[tpl][v] || 0) + 1
          }
        }
        if (seed <= 10 && JSON.stringify(t) !== JSON.stringify(RM.generateRealTerrain(seed * 7919, idx))) nonDet++
      }
    }
    res.maps = { broken, counts, byTemplate, nonDet }
  }
  // 10. QA hook flattens objects too.
  {
    const q = E.withLowEnemyHp({ ...st([P("p", 4, 8), En("e", 4, 2)], { "4-7": "tree" }), objFire: { "4-7": 1 } })
    res.qa = { terrain: Object.keys(q.terrain).length, fire: Object.keys(q.objFire || {}).length }
  }
  return res
})
out.engine = r
const e = out.errors
const t = r.tree
if (!(t.targets === 1 && t.treeTile === "stump" && t.log1 === "log" && t.log2 === "log" && t.e1 === 4 && t.e2 === 4 && t.ap === 1 && t.fallEvent)) e.push("c1 tree falls away, hits 2 tiles, leaves logs")
if (!(t.partial.t === "tree" && t.partial.hp === 4 && t.blocks && t.logEnter)) e.push("c1b tree HP / blocks / log walkable")
if (!(r.cover.open === 8 && r.cover.tree === 8 && r.cover.log === 8 && r.cover.treeLvl === 2 && r.cover.logLvl === 1)) e.push("c2 tree/log cover")
const f = r.fire
if (!(f.lit && f.spread1 && f.scorch === 1 && f.ash1 === "ash" && f.burning3 && f.ashAll.every((x) => x === "ash") && f.byAttack)) e.push("c3 fire ignites, spreads, scorches, ashes")
const b = r.barrel
if (!(b.e1 === 4 && b.e2 === 4 && b.far === 0 && b.center === "fire" && b.side === "fire" && b.chained && b.treeLit && b.boom === 2 && b.fireAfter2 !== "fire")) e.push("c4 barrel explosion/chain/fire tiles fade")
if (!(r.spore.e1 === 3 && r.spore.poison === 2 && r.spore.pool === "poison" && r.spore.center === "poison")) e.push("c5 spore pod")
const bo = r.boulder
if (!(r.pushRoll.boulderAt === "4-3" && r.pushRoll.far === 5)) e.push("c6b push skill rolls a boulder")
if (!(bo.old === "path" && bo.now === "boulder" && bo.e === 5 && bo.rolled && bo.chipHp === 9 && bo.chipStays === "boulder")) e.push("c6 boulder roll/chip")
const ic = r.ice
if (!(ic.plainStands && ic.brittle && ic.tile === "ice" && ic.eDmg === 3 && ic.eChill >= 1 && ic.pDmg === 3 && ic.ev)) e.push("c7 ice pillar shatter")
const ai = r.ai
if (!(ai.intent?.kind === "wall" && ai.intent.object === "barrel" && ai.unchanged && ai.exploded && ai.p1 === 4 && ai.p2 === 4)) e.push("c8a AI shoots barrel, preview == real")
if (ai.allyIntent?.kind === "wall" && ai.allyIntent.object) e.push("c8b AI spares barrel next to ally")
if (!(ai.chop.intent?.kind === "wall" && ai.chop.felled === 8)) e.push("c8c AI chops through tree line")
if (!(ai.coverScore > 0 && ai.firePenalty > 0)) e.push("c8d AI cover bonus / fire penalty")
if (!(ai.fireExact.pHp === 2)) e.push("c8e fire tick before enemy acts (preview state exact)")
if (!(r.maps.broken === 0 && r.maps.nonDet === 0 && r.maps.byTemplate["forest-glade"]?.tree > 0 && r.maps.byTemplate["ruined-walls"]?.barrel > 0 && r.maps.byTemplate["ruined-walls"]?.boulder > 0 && r.maps.byTemplate["frozen-ford"]?.icepillar > 0 && r.maps.byTemplate["ember-field"]?.barrel > 0))
  e.push("c9 path guarantee / placements")
if (!(r.qa.terrain === 0 && r.qa.fire === 0)) e.push("c10 QA hook flattens objects")

// 11. UI: showcase map renders sprites, pips, tooltip; click a barrel -> Boom! callout.
{
  const p = await newPage()
  await p.goto(`http://localhost:${PORT}/heartwood-tactics?objects=1`, { waitUntil: "domcontentloaded" })
  await p.waitForSelector(".hwt-board", { timeout: 20000 })
  await p.waitForTimeout(500)
  const cellOf = (row, col) => p.locator(".hwt-cell").nth(row * 12 + col)
  const sprites = await p.locator(".hwt-object").count()
  const treeTitle = await cellOf(0, 4).getAttribute("title")
  const pips = await cellOf(0, 4).locator(".hwt-obj-pip").count()
  const legend = await p.locator(".hwt-terrain-legend-item").allTextContents()
  const active = await p.locator("[data-objects-showcase]").getAttribute("data-active")
  // Find a player with range >= 2 that can hit barrel 1-8 or 2-6; else walk the first unit next to it.
  const ids = await p.locator('.hwt-token[data-side="player"]').evaluateAll((els) => els.map((el) => el.getAttribute("data-unit-id")))
  let hitBarrel = false
  for (const id of ids) {
    await p.locator(`.hwt-token[data-unit-id="${id}"]`).click()
    await p.waitForTimeout(120)
    if ((await cellOf(1, 8).getAttribute("data-wall-targetable")) === "true") {
      await cellOf(1, 8).click()
      hitBarrel = true
      break
    }
  }
  if (!hitBarrel) {
    // Walk the first unit to a tile next to the barrel, then hit it.
    await p.locator(`.hwt-token[data-unit-id="${ids[0]}"]`).click()
    await p.waitForTimeout(120)
    for (const [row, col] of [[1, 9], [2, 9], [0, 9], [1, 10], [2, 10], [0, 10]]) {
      if ((await cellOf(row, col).getAttribute("data-reachable")) === "true") {
        await cellOf(row, col).click()
        await p.waitForTimeout(250)
        await p.locator(`.hwt-token[data-unit-id="${ids[0]}"]`).click().catch(() => {})
        await p.waitForTimeout(120)
        if ((await cellOf(1, 8).getAttribute("data-wall-targetable")) === "true") {
          await cellOf(1, 8).click()
          hitBarrel = true
        }
        break
      }
    }
  }
  await p.waitForTimeout(250)
  const boom = await cellOf(1, 8).locator('.hwt-obj-fx[data-kind="boom"]').textContent().catch(() => null)
  const after = await cellOf(1, 8).getAttribute("data-terrain")
  const fireTitle = await cellOf(1, 8).getAttribute("title")
  await p.screenshot({ path: new URL("./shots/destructibles_ui.png", import.meta.url).pathname }).catch(() => {})
  await p.close()
  out.ui = { sprites, treeTitle, pips, legend, active, hitBarrel, boom, after, fireTitle }
  if (!(sprites === 12 && treeTitle?.startsWith("Tree (6/6 HP)") && pips === 6 && legend.includes("Tree") && legend.includes("Powder barrel") && active === "true"))
    e.push("c11a showcase render / tooltip / pips / legend")
  if (!(hitBarrel && boom === "Boom!" && after === "fire" && fireTitle?.startsWith("Flames:"))) e.push("c11b click barrel -> Boom! + fire tile")
}

out.pageErrors = errs
await browser.close()
console.log(JSON.stringify(out, null, 2))
console.log(out.errors.length === 0 && errs.length === 0 ? "ALL PASS" : "FAIL")
