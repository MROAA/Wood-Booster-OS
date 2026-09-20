// Live UI smoke test for the new Dashboard + Universal Search.
import { chromium } from "playwright"

const PORT = 5179
const browser = await chromium.launch()
const errs = []
const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } })
const page = await ctx.newPage()
page.on("pageerror", (e) => errs.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errs.push(`[console] ${msg.text()}`) })

await page.goto(`http://localhost:${PORT}/hearthwood-studio`, { waitUntil: "domcontentloaded" })
await page.waitForTimeout(1000)

// Dashboard should be the DEFAULT landing view now.
const dashboardBtnActive = await page.locator("button", { hasText: "🏠 Dashboard" }).getAttribute("class")
console.log("Dashboard button looks active by default:", dashboardBtnActive?.includes("wood-accent"))

const totalLine = await page.locator("text=/\\d+ things across/").first().textContent().catch(() => null)
console.log("Overview total line:", totalLine)

const categoryHeaders = await page.locator("text=Content").count()
console.log("Category header(s) rendered:", categoryHeaders > 0)

// Count type tiles (each has a rounded count badge)
const tileCount = await page.locator("button:has(span.rounded-full.bg-\\[var\\(--wood-card\\)\\])").count()
console.log("Type tiles rendered:", tileCount)

// Universal search
await page.locator('input[placeholder*="Search across all content"]').fill("guardian")
await page.waitForTimeout(700)

const resultRows = await page.locator("button:has-text('The Grieving Guardian')").count()
console.log("Search found 'The Grieving Guardian' rows:", resultRows)

const allResultTexts = await page.locator("span.truncate").allTextContents()
console.log("All result labels visible:", allResultTexts.filter(t => t))

// Click the dialogues result to jump straight to it
const dialogueResult = page.locator("button", { hasText: "The Grieving Guardian" }).last()
await dialogueResult.click()
await page.waitForTimeout(600)

const jumpedToSingle = await page.locator("button", { hasText: "Single" }).getAttribute("class")
console.log("Jumped to Single view after clicking a search result:", jumpedToSingle?.includes("wood-accent"))

const detailHeading = await page.locator(".rounded-xl.border").first().textContent().catch(() => "")
console.log("Detail panel shows something after jump:", detailHeading.length > 0)

// Click a type tile to navigate
await page.locator("button", { hasText: "🏠 Dashboard" }).click()
await page.waitForTimeout(500)
await page.locator("button", { hasText: "Relics" }).first().click()
await page.waitForTimeout(500)

const browsingRelics = await page.locator("button", { hasText: "Relics" }).first().getAttribute("class")
console.log("Navigated to Relics type via dashboard tile:", browsingRelics?.includes("wood-accent"))

await browser.close()

console.log("\n=== PAGE ERRORS ===", errs.length)
errs.forEach((e) => console.log(e))
process.exit(errs.length ? 1 : 0)
