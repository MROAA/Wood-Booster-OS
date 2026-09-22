import { chromium } from "playwright"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1860, height: 960 } })
await page.goto("http://localhost:5191/heartwood", { waitUntil: "domcontentloaded" })
await page.evaluate(async () => {
  const { startRun, serializeRun, RUN_PATH } = await import("/src/services/heartwood/runEngine.js")
  const rs = {
    ...startRun("tommy", null), nodeIndex: 0, phase: "shop", path: RUN_PATH.slice(0, 1),
    relics: ["heartsbloom-seed"], items: [],
    bench: [
      { key: 1, defId: "the-fool", upgradeLevel: 0, upgrades: [] },
      { key: 2, defId: "the-magician", upgradeLevel: 0, upgrades: [] },
    ],
    benchKeyCounter: 3, deployed: [1, null, null, null],
  }
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(rs)))
  localStorage.setItem("heartwood-story-intro-seen", "true")
})
await page.reload({ waitUntil: "domcontentloaded" })
await page.waitForSelector(".hw-panel--market", { timeout: 8000 })
await page.click(".hw-squad-tab-btn")
await page.waitForSelector(".hw-panel--squad:not([hidden])", { timeout: 8000 })
await page.waitForTimeout(2500)

async function measure(label) {
  const data = await page.evaluate(() => {
    const scrollHost = document.querySelector(".hw-shop-center")
    const toolbars = [...document.querySelectorAll(".hw-panel--squad .hw-free-layout-toolbar")]
    const topContainer = document.querySelectorAll(".hw-panel--squad .hw-free-layout-container")[0]
    const splitOuter = document.querySelector(".hw-squad-split")
    const splitInner = document.querySelector(".hw-squad-split .hw-free-layout-container")
    const stage = document.querySelector(".hw-market-stage")
    const zone = document.querySelector(".hw-shop-3zone")
    const leftRail = document.querySelector(".hw-shop-rail--left")
    const rightRail = document.querySelector(".hw-shop-rail--right")
    const marketColumns = document.querySelector(".hw-market-columns")
    const shopCenter = document.querySelector(".hw-shop-center")
    const panelSquad = document.querySelector(".hw-panel--squad")
    const panelMarket = document.querySelector(".hw-panel--market")
    return {
      scrollTop: scrollHost?.scrollTop,
      stageRect: stage?.getBoundingClientRect().toJSON(),
      zoneRect: zone?.getBoundingClientRect().toJSON(),
      leftRailRect: leftRail?.getBoundingClientRect().toJSON(),
      rightRailRect: rightRail?.getBoundingClientRect().toJSON(),
      shopCenterRect: shopCenter?.getBoundingClientRect().toJSON(),
      marketColumnsRect: marketColumns?.getBoundingClientRect().toJSON(),
      marketColumnsDisplay: marketColumns ? getComputedStyle(marketColumns).display : null,
      panelSquadRect: panelSquad?.getBoundingClientRect().toJSON(),
      panelMarketDisplay: panelMarket ? getComputedStyle(panelMarket).display : null,
      panelMarketRect: panelMarket?.getBoundingClientRect().toJSON(),
      toolbarCount: toolbars.length,
      toolbarRects: toolbars.map((t) => t.getBoundingClientRect().toJSON()),
      topContainerRect: topContainer?.getBoundingClientRect().toJSON(),
      topContainerHeight: topContainer ? getComputedStyle(topContainer).height : null,
      splitOuterRect: splitOuter?.getBoundingClientRect().toJSON(),
      splitInnerRect: splitInner?.getBoundingClientRect().toJSON(),
      splitInnerHeight: splitInner ? getComputedStyle(splitInner).height : null,
    }
  })
  console.log(label, JSON.stringify(data, null, 1))
}

await measure("BEFORE edit")
const toolbars = page.locator(".hw-panel--squad .hw-free-layout-toolbar")
await toolbars.nth(1).locator("text=Edit Layout").click()
await page.waitForTimeout(300)
await measure("AFTER edit")

await browser.close()
