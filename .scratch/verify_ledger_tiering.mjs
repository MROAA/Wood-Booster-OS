import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

// Hearthwood shop: The Ledger tiering pass. Marc: "se on pitkä lista
// nyt ja minusta liikaa kerralla harkittavaksi" (the Ledger list is too
// long to weigh at once now, 10 investments) -> "niitä voi porrastaa
// molempiin market lvl ja tier lvl missä se loogisimmillaan voisi
// olla" (stage them across BOTH Market Level and Market Tier,
// whichever is more logical per item). The 4 pure-economy buys gate on
// marketLevel; the 6 combat-counter/shop-structure buys gate on
// effectiveMarketTier - balanced as 3 unlocked from run start, +4 at
// the middle stage (level/tier 2), +3 at the max stage (level/tier 3).

const PORT = process.env.PORT || 5505
const ROOT = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-ledger-appraiser"
const DIR = `${ROOT}/.scratch/shots`
await mkdir(DIR, { recursive: true })

const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1536, height: 960 } })).newPage()
const errs = []
page.on("pageerror", (e) => errs.push(String(e)))

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForSelector(".hw-commander-card", { timeout: 20000 })

const out = { ok: {}, detail: {} }

// ---- 1. Pure engine logic --------------------------------------
const engine = await page.evaluate(async () => {
  const { SHOP_INVESTMENTS, investmentUnlocked, buyInvestment, startRun } = await import("/src/services/heartwood/runEngine.js")
  const r = { ok: {}, detail: {} }

  const unlockedAt = (marketLevel, marketTier, relics = []) => {
    const rs = { ...startRun("tommy"), marketLevel, marketTier, relics }
    return Object.keys(SHOP_INVESTMENTS).filter((id) => investmentUnlocked(rs, id)).sort()
  }

  // Fresh run (marketLevel:1, marketTier:1 - startRun's own default):
  // exactly the 3-item starting set, nothing else.
  const start = unlockedAt(1, 1)
  r.detail.start = start
  r.ok.startIsExactlyThree =
    start.length === 3 && ["rearguard", "regulars-discount", "traders-compass"].every((id) => start.includes(id))

  // Middle stage (both meters at 2): +4 more (7 total).
  const mid = unlockedAt(2, 2)
  r.detail.mid = mid
  r.ok.midIsSeven =
    mid.length === 7 &&
    ["appraisers-eye", "market-charter", "marked-coin", "wider-stall"].every((id) => mid.includes(id))

  // Max stage (both meters at 3): all 10.
  const max = unlockedAt(3, 3)
  r.detail.max = max
  r.ok.maxIsAllTen = max.length === 10 && Object.keys(SHOP_INVESTMENTS).every((id) => max.includes(id))

  // Independent axes: pushing ONLY marketLevel to 3 (marketTier stays
  // at 1) unlocks the economy trio's remaining 2 items but none of the
  // still tier-gated combat/shop-structure ones beyond the starting 2.
  const levelOnly = unlockedAt(3, 1)
  r.detail.levelOnly = levelOnly
  r.ok.levelOnlyUnlocksEconomyNotTier =
    ["regulars-discount", "wider-stall", "appraisers-eye", "ledger-account"].every((id) => levelOnly.includes(id)) &&
    !levelOnly.includes("marked-coin") &&
    !levelOnly.includes("weathered-standard")

  // Market Charter's own cascade: owning it (relics includes
  // "market-charter") makes effectiveMarketTier read +1 higher, so a
  // RAW marketTier of 2 (which alone would NOT yet reach the max-stage
  // gate of 3) unlocks the max-tier items early - reinforcing its own
  // "the shop opens one Tier higher" flavor for the Ledger list too,
  // not just the recruit pool.
  const withoutCharter = unlockedAt(2, 2, [])
  const withCharter = unlockedAt(2, 2, ["market-charter"])
  r.detail.withoutCharter = withoutCharter
  r.detail.withCharter = withCharter
  r.ok.marketCharterCascades =
    !withoutCharter.includes("weathered-standard") &&
    !withoutCharter.includes("silenced-bell") &&
    withCharter.includes("weathered-standard") &&
    withCharter.includes("silenced-bell")

  // buyInvestment refuses a locked investment even with plenty of
  // Essence - the defense-in-depth guard, not just a UI-level filter.
  const lockedAttempt = buyInvestment({ ...startRun("tommy"), essence: 99999, marketLevel: 1, marketTier: 1 }, "ledger-account")
  r.detail.lockedAttemptEssence = lockedAttempt.essence
  r.ok.buyInvestmentRefusesLocked = lockedAttempt.essence === 99999 && (lockedAttempt.ledgerWinBonus || 0) === 0

  // Once unlocked AND bought, it reads back as both unlocked and owned.
  const bought = buyInvestment({ ...startRun("tommy"), essence: 99999, marketLevel: 3, marketTier: 3 }, "ledger-account")
  r.ok.buyInvestmentWorksOnceUnlocked = bought.ledgerWinBonus === 40 && bought.essence === 99999 - 450

  return r
})
out.ok = { ...out.ok, ...engine.ok }
out.detail = { ...out.detail, ...engine.detail }

