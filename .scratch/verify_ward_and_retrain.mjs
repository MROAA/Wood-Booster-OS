import { chromium } from "playwright"

const PORT = process.env.PORT || 5209

const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForTimeout(500)

const result = await page.evaluate(async () => {
  const { startAutoBattle, resolveRound } = await import("/src/services/heartwood/autoBattleEngine.js")
  const { retrainCommander, RETRAIN_COST } = await import("/src/services/heartwood/runEngine.js")
  const out = {}

  // 1. Thornguard grants itself Ward 2 at battle start; the FIRST two
  // hits against it should be fully negated (no HP loss at all), the
  // THIRD hit (no wards left) should land for real damage.
  let state = startAutoBattle("tommy", ["thornguard"], "rotwood-husk")
  out.wardStart = state.playerUnits[0].powers.ward || 0
  const hpStart = state.playerUnits[0].hp
  // Force 3 rounds where the enemy always attacks (rotwood-husk's
  // pattern is attack/attack/block, so rounds 1-2 are real attacks).
  let s = state
  const hpHistory = [hpStart]
  for (let i = 0; i < 2; i++) {
    s = resolveRound(s)
    hpHistory.push(s.playerUnits[0].hp)
  }
  out.wardAbsorption = { hpHistory, wardsLeftAfter2Rounds: s.playerUnits[0].powers.ward || 0 }

  // 2. Aegis Ward relic grants Ward +1 to every deployed unit.
  const relicState = startAutoBattle("tommy", ["the-fool"], "rotwood-husk", ["aegis-ward"])
  out.relicWard = relicState.playerUnits[0].powers.ward || 0

  // 3. Ward absorbing a hit produces zero HP/Block change and a
  // distinct log line - confirm via a forced single-hit scenario.
  const { applyEffects } = await import("/src/services/heartwood/effects.js")
  let wardTestState = {
    round: 1, phase: "player", grid: { rows: 3, cols: 3 },
    playerUnits: [{ id: "p0", defId: "thornguard", name: "Thornguard", hp: 42, maxHp: 42, block: 0, powers: { ward: 1 }, triggers: [], pos: { row: 2, col: 0 }, moveIndex: 0, intent: null }],
    enemies: [{ id: "e0", defId: "rotwood-husk", name: "Husk", hp: 40, maxHp: 40, block: 0, powers: {}, triggers: [], pos: { row: 0, col: 0 }, moveIndex: 0, intent: null }],
    stats: {}, log: [],
  }
  wardTestState = applyEffects(wardTestState, [{ type: "damage", amount: 25 }], { actorId: "e0", targetId: "p0" })
  out.wardHitTest = {
    hpUnchanged: wardTestState.playerUnits[0].hp === 42,
    wardConsumed: (wardTestState.playerUnits[0].powers.ward || 0) === 0,
    log: wardTestState.log,
  }

  // 4. Retrain Commander swaps characterId, resets commanderRank, and
  // spends Essence; refuses to retrain into the SAME commander.
  const runState = { characterId: "tommy", essence: 10, commanderRank: 2 }
  const retrained = retrainCommander(runState, "aatos")
  const noOpSame = retrainCommander(runState, "tommy")
  const noOpBroke = retrainCommander({ ...runState, essence: 1 }, "aatos")
  out.retrain = {
    cost: RETRAIN_COST,
    newCharacterId: retrained.characterId,
    rankReset: retrained.commanderRank,
    essenceAfter: retrained.essence,
    sameCommanderNoOp: noOpSame.characterId === "tommy" && noOpSame.essence === 10,
    brokeNoOp: noOpBroke.characterId === "tommy",
  }

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("console/page errors:", errors)
await browser.close()

const wardStartOk = result.wardStart === 2
const absorptionOk =
  result.wardAbsorption.hpHistory[0] === result.wardAbsorption.hpHistory[1] &&
  result.wardAbsorption.hpHistory[1] === result.wardAbsorption.hpHistory[2] &&
  result.wardAbsorption.wardsLeftAfter2Rounds === 0
const relicOk = result.relicWard === 1
const hitTestOk = result.wardHitTest.hpUnchanged && result.wardHitTest.wardConsumed && result.wardHitTest.log.some((l) => l.includes("Ward"))
const retrainOk =
  result.retrain.newCharacterId === "aatos" &&
  result.retrain.rankReset === 0 &&
  result.retrain.essenceAfter === 10 - result.retrain.cost &&
  result.retrain.sameCommanderNoOp &&
  result.retrain.brokeNoOp

if (errors.length) {
  console.log("FAIL: console/page errors present")
  process.exit(1)
}
if (wardStartOk && absorptionOk && relicOk && hitTestOk && retrainOk) {
  console.log("PASS: Ward (unit+relic sources) fully negates hits and is consumed correctly; Retrain swaps Commander, resets rank, spends Essence, and refuses invalid calls")
  process.exit(0)
} else {
  console.log("FAIL", { wardStartOk, absorptionOk, relicOk, hitTestOk, retrainOk })
  process.exit(1)
}
