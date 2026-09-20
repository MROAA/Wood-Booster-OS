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
  const { startRun, buyItem, equipItem, recruitUnit } = await import("/src/services/heartwood/runEngine.js")
  const { startAutoBattle, resolveRound } = await import("/src/services/heartwood/autoBattleEngine.js")
  const out = {}

  // 1. Fusion (3 owned copies -> 1 Tier 2 copy) returns any items
  // equipped to the 3 consumed bench keys to the bag, rather than
  // leaving them pointing at a bench key that no longer exists.
  let run = startRun("tommy")
  const defId = run.bench[0].defId
  run = { ...run, essence: 99 }
  run = buyItem(run, "ember-charm")
  run = equipItem(run, run.items[0].key, run.bench[0].key, 0)
  const beforeFusionItemCount = run.items.length
  // Bench already has 1 copy of defId (bench[0]); recruiting 2 more
  // triggers fuseAll inside recruitUnit once the 3rd copy lands.
  run = { ...run, shopOffers: [defId, defId] }
  run = recruitUnit(run, defId)
  run = { ...run, shopOffers: [defId] }
  run = recruitUnit(run, defId)
  out.fusion = {
    stillHasTier2: run.bench.some((e) => e.defId === `${defId}+`),
    originalKeyGone: !run.bench.some((e) => e.key === 0),
    itemCountUnchanged: run.items.length === beforeFusionItemCount,
    itemReturnedToBag: run.items.every((it) => it.equippedTo === null || run.bench.some((e) => e.key === it.equippedTo)),
  }

  // 2. resolveRound records structural attack events (actorId/targetId)
  // into state.roundEvents, reset each round - AutoBattleView.jsx uses
  // this to stage the HSBB-style attacker-lunge animation.
  let battle = startAutoBattle("tommy", ["the-fool"], "rotwood-husk")
  out.initialRoundEventsEmpty = (battle.roundEvents || []).length === 0
  battle = resolveRound(battle)
  out.round1Events = battle.roundEvents.map((e) => ({ hasActor: !!e.actorId, hasTarget: !!e.targetId }))
  battle = resolveRound(battle)
  out.round2EventsIsFreshNotAccumulated = battle.roundEvents.length <= battle.playerUnits.length + battle.enemies.length + 4

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("console/page errors:", errors)
await browser.close()

const fusionOk =
  result.fusion.stillHasTier2 &&
  result.fusion.originalKeyGone &&
  result.fusion.itemCountUnchanged &&
  result.fusion.itemReturnedToBag
const eventsOk =
  result.initialRoundEventsEmpty &&
  result.round1Events.length > 0 &&
  result.round1Events.every((e) => e.hasActor && e.hasTarget) &&
  result.round2EventsIsFreshNotAccumulated

if (errors.length) {
  console.log("FAIL: console/page errors present")
  process.exit(1)
}
if (fusionOk && eventsOk) {
  console.log("PASS: Fusion returns equipped items to the bag instead of leaving a dangling reference; roundEvents records real actor/target ids and resets each round")
  process.exit(0)
} else {
  console.log("FAIL", { fusionOk, eventsOk, result })
  process.exit(1)
}
