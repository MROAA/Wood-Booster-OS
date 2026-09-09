import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

// Hearthwood - The Rot (feat/hearthwood-rot). Fourth enemy archetype:
// poison-stacking bodies that punish a slow fight + a per-piece FLAT
// turnStart heal 1 synergy ("The rot won't quit"). 3 rot defs
// (NON_BATTLE_ENEMY_IDS) + 2 formations, net-neutral RUN_PATH swaps.
// Player answers: mirekeeper (aura cleanse), bloomhide (regen), spitethorn
// (spite one-shot). Money sink: Field Antidote (a shop consumable).
// Real combat change on 2 fights + a synergy + 3 units -> RUNS=100 is
// the hard gate; these assertions pin the mechanic + save-safety.

const PORT = process.env.PORT || 5366
const SHOT = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-rot/.scratch/shots"
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
  const { startRun, serializeRun, deserializeRun, RUN_SAVE_VERSION, RUN_PATH, buyAntidote, antidoteCost, antidoteQueued } = engine
  const out = { errors: [] }

  // 1. data --------------------------------------------------------------
  {
    const RB = ["rotgut-crawler", "spore-lurcher", "mire-sworn"]
    const forms = [
      ["the-blight", 3],
      ["the-festering", 3],
    ].map(([id, n]) => {
      const f = FORMATIONS[id]
      if (!f) return { id, ok: false }
      const noCenter = f.pieces.every((p) => !(p.pos.row === 1 && p.pos.col === 1))
      const label = f.synergy?.label === "The rot won't quit"
      return { id, ok: f.pieces.length === n && noCenter && label, n: f.pieces.length }
    })
    const bodies = RB.map((id) => {
      const d = ENEMIES[id]
      const notInPool = !Object.values(ACT_ENEMIES).some((arr) => arr.includes(id))
      const hasPoison = (d?.movePattern || []).some((m) => m.type === "debuff" && m.id === "poison")
      return { id, ok: !!d && Number.isInteger(d.act) && hasPoison && NON_BATTLE_ENEMY_IDS.has(id) && notInPool, hp: d?.maxHp }
    })
    const festeringHasPlague = FORMATIONS["the-festering"].pieces.some((p) => p.defId === "plaguebearer")
    out.data = { forms, bodies, festeringHasPlague }
    if (!forms.every((x) => x.ok) || !bodies.every((x) => x.ok) || !festeringHasPlague) out.errors.push("check1 data")
  }

  const du = (defId) => ({ defId, upgradeLevel: 0, upgrades: [], itemIds: [] })
  const start = (formationId, squad, relics = []) =>
    auto.startAutoBattle("tommy", squad, formationId, relics, 0, {}, [], [], 1, null, "restless")

  // 2. synergy is a flat self-mend (turnStart heal 1, no ramp) ---------
  {
    let st = start("the-blight", [])
    const label = st.enemySynergyLabel === "The rot won't quit"
    const trig = (e) => (e.triggers || []).find((t) => t.trigger === "turnStart" && t.effect?.type === "heal")
    const eachHas = (st.enemies || []).length === 3 && st.enemies.every((e) => trig(e)?.effect?.amount === 1)
    let s = st
    for (let i = 0; i < 3 && s.phase === "player"; i++) s = auto.resolveRound(s)
    const stillFlat = (s.enemies || []).filter((e) => e.hp > 0).every((e) => (trig(e)?.effect?.amount ?? 1) === 1)
    out.synergy = { label, eachHas, stillFlat, round: s.round }
    if (!(label && eachHas && stillFlat)) out.errors.push("check2 synergy not a flat self-mend")
  }

  // 3. poison lands + the counters beat the grind ---------------------
  {
    const runB = (squad, relics = []) => {
      const d = auto.autoResolveBattle(start("the-blight", squad, relics))
      const poisonedEver = (d.log || []).some((l) => /poison/i.test(l))
      return { round: d.round, hp: d.lowestSquadHpPct ?? 1, phase: d.phase, poisonedEver }
    }
    // cleanse (mirekeeper adjacent) vs an all-plain squad of similar stats
    const cleanseSquad = [du("mirekeeper"), du("strength"), du("strength")]
    const plainSquad = [du("the-fool"), du("strength"), du("strength")]
    const cleanse = runB(cleanseSquad)
    const plain = runB(plainSquad)
    // burst (high attack) vs a slow squad
    const burst = runB([du("the-tower"), du("the-tower")])
    const slow = runB([du("the-fool"), du("the-fool")])
    out.counter = { cleanse, plain, burst, slow }
    if (
      !(
        plain.poisonedEver &&
        cleanse.hp >= plain.hp - 0.01 &&
        burst.round <= slow.round
      )
    ) {
      out.errors.push("check3 counters (cleanse HP / burst rounds) not clearly better")
    }
  }

  // 4. fights resolve vs a mid squad ---------------------------------
  {
    const mid = [du("the-chariot"), du("stoneknoll"), du("the-fool")]
    const check = (fid) => {
      const d = auto.autoResolveBattle(start(fid, mid))
      return { fid, round: d.round, phase: d.phase, resolved: (d.phase === "won" || d.phase === "lost") && d.round < 30 }
    }
    const a = check("the-blight")
    const b = check("the-festering")
    out.resolve = { a, b }
    if (!(a.resolved && b.resolved)) out.errors.push("check4 a Rot fight did not resolve under the cap")
  }

  // 5. RUN_PATH / save --------------------------------------------
  {
    const ids = RUN_PATH.filter((n) => n.type === "battle" && n.formationId).map((n) => n.formationId)
    const hasBlight = ids.includes("the-blight")
    const hasFestering = ids.includes("the-festering")
    const noOld = !ids.includes("embers-bulwark") && !ids.includes("quillfangs-warren")
    const round = deserializeRun(JSON.parse(JSON.stringify(serializeRun(startRun("tommy")))))
    out.runpath = { len: RUN_PATH.length, hasBlight, hasFestering, noOld, roundOk: round != null, ver: RUN_SAVE_VERSION }
    if (!(hasBlight && hasFestering && noOld && round != null && RUN_PATH.length === 111 && RUN_SAVE_VERSION === 3)) {
      out.errors.push("check5 RUN_PATH / save")
    }
  }

  // 6. threat preview reads a poison pack --------------------------
  {
    const f = resolveFormation("the-blight")
    const roster = f.pieces.map((p, i) => ({ defId: p.defId, hp: 30, maxHp: ENEMIES[p.defId].maxHp, pos: p.pos, id: `e${i}` }))
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
    const covered = evaluateMatchup(roster, mkRun("mirekeeper"))
    const gapped = evaluateMatchup(roster, mkRun("strength"))
    out.threat = {
      primary: t.primary?.id,
      mechanics: t.mechanics,
      coveredHas: covered.covered.includes("poison"),
      gapsHas: gapped.gaps.includes("poison"),
    }
    if (!(t.primary?.id === "poison" && t.mechanics.includes("Applies Poison") && covered.covered.includes("poison") && gapped.gaps.includes("poison"))) {
      out.errors.push("check6 threat preview")
    }
  }

  // 7. Field Antidote (shop consumable) ----------------------------
  {
    // keep nodeIndex/path from startRun so deserializeRun's shape check
    // (path.length === nodeIndex + 1) passes for the round-trip.
    let rs = { ...startRun("tommy"), essence: 2000 }
    const cost = antidoteCost(rs)
    const before = rs.essence
    rs = buyAntidote(rs)
    const bought =
      rs.essence === before - cost &&
      antidoteQueued(rs) &&
      (rs.pendingActiveEffects || []).some((e) => e.id === "regen" && e.amount === 2)
    const rs2 = buyAntidote(rs) // already queued -> no-op
    const noDouble = rs2.essence === rs.essence && (rs2.pendingActiveEffects || []).filter((e) => e.id === "regen").length === 1
    // battle start consumes it -> every deployed unit has regen >= 2
    const st = auto.startAutoBattle("tommy", [du("strength"), du("strength")], "rotwood-husk-pair", [], 0, {}, [], rs.pendingActiveEffects, 1, null, "restless")
    const applied = (st.playerUnits || []).filter((u) => u.id.startsWith("p")).every((u) => (u.powers?.regen || 0) >= 2)
    const roundTrip = deserializeRun(JSON.parse(JSON.stringify(serializeRun(rs))))
    const rtOk = roundTrip != null && antidoteQueued(roundTrip)
    out.antidote = { cost, bought, noDouble, applied, rtOk }
    if (!(bought && noDouble && applied && rtOk)) out.errors.push("check7 Field Antidote")
  }

  // 8. mirekeeper aura scrubs an adjacent ally's poison ------------
  {
    const withKeeper = start("the-blight", [du("mirekeeper"), du("strength"), du("strength")])
    const withoutKeeper = start("the-blight", [du("the-fool"), du("strength"), du("strength")])
    // force poison 3 onto the ally next to slot 0, run one round
    const poisonSlot1 = (st) => {
      const pu = st.playerUnits.map((u) => (u.id === "p1" ? { ...u, powers: { ...u.powers, poison: 3 } } : u))
      return auto.resolveRound({ ...st, playerUnits: pu })
    }
    const a = poisonSlot1(withKeeper).playerUnits.find((u) => u.id === "p1")?.powers?.poison ?? 9
    const b = poisonSlot1(withoutKeeper).playerUnits.find((u) => u.id === "p1")?.powers?.poison ?? 9
    out.aura = { withKeeper: a, withoutKeeper: b }
    if (!(a < b)) out.errors.push("check8 mirekeeper aura did not scrub poison")
  }

  // 9. spite one-shot --------------------------------------------
  {
    // spitethorn in a squad; force squad poison to 3, run a round -> +6 str, once.
    const st = start("the-blight", [du("spitethorn"), du("strength"), du("strength")])
    const withPoison = auto.resolveRound({
      ...st,
      playerUnits: st.playerUnits.map((u) => (u.id === "p1" ? { ...u, powers: { ...u.powers, poison: 4 } } : u)),
    })
    const spTh = withPoison.playerUnits.find((u) => u.defId === "spitethorn")
    const noPoison = auto.resolveRound(st).playerUnits.find((u) => u.defId === "spitethorn")
    // fire again next round -> no further gain (one-shot)
    const again = auto.resolveRound({
      ...withPoison,
      round: withPoison.round + 1,
      playerUnits: withPoison.playerUnits.map((u) => (u.id === "p1" ? { ...u, powers: { ...u.powers, poison: 4 } } : u)),
    }).playerUnits.find((u) => u.defId === "spitethorn")
    out.spite = {
      strWithPoison: spTh?.powers?.strength,
      strNoPoison: noPoison?.powers?.strength,
      woke: !!spTh?.powers?.spiteWoke,
      strAfterAgain: again?.powers?.strength,
    }
    if (!((spTh?.powers?.strength || 0) > (noPoison?.powers?.strength || 0) && spTh?.powers?.spiteWoke && again?.powers?.strength === spTh?.powers?.strength)) {
      out.errors.push("check9 spite one-shot")
    }
  }

  return out
})

