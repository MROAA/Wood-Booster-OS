import { chromium } from "playwright"

const errors = []
const browser = await chromium.launch({ args: ["--no-sandbox"] })
const page = await (await browser.newContext()).newPage()
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })
page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`))

await page.goto("http://localhost:5199/heartwood", { waitUntil: "domcontentloaded" })
await page.click(".hw-enemy-choice >> nth=0")
await page.waitForSelector("text=The Heartwood Market")

const item = page.locator(".hw-panel--market .hw-item-card", { hasText: "Hexroot Vial" })
if ((await item.getAttribute("data-disabled")) === "false") {
  await item.click()
  await page.waitForTimeout(150)
}
const bag = page.locator(".hw-panel--squad .hw-badge[style*='cursor']")
if ((await bag.count()) > 0) {
  await bag.first().click()
  await page.waitForTimeout(100)
  await page.locator(".hw-item-slots").first().locator(".hw-item-slot").first().click()
  await page.waitForTimeout(200)
}
console.log("Commander Bent badge present:", await page.locator("text=Bent: support").count())
await page.screenshot({ path: "/tmp/hw-v4-commander-bent.png" })

await page.click("button:has-text('Continue')")
await page.waitForSelector("text=Take the field")
await page.click("button:has-text('Start Battle')")
await page.waitForTimeout(3000)

console.log("=== console errors ===")
console.log(errors.length ? errors.join("\n") : "(none)")
await browser.close()
