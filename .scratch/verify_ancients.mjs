import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

// Hearthwood - The Ancients (9th enemy archetype, Enemy Ecosystem PRD
// 18, feat/hearthwood-ancients). A slow colossus winding up ONE
// telegraphed squad-wide hit on a visible countdown (its `charge` marker
// -> autoBattleEngine.js's applyAncientCharge). Four answers: kill it
// (legal target from turn 1), stun it (the count HOLDS), stagger it (a
// round of damage >= breakDamage resets the count to full), or brace the
// squad. NO new status, NO RUN_SAVE_VERSION bump.

const PORT = process.env.PORT || 5381
const SHOT = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-ancients/.scratch/shots"
await mkdir(SHOT, { recursive: true })

const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1536, height: 1000 } })).newPage()
const errs = []
page.on("pageerror", (e) => errs.push(String(e)))
page.on("console", (m) => m.type() === "error" && errs.push(m.text()))
await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForSelector(".hw-commander-card", { timeout: 20000 })

const R = await page.evaluate(async () => {
  const engine = await import("/src/services/heartwood/runEngine.js")
  const auto = await import("/src/services/heartwood/autoBattleEngine.js")
  const { ENEMIES, NON_BATTLE_ENEMY_IDS, ACT_ENEMIES } = await import("/src/data/heartwood/enemies.js")
  const { FORMATIONS } = await import("/src/data/heartwood/formations.js")
  const { evaluateThreat } = await import("/src/data/heartwood/threatPreview.js")
  const { evaluateMatchup } = await import("/src/data/heartwood/counterplay.js")
  const { relicPool } = await import("/src/data/heartwood/relics.js")
  const { startRun, serializeRun, deserializeRun, RUN_SAVE_VERSION, RUN_PATH, SHOP_INVESTMENTS, buyInvestment, investmentOwned } = engine
  const out = { errors: [] }

  const du = (defId) => ({ defId, upgradeLevel: 0, upgrades: [], itemIds: [] })
  const start = (squad, formationId, relicIds = []) =>
    auto.startAutoBattle("tommy", squad, formationId, relicIds, 0, {}, [], [], 1, null, "restless")
  const oakOf = (st, id = "ancient-oak") => st.enemies.find((e) => e.defId === id)
  const bigOak = (st) => ({ ...st, enemies: st.enemies.map((e) => (e.defId === "ancient-oak" ? { ...e, hp: 400, maxHp: 400 } : e)) })
  const topOak = (st, hp = 400) => ({ ...st, enemies: st.enemies.map((e) => (e.defId === "ancient-oak" ? { ...e, hp } : e)) })
  const playerHp = (st) => st.playerUnits.reduce((s, u) => s + Math.max(0, u.hp), 0)

  // 1. Data --------------------------------------------------------
  {
    const g = FORMATIONS["the-ancient-grove"]
    const h = FORMATIONS["the-elder-hollow"]
    const shape = (f, oakId) =>
      f && f.pieces.length === 3 && f.synergy?.label === "Something is winding up" &&
      Array.isArray(f.synergy.effects) && f.synergy.effects.length === 0 &&
      !f.pieces.some((p) => p.pos.row === 1 && p.pos.col === 1) &&
      f.pieces.some((p) => p.defId === oakId && p.pos.row === 0 && p.pos.col === 1)
    const defsOk =
      !!ENEMIES["ancient-oak"]?.charge && !!ENEMIES["elder-oak"]?.charge && !ENEMIES["sapling-attendant"]?.charge &&
      ENEMIES["ancient-oak"].act && ENEMIES["elder-oak"].act && ENEMIES["sapling-attendant"].act
    const excluded = ["ancient-oak", "elder-oak", "sapling-attendant"].every(
      (id) => NON_BATTLE_ENEMY_IDS.has(id) && !Object.values(ACT_ENEMIES).flat().includes(id),
    )
    out.data = { grove: shape(g, "ancient-oak"), hollow: shape(h, "elder-oak"), defsOk: !!defsOk, excluded }
    if (!(shape(g, "ancient-oak") && shape(h, "elder-oak") && defsOk && excluded)) out.errors.push("check1 data")
  }

  // 2. The charge counts down + fires the payoff -----------------
  {
    // a low-mitigation squad so the squad-wide payoff visibly bites.
    let st = bigOak(start([du("the-fool"), du("the-fool")], "the-ancient-grove"))
    const counters = []
    const payoffRounds = []
    let payoffDrop = null
    for (let r = 0; r < 9 && st.phase === "player"; r++) {
      st = topOak(st)
      const hpBefore = playerHp(st)
      const lb = st.log.length
      st = auto.resolveRound(st)
      counters.push(oakOf(st)?.chargeCounter ?? null)
      const nl = st.log.slice(lb)
      if (nl.some((s) => /unleashes Rootfall/.test(s))) {
        payoffRounds.push(r)
        if (payoffDrop === null) payoffDrop = playerHp(st) < hpBefore
      }
    }
    // counters walk 3 -> 2 -> 1, then the payoff resets to 3
    const seq = counters.slice(0, 3).join(",") === "2,1,3"
    const firesAgain = payoffRounds.length >= 2
    out.charge = { counters, payoffRounds, payoffDrop, seq, firesAgain }
    if (!(seq && firesAgain && payoffDrop === true)) out.errors.push("check2 charge countdown / payoff")
  }

  // 3. Stun holds the count ------------------------------------
  {
    let st = bigOak(start([du("bulwark-of-ages"), du("bulwark-of-ages")], "the-ancient-grove"))
    // one normal round: the count ticks 3 -> 2
    st = topOak(st)
    st = auto.resolveRound(st)
    const afterTick = oakOf(st)?.chargeCounter ?? null
    // then stun the Oak at the top of every round for 5 rounds
    const held = []
    let anyPayoff = false
    let anyFalter = false
    for (let r = 0; r < 5 && st.phase === "player"; r++) {
      st = { ...st, enemies: st.enemies.map((e) => (e.defId === "ancient-oak" ? { ...e, hp: 400, powers: { ...e.powers, stun: 1 } } : e)) }
      const lb = st.log.length
      st = auto.resolveRound(st)
      held.push(oakOf(st)?.chargeCounter ?? null)
      const nl = st.log.slice(lb)
      if (nl.some((s) => /unleashes Rootfall/.test(s))) anyPayoff = true
      if (nl.some((s) => /Rootfall falters/.test(s))) anyFalter = true
    }
    const heldAt2 = afterTick === 2 && held.every((c) => c === 2)
    out.stun = { afterTick, held, anyPayoff, anyFalter, heldAt2 }
    if (!(heldAt2 && !anyPayoff && anyFalter)) out.errors.push("check3 stun holds the count")
  }

  // 4. A heavy hit staggers it -------------------------------
  {
    let st = bigOak(start([du("bulwark-of-ages"), du("bulwark-of-ages")], "the-ancient-grove"))
    // round 1: normal tick 3 -> 2, stamps chargeHpMark ~ post-player-phase HP
    st = topOak(st)
    st = auto.resolveRound(st)
    const c1 = oakOf(st)?.chargeCounter ?? null
    // round 2: drop the Oak far below its stamped mark so mark - hp >= breakDamage
    st = topOak(st, 300)
    const lb = st.log.length
    st = auto.resolveRound(st)
    const c2 = oakOf(st)?.chargeCounter ?? null
    const nl = st.log.slice(lb)
    const staggered = nl.some((s) => /staggers - the Rootfall unravels/.test(s))
    const noPayoff = !nl.some((s) => /unleashes Rootfall/.test(s))
    out.stagger = { c1, c2, turns: ENEMIES["ancient-oak"].charge.turns, staggered, noPayoff }
    if (!(c1 === 2 && c2 === ENEMIES["ancient-oak"].charge.turns && staggered && noPayoff)) out.errors.push("check4 heavy hit staggers")
  }

  // 5. Killing the Ancient stops it --------------------------
  {
    let st = start([du("the-hermit"), du("the-tower"), du("bulwark-of-ages"), du("stormbreaker")], "the-ancient-grove")
    st = { ...st, enemies: st.enemies.map((e) => (e.defId === "ancient-oak" ? { ...e, hp: 0 } : e)) }
    const res = auto.autoResolveBattle(st)
    const noPayoff = !(res.log || []).some((s) => /unleashes Rootfall/.test(s))
    const oakDead = (oakOf(res)?.hp ?? 1) <= 0
    const noCounter = oakOf(res)?.chargeCounter == null
    const resolved = res.phase === "won" || res.phase === "lost"
    out.kill = { noPayoff, oakDead, noCounter, resolved, phase: res.phase }
    if (!(noPayoff && oakDead && noCounter && resolved)) out.errors.push("check5 killing stops it")
  }

  // 6. Both formations resolve ------------------------------
  {
    const mid = [du("the-hermit"), du("the-tower"), du("bulwark-of-ages"), du("willowmend")]
    const a = auto.autoResolveBattle(start(mid, "the-ancient-grove"))
    const b = auto.autoResolveBattle(start(mid, "the-elder-hollow"))
    const ok = (d) => (d.phase === "won" || d.phase === "lost") && d.round < 30
    out.resolve = { grove: { phase: a.phase, round: a.round }, hollow: { phase: b.phase, round: b.round } }
    if (!(ok(a) && ok(b))) out.errors.push("check6 a formation did not resolve")
  }

  // 7. The counters ----------------------------------------
  {
    const falterN = (d) => (d.log || []).filter((s) => /Rootfall falters/.test(s)).length
    const payoffN = (d) => (d.log || []).filter((s) => /unleashes Rootfall/.test(s)).length
    const staggerN = (d) => (d.log || []).filter((s) => /staggers - the Rootfall unravels/.test(s)).length

    // Fixed-round drive with the Oak topped every round so the fight can't
    // end early - lets the counters actually be measured over time.
    const driveFixed = (squad, rounds) => {
      let st = start(squad, "the-ancient-grove")
      const log = []
      for (let r = 0; r < rounds && st.phase === "player"; r++) {
        st = { ...st, enemies: st.enemies.map((e) => (e.defId === "ancient-oak" ? { ...e, hp: e.maxHp } : e)) }
        st = auto.resolveRound(st)
      }
      return { hp: playerHp(st), log: st.log || [] }
    }

    // hold: Stormcaller's rook fires straight up column 1 to the {0,1} Oak
    // and stuns it every round - the count keeps faltering, never fires.
    const storm = driveFixed([du("the-fool"), du("stormcaller"), du("the-fool"), du("the-fool")], 7)
    const plain = driveFixed([du("the-fool"), du("the-fool"), du("the-fool"), du("the-fool")], 7)
    const stormHolds = falterN(storm) >= 3 && payoffN(storm) === 0 && falterN(plain) === 0

    // brace: Bulwark-Bearer's squad-wide Bulwark aura ends with more total
    // HP than an equivalent no-aura tank (Wardknot).
    const bb = driveFixed([du("the-fool"), du("bulwark-bearer"), du("the-fool"), du("the-fool")], 7)
    const wk = driveFixed([du("the-fool"), du("wardknot"), du("the-fool"), du("the-fool")], 7)
    const braceHelps = bb.hp > wk.hp

    // stagger: one heavy hit from Stormbreaker + the Commander knocks the
    // count off rhythm - a "staggers" line appears and the Oak never fires.
    const sb = auto.autoResolveBattle(start([du("stormbreaker"), du("the-fool"), du("the-fool"), du("the-fool")], "the-ancient-grove"))
    const staggerWorks = staggerN(sb) >= 1 && payoffN(sb) === 0

    out.counters = {
      stormHolds, braceHelps, staggerWorks,
      falterStorm: falterN(storm), payoffStorm: payoffN(storm), falterPlain: falterN(plain),
      bbHp: bb.hp, wkHp: wk.hp, staggerSb: staggerN(sb), payoffSb: payoffN(sb),
    }
    if (!(stormHolds && braceHelps && staggerWorks)) out.errors.push("check7 the counters")
  }

  // 8. RUN_PATH / save ------------------------------------
  {
    const nodes = RUN_PATH.filter((n) => n.formationId === "the-ancient-grove" || n.formationId === "the-elder-hollow")
    const swapped = nodes.length === 2
    const stillElite = nodes.every((n) => n.type === "elite")
    const gone = !RUN_PATH.some((n) => n.enemyId === "the-bramble-lash" || n.enemyId === "the-ashfall-herald")
    const len111 = RUN_PATH.length === 111
    const rs = { ...startRun("tommy"), relics: ["weathered-standard"] }
    const rt = deserializeRun(JSON.parse(JSON.stringify(serializeRun(rs))))
    const rtOk = rt != null && (rt.relics || []).includes("weathered-standard")
    out.path = { swapped, stillElite, gone, len111, rtOk, ver: RUN_SAVE_VERSION }
    if (!(swapped && stillElite && gone && len111 && rtOk && RUN_SAVE_VERSION === 3)) out.errors.push("check8 RUN_PATH / save")
  }

  // 9. Threat preview ------------------------------------
  {
    const rs = startRun("tommy")
    const roster = FORMATIONS["the-ancient-grove"].pieces.map((p) => ({ defId: p.defId, pos: p.pos, hp: ENEMIES[p.defId].maxHp }))
    const node = { type: "elite", formationId: "the-ancient-grove" }
    const t = evaluateThreat(roster, rs, node)
    const primaryAnc = t.primary?.id === "ancients"
    const mechAnc = (t.mechanics || []).includes("Winding up a big hit")
    const covRs = {
      ...rs,
      bench: [
        { key: "k0", defId: "stormcaller", upgrades: [], itemIds: [] },
        { key: "k1", defId: "bulwark-bearer", upgrades: [], itemIds: [] },
        { key: "k2", defId: "the-fool", upgrades: [], itemIds: [] },
      ],
      deployed: ["k0", "k1", "k2", null],
    }
    const covered = evaluateMatchup(roster, covRs).covered.includes("ancients")
    const plainRs = { ...rs, bench: [{ key: "p0", defId: "the-fool", upgrades: [], itemIds: [] }], deployed: ["p0", null, null, null] }
    const gap = evaluateMatchup(roster, plainRs).gaps.includes("ancients")
    out.threat = { primaryAnc, mechAnc, covered, gap, primary: t.primary?.id, mechanics: t.mechanics }
    if (!(primaryAnc && mechAnc && covered && gap)) out.errors.push("check9 threat preview")
  }

  // 10. The Weathered Standard (Ledger buy) --------------
  {
    const rs = { ...startRun("tommy"), essence: 9999 }
    const bought = buyInvestment(rs, "weathered-standard")
    const deducted = bought.essence === rs.essence - SHOP_INVESTMENTS["weathered-standard"].cost
    const added = (bought.relics || []).includes("weathered-standard")
    const owned = investmentOwned(bought, "weathered-standard")
    const noDouble = buyInvestment(bought, "weathered-standard").essence === bought.essence
    const notRollable = !relicPool().some((r) => r.id === "weathered-standard")
    const st = start([du("bulwark-of-ages"), du("the-fool"), du("the-fool"), du("the-fool")], "the-ancient-grove", ["weathered-standard"])
    const allBraced = st.playerUnits.filter((u) => u.id !== "commander").every((u) => (u.powers?.bulwark || 0) >= 1)
    out.standard = { deducted, added, owned, noDouble, notRollable, allBraced }
    if (!(deducted && added && owned && noDouble && notRollable && allBraced)) out.errors.push("check10 The Weathered Standard")
  }

  return out
})

