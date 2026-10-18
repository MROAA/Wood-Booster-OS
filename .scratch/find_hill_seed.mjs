// Finds a run seed whose first fight has a big hill (>= 5 high tiles).
import { chromium } from "playwright"
const PORT = process.argv[2] || 5450
const b = await chromium.launch()
const page = await (await b.newContext()).newPage()
await page.goto(`http://localhost:${PORT}/heartwood`)
const seed = await page.evaluate(async () => {
  const E = await import("/src/services/heartwood/runEngine.js")
  const RM = await import("/src/services/heartwood/tacticsRealMatchup.js")
  for (let s = 424243; s < 424243 + 600; s++) {
    const bench = ["the-fool", "the-magician", "the-chariot"].map((defId, i) => ({ key: i, defId, upgradeLevel: 0, upgrades: [] }))
    const rs = E.chooseFloorEncounter(E.leaveShop({ ...E.startRun("tommy", null, { forcedSeed: s }), bench, deployed: [0, 1, 2, null], benchKeyCounter: 3 }), 0)
    const t = Object.values(RM.generateRealTerrain(rs.seed, rs.nodeIndex))
    if (t.filter((x) => x === "high").length >= 5) return s
  }
  return null
})
console.log(seed)
await b.close()
