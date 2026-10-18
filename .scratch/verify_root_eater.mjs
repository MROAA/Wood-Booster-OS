// Hearthwood - Root-Eaters + rune paths (First Song PRD §4 + §6) verify suite.
// Engine: the Root-Eater wakes (Act III+, seeded), creeps a fight closer per
// win, surfaces in a REAL tactics fight, eats the board + heals, devours a
// bane (forest friendly) or a boon (forest wary), passes twice then sinks;
// its eaten trees don't cost forest regard. Rune paths: Growth -> Overgrown,
// Shadow -> Hidden, spending the rune. UI: fork buttons, map status,
// board banner + tag, a played turn.
//   PORT=5457 node .scratch/verify_root_eater.mjs
import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

const PORT = process.env.PORT || 5457
const SHOTS = process.env.SHOTS || ".scratch/shots"
await mkdir(SHOTS, { recursive: true })
const results = []
const ok = (cond, name, extra) => {
  results.push({ ok: !!cond, name })
  if (!cond) console.log("FAIL:", name, extra !== undefined ? JSON.stringify(extra) : "")
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1536, height: 864 } })
const pageErrors = []
page.on("pageerror", (e) => pageErrors.push(e.message))
await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
await page.waitForTimeout(1500)

const eng = await page.evaluate(async () => {
  const E = await import("/src/services/heartwood/runEngine.js")
  const M = await import("/src/services/heartwood/tacticsRealMatchup.js")
  const R = await import("/src/services/heartwood/rootEater.js")
  const C = await import("/src/services/heartwood/tacticsCreatures.js")
  const F = await import("/src/services/heartwood/forestRegard.js")
  const RR = await import("/src/services/heartwood/runRunes.js")
  const BF = await import("/src/services/heartwood/betweenFights.js")
  const out = {}
  const bench = ["the-fool", "the-magician"].map((defId, i) => ({ key: `b${i}`, defId, upgradeLevel: 0, upgrades: [] }))
  const actOf = (i) => E.actIndexForNode(i, E.RUN_PATH.length)
  const at = (idx, seed, extra = {}) => ({ ...E.startRun("tommy", null, { forcedSeed: seed }), nodeIndex: idx, path: E.RUN_PATH.slice(0, idx + 1), phase: "formation", bench, deployed: ["b0", "b1", null, null], items: [], lastSeenAct: actOf(idx), ...extra })
  const start = (rs) => E.startTacticsFormationBattle(rs, (s) => M.buildRunTacticsBattle(rs, s))

  // wake
  out.act2 = R.wakeRootEater({ seed: 1 }, 2).rootEater ?? null
  const woke = []
  for (let s = 1; s <= 12; s++) woke.push(R.wakeRootEater({ seed: s }, 3).rootEater.state)
  out.woke = woke
  out.wakeSame = JSON.stringify(R.wakeRootEater({ seed: 5 }, 3).rootEater) === JSON.stringify(R.wakeRootEater({ seed: 5 }, 3).rootEater)
  out.wakeOnce = R.wakeRootEater({ seed: 5, rootEater: { state: "gone" } }, 3).rootEater.state
  // creep
  let rs = { rootEater: { state: "approaching", distance: 3, passes: 0 } }
  const dists = []
  for (let k = 0; k < 4; k++) { rs = R.tickRootEater(rs, {}); dists.push(rs.rootEater.distance) }
  out.dists = dists
  out.arrives = R.rootEaterArrivesNow(rs)
  // devour
  out.friendly = R.devourBond({ regard: 10, runModifiers: ["rootblessed", "hollow-marked", "root-debt"] })
  out.wary = R.devourBond({ regard: -30, runModifiers: ["rootblessed", "hollow-marked", "stoneblood"] })
  out.nothing = R.devourBond({ regard: 10, runModifiers: ["rootblessed"] }).eaten
  // passes
  let p = { rootEater: { state: "approaching", distance: 0, passes: 0 } }
  p = R.tickRootEater(p, { rootEaterArrived: true })
  out.pass1 = p.rootEater
  p = R.tickRootEater({ ...p, rootEater: { ...p.rootEater, distance: 0 } }, { rootEaterArrived: true })
  out.pass2 = p.rootEater.state

  // a REAL fight where it surfaces (Act III battle)
  const idx3 = E.RUN_PATH.findIndex((n, i) => n.type === "battle" && n.formationId && actOf(i) === 3)
  const arriving = at(idx3, 424243, { regard: 10, runModifiers: ["hollow-marked"], rootEater: { state: "approaching", distance: 0, passes: 0 } })
  const fought = start(arriving)
  const b = fought.battle
  const eater = b.units.find((u) => u.creature === "rooteater")
  out.fight = {
    eater: eater ? [eater.side, eater.name, eater.creatureTag, eater.maxHp] : null,
    arrived: !!b.rootEaterArrived,
    ate: b.rootEaterAte,
    banesLeft: fought.runModifiers.includes("hollow-marked"),
  }
  const normal = start(at(idx3, 424243, { regard: 10 })).battle
  out.normalHasEater = normal.units.some((u) => u.creature === "rooteater")
  // feeding: put a tree next to it, wound it, end an enemy turn
  if (eater) {
    const k = (p) => `${p.row}-${p.col}`
    const spot = [[0, 1], [1, 0], [0, -1], [-1, 0], [1, 1], [-1, -1], [1, -1], [-1, 1]]
      .map(([dr, dc]) => ({ row: eater.pos.row + dr, col: eater.pos.col + dc }))
      .find((q) => q.row >= 0 && q.col >= 0 && q.row < b.grid.rows && q.col < b.grid.cols && !b.units.some((u) => u.hp > 0 && u.pos.row === q.row && u.pos.col === q.col))
    const fed0 = { ...b, terrain: { ...b.terrain, [k(spot)]: "tree" }, units: b.units.map((u) => (u.id === eater.id ? { ...u, hp: u.maxHp - 10 } : u)), treesAtStart: (b.treesAtStart || 0) + 1 }
    const fed = C.rootEaterTurnEnd(fed0)
    const after = fed.units.find((u) => u.id === eater.id)
    out.feed = { tile: fed.terrain[k(spot)], healed: after.hp - (eater.maxHp - 10), eatenCount: fed.creatureTreesEaten - (b.creatureTreesEaten || 0), crunch: (fed.events || []).some((e) => e.label === "Crunch!") }
    // its eaten trees don't count against you
    out.regard = F.regardAfterFight({ regard: 0 }, fed).regard
  }

  // rune paths
  const pool = E.RUN_PATH.filter((n) => n.type === "battle" && n.formationId)
  const idx2 = E.RUN_PATH.findIndex((n, i) => n.type === "battle" && actOf(i) === 2)
  const fork = (runes) => ({
    ...E.startRun("tommy", null, { forcedSeed: 77 }),
    phase: "choice",
    nodeIndex: idx2 - 1,
    path: E.RUN_PATH.slice(0, idx2),
    battlePool: pool.slice(3, 8),
    floorChoices: BF.decorateRouteOptions(pool.slice(0, 3), { seed: 77, nodeIndex: idx2, act: 2 }),
    runes,
    regard: 0,
    bench,
    deployed: ["b0", "b1", null, null],
  })
  out.noRunes = RR.runeRouteOptions(fork([])).length
  const opts = RR.runeRouteOptions(fork(["growth", "shadow"]))
  out.opts = opts.map((o) => [o.rune, o.risk, o.baseIndex])
  out.forkRisks = fork([]).floorChoices.map((o) => o.risk)
  const g = E.chooseRuneRoute(fork(["growth", "shadow"]), "growth")
  const gNode = g.path[g.path.length - 1]
  const sNode0 = fork([]).floorChoices[0]
  out.growth = {
    risk: gNode.risk, runes: g.runes, regard: g.regard, phase: g.phase,
    threat: M.difficultyForRunNode(g, g.nodeIndex).score,
    quietThreat: M.difficultyForRunNode({ ...g, path: [...g.path.slice(0, -1), { ...sNode0 }] }, g.nodeIndex).score,
  }
  const s = E.chooseRuneRoute(fork(["shadow"]), "shadow")
  const sNode = s.path[s.path.length - 1]
  out.shadow = { risk: sNode.risk, runes: s.runes, essence: BF.riskOf(sNode).essence, loot: BF.riskOf(sNode).loot, threat: BF.riskOf(sNode).threat }
  out.noRuneChoice = E.chooseRuneRoute(fork([]), "growth").phase
  return out
})

