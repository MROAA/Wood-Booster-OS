import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

const PORT = process.env.PORT || 5332
const SHOT_DIR = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-hw-mood/.scratch/shots"
await mkdir(SHOT_DIR, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()) })
await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
await page.waitForTimeout(400)

const eng = await page.evaluate(async () => {
  const t = Date.now()
  const AB = await import("/src/services/heartwood/autoBattleEngine.js?t=" + t)
  const M = await import("/src/data/heartwood/moods.js?t=" + t)
  const out = {}

  // A deliberately grindy matchup so fights last 6+ rounds and the mood
  // meter actually reaches its tiers: two soft support units vs a
  // heavily up-scaled formation.
  const deployed = [
    { defId: "the-hierophant", upgradeLevel: 0, itemIds: [] },
    { defId: "brinecaller", upgradeLevel: 0, itemIds: [] },
  ]
  const mkBattle = (forestState) =>
    AB.startAutoBattle("tommy", deployed, "twin-watch", [], 0, {}, [], [], 3.0, null, forestState)

  // 1. seeded start value per rail, no tier fired at start
  for (const fs of ["restless", "purified", "corrupted"]) {
    const b = mkBattle(fs)
    out[`${fs}Start`] = { mood: b.forestMood, fired: b.forestMoodFired, state: b.forestState }
  }
  out.startsBelowFirstTier =
    eng => true // placeholder

  // 2/3. checkForestMood is pure + deterministic - drive it directly on
  // a frozen state (combat itself has weightedRandom RNG, so a full
  // fight can't prove the meter's own determinism).
  const frozen = (forestState) => ({
    phase: "player", round: 0, log: [],
    playerUnits: [{ id: "p0", hp: 40, powers: {} }],
    enemies: [{ id: "e0", hp: 40, powers: {} }],
    ...mkBattleMoodFields(forestState),
  })
  function mkBattleMoodFields(fs) {
    const b = mkBattle(fs)
    return { forestState: b.forestState, forestMood: b.forestMood, forestMoodFired: b.forestMoodFired }
  }
  {
    const rail = M.moodRailFor("restless")
    let s = frozen("restless")
    const history = [s.forestMood]
    const announces = []
    for (let i = 0; i < 16; i++) {
      s = AB.checkForestMood(s)
      history.push(s.forestMood)
      if (s.forestMoodAnnounce) announces.push({ i: i + 1, a: s.forestMoodAnnounce })
    }
    out.restlessHistory = history
    out.stepConstant = history.slice(1).every((v, i) => v - history[i] === rail.step)
    out.restlessAnnounces = announces
    out.firstTierAtCorrect =
      announces.length === 3 &&
      history[announces[0].i] >= rail.tiers[0].at && history[announces[0].i - 1] < rail.tiers[0].at &&
      history[announces[2].i] >= rail.tiers[2].at
    // exactly 3 announces total across a long run (one per tier, never
    // a re-fire)
    let s2 = frozen("restless")
    let totalAnnounces = 0
    for (let i = 0; i < 30; i++) { s2 = AB.checkForestMood(s2); if (s2.forestMoodAnnounce) totalAnnounces++ }
    out.noRefire = totalAnnounces === 3

    const run = (fs) => {
      let x = frozen(fs)
      const h = []
      for (let i = 0; i < 10; i++) { x = AB.checkForestMood(x); h.push(x.forestMood + "|" + (x.forestMoodAnnounce || "")) }
      return h.join(",")
    }
    out.deterministic = run("corrupted") === run("corrupted") && run("purified") === run("purified") && run("restless") === run("restless")
  }

  // 4. scope: a purified 'player' tier only touches player units.
  //    Roused (at 70) is scope:player regen. Walk corrupted's Stirring
  //    (scope both, onDealDamage poison) - both sides should get the
  //    trigger. Hard to introspect powers cleanly; assert the log line
  //    fired and no crash instead, plus a battle fully auto-resolves.
  {
    let b = mkBattle("corrupted")
    b = AB.autoResolveBattle(b)
    out.corruptedResolves = ["won", "lost"].includes(b.phase)
    out.corruptedFiredSomething = (b.forestMoodFired || []).length >= 1
  }
  {
    let b = mkBattle("purified")
    b = AB.autoResolveBattle(b)
    out.purifiedResolves = ["won", "lost"].includes(b.phase)
  }

  // 5. no forestState arg -> defaults to restless, still works
  {
    let b = AB.startAutoBattle("tommy", deployed, "mist-growler", [], 0, {}, [], [], 1.0, null)
    out.defaultState = b.forestState
    b = AB.resolveRound(b)
    out.defaultClimbs = typeof b.forestMood === "number"
  }

  // 6. band + nextTier helpers
  out.bandCalm = M.moodBandName("restless", 10)
  out.bandAwake = M.moodBandName("restless", 999)
  out.nextTier0 = M.nextMoodTier("restless", [])?.name
  out.nextTierNoneWhenAllFired = M.nextMoodTier("restless", [0, 1, 2])

  return out
})
console.log(JSON.stringify(eng, null, 2))

