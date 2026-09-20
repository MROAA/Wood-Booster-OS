import { chromium } from "playwright"

const PORT = process.env.PORT || 5310

const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForTimeout(500)

const result = await page.evaluate(async () => {
  const { startRun, recruitUnit, RESERVE_CAP, DEPLOY_SLOTS } = await import("/src/services/heartwood/runEngine.js")
  const out = { reserveCap: RESERVE_CAP, totalCap: DEPLOY_SLOTS + RESERVE_CAP }

  // Force essence high enough that affordability is never the
  // blocker, so recruiting failures can only be the bench cap.
  let state = { ...startRun("tommy"), essence: 999 }

  // Recruit a spread of distinct common units up to and past the cap -
  // avoid buying the same defId 3 times, which would fuse instead of
  // growing the bench (a different code path, tested separately below).
  const commonIds = ["duskbramble", "briarkit", "thistlemaw", "sparrowthorn", "duskwren",
    "the-lovers", "the-hermit", "justice", "the-hanged-man", "death", "the-devil", "the-moon",
    "judgement", "mosshollow", "the-fool", "the-magician", "the-high-priestess"]
  for (const id of commonIds) {
    state = { ...state, shopOffers: [id] }
    state = recruitUnit(state, id)
  }
  out.benchSizeAfterOverbuying = state.bench.length

  // One more distinct unit past the cap should be rejected outright.
  const before = state.bench.length
  state = { ...state, shopOffers: ["hollowmere"] }
  state = recruitUnit(state, "hollowmere")
  out.benchSizeAfterBlockedAttempt = state.bench.length
  out.blockedCorrectly = state.bench.length === before

  // The fusion exemption: buying a 3rd copy of an already-2-owned unit
  // at the cap should still succeed (it shrinks the bench, not grows
  // it) - start fresh, fill to exactly the cap with 2 copies of one
  // unit plus distinct fillers, then buy the 3rd copy.
  let state2 = { ...startRun("tommy"), essence: 999 }
  state2 = { ...state2, shopOffers: ["duskbramble"] }
  state2 = recruitUnit(state2, "duskbramble")
  state2 = { ...state2, shopOffers: ["duskbramble"] }
  state2 = recruitUnit(state2, "duskbramble")
  const fillers = ["briarkit", "thistlemaw", "sparrowthorn", "duskwren", "the-lovers",
    "the-hermit", "justice", "the-hanged-man", "death", "the-devil"]
  for (const id of fillers) {
    state2 = { ...state2, shopOffers: [id] }
    state2 = recruitUnit(state2, id)
  }
  out.benchSizeAtCapBeforeFusion = state2.bench.length
  state2 = { ...state2, shopOffers: ["duskbramble"] }
  const fusedState = recruitUnit(state2, "duskbramble")
  out.benchSizeAfterFusionAtCap = fusedState.bench.length
  out.fusionAllowedAtCap = fusedState.bench.length < out.benchSizeAtCapBeforeFusion

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("errors:", errors)
await browser.close()

const checks = []
checks.push(["RESERVE_CAP is exported and is 6", result.reserveCap === 6])
checks.push(["bench stops growing exactly at DEPLOY_SLOTS + RESERVE_CAP", result.benchSizeAfterOverbuying === result.totalCap])
checks.push(["a purchase past the cap is rejected (bench size unchanged)", result.blockedCorrectly])
checks.push(["a fusing 3rd-copy purchase at the cap is still allowed", result.fusionAllowedAtCap])
checks.push(["fusion nets the bench smaller, not bigger", result.benchSizeAfterFusionAtCap < result.benchSizeAtCapBeforeFusion])
checks.push(["no console/page errors", errors.length === 0])

let allPass = true
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`)
  if (!ok) allPass = false
}
process.exit(allPass ? 0 : 1)