ok(eng.act2 === null, "R1 nothing wakes before Act III")
ok(eng.woke.includes("approaching") && eng.woke.includes("slept") && eng.wakeSame && eng.wakeOnce === "gone", "R2 from Act III it wakes on some runs (seeded, rolled once)", eng.woke)
ok(JSON.stringify(eng.dists) === "[2,1,0,0]" && eng.arrives, "R3 it creeps a fight closer per win", eng.dists)
ok(eng.friendly.eaten === "hollow-marked" && !eng.friendly.runState.runModifiers.includes("hollow-marked"), "R4 forest friendly: it eats your OLDEST curse", eng.friendly.eaten)
ok(eng.wary.eaten === "stoneblood", "R5 forest wary: it eats your NEWEST blessing", eng.wary.eaten)
ok(eng.nothing === null, "R6 no bond of that kind: it eats nothing")
ok(eng.pass1.state === "approaching" && eng.pass1.distance === 4 && eng.pass1.passes === 1 && eng.pass2 === "gone", "R7 it passes twice, then sinks for good", eng.pass1)
ok(eng.fight.eater && eng.fight.eater[0] === "enemy" && eng.fight.eater[2] === "Root-Eater" && eng.fight.arrived, "R8 in a real Act III fight it surfaces as an enemy", eng.fight)
ok(eng.fight.ate === "hollow-marked" && !eng.fight.banesLeft, "R9 ...and feeds on your curse at the start of that fight", eng.fight)
ok(!eng.normalHasEater, "R10 no Root-Eater in a fight it isn't due for")
ok(eng.feed && eng.feed.tile === "stump" && eng.feed.healed > 0 && eng.feed.eatenCount === 1 && eng.feed.crunch, "R11 every enemy turn it eats wood next to it and heals", eng.feed)
ok(eng.regard === 3, "R12 trees it ate don't cost you forest regard", eng.regard)
ok(eng.noRunes === 0, "P1 no runes, no rune paths")
ok(eng.opts.length === 2 && eng.opts[0][1] === "overgrown" && eng.opts[0][2] === 0 && eng.opts[1][1] === "hidden", "P2 Growth opens an Overgrown path, Shadow a Hidden path", { opts: eng.opts, fork: eng.forkRisks })
ok(eng.growth.risk === "overgrown" && JSON.stringify(eng.growth.runes) === '["shadow"]' && eng.growth.regard === 3 && eng.growth.phase === "formation" && eng.growth.threat < eng.growth.quietThreat, "P3 the Overgrown path: rune spent, gentler fight, the forest likes it", eng.growth)
ok(eng.shadow.risk === "hidden" && eng.shadow.runes.length === 0 && eng.shadow.essence === 60 && eng.shadow.loot === "item" && eng.shadow.threat === 0, "P4 the Hidden path: rune spent, Quiet threat, Hunted reward", eng.shadow)
ok(eng.noRuneChoice === "choice", "P5 without the rune the path can't be taken")

