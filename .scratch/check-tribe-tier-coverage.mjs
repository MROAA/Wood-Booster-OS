import { chromium } from "playwright"

const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto("http://localhost:5310")

const result = await page.evaluate(async () => {
  const unitsMod = await import("/src/data/heartwood/units.js?t=" + Date.now())
  const synergiesMod = await import("/src/data/heartwood/synergies.js?t=" + Date.now())
  const { UNITS } = unitsMod
  const { tribesOf, TRIBES } = synergiesMod

  const coverage = {}
  for (const tribe of Object.keys(TRIBES)) coverage[tribe] = { common: 0, uncommon: 0, rare: 0 }

  for (const u of Object.values(UNITS)) {
    if (u.fusedFrom || u.summonOnly) continue
    for (const t of tribesOf(u.id, u)) {
      if (coverage[t]) coverage[t][u.tier]++
    }
  }
  return coverage
})
console.log(JSON.stringify(result, null, 2))
await browser.close()
