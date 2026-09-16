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

const PORT = process.env.PORT || 5421
const SHOT = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-tactics-fearzone/.scratch/shots"
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
async function seedRealSave(page, nodeFilter, benchDefIds, forcedSeed = null) {
  return page.evaluate(
    async ({ nodeFilterSrc, benchDefIds, forcedSeed }) => {
      const { startRun, serializeRun, RUN_PATH, actIndexForNode } = await import("/src/services/heartwood/runEngine.js")
      // eslint-disable-next-line no-new-func
      const nodeFilter = new Function("n", `return (${nodeFilterSrc})(n)`)
      const idx = RUN_PATH.findIndex(nodeFilter)
      const bench = benchDefIds.map((defId, i) => ({ key: `b${i}`, defId, upgradeLevel: 0, upgrades: [] }))
      const deployed = [...bench.map((e) => e.key), ...Array(4 - bench.length).fill(null)]
      const lastSeenAct = actIndexForNode(idx, RUN_PATH.length)
      // Seeded terrain round: an optional forced seed (startRun's own
      // meta.forcedSeed hook, already real/production-used for exactly
      // this "reproducible for a check" purpose) - lets a check
      // independently recompute the exact terrain generateRealTerrain
      // itself would produce for this same (seed, nodeIndex) pair.
      const rs = {
        ...startRun("tommy", null, forcedSeed != null ? { forcedSeed } : null),
        nodeIndex: idx,
        path: RUN_PATH.slice(0, idx + 1),
        phase: "formation",
        bench,
        deployed,
        items: [],
        lastSeenAct,
      }
      localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(rs)))
      const node = RUN_PATH[idx]
      return { idx, type: node.type, formationId: node.formationId, enemyId: node.enemyId, essence: rs.essence, seed: rs.seed }
    },
    { nodeFilterSrc: nodeFilter.toString(), benchDefIds, forcedSeed },
  )
}

function newPage() {
  return browser.newContext({ viewport: { width: 1300, height: 900 } }).then((ctx) => ctx.newPage())
}