// ---------------- UI ----------------
await page.evaluate(async () => {
  localStorage.setItem("heartwood-story-intro-seen", "true")
  const E = await import("/src/services/heartwood/runEngine.js")
  const BF = await import("/src/services/heartwood/betweenFights.js")
  const actOf = (i) => E.actIndexForNode(i, E.RUN_PATH.length)
  const pool = E.RUN_PATH.filter((n) => n.type === "battle" && n.formationId)
  const idx2 = E.RUN_PATH.findIndex((n, i) => n.type === "battle" && actOf(i) === 2)
  const bench = ["the-fool", "the-magician"].map((defId, i) => ({ key: `b${i}`, defId, upgradeLevel: 0, upgrades: [] }))
  const rs = { ...E.startRun("tommy", null, { forcedSeed: 77 }), phase: "choice", nodeIndex: idx2 - 1, path: E.RUN_PATH.slice(0, idx2), battlePool: pool.slice(3, 8), floorChoices: BF.decorateRouteOptions(pool.slice(0, 3), { seed: 77, nodeIndex: idx2, act: 2 }), runes: ["growth", "shadow"], regard: 0, rootEater: { state: "approaching", distance: 2, passes: 0 }, bench, deployed: ["b0", "b1", null, null], items: [], lastSeenAct: 2 }
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(E.serializeRun(rs)))
})
await page.reload({ waitUntil: "domcontentloaded" })
await page.waitForSelector("[data-rune-paths]", { timeout: 15000 }).catch(() => {})
ok((await page.locator("[data-rune-path]").count()) === 2, "U1 the fork shows both rune paths")
ok((await page.locator("[data-root-eater='2']").count()) >= 1, "U2 the map panel shows the Root-Eater coming (2 fights away)")
await page.locator("[data-rune-paths]").scrollIntoViewIfNeeded()
await page.screenshot({ path: `${SHOTS}/rune_paths.png` })
await page.locator("[data-rune-path='growth']").click()
await page.waitForTimeout(1500)
const afterPick = await page.evaluate(() => { const r = JSON.parse(localStorage.getItem("heartwood-run-save-v1")).run; return { phase: r.phase, risk: r.path[r.path.length - 1].risk, runes: r.runes } })
ok(afterPick.phase === "formation" && afterPick.risk === "overgrown" && JSON.stringify(afterPick.runes) === '["shadow"]', "U3 clicking it takes the Overgrown path and spends Growth", afterPick)

