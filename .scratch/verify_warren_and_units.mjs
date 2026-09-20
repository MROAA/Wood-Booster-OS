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
  const { FORMATIONS, resolveFormation } = await import("/src/data/heartwood/formations.js")
  const out = {}

  out.unitsExist = { briarkit: !!UNITS.briarkit, hollowspire: !!UNITS.hollowspire }
  out.formationExists = !!FORMATIONS["quillfangs-warren"]

  // Quillfang's Warren: Hollowfen shields Quillfang (row 0 in front of
  // row 1, same column) - Quillfang should be untargetable by a plain
  // single-target attack while Hollowfen is alive.
  const formation = resolveFormation("quillfangs-warren")
  out.formationShape = formation.pieces.map((p) => ({ defId: p.defId, pos: p.pos }))

  let battle = startAutoBattle("tommy", [{ defId: "briarkit" }], "quillfangs-warren")
  out.enemiesSpawned = battle.enemies.map((e) => e.defId)
  // Resolve one round and confirm Quillfang (the shielded piece) took
  // no damage while Hollowfen (the shield) did.
  const before = { hollowfen: battle.enemies.find((e) => e.defId === "hollowfen").hp, quillfang: battle.enemies.find((e) => e.defId === "quillfang").hp }
  battle = resolveRound(battle)
  const after = { hollowfen: battle.enemies.find((e) => e.defId === "hollowfen")?.hp, quillfang: battle.enemies.find((e) => e.defId === "quillfang")?.hp }
  out.shielding = { before, after }

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("errors:", errors)
await browser.close()

const checks = []
checks.push(["new units registered", result.unitsExist.briarkit && result.unitsExist.hollowspire])
checks.push(["formation registered", result.formationExists])
checks.push(["formation shields Quillfang behind Hollowfen", result.formationShape[0].defId === "hollowfen" && result.formationShape[1].defId === "quillfang"])
checks.push(["both enemies spawn in battle", result.enemiesSpawned.includes("hollowfen") && result.enemiesSpawned.includes("quillfang")])
checks.push(["shielded Quillfang takes no damage while Hollowfen stands", result.shielding.after.quillfang === result.shielding.before.quillfang && result.shielding.after.hollowfen <= result.shielding.before.hollowfen])
checks.push(["no console/page errors", errors.length === 0])

let allPass = true
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`)
  if (!ok) allPass = false
}
process.exit(allPass ? 0 : 1)
