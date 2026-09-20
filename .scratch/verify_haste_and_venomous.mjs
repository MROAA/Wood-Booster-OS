import { chromium } from "playwright"

const PORT = process.env.PORT || 5211

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

  function loggedDamageLines(state, attackerName) {
    return state.log.filter((l) => l.startsWith(`${attackerName} deal`))
  }

  // 1. Haste attacks twice against a single high-HP enemy in ONE round
  // - confirm exactly 2 "Swiftclaw deal" log lines from a single
  // round's action, not 1.
  let state = startAutoBattle("tommy", ["swiftclaw"], "rotwood-husk")
  state = { ...state, enemies: state.enemies.map((e) => ({ ...e, hp: 999, maxHp: 999 })) }
  const afterRound = resolveRound(state)
  out.haste = { hitCount: loggedDamageLines(afterRound, "Swiftclaw").length }

  // 2. Haste retargets on kill: first hit kills the frontmost enemy,
  // second hit should land on a DIFFERENT (surviving) enemy instead of
  // being wasted on the corpse.
  let state2 = startAutoBattle("tommy", ["swiftclaw"], "rune-warden")
  state2 = {
    ...state2,
    enemies: [
      { ...state2.enemies[0], hp: 3, maxHp: 40, pos: { row: 0, col: 1 } },
      { ...state2.enemies[0], id: "e1", hp: 40, maxHp: 40, pos: { row: 1, col: 1 } },
    ],
  }
  const afterRound2 = resolveRound(state2)
  out.hasteRetarget = {
    frontDead: afterRound2.enemies[0].hp <= 0,
    secondDamaged: afterRound2.enemies[1].hp < 40,
  }

  // 3. Venomous Edge relic applies Poison on hit.
  const relicState = startAutoBattle("tommy", ["the-fool"], "rotwood-husk", ["venomous-edge"])
  const withAttackQueued = { ...relicState, playerUnits: relicState.playerUnits.map((u) => ({ ...u, moveIndex: 1, intent: { type: "attack", amount: 4 } })) }
  const afterAttack = resolveRound(withAttackQueued)
  out.venomousEdge = { enemyPoison: afterAttack.enemies[0].powers.poison || 0 }

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("console/page errors:", errors)
await browser.close()

const hasteOk = result.haste.hitCount === 2
const retargetOk = result.hasteRetarget.frontDead && result.hasteRetarget.secondDamaged
const venomousOk = result.venomousEdge.enemyPoison === 2

if (errors.length) {
  console.log("FAIL: console/page errors present")
  process.exit(1)
}
if (hasteOk && retargetOk && venomousOk) {
  console.log("PASS: Haste attacks exactly twice per round and retargets past a kill; Venomous Edge applies Poison on hit")
  process.exit(0)
} else {
  console.log("FAIL", { hasteOk, retargetOk, venomousOk, result })
  process.exit(1)
}
