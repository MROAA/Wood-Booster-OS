import { chromium } from "playwright"

const PORT = process.env.PORT || 5350
const shotDir = process.env.SHOT_DIR || "/home/marc/Wood-Booster-AI/Wood-Booster-OS-hearthwood-animator/.scratch/shots"

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })

async function shot(name, opts = {}) {
  await page.screenshot({ path: `${shotDir}/${name}.png`, ...opts })
  console.log("shot:", name)
}

await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
await page.waitForSelector(".hw-select-grid button", { timeout: 15000 })
await page.waitForTimeout(400)
await shot("01-commander-select")

// hover state on a commander card
const firstCommander = page.locator(".hw-select-grid button").first()
await firstCommander.hover()
await page.waitForTimeout(300)
await shot("01b-commander-select-hover")

await firstCommander.click()

const tutorialNext = page.locator("button.hw-tutorial-next")
for (let i = 0; i < 8; i++) {
  if (!(await tutorialNext.isVisible({ timeout: 800 }).catch(() => false))) break
  await tutorialNext.click().catch(() => {})
  await page.waitForTimeout(150)
}
await page.waitForTimeout(500)
await shot("02-shop-market", { fullPage: true })

// hover on a shop card
const shopCard = page.locator(".hw-card").first()
if (await shopCard.isVisible({ timeout: 1000 }).catch(() => false)) {
  await shopCard.hover()
  await page.waitForTimeout(300)
  await shot("02b-shop-card-hover")
}

// buy feedback: click affordable card, screenshot immediately after (t=0) and settled (t=400ms)
const affordable = page.locator(".hw-card[data-disabled=\"false\"]").first()
if (await affordable.count()) {
  await affordable.click()
  await page.waitForTimeout(30)
  await shot("02c-buy-immediate")
  await page.waitForTimeout(400)
  await shot("02d-buy-settled")
}

// run map interstitial, if present
const mapScreen = page.locator('[data-screen="map-after-shop"]')
if (await mapScreen.isVisible({ timeout: 1500 }).catch(() => false)) {
  await shot("03-run-map")
  await page.click("button.hw-end-turn:has-text(\"Continue\")").catch(() => {})
  await page.waitForTimeout(400)
}

// continue past shop to formation
const continueBtn = page.locator("button.hw-end-turn").first()
if (await continueBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
  await continueBtn.click().catch(() => {})
  await page.waitForTimeout(500)
}

// might land on relic/choice/map screens - handle generically
for (let i = 0; i < 6; i++) {
  const onFormation = await page.locator("button.hw-end-turn:has-text(\"Start Battle\")").isVisible({ timeout: 800 }).catch(() => false)
  if (onFormation) break

  const pathChoiceHeader = page.locator("text=/two paths through the hearthwood/i").first()
  if (await pathChoiceHeader.isVisible({ timeout: 500 }).catch(() => false)) {
    await shot(`03x-floor-choice-${i}`)
    await page.locator(".hw-card--power").first().click().catch(() => {})
    await page.waitForTimeout(300)
    continue
  }

  const mapScreen2 = page.locator('[data-screen="map-after-shop"]')
  if (await mapScreen2.isVisible({ timeout: 500 }).catch(() => false)) {
    await shot(`03y-map-after-shop-${i}`)
    await page.click("button.hw-end-turn:has-text(\"Continue\")").catch(() => {})
    await page.waitForTimeout(300)
    continue
  }

  const card = page.locator(".hw-card[data-disabled=\"false\"]").first()
  if (await card.isVisible({ timeout: 500 }).catch(() => false)) {
    await card.click().catch(() => {})
    await page.waitForTimeout(200)
    continue
  }
  const skip = page.locator("button:has-text(\"Skip\")")
  if (await skip.isVisible({ timeout: 500 }).catch(() => false)) {
    await skip.click().catch(() => {})
    await page.waitForTimeout(200)
    continue
  }
  const contBtn = page.locator("button.hw-end-turn").first()
  if (await contBtn.isVisible({ timeout: 500 }).catch(() => false)) {
    await contBtn.click().catch(() => {})
    await page.waitForTimeout(300)
    continue
  }
  break
}

await page.waitForTimeout(300)
await shot("04-formation", { fullPage: true })

// hover on a deployed unit card in formation
const formCard = page.locator(".hw-deck-preview .hw-card").first()
if (await formCard.isVisible({ timeout: 1000 }).catch(() => false)) {
  await formCard.hover()
  await page.waitForTimeout(300)
  await shot("04b-formation-card-hover")
}

const startBtn = page.locator("button.hw-end-turn:has-text(\"Start Battle\")")
if (await startBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
  await startBtn.click()
  // capture transition moment
  await page.waitForTimeout(60)
  await shot("05a-battle-transition-immediate")
  await page.waitForTimeout(600)
  await shot("05b-battle-start")
  await page.waitForTimeout(2000)
  await shot("05c-battle-midway")
  await page.waitForTimeout(3000)
  await shot("05d-battle-later")

  const overlay = await page.waitForSelector(".hw-overlay", { timeout: 80000 }).catch(() => null)
  if (overlay) {
    await page.waitForTimeout(100)
    await shot("06a-victory-defeat-immediate")
    await page.waitForTimeout(500)
    await shot("06b-victory-defeat-settled")
  }
}

console.log("errors:", errors)
await browser.close()
