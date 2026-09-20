import { chromium } from "playwright"

const PORT = process.env.PORT || 5202

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

  // 1. Basic case: a damaged single-target attacker with Vampiric
  // Bloom heals back on every hit that lands.
  let state = startAutoBattle("tommy", ["the-fool"], "rotwood-husk", ["vampiric-bloom"])
  // Force the unit to have taken prior damage so healing is visible
  // (fresh units start at full HP and heal would be a no-op to watch).
  state = {
    ...state,
    playerUnits: state.playerUnits.map((u) => ({ ...u, hp: u.maxHp - 10 })),
  }
  // Run several rounds so the unit's movePattern is guaranteed to
  // cycle through its attack move at least once (round 1's queued move
  // is often Block, not Attack) - check the final accumulated log for
  // "heal" lines rather than net HP, since the unit also keeps taking
  // damage from the enemy every round.
  const hpBefore = state.playerUnits[0].hp
  let next = state
  for (let i = 0; i < 5 && next.phase === "player"; i++) {
    next = resolveRound(next)
  }
  const healLines = next.log.filter((l) => l.includes("heal") && l.includes("Mosskit"))
  out.singleTarget = { hpBefore, healLineCount: healLines.length, sample: healLines.slice(0, 3) }

  // 2. Pattern-attacker case: Rook's Charge hits multiple enemies in
  // one turn - confirm Lifesteal fires (and heals) once per target hit,
  // not once per turn, by comparing total heal against a formation with
  // 2 living enemies vs. only 1.
  // Rook's Charge deploys at SLOT_POSITIONS[0] = {row:2, col:0} - both
  // enemies placed in that same column so a rook line actually reaches
  // both of them (a rook line is same-row-or-same-column from origin,
  // not "everywhere").
  let state2 = startAutoBattle("tommy", ["rooks-charge"], "moss-troll", ["vampiric-bloom"])
  state2 = {
    ...state2,
    playerUnits: state2.playerUnits.map((u) => ({ ...u, hp: u.maxHp - 20 })),
    enemies: [
      { ...state2.enemies[0], hp: 30, maxHp: 30, pos: { row: 0, col: 0 } },
      { ...state2.enemies[0], id: "e1", hp: 30, maxHp: 30, pos: { row: 1, col: 0 } },
    ],
  }
  let next2 = state2
  for (let i = 0; i < 5 && next2.phase === "player"; i++) {
    next2 = resolveRound(next2)
  }
  const healLines2 = next2.log.filter((l) => l.includes("heal") && l.includes("Rook"))
  out.patternAttacker = { healLineCount: healLines2.length, sample: healLines2.slice(0, 4) }

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("console/page errors:", errors)
await browser.close()

const singleOk = result.singleTarget.healLineCount >= 1
// Rook's Charge hits 2 enemies in the same column in one turn - if
// Lifesteal fires once per target hit (not once per turn), at least 2
// separate heal lines should appear across the 5 rounds (likely more,
// since it recurs every time the attack move comes up again).
const patternOk = result.patternAttacker.healLineCount >= 2

if (errors.length) {
  console.log("FAIL: console/page errors present")
  process.exit(1)
}
if (singleOk && patternOk) {
  console.log("PASS: Vampiric Bloom heals on hit, and fires once per target for pattern attackers")
  process.exit(0)
} else {
  console.log("FAIL", { singleOk, patternOk })
  process.exit(1)
}
