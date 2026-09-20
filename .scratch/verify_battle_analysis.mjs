import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

// Hearthwood - "why you lost / why you won" battle outcome analysis
// (feat/hearthwood-battle-analysis). analyzeOutcome(state, runState) is
// a PURE classifier over the battle end-state + evaluateBuild /
// unitProfile -> { verdict, headline, factors[], suggestions[] }.
// No engine change, no save bump -> the fairness pass is a smoke check;
// these assertions are the real gate.

const PORT = process.env.PORT || 5351
const SHOT = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-battle-analysis/.scratch/shots"
await mkdir(SHOT, { recursive: true })

const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1536, height: 1000 } })).newPage()
const errs = []
page.on("pageerror", (e) => errs.push(String(e)))
page.on("console", (m) => m.type() === "error" && errs.push(m.text()))
await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForSelector(".hw-commander-card", { timeout: 20000 })

const R = await page.evaluate(async () => {
  const ba = await import("/src/data/heartwood/battleAnalysis.js")
  const engine = await import("/src/services/heartwood/runEngine.js")
  const roles = await import("/src/data/heartwood/roles.js")
  const bs = await import("/src/data/heartwood/buildScore.js")
  const { UNITS } = await import("/src/data/heartwood/units.js")
  const { analyzeOutcome } = ba
  const out = {}

  const SLOTS = [
    { row: 2, col: 0 },
    { row: 2, col: 1 },
    { row: 2, col: 2 },
    { row: 1, col: 1 },
  ]
  // runState with a chosen deployed squad (mirrors verify_positioning's mk)
  const mkRun = (defIds) => {
    const base = engine.startRun("tommy")
    const bench = defIds.map((defId, i) => ({ key: i + 1, defId, upgrades: [], upgradeLevel: 0 }))
    return {
      ...base,
      bench,
      deployed: [...bench.map((e) => e.key), null, null, null, null].slice(0, 4),
      items: [],
    }
  }
  // synthetic ended battle state
  const mkState = (defIds, { phase, round, lowestPct, deadIdx = [], enemyHpFrac = 0 }) => {
    const playerUnits = defIds.map((defId, i) => {
      const def = UNITS[defId]
      const maxHp = def?.maxHp || 40
      return {
        id: `p${i}`,
        defId,
        name: def?.name || defId,
        maxHp,
        hp: deadIdx.includes(i) ? 0 : maxHp,
        pos: SLOTS[i] || { row: 2, col: i },
        itemIds: [],
      }
    })
    playerUnits.push({ id: "commander", defId: null, name: "Tommy", hp: 30, maxHp: 30, pos: { row: 0, col: 1 } })
    const enemies = [0, 1, 2].map((i) => ({
      id: `e${i}`,
      defId: "twin-watch",
      name: "Watcher",
      maxHp: 40,
      hp: Math.round(40 * enemyHpFrac),
      pos: { row: 0, col: i },
    }))
    return { phase, round, lowestSquadHpPct: lowestPct, playerUnits, enemies, stats: {}, log: [] }
  }

  const healerId = ["willowmend", "the-high-priestess", "grovekeeper", "the-fool", "riverkin-oracle"].find(
    (id) => UNITS[id] && roles.unitProfile(UNITS[id]).primary === "healer",
  )
  out.healerId = healerId || null

  // 1. clean win
  {
    const rs = mkRun(["bulwark-of-ages", healerId || "willowmend", "the-fool", "the-magician"])
    const st = mkState(rs.bench.map((e) => e.defId), { phase: "won", round: 6, lowestPct: 80, enemyHpFrac: 0 })
    const a = analyzeOutcome(st, rs, { nodeType: "battle" })
    out.clean = { verdict: a.verdict, f: a.factors.length, s: a.suggestions.length, h: a.headline }
    out.cleanOk =
      a.verdict === "won-clean" && a.suggestions.length === 0 && a.factors.length === 0 && !a.headline.includes("\n")
  }

  // 2. stalled loss
  {
    const rs = mkRun(["bulwark-of-ages", "grovekeeper", "stoneknoll", "pack-elder"])
    const st = mkState(rs.bench.map((e) => e.defId), {
      phase: "lost",
      round: 30,
      lowestPct: 12,
      deadIdx: [0, 1, 2, 3],
      enemyHpFrac: 0.7,
    })
    const a = analyzeOutcome(st, rs, { nodeType: "battle" })
    out.stalled = { verdict: a.verdict, factors: a.factors, s: a.suggestions.length }
    out.stalledOk =
      a.verdict === "lost-stalled" &&
      a.suggestions.length >= 2 &&
      a.factors.some((f) => /damage|execute|round|health/i.test(f)) &&
      /stall/i.test(a.headline)
  }

  // 3. healer-down loss
  {
    const hid = healerId || "willowmend"
    const rs = mkRun([hid, "the-magician", "the-thorn-throne", "the-fool"])
    const sustain = bs.evaluateBuild(rs).scores.sustain
    const st = mkState(rs.bench.map((e) => e.defId), {
      phase: "lost",
      round: 12,
      lowestPct: 0,
      deadIdx: [0, 1, 2, 3],
      enemyHpFrac: 0.1,
    })
    const a = analyzeOutcome(st, rs, { nodeType: "battle" })
    out.healer = { verdict: a.verdict, sustain, suggestions: a.suggestions }
    out.healerOk =
      a.verdict === "lost-sustain" && a.suggestions.some((s) => /healer|back|sustain/i.test(s)) && a.suggestions.length >= 2
  }

  // 4. backline loss (no healer in squad so the sustain branch can't pre-empt)
  {
    const rs = mkRun(["the-thorn-throne", "the-magician", "stoneknoll", "bulwark-of-ages"])
    const st = mkState(rs.bench.map((e) => e.defId), {
      phase: "lost",
      round: 8,
      lowestPct: 0,
      deadIdx: [0, 1, 2], // p3 (bulwark, front, row 1) survives
      enemyHpFrac: 0.3,
    })
    const a = analyzeOutcome(st, rs, { nodeType: "battle" })
    out.backline = { verdict: a.verdict, factors: a.factors }
    out.backlineOk = a.verdict === "lost-backline" && a.suggestions.length >= 2
  }

  // 5. generic / outmatched loss (2-unit squad dodges the specific branches)
  {
    const rs = mkRun(["the-thorn-throne", "the-magician"])
    const st = mkState(["the-thorn-throne", "the-magician"], {
      phase: "lost",
      round: 10,
      lowestPct: 0,
      deadIdx: [0, 1],
      enemyHpFrac: 0.3,
    })
    const a = analyzeOutcome(st, rs, { nodeType: "battle" })
    out.generic = { verdict: a.verdict, factors: a.factors }
    out.genericOk = a.verdict === "lost-outmatched" && a.factors.length >= 1 && a.suggestions.length >= 2
  }

  // 6. shape & caps + degenerate inputs
  {
    const rs = mkRun(["the-fool", "the-magician", "bulwark-of-ages", "willowmend"])
    const cases = [
      mkState(rs.bench.map((e) => e.defId), { phase: "won", round: 4, lowestPct: 90 }),
      mkState(rs.bench.map((e) => e.defId), { phase: "won", round: 20, lowestPct: 10, deadIdx: [0, 1] }),
      mkState(rs.bench.map((e) => e.defId), { phase: "lost", round: 6, lowestPct: 0, deadIdx: [0, 1, 2, 3] }),
    ]
    let shapeOk = true
    for (const st of cases) {
      const a = analyzeOutcome(st, rs, {})
      if (
        a.factors.length > 3 ||
        a.suggestions.length > 3 ||
        a.headline.includes("\n") ||
        [...a.factors, ...a.suggestions].some((x) => typeof x !== "string" || !x.length)
      )
        shapeOk = false
    }
    // player-phase -> null; degenerate state + no runState -> object, no throw
    const nul = analyzeOutcome({ phase: "player" }, rs)
    let degOk = true
    try {
      const d = analyzeOutcome({ phase: "lost", playerUnits: [], enemies: [] }, null)
      degOk = d && typeof d.verdict === "string" && Array.isArray(d.suggestions)
    } catch {
      degOk = false
    }
    out.shapeOk = shapeOk && nul === null && degOk
  }

  // 7. purity / save
  {
    const rs = mkRun(["the-fool", "bulwark-of-ages", "willowmend", "the-magician"])
    const st = mkState(rs.bench.map((e) => e.defId), { phase: "lost", round: 9, lowestPct: 0, deadIdx: [0, 1, 2, 3] })
    const rsSnap = JSON.stringify(rs)
    const stSnap = JSON.stringify(st)
    const a1 = JSON.stringify(analyzeOutcome(st, rs, { nodeType: "elite" }))
    const a2 = JSON.stringify(analyzeOutcome(st, rs, { nodeType: "elite" }))
    const fresh = engine.startRun("tommy")
    out.save = {
      rsUnchanged: JSON.stringify(rs) === rsSnap,
      stUnchanged: JSON.stringify(st) === stSnap,
      deterministic: a1 === a2,
      version: engine.RUN_SAVE_VERSION,
      noKey: !("analysis" in fresh) && !("battleAnalysis" in fresh),
    }
    out.saveOk =
      out.save.rsUnchanged && out.save.stUnchanged && out.save.deterministic && out.save.version === 3 && out.save.noKey
  }

  // 8. non-prescriptive - every loss / narrow-win result offers >=2 options,
  // none phrased as a command ("You must" / "Always" / "Never")
  {
    const rs = mkRun(["the-thorn-throne", "the-magician", "stoneknoll", "bulwark-of-ages"])
    const states = [
      mkState(rs.bench.map((e) => e.defId), { phase: "lost", round: 30, lowestPct: 0, deadIdx: [0, 1, 2, 3], enemyHpFrac: 0.7 }),
      mkState(rs.bench.map((e) => e.defId), { phase: "lost", round: 8, lowestPct: 0, deadIdx: [0, 1, 2], enemyHpFrac: 0.3 }),
      mkState(rs.bench.map((e) => e.defId), { phase: "won", round: 20, lowestPct: 8, deadIdx: [0, 1] }),
    ]
    let ok = true
    for (const st of states) {
      const a = analyzeOutcome(st, rs, {})
      if (a.suggestions.length < 2) ok = false
      if (a.suggestions.some((s) => /^(you must|always|never)\b/i.test(s))) ok = false
    }
    out.nonPrescriptiveOk = ok
  }

  return out
})

