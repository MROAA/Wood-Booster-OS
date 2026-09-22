// Live end-to-end test for Free Layout on the Squad tab's own content:
// two scopes - "squadTabTop" (buildScore/itemBag) and "squadTabSplit"
// (squadDeployed/squadReserve, which reuses the EXISTING .hw-squad-
// split grid div directly rather than wrapping it, per the plan's own
// reasoning about that div's 3-column CSS Grid + literal divider
// column). Measures actual rendered content, not just wrappers.
import { chromium } from "playwright"

const PORT = 5191
const BACKEND_PORT = 3029
const browser = await chromium.launch()
const errs = []

async function seedShopRunWithBench(page) {
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
      bench: [
        { key: 1, defId: "the-fool", upgradeLevel: 0, upgrades: [] },
        { key: 2, defId: "the-magician", upgradeLevel: 0, upgrades: [] },
      ],
      benchKeyCounter: 3,
      deployed: [1, null, null, null],
    }
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(rs)))
    localStorage.setItem("heartwood-story-intro-seen", "true")
  })
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.waitForSelector(".hw-panel--market", { timeout: 8000 })
  await page.click(".hw-squad-tab-btn")
  await page.waitForSelector(".hw-panel--squad:not([hidden])", { timeout: 8000 })
  await page.waitForTimeout(700)
}

// Playwright's own .click() auto-scrolls its target into view first -
// `.hw-root.hw-screen-fade` (this screen's real scrollable ancestor,
// content taller than viewport) shifts scrollTop to bring a button
// further down into view, which shifts EVERY viewport-relative rect
// uniformly (confirmed live while debugging this PR: scrollTop went
// 65 -> 0 on the exact click that seemed to "move" everything - not a
// layout bug). Reset it to a fixed baseline before every measurement.
async function resetScroll(page) {
  await page.evaluate(() => {
    const root = document.querySelector(".hw-root.hw-screen-fade")
    if (root) root.scrollTop = 0
  })
}

async function topContentRects(page) {
  await resetScroll(page)
  return page.evaluate(() => {
    const container = document.querySelectorAll(".hw-panel--squad .hw-free-layout-container")[0]
    return [...container.children].map((wrapper) => {
      const r = wrapper.getBoundingClientRect()
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width) }
    })
  })
}

