import { chromium } from "playwright"

// XCOM part 1 (feat/hearthwood-xcom-1): roles in battle, squad bar, aggro
// lines, healer ring, blue/yellow move bands + path preview, universal
// Overwatch / Hunker Down, role-aware enemy AI. Engine checks import the
// real modules in-page; UI checks drive /heartwood-tactics.
const PORT = process.env.PORT || 5445
const SHOT = process.env.SHOT || ".scratch/shots/xcom_1_selected.png"
const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1500, height: 1100 } })).newPage()
const errs = []
page.on("pageerror", (e) => errs.push(String(e)))
page.on("console", (m) => m.type() === "error" && !/ERR_CONNECTION_REFUSED|Failed to load resource/.test(m.text()) && errs.push(m.text()))
// The CURRENT fiber of a component (a DOM node's own fiber can be stale).
await page.addInitScript(() => {
  window.__xf = (name) => {
    const el = document.getElementById("root")
    const stack = [el[Object.keys(el).find((k) => k.startsWith("__reactContainer$"))].stateNode.current]
    while (stack.length) {
      const f = stack.pop()
      if (f.type?.name === name) return f
      if (f.sibling) stack.push(f.sibling)
      if (f.child) stack.push(f.child)
    }
    return null
  }
})
const checks = []
const check =(name, ok, detail) => checks.push({ name, ok: !!ok, detail })

await page.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
await page.waitForSelector(".hwt-board .hwt-token", { timeout: 30000 })

