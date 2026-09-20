import { chromium } from "playwright"

const errors = []
const browser = await chromium.launch({ args: ["--no-sandbox"] })
const page = await (await browser.newContext()).newPage()
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })
page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`))

await page.goto("http://localhost:5199/heartwood", { waitUntil: "domcontentloaded" })
await page.click(".hw-enemy-choice >> nth=0")
await page.waitForSelector("text=The Heartwood Market")

// Freeze and confirm the shop offer cards themselves show the frost overlay/badge.
await page.click("button:has-text('Freeze')")
await page.waitForTimeout(150)
console.log("Frozen offer cards:", await page.locator(".hw-panel--market .hw-deck-preview .hw-card[data-frozen='true']").count())
console.log("Frost badges rendered:", await page.locator(".hw-frost-badge").count())
await page.screenshot({ path: "/tmp/hw-v7-frozen.png" })

// Recruit one unit, deploy, check "next tier" preview text on formation.
const cards = page.locator(".hw-panel--market .hw-deck-preview .hw-card")
const n = await cards.count()
for (let j = 0; j < n; j++) {
  const c = cards.nth(j)
  if ((await c.getAttribute("data-disabled")) === "false") {
    await c.click()
    break
  }
}
await page.click("button:has-text('Continue')")
await page.waitForSelector("text=Take the field")
await page.locator(".hw-select-grid.hw-deck-preview .hw-card").first().click()
await page.waitForTimeout(150)
console.log("Synergy next-tier text present:", await page.locator("text=/for more/").count())
await page.screenshot({ path: "/tmp/hw-v8-nexttier.png" })

console.log("=== console errors ===")
console.log(errors.length ? errors.join("\n") : "(none)")
await browser.close()
