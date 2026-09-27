import { chromium } from "playwright"

// Sprint 3 - Battlefield features: high ground, barricades, bridges, tall
// grass, lava, ice + seeded map templates. Engine checks via page.evaluate
// import on synthetic states; UI check on the real game.
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
  const T = await import("/src/services/heartwood/tacticsTerrain.js")
  const RM = await import("/src/services/heartwood/tacticsRealMatchup.js")
  const rt = await import("/src/services/heartwood/runEngine.js")
  const base = E.createTacticsBattle()
  const clean = {
    block: 0, ward: 0, revive: 0, bulwark: 0, taunt: 0, poison: 0, weak: 0, vulnerable: 0, slow: 0, root: 0,
    suppressed: 0, stun: 0, execute: 0, shatter: 0, woundedFury: 0, leech: false, poisonOnHit: 0, nimble: false,
    phases: [], phaseIndex: 0, triggers: [], aoeMove: null, charge: null, covenAura: null, cultRitual: null,
    cultFodder: false, broodSplit: null, className: null, ap: 2, apMax: 2, regen: 0, strength: 0, enemySkills: [],
    haste: false, spiritbound: false, guardian: false,
  }
  const pTpl = base.units.find((u) => u.side === "player")
  const eTpl = base.units.find((u) => u.side === "enemy")
  const mk = (tpl, id, side, row, col, extra = {}) => ({
    ...tpl, ...clean, id, side, name: id, pos: { row, col }, hp: 30, maxHp: 30, attack: 8, baseAttack: 8, range: 1, move: 2,
    facing: side === "player" ? "W" : "E", ...extra,
  })
  const P = (id, row, col, extra) => mk(pTpl, id, "player", row, col, extra)
  const En = (id, row, col, extra) => mk(eTpl, id, "enemy", row, col, extra)
  const st = (units, terrain = {}) => ({ ...base, units, terrain, wallHp: {}, phase: "player", turn: 1, log: [], events: [], relicIds: [] })
  const hpOf = (s, id) => s.units.find((u) => u.id === id).hp
  const posOf = (s, id) => s.units.find((u) => u.id === id).pos
  const has = (list, pos) => list.some((p) => p.row === pos.row && p.col === pos.col)
  const res = {}

  // 1. Each tile rule.
  {
    // High ground: +1 range for ranged, +25% (min +1) damage onto low ground, costs 2 to climb.
    const archer = (t) => st([P("a", 4, 8, { range: 2, attack: 8 }), En("e", 4, 5, { facing: "E" })], t)
    const flat = archer({})
    const high = archer({ "4-8": "high" })
    const hitFlat = hpOf(flat, "e") - hpOf(E.attackUnit({ ...flat, units: flat.units.map((u) => (u.id === "a" ? { ...u, pos: { row: 4, col: 7 } } : u)) }, "a", "e"), "e")
    const hitHigh = hpOf(high, "e") - hpOf(E.attackUnit(high, "a", "e"), "e")
    const climb = st([P("m", 4, 8, { move: 2 })], { "4-7": "high", "4-6": "high" })
    const reachClimb = E.reachableTilesFor(climb, "m")
    // Bridge: the river is impassable, the bridge is not.
    const river = {}
    for (let row = 0; row < 9; row++) river[`${row}-6`] = row === 4 ? "bridge" : "water"
    const reachRiver = E.reachableTilesFor(st([P("m", 4, 7, { move: 2 })], river), "m")
    // Tall grass: hidden from 2+ tiles, hittable adjacent.
    const bushFar = st([P("a", 4, 8, { range: 3 }), En("e", 4, 6)], { "4-6": "bush" })
    const bushNear = st([P("a", 4, 7, { range: 3 }), En("e", 4, 6)], { "4-6": "bush" })
    // Lava: ends the player's turn on lava -> burns 3 at the enemy-phase start.
    const lava = st([P("p", 4, 10, { hp: 20 }), En("e", 0, 0, { move: 0 })], { "4-10": "lava" })
    const lavaAfter = E.endPlayerTurn(lava)
    // Ice: moving W onto ice at col 6 slides on to col 5.
    const ice = st([P("p", 4, 8, { move: 2 })], { "4-6": "ice" })
    const slid = E.moveUnit(ice, "p", { row: 4, col: 6 })
    const iceBlocked = E.moveUnit(st([P("p", 4, 8, { move: 2 }), En("e", 4, 5, { move: 3 })], { "4-6": "ice" }), "p", { row: 4, col: 6 })
    res.c1 = {
      rangeFlat: E.rangeAt(flat, flat.units[0]),
      rangeHigh: E.rangeAt(high, high.units[0]),
      meleeHighRange: E.rangeAt(st([P("m", 4, 8)], { "4-8": "high" }), P("m", 4, 8)),
      targetsFlat: E.attackableTargets({ ...flat, units: flat.units.map((u) => (u.id === "a" ? { ...u, pos: { row: 4, col: 8 } } : u)) }, "a").length,
      targetsHigh: E.attackableTargets(high, "a").length,
      hitFlat,
      hitHigh,
      climbAdjacent: has(reachClimb, { row: 4, col: 7 }),
      climbTwo: has(reachClimb, { row: 4, col: 6 }),
      bridge: has(reachRiver, { row: 4, col: 6 }),
      water: has(reachRiver, { row: 3, col: 6 }) || has(reachRiver, { row: 5, col: 6 }),
      acrossViaBridge: has(reachRiver, { row: 4, col: 5 }),
      bushFar: E.attackableTargets(bushFar, "a").length,
      bushNear: E.attackableTargets(bushNear, "a").length,
      bushFarAttack: E.attackUnit(bushFar, "a", "e") === bushFar,
      lavaHp: hpOf(lavaAfter, "p"),
      lavaLog: lavaAfter.log.some((l) => l.includes("burns on the lava")),
      lavaDeployBlocked: !E.isDeployTile({ ...lava, terrain: { "4-10": "lava" } }, { row: 4, col: 10 }),
      icePos: posOf(slid, "p"),
      iceBlockedPos: posOf(iceBlocked, "p"),
    }
  }

  // 2. Generation: every template shows up, spawn columns stay clear and a
  //    walkable route (walls + water blocking) always joins the two sides.
  {
    const battleNodes = rt.RUN_PATH.map((n, i) => ({ n, i })).filter(({ n }) => n.type === "battle" || n.type === "elite" || n.type === "boss").map(({ i }) => i)
    const seen = {}
    let maps = 0
    let blocked = 0
    let spawnDirty = 0
    let nonDet = 0
    for (let seed = 1; seed <= 150; seed++) {
      for (const idx of battleNodes) {
        const t = RM.generateRealTerrain(seed * 7919, idx)
        maps++
        if (!T.sidesConnected(t, E.GRID)) blocked++
        if (Object.keys(t).some((k) => { const c = Number(k.split("-")[1]); return c < 3 || c > 8 })) spawnDirty++
        if (seed <= 10 && JSON.stringify(t) !== JSON.stringify(RM.generateRealTerrain(seed * 7919, idx))) nonDet++
        seen[RM.mapTemplateForNode(seed * 7919, idx).template.id] = (seen[RM.mapTemplateForNode(seed * 7919, idx).template.id] || 0) + 1
      }
    }
    const lateIdx = rt.RUN_PATH.length - 1
    const actOneIdx = battleNodes[0]
    res.c2 = {
      maps, blocked, spawnDirty, nonDet, seen,
      templateIds: T.MAP_TEMPLATES.map((t) => t.id),
      actOneTemplates: T.templatesForAct(rt.actIndexForNode(actOneIdx, rt.RUN_PATH.length)).map((t) => t.id),
      lateTemplates: T.templatesForAct(rt.actIndexForNode(lateIdx, rt.RUN_PATH.length)).length,
    }
  }

  // 3. Barricades: block movement, take hits, break to rubble (+ event).
  {
    const s = st([P("p", 4, 8, { attack: 5, move: 3 })], { "4-7": "wall", "3-7": "wall", "5-7": "wall" })
    const reach = E.reachableTilesFor(s, "p")
    const hit1 = E.attackWall(s, "p", { row: 4, col: 7 })
    const hit2 = E.attackWall(hit1, "p", { row: 4, col: 7 })
    const tooFar = E.attackWall(s, "p", { row: 4, col: 5 })
    const lastEv = hit2.events[hit2.events.length - 1]
    res.c3 = {
      wallBlocks: !has(reach, { row: 4, col: 7 }),
      targets: E.wallTargetsFor(s, "p").length,
      hp1: E.wallHpAt(hit1, { row: 4, col: 7 }),
      ap1: posOf(hit1, "p") && hit1.units[0].ap,
      after2: hit2.terrain["4-7"],
      hpGone: hit2.wallHp["4-7"] === undefined,
      ev: lastEv,
      nowWalkable: has(E.reachableTilesFor({ ...hit2, units: hit2.units.map((u) => ({ ...u, ap: 2 })) }, "p"), { row: 4, col: 7 }),
      log: hit2.log.some((l) => l.includes("smashes the barricade")),
      tooFar: tooFar === s,
      enemySideOnly: E.attackWall({ ...s, phase: "enemy" }, "p", { row: 4, col: 7 }).terrain["4-7"] === "wall",
    }
  }

  // 4. AI: values high ground, avoids lava, heads for the bridge, and only
  //    hits a barricade when it walls the enemy off.
  {
    const intentOf = (s, id) => E.previewEnemyIntents(s).find((i) => i.enemyId === id)?.intent
    const players = [P("p1", 4, 10)]
    const baseline = intentOf(st([En("e", 4, 2, { move: 2 }), ...players]), "e")
    const lavaOnPath = intentOf(st([En("e", 4, 2, { move: 2 }), ...players], { [`${baseline.to.row}-${baseline.to.col}`]: "lava" }), "e")
    // Ranged enemy: of the tiles it can shoot from, it climbs the high one.
    const highState = st([En("e", 4, 4, { move: 2, range: 3 }), P("p1", 4, 8)], { "3-5": "high" })
    const highIntent = intentOf(highState, "e")
    // River at col 5 with a bridge at row 0: the enemy walks toward the bridge.
    const river = {}
    for (let row = 0; row < 9; row++) river[`${row}-5`] = row === 0 ? "bridge" : "water"
    const riverIntent = intentOf(st([En("e", 6, 3, { move: 2 }), ...players], river), "e")
    // Full palisade at col 5: blocked -> strikes the wall.
    const palisade = {}
    for (let row = 0; row < 9; row++) palisade[`${row}-5`] = "wall"
    const wallState = st([En("e", 4, 3, { move: 2, attack: 3 }), ...players], palisade)
    const wallIntent = intentOf(wallState, "e")
    const afterWall = E.endPlayerTurn(wallState)
    // A wall with an easy detour next to it: not blocked -> just walks.
    const detour = intentOf(st([En("e", 4, 3, { move: 2 }), ...players], { "4-4": "wall" }), "e")
    res.c4 = {
      baseline,
      lavaOnPath,
      lavaTile: lavaOnPath.to ? `${lavaOnPath.to.row}-${lavaOnPath.to.col}` : null,
      highIntent,
      riverIntent,
      wallIntent,
      wallHpAfter: E.wallHpAt(afterWall, wallIntent.pos || { row: 0, col: 0 }),
      detour,
    }
  }

  // 5. Preview == real on a feature map (real run battle, 5 enemy turns).
  {
    const idx = rt.RUN_PATH.findIndex((n) => n.type === "battle" && n.formationId)
    const rs = {
      ...rt.startRun("tommy", null, { forcedSeed: 4242 }),
      nodeIndex: idx,
      path: rt.RUN_PATH.slice(0, idx + 1),
      phase: "formation",
      bench: [
        { key: "b0", defId: "the-fool", upgradeLevel: 0, upgrades: [] },
        { key: "b1", defId: "hexbreaker", upgradeLevel: 0, upgrades: [] },
      ],
      deployed: ["b0", "b1", null, null],
      items: [],
      lastSeenAct: rt.actIndexForNode(idx, rt.RUN_PATH.length),
    }
    const built = rt.startTacticsFormationBattle(rs, (s) => RM.buildRunTacticsBattle(rs, s)).battle
    const terrain = {
      "2-4": "high", "3-4": "high", "4-5": "lava", "5-5": "lava", "1-6": "wall", "6-6": "wall", "7-6": "wall",
      "3-7": "bush", "4-7": "ice", "5-7": "ice", "0-5": "bridge", "8-5": "water", "2-6": "rubble",
    }
    let s = { ...built, terrain, wallHp: {} }
    const rows = []
    for (let turn = 0; turn < 5 && s.phase === "player"; turn++) {
      const preview = E.previewEnemyIntents(s)
      const after = E.endPlayerTurn(s)
      for (const { enemyId, intent } of preview) {
        const before = s.units.find((u) => u.id === enemyId)
        const now = after.units.find((u) => u.id === enemyId)
        if (!now || now.hp <= 0) continue
        let ok = true
        const at = (p) => now.pos.row === p.row && now.pos.col === p.col
        if (intent.kind === "move" || intent.kind === "move-attack" || (intent.kind === "wall" && intent.to)) {
          ok = at(T.slideLanding(s, enemyId, before.pos, intent.to)) || at(intent.to)
        } else if (intent.kind === "hold" || (intent.kind === "attack" && !intent.retreat) || (intent.kind === "wall" && !intent.to)) ok = at(before.pos)
        if (intent.kind === "wall") ok = ok && (after.terrain[`${intent.pos.row}-${intent.pos.col}`] === "rubble" || E.wallHpAt(after, intent.pos) < E.wallHpAt(s, intent.pos))
        rows.push({ turn, enemyId, kind: intent.kind, ok })
      }
      s = after
    }
    res.c5 = { rows: rows.length, bad: rows.filter((x) => !x.ok), kinds: [...new Set(rows.map((x) => x.kind))], stable: JSON.stringify(E.previewEnemyIntents(s)) === JSON.stringify(E.previewEnemyIntents(s)) }
  }
  return res
})
out.engine = r

