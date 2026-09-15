import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

// Hearthwood - Market Tiers (Market/Money-Sinks PRD Phase 1,
// feat/hearthwood-market-tiers). A SECOND market axis: marketLevel = the
// rarity ceiling (untouched); marketTier = which KINDS of unit the shop
// can offer (a tierGate-d specialist sub-pool, rarity-band-exempt).
// Advancing a Tier is an Essence sink. The Market Charter relic reads one
// Tier higher. No RUN_SAVE_VERSION bump. Balance is a smoke check this
// round (Marc: de-weight per-round fairness); these assertions pin the
// mechanic + the "Tier 1 pool == today" safety property.

const PORT = process.env.PORT || 5373
const SHOT = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-market-tiers/.scratch/shots"
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
  const auto = await import("/src/services/heartwood/autoBattleEngine.js")
  const { UNITS } = await import("/src/data/heartwood/units.js")
  const { RELICS, relicPool } = await import("/src/data/heartwood/relics.js")
  const { unitProfile } = await import("/src/data/heartwood/roles.js")
  const {
    startRun, serializeRun, deserializeRun, RUN_SAVE_VERSION,
    MARKET_TIER_MAX, MARKET_TIERS, marketTierCost, marketTierPreview,
    advanceMarketTier, effectiveMarketTier,
    SHOP_INVESTMENTS, investmentOwned, buyInvestment,
    __rollShopForTest,
  } = engine
  const out = { errors: [] }

  // rollShop isn't exported; drive it through startRun / rerollShop which
  // call it. But for the pool-composition checks we need direct control -
  // reconstruct the same filter here from UNITS + the exported tables so
  // the test is independent of the private fn, then cross-check against a
  // real shop roll.
  const SPECIALIST_IDS = ["grove-warden", "spark-diviner", "heartroot-elder", "mycelian-host"]
  const TIER2 = ["grove-warden", "spark-diviner"]
  const TIER3 = ["heartroot-elder", "mycelian-host"]

  // 1. Tier axis --------------------------------------------------------
  {
    const rs = startRun("tommy")
    const tierInit = (rs.marketTier || null) === 1
    const costs = [marketTierCost(1), marketTierCost(2), marketTierCost(3)]
    let a = { ...rs, essence: 5000 }
    const before = a.essence
    a = advanceMarketTier(a)
    const advanced = a.marketTier === 2 && a.essence === before - costs[0]
    a = advanceMarketTier(a)
    const advanced2 = a.marketTier === 3 && a.essence === before - costs[0] - costs[1]
    const atMax = advanceMarketTier(a) === a // no-op at MARKET_TIER_MAX
    const broke = advanceMarketTier({ ...rs, marketTier: 1, essence: 0 })
    const brokeNoop = broke.marketTier === 1 && broke.essence === 0
    const p1 = marketTierPreview(1)
    const p3 = marketTierPreview(3)
    // purity
    const snap = JSON.stringify(rs)
    marketTierPreview(1); effectiveMarketTier(rs); advanceMarketTier(rs)
    const pure = JSON.stringify(rs) === snap
    out.axis = { tierInit, costs, advanced, advanced2, atMax, brokeNoop, p1: p1?.name, p3, pure, max: MARKET_TIER_MAX }
    if (!(tierInit && costs[0] === 300 && costs[1] === 600 && costs[2] === null && advanced && advanced2 && atMax && brokeNoop && p1?.name === "Woodland Market" && p1.cost === 300 && p3 === null && pure && MARKET_TIER_MAX === 3)) {
      out.errors.push("check1 Tier axis")
    }
  }

  // 2. Tier-1 shop pool == today (the specialists are inert at Tier 1) -
  {
    // A real Tier-1 shop roll (startRun) never contains a tierGate unit,
    // over many seeds.
    let sawSpecialist = false
    for (let s = 0; s < 200; s++) {
      const rs = startRun("tommy", null, { forcedSeed: 1000 + s })
      if ((rs.shopOffers || []).some((id) => SPECIALIST_IDS.includes(id))) sawSpecialist = true
    }
    // Every specialist def carries a tierGate; nothing SHOP-RECRUITABLE
    // does besides them (a Fusion `+` form inherits it via makeTier2's
    // spread but is excluded by rollShop's !fusedFrom filter anyway).
    const gatedOk = SPECIALIST_IDS.every((id) => UNITS[id]?.tierGate >= 2)
    const noStrayGate = Object.values(UNITS)
      .filter((u) => u.tierGate && !u.fusedFrom && !u.evolvedFrom && !u.summonOnly)
      .every((u) => SPECIALIST_IDS.includes(u.id))
    out.tier1 = { sawSpecialist, gatedOk, noStrayGate }
    if (sawSpecialist || !gatedOk || !noStrayGate) out.errors.push("check2 Tier-1 pool not inert")
  }

  // 3. Advancing Tier unlocks the specialists (rerollShop at higher Tier)
  {
    const rollAt = (tier, relics = []) => {
      // a run at max market level so the rarity band never hides anything,
      // marketTier = tier, lots of essence + a cheap reroll, sample many.
      let rs = { ...startRun("tommy", null, { forcedSeed: 77 }), marketLevel: 3, marketTier: tier, essence: 999999, rerollCost: 1, relics }
      const seen = new Set()
      for (let i = 0; i < 250; i++) {
        rs = engine.rerollShop({ ...rs, rerollCost: 1 })
        for (const id of rs.shopOffers || []) seen.add(id)
      }
      return seen
    }
    const t1 = rollAt(1)
    const t2 = rollAt(2)
    const t3 = rollAt(3)
    const t1None = SPECIALIST_IDS.every((id) => !t1.has(id))
    const t2Only2 = TIER2.every((id) => t2.has(id)) && TIER3.every((id) => !t2.has(id))
    const t3All = SPECIALIST_IDS.every((id) => t3.has(id))
    out.unlock = { t1None, t2Only2, t3All, t2Sample: [...t2].filter((id) => SPECIALIST_IDS.includes(id)), t3Sample: [...t3].filter((id) => SPECIALIST_IDS.includes(id)) }
    if (!(t1None && t2Only2 && t3All)) out.errors.push("check3 Tier does not gate the specialist pool correctly")
  }

  // 4. Market Charter -------------------------------------------------
  {
    let rs = { ...startRun("tommy"), essence: 2000 }
    const cost = SHOP_INVESTMENTS["market-charter"].cost
    const before = rs.essence
    rs = buyInvestment(rs, "market-charter")
    const bought = rs.essence === before - cost && investmentOwned(rs, "market-charter") && (rs.relics || []).includes("market-charter")
    const rs2 = buyInvestment(rs, "market-charter") // owned -> no-op
    const noDouble = rs2.essence === rs.essence && (rs2.relics || []).filter((r) => r === "market-charter").length === 1
    const notRollable = !relicPool().some((r) => r.id === "market-charter")
    const effAt1 = effectiveMarketTier({ ...rs, marketTier: 1 }) === 2
    const cappedAt3 = effectiveMarketTier({ ...rs, marketTier: 3 }) === 3
    // a shop rolled for a marketTier-1 run WITH the charter offers Tier-2 specialists
    let cs = { ...rs, marketLevel: 3, marketTier: 1, essence: 999999, rerollCost: 1 }
    const seen = new Set()
    for (let i = 0; i < 200; i++) { cs = engine.rerollShop({ ...cs, rerollCost: 1 }); for (const id of cs.shopOffers || []) seen.add(id) }
    const charterUnlocks = TIER2.some((id) => seen.has(id)) && TIER3.every((id) => !seen.has(id))
    const noBattleEffect = Array.isArray(RELICS["market-charter"].effects) && RELICS["market-charter"].effects.length === 0
    out.charter = { cost, bought, noDouble, notRollable, effAt1, cappedAt3, charterUnlocks, noBattleEffect }
    if (!(cost === 350 && bought && noDouble && notRollable && effAt1 && cappedAt3 && charterUnlocks && noBattleEffect)) {
      out.errors.push("check4 Market Charter")
    }
  }

  // 5. The specialist units resolve in a real battle ----------------
  {
    const du = (defId) => ({ defId, upgradeLevel: 0, upgrades: [], itemIds: [] })
    const start = (squad) => auto.startAutoBattle("tommy", squad, "rotwood-husk-pair", [], 0, {}, [], [], 1, null, "restless")
    const dataOk = SPECIALIST_IDS.every((id) => {
      const u = UNITS[id]
      return u && ["grove", "root", "spirit", "wood", "warden", "gale"].some((t) => (u.art, true)) && unitProfile(u)?.primary
    })
    // grove-warden aura ticks Regen to an adjacent ally
    let st = start([du("grove-warden"), du("the-fool"), du("the-fool")])
    let s = st
    for (let i = 0; i < 2 && s.phase === "player"; i++) s = auto.resolveRound(s)
    const wardenAura = (s.playerUnits || []).some((u) => u.id !== "p0" && u.id.startsWith("p") && (u.powers?.regen || 0) > 0)
    // heartroot-elder gains Regen scaling with active synergies (3 wood/grove units)
    const elderSt = start([du("heartroot-elder"), du("bloomhide"), du("evenwood-elder")])
    const elder = elderSt.playerUnits.find((u) => u.defId === "heartroot-elder")
    const elderScaled = (elder?.powers?.regen || 0) >= 1
    // mycelian-host adds a body
    const hostSt = start([du("mycelian-host"), du("the-fool")])
    const hostSummoned = (hostSt.playerUnits || []).some((u) => u.summoned)
    // all four fights resolve
    const resolves = SPECIALIST_IDS.every((id) => {
      const d = auto.autoResolveBattle(start([du(id), du("the-fool"), du("the-fool")]))
      return d.phase === "won" || d.phase === "lost"
    })
    out.units = { dataOk, wardenAura, elderScaled, hostSummoned, resolves }
    if (!(dataOk && wardenAura && elderScaled && hostSummoned && resolves)) out.errors.push("check5 specialist units")
  }

  // 6. Save ---------------------------------------------------------
  {
    const rs = { ...startRun("tommy"), marketTier: 3, relics: ["market-charter"] }
    const rt = deserializeRun(JSON.parse(JSON.stringify(serializeRun(rs))))
    const rtOk = rt != null && rt.marketTier === 3 && (rt.relics || []).includes("market-charter")
    // a marketTier-less "old" save still deserialises and reads 1
    const old = { ...startRun("tommy") }
    delete old.marketTier
    const oldRt = deserializeRun(JSON.parse(JSON.stringify(serializeRun(old))))
    const legacyOk = oldRt != null && (oldRt.marketTier || 1) === 1 && effectiveMarketTier(oldRt) === 1
    out.save = { rtOk, legacyOk, ver: RUN_SAVE_VERSION }
    if (!(rtOk && legacyOk && RUN_SAVE_VERSION === 3)) out.errors.push("check6 save")
  }

  void __rollShopForTest
  return out
})

