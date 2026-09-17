import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

const PORT = 5502
const DIR = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-shop-polish-2/.scratch/shots"
await mkdir(DIR, { recursive: true })

const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1536, height: 960 } })).newPage()
const errs = []
page.on("pageerror", (e) => errs.push(String(e)))

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForSelector(".hw-commander-card", { timeout: 20000 })

await page.evaluate(async () => {
  const { RUN_PATH, startRun, serializeRun, actIndexForNode, buyInvestment } = await import("/src/services/heartwood/runEngine.js")
  const idx = 4
  let s = {
    ...startRun("tommy"),
    nodeIndex: idx,
    path: RUN_PATH.slice(0, idx + 1),
    phase: "shop",
    essence: 9000,
    marketLevel: 4,
    shopOffers: ["world-ash-elder", "bulwark-of-ages", "the-thorn-throne", "hollowveil"],
    // a realistic mixed relics inventory (regular relics + the
    // ledger-bought "named" ones, which also list here once owned) -
    // to stress the left rail's longest real flavor names.
    relics: ["rearguard-standard", "marked-coin", "market-charter", "traders-compass", "silenced-bell", "weathered-standard", "ember-core", "mosswarden-charm", "bramble-ward", "sundering-mark", "essence-well"],
    items: [
      { key: 1, defId: "mossbound-chain", equippedTo: null, slotIndex: null },
      { key: 2, defId: "emberroot-talisman", equippedTo: null, slotIndex: null },
      { key: 3, defId: "amberroot-talisman", equippedTo: null, slotIndex: null },
    ],
    itemKeyCounter: 4,
    buyback: { defId: "hollowveil", price: 120 },
  }
  s.lastSeenAct = actIndexForNode(idx, RUN_PATH.length)
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(s)))
  localStorage.setItem("heartwood-autobattler-intro-seen", "true")
  localStorage.setItem("heartwood-story-intro-seen", "true")
  localStorage.setItem("heartwood-settings-v1", JSON.stringify({ master: 0, sfx: 0, music: 0, muted: true, reduceMotion: true }))
})
await page.reload()
await page.waitForSelector(".hw-market-columns, .hw-card", { timeout: 10000 }).catch(() => {})
await page.waitForTimeout(500)
const gotIt = page.locator("button", { hasText: "Got it" })
if (await gotIt.count()) await gotIt.click()
await page.waitForTimeout(400)
await page.screenshot({ path: `${DIR}/shop_stress_full.png`, fullPage: true })

// left rail close-up
const rail = page.locator(".hw-market-rail, aside").first()
console.log("page errors:", errs.length, errs.slice(0, 10))
await browser.close()
