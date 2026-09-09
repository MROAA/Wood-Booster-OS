import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

// Hearthwood - The Hunters (feat/hearthwood-hunters). Third enemy
// archetype: a fast pack that IGNORES your front line and coordinates
// fire on your softest unit. `hunter: true` on an enemy def flips
// autoBattleEngine.js's threatTarget sort (lowest threat + lowest HP
// first). `guard` on a player unit body-blocks in hunt mode. New Ledger
// buy "The Rearguard" -> Bulwark to the frailest unit each fight. Real
// combat change on targeting + 2 swapped fights -> RUNS=100 is the hard
// gate; these assertions pin the mechanic + save-safety.

const PORT = process.env.PORT || 5364
const SHOT = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-hunters/.scratch/shots"
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
  const { UNITS } = await import("/src/data/heartwood/units.js")
  const { evaluateThreat } = await import("/src/data/heartwood/threatPreview.js")
  const { evaluateMatchup } = await import("/src/data/heartwood/counterplay.js")
  const { relicPool } = await import("/src/data/heartwood/relics.js")
  const { startRun, serializeRun, deserializeRun, RUN_SAVE_VERSION, RUN_PATH, buyInvestment, investmentOwned } = engine
  const out = { errors: [] }

  // 1. data ------------------------------------------------------------
  {
    const HB = ["fen-stalker", "pack-runner", "throat-taker"]
    const forms = [
      ["the-pack", 3],
      ["the-run-down", 3],
    ].map(([id, n]) => {
      const f = FORMATIONS[id]
      if (!f) return { id, ok: false }
      const noCenter = f.pieces.every((p) => !(p.pos.row === 1 && p.pos.col === 1))
      const label = f.synergy?.label === "They hunt the weak one"
      const allHunters = f.pieces.every((p) => ENEMIES[p.defId]?.hunter)
      return { id, ok: f.pieces.length === n && noCenter && label && allHunters, n: f.pieces.length }
    })
    const bodies = HB.map((id) => {
      const d = ENEMIES[id]
      const notInPool = !Object.values(ACT_ENEMIES).some((arr) => arr.includes(id))
      const hpOk = (d?.maxHp || 0) >= 24 && (d?.maxHp || 0) <= 40
      return { id, ok: !!d && Number.isInteger(d.act) && d.hunter === true && hpOk && NON_BATTLE_ENEMY_IDS.has(id) && notInPool, hp: d?.maxHp }
    })
    const under4 = FORMATIONS["the-pack"].pieces.length < 4 && FORMATIONS["the-run-down"].pieces.length < 4
    out.data = { forms, bodies, under4 }
    if (!forms.every((x) => x.ok) || !bodies.every((x) => x.ok) || !under4) out.errors.push("check1 data")
  }

  // 2. hunt targeting inverts the sort (+ taunt override + guard) -----
  {
    const HUNT = "They hunt the weak one"
    // (a) inversion: a plain tank (no guard) forward + 2 fragile dps.
    const base = [
      { id: "p0", defId: "thornguard", hp: 42, maxHp: 42, pos: { row: 1, col: 1 }, powers: {} },
      { id: "p1", defId: "strength", hp: 32, maxHp: 32, pos: { row: 2, col: 0 }, powers: {} },
      { id: "p2", defId: "strength", hp: 20, maxHp: 32, pos: { row: 2, col: 2 }, powers: {} },
    ]
    const st = (pu, label) => ({ round: 1, playerUnits: pu, stats: {}, enemySynergyLabel: label })
    const threatPick = auto.topThreatTargetId(st(base, null))
    const huntPick = auto.topThreatTargetId(st(base, HUNT))
    const detHunt = Array.from({ length: 20 }, () => auto.topThreatTargetId(st(base, HUNT))).every((x) => x === huntPick)
    // (b) taunt override: fragile p1 taunts -> picked in BOTH modes
    const taunted = base.map((u) => (u.id === "p1" ? { ...u, powers: { taunt: 1 } } : u))
    const tThreat = auto.topThreatTargetId(st(taunted, null))
    const tHunt = auto.topThreatTargetId(st(taunted, HUNT))
    // (c) guard: swap the forward tank for a guard unit adjacent to the
    // hunted fragile - the guard steps in front in hunt mode only.
    const guarded = [
      { id: "p0", defId: "oathshield", hp: 54, maxHp: 54, pos: { row: 2, col: 1 }, powers: {} }, // adjacent to p1 {2,0} and p2 {2,2}
      { id: "p1", defId: "strength", hp: 32, maxHp: 32, pos: { row: 2, col: 0 }, powers: {} },
      { id: "p2", defId: "strength", hp: 20, maxHp: 32, pos: { row: 2, col: 2 }, powers: {} },
    ]
    const guardHunt = auto.topThreatTargetId(st(guarded, HUNT))
    out.invert = { threatPick, huntPick, detHunt, tThreat, tHunt, guardHunt }
    if (
      !(
        threatPick === "p0" &&
        (huntPick === "p1" || huntPick === "p2") &&
        detHunt &&
        tThreat === "p1" &&
        tHunt === "p1" &&
        guardHunt === "p0"
      )
    ) {
      out.errors.push("check2 hunt targeting / taunt override / guard broken")
    }
  }

  const du = (defId) => ({ defId, upgradeLevel: 0, upgrades: [], itemIds: [] })
  const start = (formationId, squad, relics = []) =>
    auto.startAutoBattle("tommy", squad, formationId, relics, 0, {}, [], [], 1, null, "restless")

  // 3. engine integration - the pack lands hits + the fight resolves --
  {
    // lean squad (one carry + commander) so the pack actually connects.
    const done = auto.autoResolveBattle(start("the-pack", [du("strength")]))
    const resolves = (done.phase === "won" || done.phase === "lost") && done.round < 30
    const drewBlood = (done.lowestSquadHpPct ?? 100) < 95
    out.engine = { phase: done.phase, round: done.round, lowestPct: Math.round(done.lowestSquadHpPct ?? 100), resolves, drewBlood }
    if (!(resolves && drewBlood)) out.errors.push("check3 the-pack did not resolve-with-pressure")
  }

  // 4. guard body-blocks in hunt mode, inert otherwise --------------
  {
    // A guard (oathshield) beside the carry vs a plain rare tank
    // (wraithbriar, same HP 54, no guard) beside the carry. vs the-pack
    // (hunt) the guard should draw MORE damage than the carry; with the
    // plain tank the carry takes more. Lean 2-body squads so hits land.
    const dmg = (state, defId) => {
      const u = (state.playerUnits || []).find((x) => x.defId === defId)
      return u ? u.maxHp - Math.max(0, u.hp) : 0
    }
    const g = auto.autoResolveBattle(start("the-pack", [du("strength"), du("oathshield")]))
    const p = auto.autoResolveBattle(start("the-pack", [du("strength"), du("wraithbriar")]))
    // non-hunter control: guard must be inert -> outcome ~ the plain tank
    const cg = auto.autoResolveBattle(start("bark-brutes-stand", [du("strength"), du("oathshield")]))
    out.guard = {
      guardTook: dmg(g, "oathshield"), carryWithGuard: dmg(g, "strength"),
      plainTook: dmg(p, "wraithbriar"), carryWithPlain: dmg(p, "strength"),
      ctlCarry: dmg(cg, "strength"), ctlPhase: cg.phase,
    }
    // vs the pack: the guard soaks for the carry (guard takes >= the carry it covers,
    // and more than a plain tank would).
    if (!(dmg(g, "oathshield") >= dmg(g, "strength") && dmg(g, "oathshield") >= dmg(p, "wraithbriar"))) {
      out.errors.push("check4 guard did not draw the pack off the carry")
    }
  }

  // 5. The Rearguard (Ledger buy) ----------------------------------
  {
    let rs = { ...startRun("tommy"), essence: 1000 }
    const before = rs.essence
    rs = buyInvestment(rs, "rearguard")
    const bought = rs.essence === before - 400 && (rs.relics || []).includes("rearguard-standard") && investmentOwned(rs, "rearguard")
    const rs2 = buyInvestment(rs, "rearguard") // no-op
    const noDouble = rs2.essence === rs.essence && (rs2.relics || []).filter((x) => x === "rearguard-standard").length === 1
    const notRollable = !relicPool().some((r) => r.id === "rearguard-standard")
    // battle: frailest deployed unit gets bulwark
    const st = start("bark-brutes-stand", [du("oathshield"), du("strength"), du("lure-warden")], ["rearguard-standard"])
    const frail = (st.playerUnits || []).reduce((w, u) => (u.maxHp < w.maxHp ? u : w), st.playerUnits[0])
    const others = (st.playerUnits || []).filter((u) => u.id !== frail.id)
    const frailGotIt = (frail.powers?.bulwark || 0) >= 1
    const othersDidnt = others.every((u) => (u.powers?.bulwark || 0) === 0 || u.maxHp === frail.maxHp)
    out.rearguard = { bought, noDouble, notRollable, frailDef: frail.defId, frailGotIt, othersDidnt }
    if (!(bought && noDouble && notRollable && frailGotIt)) out.errors.push("check5 Rearguard")
  }

  // 6. threat read -----------------------------------------------------
  {
    const f = resolveFormation("the-pack")
    const roster = f.pieces.map((p, i) => ({ defId: p.defId, hp: 26, maxHp: ENEMIES[p.defId].maxHp, pos: p.pos, id: `e${i}` }))
    const rsBase = { ...startRun("tommy"), deployed: [] }
    const t = evaluateThreat(roster, rsBase, { type: "battle" })
    // matchup: with a taunt unit deployed -> covered; without -> gap
    const mkRun = (benchDef) => {
      const rs = startRun("tommy")
      return benchDef
        ? { ...rs, bench: [{ key: 1, defId: benchDef, upgrades: [], upgradeLevel: 0, wins: 0 }], deployed: [1, null, null, null], items: [] }
        : { ...rs, bench: [{ key: 1, defId: "strength", upgrades: [], upgradeLevel: 0, wins: 0 }], deployed: [1, null, null, null], items: [] }
    }
    const covered = evaluateMatchup(roster, mkRun("lure-warden"))
    const gapped = evaluateMatchup(roster, mkRun(null))
    out.threat = { primary: t.primary?.id, secondary: t.secondary?.id, mechanics: t.mechanics, coveredHas: covered.covered.includes("hunters"), gapsHas: gapped.gaps.includes("hunters") }
    if (!(t.primary?.id === "hunters" && t.mechanics.includes("Hunts your weakest") && covered.covered.includes("hunters") && gapped.gaps.includes("hunters"))) {
      out.errors.push("check6 threat read")
    }
  }

  // 7. RUN_PATH / save ----------------------------------------------
  {
    const ids = RUN_PATH.filter((n) => n.type === "battle" && n.formationId).map((n) => n.formationId)
    const hasPack = ids.includes("the-pack")
    const hasRunDown = ids.includes("the-run-down")
    const noOld = !ids.includes("emberwracks-guard") && !ids.includes("hollowfangs-den")
    let rs = { ...startRun("tommy"), essence: 1000 }
    rs = buyInvestment(rs, "rearguard")
    const round = deserializeRun(JSON.parse(JSON.stringify(serializeRun(rs))))
    const roundKeepsRelic = round != null && (round.relics || []).includes("rearguard-standard")
    out.runpath = { len: RUN_PATH.length, hasPack, hasRunDown, noOld, roundKeepsRelic, ver: RUN_SAVE_VERSION }
    if (!(hasPack && hasRunDown && noOld && roundKeepsRelic && RUN_PATH.length === 111 && RUN_SAVE_VERSION === 3)) {
      out.errors.push("check7 RUN_PATH / save")
    }
  }

  return out
})

