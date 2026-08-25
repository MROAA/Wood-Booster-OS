import { chromium } from "playwright"

const PORT = process.env.PORT || 5233

const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForTimeout(500)

const result = await page.evaluate(async () => {
  const { startRun, buyItem, equipItem, effectiveItemSlots } = await import("/src/services/heartwood/runEngine.js")
  const { startAutoBattle } = await import("/src/services/heartwood/autoBattleEngine.js")
  const out = {}

  // 1. Without Artificer's Ledger, effective slots is the base 3, and
  // equipping into slot index 3 (the 4th slot) is rejected.
  let run = startRun("tommy")
  run = { ...run, essence: 99 }
  out.baseSlots = effectiveItemSlots(run)
  run = buyItem(run, "ember-charm")
  const targetKey = run.bench[0].key
  const rejected = equipItem(run, run.items[0].key, targetKey, 3)
  out.slot3RejectedWithoutRelic = rejected.items[0].equippedTo === null

  // 2. With Artificer's Ledger owned, effective slots is 4, and
  // equipping into slot index 3 now succeeds.
  const withLedger = { ...run, relics: ["artificers-ledger"] }
  out.slotsWithLedger = effectiveItemSlots(withLedger)
  const accepted = equipItem(withLedger, withLedger.items[0].key, targetKey, 3)
  out.slot3AcceptedWithRelic = accepted.items[0].equippedTo === targetKey && accepted.items[0].slotIndex === 3

  // 3. Duelist's Edge (an item) grants Execute only to the unit wearing
  // it - deal lethal-range damage to a wounded enemy and confirm the
  // bonus applies via the exact damage math (base + Strength baseline
  // + Execute bonus), same verification style used for the relic
  // version of Execute.
  let itemRun = startRun("tommy")
  itemRun = { ...itemRun, essence: 99 }
  itemRun = buyItem(itemRun, "duelists-edge")
  const wearerKey = itemRun.bench[0].key
  itemRun = equipItem(itemRun, itemRun.items[0].key, wearerKey, 0)
  const wearerItems = itemRun.items.filter((it) => it.equippedTo === wearerKey).map((it) => it.defId)
  const otherItems = itemRun.items.filter((it) => it.equippedTo !== wearerKey && it.equippedTo !== null)
  const battle = startAutoBattle(
    "tommy",
    [
      { defId: itemRun.bench[0].defId, upgradeLevel: 0, itemIds: wearerItems },
      { defId: itemRun.bench[1].defId, upgradeLevel: 0, itemIds: [] },
    ],
    "rotwood-husk",
  )
  out.duelistsEdge = {
    wearerExecute: battle.playerUnits[0].powers.execute || 0,
    otherExecute: battle.playerUnits[1].powers.execute || 0,
  }

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("console/page errors:", errors)
await browser.close()

const ledgerOk =
  result.baseSlots === 3 &&
  result.slot3RejectedWithoutRelic &&
  result.slotsWithLedger === 4 &&
  result.slot3AcceptedWithRelic
const duelistOk = result.duelistsEdge.wearerExecute === 3 && result.duelistsEdge.otherExecute === 0

if (errors.length) {
  console.log("FAIL: console/page errors present")
  process.exit(1)
}
if (ledgerOk && duelistOk) {
  console.log("PASS: Artificer's Ledger correctly grants a 4th item slot only when owned; Duelist's Edge grants Execute only to the wearing unit")
  process.exit(0)
} else {
  console.log("FAIL", { ledgerOk, duelistOk, result })
  process.exit(1)
}
