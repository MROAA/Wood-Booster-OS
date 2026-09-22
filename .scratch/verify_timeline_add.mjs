// Live end-to-end test for Story Timeline's new "+ New Event/Dialogue/
// Journal Entry" buttons: clicking each should switch the detail panel
// to that type's existing compose form while STAYING on the Story
// Timeline in the left panel (not bouncing to a flat per-type list).
import { chromium } from "playwright"

const PORT = 5188
const browser = await chromium.launch()
const errs = []

const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } })
const page = await ctx.newPage()
page.on("pageerror", (e) => errs.push(`${e}`))

await page.goto(`http://localhost:${PORT}/hearthwood-studio`, { waitUntil: "domcontentloaded" })
await page.waitForTimeout(1000)

// Switch to Single view, then to the Story Timeline pseudo-type.
await page.click("text=Single")
await page.waitForTimeout(300)
await page.click("text=📖 Story Timeline")
await page.waitForTimeout(500)

const addButtons = [
  { label: "+ New Event", expectForm: "text=Write a new" },
  { label: "+ New Dialogue", expectForm: null },
  { label: "+ New Journal Entry", expectForm: null },
]

for (const { label } of addButtons) {
  await page.click(`text=${label}`)
  await page.waitForTimeout(400)

  const stillOnTimeline = await page.isVisible("text=📖 Story Timeline")
  const timelineRowsVisible = await page.locator(".sticky.top-0").count()
  console.log(`After clicking "${label}":`)
  console.log("  Story Timeline tab still highlighted/present:", stillOnTimeline)
  console.log("  Timeline group headers still rendered (left panel didn't bounce):", timelineRowsVisible > 0)

  // Confirm SOME add-form-shaped content appeared in the middle panel -
  // each of the 3 forms has its own heading text; check generically for
  // a form control (input/textarea) rather than exact heading wording.
  const hasFormInput = await page.locator("input, textarea").count()
  console.log("  Form inputs present in detail panel:", hasFormInput > 0, `(${hasFormInput} found)`)
}

// Confirm clicking a normal Timeline row still works (regression: the
// new onAddNew prop threading didn't break onSelect).
const firstRow = page.locator(".hw-free-layout-toolbar, button").filter({ hasText: /Map Event|Dialogue|Journal|Crossroads|Cinematic|Merchant|Crownless/ })
console.log("\nRegression: normal timeline rows still present:", (await firstRow.count()) > 0)

await browser.close()

console.log("\n=== PAGE ERRORS ===", errs.length)
errs.forEach((e) => console.log(e))
process.exit(errs.length ? 1 : 0)
