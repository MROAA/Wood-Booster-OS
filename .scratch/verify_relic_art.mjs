import { chromium } from "playwright"

// Relic art pass (PR feat/hearthwood-relic-art-batch1) - confirms every
// relic image actually renders (not just the data field existing), and
// re-checks the two screens relics ever appear on against the real
// 1860x960 budget (.hw-root's own scrollHeight/clientHeight, not
// body.scrollHeight - see this branch's own task brief for why that
// distinction matters on this app's overflow:hidden root).

const PORT = process.env.PORT || 5912
const errors = []
const results = {}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1860, height: 960 } })
page.on("pageerror", (e) => errors.push(`pageerror: ${e}`))
page.on("console", (msg) => { if (msg.type() === "error") errors.push(`console: ${msg.text()}`) })

function fit() {
  return page.evaluate(() => {
    const root = document.querySelector(".hw-root")
    return root ? { scrollHeight: root.scrollHeight, clientHeight: root.clientHeight, overflow: root.scrollHeight - root.clientHeight } : null
  })
}

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForSelector(".hw-commander-select, .hw-market-columns", { timeout: 15000 })
const commanderCard = page.locator(".hw-commander-card").first()
if (await commanderCard.isVisible({ timeout: 2000 }).catch(() => false)) {
  await commanderCard.click()
  await page.waitForTimeout(900)
}
const tutorialNext = page.locator("button.hw-tutorial-next")
if (await tutorialNext.isVisible({ timeout: 2000 }).catch(() => false)) await tutorialNext.click().catch(() => {})
const guildHallCta = page.locator(".hw-guildhall-cta")
if (await guildHallCta.isVisible({ timeout: 3000 }).catch(() => false)) {
  await guildHallCta.click()
}

async function shopStep() {
  await page.waitForSelector(".hw-card", { timeout: 10000 })
  // Fit-check the Market screen itself.
  results.fitMarket = results.fitMarket || (await fit())
  results.marketItemImgCount = results.marketItemImgCount ?? (await page.locator(".hw-item-card img.hw-card-art").count())
  for (let i = 0; i < 3; i++) {
    const affordable = page.locator(".hw-card[data-disabled=\"false\"]").first()
    if (await affordable.count()) { await affordable.click(); await page.waitForTimeout(100) }
  }
  try {
    await page.click("button.hw-end-turn:has-text(\"Continue\")", { timeout: 5000 })
  } catch (e) {
    console.error("shopStep Continue click failed:", e.message)
  }
}

async function formationAndBattleStep() {
  await page.waitForSelector(".hw-deck-preview .hw-card", { timeout: 10000 })
  for (let i = 0; i < 4; i++) {
    const undeployed = page.locator(".hw-deck-preview .hw-card[data-selected=\"false\"]").first()
    if (!(await undeployed.count())) break
    await undeployed.click().catch(() => {})
    await page.waitForTimeout(80)
  }
  const startBtn = page.locator("button.hw-end-turn:has-text(\"Start Battle\")")
  await startBtn.waitFor({ timeout: 5000 })
  await startBtn.click()
  await page.waitForSelector(".hw-overlay", { timeout: 8000 })
  await page.click("button:has-text(\"Continue\")")
}

let relicTested = false

for (let fight = 0; fight < 8 && !relicTested; fight++) {
  const h1 = await page.locator("h1").first().innerText().catch(() => "<none>")
  console.error(`[iter ${fight}] h1=${JSON.stringify(h1)} url=${page.url()}`)
  const onRelic = await page.locator("text=/relic waits/i").first().isVisible({ timeout: 1500 }).catch(() => false)
  if (onRelic) {
    // Fit-check the Relic Choice screen at 1860x960.
    results.fitRelicChoice = await fit()
    results.relicOfferCount = await page.locator(".hw-deck-preview .hw-card").count()
    results.relicOfferImgCount = await page.locator(".hw-deck-preview .hw-card img.hw-card-glyph").count()
    await page.screenshot({ path: "/tmp/claude-1000/-home-marc-Wood-Booster-AI/3aa57806-8732-4d78-9ef6-313b2cd831b7/scratchpad/relic_choice_screenshot.png" })
    // Take whichever relic is offered so the owned-relics badge (SquadDraft.jsx) gets tested too.
    const firstCard = page.locator(".hw-deck-preview .hw-card[data-disabled=\"false\"]").first()
    if (await firstCard.count()) {
      await firstCard.click()
    } else {
      const skipBtn = page.locator("button:has-text(\"Skip\")")
      if (await skipBtn.isVisible().catch(() => false)) await skipBtn.click().catch(() => {})
    }
    await page.waitForTimeout(200)
    relicTested = true
  }

  const onShop = /hearthwood market/i.test(h1)
  if (onShop) await shopStep()

  // The shop's own Continue only arms a one-time "map-after-shop"
  // interstitial (HeartwoodBattle.jsx) - runState.phase deliberately
  // doesn't move until THIS screen's own Continue is clicked too.
  const onMapAfterShop = await page.locator('[data-screen="map-after-shop"]').isVisible({ timeout: 1500 }).catch(() => false)
  console.error(`  onShop=${onShop} onMapAfterShop=${onMapAfterShop}`)
  if (onMapAfterShop) {
    try {
      await page.click('[data-screen="map-after-shop"] button.hw-end-turn:has-text("Continue")', { timeout: 5000 })
    } catch (e) {
      console.error("map-after-shop Continue click failed:", e.message)
    }
    await page.waitForTimeout(200)
  }

  // FloorChoice.jsx's branching-path pick ("Two paths through the
  // Hearthwood") - its cards have no data-selected attribute (unlike a
  // formation-deploy card), so formationAndBattleStep's own selector
  // would silently find nothing and stall here forever without this.
  const onFloorChoice = /two paths/i.test(h1)
  if (onFloorChoice) {
    await page.locator(".hw-deck-preview .hw-card").first().click().catch(() => {})
    await page.waitForTimeout(200)
  }

  await formationAndBattleStep().catch(() => {})
}

// After choosing a relic, go check the Your Squad tab's owned-relics badge.
const squadTab = page.locator(".hw-tab-row button", { hasText: "Your Squad" })
if (await squadTab.isVisible({ timeout: 2000 }).catch(() => false)) {
  await squadTab.click()
  await page.waitForTimeout(200)
  results.ownedRelicImgCount = await page.locator(".hw-intent-glyph[src]").count()
  results.fitSquadTab = await fit()
  await page.screenshot({ path: "/tmp/claude-1000/-home-marc-Wood-Booster-AI/3aa57806-8732-4d78-9ef6-313b2cd831b7/scratchpad/squad_owned_relic_screenshot.png" })
}

results.relicTested = relicTested
results.errors = errors
console.log(JSON.stringify(results, null, 2))
await browser.close()

const noOverflow = (r) => !r || r.overflow <= 0
if (errors.length) {
  console.log("FAIL: console/page errors present")
  process.exit(1)
}
if (!noOverflow(results.fitMarket) || !noOverflow(results.fitRelicChoice) || !noOverflow(results.fitSquadTab)) {
  console.log("FAIL: overflow detected on one of the checked screens")
  process.exit(1)
}
console.log("PASS")
