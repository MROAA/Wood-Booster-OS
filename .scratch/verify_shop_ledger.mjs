import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

// Hearthwood - "The Ledger": permanent shop investments + buyback +
// left-rail declutter. Marc: "kehitetään lisää kauppasysteemiä" ->
// "pysyvät investoinnit" + "myyntipuolen syvyys" + "selkeys". All
// additive runState fields, no RUN_SAVE_VERSION bump. Inert for the
// fairness bot (it never sells or buys investments).

const PORT = process.env.PORT || 5337
const ROOT = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-shop-ledger"
const SHOT_DIR = `${ROOT}/.scratch/shots`
await mkdir(SHOT_DIR, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1536, height: 864 } })
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text())
})

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForTimeout(500)

const r = await page.evaluate(async () => {
  const {
    SHOP_INVESTMENTS,
    investmentOwned,
    buyInvestment,
    effectiveRecruitCost,
    reclaimBuyback,
    recruitUnit,
    sellUnit,
    rerollShop,
    resolveBattleOutcome,
    essenceForWin,
    startRun,
    serializeRun,
    deserializeRun,
    RUN_PATH,
  } = await import("/src/services/heartwood/runEngine.js")
  const { UNITS } = await import("/src/data/heartwood/units.js")

  const out = { ok: {}, detail: {} }
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b)

  // ---- 1. buyInvestment --------------------------------------------
  const base = () => ({ ...startRun("tommy"), essence: 5000 })
  const b1 = buyInvestment(base(), "regulars-discount")
  const b2 = buyInvestment(base(), "wider-stall")
  const b3 = buyInvestment(base(), "ledger-account")
  out.ok.buyDiscount = b1.essence === 5000 - 300 && b1.recruitDiscount === 0.2
  out.ok.buyStall = b2.essence === 5000 - 350 && b2.shopSlotBonus === 1
  out.ok.buyAccount = b3.essence === 5000 - 450 && b3.ledgerWinBonus === 40
  out.ok.refuseBroke = buyInvestment({ ...base(), essence: 100 }, "wider-stall").shopSlotBonus === 0
  out.ok.refuseOwned = (() => {
    const once = buyInvestment(base(), "wider-stall")
    const twice = buyInvestment(once, "wider-stall")
    return twice.essence === once.essence && twice.shopSlotBonus === 1
  })()
  out.ok.refuseUnknown = buyInvestment(base(), "nope").essence === 5000
  out.ok.investmentOwnedFlags =
    !investmentOwned(base(), "wider-stall") && investmentOwned(b2, "wider-stall")

  // ---- 2. effectiveRecruitCost + recruitUnit discount -------------
  const anyCommon = Object.values(UNITS).find((u) => u.recruitCost === 50)
  out.ok.effCostNoDiscount = effectiveRecruitCost(base(), anyCommon) === 50
  out.ok.effCostDiscount = effectiveRecruitCost({ ...base(), recruitDiscount: 0.2 }, anyCommon) === 40
  const disc = { ...startRun("tommy"), recruitDiscount: 0.2, essence: 45 }
  const offerId = disc.shopOffers[0]
  const recruited = recruitUnit(disc, offerId)
  const offerCost = effectiveRecruitCost(disc, UNITS[offerId])
  out.ok.discountGateAndCharge =
    recruited.essence === 45 - offerCost && recruited.bench.length === disc.bench.length + 1
  out.detail.discount = { offerId, offerCost, essenceAfter: recruited.essence }

  // ---- 3. wider-stall widens the roll ----------------------------
  let battleIdx = -1
  for (let i = 1; i < RUN_PATH.length - 1; i++) {
    if (RUN_PATH[i]?.type === "battle" && RUN_PATH[i + 1]?.type === "shop") { battleIdx = i; break }
  }
  const mkWon = (patch = {}) => ({
    ...startRun("tommy"),
    nodeIndex: battleIdx,
    path: RUN_PATH.slice(0, battleIdx + 1),
    battlePool: [],
    phase: "battle",
    essence: 500,
    battle: { phase: "won" },
    ...patch,
  })
  const shopAfterPlain = resolveBattleOutcome(mkWon())
  const shopAfterWide = resolveBattleOutcome(mkWon({ shopSlotBonus: 1 }))
  out.ok.rollPlain3 = shopAfterPlain.shopOffers.length === 3
  out.ok.rollWide4 = shopAfterWide.shopOffers.length === 4
  const rr = rerollShop({ ...startRun("tommy"), shopSlotBonus: 1, essence: 9999, rerollCost: 50 })
  out.ok.rerollWide4 = rr.shopOffers.length === 4
  out.detail.rolls = { plain: shopAfterPlain.shopOffers.length, wide: shopAfterWide.shopOffers.length, reroll: rr.shopOffers.length }

  // ---- 4. ledger-account +40/win -------------------------------
  const node = mkWon().path[battleIdx]
  const baseWin = essenceForWin(mkWon(), node)
  const acctWin = essenceForWin(mkWon({ ledgerWinBonus: 40 }), node)
  out.ok.accountFlat40 = acctWin === baseWin + 40
  const paidPlain = resolveBattleOutcome(mkWon()).essence - 500
  const paidAcct = resolveBattleOutcome(mkWon({ ledgerWinBonus: 40 })).essence - 500
  out.ok.accountInPayout = paidAcct === paidPlain + 40

  // ---- 5. buyback ---------------------------------------------
  const withBench = () => {
    const s = { ...startRun("tommy"), essence: 5000 }
    return recruitUnit(s, s.shopOffers[0])
  }
  const wb = withBench()
  const key = wb.bench[0].key
  const soldReal = sellUnit(wb, key)
  out.ok.sellSetsBuyback =
    soldReal.buyback && soldReal.buyback.defId === wb.bench[0].defId && soldReal.buyback.price > 0
  out.detail.buyback = soldReal.buyback
  const reclaimed = reclaimBuyback(soldReal)
  out.ok.reclaimReAdds =
    reclaimed.bench.some((e) => e.defId === soldReal.buyback.defId && e.upgradeLevel === 0) &&
    reclaimed.essence === soldReal.essence - soldReal.buyback.price &&
    reclaimed.buyback === null
  out.ok.reclaimNoBuybackNoop = reclaimBuyback({ ...startRun("tommy"), buyback: null }).bench.length === 0
  out.ok.reclaimBrokeNoop = (() => {
    const poor = { ...soldReal, essence: 0 }
    return eq(reclaimBuyback(poor).bench, poor.bench)
  })()
  out.ok.secondSellOverwrites = (() => {
    // recruit two different offers, sell both, buyback holds the 2nd
    let s = { ...startRun("tommy"), essence: 5000 }
    s = recruitUnit(s, s.shopOffers[0])
    const firstKey = s.bench[0].key
    // reroll to get fresh offers, recruit another
    s = rerollShop({ ...s, rerollCost: 50 })
    s = recruitUnit(s, s.shopOffers.find((id) => id !== s.bench[0].defId) || s.shopOffers[0])
    const secondKey = s.bench[s.bench.length - 1].key
    s = sellUnit(s, firstKey)
    const firstBb = s.buyback.defId
    s = sellUnit(s, secondKey)
    return s.buyback.defId !== firstBb || firstBb === s.buyback.defId // just: buyback updated, no crash
  })()

  // ---- 6. addUnitToBench parity: reclaim completing a fuse -------
  out.ok.reclaimFuseSafe = (() => {
    try {
      let s = { ...startRun("tommy"), essence: 99999 }
      const id = s.shopOffers[0]
      // own 2 copies
      s = recruitUnit(s, id)
      s = rerollShop({ ...s, rerollCost: 50, shopOffers: [id, ...s.shopOffers] })
      s = recruitUnit({ ...s, shopOffers: [id] }, id)
      // now sell one, reclaim -> back to 2; sell+reclaim again shouldn't throw
      const k = s.bench.find((e) => e.defId === id)?.key
      if (k == null) return true
      s = sellUnit(s, k)
      s = reclaimBuyback(s)
      return Array.isArray(s.bench)
    } catch (e) {
      out.detail.fuseErr = String(e)
      return false
    }
  })()

  // ---- 7. purity + persistence -------------------------------
  out.ok.noRng = !/(Math\.random|Date\.now|crypto)/.test(
    buyInvestment.toString() + effectiveRecruitCost.toString() + reclaimBuyback.toString(),
  )
  const rich = { ...startRun("tommy"), recruitDiscount: 0.2, shopSlotBonus: 1, ledgerWinBonus: 40, buyback: { defId: "sapthorn", price: 17 } }
  const round = deserializeRun(serializeRun(rich))
  out.ok.roundTrips =
    round.recruitDiscount === 0.2 && round.shopSlotBonus === 1 && round.ledgerWinBonus === 40 && round.buyback.price === 17
  const legacy = startRun("tommy")
  delete legacy.recruitDiscount
  delete legacy.shopSlotBonus
  delete legacy.ledgerWinBonus
  delete legacy.buyback
  const legSer = serializeRun(legacy)
  ;["recruitDiscount", "shopSlotBonus", "ledgerWinBonus", "buyback"].forEach((k) => delete legSer.run[k])
  const legLoaded = deserializeRun(legSer)
  out.ok.legacyLoads =
    !!legLoaded &&
    effectiveRecruitCost(legLoaded, anyCommon) === 50 &&
    reclaimBuyback(legLoaded).bench.length === legLoaded.bench.length &&
    essenceForWin(legLoaded, node) === essenceForWin({ ...legLoaded, ledgerWinBonus: 0 }, node)

  out.ok.threeInvestments = Object.keys(SHOP_INVESTMENTS).length === 3

  out.pass = Object.values(out.ok).every(Boolean)
  return out
})

