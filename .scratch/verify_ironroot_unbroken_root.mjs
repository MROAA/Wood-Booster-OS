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
  const { ENEMIES } = await import("/src/data/heartwood/enemies.js")
  const { FORMATIONS, resolveFormation } = await import("/src/data/heartwood/formations.js")
  const out = {}

  out.ironrootExists = !!ENEMIES.ironroot
  out.formationExists = !!FORMATIONS["the-unbroken-root"]
  const formation = resolveFormation("the-unbroken-root")
  out.formationShape = formation.pieces.map((p) => ({ defId: p.defId, pos: p.pos }))

  let battle = startAutoBattle("tommy", [{ defId: "duskbramble" }], "ironroot")
  let ironroot = battle.enemies.find((e) => e.defId === "ironroot")
  out.taunted = ironroot.powers.taunt > 0

  // Ironroot's Cleanse: a unit carrying Venomed Fang (pure poison-on-
  // hit, no self-cleanse of its own) should land Poison on Ironroot
  // every round it attacks, but Ironroot's own 3rd move (cleanse)
  // strips exactly ONE stack per use (effects.js's cleanse - same
  // shared mechanism Rootward already uses, not full removal) - so
  // against a single poison source, the stack count plateaus instead
  // of climbing, and the log records the strip actually firing.
  // Measure via the log line, not net stack math (which nets to zero
  // change when application and cleanse happen in the same round).
  battle = startAutoBattle("tommy", [{ defId: "duskbramble", itemIds: ["venomed-fang"] }], "ironroot")
  for (let i = 0; i < 4 && battle.phase === "player"; i++) battle = resolveRound(battle)
  out.poisonLanded = battle.log.some((line) => line.includes("poison"))
  out.cleanseLogFired = battle.log.some((line) => line.includes("cleanses a stack of Poison"))
  out.ironrootStillAliveOrWon = battle.phase === "won" || !!battle.enemies.find((e) => e.defId === "ironroot")

  // The Unbroken Root: Ironroot's Taunt should force all single-target
  // attacks onto it while Thornfen sits untouched (same shielding-by-
  // mechanism proof as Bonewarden's Watch/The Cursed Thicket).
  battle = startAutoBattle("tommy", [{ defId: "thistlemaw" }], "the-unbroken-root")
  const before = {
    ironroot: battle.enemies.find((e) => e.defId === "ironroot").hp,
    thornfen: battle.enemies.find((e) => e.defId === "thornfen").hp,
  }
  battle = resolveRound(battle)
  const after = {
    ironroot: battle.enemies.find((e) => e.defId === "ironroot")?.hp,
    thornfen: battle.enemies.find((e) => e.defId === "thornfen")?.hp,
  }
  out.shielding = { before, after }

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("errors:", errors)
await browser.close()

const checks = []
checks.push(["Ironroot registered", result.ironrootExists])
checks.push(["The Unbroken Root formation registered", result.formationExists])
checks.push(["Ironroot and Thornfen share a row (no position shielding)", result.formationShape[0].pos.row === result.formationShape[1].pos.row])
checks.push(["Ironroot starts with Taunt", result.taunted])
checks.push(["Poison lands on Ironroot", result.poisonLanded])
checks.push(["Ironroot's own Cleanse fires and strips a Poison stack", result.cleanseLogFired])
checks.push(["fight resolves without crashing", result.ironrootStillAliveOrWon])
checks.push(["all single-target attacks land on Ironroot while it lives", result.shielding.after.thornfen === result.shielding.before.thornfen && result.shielding.after.ironroot < result.shielding.before.ironroot])
checks.push(["no console/page errors", errors.length === 0])

let allPass = true
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`)
  if (!ok) allPass = false
}
process.exit(allPass ? 0 : 1)
