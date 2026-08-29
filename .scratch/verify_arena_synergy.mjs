import { chromium } from "playwright"

const PORT = process.env.PORT || 5231
const errors = []

const browser = await chromium.launch()

async function newPage() {
  const page = await browser.newPage()
  page.on("pageerror", (e) => errors.push(String(e)))
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text())
  })
  return page
}

async function enterHeartwood(page) {
  await page.goto(`http://localhost:${PORT}/heartwood`)
  await page.waitForSelector(".hw-select-grid button")
  await page.click(".hw-select-grid button")
  const tutorialNext = page.locator("button.hw-tutorial-next")
  if (await tutorialNext.isVisible({ timeout: 2000 }).catch(() => false)) await tutorialNext.click().catch(() => {})
}

async function goToFormationAndStart(page) {
  // Leaving the shop is 2 steps: SquadDraft's own Continue arms a
  // one-time "map interstitial" (HeartwoodBattle.jsx's showMapAfterShop)
  // that shows the run map with its own separate Continue button before
  // runState.phase actually advances - see that file's own comment on
  // why the check order there matters.
  await page.click("button.hw-end-turn:has-text(\"Continue\")")
  await page.waitForSelector("[data-screen=\"map-after-shop\"] button.hw-end-turn:has-text(\"Continue\")", { timeout: 5000 })
  await page.click("[data-screen=\"map-after-shop\"] button.hw-end-turn:has-text(\"Continue\")")

  // The next node might be a branching path choice (FloorChoice.jsx,
  // "Two paths through the Hearthwood") rather than the formation
  // screen directly - pick the first option when that happens.
  const floorChoice = page.locator(".hw-select-grid .hw-card--power").first()
  if (await floorChoice.isVisible({ timeout: 2000 }).catch(() => false)) {
    await floorChoice.click()
  }

  // Recruited units are auto-deployed onto the battlefield slots
  // already (runEngine.js's handleRecruit) - FormationScreen.jsx's own
  // bench list is a TOGGLE ("click to place, click again to pull
  // back"), so clicking every bench card here would actually UN-deploy
  // an already-deployed unit rather than deploy it. Just wait for the
  // screen and read the synergy tracker as-is.
  await page.waitForSelector(".hw-deck-preview .hw-card", { timeout: 10000 })
  const activeBadgeCount = await page.locator(".hw-badge--active").count()
  const startBtn = page.locator("button.hw-end-turn:has-text(\"Start Battle\")")
  await startBtn.waitFor({ timeout: 5000 })
  await startBtn.click()
  return activeBadgeCount
}

