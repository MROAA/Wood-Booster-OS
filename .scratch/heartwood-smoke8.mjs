import { chromium } from "playwright"

const errors = []
const browser = await chromium.launch({ args: ["--no-sandbox"] })
const page = await (await browser.newContext()).newPage()
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })
page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`))

await page.goto("http://localhost:5199/heartwood", { waitUntil: "domcontentloaded" })

const relicCheck = await page.evaluate(async () => {
  const relics = await import("/src/data/heartwood/relics.js?t=" + Date.now())
  return Object.values(relics.RELICS).filter((r) => r.tribeAnchor).map((r) => `${r.id}:${r.tribeAnchor}`)
})
console.log("Tribe-anchor relics:", relicCheck)

await page.click(".hw-enemy-choice >> nth=0")
await page.waitForSelector("text=The Heartwood Market")

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
await page.waitForTimeout(3500)
await page.screenshot({ path: "/tmp/hw-v6-final.png" })

console.log("=== console errors ===")
console.log(errors.length ? errors.join("\n") : "(none)")
await browser.close()