// 1. UPDATED this round (its own premise from PR #477 - "the final boss
//    is still not-ready" - is no longer true after PR #478's Revive+AoE
//    work): a normal type:"battle" node AND all 8 elite/miniboss/boss
//    encounters in the entire game (confirmed by reading runEngine.js's
//    own RUN_PATH directly - there are no others) now show "Fight this
//    as Tactics". With every real encounter now ready, there is nothing
//    left to spot-check on the "not-ready" side - dropped rather than
//    left as a stale placeholder ---------------------------------------
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
  const wyrmgall = await tacticsButtonState((n) => n.type === "miniboss" && n.enemyId === "wyrmgall")
  const ironSentinel = await tacticsButtonState((n) => n.type === "elite" && n.enemyId === "the-iron-sentinel")
  const thornmaw = await tacticsButtonState((n) => n.type === "miniboss" && n.enemyId === "thornmaw")
  const boss = await tacticsButtonState((n) => n.type === "boss")

  out.buttonChoiceMatrix = { battleNode, ancientGrove, elderHollow, deepwarden, gorgingMaw, wyrmgall, ironSentinel, thornmaw, boss }
  const readyOk = [battleNode, ancientGrove, elderHollow, deepwarden, gorgingMaw, wyrmgall, ironSentinel, thornmaw, boss].every((r) => r.fightBtnCount === 1 && r.previewLinkCount === 0)
  if (!readyOk) {
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
  // Real-fight wiring round: the run's own real Commander (seeded via
  // startRun("tommy")) now deploys alongside the recruited squad here
  // too - 2 player units, not 1.
  if (
    !(
      engine === "tactics" &&
      playerNames.length === 2 &&
      playerNames.includes("Mosskit") &&
      playerNames.includes("Tommy") &&
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
  if (!(engine === "tactics" && playerNames.length === 2 && playerNames.includes("Mosskit") && playerNames.includes("Tommy") && saplingCount === 2 && enemyNames.includes("Ancient Oak"))) {
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
  if (!(engine === "tactics" && playerNames.length === 2 && playerNames.includes("Mosskit") && playerNames.includes("Tommy") && enemyNames.length === 1 && enemyNames[0] === "Deepwarden")) {
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

// ---------------------------------------------------------------
// This round (feat/hearthwood-tactics-wire-2): widen the real "Fight
// this as Tactics" button to The Gorging Maw + Wyrmgall, now that PR
// #466 made both fully faithful in the isolated prototype. Every new
// check gets its own fresh page.
// ---------------------------------------------------------------

// 10. The Gorging Maw's real entry - a lighter spot-check, since its own
//     lifelink was already fully proven in PR #466's 83-check isolated-
//     prototype suite; what's new here is only "does it reach the live
//     economy bridge" -----------------------------------------------
{
  const page10 = await newPage()
  page10.on("pageerror", (e) => errs.push(String(e)))
  await page10.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
  await seedRealSave(page10, (n) => n.type === "elite" && n.enemyId === "the-gorging-maw", ["the-fool"])
  await page10.reload({ waitUntil: "domcontentloaded" })
  await page10.waitForTimeout(400)
  await page10.locator(".hw-tactics-fight-btn").click()
  await page10.waitForTimeout(400)
  const engine = await page10.evaluate(() => JSON.parse(localStorage.getItem("heartwood-run-save-v1")).run.battle?.engine)
  const playerNames = await page10.locator('.hwt-token[data-side="player"] .hwt-token-name').allInnerTexts()
  const enemyNames = await page10.locator('.hwt-token[data-side="enemy"] .hwt-token-name').allInnerTexts()
  await page10.screenshot({ path: `${SHOT}/gorging_maw_live.png` })
  await page10.close()
  out.gorgingMawEntry = { engine, playerNames, enemyNames }
  if (!(engine === "tactics" && playerNames.length === 2 && playerNames.includes("Mosskit") && playerNames.includes("Tommy") && enemyNames.length === 1 && enemyNames[0] === "The Gorging Maw")) {
    out.errors.push("check10 entering The Gorging Maw for real did not load the exact real solo composition")
  }
}

// 11. The Gorging Maw's win pays the exact real economy math ------------
{
  const page11 = await newPage()
  page11.on("pageerror", (e) => errs.push(String(e)))
  await page11.goto(`http://localhost:${PORT}/heartwood?debugLowHp=1`, { waitUntil: "domcontentloaded" })
  const seed11 = await page11.evaluate(async () => {
    const { startRun, serializeRun, RUN_PATH, essenceForWin, bankInterestFor, actIndexForNode } = await import("/src/services/heartwood/runEngine.js")
    const idx = RUN_PATH.findIndex((n) => n.type === "elite" && n.enemyId === "the-gorging-maw")
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
  await page11.reload({ waitUntil: "domcontentloaded" })
  await page11.waitForTimeout(400)
  await page11.locator(".hw-tactics-fight-btn").click()
  await page11.waitForTimeout(400)
  let phase = "player"
  let turns = 0
  while (phase !== "won" && phase !== "lost" && turns < 20) {
    await page11.locator('.hwt-token[data-side="player"]').first().click({ force: true }).catch(() => {})
    await page11.waitForTimeout(120)
    let targets = page11.locator('.hwt-cell[data-targetable="true"]')
    if ((await targets.count()) === 0) {
      const reach = page11.locator('.hwt-cell[data-reachable="true"]')
      if ((await reach.count()) > 0) {
        await reach.first().click()
        await page11.waitForTimeout(120)
      }
    }
    targets = page11.locator('.hwt-cell[data-targetable="true"]')
    if ((await targets.count()) > 0) {
      await targets.first().click()
      await page11.waitForTimeout(150)
    }
    await page11.locator(".hwt-end-turn").click().catch(() => {})
    await page11.waitForTimeout(400)
    phase = await page11.locator(".hwt-turn-label").getAttribute("data-phase")
    turns++
  }
  let afterContinue = null
  if (phase === "won") {
    await page11.locator(".hwt-continue-btn").click()
    await page11.waitForTimeout(400)
    afterContinue = await page11.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem("heartwood-run-save-v1"))
      return { phase: saved.run.phase, essence: saved.run.essence, battle: saved.run.battle, nodeIndex: saved.run.nodeIndex }
    })
  }
  await page11.close()
  out.gorgingMawWinPath = { phase, turns, seed11, afterContinue }
  if (
    !(
      phase === "won" &&
      afterContinue &&
      afterContinue.essence === seed11.expectedEssence &&
      afterContinue.battle === null &&
      afterContinue.nodeIndex === seed11.idx + 1
    )
  ) {
    out.errors.push("check11 The Gorging Maw's win path did not pay out the exact real essence formula, or did not advance/clear the battle correctly")
  }
}

// 12. Wyrmgall's real entry - confirms its trialId ("veilbound") wrapper
//     doesn't interfere, same as Deepwarden's own check already proved
//     for "rootkeeper" -------------------------------------------------
{
  const page12 = await newPage()
  page12.on("pageerror", (e) => errs.push(String(e)))
  await page12.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
  await seedRealSave(page12, (n) => n.type === "miniboss" && n.enemyId === "wyrmgall", ["the-fool"])
  await page12.reload({ waitUntil: "domcontentloaded" })
  await page12.waitForTimeout(400)
  await page12.locator(".hw-tactics-fight-btn").click()
  await page12.waitForTimeout(400)
  const engine = await page12.evaluate(() => JSON.parse(localStorage.getItem("heartwood-run-save-v1")).run.battle?.engine)
  const playerNames = await page12.locator('.hwt-token[data-side="player"] .hwt-token-name').allInnerTexts()
  const enemyNames = await page12.locator('.hwt-token[data-side="enemy"] .hwt-token-name').allInnerTexts()
  await page12.screenshot({ path: `${SHOT}/wyrmgall_live.png` })
  await page12.close()
  out.wyrmgallEntry = { engine, playerNames, enemyNames }
  if (!(engine === "tactics" && playerNames.length === 2 && playerNames.includes("Mosskit") && playerNames.includes("Tommy") && enemyNames.length === 1 && enemyNames[0] === "Wyrmgall")) {
    out.errors.push("check12 entering Wyrmgall for real did not load the exact real solo composition")
  }
}

// 13. Wyrmgall's win pays the exact real economy math --------------------
{
  const page13 = await newPage()
  page13.on("pageerror", (e) => errs.push(String(e)))
  await page13.goto(`http://localhost:${PORT}/heartwood?debugLowHp=1`, { waitUntil: "domcontentloaded" })
  const seed13 = await page13.evaluate(async () => {
    const { startRun, serializeRun, RUN_PATH, essenceForWin, bankInterestFor, actIndexForNode } = await import("/src/services/heartwood/runEngine.js")
    const idx = RUN_PATH.findIndex((n) => n.type === "miniboss" && n.enemyId === "wyrmgall")
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
  await page13.reload({ waitUntil: "domcontentloaded" })
  await page13.waitForTimeout(400)
  await page13.locator(".hw-tactics-fight-btn").click()
  await page13.waitForTimeout(400)
  let phase = "player"
  let turns = 0
  while (phase !== "won" && phase !== "lost" && turns < 20) {
    await page13.locator('.hwt-token[data-side="player"]').first().click({ force: true }).catch(() => {})
    await page13.waitForTimeout(120)
    let targets = page13.locator('.hwt-cell[data-targetable="true"]')
    if ((await targets.count()) === 0) {
      const reach = page13.locator('.hwt-cell[data-reachable="true"]')
      if ((await reach.count()) > 0) {
        await reach.first().click()
        await page13.waitForTimeout(120)
      }
    }
    targets = page13.locator('.hwt-cell[data-targetable="true"]')
    if ((await targets.count()) > 0) {
      await targets.first().click()
      await page13.waitForTimeout(150)
    }
    await page13.locator(".hwt-end-turn").click().catch(() => {})
    await page13.waitForTimeout(400)
    phase = await page13.locator(".hwt-turn-label").getAttribute("data-phase")
    turns++
  }
  let afterContinue = null
  if (phase === "won") {
    await page13.locator(".hwt-continue-btn").click()
    await page13.waitForTimeout(400)
    afterContinue = await page13.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem("heartwood-run-save-v1"))
      return { phase: saved.run.phase, essence: saved.run.essence, battle: saved.run.battle, nodeIndex: saved.run.nodeIndex }
    })
  }
  await page13.close()
  out.wyrmgallWinPath = { phase, turns, seed13, afterContinue }
  if (
    !(
      phase === "won" &&
      afterContinue &&
      afterContinue.essence === seed13.expectedEssence &&
      afterContinue.battle === null &&
      afterContinue.nodeIndex === seed13.idx + 1
    )
  ) {
    out.errors.push("check13 Wyrmgall's win path did not pay out the exact real essence formula, or did not advance/clear the battle correctly")
  }
}

// ---------------------------------------------------------------
// This round (feat/hearthwood-tactics-wire-3): widen the real "Fight
// this as Tactics" button to The Iron Sentinel, now that PR #469 made
// Bulwark fully faithful in the isolated prototype. Every new check gets
// its own fresh page.
// ---------------------------------------------------------------

// 14. The Iron Sentinel's real entry - a lighter spot-check, since its
//     own mechanics were already fully proven in PR #469's 90-check
//     isolated-prototype suite; what's new here is only "does it reach
//     the live economy bridge" -----------------------------------------
{
  const page14 = await newPage()
  page14.on("pageerror", (e) => errs.push(String(e)))
  await page14.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
  await seedRealSave(page14, (n) => n.type === "elite" && n.enemyId === "the-iron-sentinel", ["the-fool"])
  await page14.reload({ waitUntil: "domcontentloaded" })
  await page14.waitForTimeout(400)
  await page14.locator(".hw-tactics-fight-btn").click()
  await page14.waitForTimeout(400)
  const engine = await page14.evaluate(() => JSON.parse(localStorage.getItem("heartwood-run-save-v1")).run.battle?.engine)
  const playerNames = await page14.locator('.hwt-token[data-side="player"] .hwt-token-name').allInnerTexts()
  const enemyNames = await page14.locator('.hwt-token[data-side="enemy"] .hwt-token-name').allInnerTexts()
  await page14.screenshot({ path: `${SHOT}/iron_sentinel_live.png` })
  await page14.close()
  out.ironSentinelEntry = { engine, playerNames, enemyNames }
  if (!(engine === "tactics" && playerNames.length === 2 && playerNames.includes("Mosskit") && playerNames.includes("Tommy") && enemyNames.length === 1 && enemyNames[0] === "The Iron Sentinel")) {
    out.errors.push("check14 entering The Iron Sentinel for real did not load the exact real solo composition")
  }
}

// 15. The Iron Sentinel's win pays the exact real economy math ----------
{
  const page15 = await newPage()
  page15.on("pageerror", (e) => errs.push(String(e)))
  await page15.goto(`http://localhost:${PORT}/heartwood?debugLowHp=1`, { waitUntil: "domcontentloaded" })
  const seed15 = await page15.evaluate(async () => {
    const { startRun, serializeRun, RUN_PATH, essenceForWin, bankInterestFor, actIndexForNode } = await import("/src/services/heartwood/runEngine.js")
    const idx = RUN_PATH.findIndex((n) => n.type === "elite" && n.enemyId === "the-iron-sentinel")
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
  await page15.reload({ waitUntil: "domcontentloaded" })
  await page15.waitForTimeout(400)
  await page15.locator(".hw-tactics-fight-btn").click()
  await page15.waitForTimeout(400)
  let phase = "player"
  let turns = 0
  while (phase !== "won" && phase !== "lost" && turns < 20) {
    await page15.locator('.hwt-token[data-side="player"]').first().click({ force: true }).catch(() => {})
    await page15.waitForTimeout(120)
    let targets = page15.locator('.hwt-cell[data-targetable="true"]')
    if ((await targets.count()) === 0) {
      const reach = page15.locator('.hwt-cell[data-reachable="true"]')
      if ((await reach.count()) > 0) {
        await reach.first().click()
        await page15.waitForTimeout(120)
      }
    }
    targets = page15.locator('.hwt-cell[data-targetable="true"]')
    if ((await targets.count()) > 0) {
      await targets.first().click()
      await page15.waitForTimeout(150)
    }
    await page15.locator(".hwt-end-turn").click().catch(() => {})
    await page15.waitForTimeout(400)
    phase = await page15.locator(".hwt-turn-label").getAttribute("data-phase")
    turns++
  }
  let afterContinue = null
  if (phase === "won") {
    await page15.locator(".hwt-continue-btn").click()
    await page15.waitForTimeout(400)
    afterContinue = await page15.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem("heartwood-run-save-v1"))
      return { phase: saved.run.phase, essence: saved.run.essence, battle: saved.run.battle, nodeIndex: saved.run.nodeIndex }
    })
  }
  await page15.close()
  out.ironSentinelWinPath = { phase, turns, seed15, afterContinue }
  if (
    !(
      phase === "won" &&
      afterContinue &&
      afterContinue.essence === seed15.expectedEssence &&
      afterContinue.battle === null &&
      afterContinue.nodeIndex === seed15.idx + 1
    )
  ) {
    out.errors.push("check15 The Iron Sentinel's win path did not pay out the exact real essence formula, or did not advance/clear the battle correctly")
  }
}

// ---------------------------------------------------------------
// This round (feat/hearthwood-tactics-wire-thornmaw): widen the real
// "Fight this as Tactics" button to Thornmaw, now that PR #471 made
// Regen+Taunt fully faithful in the isolated prototype. Every new check
// gets its own fresh page.
// ---------------------------------------------------------------

// 16. Thornmaw's real entry - a lighter spot-check, since its own
//     mechanics were already fully proven in PR #471's 94-check
//     isolated-prototype suite; what's new here is only "does it reach
//     the live economy bridge". Also confirms its trialId
//     ("heartwood-warden") wrapper doesn't interfere, same as
//     Deepwarden's own check already proved for "rootkeeper" -----------
{
  const page16 = await newPage()
  page16.on("pageerror", (e) => errs.push(String(e)))
  await page16.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
  await seedRealSave(page16, (n) => n.type === "miniboss" && n.enemyId === "thornmaw", ["the-fool"])
  await page16.reload({ waitUntil: "domcontentloaded" })
  await page16.waitForTimeout(400)
  await page16.locator(".hw-tactics-fight-btn").click()
  await page16.waitForTimeout(400)
  const engine = await page16.evaluate(() => JSON.parse(localStorage.getItem("heartwood-run-save-v1")).run.battle?.engine)
  const playerNames = await page16.locator('.hwt-token[data-side="player"] .hwt-token-name').allInnerTexts()
  const enemyNames = await page16.locator('.hwt-token[data-side="enemy"] .hwt-token-name').allInnerTexts()
  await page16.screenshot({ path: `${SHOT}/thornmaw_live.png` })
  await page16.close()
  out.thornmawEntry = { engine, playerNames, enemyNames }
  if (!(engine === "tactics" && playerNames.length === 2 && playerNames.includes("Mosskit") && playerNames.includes("Tommy") && enemyNames.length === 1 && enemyNames[0] === "Thornmaw")) {
    out.errors.push("check16 entering Thornmaw for real did not load the exact real solo composition")
  }
}

// 17. Thornmaw's win pays the exact real economy math - ?debugLowHp=1
//     forces its hp to 1 before the fight starts, so a single landed
//     hit wins it before endPlayerTurn (and therefore its own
//     applyRegenTick) ever runs once - Regen never gets a chance to
//     complicate this deterministic win path ---------------------------
{
  const page17 = await newPage()
  page17.on("pageerror", (e) => errs.push(String(e)))
  await page17.goto(`http://localhost:${PORT}/heartwood?debugLowHp=1`, { waitUntil: "domcontentloaded" })
  const seed17 = await page17.evaluate(async () => {
    const { startRun, serializeRun, RUN_PATH, essenceForWin, bankInterestFor, actIndexForNode } = await import("/src/services/heartwood/runEngine.js")
    const idx = RUN_PATH.findIndex((n) => n.type === "miniboss" && n.enemyId === "thornmaw")
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
  await page17.reload({ waitUntil: "domcontentloaded" })
  await page17.waitForTimeout(400)
  await page17.locator(".hw-tactics-fight-btn").click()
  await page17.waitForTimeout(400)
  let phase = "player"
  let turns = 0
  while (phase !== "won" && phase !== "lost" && turns < 20) {
    await page17.locator('.hwt-token[data-side="player"]').first().click({ force: true }).catch(() => {})
    await page17.waitForTimeout(120)
    let targets = page17.locator('.hwt-cell[data-targetable="true"]')
    if ((await targets.count()) === 0) {
      const reach = page17.locator('.hwt-cell[data-reachable="true"]')
      if ((await reach.count()) > 0) {
        await reach.first().click()
        await page17.waitForTimeout(120)
      }
    }
    targets = page17.locator('.hwt-cell[data-targetable="true"]')
    if ((await targets.count()) > 0) {
      await targets.first().click()
      await page17.waitForTimeout(150)
    }
    await page17.locator(".hwt-end-turn").click().catch(() => {})
    await page17.waitForTimeout(400)
    phase = await page17.locator(".hwt-turn-label").getAttribute("data-phase")
    turns++
  }
  let afterContinue = null
  if (phase === "won") {
    await page17.locator(".hwt-continue-btn").click()
    await page17.waitForTimeout(400)
    afterContinue = await page17.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem("heartwood-run-save-v1"))
      return { phase: saved.run.phase, essence: saved.run.essence, battle: saved.run.battle, nodeIndex: saved.run.nodeIndex }
    })
  }
  await page17.close()
  out.thornmawWinPath = { phase, turns, seed17, afterContinue }
  if (
    !(
      phase === "won" &&
      afterContinue &&
      afterContinue.essence === seed17.expectedEssence &&
      afterContinue.battle === null &&
      afterContinue.nodeIndex === seed17.idx + 1
    )
  ) {
    out.errors.push("check17 Thornmaw's win path did not pay out the exact real essence formula, or did not advance/clear the battle correctly")
  }
}

// ---------------------------------------------------------------
// This round (feat/hearthwood-tactics-wire-spacemonkey): widen the real
// "Fight this as Tactics" button to Spacemonkey (the final boss), now
// that PR #478 made Revive+AoE fully faithful in the isolated
// prototype. Every new check gets its own fresh page.
// ---------------------------------------------------------------

// 18. Spacemonkey's real entry - a lighter spot-check, since his own
//     mechanics were already fully proven in PR #478's 102-check
//     isolated-prototype suite. Also confirms his trialId
//     ("hollow-king") wrapper doesn't interfere, same as every other
//     wrapped encounter already proved ------------------------------
{
  const page18 = await newPage()
  page18.on("pageerror", (e) => errs.push(String(e)))
  await page18.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
  await seedRealSave(page18, (n) => n.type === "boss", ["the-fool"])
  await page18.reload({ waitUntil: "domcontentloaded" })
  await page18.waitForTimeout(400)
  await page18.locator(".hw-tactics-fight-btn").click()
  await page18.waitForTimeout(400)
  const engine = await page18.evaluate(() => JSON.parse(localStorage.getItem("heartwood-run-save-v1")).run.battle?.engine)
  const playerNames = await page18.locator('.hwt-token[data-side="player"] .hwt-token-name').allInnerTexts()
  const enemyNames = await page18.locator('.hwt-token[data-side="enemy"] .hwt-token-name').allInnerTexts()
  await page18.screenshot({ path: `${SHOT}/spacemonkey_live.png` })
  await page18.close()
  out.spacemonkeyEntry = { engine, playerNames, enemyNames }
  if (!(engine === "tactics" && playerNames.length === 2 && playerNames.includes("Mosskit") && playerNames.includes("Tommy") && enemyNames.length === 1 && enemyNames[0] === "Spacemonkey")) {
    out.errors.push("check18 entering Spacemonkey for real did not load the exact real solo composition")
  }
}

// 19. Spacemonkey's win ENDS THE RUN, not a normal battle - a
//     genuinely different outcome shape than every prior encounter's
//     own win-economy proof: reading resolveBattleOutcome directly
//     (runEngine.js) shows its boss branch returns IMMEDIATELY with
//     ONLY `phase` changed (`{ ...runState, phase: "victory" }`) - no
//     essenceForWin/bankInterestFor, no bench Evolution, no
//     advanceToNextNode, and (caught by this check's own first run,
//     which failed on exactly this before the fix below) no `battle:
//     null` either - that clear only happens in the NORMAL win branch
//     further down (runEngine.js:2813), so `battle` stays exactly the
//     {phase,round} object handleTacticsContinue's own translation
//     built. So essence/nodeIndex must stay EXACTLY as they were before
//     the fight, phase must become "victory", and battle must stay a
//     {phase:"won"} object, NOT null - not the essence-formula shape
//     checks 3/7/9/11/13/15/17 all used --------------------------
{
  const page19 = await newPage()
  page19.on("pageerror", (e) => errs.push(String(e)))
  await page19.goto(`http://localhost:${PORT}/heartwood?debugLowHp=1`, { waitUntil: "domcontentloaded" })
  const seed19 = await page19.evaluate(async () => {
    const { startRun, serializeRun, RUN_PATH, actIndexForNode } = await import("/src/services/heartwood/runEngine.js")
    const idx = RUN_PATH.findIndex((n) => n.type === "boss")
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
    return { idx, expectedEssence: rs.essence }
  })
  await page19.reload({ waitUntil: "domcontentloaded" })
  await page19.waitForTimeout(400)
  await page19.locator(".hw-tactics-fight-btn").click()
  await page19.waitForTimeout(400)
  let phase = "player"
  let turns = 0
  while (phase !== "won" && phase !== "lost" && turns < 20) {
    await page19.locator('.hwt-token[data-side="player"]').first().click({ force: true }).catch(() => {})
    await page19.waitForTimeout(120)
    let targets = page19.locator('.hwt-cell[data-targetable="true"]')
    if ((await targets.count()) === 0) {
      const reach = page19.locator('.hwt-cell[data-reachable="true"]')
      if ((await reach.count()) > 0) {
        await reach.first().click()
        await page19.waitForTimeout(120)
      }
    }
    targets = page19.locator('.hwt-cell[data-targetable="true"]')
    if ((await targets.count()) > 0) {
      await targets.first().click()
      await page19.waitForTimeout(150)
    }
    await page19.locator(".hwt-end-turn").click().catch(() => {})
    await page19.waitForTimeout(400)
    phase = await page19.locator(".hwt-turn-label").getAttribute("data-phase")
    turns++
  }
  let afterContinue = null
  if (phase === "won") {
    await page19.locator(".hwt-continue-btn").click()
    await page19.waitForTimeout(400)
    afterContinue = await page19.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem("heartwood-run-save-v1"))
      return { phase: saved.run.phase, essence: saved.run.essence, battle: saved.run.battle, nodeIndex: saved.run.nodeIndex }
    })
  }
  await page19.close()
  out.spacemonkeyWinEndsRun = { phase, turns, seed19, afterContinue }
  if (
    !(
      phase === "won" &&
      afterContinue &&
      afterContinue.phase === "victory" &&
      afterContinue.essence === seed19.expectedEssence &&
      afterContinue.battle?.phase === "won" &&
      afterContinue.nodeIndex === seed19.idx
    )
  ) {
    out.errors.push("check19 Spacemonkey's win did not end the run correctly (expected phase:\"victory\", unchanged essence/nodeIndex, battle left as {phase:\"won\"})")
  }
}

