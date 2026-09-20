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
  const { startRun, recruitUnit, sellUnit, assignToSlot } = await import("/src/services/heartwood/runEngine.js")
  const { UNITS } = await import("/src/data/heartwood/units.js")
  const { ITEMS, itemPool } = await import("/src/data/heartwood/items.js")
  const { RELICS, relicPool } = await import("/src/data/heartwood/relics.js")
  const out = {}

  // Rarity: every item/relic carries a tier derived from cost.
  out.itemTiers = itemPool().map((i) => ({ id: i.id, cost: i.cost, tier: i.tier }))
  out.relicTiersAllRare = relicPool().every((r) => r.tier === "rare")
  out.itemTierCorrect = out.itemTiers.every(
    (i) => (i.cost === 1 && i.tier === "common") || (i.cost === 2 && i.tier === "uncommon") || (i.cost === 3 && i.tier === "rare")
  )

  // Sell: recruit a common unit, sell it, confirm refund + removal.
  let run = startRun("tommy")
  const commonId = Object.values(UNITS).find((u) => u.tier === "common" && u.displayTier !== 2 && u.recruitCost != null)?.id
  run = { ...run, shopOffers: [commonId] }
  const essenceBefore = run.essence
  run = recruitUnit(run, commonId)
  const afterRecruit = run.essence
  const benchKey = run.bench[0].key
  run = assignToSlot(run, 0, benchKey)
  const deployedBefore = run.deployed[0]

  const def = UNITS[commonId]
  const expectedRefund = Math.ceil(def.recruitCost / 2)
  run = sellUnit(run, benchKey)

  out.sell = {
    essenceBefore,
    afterRecruit,
    recruitCost: def.recruitCost,
    expectedRefund,
    essenceAfterSell: run.essence,
    benchLengthAfterSell: run.bench.length,
    deployedBeforeSell: deployedBefore,
    deployedAfterSell: run.deployed[0],
    stillHasKey: run.bench.some((e) => e.key === benchKey),
  }

  // Sell with an equipped item returns it to the bag instead of losing it.
  run = { ...run, essence: 10, shopOffers: [commonId] }
  run = recruitUnit(run, commonId)
  const benchKey2 = run.bench[run.bench.length - 1].key
  const { equipItem, buyItem } = await import("/src/services/heartwood/runEngine.js")
  const itemDefId = itemPool()[0].id
  run = buyItem(run, itemDefId)
  const itemKey = run.items[run.items.length - 1].key
  run = equipItem(run, itemKey, benchKey2, 0)
  const equippedBefore = run.items.find((it) => it.key === itemKey).equippedTo
  run = sellUnit(run, benchKey2)
  const itemAfter = run.items.find((it) => it.key === itemKey)
  out.sellReturnsItem = {
    equippedBefore,
    itemStillExists: !!itemAfter,
    equippedToAfter: itemAfter?.equippedTo,
    slotIndexAfter: itemAfter?.slotIndex,
  }

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("errors:", errors)
await browser.close()

const checks = []
checks.push(["item tiers correct", result.itemTierCorrect])
checks.push(["relic tiers all rare", result.relicTiersAllRare])
checks.push(["sell spends nothing, refunds essence", result.sell.essenceAfterSell === result.sell.afterRecruit + result.sell.expectedRefund])
checks.push(["sell refund is half recruit cost rounded up, never more", result.sell.expectedRefund > 0 && result.sell.expectedRefund <= result.sell.recruitCost])
checks.push(["sell removes bench entry", !result.sell.stillHasKey])
checks.push(["sell clears deploy slot", result.sell.deployedBeforeSell !== null && result.sell.deployedAfterSell === null])
checks.push(["sell returns equipped item to bag", result.sellReturnsItem.itemStillExists && result.sellReturnsItem.equippedToAfter === null && result.sellReturnsItem.slotIndexAfter === null])
checks.push(["no console/page errors", errors.length === 0])

let allPass = true
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`)
  if (!ok) allPass = false
}
process.exit(allPass ? 0 : 1)
