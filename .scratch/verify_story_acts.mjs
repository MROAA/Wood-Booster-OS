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
  const { DIFFICULTY_TIERS, difficultyTierForNode, RUN_PATH } = await import("/src/services/heartwood/runEngine.js")
  const { nodeNarrative } = await import("/src/services/heartwood/runNarrative.js")
  const out = {}

  out.tierCount = DIFFICULTY_TIERS.length
  out.tiersHaveNarrative = DIFFICULTY_TIERS.every(
    (t) => typeof t.tagline === "string" && t.tagline.length > 0 && typeof t.lore === "string" && t.lore.length > 0,
  )
  out.tierNames = DIFFICULTY_TIERS.map((t) => t.name)

  // Find every act-crossing point across the WHOLE run (RUN_PATH's fixed
  // shape - `path` on a live run grows one node at a time now, so
  // RUN_PATH.length is the right denominator, the same one
  // FormationScreen.jsx / RunMap.jsx pass to difficultyTierForNode).
  const pathLength = RUN_PATH.length
  const crossings = []
  for (let i = 1; i < pathLength; i++) {
    const prevTier = difficultyTierForNode(i - 1, pathLength).name
    const curTier = difficultyTierForNode(i, pathLength).name
    if (prevTier !== curTier) crossings.push({ index: i, from: prevTier, to: curTier, progress: +(i / (pathLength - 1)).toFixed(3) })
  }
  out.crossings = crossings
  out.uniqueTiersSeen = [...new Set([difficultyTierForNode(0, pathLength).name, ...crossings.map((c) => c.to)])]

  // node 0 -> first tier, last node -> last tier
  out.firstNodeTier = difficultyTierForNode(0, pathLength).name
  out.lastNodeTier = difficultyTierForNode(pathLength - 1, pathLength).name

  // nodeNarrative: never throws, title never null, valid kind, for every
  // real node in the run.
  let narrativeOk = true
  let nullTitle = null
  for (let i = 0; i < RUN_PATH.length; i++) {
    try {
      const n = nodeNarrative(RUN_PATH[i], i, RUN_PATH.length)
      if (!n.title) { narrativeOk = false; nullTitle = i }
      if (n.kind !== "stop" && n.kind !== "fight") narrativeOk = false
      if (!n.tier || !n.tier.name) narrativeOk = false
    } catch (e) {
      narrativeOk = false
      out.narrativeThrow = `${i}: ${String(e)}`
    }
  }
  out.narrativeOk = narrativeOk
  out.nullTitleAt = nullTitle

  // Spot sample - the three authored beats and a couple of trials.
  out.samples = [1, 12, 10, 46, 103, 110].map((i) => {
    const n = nodeNarrative(RUN_PATH[i], i, RUN_PATH.length)
    return { i, title: n.title, kind: n.kind, isTrial: n.isTrial, tier: n.tier.name, beat: n.beat && n.beat.slice(0, 60), intro: n.intro && n.intro.slice(0, 50) }
  })

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("errors:", errors)
await browser.close()

const checks = []
checks.push(["DIFFICULTY_TIERS has 7 entries", result.tierCount === 7])
checks.push(["every DIFFICULTY_TIERS entry carries a tagline and lore", result.tiersHaveNarrative])
checks.push(["6 act-crossings happen across a real run (7 acts = 6 transitions)", result.crossings.length === 6])
checks.push(["all 7 act names are reached across the run", result.uniqueTiersSeen.length === 7])
checks.push(["node 0 resolves to the first act", result.firstNodeTier === result.tierNames[0]])
checks.push(["last node resolves to the seventh act", result.lastNodeTier === result.tierNames[6]])
checks.push(["nodeNarrative: no throw, title never null, valid kind/tier for every RUN_PATH node", result.narrativeOk])
checks.push(["no console/page errors", errors.length === 0])

let allPass = true
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`)
  if (!ok) allPass = false
}
process.exit(allPass ? 0 : 1)