// ---------- Engine ----------
const eng = await page.evaluate(async () => {
  const E = await import("/src/services/heartwood/tacticsEngine.js")
  const R = await import("/src/services/heartwood/tacticsRoles.js")
  const { ENEMIES } = await import("/src/data/heartwood/enemies.js")
  const { UNITS } = await import("/src/data/heartwood/units.js")
  const { CLASS_IDS } = await import("/src/data/heartwood/classes.js")
  const r = {}
  // 1. Role coverage.
  const bad = []
  const dist = {}
  for (const id of Object.keys(ENEMIES)) {
    const u = E.deriveTacticsUnit(id, "enemy", { row: 0, col: 0 }, id)
    const role = R.roleOf(u)
    if (!R.ROLE_IDS.includes(role)) bad.push(id)
    dist[`enemy:${role}`] = (dist[`enemy:${role}`] || 0) + 1
  }
  for (const id of Object.keys(UNITS)) {
    const u = E.deriveTacticsUnit(id, "player", { row: 0, col: 0 }, id)
    const role = R.roleOf(u)
    if (!R.ROLE_IDS.includes(role)) bad.push(id)
    dist[`player:${role}`] = (dist[`player:${role}`] || 0) + 1
  }
  r.roles = { bad, dist, classesMissing: CLASS_IDS.filter((c) => !R.classRole(c)), nEnemies: Object.keys(ENEMIES).length, nUnits: Object.keys(UNITS).length }

  // Synthetic-state helpers (same shape as verify_sprint_enemy_ai).
  const base = E.createTacticsBattle()
  const clean = {
    block: 0, ward: 0, revive: 0, bulwark: 0, taunt: 0, poison: 0, weak: 0, vulnerable: 0, slow: 0, root: 0, suppressed: 0, stun: 0,
    execute: 0, shatter: 0, woundedFury: 0, leech: false, poisonOnHit: 0, nimble: false, phases: [], phaseIndex: 0, triggers: [],
    aoeMove: null, charge: null, covenAura: null, cultRitual: null, cultFodder: false, broodSplit: null, className: null,
    ap: 2, apMax: 2, regen: 0, enemySkills: [], overwatch: 0, hunkered: 0, classPassive: null, classSkills: [], perks: [],
  }
  const pTpl = base.units.find((u) => u.side === "player")
  const eTpl = base.units.find((u) => u.side === "enemy")
  const mk = (tpl, id, side, row, col, extra = {}) => ({
    ...tpl, ...clean, id, side, name: id, pos: { row, col }, hp: 30, maxHp: 30, attack: 5, baseAttack: 5, range: 1, move: 2,
    facing: side === "player" ? "W" : "E", ...extra,
  })
  const P = (id, row, col, extra) => mk(pTpl, id, "player", row, col, extra)
  const En = (id, row, col, extra) => mk(eTpl, id, "enemy", row, col, extra)
  const st = (units, phase = "player") => ({ ...base, units, terrain: {}, phase, turn: 1, log: [], events: [], eventSeq: 0 })
  const get = (s, id) => s.units.find((u) => u.id === id)

  // 2. Blue/yellow bands == real AP spent (every tile clicked for real).
  {
    const s = st([P("p1", 4, 8, { move: 2 }), En("e1", 4, 1, { move: 1 })])
    const opts = E.moveOptionsFor(s, "p1")
    const reach1 = new Set(E.reachableTilesFor(s, "p1").map((p) => `${p.row}-${p.col}`))
    let mismatch = []
    let blue = 0, yellow = 0, dash = 0
    for (const [key, o] of opts) {
      const after = o.dash ? E.dashMove(s, "p1", o.pos) : E.moveUnit(s, "p1", o.pos)
      const moved = get(after, "p1")
      const spent = 2 - moved.ap
      const at = `${moved.pos.row}-${moved.pos.col}`
      if (spent !== o.apCost || at !== key || (o.band === "blue") !== moved.ap >= 1 || o.dash === reach1.has(key)) mismatch.push({ key, o, spent, at })
      if (o.band === "blue") blue++
      else yellow++
      if (o.dash) dash++
    }
    const path = E.movePathFor(s, "p1", [...opts.values()].find((o) => o.dash).pos, opts)
    const pathOk = path && path.path.every((p, i) => i === 0 || Math.max(Math.abs(p.row - path.path[i - 1].row), Math.abs(p.col - path.path[i - 1].col)) === 1)
    r.bands = { mismatch, blue, yellow, dash, reach1: reach1.size, path, pathOk }
    // 1-AP unit: no yellow dash tiles at all.
    const s1 = st([P("p1", 4, 8, { move: 2, ap: 1 }), En("e1", 4, 1)])
    r.bands.oneAp = [...E.moveOptionsFor(s1, "p1").values()].filter((o) => o.dash).length
  }

  // 3. Universal Overwatch: player (ranged) shoots an enemy ending a move in reach; exact damage.
  {
    const s = st([P("archer", 4, 8, { range: 3, attack: 6 }), En("e1", 4, 3, { move: 2, attack: 1 })])
    const ow = E.overwatchAction(s, "archer")
    const aiIntent = E.previewEnemyIntents(ow).find((i) => i.enemyId === "e1")?.intent
    const afterEnemy = E.moveUnit({ ...ow, phase: "enemy" }, "e1", { row: 4, col: 5 })
    const e = get(afterEnemy, "e1")
    const shotLine = afterEnemy.log.find((l) => /Overwatch fires/.test(l))
    const callout = (afterEnemy.events || []).some((ev) => ev.kind === "reaction" && ev.label === "Overwatch!")
    const again = E.moveUnit({ ...afterEnemy, units: afterEnemy.units.map((u) => (u.id === "e1" ? { ...u, ap: 2 } : u)) }, "e1", { row: 4, col: 6 })
    r.overwatch = { apAfterAction: get(ow, "archer").ap, flag: get(ow, "archer").overwatch, enemyHp: e.hp, enemyPos: e.pos, shotLine, callout, archerFlagAfter: get(afterEnemy, "archer").overwatch, secondMoveHp: get(again, "e1").hp, aiIntent }
    // Melee overwatch: adjacent tiles only.
    const m = st([P("knight", 4, 6, { attack: 7 }), En("e2", 4, 3, { move: 2, attack: 1 })])
    const mOw = { ...E.overwatchAction(m, "knight"), phase: "enemy" }
    const notAdj = E.moveUnit(mOw, "e2", { row: 4, col: 4 })
    const adj = E.moveUnit(notAdj, "e2", { row: 4, col: 5 })
    r.overwatch.melee = { notAdjHp: get(notAdj, "e2").hp, hp: get(adj, "e2").hp }
    // preview == real: an enemy dives a killable unit through the archer's watch.
    const pv = st([P("archer", 4, 8, { range: 3, attack: 6 }), P("soft", 4, 6, { hp: 5, move: 3 }), En("e1", 4, 3, { move: 2, attack: 50 })])
    const pvOw = E.overwatchAction(pv, "archer")
    const intents = E.previewEnemyIntents(pvOw)
    const real = E.endPlayerTurn(pvOw)
    const i1 = intents.find((i) => i.enemyId === "e1")?.intent
    r.overwatch.preview = {
      intents,
      ok: i1?.kind === "move-attack" && JSON.stringify(i1.to) === JSON.stringify(get(real, "e1").pos) && get(real, "soft").hp <= 0,
      realHp: get(real, "e1").hp,
      shot: real.log.some((l) => /Overwatch fires/.test(l)),
    }
  }

  // 4. Hunker Down: exactly half (rounded up) of the same hit.
  {
    const mkS = (hunker) => {
      let s = st([P("p1", 4, 5, { attack: 3 }), En("e1", 4, 4, { attack: 9, move: 1 })])
      if (hunker) s = E.hunkerDown(s, "p1")
      return s
    }
    const plain = E.endPlayerTurn(mkS(false))
    const hunk = E.endPlayerTurn(mkS(true))
    const hunkState = E.hunkerDown(mkS(false), "p1")
    const pvHunk = E.previewEnemyIntents(hunkState)
    r.hunker = {
      plainDmg: 30 - get(plain, "p1").hp,
      hunkDmg: 30 - get(hunk, "p1").hp,
      ap: get(hunkState, "p1").ap,
      flagAfterTurn: get(hunk, "p1").hunkered,
      pvHunk,
    }
  }

  // 5. Enemy overwatch: a ranged enemy with no shot holds on Overwatch and shoots a player that steps in.
  {
    const s = st([En("sniper", 4, 1, { range: 3, move: 1, attack: 4 }), P("p1", 4, 6, { move: 2 })])
    const intent = E.previewEnemyIntents(s).find((i) => i.enemyId === "sniper")?.intent
    const after = E.endPlayerTurn(s)
    const sn = get(after, "sniper")
    // Player walks into reach (col 4 is 3 tiles from col 1).
    const walked2 = E.moveUnit(after, "p1", { row: 4, col: 4 })
    r.enemyOw = { intent, snOw: sn.overwatch, snPos: sn.pos, p1HpBefore: get(after, "p1").hp, p1HpAfter: get(walked2, "p1").hp, log: walked2.log.slice(-3) }
  }

  // 6. Role-aware AI: an enemy healer heals a hurt ally instead of hitting.
  {
    const mend = [{ kind: "mend", id: "mend", name: "Sap Mend", amount: 6, cooldown: 2 }]
    const s = st([
      En("healer", 4, 2, { enemySkills: mend, range: 1, move: 2 }),
      En("brute", 4, 4, { hp: 18, maxHp: 30 }),
      P("p1", 4, 5, { hp: 30 }),
      P("p2", 3, 3, { hp: 12 }),
    ])
    const hi = E.previewEnemyIntents(s).find((i) => i.enemyId === "healer")?.intent
    const after = E.endPlayerTurn(s)
    const roleHealer = R.roleOf(get(s, "healer"))
    // Same unit WITHOUT the mend kit (plain DPS) - it attacks p2.
    const s2 = st([En("healer", 4, 2, { range: 1, move: 2 }), En("brute", 4, 4, { hp: 18, maxHp: 30 }), P("p1", 4, 5), P("p2", 3, 3, { hp: 12 })])
    const di = E.previewEnemyIntents(s2).find((i) => i.enemyId === "healer")?.intent
    r.healerAi = { roleHealer, hi, bruteHp: get(after, "brute").hp, dpsIntent: di }
    // Healer with nobody hurt stays back instead of charging.
    const s3 = st([En("healer", 4, 1, { enemySkills: mend, move: 2 }), En("brute", 4, 3), P("p1", 4, 8), P("p2", 2, 8)])
    const i3 = E.previewEnemyIntents(s3).find((i) => i.enemyId === "healer")?.intent
    const end3 = get(E.endPlayerTurn(s3), "healer")
    r.healerAi.idle = { i3, pos: end3.pos, brute: get(E.endPlayerTurn(s3), "brute").pos }
  }

  // 7. Role-aware AI: an enemy tank moves in front of its archer.
  {
    const s = st([En("tank", 4, 1, { hp: 60, maxHp: 60, move: 2 }), En("archer", 4, 2, { range: 3, move: 2, hp: 18, maxHp: 18 }), P("p1", 4, 10, { move: 2 }), P("p2", 5, 10, { move: 2 })])
    const after = E.endPlayerTurn(s)
    const t = get(after, "tank")
    const a = get(after, "archer")
    const near = (u) => Math.min(...after.units.filter((x) => x.side === "player").map((p) => Math.max(Math.abs(p.pos.row - u.pos.row), Math.abs(p.pos.col - u.pos.col))))
    r.tankAi = { role: R.roleOf(get(s, "tank")), tank: t.pos, archer: a.pos, tankNear: near(t), archerNear: near(a) }
  }

  // 8. DPS enemies dive the healer: equal targets, healer role wins.
  {
    const healerDef = E.createTacticsBattle().units.find((u) => u.side === "player" && R.roleOf(u) === "healer")
    const s = st([En("dps", 4, 4, { attack: 3 }), P("tanky", 3, 5), { ...P("medic", 5, 5), classId: healerDef?.classId || "healer", classSkills: healerDef?.classSkills || [] }])
    const i = E.previewEnemyIntents(s).find((x) => x.enemyId === "dps")?.intent
    r.dive = { medicRole: R.roleOf(get(s, "medic")), tankyRole: R.roleOf(get(s, "tanky")), target: i?.targetId }
  }

  // 9. Heal reach numbers.
  const b = E.createTacticsBattle()
  r.healReach = b.units.filter((u) => u.side === "player").map((u) => ({ id: u.id, role: R.roleOf(u), reach: R.healReach(u) }))
  return r
})

