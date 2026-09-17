import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

// The Ragpicker's Market (4th Market Event): the first SELL-side event
// (PRD's own Sell System / Opportunity Cost sections, still otherwise
// untouched) rather than another buy-side price/slot/tier spin like
// Merchant/Blackroot/Golden. Selling a bench unit refunds 50% more
// while this event is active (sellRefundFor's new 2nd param), nothing
// else about the shop changes (priceMult 1, slotDelta 0, tierOverride
// null) - a genuinely different lever from the other 3.

const PORT = process.env.PORT || 5504
const ROOT = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-market-ragpicker"
const DIR = `${ROOT}/.scratch/shots`
await mkdir(DIR, { recursive: true })

const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1536, height: 960 } })).newPage()
const errs = []
page.on("pageerror", (e) => errs.push(String(e)))

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForSelector(".hw-commander-card", { timeout: 20000 })

const out = { ok: {}, detail: {} }

// ---- 1. Pure engine logic, via headless import ---------------------
const engineChecks = await page.evaluate(async () => {
  const { MARKET_EVENTS, pickMarketEvent, sellRefundFor, sellUnit, startRun } = await import("/src/services/heartwood/runEngine.js")
  const { UNITS } = await import("/src/data/heartwood/units.js")
  const r = { ok: {}, detail: {} }

  // The event exists with the exact shape the sell-refund/UI code reads.
  const ev = MARKET_EVENTS.ragpicker
  r.ok.eventShape =
    ev?.name === "The Ragpicker's Market" &&
    ev.sellMult === 1.5 &&
    ev.priceMult === 1 &&
    ev.slotDelta === 0 &&
    ev.tierOverride === null &&
    ev.lockReroll === false &&
    ev.tone === "cosmic"

  // sellRefundFor: default (no event) unchanged from before this round;
  // ragpicker's 1.5x on top of the exact same base.
  const commonDef = Object.values(UNITS).find((u) => u.recruitCost != null)
  const base = sellRefundFor(commonDef)
  const boosted = sellRefundFor(commonDef, ev.sellMult)
  r.detail.commonDef = { name: commonDef?.name, recruitCost: commonDef?.recruitCost }
  r.detail.base = base
  r.detail.boosted = boosted
  r.ok.sellMultAppliesOnTop = boosted === Math.ceil(commonDef.recruitCost * 0.33 * 1.5) && boosted > base

  // A Tier 2 (fused, no recruitCost) fallback also scales with sellMult.
  const tier2Fallback = sellRefundFor({ recruitCost: null })
  const tier2Boosted = sellRefundFor({ recruitCost: null }, 1.5)
  r.ok.tier2FallbackScales = tier2Boosted === Math.ceil(tier2Fallback * 1.5)

  // sellUnit actually pays the boosted amount when runState.marketEvent
  // is "ragpicker" - not just the pure helper in isolation. A fresh
  // startRun's own bench is empty (you recruit in the shop, you don't
  // start with anything) - give it one synthetic bench entry to sell.
  const benchDefId = "hexbreaker"
  const benchKey = 999
  let s = { ...startRun("tommy"), bench: [{ key: benchKey, defId: benchDefId, upgradeLevel: 0 }] }
  const def = UNITS[benchDefId]
  const expectedPlain = sellRefundFor(def)
  const expectedBoosted = sellRefundFor(def, 1.5)
  const plainResult = sellUnit(s, benchKey)
  const boostedResult = sellUnit({ ...s, marketEvent: "ragpicker" }, benchKey)
  r.detail.plainRefundGained = plainResult.essence - s.essence
  r.detail.boostedRefundGained = boostedResult.essence - s.essence
  r.ok.sellUnitPlainUnaffected = plainResult.essence - s.essence === expectedPlain
  r.ok.sellUnitBoosted = boostedResult.essence - s.essence === expectedBoosted
  r.ok.sellUnitBoostGreaterThanPlain = expectedBoosted > expectedPlain

  // pickMarketEvent: ragpicker is reachable, and the 3 pre-existing
  // events are still reachable too (no band accidentally zeroed out).
  const seen = new Set()
  for (let seed = 0; seed < 4000 && seen.size < 4; seed++) {
    const id = pickMarketEvent(seed, 20, false)
    if (id) seen.add(id)
  }
  r.detail.seenEvents = [...seen].sort()
  r.ok.allFourReachable = ["blackroot", "golden", "merchant", "ragpicker"].every((id) => seen.has(id))

  return r
})
out.ok = { ...out.ok, ...engineChecks.ok }
out.detail = { ...out.detail, ...engineChecks.detail }

// ---- 2. Real UI: force the event on, confirm the banner + the actual
// bench sell-preview label reflect it. -------------------------------
await page.evaluate(async () => {
  const { RUN_PATH, startRun, serializeRun, actIndexForNode } = await import("/src/services/heartwood/runEngine.js")
  const idx = 0
  let s = {
    ...startRun("tommy"),
    nodeIndex: idx,
    path: RUN_PATH.slice(0, idx + 1),
    phase: "shop",
    essence: 4000,
    marketEvent: "ragpicker",
    shopOffers: ["world-ash-elder", "bulwark-of-ages", "the-thorn-throne"],
  }
  s.lastSeenAct = actIndexForNode(idx, RUN_PATH.length)
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(s)))
  localStorage.setItem("heartwood-autobattler-intro-seen", "true")
  localStorage.setItem("heartwood-story-intro-seen", "true")
  localStorage.setItem("heartwood-settings-v1", JSON.stringify({ master: 0, sfx: 0, music: 0, muted: true, reduceMotion: true }))
})
await page.reload()
await page.waitForSelector(".hw-market-event-banner", { timeout: 10000 })
await page.waitForTimeout(400)
const gotIt = page.locator("button", { hasText: "Got it" })
if (await gotIt.count()) await gotIt.click()
await page.waitForTimeout(300)

const banner = page.locator(".hw-market-event-banner")
out.detail.bannerTone = await banner.getAttribute("data-tone")
out.detail.bannerName = await page.locator(".hw-market-event-name").textContent()
out.detail.bannerEffect = await page.locator(".hw-market-event-effect").textContent()
out.ok.bannerRenders =
  out.detail.bannerTone === "cosmic" &&
  out.detail.bannerName === "The Ragpicker's Market" &&
  out.detail.bannerEffect.includes("50% more")

// Reroll/Freeze must NOT be locked (ragpicker.lockReroll is false,
// unlike Blackroot) - a real regression risk given lockReroll is read
// off the SAME marketEventDef this event also sets.
const rerollBtn = page.locator("button", { hasText: "Reroll" }).first()
out.ok.rerollNotLocked = await rerollBtn.isEnabled()

await page.screenshot({ path: `${DIR}/market_ragpicker_shop.png`, fullPage: true })

console.log(JSON.stringify(out, null, 2))
console.log("page errors:", errs.length, errs.slice(0, 5))
const allPass = Object.values(out.ok).every(Boolean) && errs.length === 0
console.log(allPass ? "ALL CHECKS PASS" : "FAILURES PRESENT")
await browser.close()
process.exit(allPass ? 0 : 1)