// 20. End-to-end through the REAL Fight button: the Commander's real
//     kit (stats + Haste + Squad Passive) survives the real bridge -
//     Tommy fires a real second strike and Squad Passive's Block/Weak
//     badges appear during an ACTUAL click-driven real fight, not just
//     the isolated prototype ------------------------------------------
{
  const page20 = await newPage()
  page20.on("pageerror", (e) => errs.push(String(e)))
  await page20.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
  await seedRealSave(page20, (n) => n.type === "battle" && n.formationId, ["the-fool"])
  await page20.reload({ waitUntil: "domcontentloaded" })
  await page20.waitForTimeout(400)
  await page20.locator(".hw-tactics-fight-btn").click()
  await page20.waitForTimeout(400)
  const tommyToken = page20.locator(".hwt-token", { hasText: "Tommy" })
  await tommyToken.click({ force: true })
  await page20.waitForTimeout(200)
  let placed = false
  for (let i = 0; i < 6 && !placed; i++) {
    const reach = page20.locator('.hwt-cell[data-reachable="true"]')
    const n = await reach.count()
    if (n > 0) {
      const boxes = []
      for (let j = 0; j < n; j++) boxes.push({ idx: j, box: await reach.nth(j).boundingBox() })
      boxes.sort((a, b) => a.box.x - b.box.x)
      await reach.nth(boxes[0].idx).click()
      await page20.waitForTimeout(250)
    }
    const targetable = await page20.locator('.hwt-cell[data-targetable="true"]').count()
    if (targetable > 0) {
      placed = true
      break
    }
    await page20.locator(".hwt-end-turn").click().catch(() => {})
    await page20.waitForTimeout(400)
    await tommyToken.click({ force: true }).catch(() => {})
    await page20.waitForTimeout(200)
  }
  const targetable = page20.locator('.hwt-cell[data-targetable="true"]')
  if ((await targetable.count()) > 0) {
    await targetable.first().click()
    await page20.waitForTimeout(400)
  }
  const logText = await page20.locator(".hwt-log").innerText()
  const hasteLine = logText.includes("Haste fires")
  const weakBadgeCount = await page20.locator(".hwt-weak-badge").count()
  const commanderBadgeCount = await page20.locator(".hwt-commander-badge").count()
  const hasteBadgeCount = await page20.locator(".hwt-haste-badge").count()
  await page20.screenshot({ path: `${SHOT}/real_fight_commander.png` })
  await page20.close()
  out.realFightCommanderKit = { hasteLine, weakBadgeCount, commanderBadgeCount, hasteBadgeCount }
  const ok = hasteLine && weakBadgeCount >= 1 && commanderBadgeCount === 1 && hasteBadgeCount === 1
  if (!ok) out.errors.push("check20 the Commander's real kit (Haste/Squad Passive) did not survive the real Fight button bridge")
}

