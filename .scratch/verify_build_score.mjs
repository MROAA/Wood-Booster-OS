import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

// Hearthwood - build evaluation panel (feat/hearthwood-build-score).
// evaluateBuild(runState) is a PURE read of the deployed squad ->
// 7 clamped 0-10 scores + core unit + biggest-gap notes. Data + display
// only: no combat / runState / save change.

const PORT = process.env.PORT || 5347
const SHOT = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-buildscore/.scratch/shots"
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
  const bs = await import("/src/data/heartwood/buildScore.js")
  const { evaluateBuild, SCORE_DIMS } = bs
  const out = {}

  // helper: a runState with a given deployed squad (defId list)
  const squad = (defIds) => {
    const base = engine.startRun("tommy")
    const bench = defIds.map((defId, i) => ({ key: i + 1, defId, upgrades: [], upgradeLevel: 0 }))
    const deployed = [...bench.map((e) => e.key), null, null, null, null].slice(0, 4)
    return { ...base, bench, deployed, items: [] }
  }
  const dimIds = SCORE_DIMS.map((d) => d.id)
  const allInt0to10 = (s) => dimIds.every((k) => Number.isInteger(s[k]) && s[k] >= 0 && s[k] <= 10)

  // 1. curated squads
  const wall = evaluateBuild(squad(["bulwark-of-ages", "bulwark-of-ages", "willowmend", "willowmend"]))
  const glass = evaluateBuild(squad(["the-thorn-throne", "pack-elder", "deepwood-sovereign", "stoneknoll"]))
  out.wall = { scores: wall.scores, notes: wall.notes, core: wall.core?.name }
  out.glass = { scores: glass.scores, notes: glass.notes, core: glass.core?.name }
  out.curatedOk =
    wall.scores.survivability >= 7 &&
    wall.scores.sustain >= 6 &&
    wall.scores.damage <= 3 &&
    wall.notes.some((t) => /damage to close/.test(t)) &&
    glass.scores.damage >= 7 &&
    glass.scores.survivability < wall.scores.survivability &&
    glass.scores.survivability <= 5 &&
    glass.notes.some((t) => /front line/i.test(t))

  // 2. empty deploy
  const empty = evaluateBuild({ ...engine.startRun("tommy"), bench: [], deployed: [null, null, null, null], items: [] })
  out.empty = empty
  out.emptyOk =
    empty.deployedCount === 0 &&
    dimIds.every((k) => empty.scores[k] === 0) &&
    empty.core === null &&
    empty.notes.length === 1

  // 3. clamp & type across all three
  out.clampOk = [wall.scores, glass.scores, empty.scores].every(allInt0to10)

  // 4. core picks the highest-value unit (Legendary among commons)
  const mixed = evaluateBuild(squad(["the-fool", "world-ash-elder", "the-magician"]))
  out.core = mixed.core?.name
  out.coreOk = mixed.core?.name === "World-Ash Elder"

  // 5. purity - no mutation, deterministic
  const rs = squad(["bulwark-of-ages", "willowmend"])
  const snap = JSON.stringify(rs)
  const a = evaluateBuild(rs)
  const b = evaluateBuild(rs)
  out.pure = { unchanged: JSON.stringify(rs) === snap, same: JSON.stringify(a) === JSON.stringify(b) }
  out.pureOk = out.pure.unchanged && out.pure.same

  // 6. nothing on runState / save
  const fresh = engine.startRun("tommy")
  out.save = { version: engine.RUN_SAVE_VERSION, hasKey: "buildScore" in fresh }
  out.saveOk = engine.RUN_SAVE_VERSION === 3 && !out.save.hasKey

  return out
})

// screenshots: formation panel + shop Your Squad panel
await page.evaluate(async () => {
  const { RUN_PATH, startRun, serializeRun, actIndexForNode } = await import("/src/services/heartwood/runEngine.js")
  const battleIdx = RUN_PATH.findIndex((n, i) => n.type === "battle" && i > 2)
  let s = { ...startRun("tommy"), nodeIndex: battleIdx, path: RUN_PATH.slice(0, battleIdx + 1), phase: "formation", essence: 1500 }
  s.bench = [
    { key: 1, defId: "bulwark-of-ages", upgrades: [], upgradeLevel: 0 },
    { key: 2, defId: "the-hermit", upgrades: [], upgradeLevel: 0 },
    { key: 3, defId: "willowmend", upgrades: [], upgradeLevel: 0 },
    { key: 4, defId: "the-thorn-throne", upgrades: [], upgradeLevel: 0 },
  ]
  s.deployed = [1, 2, 3, 4]
  s.benchKeyCounter = 5
  s.lastSeenAct = actIndexForNode(battleIdx, RUN_PATH.length)
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(s)))
  localStorage.setItem("heartwood-autobattler-intro-seen", "true")
  localStorage.setItem("heartwood-story-intro-seen", "true")
  localStorage.setItem("heartwood-coach-enabled-v1", "false")
})
await page.reload()
await page.waitForSelector(".hw-buildscore", { timeout: 10000 })
await page.waitForTimeout(1000)
await page.screenshot({ path: `${SHOT}/buildscore_formation.png` })

await browser.close()
console.log(JSON.stringify(R, null, 2))
console.log("\npage errors:", errs.length, errs.slice(0, 5))
const checks = ["curatedOk", "emptyOk", "clampOk", "coreOk", "pureOk", "saveOk"]
const failed = checks.filter((k) => !R[k])
console.log("failed:", failed.length ? failed : "none")
const pass = failed.length === 0 && errs.length === 0
console.log("RESULT:", pass ? "PASS" : "FAIL")
process.exit(pass ? 0 : 1)
