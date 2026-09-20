import { chromium } from "playwright"

const errors = []
const browser = await chromium.launch({ args: ["--no-sandbox"] })
const page = await (await browser.newContext()).newPage()
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })
page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`))

await page.goto("http://localhost:5199/heartwood", { waitUntil: "domcontentloaded" })
await page.click(".hw-enemy-choice >> nth=0")
await page.waitForSelector("text=The Heartwood Market")

// Buy Hexroot Vial and Wraithfang Charm, equip both on the Commander.
for (const name of ["Hexroot Vial", "Wraithfang Charm"]) {
  const item = page.locator(".hw-panel--market .hw-item-card", { hasText: name })
  const disabled = await item.getAttribute("data-disabled")
  console.log(name, "disabled?", disabled)
  if (disabled === "false") {
    await item.click()
    await page.waitForTimeout(150)
  }
}

const bagItems = page.locator(".hw-panel--market ~ .hw-panel--squad .hw-badge, .hw-panel--squad .hw-badge")
// Equip whatever is in the bag onto the Commander's item slots one at a time.
for (let slot = 0; slot < 2; slot++) {
  const bag = page.locator(".hw-panel--squad .hw-badge[style*='cursor']")
  if ((await bag.count()) > 0) {
    await bag.first().click()
    await page.waitForTimeout(100)
    const commanderSlot = page.locator(".hw-item-slots").first().locator(".hw-item-slot").nth(slot)
    await commanderSlot.click()
    await page.waitForTimeout(150)
  }
}
console.log("Bent badge on commander row after equip:", await page.locator(".hw-badge--bent").count())

await page.click("button:has-text('Continue')")
await page.waitForSelector("text=Take the field")
await page.click("button:has-text('Start Battle')")
await page.waitForTimeout(3000)
await page.screenshot({ path: "/tmp/hw-v3-battle.png" })

console.log("=== console errors ===")
console.log(errors.length ? errors.join("\n") : "(none)")
await browser.close()
