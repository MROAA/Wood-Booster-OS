import { chromium } from "playwright"

const PORT = process.env.PORT || 5310

const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForTimeout(500)

const result = await page.evaluate(async () => {
  const { UNITS } = await import("/src/data/heartwood/units.js")
  const { ITEMS } = await import("/src/data/heartwood/items.js")
  const { RELICS } = await import("/src/data/heartwood/relics.js")

  function countBuffId(defs, extractEffects) {
    const counts = {}
    for (const def of Object.values(defs)) {
      const effects = extractEffects(def)
      const ids = new Set()
      function walk(list) {
        for (const e of list || []) {
          if (e.type === "applyBuff" && e.id) ids.add(e.id)
          if (e.effect) walk([e.effect])
        }
      }
      walk(effects)
      for (const id of ids) counts[id] = (counts[id] || 0) + 1
    }
    return counts
  }

  const unitCounts = countBuffId(Object.fromEntries(Object.entries(UNITS).filter(([, u]) => !u.fusedFrom)), (u) => u.passive || [])
  const itemCounts = countBuffId(ITEMS, (i) => i.effects || [])
  const relicCounts = countBuffId(RELICS, (r) => r.effects || [])

  const allIds = new Set([...Object.keys(unitCounts), ...Object.keys(itemCounts), ...Object.keys(relicCounts)])
  const table = {}
  for (const id of allIds) {
    table[id] = { units: unitCounts[id] || 0, items: itemCounts[id] || 0, relics: relicCounts[id] || 0 }
  }
  return table
})

console.log(JSON.stringify(result, null, 2))
await browser.close()
