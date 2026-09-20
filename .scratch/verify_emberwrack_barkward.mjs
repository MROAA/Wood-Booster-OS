import { chromium } from "playwright"

const PORT = process.env.PORT || 5243

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

  // 1. Emberwrack's AoE step hits every living player unit at once,
  // same as Spacemonkey's - bypassing frontmost/Taunt entirely.
  let state = startAutoBattle("tommy", ["the-fool", "the-magician", "the-empress"], "emberwrack")
  state = {
    ...state,
    playerUnits: state.playerUnits.map((u) => ({ ...u, powers: { ...u.powers, taunt: u.defId === "the-fool" ? 1 : 0 } })),
    enemies: state.enemies.map((e) => ({ ...e, moveIndex: 1, intent: { type: "aoe", amount: 5 } })),
  }
  const beforeHp = state.playerUnits.map((u) => u.hp)
  const afterAoe = resolveRound(state)
  out.aoeHitAll = afterAoe.playerUnits.every((u, i) => u.hp < beforeHp[i])

  // 2. Bark Ward (relic) grants repeating Block to every unit at the
  // start of each round, surviving resolveRound's own Block reset
  // (which happens BEFORE turnStart triggers fire). Checked via the
  // log line itself, not final block value - the enemy's own
  // single-target attack this same round can consume whichever unit
  // it happens to hit's Block entirely, which is correct behavior
  // (Block absorbing a real hit), not a sign the relic didn't fire.
  let relicState = startAutoBattle("tommy", ["the-fool", "the-magician"], "rotwood-husk", ["bark-ward"])
  relicState = { ...relicState, playerUnits: relicState.playerUnits.map((u) => ({ ...u, moveIndex: 0, intent: { type: "block", amount: 1 } })) }
  const afterRelicRound = resolveRound(relicState)
  out.relicBlockLog = afterRelicRound.log.filter((l) => l.includes("gain 3 Block")).length

  // 3. Stonebound Charm (item) only grants the repeating Block to its
  // specific wearer, not the whole squad.
  const itemBattle = startAutoBattle(
    "tommy",
    [
      { defId: "the-fool", upgradeLevel: 0, itemIds: ["stonebound-charm"] },
      { defId: "the-magician", upgradeLevel: 0, itemIds: [] },
    ],
    "rotwood-husk",
  )
  let itemState = { ...itemBattle, playerUnits: itemBattle.playerUnits.map((u) => ({ ...u, moveIndex: 0, intent: { type: "attack", amount: 1 } })) }
  const afterItemRound = resolveRound(itemState)
  out.itemBlock = { wearer: afterItemRound.playerUnits[0].block, other: afterItemRound.playerUnits[1].block }

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("console/page errors:", errors)
await browser.close()

const aoeOk = result.aoeHitAll
const relicOk = result.relicBlockLog === 2 // one "gain 3 Block" line per deployed unit
const itemOk = result.itemBlock.wearer >= 3 && result.itemBlock.other === 0

if (errors.length) {
  console.log("FAIL: console/page errors present")
  process.exit(1)
}
if (aoeOk && relicOk && itemOk) {
  console.log("PASS: Emberwrack's AoE hits the whole squad including a taunting unit; Bark Ward grants repeating Block squad-wide; Stonebound Charm only grants it to its wearer")
  process.exit(0)
} else {
  console.log("FAIL", { aoeOk, relicOk, itemOk, result })
  process.exit(1)
}
