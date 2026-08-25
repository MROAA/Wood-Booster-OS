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
  const { startAutoBattle, resolveRound } = await import("/src/services/heartwood/autoBattleEngine.js")
  const { UNITS } = await import("/src/data/heartwood/units.js")
  const { UNIT_TRIBES } = await import("/src/data/heartwood/synergies.js")
  const out = {}

  out.registered = {
    wraithguard: !!UNITS.wraithguard,
    nightveil: !!UNITS.nightveil,
    wraithguardTribe: UNIT_TRIBES.wraithguard,
    nightveilTribe: UNIT_TRIBES.nightveil,
  }

  // Wraithguard: Taunt applied at battle start, held all fight.
  let battle = startAutoBattle("tommy", [{ defId: "wraithguard" }], "ironmaw")
  const wg = battle.playerUnits.find((u) => u.defId === "wraithguard")
  out.wraithguardTaunt = wg?.powers.taunt || 0

  // Nightveil: Shatter applied at battle start (bonus vs Blocked target).
  battle = startAutoBattle("tommy", [{ defId: "nightveil" }], "ironmaw")
  const nv = battle.playerUnits.find((u) => u.defId === "nightveil")
  out.nightveilShatter = nv?.powers.shatter || 0

  // Both fight and deal damage without erroring.
  battle = startAutoBattle("tommy", [{ defId: "wraithguard" }, { defId: "nightveil" }], "ironmaw")
  const hpBefore = battle.enemies[0].hp
  for (let i = 0; i < 6 && battle.phase === "player"; i++) battle = resolveRound(battle)
  out.jointFight = { finalPhase: battle.phase, enemyHpDropped: battle.enemies[0].hp < hpBefore }

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("errors:", errors)
await browser.close()

const checks = []
checks.push(["both registered", result.registered.wraithguard && result.registered.nightveil])
checks.push(["both tagged spirit tribe", JSON.stringify(result.registered.wraithguardTribe) === '["spirit"]' && JSON.stringify(result.registered.nightveilTribe) === '["spirit"]'])
checks.push(["Wraithguard starts with Taunt", result.wraithguardTaunt > 0])
checks.push(["Nightveil starts with Shatter", result.nightveilShatter > 0])
checks.push(["joint fight resolves and deals damage", result.jointFight.enemyHpDropped])
checks.push(["no console/page errors", errors.length === 0])

let allPass = true
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`)
  if (!ok) allPass = false
}
process.exit(allPass ? 0 : 1)
