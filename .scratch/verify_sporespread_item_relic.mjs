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
  const { ITEMS } = await import("/src/data/heartwood/items.js")
  const { RELICS } = await import("/src/data/heartwood/relics.js")
  const out = {}

  out.registered = { item: !!ITEMS["fungal-spore-sac"], relic: !!RELICS["mycotic-bloom"] }

  // Rootfang's own movePattern is [attack, debuff poison, attack] -
  // the poison move only fires on round 2. Without the item, only
  // its direct target (frontmost) should end round 2 poisoned.
  async function runScenario(itemIds) {
    let b = startAutoBattle("tommy", [{ defId: "rootfang", itemIds }], "mist-growler-pack")
    b = resolveRound(b)
    b = resolveRound(b)
    return b.enemies.map((e) => ({ defId: e.defId, poison: e.powers.poison || 0 }))
  }

  out.withoutItem = await runScenario([])
  out.withItem = await runScenario(["fungal-spore-sac"])

  // Relic version, squad-wide.
  let battle = startAutoBattle("tommy", [{ defId: "rootfang" }], "mist-growler-pack", ["mycotic-bloom"])
  battle = resolveRound(battle)
  battle = resolveRound(battle)
  out.withRelic = battle.enemies.map((e) => ({ defId: e.defId, poison: e.powers.poison || 0 }))

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("errors:", errors)
await browser.close()

const checks = []
checks.push(["both registered", result.registered.item && result.registered.relic])
checks.push(["without the item, only ONE enemy ends up poisoned", result.withoutItem.filter((e) => e.poison > 0).length === 1])
checks.push(["with the item, BOTH enemies end up poisoned (spread fired)", result.withItem.filter((e) => e.poison > 0).length === 2])
checks.push(["the relic version also spreads poison to both enemies", result.withRelic.filter((e) => e.poison > 0).length === 2])
checks.push(["no console/page errors", errors.length === 0])

let allPass = true
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`)
  if (!ok) allPass = false
}
process.exit(allPass ? 0 : 1)
