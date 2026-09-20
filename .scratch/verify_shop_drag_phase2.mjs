// Live end-to-end test for Phase 2: the map (right rail) joins the
// SAME "Edit Layout" mode the left rail's 4 sections already have.
// Confirms: dragging the map does NOT move the left rail (drafts stay
// independent), a REAL Save Layout applies both rails' positions in
// one batch, the map's new position survives a reload, and Reset
// Layout clears BOTH rails back to flow mode.
import { chromium } from "playwright"

const PORT = 5190
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

const mapBefore = await page.locator(".hw-run-rail").boundingBox()
const relicsBefore = await page.locator(".hw-rail-section", { hasText: "Relics" }).boundingBox()
console.log("Map position before Edit Layout:", mapBefore?.x, mapBefore?.y)
console.log("Relics position before Edit Layout:", relicsBefore?.x, relicsBefore?.y)

await page.locator("button", { hasText: "Edit Layout" }).click()
await page.waitForTimeout(300)

// Drag the MAP.
const mapHandle = page.locator(".hw-shop-rail--right .hw-shop-rail-drag-handle")
console.log("Map has its own drag handle:", await mapHandle.count() > 0)
const mapHandleBox = await mapHandle.boundingBox()
await page.mouse.move(mapHandleBox.x + 10, mapHandleBox.y + 10)
await page.mouse.down()
await page.mouse.move(mapHandleBox.x + 60, mapHandleBox.y + 90, { steps: 6 })
await page.mouse.up()
await page.waitForTimeout(200)

const mapAfterDrag = await page.locator(".hw-run-rail").boundingBox()
const relicsAfterMapDrag = await page.locator(".hw-rail-section", { hasText: "Relics" }).boundingBox()
console.log("Map position after dragging it:", mapAfterDrag?.x, mapAfterDrag?.y)
console.log("Relics position UNCHANGED by dragging the map:", Math.abs(relicsAfterMapDrag.x - relicsBefore.x) < 60 && Math.abs(relicsAfterMapDrag.y - relicsBefore.y) < 60)
console.log("Map actually moved:", Math.abs(mapAfterDrag.x - mapBefore.x) > 20 || Math.abs(mapAfterDrag.y - mapBefore.y) > 20)

await page.locator("button", { hasText: "Save Layout" }).click()
await page.waitForTimeout(1000)

const diffMentionsRight = await page.locator("text=rightRailPositions").count()
const diffMentionsLeft = await page.locator("text=leftRailPositions").count()
console.log("Preview diff includes rightRailPositions:", diffMentionsRight > 0)
console.log("Preview diff ALSO includes leftRailPositions (both rails batched):", diffMentionsLeft > 0)

await page.locator("button", { hasText: "Confirm and apply" }).click()
await page.waitForTimeout(1200)

const fs = await import("node:fs")
const onDisk = fs.readFileSync("src/data/heartwood/shopLayout.js", "utf8")
console.log("File has non-empty rightRailPositions:", !onDisk.includes("rightRailPositions: {}"))
console.log("File ALSO has non-empty leftRailPositions:", !onDisk.includes("leftRailPositions: {}"))

await page.reload({ waitUntil: "domcontentloaded" })
await page.waitForTimeout(700)
const mapAfterReload = await page.locator(".hw-run-rail").boundingBox()
console.log("Map position after reload (should match the drag):", mapAfterReload?.x, mapAfterReload?.y)

// Confirm entering Edit Layout again is (still) a visual no-op for the map.
await page.locator("button", { hasText: "Edit Layout" }).click()
await page.waitForTimeout(300)
const mapAfterReenter = await page.locator(".hw-run-rail").boundingBox()
const toolbarHeight = await page.locator(".hw-shop-layout-toolbar").boundingBox()
console.log("Map shift on re-entering Edit Layout (expect ~toolbar height):", (mapAfterReenter.y - mapAfterReload.y).toFixed(1), "toolbar height:", toolbarHeight.height)

// Reset both rails.
await page.locator("button", { hasText: "Reset Layout" }).click()
await page.waitForTimeout(800)
await page.locator("button", { hasText: "Confirm and apply" }).click()
await page.waitForTimeout(1000)

const onDiskAfterReset = fs.readFileSync("src/data/heartwood/shopLayout.js", "utf8")
console.log("After Reset: rightRailPositions back to {}:", onDiskAfterReset.includes("rightRailPositions: {}"))
console.log("After Reset: leftRailPositions back to {}:", onDiskAfterReset.includes("leftRailPositions: {}"))

await page.close()

console.log("\n=== PAGE ERRORS ===", errs.length)
errs.forEach((e) => console.log(e))
process.exit(errs.length ? 1 : 0)
