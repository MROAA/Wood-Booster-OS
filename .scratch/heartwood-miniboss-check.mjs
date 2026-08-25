import { chromium } from "playwright"

const errors = []
const browser = await chromium.launch({ args: ["--no-sandbox"] })
const page = await (await browser.newContext()).newPage()
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })
page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`))

await page.goto("http://localhost:5199/heartwood", { waitUntil: "domcontentloaded" })
await page.waitForSelector("text=Heartwood", { timeout: 15000 })
await page.click(".hw-enemy-choice >> nth=0")
await page.waitForSelector("text=The Heartwood Market")

// Loop shop -> formation -> battle a few times until Deepwarden (the
// first miniboss, early in the path) actually plays out, checking the
// battle screen each time for the elevated banner.
let foundMiniboss = false
for (let round = 0; round < 6 && !foundMiniboss; round++) {
  const cards = page.locator(".hw-panel--market .hw-deck-preview .hw-card")
  const n = await cards.count()
  for (let j = 0; j < n; j++) {
    const c = cards.nth(j)
    if ((await c.getAttribute("data-disabled")) === "false") {
      await c.click()
      await page.waitForTimeout(100)
      break
    }
  }
  await page.click("button:has-text('Continue')")
  await page.waitForTimeout(200)
  const onRelic = await page.locator("text=A relic waits in the roots").count()
  if (onRelic > 0) {
    await page.click("button:has-text('Skip')")
    await page.waitForTimeout(200)
  }
  const formationHeading = await page.locator("text=Take the field").count()
  if (formationHeading > 0) {
    const isMinibossPreview = await page.locator("text=A greater foe").count()
    await page.click("button:has-text('Start Battle')")
    await page.waitForTimeout(1000)
    if (isMinibossPreview > 0) {
      console.log("Miniboss banner present in battle:", await page.locator(".hw-elevated-banner").count())
      await page.screenshot({ path: "/tmp/hw-miniboss.png" })
      foundMiniboss = true
    }
    await page.waitForTimeout(2500)
    await page.click("button:has-text('Continue')").catch(() => {})
    await page.waitForTimeout(300)
  }
}
console.log("Reached a miniboss this run:", foundMiniboss)

console.log("=== console errors ===")
console.log(errors.length ? errors.join("\n") : "(none)")
await browser.close()
