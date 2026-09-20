import { chromium } from "playwright"

const PORT = process.env.PORT || 5197

const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text())
})

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForTimeout(500)

const result = await page.evaluate(async () => {
  const { startAutoBattle, resolveRound } = await import("/src/services/heartwood/autoBattleEngine.js")

  // Real end-to-end drive through the public API: 3 real units vs
  // rotwood-husk (single-target attacker, high HP so the fight runs
  // many rounds). Manually stamp powers.taunt=1 onto the middle unit
  // right after battle start (same shape setUnit would produce, just
  // done inline since setUnit isn't exported) and confirm the enemy's
  // single-target attacks land on ONLY that unit across every round -
  // proving randomLiving's taunt-priority branch actually drives real
  // combat, not just a synthetic call.
  let state = startAutoBattle("tommy", ["the-fool", "the-fool", "the-fool"], "rotwood-husk")
  state = {
    ...state,
    playerUnits: state.playerUnits.map((u, i) => (i === 1 ? { ...u, powers: { ...u.powers, taunt: 1 } } : u)),
  }

  const hpHistory = []
  for (let i = 0; i < 15 && state.phase === "player"; i++) {
    state = resolveRound(state)
    hpHistory.push(state.playerUnits.map((u) => u.hp))
  }

  return { hpHistory, finalPhase: state.phase, log: state.log.slice(-5) }
})

console.log(JSON.stringify(result, null, 2))
console.log("console/page errors:", errors)

await browser.close()

const p0Full = result.hpHistory.every((row) => row[0] === result.hpHistory[0][0])
const p2Full = result.hpHistory.every((row) => row[2] === result.hpHistory[0][2])
const p1Dropped = result.hpHistory[result.hpHistory.length - 1][1] < result.hpHistory[0][1]

if (errors.length) {
  console.log("FAIL: console/page errors present")
  process.exit(1)
}
if (p0Full && p2Full && p1Dropped) {
  console.log("PASS: only the taunting unit ever took damage across the whole fight")
  process.exit(0)
} else {
  console.log("FAIL: taunt did not fully redirect enemy targeting", { p0Full, p2Full, p1Dropped })
  process.exit(1)
}
