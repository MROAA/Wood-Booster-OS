import { chromium } from "playwright"
const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto("http://localhost:5186/heartwood", { waitUntil: "domcontentloaded" })
await page.evaluate(() => {
  localStorage.removeItem("heartwood-run-save-v1")
  localStorage.setItem("heartwood-autobattler-intro-seen", "true")
  localStorage.setItem("heartwood-story-intro-seen", "true")
})
await page.reload({ waitUntil: "domcontentloaded" })
await page.waitForSelector(".hw-commander-select", { timeout: 8000 })
await page.waitForTimeout(700)
const data = await page.evaluate(() => {
  const container = document.querySelector(".hw-commander-select .hw-free-layout-container")
  const cs = getComputedStyle(container)
  const kids = [...container.children].map((el) => el.getBoundingClientRect().toJSON())
  const gaps = []
  for (let i = 1; i < kids.length; i++) gaps.push(kids[i].top - kids[i - 1].bottom)
  return { containerDisplay: cs.display, gaps }
})
console.log(JSON.stringify(data, null, 2))
await browser.close()
