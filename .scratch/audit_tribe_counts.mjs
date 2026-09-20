import { chromium } from "playwright"

const PORT = process.env.PORT || 5310

const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForTimeout(500)

const result = await page.evaluate(async () => {
  const { UNIT_TRIBES, TRIBES } = await import("/src/data/heartwood/synergies.js")
  const { UNITS } = await import("/src/data/heartwood/units.js")

  const counts = {}
  for (const [uid, tribes] of Object.entries(UNIT_TRIBES)) {
    if (UNITS[uid]?.fusedFrom) continue
    for (const t of tribes) counts[t] = (counts[t] || 0) + 1
  }
  return { counts, tribeNames: Object.keys(TRIBES) }
})

console.log(JSON.stringify(result, null, 2))
await browser.close()
