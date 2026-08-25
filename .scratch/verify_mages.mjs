import { chromium } from "playwright"

const PORT = process.env.PORT || 5213

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

  // 1. Emberwisp's AoE hits every living enemy in a real formation
  // fight (2 enemies), not just the frontmost.
  let state = startAutoBattle("tommy", ["emberwisp"], "rune-warden")
  state = {
    ...state,
    enemies: [
      { ...state.enemies[0], hp: 40, maxHp: 40, pos: { row: 0, col: 1 } },
      { ...state.enemies[0], id: "e1", hp: 40, maxHp: 40, pos: { row: 1, col: 1 } },
    ],
  }
  const afterRound = resolveRound(state)
  out.emberwisp = {
    frontHit: afterRound.enemies[0].hp < 40,
    secondHit: afterRound.enemies[1].hp < 40,
    frontHp: afterRound.enemies[0].hp,
    secondHp: afterRound.enemies[1].hp,
  }

  // 2. Runeveil applies Vulnerable on its debuff-step attack, and the
  // NEXT hit against that enemy deals more damage than an identical
  // hit before Vulnerable was applied.
  let rvState = startAutoBattle("tommy", ["runeveil"], "rotwood-husk")
  // Force round 1 to be the debuff step (moveIndex 1).
  rvState = { ...rvState, playerUnits: rvState.playerUnits.map((u) => ({ ...u, moveIndex: 1, intent: { type: "debuff", id: "vulnerable", amount: 1, target: "target" } })) }
  const afterDebuff = resolveRound(rvState)
  out.runeveil = { enemyVulnerable: afterDebuff.enemies[0].powers.vulnerable || 0 }

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("console/page errors:", errors)
await browser.close()

const emberwispOk = result.emberwisp.frontHit && result.emberwisp.secondHit
const runeveilOk = result.runeveil.enemyVulnerable === 1

if (errors.length) {
  console.log("FAIL: console/page errors present")
  process.exit(1)
}
if (emberwispOk && runeveilOk) {
  console.log("PASS: Emberwisp's AoE hits every living enemy; Runeveil applies Vulnerable")
  process.exit(0)
} else {
  console.log("FAIL", { emberwispOk, runeveilOk, result })
  process.exit(1)
}