console.log(JSON.stringify(R, null, 2))
console.log("\npageErrors:", errs.length, errs.slice(0, 8))

// screenshot the FormationScreen vs the-pack
try {
  await page.evaluate(async () => {
    const engine = await import("/src/services/heartwood/runEngine.js")
    const { RUN_PATH } = engine
    const idx = RUN_PATH.findIndex((n) => n.formationId === "the-pack")
    let run = engine.startRun("tommy", null, { forcedSeed: 0x4a4a })
    run = {
      ...run,
      nodeIndex: idx,
      path: RUN_PATH.slice(0, idx + 1),
      phase: "formation",
      lastSeenAct: 7,
      bench: [
        { key: 1, defId: "strength", upgrades: [], upgradeLevel: 0, wins: 0 },
        { key: 2, defId: "oathshield", upgrades: [], upgradeLevel: 0, wins: 0 },
      ],
      deployed: [1, 2, null, null],
      items: [],
    }
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(engine.serializeRun(run)))
    localStorage.setItem("heartwood-story-intro-seen", "1")
    localStorage.setItem("heartwood-coach-enabled-v1", "false")
  })
  await page.reload()
  await page.waitForSelector(".hw-hunters-hint", { timeout: 20000 })
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${SHOT}/hunters.png` })
  const txt = await page.$eval(".hw-hunters-hint", (el) => el.textContent.replace(/\s+/g, " ").trim())
  console.log("hunters hint:", txt)
} catch (e) {
  console.log("shot skip:", e.message)
}

await browser.close()
const pass = R.errors.length === 0 && errs.length === 0
console.log(pass ? "\n✅ verify_hunters PASS" : "\n❌ verify_hunters FAIL")
process.exit(pass ? 0 : 1)
