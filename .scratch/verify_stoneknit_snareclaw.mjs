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
    stoneknit: !!UNITS.stoneknit,
    snareclaw: !!UNITS.snareclaw,
    stoneknitTribe: UNIT_TRIBES.stoneknit,
    snareclawTribe: UNIT_TRIBES.snareclaw,
  }

  // Stoneknit: Regen applied at battle start.
  let battle = startAutoBattle("tommy", [{ defId: "stoneknit" }], "ironmaw")
  const sk = battle.playerUnits.find((u) => u.defId === "stoneknit")
  out.stoneknitRegen = sk?.powers.regen || 0

  // Snareclaw: Execute applied at battle start.
  battle = startAutoBattle("tommy", [{ defId: "snareclaw" }], "ironmaw")
  const sc = battle.playerUnits.find((u) => u.defId === "snareclaw")
  out.snareclawExecute = sc?.powers.execute || 0

  // Both fight and deal damage without erroring.
  battle = startAutoBattle("tommy", [{ defId: "stoneknit" }, { defId: "snareclaw" }], "ironmaw")
  const hpBefore = battle.enemies[0].hp
  for (let i = 0; i < 6 && battle.phase === "player"; i++) battle = resolveRound(battle)
  out.jointFight = { finalPhase: battle.phase, enemyHpDropped: battle.enemies[0].hp < hpBefore }

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("errors:", errors)
await browser.close()

const checks = []
checks.push(["both registered", result.registered.stoneknit && result.registered.snareclaw])
checks.push(["Stoneknit tagged warden, Snareclaw tagged fang", JSON.stringify(result.registered.stoneknitTribe) === '["warden"]' && JSON.stringify(result.registered.snareclawTribe) === '["fang"]'])
checks.push(["Stoneknit starts with Regen", result.stoneknitRegen > 0])
checks.push(["Snareclaw starts with Execute", result.snareclawExecute > 0])
checks.push(["joint fight resolves and deals damage", result.jointFight.enemyHpDropped])
checks.push(["no console/page errors", errors.length === 0])

let allPass = true
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`)
  if (!ok) allPass = false
}
process.exit(allPass ? 0 : 1)
