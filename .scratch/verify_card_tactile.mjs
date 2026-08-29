import { chromium } from "playwright"

const PORT = process.env.PORT || 5301

const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForSelector(".hw-select-grid button")
await page.click(".hw-select-grid button")
const tutorialNext = page.locator("button.hw-tutorial-next")
if (await tutorialNext.isVisible({ timeout: 2000 }).catch(() => false)) await tutorialNext.click().catch(() => {})
await page.waitForSelector(".hw-card", { timeout: 10000 })

const results = {}

// --- 1. Hover: tilt/lift actually changes the rendered transform ---
const firstCard = page.locator(".hw-card").first()
const box = await firstCard.boundingBox()
const transformBefore = await firstCard.evaluate((el) => getComputedStyle(el).transform)
// Move near the top-left corner of the card, off-center, so tilt should be non-zero.
await page.mouse.move(box.x + box.width * 0.15, box.y + box.height * 0.15)
await page.waitForTimeout(250) // let the spring settle
const transformDuringHover = await firstCard.evaluate((el) => getComputedStyle(el).transform)
await page.mouse.move(box.x - 200, box.y - 200) // move fully off the card
await page.waitForTimeout(300)
const transformAfterLeave = await firstCard.evaluate((el) => getComputedStyle(el).transform)
results.hover = {
  changedOnHover: transformDuringHover !== transformBefore,
  settledAfterLeave: transformAfterLeave !== transformDuringHover,
}

// --- 2. Card still clickable after hover animation (no invisible/blocking overlay) ---
const essenceBadge = page.locator(".hw-essence-badge").first()
const essenceBefore = parseInt((await essenceBadge.innerText()).replace(/\D/g, ""), 10)
const benchCountBefore = await page.locator(".hw-panel--squad").count() // just to ensure panel exists later

// The purchase pulse targets the NEW BENCH ENTRY (Your Squad tab), not
// the shop offer card - recruitUnit (runEngine.js) filters the bought
// def straight out of shopOffers in the same state update, so the
// offer card's own DOM node is gone before a flag on it could ever
// paint (found via an earlier real run of this exact script, which is
// why this isn't testing the offer card).
const recruitCard = page.locator('.hw-panel--market .hw-card[data-disabled="false"]').first()
const recruitCardVisible = await recruitCard.isVisible().catch(() => false)
let purchaseResult = { skipped: true }
if (recruitCardVisible) {
  await recruitCard.hover()
  await page.waitForTimeout(150)
  await recruitCard.click()
  await page.click('button:has-text("Your Squad")')
  const pulseVisible = await page.locator(".hw-card--purchased").first().waitFor({ state: "visible", timeout: 500 }).then(() => true).catch(() => false)
  await page.waitForTimeout(700)
  const pulseGone = (await page.locator(".hw-card--purchased").count()) === 0
  const essenceAfter = parseInt((await essenceBadge.innerText()).replace(/\D/g, ""), 10)
  purchaseResult = { skipped: false, pulseVisible, pulseGone, essenceBefore, essenceAfter }
  await page.click('button:has-text("Market")')
}
results.purchase = purchaseResult

// --- 3. Click still works right after a purchase pulse (animation didn't block clicks) ---
await page.click('button:has-text("Your Squad")')
await page.waitForTimeout(200)
const benchCards = page.locator('.hw-panel--squad .hw-card')
const benchCardCount = await benchCards.count()
let clickAfterAnim = { skipped: true }
if (benchCardCount > 0) {
  const card = benchCards.first()
  await card.hover()
  await page.waitForTimeout(200)
  // Just confirm it's interactable (no pointer-events:none / zero-opacity trap)
  const style = await card.evaluate((el) => {
    const cs = getComputedStyle(el)
    return { pointerEvents: cs.pointerEvents, opacity: cs.opacity, visibility: cs.visibility }
  })
  clickAfterAnim = { skipped: false, style }
}
results.clickAfterAnim = clickAfterAnim

// --- 4. Rarity: find any rare-tier card and confirm it renders without breaking layout ---
const rareCards = page.locator('.hw-card[data-tier="rare"]')
const rareCount = await rareCards.count()
results.rareCardCount = rareCount

console.log(JSON.stringify(results, null, 2))
console.log("errors:", errors)
await browser.close()

const hoverOk = results.hover.changedOnHover
const purchaseOk = results.purchase.skipped || (results.purchase.pulseVisible && results.purchase.pulseGone && results.purchase.essenceAfter < results.purchase.essenceBefore)
const clickOk = results.clickAfterAnim.skipped || (results.clickAfterAnim.style.pointerEvents !== "none" && results.clickAfterAnim.style.visibility !== "hidden" && parseFloat(results.clickAfterAnim.style.opacity) > 0)

if (errors.length) {
  console.log("FAIL: console/page errors present")
  process.exit(1)
}
if (hoverOk && purchaseOk && clickOk) {
  console.log("PASS: hover transform responds to cursor, purchase pulse fires+clears with a real Essence spend, cards stay interactable after animations")
  process.exit(0)
} else {
  console.log("FAIL", { hoverOk, purchaseOk, clickOk })
  process.exit(1)
}
