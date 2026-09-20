import { chromium } from "playwright"

const errors = []
const browser = await chromium.launch({ args: ["--no-sandbox"] })
const page = await (await browser.newContext()).newPage()
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })
page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`))

await page.goto("http://localhost:5199/heartwood", { waitUntil: "domcontentloaded" })
await page.click(".hw-enemy-choice >> nth=0")
await page.waitForSelector("text=The Heartwood Market")

// Recruit the first (cheapest, always-affordable) shop offer, twice in a
// row if it re-offers, to try to get 2 of a tribe deployed. Just take
// whatever's cheapest/affordable each time, up to 3 recruits.
for (let i = 0; i < 3; i++) {
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
  if (!clicked) break
}
await page.screenshot({ path: "/tmp/hw-r1-bench.png" })

// Continue to formation and deploy every bench card into a slot.
await page.click("button:has-text('Continue')")
await page.waitForSelector("text=Take the field")
const benchCards = page.locator(".hw-select-grid.hw-deck-preview .hw-card")
const benchN = await benchCards.count()
for (let i = 0; i < benchN; i++) {
  await benchCards.nth(0).click()
  await page.waitForTimeout(150)
}
await page.screenshot({ path: "/tmp/hw-r2-formation.png" })
console.log("Synergies label present:", await page.locator("text=Synergies").count())
console.log("Battlefield tribe badges:", await page.locator(".hw-badge:has-text('Warden'), .hw-badge:has-text('Fang'), .hw-badge:has-text('Root'), .hw-badge:has-text('Grove'), .hw-badge:has-text('Spirit'), .hw-badge:has-text('Thorn')").allTextContents())

await page.click("button:has-text('Start Battle')")
await page.waitForTimeout(2500)
await page.screenshot({ path: "/tmp/hw-r3-battle.png" })

console.log("=== console errors ===")
console.log(errors.length ? errors.join("\n") : "(none)")
await browser.close()
