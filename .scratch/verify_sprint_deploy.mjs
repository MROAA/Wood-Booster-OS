import { chromium } from "playwright"

// Sprint 2 - Deployment phase: the player arranges the squad in its own
// 3 rightmost columns before turn 1. Engine checks via page.evaluate
// import; UI checks on the prototype (?deploy=1) and the real game.
const PORT = process.env.PORT || 5447
const browser = await chromium.launch()
const errs = []
const out = { errors: [] }
const newPage = async () => {
  const p = await browser.newContext({ viewport: { width: 1600, height: 1000 } }).then((c) => c.newPage())
  p.on("pageerror", (e) => errs.push(String(e)))
  return p
}

const page = await newPage()
await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })

const r = await page.evaluate(async () => {
  const E = await import("/src/services/heartwood/tacticsEngine.js")
  const rt = await import("/src/services/heartwood/runEngine.js")
  const { buildRunTacticsBattle } = await import("/src/services/heartwood/tacticsRealMatchup.js")
  const res = {}
  const idx = rt.RUN_PATH.findIndex((n) => n.type === "battle" && n.formationId)
  const rs = {
    ...rt.startRun("tommy", null, { forcedSeed: 777 }),
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
  const built = rt.startTacticsFormationBattle(rs, (s) => buildRunTacticsBattle(rs, s)).battle
  const d = E.enterDeploy(built)
  // 1: deploy keeps the default positions; builders themselves unchanged.
  res.c1 = {
    builtPhase: built.phase,
    protoPhase: E.createTacticsBattle().phase,
    phase: d.phase,
    samePos: JSON.stringify(d.units.map((u) => u.pos)) === JSON.stringify(built.units.map((u) => u.pos)),
    playersInZone: d.units.filter((u) => u.side === "player").every((u) => E.isDeployTile(d, u.pos)),
    enterTwice: E.enterDeploy(E.beginBattle(d)).phase,
  }
  // 2: placeUnit valid / invalid.
  const p0 = d.units.find((u) => u.id === "player-the-fool-0")
  const p1 = d.units.find((u) => u.id === "player-hexbreaker-1")
  const enemy = d.units.find((u) => u.side === "enemy")
  const freeTile = { row: 0, col: 9 }
  const moved = E.placeUnit(d, p0.id, freeTile)
  const swapped = E.placeUnit(d, p0.id, p1.pos)
  const water = E.placeUnit({ ...d, terrain: { "0-10": "water" } }, p0.id, { row: 0, col: 10 })
  const poison = E.placeUnit({ ...d, terrain: { "0-10": "poison" } }, p0.id, { row: 0, col: 10 })
  const rock = E.placeUnit({ ...d, terrain: { "0-10": "rock" } }, p0.id, { row: 0, col: 10 })
  const enemyOnZone = { ...d, units: d.units.map((u) => (u.id === enemy.id ? { ...u, pos: { row: 1, col: 10 } } : u)) }
  res.c2 = {
    moved: moved.units.find((u) => u.id === p0.id).pos,
    swapA: swapped.units.find((u) => u.id === p0.id).pos,
    swapB: swapped.units.find((u) => u.id === p1.id).pos,
    p1Orig: p1.pos,
    p0Orig: p0.pos,
    enemySide: E.placeUnit(d, p0.id, { row: 0, col: 8 }) === d,
    offBoard: E.placeUnit(d, p0.id, { row: 0, col: 12 }) === d,
    enemyOccupied: E.placeUnit(enemyOnZone, p0.id, { row: 1, col: 10 }) === enemyOnZone,
    moveEnemy: E.placeUnit(d, enemy.id, freeTile) === d,
    water: water.units.find((u) => u.id === p0.id).pos,
    poison: poison.units.find((u) => u.id === p0.id).pos,
    rockOk: rock.units.find((u) => u.id === p0.id).pos,
    afterBegin: E.placeUnit(E.beginBattle(d), p0.id, freeTile).units.find((u) => u.id === p0.id).pos,
  }
  // 3: every other action is refused during deploy.
  const target = E.attackableTargets({ ...d, phase: "player" }, p0.id)[0]
  res.c3 = {
    move: E.moveUnit(d, p0.id, { row: p0.pos.row, col: p0.pos.col - 1 }) === d,
    attack: target ? E.attackUnit(d, p0.id, target.id) === d : true,
    ability: E.castAbility(d, p0.id, enemy.id) === d && E.castAbility(d, p0.id) === d,
    endTurn: E.endPlayerTurn(d) === d,
    enemyTurn: E.runEnemyTurn(d) === d,
    power: E.activateCommanderPower(d) === d,
  }
  // 4: Begin -> player turn 1, logged; intents readable during deploy.
  const b = E.beginBattle(moved)
  res.c4 = {
    phase: b.phase,
    turn: b.turn,
    last: b.log[b.log.length - 1],
    keptPos: b.units.find((u) => u.id === p0.id).pos,
    twice: E.beginBattle(b) === b,
    intentsDeploy: E.previewEnemyIntents({ ...d, phase: "player" }).length,
  }
  return res
})
out.engine = r
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const c1 = r.c1
if (!(c1.builtPhase === "player" && c1.protoPhase === "player" && c1.phase === "deploy" && c1.samePos && c1.playersInZone && c1.enterTwice === "player"))
  out.errors.push("check1 deploy start/default positions")
const c2 = r.c2
if (
  !(
    eq(c2.moved, { row: 0, col: 9 }) &&
    eq(c2.swapA, c2.p1Orig) &&
    eq(c2.swapB, c2.p0Orig) &&
    c2.enemySide &&
    c2.offBoard &&
    c2.enemyOccupied &&
    c2.moveEnemy &&
    eq(c2.water, c2.p0Orig) &&
    eq(c2.poison, c2.p0Orig) &&
    eq(c2.rockOk, { row: 0, col: 10 }) &&
    eq(c2.afterBegin, c2.p0Orig)
  )
)
  out.errors.push("check2 placeUnit valid/invalid")
if (!Object.values(r.c3).every(Boolean)) out.errors.push("check3 actions rejected during deploy")
const c4 = r.c4
if (!(c4.phase === "player" && c4.turn === 1 && c4.last === "The battle begins." && eq(c4.keptPos, { row: 0, col: 9 }) && c4.twice && c4.intentsDeploy > 0))
  out.errors.push("check4 beginBattle")
await page.close()

// 5: UI on the prototype (?deploy=1): zone highlighted, intents shown,
// click unit + tile moves it, Begin -> Player Turn 1.
{
  const p = await newPage()
  await p.goto(`http://localhost:${PORT}/heartwood-tactics?deploy=1`, { waitUntil: "domcontentloaded" })
  await p.waitForSelector(".hwt-board", { timeout: 20000 })
  await p.waitForTimeout(300)
  const label = await p.locator(".hwt-turn-label").getAttribute("data-phase")
  const zoneCount = await p.locator('.hwt-cell[data-deploy-zone="true"]').count()
  const intentBadges = await p.locator(".hwt-intent-badge").count()
  const endTurnCount = await p.locator(".hwt-end-turn").count()
  const token = p.locator('.hwt-token[data-side="player"]').first()
  const unitId = await token.getAttribute("data-unit-id")
  await token.click()
  const targets = await p.locator('.hwt-cell[data-deploy-target="true"]').count()
  // Row 0, col 10: a free tile in the deploy zone.
  await p.locator(".hwt-cell").nth(0 * 12 + 10).click()
  await p.waitForTimeout(500)
  const movedHere = await p.locator(".hwt-cell").nth(10).locator(`.hwt-token[data-unit-id="${unitId}"]`).count()
  await p.locator(".hwt-begin-battle").click()
  await p.waitForTimeout(300)
  const after = await p.locator(".hwt-turn-label").innerText()
  const afterPhase = await p.locator(".hwt-turn-label").getAttribute("data-phase")
  const log = await p.locator(".hwt-log p").first().innerText()
  await p.screenshot({ path: "/tmp/claude-1000/-home-marc-Wood-Booster-AI/bb7f551b-ac23-44f6-901f-0ed262880f88/scratchpad/deploy_proto.png" }).catch(() => {})
  await p.close()
  out.ui = { label, zoneCount, intentBadges, endTurnCount, targets, movedHere, after, afterPhase, log }
  if (
    !(
      label === "deploy" &&
      zoneCount >= 20 &&
      intentBadges > 0 &&
      endTurnCount === 0 &&
      targets > 0 &&
      movedHere === 1 &&
      afterPhase === "player" &&
      after.includes("Player Turn 1") &&
      log === "The battle begins."
    )
  )
    out.errors.push("check5 prototype deploy UI")
}

// 6: the real game: Start Battle opens in deploy, the choice survives a
// reload, Begin Battle -> Player Turn 1 and End Turn works.
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
  const phase1 = await p.locator(".hwt-turn-label").getAttribute("data-phase")
  const unitId = "player-the-fool-0"
  await p.locator(`.hwt-token[data-unit-id="${unitId}"]`).click()
  const cellIdx = await p.evaluate(() =>
    [...document.querySelectorAll(".hwt-cell")].findIndex((c) => c.dataset.deployTarget === "true" && !c.querySelector(".hwt-token")),
  )
  const want = { row: Math.floor(cellIdx / 12), col: cellIdx % 12 }
  await p.locator(".hwt-cell").nth(cellIdx).click()
  await p.waitForTimeout(500)
  await p.reload({ waitUntil: "domcontentloaded" })
  await p.waitForTimeout(700)
  const phaseReload = await p.locator(".hwt-turn-label").getAttribute("data-phase")
  const posReload = await p.evaluate(
    (id) => JSON.parse(localStorage.getItem("heartwood-run-save-v1")).run.battle.units.find((u) => u.id === id).pos,
    unitId,
  )
  await p.locator(".hwt-begin-battle").click()
  await p.waitForTimeout(300)
  const phase2 = await p.locator(".hwt-turn-label").getAttribute("data-phase")
  await p.locator(".hwt-end-turn").click()
  await p.waitForTimeout(1500)
  const turnAfter = await p.evaluate(() => JSON.parse(localStorage.getItem("heartwood-run-save-v1")).run.battle.turn)
  await p.close()
  out.real = { want, phase1, phaseReload, posReload, phase2, turnAfter }
  if (!(phase1 === "deploy" && phaseReload === "deploy" && eq(posReload, want) && phase2 === "player" && turnAfter === 2))
    out.errors.push("check6 real game deploy + Begin")
}

out.pageErrors = errs
await browser.close()
console.log(JSON.stringify(out, null, 2))
console.log(out.errors.length === 0 && errs.length === 0 ? "ALL PASS" : "FAIL")
