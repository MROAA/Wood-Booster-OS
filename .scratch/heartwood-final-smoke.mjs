import { chromium } from "playwright"

const errors = []
const browser = await chromium.launch({ args: ["--no-sandbox"] })
const page = await (await browser.newContext()).newPage()
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })
page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`))

await page.goto("http://localhost:5199/heartwood", { waitUntil: "domcontentloaded" })
await page.click(".hw-enemy-choice >> nth=0")
await page.waitForSelector("text=The Heartwood Market")
console.log("Starting essence shown:", await page.locator(".hw-essence-badge").textContent())
await page.click("button:has-text('Continue')")
await page.waitForSelector("text=Take the field")
await page.click("button:has-text('Start Battle')")
await page.waitForTimeout(3000)
await page.screenshot({ path: "/tmp/hw-final-check.png" })

console.log("=== console errors ===")
console.log(errors.length ? errors.join("\n") : "(none)")
await browser.close()
