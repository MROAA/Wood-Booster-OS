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
  const { UNITS } = await import("/src/data/heartwood/units.js")
  const { UNIT_TRIBES } = await import("/src/data/heartwood/synergies.js")
  const { startAutoBattle, resolveRound } = await import("/src/services/heartwood/autoBattleEngine.js")
  const out = {}

  out.registered = { witherkit: !!UNITS.witherkit, stormveil: !!UNITS.stormveil }
  out.tribes = { witherkit: UNIT_TRIBES.witherkit, stormveil: UNIT_TRIBES.stormveil }

  // Witherkit's movePattern is [attack, debuff poison] - the poison
  // move is index 1, so it only fires on round 2.
  let battle = startAutoBattle("tommy", [{ defId: "witherkit" }], "rotwood-husk")
  battle = resolveRound(battle)
  battle = resolveRound(battle)
  out.witherkitPoison = battle.enemies[0]?.powers.poison

  // Stormveil's own chainDamage stat is present on its def.
  out.stormveilChain = UNITS.stormveil.chainDamage

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("errors:", errors)
await browser.close()

const checks = []
checks.push(["both registered", result.registered.witherkit && result.registered.stormveil])
checks.push(["both tagged in UNIT_TRIBES", result.tribes.witherkit?.length > 0 && result.tribes.stormveil?.length > 0])
checks.push(["Witherkit's poison move applies on round 2", result.witherkitPoison === 2])
checks.push(["Stormveil carries chainDamage(3)", result.stormveilChain === 3])
checks.push(["no console/page errors", errors.length === 0])

let allPass = true
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`)
  if (!ok) allPass = false
}
process.exit(allPass ? 0 : 1)