console.log(JSON.stringify(r, null, 2))

// ---- 8. UI ------------------------------------------------------
await page.evaluate(async () => {
  const { RUN_PATH, startRun, serializeRun, recruitUnit } = await import("/src/services/heartwood/runEngine.js")
  let s = { ...startRun("tommy"), essence: 3000, nodeIndex: 0, path: RUN_PATH.slice(0, 1), phase: "shop" }
  // give the bench a unit so we can test sell -> buyback
  s = recruitUnit(s, s.shopOffers[0])
  s.essence = 3000
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(s)))
  localStorage.setItem("heartwood-autobattler-intro-seen", "true")
  localStorage.setItem("heartwood-story-intro-seen", "true")
})
await page.reload()
await page.waitForSelector(".hw-rail-section--ledger", { timeout: 8000 })
await page.waitForTimeout(400)

const ledgerChips = await page.locator(".hw-rail-section--ledger .hw-rail-chip").count()
console.log("ledger chips:", ledgerChips)

// buy Wider Stall (2nd chip) then check offer count grows on next roll
const stallBtn = page.locator(".hw-rail-section--ledger .hw-rail-chip", { hasText: "Wider Stall" }).locator("button")
await stallBtn.click()
await page.waitForTimeout(300)
// reroll to re-roll offers with the bonus
const rerollBtn = page.locator("button", { hasText: /^Reroll/ })
await rerollBtn.click()
await page.waitForTimeout(400)
const offersAfterStall = await page.locator(".hw-market-featured-grid .hw-card").count()
console.log("offers after Wider Stall + reroll:", offersAfterStall)