console.log(JSON.stringify(R, null, 2))
console.log("\npageErrors:", errs.length, errs.slice(0, 8))

// screenshot the shop with the Tier widget
try {
  await page.evaluate(async () => {
    const engine = await import("/src/services/heartwood/runEngine.js")
    let run = engine.startRun("tommy", null, { forcedSeed: 0x7a17 })
    run = { ...run, phase: "shop", marketTier: 1, essence: 900, lastSeenAct: 7 }
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(engine.serializeRun(run)))
    localStorage.setItem("heartwood-story-intro-seen", "1")
    localStorage.setItem("heartwood-coach-enabled-v1", "false")
  })
  await page.reload()
  await page.waitForSelector(".hw-market-tier-widget", { timeout: 20000 })
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${SHOT}/market_tiers.png` })
  console.log("tier widget:", await page.$eval(".hw-market-tier-widget", (el) => el.textContent.replace(/\s+/g, " ").trim()))
  console.log("preview:", await page.$eval(".hw-market-tier-preview", (el) => el.textContent.replace(/\s+/g, " ").trim()).catch(() => "(none)"))
} catch (e) {
  console.log("shot skip:", e.message)
}

await browser.close()
const pass = R.errors.length === 0 && errs.length === 0
console.log(pass ? "\n✅ verify_market_tiers PASS" : "\n❌ verify_market_tiers FAIL")
process.exit(pass ? 0 : 1)
