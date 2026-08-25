import { chromium } from "playwright"
const PORT = process.env.PORT || 5233
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1100, height: 900 } })
await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForTimeout(600)
await page.click(".hw-select-grid button")
const tutorialNext = page.locator(".hw-tutorial-next")
if (await tutorialNext.isVisible({ timeout: 2000 }).catch(() => false)) await tutorialNext.click().catch(() => {})
await page.waitForTimeout(400)
await page.click("button.hw-end-turn:has-text(\"Continue\")")
await page.waitForTimeout(400)
for (let i = 0; i < 4; i++) {
  const undeployed = page.locator(".hw-deck-preview .hw-card[data-selected=\"false\"]").first()
  if (!(await undeployed.count())) break
  await undeployed.click().catch(() => {})
  await page.waitForTimeout(80)
}
await page.click("button.hw-end-turn:has-text(\"Start Battle\")")
// Wait long enough for the round to resolve AND every staggered lunge
// (LUNGE_STAGGER_MS * event count, each ~380ms round trip) to have
// fully settled back to rest, so this frame is genuinely static.
await page.waitForTimeout(1400)
await page.screenshot({ path: "/tmp/hw_screens/settled_battle.png" })
await browser.close()
console.log("done")