const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const c1 = r.c1
if (!(c1.rangeFlat === 2 && c1.rangeHigh === 3 && c1.meleeHighRange === 1 && c1.targetsFlat === 0 && c1.targetsHigh === 1))
  out.errors.push("check1a high ground range")
if (!(c1.hitHigh > c1.hitFlat && c1.hitHigh - c1.hitFlat >= 1)) out.errors.push("check1b high ground damage bonus")
if (!(c1.climbAdjacent && !c1.climbTwo)) out.errors.push("check1c high ground climb cost")
if (!(c1.bridge && !c1.water && c1.acrossViaBridge)) out.errors.push("check1d bridge/river")
if (!(c1.bushFar === 0 && c1.bushNear === 1 && c1.bushFarAttack)) out.errors.push("check1e tall grass cover")
if (!(c1.lavaHp === 17 && c1.lavaLog && c1.lavaDeployBlocked)) out.errors.push("check1f lava burn")
if (!(eq(c1.icePos, { row: 4, col: 5 }) && eq(c1.iceBlockedPos, { row: 4, col: 6 }))) out.errors.push("check1g ice slide")
const c2 = r.engine?.c2 || r.c2
if (!(c2.blocked === 0 && c2.spawnDirty === 0 && c2.nonDet === 0 && c2.templateIds.every((id) => c2.seen[id] > 0) && c2.actOneTemplates.length === 4 && c2.lateTemplates === 6))
  out.errors.push("check2 generation: path always exists / templates / spawn columns")