console.log(JSON.stringify(R, null, 2))
console.log("\npageErrors:", errs.length, errs.slice(0, 8))

// screenshot the FormationScreen vs the-ancient-grove
try {
  await page.evaluate(async () => {
    const engine = await import("/src/services/heartwood/runEngine.js")
    const { RUN_PATH } = engine
    const idx = RUN_PATH.findIndex((n) => n.formationId === "the-ancient-grove")
    let run = engine.startRun("tommy", null, { forcedSeed: 0xa11c })
    run = {
      ...run, nodeIndex: idx, path: RUN_PATH.slice(0, idx + 1), phase: "formation", lastSeenAct: 7,
      bench: [
        { key: 1, defId: "stormcaller", upgrades: [], upgradeLevel: 0, wins: 0 },
        { key: 2, defId: "bulwark-bearer", upgrades: [], upgradeLevel: 0, wins: 0 },
        { key: 3, defId: "stormbreaker", upgrades: [], upgradeLevel: 0, wins: 0 },
      ],
      deployed: [1, 2, 3, null], items: [],
    }
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(engine.serializeRun(run)))
    localStorage.setItem("heartwood-story-intro-seen", "1")
    localStorage.setItem("heartwood-coach-enabled-v1", "false")
  })
  await page.reload()
  await page.waitForSelector(".hw-ancients-hint", { timeout: 20000 })
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${SHOT}/ancients_formation.png` })
  console.log("ancients hint:", await page.$eval(".hw-ancients-hint", (el) => el.textContent.replace(/\s+/g, " ").trim()))
  console.log("threat panel:", await page.$eval(".hw-threat-preview", (el) => el.textContent.replace(/\s+/g, " ").trim().slice(0, 200)).catch(() => "(none)"))
} catch (e) {
  console.log("shot skip:", e.message)
}

await browser.close()
const pass = R.errors.length === 0 && errs.length === 0
console.log(pass ? "\n✅ verify_ancients PASS" : "\n❌ verify_ancients FAIL")
process.exit(pass ? 0 : 1)
