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
  const { ENEMIES } = await import("/src/data/heartwood/enemies.js")
  const out = {}

  out.registered = {
    stonewake: !!ENEMIES.stonewake,
    gravequill: !!ENEMIES.gravequill,
    bonewarden: !!ENEMIES.bonewarden,
    deepwarden: !!ENEMIES.deepwarden,
  }

  let battle = startAutoBattle("tommy", [], "stonewake")
  out.stonewakeWard = battle.enemies.find((e) => e.defId === "stonewake")?.powers.ward

  battle = startAutoBattle("tommy", [], "gravequill")
  out.gravequillExecute = battle.enemies.find((e) => e.defId === "gravequill")?.powers.execute

  battle = startAutoBattle("tommy", [], "bonewarden")
  out.bonewardenTaunt = battle.enemies.find((e) => e.defId === "bonewarden")?.powers.taunt

  battle = startAutoBattle("tommy", [], "deepwarden")
  const dw = battle.enemies.find((e) => e.defId === "deepwarden")
  out.deepwarden = { strength: dw?.powers.strength, ward: dw?.powers.ward, maxHp: dw?.maxHp }

  // Deepwarden actually fights and takes real damage across several
  // rounds - a sanity check it's not so tanky it can never be beaten
  // by a real squad, not just "the passive applies."
  battle = startAutoBattle("tommy", [{ defId: "mosshollow" }, { defId: "thornwisp" }], "deepwarden")
  const hpBefore = battle.enemies[0].hp
  for (let i = 0; i < 12 && battle.phase === "player"; i++) battle = resolveRound(battle)
  out.deepwardenFight = { finalPhase: battle.phase, enemyHpDropped: battle.enemies[0].hp < hpBefore }

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("errors:", errors)
await browser.close()

const checks = []
checks.push(["all 4 new enemies registered", result.registered.stonewake && result.registered.gravequill && result.registered.bonewarden && result.registered.deepwarden])
checks.push(["Stonewake carries a self-Ward passive", result.stonewakeWard === 1])
checks.push(["Gravequill carries a self-Execute passive", result.gravequillExecute === 4])
checks.push(["Bonewarden carries a self-Taunt passive", result.bonewardenTaunt === 1])
checks.push(["Deepwarden carries self-Strength+Ward and elevated HP", result.deepwarden.strength === 2 && result.deepwarden.ward === 2 && result.deepwarden.maxHp === 70])
checks.push(["Deepwarden fight resolves and deals real damage", result.deepwardenFight.enemyHpDropped])
checks.push(["no console/page errors", errors.length === 0])

let allPass = true
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`)
  if (!ok) allPass = false
}
process.exit(allPass ? 0 : 1)
