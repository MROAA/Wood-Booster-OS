import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

// Hearthwood - The Brood (feat/hearthwood-brood). 6th enemy archetype:
// an enemy that SPLITS into smaller copies of itself when it dies. First
// archetype that needs new combat machinery - a generic enemy-side
// onDeath trigger (effects.js's dealDamage/loseHp, fired BEFORE
// checkBattleEnd) + a `broodSplit` effect. Bounded: HP-reduced COPIES of
// the parent (state.enemyDefs), a broodGen/maxGen guard against
// re-splitting, spawns only on free enemy cells (6-cell organic cap),
// and `spawnedThisRound` makes them sit out the round they appear.
// Real combat change + a new hook -> RUNS=100 is the hard gate; these
// assertions pin the mechanic + the no-premature-win timing.

const PORT = process.env.PORT || 5369
const SHOT = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-brood/.scratch/shots"
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
  const effects = await import("/src/services/heartwood/effects.js")
  const { FORMATIONS, resolveFormation } = await import("/src/data/heartwood/formations.js")
  const { ENEMIES, ACT_ENEMIES, NON_BATTLE_ENEMY_IDS } = await import("/src/data/heartwood/enemies.js")
  const { evaluateThreat } = await import("/src/data/heartwood/threatPreview.js")
  const { evaluateMatchup } = await import("/src/data/heartwood/counterplay.js")
  const { startRun, serializeRun, deserializeRun, RUN_SAVE_VERSION, RUN_PATH } = engine
  const out = { errors: [] }

  const du = (defId) => ({ defId, upgradeLevel: 0, upgrades: [], itemIds: [] })
  const start = (formationId, squad, relics = []) =>
    auto.startAutoBattle("tommy", squad, formationId, relics, 0, {}, [], [], 1, null, "restless")
  const living = (st) => (st.enemies || []).filter((e) => e.hp > 0)
  const mothersAlive = (st) => living(st).filter((e) => e.defId === "brood-mother" && !(e.broodGen > 0))
  const hatchlings = (st) => (st.enemies || []).filter((e) => e.broodGen > 0)

  // 1. data --------------------------------------------------------------
  {
    const forms = [
      ["the-clutch", 3],
      ["the-hatchery", 3],
    ].map(([id, n]) => {
      const f = FORMATIONS[id]
      if (!f) return { id, ok: false }
      const label = f.synergy?.label === "The brood multiplies"
      const labelOnly = Array.isArray(f.synergy?.effects) && f.synergy.effects.length === 0
      return { id, ok: !!f && f.pieces.length === n && label && labelOnly, n: f.pieces?.length }
    })
    const mother = ENEMIES["brood-mother"]
    const tender = ENEMIES["brood-tender"]
    const dataOk =
      mother && mother.broodSplit && mother.broodSplit.count === 2 && mother.broodSplit.maxGen === 1 &&
      tender && !tender.broodSplit &&
      Number.isInteger(mother.act) && Number.isInteger(tender.act) &&
      NON_BATTLE_ENEMY_IDS.has("brood-mother") && NON_BATTLE_ENEMY_IDS.has("brood-tender") &&
      !Object.values(ACT_ENEMIES).some((arr) => arr.includes("brood-mother") || arr.includes("brood-tender"))
    out.data = { forms, motherSplit: mother?.broodSplit, tenderSplit: tender?.broodSplit || null }
    if (!forms.every((x) => x.ok) || !dataOk) out.errors.push("check1 data")
  }

  // --- synthetic-state helpers for the surgical checks --------------
  const MHP = ENEMIES["brood-mother"].maxHp
  const BS = ENEMIES["brood-mother"].broodSplit
  const HF = BS.hpFactor
  const EXPECT_SPAWN_HP = Math.round(MHP * HF)
  const ONDEATH = { trigger: "onDeath", effect: { type: "broodSplit", ...BS } }
  const mkMother = (id, pos, hp = 3, extra = {}) => ({
    id, defId: "brood-mother", hp, maxHp: MHP, pos, block: 0, powers: {}, triggers: [ONDEATH], broodGen: 0, ...extra,
  })
  const mkState = (enemies) => ({
    phase: "player",
    round: 1,
    enemies,
    playerUnits: [{ id: "p0", defId: "the-fool", hp: 40, maxHp: 40, pos: { row: 2, col: 1 }, block: 0, powers: {}, triggers: [] }],
    log: [],
    stats: {},
    roundEvents: [],
    enemyDefs: { "brood-mother": ENEMIES["brood-mother"] },
    grid: { rows: 3, cols: 3 },
  })
  const hit = (st, targetId, amount = 6) =>
    effects.applyEffects(st, [{ type: "damage", amount }], { actorId: "p0", targetId })

  // 2. onDeath split - a dying mother tears into `count` HP-reduced
  //    COPIES; the fight does NOT flip to "won" even though she was the
  //    only original enemy (spawns keep it open) -----------------------
  {
    const st = mkState([mkMother("m0", { row: 0, col: 1 })])
    const after = hit(st, "m0")
    const spawns = after.enemies.filter((e) => e.id !== "m0")
    const s0 = spawns[0] || {}
    out.split = {
      added: spawns.length,
      maxHp: spawns.map((x) => x.maxHp),
      expectMaxHp: EXPECT_SPAWN_HP,
      gen: spawns.every((x) => x.broodGen === 1),
      hasIntent: spawns.every((x) => x.intent && x.intent.type),
      copyDefId: spawns.every((x) => x.defId === "brood-mother"),
      noOwnTrigger: spawns.every((x) => (x.triggers || []).length === 0),
      onEnemyCells: spawns.every((x) => x.pos.row >= 0 && x.pos.row <= 1 && x.pos.col >= 0 && x.pos.col <= 2),
      distinctCells: new Set(spawns.map((x) => `${x.pos.row}-${x.pos.col}`)).size === spawns.length,
      phase: after.phase,
    }
    if (
      spawns.length !== 2 ||
      Math.abs(s0.maxHp - EXPECT_SPAWN_HP) > 1 ||
      !out.split.gen ||
      !out.split.hasIntent ||
      !out.split.copyDefId ||
      !out.split.noOwnTrigger ||
      !out.split.onEnemyCells ||
      !out.split.distinctCells ||
      after.phase !== "player" // the premature-win guard held
    ) {
      out.errors.push("check2 onDeath split / no-premature-win")
    }
  }

  // 3. a spawned hatchling is a live combatant the same round - it acts
  //    in the enemy phase of the round it was born ("kill fast, eat two
  //    more" is the archetype's point) --------------------------------
  {
    // fool squad so the fight lasts; hand only the frontmost mother to
    // 1hp so exactly one splits in round 1.
    let st = start("the-clutch", [du("the-fool"), du("the-fool"), du("the-fool")])
    st = {
      ...st,
      enemies: st.enemies.map((e) => (e.id === "e0" && e.defId === "brood-mother" ? { ...e, hp: 1 } : e)),
    }
    const s1 = auto.resolveRound(st) // round 1: mother 0 dies mid player phase -> 2 spawns, then enemy phase
    const r1Ids = hatchlings(s1).map((x) => x.id)
    // at least one of the round-1 spawns dealt damage during round 1's
    // enemy phase (no sit-out) OR advanced its moveIndex
    const spawns = s1.enemies.filter((e) => r1Ids.includes(e.id))
    const actedR1 = spawns.some((x) => (s1.stats?.[x.id]?.damageDealt || 0) > 0 || (x.moveIndex || 0) > 0)
    out.sitOut = { spawned: r1Ids.length, actedR1, noSitOutField: spawns.every((x) => x.spawnedThisRound === undefined) }
    if (!(r1Ids.length > 0 && actedR1 && out.sitOut.noSitOutField)) out.errors.push("check3 spawn is live same-round")
  }

  // 4. no infinite recursion - a gen-1 hatchling dies WITHOUT splitting,
  //    even if it were somehow handed an onDeath trigger --------------
  {
    // (a) realistic: a spawn carries triggers:[] -> killing it fires nothing
    const st = mkState([mkMother("m0", { row: 0, col: 1 })])
    const afterSplit = hit(st, "m0")
    const spawnId = afterSplit.enemies.find((e) => e.broodGen === 1)?.id
    const afterKill = hit(afterSplit, spawnId, 30)
    const grewA = afterKill.enemies.length > afterSplit.enemies.length
    // (b) belt: a gen-1 body WITH the onDeath trigger -> broodSplit's
    //     broodGen>=maxGen guard still blocks it
    const st2 = mkState([{ id: "h0", defId: "brood-mother", hp: 2, maxHp: 15, pos: { row: 1, col: 1 }, block: 0, powers: {}, triggers: [ONDEATH], broodGen: 1 }])
    const afterKill2 = hit(st2, "h0", 30)
    const grewB = afterKill2.enemies.length > st2.enemies.length
    out.recursion = { grewA, grewB }
    if (grewA || grewB) out.errors.push("check4 hatchling re-split (infinite recursion)")
  }

  // 5. board cap - broodSplit onto a state with only 1 free enemy cell -
  {
    // build a synthetic dead mother + 5 living blockers filling 5 of the
    // 6 rows-0-1 cells, call broodSplit directly.
    const cells = []
    for (let r = 0; r <= 1; r++) for (let c = 0; c <= 2; c++) cells.push({ row: r, col: c })
    const blockers = cells.slice(0, 5).map((pos, i) => ({ id: `blk${i}`, defId: "brood-mother", hp: 10, maxHp: 10, pos, block: 0, powers: {}, triggers: [] }))
    const deadMother = { id: "dead", defId: "brood-mother", hp: 0, maxHp: 34, pos: cells[5], block: 0, powers: {}, triggers: [], broodGen: 0 }
    const synthetic = {
      phase: "player",
      enemies: [...blockers, deadMother],
      playerUnits: [{ id: "p0", defId: "the-fool", hp: 20, maxHp: 20, pos: { row: 2, col: 0 }, block: 0, powers: {}, triggers: [] }],
      log: [],
      enemyDefs: { "brood-mother": ENEMIES["brood-mother"] },
      grid: { rows: 3, cols: 3 },
    }
    const after = effects.applyEffects(synthetic, [{ type: "broodSplit", count: 2, hpFactor: 0.45, maxGen: 1 }], { actorId: "dead", targetId: "dead" })
    const added = after.enemies.length - synthetic.enemies.length
    out.cap = { added }
    if (added !== 1) out.errors.push("check5 board cap (expected exactly 1 spawn into 1 free cell)")
  }

  // 6. both fights resolve vs a mid squad ------------------------------
  {
    const mid = [du("the-chariot"), du("stoneknoll"), du("the-fool")]
    const check = (fid) => {
      const d = auto.autoResolveBattle(start(fid, mid))
      return { fid, round: d.round, phase: d.phase, resolved: (d.phase === "won" || d.phase === "lost") && d.round < 30 }
    }
    const a = check("the-clutch")
    const b = check("the-hatchery")
    out.resolve = { a, b }
    if (!(a.resolved && b.resolved)) out.errors.push("check6 a Brood fight did not resolve under the cap")
  }

  // 7. the counters - each one's mechanic verified directly ----------
  {
    // (a) a rook attacker's swing lists a mother AND a spawn beside her
    //     in the same fan-out (bramble-sweep clears the pair in one hit).
    const targeting = await import("/src/services/heartwood/targeting.js")
    const boardState = {
      grid: { rows: 3, cols: 3 },
      enemies: [
        { id: "m0", hp: 20, pos: { row: 0, col: 0 } },
        { id: "s0", hp: 15, pos: { row: 1, col: 0 } },
        { id: "s1", hp: 15, pos: { row: 0, col: 1 } },
      ],
    }
    const sweeper = start("the-clutch", [du("bramble-sweep"), du("the-fool"), du("the-fool")]).playerUnits.find((u) => u.defId === "bramble-sweep")
    const cells = targeting.resolvePattern(boardState, "rook", sweeper.pos)
    const hitIds = targeting.piecesAtPositions(boardState, cells)
    const sweepsMultiple = hitIds.length >= 2

    // (b) Chain: culler kills its target, the SAME swing carries a
    //     chainDamage hit into the next living body. Isolate it - a lone
    //     culler, a 1-hp body it kills + one full body it must chain to
    //     (both broodGen 1 so the kill doesn't split and muddy it).
    const base = start("the-clutch", [du("culler"), du("the-fool"), du("the-fool")])
    const cullerUnit = base.playerUnits.find((u) => u.defId === "culler")
    const st = {
      ...base,
      playerUnits: [{ ...cullerUnit, pos: { row: 2, col: 1 } }],
      enemies: [
        { id: "kill", defId: "brood-mother", hp: 1, maxHp: 34, pos: { row: 0, col: 0 }, block: 0, powers: {}, triggers: [], broodGen: 1, moveIndex: 0, intent: { type: "attack", amount: 4 } },
        { id: "victim", defId: "brood-mother", hp: 34, maxHp: 34, pos: { row: 0, col: 2 }, block: 0, powers: {}, triggers: [], broodGen: 1, moveIndex: 0, intent: { type: "attack", amount: 4 } },
      ],
    }
    const afterChain = auto.resolveRound(st)
    const victimHp = afterChain.enemies.find((e) => e.id === "victim")?.hp ?? 34
    out.counter = { sweepsMultiple, hitIds: hitIds.length, victimHp, chained: victimHp <= 30 }
    if (!(sweepsMultiple && victimHp <= 30)) {
      out.errors.push("check7 counters (AoE fan-out / chain carry) not proven")
    }
  }

  // 8. RUN_PATH / save -----------------------------------------------
  {
    const ids = RUN_PATH.filter((n) => n.type === "battle" && n.formationId).map((n) => n.formationId)
    const hasClutch = ids.includes("the-clutch")
    const hasHatchery = ids.includes("the-hatchery")
    const noOld = !ids.includes("the-unbroken-root") && !ids.includes("the-withering-pact")
    const rt = deserializeRun(JSON.parse(JSON.stringify(serializeRun(startRun("tommy")))))
    out.runpath = { len: RUN_PATH.length, hasClutch, hasHatchery, noOld, rtOk: rt != null, ver: RUN_SAVE_VERSION }
    if (!(hasClutch && hasHatchery && noOld && rt != null && RUN_PATH.length === 111 && RUN_SAVE_VERSION === 3)) {
      out.errors.push("check8 RUN_PATH / save")
    }
  }

  // 9. threat preview reads a brood pack -----------------------------
  {
    const f = resolveFormation("the-clutch")
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
    const coveredAoe = evaluateMatchup(roster, mkRun("bramble-sweep"))
    const coveredExec = evaluateMatchup(roster, mkRun("culler"))
    const gapped = evaluateMatchup(roster, mkRun("the-hermit"))
    out.threat = {
      primary: t.primary?.id,
      mechanics: t.mechanics,
      aoeHas: coveredAoe.covered.includes("brood"),
      execHas: coveredExec.covered.includes("brood"),
      gapsHas: gapped.gaps.includes("brood"),
    }
    if (
      !(
        t.primary?.id === "brood" &&
        t.mechanics.includes("Splits when killed") &&
        coveredAoe.covered.includes("brood") &&
        coveredExec.covered.includes("brood") &&
        gapped.gaps.includes("brood")
      )
    ) {
      out.errors.push("check9 threat preview / matchup")
    }
  }

  return out
})

