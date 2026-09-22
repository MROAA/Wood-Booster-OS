import { chromium } from "playwright"
const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto("http://localhost:5173/heartwood", { waitUntil: "domcontentloaded" })
await page.waitForTimeout(500)
await page.click(".hw-settings-open-btn")
await page.waitForSelector(".hw-settings", { timeout: 5000 })
await page.waitForTimeout(700)

async function measure(label) {
  const data = await page.evaluate(() => {
    const wrapper = document.querySelector(".hw-free-layout-container > *")
    const group = wrapper.querySelector(".hw-settings-group") || wrapper
    return {
      wrapperRect: wrapper.getBoundingClientRect().toJSON(),
      groupRect: group.getBoundingClientRect().toJSON(),
      groupMarginTop: getComputedStyle(group).marginTop,
    }
  })
  console.log(label, JSON.stringify(data))
}

await measure("BEFORE edit")
await page.click("text=Edit Layout")
await page.waitForTimeout(200)
await measure("AFTER edit")

await browser.close()
