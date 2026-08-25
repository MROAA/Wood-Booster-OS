import { chromium } from "playwright"

const PORT = process.env.PORT || 5221

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

  // 1. Mycelist's poison step (moveIndex 1) should spread poison to a
  // SECOND enemy too, not just the primary (frontmost) target.
  let state = startAutoBattle("tommy", ["mycelist"], "rune-warden")
  state = {
    ...state,
    enemies: [
      { ...state.enemies[0], hp: 40, maxHp: 40, pos: { row: 0, col: 1 } },
      { ...state.enemies[0], id: "e1", hp: 40, maxHp: 40, pos: { row: 1, col: 1 } },
    ],
    playerUnits: state.playerUnits.map((u) => ({ ...u, moveIndex: 1, intent: { type: "debuff", id: "poison", amount: 2, target: "target" } })),
  }
  const afterRound = resolveRound(state)
  out.mycelist = {
    primaryPoison: afterRound.enemies[0].powers.poison || 0,
    spreadPoison: afterRound.enemies[1].powers.poison || 0,
  }

  // 2. Confirm Spore Spread does NOT fire on a plain attack step (only
  // the poison-debuff step) - regular attacks shouldn't spread poison.
  let state2 = startAutoBattle("tommy", ["mycelist"], "rune-warden")
  state2 = {
    ...state2,
    enemies: [
      { ...state2.enemies[0], hp: 40, maxHp: 40, pos: { row: 0, col: 1 } },
      { ...state2.enemies[0], id: "e1", hp: 40, maxHp: 40, pos: { row: 1, col: 1 } },
    ],
    playerUnits: state2.playerUnits.map((u) => ({ ...u, moveIndex: 0, intent: { type: "attack", amount: 4 } })),
  }
  const afterAttackRound = resolveRound(state2)
  out.noSpreadOnAttack = { secondEnemyPoison: afterAttackRound.enemies[1].powers.poison || 0 }

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("console/page errors:", errors)
await browser.close()

const mycelistOk = result.mycelist.primaryPoison === 2 && result.mycelist.spreadPoison === 2
const noSpreadOk = result.noSpreadOnAttack.secondEnemyPoison === 0

if (errors.length) {
  console.log("FAIL: console/page errors present")
  process.exit(1)
}
if (mycelistOk && noSpreadOk) {
  console.log("PASS: Mycelist's poison step spreads to a second enemy, but a plain attack step doesn't spread anything")
  process.exit(0)
} else {
  console.log("FAIL", { mycelistOk, noSpreadOk, result })
  process.exit(1)
}
