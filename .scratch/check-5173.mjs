import { chromium } from "playwright"

const errors = []
const browser = await chromium.launch({ args: ["--no-sandbox"] })
const page = await (await browser.newContext()).newPage()
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })
page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`))

await page.goto("http://localhost:5173/heartwood", { waitUntil: "domcontentloaded" })
await page.click(".hw-enemy-choice >> nth=0")
await page.waitForSelector("text=The Heartwood Market")

// Recruit up to 3 affordable units, same as a real player would.
for (let i = 0; i < 3; i++) {
  const affordable = page.locator(".hw-card[data-disabled=\"false\"]").first()
  if (await affordable.count()) {
    await affordable.click()
    await page.waitForTimeout(150)
  }
}
await page.click("button:has-text('Continue')")
await page.waitForSelector("text=Take the field")

// Deploy every undeployed bench unit, same as verify_full_run.mjs does.
for (let i = 0; i < 4; i++) {
  const undeployed = page.locator(".hw-deck-preview .hw-card[data-selected=\"false\"]").first()
  if (!(await undeployed.count())) break
  await undeployed.click().catch(() => {})
  await page.waitForTimeout(100)
}

const deployedCount = await page.locator("text=/deployed/").textContent()
console.log("Deploy status:", deployedCount)

await page.click("button:has-text('Start Battle')")
await page.waitForSelector(".hw-hint", { timeout: 15000 })
await page.waitForTimeout(3000)

const log = await page.locator(".hw-log").innerText().catch(() => "(log not visible, opening details)")
await page.click("summary:has-text('Battle log')").catch(() => {})
await page.waitForTimeout(200)
const fullLog = await page.locator(".hw-log").innerText().catch(() => "(still not visible)")
console.log("=== battle log ===")
console.log(fullLog)

console.log("=== console errors ===")
console.log(errors.length ? errors.join("\n") : "(none)")

await page.screenshot({ path: "/tmp/hw-5173-battle.png" })
await browser.close()
