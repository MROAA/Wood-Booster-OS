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

let found = false
for (let i = 0; i < 8 && !found; i++) {
  console.log("--- round", i, "---")
  // Each iteration may START on the shop OR on a relic-pick screen
  // (relic nodes don't have their own loop step) - handle whichever
  // one is actually showing instead of assuming shop.
  if ((await page.locator("text=A relic waits in the roots").count()) > 0) {
    console.log("relic screen, skipping")
    await page.click("button:has-text('Skip')")
    await page.waitForTimeout(500)
  }
  if ((await page.locator("text=The Heartwood Market").count()) > 0) {
    await recruitCheapest()
    await page.click("button:has-text('Continue')")
    await page.waitForTimeout(500)
  }
  if ((await page.locator("text=A relic waits in the roots").count()) > 0) {
    console.log("relic screen (post-shop), skipping")
    await page.click("button:has-text('Skip')")
    await page.waitForTimeout(500)
  }

  const onFormation = (await page.locator("text=Take the field").count()) > 0
  console.log("on formation screen:", onFormation)
  if (!onFormation) continue

  const isMinibossPreview = (await page.locator("text=A greater foe").count()) > 0
  console.log("is miniboss preview:", isMinibossPreview)
  await page.click("button:has-text('Start Battle')")
  await page.waitForTimeout(500)

  if (isMinibossPreview) {
    const bannerCount = await page.locator(".hw-elevated-banner").count()
    console.log("Elevated banner count:", bannerCount)
    if (bannerCount > 0) console.log("Banner text:", await page.locator(".hw-elevated-banner").first().textContent())
    await page.screenshot({ path: "/tmp/hw-miniboss.png" })
    found = true
  }

  await page.waitForTimeout(3000)
  await page.click("button:has-text('Continue')").catch((e) => console.log("continue click failed:", e.message))
  await page.waitForTimeout(500)
}
console.log("Reached the miniboss this run:", found)

console.log("=== console errors ===")
console.log(errors.length ? errors.join("\n") : "(none)")
await browser.close()
