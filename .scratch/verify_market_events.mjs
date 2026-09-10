import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

// Hearthwood - Market Events (Market/Money-Sinks PRD Phase 2 first slice,
// feat/hearthwood-market-events). Some shop stops are a SPECIAL market
// (Golden / Wandering Merchant / Blackroot) with its own risk/reward -
// not the same three offers every time. Pure shop-layer: no combat
// change, no RUN_SAVE_VERSION bump. `runState.marketEvent` is set at
// shop entry from a SEEDED pick, re-derivable from seed + nodeIndex +
// whether the Trader's Compass is owned. Balance is a light smoke check
// this round (Marc: de-weight per-round fairness).

const PORT = process.env.PORT || 5375
const SHOT = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-market-events/.scratch/shots"
await mkdir(SHOT, { recursive: true })

const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1536, height: 1000 } })).newPage()
const errs = []
page.on("pageerror", (e) => errs.push(String(e)))
page.on("console", (m) => m.type() === "error" && errs.push(m.text()))
await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForSelector(".hw-commander-card", { timeout: 20000 })

const R = await page.evaluate(async () => {
  const engine = await import("/src/services/heartwood/runEngine.js")
  const { UNITS } = await import("/src/data/heartwood/units.js")
  const { RELICS, relicPool } = await import("/src/data/heartwood/relics.js")
  const {
    startRun, serializeRun, deserializeRun, RUN_SAVE_VERSION,
    MARKET_EVENTS, pickMarketEvent, marketEventPriceMult, marketEventLocksReroll,
    marketEventRollArgs, hasTradersCompass, effectiveRecruitCost, effectiveMarketTier,
    rerollShop, toggleFreeze, leaveShop,
    SHOP_INVESTMENTS, investmentOwned, buyInvestment,
  } = engine
  const out = { errors: [] }
  const IDS = ["merchant", "blackroot", "golden"]
  const T3 = ["heartroot-elder", "mycelian-host"] // Market Tier 3 specialists

  // 1. pickMarketEvent - gate, distribution, compass, determinism -------
  {
    // never on the opening stops
    let earlyEvent = false
    for (let s = 0; s < 200; s++) if (pickMarketEvent(1000 + s, 5) != null) earlyEvent = true
    const badNode = pickMarketEvent(1234, NaN) === null && pickMarketEvent(1234, -3) === null

    // over 400 seeds at a fixed eligible nodeIndex
    const NODE = 20
    const tally = { null: 0, merchant: 0, blackroot: 0, golden: 0, bad: 0 }
    for (let s = 0; s < 400; s++) {
      const e = pickMarketEvent(5000 + s, NODE)
      if (e === null) tally.null++
      else if (IDS.includes(e)) tally[e]++
      else tally.bad++
    }
    const hitRate = (400 - tally.null) / 400
    const events = tally.merchant + tally.blackroot + tally.golden
    // ~18% base chance; ~45/35/20 split among events
    const rateOk = hitRate > 0.1 && hitRate < 0.3
    const splitOk =
      events > 30 &&
      tally.merchant / events > 0.3 && tally.merchant / events < 0.6 &&
      tally.blackroot / events > 0.2 && tally.blackroot / events < 0.5 &&
      tally.golden / events > 0.08 && tally.golden / events < 0.35
    const onlyKnown = tally.bad === 0

    // compass ~doubles the hit rate
    let compassHits = 0
    for (let s = 0; s < 400; s++) if (pickMarketEvent(5000 + s, NODE, true) != null) compassHits++
    const compassRate = compassHits / 400
    const compassOk = compassRate > hitRate * 1.4 && compassRate < 0.5

    // deterministic
    const det = pickMarketEvent(424242, NODE) === pickMarketEvent(424242, NODE)

    out.pick = { earlyEvent, badNode, hitRate: +hitRate.toFixed(3), tally, splitOk, rateOk, onlyKnown, compassRate: +compassRate.toFixed(3), compassOk, det }
    if (!(!earlyEvent && badNode && rateOk && splitOk && onlyKnown && compassOk && det)) out.errors.push("check1 pickMarketEvent")
  }

  // 2. Recruit price multiplier --------------------------------------
  {
    const rs = startRun("tommy")
    const def = { recruitCost: 100 }
    const base = effectiveRecruitCost(rs, def) // marketEvent null -> unchanged (#441 value)
    const golden = effectiveRecruitCost({ ...rs, marketEvent: "golden" }, def)
    const merch = effectiveRecruitCost({ ...rs, marketEvent: "merchant" }, def)
    const black = effectiveRecruitCost({ ...rs, marketEvent: "blackroot" }, def)
    const nullMult = marketEventPriceMult(null) === 1 && marketEventPriceMult("nope") === 1
    // stacks with Regular's Discount (0.2): ceil(100 * 0.8 * 1.35)
    const stacked = effectiveRecruitCost({ ...rs, recruitDiscount: 0.2, marketEvent: "golden" }, def)
    out.price = { base, golden, merch, black, stacked, nullMult }
    if (!(base === 100 && golden === Math.ceil(100 * 1.35) && merch === Math.ceil(100 * 0.75) && black === Math.ceil(100 * 0.5) && stacked === Math.ceil(100 * 0.8 * 1.35) && nullMult)) {
      out.errors.push("check2 price multiplier")
    }
  }

  // 3. Shop roll mods (tier override + slot delta) ------------------
  {
    const rs = startRun("tommy", null, { forcedSeed: 909 })
    const argN = marketEventRollArgs(null, rs)
    const argG = marketEventRollArgs("golden", { ...rs, marketTier: 1 })
    const argM = marketEventRollArgs("merchant", rs)
    const argB = marketEventRollArgs("blackroot", rs)
    // golden forces the top tier regardless of the run's marketTier
    const goldenTier = argG.tier === 3
    // merchant trims a slot (2 offers), others don't
    const nullSlot = argN.slotBonus === 0
    const merchSlot = argM.slotBonus === -1
    const blackSlot = argB.slotBonus === 0
    // a Wider Stall (+1) cancels the Merchant cut
    const merchWithStall = marketEventRollArgs("merchant", { ...rs, shopSlotBonus: 1 }).slotBonus === 0

    // drive a real reroll under each event, at market level 3 so the
    // rarity band never hides a Tier-3 specialist
    const rollUnder = (ev, extra = {}) => {
      let r = { ...rs, marketLevel: 3, marketTier: 1, essence: 999999, rerollCost: 1, marketEvent: ev, ...extra }
      const seen = new Set()
      let lastLen = 0
      for (let i = 0; i < 200; i++) {
        r = rerollShop({ ...r, rerollCost: 1 })
        lastLen = (r.shopOffers || []).length
        for (const id of r.shopOffers || []) seen.add(id)
      }
      return { seen, lastLen }
    }
    const g = rollUnder("golden")
    const m = rollUnder("merchant")
    const n = rollUnder(null)
    const goldenStocksT3 = T3.some((id) => g.seen.has(id))
    const nullNoT3 = T3.every((id) => !n.seen.has(id)) // Tier 1 run, no golden -> no Tier-3
    const merchTwoOffers = m.lastLen === 2
    const nullThreeOffers = n.lastLen === 3

    // marketEvent is cleared by leaveShop
    const cleared = leaveShop({ ...rs, marketEvent: "golden", phase: "shop", nodeIndex: 3 }).marketEvent === null

    out.roll = { goldenTier, nullSlot, merchSlot, blackSlot, merchWithStall, goldenStocksT3, nullNoT3, merchTwoOffers, nullThreeOffers, cleared }
    if (!(goldenTier && nullSlot && merchSlot && blackSlot && merchWithStall && goldenStocksT3 && nullNoT3 && merchTwoOffers && nullThreeOffers && cleared)) {
      out.errors.push("check3 shop roll mods")
    }
  }

  // 4. Blackroot lockout -------------------------------------------
  {
    const rs = { ...startRun("tommy"), essence: 9999, rerollCost: 50, frozen: false }
    const locksB = marketEventLocksReroll({ ...rs, marketEvent: "blackroot" })
    const locksNull = marketEventLocksReroll(rs)
    const locksG = marketEventLocksReroll({ ...rs, marketEvent: "golden" })
    // reroll is a no-op under blackroot (no essence spent, offers unchanged)
    const rrB = rerollShop({ ...rs, marketEvent: "blackroot" })
    const rerollNoop = rrB.essence === rs.essence && rrB === Object(rrB) && JSON.stringify(rrB.shopOffers) === JSON.stringify(rs.shopOffers)
    // freeze is a no-op under blackroot
    const tfB = toggleFreeze({ ...rs, marketEvent: "blackroot" })
    const freezeNoop = tfB.frozen === rs.frozen && tfB === Object(tfB)
    // both work normally under null / golden / merchant
    const tfNull = toggleFreeze(rs).frozen === true
    const rrG = rerollShop({ ...rs, marketEvent: "golden" })
    const rerollWorks = rrG.essence === rs.essence - rs.rerollCost
    const tfG = toggleFreeze({ ...rs, marketEvent: "merchant" }).frozen === true
    out.lockout = { locksB, locksNull, locksG, rerollNoop, freezeNoop, tfNull, rerollWorks, tfG }
    if (!(locksB && !locksNull && !locksG && rerollNoop && freezeNoop && tfNull && rerollWorks && tfG)) {
      out.errors.push("check4 Blackroot lockout")
    }
  }

  // 5. Trader's Compass ------------------------------------------
  {
    let rs = { ...startRun("tommy"), essence: 2000 }
    const cost = SHOP_INVESTMENTS["traders-compass"].cost
    const before = rs.essence
    rs = buyInvestment(rs, "traders-compass")
    const bought = rs.essence === before - cost && investmentOwned(rs, "traders-compass") && (rs.relics || []).includes("traders-compass") && hasTradersCompass(rs)
    const rs2 = buyInvestment(rs, "traders-compass") // owned -> no-op
    const noDouble = rs2.essence === rs.essence && (rs2.relics || []).filter((r) => r === "traders-compass").length === 1
    const notRollable = !relicPool().some((r) => r.id === "traders-compass")
    const noBattleEffect = Array.isArray(RELICS["traders-compass"].effects) && RELICS["traders-compass"].effects.length === 0
    // the doubled chance actually widens the hit set: an event at a
    // (seed, node) where the no-compass pick returned null
    let widened = 0
    for (let s = 0; s < 400; s++) {
      if (pickMarketEvent(6000 + s, 18, false) === null && pickMarketEvent(6000 + s, 18, true) !== null) widened++
    }
    out.compass = { cost, bought, noDouble, notRollable, noBattleEffect, widened }
    if (!(cost === 300 && bought && noDouble && notRollable && noBattleEffect && widened > 5)) out.errors.push("check5 Trader's Compass")
  }

  // 6. Save round-trip ----------------------------------------
  {
    const rs = { ...startRun("tommy"), marketEvent: "golden", relics: ["traders-compass"] }
    const rt = deserializeRun(JSON.parse(JSON.stringify(serializeRun(rs))))
    const rtOk = rt != null && rt.marketEvent === "golden" && (rt.relics || []).includes("traders-compass")
    // a marketEvent-less "old" v3 save still deserialises and reads null
    const old = { ...startRun("tommy") }
    delete old.marketEvent
    const oldRt = deserializeRun(JSON.parse(JSON.stringify(serializeRun(old))))
    const legacyOk = oldRt != null && (oldRt.marketEvent ?? null) === null
    // startRun itself seeds it null
    const initNull = (startRun("tommy").marketEvent ?? null) === null
    out.save = { rtOk, legacyOk, initNull, ver: RUN_SAVE_VERSION }
    if (!(rtOk && legacyOk && initNull && RUN_SAVE_VERSION === 3)) out.errors.push("check6 save")
  }

  // 7. MARKET_EVENTS table shape ------------------------------
  {
    const shapeOk = IDS.every((id) => {
      const e = MARKET_EVENTS[id]
      return e && typeof e.name === "string" && typeof e.blurb === "string" && typeof e.effect === "string" &&
        ["gold", "moss", "curse"].includes(e.tone) && typeof e.priceMult === "number" && typeof e.lockReroll === "boolean"
    })
    const onlyBlackLocks = MARKET_EVENTS.blackroot.lockReroll === true && MARKET_EVENTS.merchant.lockReroll === false && MARKET_EVENTS.golden.lockReroll === false
    const goldenPricier = MARKET_EVENTS.golden.priceMult > 1 && MARKET_EVENTS.merchant.priceMult < 1 && MARKET_EVENTS.blackroot.priceMult < 1
    out.table = { shapeOk, onlyBlackLocks, goldenPricier }
    if (!(shapeOk && onlyBlackLocks && goldenPricier)) out.errors.push("check7 MARKET_EVENTS table")
  }

  void effectiveMarketTier
  return out
})