async function splitContentRects(page) {
  await resetScroll(page)
  return page.evaluate(() => {
    const container = document.querySelector(".hw-squad-split .hw-free-layout-container")
    const sections = [...container.querySelectorAll(".hw-squad-group")]
    return sections.map((el) => {
      const r = el.getBoundingClientRect()
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

// --- 1. Default regression: grid structure + divider intact ---
{
  const ctx = await browser.newContext({ viewport: { width: 1860, height: 960 } })
  const page = await ctx.newPage()
  page.on("pageerror", (e) => errs.push(`[default] ${e}`))
  await seedShopRunWithBench(page)
  const topRects = await topContentRects(page)
  const splitRects = await splitContentRects(page)
  // The divider is ALREADY unconditionally display:none in the real
  // game (a pre-existing, unrelated fact found live) - confirming it
  // here as a regression check, not expecting it visible.
  const dividerVisible = await page.isVisible(".hw-squad-split-divider")
  const innerDisplay = await page.evaluate(() => getComputedStyle(document.querySelector(".hw-squad-split .hw-free-layout-container")).display)
  console.log("Top scope block count:", topRects.length, "(expect 2)")
  console.log("Split scope group count:", splitRects.length, "(expect 2)")
  console.log("Divider visible by default (expect false, pre-existing):", dividerVisible)
  console.log("Inner split container computed display (flow mode):", innerDisplay, "(expect flex)")
  await page.close()
}

// --- 2. Top scope: zero-jump + drag + save ---
{
  const ctx = await browser.newContext({ viewport: { width: 1860, height: 960 } })
  const page = await ctx.newPage()
  page.on("pageerror", (e) => errs.push(`[top-edit] ${e}`))
  await seedShopRunWithBench(page)

  const before = await topContentRects(page)
  const toolbars = page.locator(".hw-panel--squad .hw-free-layout-toolbar")
  await toolbars.nth(0).locator("text=Edit Layout").click()
  await page.waitForTimeout(200)
  const afterEdit = await topContentRects(page)
  const noJump = before.every((r, i) => Math.abs(r.x - afterEdit[i].x) <= 1 && Math.abs(r.y - afterEdit[i].y) <= 1)
  console.log("Top scope zero visual jump:", noJump)
  if (!noJump) console.log("  before:", JSON.stringify(before), "\n  after:", JSON.stringify(afterEdit))

  const handle = page.locator(".hw-panel--squad .hw-free-layout-drag-handle").first()
  const box = await handle.boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + 35, box.y + 20, { steps: 10 })
  await page.mouse.up()
  await page.waitForTimeout(100)
  const afterDrag = await topContentRects(page)
  console.log("BuildScore moved by:", afterDrag[0].x - afterEdit[0].x, afterDrag[0].y - afterEdit[0].y)

  await toolbars.nth(0).locator("text=Save Layout").click()
  await page.waitForTimeout(400)
  const dbRow = await fetch(`http://localhost:${BACKEND_PORT}/api/hearthwood-layout/squadTabTop`).then((r) => r.json())
  console.log("squadTabTop DB row:", JSON.stringify(dbRow.positions))
  await page.close()
}

// --- 3. Split scope: zero-jump + drag + divider hides while editing + save ---
{
  const ctx = await browser.newContext({ viewport: { width: 1860, height: 960 } })
  const page = await ctx.newPage()
  page.on("pageerror", (e) => errs.push(`[split-edit] ${e}`))
  await seedShopRunWithBench(page)

  const before = await splitContentRects(page)
  const toolbars = page.locator(".hw-panel--squad .hw-free-layout-toolbar")
  await toolbars.nth(1).locator("text=Edit Layout").click()
  await page.waitForTimeout(200)
  const afterEdit = await splitContentRects(page)
  const noJump = before.every((r, i) => Math.abs(r.x - afterEdit[i].x) <= 1 && Math.abs(r.y - afterEdit[i].y) <= 1 && r.w === afterEdit[i].w)
  console.log("Split scope zero visual jump:", noJump)
  if (!noJump) console.log("  before:", JSON.stringify(before), "\n  after:", JSON.stringify(afterEdit))

  const dividerHiddenWhileEditing = !(await page.isVisible(".hw-squad-split-divider"))
  console.log("Divider hidden while this scope is free-active:", dividerHiddenWhileEditing)

  const handle = page.locator(".hw-panel--squad .hw-free-layout-drag-handle").nth(0)
  const box = await handle.boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + 50, box.y + 30, { steps: 10 })
  await page.mouse.up()
  await page.waitForTimeout(100)
  const afterDrag = await splitContentRects(page)
  console.log("Deployed group moved by:", afterDrag[0].x - afterEdit[0].x, afterDrag[0].y - afterEdit[0].y)

  await toolbars.nth(1).locator("text=Save Layout").click()
  await page.waitForTimeout(400)
  const dbRow = await fetch(`http://localhost:${BACKEND_PORT}/api/hearthwood-layout/squadTabSplit`).then((r) => r.json())
  console.log("squadTabSplit DB row:", JSON.stringify(dbRow.positions))
  await page.close()
}

// --- 4. Reload persistence + reset both scopes ---
{
  const ctx = await browser.newContext({ viewport: { width: 1860, height: 960 } })
  const page = await ctx.newPage()
  page.on("pageerror", (e) => errs.push(`[reload-reset] ${e}`))
  await seedShopRunWithBench(page)
  const dividerVisibleAfterReload = await page.isVisible(".hw-squad-split-divider")
  console.log("\nAfter reload, divider hidden (split scope still free-active from saved state):", !dividerVisibleAfterReload)

  const toolbars = page.locator(".hw-panel--squad .hw-free-layout-toolbar")
  await toolbars.nth(0).locator("text=Reset Layout").click()
  await page.waitForTimeout(400)
  await toolbars.nth(1).locator("text=Reset Layout").click()
  await page.waitForTimeout(400)

  const topReset = await fetch(`http://localhost:${BACKEND_PORT}/api/hearthwood-layout/squadTabTop`).then((r) => r.json())
  const splitReset = await fetch(`http://localhost:${BACKEND_PORT}/api/hearthwood-layout/squadTabSplit`).then((r) => r.json())
  console.log("squadTabTop after reset (should be {}):", JSON.stringify(topReset.positions))
  console.log("squadTabSplit after reset (should be {}):", JSON.stringify(splitReset.positions))
  await page.close()

  const ctx2 = await browser.newContext({ viewport: { width: 1860, height: 960 } })
  const page2 = await ctx2.newPage()
  page2.on("pageerror", (e) => errs.push(`[final] ${e}`))
  await seedShopRunWithBench(page2)
  const dividerBack = await page2.isVisible(".hw-squad-split-divider")
  console.log("Divider visible again after reset:", dividerBack)
  await page2.close()
}

await browser.close()

console.log("\n=== PAGE ERRORS ===", errs.length)
errs.forEach((e) => console.log(e))
process.exit(errs.length ? 1 : 0)
