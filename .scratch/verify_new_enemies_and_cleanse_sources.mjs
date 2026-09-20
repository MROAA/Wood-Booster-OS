import { chromium } from "playwright"

const PORT = process.env.PORT || 5241

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

  // 1. Thornspite applies Vulnerable to the player unit it targets.
  let vState = startAutoBattle("tommy", ["the-fool"], "thornspite")
  vState = {
    ...vState,
    enemies: vState.enemies.map((e) => ({ ...e, moveIndex: 1, intent: { type: "debuff", id: "vulnerable", amount: 1, target: "player" } })),
  }
  const afterVuln = resolveRound(vState)
  out.vulnerableApplied = afterVuln.playerUnits[0].powers.vulnerable || 0

  // 2. Bramblehide heals itself on its heal step.
  let hState = startAutoBattle("tommy", ["the-fool"], "bramblehide")
  hState = {
    ...hState,
    enemies: hState.enemies.map((e) => ({ ...e, hp: e.maxHp - 10, moveIndex: 1, intent: { type: "heal", amount: 5 } })),
  }
  const beforeHp = hState.enemies[0].hp
  const afterHeal = resolveRound(hState)
  out.bramblehideHealed = { before: beforeHp, after: afterHeal.enemies[0].hp }

  // 3. Purifying Bloom (relic) cleanses every deployed unit each round,
  // squad-wide, not just Willowmend's own kit.
  let relicState = startAutoBattle("tommy", ["the-fool", "the-magician"], "rotwood-husk", ["purifying-bloom"])
  relicState = {
    ...relicState,
    playerUnits: relicState.playerUnits.map((u) => ({ ...u, powers: { ...u.powers, weak: 1 }, moveIndex: 0, intent: { type: "block", amount: 1 } })),
  }
  const afterRelicCleanse = resolveRound(relicState)
  out.relicCleansedBoth = afterRelicCleanse.playerUnits.every((u) => (u.powers.weak || 0) === 0)

  // 4. Cleansing Draught (item) only cleanses the specific unit wearing
  // it, not the whole squad.
  const itemBattle = startAutoBattle(
    "tommy",
    [
      { defId: "the-fool", upgradeLevel: 0, itemIds: ["cleansing-draught"] },
      { defId: "the-magician", upgradeLevel: 0, itemIds: [] },
    ],
    "rotwood-husk",
  )
  let itemState = {
    ...itemBattle,
    playerUnits: itemBattle.playerUnits.map((u) => ({ ...u, powers: { ...u.powers, weak: 1 }, moveIndex: 0, intent: { type: "block", amount: 1 } })),
  }
  const afterItemCleanse = resolveRound(itemState)
  out.itemCleanse = {
    wearerWeak: afterItemCleanse.playerUnits[0].powers.weak || 0,
    otherWeak: afterItemCleanse.playerUnits[1].powers.weak || 0,
  }

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("console/page errors:", errors)
await browser.close()

const vulnOk = result.vulnerableApplied === 1
const healOk = result.bramblehideHealed.after === result.bramblehideHealed.before + 5
const relicOk = result.relicCleansedBoth
const itemOk = result.itemCleanse.wearerWeak === 0 && result.itemCleanse.otherWeak === 1

if (errors.length) {
  console.log("FAIL: console/page errors present")
  process.exit(1)
}
if (vulnOk && healOk && relicOk && itemOk) {
  console.log("PASS: Thornspite applies Vulnerable, Bramblehide heals itself, Purifying Bloom cleanses the whole squad, Cleansing Draught only cleanses its wearer")
  process.exit(0)
} else {
  console.log("FAIL", { vulnOk, healOk, relicOk, itemOk, result })
  process.exit(1)
}
