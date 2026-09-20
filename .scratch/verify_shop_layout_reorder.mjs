// Live end-to-end test: the Market screen renders left-rail sections
// in shopLayout.js's own order (regression: default order matches the
// original hardcoded sequence), then a REAL reorder applied through
// the Studio API changes what the running game actually shows.
import { chromium } from "playwright"

const PORT = 5187
const browser = await chromium.launch()
const errs = []

async function sectionOrderOnScreen(page) {
  return page.evaluate(() => {
    const labels = [...document.querySelectorAll(".hw-rail-section .hw-rail-label, .hw-rail-section .hw-section-label")]
    return labels.map((el) => el.textContent.trim().replace(/\s+\d+$/, ""))
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

// --- 1. Regression: default order matches the original hardcoded one ---
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } })
  const page = await ctx.newPage()
  page.on("pageerror", (e) => errs.push(`[default] ${e}`))
  await seedShopRun(page)

  const order = await sectionOrderOnScreen(page)
  console.log("Default left-rail section order:", order)
  console.log("Matches expected default (Ledger, Relics, Items - no Buyback yet):",
    JSON.stringify(order) === JSON.stringify(["The Ledger", "Relics", "Items"]))

  await page.close()
}

// --- 2. Apply a REAL reorder via the Studio API, confirm the game picks it up ---
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } })
  const page = await ctx.newPage()
  page.on("pageerror", (e) => errs.push(`[reordered] ${e}`))

  // Swap index 0 (ledger) and index 2 (relics) via the real backend API -
  // same edits the ListFieldEditor's move buttons would produce.
  const previewRes = await fetch(`http://localhost:3019/api/hearthwood-patchbay/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "shopLayout",
      entityId: "market",
      edits: [
        { path: ["market", "leftRailOrder", 0], op: "set", value: "relics" },
        { path: ["market", "leftRailOrder", 2], op: "set", value: "ledger" },
      ],
    }),
  }).then((r) => r.json())
  console.log("Preview ok, patchId:", previewRes.patchId, "risk:", previewRes.risk?.tier)

  const applyRes = await fetch(`http://localhost:3019/api/hearthwood-patchbay/${previewRes.patchId}/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ applyMode: "live", confirm: true }),
  }).then((r) => r.json())
  console.log("Applied:", applyRes.status)

  await seedShopRun(page)
  const reorderedOrder = await sectionOrderOnScreen(page)
  console.log("Section order AFTER reorder:", reorderedOrder)
  console.log("Relics now renders FIRST, Ledger now renders LAST:",
    JSON.stringify(reorderedOrder) === JSON.stringify(["Relics", "The Ledger", "Items"]))

  await page.close()
}

await browser.close()

console.log("\n=== PAGE ERRORS ===", errs.length)
errs.forEach((e) => console.log(e))
process.exit(errs.length ? 1 : 0)
