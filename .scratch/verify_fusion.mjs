// Fusion tiers + reward (docs/hearthwood-fusion-design.md):
// base x3 -> Tier 2, Tier 2 x3 -> Tier 3, each fusion queues a 1-of-3
// reward; the reward modal shows in Headquarters and applies the pick.
// usage: PORT=5173 node .scratch/verify_fusion.mjs [shotPrefix]
import { chromium } from "playwright"
const PORT = process.env.PORT || 5173, SHOT = process.argv[2]
const b = await chromium.launch()
const page = await (await b.newContext({ viewport: { width: 1536, height: 864 } })).newPage()
const errs = []; page.on("pageerror", (e) => errs.push(e.message))
await page.goto(`http://localhost:${PORT}/heartwood`)
const c = {}
const eng = await page.evaluate(async () => {
  const E = await import("/src/services/heartwood/runEngine.js")
  const { UNITS } = await import("/src/data/heartwood/units.js")
  const base = { ...E.startRun("tommy", null, { forcedSeed: 777 }), essence: 5000 }
  const mk = (defId, i) => ({ key: 100 + i, defId, upgradeLevel: 0, upgrades: [] })
  // Tier 2
  let rs = { ...base, bench: [mk("the-fool", 0), mk("the-fool", 1)], benchKeyCounter: 200, shopOffers: ["the-fool", "the-fool", "the-fool"] }
  rs = E.recruitUnit(rs, "the-fool")
  const t2 = { ids: rs.bench.map((e) => e.defId), rewards: (rs.pendingFusionRewards || []).map((r) => [r.tier, r.options.length]) }
  const e0 = rs.essence
  const spoils = rs.pendingFusionRewards[0].options.find((o) => o.id === "spoils")
  const pick = spoils ? "spoils" : rs.pendingFusionRewards[0].options[0].id
  const after = E.chooseFusionReward(rs, pick)
  // Tier 3: two Tier 2 + two base + recruit one more base
  let r3 = { ...base, bench: [mk("the-fool+", 0), mk("the-fool+", 1), mk("the-fool", 2), mk("the-fool", 3)], benchKeyCounter: 300, shopOffers: ["the-fool", "the-fool", "the-fool"] }
  r3 = E.recruitUnit(r3, "the-fool")
  const t3def = UNITS["the-fool++"]
  return {
    t2, t3: { ids: r3.bench.map((e) => e.defId), tiers: (r3.pendingFusionRewards || []).map((r) => r.tier) },
    spoilsOk: pick !== "spoils" || after.essence === e0 + 60, queueShrinks: (after.pendingFusionRewards || []).length === 0,
    t3Stronger: t3def && t3def.maxHp > UNITS["the-fool+"].maxHp && t3def.displayTier === 3 && t3def.fusedFrom === "the-fool",
    sameRollTwice: JSON.stringify(E.recruitUnit({ ...base, bench: [mk("the-fool", 0), mk("the-fool", 1)], benchKeyCounter: 200, shopOffers: ["the-fool"] }, "the-fool").pendingFusionRewards) === JSON.stringify(rs.pendingFusionRewards),
    seedForPage: E.serializeRun({ ...r3, phase: "shop", path: base.path, nodeIndex: 0 }),
  }
})
c.tier2Fuses = eng.t2.ids.length === 1 && eng.t2.ids[0] === "the-fool+"
c.tier2Reward = JSON.stringify(eng.t2.rewards) === JSON.stringify([[2, 3]])
c.spoilsPays = eng.spoilsOk && eng.queueShrinks
c.tier3Fuses = eng.t3.ids.length === 1 && eng.t3.ids[0] === "the-fool++" && JSON.stringify(eng.t3.tiers) === JSON.stringify([2, 3])
c.tier3Stronger = !!eng.t3Stronger
c.rewardsReproducible = eng.sameRollTwice
// UI: the two queued rewards appear one after another in Headquarters
await page.evaluate((save) => { localStorage.clear(); localStorage.setItem("heartwood-run-save-v1", JSON.stringify(save)); localStorage.setItem("hw-market-view", "table"); localStorage.setItem("hw-layout-tools", "0"); localStorage.setItem("heartwood-story-intro-seen", "true"); localStorage.setItem("hw-tactics-training-offered", "1") }, eng.seedForPage)
await page.reload(); await page.waitForTimeout(1500)
c.modalShows = (await page.locator(".hw-fusion-overlay").count()) === 1 && (await page.locator(".hw-fusion-option").count()) === 3
c.firstIsTier2 = (await page.locator(".hw-fusion-panel").getAttribute("data-tier")) === "2"
if (SHOT) await page.screenshot({ path: `${SHOT}-reward.png` })
await page.locator(".hw-fusion-option").first().click(); await page.waitForTimeout(500)
c.secondIsTier3 = (await page.locator(".hw-fusion-panel").getAttribute("data-tier")) === "3"
if (SHOT) await page.screenshot({ path: `${SHOT}-reward3.png` })
await page.locator(".hw-fusion-option").first().click(); await page.waitForTimeout(500)
c.modalGone = (await page.locator(".hw-fusion-overlay").count()) === 0
c.goldFrame = (await page.locator('.hwq-cards .hw-card[data-fusion-tier="3"]').count()) === 1
if (SHOT) await page.screenshot({ path: `${SHOT}-hq.png` })
const pass = Object.values(c).every(Boolean) && errs.length === 0
console.log(JSON.stringify({ c, errs: errs.slice(0, 4) }, null, 1))
console.log(pass ? "PASS" : "FAIL")
await b.close(); process.exit(pass ? 0 : 1)