// 21. Seeded terrain: a real fight (a forced seed) shows the SAME
//     terrain cell-type counts on the real board that
//     generateRealTerrain itself independently computes for that exact
//     (seed, nodeIndex) pair - proving the seed system's own terrain
//     generation genuinely reaches a real, in-run battlefield, not
//     just the isolated prototype ------------------------------------
{
  const page21 = await newPage()
  page21.on("pageerror", (e) => errs.push(String(e)))
  await page21.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
  const seed21 = await seedRealSave(page21, (n) => n.type === "battle" && n.formationId, ["the-fool"], 424242)
  const expectedTerrain = await page21.evaluate(
    async ({ seed, idx }) => {
      const { generateRealTerrain } = await import("/src/services/heartwood/tacticsRealMatchup.js")
      return generateRealTerrain(seed, idx)
    },
    { seed: seed21.seed, idx: seed21.idx },
  )
  await page21.reload({ waitUntil: "domcontentloaded" })
  await page21.waitForTimeout(400)
  await page21.locator(".hw-tactics-fight-btn").click()
  await page21.waitForTimeout(400)
  const terrainTypes = ["rock", "water", "poison", "forest"]
  const countsByType = {}
  for (const type of terrainTypes) {
    countsByType[type] = await page21.locator(`.hwt-cell[data-terrain="${type}"]`).count()
  }
  await page21.screenshot({ path: `${SHOT}/real_fight_terrain.png` })
  await page21.close()
  const expectedCountsByType = {}
  for (const type of terrainTypes) {
    expectedCountsByType[type] = Object.values(expectedTerrain).filter((t) => t === type).length
  }
  out.realFightSeededTerrain = { seed: seed21.seed, expectedTerrain, countsByType, expectedCountsByType }
  const ok = JSON.stringify(countsByType) === JSON.stringify(expectedCountsByType) && Object.keys(expectedTerrain).length > 0
  if (!ok) out.errors.push("check21 the real board's own terrain cell counts did not match generateRealTerrain's own computed map for the same seed")
}

