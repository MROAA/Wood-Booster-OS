import { chromium } from "playwright"

const PORT = process.env.PORT || 5198

const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForTimeout(500)

const result = await page.evaluate(async () => {
  const { startAutoBattle, resolveRound } = await import("/src/services/heartwood/autoBattleEngine.js")
  const { UNITS, unitDefWithUpgrade, UPGRADE_MAX_LEVEL, upgradeCost } = await import("/src/data/heartwood/units.js")

  const out = {}

  // 1. unitDefWithUpgrade scales HP and movePattern amounts correctly.
  const base = UNITS["the-fool"]
  const up1 = unitDefWithUpgrade(base, 1)
  const up2 = unitDefWithUpgrade(base, 2)
  out.hpScaling = { base: base.maxHp, up1: up1.maxHp, up2: up2.maxHp }
  out.upgradeCosts = [0, 1, 2].map((l) => upgradeCost(l))
  out.maxLevel = UPGRADE_MAX_LEVEL

  // 2. Real fight: deploy one upgraded (level 2) and one un-upgraded
  // copy of the same base unit, confirm the upgraded one has more max
  // HP in the actual running battle state, and that its intent's
  // damage amount reflects the scaled movePattern - not just at round
  // 1 (startAutoBattle) but also after a full round of recomputation
  // (resolveRound -> actSide -> computeIntent), proving the fix to
  // actSide's per-unit def lookup actually persists across rounds.
  let state = startAutoBattle(
    "tommy",
    [
      { defId: "the-fool", upgradeLevel: 2 },
      { defId: "the-fool", upgradeLevel: 0 },
    ],
    "rotwood-husk",
  )
  const p0Initial = state.playerUnits[0]
  const p1Initial = state.playerUnits[1]
  out.initialMaxHp = [p0Initial.maxHp, p1Initial.maxHp]
  out.initialIntentAmount = [p0Initial.intent?.amount, p1Initial.intent?.amount]

  // Run a few rounds so each unit's intent gets recomputed at least
  // once via actSide's per-round def lookup (the code path that used
  // to silently drop back to un-upgraded numbers before the fix).
  for (let i = 0; i < 3 && state.phase === "player"; i++) {
    state = resolveRound(state)
  }
  const p0After = state.playerUnits.find((u) => u.id === "p0")
  const p1After = state.playerUnits.find((u) => u.id === "p1")
  out.afterRoundsIntentAmount = [p0After?.intent?.amount, p1After?.intent?.amount]
  out.afterRoundsUpgradeLevel = [p0After?.upgradeLevel, p1After?.upgradeLevel]

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("console/page errors:", errors)

await browser.close()

const hpOk = result.hpScaling.up1 > result.hpScaling.base && result.hpScaling.up2 > result.hpScaling.up1
const costsOk = result.upgradeCosts[0] > 0 && result.upgradeCosts[1] > result.upgradeCosts[0] && result.upgradeCosts[2] === null
const initialOk = result.initialMaxHp[0] > result.initialMaxHp[1] && result.initialIntentAmount[0] > result.initialIntentAmount[1]
const persistsOk =
  result.afterRoundsIntentAmount[0] > result.afterRoundsIntentAmount[1] &&
  result.afterRoundsUpgradeLevel[0] === 2 &&
  result.afterRoundsUpgradeLevel[1] === 0

if (errors.length) {
  console.log("FAIL: console/page errors present")
  process.exit(1)
}
if (hpOk && costsOk && initialOk && persistsOk) {
  console.log("PASS: upgrade scaling correct and persists across rounds")
  process.exit(0)
} else {
  console.log("FAIL", { hpOk, costsOk, initialOk, persistsOk })
  process.exit(1)
}
