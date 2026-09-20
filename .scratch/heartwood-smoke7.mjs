import { chromium } from "playwright"

const errors = []
const browser = await chromium.launch({ args: ["--no-sandbox"] })
const page = await (await browser.newContext()).newPage()
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })
page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`))

await page.goto("http://localhost:5199/heartwood", { waitUntil: "domcontentloaded" })
await page.click(".hw-enemy-choice >> nth=0")
await page.waitForSelector("text=The Heartwood Market")

console.log("hw-section-fade-in elements in shop:", await page.locator(".hw-section-fade-in").count())

// Trigger a Bent badge and confirm it animates via computed style (has
// a non-'none' animation-name), not just that it exists.
const item = page.locator(".hw-panel--market .hw-item-card", { hasText: "Wardstitch Cloak" })
if ((await item.getAttribute("data-disabled")) === "false") {
  await item.click()
  await page.waitForTimeout(150)
  const bag = page.locator(".hw-panel--squad .hw-badge[style*='cursor']")
  if ((await bag.count()) > 0) {
    await bag.first().click()
    await page.waitForTimeout(100)
    await page.locator(".hw-item-slots").first().locator(".hw-item-slot").first().click()
    await page.waitForTimeout(150)
  }
}
const bentAnim = await page.locator(".hw-badge--bent").first().evaluate((el) => getComputedStyle(el).animationName).catch(() => "none")
console.log("Bent badge animation-name:", bentAnim)

const freezeBtn = page.locator("button:has-text('Freeze')")
await freezeBtn.click()
await page.waitForTimeout(100)
const freezeAnim = await page.locator("button[data-active='true']").first().evaluate((el) => getComputedStyle(el).animationName).catch(() => "none")
console.log("Freeze active-button animation-name:", freezeAnim)

console.log("=== console errors ===")
console.log(errors.length ? errors.join("\n") : "(none)")
await browser.close()
