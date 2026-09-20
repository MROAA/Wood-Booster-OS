import { chromium } from "playwright"
const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto("http://localhost:5310/heartwood")
const result = await page.evaluate(async () => {
  const t = Date.now()
  const { UNITS } = await import("/src/data/heartwood/units.js?t=" + t)
  const roleCounts = {}
  const roleTribe = {}
  for (const u of Object.values(UNITS)) {
    roleCounts[u.role] = (roleCounts[u.role] || 0) + 1
    for (const tribe of u.tribes || []) {
      roleTribe[tribe] ||= {}
      roleTribe[tribe][u.role] = (roleTribe[tribe][u.role] || 0) + 1
    }
  }
  return { roleCounts, roleTribe }
})
console.log(JSON.stringify(result, null, 2))
await browser.close()
