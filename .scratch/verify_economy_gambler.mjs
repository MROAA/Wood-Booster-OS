import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

// Hearthwood economy: The Gambler (economy.js's ECONOMY_ROLES.gambler) -
// the 5th named archetype from the Economy System PRD §30 ("Event
// rewards improved / Risk increased"), the last of 5 still unbuilt
// (Trader needs a 2nd currency this game doesn't have). Doubles the
// Market Event roll chance and skews which event lands toward the two
// highest-variance ones (Golden/Blackroot), away from the mild
// Wandering Merchant - Ragpicker (sell-side, not risk) stays untouched.

const PORT = process.env.PORT || 5506
const ROOT = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-economy-gambler"
const DIR = `${ROOT}/.scratch/shots`
await mkdir(DIR, { recursive: true })

const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1536, height: 960 } })).newPage()
const errs = []
page.on("pageerror", (e) => errs.push(String(e)))

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForSelector(".hw-commander-card", { timeout: 20000 })

const out = { ok: {}, detail: {} }

// ---- 1. Pure engine logic ----------------------------------------
const engine = await page.evaluate(async () => {
  const { UNITS } = await import("/src/data/heartwood/units.js")
  const { ECONOMY_ROLES, economyCrewEffects } = await import("/src/data/heartwood/economy.js")
  const { pickMarketEvent, startRun } = await import("/src/services/heartwood/runEngine.js")
  const r = { ok: {}, detail: {} }

  // The unit itself: real, tiny stats, correct role.
  const def = UNITS["fortunes-root"]
  r.detail.def = def && { name: def.name, recruitCost: def.recruitCost, economyRole: def.economyRole }
  // cost:2 in the unit() call is a tier HINT (-> "uncommon" -> 100
  // Essence via TIER_COST), not a literal Essence value - matches
  // toll-warden/hollow-forager's own same tier exactly.
  r.ok.unitExists = def?.name === "Fortune's Root" && def.economyRole === "gambler" && def.recruitCost === 100

  // economyCrewEffects picks up a deployed Gambler.
  let rs = startRun("tommy")
  rs = { ...rs, bench: [{ key: 1, defId: "fortunes-root", upgradeLevel: 0 }], deployed: [1, null, null, null] }
  const fx = economyCrewEffects(rs)
  r.detail.fx = fx
  r.ok.effectsPickedUp = fx.eventChanceMult === 2 && fx.eventHot === true

  // Undeployed (benched but not fielded) grants nothing - "only while
  // deployed" holds for the 5th role same as the other 4.
  const rsBenched = { ...rs, deployed: [null, null, null, null] }
  const fxBenched = economyCrewEffects(rsBenched)
  r.ok.onlyWhileDeployed = fxBenched.eventChanceMult === 1 && fxBenched.eventHot === false

  // Two Gamblers deployed stack the chance multiplicatively (4x).
  const rs2 = {
    ...rs,
    bench: [{ key: 1, defId: "fortunes-root", upgradeLevel: 0 }, { key: 2, defId: "fortunes-root", upgradeLevel: 0 }],
    deployed: [1, 2, null, null],
  }
  r.ok.stacksMultiplicatively = economyCrewEffects(rs2).eventChanceMult === 4

  // pickMarketEvent: hot mode is reachable and skews toward Golden/
  // Blackroot vs the cold default, over enough seeds to be conclusive.
  const NODE = 20
  const tallyCold = { merchant: 0, blackroot: 0, golden: 0, ragpicker: 0 }
  const tallyHot = { merchant: 0, blackroot: 0, golden: 0, ragpicker: 0 }
  for (let s = 0; s < 4000; s++) {
    const cold = pickMarketEvent(5000 + s, NODE, false, 1, false)
    if (cold) tallyCold[cold]++
    const hot = pickMarketEvent(5000 + s, NODE, false, 1, true)
    if (hot) tallyHot[hot]++
  }
  r.detail.tallyCold = tallyCold
  r.detail.tallyHot = tallyHot
  const coldEvents = Object.values(tallyCold).reduce((a, b) => a + b, 0)
  const hotEvents = Object.values(tallyHot).reduce((a, b) => a + b, 0)
  r.ok.hotSkewsTowardHighVariance =
    tallyHot.golden / hotEvents > tallyCold.golden / coldEvents &&
    tallyHot.blackroot / hotEvents > tallyCold.blackroot / coldEvents &&
    tallyHot.merchant / hotEvents < tallyCold.merchant / coldEvents
  // Ragpicker (sell-side, deliberately orthogonal) stays roughly the
  // same share hot or cold - within a small tolerance for RNG noise.
  r.ok.ragpickerUnaffectedByHot = Math.abs(tallyHot.ragpicker / hotEvents - tallyCold.ragpicker / coldEvents) < 0.03

  // chanceMult actually raises the hit rate (roughly 2x more events at
  // the SAME seeds/node when chanceMult:2 vs chanceMult:1).
  let hitsMult1 = 0
  let hitsMult2 = 0
  for (let s = 0; s < 2000; s++) {
    if (pickMarketEvent(9000 + s, NODE, false, 1, false)) hitsMult1++
    if (pickMarketEvent(9000 + s, NODE, false, 2, false)) hitsMult2++
  }
  r.detail.hitsMult1 = hitsMult1
  r.detail.hitsMult2 = hitsMult2
  r.ok.chanceMultRaisesHitRate = hitsMult2 > hitsMult1 * 1.5

  // Backward compatibility: the old 2-arg / 3-arg call shapes (every
  // pre-existing verify script's own calls) are byte-identical to
  // before - defaults chanceMult=1, hot=false change nothing.
  r.ok.backwardCompatible = pickMarketEvent(424242, NODE) === pickMarketEvent(424242, NODE, false, 1, false)

  return r
})
out.ok = { ...out.ok, ...engine.ok }
out.detail = { ...out.detail, ...engine.detail }

