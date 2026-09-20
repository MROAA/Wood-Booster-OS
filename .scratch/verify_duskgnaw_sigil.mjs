import { chromium } from "playwright"

const PORT = process.env.PORT || 5247

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

  // 1. Duskgnaw applies Weak on its 2nd step and Vulnerable on its 4th,
  // stacking both onto the same target across its cycle.
  let state = startAutoBattle("tommy", ["the-fool"], "duskgnaw")
  state = { ...state, enemies: state.enemies.map((e) => ({ ...e, moveIndex: 1, intent: { type: "debuff", id: "weak", amount: 2, target: "player" } })) }
  let after = resolveRound(state)
  out.weakApplied = after.playerUnits[0].powers.weak || 0
  after = { ...after, enemies: after.enemies.map((e) => ({ ...e, moveIndex: 3, intent: { type: "debuff", id: "vulnerable", amount: 1, target: "player" } })) }
  const after2 = resolveRound(after)
  out.bothApplied = { weak: after2.playerUnits[0].powers.weak || 0, vulnerable: after2.playerUnits[0].powers.vulnerable || 0 }

  // 2. Warden's Sigil (item) grants Taunt only to its wearer.
  const itemBattle = startAutoBattle(
    "tommy",
    [
      { defId: "the-fool", upgradeLevel: 0, itemIds: ["wardens-sigil"] },
      { defId: "the-magician", upgradeLevel: 0, itemIds: [] },
    ],
    "rotwood-husk",
  )
  out.taunt = {
    wearer: (itemBattle.playerUnits[0].powers.taunt || 0) > 0,
    other: (itemBattle.playerUnits[1].powers.taunt || 0) > 0,
  }

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("console/page errors:", errors)
await browser.close()

const debuffOk = result.weakApplied === 2 && result.bothApplied.weak === 2 && result.bothApplied.vulnerable === 1
const sigilOk = result.taunt.wearer && !result.taunt.other

if (errors.length) {
  console.log("FAIL: console/page errors present")
  process.exit(1)
}
if (debuffOk && sigilOk) {
  console.log("PASS: Duskgnaw stacks both Weak and Vulnerable on the same target across its cycle; Warden's Sigil grants Taunt only to its wearer")
  process.exit(0)
} else {
  console.log("FAIL", { debuffOk, sigilOk, result })
  process.exit(1)
}
