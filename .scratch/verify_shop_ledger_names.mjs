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

// 4. Regression: the unrelated Relics/Items rail sections (plain
// .hw-rail-section, no --ledger/--buyback ancestor) must NOT pick up
// the wrap treatment - their chips stay whatever they were before.
const relicsSectionWraps = await page.evaluate(() => {
  const label = [...document.querySelectorAll(".hw-rail-label")].find((e) => e.textContent.includes("Relics"))
  const section = label?.closest(".hw-rail-section")
  const chip = section?.querySelector(".hw-rail-chip")
  if (!chip) return null
  return getComputedStyle(chip).flexWrap
})
out.detail.relicsSectionWraps = relicsSectionWraps
out.ok.relicsUnaffected = relicsSectionWraps === null || relicsSectionWraps === "nowrap"

await page.screenshot({ path: `${DIR}/verify_ledger_final.png`, fullPage: true })

console.log(JSON.stringify(out, null, 2))
console.log("page errors:", errs.length, errs.slice(0, 5))
const allPass = Object.values(out.ok).every(Boolean) && errs.length === 0
console.log(allPass ? "ALL CHECKS PASS" : "FAILURES PRESENT")
await browser.close()
process.exit(allPass ? 0 : 1)