check("roles: every enemy + unit maps to one of the 5 roles", eng.roles.bad.length === 0 && eng.roles.classesMissing.length === 0, eng.roles)
check("bands: blue/yellow + dash exactly match real AP spent / landing tile", eng.bands.mismatch.length === 0 && eng.bands.blue > 0 && eng.bands.yellow > 0 && eng.bands.dash > 0, eng.bands.mismatch.slice(0, 3))
check("bands: a 1-AP unit has no dash tiles", eng.bands.oneAp === 0, eng.bands.oneAp)
check("path: dash route is a connected step-by-step path with AP cost 2", eng.bands.pathOk && eng.bands.path.apCost === 2 && eng.bands.path.band === "yellow", eng.bands.path)
check("overwatch: action ends turn, sets the watch", eng.overwatch.apAfterAction === 0 && eng.overwatch.flag === 1, eng.overwatch)
check("overwatch: fires on an enemy ending its move in reach, for the unit's attack, with callout", eng.overwatch.shotLine && eng.overwatch.callout && eng.overwatch.enemyHp === 30 - 6 && eng.overwatch.archerFlagAfter === 0 && eng.overwatch.secondMoveHp === 24 && !(eng.overwatch.aiIntent?.to && Math.abs(eng.overwatch.aiIntent.to.col - 8) <= 3), eng.overwatch)
check("overwatch: melee watcher hits an enemy that ends adjacent", eng.overwatch.melee.notAdjHp === 30 && eng.overwatch.melee.hp === 30 - 7, eng.overwatch.melee)
check("overwatch: preview == real with a watcher on the board", eng.overwatch.preview.ok && eng.overwatch.preview.shot, eng.overwatch.preview)
check("hunker: halves the incoming hit (rounded up) and ends the turn", eng.hunker.plainDmg > 0 && eng.hunker.hunkDmg === Math.ceil(eng.hunker.plainDmg / 2) && eng.hunker.ap === 0 && eng.hunker.flagAfterTurn === 0, eng.hunker)
check("enemy overwatch: ranged enemy with no shot goes on Overwatch (telegraphed) and shoots a player stepping into reach", eng.enemyOw.intent?.kind === "overwatch" && eng.enemyOw.snOw > 0 && eng.enemyOw.p1HpAfter === eng.enemyOw.p1HpBefore - 4, eng.enemyOw)
check("role AI: enemy healer mends its hurt ally instead of attacking", eng.healerAi.roleHealer === "healer" && eng.healerAi.hi?.skillKind === "mend" && eng.healerAi.bruteHp > 18 && ["attack", "move-attack"].includes(eng.healerAi.dpsIntent?.kind), eng.healerAi)
check("role AI: idle enemy healer does not charge past its front line", eng.healerAi.idle.pos.col <= eng.healerAi.idle.brute.col, eng.healerAi.idle)
check("role AI: enemy tank ends in front of its archer", eng.tankAi.role === "tank" && eng.tankAi.tankNear <= eng.tankAi.archerNear, eng.tankAi)
check("role AI: enemy DPS dives the healer over an equal non-healer", eng.dive.medicRole === "healer" && eng.dive.target === "medic", eng.dive)

