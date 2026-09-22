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
await page.waitForTimeout(700)

const data = await page.evaluate(async () => {
  const el = document.querySelector(".hw-squad-split")
  const dbRow = await fetch("http://localhost:3029/api/hearthwood-layout/squadTabSplit").then((r) => r.json())
  return {
    className: el.className,
    computedDisplay: getComputedStyle(el).display,
    inlineStyle: el.getAttribute("style"),
    dataFreeActive: el.getAttribute("data-free-active"),
    dataEditingLayout: el.getAttribute("data-editing-layout"),
    dbPositions: dbRow.positions,
    childrenClasses: [...el.children].map((c) => c.className),
  }
})
console.log(JSON.stringify(data, null, 2))
await browser.close()