const c3 = r.c3
if (!(c3.wallBlocks && c3.targets === 3 && c3.hp1 === 3 && c3.ap1 === 1 && c3.after2 === "rubble" && c3.hpGone && c3.ev.kind === "wall" && c3.ev.broke && c3.nowWalkable && c3.log && c3.tooFar && c3.enemySideOnly))
  out.errors.push("check3 barricade HP / break")
const c4 = r.c4
const isHighTo = c4.highIntent.kind === "move-attack" && c4.highIntent.to.row === 3 && c4.highIntent.to.col === 5
if (!(c4.baseline.kind === "move" && c4.lavaOnPath.kind === "move" && c4.lavaTile !== `${c4.baseline.to.row}-${c4.baseline.to.col}` && isHighTo))
  out.errors.push("check4a AI avoids lava / values high ground")
if (!(c4.riverIntent.kind === "move" && c4.riverIntent.to.row < 6)) out.errors.push("check4b AI heads for the bridge")
if (!(c4.wallIntent.kind === "wall" && c4.wallHpAfter === 5 && c4.detour.kind === "move")) out.errors.push("check4c AI strikes a wall only when walled off")
const c5 = r.c5
if (!(c5.rows >= 5 && c5.bad.length === 0 && c5.stable)) out.errors.push("check5 preview == real on a feature map")

