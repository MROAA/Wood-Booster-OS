// Live end-to-end test for Free Layout foundation PR 4: the run map's
// top-strip mode, wired into HeartwoodBattle.jsx's changeCharacterBar
// (screenId "runMapStrip", single key "strip"). Same rigor as prior
// PRs, plus an explicit gap/margin regression check since this PR
// introduces a NEW wrapping div between .hw-root and its previously-
// unwrapped utilityBar/RunMap children.
import { chromium } from "playwright"

const PORT = 5187
const BACKEND_PORT = 3025
const browser = await chromium.launch()
const errs = []

async function openScreen(page) {
  await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
  await page.evaluate(async () => {
    const { startRun, serializeRun, RUN_PATH } = await import("/src/services/heartwood/runEngine.js")
    const rs = { ...startRun("tommy", null), nodeIndex: 0, phase: "choice", path: RUN_PATH.slice(0, 1) }
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(rs)))
    localStorage.setItem("heartwood-story-intro-seen", "true")
    localStorage.setItem("heartwood-autobattler-intro-seen", "true")
  })
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.waitForSelector(".hw-free-layout-container", { timeout: 8000 })
  await page.waitForTimeout(700)
}

function rect(page, sel) {
  return page.evaluate((s) => {
    const el = document.querySelector(s)
    return el ? el.getBoundingClientRect().toJSON() : null
  }, sel)
}

// --- Warm up vite ---
{
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" }).catch(() => {})
  await page.waitForTimeout(1500)
  await page.close()
}

// --- 1. Default regression + gap/spacing check against utilityBar ---
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } })
  const page = await ctx.newPage()
  page.on("pageerror", (e) => errs.push(`[default] ${e}`))
  await openScreen(page)
  const toolbarVisible = await page.isVisible(".hw-free-layout-toolbar")
  const utilityRect = await rect(page, ".hw-utility-bar")
  const mapRect = await rect(page, ".hw-run-map")
  console.log("Toolbar visible:", toolbarVisible)
  console.log("utilityBar rect:", JSON.stringify(utilityRect))
  console.log("RunMap rect:", JSON.stringify(mapRect))
  console.log("Gap between utilityBar bottom and RunMap top:", mapRect.top - utilityRect.bottom)
  await page.close()
}

// --- 2. Zero visual jump + drag + hide + save ---
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } })
  const page = await ctx.newPage()
  page.on("pageerror", (e) => errs.push(`[edit] ${e}`))
  await openScreen(page)

  const before = await rect(page, ".hw-run-map")
  await page.click("text=Edit Layout")
  await page.waitForTimeout(150)
  const afterEdit = await rect(page, ".hw-run-map")
  const noJump = Math.abs(before.x - afterEdit.x) <= 1 && Math.abs(before.y - afterEdit.y) <= 1 && Math.round(before.width) === Math.round(afterEdit.width)
  console.log("Zero visual jump entering Edit Layout:", noJump)
  if (!noJump) console.log("  before:", JSON.stringify(before), "\n  after:", JSON.stringify(afterEdit))

  const handle = page.locator(".hw-free-layout-drag-handle").first()
  const box = await handle.boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + 60, box.y + 30, { steps: 10 })
  await page.mouse.up()
  await page.waitForTimeout(100)
  const afterDrag = await rect(page, ".hw-run-map")
  console.log("Map moved by:", afterDrag.x - afterEdit.x, afterDrag.y - afterEdit.y)

  await page.click("text=Save Layout")
  await page.waitForTimeout(400)
  console.log("Editing closed after save:", !(await page.isVisible("text=Save Layout")))
  await page.close()
}

// --- 3. Reload persistence + true no-op re-entry ---
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } })
  const page = await ctx.newPage()
  page.on("pageerror", (e) => errs.push(`[reload] ${e}`))
  await openScreen(page)
  const rectAfterReload = await rect(page, ".hw-run-map")
  console.log("Map rect after reload:", JSON.stringify(rectAfterReload))

  const dbRow = await fetch(`http://localhost:${BACKEND_PORT}/api/hearthwood-layout/runMapStrip`).then((r) => r.json())
  console.log("DB row:", JSON.stringify(dbRow.positions))

  await page.click("text=Edit Layout")
  await page.waitForTimeout(150)
  const rectInEdit = await rect(page, ".hw-run-map")
  const trueNoOp = rectAfterReload.x === rectInEdit.x && rectAfterReload.y === rectInEdit.y
  console.log("Re-entering saved layout is a true zero-shift no-op:", trueNoOp)
  await page.close()
}

// --- 4. Reset ---
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } })
  const page = await ctx.newPage()
  page.on("pageerror", (e) => errs.push(`[reset] ${e}`))
  await openScreen(page)
  await page.click("text=Reset Layout")
  await page.waitForTimeout(400)
  const dbRowAfterReset = await fetch(`http://localhost:${BACKEND_PORT}/api/hearthwood-layout/runMapStrip`).then((r) => r.json())
  console.log("DB row after reset (should be {}):", JSON.stringify(dbRowAfterReset.positions))
  await page.close()

  const ctx2 = await browser.newContext({ viewport: { width: 1400, height: 1000 } })
  const page2 = await ctx2.newPage()
  page2.on("pageerror", (e) => errs.push(`[reset-reopen] ${e}`))
  await openScreen(page2)
  const rectFinal = await rect(page2, ".hw-run-map")
  console.log("Map present after reset:", !!rectFinal)
  await page2.close()
}

await browser.close()

console.log("\n=== PAGE ERRORS ===", errs.length)
errs.forEach((e) => console.log(e))
process.exit(errs.length ? 1 : 0)
