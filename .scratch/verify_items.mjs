import { chromium } from "playwright"

const PORT = process.env.PORT || 5227

const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForTimeout(500)

const result = await page.evaluate(async () => {
  const { startRun, buyItem, equipItem, unequipItem, reforgeUnit } = await import("/src/services/heartwood/runEngine.js")
  const { startAutoBattle } = await import("/src/services/heartwood/autoBattleEngine.js")
  const out = {}

  // 1. Buying an item spends Essence and adds it to the bag, unequipped.
  let run = startRun("tommy")
  const startEssence = run.essence
  run = buyItem(run, "ember-charm")
  out.buy = { essenceSpent: startEssence - run.essence, itemCount: run.items.length, unequipped: run.items[0]?.equippedTo === null }

  // 2. Can't afford an item you don't have Essence for - buyItem is a no-op.
  const poorRun = { ...run, essence: 0 }
  const afterFailedBuy = buyItem(poorRun, "venomed-fang")
  out.affordGuard = afterFailedBuy.items.length === poorRun.items.length

  // 3. Equipping applies the item's effect to ONLY the equipped unit at
  // battle start, not squad-wide - deploy 2 units, equip Ember Charm
  // (+1 Strength) onto just the first, confirm only that one gets it.
  run = { ...run, essence: 10 } // starter Essence (3) only covers one 2-cost item; top up for the rest of this test
  run = buyItem(run, "ember-charm") // second copy, for a second unit
  const bench = run.bench // starter units: the-fool, the-magician, the-high-priestess (defIds may vary by starter set)
  const targetKey = bench[0].key
  const otherKey = bench[1].key
  run = equipItem(run, run.items[0].key, targetKey, 0)
  const battle = startAutoBattle(
    "tommy",
    [
      { defId: bench[0].defId, upgradeLevel: 0, itemIds: run.items.filter((it) => it.equippedTo === targetKey).map((it) => it.defId) },
      { defId: bench[1].defId, upgradeLevel: 0, itemIds: run.items.filter((it) => it.equippedTo === otherKey).map((it) => it.defId) },
    ],
    "rotwood-husk",
  )
  out.equipEffect = {
    targetStrength: battle.playerUnits[0].powers.strength || 0,
    otherStrength: battle.playerUnits[1].powers.strength || 0,
  }

  // 4. Unequipping removes it from the slot back to the bag - the next
  // battle-start no longer applies its effect.
  run = unequipItem(run, run.items.find((it) => it.equippedTo === targetKey).key)
  const afterUnequip = startAutoBattle(
    "tommy",
    [{ defId: bench[0].defId, upgradeLevel: 0, itemIds: [] }],
    "rotwood-husk",
  )
  out.unequip = { stillUnequippedInBag: run.items.every((it) => it.equippedTo === null), strengthAfter: afterUnequip.playerUnits[0].powers.strength || 0 }

  // 5. Equipping into an already-filled slot swaps the old item back to
  // the bag rather than stacking two items in one slot.
  run = equipItem(run, run.items[0].key, targetKey, 0)
  run = buyItem(run, "bark-plating")
  const secondItemKey = run.items.find((it) => it.defId === "bark-plating").key
  run = equipItem(run, secondItemKey, targetKey, 0) // same slot 0 - should bump ember-charm out
  out.slotSwap = {
    slot0IsBarkPlating: run.items.find((it) => it.equippedTo === targetKey && it.slotIndex === 0)?.defId === "bark-plating",
    emberBackInBag: run.items.find((it) => it.defId === "ember-charm")?.equippedTo === null,
  }

  // 6. Reforging a unit returns its equipped items to the bag instead of
  // leaving them pointing at a bench key that's now a different unit.
  run = reforgeUnit({ ...run, essence: 99 }, targetKey)
  out.reforgeUnequips = run.items.every((it) => it.equippedTo !== targetKey || it.equippedTo === null)

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("console/page errors:", errors)
await browser.close()

const buyOk = result.buy.essenceSpent === 2 && result.buy.itemCount === 1 && result.buy.unequipped
const affordOk = result.affordGuard
// Tommy's own Commander squadPassive grants +2 Strength to every
// deployed unit baseline (characters.js) - the item's own +1 Strength
// (ember-charm) stacks on top of that, so the equipped unit reads 3
// (2 baseline + 1 item), not 1; the unequipped unit reads the 2
// baseline only, not 0. Confirmed via characters.js, not guessed - the
// exact "forgot the Commander's own baseline" test flaw this session
// already hit once before with Rally.
const equipOk = result.equipEffect.targetStrength === 3 && result.equipEffect.otherStrength === 2
const unequipOk = result.unequip.stillUnequippedInBag && result.unequip.strengthAfter === 2
const swapOk = result.slotSwap.slot0IsBarkPlating && result.slotSwap.emberBackInBag
const reforgeOk = result.reforgeUnequips

if (errors.length) {
  console.log("FAIL: console/page errors present")
  process.exit(1)
}
if (buyOk && affordOk && equipOk && unequipOk && swapOk && reforgeOk) {
  console.log("PASS: buying/equipping/unequipping items works, effects are single-target only, slot-swap and Reforge correctly return items to the bag")
  process.exit(0)
} else {
  console.log("FAIL", { buyOk, affordOk, equipOk, unequipOk, swapOk, reforgeOk, result })
  process.exit(1)
}
