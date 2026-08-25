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
  const { startAutoBattle, resolveRound } = await import("/src/services/heartwood/autoBattleEngine.js")
  const { UNITS } = await import("/src/data/heartwood/units.js")
  const { ENEMIES } = await import("/src/data/heartwood/enemies.js")
  const out = {}

  out.registered = { thornwisp: !!UNITS.thornwisp, ironmaw: !!ENEMIES.ironmaw }

  // Ironmaw carries its own Strength passive at battle start.
  let battle = startAutoBattle("tommy", [], "ironmaw")
  const ironmaw = battle.enemies.find((e) => e.defId === "ironmaw")
  out.ironmawStrength = ironmaw?.powers.strength

  // Thornwisp's first move (sunder) actually strips that Strength off
  // the enemy on round 1.
  battle = startAutoBattle("tommy", [{ defId: "thornwisp" }], "ironmaw")
  const before = battle.enemies.find((e) => e.defId === "ironmaw").powers.strength
  battle = resolveRound(battle)
  const after = battle.enemies.find((e) => e.defId === "ironmaw")?.powers.strength
  out.sunder = { before, after }

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("errors:", errors)
await browser.close()

const checks = []
checks.push(["units/enemies registered", result.registered.thornwisp && result.registered.ironmaw])
checks.push(["Ironmaw carries a self-Strength passive", result.ironmawStrength === 3])
checks.push(["Thornwisp's sunder move strips Ironmaw's Strength", result.sunder.before === 3 && result.sunder.after === 2])
checks.push(["no console/page errors", errors.length === 0])

let allPass = true
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`)
  if (!ok) allPass = false
}
process.exit(allPass ? 0 : 1)
