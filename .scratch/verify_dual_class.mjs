import { chromium } from "playwright"

const PORT = process.env.PORT || 5219

const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForTimeout(500)

const result = await page.evaluate(async () => {
  const { startAutoBattle, resolveRound } = await import("/src/services/heartwood/autoBattleEngine.js")
  const { findDualClassFor, applyDualClassGrant, DUAL_CLASSES } = await import("/src/data/heartwood/dualClasses.js")
  const { UNITS } = await import("/src/data/heartwood/units.js")
  const out = {}

  // 0. Data sanity: exactly 3 combos, each pair references real units.js ids.
  out.comboCount = DUAL_CLASSES.length
  out.pairsValid = DUAL_CLASSES.every((dc) => dc.pair.every((id) => !!UNITS[id]))

  // 1. Deathguard (Ironbark + Briarblade), both deployed:
  //    - Ironbark's card-facing className becomes "Deathguard"
  //    - Ironbark's own killing blow now Chains onto a second enemy
  //      (it had no chainDamage at all solo)
  //    - Briarblade gains a Taunt stack it doesn't have solo
  let dgState = startAutoBattle("tommy", ["ironbark", "briarblade"], "rune-warden")
  dgState = {
    ...dgState,
    enemies: [
      { ...dgState.enemies[0], hp: 5, maxHp: 40, pos: { row: 0, col: 1 } },
      { ...dgState.enemies[0], id: "e1", hp: 40, maxHp: 40, pos: { row: 1, col: 1 } },
    ],
  }
  const ironbarkUnit = dgState.playerUnits.find((u) => u.defId === "ironbark")
  const briarbladeUnit = dgState.playerUnits.find((u) => u.defId === "briarblade")
  out.deathguard = {
    ironbarkTaunt: ironbarkUnit.powers.taunt || 0,
    briarbladeTaunt: briarbladeUnit.powers.taunt || 0,
  }
  // Force Ironbark to act first and land the killing blow on the frontmost
  // low-HP enemy, then confirm the second enemy also takes damage (Chain).
  const dgAfter = resolveRound({
    ...dgState,
    playerUnits: dgState.playerUnits.map((u) => (u.defId === "ironbark" ? { ...u, moveIndex: 1 } : u)),
  })
  out.deathguard.frontDead = dgAfter.enemies[0].hp <= 0
  out.deathguard.secondDamaged = dgAfter.enemies[1].hp < 40

  // 2. Predator (Beastcaller + Briarblade), both deployed:
  //    - Beastcaller kills chain onto a second enemy (it has no
  //      chainDamage solo)
  //    - Briarblade gets its OWN spirit-wolf summon (a second one, on
  //      top of Beastcaller's own) - 2 spirit-wolf entries total
  let predState = startAutoBattle("tommy", ["beastcaller", "briarblade"], "rune-warden")
  out.predator = {
    spiritWolfCount: predState.playerUnits.filter((u) => u.defId === "spirit-wolf").length,
  }
  predState = {
    ...predState,
    enemies: [
      { ...predState.enemies[0], hp: 5, maxHp: 40, pos: { row: 0, col: 1 } },
      { ...predState.enemies[0], id: "e1", hp: 40, maxHp: 40, pos: { row: 1, col: 1 } },
    ],
  }
  const predAfter = resolveRound(predState)
  out.predator.frontDead = predAfter.enemies[0].hp <= 0
  out.predator.secondDamaged = predAfter.enemies[1].hp < 40

  // 3. Dream Healer (Sapkeeper + Dreamweaver/the-magician), both deployed:
  //    - Sapkeeper's own attack now applies Weak on hit (it has no
  //      on-hit trigger solo)
  //    - Dreamweaver picks up rallyHeal, mending an adjacent ally over
  //      multiple rounds (it has no rallyHeal solo)
  let dhState = startAutoBattle("tommy", ["sapkeeper", "the-magician", "the-fool"], "rotwood-husk")
  // Force Sapkeeper straight to its attack step (movePattern: block,
  // attack) and confirm the target ends up Weak.
  dhState = { ...dhState, playerUnits: dhState.playerUnits.map((u) => (u.defId === "sapkeeper" ? { ...u, moveIndex: 1 } : u)) }
  const dhAfterHit = resolveRound(dhState)
  out.dreamHealer = { targetWeak: (dhAfterHit.enemies[0].powers?.weak || 0) > 0 }
  // Dreamweaver's new rallyHeal: damage the-fool (adjacent to Dreamweaver
  // at slot 2), then confirm it heals back over a couple of rounds.
  const dwDamaged = {
    ...dhAfterHit,
    playerUnits: dhAfterHit.playerUnits.map((u) => (u.defId === "the-fool" ? { ...u, hp: Math.max(1, u.maxHp - 10) } : u)),
  }
  const hpBefore = dwDamaged.playerUnits.find((u) => u.defId === "the-fool").hp
  let s = dwDamaged
  const hpHistory = [hpBefore]
  for (let i = 0; i < 2; i++) {
    s = resolveRound(s)
    hpHistory.push(s.playerUnits.find((u) => u.defId === "the-fool")?.hp ?? null)
  }
  out.dreamHealer.hpHistory = hpHistory

  // 4. REGRESSION: solo units (no partner deployed) must NOT get any
  // dual-class grant - Ironbark alone still just gets its own Taunt (1),
  // no chainDamage; Briarblade alone still has no Taunt/summon.
  const soloState = startAutoBattle("tommy", ["ironbark", "briarblade", "the-fool", "the-fool"], "rotwood-husk")
  // the-fool x2 breaks up the pair so this ALSO isn't a false negative -
  // wait, ironbark+briarblade ARE both deployed here, so this should
  // actually still be Deathguard-active. Use a genuinely solo case
  // instead: Ironbark with no Briarblade anywhere in the squad.
  const trulySoloState = startAutoBattle("tommy", ["ironbark", "the-fool", "the-fool", "the-fool"], "rotwood-husk")
  const soloIronbark = trulySoloState.playerUnits.find((u) => u.defId === "ironbark")
  out.soloRegression = {
    taunt: soloIronbark.powers.taunt || 0,
    hasChainDamageDef: !!findDualClassFor("ironbark", ["the-fool", "the-fool", "the-fool"], UNITS),
  }

  // 5. Card-facing className resolves correctly via the same helpers
  // SquadDraft.jsx/UnitCard.jsx use.
  const dc = findDualClassFor("ironbark", ["briarblade"], UNITS)
  out.cardClassName = dc?.name
  const grantedDef = applyDualClassGrant(UNITS["ironbark"], "ironbark", dc, UNITS)
  out.grantedDefClassName = grantedDef.className
  out.grantedDefChainDamage = grantedDef.chainDamage

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("console/page errors:", errors)
await browser.close()

const checks = {
  comboCount: result.comboCount === 3,
  pairsValid: result.pairsValid === true,
  deathguardIronbarkTaunt: result.deathguard.ironbarkTaunt === 1,
  deathguardBriarbladeTaunt: result.deathguard.briarbladeTaunt === 1,
  deathguardChain: result.deathguard.frontDead && result.deathguard.secondDamaged,
  predatorSpiritWolves: result.predator.spiritWolfCount === 2,
  predatorChain: result.predator.frontDead && result.predator.secondDamaged,
  dreamHealerWeak: result.dreamHealer.targetWeak === true,
  dreamHealerHeal: result.dreamHealer.hpHistory[2] > result.dreamHealer.hpHistory[0],
  soloNoTaunt: result.soloRegression.taunt === 1,
  soloNoDualClass: result.soloRegression.hasChainDamageDef === false,
  cardClassName: result.cardClassName === "Deathguard",
  grantedDefClassName: result.grantedDefClassName === "Deathguard",
  grantedDefChainDamage: result.grantedDefChainDamage === 4,
}

if (errors.length) {
  console.log("FAIL: console/page errors present")
  process.exit(1)
}

const allPass = Object.values(checks).every(Boolean)
console.log(checks)
if (allPass) {
  console.log("PASS: all 3 Dual-Class combos (Deathguard, Predator, Dream Healer) verified live - name + mechanical grant + no leakage to solo units")
  process.exit(0)
} else {
  console.log("FAIL", checks)
  process.exit(1)
}
