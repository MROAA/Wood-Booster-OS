import { chromium } from "playwright"

const PORT = process.env.PORT || 5218

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

  // 1. Thornwarden's WoundedFury only pays off below 50% HP - compare
  // a full-HP hit vs a below-half-HP hit, same base attack.
  const healthyState = startAutoBattle("tommy", ["thornwarden"], "rotwood-husk")
  const woundedState = { ...healthyState, playerUnits: healthyState.playerUnits.map((u) => ({ ...u, hp: Math.round(u.maxHp * 0.4) })) }
  const withAttackQueued = (s) => ({ ...s, playerUnits: s.playerUnits.map((u) => ({ ...u, moveIndex: 0, intent: { type: "attack", amount: 6 } })) })
  const healthyResult = resolveRound(withAttackQueued(healthyState))
  const woundedResult = resolveRound(withAttackQueued(woundedState))
  const healthyDmg = Number(healthyResult.log.find((l) => l.startsWith("Thornwarden deal"))?.match(/deal (\d+)/)?.[1])
  const woundedDmg = Number(woundedResult.log.find((l) => l.startsWith("Thornwarden deal"))?.match(/deal (\d+)/)?.[1])
  out.thornwarden = { healthyDmg, woundedDmg, bonus: woundedDmg - healthyDmg }

  // 2. Bloomcaller grants Execute to adjacent allies, not itself.
  const bcState = startAutoBattle("tommy", ["bloomcaller", "the-fool", "the-fool", "the-fool"], "rotwood-husk")
  out.bloomcaller = Object.fromEntries(bcState.playerUnits.map((u) => [u.id, u.powers.execute || 0]))

  // 3. Mosswalker grants itself Ward 2 - the first two real hits
  // against it should be fully negated.
  const mwState = startAutoBattle("tommy", ["mosswalker"], "rotwood-husk")
  out.mosswalkerStart = mwState.playerUnits[0].powers.ward || 0
  const hpStart = mwState.playerUnits[0].hp
  let s = mwState
  const hpHistory = [hpStart]
  for (let i = 0; i < 2; i++) {
    s = resolveRound(s)
    hpHistory.push(s.playerUnits[0].hp)
  }
  out.mosswalker = { hpHistory, wardLeft: s.playerUnits[0].powers.ward || 0 }

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("console/page errors:", errors)
await browser.close()

const thornwardenOk = result.thornwarden.bonus === 3 // WoundedFury bonus is +3 per effects.js
const byPos = result.bloomcaller
const bloomcallerOk = byPos.p0 === 0 && byPos.p1 === 2 && byPos.p2 === 0 && byPos.p3 === 2
const mosswalkerOk =
  result.mosswalkerStart === 2 &&
  result.mosswalker.hpHistory[0] === result.mosswalker.hpHistory[1] &&
  result.mosswalker.hpHistory[1] === result.mosswalker.hpHistory[2] &&
  result.mosswalker.wardLeft === 0

if (errors.length) {
  console.log("FAIL: console/page errors present")
  process.exit(1)
}
if (thornwardenOk && bloomcallerOk && mosswalkerOk) {
  console.log("PASS: Thornwarden's WoundedFury only pays off below 50% HP; Bloomcaller's Execute aura reaches only adjacent allies; Mosswalker's Ward fully absorbs 2 hits")
  process.exit(0)
} else {
  console.log("FAIL", { thornwardenOk, bloomcallerOk, mosswalkerOk, result })
  process.exit(1)
}