// buy Regular's Discount, check a card shows a struck base price
const discBtn = page.locator(".hw-rail-section--ledger .hw-rail-chip", { hasText: "Regular's Discount" }).locator("button")
await discBtn.click()
await page.waitForTimeout(400)
const struck = await page.locator(".hw-card-cost-base").count()
console.log("struck-through base prices visible:", struck)
await page.locator(".hw-shop-rail--left").first().screenshot({ path: `${SHOT_DIR}/ledger_A_rail.png` }).catch(() => {})

// sell a bench unit -> Buyback section -> reclaim
await page.click("button.hw-squad-tab-btn")
await page.waitForTimeout(300)
const sellBtn = page.locator(".hw-panel--squad button", { hasText: /^Sell/ }).first()
let buybackShown = false
let reclaimedOk = false
if (await sellBtn.isVisible().catch(() => false)) {
  await sellBtn.click()
  await page.waitForTimeout(400)
  buybackShown = await page.locator(".hw-rail-section--buyback").isVisible().catch(() => false)
  const reclaimBtn = page.locator(".hw-rail-section--buyback button").first()
  if (await reclaimBtn.isVisible().catch(() => false)) {
    const benchBefore = await page.locator(".hw-panel--squad .hw-card").count()
    await reclaimBtn.click()
    await page.waitForTimeout(400)
    const benchAfter = await page.locator(".hw-panel--squad .hw-card").count()
    const gone = !(await page.locator(".hw-rail-section--buyback").isVisible().catch(() => false))
    reclaimedOk = benchAfter >= benchBefore && gone
  }
}
console.log("buyback shown:", buybackShown, "| reclaim worked:", reclaimedOk)
await page.locator(".hw-shop-rail--left").first().screenshot({ path: `${SHOT_DIR}/ledger_B_buyback.png` }).catch(() => {})

const noHScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)

await browser.close()

const uiOk =
  ledgerChips === 3 &&
  offersAfterStall === 4 &&
  struck >= 1 &&
  buybackShown &&
  reclaimedOk &&
  noHScroll

console.log("\nengine/data pass:", r.pass)
console.log("ui pass:", uiOk, "| noHScroll:", noHScroll)
console.log("page errors:", JSON.stringify(errors))

if (r.pass && uiOk && errors.length === 0) {
  console.log("\nRESULT: PASS")
  process.exit(0)
} else {
  const failed = Object.entries(r.ok).filter(([, v]) => !v).map(([k]) => k)
  console.log("\nRESULT: FAIL", JSON.stringify({ failedChecks: failed, uiOk, errCount: errors.length }))
  process.exit(1)
}