// ---- 2. Real UI: the rail shows only the unlocked set + a locked-count
// hint, and the hint's number tracks the real remaining count. ------
async function seedShop(marketLevel, marketTier) {
  await page.evaluate(async ({ marketLevel, marketTier }) => {
    const { RUN_PATH, startRun, serializeRun, actIndexForNode } = await import("/src/services/heartwood/runEngine.js")
    const idx = 0
    let s = {
      ...startRun("tommy"),
      nodeIndex: idx,
      path: RUN_PATH.slice(0, idx + 1),
      phase: "shop",
      essence: 4000,
      marketLevel,
      marketTier,
      shopOffers: ["world-ash-elder", "bulwark-of-ages", "the-thorn-throne"],
    }
    s.lastSeenAct = actIndexForNode(idx, RUN_PATH.length)
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(s)))
    localStorage.setItem("heartwood-autobattler-intro-seen", "true")
    localStorage.setItem("heartwood-story-intro-seen", "true")
    localStorage.setItem("heartwood-settings-v1", JSON.stringify({ master: 0, sfx: 0, music: 0, muted: true, reduceMotion: true }))
  }, { marketLevel, marketTier })
  await page.reload()
  await page.waitForSelector(".hw-rail-section--ledger .hw-rail-chip-name", { timeout: 10000 })
  await page.waitForTimeout(300)
  const gotIt = page.locator("button", { hasText: "Got it" })
  if (await gotIt.count()) await gotIt.click()
  await page.waitForTimeout(200)
}

await seedShop(1, 1)
const chipsAtStart = await page.locator(".hw-rail-section--ledger .hw-rail-chip").count()
const hintAtStart = await page.locator(".hw-rail-section--ledger .hw-rail-empty").textContent().catch(() => "")
out.detail.chipsAtStart = chipsAtStart
out.detail.hintAtStart = hintAtStart
out.ok.uiShowsThreeAtStart = chipsAtStart === 3
out.ok.uiHintSaysSevenMore = /\+7\b/.test(hintAtStart)
await page.screenshot({ path: `${DIR}/ledger_tier_start.png`, fullPage: true })

await seedShop(3, 3)
const chipsAtMax = await page.locator(".hw-rail-section--ledger .hw-rail-chip").count()
const hintAtMax = await page.locator(".hw-rail-section--ledger .hw-rail-empty").count()
out.detail.chipsAtMax = chipsAtMax
out.ok.uiShowsAllTenAtMax = chipsAtMax === 10
out.ok.uiHintGoneAtMax = hintAtMax === 0
await page.screenshot({ path: `${DIR}/ledger_tier_max.png`, fullPage: true })

console.log(JSON.stringify(out, null, 2))
console.log("page errors:", errs.length, errs.slice(0, 5))
const allPass = Object.values(out.ok).every(Boolean) && errs.length === 0
console.log(allPass ? "ALL CHECKS PASS" : "FAILURES PRESENT")
await browser.close()
process.exit(allPass ? 0 : 1)
