import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

// Hearthwood Frontier - Phase 4 second slice (feat/hearthwood-tactics-
// real-battle): "fight one real battle for real". Builds on PR #462's
// read-only real-matchup bridge (tacticsRealMatchup.js) and adds the real
// thing: a normal (non-elite/boss) fight's FormationScreen now offers
// "Fight this as Tactics" (real, same tab, win/loss counts) alongside the
// unchanged "Start Battle" auto-battle path; elites/minibosses/bosses keep
// only the existing read-only "Preview this fight as Tactics" link.
//
// The whole round rests on ONE traced fact: resolveBattleOutcome
// (runEngine.js) only ever reads battle.phase ("won"/"lost") and
// battle.round (a number) - never battle.units/enemies/stats - so
// handleTacticsContinue's one-line translation ({phase, round:
// battle.turn}) is the ENTIRE bridge to the real essence/Evolution/shop-
// roll/deathMemory economy, with zero duplicated logic. This script
// verifies that bridge end to end against the REAL imported functions
// (never a hand-computed expected number), driving the LIVE /heartwood
// route - this is NOT the isolated /heartwood-tactics prototype page
// (that suite, verify_tactics_prototype.mjs, was re-run unmodified as
// this round's OWN regression proof for the TacticsBoard.jsx extraction
// this round required - all 67 checks still pass, 0 page errors,
// confirming the extraction changed nothing observable).
//
// Every check seeds a real run save via a page.evaluate import of the
// REAL startRun/serializeRun/RUN_PATH/essenceForWin/bankInterestFor -
// never a hand-typed fixture - matching the discipline verify_tactics_
// prototype.mjs's own real-matchup checks (55-67) already established.

const PORT = process.env.PORT || 5397
const SHOT = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-tactics-real-battle/.scratch/shots"
await mkdir(SHOT, { recursive: true })

const browser = await chromium.launch()
const errs = []
const out = { errors: [] }

// A minimal real runState, pointed at the first RUN_PATH node matching
// `nodeFilter`, with `benchDefIds` deployed. Mirrors verify_tactics_
// prototype.mjs's own seedRealSave helper.
async function seedRealSave(page, nodeFilter, benchDefIds) {
  return page.evaluate(
    async ({ nodeFilterSrc, benchDefIds }) => {
      const { startRun, serializeRun, RUN_PATH } = await import("/src/services/heartwood/runEngine.js")
      // eslint-disable-next-line no-new-func
      const nodeFilter = new Function("n", `return (${nodeFilterSrc})(n)`)
      const idx = RUN_PATH.findIndex(nodeFilter)
      const bench = benchDefIds.map((defId, i) => ({ key: `b${i}`, defId, upgradeLevel: 0, upgrades: [] }))
      const deployed = [...bench.map((e) => e.key), ...Array(4 - bench.length).fill(null)]
      const rs = { ...startRun("tommy"), nodeIndex: idx, path: RUN_PATH.slice(0, idx + 1), phase: "formation", bench, deployed, items: [] }
      localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(rs)))
      const node = RUN_PATH[idx]
      return { idx, type: node.type, formationId: node.formationId, enemyId: node.enemyId, essence: rs.essence }
    },
    { nodeFilterSrc: nodeFilter.toString(), benchDefIds },
  )
}

function newPage() {
  return browser.newContext({ viewport: { width: 1300, height: 900 } }).then((ctx) => ctx.newPage())
}

// 1. A normal type:"battle" node shows "Fight this as Tactics"; an elite/
//    miniboss/boss node shows only the existing read-only preview link,
//    never the Fight button ---------------------------------------------
{
  const page1 = await newPage()
  page1.on("pageerror", (e) => errs.push(String(e)))
  await page1.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
  await seedRealSave(page1, (n) => n.type === "battle" && n.formationId, ["the-fool"])
  await page1.reload({ waitUntil: "domcontentloaded" })
  await page1.waitForTimeout(400)
  const fightBtnCount = await page1.locator(".hw-tactics-fight-btn").count()
  const previewLinkCountOnBattle = await page1.locator(".hw-tactics-link").count()
  await page1.screenshot({ path: `${SHOT}/formation_fight_button.png` })
  await page1.close()

  const page1b = await newPage()
  page1b.on("pageerror", (e) => errs.push(String(e)))
  await page1b.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
  const eliteSeed = await seedRealSave(page1b, (n) => n.type === "elite" || n.type === "miniboss" || n.type === "boss", ["the-fool"])
  await page1b.reload({ waitUntil: "domcontentloaded" })
  await page1b.waitForTimeout(400)
  const fightBtnCountOnElite = await page1b.locator(".hw-tactics-fight-btn").count()
  const previewLinkCountOnElite = await page1b.locator(".hw-tactics-link").count()
  await page1b.close()

  out.buttonChoice = { fightBtnCount, previewLinkCountOnBattle, eliteSeed, fightBtnCountOnElite, previewLinkCountOnElite }
  if (!(fightBtnCount === 1 && previewLinkCountOnBattle === 0 && fightBtnCountOnElite === 0 && previewLinkCountOnElite === 1)) {
    out.errors.push("check1 the Fight-vs-Preview choice on FormationScreen was wrong for a normal fight or an elite/miniboss/boss")
  }
}