// ---- 2. Real UI: deploy Fortune's Root, see the sidebar line -------
await page.evaluate(async () => {
  const { RUN_PATH, startRun, serializeRun, actIndexForNode } = await import("/src/services/heartwood/runEngine.js")
  const idx = 0
  let s = {
    ...startRun("tommy"),
    nodeIndex: idx,
    path: RUN_PATH.slice(0, idx + 1),
    phase: "shop",
    essence: 4000,
    bench: [{ key: 1, defId: "fortunes-root", upgradeLevel: 0 }],
    deployed: [1, null, null, null],
    shopOffers: ["world-ash-elder", "bulwark-of-ages", "the-thorn-throne"],
  }
  s.lastSeenAct = actIndexForNode(idx, RUN_PATH.length)
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(s)))
  localStorage.setItem("heartwood-autobattler-intro-seen", "true")
  localStorage.setItem("heartwood-story-intro-seen", "true")
  localStorage.setItem("heartwood-settings-v1", JSON.stringify({ master: 0, sfx: 0, music: 0, muted: true, reduceMotion: true }))
})
await page.reload()
await page.waitForSelector(".hw-economy-crew", { timeout: 10000 })
await page.waitForTimeout(300)
const gotIt = page.locator("button", { hasText: "Got it" })
if (await gotIt.count()) await gotIt.click()
await page.waitForTimeout(200)

const crewText = await page.locator(".hw-economy-crew").textContent()
out.detail.crewText = crewText
// The crew row shows the ROLE's label ("Gambler"), not the specific
// unit's flavor name ("Fortune's Root") - the same pattern every other
// economy row already uses (a Grove Merchant's row reads "Merchant",
// not "Grove Merchant").
out.ok.uiShowsGamblerLine = crewText.includes("Gambler") && crewText.includes("2x special-market odds")
await page.screenshot({ path: `${DIR}/economy_gambler_crew.png`, fullPage: true })

console.log(JSON.stringify(out, null, 2))
console.log("page errors:", errs.length, errs.slice(0, 5))
const allPass = Object.values(out.ok).every(Boolean) && errs.length === 0
console.log(allPass ? "ALL CHECKS PASS" : "FAILURES PRESENT")
await browser.close()
process.exit(allPass ? 0 : 1)