console.log(JSON.stringify(R, null, 2))
console.log("\npageErrors:", errs.length, errs.slice(0, 8))

// screenshot the FormationScreen vs the-blight
try {
  await page.evaluate(async () => {
    const engine = await import("/src/services/heartwood/runEngine.js")
    const { RUN_PATH } = engine
    const idx = RUN_PATH.findIndex((n) => n.formationId === "the-blight")
    let run = engine.startRun("tommy", null, { forcedSeed: 0x707707 })
    run = {
      ...run,
      nodeIndex: idx,
      path: RUN_PATH.slice(0, idx + 1),
      phase: "formation",
      lastSeenAct: 7,
      bench: [
        { key: 1, defId: "mirekeeper", upgrades: [], upgradeLevel: 0, wins: 0 },
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
  await page.waitForSelector(".hw-rot-hint", { timeout: 20000 })
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${SHOT}/rot.png` })
  console.log("rot hint:", await page.$eval(".hw-rot-hint", (el) => el.textContent.replace(/\s+/g, " ").trim()))
} catch (e) {
  console.log("shot skip:", e.message)
}

await browser.close()
const pass = R.errors.length === 0 && errs.length === 0
console.log(pass ? "\n✅ verify_rot PASS" : "\n❌ verify_rot FAIL")
process.exit(pass ? 0 : 1)
