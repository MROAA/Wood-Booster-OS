// Live end-to-end test for Free Layout on the Market tab's own content
// (recruitGrid/shopActions/itemsGrid, screenId "marketTabContent").
// Measures the ACTUAL rendered content inside each wrapper (its
// .hw-market-featured-grid / button row / .hw-market-items-grid),
// per the PR #547 lesson that a wrapper-only check can miss a real
// content-level jump.
import { chromium } from "playwright"

const PORT = 5190
const BACKEND_PORT = 3028
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
  await page.waitForSelector(".hw-panel--market", { timeout: 8000 })
  await page.waitForTimeout(700)
}

function contentRects(page) {
  return page.evaluate(() => {
    const container = document.querySelector(".hw-panel--market .hw-free-layout-container")
    const sel = [".hw-market-featured-grid", "[style*='display: flex']", ".hw-market-items-grid"]
    return [...container.children].map((wrapper) => {
      const content = wrapper.querySelector(".hw-market-featured-grid, .hw-market-items-grid") || wrapper.firstElementChild
      const r = (content || wrapper).getBoundingClientRect()
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width) }
    })
  })
}

// --- Warm up vite ---
{
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" }).catch(() => {})
  await page.waitForTimeout(1500)
  await page.close()
}

// --- 1. Default regression ---
{
  const ctx = await browser.newContext({ viewport: { width: 1860, height: 960 } })
  const page = await ctx.newPage()
  page.on("pageerror", (e) => errs.push(`[default] ${e}`))
  await seedShopRun(page)
  const toolbarVisible = await page.isVisible(".hw-panel--market .hw-free-layout-toolbar")
  const rects = await contentRects(page)
  console.log("Toolbar visible:", toolbarVisible, "block count:", rects.length, "(expect 3)")
  await page.close()
}

// --- 2. Zero-jump (content-level) + drag + save ---
{
  const ctx = await browser.newContext({ viewport: { width: 1860, height: 960 } })
  const page = await ctx.newPage()
  page.on("pageerror", (e) => errs.push(`[edit] ${e}`))
  await seedShopRun(page)

  const before = await contentRects(page)
  await page.click(".hw-panel--market .hw-free-layout-toolbar >> text=Edit Layout")
  await page.waitForTimeout(200)
  const afterEdit = await contentRects(page)
  const noJump = before.every((r, i) => Math.abs(r.x - afterEdit[i].x) <= 1 && Math.abs(r.y - afterEdit[i].y) <= 1 && r.w === afterEdit[i].w)
  console.log("Zero visual jump (actual content) entering Edit Layout:", noJump)
  if (!noJump) console.log("  before:", JSON.stringify(before), "\n  after:", JSON.stringify(afterEdit))

  const handle = page.locator(".hw-panel--market .hw-free-layout-drag-handle").first()
  const box = await handle.boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + 40, box.y + 25, { steps: 10 })
  await page.mouse.up()
  await page.waitForTimeout(100)
  const afterDrag = await contentRects(page)
  console.log("First block moved by:", afterDrag[0].x - afterEdit[0].x, afterDrag[0].y - afterEdit[0].y)

  await page.click(".hw-panel--market .hw-free-layout-toolbar >> text=Save Layout")
  await page.waitForTimeout(400)
  console.log("Editing closed after save:", !(await page.isVisible(".hw-panel--market .hw-free-layout-toolbar >> text=Save Layout")))
  await page.close()
}

// --- 3. Reload persistence + true no-op re-entry + tab-switch safety ---
{
  const ctx = await browser.newContext({ viewport: { width: 1860, height: 960 } })
  const page = await ctx.newPage()
  page.on("pageerror", (e) => errs.push(`[reload] ${e}`))
  await seedShopRun(page)
  const rects = await contentRects(page)

  const dbRow = await fetch(`http://localhost:${BACKEND_PORT}/api/hearthwood-layout/marketTabContent`).then((r) => r.json())
  console.log("DB row:", JSON.stringify(dbRow.positions))

  await page.click(".hw-panel--market .hw-free-layout-toolbar >> text=Edit Layout")
  await page.waitForTimeout(150)
  const rectsInEdit = await contentRects(page)
  const trueNoOp = rects.every((r, i) => r.x === rectsInEdit[i].x && r.y === rectsInEdit[i].y)
  console.log("Re-entering saved layout is a true zero-shift no-op:", trueNoOp)

  // Switch to Squad tab mid-edit, then back - confirm the market scope's
  // draft survives untouched (independent React state, but confirm live).
  // Precise selectors: "text=Market" is ambiguous (also matches the
  // "Market Level" widget label elsewhere on screen).
  await page.click(".hw-squad-tab-btn")
  await page.waitForTimeout(200)
  await page.click(".hw-market-tab-btn")
  await page.waitForTimeout(200)
  const stillEditing = await page.isVisible(".hw-panel--market .hw-free-layout-toolbar >> text=Save Layout")
  const rectsAfterTabSwitch = await contentRects(page)
  const survivedTabSwitch = rects.every((r, i) => r.x === rectsAfterTabSwitch[i].x && r.y === rectsAfterTabSwitch[i].y)
  console.log("Still in edit mode after switching tabs and back:", stillEditing, "- positions unchanged:", survivedTabSwitch)

  await page.click(".hw-panel--market .hw-free-layout-toolbar >> text=Cancel")
  await page.close()
}

// --- 4. Reset ---
{
  const ctx = await browser.newContext({ viewport: { width: 1860, height: 960 } })
  const page = await ctx.newPage()
  page.on("pageerror", (e) => errs.push(`[reset] ${e}`))
  await seedShopRun(page)
  await page.click(".hw-panel--market .hw-free-layout-toolbar >> text=Reset Layout")
  await page.waitForTimeout(400)
  const dbRowAfterReset = await fetch(`http://localhost:${BACKEND_PORT}/api/hearthwood-layout/marketTabContent`).then((r) => r.json())
  console.log("DB row after reset (should be {}):", JSON.stringify(dbRowAfterReset.positions))
  await page.close()

  const ctx2 = await browser.newContext({ viewport: { width: 1860, height: 960 } })
  const page2 = await ctx2.newPage()
  page2.on("pageerror", (e) => errs.push(`[reset-reopen] ${e}`))
  await seedShopRun(page2)
  const rectsFinal = await contentRects(page2)
  console.log("Blocks present after reset:", rectsFinal.length, "(expect 3)")
  await page2.close()
}

await browser.close()

console.log("\n=== PAGE ERRORS ===", errs.length)
errs.forEach((e) => console.log(e))
process.exit(errs.length ? 1 : 0)