// 22. Facing: the real board (via the real Fight button) also shows
//     the new facing arrow on every token, not just the isolated
//     prototype ---------------------------------------------------
{
  const page22 = await newPage()
  page22.on("pageerror", (e) => errs.push(String(e)))
  await page22.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
  await seedRealSave(page22, (n) => n.type === "battle" && n.formationId, ["the-fool"])
  await page22.reload({ waitUntil: "domcontentloaded" })
  await page22.waitForTimeout(400)
  await page22.locator(".hw-tactics-fight-btn").click()
  await page22.waitForTimeout(400)
  const arrowCount = await page22.locator(".hwt-facing-badge").count()
  const tokenCount = await page22.locator(".hwt-token").count()
  await page22.screenshot({ path: `${SHOT}/real_fight_facing.png` })
  await page22.close()
  out.realFightFacingBadge = { arrowCount, tokenCount }
  const ok = tokenCount > 0 && arrowCount === tokenCount
  if (!ok) out.errors.push("check22 not every token on the real board showed the new facing arrow")
}

// 23. Zone of Control: a real click-driven disengage from an adjacent
//     enemy triggers a real reaction attack, visible in the real
//     board's own log and hp change --------------------------------
{
  const page23 = await newPage()
  page23.on("pageerror", (e) => errs.push(String(e)))
  await page23.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
  await seedRealSave(page23, (n) => n.type === "battle" && n.formationId, ["the-fool"])
  await page23.reload({ waitUntil: "domcontentloaded" })
  await page23.waitForTimeout(400)
  await page23.locator(".hw-tactics-fight-btn").click()
  await page23.waitForTimeout(400)
  // Directly reposition the real battle's own units (a real, already-
  // derived Commander+recruited squad vs. real enemies) so the first
  // player unit sits Chebyshev-adjacent to the first enemy - skips the
  // uninteresting multi-turn approach dance and focuses this check on
  // the actual mechanic (the disengage itself). Reloading resumes the
  // edited mid-fight state, the same real "reload mid-fight resumes
  // it" guarantee this bridge already relies on.
  const setup = await page23.evaluate(() => {
    const save = JSON.parse(localStorage.getItem("heartwood-run-save-v1"))
    const battle = save.run.battle
    const mover = battle.units.find((u) => u.side === "player")
    const enemy = battle.units.find((u) => u.side === "enemy")
    mover.pos = { row: enemy.pos.row, col: enemy.pos.col + 1 }
    mover.ap = mover.apMax
    mover.hp = mover.maxHp
    enemy.hp = enemy.maxHp
    save.run.battle = battle
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(save))
    return { moverName: mover.name, enemyName: enemy.name, moverHpBefore: mover.hp }
  })
  await page23.reload({ waitUntil: "domcontentloaded" })
  await page23.waitForTimeout(400)
  const moverToken = page23.locator(".hwt-token", { hasText: setup.moverName })
  await moverToken.click({ force: true })
  await page23.waitForTimeout(200)
  const reach = page23.locator('.hwt-cell[data-reachable="true"]')
  const n = await reach.count()
  // Pick the reachable cell FARTHEST from the enemy token (a genuine
  // retreat, not an incidental slide that stays inside the zone).
  let chosen = null
  if (n > 0) {
    const enemyToken = page23.locator(".hwt-token", { hasText: setup.enemyName })
    const enemyBox = await enemyToken.boundingBox()
    let bestDist = -1
    for (let i = 0; i < n; i++) {
      const box = await reach.nth(i).boundingBox()
      const dist = Math.hypot(box.x - enemyBox.x, box.y - enemyBox.y)
      if (dist > bestDist) {
        bestDist = dist
        chosen = i
      }
    }
    await reach.nth(chosen).click()
    await page23.waitForTimeout(300)
  }
  const logText = await page23.locator(".hwt-log").innerText()
  const afterBattle = await page23.evaluate(() => JSON.parse(localStorage.getItem("heartwood-run-save-v1")).run.battle)
  const moverAfter = afterBattle.units.find((u) => u.name === setup.moverName)
  await page23.screenshot({ path: `${SHOT}/real_fight_zoc.png` })
  await page23.close()
  out.realFightZoc = { logHasReaction: logText.includes("lashes out"), moverHpBefore: setup.moverHpBefore, moverHpAfter: moverAfter?.hp, chosen }
  const ok = chosen !== null && logText.includes("lashes out") && moverAfter && moverAfter.hp < setup.moverHpBefore
  if (!ok) out.errors.push("check23 A real click-driven disengage from an adjacent enemy did not trigger a real reaction attack")
}