// ---------- UI ----------
const readBattle = () =>
  page.evaluate(() => {
    const board = document.querySelector(".hwt-board")
    let f = board[Object.keys(board).find((k) => k.startsWith("__reactFiber$"))]
    f = window.__xf("TacticsBoard")
    return f ? f.memoizedProps.battle : null
  })

const ui1 = await page.evaluate(async () => {
  const R = await import("/src/services/heartwood/tacticsRoles.js")
  const tokens = [...document.querySelectorAll(".hwt-board .hwt-token")]
  const colors = {}
  for (const t of tokens) {
    const role = t.dataset.role
    colors[role] = colors[role] || getComputedStyle(t).borderTopColor
  }
  return {
    n: tokens.length,
    withRole: tokens.filter((t) => R.ROLE_IDS.includes(t.dataset.role)).length,
    icons: tokens.filter((t) => t.querySelector(".hwt-role-icon")).length,
    enemyRoles: tokens.filter((t) => t.dataset.side === "enemy").map((t) => t.dataset.role),
    titles: tokens.filter((t) => /Tank|Healer|DPS|Support|Control/.test(t.title)).length,
    colors,
  }
})
check("ui: every token has a role frame + big role icon + role tooltip", ui1.n > 0 && ui1.withRole === ui1.n && ui1.icons === ui1.n && ui1.titles === ui1.n && ui1.enemyRoles.length > 0, ui1)
check("ui: role frame colours are distinct per role", new Set(Object.values(ui1.colors)).size === Object.keys(ui1.colors).length, ui1.colors)

