import { chromium } from "playwright"

const errors = []
const browser = await chromium.launch({ args: ["--no-sandbox"] })
const page = await (await browser.newContext()).newPage()
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })
page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`))

await page.goto("http://localhost:5199/heartwood", { waitUntil: "domcontentloaded" })
await page.waitForSelector("text=Heartwood", { timeout: 15000 })
await page.waitForTimeout(300)

const result = await page.evaluate(async () => {
  const t = Date.now()
  const engine = await import("/src/services/heartwood/runEngine.js?t=" + t)
  const unitsMod = await import("/src/data/heartwood/units.js?t=" + t)
  const synergiesMod = await import("/src/data/heartwood/synergies.js?t=" + t)
  const { UNITS } = unitsMod
  const { tribesOf } = synergiesMod

  function makeRun(bench) {
    let run = engine.startRun("tommy")
    return { ...run, bench, essence: 999 }
  }

  // No tribe investment: shop should just be fully random (no crash,
  // no guaranteed unit expected either way).
  const emptyRun = makeRun([])
  const emptyRoll = engine.rerollShop({ ...emptyRun, rerollCost: 0 })
  const emptyOk = emptyRoll.shopOffers.length === 4

  // 2 Warden-tribe units on the bench (stoneheart, ironbark) - the
  // reroll should now reliably surface a Warden-tribe unit too.
  const wardenRun = makeRun([
    { key: 0, defId: "stoneheart" },
    { key: 1, defId: "ironbark" },
  ])
  let wardenHits = 0
  for (let i = 0; i < 20; i++) {
    const r = engine.rerollShop({ ...wardenRun, rerollCost: 0 })
    const hasWarden = r.shopOffers.some((id) => tribesOf(id, UNITS[id]).includes("warden"))
    if (hasWarden) wardenHits++
  }

  return { emptyOk, wardenGuaranteeRate: wardenHits + "/20" }
})

console.log(JSON.stringify(result, null, 2))

await page.click(".hw-enemy-choice >> nth=0")
await page.waitForSelector("text=The Heartwood Market")
console.log("Live shop still loads OK.")

console.log("=== console errors ===")
console.log(errors.length ? errors.join("\n") : "(none)")
await browser.close()
