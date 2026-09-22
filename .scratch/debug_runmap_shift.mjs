import { chromium } from "playwright"
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } })
const page = await ctx.newPage()
await page.goto("http://localhost:5187/heartwood", { waitUntil: "domcontentloaded" })
await page.evaluate(async () => {
  const { startRun, serializeRun, RUN_PATH } = await import("/src/services/heartwood/runEngine.js")
  const rs = { ...startRun("tommy", null), nodeIndex: 0, phase: "choice", path: RUN_PATH.slice(0, 1) }
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(rs)))
  localStorage.setItem("heartwood-story-intro-seen", "true")
  localStorage.setItem("heartwood-autobattler-intro-seen", "true")
})
await page.reload({ waitUntil: "domcontentloaded" })
await page.waitForSelector(".hw-free-layout-container", { timeout: 8000 })
await page.waitForTimeout(700)

async function measure(label) {
  const data = await page.evaluate(() => {
    const toolbar = document.querySelector(".hw-free-layout-toolbar")
    const container = document.querySelector(".hw-free-layout-container")
    const cs = getComputedStyle(container)
    return {
      toolbar: toolbar.getBoundingClientRect().toJSON(),
      container: container.getBoundingClientRect().toJSON(),
      containerDisplay: cs.display,
      containerHeight: cs.height,
      containerMarginTop: cs.marginTop,
    }
  })
  console.log(label, JSON.stringify(data))
}

await measure("toolbar BEFORE edit")
await page.click("text=Edit Layout")
await page.waitForTimeout(200)
await measure("toolbar AFTER edit")

await browser.close()
