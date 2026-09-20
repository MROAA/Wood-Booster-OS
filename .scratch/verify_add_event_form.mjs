// Live UI smoke test for the new "Write a new event" compose form.
import { chromium } from "playwright"

const PORT = 5182
const browser = await chromium.launch()
const errs = []
const ctx = await browser.newContext({ viewport: { width: 1500, height: 1100 } })
const page = await ctx.newPage()
page.on("pageerror", (e) => errs.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errs.push(`[console] ${msg.text()}`) })
page.on("requestfailed", (req) => errs.push(`[requestfailed] ${req.url()} - ${req.failure()?.errorText}`))
page.on("response", (res) => { if (res.status() >= 400) console.log(`[HTTP ${res.status()}]`, res.url()) })

await page.goto(`http://localhost:${PORT}/hearthwood-studio`, { waitUntil: "networkidle" })
await page.waitForTimeout(500)

// Navigate to the "events" type via the flat type picker.
await page.locator("button", { hasText: "Map Events" }).click()
await page.waitForTimeout(500)

const writeBtn = page.locator("button", { hasText: "+ Write a new event" })
console.log("Write-a-new-event button present:", await writeBtn.count() > 0)
await writeBtn.click()
await page.waitForTimeout(300)

await page.locator('input[placeholder*="The Sleeping Root"]').fill("The Test Grove")
await page.getByLabel(/where in the story/).selectOption("5")
await page.locator('textarea[placeholder*="Describe"]').fill("A quiet clearing that wasn't here yesterday.")

const choiceLabels = page.locator('input[placeholder*="Wake it gently"]')
await choiceLabels.nth(0).fill("Step inside.")
const choiceResults = page.locator('textarea[placeholder*="What happens"]')
await choiceResults.nth(0).fill("The clearing closes softly behind you.")
await choiceLabels.nth(1).fill("Walk past.")
await choiceResults.nth(1).fill("You keep walking. The clearing stays where it was.")

await page.locator("button", { hasText: "Preview new event" }).click()
await page.waitForTimeout(1000)

const diffCount = await page.locator("text=The Test Grove").count()
console.log("Preview diff mentions the new event:", diffCount > 0)

const applyBtnCount = await page.locator("button", { hasText: "Confirm and apply" }).count()
console.log("Confirm and apply button present:", applyBtnCount > 0)

await page.locator("button", { hasText: "Discard" }).first().click()
await page.waitForTimeout(300)

await browser.close()

console.log("\n=== PAGE ERRORS ===", errs.length)
errs.forEach((e) => console.log(e))
process.exit(errs.length ? 1 : 0)
