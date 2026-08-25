import { chromium } from "playwright"

const PORT = process.env.PORT || 5310
const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForTimeout(500)

const result = await page.evaluate(async () => {
  const engine = await import("/src/services/heartwood/runEngine.js")
  const { startRun, leaveShop, chooseFloorEncounter, chooseRelic, resolveBattleOutcome, RUN_PATH, difficultyTierForNode, serializeRun, deserializeRun } = engine
  const out = {}

  let state = startRun("tommy")
  out.initialPathLength = state.path.length
  out.initialBattlePoolLength = state.battlePool.length
  out.initialNodeIndex = state.nodeIndex
  out.battleSlotCountInRunPath = RUN_PATH.filter((n) => n.type === "battle").length

  // Difficulty tier at node 0 with the FIXED RUN_PATH.length (not
  // path.length, which is now dynamic) should be the lowest tier.
  out.tier0 = difficultyTierForNode(0, RUN_PATH.length).name
  // Near the end should be a late tier.
  out.tierLate = difficultyTierForNode(RUN_PATH.length - 2, RUN_PATH.length).name

  // Walk forward from the shop into the first battle-type position -
  // RUN_PATH[1] is a battle, so this should land on "choice" (pool has
  // way more than 1 entry left).
  state = leaveShop(state)
  out.phaseAfterFirstLeaveShop = state.phase
  out.floorChoicesCount = (state.floorChoices || []).length
  out.nodeIndexUnchangedDuringChoice = state.nodeIndex === 0
  out.pathLengthUnchangedDuringChoice = state.path.length === 1

  const optionsSeen = state.floorChoices.map((n) => n.enemyId || n.formationId)
  const poolBeforeChoiceOffered = out.initialBattlePoolLength // 51, before the 2-way split

  // Pick option 0.
  state = chooseFloorEncounter(state, 0)
  out.phaseAfterChoice = state.phase
  out.nodeIndexAfterChoice = state.nodeIndex
  out.pathLengthAfterChoice = state.path.length
  out.pathLengthEqualsNodeIndexPlus1 = state.path.length === state.nodeIndex + 1
  out.chosenNodeMatchesOption0 = (state.path[state.path.length - 1].enemyId || state.path[state.path.length - 1].formationId) === optionsSeen[0]
  // The unpicked option should have returned to the front of the pool,
  // so pool length should be poolBefore - 1 (one consumed via the pick,
  // the other returned).
  out.poolLengthAfterChoice = state.battlePool.length
  out.poolShrankByExactlyOne = state.battlePool.length === poolBeforeChoiceOffered - 1

  // Full-run walk: keep resolving forward (skip battle entirely by
  // directly popping to victory/defeat via simulated wins) until the
  // run ends, verifying invariants hold at every step and every
  // RUN_PATH battle gets scheduled exactly once across the run.
  let steps = 0
  const seenBattleContent = []
  let s2 = startRun("tommy")
  while (s2.phase !== "victory" && s2.phase !== "defeat" && steps < 300) {
    steps++
    if (s2.phase === "shop") {
      s2 = leaveShop(s2)
    } else if (s2.phase === "relic") {
      s2 = chooseRelic(s2, null)
    } else if (s2.phase === "choice") {
      // Don't record here - the picked option gets recorded once,
      // below, when it actually becomes the resolved path node.
      // Recording it here TOO would double-count every "battle"
      // position (this branch never fires for miniboss/boss/shop/
      // relic, which resolve straight past "choice").
      s2 = chooseFloorEncounter(s2, 0)
    } else if (s2.phase === "formation") {
      // Simulate an instant win without touching autoBattleEngine at
      // all - resolveBattleOutcome only reads battle.phase, so a
      // synthetic won battle is enough to walk forward.
      const node = s2.path[s2.nodeIndex]
      if (node.type !== "shop" && node.type !== "relic") seenBattleContent.push(node.enemyId || node.formationId)
      s2 = { ...s2, battle: { phase: "won" } }
      s2 = resolveBattleOutcome(s2)
    } else {
      break
    }
    if (!Array.isArray(s2.path) || s2.path.length !== s2.nodeIndex + 1) {
      out.invariantBrokenAtStep = steps
      break
    }
  }
  out.stepsToEnd = steps
  out.finalPhase = s2.phase
  out.uniqueBattlesSeen = new Set(seenBattleContent).size
  out.totalBattlesSeen = seenBattleContent.length
  out.expectedBattleCount = RUN_PATH.filter((n) => n.type !== "shop" && n.type !== "relic").length

  // Persistence round-trip.
  const saved = serializeRun(s2)
  const restored = deserializeRun(saved)
  out.persistRoundTripOk = !!restored && restored.nodeIndex === s2.nodeIndex && restored.path.length === s2.path.length

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("errors:", errors)
await browser.close()

const checks = []
checks.push(["battlePool starts with every RUN_PATH battle-type entry", result.initialBattlePoolLength === result.battleSlotCountInRunPath])
checks.push(["path starts at length 1", result.initialPathLength === 1])
checks.push(["tier0 is The Outer Grove", result.tier0 === "The Outer Grove"])
checks.push(["tierLate is The Reckoning", result.tierLate === "The Reckoning"])
checks.push(["first leaveShop lands on choice phase", result.phaseAfterFirstLeaveShop === "choice"])
checks.push(["choice offers exactly 2 options", result.floorChoicesCount === 2])
checks.push(["nodeIndex unchanged while choice pending", result.nodeIndexUnchangedDuringChoice])
checks.push(["path unchanged while choice pending", result.pathLengthUnchangedDuringChoice])
checks.push(["phase resolves to formation after choosing", result.phaseAfterChoice === "formation"])
checks.push(["path.length === nodeIndex + 1 after choosing", result.pathLengthEqualsNodeIndexPlus1])
checks.push(["chosen node matches picked option", result.chosenNodeMatchesOption0])
checks.push(["pool shrinks by exactly 1 net (one consumed, one returned)", result.poolShrankByExactlyOne])
checks.push(["full run reaches victory or defeat", result.finalPhase === "victory" || result.finalPhase === "defeat"])
checks.push(["invariant never broke mid-run", result.invariantBrokenAtStep === undefined])
checks.push(["every RUN_PATH battle/miniboss/boss fought exactly once", result.uniqueBattlesSeen === result.expectedBattleCount && result.totalBattlesSeen === result.expectedBattleCount])
checks.push(["serialize/deserialize round-trip preserves position", result.persistRoundTripOk])
checks.push(["no console/page errors", errors.length === 0])

let allPass = true
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`)
  if (!ok) allPass = false
}
process.exit(allPass ? 0 : 1)
