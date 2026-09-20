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

  out.registered = { item: !!ITEMS["sundermaw-fang"], relic: !!RELICS["rootbreak-sigil"] }
  out.itemTier = ITEMS["sundermaw-fang"].tier
  out.relicTier = RELICS["rootbreak-sigil"].tier

  // Item: equipped unit's own hit strips Ironmaw's Strength.
  let battle = startAutoBattle(
    "tommy",
    [{ defId: "duskbramble", itemIds: ["sundermaw-fang"] }],
    "ironmaw"
  )
  const before = battle.enemies.find((e) => e.defId === "ironmaw").powers.strength
  battle = resolveRound(battle)
  const after = battle.enemies.find((e) => e.defId === "ironmaw")?.powers.strength
  out.itemSunder = { before, after }

  // Relic: squad-wide - even a unit with no item/kit-level Sunder now
  // strips a buff on hit.
  battle = startAutoBattle("tommy", [{ defId: "duskbramble" }], "ironmaw", ["rootbreak-sigil"])
  const before2 = battle.enemies.find((e) => e.defId === "ironmaw").powers.strength
  battle = resolveRound(battle)
  const after2 = battle.enemies.find((e) => e.defId === "ironmaw")?.powers.strength
  out.relicSunder = { before: before2, after: after2 }

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("errors:", errors)
await browser.close()

const checks = []
checks.push(["both registered", result.registered.item && result.registered.relic])
checks.push(["item is rare tier", result.itemTier === "rare"])
checks.push(["relic is rare tier", result.relicTier === "rare"])
checks.push(["item's onDealDamage sunder strips a stack", result.itemSunder.before === 3 && result.itemSunder.after === 2])
// The Commander (always present, Haste) + the recruited unit both
// carry the relic and both attack in round 1 - Strength(3) gets
// stripped by each hit that lands, so it's fully gone by round's end,
// not just decremented by 1 the way a single hit would.
checks.push(["relic's squad-wide sunder strips Strength down to 0 across multiple attackers' hits", result.relicSunder.before === 3 && result.relicSunder.after === 0])
checks.push(["no console/page errors", errors.length === 0])

let allPass = true
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`)
  if (!ok) allPass = false
}
process.exit(allPass ? 0 : 1)
