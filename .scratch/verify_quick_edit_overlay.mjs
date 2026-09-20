// Live end-to-end test: play the game, open the inline Quick Edit
// overlay (no new tab), change the event's body text, apply it for
// real, reload, and confirm the RUNNING GAME now shows the new text.
import { chromium } from "playwright"

const PORT = 5185
const ALL_EVENT_IDS = ["roadside-shrine","hollow-tree","trapped-forager","the-first-milestone","the-snare-line","spacemonkey-warning","still-pool","the-listening-grove","chained-fighter","veil-fragment","the-veil-researcher","the-name-spreads","the-sealed-tree-again","the-crownless-vision","the-throne-road","the-chained-ally-speaks","the-crownless-court","the-echo-of-yourself","the-unmade-road","the-last-clean-water","the-quiet-before","abandoned-camp","the-toll-root","mushroom-ring","the-weeping-stone","the-gambler","the-old-battleground","the-fungus-shrine","the-two-wounded","the-cache"]
const MARKER = " [[quick-edit-live-test]]"

const browser = await chromium.launch()
const errs = []

const ctx = await browser.newContext({ viewport: { width: 1300, height: 950 } })
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

const originalBody = await page.locator(".hw-flavor").first().textContent()
console.log("Original body text on screen:", originalBody?.slice(0, 60), "...")

await page.locator("button", { hasText: "Edit in Studio" }).click()
await page.waitForTimeout(600)

const overlayVisible = await page.locator("text=Quick Edit").count()
console.log("Quick Edit overlay opened:", overlayVisible > 0)

const bodyField = page.locator("textarea, input").filter({ hasText: "" }).first()
// EntityFieldEditor renders `body` as a scalar <input> (string kind) OR complex <textarea> -
// events.js's body is a plain string field, so it's a scalar <input>. Locate by its label.
const bodyLabel = page.locator("div", { hasText: /^body$/ }).first()
const bodyInput = bodyLabel.locator("xpath=following-sibling::input[1]")
const bodyInputCount = await bodyInput.count()
console.log("Found the body field's input:", bodyInputCount > 0)

const currentValue = await bodyInput.inputValue()
await bodyInput.fill(currentValue + MARKER)
await page.waitForTimeout(200)

await page.locator("button", { hasText: /^Preview \d+ change/ }).click()
await page.waitForTimeout(1000)

const diffShowsMarker = await page.locator("text=quick-edit-live-test").count()
console.log("Preview diff shows the marker text:", diffShowsMarker > 0)

await page.locator("button", { hasText: "Confirm and apply" }).click()
await page.waitForTimeout(1200)

const doneButton = page.locator("button", { hasText: "Done" })
console.log("Overlay shows 'Done - reload to see it':", await doneButton.count() > 0)

await doneButton.click()
await page.waitForLoadState("domcontentloaded")
await page.waitForTimeout(800)

const newBody = await page.locator(".hw-flavor").first().textContent()
console.log("Body text on screen AFTER reload includes the marker:", newBody?.includes(MARKER.trim()))

await browser.close()

console.log("\n=== PAGE ERRORS ===", errs.length)
errs.forEach((e) => console.log(e))
process.exit(errs.length ? 1 : 0)
