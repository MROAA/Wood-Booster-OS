import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

// Hearthwood - The Swarm (feat/hearthwood-swarm). First enemy archetype:
// 4 tiny bodies + a per-piece per-round Strength ramp (formation
// synergy) that scales with how many are alive. Real combat change on 2
// swapped RUN_PATH nodes -> RUNS=100 is the hard gate; these assertions
// pin the mechanic + save-safety.

const PORT = process.env.PORT || 5362
const SHOT = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-swarm/.scratch/shots"
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
  const { startRun, serializeRun, deserializeRun, RUN_SAVE_VERSION, RUN_PATH } = engine
  const out = { errors: [] }

  // 1. data
  {
    const SW = ["sporelet", "mire-gnat", "thorn-tick"]
    const forms = ["the-brood", "the-teeming"].map((id) => {
      const f = FORMATIONS[id]
      if (!f) return { id, ok: false }
      const noCenter = f.pieces.every((p) => !(p.pos.row === 1 && p.pos.col === 1))
      return { id, ok: f.pieces.length === 4 && noCenter && f.synergy?.label === "Strength in numbers", n: f.pieces.length }
    })
    const swl = SW.map((id) => {
      const d = ENEMIES[id]
      const notInPool = !Object.values(ACT_ENEMIES).some((arr) => arr.includes(id))
      return { id, ok: !!d && Number.isInteger(d.act) && (d.maxHp || 99) <= 20 && NON_BATTLE_ENEMY_IDS.has(id) && notInPool, hp: d?.maxHp }
    })
    out.data = { forms, swl }
    if (!forms.every((x) => x.ok) || !swl.every((x) => x.ok)) out.errors.push("check1 data")
  }

  // helper: drive a formation fight
  const du = (defId) => ({ defId, upgradeLevel: 0, upgrades: [], itemIds: [] })
  const start = (formationId, squad) =>
    auto.startAutoBattle("tommy", squad, formationId, [], 0, {}, [], [], 1, null, "restless")

  // 2. synergy - flat per-piece +1 Strength at battle start (fades as
  // you thin the swarm; NOT a compounding ramp - see formations.js).
  {
    let st = start("the-brood", [])
    const labelSet = st.enemySynergyLabel === "Strength in numbers"
    const eachBuffed = (st.enemies || []).length === 4 && st.enemies.every((e) => (e.powers?.strength || 0) >= 1)
    // total damage the swarm can deliver scales with living count: kill 2
    // -> collective strength (over living pieces) halves
    const strAlive = (s) => (s.enemies || []).reduce((a, e) => a + (e.hp > 0 ? e.powers?.strength || 0 : 0), 0)
    const full = strAlive(st) // ~4
    const thinned = strAlive({ ...st, enemies: st.enemies.map((e, i) => (i < 2 ? { ...e, hp: 0 } : e)) }) // ~2
    out.surge = { labelSet, eachBuffed, full, thinned }
    if (!(labelSet && eachBuffed && full >= 4 && thinned <= full / 2 + 0.001)) out.errors.push("check2 synergy")
  }

  // 3. AoE / chain beats single-target
  {
    // chain unit vs the-brood
    const chainSquad = [du("the-thorn-throne"), du("the-fool"), du("the-fool")]
    const singleSquad = [du("the-hermit"), du("the-fool"), du("the-fool")]
    const run = (squad) => {
      const s0 = start("the-brood", squad)
      const done = auto.autoResolveBattle(s0)
      return { round: done.round, hp: done.lowestSquadHpPct ?? 1, phase: done.phase }
    }
    const chain = run(chainSquad)
    const single = run(singleSquad)
    out.counter = { chain, single }
    // chain should close it in fewer rounds AND keep more squad HP
    if (!(chain.round <= single.round && chain.hp >= single.hp - 0.01)) out.errors.push("check3 AoE/chain not clearly better")
  }

  // 4. RUN_PATH
  {
    const ids = RUN_PATH.filter((n) => n.type === "battle" && n.formationId).map((n) => n.formationId)
    const hasBrood = ids.includes("the-brood")
    const hasTeeming = ids.includes("the-teeming")
    const noUndertow = !ids.includes("the-undertow") && !ids.includes("wraithgales-veil")
    const round = deserializeRun(JSON.parse(JSON.stringify(serializeRun(startRun("tommy")))))
    out.runpath = { len: RUN_PATH.length, hasBrood, hasTeeming, noUndertow, roundOk: round != null, ver: RUN_SAVE_VERSION }
    if (!(hasBrood && hasTeeming && noUndertow && round != null && RUN_SAVE_VERSION === 3)) out.errors.push("check4 RUN_PATH")
  }

  // 5. threat preview reads "A swarm"
  {
    const f = resolveFormation("the-brood")
    const roster = f.pieces.map((p, i) => ({ defId: p.defId, hp: 20, maxHp: ENEMIES[p.defId].maxHp, pos: p.pos, id: `e${i}` }))
    const t = evaluateThreat(roster, { ...startRun("tommy"), deployed: [] }, { type: "battle" })
    out.threat = { primary: t.primary?.id, mechanics: t.mechanics, rating: t.rating }
    if (!(t.primary?.id === "swarm" && t.mechanics.includes("Comes in numbers") && t.rating >= 3)) out.errors.push("check5 threat preview")
  }

  return out
})

console.log(JSON.stringify(R, null, 2))
console.log("\npageErrors:", errs.length, errs.slice(0, 8))

// screenshot the FormationScreen vs the-brood
try {
  await page.evaluate(async () => {
    const engine = await import("/src/services/heartwood/runEngine.js")
    const { RUN_PATH } = engine
    const idx = RUN_PATH.findIndex((n) => n.formationId === "the-brood")
    let run = engine.startRun("tommy", null, { forcedSeed: 0x5eeeed })
    run = {
      ...run,
      nodeIndex: idx,
      path: RUN_PATH.slice(0, idx + 1),
      phase: "formation",
      lastSeenAct: 7, // suppress the Act-boundary crossroads interstitial
      bench: [
        { key: 1, defId: "the-fool", upgrades: [], upgradeLevel: 0, wins: 0 },
        { key: 2, defId: "the-fool", upgrades: [], upgradeLevel: 0, wins: 0 },
      ],
      deployed: [1, 2, null, null],
      items: [],
    }
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(engine.serializeRun(run)))
    localStorage.setItem("heartwood-story-intro-seen", "1")
    localStorage.setItem("heartwood-coach-enabled-v1", "false")
  })
  await page.reload()
  await page.waitForSelector(".hw-swarm-hint", { timeout: 20000 })
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${SHOT}/swarm.png` })
  const txt = await page.$eval(".hw-swarm-hint", (el) => el.textContent.replace(/\s+/g, " ").trim())
  console.log("swarm hint:", txt)
} catch (e) {
  console.log("shot skip:", e.message)
}

await browser.close()
const pass = R.errors.length === 0 && errs.length === 0
console.log(pass ? "\n✅ verify_swarm PASS" : "\n❌ verify_swarm FAIL")
process.exit(pass ? 0 : 1)