// --- Scenario A: deliberately force a 2-of-a-tribe squad, so a real
// synergy is live at battle start, and confirm the WOW banner + arena
// framing + affected-unit glow all appear, then all self-clear. ---
async function scenarioSynergyActive() {
  const page = await newPage()
  await enterHeartwood(page)

  await page.waitForSelector(".hw-card[data-disabled=\"false\"]", { timeout: 10000 })
  // Recruit #1: any affordable unit, to seed a tribe on the bench.
  await page.locator(".hw-card[data-disabled=\"false\"]").first().click()
  await page.waitForTimeout(150)

  // Recruit #2: UnitCard.jsx marks a shop offer data-tribe-match="true"
  // the instant it overlaps a tribe already on the bench (SquadDraft.jsx's
  // own ownedTribes/tribeMatch) - reroll until an affordable match shows
  // up, then buy it. Deterministic 2-of-a-tribe without needing to know
  // any unit's name/tribe ahead of time.
  let matched = false
  for (let attempt = 0; attempt < 12 && !matched; attempt++) {
    const match = page.locator(".hw-card[data-tribe-match=\"true\"][data-disabled=\"false\"]").first()
    if (await match.count()) {
      await match.click()
      matched = true
      break
    }
    const rerollBtn = page.locator("button.hw-move-btn:has-text(\"Reroll\")")
    if (await rerollBtn.isEnabled().catch(() => false)) {
      await rerollBtn.click()
      await page.waitForTimeout(120)
    } else {
      break
    }
  }

  const activeBadgeCount = await goToFormationAndStart(page)

  // .hw-arena stage should exist the moment combat renders.
  await page.waitForSelector(".hw-arena", { timeout: 10000 })
  const arenaHasGrid = await page.locator(".hw-arena .hw-grid").count()

  // The WOW banner should appear almost immediately (battle-start
  // effect), while a synergy is genuinely active.
  const sawBanner = await page
    .waitForSelector(".hw-synergy-banner", { timeout: 2500 })
    .then(() => true)
    .catch(() => false)
  const bannerText = sawBanner ? await page.locator(".hw-synergy-banner").first().innerText().catch(() => "") : ""
  const surgingPiecesAtPeak = await page.locator(".hw-piece[data-synergy-surge=\"true\"]").count()
  // Let entrance animations (piece mount fade-in) settle before the
  // reference screenshot, and take a few in a row to actually catch
  // the glow keyframe's bright half (a CSS animation mid-cycle isn't
  // guaranteed to land on any single screenshot instant).
  await page.waitForTimeout(400)
  for (let i = 0; i < 4; i++) {
    await page.screenshot({ path: `/tmp/hw-arena-synergy-peak-${i}.png`, fullPage: true }).catch(() => {})
    await page.waitForTimeout(220)
  }

  // Confirm it self-clears (no stuck banner / stuck glow) well within
  // one round-delay-and-a-bit.
  const bannerGone = await page
    .waitForSelector(".hw-synergy-banner", { state: "detached", timeout: 6000 })
    .then(() => true)
    .catch(() => false)
  await page.waitForTimeout(400)
  const surgingPiecesAfter = await page.locator(".hw-piece[data-synergy-surge=\"true\"]").count()

  // Let a couple of real rounds play out to confirm pacing/readability
  // is untouched and nothing crashes.
  await page.waitForSelector(".hw-overlay", { timeout: 25000 }).catch(() => {})

  await page.screenshot({ path: "/tmp/hw-arena-synergy-active.png", fullPage: true }).catch(() => {})
  await page.close()

  return {
    matched,
    activeBadgeCountPreBattle: activeBadgeCount,
    arenaHasGrid,
    sawBanner,
    bannerText,
    surgingPiecesAtPeak,
    bannerGone,
    surgingPiecesAfter,
  }
}

// --- Scenario B: a squad with NO tribe synergy active (exactly one
// recruited unit - a single unit can never meet a 2-count threshold) -
// confirm the WOW banner and the per-unit glow NEVER appear, so the
// feature can't ever show something that isn't true. ---
async function scenarioNoSynergy() {
  const page = await newPage()
  await enterHeartwood(page)

  await page.waitForSelector(".hw-card[data-disabled=\"false\"]", { timeout: 10000 })
  await page.locator(".hw-card[data-disabled=\"false\"]").first().click()
  await page.waitForTimeout(150)

  const activeBadgeCount = await goToFormationAndStart(page)
  await page.waitForSelector(".hw-arena", { timeout: 10000 })

  // Watch for a few seconds - long enough for the battle-start effect
  // to have fired if it were ever going to.
  await page.waitForTimeout(3500)
  const bannerCount = await page.locator(".hw-synergy-banner").count()
  const surgingCount = await page.locator(".hw-piece[data-synergy-surge=\"true\"]").count()

  await page.screenshot({ path: "/tmp/hw-arena-no-synergy.png", fullPage: true }).catch(() => {})
  await page.close()

  return { activeBadgeCountPreBattle: activeBadgeCount, bannerCount, surgingCount }
}

const a = await scenarioSynergyActive()
const b = await scenarioNoSynergy()

console.log(JSON.stringify({ scenarioSynergyActive: a, scenarioNoSynergy: b, errors }, null, 2))
await browser.close()

if (errors.length) {
  console.log("FAIL: console/page errors present")
  process.exit(1)
}

const aOk =
  a.arenaHasGrid > 0 &&
  a.sawBanner &&
  a.surgingPiecesAtPeak > 0 &&
  a.bannerGone &&
  a.surgingPiecesAfter === 0

const bOk = b.bannerCount === 0 && b.surgingCount === 0

if (aOk && bOk) {
  console.log("PASS: arena stage renders; synergy WOW banner + unit glow fire only when a real synergy is active, and self-clear cleanly; no false positive with no synergy")
  process.exit(0)
} else {
  console.log("FAIL", { aOk, bOk })
  process.exit(1)
}
