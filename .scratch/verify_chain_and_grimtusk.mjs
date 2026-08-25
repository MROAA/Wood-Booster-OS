import { chromium } from "playwright"

const PORT = process.env.PORT || 5208

const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForTimeout(500)

const result = await page.evaluate(async () => {
  const { startAutoBattle, resolveRound } = await import("/src/services/heartwood/autoBattleEngine.js")
  const out = {}

  // 1. Chain fires on a killing blow, hitting a DIFFERENT living enemy.
  // Grimtusk vs 2 weak enemies: kill the frontmost with the first
  // attack, confirm the second enemy also takes damage in the SAME
  // action (the chain hit), not from its own turn (enemies haven't
  // acted yet this round - player side always resolves first).
  let state = startAutoBattle("tommy", ["grimtusk"], "rune-warden")
  state = {
    ...state,
    enemies: [
      { ...state.enemies[0], hp: 5, maxHp: 40, pos: { row: 0, col: 1 } },
      { ...state.enemies[0], id: "e1", hp: 40, maxHp: 40, pos: { row: 1, col: 1 } },
    ],
    playerUnits: state.playerUnits.map((u) => ({ ...u, moveIndex: 0, intent: { type: "attack", amount: 9 } })),
  }
  const afterRound = resolveRound(state)
  out.chain = {
    frontEnemyDead: afterRound.enemies[0].hp <= 0,
    secondEnemyDamaged: afterRound.enemies[1].hp < 40,
    secondEnemyHp: afterRound.enemies[1].hp,
    log: afterRound.log.filter((l) => l.includes("Grimtusk")),
  }

  // 2. No overkill chain when the attack DOESN'T kill - confirm Chain
  // only fires on an actual kill, not on every hit.
  let state2 = startAutoBattle("tommy", ["grimtusk"], "rune-warden")
  state2 = {
    ...state2,
    enemies: [
      { ...state2.enemies[0], hp: 40, maxHp: 40, pos: { row: 0, col: 1 } },
      { ...state2.enemies[0], id: "e1", hp: 40, maxHp: 40, pos: { row: 1, col: 1 } },
    ],
    playerUnits: state2.playerUnits.map((u) => ({ ...u, moveIndex: 0, intent: { type: "attack", amount: 9 } })),
  }
  const afterRound2 = resolveRound(state2)
  out.noChainWithoutKill = { secondEnemyUntouched: afterRound2.enemies[1].hp === 40 }

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("console/page errors:", errors)
await browser.close()

const chainOk = result.chain.frontEnemyDead && result.chain.secondEnemyDamaged
const noChainOk = result.noChainWithoutKill.secondEnemyUntouched

if (errors.length) {
  console.log("FAIL: console/page errors present")
  process.exit(1)
}
if (chainOk && noChainOk) {
  console.log("PASS: Chain fires only on a killing blow, hits a different living enemy, and doesn't fire on a non-lethal hit")
  process.exit(0)
} else {
  console.log("FAIL", { chainOk, noChainOk, result })
  process.exit(1)
}
