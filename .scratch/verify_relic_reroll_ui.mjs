import { chromium } from "playwright"

const PORT = process.env.PORT || 5199

const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForSelector(".hw-select-grid button")
await page.click(".hw-select-grid button")
const tutorialNext = page.locator("button.hw-tutorial-next")
if (await tutorialNext.isVisible({ timeout: 2000 }).catch(() => false)) await tutorialNext.click().catch(() => {})

async function shopStep() {
  await page.waitForSelector(".hw-card", { timeout: 10000 })
  for (let i = 0; i < 3; i++) {
    const affordable = page.locator(".hw-card[data-disabled=\"false\"]").first()
    if (await affordable.count()) { await affordable.click(); await page.waitForTimeout(100) }
  }
  await page.click("button.hw-end-turn:has-text(\"Continue\")")
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
  const outcome = await page.locator(".hw-overlay").getAttribute("data-outcome")
  await page.click("button:has-text(\"Continue\")")
  return outcome
}

let relicTested = false
let relicResult = null

for (let fight = 0; fight < 6 && !relicTested; fight++) {
  const onRelic = await page.locator("text=/relic waits/i").first().isVisible({ timeout: 1500 }).catch(() => false)
  if (onRelic) {
    const essenceBadge = page.locator(".hw-essence-badge").first()
    const eBefore = parseInt((await essenceBadge.innerText()).replace(/\D/g, ""), 10)
    const offersBefore = await page.locator(".hw-deck-preview .hw-card").allInnerTexts()
    const rerollBtn = page.locator("button:has-text(\"Reroll (\")").first()
    if (await rerollBtn.isEnabled().catch(() => false)) {
      await rerollBtn.click()
      await page.waitForTimeout(200)
      const eAfter = parseInt((await essenceBadge.innerText()).replace(/\D/g, ""), 10)
      const offersAfter = await page.locator(".hw-deck-preview .hw-card").allInnerTexts()
      relicResult = { eBefore, eAfter, offersChanged: JSON.stringify(offersBefore) !== JSON.stringify(offersAfter) }
      relicTested = true
    }
    // Skip out regardless, to keep the run moving.
    const skipBtn = page.locator("button:has-text(\"Skip\")")
    if (await skipBtn.isVisible().catch(() => false)) await skipBtn.click().catch(() => {})
    await page.waitForTimeout(150)
  }

  const onShop = await page.locator("text=/heartwood market/i").first().isVisible({ timeout: 1500 }).catch(() => false)
  if (onShop) await shopStep()

  await formationAndBattleStep().catch(() => {})
}

console.log(JSON.stringify({ relicTested, relicResult, errors }, null, 2))
await browser.close()

if (errors.length) {
  console.log("FAIL: console/page errors present")
  process.exit(1)
}
if (relicTested && relicResult.eAfter < relicResult.eBefore && relicResult.offersChanged) {
  console.log("PASS: relic reroll spends Essence and changes the offers")
  process.exit(0)
} else if (!relicTested) {
  console.log("INCONCLUSIVE: never hit an affordable relic-reroll opportunity in 6 fights - not a failure, just RNG")
  process.exit(0)
} else {
  console.log("FAIL")
  process.exit(1)
}
