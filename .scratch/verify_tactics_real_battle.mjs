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

const PORT = process.env.PORT || 5399
const SHOT = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-tactics-elite-wire/.scratch/shots"
await mkdir(SHOT, { recursive: true })

const browser = await chromium.launch()
const errs = []
const out = { errors: [] }

// A minimal real runState, pointed at the first RUN_PATH node matching
// `nodeFilter`, with `benchDefIds` deployed. Mirrors verify_tactics_
// prototype.mjs's own seedRealSave helper.
//
// FIX this round: a directly-seeded save jumping straight to a LATER-Act
// node (every elite/miniboss this round's checks target sits well past
// Act I) left `lastSeenAct` at its default (1), which made
// HeartwoodBattle.jsx's own Act Crossroads gate (`actIndexForNode(...) >
// lastSeenAct`) intercept with the ActTransitionScreen interstitial
// INSTEAD of FormationScreen - a real gap in this helper, only ever
// masked before because every prior check (1-5) targeted the FIRST
// type:"battle" node, which is Act I (lastSeenAct's own default already
// covers it). Fixed by setting `lastSeenAct` to the seeded node's own
// real act via the same `actIndexForNode` HeartwoodBattle.jsx itself
// reads - not a workaround, the correct value for a save that starts
// "already this far into the run."
async function seedRealSave(page, nodeFilter, benchDefIds) {
  return page.evaluate(
    async ({ nodeFilterSrc, benchDefIds }) => {
      const { startRun, serializeRun, RUN_PATH, actIndexForNode } = await import("/src/services/heartwood/runEngine.js")
      // eslint-disable-next-line no-new-func
      const nodeFilter = new Function("n", `return (${nodeFilterSrc})(n)`)
      const idx = RUN_PATH.findIndex(nodeFilter)
      const bench = benchDefIds.map((defId, i) => ({ key: `b${i}`, defId, upgradeLevel: 0, upgrades: [] }))
      const deployed = [...bench.map((e) => e.key), ...Array(4 - bench.length).fill(null)]
      const lastSeenAct = actIndexForNode(idx, RUN_PATH.length)
      const rs = { ...startRun("tommy"), nodeIndex: idx, path: RUN_PATH.slice(0, idx + 1), phase: "formation", bench, deployed, items: [], lastSeenAct }
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

// 1. UPDATED this round (its old premise - "every elite/miniboss/boss
//    shows preview only" - is no longer true): a normal type:"battle"
//    node AND each of the 3 newly-approved encounters (The Ancient Grove,
//    The Elder Hollow, Deepwarden) show "Fight this as Tactics"; every
//    still-excluded elite/miniboss/boss (spot-checked via The Gorging
//    Maw, plus the boss) shows only the existing read-only preview link -
//    proving the allowlist boundary is EXACTLY the 3 approved ids, not
//    more, not fewer ------------------------------------------------------
{
  async function tacticsButtonState(nodeFilter) {
    const page = await newPage()
    page.on("pageerror", (e) => errs.push(String(e)))
    await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
    const seed = await seedRealSave(page, nodeFilter, ["the-fool"])
    await page.reload({ waitUntil: "domcontentloaded" })
    await page.waitForTimeout(400)
    const fightBtnCount = await page.locator(".hw-tactics-fight-btn").count()
    const previewLinkCount = await page.locator(".hw-tactics-link").count()
    await page.close()
    return { seed, fightBtnCount, previewLinkCount }
  }

  const battleNode = await tacticsButtonState((n) => n.type === "battle" && n.formationId)
  const ancientGrove = await tacticsButtonState((n) => n.type === "elite" && n.formationId === "the-ancient-grove")
  const elderHollow = await tacticsButtonState((n) => n.type === "elite" && n.formationId === "the-elder-hollow")
  const deepwarden = await tacticsButtonState((n) => n.type === "miniboss" && n.enemyId === "deepwarden")
  const gorgingMaw = await tacticsButtonState((n) => n.type === "elite" && n.enemyId === "the-gorging-maw")
  const boss = await tacticsButtonState((n) => n.type === "boss")

  out.buttonChoiceMatrix = { battleNode, ancientGrove, elderHollow, deepwarden, gorgingMaw, boss }
  const readyOk = [battleNode, ancientGrove, elderHollow, deepwarden].every((r) => r.fightBtnCount === 1 && r.previewLinkCount === 0)
  const notReadyOk = [gorgingMaw, boss].every((r) => r.fightBtnCount === 0 && r.previewLinkCount === 1)
  if (!(readyOk && notReadyOk)) {
    out.errors.push("check1 the Fight-vs-Preview allowlist boundary was wrong for at least one node type")
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

// ---------------------------------------------------------------
// This round (feat/hearthwood-tactics-elite-wire): widen the real
// "Fight this as Tactics" button to the 3 elite/miniboss encounters
// whose real identity is already fully (or already-acceptedly) portable
// - The Ancient Grove, The Elder Hollow, Deepwarden. Every new check gets
// its own fresh page (the established anti-hang discipline).
// ---------------------------------------------------------------

// 6. The Ancient Grove's real entry: clicking Fight enters engine:"tactics"
//    with the exact real 3-piece enemy roster (2x Sapling Attendant + 1x
//    Ancient Oak) and the exact real deployed squad ----------------------
{
  const page6 = await newPage()
  page6.on("pageerror", (e) => errs.push(String(e)))
  await page6.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
  await seedRealSave(page6, (n) => n.type === "elite" && n.formationId === "the-ancient-grove", ["the-fool"])
  await page6.reload({ waitUntil: "domcontentloaded" })
  await page6.waitForTimeout(400)
  await page6.locator(".hw-tactics-fight-btn").click()
  await page6.waitForTimeout(400)
  const engine = await page6.evaluate(() => JSON.parse(localStorage.getItem("heartwood-run-save-v1")).run.battle?.engine)
  const playerNames = await page6.locator('.hwt-token[data-side="player"] .hwt-token-name').allInnerTexts()
  const enemyNames = await page6.locator('.hwt-token[data-side="enemy"] .hwt-token-name').allInnerTexts()
  await page6.screenshot({ path: `${SHOT}/ancient_grove_live.png` })
  await page6.close()
  out.ancientGroveEntry = { engine, playerNames, enemyNames }
  const saplingCount = enemyNames.filter((n) => n === "Sapling Attendant").length
  if (!(engine === "tactics" && playerNames.length === 1 && playerNames[0] === "Mosskit" && saplingCount === 2 && enemyNames.includes("Ancient Oak"))) {
    out.errors.push("check6 entering The Ancient Grove for real did not load the exact real 3-piece formation")
  }
}

// 7. The Ancient Grove's win pays the exact real economy math - the same
//    rigor as check 3, now proving the bridge genuinely generalizes to an
//    elite node, not just a normal one ------------------------------------
{
  const page7 = await newPage()
  page7.on("pageerror", (e) => errs.push(String(e)))
  await page7.goto(`http://localhost:${PORT}/heartwood?debugLowHp=1`, { waitUntil: "domcontentloaded" })
  const seed7 = await page7.evaluate(async () => {
    const { startRun, serializeRun, RUN_PATH, essenceForWin, bankInterestFor, actIndexForNode } = await import("/src/services/heartwood/runEngine.js")
    const idx = RUN_PATH.findIndex((n) => n.type === "elite" && n.formationId === "the-ancient-grove")
    const rs = {
      ...startRun("tommy"),
      nodeIndex: idx,
      path: RUN_PATH.slice(0, idx + 1),
      phase: "formation",
      bench: [{ key: "b1", defId: "the-fool", upgradeLevel: 0, upgrades: [] }],
      deployed: ["b1", null, null, null],
      items: [],
      // see seedRealSave's own comment above - a save jumping straight to
      // a later-Act node needs lastSeenAct set, or the Act Crossroads
      // interstitial intercepts before FormationScreen ever renders.
      lastSeenAct: actIndexForNode(idx, RUN_PATH.length),
    }
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(rs)))
    const node = RUN_PATH[idx]
    return { idx, expectedEssence: rs.essence + essenceForWin(rs, node) + bankInterestFor(rs) }
  })
  await page7.reload({ waitUntil: "domcontentloaded" })
  await page7.waitForTimeout(400)
  await page7.locator(".hw-tactics-fight-btn").click()
  await page7.waitForTimeout(400)
  let phase = "player"
  let turns = 0
  while (phase !== "won" && phase !== "lost" && turns < 20) {
    await page7.locator('.hwt-token[data-side="player"]').first().click({ force: true }).catch(() => {})
    await page7.waitForTimeout(120)
    let targets = page7.locator('.hwt-cell[data-targetable="true"]')
    if ((await targets.count()) === 0) {
      const reach = page7.locator('.hwt-cell[data-reachable="true"]')
      if ((await reach.count()) > 0) {
        await reach.first().click()
        await page7.waitForTimeout(120)
      }
    }
    targets = page7.locator('.hwt-cell[data-targetable="true"]')
    if ((await targets.count()) > 0) {
      await targets.first().click()
      await page7.waitForTimeout(150)
    }
    await page7.locator(".hwt-end-turn").click().catch(() => {})
    await page7.waitForTimeout(400)
    phase = await page7.locator(".hwt-turn-label").getAttribute("data-phase")
    turns++
  }
  let afterContinue = null
  if (phase === "won") {
    await page7.locator(".hwt-continue-btn").click()
    await page7.waitForTimeout(400)
    afterContinue = await page7.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem("heartwood-run-save-v1"))
      return { phase: saved.run.phase, essence: saved.run.essence, battle: saved.run.battle, nodeIndex: saved.run.nodeIndex }
    })
  }
  await page7.close()
  out.ancientGroveWinPath = { phase, turns, seed7, afterContinue }
  if (
    !(
      phase === "won" &&
      afterContinue &&
      afterContinue.essence === seed7.expectedEssence &&
      afterContinue.battle === null &&
      afterContinue.nodeIndex === seed7.idx + 1
    )
  ) {
    out.errors.push("check7 The Ancient Grove's win path did not pay out the exact real essence formula, or did not advance/clear the battle correctly")
  }
}

