import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

// Hearthwood - Player Power Score (feat/hearthwood-player-power).
// DifficultyEngine Phase 1: a pure MAGNITUDE analyzer of a run's real
// strength (7 components + total + band + ratio vs expected), a "for
// your build" line on the threat preview, a Scout Ahead Essence sink,
// and a small coherence-rewards package (1 relic + 1 unit). The
// analyzer + readout + threat line + scout are presentation-only;
// only the relic + units touch combat.

const PORT = process.env.PORT || 5365
const SHOT = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-player-power/.scratch/shots"
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
  const pp = await import("/src/data/heartwood/playerPower.js")
  const tp = await import("/src/data/heartwood/threatPreview.js")
  const { RELICS } = await import("/src/data/heartwood/relics.js")
  const { UNITS } = await import("/src/data/heartwood/units.js")
  const { evaluatePlayerPower, POWER_BANDS, POWER_COMPONENTS, scoutReport } = pp
  const { startRun, serializeRun, deserializeRun, RUN_SAVE_VERSION, RUN_PATH, scoutAhead, scoutCost, nextBattleNodeIndex } = engine
  const out = { errors: [] }

  const mkRun = (over) => {
    const rs = startRun("tommy")
    return { ...rs, items: [], ...over }
  }
  const bench = (ids) => ids.map((defId, i) => ({ key: i + 1, defId, upgrades: [], upgradeLevel: 0, wins: 0 }))
  const deployAll = (ids) => ids.map((_, i) => i + 1).concat([null, null, null]).slice(0, 4)

  // 1. curated runs ---------------------------------------------------
  {
    const empty = evaluatePlayerPower(mkRun({ bench: [], deployed: [null, null, null, null] }))
    // 4 disjoint Legendaries, no synergy, no items
    const legIds = ["world-ash-elder", "the-thorn-throne", "bulwark-of-ages", "deepwood-sovereign"]
    const disjoint = evaluatePlayerPower(mkRun({ bench: bench(legIds), deployed: deployAll(legIds), nodeIndex: 40 }))
    // coherent warden board past the 2-threshold + a couple items
    const cohIds = ["oathshield", "keystone-warden", "lure-warden", "wardens-sigil-holder-x"]
    const cohBench = bench(["oathshield", "keystone-warden", "lure-warden", "evenwood-elder"])
    const coherent = evaluatePlayerPower(
      mkRun({
        bench: cohBench,
        deployed: [1, 2, 3, 4],
        nodeIndex: 40,
        items: [
          { defId: "ember-charm", equippedTo: 1 },
          { defId: "bark-plating", equippedTo: 2 },
        ],
        marketLevel: 3,
      }),
    )
    // stacked squad early -> Overwhelming
    const stackedEarly = evaluatePlayerPower(
      mkRun({ bench: bench(legIds), deployed: deployAll(legIds), nodeIndex: 3, marketLevel: 4, commanderRank: 3, essence: 800 }),
    )
    out.curated = {
      empty: { total: empty.total, band: empty.band, gap: empty.gap.id },
      disjoint: { total: disjoint.total, coh: disjoint.components.coherence, gap: disjoint.gap.id, band: disjoint.band },
      coherent: { total: coherent.total, coh: coherent.components.coherence, syn: coherent.components.synergy, ratio: coherent.ratio },
      stackedEarly: { ratio: stackedEarly.ratio, band: stackedEarly.band },
    }
    const ok =
      empty.total === 0 &&
      empty.band === "Fragile" &&
      empty.gap.id === "unit" &&
      ["synergy", "coherence"].includes(disjoint.gap.id) &&
      coherent.components.coherence > disjoint.components.coherence &&
      coherent.components.synergy > disjoint.components.synergy &&
      coherent.total >= disjoint.total &&
      stackedEarly.ratio > coherent.ratio &&
      ["Strong", "Commanding", "Overwhelming"].includes(stackedEarly.band)
    if (!ok) out.errors.push("check1 curated player-power")
  }

  // 2. shape / purity ----------------------------------------------
  {
    const rs = mkRun({
      bench: bench(["oathshield", "keystone-warden"]),
      deployed: [1, 2, null, null],
      nodeIndex: 20,
    })
    const snap = JSON.stringify(rs)
    const a = evaluatePlayerPower(rs)
    const b = evaluatePlayerPower(rs)
    const shapeOk =
      POWER_COMPONENTS.every((c) => Number.isFinite(a.components[c.id]) && a.components[c.id] >= 0) &&
      POWER_BANDS.includes(a.band) &&
      POWER_COMPONENTS.some((c) => c.id === a.lead) &&
      ["synergy", "item", "relic", "coherence"].includes(a.gap.id)
    const pureOk = JSON.stringify(rs) === snap && JSON.stringify(a) === JSON.stringify(b)
    const noKey = !("playerPower" in startRun("tommy"))
    out.shape = { shapeOk, pureOk, noKey }
    if (!(shapeOk && pureOk && noKey)) out.errors.push("check2 shape/purity")
  }

  // 3. threat relative line --------------------------------------
  {
    // a beefy 4-piece roster -> a mid/high enemy-only rating; the SAME
    // node for all three so the 4th arg is the only variable.
    const roster = [0, 1, 2, 3].map((i) => ({
      defId: "rotwood-husk",
      hp: 55,
      maxHp: 55,
      pos: { row: i < 2 ? 0 : 1, col: i % 2 === 0 ? 0 : 2 },
      id: `e${i}`,
    }))
    const rs = startRun("tommy")
    const node = { type: "battle" }
    const plain = tp.evaluateThreat(roster, rs, node)
    const strong = tp.evaluateThreat(roster, rs, node, { ratio: 2.6 })
    const weak = tp.evaluateThreat(roster, rs, node, { ratio: 0.5 })
    const ratingSame = plain.rating === strong.rating && plain.rating === weak.rating
    out.relative = {
      rating: plain.rating,
      plainNull: plain.relative === null,
      strong: strong.relative?.tone,
      weak: weak.relative?.tone,
      ratingSame,
    }
    if (!(plain.relative === null && strong.relative?.tone === "good" && weak.relative?.tone === "bad" && ratingSame)) {
      out.errors.push("check3 threat relative line")
    }
  }

  // 4. Scout Ahead ------------------------------------------------
  {
    let rs = {
      ...startRun("tommy"),
      essence: 5000,
      nodeIndex: 2,
      bench: bench(["oathshield", "keystone-warden"]),
      deployed: [1, 2, null, null],
    }
    const init0 = (startRun("tommy").scoutedThrough || 0) === 0
    const nb = nextBattleNodeIndex(rs)
    const cost = scoutCost(rs)
    const before = rs.essence
    rs = scoutAhead(rs)
    const scouted = rs.essence === before - cost && rs.scoutedThrough === nb && nb > 2
    const rs2 = scoutAhead(rs) // already scouted through nb -> should still spend for the NEXT fight OR no-op
    const monotonic = (rs2.scoutedThrough || 0) >= rs.scoutedThrough
    const rep = scoutReport(rs, rs.scoutedThrough)
    const t0 = performance.now()
    for (let i = 0; i < 50; i++) scoutReport(rs, rs.scoutedThrough)
    const fast = performance.now() - t0 < 400 // 50 reports well under 400ms => no startAutoBattle dry-run
    const repOk = rep && tp.THREAT_RATINGS.includes(rep.ratingLabel) && typeof rep.relative?.label === "string"
    const round = deserializeRun(JSON.parse(JSON.stringify(serializeRun({ ...startRun("tommy"), scoutedThrough: 7 }))))
    const roundOk = round != null && round.scoutedThrough === 7
    // legacy save without the key
    const legacy = deserializeRun(
      JSON.parse(JSON.stringify(serializeRun((() => { const r = startRun("tommy"); delete r.scoutedThrough; return r })()))),
    )
    const legacyOk = legacy != null && (legacy.scoutedThrough || 0) === 0
    out.scout = { init0, cost, scouted, monotonic, repOk, fast, roundOk, legacyOk, ver: RUN_SAVE_VERSION }
    if (!(init0 && scouted && monotonic && repOk && fast && roundOk && legacyOk && RUN_SAVE_VERSION === 3)) {
      out.errors.push("check4 Scout")
    }
  }

  // 5. coherence relic + unit (combat) --------------------------
  {
    const du = (defId) => ({ defId, upgradeLevel: 0, upgrades: [], itemIds: [] })
    const start = (squad, relics) => auto.startAutoBattle("tommy", squad, "rotwood-husk-pair", relics, 0, {}, [], [], 1, null, "restless")
    const pBlock = (st) => (st.playerUnits || []).filter((u) => u.id.startsWith("p")).map((u) => u.block || 0)
    const ksStr = (st) => (st.playerUnits || []).find((u) => u.defId === "keystone-warden")?.powers?.strength || 0
    // 2-active-synergy board (warden 2 + stone 2, neither tier grants
    // Strength) with rooted-standard.
    const coh2 = [du("oathshield"), du("keystone-warden"), du("driftwood-vagrant")]
    // 0-synergy board (every tribe count = 1).
    const zero = [du("keystone-warden"), du("driftwood-vagrant"), du("the-fool")]

    const withRelicBlocks = pBlock(start(coh2, ["rooted-standard"]))
    const noRelicBlocks = pBlock(start(coh2, []))
    // relic adds exactly 2 synergies * 1 = 2 block per unit over baseline
    const blockOk =
      withRelicBlocks.length > 0 && withRelicBlocks.every((b, i) => b - noRelicBlocks[i] === 2)
    // relic INERT at 0 synergies: block identical with / without it
    const zeroNoRelic = pBlock(start(zero, []))
    const zeroRelic = pBlock(start(zero, ["rooted-standard"]))
    const mixedNoBlock = JSON.stringify(zeroNoRelic) === JSON.stringify(zeroRelic)
    // keystone strength: +1 per synergy -> 2 more in the 2-synergy board
    const ksCohStr = ksStr(start(coh2, []))
    const ksZeroStr = ksStr(start(zero, []))
    const ksScales = ksCohStr - ksZeroStr === 2
    out.dbg = { defHasField: !!UNITS["keystone-warden"]?.synergyScaled, synScaled: UNITS["keystone-warden"]?.synergyScaled }
    const resolves = ["won", "lost"].includes(auto.autoResolveBattle(start(coh2, ["rooted-standard"])).phase)
    out.coherence = {
      relicHasField: RELICS["rooted-standard"]?.synergyScaledBlock === 1,
      withRelicBlocks,
      noRelicBlocks,
      zeroNoRelic,
      zeroRelic,
      blockOk,
      mixedNoBlock,
      ksCohStr,
      ksZeroStr,
      ksScales,
      resolves,
    }
    if (!(RELICS["rooted-standard"]?.synergyScaledBlock === 1 && blockOk && mixedNoBlock && ksScales && resolves)) {
      out.errors.push("check5 coherence relic/unit")
    }
  }

  return out
})

