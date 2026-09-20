import { chromium } from "playwright"

const errors = []
const browser = await chromium.launch({ args: ["--no-sandbox"] })
const page = await (await browser.newContext()).newPage()
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })
page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`))

await page.goto("http://localhost:5199/heartwood", { waitUntil: "domcontentloaded" })

// Check the item pool now has all 8 bending items via direct module check
const itemCheck = await page.evaluate(async () => {
  const items = await import("/src/data/heartwood/items.js?t=" + Date.now())
  const bending = Object.values(items.ITEMS).filter((i) => i.bendsRoleTo)
  return bending.map((i) => `${i.id}:${i.bendsRoleTo}`)
})
console.log("Bending items:", itemCheck)

await page.click(".hw-enemy-choice >> nth=0")
await page.waitForSelector("text=The Heartwood Market")

// Recruit a couple of units to have a squad, then deploy and fight -
// just checking the AutoBattleView tribe row renders and nothing
// crashes, not exhaustively testing the bending items in this pass
// (already unit-logic-verified via items.js).
for (let i = 0; i < 3; i++) {
  const cards = page.locator(".hw-panel--market .hw-deck-preview .hw-card")
  const n = await cards.count()
  for (let j = 0; j < n; j++) {
    const c = cards.nth(j)
    if ((await c.getAttribute("data-disabled")) === "false") {
      await c.click()
      await page.waitForTimeout(150)
      break
    }
  }
}

await page.click("button:has-text('Continue')")
await page.waitForSelector("text=Take the field")
const benchCards = page.locator(".hw-select-grid.hw-deck-preview .hw-card")
const benchN = await benchCards.count()
const seen = new Set()
for (let i = 0; i < benchN; i++) {
  const c = benchCards.nth(i)
  const title = await c.getAttribute("title")
  if (seen.has(title)) continue
  seen.add(title)
  await c.click()
  await page.waitForTimeout(150)
}

await page.click("button:has-text('Start Battle')")
await page.waitForTimeout(800)
console.log("Tribe badges visible during battle:", await page.locator(".hw-battle .hw-badge").allTextContents())
await page.screenshot({ path: "/tmp/hw-v5-inbattle-synergy.png" })
await page.waitForTimeout(3000)

console.log("=== console errors ===")
console.log(errors.length ? errors.join("\n") : "(none)")
await browser.close()
