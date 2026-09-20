import { chromium } from "playwright"

const errors = []
const browser = await chromium.launch({ args: ["--no-sandbox"] })
const page = await (await browser.newContext()).newPage()
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text())
})
page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`))

await page.goto("http://localhost:5199/heartwood", { waitUntil: "domcontentloaded" })
await page.waitForSelector("text=Heartwood", { timeout: 15000 })
await page.screenshot({ path: "/tmp/hw-1-intro.png" })

// Pick the first commander (Tommy)
await page.click(".hw-enemy-choice >> nth=0")
await page.waitForSelector("text=The Heartwood Market", { timeout: 10000 })
await page.screenshot({ path: "/tmp/hw-2-shop.png" })

console.log("=== after entering shop ===")
console.log("Market Level badge present:", await page.locator("text=Market Lv").count())
console.log("Freeze button present:", await page.locator("button:has-text('Freeze')").count())
console.log("Active power button present:", await page.locator("button:has-text('Opening Strike')").count())

// Click Level Up market a couple times if affordable
const levelUpBtn = page.locator("button:has-text('Level Up')")
if ((await levelUpBtn.count()) > 0) {
  await levelUpBtn.first().click()
  await page.waitForTimeout(300)
}

// Click Freeze toggle
await page.locator("button:has-text('Freeze')").click()
await page.waitForTimeout(200)
console.log("Frozen state after click:", await page.locator("text=Frozen").count())

// Try recruiting the first affordable shop unit
const shopCards = page.locator(".hw-panel--market .hw-deck-preview .hw-card")
const shopCount = await shopCards.count()
console.log("shop card count:", shopCount)
for (let i = 0; i < shopCount; i++) {
  const card = shopCards.nth(i)
  const disabled = await card.getAttribute("data-disabled")
  if (disabled === "false") {
    await card.click()
    await page.waitForTimeout(200)
    break
  }
}
await page.screenshot({ path: "/tmp/hw-3-recruited.png" })

// Check tribe icons rendered on a bench card
console.log("tribe icon rows on bench:", await page.locator(".hw-panel--squad .hw-tribe-icons").count())

// Buy a Hero Bending item if affordable and equip it
const bendItem = page.locator(".hw-panel--market .hw-item-card", { hasText: "Wardstitch Cloak" })
if ((await bendItem.count()) > 0) {
  const disabled = await bendItem.getAttribute("data-disabled")
  console.log("Wardstitch Cloak disabled?", disabled)
  if (disabled === "false") {
    await bendItem.click()
    await page.waitForTimeout(200)
    // select it from bag then equip to first bench unit's first slot
    const bagItem = page.locator(".hw-panel--squad .hw-badge", { hasText: "Wardstitch Cloak" })
    if ((await bagItem.count()) > 0) {
      await bagItem.click()
      const firstSlot = page.locator(".hw-panel--squad .hw-item-slot").first()
      await firstSlot.click()
      await page.waitForTimeout(300)
    }
  }
}
await page.screenshot({ path: "/tmp/hw-4-bending.png" })
console.log("Bent badge count:", await page.locator(".hw-badge--bent").count())

// Continue to formation screen
await page.click("button:has-text('Continue')")
await page.waitForSelector("text=Take the field", { timeout: 10000 })
await page.screenshot({ path: "/tmp/hw-5-formation.png" })
console.log("Synergies section present:", await page.locator("text=Synergies").count())

// Start the battle and let it resolve
await page.click("button:has-text('Start Battle')")
await page.waitForTimeout(1500)
await page.screenshot({ path: "/tmp/hw-6-battle.png" })

console.log("=== console errors ===")
console.log(errors.length ? errors.join("\n") : "(none)")

await browser.close()
