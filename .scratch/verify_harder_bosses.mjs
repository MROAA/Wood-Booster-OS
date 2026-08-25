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
  const { ENEMIES } = await import("/src/data/heartwood/enemies.js")
  const { FORMATIONS, resolveFormation } = await import("/src/data/heartwood/formations.js")
  const out = {}

  out.stats = {
    deepwarden: ENEMIES.deepwarden.maxHp,
    thornmaw: ENEMIES.thornmaw.maxHp,
    spacemonkey: ENEMIES.spacemonkey.maxHp,
  }
  out.hollowCourtExists = !!FORMATIONS["the-hollow-court"]
  out.hollowCourtPieces = resolveFormation("the-hollow-court").pieces.map((p) => p.defId)

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("errors:", errors)
await browser.close()

const checks = []
checks.push(["Deepwarden bumped to 84 HP", result.stats.deepwarden === 84])
checks.push(["Thornmaw bumped to 78 HP", result.stats.thornmaw === 78])
checks.push(["Spacemonkey bumped to 108 HP", result.stats.spacemonkey === 108])
checks.push(["The Hollow Court registered with 3 pieces", result.hollowCourtExists && result.hollowCourtPieces.length === 3])
checks.push(["no console/page errors", errors.length === 0])

let allPass = true
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`)
  if (!ok) allPass = false
}
process.exit(allPass ? 0 : 1)
