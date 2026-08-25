import { chromium } from "playwright"

const PORT = process.env.PORT || 5301

const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForTimeout(500)

const result = await page.evaluate(async () => {
  const { startAutoBattle } = await import("/src/services/heartwood/autoBattleEngine.js")
  const { UNITS } = await import("/src/data/heartwood/units.js")
  const { ENEMIES } = await import("/src/data/heartwood/enemies.js")
  const out = {}

  out.registered = { mosshollow: !!UNITS.mosshollow, gravemaw: !!ENEMIES.gravemaw }

  // Gravemaw carries its own Wounded Fury passive at battle start.
  let battle = startAutoBattle("tommy", [{ defId: "mosshollow" }], "gravemaw")
  const gravemaw = battle.enemies.find((e) => e.defId === "gravemaw")
  out.gravemawWoundedFury = gravemaw?.powers.woundedFury

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("errors:", errors)
await browser.close()

const checks = []
checks.push(["units/enemies registered", result.registered.mosshollow && result.registered.gravemaw])
checks.push(["Gravemaw carries a self-WoundedFury passive", result.gravemawWoundedFury === 1])
checks.push(["no console/page errors", errors.length === 0])

let allPass = true
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`)
  if (!ok) allPass = false
}
process.exit(allPass ? 0 : 1)
