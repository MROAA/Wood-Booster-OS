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

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForTimeout(400)

// Seed a run with a recruited unit and plenty of Essence, but do NOT
// pre-buy the item - the whole point is to click the real "buy" button
// live, the way Marc actually did, and watch what the UI does next.
const setup = await page.evaluate(async () => {
  const { startRun, recruitUnit, serializeRun } = await import("/src/services/heartwood/runEngine.js")
  let state = { ...startRun("tommy"), essence: 999 }
  const unitId = state.shopOffers[0]
  state = recruitUnit(state, unitId)
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(state)))
  return { unitId, benchKey: state.bench[0]?.key, itemOffers: state.itemOffers }
})
console.log("Setup:", JSON.stringify(setup, null, 2))

await page.reload()
await page.waitForSelector("text=/hearthwood market/i", { timeout: 5000 })
await page.waitForTimeout(300)
const tutorialNext = page.locator("button.hw-tutorial-next")
if (await tutorialNext.isVisible({ timeout: 500 }).catch(() => false)) {
  await tutorialNext.click()
  await page.waitForTimeout(200)
}

const essenceBefore = (await page.locator(".hw-essence-badge").textContent()).trim()
await page.screenshot({ path: `${SHOT_DIR}/A_before_buy_market_tab.png` })

// Click the first affordable item card - the real purchase click.
const itemCard = page.locator(".hw-item-card[data-disabled=\"false\"]").first()
const boughtItemName = (await itemCard.locator(".hw-card-name").textContent()).trim()
await itemCard.click()
await page.waitForTimeout(350)

const essenceAfter = (await page.locator(".hw-essence-badge").textContent()).trim()
console.log(`Essence: ${essenceBefore} -> ${essenceAfter} (bought "${boughtItemName}")`)

await page.screenshot({ path: `${SHOT_DIR}/B_immediately_after_buy.png` })

// Buying should NOT force the player off the Market tab (they might
// still be mid-shopping) - but the equip-pending banner must be
// visible right there telling them what to do next, with an explicit
// way to get to the equip slots.
const stillOnMarketTab = (await page.locator("button.hw-move-btn:has-text(\"Market\")").getAttribute("data-active")) === "true"
const pendingBanner = await page.locator(".hw-hint--pending").isVisible().catch(() => false)
const pendingBannerText = pendingBanner ? (await page.locator(".hw-hint--pending").textContent()).trim() : null
console.log("Still on Market tab after buying (not forced away):", stillOnMarketTab)
console.log("Equip-pending banner visible:", pendingBanner)
console.log("Equip-pending banner text:", pendingBannerText)

// Click the banner's own "Go to Your Squad" button - the explicit,
// discoverable next step.
await page.click(".hw-hint--pending button:has-text(\"Go to Your Squad\")")
await page.waitForTimeout(200)
const nowOnSquadTab = (await page.locator("button.hw-move-btn:has-text(\"Your Squad\")").getAttribute("data-active")) === "true"
console.log("On Your Squad tab after clicking the banner button:", nowOnSquadTab)

// Now do the second half of the gesture a real player would do: click
// the first empty item-slot pip on the recruited unit's card.
const firstSlotPip = page.locator(".hw-panel--squad .hw-item-slots .hw-item-slot").first()
await firstSlotPip.click()
await page.waitForTimeout(400)
await page.screenshot({ path: `${SHOT_DIR}/C_after_equip_click.png` })

const filledSlots = await page.locator(".hw-panel--squad .hw-item-slot--filled").count()
const bannerGoneAfterEquip = !(await page.locator(".hw-hint--pending").isVisible().catch(() => false))
console.log("Filled item slots after equip click:", filledSlots)
console.log("Equip-pending banner cleared after equip:", bannerGoneAfterEquip)

const finalRunState = await page.evaluate(() => {
  const raw = localStorage.getItem("heartwood-run-save-v1")
  return raw ? JSON.parse(raw).run : null
})
console.log("Final items array:", JSON.stringify(finalRunState.items, null, 2))
console.log("Essence in saved state:", finalRunState.essence)

// Sanity: unequip should also still work (click the now-filled pip
// with nothing selected).
await firstSlotPip.click()
await page.waitForTimeout(300)
const filledAfterUnequip = await page.locator(".hw-panel--squad .hw-item-slot--filled").count()
console.log("Filled item slots after unequip click:", filledAfterUnequip)

const pass =
  essenceAfter !== essenceBefore &&
  stillOnMarketTab &&
  pendingBanner &&
  nowOnSquadTab &&
  filledSlots === 1 &&
  bannerGoneAfterEquip &&
  finalRunState.items[0].equippedTo === setup.benchKey &&
  filledAfterUnequip === 0 &&
  errors.length === 0

console.log("Console/page errors:", JSON.stringify(errors, null, 2))
console.log(pass ? "RESULT: PASS" : "RESULT: FAIL")

await browser.close()
process.exit(pass ? 0 : 1)