// 2. Clicking "Fight this as Tactics" enters a live tactics battle with
//    engine:"tactics" and the REAL deployed squad + REAL node enemy -----
{
  const page2 = await newPage()
  page2.on("pageerror", (e) => errs.push(String(e)))
  await page2.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
  await seedRealSave(page2, (n) => n.type === "battle" && n.formationId, ["the-fool"])
  await page2.reload({ waitUntil: "domcontentloaded" })
  await page2.waitForTimeout(400)
  await page2.locator(".hw-tactics-fight-btn").click()
  await page2.waitForTimeout(400)
  const engine = await page2.evaluate(() => JSON.parse(localStorage.getItem("heartwood-run-save-v1")).run.battle?.engine)
  const playerNames = await page2.locator('.hwt-token[data-side="player"] .hwt-token-name').allInnerTexts()
  const enemyNames = await page2.locator('.hwt-token[data-side="enemy"] .hwt-token-name').allInnerTexts()
  const noteText = await page2.locator(".hwt-real-fight-note").innerText().catch(() => "")
  await page2.screenshot({ path: `${SHOT}/live_tactics_battle.png` })
  await page2.close()
  out.enterTacticsBattle = { engine, playerNames, enemyNames, noteText }
  if (
    !(
      engine === "tactics" &&
      playerNames.length === 1 &&
      playerNames[0] === "Mosskit" &&
      enemyNames.includes("Rotwood Husk") &&
      enemyNames.includes("Rotwood Sapling") &&
      noteText.includes("Fighting this one for real")
    )
  ) {
    out.errors.push("check2 entering a real tactics battle did not load the exact real squad/enemy, or the engine tag was wrong")
  }
}

// 3. A deterministic win: the real essence math (essenceForWin +
//    bankInterestFor, via the REAL imported functions) lands EXACTLY,
//    the run advances, and battle is cleared -----------------------------
{
  const page3 = await newPage()
  page3.on("pageerror", (e) => errs.push(String(e)))
  await page3.goto(`http://localhost:${PORT}/heartwood?debugLowHp=1`, { waitUntil: "domcontentloaded" })
  const seed3 = await page3.evaluate(async () => {
    const { startRun, serializeRun, RUN_PATH, essenceForWin, bankInterestFor } = await import("/src/services/heartwood/runEngine.js")
    const idx = RUN_PATH.findIndex((n) => n.type === "battle" && n.formationId)
    const rs = {
      ...startRun("tommy"),
      nodeIndex: idx,
      path: RUN_PATH.slice(0, idx + 1),
      phase: "formation",
      bench: [{ key: "b1", defId: "the-fool", upgradeLevel: 0, upgrades: [] }],
      deployed: ["b1", null, null, null],
      items: [],
    }
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(rs)))
    const node = RUN_PATH[idx]
    return { idx, expectedEssence: rs.essence + essenceForWin(rs, node) + bankInterestFor(rs) }
  })
  await page3.reload({ waitUntil: "domcontentloaded" })
  await page3.waitForTimeout(400)
  await page3.locator(".hw-tactics-fight-btn").click()
  await page3.waitForTimeout(400)
  let phase = "player"
  let turns = 0
  while (phase !== "won" && phase !== "lost" && turns < 20) {
    await page3.locator('.hwt-token[data-side="player"]').first().click({ force: true }).catch(() => {})
    await page3.waitForTimeout(120)
    let targets = page3.locator('.hwt-cell[data-targetable="true"]')
    if ((await targets.count()) === 0) {
      const reach = page3.locator('.hwt-cell[data-reachable="true"]')
      if ((await reach.count()) > 0) {
        await reach.first().click()
        await page3.waitForTimeout(120)
      }
    }
    targets = page3.locator('.hwt-cell[data-targetable="true"]')
    if ((await targets.count()) > 0) {
      await targets.first().click()
      await page3.waitForTimeout(150)
    }
    await page3.locator(".hwt-end-turn").click().catch(() => {})
    await page3.waitForTimeout(400)
    phase = await page3.locator(".hwt-turn-label").getAttribute("data-phase")
    turns++
  }
  await page3.screenshot({ path: `${SHOT}/tactics_victory.png` })
  let afterContinue = null
  if (phase === "won") {
    await page3.locator(".hwt-continue-btn").click()
    await page3.waitForTimeout(400)
    afterContinue = await page3.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem("heartwood-run-save-v1"))
      return { phase: saved.run.phase, essence: saved.run.essence, battle: saved.run.battle, nodeIndex: saved.run.nodeIndex }
    })
  }
  await page3.close()
  out.winPath = { phase, turns, seed3, afterContinue }
  if (
    !(
      phase === "won" &&
      afterContinue &&
      afterContinue.essence === seed3.expectedEssence &&
      afterContinue.battle === null &&
      afterContinue.phase !== "battle" &&
      afterContinue.phase !== "formation" &&
      afterContinue.nodeIndex === seed3.idx + 1
    )
  ) {
    out.errors.push("check3 the win path did not pay out the exact real essence formula, or did not advance/clear the battle correctly")
  }
}