// 8. Deepwarden's real entry - a lighter spot-check, since its own
//    mechanics were already fully proven in PR #464's 73-check isolated-
//    prototype suite; what's new here is only "does it reach the live
//    economy bridge," which check 7 already establishes generically -----
{
  const page8 = await newPage()
  page8.on("pageerror", (e) => errs.push(String(e)))
  await page8.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
  await seedRealSave(page8, (n) => n.type === "miniboss" && n.enemyId === "deepwarden", ["the-fool"])
  await page8.reload({ waitUntil: "domcontentloaded" })
  await page8.waitForTimeout(400)
  await page8.locator(".hw-tactics-fight-btn").click()
  await page8.waitForTimeout(400)
  const engine = await page8.evaluate(() => JSON.parse(localStorage.getItem("heartwood-run-save-v1")).run.battle?.engine)
  const playerNames = await page8.locator('.hwt-token[data-side="player"] .hwt-token-name').allInnerTexts()
  const enemyNames = await page8.locator('.hwt-token[data-side="enemy"] .hwt-token-name').allInnerTexts()
  await page8.screenshot({ path: `${SHOT}/deepwarden_live.png` })
  await page8.close()
  out.deepwardenEntry = { engine, playerNames, enemyNames }
  if (!(engine === "tactics" && playerNames.length === 1 && playerNames[0] === "Mosskit" && enemyNames.length === 1 && enemyNames[0] === "Deepwarden")) {
    out.errors.push("check8 entering Deepwarden for real did not load the exact real solo composition")
  }
}

