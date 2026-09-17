import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

// Hearthwood shop visual polish, round 2: PR #495 fixed The Ledger's
// own truncating names by scoping a wrap-fix to .hw-rail-section--
// ledger/--buyback only, explicitly leaving Relics alone (it was
// assumed short-named). A stress-test this round (many relics owned,
// including Ledger-bought "named" relics like The Market Charter,
// which also list themselves in the plain Relics inventory once owned)
// proved Relics has the IDENTICAL bug, since it shares the exact same
// base .hw-rail-chip shape. Consolidated the fix onto the base
// .hw-rail-chip/.hw-rail-chip-name rules instead of duplicating it a
// 3rd time, removed the now-redundant Ledger/Buyback-scoped rules from
// #495, and removed the two properties in .hw-rail-chip--item that
// became exact duplicates of the new base rule.

const PORT = process.env.PORT || 5502
const ROOT = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-shop-polish-2"
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
    essence: 9000,
    marketLevel: 3,
    shopOffers: ["world-ash-elder", "bulwark-of-ages", "the-thorn-throne"],
    // Named ledger-bought relics that also land in the plain Relics
    // inventory once owned - the exact real-data path that exposes
    // this round's bug.
    relics: ["rearguard-standard", "marked-coin", "market-charter", "traders-compass", "silenced-bell", "weathered-standard"],
    items: [{ key: 1, defId: "mossbound-chain", equippedTo: null, slotIndex: null }],
    itemKeyCounter: 2,
    buyback: { defId: "hollowveil", price: 120 },
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

async function namesAndOverflow(selector) {
  return page.$$eval(selector, (els) =>
    els.map((e) => ({ text: e.textContent, clipped: e.scrollWidth > e.clientWidth + 1 })),
  )
}

// 1. Ledger names (PR #495's own claim) still hold after the
// consolidation onto the base rule.
const ledger = await namesAndOverflow(".hw-rail-section--ledger .hw-rail-chip-name")
out.detail.ledger = ledger
out.ok.ledgerFullNoClip =
  ledger.some((n) => n.text === "The Weathered Standard") && ledger.every((n) => !n.clipped)

// 2. Buyback name.
const buyback = await namesAndOverflow(".hw-rail-section--buyback .hw-rail-chip-name")
out.detail.buyback = buyback
out.ok.buybackNoClip = buyback.length > 0 && buyback.every((n) => !n.clipped)

// 3. THIS round's own fix: the Relics inventory list, previously
// exempted, now shows every long name in full too.
const relicsLabel = await page.locator(".hw-rail-label", { hasText: "Relics" }).locator("xpath=..")
const relicNames = await relicsLabel.locator(".hw-rail-chip-name").allTextContents()
const relicClipped = await relicsLabel.locator(".hw-rail-chip-name").evaluateAll((els) =>
  els.map((e) => e.scrollWidth > e.clientWidth + 1),
)
out.detail.relicNames = relicNames
out.detail.relicClipped = relicClipped
out.ok.relicsHaveLongNames = relicNames.includes("The Market Charter") && relicNames.includes("The Trader's Compass")
out.ok.relicsNoClip = relicClipped.length > 0 && relicClipped.every((c) => c === false)

// 4. Items chips (already correct before this round) are unaffected -
// still render their equipped/unequipped tag.
const itemEq = await page.locator(".hw-rail-chip--item .hw-rail-chip-eq").first().textContent()
out.detail.itemEq = itemEq
out.ok.itemsUnaffected = itemEq === "Unequipped"

// 5. Upgrade buttons still land at a normal clickable size, wrapped
// beneath a long name.
const relicBtnBox = await relicsLabel.locator(".hw-rail-upgrade").first().boundingBox()
out.detail.relicBtnBox = relicBtnBox
out.ok.relicButtonVisible = !!relicBtnBox && relicBtnBox.width > 20 && relicBtnBox.height > 10

await page.screenshot({ path: `${DIR}/verify_rail_names_final.png`, fullPage: true })

console.log(JSON.stringify(out, null, 2))
console.log("page errors:", errs.length, errs.slice(0, 5))
const allPass = Object.values(out.ok).every(Boolean) && errs.length === 0
console.log(allPass ? "ALL CHECKS PASS" : "FAILURES PRESENT")
await browser.close()
process.exit(allPass ? 0 : 1)
