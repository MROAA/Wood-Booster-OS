import { chromium } from "playwright"

const PORT = process.env.PORT || 5199

const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForTimeout(500)

const result = await page.evaluate(async () => {
  const { startAutoBattle } = await import("/src/services/heartwood/autoBattleEngine.js")
  const { commanderRankCost, COMMANDER_RANK_MAX } = await import("/src/data/heartwood/characters.js")

  const out = { costs: [0, 1, 2].map((r) => commanderRankCost(r)), max: COMMANDER_RANK_MAX }

  // Tommy's squadPassive is a flat +2 Strength applyBuff to every unit.
  // Compare a rank-0 vs rank-2 battle start and confirm the resulting
  // Strength stack on a deployed unit is higher at rank 2 - the actual
  // in-battle effect of Rank-Up, not just the cost table.
  const rank0 = startAutoBattle("tommy", ["the-fool"], "rotwood-husk", [], 0)
  const rank2 = startAutoBattle("tommy", ["the-fool"], "rotwood-husk", [], 2)
  out.strengthAtRank0 = rank0.playerUnits[0].powers.strength || 0
  out.strengthAtRank2 = rank2.playerUnits[0].powers.strength || 0

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("console/page errors:", errors)
await browser.close()

const costsOk = result.costs[0] === 3 && result.costs[1] === 6 && result.costs[2] === null
const scalesOk = result.strengthAtRank2 > result.strengthAtRank0

if (errors.length) {
  console.log("FAIL: console/page errors present")
  process.exit(1)
}
if (costsOk && scalesOk) {
  console.log("PASS: Commander Rank-Up cost curve and in-battle scaling both correct")
  process.exit(0)
} else {
  console.log("FAIL", { costsOk, scalesOk })
  process.exit(1)
}
