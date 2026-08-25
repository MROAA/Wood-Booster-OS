import { chromium } from "playwright"

const errors = []
const browser = await chromium.launch({ args: ["--no-sandbox"] })
const page = await (await browser.newContext()).newPage()
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })
page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`))

await page.goto("http://localhost:5199/heartwood", { waitUntil: "domcontentloaded" })
await page.click(".hw-enemy-choice >> nth=0")
await page.waitForSelector("text=The Heartwood Market")

// Recruit a Stoneheart-tribe-adjacent unit (Warden) if available, then
// push through shop -> formation -> battle -> shop -> ... until a
// relic node appears (4th battle per RUN_PATH), checking for crashes
// the whole way.
for (let round = 0; round < 5; round++) {
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
  const relicHeading = page.locator("text=A relic waits in the roots")
  if (await relicHeading.count() > 0) {
    console.log(`Reached relic node after ${round + 1} shop visit(s)`)
    break
  }
  await page.waitForSelector("text=Take the field")
  await page.click("button:has-text('Start Battle')")
  await page.waitForTimeout(3000)
  const continueBtn = page.locator("button:has-text('Continue')")
  await continueBtn.click({ timeout: 5000 }).catch(() => {})
  await page.waitForTimeout(300)
}

const onRelicScreen = await page.locator("text=A relic waits in the roots").count()
console.log("On relic screen:", onRelicScreen > 0)
if (onRelicScreen > 0) {
  console.log("Relic cards rendered:", await page.locator(".hw-select-grid.hw-deck-preview .hw-card").count())
  console.log("Tribe-match relic cards:", await page.locator(".hw-card[data-tribe-match='true']").count())
}

console.log("=== console errors ===")
console.log(errors.length ? errors.join("\n") : "(none)")
await browser.close()
