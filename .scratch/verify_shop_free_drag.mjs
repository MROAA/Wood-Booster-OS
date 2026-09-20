// Live end-to-end test for free-drag Market rail layout (Phase 1):
// toggle Edit Layout (visual no-op check), drag a section for real,
// Save Layout with a REAL (non-dry-run) apply, confirm the file on
// disk and the reloaded game both reflect the new position, then
// confirm Reset Layout clears it back to flow mode.
import { chromium } from "playwright"

const PORT = 5189
const browser = await chromium.launch()
const errs = []

async function seedShopRun(page) {
  await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
  await page.evaluate(async () => {
    const { startRun, serializeRun, RUN_PATH } = await import("/src/services/heartwood/runEngine.js")
    const rs = {
      ...startRun("tommy", null),
      nodeIndex: 0,
      phase: "shop",
      path: RUN_PATH.slice(0, 1),
      relics: ["heartsbloom-seed"],
      items: [],
    }
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(rs)))
    localStorage.setItem("heartwood-story-intro-seen", "true")
  })
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.waitForTimeout(700)
}

const ctx = await browser.newContext({ viewport: { width: 1536, height: 864 } })
const page = await ctx.newPage()
page.on("pageerror", (e) => errs.push(String(e)))

await seedShopRun(page)

const relicsSectionBefore = await page.locator(".hw-rail-section", { hasText: "Relics" }).boundingBox()
console.log("Relics section position BEFORE Edit Layout:", relicsSectionBefore?.x, relicsSectionBefore?.y)

const editLayoutBtn = page.locator("button", { hasText: "Edit Layout" })
console.log("Edit Layout button present (dev-only):", await editLayoutBtn.count() > 0)
await editLayoutBtn.click()
await page.waitForTimeout(300)

const relicsSectionAfterToggle = await page.locator(".hw-rail-section", { hasText: "Relics" }).boundingBox()
console.log("Relics section position AFTER entering Edit Layout:", relicsSectionAfterToggle?.x, relicsSectionAfterToggle?.y)
const pixelIdenticalOnToggle =
  Math.abs(relicsSectionBefore.x - relicsSectionAfterToggle.x) < 2 && Math.abs(relicsSectionBefore.y - relicsSectionAfterToggle.y) < 2
console.log("Entering Edit Layout is a visual no-op (within 2px):", pixelIdenticalOnToggle)

// Drag the Relics section's handle by a real mouse sequence.
const handle = page.locator(".hw-shop-rail-drag-handle").nth(2) // ledger, buyback(maybe none), relics order-based - find by proximity instead
const relicsHandle = page.locator(".hw-shop-rail-section-positioned", { hasText: "Relics" }).locator(".hw-shop-rail-drag-handle")
const handleBox = await relicsHandle.boundingBox()
console.log("Found the Relics section's own drag handle:", !!handleBox)

const startX = handleBox.x + handleBox.width / 2
const startY = handleBox.y + handleBox.height / 2
const dx = 120
const dy = 40

await page.mouse.move(startX, startY)
await page.mouse.down()
await page.mouse.move(startX + dx / 2, startY + dy / 2, { steps: 5 })
await page.mouse.move(startX + dx, startY + dy, { steps: 5 })
await page.mouse.up()
await page.waitForTimeout(200)

const relicsSectionAfterDrag = await page.locator(".hw-rail-section", { hasText: "Relics" }).boundingBox()
console.log("Relics section position AFTER dragging:", relicsSectionAfterDrag?.x, relicsSectionAfterDrag?.y)
const dragMoved =
  Math.abs(relicsSectionAfterDrag.x - relicsSectionAfterToggle.x - dx) < 5 && Math.abs(relicsSectionAfterDrag.y - relicsSectionAfterToggle.y - dy) < 5
console.log("Section moved by approximately the dragged delta:", dragMoved)

await page.locator("button", { hasText: "Save Layout" }).click()
await page.waitForTimeout(1000)

const previewShowsPositions = await page.locator("text=leftRailPositions").count()
console.log("Preview diff mentions leftRailPositions:", previewShowsPositions > 0)

await page.locator("button", { hasText: "Confirm and apply" }).click()
await page.waitForTimeout(1200)

// Confirm the write landed on disk.
const fs = await import("node:fs")
const onDisk = fs.readFileSync("src/data/heartwood/shopLayout.js", "utf8")
console.log("File on disk now contains a non-empty leftRailPositions:", !onDisk.includes("leftRailPositions: {}"))

await page.reload({ waitUntil: "domcontentloaded" })
await page.waitForTimeout(700)

const relicsSectionAfterReload = await page.locator(".hw-rail-section", { hasText: "Relics" }).boundingBox()
console.log("Relics section position AFTER reload (should match the saved drag):", relicsSectionAfterReload?.x, relicsSectionAfterReload?.y)

// Now test Reset Layout.
await page.locator("button", { hasText: "Edit Layout" }).click()
await page.waitForTimeout(300)
await page.locator("button", { hasText: "Reset Layout" }).click()
await page.waitForTimeout(800)
await page.locator("button", { hasText: "Confirm and apply" }).click()
await page.waitForTimeout(1000)

const onDiskAfterReset = fs.readFileSync("src/data/heartwood/shopLayout.js", "utf8")
console.log("File on disk after Reset Layout has leftRailPositions back to {}:", onDiskAfterReset.includes("leftRailPositions: {}"))

await page.close()

console.log("\n=== PAGE ERRORS ===", errs.length)
errs.forEach((e) => console.log(e))
process.exit(errs.length ? 1 : 0)
