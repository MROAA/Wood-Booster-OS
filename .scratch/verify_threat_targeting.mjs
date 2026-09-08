import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

// Hearthwood - threat & taunt targeting (feat/hearthwood-threat-targeting).
// The enemy's single-target pick was a UNIFORM RANDOM roll over the
// unshielded squad; now it's deterministic "hit the highest-threat
// unit" (unitThreat / threatTarget in autoBattleEngine.js). Real combat
// change -> the fairness pass is the gate; these assertions pin the
// mechanic.

const PORT = process.env.PORT || 5352
const SHOT = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-threat/.scratch/shots"
await mkdir(SHOT, { recursive: true })

const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1536, height: 1000 } })).newPage()
const errs = []
page.on("pageerror", (e) => errs.push(String(e)))
page.on("console", (m) => m.type() === "error" && errs.push(m.text()))
await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForSelector(".hw-commander-card", { timeout: 20000 })

const R = await page.evaluate(async () => {
  const ab = await import("/src/services/heartwood/autoBattleEngine.js")
  const engine = await import("/src/services/heartwood/runEngine.js")
  const roles = await import("/src/data/heartwood/roles.js")
  const { UNITS } = await import("/src/data/heartwood/units.js")
  const { CHARACTERS } = await import("/src/data/heartwood/characters.js")
  const { unitThreat, topThreatTargetId } = ab
  const out = {}

  // a minimal frozen state the pure helpers can read
  const mkUnit = (id, defId, pos, extra = {}) => ({
    id,
    defId,
    name: UNITS[defId]?.name || defId,
    hp: 40,
    maxHp: 40,
    pos,
    powers: {},
    ...extra,
  })
  const mkState = (playerUnits, stats = {}) => ({
    phase: "player",
    playerUnits,
    enemies: [{ id: "e0", defId: "twin-watch", hp: 30, maxHp: 30, pos: { row: 0, col: 1 }, powers: {} }],
    stats,
    commanderDef: CHARACTERS.tommy,
    grid: { rows: 3, cols: 3 },
  })

  const TANK = "bulwark-of-ages" // unitProfile -> tank
  const DPS = "the-thorn-throne" // unitProfile -> dps / assassin
  out.tankRole = roles.unitProfile(UNITS[TANK]).primary
  out.dpsRole = roles.unitProfile(UNITS[DPS]).primary

  // 1. unitThreat ordering
  {
    const st = mkState([mkUnit("p0", TANK, { row: 2, col: 0 }), mkUnit("p1", DPS, { row: 2, col: 1 })])
    const tankT = unitThreat(st, st.playerUnits[0])
    const dpsT = unitThreat(st, st.playerUnits[1])
    const st2 = mkState(st.playerUnits, { p1: { damageDealt: 200 } })
    const dpsWithDmg = unitThreat(st2, st2.playerUnits[1])
    const st3 = mkState(
      [mkUnit("p0", TANK, { row: 2, col: 0 }), mkUnit("p1", DPS, { row: 2, col: 1 }, { powers: { taunt: 1 } })],
    )
    const tauntT = unitThreat(st3, st3.playerUnits[1])
    out.threatVals = { tankT, dpsT, dpsWithDmg, tauntT }
    out.threatOk = tankT > dpsT && dpsWithDmg > dpsT && tauntT > tankT
  }

  // 2. topThreatTargetId deterministic + role-correct + taunt override
  {
    const base = mkState([
      mkUnit("p0", TANK, { row: 2, col: 0 }),
      mkUnit("p1", DPS, { row: 2, col: 1 }),
      mkUnit("p2", "willowmend", { row: 2, col: 2 }),
    ])
    const picks = Array.from({ length: 20 }, () => topThreatTargetId(base))
    const stable = picks.every((p) => p === picks[0])
    const withTaunt = mkState([
      mkUnit("p0", TANK, { row: 2, col: 0 }),
      mkUnit("p1", DPS, { row: 2, col: 1 }, { powers: { taunt: 1 } }),
      mkUnit("p2", "willowmend", { row: 2, col: 2 }),
    ])
    out.pick = { first: picks[0], stable, taunted: topThreatTargetId(withTaunt) }
    out.pickOk = stable && picks[0] === "p0" && topThreatTargetId(withTaunt) === "p1"
  }

  // 3. shielding: a shielded non-taunter is skipped; a shielded taunter is not
  {
    // p0 (tank) at col 1 row 2 is shielded by p3 at col 1 row 1
    const shielded = mkState([
      mkUnit("p0", TANK, { row: 2, col: 1 }),
      mkUnit("p3", DPS, { row: 1, col: 1 }),
      mkUnit("p2", "willowmend", { row: 2, col: 2 }),
    ])
    const pickShielded = topThreatTargetId(shielded) // not p0 (shielded non-taunter)
    const shieldedTaunt = mkState([
      mkUnit("p0", TANK, { row: 2, col: 1 }, { powers: { taunt: 1 } }),
      mkUnit("p3", DPS, { row: 1, col: 1 }),
      mkUnit("p2", "willowmend", { row: 2, col: 2 }),
    ])
    const pickTaunt = topThreatTargetId(shieldedTaunt) // p0 (taunt bypasses shield)
    out.shield = { pickShielded, pickTaunt }
    out.shieldOk = pickShielded !== "p0" && pickTaunt === "p0"
  }

  // 4. engine integration - a real battle. Tank in the FORWARD slot
  // (slot 3): a slot-0 unit is shielded by the Commander at {1,0}, so
  // threat there is moot. Round 1 hits the highest threat (the forward
  // tank); the enemy then works DOWN the squad in threat order, so the
  // focus rotates but stays deterministic and the tank is in it.
  {
    const b0 = ab.startAutoBattle("tommy", ["the-fool", "the-magician", DPS, TANK], "twin-watch")
    const freshFocus = ab.topThreatTargetId(b0) // round 1 -> p3, the forward tank
    let b = b0
    let stableEachRound = true
    const focuses = []
    for (let i = 0; i < 6 && b.phase === "player"; i++) {
      const f1 = ab.topThreatTargetId(b)
      const f2 = ab.topThreatTargetId(b)
      if (f1 !== f2) stableEachRound = false
      focuses.push(f1)
      b = ab.resolveRound(b)
    }
    out.engine = { freshFocus, stableEachRound, focuses, distinct: new Set(focuses).size, endPhase: b.phase }
    out.engineOk =
      freshFocus === "p3" && stableEachRound && new Set(focuses).size >= 2 && focuses.includes("p3")
  }

  // 5. purity / save
  {
    const st = mkState([mkUnit("p0", TANK, { row: 2, col: 0 }), mkUnit("p1", DPS, { row: 2, col: 1 })], {
      p1: { damageDealt: 50 },
    })
    const snap = JSON.stringify(st)
    unitThreat(st, st.playerUnits[0])
    topThreatTargetId(st)
    const unchanged = JSON.stringify(st) === snap
    const fresh = engine.startRun("tommy")
    const noKey = !("threat" in fresh)
    // battle state round-trips
    const b = ab.startAutoBattle("tommy", [TANK, DPS], "twin-watch")
    const rs = { ...engine.startRun("tommy"), phase: "battle", battle: b }
    const round = engine.deserializeRun(engine.serializeRun(rs))
    out.save = { unchanged, noKey, version: engine.RUN_SAVE_VERSION, roundTrip: !!round && !!round.battle }
    out.saveOk = unchanged && noKey && engine.RUN_SAVE_VERSION === 3 && !!round && !!round.battle
  }

  return out
})

