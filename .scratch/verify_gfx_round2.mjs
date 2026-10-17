// Graphics round 2 audit: one headless page, the main run screens.
// usage: node .scratch/shot_gfx_screens.mjs <outPrefix> [port]
import { chromium } from "playwright"
const OUT = process.argv[2], PORT = process.argv[3] || 5173
const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
const errs = []; page.on("pageerror", (e) => errs.push(e.message))
await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
const seed = async (phase) => {
  await page.evaluate(async (phase) => {
    const { startRun, serializeRun, RUN_PATH } = await import("/src/services/heartwood/runEngine.js")
    const idx = RUN_PATH.findIndex((n) => n.type === "battle" && n.formationId)
    const bench = ["the-fool", "the-magician", "the-chariot"].map((defId, i) => ({ key: `b${i}`, defId, upgradeLevel: 0, upgrades: [] }))
    const rs = { ...startRun("tommy", null, { forcedSeed: 424243 }), nodeIndex: idx, path: RUN_PATH.slice(0, idx + 1), phase, bench, deployed: [...bench.map((e) => e.key), null], items: [], lastSeenAct: 1 }
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(rs)))
  }, phase)
  await page.reload({ waitUntil: "domcontentloaded" }); await page.waitForTimeout(1300)
}
const checks = {}
await page.evaluate(() => localStorage.clear())
await seed("formation")
checks.combosLabel = await page.locator(".hw-section-label", { hasText: "Combos" }).count() === 1
const totalCombos = (await import("../src/data/heartwood/synergies.js").catch(() => null))?.COMBO_SYNERGIES?.length
const visibleBefore = await page.locator(".hw-formation-screen .hw-badge:visible").count()
await page.locator(".hw-combo-more > summary").click()
const visibleAfter = await page.locator(".hw-formation-screen .hw-badge:visible").count()
checks.moreRevealsChips = visibleAfter > visibleBefore
checks.layoutHidden = (await page.locator("button:visible", { hasText: "Edit Layout" }).count()) === 0
await page.locator(".hw-layout-tools-toggle").click()
checks.layoutShownAfterToggle = (await page.locator("button:visible", { hasText: "Edit Layout" }).count()) > 0
await page.reload({ waitUntil: "domcontentloaded" }); await page.waitForTimeout(1200)
checks.toggleRemembered = (await page.locator("button:visible", { hasText: "Edit Layout" }).count()) > 0
await page.locator(".hw-layout-tools-toggle").click()
await seed("shop")
checks.shopTipUpdated = !(await page.content()).includes("fight automatically")
checks.shopLayoutHidden = (await page.locator("button:visible", { hasText: "Edit Layout" }).count()) === 0
const pass = Object.values(checks).every(Boolean) && errs.length === 0
console.log(JSON.stringify({ checks, visibleBefore, visibleAfter, totalCombos, errs }))
console.log(pass ? "PASS" : "FAIL")
await browser.close()
