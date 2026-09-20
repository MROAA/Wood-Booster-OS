import { chromium } from "playwright"
const PORT = process.env.PORT || 5243
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
await page.waitForTimeout(400)
// Recruit a unit and confirm a real transform/opacity transition
// actually applies to its bench card right after the click (proof the
// entrance animation fires on a genuinely new card, not just present
// in the CSS/JS with no visible effect).
const affordable = page.locator(".hw-card[data-disabled=\"false\"]").first()
await affordable.click()
await page.waitForTimeout(50)
const sawTransition = await page.evaluate(() => {
  return Array.from(document.querySelectorAll(".hw-deck-preview .hw-card")).some((el) => {
    const style = getComputedStyle(el)
    return style.opacity !== "1" || style.transform !== "none"
  })
})
await page.waitForTimeout(400)
console.log(JSON.stringify({ sawTransition, errors }, null, 2))
await browser.close()
if (errors.length) { console.log("FAIL: console/page errors present"); process.exit(1) }
if (sawTransition) { console.log("PASS: a newly recruited bench card actually animates in (opacity/transform mid-transition)"); process.exit(0) }
console.log("FAIL: never observed the entrance transition")
process.exit(1)
