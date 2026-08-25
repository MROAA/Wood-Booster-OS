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
  const relicsMod = await import("/src/data/heartwood/relics.js?t=" + t)
  const { RELICS } = relicsMod

  // No tribe investment: should still guarantee SOME tribe-anchor relic.
  const noTribeResults = []
  for (let i = 0; i < 20; i++) {
    const offers = engine.__test_rollRelics ? null : null
  }

  // Use the public surface: rerollRelicOffers against a fabricated
  // runState with a controlled bench, since rollRelics itself isn't
  // exported directly.
  function makeRun(bench) {
    let run = engine.startRun("tommy")
    run = { ...run, bench, essence: 999 }
    return run
  }

  const noTribeRun = makeRun([])
  const noTribeRolls = []
  for (let i = 0; i < 20; i++) {
    const r = engine.rerollRelicOffers({ ...noTribeRun, relicOffers: [] })
    noTribeRolls.push(r.relicOffers.some((id) => RELICS[id]?.tribeAnchor))
  }

  // With 2 Thorn-tribe units on the bench (the-fool, the-lovers are
  // both tagged "thorn"), the guarantee should now specifically prefer
  // thorns-wrath over the other 5 tribe-anchor relics whenever it can.
  const thornRun = makeRun([
    { key: 0, defId: "the-fool" },
    { key: 1, defId: "the-lovers" },
  ])
  const thornRolls = []
  for (let i = 0; i < 20; i++) {
    const r = engine.rerollRelicOffers({ ...thornRun, relicOffers: [] })
    thornRolls.push({
      hasAnyAnchor: r.relicOffers.some((id) => RELICS[id]?.tribeAnchor),
      hasThornsWrath: r.relicOffers.includes("thorns-wrath"),
    })
  }

  return {
    noTribeGuaranteeRate: noTribeRolls.filter(Boolean).length + "/" + noTribeRolls.length,
    thornAnyAnchorRate: thornRolls.filter((r) => r.hasAnyAnchor).length + "/" + thornRolls.length,
    thornsWrathRate: thornRolls.filter((r) => r.hasThornsWrath).length + "/" + thornRolls.length,
  }
})

console.log(JSON.stringify(result, null, 2))

// Real UI click-through sanity check too.
await page.click(".hw-enemy-choice >> nth=0")
await page.waitForSelector("text=The Heartwood Market")
console.log("Shop loaded OK, no crash from the rollRelics signature change.")

console.log("=== console errors ===")
console.log(errors.length ? errors.join("\n") : "(none)")
await browser.close()
