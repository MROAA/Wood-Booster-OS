import { chromium } from "playwright"
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } })
const page = await ctx.newPage()
await page.goto("http://localhost:5184/heartwood", { waitUntil: "domcontentloaded" })
await page.waitForTimeout(500)
await page.click(".hw-settings-open-btn")
await page.waitForSelector(".hw-settings", { timeout: 5000 })
await page.waitForTimeout(600) // let the .hw-screen-fade entrance animation (377ms) fully settle

async function measure(label) {
  const data = await page.evaluate(() => {
    const toolbar = document.querySelector(".hw-free-layout-toolbar")
    const container = document.querySelector(".hw-free-layout-container")
    const title = document.querySelector(".hw-screen-title")
    return {
      toolbar: toolbar?.getBoundingClientRect().toJSON(),
      container: container?.getBoundingClientRect().toJSON(),
      containerComputedHeight: container ? getComputedStyle(container).height : null,
      title: title?.getBoundingClientRect().toJSON(),
    }
  })
  console.log(label, JSON.stringify(data))
}

await measure("BEFORE edit")
await page.click("text=Edit Layout")
await page.waitForTimeout(200)
await measure("AFTER edit")

await browser.close()
