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
  const { FORMATIONS, resolveFormation } = await import("/src/data/heartwood/formations.js")
  const out = {}

  out.mossveilExists = !!ENEMIES.mossveil
  out.formationExists = !!FORMATIONS["bonewardens-watch"]
  const formation = resolveFormation("bonewardens-watch")
  out.formationShape = formation.pieces.map((p) => ({ defId: p.defId, pos: p.pos }))

  // Gravequill is NOT position-shielded (same row as Bonewarden), but a
  // single-target player attack should still land on Bonewarden every
  // time while it lives, thanks to Taunt - the whole point of the
  // formation.
  let battle = startAutoBattle("tommy", [{ defId: "thistlemaw" }], "bonewardens-watch")
  const before = {
    bonewarden: battle.enemies.find((e) => e.defId === "bonewarden").hp,
    gravequill: battle.enemies.find((e) => e.defId === "gravequill").hp,
  }
  battle = resolveRound(battle)
  const after = {
    bonewarden: battle.enemies.find((e) => e.defId === "bonewarden")?.hp,
    gravequill: battle.enemies.find((e) => e.defId === "gravequill")?.hp,
  }
  out.taunted = { before, after }

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("errors:", errors)
await browser.close()

const checks = []
checks.push(["Mossveil registered", result.mossveilExists])
checks.push(["formation registered", result.formationExists])
checks.push(["Bonewarden and Gravequill share the same row (no position shielding)", result.formationShape[0].pos.row === result.formationShape[1].pos.row])
checks.push(["all player single-target attacks land on Bonewarden while it lives", result.taunted.after.gravequill === result.taunted.before.gravequill && result.taunted.after.bonewarden < result.taunted.before.bonewarden])
checks.push(["no console/page errors", errors.length === 0])

let allPass = true
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`)
  if (!ok) allPass = false
}
process.exit(allPass ? 0 : 1)
