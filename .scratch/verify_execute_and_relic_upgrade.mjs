import { chromium } from "playwright"

const PORT = process.env.PORT || 5203

const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForTimeout(500)

const result = await page.evaluate(async () => {
  const { startAutoBattle } = await import("/src/services/heartwood/autoBattleEngine.js")
  const { upgradeCost, UPGRADE_MAX_LEVEL } = await import("/src/data/heartwood/units.js")
  const out = {}

  // Extract the actual computed damage from the "X deal N damage to Y"
  // log line rather than net HP loss - net HP loss under-counts once
  // the hit would overkill (HP can't go negative), which is exactly
  // what happens when a wounded low-HP target takes a bonus-boosted
  // execute hit. High enemy HP (mist-growler, maxHp 34) keeps this
  // headroom safe for both the healthy and wounded cases.
  // resolveRound resolves the WHOLE round (player side, then enemy
  // side), so the last log line is the enemy's own attack, not the
  // player's - search by attacker name instead of taking the tail.
  function loggedDamage(state, attackerName) {
    const line = state.log.find((l) => l.startsWith(`${attackerName} deal`))
    const match = line?.match(/deal (\d+) damage/)
    return match ? Number(match[1]) : null
  }

  // 1. Execute via the Culling Strike relic: same base attack against
  // a healthy enemy vs. a low-HP one should deal MORE damage to the
  // low-HP one, by exactly the relic's flat bonus (3).
  const healthy = startAutoBattle("tommy", ["the-fool"], "mist-growler", ["culling-strike"])
  const woundedState = {
    ...healthy,
    enemies: healthy.enemies.map((e) => ({ ...e, hp: Math.round(e.maxHp * 0.25) })),
  }
  const { resolveRound } = await import("/src/services/heartwood/autoBattleEngine.js")
  // Force the-fool's queued move to Attack (index 1) so this round's
  // action is guaranteed to be a hit, not its Block move (index 0).
  const withAttackQueued = (s) => ({
    ...s,
    playerUnits: s.playerUnits.map((u) => ({ ...u, moveIndex: 1, intent: { type: "attack", amount: 4 } })),
  })
  const healthyResult = resolveRound(withAttackQueued(healthy))
  const woundedResult = resolveRound(withAttackQueued(woundedState))
  const dmgToHealthy = loggedDamage(healthyResult, "Mosskit")
  const dmgToWounded = loggedDamage(woundedResult, "Mosskit")
  out.executeRelic = { dmgToHealthy, dmgToWounded, bonus: dmgToWounded - dmgToHealthy }

  // 2. Execute via Duskclaw's own passive (unit-level source, not a
  // relic) - same test shape, no relic involved this time.
  const healthy2 = startAutoBattle("tommy", ["duskclaw"], "mist-growler")
  const wounded2 = { ...healthy2, enemies: healthy2.enemies.map((e) => ({ ...e, hp: Math.round(e.maxHp * 0.25) })) }
  const withAttackQueued2 = (s) => ({
    ...s,
    playerUnits: s.playerUnits.map((u) => ({ ...u, moveIndex: 0, intent: { type: "attack", amount: 8 } })),
  })
  const h2 = resolveRound(withAttackQueued2(healthy2))
  const w2 = resolveRound(withAttackQueued2(wounded2))
  const dmgH2 = loggedDamage(h2, "Duskclaw")
  const dmgW2 = loggedDamage(w2, "Duskclaw")
  out.executeUnit = { dmgH2, dmgW2, bonus: dmgW2 - dmgH2 }

  // 3. Relic Upgrade scaling: Culling Strike at level 0 vs level 2
  // should grant a larger Execute bonus in a real battle-start.
  const level0 = startAutoBattle("tommy", ["the-fool"], "rotwood-husk", ["culling-strike"], 0, {})
  const level2 = startAutoBattle("tommy", ["the-fool"], "rotwood-husk", ["culling-strike"], 0, { "culling-strike": 2 })
  out.relicUpgrade = {
    costs: [0, 1, 2, 3].map((l) => upgradeCost(l)),
    maxLevel: UPGRADE_MAX_LEVEL,
    executeAtLevel0: level0.playerUnits[0].powers.execute || 0,
    executeAtLevel2: level2.playerUnits[0].powers.execute || 0,
  }

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("console/page errors:", errors)
await browser.close()

const executeRelicOk = result.executeRelic.bonus === 3
const executeUnitOk = result.executeUnit.bonus === 4
const relicUpgradeOk = result.relicUpgrade.executeAtLevel2 > result.relicUpgrade.executeAtLevel0

if (errors.length) {
  console.log("FAIL: console/page errors present")
  process.exit(1)
}
if (executeRelicOk && executeUnitOk && relicUpgradeOk) {
  console.log("PASS: Execute mechanic (relic + unit sources) and Relic Upgrade scaling all correct")
  process.exit(0)
} else {
  console.log("FAIL", { executeRelicOk, executeUnitOk, relicUpgradeOk })
  process.exit(1)
}
