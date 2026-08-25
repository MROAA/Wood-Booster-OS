import { chromium } from "playwright"

const PORT = process.env.PORT || 5227

const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForTimeout(500)

await page.click(".hw-select-grid button")
const tutorialNext = page.locator(".hw-tutorial-next")
if (await tutorialNext.isVisible({ timeout: 2000 }).catch(() => false)) await tutorialNext.click().catch(() => {})
await page.waitForTimeout(300)

// Confirm the Items section rendered with real Buy buttons.
const itemCards = page.locator(".hw-item-card")
const itemCount = await itemCards.count()

// Buy the cheapest-looking first item (ember-charm, 2 Essence - starter
// Essence is 3, so this should be affordable).
await itemCards.first().click()
await page.waitForTimeout(200)

const bagBadge = page.locator("text=Your items").first()
const bagVisible = await bagBadge.isVisible().catch(() => false)

// Click the bag item, then click the first empty slot pip on the first
// bench card, and confirm the pip becomes filled.
const slotsBefore = await page.locator(".hw-item-slot--filled").count()
const bagItem = page.locator(".hw-badge", { hasText: "Ember Charm" }).first()
const bagItemVisible = await bagItem.isVisible().catch(() => false)
if (bagItemVisible) {
  await bagItem.click()
  await page.waitForTimeout(150)
  await page.locator(".hw-item-slot").first().click()
  await page.waitForTimeout(200)
}
const slotsAfter = await page.locator(".hw-item-slot--filled").count()

console.log(JSON.stringify({ itemCount, bagVisible, bagItemVisible, slotsBefore, slotsAfter, errors }, null, 2))
await browser.close()

const ok = itemCount >= 4 && bagVisible && bagItemVisible && slotsAfter === slotsBefore + 1

if (errors.length) {
  console.log("FAIL: console/page errors present")
  process.exit(1)
}
if (ok) {
  console.log("PASS: Items section renders with real cards, buying adds to the bag, clicking a bag item then a slot pip equips it")
  process.exit(0)
} else {
  console.log("FAIL", { itemCount, bagVisible, bagItemVisible, slotsBefore, slotsAfter })
  process.exit(1)
}
