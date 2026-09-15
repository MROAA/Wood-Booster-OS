import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

// Hearthwood - The Coven (feat/hearthwood-coven). Fifth enemy archetype:
// a caster BEHIND the shield line (coven-matron, `covenAura`) that buffs
// EVERY OTHER living enemy +1 Strength/round via autoBattleEngine.js's
// applyCovenTick (not adjacency-gated - kill the matron and the ramp
// stops). 3 coven defs (NON_BATTLE_ENEMY_IDS) + 2 formations (matron
// shielded at row 1), net-neutral RUN_PATH swaps. Player answers:
// hexbreaker (bishop pattern reach), oracle-eye (executioner snipe),
// witch-cutter (sunder strips the enchant). Money sink: The Marked Coin
// (a Ledger relic - Vulnerable on the frailest enemy every fight).
// Real combat change on 2 fights + a per-round ramp + 3 units + a relic
// -> RUNS=100 is the hard gate; these assertions pin the mechanic + save.

const PORT = process.env.PORT || 5367
const SHOT = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-coven/.scratch/shots"
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
  const { FORMATIONS, resolveFormation } = await import("/src/data/heartwood/formations.js")
  const { ENEMIES, ACT_ENEMIES, NON_BATTLE_ENEMY_IDS } = await import("/src/data/heartwood/enemies.js")
  const { evaluateThreat } = await import("/src/data/heartwood/threatPreview.js")
  const { evaluateMatchup } = await import("/src/data/heartwood/counterplay.js")
  const { relicPool } = await import("/src/data/heartwood/relics.js")
  const targeting = await import("/src/services/heartwood/targeting.js")
  const {
    startRun, serializeRun, deserializeRun, RUN_SAVE_VERSION, RUN_PATH,
    buyInvestment, investmentOwned, SHOP_INVESTMENTS,
  } = engine
  const out = { errors: [] }

  const du = (defId) => ({ defId, upgradeLevel: 0, upgrades: [], itemIds: [] })
  const start = (formationId, squad, relics = []) =>
    auto.startAutoBattle("tommy", squad, formationId, relics, 0, {}, [], [], 1, null, "restless")
  const matronOf = (st) => st.enemies.find((e) => e.defId === "coven-matron")
  const frontOf = (st) => st.enemies.filter((e) => e.defId !== "coven-matron")
  const sumFrontStr = (st) => frontOf(st).filter((e) => e.hp > 0).reduce((s, e) => s + (e.powers?.strength || 0), 0)

  // 1. data --------------------------------------------------------------
  {
    const forms = [
      ["the-conclave", 3],
      ["the-choir", 3],
    ].map(([id, n]) => {
      const f = FORMATIONS[id]
      if (!f) return { id, ok: false }
      const noCenter = f.pieces.every((p) => !(p.pos.row === 1 && p.pos.col === 1))
      const matron = f.pieces.find((p) => p.defId === "coven-matron")
      const matronRow1 = matron?.pos.row === 1
      const label = f.synergy?.label === "The coven's blessing"
      const labelOnly = Array.isArray(f.synergy?.effects) && f.synergy.effects.length === 0
      return { id, ok: f.pieces.length === n && noCenter && matronRow1 && label && labelOnly, n: f.pieces.length }
    })
    const RB = ["coven-matron", "hex-acolyte", "bog-devotee"]
    const bodies = RB.map((id) => {
      const d = ENEMIES[id]
      const notInPool = !Object.values(ACT_ENEMIES).some((arr) => arr.includes(id))
      const onlyMatronHasAura = id === "coven-matron" ? !!d?.covenAura : !d?.covenAura
      return { id, ok: !!d && Number.isInteger(d.act) && NON_BATTLE_ENEMY_IDS.has(id) && notInPool && onlyMatronHasAura, hp: d?.maxHp }
    })
    out.data = { forms, bodies }
    if (!forms.every((x) => x.ok) || !bodies.every((x) => x.ok)) out.errors.push("check1 data")
  }

  // 2. applyCovenTick - the matron buffs the pack, linearly, not itself,
  //    and killing it stops the ramp ------------------------------------
  {
    const tank = [du("the-fool"), du("the-fool"), du("the-fool")]
    let st = start("the-conclave", tank)
    let s1 = auto.resolveRound(st)
    const front1 = frontOf(s1).filter((e) => e.hp > 0)
    const everyFrontGotOne = front1.length >= 2 && front1.every((e) => (e.powers?.strength || 0) >= 1)
    const matronNotSelfBuffed = (matronOf(s1)?.powers?.strength || 0) === 0
    // matron alive -> ramp climbs
    let sAlive = s1
    for (let i = 0; i < 2 && sAlive.phase === "player"; i++) sAlive = auto.resolveRound(sAlive)
    const alive3 = sumFrontStr(sAlive)
    // matron killed after round 1 -> ramp stops
    let sKilled = { ...s1, enemies: s1.enemies.map((e) => (e.defId === "coven-matron" ? { ...e, hp: 0 } : e)) }
    const killedBase = sumFrontStr(sKilled)
    for (let i = 0; i < 2 && sKilled.phase === "player"; i++) sKilled = auto.resolveRound(sKilled)
    const killed3 = sumFrontStr(sKilled)
    out.coven = { everyFrontGotOne, matronNotSelfBuffed, alive3, killedBase, killed3, roundAlive: sAlive.round }
    if (!(everyFrontGotOne && matronNotSelfBuffed && alive3 > killed3 && killed3 <= killedBase + 0.001)) {
      out.errors.push("check2 covenAura ramp / kill-the-matron-stops-it")
    }
  }

  // 3. the counters - reach past the shield + sunder strips the enchant -
  {
    // 3a: a rook attacker at col 2 lists the SHIELDED matron among its
    //     pattern targets (bishop/rook fan-out bypasses the shield check).
    const st = start("the-conclave", [du("strength"), du("strength"), du("rooks-charge")])
    const rook = st.playerUnits.find((u) => u.defId === "rooks-charge")
    const matronId = matronOf(st)?.id
    const matronShielded = targeting.isShielded(st, matronId)
    const cells = targeting.resolvePattern(st, "rook", rook.pos)
    const hitIds = targeting.piecesAtPositions(st, cells)
    const reachesMatron = hitIds.includes(matronId)
    // 3b: witch-cutter's onDealDamage->sunder strips the covenAura
    //     Strength stacks off the front piece it hits (bog-devotee, the
    //     frontmost). Low-damage filler so the fight lasts the 2 rounds.
    const bogStr = (carrier) => {
      let s = start("the-conclave", [du(carrier), du("the-fool"), du("the-fool")])
      s = auto.resolveRound(s) // one round: covenAura +1, then the carrier acts
      const bog = s.enemies.find((e) => e.defId === "bog-devotee")
      return { str: bog?.powers?.strength ?? -1, hp: bog?.hp ?? 0 }
    }
    const cut = bogStr("witch-cutter")
    const plain = bogStr("the-fool")
    out.counter = { matronShielded, reachesMatron, cut, plain }
    if (!(matronShielded && reachesMatron && plain.hp > 0 && cut.hp > 0 && plain.str >= 1 && cut.str < plain.str)) {
      out.errors.push("check3 counters (reach / sunder) not clearly better")
    }
  }

  // 4. both fights resolve vs a mid squad --------------------------------
  {
    const mid = [du("the-chariot"), du("stoneknoll"), du("the-fool")]
    const check = (fid) => {
      const d = auto.autoResolveBattle(start(fid, mid))
      return { fid, round: d.round, phase: d.phase, resolved: (d.phase === "won" || d.phase === "lost") && d.round < 30 }
    }
    const a = check("the-conclave")
    const b = check("the-choir")
    out.resolve = { a, b }
    if (!(a.resolved && b.resolved)) out.errors.push("check4 a Coven fight did not resolve under the cap")
  }

  // 5. RUN_PATH / save --------------------------------------------------
  {
    const ids = RUN_PATH.filter((n) => n.type === "battle" && n.formationId).map((n) => n.formationId)
    const hasConclave = ids.includes("the-conclave")
    const hasChoir = ids.includes("the-choir")
    const noOld = !ids.includes("bark-brutes-stand") && !ids.includes("bonewardens-watch")
    const plain = deserializeRun(JSON.parse(JSON.stringify(serializeRun(startRun("tommy")))))
    const withCoin = { ...startRun("tommy"), relics: ["marked-coin"] }
    const coinRt = deserializeRun(JSON.parse(JSON.stringify(serializeRun(withCoin))))
    const coinRtOk = coinRt != null && (coinRt.relics || []).includes("marked-coin")
    out.runpath = { len: RUN_PATH.length, hasConclave, hasChoir, noOld, plainOk: plain != null, coinRtOk, ver: RUN_SAVE_VERSION }
    if (!(hasConclave && hasChoir && noOld && plain != null && coinRtOk && RUN_PATH.length === 111 && RUN_SAVE_VERSION === 3)) {
      out.errors.push("check5 RUN_PATH / save")
    }
  }

  // 6. threat preview reads a coven pack -------------------------------
  {
    const f = resolveFormation("the-conclave")
    const roster = f.pieces.map((p, i) => ({ defId: p.defId, hp: 20, maxHp: ENEMIES[p.defId].maxHp, pos: p.pos, id: `e${i}` }))
    const rsBase = { ...startRun("tommy"), deployed: [] }
    const t = evaluateThreat(roster, rsBase, { type: "battle" })
    const mkRun = (benchDef) => {
      const rs = startRun("tommy")
      return {
        ...rs,
        bench: [{ key: 1, defId: benchDef, upgrades: [], upgradeLevel: 0, wins: 0 }],
        deployed: [1, null, null, null],
        items: [],
      }
    }
    const coveredPattern = evaluateMatchup(roster, mkRun("hexbreaker"))
    const coveredSunder = evaluateMatchup(roster, mkRun("witch-cutter"))
    const coveredSnipe = evaluateMatchup(roster, mkRun("oracle-eye"))
    const gapped = evaluateMatchup(roster, mkRun("strength"))
    out.threat = {
      primary: t.primary?.id,
      secondary: t.secondary?.id,
      mechanics: t.mechanics,
      patternHas: coveredPattern.covered.includes("coven"),
      sunderHas: coveredSunder.covered.includes("coven"),
      snipeHas: coveredSnipe.covered.includes("coven"),
      gapsHas: gapped.gaps.includes("coven"),
    }
    if (
      !(
        t.primary?.id === "coven" &&
        t.mechanics.includes("Empowers the pack") &&
        coveredPattern.covered.includes("coven") &&
        coveredSunder.covered.includes("coven") &&
        coveredSnipe.covered.includes("coven") &&
        gapped.gaps.includes("coven")
      )
    ) {
      out.errors.push("check6 threat preview / matchup")
    }
  }

  // 7. The Marked Coin (Ledger relic money sink) ----------------------
  {
    let rs = { ...startRun("tommy"), essence: 2000 }
    const cost = SHOP_INVESTMENTS["marked-coin"].cost
    const before = rs.essence
    rs = buyInvestment(rs, "marked-coin")
    const bought =
      rs.essence === before - cost &&
      investmentOwned(rs, "marked-coin") &&
      (rs.relics || []).includes("marked-coin")
    const rs2 = buyInvestment(rs, "marked-coin") // already owned -> no-op
    const noDouble = rs2.essence === rs.essence && (rs2.relics || []).filter((r) => r === "marked-coin").length === 1
    const notRollable = !relicPool().some((r) => r.id === "marked-coin")
    // battle start with it -> lowest-maxHp enemy (the matron) gets Vulnerable
    const st = start("the-conclave", [du("strength"), du("strength")], ["marked-coin"])
    const matronVuln = (matronOf(st)?.powers?.vulnerable || 0) >= 2
    const othersClean = frontOf(st).every((e) => (e.powers?.vulnerable || 0) === 0)
    out.coin = { cost, bought, noDouble, notRollable, matronVuln, othersClean }
    if (!(cost === 400 && bought && noDouble && notRollable && matronVuln && othersClean)) {
      out.errors.push("check7 The Marked Coin")
    }
  }

  return out
})

