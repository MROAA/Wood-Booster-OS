import { chromium } from "playwright"

const PORT = process.env.PORT || 5198

const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForTimeout(500)

const result = await page.evaluate(async () => {
  const { startAutoBattle, resolveRound } = await import("/src/services/heartwood/autoBattleEngine.js")

  // Real content check: Stoneheart deployed alongside two other units
  // vs. Rotwood Husk (single-target attacker). Confirm Stoneheart's own
  // battle-start passive actually grants powers.taunt, and that this
  // real content grant (not a manually-stamped synthetic one) fully
  // redirects the enemy's attacks the same way the earlier synthetic
  // engine test proved the targeting logic itself does.
  let state = startAutoBattle("tommy", ["the-fool", "stoneheart", "the-fool"], "rotwood-husk")
  const stoneheart = state.playerUnits.find((u) => u.defId === "stoneheart")
  const tauntAtStart = stoneheart?.powers?.taunt || 0

  const hpHistory = []
  for (let i = 0; i < 15 && state.phase === "player"; i++) {
    state = resolveRound(state)
    hpHistory.push(state.playerUnits.map((u) => ({ defId: u.defId, hp: u.hp })))
  }

  return { tauntAtStart, hpHistory, finalPhase: state.phase }
})

console.log(JSON.stringify(result, null, 2))
console.log("console/page errors:", errors)
await browser.close()

const others = result.hpHistory.every((row) =>
  row.filter((u) => u.defId !== "stoneheart").every((u, idx) => u.hp === result.hpHistory[0].filter((x) => x.defId !== "stoneheart")[idx].hp),
)
const stoneheartRow = result.hpHistory.map((row) => row.find((u) => u.defId === "stoneheart").hp)
const stoneheartTookDamage = stoneheartRow[stoneheartRow.length - 1] < stoneheartRow[0]

if (errors.length) {
  console.log("FAIL: console/page errors present")
  process.exit(1)
}
if (result.tauntAtStart === 1 && others && stoneheartTookDamage) {
  console.log("PASS: Stoneheart's passive grants Taunt and it draws all enemy attacks in a real fight")
  process.exit(0)
} else {
  console.log("FAIL", { tauntAtStart: result.tauntAtStart, others, stoneheartTookDamage })
  process.exit(1)
}
