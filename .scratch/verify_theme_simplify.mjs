// Live UI smoke test for the simplified Colors & Theme panel.
import { chromium } from "playwright"

const PORT = 5181
const browser = await chromium.launch()
const errs = []
const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } })
const page = await ctx.newPage()
page.on("pageerror", (e) => errs.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errs.push(`[console] ${msg.text()}`) })

await page.goto(`http://localhost:${PORT}/hearthwood-studio`, { waitUntil: "networkidle" })
await page.waitForTimeout(500)

await page.locator("button", { hasText: "🎨 Colors & Theme" }).click()
await page.waitForTimeout(600)

// No raw CSS variable names should be visible by default.
const codeElementsVisible = await page.locator("code").count()
console.log("Raw <code> (CSS var name) elements visible by default:", codeElementsVisible, "(expect 0)")

const swatchCount = await page.locator('input[type="color"]').count()
console.log("Color swatches shown by default:", swatchCount, "(expect 8)")

const labels = await page.locator("label span").allTextContents()
console.log("Swatch labels:", labels)

const advancedToggle = page.locator("button", { hasText: "Show advanced options" })
const advancedToggleCount = await advancedToggle.count()
console.log("Advanced toggle present:", advancedToggleCount > 0)

// Click one swatch's color input directly - React wraps the native
// value setter to track real changes, so a plain `el.value = x` is
// invisible to it; use the native prototype setter directly (the
// standard React+Playwright workaround) then dispatch "input".
const firstSwatch = page.locator('input[type="color"]').first()
await firstSwatch.evaluate((el) => {
  const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set
  nativeSetter.call(el, "#e74c3c")
  el.dispatchEvent(new Event("input", { bubbles: true }))
})
await page.waitForTimeout(300)

const dirtyBadge = await page.locator("text=/\\d+ changed/").count()
console.log("Dirty badge shown after changing a swatch:", dirtyBadge > 0)

const previewBtn = page.getByRole("button", { name: /^Preview \d+ change/ })
await previewBtn.click()
await page.waitForTimeout(1000)

const applyBtnCount = await page.locator("button", { hasText: "Confirm and apply" }).count()
console.log("Confirm and apply button present after preview:", applyBtnCount > 0)

await page.locator("button", { hasText: "Discard" }).first().click()
await page.waitForTimeout(300)

// Now expand advanced and confirm the old technical rows still exist there.
await page.locator("button", { hasText: "Show advanced options" }).click()
await page.waitForTimeout(300)
const advancedCodeCount = await page.locator("code").count()
console.log("Raw CSS var rows visible after expanding Advanced:", advancedCodeCount, "(expect > 0)")

await browser.close()

console.log("\n=== PAGE ERRORS ===", errs.length)
errs.forEach((e) => console.log(e))
process.exit(errs.length ? 1 : 0)
