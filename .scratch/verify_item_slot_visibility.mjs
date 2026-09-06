import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

const PORT = process.env.PORT || 5323
const SHOT_DIR = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-item-slot-vis/.scratch/shots"
await mkdir(SHOT_DIR, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForTimeout(400)

const setup = await page.evaluate(async () => {
  const { startRun, recruitUnit, serializeRun } = await import("/src/services/heartwood/runEngine.js")
  let state = { ...startRun("tommy"), essence: 999 }
  state = recruitUnit(state, state.shopOffers[0])
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(state)))
  return { benchKey: state.bench[0]?.key }
})
console.log("Setup:", JSON.stringify(setup))

await page.reload()
await page.waitForSelector("text=/hearthwood market/i", { timeout: 5000 })
await page.waitForTimeout(300)
const tutorialNext = page.locator("button.hw-tutorial-next")
if (await tutorialNext.isVisible({ timeout: 500 }).catch(() => false)) {
  await tutorialNext.click()
  await page.waitForTimeout(200)
}

// Go to Your Squad tab WITHOUT an item selected - baseline look of the
// empty slots (the "inconspicuous place" Marc reported).
await page.click("button.hw-squad-tab-btn")
await page.waitForTimeout(300)
const slotCount = await page.locator(".hw-panel--squad .hw-item-slots .hw-item-slot").count()
const plusCount = await page.locator(".hw-panel--squad .hw-item-slot .hw-item-slot-plus").count()
console.log("Item slots rendered:", slotCount, " with '+' glyph:", plusCount)
const firstSlots = page.locator(".hw-panel--squad .hw-item-slots").first()
await firstSlots.screenshot({ path: `${SHOT_DIR}/A_slots_idle.png` })

// Back to Market, buy an item -> auto-selects it -> pending state.
await page.click("button.hw-market-tab-btn")
await page.waitForTimeout(200)
const itemCard = page.locator(".hw-item-card[data-disabled=\"false\"]").first()
await itemCard.click()
await page.waitForTimeout(350)

await page.click("button.hw-squad-tab-btn")
await page.waitForTimeout(300)

const pendingAttr = await page.locator(".hw-panel--squad .hw-item-slots").first().getAttribute("data-pending")
console.log("data-pending on slots after buy:", pendingAttr)
await firstSlots.screenshot({ path: `${SHOT_DIR}/B_slots_pending.png` })
await page.locator(".hw-panel--squad").first().screenshot({ path: `${SHOT_DIR}/C_squad_panel_pending.png` })

// Equip via the slot pip still works.
await page.locator(".hw-panel--squad .hw-item-slots .hw-item-slot").first().click()
await page.waitForTimeout(400)
const filled = await page.locator(".hw-panel--squad .hw-item-slot--filled").count()
console.log("Filled slots after equip click:", filled)
await firstSlots.screenshot({ path: `${SHOT_DIR}/D_slots_equipped.png` })

const pass =
  slotCount > 0 &&
  plusCount === slotCount &&
  pendingAttr === "true" &&
  filled === 1 &&
  errors.length === 0

console.log("Errors:", JSON.stringify(errors))
console.log(pass ? "RESULT: PASS" : "RESULT: FAIL")
await browser.close()
process.exit(pass ? 0 : 1)
