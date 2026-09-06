import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

const PORT = process.env.PORT || 5329
const SHOT_DIR = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-hw-actv/.scratch/shots"
await mkdir(SHOT_DIR, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
await page.waitForTimeout(400)

// --- Engine ---------------------------------------------------------
const eng = await page.evaluate(async () => {
  const t = Date.now()
  const E = await import("/src/services/heartwood/runEngine.js?t=" + t)
  const C = await import("/src/data/heartwood/cinematics.js?t=" + t)
  const K = await import("/src/data/heartwood/crownless.js?t=" + t)
  const F = await import("/src/data/heartwood/formations.js?t=" + t)
  const out = {}

  const fresh = E.startRun("tommy")
  out.freshFields = { actFive: fresh.actFive, chosenEnding: fresh.chosenEnding, echoEpilogueSeen: fresh.echoEpilogueSeen }

  // startActFive only from a real victory
  out.noActFiveMidRun = E.startActFive(fresh).actFive
  const won = {
    ...fresh,
    phase: "victory",
    nodeIndex: E.RUN_PATH.length - 1,
    // deserializeRun requires path.length === nodeIndex + 1
    path: fresh.path.concat(Array(E.RUN_PATH.length - 1).fill({ type: "battle" })),
  }
  const atThrone = E.startActFive(won)
  out.throne = atThrone.actFive === "throne"
  out.startActFiveIdempotent = E.startActFive(atThrone).actFive === "throne"

  // the mirror formation exists
  out.mirrorFormation = !!F.FORMATIONS["the-crownless-mirror"] && F.FORMATIONS["the-crownless-mirror"].pieces.length >= 3

  // startCrownlessBattle: builds a battle, keeps phase "victory", boons ride along
  const withBoon = { ...won, actFive: "throne", runModifiers: ["milestone-oath"], deployed: [], bench: [], items: [] }
  const inFight = E.startCrownlessBattle(withBoon)
  out.crownless = {
    actFive: inFight.actFive,
    phaseStays: inFight.phase === "victory",
    hasBattle: !!inFight.battle && Array.isArray(inFight.battle.enemies) && inFight.battle.enemies.length >= 3,
  }

  // advanceRound works on it; endCrownlessBattle -> "choice" for BOTH outcomes
  let stepped = E.advanceRound(inFight)
  out.advances = !!stepped.battle
  const afterWin = E.endCrownlessBattle({ ...inFight, battle: { ...inFight.battle, phase: "won" } })
  const afterLoss = E.endCrownlessBattle({ ...inFight, battle: { ...inFight.battle, phase: "lost" } })
  out.endWin = afterWin.actFive === "choice" && afterWin.crownlessWon === true && afterWin.battle === null
  out.endLoss = afterLoss.actFive === "choice" && afterLoss.crownlessWon === false && afterLoss.battle === null

  // chooseForestPath sets chosenEnding + "done"; overrides tally
  const chosen = E.chooseForestPath(afterWin, "ending-rooted")
  out.chose = chosen.actFive === "done" && chosen.chosenEnding === "ending-rooted"
  out.markEpilogue = E.markEchoEpilogueSeen(chosen).echoEpilogueSeen === true

  // suggestedEndingId === endingIdForRun (regression, same 5 cases as PR3)
  const base = E.startRun("tommy")
  out.suggest = {
    none: C.suggestedEndingId(base),
    rooted: C.suggestedEndingId({ ...base, runModifiers: ["rite-purified", "echo-refused"], forestState: "purified" }),
    ember: C.suggestedEndingId({ ...base, runModifiers: ["rite-strengthened", "side-ember"] }),
    hollow: C.suggestedEndingId({ ...base, runModifiers: ["hollow-accepted"], forestState: "corrupted" }),
    isAlias: C.suggestedEndingId === C.endingIdForRun,
  }

  // crownless intro line varies by dominant tribe
  out.introDefault = K.crownlessIntroLine(base)
  out.forestPaths = K.FOREST_PATHS.map((p) => p.endingId).sort()
  out.cinematicsPresent = !!C.CINEMATICS["crownless-throne"] && !!C.CINEMATICS["echo-epilogue"]

  // save/restore each actFive step
  const roundTrips = {}
  for (const st of ["throne", "crownless", "choice", "done"]) {
    const rs = { ...won, actFive: st, chosenEnding: st === "done" ? "ending-ember" : null,
      battle: st === "crownless" ? inFight.battle : null }
    const de = E.deserializeRun(E.serializeRun(rs))
    roundTrips[st] = de?.actFive === st
  }
  out.roundTrips = roundTrips
  // legacy save (no Act V fields) still loads
  const legacy = E.serializeRun(won)
  delete legacy.run.actFive; delete legacy.run.chosenEnding; delete legacy.run.echoEpilogueSeen
  out.legacyLoads = !!E.deserializeRun(legacy)

  return out
})
console.log(JSON.stringify(eng, null, 2))

// --- DOM: full Act V walk-through -----------------------------------
async function seedVictory() {
  await page.evaluate(async () => {
    const t = Date.now()
    const E = await import("/src/services/heartwood/runEngine.js?t=" + t)
    let rs = E.startRun("tommy", null, { forcedSeed: 3 })
    // give the run a deployed squad so the Crownless fight has a real side
    rs = E.recruitUnit(rs, rs.shopOffers[0])
    const k = rs.bench[0]?.key
    if (k != null) rs.deployed[0] = k
    rs = {
      ...rs,
      phase: "victory",
      nodeIndex: E.RUN_PATH.length - 1,
      runModifiers: ["hollow-accepted"],
      forestState: "corrupted",
      path: rs.path.concat(Array(E.RUN_PATH.length - 1).fill({ type: "battle" })),
    }
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(E.serializeRun(rs)))
    localStorage.setItem("heartwood-story-intro-seen", "true")
  })
  await page.reload()
  await page.waitForTimeout(900)
  const tn = page.locator("button.hw-tutorial-next")
  if (await tn.isVisible({ timeout: 500 }).catch(() => false)) { await tn.click(); await page.waitForTimeout(200) }
}