console.log(JSON.stringify(R, null, 2))
console.log("\npageErrors:", errs.length, errs.slice(0, 8))

// screenshot the FormationScreen vs the-clutch
try {
  await page.evaluate(async () => {
    const engine = await import("/src/services/heartwood/runEngine.js")
    const { RUN_PATH } = engine
    const idx = RUN_PATH.findIndex((n) => n.formationId === "the-clutch")
    let run = engine.startRun("tommy", null, { forcedSeed: 0xb0b0 })
    run = {
      ...run,
      nodeIndex: idx,
      path: RUN_PATH.slice(0, idx + 1),
      phase: "formation",
      lastSeenAct: 7,
      bench: [
        { key: 1, defId: "bramble-sweep", upgrades: [], upgradeLevel: 0, wins: 0 },
        { key: 2, defId: "culler", upgrades: [], upgradeLevel: 0, wins: 0 },
      ],
      deployed: [1, 2, null, null],
      items: [],
    }
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(engine.serializeRun(run)))
    localStorage.setItem("heartwood-story-intro-seen", "1")
    localStorage.setItem("heartwood-coach-enabled-v1", "false")
  })
  await page.reload()
  await page.waitForSelector(".hw-brood-hint", { timeout: 20000 })
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${SHOT}/brood.png` })
  console.log("brood hint:", await page.$eval(".hw-brood-hint", (el) => el.textContent.replace(/\s+/g, " ").trim()))
  console.log("threat panel:", await page.$eval(".hw-threat-preview", (el) => el.textContent.replace(/\s+/g, " ").trim()).catch(() => "(none)"))
} catch (e) {
  console.log("shot skip:", e.message)
}

await browser.close()
const pass = R.errors.length === 0 && errs.length === 0
console.log(pass ? "\n✅ verify_brood PASS" : "\n❌ verify_brood FAIL")
process.exit(pass ? 0 : 1)
