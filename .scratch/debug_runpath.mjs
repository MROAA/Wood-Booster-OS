import { chromium } from "playwright"
const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto("http://localhost:5186/heartwood", { waitUntil: "domcontentloaded" })
const result = await page.evaluate(async () => {
  const { startRun, serializeRun, deserializeRun, actIndexForNode, RUN_PATH } = await import("/src/services/heartwood/runEngine.js")
  const candidates = []
  for (let i = 0; i < RUN_PATH.length; i++) {
    if (actIndexForNode(i, RUN_PATH.length) === 2) {
      candidates.push({ i, node: RUN_PATH[i] })
    }
    if (candidates.length > 8) break
  }
  // Try seeding+round-tripping at the first shop-type candidate.
  const shopCandidate = candidates.find((c) => c.node?.type === "shop") || candidates[0]
  const rs = { ...startRun("tommy", null), nodeIndex: shopCandidate.i, phase: "shop", lastSeenAct: 1 }
  const serialized = serializeRun(rs)
  const roundtrip = deserializeRun(serialized)
  return {
    candidates: candidates.map((c) => ({ i: c.i, type: c.node?.type })),
    shopCandidateIndex: shopCandidate.i,
    roundtripOk: !!roundtrip,
    roundtripNodeIndex: roundtrip?.nodeIndex,
    roundtripPhase: roundtrip?.phase,
    roundtripLastSeenAct: roundtrip?.lastSeenAct,
  }
})
console.log(JSON.stringify(result, null, 2))
await browser.close()