await seedVictory()
const throneVisible = await page.locator('[data-screen="story-cinematic"][data-cinematic="crownless-throne"]').isVisible().catch(() => false)
await page.screenshot({ path: `${SHOT_DIR}/crownless_throne.png` })
// advance throne cinematic to the end
for (let i = 0; i < 12; i++) {
  const cb = page.locator(".hw-cinematic-prompt .hw-end-turn")
  if (await cb.isVisible().catch(() => false)) { await cb.click(); break }
  await page.locator(".hw-cinematic-inner").click({ position: { x: 10, y: 10 } })
  await page.waitForTimeout(120)
}
await page.waitForTimeout(700)
const battleVisible = await page.locator('[data-screen="crownless-battle"]').isVisible().catch(() => false)
const introLine = await page.locator(".hw-crownless-intro").textContent().catch(() => null)
await page.screenshot({ path: `${SHOT_DIR}/crownless_battle.png` })

// let the auto-battle run to its continue button
let choiceReached = false
for (let i = 0; i < 60; i++) {
  await page.waitForTimeout(500)
  const cont = page.locator('[data-screen="crownless-battle"] button:has-text("Continue"), [data-screen="crownless-battle"] .hw-end-turn')
  if (await cont.first().isVisible().catch(() => false)) {
    await cont.first().click()
    await page.waitForTimeout(600)
    choiceReached = await page.locator('[data-screen="forest-choice"]').isVisible().catch(() => false)
    break
  }
}
await page.screenshot({ path: `${SHOT_DIR}/forest_choice.png` })
const pathCount = await page.locator(".hw-forest-choice-path").count()
const suggestedLean = await page.locator('.hw-forest-choice-path[data-suggested] .hw-forest-choice-path-name').textContent().catch(() => null)

// choose Rooted (override the hollow suggestion)
await page.locator(".hw-forest-choice-path").filter({ hasText: "The Rooted Path" }).click()
await page.waitForTimeout(600)
const endingVisible = await page.locator('[data-screen="story-cinematic"]').getAttribute("data-cinematic").catch(() => null)
// skip through ending + epilogue
let overlayReached = false
for (let i = 0; i < 30; i++) {
  const skip = page.locator(".hw-cinematic-skip")
  if (await skip.isVisible().catch(() => false)) { await skip.click(); await page.waitForTimeout(400); continue }
  overlayReached = await page.locator(".hw-runend, [class*='runend'], .hw-run-end").first().isVisible().catch(() => false)
  if (overlayReached) break
  await page.waitForTimeout(300)
}
const sawEpilogue = await page.evaluate(() => {
  const r = JSON.parse(localStorage.getItem("heartwood-run-save-v1") || "{}").run
  return { chosenEnding: r?.chosenEnding, echoEpilogueSeen: r?.echoEpilogueSeen, actFive: r?.actFive }
})
console.log("DOM:", { throneVisible, battleVisible, introLine: introLine?.slice(0, 40), choiceReached, pathCount, suggestedLean, endingVisible, overlayReached, sawEpilogue })

const pass =
  eng.freshFields.actFive === null && eng.freshFields.echoEpilogueSeen === false &&
  eng.noActFiveMidRun === null && eng.throne && eng.startActFiveIdempotent &&
  eng.mirrorFormation &&
  eng.crownless.actFive === "crownless" && eng.crownless.phaseStays && eng.crownless.hasBattle &&
  eng.advances && eng.endWin && eng.endLoss &&
  eng.chose && eng.markEpilogue &&
  eng.suggest.none === "ending-rooted" && eng.suggest.ember === "ending-ember" && eng.suggest.hollow === "ending-hollow" && eng.suggest.isAlias &&
  eng.forestPaths.join(",") === "ending-ember,ending-hollow,ending-rooted" &&
  eng.cinematicsPresent &&
  Object.values(eng.roundTrips).every(Boolean) && eng.legacyLoads &&
  throneVisible && battleVisible && introLine && choiceReached && pathCount === 3 &&
  suggestedLean === "The Hollow Path" &&
  overlayReached && sawEpilogue.chosenEnding === "ending-rooted" && sawEpilogue.echoEpilogueSeen === true &&
  errors.length === 0

console.log("errors:", JSON.stringify(errors))
console.log(pass ? "RESULT: PASS" : "RESULT: FAIL")
await browser.close()
process.exit(pass ? 0 : 1)