console.log(JSON.stringify(R, null, 2))
console.log("\npageErrors:", errs.length, errs.slice(0, 8))

// screenshot: FormationScreen (proven-seedable) with the ThreatPreview's
// new "for your build" relative line + the coherence squad.
try {
  await page.evaluate(async () => {
    const engine = await import("/src/services/heartwood/runEngine.js")
    const { RUN_PATH } = engine
    const idx = RUN_PATH.findIndex((n) => n.type === "battle" && (n.enemyId || n.formationId) && RUN_PATH.indexOf(n) > 60)
    let run = engine.startRun("tommy", null, { forcedSeed: 0x9191 })
    run = {
      ...run,
      nodeIndex: idx,
      path: RUN_PATH.slice(0, idx + 1),
      phase: "formation",
      lastSeenAct: 7,
      essence: 400,
      marketLevel: 3,
      scoutedThrough: 0,
      bench: [
        { key: 1, defId: "oathshield", upgrades: [], upgradeLevel: 0, wins: 1 },
        { key: 2, defId: "keystone-warden", upgrades: [], upgradeLevel: 0, wins: 1 },
        { key: 3, defId: "lure-warden", upgrades: [], upgradeLevel: 0, wins: 0 },
        { key: 4, defId: "willowmend", upgrades: [], upgradeLevel: 0, wins: 0 },
      ],
      deployed: [1, 2, 3, 4],
      items: [{ defId: "ember-charm", equippedTo: 1 }],
      relics: ["rooted-standard"],
    }
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(engine.serializeRun(run)))
    localStorage.setItem("heartwood-story-intro-seen", "1")
    localStorage.setItem("heartwood-coach-enabled-v1", "false")
  })
  await page.reload()
  await page.waitForSelector(".hw-threat-relative", { timeout: 20000 })
  await page.waitForTimeout(700)
  await page.screenshot({ path: `${SHOT}/player_power_formation.png` })
  const rel = await page.$eval(".hw-threat-relative", (el) => el.textContent.replace(/\s+/g, " ").trim())
  console.log("threat relative:", rel)
} catch (e) {
  console.log("shot skip:", e.message)
}

await browser.close()
const pass = R.errors.length === 0 && errs.length === 0
console.log(pass ? "\n✅ verify_player_power PASS" : "\n❌ verify_player_power FAIL")
process.exit(pass ? 0 : 1)