// best-effort screenshot: run a real fight to a loss, drop it on runState, reload
let shotOk = false
try {
  await page.evaluate(async () => {
    const engine = await import("/src/services/heartwood/runEngine.js")
    const ab = await import("/src/services/heartwood/autoBattleEngine.js")
    const { RUN_PATH, startRun, serializeRun, actIndexForNode } = engine
    const battleIdx = RUN_PATH.findIndex((n, i) => n.type === "battle" && i > 2)
    // a deliberately weak squad vs a real formation -> a loss with a full end-state
    let b = ab.startAutoBattle("tommy", ["the-fool", "the-fool"], RUN_PATH[battleIdx].enemyId || "twin-watch")
    let guard = 0
    while (b.phase === "player" && guard++ < 60) b = ab.resolveRound(b)
    const s = {
      ...startRun("tommy"),
      nodeIndex: battleIdx,
      path: RUN_PATH.slice(0, battleIdx + 1),
      phase: "battle",
      battle: b,
      lastSeenAct: actIndexForNode(battleIdx, RUN_PATH.length),
    }
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(s)))
    localStorage.setItem("heartwood-autobattler-intro-seen", "true")
    localStorage.setItem("heartwood-story-intro-seen", "true")
    localStorage.setItem("heartwood-coach-enabled-v1", "false")
  })
  await page.reload()
  await page.waitForSelector(".hw-analysis", { timeout: 8000 })
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${SHOT}/battle_analysis_loss.png` })
  shotOk = true
} catch (e) {
  errs.push(`screenshot: ${e}`.slice(0, 200))
}

await browser.close()
console.log(JSON.stringify(R, null, 2))
console.log("\nscreenshot:", shotOk ? "captured" : "skipped")
console.log("page errors:", errs.length, errs.slice(0, 6))
const checks = [
  "cleanOk",
  "stalledOk",
  "healerOk",
  "backlineOk",
  "genericOk",
  "shapeOk",
  "saveOk",
  "nonPrescriptiveOk",
]
const failed = checks.filter((k) => !R[k])
console.log("failed:", failed.length ? failed : "none")
// a broken screenshot shouldn't fail the gate, but a real page error should
const realErrs = errs.filter((e) => !e.startsWith("screenshot:"))
const pass = failed.length === 0 && realErrs.length === 0
console.log("RESULT:", pass ? "PASS" : "FAIL")
process.exit(pass ? 0 : 1)
