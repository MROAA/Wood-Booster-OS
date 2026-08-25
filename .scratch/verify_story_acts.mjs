import { chromium } from "playwright"

const PORT = process.env.PORT || 5311

const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForTimeout(500)

const result = await page.evaluate(async () => {
  const { DIFFICULTY_TIERS, difficultyTierForNode, startRun } = await import("/src/services/heartwood/runEngine.js")
  const out = {}

  out.tiersHaveNarrative = DIFFICULTY_TIERS.every((t) => typeof t.tagline === "string" && t.tagline.length > 0 && typeof t.lore === "string" && t.lore.length > 0)

  // Find every act-crossing point across the real RUN_PATH and confirm
  // the boundary logic actually fires exactly once per tier transition
  // (comparing node N-1's tier to node N's tier, the same check
  // FormationScreen.jsx's own `isNewAct` uses).
  const run = startRun("tommy")
  const pathLength = run.path.length
  const crossings = []
  for (let i = 1; i < pathLength; i++) {
    const prevTier = difficultyTierForNode(i - 1, pathLength).name
    const curTier = difficultyTierForNode(i, pathLength).name
    if (prevTier !== curTier) crossings.push({ index: i, from: prevTier, to: curTier })
  }
  out.crossings = crossings
  out.uniqueTiersSeen = [...new Set(crossings.map((c) => c.to))]

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("errors:", errors)
await browser.close()

const checks = []
checks.push(["every DIFFICULTY_TIERS entry carries a tagline and lore", result.tiersHaveNarrative])
checks.push(["exactly 3 act-crossings happen across a real run (4 acts = 3 transitions)", result.crossings.length === 3])
checks.push(["all 3 later act names are reached (Deepening Woods, Wounded Heartwood, Reckoning)", result.uniqueTiersSeen.length === 3])
checks.push(["no console/page errors", errors.length === 0])

let allPass = true
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`)
  if (!ok) allPass = false
}
process.exit(allPass ? 0 : 1)
