// Live smoke test: playing the game, hitting an event and its
// dialogue, clicking "Edit in Studio" opens a new tab deep-linked
// straight to that exact entity in Hearthwood Studio.
import { chromium } from "playwright"

const PORT = 5184
const ALL_EVENT_IDS = ["roadside-shrine","hollow-tree","trapped-forager","the-first-milestone","the-snare-line","spacemonkey-warning","still-pool","the-listening-grove","chained-fighter","veil-fragment","the-veil-researcher","the-name-spreads","the-sealed-tree-again","the-crownless-vision","the-throne-road","the-chained-ally-speaks","the-crownless-court","the-echo-of-yourself","the-unmade-road","the-last-clean-water","the-quiet-before","abandoned-camp","the-toll-root","mushroom-ring","the-weeping-stone","the-gambler","the-old-battleground","the-fungus-shrine","the-two-wounded","the-cache"]

const browser = await chromium.launch()
const errs = []

const ctx = await browser.newContext({ viewport: { width: 1300, height: 900 } })
const page = await ctx.newPage()
page.on("pageerror", (e) => errs.push(`[game] ${e}`))

await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })

const seenEvents = ALL_EVENT_IDS.filter((id) => id !== "the-grieving-guardian")
await page.evaluate(async ({ seenEvents }) => {
  const { startRun, serializeRun, RUN_PATH } = await import("/src/services/heartwood/runEngine.js")
  const idx = RUN_PATH.findIndex((n) => n.type === "event")
  const rs = { ...startRun("tommy", null), nodeIndex: idx, path: RUN_PATH.slice(0, idx + 1), phase: "event", seenEvents }
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(rs)))
}, { seenEvents })
await page.reload({ waitUntil: "domcontentloaded" })
await page.waitForTimeout(500)

// The event screen's own edit link.
const eventEditLink = page.locator("a", { hasText: "Edit in Studio" })
console.log("Event screen has an Edit-in-Studio link:", await eventEditLink.count() > 0)
const eventHref = await eventEditLink.getAttribute("href")
console.log("Event link href:", eventHref)

const [studioPage1] = await Promise.all([
  ctx.waitForEvent("page"),
  eventEditLink.click(),
])
await studioPage1.waitForLoadState("domcontentloaded")
await studioPage1.waitForTimeout(1000)
const studio1Text = await studioPage1.locator("body").innerText()
console.log("Studio (from event link) shows the right entity name:", studio1Text.includes("The Grieving Guardian"))
console.log("Studio (from event link) landed on Single view:", studio1Text.includes("Clone: The Grieving Guardian") || studio1Text.includes("Clone as new"))
await studioPage1.close()

// Now walk into the dialogue and check ITS edit link.
await page.locator(".hw-move-btn", { hasText: "Talk to it." }).click()
await page.waitForTimeout(400)

const dialogueEditLink = page.locator("a", { hasText: "Edit in Studio" })
console.log("Dialogue screen has an Edit-in-Studio link:", await dialogueEditLink.count() > 0)
const dialogueHref = await dialogueEditLink.getAttribute("href")
console.log("Dialogue link href:", dialogueHref)

const [studioPage2] = await Promise.all([
  ctx.waitForEvent("page"),
  dialogueEditLink.click(),
])
await studioPage2.waitForLoadState("domcontentloaded")
await studioPage2.waitForTimeout(1000)
const studio2Text = await studioPage2.locator("body").innerText()
console.log("Studio (from dialogue link) shows the right entity:", studio2Text.includes("The Grieving Guardian"))
await studioPage2.close()

await browser.close()

console.log("\n=== PAGE ERRORS ===", errs.length)
errs.forEach((e) => console.log(e))
process.exit(errs.length ? 1 : 0)
