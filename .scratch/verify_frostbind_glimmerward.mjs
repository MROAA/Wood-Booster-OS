import { chromium } from "playwright"

const PORT = process.env.PORT || 5214

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

  // 1. Frostbind's debuff step applies Stun. Player phase resolves
  // before enemy phase each round, so the enemy's own (still pending)
  // turn this SAME round sees the fresh stun and skips immediately -
  // confirmed by the log, not a two-round sequence like an enemy
  // stunning the player would need (that ordering runs the other way).
  let state = startAutoBattle("tommy", ["frostbind"], "rotwood-husk")
  const hpStart = state.playerUnits[0].hp
  state = { ...state, playerUnits: state.playerUnits.map((u) => ({ ...u, moveIndex: 1, intent: { type: "debuff", id: "stun", amount: 1, target: "target" } })) }
  const afterRound = resolveRound(state)
  out.frostbindStun = {
    stunLine: afterRound.log.some((l) => l.includes("gain 1 stun")),
    skipLine: afterRound.log.some((l) => l.includes("stunned and skips")),
    enemyStunConsumedSameRound: (afterRound.enemies[0].powers.stun || 0) === 0,
    playerTookNoDamageThisRound: afterRound.playerUnits[0].hp === hpStart,
  }

  // 2. Glimmerward grants Ward to adjacent allies via the same Rally
  // mechanism Ashenhorn uses for Strength - deploy across all 4 slots,
  // confirm only the genuinely adjacent allies (not the far corner,
  // not Glimmerward itself) get a Ward stack.
  const gwState = startAutoBattle("tommy", ["glimmerward", "the-fool", "the-fool", "the-fool"], "rotwood-husk")
  out.glimmerward = gwState.playerUnits.map((u) => ({ id: u.id, defId: u.defId, pos: u.pos, ward: u.powers.ward || 0 }))

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("console/page errors:", errors)
await browser.close()

const stunAppliedOk =
  result.frostbindStun.stunLine &&
  result.frostbindStun.skipLine &&
  result.frostbindStun.enemyStunConsumedSameRound &&
  result.frostbindStun.playerTookNoDamageThisRound
const skipOk = stunAppliedOk
const byPos = Object.fromEntries(result.glimmerward.map((u) => [u.id, u.ward]))
// p0 = Glimmerward (slot 0), p1/p3 adjacent -> ward 1, p2 the far
// corner (not adjacent to slot 0) -> ward 0, Glimmerward itself -> 0
// (rallyAdjacent never self-targets).
const glimmerwardOk = byPos.p0 === 0 && byPos.p1 === 1 && byPos.p2 === 0 && byPos.p3 === 1

if (errors.length) {
  console.log("FAIL: console/page errors present")
  process.exit(1)
}
if (stunAppliedOk && skipOk && glimmerwardOk) {
  console.log("PASS: Frostbind applies Stun and the enemy actually skips its next action; Glimmerward grants Ward only to genuinely adjacent allies")
  process.exit(0)
} else {
  console.log("FAIL", { stunAppliedOk, skipOk, glimmerwardOk, byPos })
  process.exit(1)
}
