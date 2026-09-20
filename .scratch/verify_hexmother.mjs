import { chromium } from "playwright"

const PORT = process.env.PORT || 5216

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

  // Force Hexmother's queued move to the poison step (index 1), run a
  // round, confirm Poison applied; then advance to the weak step
  // (index 2), confirm Weak applied too - both debuffs stack onto the
  // same enemy across its 3-step cycle.
  let state = startAutoBattle("tommy", ["hexmother"], "rotwood-husk")
  state = { ...state, playerUnits: state.playerUnits.map((u) => ({ ...u, moveIndex: 1, intent: { type: "debuff", id: "poison", amount: 2, target: "target" } })) }
  const afterPoison = resolveRound(state)
  out.afterPoison = { poison: afterPoison.enemies[0].powers.poison || 0, weak: afterPoison.enemies[0].powers.weak || 0 }

  let state2 = { ...afterPoison, playerUnits: afterPoison.playerUnits.map((u) => ({ ...u, moveIndex: 2, intent: { type: "debuff", id: "weak", amount: 1, target: "target" } })) }
  const afterWeak = resolveRound(state2)
  out.afterWeak = { poison: afterWeak.enemies[0].powers.poison, weak: afterWeak.enemies[0].powers.weak }

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("console/page errors:", errors)
await browser.close()

// Poison ticks down by 1 each round it's carried (tickPoison), so
// after the 2nd round it should read 1 (started at 2, one tick
// elapsed in the round the weak step ran), and weak should now be 1.
const ok = result.afterPoison.poison === 2 && result.afterWeak.poison === 1 && result.afterWeak.weak === 1

if (errors.length) {
  console.log("FAIL: console/page errors present")
  process.exit(1)
}
if (ok) {
  console.log("PASS: Hexmother applies both Poison and Weak across its debuff cycle, stacking onto the same target")
  process.exit(0)
} else {
  console.log("FAIL", result)
  process.exit(1)
}