// Squad bar selects.
const slots = await page.locator(".hwt-sb-slot").count()
let b0 = await readBattle()
const squadIds = b0.units.filter((u) => u.side === "player" && !u.npc && !u.structure).map((u) => u.id)
await page.locator(".hwt-sb-slot").nth(1).click()
await page.waitForTimeout(200)
const sel = await page.evaluate(() => ({
  token: document.querySelector('.hwt-token[data-selected="true"]')?.dataset.unitId,
  slot: document.querySelector('.hwt-sb-slot[data-selected="true"]')?.dataset.unitId,
  role: document.querySelector(".hwt-selected-role")?.textContent,
}))
check("squad bar: one slot per squad unit, click selects that unit, card shows role + what it does", slots === squadIds.length && sel.token === squadIds[1] && sel.slot === squadIds[1] && /Tank|Healer|DPS|Support|Control/.test(sel.role || "") && (sel.role || "").length > 20, { slots, squadIds, sel })

// Blue/yellow tiles on the board == engine options; data-reachable unchanged.
const ui2 = await page.evaluate(async (id) => {
  const E = await import("/src/services/heartwood/tacticsEngine.js")
  const board = document.querySelector(".hwt-board")
  let f = board[Object.keys(board).find((k) => k.startsWith("__reactFiber$"))]
  f = window.__xf("TacticsBoard")
  const battle = f.memoizedProps.battle
  const opts = E.moveOptionsFor(battle, id)
  const reach = new Set(E.reachableTilesFor(battle, id).map((p) => `${p.row}-${p.col}`))
  const cells = [...document.querySelectorAll(".hwt-cell")]
  const bad = []
  for (const c of cells) {
    const o = opts.get(c.dataset.cell)
    const band = c.dataset.moveBand || null
    if ((o?.band || null) !== band || (o ? String(o.apCost) : undefined) !== c.dataset.moveCost || (c.dataset.reachable === "true") !== reach.has(c.dataset.cell)) bad.push(c.dataset.cell)
  }
  return { bad, blue: cells.filter((c) => c.dataset.moveBand === "blue").length, yellow: cells.filter((c) => c.dataset.moveBand === "yellow").length }
}, sel.token)
check("ui: blue/yellow cells match engine AP costs exactly, data-reachable kept", ui2.bad.length === 0 && ui2.blue > 0 && ui2.yellow > 0, ui2)

