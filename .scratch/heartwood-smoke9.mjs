import { chromium } from "playwright"

const errors = []
const browser = await chromium.launch({ args: ["--no-sandbox"] })
const page = await (await browser.newContext()).newPage()
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })
page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`))

await page.goto("http://localhost:5199/heartwood", { waitUntil: "domcontentloaded" })
await page.click(".hw-enemy-choice >> nth=0")
await page.waitForSelector("text=The Heartwood Market")

const cards = page.locator(".hw-panel--market .hw-deck-preview .hw-card")
const n = await cards.count()
for (let j = 0; j < n; j++) {
  const c = cards.nth(j)
  if ((await c.getAttribute("data-disabled")) === "false") {
    await c.click()
    break
  }
}
await page.waitForTimeout(50)
const flash = await page.locator(".hw-essence-badge").evaluate((el) => getComputedStyle(el).animationName)
console.log("Essence badge animation-name right after a spend:", flash)

console.log("=== console errors ===")
console.log(errors.length ? errors.join("\n") : "(none)")
await browser.close()
