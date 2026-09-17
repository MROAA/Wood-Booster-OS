import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

// Hearthwood shop visual polish round: The Ledger's own investment
// names ("The Trader's Compass", "The Weathered Standard"...) were
// ellipsis-truncating on the ~210px left rail - the exact same class of
// complaint Marc already raised once for item chips ("Wraithf...",
// fixed via flex-wrap letting the name claim its own line). The Ledger/
// Buyback chips used the plain .hw-rail-chip shape and were missed at
// the time. Same fix applied here, scoped to those two sections only.

const PORT = process.env.PORT || 5501
const ROOT = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-shop-visual-polish"
const DIR = `${ROOT}/.scratch/shots`
await mkdir(DIR, { recursive: true })

const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1536, height: 960 } })).newPage()
const errs = []
page.on("pageerror", (e) => errs.push(String(e)))

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForSelector(".hw-commander-card", { timeout: 20000 })

await page.evaluate(async () => {
  const { RUN_PATH, startRun, serializeRun, actIndexForNode } = await import("/src/services/heartwood/runEngine.js")
  const idx = 0
  let s = {
    ...startRun("tommy"),
    nodeIndex: idx,
    path: RUN_PATH.slice(0, idx + 1),
    phase: "shop",
    essence: 4000,
    marketLevel: 3,
    // The Ledger tiering round (later): Market Charter/Silenced Bell/
    // Weathered Standard all gate on marketTier, not marketLevel - this
    // fixture only bumped Level, so those 3 dropped out of the visible
    // set once tiering shipped. Bumped Tier too so this file's own
    // "every real name renders unclipped" check still exercises all 9
    // of its own original names, unrelated to the tiering feature.
    marketTier: 3,
    shopOffers: ["world-ash-elder", "bulwark-of-ages", "the-thorn-throne"],
  }
  s.lastSeenAct = actIndexForNode(idx, RUN_PATH.length)
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(s)))
  localStorage.setItem("heartwood-autobattler-intro-seen", "true")
  localStorage.setItem("heartwood-story-intro-seen", "true")
  localStorage.setItem("heartwood-settings-v1", JSON.stringify({ master: 0, sfx: 0, music: 0, muted: true, reduceMotion: true }))
})
await page.reload()
await page.waitForSelector(".hw-rail-section--ledger .hw-rail-chip-name", { timeout: 10000 })
await page.waitForTimeout(400)

const out = { ok: {}, detail: {} }

// 1. Every real SHOP_INVESTMENTS name renders in full, not clipped.
const names = await page.$$eval(".hw-rail-section--ledger .hw-rail-chip-name", (els) => els.map((e) => e.textContent))
out.detail.names = names
const realNames = [
  "Regular's Discount", "Wider Stall", "Ledger Account", "The Rearguard",
  "The Market Charter", "The Trader's Compass", "The Silenced Bell", "The Weathered Standard",
]
out.ok.allEightPresent = realNames.every((n) => names.includes(n))

// 2. None of the ledger chip NAME spans overflow their own box (the
// actual "is it visually clipped" proxy - scrollWidth > clientWidth
// means the browser is hiding real text, which is exactly what the
// ellipsis bug did before this round).
const overflowFlags = await page.$$eval(".hw-rail-section--ledger .hw-rail-chip-name", (els) =>
  els.map((e) => e.scrollWidth > e.clientWidth + 1),
)
out.detail.overflowFlags = overflowFlags
out.ok.noneClipped = overflowFlags.every((f) => f === false)

// 3. The cost button still renders and is still clickable-sized (not
// squashed to 0 by the wrap) - grab one real button's box.
const btnBox = await page.locator(".hw-rail-section--ledger .hw-rail-upgrade").first().boundingBox()
out.detail.btnBox = btnBox
out.ok.buttonVisible = !!btnBox && btnBox.width > 20 && btnBox.height > 10

// 4. UPDATED by the very next round (verify_shop_rail_names.mjs): this
// originally asserted Relics stayed nowrap, on the assumption its names
// were always short. A stress-test proved that false (a Ledger-bought
// named relic like "The Market Charter" also lists itself here once
// owned, with the identical clipping bug) - the fix was consolidated
// onto the base .hw-rail-chip rule, so Relics wraps now too, on
// purpose. Kept this check alive rather than deleting it, just flipped
// to assert the now-correct behavior - see verify_shop_rail_names.mjs
// for the full regression suite on that round's own fix.
const relicsSectionWraps = await page.evaluate(() => {
  const label = [...document.querySelectorAll(".hw-rail-label")].find((e) => e.textContent.includes("Relics"))
  const section = label?.closest(".hw-rail-section")
  const chip = section?.querySelector(".hw-rail-chip")
  if (!chip) return null
  return getComputedStyle(chip).flexWrap
})
out.detail.relicsSectionWraps = relicsSectionWraps
out.ok.relicsAlsoWrapsNow = relicsSectionWraps === null || relicsSectionWraps === "wrap"

await page.screenshot({ path: `${DIR}/verify_ledger_final.png`, fullPage: true })

console.log(JSON.stringify(out, null, 2))
console.log("page errors:", errs.length, errs.slice(0, 5))
const allPass = Object.values(out.ok).every(Boolean) && errs.length === 0
console.log(allPass ? "ALL CHECKS PASS" : "FAILURES PRESENT")
await browser.close()
process.exit(allPass ? 0 : 1)
