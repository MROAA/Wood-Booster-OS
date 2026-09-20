import { chromium } from "playwright"

const PORT = process.env.PORT || 5310

const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForTimeout(500)

const result = await page.evaluate(async () => {
  const { UNITS } = await import("/src/data/heartwood/units.js")
  const { ENEMIES } = await import("/src/data/heartwood/enemies.js")
  const { ITEMS } = await import("/src/data/heartwood/items.js")
  const { RELICS, RELIC_REROLL_COST } = await import("/src/data/heartwood/relics.js")

  const problems = []
  const RELIC_COST = 3

  for (const [id, u] of Object.entries(UNITS)) {
    if (!(u.maxHp > 0)) problems.push(`unit "${id}": maxHp is ${u.maxHp}`)
    if (u.recruitCost != null && !(u.recruitCost > 0)) problems.push(`unit "${id}": recruitCost is ${u.recruitCost}`)
    if (u.movePattern) {
      for (const move of u.movePattern) {
        if (move.amount != null && move.amount < 0) problems.push(`unit "${id}" movePattern has negative amount: ${JSON.stringify(move)}`)
      }
    }
  }

  for (const [id, e] of Object.entries(ENEMIES)) {
    if (!(e.maxHp > 0)) problems.push(`enemy "${id}": maxHp is ${e.maxHp}`)
    for (const move of e.movePattern || []) {
      if (move.amount != null && move.amount < 0) problems.push(`enemy "${id}" movePattern has negative amount: ${JSON.stringify(move)}`)
    }
  }

  for (const [id, i] of Object.entries(ITEMS)) {
    if (!(i.cost > 0)) problems.push(`item "${id}": cost is ${i.cost}`)
  }

  for (const [id, r] of Object.entries(RELICS)) {
    if (r.cost !== RELIC_COST) problems.push(`relic "${id}": cost is ${r.cost}, expected uniform ${RELIC_COST}`)
  }

  return { problems, unitCount: Object.keys(UNITS).length, enemyCount: Object.keys(ENEMIES).length }
})

console.log(JSON.stringify(result, null, 2))
console.log("errors:", errors)
await browser.close()

if (result.problems.length === 0 && errors.length === 0) {
  console.log("PASS: no numeric sanity problems found")
  process.exit(0)
} else {
  console.log(`FAIL: ${result.problems.length} problem(s)`)
  process.exit(1)
}
