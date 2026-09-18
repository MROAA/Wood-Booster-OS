import { chromium } from "playwright"

// Hearthwood: The Honest Scale - the first SELL-side relic (a free
// node-choice reward), +20% sell refund. Reuses effectiveSellMult's
// existing plumbing (this round adds a relic-level sellBonus reduce,
// same shape essenceForWin already uses for essenceBonus).

const PORT = process.env.PORT || 5512
const browser = await chromium.launch()
const page = await (await browser.newContext()).newPage()
const errs = []
page.on("pageerror", (e) => errs.push(String(e)))

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForSelector(".hw-commander-card", { timeout: 20000 })

const out = await page.evaluate(async () => {
  const { RELICS, relicPool } = await import("/src/data/heartwood/relics.js")
  const { effectiveSellMult, sellRefundFor, startRun } = await import("/src/services/heartwood/runEngine.js")
  const { UNITS } = await import("/src/data/heartwood/units.js")
  const r = { ok: {} }

  const def = RELICS["honest-scale"]
  r.ok.relicShape = def?.name === "The Honest Scale" && def.sellBonus === 0.2 && !def.ledgerOnly
  r.ok.isRollable = relicPool().some((x) => x.id === "honest-scale")

  const withRelic = { ...startRun("tommy"), relics: ["honest-scale"] }
  const without = { ...startRun("tommy") }
  r.ok.mult120 = Math.abs(effectiveSellMult(withRelic) - 1.2) < 1e-9
  r.ok.multBaseline1 = effectiveSellMult(without) === 1

  // stacks additively with the Ledger's own Appraiser's Eye, capped at 0.5
  const withBoth = { ...startRun("tommy"), relics: ["honest-scale"], sellBonus: 0.15 }
  r.ok.stacksWithLedger = Math.abs(effectiveSellMult(withBoth) - 1.35) < 1e-9
  const overCap = { ...startRun("tommy"), relics: ["honest-scale"], sellBonus: 0.5 }
  r.ok.respectsCap = Math.abs(effectiveSellMult(overCap) - 1.5) < 1e-9

  // real sell payout actually reflects it
  // sellRefundFor rounds ONCE from the raw recruitCost*rate*mult - not
  // a 2nd rounding on top of the already-rounded base refund, so the
  // expected value here is computed the same way, not as
  // Math.ceil(base * 1.2) (that double-rounds and can be off by 1).
  const commonDef = Object.values(UNITS).find((u) => u.recruitCost === 50)
  const base = sellRefundFor(commonDef)
  const boosted = sellRefundFor(commonDef, effectiveSellMult(withRelic))
  const expected = Math.ceil(commonDef.recruitCost * 0.33 * 1.2)
  r.detail = { base, boosted, expected }
  r.ok.realSellBoosted = boosted === expected && boosted > base

  return r
})

console.log(JSON.stringify(out, null, 2))
console.log("page errors:", errs.length, errs.slice(0, 5))
const allPass = Object.values(out.ok).every(Boolean) && errs.length === 0
console.log(allPass ? "ALL CHECKS PASS" : "FAILURES PRESENT")
await browser.close()
process.exit(allPass ? 0 : 1)
