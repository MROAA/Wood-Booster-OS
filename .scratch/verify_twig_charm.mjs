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
  const { ITEMS, itemPool } = await import("/src/data/heartwood/items.js")
  const out = {}

  out.registered = !!ITEMS["twig-charm"]
  out.tier = ITEMS["twig-charm"].tier
  out.commonItemCount = itemPool().filter((i) => i.tier === "common").length

  // The real proof it isn't a dead battle-start grant (the exact
  // Mosswarden's Charm bug - resolveRound resets ALL player Block to
  // 0 at the top of every round, including round 1, before the enemy
  // ever attacks) - measure the exact mechanism via the log line the
  // turnStart trigger produces, not a value the enemy's own random
  // targeting (randomLiving, a 50/50 pick between Tommy and the
  // recruit with no Taunt present) can perturb independently.
  let battle = startAutoBattle("tommy", [{ defId: "duskbramble", itemIds: ["twig-charm"] }], "rotwood-husk")
  battle = resolveRound(battle)
  out.blockLogLine = battle.log.some((line) => line === "Duskbramble gain 2 Block.")
  const carrier = battle.playerUnits.find((u) => u.defId === "duskbramble")
  out.blockRemaining = carrier?.block

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("errors:", errors)
await browser.close()

const checks = []
checks.push(["registered", result.registered])
checks.push(["priced as common tier", result.tier === "common"])
checks.push(["the item pool now has at least 1 common-tier item", result.commonItemCount >= 1])
checks.push(["turnStart trigger grants 2 Block in round 1 (not the Mosswarden's-Charm dead-battle-start-grant bug)", result.blockLogLine])
checks.push(["Block value is 0-2 after round 1 (granted, then possibly absorbed a hit - never negative/absent)", result.blockRemaining >= 0 && result.blockRemaining <= 2])
checks.push(["no console/page errors", errors.length === 0])

let allPass = true
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`)
  if (!ok) allPass = false
}
process.exit(allPass ? 0 : 1)
