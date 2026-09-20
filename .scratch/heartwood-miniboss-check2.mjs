import { chromium } from "playwright"

const errors = []
const browser = await chromium.launch({ args: ["--no-sandbox"] })
const page = await (await browser.newContext()).newPage()
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })
page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`))

await page.goto("http://localhost:5199/heartwood", { waitUntil: "domcontentloaded" })
await page.waitForSelector("text=Heartwood", { timeout: 15000 })
await page.click(".hw-enemy-choice >> nth=0")
await page.waitForSelector("text=The Heartwood Market", { timeout: 15000 })

async function recruitCheapest() {
  const cards = page.locator(".hw-panel--market .hw-deck-preview .hw-card")
  const n = await cards.count()
  for (let j = 0; j < n; j++) {
    const c = cards.nth(j)
    if ((await c.getAttribute("data-disabled")) === "false") {
      await c.click()
      await page.waitForTimeout(150)
      return
    }
  }
}

async function leaveShopAndAdvance() {
  await recruitCheapest()
  await page.click("button:has-text('Continue')")
  // Could land on: relic screen, formation screen, or (rarely) victory/defeat
  await page.waitForSelector("text=A relic waits in the roots, text=Take the field", { timeout: 15000 }).catch(() => {})
  if ((await page.locator("text=A relic waits in the roots").count()) > 0) {
    await page.click("button:has-text('Skip')")
    await page.waitForSelector("text=Take the field", { timeout: 15000 })
  }
  const isMinibossPreview = (await page.locator("text=A greater foe").count()) > 0
  await page.click("button:has-text('Start Battle')")
  await page.waitForSelector(".hw-battle", { timeout: 15000 })
  await page.waitForTimeout(300)
  if (isMinibossPreview) {
    console.log("On the miniboss battle screen now.")
    console.log("Elevated banner count:", await page.locator(".hw-elevated-banner").count())
    console.log("Banner text:", await page.locator(".hw-elevated-banner").textContent().catch(() => "(none)"))
    await page.screenshot({ path: "/tmp/hw-miniboss.png" })
  }
  // Let the fight resolve, then continue back to shop.
  await page.waitForSelector("text=Victory, text=Defeat", { timeout: 20000 }).catch(() => {})
  await page.waitForTimeout(300)
  await page.click("button:has-text('Continue')").catch(() => {})
  await page.waitForSelector("text=The Heartwood Market", { timeout: 15000 }).catch(() => {})
  return isMinibossPreview
}

let found = false
for (let i = 0; i < 6 && !found; i++) {
  found = await leaveShopAndAdvance()
}
console.log("Reached the miniboss this run:", found)

console.log("=== console errors ===")
console.log(errors.length ? errors.join("\n") : "(none)")
await browser.close()