// Hover a yellow tile -> path + AP cost label.
const yellowCell = page.locator('.hwt-cell[data-move-band="yellow"][data-dash="true"]').first()
await yellowCell.hover()
await page.waitForTimeout(200)
const pathUi = await page.evaluate(() => ({
  path: document.querySelector(".hwt-path")?.dataset.apCost,
  band: document.querySelector(".hwt-path")?.dataset.band,
  label: document.querySelector(".hwt-path-cost text")?.textContent,
  cells: document.querySelectorAll('.hwt-cell[data-path="true"]').length,
}))
check("ui: hovering a dash tile draws the path with its AP cost", pathUi.path === "2" && pathUi.band === "yellow" && /2 AP/.test(pathUi.label || "") && pathUi.cells >= 3, pathUi)

// Aggro lines == preview attack targets.
const aggro = await page.evaluate(async () => {
  const E = await import("/src/services/heartwood/tacticsEngine.js")
  const board = document.querySelector(".hwt-board")
  let f = board[Object.keys(board).find((k) => k.startsWith("__reactFiber$"))]
  f = window.__xf("TacticsBoard")
  const battle = f.memoizedProps.battle
  const want = []
  for (const { enemyId, intent: raw } of E.previewEnemyIntents(battle)) {
    const i = raw.then || raw
    if ((i.kind === "attack" || i.kind === "move-attack" || (i.kind === "skill" && ["hex", "pounce"].includes(i.skillKind))) && battle.units.find((u) => u.id === i.targetId)?.side === "player") want.push(`${enemyId}>${i.targetId}`)
  }
  const got = [...document.querySelectorAll(".hwt-aggro-line")].map((l) => `${l.dataset.enemyId}>${l.dataset.targetId}`)
  return { want: want.sort(), got: got.sort() }
})
// Move everyone closer so the plan includes attacks if it has none yet.
check("ui: aggro lines match the enemy preview's targets exactly", JSON.stringify(aggro.want) === JSON.stringify(aggro.got), aggro)

