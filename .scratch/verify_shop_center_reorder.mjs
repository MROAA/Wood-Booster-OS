// Live end-to-end test: the Market screen's CENTER column renders its
// "chrome" pieces (merchant greeting, tab row, notices) in
// shopLayout.js's centerOrder, then a REAL reorder applied through the
// Studio API changes what the running game actually shows - same
// pattern as verify_shop_layout_reorder.mjs (left rail), just for the
// new Phase 3 (center column, simple reordering, no coordinates).
import { chromium } from "playwright"

const PORT = 5183
const BACKEND_PORT = 3021
const browser = await chromium.launch()
const errs = []

async function centerOrderOnScreen(page) {
  return page.evaluate(() => {
    const center = document.querySelector(".hw-shop-center")
    const known = [
      [".hw-merchant", "greeting"],
      [".hw-hint--tutorial", "tutorialHint"],
      [".hw-hint--evolved", "evolutionNotice"],
      [".hw-tab-row--market-art", "tabs"],
      [".hw-hint--pending", "equipPrompt"],
      [".hw-market-event-banner", "marketEventBanner"],
    ]
    const found = []
    for (const child of center.children) {
      for (const [selector, name] of known) {
        if (child.matches(selector)) found.push(name)
      }
    }
    return found
  })
}

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

// --- 0. Warm up the dev server (cold-start timing artifact) ---
{
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" }).catch(() => {})
  await page.waitForTimeout(1500)
  await page.close()
}

// --- 1. Regression: default order matches the original hardcoded sequence ---
{
  const ctx = await browser.newContext({ viewport: { width: 1860, height: 960 } })
  const page = await ctx.newPage()
  page.on("pageerror", (e) => errs.push(`[default] ${e}`))
  await seedShopRun(page)

  const order = await centerOrderOnScreen(page)
  console.log("Default center order:", order)
  console.log("Matches expected default (greeting, tabs - notices hidden):",
    JSON.stringify(order) === JSON.stringify(["greeting", "tabs"]))

  await page.close()
}

// --- 2. Apply a REAL reorder via the Studio API, confirm the game picks it up ---
{
  const ctx = await browser.newContext({ viewport: { width: 1860, height: 960 } })
  const page = await ctx.newPage()
  page.on("pageerror", (e) => errs.push(`[reordered] ${e}`))

  const previewRes = await fetch(`http://localhost:${BACKEND_PORT}/api/hearthwood-patchbay/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "shopLayout",
      entityId: "market",
      edits: [
        { path: ["market", "centerOrder"], op: "setRaw", value: '["tabs", "tutorialHint", "greeting", "evolutionNotice", "equipPrompt", "marketEventBanner"]' },
      ],
    }),
  }).then((r) => r.json())
  console.log("Preview ok, patchId:", previewRes.patchId, "risk:", previewRes.risk?.tier)

  const applyRes = await fetch(`http://localhost:${BACKEND_PORT}/api/hearthwood-patchbay/${previewRes.patchId}/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ applyMode: "live", confirm: true }),
  }).then((r) => r.json())
  console.log("Applied:", applyRes.status)

  await seedShopRun(page)
  const reorderedOrder = await centerOrderOnScreen(page)
  console.log("Center order AFTER reorder:", reorderedOrder)
  console.log("Tabs now renders FIRST, greeting now renders after tutorialHint slot:",
    JSON.stringify(reorderedOrder) === JSON.stringify(["tabs", "greeting"]))

  // Reset back to the default so the data file stays clean for the PR diff.
  const resetRes = await fetch(`http://localhost:${BACKEND_PORT}/api/hearthwood-patchbay/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "shopLayout",
      entityId: "market",
      edits: [
        { path: ["market", "centerOrder"], op: "setRaw", value: '["greeting", "tutorialHint", "evolutionNotice", "tabs", "equipPrompt", "marketEventBanner"]' },
      ],
    }),
  }).then((r) => r.json())
  await fetch(`http://localhost:${BACKEND_PORT}/api/hearthwood-patchbay/${resetRes.patchId}/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ applyMode: "live", confirm: true }),
  }).then((r) => r.json())
  console.log("Reset centerOrder back to default.")

  await page.close()
}

await browser.close()

console.log("\n=== PAGE ERRORS ===", errs.length)
errs.forEach((e) => console.log(e))
process.exit(errs.length ? 1 : 0)
