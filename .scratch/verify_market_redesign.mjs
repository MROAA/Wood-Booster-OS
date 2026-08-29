import { chromium } from "playwright"

const PORT = process.env.PORT || 5391
const errors = []
const results = {}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
page.on("pageerror", (e) => errors.push(`pageerror: ${e}`))
page.on("console", (msg) => { if (msg.type() === "error") errors.push(`console: ${msg.text()}`) })

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForSelector(".hw-commander-select, .hw-market-columns", { timeout: 15000 })

const commanderCard = page.locator(".hw-commander-card").first()
if (await commanderCard.isVisible({ timeout: 2000 }).catch(() => false)) {
  await commanderCard.click()
  await page.waitForTimeout(900)
}
const tutorialNext = page.locator("button.hw-tutorial-next")
if (await tutorialNext.isVisible({ timeout: 2000 }).catch(() => false)) {
  await tutorialNext.click().catch(() => {})
}
await page.waitForSelector(".hw-market-columns", { timeout: 15000 })

// --- Tab switching ---
await page.locator(".hw-tab-row button", { hasText: "Your Squad" }).click()
await page.waitForTimeout(200)
results.squadTabVisible = await page.locator(".hw-panel--squad").isVisible()
await page.locator(".hw-tab-row button", { hasText: "Market" }).click()
await page.waitForTimeout(200)
results.marketTabVisible = await page.locator(".hw-panel--market").isVisible()

// --- Essence before ---
results.essenceBefore = await page.locator(".hw-essence-value").innerText()

// --- Reroll ---
const rerollBtn = page.locator("button", { hasText: /^Reroll/ })
await rerollBtn.click()
await page.waitForTimeout(300)
results.essenceAfterReroll = await page.locator(".hw-essence-value").innerText()
results.flashClassSeen = await page.locator(".hw-essence-display[data-flash]").count() // may be 0 if already faded

// --- Freeze toggle ---
const freezeBtn = page.locator("button", { hasText: /Freeze|Frozen/ })
await freezeBtn.click()
await page.waitForTimeout(200)
results.freezeActive = await freezeBtn.getAttribute("data-active")
await freezeBtn.click()
await page.waitForTimeout(200)
results.freezeInactiveAgain = await freezeBtn.getAttribute("data-active")

// --- Recruit a unit (first affordable offer card) ---
const offerCards = page.locator(".hw-market-featured-grid .hw-card")
const offerCount = await offerCards.count()
results.offerCount = offerCount
let recruited = false
for (let i = 0; i < offerCount; i++) {
  const card = offerCards.nth(i)
  const disabled = await card.getAttribute("data-disabled")
  if (disabled !== "true") {
    await card.click()
    recruited = true
    break
  }
}
results.recruitClicked = recruited
await page.waitForTimeout(400)
results.essenceAfterRecruit = await page.locator(".hw-essence-value").innerText()

await page.locator(".hw-tab-row button", { hasText: "Your Squad" }).click()
await page.waitForTimeout(300)
results.benchCountAfterRecruit = await page.locator(".hw-panel--squad .hw-select-grid .hw-card").count()

// --- Buy an item ---
await page.locator(".hw-tab-row button", { hasText: "Market" }).click()
await page.waitForTimeout(200)
const itemCards = page.locator(".hw-panel--market .hw-select-grid.hw-deck-preview:not(.hw-market-featured-grid) .hw-card")
const itemCount = await itemCards.count()
results.itemOfferCount = itemCount
let itemBought = false
for (let i = 0; i < itemCount; i++) {
  const card = itemCards.nth(i)
  const disabled = await card.getAttribute("data-disabled")
  if (disabled !== "true") {
    await card.click()
    itemBought = true
    break
  }
}
results.itemBought = itemBought
await page.waitForTimeout(300)
results.pendingBannerVisible = await page.locator(".hw-hint--pending").isVisible().catch(() => false)

// --- Equip the bought item onto a bench unit's slot ---
if (itemBought) {
  const goToSquad = page.locator(".hw-hint-cancel", { hasText: "Go to Your Squad" })
  if (await goToSquad.isVisible({ timeout: 1000 }).catch(() => false)) {
    await goToSquad.click()
  } else {
    await page.locator(".hw-tab-row button", { hasText: "Your Squad" }).click()
  }
  await page.waitForTimeout(300)
  const emptySlot = page.locator(".hw-panel--squad .hw-item-slot:not(.hw-item-slot--filled)").first()
  if (await emptySlot.isVisible({ timeout: 1000 }).catch(() => false)) {
    await emptySlot.click()
    await page.waitForTimeout(400)
    results.slotFilledAfterEquip = await page.locator(".hw-panel--squad .hw-item-slot--filled").count()
  }
}

// --- Scroll-fit check ---
results.fit = await page.evaluate(() => ({
  bodyScrollHeight: document.body.scrollHeight,
  viewportHeight: window.innerHeight,
}))

// --- Continue ---
await page.locator("button.hw-end-turn", { hasText: "Continue" }).click()
await page.waitForTimeout(600)
results.leftShopScreen = !(await page.locator(".hw-market-columns").isVisible().catch(() => false))

results.errors = errors
console.log(JSON.stringify(results, null, 2))
await page.screenshot({ path: ".scratch/shots/after-continue.png" })
await browser.close()
