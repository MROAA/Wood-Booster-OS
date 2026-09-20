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
  const { FORMATIONS, resolveFormation } = await import("/src/data/heartwood/formations.js")
  const out = {}

  out.formationExists = !!FORMATIONS["the-cursed-thicket"]
  const formation = resolveFormation("the-cursed-thicket")
  out.formationShape = formation.pieces.map((p) => ({ defId: p.defId, pos: p.pos }))

  // Hollowcurse is NOT position-shielded (same row as Bramblespite),
  // but a single-target player attack should still land on Bramblespite
  // every time while it lives, thanks to its own self-Taunt - the whole
  // point of the formation (same mechanism Bonewarden's Watch already
  // proved, different pair).
  let battle = startAutoBattle("tommy", [{ defId: "thistlemaw" }], "the-cursed-thicket")
  const before = {
    bramblespite: battle.enemies.find((e) => e.defId === "bramblespite").hp,
    hollowcurse: battle.enemies.find((e) => e.defId === "hollowcurse").hp,
  }
  battle = resolveRound(battle)
  const after = {
    bramblespite: battle.enemies.find((e) => e.defId === "bramblespite")?.hp,
    hollowcurse: battle.enemies.find((e) => e.defId === "hollowcurse")?.hp,
  }
  out.taunted = { before, after }

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("errors:", errors)
await browser.close()

const checks = []
checks.push(["formation registered", result.formationExists])
checks.push(["Bramblespite and Hollowcurse share the same row (no position shielding)", result.formationShape[0].pos.row === result.formationShape[1].pos.row])
checks.push(["all player single-target attacks land on Bramblespite while it lives", result.taunted.after.hollowcurse === result.taunted.before.hollowcurse && result.taunted.after.bramblespite < result.taunted.before.bramblespite])
checks.push(["no console/page errors", errors.length === 0])

let allPass = true
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`)
  if (!ok) allPass = false
}
process.exit(allPass ? 0 : 1)
