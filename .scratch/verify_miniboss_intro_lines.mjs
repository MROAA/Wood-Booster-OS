import { chromium } from "playwright"

const PORT = process.env.PORT || 5311

const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForTimeout(500)

const result = await page.evaluate(async () => {
  const { ENEMIES } = await import("/src/data/heartwood/enemies.js")
  const out = {}

  const named = ["deepwarden", "thornmaw", "wyrmgall", "spacemonkey"]
  out.introLines = {}
  for (const id of named) {
    const def = ENEMIES[id]
    out.introLines[id] = {
      hasIntroLine: typeof def.introLine === "string" && def.introLine.length > 0,
      differsFromDescription: def.introLine !== def.description,
    }
  }

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("errors:", errors)
await browser.close()

const checks = []
for (const [id, info] of Object.entries(result.introLines)) {
  checks.push([`${id} has a distinct introLine`, info.hasIntroLine && info.differsFromDescription])
}
checks.push(["no console/page errors", errors.length === 0])

let allPass = true
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`)
  if (!ok) allPass = false
}
process.exit(allPass ? 0 : 1)
