// Live end-to-end test for the new Free Layout foundation (Stage A),
// piloted on SettingsScreen.jsx. Checks: default regression, entering
// edit mode with zero visual jump, dragging a block, hiding a block,
// saving to the real DB-backed API, reload persistence, re-entering an
// already-saved layout as a true no-op, and reset.
import { chromium } from "playwright"

const PORT = 5184
const BACKEND_PORT = 3022
const browser = await chromium.launch()
const errs = []

async function openSettings(page) {
  await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(500)
  await page.click(".hw-settings-open-btn")
  await page.waitForSelector(".hw-settings", { timeout: 5000 })
  await page.waitForTimeout(600) // let the .hw-screen-fade entrance animation (377ms) fully settle
}

async function groupRects(page) {
  return page.evaluate(() => {
    const groups = [...document.querySelectorAll(".hw-free-layout-container > *")]
    return groups.map((el) => {
      const r = el.getBoundingClientRect()
      return { hidden: el.classList.contains("hw-free-layout-section--hidden"), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }
    })
  })
}

// --- 0. Warm up vite (cold-start timing artifact) ---
{
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" }).catch(() => {})
  await page.waitForTimeout(1200)
  await page.close()
}

// --- 1. Default regression: no saved layout, screen renders normally ---
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } })
  const page = await ctx.newPage()
  page.on("pageerror", (e) => errs.push(`[default] ${e}`))
  await openSettings(page)

  const toolbarVisible = await page.isVisible(".hw-free-layout-toolbar")
  const editBtnVisible = await page.isVisible("text=Edit Layout")
  const before = await groupRects(page)
  console.log("Toolbar visible (DEV mode):", toolbarVisible)
  console.log("Edit Layout button visible:", editBtnVisible)
  console.log("Default group count:", before.length, "all visible:", before.every((g) => !g.hidden))

  await page.close()
}

// --- 2. Enter edit mode: zero visual jump, drag one block, hide one block, save ---
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } })
  const page = await ctx.newPage()
  page.on("pageerror", (e) => errs.push(`[edit] ${e}`))
  await openSettings(page)

  const beforeEdit = await groupRects(page)
  await page.click("text=Edit Layout")
  await page.waitForTimeout(150)
  const afterEdit = await groupRects(page)

  const noJump = beforeEdit.every((g, i) => Math.abs(g.x - afterEdit[i].x) <= 1 && Math.abs(g.y - afterEdit[i].y) <= 1)
  console.log("Zero visual jump entering Edit Layout:", noJump, JSON.stringify(beforeEdit), JSON.stringify(afterEdit))

  // Drag the first group (Audio) by (80, 40) via a real mouse sequence.
  const handle = page.locator(".hw-free-layout-drag-handle").first()
  const handleBox = await handle.boundingBox()
  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2)
  await page.mouse.down()
  await page.mouse.move(handleBox.x + 80, handleBox.y + 40, { steps: 10 })
  await page.mouse.up()
  await page.waitForTimeout(100)

  const afterDrag = await groupRects(page)
  console.log("Audio moved by ~(80,40):", afterDrag[0].x - afterEdit[0].x, afterDrag[0].y - afterEdit[0].y)

  // Hide the 3rd group (Tips).
  const hideButtons = page.locator(".hw-free-layout-hide-btn")
  await hideButtons.nth(2).click()
  await page.waitForTimeout(100)
  const afterHide = await groupRects(page)
  console.log("Tips (index 2) now marked hidden in edit mode:", afterHide[2].hidden)

  // Save for real.
  await page.click("text=Save Layout")
  await page.waitForTimeout(400)
  const doneEditing = !(await page.isVisible("text=Save Layout"))
  console.log("Editing closed after save:", doneEditing)

  await page.close()
}

// --- 3. Reload: confirm persistence (position + hidden survive a real reload) ---
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } })
  const page = await ctx.newPage()
  page.on("pageerror", (e) => errs.push(`[reload] ${e}`))
  await openSettings(page)

  const rects = await groupRects(page)
  console.log("After reload - Tips hidden:", rects[2]?.hidden, "visible group count:", rects.filter((g) => !g.hidden).length)

  const dbRow = await fetch(`http://localhost:${BACKEND_PORT}/api/hearthwood-layout/settings`).then((r) => r.json())
  console.log("DB row after save:", JSON.stringify(dbRow.positions))

  // Re-enter edit mode on an ALREADY-saved layout: true zero-shift no-op.
  await page.click("text=Edit Layout")
  await page.waitForTimeout(150)
  const rectsInEdit = await groupRects(page)
  const visibleBefore = rects.filter((g) => !g.hidden)
  const visibleInEdit = rectsInEdit.filter((g) => !g.hidden)
  const trueNoOp = visibleBefore.every((g, i) => g.x === visibleInEdit[i].x && g.y === visibleInEdit[i].y)
  console.log("Re-entering saved layout is a true zero-shift no-op:", trueNoOp)

  await page.close()
}

// --- 4. Reset: row deleted, screen back to normal default ---
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } })
  const page = await ctx.newPage()
  page.on("pageerror", (e) => errs.push(`[reset] ${e}`))
  await openSettings(page)

  await page.click("text=Reset Layout")
  await page.waitForTimeout(400)

  const dbRowAfterReset = await fetch(`http://localhost:${BACKEND_PORT}/api/hearthwood-layout/settings`).then((r) => r.json())
  console.log("DB row after reset (should be {}):", JSON.stringify(dbRowAfterReset.positions))

  await page.reload({ waitUntil: "domcontentloaded" })
  await page.waitForTimeout(500)
  const rectsAfterReset = await groupRects(page)
  console.log("All visible after reset:", rectsAfterReset.every((g) => !g.hidden), "count:", rectsAfterReset.length)

  await page.close()
}

await browser.close()

console.log("\n=== PAGE ERRORS ===", errs.length)
errs.forEach((e) => console.log(e))
process.exit(errs.length ? 1 : 0)