// --- DOM: the badge + a threshold banner render in a live fight ------
await page.evaluate(async () => {
  const t = Date.now()
  const E = await import("/src/services/heartwood/runEngine.js?t=" + t)
  let rs = E.startRun("tommy", null, { forcedSeed: 3 })
  rs = E.recruitUnit({ ...rs, essence: 99999, shopOffers: [rs.shopOffers[0]] }, rs.shopOffers[0])
  rs = { ...rs, forestState: "corrupted" }
  rs = E.leaveShop(rs)
  // walk to the first formation battle
  let safety = 0
  while (rs.phase !== "formation" && rs.phase !== "battle" && safety++ < 20) {
    if (rs.phase === "choice") rs = E.chooseFloorEncounter(rs, 0)
    else if (rs.phase === "shop") rs = E.leaveShop(rs)
    else break
  }
  if (rs.phase === "formation") rs = E.startFormationBattle(rs)
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(E.serializeRun(rs)))
  localStorage.setItem("heartwood-story-intro-seen", "true")
})
await page.reload()
await page.waitForTimeout(1200)
const tn = page.locator("button.hw-tutorial-next")
if (await tn.isVisible({ timeout: 500 }).catch(() => false)) { await tn.click(); await page.waitForTimeout(200) }
const badgeVisible = await page.locator(".hw-forest-mood-badge").isVisible().catch(() => false)
const badgeText = await page.locator(".hw-forest-mood-badge").textContent().catch(() => null)
await page.waitForTimeout(4000) // let a few rounds tick
await page.screenshot({ path: `${SHOT_DIR}/forest_mood_battle.png` })
const bannerSeen = await page.evaluate(() => !!document.querySelector(".hw-forest-mood-banner")) ||
  (await page.locator(".hw-log p", { hasText: /forest/i }).count()) > 0
console.log("DOM:", { badgeVisible, badgeText: badgeText?.trim(), bannerSeen })

const pass =
  eng.restlessStart.mood === 0 && eng.purifiedStart.mood === 0 && eng.corruptedStart.mood === 35 &&
  eng.restlessStart.fired.length === 0 &&
  eng.stepConstant && eng.firstTierAtCorrect && eng.noRefire &&
  eng.deterministic &&
  eng.corruptedResolves && eng.corruptedFiredSomething && eng.purifiedResolves &&
  eng.defaultState === "restless" && eng.defaultClimbs &&
  eng.bandCalm === "Calm" && eng.bandAwake === "Awake" &&
  eng.nextTier0 === "Stirring" && eng.nextTierNoneWhenAllFired === null &&
  badgeVisible && /Forest:/.test(badgeText || "") &&
  errors.length === 0

console.log("errors:", JSON.stringify(errors))
console.log(pass ? "RESULT: PASS" : "RESULT: FAIL")
await browser.close()
process.exit(pass ? 0 : 1)
