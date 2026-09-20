// Live UI smoke test for the new "Write a new dialogue" compose form.
import { chromium } from "playwright"

const PORT = 5188
const browser = await chromium.launch()
const errs = []
const ctx = await browser.newContext({ viewport: { width: 1500, height: 1100 } })
const page = await ctx.newPage()
page.on("pageerror", (e) => errs.push(String(e)))

await page.goto(`http://localhost:${PORT}/hearthwood-studio`, { waitUntil: "networkidle" })
await page.waitForTimeout(500)

await page.locator("button", { hasText: "Single" }).click()
await page.waitForTimeout(300)
await page.locator("button", { hasText: "Dialogues" }).click()
await page.waitForTimeout(500)

const writeBtn = page.locator("button", { hasText: "+ Write a new dialogue" })
console.log("Write-a-new-dialogue button present:", await writeBtn.count() > 0)
await writeBtn.click()
await page.waitForTimeout(300)

await page.locator('input[placeholder*="The Mosswarden"]').fill("The Test Sprite")
await page.locator('textarea[placeholder*="How the conversation begins"]').fill("It flickers into being, mid-sentence.")

const qLabels = page.locator('input[placeholder*="Why are you here"]')
await qLabels.nth(0).fill("What are you?")
const aBoxes = page.locator('textarea[placeholder*="answer"]')
await aBoxes.nth(0).fill("A question, mostly.")
await qLabels.nth(1).fill("Can you help me?")
await aBoxes.nth(1).fill("Already have.")

await page.locator("button", { hasText: "Preview new dialogue" }).click()
await page.waitForTimeout(1000)

const diffMentionsNpc = await page.locator("text=The Test Sprite").count()
console.log("Preview diff mentions the new NPC:", diffMentionsNpc > 0)

const applyBtnCount = await page.locator("button", { hasText: "Confirm and apply" }).count()
console.log("Confirm and apply button present:", applyBtnCount > 0)

await page.locator("button", { hasText: "Discard" }).first().click()
await page.waitForTimeout(300)

await browser.close()

console.log("\n=== PAGE ERRORS ===", errs.length)
errs.forEach((e) => console.log(e))
process.exit(errs.length ? 1 : 0)
