// Live smoke test: Quick Edit link now on the Story Cinematic and Act
// Crossroads screens too, without breaking their own click-to-advance
// interactions.
import { chromium } from "playwright"

const PORT = 5186
const browser = await chromium.launch()
const errs = []

// --- 1. Story Cinematic (the intro, shown fresh at nodeIndex 0) ------
{
  const ctx = await browser.newContext({ viewport: { width: 1300, height: 900 } })
  const page = await ctx.newPage()
  page.on("pageerror", (e) => errs.push(`[cinematic] ${e}`))

  await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
  await page.evaluate(async () => {
    const { startRun, serializeRun, RUN_PATH } = await import("/src/services/heartwood/runEngine.js")
    const rs = { ...startRun("tommy", null), nodeIndex: 0, phase: "shop", path: RUN_PATH.slice(0, 1) }
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(rs)))
  })
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.waitForTimeout(600)

  const onCinematic = await page.locator('[data-screen="story-cinematic"]').count()
  console.log("Landed on the story cinematic:", onCinematic > 0)

  const linesBefore = await page.locator(".hw-cinematic-line").count()
  const editBtn = page.locator("button", { hasText: "Edit in Studio" })
  console.log("Cinematic has the Edit-in-Studio trigger:", await editBtn.count() > 0)

  await editBtn.click()
  await page.waitForTimeout(500)

  const overlayOpened = await page.locator("text=Quick Edit").count()
  console.log("Overlay opened for the cinematic:", overlayOpened > 0)

  const linesAfterClick = await page.locator(".hw-cinematic-line").count()
  console.log("Clicking Edit did NOT also advance the cinematic (lines unchanged):", linesAfterClick === linesBefore)

  const titleField = await page.locator("div", { hasText: /^title$/ }).count()
  console.log("Overlay shows the cinematic's title field:", titleField > 0)

  await page.close()
}

// --- 2. Act Crossroads (seed just past the Act 2 boundary) -----------
{
  const ctx = await browser.newContext({ viewport: { width: 1300, height: 900 } })
  const page = await ctx.newPage()
  page.on("pageerror", (e) => errs.push(`[crossroads] ${e}`))

  await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
  await page.evaluate(async () => {
    const { startRun, serializeRun, RUN_PATH, actIndexForNode } = await import("/src/services/heartwood/runEngine.js")
    // Find the first node whose Act is 2 (crossing from Act 1).
    const idx = RUN_PATH.findIndex((_, i) => actIndexForNode(i, RUN_PATH.length) === 2)
    const rs = {
      ...startRun("tommy", null),
      nodeIndex: idx,
      path: RUN_PATH.slice(0, idx + 1),
      phase: "shop",
      lastSeenAct: 1,
    }
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(rs)))
    // Skip the story intro so it doesn't intercept first.
    localStorage.setItem("heartwood-story-intro-seen", "true")
  })
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.waitForTimeout(600)

  const onCrossroads = await page.locator('[data-screen="act-transition"]').count()
  console.log("Landed on the Act Crossroads screen:", onCrossroads > 0)

  const editBtn = page.locator("button", { hasText: "Edit in Studio" })
  console.log("Crossroads has the Edit-in-Studio trigger:", await editBtn.count() > 0)

  await editBtn.click()
  await page.waitForTimeout(500)

  const overlayOpened = await page.locator("text=Quick Edit").count()
  console.log("Overlay opened for the crossroads:", overlayOpened > 0)

  const kickerField = await page.locator("div", { hasText: /^kicker$/ }).count()
  console.log("Overlay shows the crossroads' kicker field:", kickerField > 0)

  await page.close()
}

await browser.close()

console.log("\n=== PAGE ERRORS ===", errs.length)
errs.forEach((e) => console.log(e))
process.exit(errs.length ? 1 : 0)