// a fight where it surfaces
await page.evaluate(async () => {
  const E = await import("/src/services/heartwood/runEngine.js")
  const actOf = (i) => E.actIndexForNode(i, E.RUN_PATH.length)
  const idx3 = E.RUN_PATH.findIndex((n, i) => n.type === "battle" && n.formationId && actOf(i) === 3)
  const bench = ["the-fool", "the-magician"].map((defId, i) => ({ key: `b${i}`, defId, upgradeLevel: 0, upgrades: [] }))
  const rs = { ...E.startRun("tommy", null, { forcedSeed: 424243 }), nodeIndex: idx3, path: E.RUN_PATH.slice(0, idx3 + 1), phase: "formation", bench, deployed: ["b0", "b1", null, null], items: [], lastSeenAct: 3, regard: 10, runModifiers: ["hollow-marked"], rootEater: { state: "approaching", distance: 0, passes: 0 } }
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(E.serializeRun(rs)))
})
await page.reload({ waitUntil: "domcontentloaded" })
await page.waitForSelector(".hw-tactics-start", { timeout: 15000 }).catch(() => {})
ok((await page.locator("[data-root-eater='0']").count()) >= 1, "U4 the Formation screen warns it surfaces in this fight")
await page.locator(".hw-tactics-start").click()
const begin = page.locator(".hwt-begin-battle")
await begin.waitFor({ timeout: 8000 }).catch(() => {})
if (await begin.count()) await begin.click()
await page.waitForTimeout(1000)
const banner = await page.locator("[data-creature-banner='rooteater']").innerText().catch(() => "")
ok(/Root-Eater surfaced/.test(banner) && /Hollow/i.test(banner), "U5 the board: Root-Eater banner + which bond it ate", banner)
ok((await page.locator(".hwt-fate-tag[data-creature='rooteater']").count()) === 1, "U6 the Root-Eater stands on the board, tagged")
await page.locator("[data-creature-banner]").scrollIntoViewIfNeeded().catch(() => {})
await page.screenshot({ path: `${SHOTS}/root_eater_battle.png` })
await page.locator(".hwt-end-turn").click()
await page.waitForTimeout(4000)
const turn = await page.evaluate(() => JSON.parse(localStorage.getItem("heartwood-run-save-v1")).run.battle?.turn)
ok(turn >= 2, "U7 a played turn with it on the board", turn)
ok(pageErrors.length === 0, "U8 no page errors", pageErrors)

await browser.close()
const failed = results.filter((r) => !r.ok)
console.log(`verify_root_eater: ${results.length - failed.length}/${results.length} passed`)
process.exit(failed.length ? 1 : 0)