console.log(JSON.stringify(R, null, 2))
console.log("\npageErrors:", errs.length, errs.slice(0, 8))

// screenshot the shop under each of the 3 events + a plain stop
async function shot(name, ev) {
  try {
    await page.evaluate(async (event) => {
      const engine = await import("/src/services/heartwood/runEngine.js")
      let run = engine.startRun("tommy", null, { forcedSeed: 0x5e7 })
      run = { ...run, phase: "shop", essence: 1200, lastSeenAct: 7, marketEvent: event }
      localStorage.setItem("heartwood-run-save-v1", JSON.stringify(engine.serializeRun(run)))
      localStorage.setItem("heartwood-story-intro-seen", "1")
      localStorage.setItem("heartwood-coach-enabled-v1", "false")
    }, ev)
    await page.reload()
    await page.waitForSelector(".hw-market-columns", { timeout: 20000 })
    await page.waitForTimeout(400)
    await page.screenshot({ path: `${SHOT}/market_event_${name}.png` })
    const banner = await page.$eval(".hw-market-event-banner", (el) => el.textContent.replace(/\s+/g, " ").trim()).catch(() => "(no banner)")
    const rerollDisabled = await page.$eval('button.hw-move-btn:has-text("Reroll")', (el) => el.disabled).catch(() => "(n/a)")
    const freezeDisabled = await page.$eval('button.hw-move-btn:has-text("Freeze")', (el) => el.disabled).catch(() => "(n/a)")
    console.log(`${name}:`, banner, "| reroll disabled:", rerollDisabled, "| freeze disabled:", freezeDisabled)
  } catch (e) {
    console.log(`shot ${name} skip:`, e.message)
  }
}
await shot("golden", "golden")
await shot("merchant", "merchant")
await shot("blackroot", "blackroot")
await shot("plain", null)

await browser.close()
const pass = R.errors.length === 0 && errs.length === 0
console.log(pass ? "\n✅ verify_market_events PASS" : "\n❌ verify_market_events FAIL")
process.exit(pass ? 0 : 1)
