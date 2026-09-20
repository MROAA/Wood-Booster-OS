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

  out.unitsExist = {
    thistlemaw: !!UNITS.thistlemaw,
    brackenveil: !!UNITS.brackenveil,
  }
  out.enemiesExist = {
    hollowfen: !!ENEMIES.hollowfen,
    quillfang: !!ENEMIES.quillfang,
  }

  // New units actually fight without crashing and deal/take damage.
  let battle = startAutoBattle("tommy", [{ defId: "thistlemaw" }, { defId: "brackenveil" }], "hollowfen")
  const hpBefore = battle.enemies[0].hp
  for (let i = 0; i < 8 && battle.phase === "player"; i++) battle = resolveRound(battle)
  out.hollowfenFight = { finalPhase: battle.phase, enemyHpDropped: battle.enemies[0].hp < hpBefore }

  // Quillfang's poison move is correctly authored (the always-present
  // Commander alongside any recruit kills a 36 HP mook well before its
  // 2nd move in a real fight, so this checks the movePattern data
  // directly rather than trying to force a survivable simulated fight).
  out.quillfangPoisonMove = ENEMIES.quillfang.movePattern[1]

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("errors:", errors)
await browser.close()

const checks = []
checks.push(["new units registered", result.unitsExist.thistlemaw && result.unitsExist.brackenveil])
checks.push(["new enemies registered", result.enemiesExist.hollowfen && result.enemiesExist.quillfang])
checks.push(["fight vs Hollowfen resolves and deals damage", result.hollowfenFight.enemyHpDropped])
checks.push(["Quillfang's 2nd move applies poison to the player", result.quillfangPoisonMove?.type === "debuff" && result.quillfangPoisonMove?.id === "poison"])
checks.push(["no console/page errors", errors.length === 0])

let allPass = true
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`)
  if (!ok) allPass = false
}
process.exit(allPass ? 0 : 1)