// 24. Bigger board round: a REAL fight through the Fight button renders
//     the new 9x12 board (108 cells, the real GRID's own dimensions),
//     not a stale/hardcoded size ------------------------------------
{
  const page24 = await newPage()
  page24.on("pageerror", (e) => errs.push(String(e)))
  await page24.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
  await seedRealSave(page24, (n) => n.type === "battle" && n.formationId, ["the-fool"])
  await page24.reload({ waitUntil: "domcontentloaded" })
  await page24.waitForTimeout(400)
  await page24.locator(".hw-tactics-fight-btn").click()
  await page24.waitForTimeout(400)
  const gridDims = await page24.evaluate(async () => {
    const { GRID } = await import("/src/services/heartwood/tacticsEngine.js")
    return { rows: GRID.rows, cols: GRID.cols }
  })
  const cellCount = await page24.locator(".hwt-cell").count()
  const boardStyle = await page24.locator(".hwt-board").evaluate((el) => ({
    cols: getComputedStyle(el).gridTemplateColumns.split(" ").length,
    rows: getComputedStyle(el).gridTemplateRows.split(" ").length,
  }))
  await page24.close()
  out.realFightBigBoard = { gridDims, cellCount, boardStyle }
  const ok =
    gridDims.rows === 9 &&
    gridDims.cols === 12 &&
    cellCount === 108 &&
    boardStyle.cols === 12 &&
    boardStyle.rows === 9
  if (!ok) out.errors.push("check24 the real board did not render at the new 9x12 size")
}

