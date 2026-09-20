import { chromium } from "playwright"

const errors = []
const browser = await chromium.launch({ args: ["--no-sandbox"] })
const page = await (await browser.newContext()).newPage()
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })
page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`))

await page.goto("http://localhost:5199/heartwood", { waitUntil: "domcontentloaded" })
await page.waitForSelector("text=Heartwood", { timeout: 15000 })
await page.waitForTimeout(300)

// Direct engine check: roll the item shop many times, confirm size and
// the guaranteed-Bending-slot invariant hold every time.
const rollCheck = await page.evaluate(async () => {
  const t = Date.now()
  const engine = await import("/src/services/heartwood/runEngine.js?t=" + t)
  const itemsMod = await import("/src/data/heartwood/items.js?t=" + t)
  const { ITEMS } = itemsMod
  const results = []
  for (let i = 0; i < 30; i++) {
    const run = engine.startRun("tommy")
    const offers = run.itemOffers.map((id) => ITEMS[id])
    results.push({ size: offers.length, hasBending: offers.some((d) => d.bendsRoleTo), ids: run.itemOffers })
  }
  return results
})
const sizes = new Set(rollCheck.map((r) => r.size))
const missingBending = rollCheck.filter((r) => !r.hasBending)
console.log("Offer sizes seen:", [...sizes])
console.log("Rolls missing a Bending item:", missingBending.length, "/", rollCheck.length)

// Real UI click-through.
await page.click(".hw-enemy-choice >> nth=0")
await page.waitForSelector("text=The Heartwood Market")
console.log("Item cards rendered in shop:", await page.locator(".hw-panel--market .hw-item-card").count())
console.log("Bends badges rendered:", await page.locator(".hw-item-card .hw-badge--bent").count())
await page.screenshot({ path: "/tmp/hw-itemshop.png" })

console.log("=== console errors ===")
console.log(errors.length ? errors.join("\n") : "(none)")
await browser.close()
