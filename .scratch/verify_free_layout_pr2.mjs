// Live end-to-end test for Free Layout foundation PR 2:
// CommanderSelect.jsx (screenId "commanderSelect") and
// GuildHallScreen.jsx (screenId "guildHall"). Same rigor as the
// Settings pilot (PR #543): default regression, zero-jump edit entry,
// real mouse drag, hide/show, save+reload persistence, reset.
import { chromium } from "playwright"

const PORT = 5187
const BACKEND_PORT = 3025
const browser = await chromium.launch()
const errs = []

async function sectionRects(page, containerSelector) {
  return page.evaluate((sel) => {
    const container = document.querySelector(sel)
    return [...container.children].map((el) => {
      const r = el.getBoundingClientRect()
      return {
        hidden: el.classList.contains("hw-free-layout-section--hidden"),
        x: Math.round(r.x),
        y: Math.round(r.y),
        w: Math.round(r.width),
      }
    })
  }, containerSelector)
}

async function runScreenSuite(label, { openScreen, containerSelector, screenId, sectionCount }) {
  console.log(`\n--- ${label} ---`)

  // 1. Default regression
  {
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } })
    const page = await ctx.newPage()
    page.on("pageerror", (e) => errs.push(`[${label} default] ${e}`))
    await openScreen(page)
    const toolbarVisible = await page.isVisible(".hw-free-layout-toolbar")
    const rects = await sectionRects(page, containerSelector)
    console.log("Toolbar visible:", toolbarVisible, "section count:", rects.length, "expected:", sectionCount)
    await page.close()
  }

  // 2. Zero visual jump + drag + hide + save
  {
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } })
    const page = await ctx.newPage()
    page.on("pageerror", (e) => errs.push(`[${label} edit] ${e}`))
    await openScreen(page)

    const before = await sectionRects(page, containerSelector)
    await page.click("text=Edit Layout")
    await page.waitForTimeout(150)
    const afterEdit = await sectionRects(page, containerSelector)
    const noJump = before.every((s, i) => Math.abs(s.x - afterEdit[i].x) <= 1 && Math.abs(s.y - afterEdit[i].y) <= 1 && s.w === afterEdit[i].w)
    console.log("Zero visual jump entering Edit Layout:", noJump)
    if (!noJump) console.log("  before:", JSON.stringify(before), "\n  after:", JSON.stringify(afterEdit))

    const handle = page.locator(".hw-free-layout-drag-handle").first()
    const box = await handle.boundingBox()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + 60, box.y + 30, { steps: 10 })
    await page.mouse.up()
    await page.waitForTimeout(100)
    const afterDrag = await sectionRects(page, containerSelector)
    console.log("First section moved by:", afterDrag[0].x - afterEdit[0].x, afterDrag[0].y - afterEdit[0].y)

    const hideButtons = page.locator(".hw-free-layout-hide-btn")
    const lastIndex = (await hideButtons.count()) - 1
    await hideButtons.nth(lastIndex).click()
    await page.waitForTimeout(100)
    const afterHide = await sectionRects(page, containerSelector)
    console.log("Last section now marked hidden in edit mode:", afterHide[lastIndex]?.hidden)

    await page.click("text=Save Layout")
    await page.waitForTimeout(400)
    console.log("Editing closed after save:", !(await page.isVisible("text=Save Layout")))
    await page.close()
  }

  // 3. Reload persistence + true no-op re-entry
  {
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } })
    const page = await ctx.newPage()
    page.on("pageerror", (e) => errs.push(`[${label} reload] ${e}`))
    await openScreen(page)
    const rects = await sectionRects(page, containerSelector)
    console.log("After reload - visible section count:", rects.filter((s) => !s.hidden).length, "of", sectionCount)

    const dbRow = await fetch(`http://localhost:${BACKEND_PORT}/api/hearthwood-layout/${screenId}`).then((r) => r.json())
    console.log("DB row:", JSON.stringify(dbRow.positions))

    await page.click("text=Edit Layout")
    await page.waitForTimeout(150)
    const rectsInEdit = await sectionRects(page, containerSelector)
    const visBefore = rects.filter((s) => !s.hidden)
    const visInEdit = rectsInEdit.filter((s) => !s.hidden)
    const trueNoOp = visBefore.every((s, i) => s.x === visInEdit[i].x && s.y === visInEdit[i].y)
    console.log("Re-entering saved layout is a true zero-shift no-op:", trueNoOp)
    await page.close()
  }

  // 4. Reset
  {
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } })
    const page = await ctx.newPage()
    page.on("pageerror", (e) => errs.push(`[${label} reset] ${e}`))
    await openScreen(page)
    await page.click("text=Reset Layout")
    await page.waitForTimeout(400)
    const dbRowAfterReset = await fetch(`http://localhost:${BACKEND_PORT}/api/hearthwood-layout/${screenId}`).then((r) => r.json())
    console.log("DB row after reset (should be {}):", JSON.stringify(dbRowAfterReset.positions))
    await page.close()
    const ctx2 = await browser.newContext({ viewport: { width: 1400, height: 1000 } })
    const page2 = await ctx2.newPage()
    page2.on("pageerror", (e) => errs.push(`[${label} reset-reopen] ${e}`))
    await openScreen(page2)
    const rectsAfterReset = await sectionRects(page2, containerSelector)
    console.log("All visible after reset:", rectsAfterReset.every((s) => !s.hidden), "count:", rectsAfterReset.length)
    await page2.close()
  }
}

// --- Warm up vite ---
{
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" }).catch(() => {})
  await page.waitForTimeout(1500)
  await page.close()
}

await runScreenSuite("CommanderSelect", {
  screenId: "commanderSelect",
  containerSelector: ".hw-commander-select .hw-free-layout-container",
  sectionCount: 3,
  openScreen: async (page) => {
    await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
    await page.evaluate(() => {
      localStorage.removeItem("heartwood-run-save-v1")
      localStorage.setItem("heartwood-autobattler-intro-seen", "true")
    })
    await page.reload({ waitUntil: "domcontentloaded" })
    await page.waitForSelector(".hw-commander-select", { timeout: 8000 })
    await page.waitForTimeout(600)
  },
})

await runScreenSuite("GuildHallScreen", {
  screenId: "guildHall",
  containerSelector: ".hw-guildhall .hw-free-layout-container",
  sectionCount: 4,
  openScreen: async (page) => {
    await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
    await page.evaluate(() => {
      localStorage.removeItem("heartwood-run-save-v1")
      localStorage.setItem("heartwood-autobattler-intro-seen", "true")
      localStorage.setItem("heartwood-story-intro-seen", "true")
    })
    await page.reload({ waitUntil: "domcontentloaded" })
    await page.waitForSelector(".hw-commander-select", { timeout: 8000 })
    await page.click(".hw-commander-card:not([data-locked='true'])")
    await page.waitForTimeout(700) // CONFIRM_DELAY_MS (550ms) before the run actually starts
    await page.waitForSelector(".hw-guildhall", { timeout: 8000 })
    await page.waitForTimeout(600)
  },
})

await browser.close()

console.log("\n=== PAGE ERRORS ===", errs.length)
errs.forEach((e) => console.log(e))
process.exit(errs.length ? 1 : 0)
