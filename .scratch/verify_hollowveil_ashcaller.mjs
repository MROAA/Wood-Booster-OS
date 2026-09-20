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
  const { startAutoBattle, resolveRound } = await import("/src/services/heartwood/autoBattleEngine.js")
  const { UNITS } = await import("/src/data/heartwood/units.js")
  const out = {}

  out.registered = { hollowveil: !!UNITS.hollowveil, ashcaller: !!UNITS.ashcaller }
  out.tier = { hollowveil: UNITS.hollowveil.tier, ashcaller: UNITS.ashcaller.tier }

  // Hollowveil carries its own Ward passive at battle start.
  let battle = startAutoBattle("tommy", [{ defId: "hollowveil" }], "ironmaw")
  const hv = battle.playerUnits.find((u) => u.defId === "hollowveil")
  out.hollowveilWard = hv?.powers.ward

  // Ashcaller's first move strips Ironmaw's Strength on round 1.
  battle = startAutoBattle("tommy", [{ defId: "ashcaller" }], "ironmaw")
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
checks.push(["both units registered", result.registered.hollowveil && result.registered.ashcaller])
checks.push(["both are rare tier", result.tier.hollowveil === "rare" && result.tier.ashcaller === "rare"])
checks.push(["Hollowveil carries a self-Ward passive", result.hollowveilWard === 2])
checks.push(["Ashcaller's sunder move strips Ironmaw's Strength", result.sunder.before === 3 && result.sunder.after === 2])
checks.push(["no console/page errors", errors.length === 0])

let allPass = true
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`)
  if (!ok) allPass = false
}
process.exit(allPass ? 0 : 1)
