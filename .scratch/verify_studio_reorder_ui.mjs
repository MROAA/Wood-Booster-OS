// Live UI test: the actual Hearthwood Studio ListFieldEditor move
// up/down buttons work correctly for the new Market Layout type -
// dry-run only (Discard at the end, nothing applied for real).
import { chromium } from "playwright"

const PORT = 5187
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } })
const page = await ctx.newPage()
const errs = []
page.on("pageerror", (e) => errs.push(String(e)))

await page.goto(`http://localhost:${PORT}/hearthwood-studio`, { waitUntil: "networkidle" })
await page.waitForTimeout(500)

await page.locator("button", { hasText: "Single" }).click()
await page.waitForTimeout(300)
await page.locator("button", { hasText: "Market Layout" }).click()
await page.waitForTimeout(500)

// The entity LIST ROW (not the type-picker pill) - EntityBrowser.jsx's
// own row button class, distinct from the pill and the history-list button.
const entityRow = page.locator("button.flex.w-full.items-center.gap-2.rounded-lg", { hasText: "market" }).first()
await entityRow.click()
await page.waitForTimeout(600)

const orderInputs = page.locator("div.space-y-2 input")
const beforeValues = await orderInputs.evaluateAll((els) => els.map((el) => el.value))
console.log("Order before:", beforeValues)

const upButtons = page.locator("button[title='Move up']")
console.log("Move-up buttons present:", await upButtons.count())

// Move the SECOND item up (should swap with the first).
await upButtons.nth(1).click()
await page.waitForTimeout(200)

const afterValues = await orderInputs.evaluateAll((els) => els.map((el) => el.value))
console.log("Order after clicking 2nd item's Move Up:", afterValues)
console.log("First two swapped correctly:", afterValues[0] === beforeValues[1] && afterValues[1] === beforeValues[0])

const dirtyBadge = await page.locator("text=/\\d+ changed/").count()
console.log("Dirty badge shown:", dirtyBadge > 0)

await browser.close()
console.log("\n=== PAGE ERRORS ===", errs.length)
errs.forEach((e) => console.log(e))
process.exit(errs.length ? 1 : 0)
