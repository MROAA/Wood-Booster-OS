import { chromium } from "playwright"

const PORT = process.env.PORT || 5251

const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForTimeout(500)

const result = await page.evaluate(async () => {
  const { startAutoBattle } = await import("/src/services/heartwood/autoBattleEngine.js")
  const out = {}

  // 1. Quarrybreak (relic) grants Shatter to every deployed unit.
  const relicBattle = startAutoBattle("tommy", ["the-fool", "the-magician"], "rotwood-husk", ["quarrybreak"])
  out.relicShatter = relicBattle.playerUnits.every((u) => (u.powers.shatter || 0) > 0)

  // 2. Cracking Fist (item) only grants Shatter to its wearer.
  const itemBattle = startAutoBattle(
    "tommy",
    [
      { defId: "the-fool", upgradeLevel: 0, itemIds: ["cracking-fist"] },
      { defId: "the-magician", upgradeLevel: 0, itemIds: [] },
    ],
    "rotwood-husk",
  )
  out.itemShatter = {
    wearer: (itemBattle.playerUnits[0].powers.shatter || 0) > 0,
    other: (itemBattle.playerUnits[1].powers.shatter || 0) > 0,
  }

  // 3. Quarrywarden's Rally grants Shatter only to Chebyshev-adjacent
  // allies at battle start, not itself and not the far corner.
  const rallyBattle = startAutoBattle("tommy", ["quarrywarden", "the-fool", "the-fool", "the-fool"], "rotwood-husk")
  // SLOT_POSITIONS: [row2,col0](quarrywarden) adjacent to [row2,col1] and [row1,col1], NOT [row2,col2]
  out.rallyShatter = {
    self: rallyBattle.playerUnits[0].powers.shatter || 0,
    adjacentBack: rallyBattle.playerUnits[1].powers.shatter || 0,
    adjacentFront: rallyBattle.playerUnits[3].powers.shatter || 0,
    farCorner: rallyBattle.playerUnits[2].powers.shatter || 0,
  }

  // 4. Stormroot exists and resolves via startAutoBattle without error.
  const stormrootBattle = startAutoBattle("tommy", ["the-fool"], "stormroot")
  out.stormrootHp = stormrootBattle.enemies[0].maxHp

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("console/page errors:", errors)
await browser.close()

const relicOk = result.relicShatter
const itemOk = result.itemShatter.wearer && !result.itemShatter.other
const rallyOk =
  result.rallyShatter.self === 0 &&
  result.rallyShatter.adjacentBack > 0 &&
  result.rallyShatter.adjacentFront > 0 &&
  result.rallyShatter.farCorner === 0
const stormrootOk = result.stormrootHp === 38

if (errors.length) {
  console.log("FAIL: console/page errors present")
  process.exit(1)
}
if (relicOk && itemOk && rallyOk && stormrootOk) {
  console.log("PASS: Quarrybreak grants squad-wide Shatter, Cracking Fist grants it only to its wearer, Quarrywarden's Rally reaches only adjacent allies (not itself, not the far corner), Stormroot resolves correctly")
  process.exit(0)
} else {
  console.log("FAIL", { relicOk, itemOk, rallyOk, stormrootOk, result })
  process.exit(1)
}
