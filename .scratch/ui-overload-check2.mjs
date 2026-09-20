import { chromium } from "playwright"

const PORT = 5310
const TARGET_FIGHTS = 9 // reach a multi-enemy/debuff-heavy formation, not just fight 1

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1400, height: 1100 } })
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForSelector(".hw-select-grid button")
await page.click(".hw-select-grid button")
const tutorialNext = page.locator("button.hw-tutorial-next")
if (await tutorialNext.isVisible({ timeout: 2000 }).catch(() => false)) {
  await tutorialNext.click().catch(() => {})
}

async function shopStep() {
  await page.waitForSelector(".hw-card", { timeout: 10000 })
  for (let i = 0; i < 3; i++) {
    const affordable = page.locator('.hw-card[data-disabled="false"]').first()
    if (await affordable.count()) {
      await affordable.click()
      await page.waitForTimeout(100)
    }
  }
  await page.click('button.hw-end-turn:has-text("Continue")')
}

async function relicStepIfPresent() {
  const relicHeader = page.locator("text=/relic waits/i").first()
  if (await relicHeader.isVisible({ timeout: 1500 }).catch(() => false)) {
    const affordable = page.locator('.hw-card[data-disabled="false"]').first()
    if (await affordable.count()) await affordable.click().catch(() => {})
    else await page.click('button:has-text("Skip")').catch(() => {})
    await page.waitForTimeout(200)
    return true
  }
  return false
}

async function shopStepIfPresent() {
  const marketHeader = page.locator("text=/heartwood market/i").first()
  if (await marketHeader.isVisible({ timeout: 1500 }).catch(() => false)) {
    await shopStep()
    return true
  }
  return false
}

async function clearToFormation() {
  for (let i = 0; i < 5; i++) {
    const onFormation = await page.locator('button.hw-end-turn:has-text("Start Battle")').isVisible({ timeout: 1000 }).catch(() => false)
    if (onFormation) return true
    if (await relicStepIfPresent()) continue
    if (await shopStepIfPresent()) continue
    break
  }
  return page.locator('button.hw-end-turn:has-text("Start Battle")').isVisible({ timeout: 3000 }).catch(() => false)
}

async function deployAndStart() {
  await page.waitForSelector(".hw-deck-preview .hw-card", { timeout: 10000 })
  for (let i = 0; i < 4; i++) {
    const undeployed = page.locator('.hw-deck-preview .hw-card[data-selected="false"]').first()
    if (!(await undeployed.count())) break
    await undeployed.click().catch(() => {})
    await page.waitForTimeout(80)
  }
  const startBtn = page.locator('button.hw-end-turn:has-text("Start Battle")')
  await startBtn.waitFor({ timeout: 5000 })
  await startBtn.click()
}

for (let fight = 0; fight < TARGET_FIGHTS; fight++) {
  const reached = await clearToFormation()
  if (!reached) { console.log("never reached formation at fight", fight); await browser.close(); process.exit(1) }
  await deployAndStart()
  // Let this fight fully resolve before moving to the next shop/fight,
  // EXCEPT on the final target fight, where we screenshot mid-battle
  // instead (a few rounds in, statuses accumulated, before it ends).
  if (fight < TARGET_FIGHTS - 1) {
    await page.waitForSelector(".hw-overlay", { timeout: 25000 })
    await page.click('button:has-text("Continue")')
  } else {
    await page.waitForTimeout(3500) // let several rounds play out on the real timer
    await page.screenshot({ path: ".scratch/shots/05-busy-fight.png", fullPage: true })
  }
}

console.log("errors:", errors.length, errors.slice(0, 5))
await browser.close()
