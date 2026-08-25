import { chromium } from "playwright"

const PORT = process.env.PORT || 5311
const MAX_FIGHTS = 25
const shotDir = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-heartwood-taunt/.scratch/shots"

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForSelector(".hw-select-grid button")
await page.click(".hw-select-grid button")

async function shopStep() {
  await page.waitForSelector(".hw-card", { timeout: 10000 })
  for (let i = 0; i < 3; i++) {
    const affordable = page.locator(".hw-card[data-disabled=\"false\"]").first()
    if (await affordable.count()) {
      await affordable.click()
      await page.waitForTimeout(80)
    }
  }
  await page.click("button.hw-end-turn:has-text(\"Continue\")")
}

async function relicStepIfPresent() {
  const relicHeader = page.locator("text=/relic waits/i").first()
  if (await relicHeader.isVisible({ timeout: 1000 }).catch(() => false)) {
    const affordable = page.locator(".hw-card[data-disabled=\"false\"]").first()
    if (await affordable.count()) await affordable.click().catch(() => {})
    else await page.click("button:has-text(\"Skip\")").catch(() => {})
    await page.waitForTimeout(150)
    return true
  }
  return false
}

async function shopStepIfPresent() {
  const marketHeader = page.locator("text=/heartwood market/i").first()
  if (await marketHeader.isVisible({ timeout: 1000 }).catch(() => false)) {
    await shopStep()
    return true
  }
  return false
}

async function clearToFormation() {
  for (let i = 0; i < 5; i++) {
    const onFormation = await page.locator("button.hw-end-turn:has-text(\"Start Battle\")").isVisible({ timeout: 800 }).catch(() => false)
    if (onFormation) return true
    if (await relicStepIfPresent()) continue
    if (await shopStepIfPresent()) continue
    break
  }
  return page.locator("button.hw-end-turn:has-text(\"Start Battle\")").isVisible({ timeout: 2000 }).catch(() => false)
}

async function formationAndBattleStep() {
  await page.waitForSelector(".hw-deck-preview .hw-card", { timeout: 10000 })
  for (let i = 0; i < 4; i++) {
    const undeployed = page.locator(".hw-deck-preview .hw-card[data-selected=\"false\"]").first()
    if (!(await undeployed.count())) break
    await undeployed.click().catch(() => {})
    await page.waitForTimeout(60)
  }
  const startBtn = page.locator("button.hw-end-turn:has-text(\"Start Battle\")")
  await startBtn.waitFor({ timeout: 5000 })
  await startBtn.click()
  await page.waitForSelector(".hw-overlay", { timeout: 25000 })
  await page.click("button:has-text(\"Continue\")")
}

let bannerSeen = false
for (let fight = 0; fight < MAX_FIGHTS && !bannerSeen; fight++) {
  const reached = await clearToFormation()
  if (!reached) break
  // Match the LORE paragraph text specifically, unique to the new
  // banner - the short difficulty-badge label ("The Deepening Woods")
  // already appears elsewhere on this same screen (and on SquadDraft),
  // so checking for that alone would false-positive on the pre-existing
  // badge instead of confirming the new banner actually rendered.
  const banner = page.locator("text=/canopy closes overhead/i").first()
  if (await banner.isVisible({ timeout: 500 }).catch(() => false)) {
    await banner.scrollIntoViewIfNeeded().catch(() => {})
    await page.waitForTimeout(300)
    await page.screenshot({ path: `${shotDir}/act-banner-deepening-woods.png` })
    console.log(`Act banner captured at fight ${fight}`)
    bannerSeen = true
    break
  }
  await formationAndBattleStep()
}

console.log("errors:", errors)
await browser.close()
if (!bannerSeen) {
  console.log("FAIL: never saw the act-crossing banner within the fight limit")
  process.exit(1)
}
console.log(errors.length === 0 ? "PASS: banner captured, no console/page errors" : `FAIL: ${errors.length} errors`)
process.exit(errors.length === 0 ? 0 : 1)
