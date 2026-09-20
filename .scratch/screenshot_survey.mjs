import { chromium } from "playwright"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1100, height: 900 } })

await page.goto("http://localhost:5173/heartwood")
await page.waitForTimeout(600)
await page.screenshot({ path: "/tmp/hw_screens/01_character_select.png" })

await page.click(".hw-select-grid button")
const tutorialNext = page.locator(".hw-tutorial-next")
if (await tutorialNext.isVisible({ timeout: 2000 }).catch(() => false)) await tutorialNext.click().catch(() => {})
await page.waitForTimeout(400)
await page.screenshot({ path: "/tmp/hw_screens/02_shop.png", fullPage: true })

await page.click("button.hw-end-turn:has-text(\"Continue\")")
await page.waitForTimeout(400)
await page.screenshot({ path: "/tmp/hw_screens/03_formation.png", fullPage: true })

for (let i = 0; i < 4; i++) {
  const undeployed = page.locator(".hw-deck-preview .hw-card[data-selected=\"false\"]").first()
  if (!(await undeployed.count())) break
  await undeployed.click().catch(() => {})
  await page.waitForTimeout(80)
}
await page.screenshot({ path: "/tmp/hw_screens/04_formation_deployed.png", fullPage: true })

await page.click("button.hw-end-turn:has-text(\"Start Battle\")")
await page.waitForTimeout(700)
await page.screenshot({ path: "/tmp/hw_screens/05_battle_early.png" })
await page.waitForTimeout(2500)
await page.screenshot({ path: "/tmp/hw_screens/06_battle_mid.png" })

await browser.close()
console.log("done")