// Put the squad in contact so aggro lines + tank zones actually show, then screenshot.
await page.evaluate(async () => {
  const board = document.querySelector(".hwt-board")
  let f = board[Object.keys(board).find((k) => k.startsWith("__reactFiber$"))]
  f = window.__xf("HeartwoodTactics")
  const hook = f.memoizedState.next
  const cur = hook.memoizedState
  const players = cur.units.filter((u) => u.side === "player")
  const enemies = cur.units.filter((u) => u.side === "enemy")
  const units = cur.units.map((u) => {
    const pi = players.indexOf(u)
    if (pi >= 0) return { ...u, pos: { row: 2 + pi, col: 7 + (pi % 2) } }
    const ei = enemies.indexOf(u)
    return { ...u, pos: { row: 2 + ei, col: 4 + (ei % 2) } }
  })
  hook.queue.dispatch({ ...cur, units })
  await new Promise((res) => setTimeout(res, 300))
})
const aggro2 = await page.evaluate(async () => {
  const E = await import("/src/services/heartwood/tacticsEngine.js")
  const board = document.querySelector(".hwt-board")
  let f = board[Object.keys(board).find((k) => k.startsWith("__reactFiber$"))]
  f = window.__xf("TacticsBoard")
  const battle = f.memoizedProps.battle
  const want = []
  for (const { enemyId, intent: raw } of E.previewEnemyIntents(battle)) {
    const i = raw.then || raw
    if ((i.kind === "attack" || i.kind === "move-attack" || (i.kind === "skill" && ["hex", "pounce"].includes(i.skillKind))) && battle.units.find((u) => u.id === i.targetId)?.side === "player") want.push(`${enemyId}>${i.targetId}`)
  }
  const got = [...document.querySelectorAll(".hwt-aggro-line")].map((l) => `${l.dataset.enemyId}>${l.dataset.targetId}`)
  return { want: want.sort(), got: got.sort(), tankZones: document.querySelectorAll(".hwt-tank-zone").length }
})
check("ui: in contact, aggro lines drawn and == preview targets; tank zones shown", aggro2.got.length > 0 && JSON.stringify(aggro2.want) === JSON.stringify(aggro2.got) && aggro2.tankZones > 0, aggro2)

// Healer ring == heal reach tiles.
const bNow = await readBattle()
const healer = bNow.units.find((u) => u.side === "player" && u.hp > 0 && u.ap > 0 && ["willowmend", "the-fool"].includes(u.defId))
if (healer) {
  await page.locator(`.hwt-sb-slot[data-unit-id="${healer.id}"]`).click()
  await page.waitForTimeout(200)
}
const ring = await page.evaluate(async (id) => {
  const R = await import("/src/services/heartwood/tacticsRoles.js")
  const E = await import("/src/services/heartwood/tacticsEngine.js")
  const board = document.querySelector(".hwt-board")
  let f = board[Object.keys(board).find((k) => k.startsWith("__reactFiber$"))]
  f = window.__xf("TacticsBoard")
  const battle = f.memoizedProps.battle
  const u = battle.units.find((x) => x.id === id)
  if (!u) return { none: true }
  const reach = R.healReach(u)
  const want = []
  for (let r = 0; r < battle.grid.rows; r++) for (let c = 0; c < battle.grid.cols; c++) if (Math.max(Math.abs(r - u.pos.row), Math.abs(c - u.pos.col)) <= reach) want.push(`${r}-${c}`)
  const got = [...document.querySelectorAll('.hwt-cell[data-heal-ring="true"]')].map((c) => c.dataset.cell)
  // Every ally the heal can actually pick lies inside the ring.
  const healTargets = [...E.abilityTargets(battle, id), ...(u.classSkills || []).filter((s) => s.target === "ally" && s.amount > 0).flatMap((s) => E.abilityTargets(battle, id, s.id))]
  const outside = healTargets.filter((t) => !got.includes(`${t.pos.row}-${t.pos.col}`)).map((t) => t.id)
  return { role: R.roleOf(u), reach, want: want.sort(), got: got.sort(), outside, svgRing: Number(document.querySelector(".hwt-heal-ring")?.dataset.reach) }
}, healer?.id)
check("ui: healer range ring == heal reach tiles (and holds every heal target)", !ring.none && ring.role === "healer" && ring.reach >= 1 && ring.svgRing === ring.reach && JSON.stringify(ring.want) === JSON.stringify(ring.got) && ring.outside.length === 0, { ...ring, want: ring.want?.length, got: ring.got?.length })

