import { chromium } from "playwright"

const errors = []
const browser = await chromium.launch({ args: ["--no-sandbox"] })
const page = await (await browser.newContext()).newPage()
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })
page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`))

await page.goto("http://localhost:5199/heartwood", { waitUntil: "domcontentloaded" })
await page.click(".hw-enemy-choice >> nth=0")
await page.waitForSelector("text=The Heartwood Market")

console.log("Next-fight badge present:", await page.locator("text=Next:").count())

// Recruit 3 of whatever's cheapest/first affordable, to try to trigger
// a Fusion (golden card) and see tribe-match highlighting appear on
// later shop refreshes.
for (let i = 0; i < 5; i++) {
  const cards = page.locator(".hw-panel--market .hw-deck-preview .hw-card")
  const n = await cards.count()
  let clicked = false
  for (let j = 0; j < n; j++) {
    const c = cards.nth(j)
    if ((await c.getAttribute("data-disabled")) === "false") {
      await c.click()
      clicked = true
      await page.waitForTimeout(150)
      break
    }
  }
  if (!clicked) {
    await page.click("button:has-text('Reroll')").catch(() => {})
    await page.waitForTimeout(150)
  }
}
await page.screenshot({ path: "/tmp/hw-v2-bench.png" })
console.log("Golden (data-fused) cards on bench:", await page.locator(".hw-panel--squad .hw-card[data-fused=\"true\"]").count())
console.log("Tribe-match rings in shop:", await page.locator(".hw-panel--market .hw-select-grid.hw-deck-preview .hw-card[data-tribe-match=\"true\"]").count())

console.log("=== console errors ===")
console.log(errors.length ? errors.join("\n") : "(none)")
await browser.close()
