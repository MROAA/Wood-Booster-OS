// Live UI smoke test: dialogues now appear in the Story Timeline at
// the correct chronological position (inherited from the event that
// triggers them).
import { chromium } from "playwright"

const PORT = 5183
const browser = await chromium.launch()
const realErrs = []
const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } })
const page = await ctx.newPage()
page.on("pageerror", (e) => realErrs.push(String(e)))

await page.goto(`http://localhost:${PORT}/hearthwood-studio`, { waitUntil: "networkidle" })
await page.waitForTimeout(500)

// Dashboard is the default landing view (PR #530) - the Story Timeline
// button lives in the EntityBrowser left panel, only shown in Single/Sheet.
await page.locator("button", { hasText: "Single" }).click()
await page.waitForTimeout(400)

await page.locator("button", { hasText: "📖 Story Timeline" }).click()
await page.waitForTimeout(800)

const dialogueRow = page.locator("button", { hasText: "The Grieving Guardian" }).filter({ has: page.locator("text=Dialogue") })
const dialogueRowCount = await dialogueRow.count()
console.log("Dialogue row found in Story Timeline:", dialogueRowCount)

// Confirm it's grouped under the same Act header as the triggering
// event ("the-grieving-guardian", Act 5), not dumped in "Any point".
const rowsText = await page.locator("body").innerText()
const eventIndex = rowsText.indexOf("The Grieving Guardian\nMap Event")
const dialogueIndex = rowsText.indexOf("Dialogue · grieving-guardian")
const anyPointIndex = rowsText.indexOf("Any point in the story")
console.log("Triggering event row position:", eventIndex, "| dialogue row position:", dialogueIndex, "| 'Any point' bucket starts at:", anyPointIndex)
console.log("Dialogue sits near its triggering event, not in 'Any point':", dialogueIndex > 0 && (anyPointIndex === -1 || dialogueIndex < anyPointIndex))

// Click it to confirm it opens correctly in the detail panel.
await dialogueRow.click()
await page.waitForTimeout(500)
const detailShowsIt = await page.locator("text=grieving-guardian").count()
console.log("Detail panel shows something for the clicked dialogue:", detailShowsIt > 0)

await browser.close()

console.log("\n=== REAL PAGE ERRORS ===", realErrs.length)
realErrs.forEach((e) => console.log(e))
process.exit(realErrs.length ? 1 : 0)
