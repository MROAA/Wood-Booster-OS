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
  const { ITEMS } = await import("/src/data/heartwood/items.js")
  const { RELICS } = await import("/src/data/heartwood/relics.js")

  function walkEffects(effects, path, problems) {
    for (const [i, e] of (effects || []).entries()) {
      if (e.amount != null && e.amount <= 0) problems.push(`${path}[${i}]: non-positive amount (${e.amount}) in ${JSON.stringify(e)}`)
      if (e.effect) walkEffects([e.effect], `${path}[${i}].effect`, problems)
    }
  }

  const problems = []
  for (const [id, def] of Object.entries(ITEMS)) walkEffects(def.effects, `item "${id}"`, problems)
  for (const [id, def] of Object.entries(RELICS)) walkEffects(def.effects, `relic "${id}"`, problems)

  return problems
})

console.log(JSON.stringify(result, null, 2))
console.log("errors:", errors)
await browser.close()

if (result.length === 0 && errors.length === 0) {
  console.log("PASS: no non-positive effect amounts found in items/relics")
  process.exit(0)
} else {
  console.log(`FAIL: ${result.length} problem(s)`)
  process.exit(1)
}