// screenshot: seed a live battle, grab the board before the round timer advances it
let shotOk = false
try {
  await page.evaluate(async () => {
    const engine = await import("/src/services/heartwood/runEngine.js")
    const ab = await import("/src/services/heartwood/autoBattleEngine.js")
    const { RUN_PATH, startRun, serializeRun, actIndexForNode } = engine
    const idx = RUN_PATH.findIndex((n, i) => n.type === "battle" && i > 2)
    // 3 back-row units: the tank at slot 0 is shielded by the Commander
    // ({row:1,col:0}), so fire routes to the next unshielded unit - the
    // 🎯 lands on it, which is exactly the "put the tank FORWARD" lesson.
    const squad = ["bulwark-of-ages", "the-fool", "willowmend"]
    const b = ab.startAutoBattle("tommy", squad, RUN_PATH[idx].enemyId || "twin-watch")
    const bench = squad.map((defId, i) => ({ key: i + 1, defId, upgrades: [], upgradeLevel: 0, wins: 0 }))
    const s = {
      ...startRun("tommy"),
      bench,
      deployed: [1, 2, 3, null].slice(0, 4),
      items: [],
      nodeIndex: idx,
      path: RUN_PATH.slice(0, idx + 1),
      phase: "battle",
      battle: b,
      lastSeenAct: actIndexForNode(idx, RUN_PATH.length),
    }
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(s)))
    localStorage.setItem("heartwood-autobattler-intro-seen", "true")
    localStorage.setItem("heartwood-story-intro-seen", "true")
    localStorage.setItem("heartwood-coach-enabled-v1", "false")
  })
  await page.reload()
  await page.waitForSelector(".hw-piece[data-focus-target='true']", { timeout: 6000 })
  await page.waitForTimeout(500) // let the board entrance / screen-fade settle
  const board = await page.$(".hw-arena")
  if (board) await board.screenshot({ path: `${SHOT}/threat_targeting_board.png` })
  else await page.screenshot({ path: `${SHOT}/threat_targeting_board.png` })
  shotOk = true
} catch (e) {
  errs.push(`screenshot: ${e}`.slice(0, 200))
}

await browser.close()
console.log(JSON.stringify(R, null, 2))
console.log("\nscreenshot:", shotOk ? "captured" : "skipped")
console.log("page errors:", errs.length, errs.slice(0, 6))
const checks = ["threatOk", "pickOk", "shieldOk", "engineOk", "saveOk"]
const failed = checks.filter((k) => !R[k])
console.log("failed:", failed.length ? failed : "none")
const realErrs = errs.filter((e) => !e.startsWith("screenshot:"))
const pass = failed.length === 0 && realErrs.length === 0
console.log("RESULT:", pass ? "PASS" : "FAIL")
process.exit(pass ? 0 : 1)
