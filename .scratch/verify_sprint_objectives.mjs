import { chromium } from "playwright"

// Sprint 2 - Battle objectives: Survive / Protect / Destroy the Totem /
// Reinforcements. Engine checks via page.evaluate import; UI checks on the
// prototype picker and a real run fight.
const PORT = process.env.PORT || 5448
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
  const O = await import("/src/services/heartwood/tacticsObjectives.js")
  const rt = await import("/src/services/heartwood/runEngine.js")
  const RM = await import("/src/services/heartwood/tacticsRealMatchup.js")
  const res = {}
  const tough = (s) => ({ ...s, units: s.units.map((u) => (u.side === "player" ? { ...u, hp: 999, maxHp: 999 } : u)) })
  const setHp = (s, id, hp) => ({ ...s, units: s.units.map((u) => (u.id === id ? { ...u, hp } : u)) })
  const endTurns = (s, n) => {
    for (let i = 0; i < n && s.phase === "player"; i++) s = E.endPlayerTurn(s)
    return s
  }

  // 1: Survive - not won after 3 turns, won once turn 4 ends; Commander death = lost.
  {
    const s = O.applyObjective(E.createTacticsBattle("default"), O.buildObjectiveSpec("survive", 1))
    const t3 = endTurns(tough(s), 3)
    const t4 = endTurns(tough(s), 4)
    const dead = E.checkTacticsBattleEnd(setHp(s, "player-commander", 0))
    res.c1 = { turns: s.objective.turns, t3: [t3.phase, t3.turn], t4: [t4.phase, t4.log.at(-1)], dead: [dead.phase, dead.log.at(-1)] }
  }
  // 2: Protect - NPC placed, not controllable; NPC death = lost; clear = won; squad dead w/ NPC alive = lost.
  {
    const s = O.applyObjective(E.createTacticsBattle("default"), O.buildObjectiveSpec("protect", 1))
    const npc = s.units.find((u) => u.id === O.NPC_ID)
    const d = E.enterDeploy(s)
    const lost = E.checkTacticsBattleEnd(setHp(s, O.NPC_ID, 0))
    const cleared = E.checkTacticsBattleEnd({ ...s, units: s.units.map((u) => (u.side === "enemy" ? { ...u, hp: 0 } : u)) })
    const squadDead = E.checkTacticsBattleEnd({ ...s, units: s.units.map((u) => (u.side === "player" && !u.npc ? { ...u, hp: 0 } : u)) })
    res.c2 = {
      npc: npc && { side: npc.side, ap: npc.apMax, move: npc.move, range: npc.range, pos: npc.pos },
      noMove: E.moveUnit(s, O.NPC_ID, { row: npc.pos.row, col: npc.pos.col - 1 }) === s,
      noPlace: E.placeUnit(d, O.NPC_ID, { row: 0, col: 11 }) === d,
      noSwapOnto: E.placeUnit(d, "player-commander", npc.pos) === d,
      lost: [lost.phase, lost.log.at(-1)],
      cleared: cleared.phase,
      squadDead: squadDead.phase,
    }
  }
  // 3: Totem - static, never moves/attacks; destroyed = won with enemies left; pulse timing + telegraph.
  {
    const s = O.applyObjective(E.createTacticsBattle("default"), O.buildObjectiveSpec("totem", 1, { pulseKind: "mend" }))
    const totem = s.units.find((u) => u.id === O.TOTEM_ID)
    const intents = E.previewEnemyIntents(s)
    const won = E.checkTacticsBattleEnd(setHp(s, O.TOTEM_ID, 0))
    const pulses = []
    let t = tough(s)
    // Hurt the enemies so a mend is visible.
    t = { ...t, units: t.units.map((u) => (u.side === "enemy" && !u.structure ? { ...u, hp: Math.max(1, u.hp - 5) } : u)) }
    for (let i = 0; i < 4 && t.phase === "player"; i++) {
      const before = { turn: t.turn, until: O.turnsUntilPulse(t), detail: O.describeObjective(t).detail, atk: t.units.filter((u) => u.side === "enemy" && !u.structure).map((u) => u.attack) }
      const logLen = t.log.length
      t = E.endPlayerTurn(t)
      const fired = t.log.slice(logLen).some((l) => l.includes("pulses"))
      pulses.push({ ...before, fired })
    }
    const totemMoved = t.units.find((u) => u.id === O.TOTEM_ID).pos
    const reaction = (t.events || []).some((e) => e.kind === "reaction" && e.unitId === O.TOTEM_ID)
    // Blast: every player takes damage on turn 3's enemy phase.
    const b = O.applyObjective(E.createTacticsBattle("default"), O.buildObjectiveSpec("totem", 1, { pulseKind: "blast" }))
    const bt = endTurns(tough(b), 2)
    const hpBefore = bt.units.filter((u) => u.side === "player").map((u) => u.hp)
    const logLen = bt.log.length
    const bAfter = E.endPlayerTurn(bt)
    res.c3 = {
      totem: { side: totem.side, move: totem.move, range: totem.range, attack: totem.attack, reach: E.reachableTilesFor(s, O.TOTEM_ID).length, col: totem.pos.col },
      totemIntent: intents.find((i) => i.enemyId === O.TOTEM_ID)?.intent.kind,
      won: [won.phase, won.log.at(-1)],
      pulses,
      totemStill: JSON.stringify(totemMoved) === JSON.stringify(totem.pos),
      reaction,
      blastLog: bAfter.log.slice(logLen).find((l) => l.includes("pulses")) || null,
      blastHitAll: bAfter.units.filter((u) => u.side === "player").every((u, i) => u.hp < hpBefore[i] || u.hp <= 0),
    }
  }
  // 4: Reinforcements - telegraph on turn 2 only, arrive at start of turn 3 at the edge, callout.
  {
    const s = O.applyObjective(E.createTacticsBattle("default"), O.buildObjectiveSpec("kill", 1, { reinforce: { turn: 3, count: 1 } }))
    const enemiesAt1 = s.units.filter((u) => u.side === "enemy").length
    const warn1 = O.reinforcementWarningTiles(s).length
    const t2 = endTurns(tough(s), 1)
    const warn2 = O.reinforcementWarningTiles(t2)
    const extra2 = O.describeObjective(t2).extra
    const t3 = endTurns(t2, 1)
    const arrived = t3.units.filter((u) => u.id.includes("-r"))
    res.c4 = {
      hasReinf: !!s.objective?.reinforcements,
      warn1,
      warn2,
      extra2,
      t2count: t2.units.filter((u) => u.side === "enemy").length,
      t3turn: t3.turn,
      enemiesAt1,
      arrived: arrived.map((u) => ({ pos: u.pos, hp: u.hp, side: u.side })),
      callout: (t3.events || []).some((e) => e.kind === "reaction" && e.label === "Reinforcements!"),
      warn3: O.reinforcementWarningTiles(t3).length,
      protoUnchanged: O.applyObjective(E.createTacticsBattle("default"), O.buildObjectiveSpec("kill", 1)).objective === undefined,
    }
  }
  // 5: Deterministic assignment from the seed.
  {
    const counts = {}
    const perAct = {}
    let deterministic = true
    let nonBattleSpecial = 0
    let firstSpecial = 0
    for (let seed = 1; seed <= 200; seed++) {
      rt.RUN_PATH.forEach((n, i) => {
        if (!["battle", "elite", "miniboss", "boss"].includes(n.type)) return
        const act = rt.actIndexForNode(i, rt.RUN_PATH.length)
        const a = O.objectiveForNode(seed, i, n.type, act)
        const b = O.objectiveForNode(seed, i, n.type, act)
        if (JSON.stringify(a) !== JSON.stringify(b)) deterministic = false
        if (n.type !== "battle") {
          if (a.type !== "kill" || a.reinforce) nonBattleSpecial++
          return
        }
        if (i <= 1 && a.type !== "kill") firstSpecial++
        counts[a.type] = (counts[a.type] || 0) + 1
        perAct[act] = perAct[act] || { total: 0, special: 0, reinforce: 0 }
        perAct[act].total++
        if (a.type !== "kill") perAct[act].special++
        if (a.reinforce) perAct[act].reinforce++
      })
    }
    // Run bridge: same objective the formation screen shows.
    const rs = { ...rt.startRun("tommy", null, { forcedSeed: 4242 }), phase: "formation" }
    const idx = rs.path.findIndex((n, i) => i > 1 && n.type === "battle")
    const spec = RM.objectiveForRunNode({ ...rs, nodeIndex: idx })
    const spec2 = RM.objectiveForRunNode({ ...rs, nodeIndex: idx })
    res.c5 = {
      deterministic: deterministic && JSON.stringify(spec) === JSON.stringify(spec2),
      nonBattleSpecial,
      firstSpecial,
      counts,
      rates: Object.fromEntries(Object.entries(perAct).map(([k, v]) => [k, { special: +(v.special / v.total).toFixed(2), reinforce: +(v.reinforce / v.total).toFixed(2) }])),
    }
  }
  return res
})
out.engine = r
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b)
{
  const c = r.c1
  if (!(c.turns === 4 && c.t3[0] === "player" && c.t3[1] === 4 && c.t4[0] === "won" && /held/.test(c.t4[1]) && c.dead[0] === "lost" && /Commander/.test(c.dead[1])))
    out.errors.push("check1 survive win/lose")
}
{
  const c = r.c2
  if (!(c.npc && c.npc.side === "player" && c.npc.ap === 0 && c.npc.move === 0 && c.npc.range === 0 && c.noMove && c.noPlace && c.noSwapOnto && c.lost[0] === "lost" && /Seer/.test(c.lost[1]) && c.cleared === "won" && c.squadDead === "lost"))
    out.errors.push("check2 protect win/lose")
}
{
  const c = r.c3
  const p = c.pulses
  const timing = p.length === 4 && eq(p.map((x) => x.until), [2, 1, 0, 2]) && eq(p.map((x) => x.fired), [false, false, true, false])
  const mended = p[3].atk.every((a, i) => a === p[2].atk[i] + 1)
  const tele = /pulses in 2 turns/.test(p[0].detail) && /end of this turn/.test(p[2].detail)
  if (!(c.totem.side === "enemy" && c.totem.move === 0 && c.totem.range === 0 && c.totem.attack === 0 && c.totem.reach === 0 && c.totem.col <= 2 && c.totemIntent === "hold" && c.won[0] === "won" && /Totem/.test(c.won[1]) && timing && mended && tele && c.totemStill && c.reaction && c.blastLog && c.blastHitAll))
    out.errors.push("check3 totem static/win/pulse timing+telegraph")
}
{
  const c = r.c4
  if (!(c.hasReinf && c.warn1 === 0 && c.warn2.length === 1 && c.warn2[0].col === 0 && /next turn/.test(c.extra2) && c.t2count === c.enemiesAt1 && c.t3turn === 3 && c.arrived.length === 1 && c.arrived[0].side === "enemy" && c.arrived[0].pos.col <= 2 && c.callout && c.warn3 === 0 && c.protoUnchanged))
    out.errors.push("check4 reinforcements telegraph + arrival")
}
{
  const c = r.c5
  const rates = Object.values(c.rates).map((x) => x.special)
  if (!(c.deterministic && c.nonBattleSpecial === 0 && c.firstSpecial === 0 && c.counts.survive > 0 && c.counts.protect > 0 && c.counts.totem > 0 && rates.every((x) => x >= 0.3 && x <= 0.65)))
    out.errors.push("check5 deterministic assignment")
}
await page.close()