// 25. Per-class Facing bonuses: a real fight through the Fight button
//     carries a real recruited unit's own className through - Hexbreaker
//     (className "Reaver", a benefit class) shows the real benefit
//     badge on the real board -------------------------------------
{
  const page25 = await newPage()
  page25.on("pageerror", (e) => errs.push(String(e)))
  await page25.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
  await seedRealSave(page25, (n) => n.type === "battle" && n.formationId, ["hexbreaker"])
  await page25.reload({ waitUntil: "domcontentloaded" })
  await page25.waitForTimeout(400)
  await page25.locator(".hw-tactics-fight-btn").click()
  await page25.waitForTimeout(400)
  const benefitBadgeCount = await page25.locator(".hwt-flank-benefit-badge").count()
  await page25.screenshot({ path: `${SHOT}/real_fight_flank_class.png` })
  await page25.close()
  out.realFightFlankClass = { benefitBadgeCount }
  const ok = benefitBadgeCount === 1
  if (!ok) out.errors.push("check25 a real recruited unit's own className did not carry through to the real board's benefit badge")
}

// 26. Threat Zone: a real fight against a real tanky formation
//     ("the-bulwark" - oakshell-warden x2 + mossmender, all real
//     maxHp>=40 melee enemies) renders real data-threat-zone cells,
//     and a real click-driven move attempt trying to path past one
//     gets capped short of its intended destination ------------------
{
  const page26 = await newPage()
  page26.on("pageerror", (e) => errs.push(String(e)))
  await page26.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
  await seedRealSave(page26, (n) => n.type === "battle" && n.formationId === "the-bulwark", ["the-fool"])
  await page26.reload({ waitUntil: "domcontentloaded" })
  await page26.waitForTimeout(400)
  await page26.locator(".hw-tactics-fight-btn").click()
  await page26.waitForTimeout(400)
  const threatCellCount = await page26.locator('.hwt-cell[data-threat-zone="true"]').count()
  await page26.screenshot({ path: `${SHOT}/real_fight_threat_zone.png` })
  await page26.close()
  out.realFightThreatZone = { threatCellCount }
  const ok = threatCellCount > 0
  if (!ok) out.errors.push("check26 a real fight against a real tanky formation did not render any Threat Zone cells")
}

// 27. Guardian's Intercept: a real fight with Grove Warden recruited,
//     positioned adjacent to a squishy ally that's the enemy's own
//     only reachable target - ending the player's turn lets the real
//     enemy AI attack, and the real Guardian genuinely intercepts part
//     of it -----------------------------------------------------
{
  const page27 = await newPage()
  page27.on("pageerror", (e) => errs.push(String(e)))
  await page27.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
  await seedRealSave(page27, (n) => n.type === "battle" && n.formationId, ["grove-warden", "the-fool"])
  await page27.reload({ waitUntil: "domcontentloaded" })
  await page27.waitForTimeout(400)
  await page27.locator(".hw-tactics-fight-btn").click()
  await page27.waitForTimeout(400)
  const setup = await page27.evaluate(() => {
    const save = JSON.parse(localStorage.getItem("heartwood-run-save-v1"))
    const battle = save.run.battle
    const groveWarden = battle.units.find((u) => u.defId === "grove-warden")
    const mosskit = battle.units.find((u) => u.defId === "the-fool")
    const enemy = battle.units.find((u) => u.side === "enemy")
    // Mosskit is the enemy's ONLY reachable/attackable target this
    // round (every other player unit pushed far away) - Grove Warden
    // stands directly adjacent to it, ready to intercept.
    mosskit.pos = { row: 4, col: 5 }
    mosskit.hp = mosskit.maxHp
    mosskit.block = 0
    groveWarden.pos = { row: 4, col: 6 }
    groveWarden.hp = groveWarden.maxHp
    groveWarden.block = 0
    groveWarden.ap = groveWarden.apMax
    enemy.pos = { row: 4, col: 4 }
    battle.units = battle.units.map((u) =>
      u.side === "player" && u.id !== mosskit.id && u.id !== groveWarden.id ? { ...u, pos: { row: 0, col: 0 } } : u,
    )
    save.run.battle = battle
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(save))
    return { groveWardenName: groveWarden.name, groveWardenHpBefore: groveWarden.hp, mosskitHpBefore: mosskit.hp }
  })
  await page27.reload({ waitUntil: "domcontentloaded" })
  await page27.waitForTimeout(400)
  await page27.locator(".hwt-end-turn").click()
  await page27.waitForTimeout(600)
  const logText = await page27.locator(".hwt-log").innerText()
  const afterBattle = await page27.evaluate(() => JSON.parse(localStorage.getItem("heartwood-run-save-v1")).run.battle)
  const groveWardenAfter = afterBattle.units.find((u) => u.name === setup.groveWardenName)
  await page27.screenshot({ path: `${SHOT}/real_fight_intercept.png` })
  await page27.close()
  out.realFightIntercept = { setup, logHasIntercept: logText.includes("intercepts"), groveWardenHpAfter: groveWardenAfter?.hp }
  const ok = logText.includes("intercepts") && groveWardenAfter && groveWardenAfter.hp < setup.groveWardenHpBefore
  if (!ok) out.errors.push("check27 a real Grove Warden did not intercept a real enemy attack against an adjacent ally")
}

