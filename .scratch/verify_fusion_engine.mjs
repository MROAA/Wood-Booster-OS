import { chromium } from "playwright"

const PORT = process.env.PORT || 5210

const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForTimeout(400)

const result = await page.evaluate(async () => {
  const { startRun, recruitUnit } = await import("/src/services/heartwood/runEngine.js")
  const { UNITS } = await import("/src/data/heartwood/units.js")

  // Bypass shop RNG entirely: build a run state with 2 owned copies of
  // "justice" already on the bench, force it into shopOffers with
  // essence to afford it, and recruit the 3rd copy directly through
  // the real recruitUnit function (same one the UI calls) - this is
  // exactly the data transition SquadDraft.jsx's fusion-detection
  // useEffect keys off (a bench entry whose key wasn't present before,
  // pointing at a def with fusedFrom set).
  let runState = startRun("tommy")
  runState = {
    ...runState,
    essence: 10,
    bench: [
      { key: 100, defId: "justice", upgradeLevel: 0 },
      { key: 101, defId: "justice", upgradeLevel: 0 },
    ],
    benchKeyCounter: 102,
    deployed: [100, 101, null, null],
    shopOffers: ["justice"],
  }
  const keysBefore = new Set(runState.bench.map((e) => e.key))

  const afterRecruit = recruitUnit(runState, "justice")
  const newEntry = afterRecruit.bench.find((e) => !keysBefore.has(e.key))
  const newDef = newEntry ? UNITS[newEntry.defId] : null

  return {
    benchSizeBefore: runState.bench.length,
    benchSizeAfter: afterRecruit.bench.length,
    newEntryDefId: newEntry?.defId,
    newDefIsTier2: newDef?.displayTier === 2,
    newDefFusedFrom: newDef?.fusedFrom,
    oldCopiesGone: !afterRecruit.bench.some((e) => e.defId === "justice"),
  }
})

console.log(JSON.stringify(result, null, 2))
console.log("console/page errors:", errors)
await browser.close()

const ok =
  result.benchSizeBefore === 2 &&
  result.benchSizeAfter === 1 &&
  result.newDefIsTier2 &&
  result.newDefFusedFrom === "justice" &&
  result.oldCopiesGone

if (errors.length) {
  console.log("FAIL: console/page errors present")
  process.exit(1)
}
if (ok) {
  console.log("PASS: recruiting a 3rd copy via the real recruitUnit function produces exactly the bench-key transition SquadDraft.jsx's fusion animation detects")
  process.exit(0)
} else {
  console.log("FAIL", result)
  process.exit(1)
}
