// Live UI smoke test for the new "Colors & Theme" Studio panel.
import { chromium } from "playwright"

const PORT = 5178
const browser = await chromium.launch()
const errs = []
const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } })
const page = await ctx.newPage()
page.on("pageerror", (e) => errs.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errs.push(`[console] ${msg.text()}`) })

await page.goto(`http://localhost:${PORT}/hearthwood-studio`, { waitUntil: "domcontentloaded" })
await page.waitForTimeout(800)

await page.locator("button", { hasText: "🎨 Colors & Theme" }).click()
await page.waitForTimeout(800)

const headerText = await page.locator("text=Editing").first().textContent().catch(() => null)
console.log("Header text:", headerText)

const colorSectionCount = await page.locator("text=Colors").count()
const typoSectionCount = await page.locator("text=Typography, spacing & motion").count()
console.log("Colors section header found:", colorSectionCount > 0)
console.log("Typography/spacing/motion section header found:", typoSectionCount > 0)

// Count editable rows (code elements showing a prop name)
const rowCount = await page.locator("code").count()
console.log("Prop-name <code> rows rendered:", rowCount)

// Confirm the second .hw-root block's tokens made it in (the merge fix)
const durRow = await page.locator("code", { hasText: "dur-fast" }).count()
console.log("--hw-dur-fast row present (2nd .hw-root block merged):", durRow > 0)

// Confirm a native color input exists for a hex-valued var like --hw-hp
const colorInputCount = await page.locator('input[type="color"]').count()
console.log("Native color-picker inputs rendered:", colorInputCount)

// Edit one text input (the row whose <code> text is EXACTLY "hp", the
// immediate row wrapper - not a substring/ancestor match).
const hpRow = page.locator("div.flex.items-center.gap-2", { has: page.locator("code", { hasText: /^hp$/ }) }).first()
const hpTextInput = hpRow.locator('input:not([type="color"])').first()
const before = await hpTextInput.inputValue()
console.log("--hw-hp row's current value (expect #b3503f):", before)
await hpTextInput.fill("#e74c3c")
await hpTextInput.blur()
await page.waitForTimeout(300)

const dirtyBadge = await page.locator("text=/\\d+ changed/").count()
console.log("Dirty badge shown after edit:", dirtyBadge > 0)

const previewBtn = page.getByRole("button", { name: /^Preview \d+ change/ })
await previewBtn.click()
await page.waitForTimeout(1000)

const diffVisible = await page.locator("text=hw-hp").count()
const applyBtnCount = await page.locator("button", { hasText: "Confirm and apply" }).count()
console.log("Diff view shows something referencing hw-hp:", diffVisible > 0)
console.log("Confirm and apply button present:", applyBtnCount > 0)

const discardBtn = page.locator("button", { hasText: "Discard" }).first()
await discardBtn.click()
await page.waitForTimeout(300)

await browser.close()

console.log("\n=== PAGE ERRORS ===", errs.length)
errs.forEach((e) => console.log(e))
process.exit(errs.length ? 1 : 0)
