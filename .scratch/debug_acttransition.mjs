import { chromium } from "playwright"
const browser = await chromium.launch()
const page = await browser.newPage()
page.on("console", (m) => console.log("[console]", m.text()))
page.on("pageerror", (e) => console.log("[pageerror]", e))
await page.goto("http://localhost:5186/heartwood", { waitUntil: "domcontentloaded" })
const result = await page.evaluate(async () => {
  const { startRun, serializeRun, actIndexForNode, RUN_PATH } = await import("/src/services/heartwood/runEngine.js")
  let nodeIndex = 0
  for (let i = 0; i < RUN_PATH.length; i++) {
    if (actIndexForNode(i, RUN_PATH.length) === 2) { nodeIndex = i; break }
  }
  const rs = { ...startRun("tommy", null), nodeIndex, phase: "shop", lastSeenAct: 1 }
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(rs)))
  localStorage.setItem("heartwood-story-intro-seen", "true")
  localStorage.setItem("heartwood-autobattler-intro-seen", "true")
  return { nodeIndex, pathLength: RUN_PATH.length, act: actIndexForNode(nodeIndex, RUN_PATH.length) }
})
console.log("seeded:", JSON.stringify(result))
await page.reload({ waitUntil: "domcontentloaded" })
await page.waitForTimeout(1500)
const screen = await page.evaluate(() => {
  const root = document.querySelector(".hw-root")
  return { rootClass: root?.className, bodyStart: document.body.textContent?.slice(0, 200) }
})
console.log("screen:", JSON.stringify(screen))
await browser.close()
