import { chromium } from "playwright"

const PORT = process.env.PORT || 5217

const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForTimeout(500)

const result = await page.evaluate(async () => {
  const { startAutoBattle, resolveRound } = await import("/src/services/heartwood/autoBattleEngine.js")
  const out = {}

  // 1. Wispkeeper grants Revive only to Chebyshev-adjacent allies, not
  // itself - same verification shape as Ashenhorn/Glimmerward.
  const wkState = startAutoBattle("tommy", ["wispkeeper", "the-fool", "the-fool", "the-fool"], "rotwood-husk")
  out.wispkeeper = Object.fromEntries(wkState.playerUnits.map((u) => [u.id, u.powers.revive || 0]))

  // 2. Trueshot's knight pattern bypasses shielding to hit a
  // non-frontmost enemy, AND Execute's bonus applies against a wounded
  // target reached that way (not just a frontmost single-target hit).
  let tsState = startAutoBattle("tommy", ["trueshot"], "rune-warden")
  // Place a wounded enemy at a knight-leap offset from Trueshot's
  // origin (SLOT_POSITIONS[0] = row2,col0; knight offsets include
  // (row0,col1)) - wounded enough to trigger Execute (<=30% of 40 hp).
  tsState = {
    ...tsState,
    enemies: [{ ...tsState.enemies[0], hp: 10, maxHp: 40, pos: { row: 0, col: 1 } }],
  }
  const afterTs = resolveRound(tsState)
  const dmgLine = afterTs.log.find((l) => l.startsWith("Trueshot deal"))
  out.trueshot = { dmgLine, enemyHp: afterTs.enemies[0].hp }

  // 3. Motley uses weightedRandom - run several fresh battles and
  // confirm round-1 intents aren't always the exact same move (proof
  // it's not silently falling back to "sequence" behavior). Not a
  // strict assertion (random can coincidentally repeat), just a sanity
  // signal across a enough samples.
  const round1Types = []
  for (let i = 0; i < 12; i++) {
    const s = startAutoBattle("tommy", ["motley"], "rotwood-husk")
    round1Types.push(s.playerUnits[0].intent.type)
  }
  out.motley = { round1Types, distinctTypes: [...new Set(round1Types)].length, moveSelect: "weightedRandom" }

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("console/page errors:", errors)
await browser.close()

const byPos = result.wispkeeper
const wispkeeperOk = byPos.p0 === 0 && byPos.p1 === 1 && byPos.p2 === 0 && byPos.p3 === 1
const trueshotOk = !!result.trueshot.dmgLine && result.trueshot.enemyHp <= 0
const motleyOk = result.motley.distinctTypes >= 2

if (errors.length) {
  console.log("FAIL: console/page errors present")
  process.exit(1)
}
if (wispkeeperOk && trueshotOk && motleyOk) {
  console.log("PASS: Wispkeeper's Revive aura reaches only adjacent allies; Trueshot's knight+Execute combo kills a wounded off-pattern target; Motley's move order actually varies")
  process.exit(0)
} else {
  console.log("FAIL", { wispkeeperOk, trueshotOk, motleyOk, result })
  process.exit(1)
}
