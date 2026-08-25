import { chromium } from "playwright"

const PORT = process.env.PORT || 5227

const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForTimeout(500)
await page.click(".hw-select-grid button")
const tutorialNext = page.locator(".hw-tutorial-next")
if (await tutorialNext.isVisible({ timeout: 2000 }).catch(() => false)) await tutorialNext.click().catch(() => {})
await page.waitForTimeout(300)

// Recruit a couple of extra units first (same established pattern as
// verify_battle_animation.mjs) - the run starts with its 3 starters
// already auto-deployed, so toggling every bench card once with
// nothing recruited would just pull them all back OUT, not deploy
// them, leaving Start Battle disabled.
await page.waitForSelector(".hw-card[data-disabled=\"false\"]", { timeout: 10000 })
for (let i = 0; i < 2; i++) {
  const affordable = page.locator(".hw-card[data-disabled=\"false\"]").first()
  if (await affordable.count()) { await affordable.click(); await page.waitForTimeout(100) }
}
await page.click("button.hw-end-turn:has-text(\"Continue\")")
await page.waitForTimeout(300)
const benchCards = page.locator(".hw-select-grid.hw-deck-preview .hw-card")
const benchCount = await benchCards.count()
for (let i = 0; i < benchCount; i++) {
  await benchCards.nth(i).click().catch(() => {})
  await page.waitForTimeout(80)
}
const startBtn = page.locator("button.hw-end-turn", { hasText: "Start Battle" })
await startBtn.click()
await page.waitForTimeout(200)

// Watch a transform actually get applied to a piece mid-fight (proof
// the lunge ran against a real element, not just that roundEvents was
// populated in isolation).
let sawTransform = false
for (let i = 0; i < 10; i++) {
  const found = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("[data-unit-id]")).some(
      (el) => el.style.transform && el.style.transform !== "",
    )
  })
  if (found) { sawTransform = true; break }
  await page.waitForTimeout(300)
}

await page.waitForTimeout(4000) // let the fight run a while longer

console.log(JSON.stringify({ sawTransform, errors }, null, 2))
await browser.close()

if (errors.length) {
  console.log("FAIL: console/page errors present during a real animated battle")
  process.exit(1)
}
if (sawTransform) {
  console.log("PASS: a real battle piece's DOM element actually receives a lunge transform mid-fight, zero console errors")
  process.exit(0)
} else {
  console.log("FAIL: never observed a lunge transform on any piece")
  process.exit(1)
}
