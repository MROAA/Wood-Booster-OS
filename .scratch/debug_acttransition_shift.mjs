import { chromium } from "playwright"
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } })
const page = await ctx.newPage()
await page.goto("http://localhost:5186/heartwood", { waitUntil: "domcontentloaded" })
await page.evaluate(async () => {
  const { startRun, serializeRun, actIndexForNode, RUN_PATH } = await import("/src/services/heartwood/runEngine.js")
  let nodeIndex = 0
  for (let i = 0; i < RUN_PATH.length; i++) {
    if (actIndexForNode(i, RUN_PATH.length) === 2) { nodeIndex = i; break }
  }
  const rs = { ...startRun("tommy", null), nodeIndex, phase: "shop", lastSeenAct: 1, path: RUN_PATH.slice(0, nodeIndex + 1) }
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(rs)))
  localStorage.setItem("heartwood-story-intro-seen", "true")
  localStorage.setItem("heartwood-autobattler-intro-seen", "true")
})
await page.reload({ waitUntil: "domcontentloaded" })
await page.waitForSelector(".hw-act-transition", { timeout: 8000 })
await page.waitForTimeout(1300)

async function measure(label) {
  const data = await page.evaluate(() => {
    const inner = document.querySelector(".hw-act-transition-inner")
    const container = document.querySelector(".hw-free-layout-container")
    const cs = getComputedStyle(inner)
    return {
      innerRect: inner.getBoundingClientRect().toJSON(),
      innerDisplay: cs.display,
      innerJustifyContent: cs.justifyContent,
      innerAlignItems: cs.alignItems,
      innerPaddingTop: cs.paddingTop,
      containerRect: container.getBoundingClientRect().toJSON(),
      containerComputedHeight: getComputedStyle(container).height,
    }
  })
  console.log(label, JSON.stringify(data))
}

await measure("BEFORE edit")
await page.click("text=Edit Layout")
await page.waitForTimeout(200)
await measure("AFTER edit")

await browser.close()
