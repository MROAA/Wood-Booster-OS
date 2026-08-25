import { chromium } from "playwright"

const PORT = process.env.PORT || 5197

const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text())
})

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForSelector(".hw-select-grid button")
await page.click(".hw-select-grid button") // pick first Commander

// Dismiss the intro tutorial overlay if it's showing
const tutorialNext = page.locator("button.hw-tutorial-next")
if (await tutorialNext.isVisible({ timeout: 2000 }).catch(() => false)) {
  await tutorialNext.click().catch(() => {})
}

await page.waitForSelector(".hw-card[data-disabled=\"false\"]", { timeout: 10000 })

// Recruit up to 3 affordable units (cards without data-disabled=true)
for (let i = 0; i < 3; i++) {
  const affordable = page.locator(".hw-card[data-disabled=\"false\"]").first()
  if (await affordable.count()) {
    await affordable.click()
    await page.waitForTimeout(150)
  }
}

await page.click("button.hw-end-turn:has-text(\"Continue\")")

// Formation screen: click each bench card once to auto-deploy it into
// the next empty slot (handleBenchClick's own logic, no drag needed).
await page.waitForSelector(".hw-deck-preview .hw-card", { timeout: 10000 })
const benchCards = page.locator(".hw-deck-preview .hw-card")
const benchCount = await benchCards.count()
for (let i = 0; i < benchCount; i++) {
  await benchCards.nth(i).click()
  await page.waitForTimeout(100)
}

const startBattleBtn = page.locator("button.hw-end-turn:has-text(\"Start Battle\")")
await startBattleBtn.waitFor({ timeout: 5000 })
await startBattleBtn.click()

// Core assertion: the Victory/Defeat overlay appears immediately, with
// no Auto-Resolve/Next Round buttons ever existing in the DOM (Marc:
// "battle should be automated" / "skip the click entirely").
const overlay = await page
  .waitForSelector(".hw-overlay", { timeout: 5000 })
  .then(() => true)
  .catch(() => false)

const autoResolveButtonExists = await page.locator("button:has-text(\"Auto-Resolve\")").count()
const nextRoundButtonExists = await page.locator("button:has-text(\"Next Round\")").count()
const outcome = await page.locator(".hw-overlay").getAttribute("data-outcome").catch(() => null)

console.log(JSON.stringify({ overlay, outcome, autoResolveButtonExists, nextRoundButtonExists, errors }, null, 2))

await browser.close()

if (errors.length) {
  console.log("FAIL: console/page errors present")
  process.exit(1)
}
if (overlay && autoResolveButtonExists === 0 && nextRoundButtonExists === 0) {
  console.log("PASS: battle resolved instantly on Start Battle, no dead buttons in DOM")
  process.exit(0)
} else {
  console.log("FAIL")
  process.exit(1)
}
