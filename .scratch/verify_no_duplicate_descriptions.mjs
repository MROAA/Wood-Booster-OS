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
  const { ENEMIES } = await import("/src/data/heartwood/enemies.js")
  const { FORMATIONS } = await import("/src/data/heartwood/formations.js")

  function findDupes(defs) {
    const seen = new Map()
    const dupes = []
    for (const d of Object.values(defs)) {
      if (!d.description) continue
      if (seen.has(d.description)) dupes.push([seen.get(d.description), d.id, d.description])
      else seen.set(d.description, d.id)
    }
    return dupes
  }

  return {
    itemDupes: findDupes(ITEMS),
    relicDupes: findDupes(RELICS),
    enemyDupes: findDupes(ENEMIES),
    formationDupes: findDupes(FORMATIONS),
  }
})

console.log(JSON.stringify(result, null, 2))
console.log("errors:", errors)
await browser.close()

const allDupes = [...result.itemDupes, ...result.relicDupes, ...result.enemyDupes, ...result.formationDupes]
if (allDupes.length === 0 && errors.length === 0) {
  console.log("PASS: no duplicate descriptions found, no console errors")
  process.exit(0)
} else {
  console.log(`FAIL: ${allDupes.length} duplicate(s), ${errors.length} error(s)`)
  process.exit(1)
}
