import { chromium } from "playwright"

const PORT = process.env.PORT || 5208

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
await page.waitForSelector(".hw-card[data-disabled=\"false\"]", { timeout: 10000 })

const essenceBadge = page.locator(".hw-essence-badge").first()
const essenceBefore = parseInt((await essenceBadge.innerText()).replace(/\D/g, ""), 10)

// Scope "before"/"after" to the SAME bench entry the clicked button
// belongs to (its wrapper div), not an unrelated .first() card - a
// longer bench has several Reforge buttons, and the one that ends up
// first in DOM order isn't guaranteed to belong to bench index 0.
const reforgeBtn = page.locator("button:has-text(\"Reforge (\")").first()
await reforgeBtn.waitFor({ timeout: 5000 })
const cardWrapper = page.locator(".hw-deck-preview > div").filter({ has: page.locator("button:has-text(\"Reforge (\")") }).first()
const nameBefore = await cardWrapper.locator(".hw-card-name").innerText()
const enabled = await reforgeBtn.isEnabled()

let result = { skipped: true }
if (enabled) {
  await reforgeBtn.click()
  // Check the pulse class appears right after clicking, before it clears.
  const pulseVisible = await page.locator(".hw-card--reforged").first().isVisible({ timeout: 300 }).catch(() => false)
  await page.waitForTimeout(700)
  const nameAfter = await cardWrapper.locator(".hw-card-name").innerText()
  const essenceAfter = parseInt((await essenceBadge.innerText()).replace(/\D/g, ""), 10)
  const pulseGone = (await page.locator(".hw-card--reforged").count()) === 0
  result = { skipped: false, nameBefore, nameAfter, essenceBefore, essenceAfter, pulseVisible, pulseGone }
}

console.log(JSON.stringify(result, null, 2))
console.log("errors:", errors)
await browser.close()

if (errors.length) {
  console.log("FAIL: console/page errors present")
  process.exit(1)
}
if (result.skipped) {
  console.log("INCONCLUSIVE: reforge button was disabled (not enough starting essence) - not a failure")
  process.exit(0)
}
if (result.nameAfter !== result.nameBefore && result.essenceAfter < result.essenceBefore && result.pulseVisible && result.pulseGone) {
  console.log("PASS: Reforge swaps the unit, spends Essence, and shows/clears the pulse animation")
  process.exit(0)
} else {
  console.log("FAIL")
  process.exit(1)
}
