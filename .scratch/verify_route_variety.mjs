import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

const PORT = process.env.PORT || 5327
const SHOT_DIR = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-hw-route/.scratch/shots"
await mkdir(SHOT_DIR, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
await page.waitForTimeout(400)

const eng = await page.evaluate(async () => {
  const t = Date.now()
  const E = await import("/src/services/heartwood/runEngine.js?t=" + t)
  const { RUN_PATH } = E
  const out = {}

  const sig = (rs) => rs.battlePool.map((n) => n.enemyId || n.formationId)
  const authoredBattles = RUN_PATH.filter((n) => n.type === "battle").map((n) => n.enemyId || n.formationId)

  // 5 seeds -> 5 distinct orderings, same multiset
  const seeds = [1, 2, 3, 4, 5]
  const sigs = seeds.map((s) => sig(E.startRun("tommy", null, { forcedSeed: s })))
  out.distinctOrderings = new Set(sigs.map((x) => x.join(","))).size
  out.allSameMultiset = sigs.every(
    (x) => [...x].sort().join(",") === [...authoredBattles].sort().join(","),
  )
  out.sameSeedStable = sig(E.startRun("tommy", null, { forcedSeed: 3 })).join(",") === sigs[2].join(",")
  out.noSeedStillWorks = Array.isArray(E.startRun("tommy").battlePool)

  // Act-scoped: every position's fight stays in its authored Act band.
  // Reconstruct: for each seed, walk the pool as the run would consume
  // it and check each drawn battle's Act matches the Act of the battle
  // POSITION it fills.
  const battlePositions = []
  RUN_PATH.forEach((n, i) => { if (n.type === "battle") battlePositions.push(i) })
  const actAt = (i) => E.actIndexForNode(i, RUN_PATH.length)
  const enemyAct = {}
  RUN_PATH.forEach((n, i) => { if (n.type === "battle") enemyAct[n.enemyId || n.formationId] = actAt(i) })
  let bandOk = true
  for (const s of seeds) {
    const order = sig(E.startRun("tommy", null, { forcedSeed: s }))
    order.forEach((id, k) => {
      if (enemyAct[id] !== actAt(battlePositions[k])) bandOk = false
    })
  }
  out.actBandsPreserved = bandOk

  // Node type cadence + miniboss/boss positions are RUN_PATH-fixed and
  // untouched by any of this.
  out.typeCadence = RUN_PATH.map((n) => n.type).join(",")
  out.minibossBossPositions = RUN_PATH.map((n, i) => ((n.type === "miniboss" || n.type === "boss") ? i : null)).filter((x) => x != null)

  // Crossroads reshuffle: forestState folds into the seed, remaining
  // pool reorders (still Act-scoped), battles already drawn untouched.
  let rs = E.startRun("tommy", null, { forcedSeed: 7 })
  const poolBefore = sig(rs)
  rs = { ...rs, nodeIndex: 20, lastSeenAct: 1, phase: "shop", path: rs.path.concat(Array(20).fill({ type: "shop" })) }
  const afterPurify = E.resolveActCrossroads(rs, 2, "purify")
  const afterFeed = E.resolveActCrossroads(rs, 2, "strengthen")
  out.reshuffleChangedOrder = afterPurify.battlePool.map((n) => n.enemyId || n.formationId).join(",") !== poolBefore.join(",")
  out.forestStateBranchesRoute =
    afterPurify.battlePool.map((n) => n.enemyId || n.formationId).join(",") !==
    afterFeed.battlePool.map((n) => n.enemyId || n.formationId).join(",")
  out.reshuffleSameMultiset =
    [...afterPurify.battlePool.map((n) => n.enemyId || n.formationId)].sort().join(",") ===
    [...poolBefore].sort().join(",")

  // save/restore keeps the shuffled pool + seed intact
  const ser = E.serializeRun(E.startRun("tommy", null, { forcedSeed: 9 }))
  const de = E.deserializeRun(ser)
  out.roundTripSeed = de?.seed === ser.run.seed
  out.roundTripPool = de?.battlePool.map((n) => n.enemyId || n.formationId).join(",") === ser.run.battlePool.map((n) => n.enemyId || n.formationId).join(",")
  // legacy save without seed still loads
  const legacy = E.serializeRun(E.startRun("tommy", null, { forcedSeed: 11 }))
  delete legacy.run.seed
  out.legacyLoads = !!E.deserializeRun(legacy)

  return out
})
console.log(JSON.stringify(eng, null, 2))

// DOM: forest-state badge shows after a crossroads pick
await page.evaluate(async () => {
  const t = Date.now()
  const E = await import("/src/services/heartwood/runEngine.js?t=" + t)
  let rs = E.startRun("tommy", null, { forcedSeed: 42 })
  rs = E.resolveActCrossroads(
    { ...rs, nodeIndex: 20, lastSeenAct: 1, phase: "shop", path: rs.path.concat(Array(20).fill({ type: "shop" })) },
    2, "purify",
  )
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(E.serializeRun(rs)))
})
await page.reload()
await page.waitForTimeout(800)
const tn = page.locator("button.hw-tutorial-next")
if (await tn.isVisible({ timeout: 500 }).catch(() => false)) { await tn.click(); await page.waitForTimeout(200) }
const badgeCount = await page.locator('.hw-forest-state[data-forest="purified"]').count()
const badgeText = await page.locator(".hw-forest-state").first().textContent().catch(() => null)
await page.screenshot({ path: `${SHOT_DIR}/route_forest_state.png` })
console.log("forest-state badge:", badgeCount, JSON.stringify(badgeText))

const pass =
  eng.distinctOrderings === 5 && eng.allSameMultiset && eng.sameSeedStable && eng.noSeedStillWorks &&
  eng.actBandsPreserved &&
  eng.reshuffleChangedOrder && eng.forestStateBranchesRoute && eng.reshuffleSameMultiset &&
  eng.roundTripSeed && eng.roundTripPool && eng.legacyLoads &&
  badgeCount >= 1 &&
  errors.length === 0

console.log("errors:", JSON.stringify(errors))
console.log(pass ? "RESULT: PASS" : "RESULT: FAIL")
await browser.close()
process.exit(pass ? 0 : 1)
