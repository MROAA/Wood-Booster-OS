import { chromium } from "playwright"

const PORT = process.env.PORT || 5227
const MAX_FIGHTS = 6 // just enough to exercise a few shop visits, not a full run

const browser = await chromium.launch()
const page = await browser.newPage()
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

let boughtAnItem = false
let equippedAnItem = false

async function shopStep() {
  await page.waitForSelector(".hw-card", { timeout: 10000 })
  // Buy the first affordable item too, then equip it onto the first
  // bench unit's first slot - exercising the whole new flow inside a
  // real multi-fight run, not just in isolation.
  const affordableItem = page.locator(".hw-item-card[data-disabled=\"false\"]").first()
  if (!boughtAnItem && (await affordableItem.count())) {
    await affordableItem.click()
    await page.waitForTimeout(100)
    boughtAnItem = true
    const bagItem = page.locator(".hw-badge").filter({ hasText: /Charm|Plating|Vial|Fang|Bracer/ }).first()
    if (await bagItem.count()) {
      await bagItem.click()
      await page.waitForTimeout(100)
      const slot = page.locator(".hw-item-slot").first()
      if (await slot.count()) {
        await slot.click()
        await page.waitForTimeout(150)
        equippedAnItem = (await page.locator(".hw-item-slot--filled").count()) > 0
      }
    }
  }
  for (let i = 0; i < 3; i++) {
    const affordable = page.locator(".hw-card[data-disabled=\"false\"]").first()
    if (await affordable.count()) {
      await affordable.click()
      await page.waitForTimeout(100)
    }
  }
  await page.click("button.hw-end-turn:has-text(\"Continue\")")
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

async function clearToFormation() {
  for (let i = 0; i < 5; i++) {
    const onFormation = await page
      .locator("button.hw-end-turn:has-text(\"Start Battle\")")
      .isVisible({ timeout: 1000 })
      .catch(() => false)
    if (onFormation) return true
    const wasRelic = await relicStepIfPresent()
    if (wasRelic) continue
    const wasShop = await shopStepIfPresent()
    if (wasShop) continue
    break
  }
  return page
    .locator("button.hw-end-turn:has-text(\"Start Battle\")")
    .isVisible({ timeout: 3000 })
    .catch(() => false)
}

async function formationAndBattleStep() {
  await page.waitForSelector(".hw-deck-preview .hw-card", { timeout: 10000 })
  // Click only currently-UNdeployed cards (data-selected="false"), up to
  // 4 times - buying an item earlier in the shop step eats into the
  // recruit budget, so a blind "click the first N by index" (which
  // relies on the starters happening to already be pre-deployed) can
  // net out to zero actually-deployed units once the bench mix shifts.
  // Explicitly targeting the undeployed ones is deploy-state-safe
  // regardless of how many new units got recruited this visit.
  for (let i = 0; i < 4; i++) {
    const undeployed = page.locator(".hw-deck-preview .hw-card[data-selected=\"false\"]").first()
    if (!(await undeployed.count())) break
    await undeployed.click().catch(() => {})
    await page.waitForTimeout(80)
  }
  const startBtn = page.locator("button.hw-end-turn:has-text(\"Start Battle\")")
  await startBtn.waitFor({ timeout: 5000 })
  await startBtn.click()
  await page.waitForSelector(".hw-overlay", { timeout: 25000 })
  const outcome = await page.locator(".hw-overlay").getAttribute("data-outcome")
  await page.click("button:has-text(\"Continue\")")
  return outcome
}

const outcomes = []
let runEnded = false

for (let fight = 0; fight < MAX_FIGHTS && !runEnded; fight++) {
  const reachedFormation = await clearToFormation()
  if (!reachedFormation) {
    outcomes.push("ERROR:never reached formation screen")
    break
  }
  const outcome = await formationAndBattleStep().catch((e) => `ERROR:${e.message}`)
  outcomes.push(outcome)
  const newRunBtn = await page.locator("button:has-text(\"New Run\")").isVisible({ timeout: 500 }).catch(() => false)
  if (newRunBtn) runEnded = true
  if (String(outcome).startsWith("ERROR")) break
}

console.log(JSON.stringify({ outcomes, runEnded, boughtAnItem, equippedAnItem, errorCount: errors.length, errors: errors.slice(0, 10) }, null, 2))
await browser.close()

if (errors.length) {
  console.log("FAIL: console/page errors present during full run")
  process.exit(1)
}
if (outcomes.some((o) => String(o).startsWith("ERROR"))) {
  console.log("FAIL: a fight step errored out")
  process.exit(1)
}
if (!boughtAnItem || !equippedAnItem) {
  console.log("FAIL: never actually exercised buying/equipping an item during the run")
  process.exit(1)
}
console.log("PASS: multi-fight run completed with an item bought and equipped mid-run, zero console errors")
process.exit(0)
