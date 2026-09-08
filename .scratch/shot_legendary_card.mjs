import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

const PORT = process.env.PORT || 5343
const DIR = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-legendary/.scratch/shots"
await mkdir(DIR, { recursive: true })

const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1536, height: 900 } })).newPage()
const errs = []
page.on("pageerror", (e) => errs.push(String(e)))

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForSelector(".hw-commander-card", { timeout: 20000 })

await page.evaluate(async () => {
  const { RUN_PATH, startRun, serializeRun, actIndexForNode } = await import("/src/services/heartwood/runEngine.js")
  const idx = 0
  let s = {
    ...startRun("tommy"),
    nodeIndex: idx,
    path: RUN_PATH.slice(0, idx + 1),
    phase: "shop",
    essence: 4000,
    marketLevel: 3,
    // one of each new legendary + a couple of new rares, so the card
    // treatment for every data-tier shows side by side
    shopOffers: ["world-ash-elder", "bulwark-of-ages", "the-thorn-throne"],
  }
  s.lastSeenAct = actIndexForNode(idx, RUN_PATH.length)
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(s)))
  localStorage.setItem("heartwood-autobattler-intro-seen", "true")
  localStorage.setItem("heartwood-story-intro-seen", "true")
  localStorage.setItem(
    "heartwood-settings-v1",
    JSON.stringify({ master: 0, sfx: 0, music: 0, muted: true, reduceMotion: true }),
  )
})
await page.reload()
await page.waitForSelector(".hw-market-columns, .hw-card", { timeout: 10000 }).catch(() => {})
await page.waitForTimeout(900)
await page.screenshot({ path: `${DIR}/legendary_shop.png` })

// close-up of the first legendary card
const card = page.locator('.hw-card[data-tier="legendary"]').first()
if (await card.count()) {
  await card.scrollIntoViewIfNeeded()
  await page.waitForTimeout(300)
  await card.screenshot({ path: `${DIR}/legendary_card.png` })
}

const tiers = await page.$$eval(".hw-card", (els) => els.map((e) => e.getAttribute("data-tier")))
console.log("card tiers on screen:", tiers)
console.log("page errors:", errs.length, errs.slice(0, 3))
await browser.close()
