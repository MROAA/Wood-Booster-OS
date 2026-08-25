import { chromium } from "playwright"

const PORT = process.env.PORT || 5310

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForSelector(".hw-select-grid button")
await page.click(".hw-select-grid button")

const tutorialNext = page.locator("button.hw-tutorial-next")
if (await tutorialNext.isVisible({ timeout: 2000 }).catch(() => false)) {
  await tutorialNext.click().catch(() => {})
}

async function shopStep() {
  await page.waitForSelector(".hw-card", { timeout: 10000 })
  await page.click("button.hw-end-turn:has-text(\"Continue\")").catch(() => {})
}

async function mapStepIfPresent() {
  const mapScreen = page.locator('[data-screen="map-after-shop"]').first()
  if (await mapScreen.isVisible({ timeout: 1500 }).catch(() => false)) {
    await page.click("button.hw-end-turn:has-text(\"Continue\")").catch(() => {})
    await page.waitForTimeout(200)
    return true
  }
  return false
}

async function relicStepIfPresent() {
  const relicHeader = page.locator("text=/relic waits/i").first()
  if (await relicHeader.isVisible({ timeout: 1500 }).catch(() => false)) {
    const affordable = page.locator(".hw-card[data-disabled=\"false\"]").first()
    if (await affordable.count()) {
      await affordable.click().catch(() => {})
    } else {
      await page.click("button:has-text(\"Skip\")").catch(() => {})
    }
    await page.waitForTimeout(200)
    return true
  }
  return false
}

async function shopStepIfPresent() {
  const marketHeader = page.locator("text=/hearthwood market/i").first()
  if (await marketHeader.isVisible({ timeout: 1500 }).catch(() => false)) {
    await shopStep()
    return true
  }
  return false
}

let found = false
for (let i = 0; i < 12 && !found; i++) {
  const choiceHeader = page.locator("text=/two paths through the hearthwood/i").first()
  if (await choiceHeader.isVisible({ timeout: 1500 }).catch(() => false)) {
    found = true
    break
  }
  const wasMap = await mapStepIfPresent()
  if (wasMap) continue
  const wasRelic = await relicStepIfPresent()
  if (wasRelic) continue
  const wasShop = await shopStepIfPresent()
  if (wasShop) continue

  // Not a pre-battle screen and not the choice screen - must be
  // formation/battle. Play through a normal fight to advance.
  const startBtn = page.locator("button.hw-end-turn:has-text(\"Start Battle\")")
  if (await startBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
    await startBtn.click().catch(() => {})
    await page.waitForSelector(".hw-overlay", { timeout: 80000 }).catch(() => {})
    await page.click("button:has-text(\"Continue\")").catch(() => {})
    await page.waitForTimeout(200)
  }
}

if (found) {
  await page.waitForTimeout(400)
  await page.screenshot({ path: "/tmp/claude-1000/-home-marc-Wood-Booster-AI/8af3515f-c6b1-4793-ae5e-973e0a5425ec/scratchpad/floor_choice.png" })
  console.log("SCREENSHOT_OK")
} else {
  console.log("NEVER_REACHED_CHOICE")
}
console.log("errors:", JSON.stringify(errors))
await browser.close()
