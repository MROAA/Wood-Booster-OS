import { chromium } from "playwright"

const PORT = process.env.PORT || 5206

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

  // 1. Rally, adjacency-sensitive case: deploy Ashenhorn + 3 the-fools
  // across all 4 SLOT_POSITIONS. SLOT_POSITIONS[0]=(2,0) and [2]=(2,2)
  // are the one non-adjacent pair among the 4 slots - if Ashenhorn is
  // at slot 0, the fool at slot 2 should NOT get Strength, but the
  // fools at slots 1 and 3 (both adjacent to slot 0) should.
  const state = startAutoBattle("tommy", ["ashenhorn", "the-fool", "the-fool", "the-fool"], "rotwood-husk")
  // deployedUnits order maps 1:1 to SLOT_POSITIONS index, so p0=slot0
  // (Ashenhorn), p1=slot1, p2=slot2, p3=slot3.
  out.rallyStrength = state.playerUnits.map((u) => ({ id: u.id, defId: u.defId, pos: u.pos, strength: u.powers.strength || 0 }))

  // 2. Rootfang inflicts Poison on hit - real fight, force its queued
  // move to the poison-debuff step (moveIndex 1) and confirm the
  // target enemy actually carries powers.poison afterward, then that
  // it actually ticks (HP loss on the following round with no other
  // source of damage).
  let rfState = startAutoBattle("tommy", ["rootfang"], "rotwood-husk")
  rfState = {
    ...rfState,
    playerUnits: rfState.playerUnits.map((u) => ({ ...u, moveIndex: 1, intent: { type: "debuff", id: "poison", amount: 3, target: "target" } })),
  }
  const afterDebuffRound = resolveRound(rfState)
  const enemyPoison = afterDebuffRound.enemies[0].powers.poison || 0
  const enemyHpAfterDebuffRound = afterDebuffRound.enemies[0].hp
  const nextRound = resolveRound(afterDebuffRound)
  const enemyHpAfterTick = nextRound.enemies[0].hp
  out.rootfangPoison = {
    enemyPoisonStacks: enemyPoison,
    hpDroppedFromTick: enemyHpAfterDebuffRound - enemyHpAfterTick > 0,
  }

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("console/page errors:", errors)
await browser.close()

const byPos = Object.fromEntries(result.rallyStrength.map((u) => [u.id, u.strength]))
// Tommy's own squadPassive gives every unit +2 Strength baseline, on
// top of whatever Rally adds - so p0 (Ashenhorn itself, not
// self-buffed by its own Rally) and p2 (the far corner, NOT adjacent
// to slot 0) should both read as baseline-only (2), while p1/p3
// (genuinely adjacent to slot 0) should read baseline+Rally (4).
const rallyOk = byPos.p0 === 2 && byPos.p1 === 4 && byPos.p2 === 2 && byPos.p3 === 4
const poisonOk = result.rootfangPoison.enemyPoisonStacks === 3 && result.rootfangPoison.hpDroppedFromTick

if (errors.length) {
  console.log("FAIL: console/page errors present")
  process.exit(1)
}
if (rallyOk && poisonOk) {
  console.log("PASS: Rally buffs only Chebyshev-adjacent allies (not self, not the far corner), Rootfang's Poison applies and ticks")
  process.exit(0)
} else {
  console.log("FAIL", { rallyOk, poisonOk, byPos, rootfangPoison: result.rootfangPoison })
  process.exit(1)
}
