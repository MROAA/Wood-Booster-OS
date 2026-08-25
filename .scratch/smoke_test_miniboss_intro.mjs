import { chromium } from "playwright"

const PORT = process.env.PORT || 5311
const MAX_FIGHTS = 15
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

let introSeen = false
for (let fight = 0; fight < MAX_FIGHTS && !introSeen; fight++) {
  const reached = await clearToFormation()
  if (!reached) break
  const intro = page.locator("text=/standing here since before you knew the Heartwood/i").first()
  if (await intro.isVisible({ timeout: 500 }).catch(() => false)) {
    await intro.scrollIntoViewIfNeeded().catch(() => {})
    await page.waitForTimeout(300)
    await page.screenshot({ path: `${shotDir}/miniboss-intro-deepwarden.png` })
    console.log(`Deepwarden intro captured at fight ${fight}`)
    introSeen = true
    break
  }
  await formationAndBattleStep()
}

console.log("errors:", errors)
await browser.close()
if (!introSeen) {
  console.log("FAIL: never saw Deepwarden's intro line within the fight limit")
  process.exit(1)
}
console.log(errors.length === 0 ? "PASS: intro captured, no console/page errors" : `FAIL: ${errors.length} errors`)
process.exit(errors.length === 0 ? 0 : 1)
