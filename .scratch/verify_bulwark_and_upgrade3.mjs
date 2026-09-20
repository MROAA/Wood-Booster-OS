import { chromium } from "playwright"

const PORT = process.env.PORT || 5200

const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForTimeout(500)

const result = await page.evaluate(async () => {
  const { startAutoBattle, resolveRound } = await import("/src/services/heartwood/autoBattleEngine.js")
  const { upgradeCost, UPGRADE_MAX_LEVEL, unitDefWithUpgrade, UNITS } = await import("/src/data/heartwood/units.js")

  const out = {}

  // 1. Upgrade now goes to level 3.
  out.maxLevel = UPGRADE_MAX_LEVEL
  out.costs = [0, 1, 2, 3].map((l) => upgradeCost(l))
  const base = UNITS["the-fool"]
  out.hpAtLevel3 = unitDefWithUpgrade(base, 3).maxHp

  // 2. Bulwark Standard: deploy 3 units with different HP (via
  // different upgrade levels on the SAME base unit, so the only
  // variable is maxHp), confirm Taunt lands on the highest-HP one -
  // not hardcoded to any specific defId like Stoneheart's own passive.
  let state = startAutoBattle(
    "tommy",
    [
      { defId: "the-fool", upgradeLevel: 0 },
      { defId: "the-fool", upgradeLevel: 3 },
      { defId: "the-fool", upgradeLevel: 0 },
    ],
    "rotwood-husk",
    ["bulwark-standard"],
  )
  const tauntFlags = state.playerUnits.map((u) => ({ maxHp: u.maxHp, taunt: u.powers.taunt || 0 }))
  out.tauntFlags = tauntFlags

  const hpHistory = []
  for (let i = 0; i < 15 && state.phase === "player"; i++) {
    state = resolveRound(state)
    hpHistory.push(state.playerUnits.map((u) => u.hp))
  }
  out.hpHistory = hpHistory

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("console/page errors:", errors)
await browser.close()

const upgradeOk = result.maxLevel === 3 && result.costs[3] === null && result.costs[2] === 9 && result.hpAtLevel3 > 0
const highestHpUnitIdx = result.tauntFlags.reduce((bi, u, i, arr) => (u.maxHp > arr[bi].maxHp ? i : bi), 0)
const tauntAssignedCorrectly = result.tauntFlags[highestHpUnitIdx].taunt === 1 && result.tauntFlags.filter((t) => t.taunt > 0).length === 1
const others = result.hpHistory.every((row) =>
  row.filter((_, i) => i !== highestHpUnitIdx).every((hp, idx) => {
    const otherIdxs = [0, 1, 2].filter((i) => i !== highestHpUnitIdx)
    return hp === result.hpHistory[0][otherIdxs[idx]]
  }),
)
const targetTookDamage = result.hpHistory[result.hpHistory.length - 1][highestHpUnitIdx] < result.hpHistory[0][highestHpUnitIdx]

if (errors.length) {
  console.log("FAIL: console/page errors present")
  process.exit(1)
}
if (upgradeOk && tauntAssignedCorrectly && others && targetTookDamage) {
  console.log("PASS: Upgrade level 3 works, Bulwark Standard grants Taunt to the highest-HP unit and it draws all attacks")
  process.exit(0)
} else {
  console.log("FAIL", { upgradeOk, tauntAssignedCorrectly, others, targetTookDamage, highestHpUnitIdx })
  process.exit(1)
}