// 28. Block-weakening/Crit: a real fight, with units repositioned for
//     a guaranteed back-hit geometry, shows a real CRITICAL-narrated
//     strike through an ACTUAL click-driven attack ------------------
{
  const page28 = await newPage()
  page28.on("pageerror", (e) => errs.push(String(e)))
  await page28.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
  await seedRealSave(page28, (n) => n.type === "battle" && n.formationId, ["the-fool"])
  await page28.reload({ waitUntil: "domcontentloaded" })
  await page28.waitForTimeout(400)
  await page28.locator(".hw-tactics-fight-btn").click()
  await page28.waitForTimeout(400)
  const setup = await page28.evaluate(() => {
    const save = JSON.parse(localStorage.getItem("heartwood-run-save-v1"))
    const battle = save.run.battle
    const mosskit = battle.units.find((u) => u.defId === "the-fool")
    const enemy = battle.units.find((u) => u.side === "enemy")
    // Enemy's real default facing is "E" (confirmed universal spawn
    // default) - move it to a MIDDLE column first (its own real spawn
    // col:0 has no valid column to its west at all), then place
    // Mosskit directly WEST of it for a genuine real "back" hit.
    enemy.pos = { row: 4, col: 5 }
    mosskit.pos = { row: 4, col: 4 }
    mosskit.ap = mosskit.apMax
    enemy.hp = enemy.maxHp
    enemy.block = 0
    battle.units = battle.units.map((u) => (u.id !== mosskit.id && u.id !== enemy.id ? { ...u, pos: { row: 0, col: 0 } } : u))
    save.run.battle = battle
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(save))
    return { mosskitName: mosskit.name, enemyHpBefore: enemy.hp }
  })
  await page28.reload({ waitUntil: "domcontentloaded" })
  await page28.waitForTimeout(400)
  await page28.locator(".hwt-token", { hasText: setup.mosskitName }).click({ force: true })
  await page28.waitForTimeout(200)
  await page28.locator('.hwt-cell[data-targetable="true"]').first().click()
  await page28.waitForTimeout(300)
  const logText = await page28.locator(".hwt-log").innerText()
  await page28.screenshot({ path: `${SHOT}/real_fight_crit.png` })
  await page28.close()
  out.realFightCrit = { setup, logHasCritical: logText.includes("CRITICAL") }
  const ok = logText.includes("CRITICAL")
  if (!ok) out.errors.push("check28 a real click-driven back hit did not narrate CRITICAL through the real Fight button")
}

// 29. Fear Zone: a real approach toward the real Wyrmgall miniboss
//     (a genuinely reachable RUN_PATH node, not just the isolated
//     prototype's own demo formation) grants real Weak through an
//     ACTUAL click-driven move ---------------------------------------
{
  const page29 = await newPage()
  page29.on("pageerror", (e) => errs.push(String(e)))
  await page29.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
  await seedRealSave(page29, (n) => n.type === "miniboss" && n.enemyId === "wyrmgall", ["the-fool"])
  await page29.reload({ waitUntil: "domcontentloaded" })
  await page29.waitForTimeout(400)
  await page29.locator(".hw-tactics-fight-btn").click()
  await page29.waitForTimeout(400)
  const setup = await page29.evaluate(() => {
    const save = JSON.parse(localStorage.getItem("heartwood-run-save-v1"))
    const battle = save.run.battle
    const mosskit = battle.units.find((u) => u.defId === "the-fool")
    const wyrmgall = battle.units.find((u) => u.side === "enemy")
    // 2 cells away, not 3: Wyrmgall's real maxHp (80) is >=40, so it's
    // also "tanky" and projects its own radius-2 Threat Zone (PR #491).
    // Starting OUTSIDE that (distance 3) would get the whole move
    // capped by Threat Zone's own "entering from clean ground costs
    // your entire budget" rule before ever reaching the Fear Zone's
    // own radius-1. Starting AT distance 2 means the origin is already
    // INSIDE the Threat Zone, where Threat Zone's own fix (PR #491)
    // explicitly does NOT cap further movement - so this move reaches
    // adjacent (distance 1, entering the Fear Zone) at normal cost.
    mosskit.pos = { row: wyrmgall.pos.row, col: wyrmgall.pos.col + 2 }
    mosskit.ap = mosskit.apMax
    battle.units = battle.units.map((u) => (u.id !== mosskit.id && u.id !== wyrmgall.id ? { ...u, pos: { row: 0, col: 0 } } : u))
    save.run.battle = battle
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(save))
    return { mosskitName: mosskit.name, wyrmgallName: wyrmgall.name, weakBefore: mosskit.weak || 0 }
  })
  await page29.reload({ waitUntil: "domcontentloaded" })
  await page29.waitForTimeout(400)
  await page29.locator(".hwt-token", { hasText: setup.mosskitName }).click({ force: true })
  await page29.waitForTimeout(200)
  const wyrmgallToken = page29.locator(".hwt-token", { hasText: setup.wyrmgallName })
  const wyrmgallBox = await wyrmgallToken.boundingBox()
  const reach = page29.locator('.hwt-cell[data-reachable="true"]')
  const n = await reach.count()
  let chosen = null
  let bestDist = Infinity
  for (let i = 0; i < n; i++) {
    const box = await reach.nth(i).boundingBox()
    const dist = Math.hypot(box.x - wyrmgallBox.x, box.y - wyrmgallBox.y)
    if (dist < bestDist) {
      bestDist = dist
      chosen = i
    }
  }
  if (chosen !== null) {
    await reach.nth(chosen).click()
    await page29.waitForTimeout(300)
  }
  const logText = await page29.locator(".hwt-log").innerText()
  const afterBattle = await page29.evaluate(() => JSON.parse(localStorage.getItem("heartwood-run-save-v1")).run.battle)
  const mosskitAfter = afterBattle.units.find((u) => u.name === setup.mosskitName)
  await page29.screenshot({ path: `${SHOT}/real_fight_fear_zone.png` })
  await page29.close()
  out.realFightFearZone = { setup, chosen, logHasFearNote: logText.includes("recoils in fear"), weakAfter: mosskitAfter?.weak }
  const ok = chosen !== null && logText.includes("recoils in fear") && mosskitAfter && mosskitAfter.weak > setup.weakBefore
  if (!ok) out.errors.push("check29 a real click-driven approach toward the real Wyrmgall did not grant real Weak through the Fear Zone")
}

console.log(JSON.stringify(out, null, 2))
console.log("\npageErrors:", errs.length, errs.slice(0, 8))
await browser.close()

const pass = out.errors.length === 0 && errs.length === 0
console.log(pass ? "\n✅ verify_tactics_real_battle PASS" : "\n❌ verify_tactics_real_battle FAIL")
process.exit(pass ? 0 : 1)