// 4. A deterministic loss: the run reaches "defeat" with the correct
//    deathMemory, matching buildDeathMemory's own pick logic ------------
{
  const page4 = await newPage()
  page4.on("pageerror", (e) => errs.push(String(e)))
  await page4.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
  await seedRealSave(page4, (n) => n.type === "battle" && n.formationId, ["the-fool"])
  await page4.reload({ waitUntil: "domcontentloaded" })
  await page4.waitForTimeout(400)
  await page4.locator(".hw-tactics-fight-btn").click()
  await page4.waitForTimeout(400)
  // A passive loss: only ever click End Turn - a real Rotwood Husk pair
  // will eventually kill the lone real Mosskit.
  let phase = "player"
  let turns = 0
  while (phase !== "won" && phase !== "lost" && turns < 30) {
    await page4.locator(".hwt-end-turn").click().catch(() => {})
    await page4.waitForTimeout(300)
    phase = await page4.locator(".hwt-turn-label").getAttribute("data-phase")
    turns++
  }
  let afterContinue = null
  if (phase === "lost") {
    await page4.locator(".hwt-continue-btn").click()
    await page4.waitForTimeout(400)
    afterContinue = await page4.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem("heartwood-run-save-v1"))
      return { phase: saved.run.phase, deathMemory: saved.run.deathMemory }
    })
  }
  await page4.close()
  out.lossPath = { phase, turns, afterContinue }
  if (!(phase === "lost" && afterContinue?.phase === "defeat" && afterContinue?.deathMemory?.heroName === "Mosskit")) {
    out.errors.push("check4 the loss path did not reach the defeat phase with the correct deathMemory")
  }
}

// 5. The auto-battle path ("Start Battle") on the same node type is
//    completely unaffected - no engine tag, AutoBattleView renders, not
//    TacticsBoard --------------------------------------------------------
{
  const page5 = await newPage()
  page5.on("pageerror", (e) => errs.push(String(e)))
  await page5.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
  await seedRealSave(page5, (n) => n.type === "battle" && n.formationId, ["the-fool"])
  await page5.reload({ waitUntil: "domcontentloaded" })
  await page5.waitForTimeout(400)
  await page5.locator(".hw-end-turn", { hasText: "Start Battle" }).click()
  await page5.waitForTimeout(500)
  const engine = await page5.evaluate(() => JSON.parse(localStorage.getItem("heartwood-run-save-v1")).run.battle?.engine)
  const hwtBoardCount = await page5.locator(".hwt-board").count()
  await page5.close()
  out.autoBattleUnaffected = { engine, hwtBoardCount }
  if (!(engine === undefined && hwtBoardCount === 0)) {
    out.errors.push("check5 the auto-battle path was affected by this round's changes")
  }
}

console.log(JSON.stringify(out, null, 2))
console.log("\npageErrors:", errs.length, errs.slice(0, 8))
await browser.close()

const pass = out.errors.length === 0 && errs.length === 0
console.log(pass ? "\n✅ verify_tactics_real_battle PASS" : "\n❌ verify_tactics_real_battle FAIL")
process.exit(pass ? 0 : 1)
