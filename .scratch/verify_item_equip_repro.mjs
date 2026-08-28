import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

const PORT = process.env.PORT || 5311
const SHOT_DIR = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-item-equip-fix/.scratch/shots"
await mkdir(SHOT_DIR, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })

// First load to establish origin for localStorage, then inject a run
// state directly via the real engine functions (startRun/recruitUnit/
// buyItem/serializeRun) so the UI reproduction starts from "already
// recruited a unit, already bought an item, plenty of Essence" instead
// of grinding through the shop manually.
await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForTimeout(400)

const setup = await page.evaluate(async () => {
  const { startRun, recruitUnit, buyItem, serializeRun } = await import("/src/services/heartwood/runEngine.js")
  let state = { ...startRun("tommy"), essence: 999 }
  // Recruit one unit so there's a bench slot to equip onto.
  const unitId = state.shopOffers[0]
  state = recruitUnit(state, unitId)
  const benchKeyAfterRecruit = state.bench[0]?.key
  // Buy the first item offer - exactly what Marc did ("rahat meni").
  const itemId = state.itemOffers[0]
  const essenceBeforeBuy = state.essence
  state = buyItem(state, itemId)
  const saved = serializeRun(state)
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(saved))
  return {
    unitId,
    benchKeyAfterRecruit,
    itemId,
    essenceBeforeBuy,
    essenceAfterBuy: state.essence,
    itemsInBag: state.items,
  }
})
console.log("Setup:", JSON.stringify(setup, null, 2))

// Reload so HeartwoodBattle mounts and restores this run from the save
// we just wrote - this is the exact "player already bought the item"
// moment Marc described.
await page.reload()
await page.waitForSelector("text=/hearthwood market/i", { timeout: 5000 })
await page.waitForTimeout(300)

// Dismiss tutorial if it appears.
const tutorialNext = page.locator("button.hw-tutorial-next")
if (await tutorialNext.isVisible({ timeout: 500 }).catch(() => false)) {
  await tutorialNext.click()
  await page.waitForTimeout(200)
}

await page.screenshot({ path: `${SHOT_DIR}/01_market_tab_after_buying_item.png` })

// Step 1: Confirm the essence badge reflects the purchase actually
// took effect (gold really was spent).
const essenceBadgeText = (await page.locator(".hw-essence-badge").textContent()).trim()
console.log("Essence badge after buy+reload:", essenceBadgeText)

// Step 2: On the Market tab (the default tab, and the tab a player is
// on right after buying), is there ANY visible way to equip the item
// that was just bought? Look for item-slot pips or the bag list.
const marketTabItemSlotsVisible = await page.locator(".hw-panel--market .hw-item-slots").count()
const marketTabBagVisible = await page.locator(".hw-panel--market .hw-badge[style*=\"cursor: pointer\"]").count()
console.log("Item-slot pips visible on Market tab:", marketTabItemSlotsVisible)
console.log("Bag item entries visible on Market tab:", marketTabBagVisible)

// Step 3: Switch to "Your Squad" tab - this is where the bag and the
// per-unit item slots actually live.
await page.click("button.hw-move-btn:has-text(\"Your Squad\")")
await page.waitForTimeout(200)
await page.screenshot({ path: `${SHOT_DIR}/02_squad_tab_bag_and_slots.png` })

const bagEntries = page.locator(".hw-panel--squad .hw-badge[style*=\"cursor: pointer\"]")
const bagCount = await bagEntries.count()
console.log("Bag item entries visible on Squad tab:", bagCount)

if (bagCount > 0) {
  // Click the bag item to select it (matches SquadDraft.jsx's
  // handleBagItemClick), then click the first empty item-slot pip on
  // the recruited unit's card to equip it there.
  await bagEntries.first().click()
  await page.waitForTimeout(150)
  await page.screenshot({ path: `${SHOT_DIR}/03_item_selected.png` })

  const firstSlotPip = page.locator(".hw-panel--squad .hw-item-slots .hw-item-slot").first()
  await firstSlotPip.click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${SHOT_DIR}/04_after_equip_click.png` })
}

const finalState = await page.evaluate(() => {
  const raw = localStorage.getItem("heartwood-run-save-v1")
  return raw ? JSON.parse(raw).run.items : null
})
console.log("Final item state after equip attempt:", JSON.stringify(finalState, null, 2))

const filledSlotAfter = await page.locator(".hw-panel--squad .hw-item-slot--filled").count()
console.log("Filled item slots visible after equip click:", filledSlotAfter)

console.log("Console/page errors:", JSON.stringify(errors, null, 2))

await browser.close()