console.log(JSON.stringify(R, null, 2))
console.log("\npageErrors:", errs.length, errs.slice(0, 8))

// screenshot the FormationScreen vs the-conclave
try {
  await page.evaluate(async () => {
    const engine = await import("/src/services/heartwood/runEngine.js")
    const { RUN_PATH } = engine
    const idx = RUN_PATH.findIndex((n) => n.formationId === "the-conclave")
    let run = engine.startRun("tommy", null, { forcedSeed: 0xc0decafe })
    run = {
      ...run,
      nodeIndex: idx,
      path: RUN_PATH.slice(0, idx + 1),
      phase: "formation",
      lastSeenAct: 7,
      bench: [
        { key: 1, defId: "hexbreaker", upgrades: [], upgradeLevel: 0, wins: 0 },
        { key: 2, defId: "strength", upgrades: [], upgradeLevel: 0, wins: 0 },
      ],
      deployed: [1, 2, null, null],
      items: [],
    }
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(engine.serializeRun(run)))
    localStorage.setItem("heartwood-story-intro-seen", "1")
    localStorage.setItem("heartwood-coach-enabled-v1", "false")
  })
  await page.reload()
  await page.waitForSelector(".hw-coven-hint", { timeout: 20000 })
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${SHOT}/coven.png` })
  console.log("coven hint:", await page.$eval(".hw-coven-hint", (el) => el.textContent.replace(/\s+/g, " ").trim()))
  const threatLead = await page.$$eval(".hw-threat-lead, .hw-threat-preview", (els) => els.map((e) => e.textContent.replace(/\s+/g, " ").trim()).join(" | "))
  console.log("threat panel:", threatLead)
} catch (e) {
  console.log("shot skip:", e.message)
}

await browser.close()
const pass = R.errors.length === 0 && errs.length === 0
console.log(pass ? "\n✅ verify_coven PASS" : "\n❌ verify_coven FAIL")
process.exit(pass ? 0 : 1)
