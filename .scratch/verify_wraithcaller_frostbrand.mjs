import { chromium } from "playwright"

const PORT = process.env.PORT || 5215

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

  // 1. Wraithcaller heals itself on a landed hit - pre-damage it, run
  // a round, confirm the exact "Wraithcaller heal N." log line rather
  // than net HP (net HP also reflects the enemy's own counter-attack
  // the same round, which can easily outweigh a modest +2 self-heal -
  // that's not a failure of the heal, just a different number).
  let state = startAutoBattle("tommy", ["wraithcaller"], "rotwood-husk")
  state = { ...state, playerUnits: state.playerUnits.map((u) => ({ ...u, hp: u.maxHp - 15 })) }
  const afterRound = resolveRound(state)
  const healLine = afterRound.log.find((l) => l.startsWith("Wraithcaller heal"))
  const healedAmount = healLine ? Number(healLine.match(/heal (\d+)/)?.[1]) : null
  out.wraithcaller = { healLine: !!healLine, healedAmount }

  // 2. Frostbrand relic applies Weak to whatever the squad hits.
  const relicState = startAutoBattle("tommy", ["the-fool"], "rotwood-husk", ["frostbrand"])
  const withAttackQueued = { ...relicState, playerUnits: relicState.playerUnits.map((u) => ({ ...u, moveIndex: 1, intent: { type: "attack", amount: 4 } })) }
  const afterAttack = resolveRound(withAttackQueued)
  out.frostbrand = { enemyWeak: afterAttack.enemies[0].powers.weak || 0 }

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("console/page errors:", errors)
await browser.close()

const wraithcallerOk = result.wraithcaller.healLine && result.wraithcaller.healedAmount === 2
const frostbrandOk = result.frostbrand.enemyWeak === 1

if (errors.length) {
  console.log("FAIL: console/page errors present")
  process.exit(1)
}
if (wraithcallerOk && frostbrandOk) {
  console.log("PASS: Wraithcaller heals itself on hit; Frostbrand applies Weak on hit")
  process.exit(0)
} else {
  console.log("FAIL", { wraithcallerOk, frostbrandOk, result })
  process.exit(1)
}