await page.screenshot({ path: SHOT.replace(".png", "_healer.png"), fullPage: false })

// Screenshot: select a front-line unit so bands + aggro + frames show together.
const shotUnit = (await readBattle()).units.find((u) => u.side === "player" && u.hp > 0 && u.ap > 0 && u.id !== healer?.id)
await page.locator(`.hwt-sb-slot[data-unit-id="${shotUnit.id}"]`).click()
await page.waitForTimeout(250)
const y2 = page.locator('.hwt-cell[data-move-band="yellow"]').first()
if (await y2.count()) await y2.hover()
await page.waitForTimeout(250)
await page.screenshot({ path: SHOT, fullPage: false })

// Universal buttons: Hunker then Overwatch via UI.
const before = await readBattle()
await page.locator('.hwt-universal-btn[data-action="hunker"]').click()
await page.waitForTimeout(250)
const afterH = await readBattle()
const hunkUi = await page.evaluate((id) => ({ badge: !!document.querySelector(`.hwt-token[data-unit-id="${id}"] .hwt-hunker-badge`) }), shotUnit.id)
const nextP = afterH.units.find((u) => u.side === "player" && u.hp > 0 && u.ap > 0 && !u.npc && u.id !== shotUnit.id && u.attack > 0)
await page.locator(`.hwt-sb-slot[data-unit-id="${nextP.id}"]`).click()
await page.waitForTimeout(150)
await page.locator('.hwt-universal-btn[data-action="overwatch"]').click()
await page.waitForTimeout(250)
const afterO = await readBattle()
const owUi = await page.evaluate((id) => ({ badge: !!document.querySelector(`.hwt-token[data-unit-id="${id}"] .hwt-ow-badge`) }), nextP.id)
check(
  "ui: Hunker Down / Overwatch buttons end the unit's turn and show shield / eye icons",
  before.units.find((u) => u.id === shotUnit.id).ap > 0 &&
    afterH.units.find((u) => u.id === shotUnit.id).hunkered === 1 &&
    afterH.units.find((u) => u.id === shotUnit.id).ap === 0 &&
    hunkUi.badge &&
    afterO.units.find((u) => u.id === nextP.id).overwatch === 1 &&
    owUi.badge,
  { hunkUi, owUi },
)

// End turn with those stances live: no page errors, battle continues.
await page.locator(".hwt-end-turn").click()
await page.waitForTimeout(1500)
const endB = await readBattle()
check("ui: end turn with overwatch/hunker live resolves cleanly", ["player", "won", "lost"].includes(endB.phase), endB.phase)

check("no page errors", errs.length === 0, errs.slice(0, 5))
await browser.close()

const failed = checks.filter((c) => !c.ok)
for (const c of checks) console.log(`${c.ok ? "PASS" : "FAIL"} ${c.name}${c.ok ? "" : `\n     ${JSON.stringify(c.detail).slice(0, 900)}`}`)
console.log(`\nroles: ${JSON.stringify(eng.roles.dist)}`)
console.log(`screenshot: ${SHOT}`)
console.log(`${checks.length - failed.length}/${checks.length} PASS`)
process.exit(failed.length ? 1 : 0)