// 6. UI: tile tooltip, wall HP bar, click-to-hit, "Wall breaks!" callout, legend.
{
  const p = await newPage()
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
  await p.waitForTimeout(500)
  await p.locator(".hw-tactics-start").click()
  await p.waitForTimeout(500)
  await p.locator(".hwt-begin-battle").click()
  await p.waitForTimeout(300)
  // Put two barricades + high ground + lava next to the Fool in the live save.
  const setup = await p.evaluate(() => {
    const save = JSON.parse(localStorage.getItem("heartwood-run-save-v1"))
    const b = save.run.battle
    const fool = b.units.find((u) => u.id === "player-the-fool-0")
    const { row, col } = fool.pos
    const up = row > 0 ? row - 1 : row + 1
    const down = row < 8 ? row + 1 : row - 2
    b.terrain = { ...b.terrain, [`${up}-${col - 1}`]: "wall", [`${down}-${col - 1}`]: "wall", [`${row}-${col - 2}`]: "high", [`${row}-${col - 1}`]: "path" }
    delete b.terrain[`${row}-${col - 1}`]
    b.wallHp = { [`${down}-${col - 1}`]: 1 }
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(save))
    return { wallA: `${up}-${col - 1}`, wallB: `${down}-${col - 1}`, high: `${row}-${col - 2}`, fool: fool.pos, attack: fool.attack }
  })
  await p.reload({ waitUntil: "domcontentloaded" })
  await p.waitForTimeout(700)
  const cellOf = (key) => {
    const [row, col] = key.split("-").map(Number)
    return p.locator(".hwt-cell").nth(row * 12 + col)
  }
  const wallTitle = await cellOf(setup.wallA).getAttribute("title")
  const highTitle = await cellOf(setup.high).getAttribute("title")
  const hpText = await cellOf(setup.wallA).locator(".hwt-wall-hp-num").textContent()
  const legend = await p.locator(".hwt-terrain-legend-item").allTextContents()
  await p.locator('.hwt-token[data-unit-id="player-the-fool-0"]').click()
  await p.waitForTimeout(200)
  const targetable = await cellOf(setup.wallA).getAttribute("data-wall-targetable")
  await cellOf(setup.wallA).click()
  await p.waitForTimeout(150)
  const hitFx = await cellOf(setup.wallA).locator('.hwt-wall-fx[data-kind="hit"]').count()
  const hpAfter = await cellOf(setup.wallA).locator(".hwt-wall-hp-num").textContent()
  await p.locator('.hwt-token[data-unit-id="player-the-fool-0"]').click().catch(() => {})
  await p.waitForTimeout(150)
  await cellOf(setup.wallB).click()
  await p.waitForTimeout(150)
  const breakFx = await cellOf(setup.wallB).locator('.hwt-wall-fx[data-kind="break"]').textContent().catch(() => null)
  const brokenTerrain = await cellOf(setup.wallB).getAttribute("data-terrain")
  await p.screenshot({ path: new URL("./shots/sprint_terrain_ui.png", import.meta.url).pathname }).catch(() => {})
  await p.close()
  out.ui = { setup, wallTitle, highTitle, hpText, legend, targetable, hitFx, hpAfter, breakFx, brokenTerrain }
  const expectHp = String(Math.max(0, 8 - Math.max(1, setup.attack)))
  if (!(wallTitle?.startsWith("Barricade:") && wallTitle.includes("8/8 HP") && highTitle?.startsWith("High ground:") && hpText === "8"))
    out.errors.push("check6a tile tooltips / wall HP")
  if (!(legend.includes("Barricade") && legend.includes("High ground"))) out.errors.push("check6b battlefield legend")
  if (!(targetable === "true" && hitFx === 1 && hpAfter === expectHp && breakFx === "Wall breaks!" && brokenTerrain === "rubble"))
    out.errors.push("check6c click-to-hit wall + break callout")
}

out.pageErrors = errs
await browser.close()
console.log(JSON.stringify(out, null, 2))
console.log(out.errors.length === 0 && errs.length === 0 ? "ALL PASS" : "FAIL")