// 6: UI - prototype picker + panel/tokens, and a real run fight shows the objective (formation line + panel).
{
  const p = await newPage()
  await p.goto(`http://localhost:${PORT}/heartwood-tactics?objective=totem`, { waitUntil: "domcontentloaded" })
  await p.waitForSelector(".hwt-objective", { timeout: 20000 })
  const totemPanel = await p.locator(".hwt-objective").innerText()
  const totemToken = await p.locator('.hwt-token[data-structure="true"]').count()
  const totemBadge = await p.locator(".hwt-totem-badge").innerText()
  await p.locator('[data-objective-choice="protect"]').click()
  await p.waitForTimeout(300)
  const protectPanel = await p.locator(".hwt-objective").innerText()
  const npcToken = await p.locator('.hwt-token[data-npc="true"]').count()
  await p.locator('[data-objective-choice="survive"]').click()
  await p.waitForTimeout(300)
  const survivePanel = await p.locator(".hwt-objective").innerText()
  await p.locator(".hwt-end-turn").click()
  await p.waitForTimeout(1200)
  const warnTiles = await p.locator('.hwt-cell[data-reinforce="true"]').count()
  const survivePanel2 = await p.locator(".hwt-objective").innerText()
  await p.screenshot({ path: "/tmp/claude-1000/-home-marc-Wood-Booster-AI/bb7f551b-ac23-44f6-901f-0ed262880f88/scratchpad/objectives_proto.png" }).catch(() => {})
  await p.close()
  out.ui = { totemPanel, totemToken, totemBadge, protectPanel, npcToken, survivePanel, survivePanel2, warnTiles }
  if (
    !(
      /Destroy the Totem/.test(totemPanel) &&
      /pulses in 2 turns/.test(totemPanel) &&
      totemToken === 1 &&
      totemBadge.includes("2") &&
      /Protect the Wandering Seer/.test(protectPanel) &&
      npcToken === 1 &&
      /Survive/.test(survivePanel) &&
      /Turn 1 of 4/.test(survivePanel) &&
      /Turn 2 of 4/.test(survivePanel2) &&
      /arrive next turn/.test(survivePanel2) &&
      warnTiles >= 1
    )
  )
    out.errors.push("check6a prototype objective UI")
}
{
  const p = await newPage()
  await p.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
  const found = await p.evaluate(async () => {
    const { startRun, serializeRun, RUN_PATH, actIndexForNode } = await import("/src/services/heartwood/runEngine.js")
    const { objectiveForNode } = await import("/src/services/heartwood/tacticsObjectives.js")
    for (let seed = 1; seed < 500; seed++) {
      const idx = RUN_PATH.findIndex((n, i) => i > 1 && n.type === "battle" && objectiveForNode(seed, i, n.type, actIndexForNode(i, RUN_PATH.length)).type === "totem")
      if (idx < 0) continue
      const rs = {
        ...startRun("tommy", null, { forcedSeed: seed }),
        nodeIndex: idx,
        path: RUN_PATH.slice(0, idx + 1),
        phase: "formation",
        bench: [{ key: "b0", defId: "the-fool", upgradeLevel: 0, upgrades: [] }],
        deployed: ["b0", null, null, null],
        items: [],
        lastSeenAct: actIndexForNode(idx, RUN_PATH.length),
      }
      localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(rs)))
      return { seed, idx }
    }
    return null
  })
  await p.reload({ waitUntil: "domcontentloaded" })
  await p.waitForTimeout(600)
  const formationLine = await p.locator(".hwt-formation-summary-objective").innerText().catch(() => "")
  await p.locator(".hw-tactics-start").click()
  await p.waitForTimeout(600)
  const panel = await p.locator(".hwt-objective").innerText().catch(() => "")
  const totemToken = await p.locator('.hwt-token[data-structure="true"]').count()
  const saved = await p.evaluate(() => JSON.parse(localStorage.getItem("heartwood-run-save-v1")).run.battle.objective?.type)
  await p.screenshot({ path: "/tmp/claude-1000/-home-marc-Wood-Booster-AI/bb7f551b-ac23-44f6-901f-0ed262880f88/scratchpad/objectives_real.png" }).catch(() => {})
  await p.close()
  out.real = { found, formationLine, panel, totemToken, saved }
  if (!(found && /Destroy the Totem/.test(formationLine) && /Destroy the Totem/.test(panel) && totemToken === 1 && saved === "totem"))
    out.errors.push("check6b real fight objective shown")
}

out.pageErrors = errs
await browser.close()
console.log(JSON.stringify(out, null, 2))
console.log(out.errors.length === 0 && errs.length === 0 ? "ALL PASS" : "FAIL")
