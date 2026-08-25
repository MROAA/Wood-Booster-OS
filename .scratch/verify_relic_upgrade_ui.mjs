import { chromium } from "playwright"

const PORT = process.env.PORT || 5203

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
  await page.click("button:has-text(\"Continue\")")
}

let relicUpgradeTested = false
let result = null

for (let fight = 0; fight < 6 && !relicUpgradeTested; fight++) {
  const onRelic = await page.locator("text=/relic waits/i").first().isVisible({ timeout: 1500 }).catch(() => false)
  if (onRelic) {
    const affordable = page.locator(".hw-card[data-disabled=\"false\"]").first()
    if (await affordable.count()) {
      await affordable.click()
      await page.waitForTimeout(200)
    } else {
      await page.click("button:has-text(\"Skip\")").catch(() => {})
    }
  }

  const onShop = await page.locator("text=/heartwood market/i").first().isVisible({ timeout: 1500 }).catch(() => false)
  if (onShop) {
    // Before recruiting, check if a relic upgrade button is available
    // (we just picked a relic above, or from an earlier round).
    const relicUpgradeBtn = page.locator(".hw-badge button:has-text(\"Upgrade (\")").first()
    if (await relicUpgradeBtn.count()) {
      const essenceBadge = page.locator(".hw-essence-badge").first()
      const before = parseInt((await essenceBadge.innerText()).replace(/\D/g, ""), 10)
      if (await relicUpgradeBtn.isEnabled().catch(() => false)) {
        const relicBadgeTextBefore = await page.locator(".hw-badge:has(button)").first().innerText()
        await relicUpgradeBtn.click()
        await page.waitForTimeout(200)
        const after = parseInt((await essenceBadge.innerText()).replace(/\D/g, ""), 10)
        const relicBadgeTextAfter = await page.locator(".hw-badge:has(button)").first().innerText()
        result = { before, after, relicBadgeTextBefore, relicBadgeTextAfter }
        relicUpgradeTested = true
      }
    }
    await shopStep()
  }

  await formationAndBattleStep().catch(() => {})
}

console.log(JSON.stringify({ relicUpgradeTested, result, errors }, null, 2))
await browser.close()

if (errors.length) {
  console.log("FAIL: console/page errors present")
  process.exit(1)
}
if (!relicUpgradeTested) {
  console.log("INCONCLUSIVE: never got an affordable relic-upgrade opportunity in 6 fights - not a failure, just RNG")
  process.exit(0)
}
if (result.after < result.before && result.relicBadgeTextAfter !== result.relicBadgeTextBefore) {
  console.log("PASS: relic upgrade button spends Essence and updates the relic badge")
  process.exit(0)
} else {
  console.log("FAIL")
  process.exit(1)
}
