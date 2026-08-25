import { chromium } from "playwright"

const PORT = process.env.PORT || 5201

const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForTimeout(500)

const result = await page.evaluate(async () => {
  const { resolveRound, startAutoBattle } = await import("/src/services/heartwood/autoBattleEngine.js")

  // Build a synthetic in-progress state directly (bypassing
  // startAutoBattle's normal fight-vs-spacemonkey setup) so the very
  // first enemy action is forced to be the AoE move, regardless of
  // weightedRandom's roll - deterministic, no flakiness. 3 player
  // units, one carrying Taunt, vs one enemy unit whose queued intent
  // is already "aoe". Confirms AoE hits ALL of them despite the
  // taunter - the actual point of the mechanic.
  let state = startAutoBattle(
    "tommy",
    ["the-fool", "the-fool", "the-fool"],
    "rotwood-husk", // placeholder formation, immediately overridden below
  )
  state = {
    ...state,
    playerUnits: state.playerUnits.map((u, i) => (i === 1 ? { ...u, powers: { ...u.powers, taunt: 1 } } : u)),
    enemies: state.enemies.map((e) => ({
      ...e,
      hp: 999,
      maxHp: 999,
      intent: { type: "aoe", amount: 5 },
    })),
  }

  const hpBefore = state.playerUnits.map((u) => u.hp)
  const next = resolveRound(state)
  const hpAfter = next.playerUnits.map((u) => u.hp)

  return { hpBefore, hpAfter, log: next.log.slice(-6) }
})

console.log(JSON.stringify(result, null, 2))
console.log("console/page errors:", errors)
await browser.close()

const allHit = result.hpBefore.every((hp, i) => result.hpAfter[i] < hp)

if (errors.length) {
  console.log("FAIL: console/page errors present")
  process.exit(1)
}
if (allHit) {
  console.log("PASS: AoE hit every player unit, including the taunting one - Taunt does not block AoE")
  process.exit(0)
} else {
  console.log("FAIL: not every unit took AoE damage", { hpBefore: result.hpBefore, hpAfter: result.hpAfter })
  process.exit(1)
}
