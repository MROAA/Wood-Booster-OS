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
  const { FORMATIONS, resolveFormation } = await import("/src/data/heartwood/formations.js")
  const out = {}

  out.formationExists = !!FORMATIONS["the-wearing-down"]
  out.pieces = resolveFormation("the-wearing-down").pieces.map((p) => p.defId)

  let battle = startAutoBattle("tommy", [{ defId: "mosshollow" }], "the-wearing-down")
  out.enemiesSpawned = battle.enemies.map((e) => e.defId)
  const before = {
    duskhollow: battle.enemies.find((e) => e.defId === "duskhollow").hp,
    needlefen: battle.enemies.find((e) => e.defId === "needlefen").hp,
  }
  for (let i = 0; i < 3 && battle.phase === "player"; i++) battle = resolveRound(battle)
  const after = {
    duskhollow: battle.enemies.find((e) => e.defId === "duskhollow")?.hp,
    needlefen: battle.enemies.find((e) => e.defId === "needlefen")?.hp,
  }
  out.fight = { before, after, finalPhase: battle.phase }

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("errors:", errors)
await browser.close()

const checks = []
checks.push(["formation registered", result.formationExists])
checks.push(["pairs Duskhollow and Needlefen", result.pieces.includes("duskhollow") && result.pieces.includes("needlefen")])
checks.push(["both enemies spawn and take damage over the fight", result.enemiesSpawned.length === 2 && (result.fight.after.duskhollow < result.fight.before.duskhollow || result.fight.finalPhase !== "player")])
checks.push(["no console/page errors", errors.length === 0])

let allPass = true
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`)
  if (!ok) allPass = false
}
process.exit(allPass ? 0 : 1)
