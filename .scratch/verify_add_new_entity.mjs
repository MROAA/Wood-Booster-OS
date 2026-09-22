// Live end-to-end test for the new "+ Add new" button on Hearthwood
// Studio's entity list: clicking it should auto-select a base entity
// and land directly on its Clone form, ALREADY OPEN (pre-filled id/
// name, not the collapsed "⧉ Clone as new" toggle) - a real, working
// path to create a brand-new unit/enemy/relic/etc, per Marc's own
// complaint that he couldn't find one at all.
import { chromium } from "playwright"

const PORT = 5189
const BACKEND_PORT = 3027
const browser = await chromium.launch()
const errs = []

const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } })
const page = await ctx.newPage()
page.on("pageerror", (e) => errs.push(`${e}`))

await page.goto(`http://localhost:${PORT}/hearthwood-studio`, { waitUntil: "domcontentloaded" })
await page.waitForTimeout(1000)
await page.click("text=Single")
await page.waitForTimeout(500)

// Default type is "enemies" - confirm the button is there and works.
console.log("--- Default type (enemies) ---")
await page.click("text=+ Add new")
await page.waitForTimeout(500)

const cloneHeading = await page.locator("text=/^Clone:/").count()
console.log("Clone form auto-opened (found 'Clone: ...' heading):", cloneHeading > 0)

const idInput = page.locator("label", { hasText: "new id" }).locator("input")
const idValue = await idInput.inputValue().catch(() => null)
console.log("New id field pre-filled with '-copy' suffix:", idValue?.endsWith("-copy"), `(value: "${idValue}")`)

// Do a REAL apply to confirm the whole path genuinely creates a new
// entity, not just opens a form. This worktree is throwaway (this PR
// never touches enemies.js itself), so no cleanup/revert needed.
const previewBtn = page.locator("button", { hasText: "Preview clone" })
await previewBtn.click()
await page.waitForTimeout(700)
const applyBtn = page.locator("button", { hasText: /^Apply|Confirm/ }).first()
const applyVisible = await applyBtn.isVisible().catch(() => false)
console.log("Preview succeeded, an apply/confirm button appeared:", applyVisible)

if (applyVisible) {
  await applyBtn.click()
  await page.waitForTimeout(1500)
  const newIdSlug = idValue
  const check = await fetch(`http://localhost:${BACKEND_PORT}/api/hearthwood-patchbay/entity/enemies/${newIdSlug}`)
  console.log(`Real new entity "${newIdSlug}" now exists via the API:`, check.ok)
}

// Switch type via the tab list, confirm the button re-appears for a
// totally different type too (relics, per Marc's own named example).
console.log("\n--- Switching to relics ---")
await page.click("text=Relics")
await page.waitForTimeout(500)
const relicsAddBtnVisible = await page.isVisible("text=+ Add new")
console.log("Add new button present for Relics too:", relicsAddBtnVisible)

await browser.close()

console.log("\n=== PAGE ERRORS ===", errs.length)
errs.forEach((e) => console.log(e))
process.exit(errs.length ? 1 : 0)