// 9. Deepwarden's win also pays the exact real economy math - confirms
//    its trialId wrapper ("rootkeeper") doesn't interfere with anything -
{
  const page9 = await newPage()
  page9.on("pageerror", (e) => errs.push(String(e)))
  await page9.goto(`http://localhost:${PORT}/heartwood?debugLowHp=1`, { waitUntil: "domcontentloaded" })
  const seed9 = await page9.evaluate(async () => {
    const { startRun, serializeRun, RUN_PATH, essenceForWin, bankInterestFor, actIndexForNode } = await import("/src/services/heartwood/runEngine.js")
    const idx = RUN_PATH.findIndex((n) => n.type === "miniboss" && n.enemyId === "deepwarden")
    const rs = {
      ...startRun("tommy"),
      nodeIndex: idx,
      path: RUN_PATH.slice(0, idx + 1),
      phase: "formation",
      bench: [{ key: "b1", defId: "the-fool", upgradeLevel: 0, upgrades: [] }],
      deployed: ["b1", null, null, null],
      items: [],
      lastSeenAct: actIndexForNode(idx, RUN_PATH.length),
    }
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(rs)))
    const node = RUN_PATH[idx]
    return { idx, expectedEssence: rs.essence + essenceForWin(rs, node) + bankInterestFor(rs) }
  })
  await page9.reload({ waitUntil: "domcontentloaded" })
  await page9.waitForTimeout(400)
  await page9.locator(".hw-tactics-fight-btn").click()
  await page9.waitForTimeout(400)
  let phase = "player"
  let turns = 0
  while (phase !== "won" && phase !== "lost" && turns < 20) {
    await page9.locator('.hwt-token[data-side="player"]').first().click({ force: true }).catch(() => {})
    await page9.waitForTimeout(120)
    let targets = page9.locator('.hwt-cell[data-targetable="true"]')
    if ((await targets.count()) === 0) {
      const reach = page9.locator('.hwt-cell[data-reachable="true"]')
      if ((await reach.count()) > 0) {
        await reach.first().click()
        await page9.waitForTimeout(120)
      }
    }
    targets = page9.locator('.hwt-cell[data-targetable="true"]')
    if ((await targets.count()) > 0) {
      await targets.first().click()
      await page9.waitForTimeout(150)
    }
    await page9.locator(".hwt-end-turn").click().catch(() => {})
    await page9.waitForTimeout(400)
    phase = await page9.locator(".hwt-turn-label").getAttribute("data-phase")
    turns++
  }
  let afterContinue = null
  if (phase === "won") {
    await page9.locator(".hwt-continue-btn").click()
    await page9.waitForTimeout(400)
    afterContinue = await page9.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem("heartwood-run-save-v1"))
      return { phase: saved.run.phase, essence: saved.run.essence, battle: saved.run.battle, nodeIndex: saved.run.nodeIndex }
    })
  }
  await page9.close()
  out.deepwardenWinPath = { phase, turns, seed9, afterContinue }
  if (
    !(
      phase === "won" &&
      afterContinue &&
      afterContinue.essence === seed9.expectedEssence &&
      afterContinue.battle === null &&
      afterContinue.nodeIndex === seed9.idx + 1
    )
  ) {
    out.errors.push("check9 Deepwarden's win path did not pay out the exact real essence formula, or did not advance/clear the battle correctly")
  }
}

console.log(JSON.stringify(out, null, 2))
console.log("\npageErrors:", errs.length, errs.slice(0, 8))
await browser.close()

const pass = out.errors.length === 0 && errs.length === 0
console.log(pass ? "\n✅ verify_tactics_real_battle PASS" : "\n❌ verify_tactics_real_battle FAIL")
process.exit(pass ? 0 : 1)
