import { chromium } from "playwright"

const PORT = process.env.PORT || 5249

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

  // 1. Stoneknoll's own passive grants it Shatter at battle start.
  const state = startAutoBattle("tommy", ["stoneknoll"], "rotwood-husk")
  out.stoneknollShatter = state.playerUnits[0].powers.shatter || 0

  // 2. Shatter deals bonus damage ONLY while the target holds Block -
  // same hit amount, target with 0 Block vs target with Block > 0.
  let noBlockState = startAutoBattle("tommy", ["stoneknoll"], "rotwood-husk")
  noBlockState = { ...noBlockState, enemies: noBlockState.enemies.map((e) => ({ ...e, block: 0 })), playerUnits: noBlockState.playerUnits.map((u) => ({ ...u, moveIndex: 0, intent: { type: "attack", amount: 6 } })) }
  const noBlockHpBefore = noBlockState.enemies[0].hp
  const afterNoBlock = resolveRound(noBlockState)
  const noBlockDmg = noBlockHpBefore - afterNoBlock.enemies[0].hp

  let blockState = startAutoBattle("tommy", ["stoneknoll"], "rotwood-husk")
  blockState = { ...blockState, enemies: blockState.enemies.map((e) => ({ ...e, block: 5 })), playerUnits: blockState.playerUnits.map((u) => ({ ...u, moveIndex: 0, intent: { type: "attack", amount: 6 } })) }
  const blockHpBefore = blockState.enemies[0].hp
  const afterBlock = resolveRound(blockState)
  // total "value" delivered = damage to HP + however much Block got
  // eaten, so the shatter bonus shows up even if it's fully absorbed
  const blockDmgPlusAbsorbed = (blockHpBefore - afterBlock.enemies[0].hp) + (5 - Math.max(0, afterBlock.enemies[0].block))
  out.shatterBonus = { noBlockTotal: noBlockDmg, withBlockTotal: blockDmgPlusAbsorbed }

  // 3. Cragfang (enemy) carries the same Shatter passive via the new
  // enemy-passive support in startAutoBattle.
  const enemyState = startAutoBattle("tommy", ["the-fool"], "cragfang")
  out.cragfangShatter = enemyState.enemies[0].powers.shatter || 0

  // 4. Sunder can strip Shatter (added to SUNDERABLE_IDS).
  let sunderState = startAutoBattle("tommy", ["stoneknoll"], "witherfang")
  sunderState = { ...sunderState, enemies: sunderState.enemies.map((e) => ({ ...e, moveIndex: 1, intent: { type: "sunder", target: "player" } })) }
  const afterSunder = resolveRound(sunderState)
  out.shatterSundered = (afterSunder.playerUnits[0].powers.shatter || 0) === 2 // started at 3, sunder strips 1

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("console/page errors:", errors)
await browser.close()

const passiveOk = result.stoneknollShatter === 3
const bonusOk = result.shatterBonus.withBlockTotal === result.shatterBonus.noBlockTotal + 3
const enemyPassiveOk = result.cragfangShatter === 3
const sunderOk = result.shatterSundered

if (errors.length) {
  console.log("FAIL: console/page errors present")
  process.exit(1)
}
if (passiveOk && bonusOk && enemyPassiveOk && sunderOk) {
  console.log("PASS: Shatter grants +3 damage only while the target holds Block, works for both a unit passive and an enemy passive, and can be stripped by Sunder")
  process.exit(0)
} else {
  console.log("FAIL", { passiveOk, bonusOk, enemyPassiveOk, sunderOk, result })
  process.exit(1)
}
