import { chromium } from "playwright"

const PORT = process.env.PORT || 5245

const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForTimeout(500)

const result = await page.evaluate(async () => {
  const { startAutoBattle, resolveRound } = await import("/src/services/heartwood/autoBattleEngine.js")
  const { resolveFormation } = await import("/src/data/heartwood/formations.js")
  const { isShielded } = await import("/src/services/heartwood/targeting.js")
  const out = {}

  // 1. Ember's Bulwark: Bramblehide is in front (row 0), shields
  // Emberwrack behind it (row 1, same column) from ordinary
  // single-target attacks.
  const formation = resolveFormation("embers-bulwark")
  out.formation = {
    name: formation.name,
    pieceCount: formation.pieces.length,
    defIds: formation.pieces.map((p) => p.defId).sort(),
  }
  const state = startAutoBattle("tommy", ["the-fool"], "embers-bulwark")
  const emberwrackId = state.enemies.find((e) => e.defId === "emberwrack").id
  out.emberwrackShielded = isShielded(state, emberwrackId)

  // 2. Rimefang's Chain fires a bonus hit on a killing blow.
  let chainState = startAutoBattle("tommy", ["rimefang"], "rune-warden")
  chainState = { ...chainState, enemies: [
    { ...chainState.enemies[0], hp: 5, maxHp: 40, pos: { row: 0, col: 1 } },
    { ...chainState.enemies[0], id: "e1", hp: 40, maxHp: 40, pos: { row: 1, col: 1 } },
  ]}
  const afterChain = resolveRound(chainState)
  out.rimefangChain = { frontDead: afterChain.enemies[0].hp <= 0, secondDamaged: afterChain.enemies[1].hp < 40 }

  // 3. Berserker's Oath (relic) grants WoundedFury to every deployed
  // unit at battle start.
  const relicBattle = startAutoBattle("tommy", ["the-fool", "the-magician"], "rotwood-husk", ["berserkers-oath"])
  out.relicWoundedFury = relicBattle.playerUnits.every((u) => (u.powers.woundedFury || 0) > 0)

  // 4. Feral Charm (item) only grants WoundedFury to its wearer.
  const itemBattle = startAutoBattle(
    "tommy",
    [
      { defId: "the-fool", upgradeLevel: 0, itemIds: ["feral-charm"] },
      { defId: "the-magician", upgradeLevel: 0, itemIds: [] },
    ],
    "rotwood-husk",
  )
  out.itemWoundedFury = {
    wearer: (itemBattle.playerUnits[0].powers.woundedFury || 0) > 0,
    other: (itemBattle.playerUnits[1].powers.woundedFury || 0) > 0,
  }

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("console/page errors:", errors)
await browser.close()

const formationOk =
  result.formation.name === "Ember's Bulwark" &&
  result.formation.pieceCount === 2 &&
  JSON.stringify(result.formation.defIds) === JSON.stringify(["bramblehide", "emberwrack"]) &&
  result.emberwrackShielded
const chainOk = result.rimefangChain.frontDead && result.rimefangChain.secondDamaged
const relicOk = result.relicWoundedFury
const itemOk = result.itemWoundedFury.wearer && !result.itemWoundedFury.other

if (errors.length) {
  console.log("FAIL: console/page errors present")
  process.exit(1)
}
if (formationOk && chainOk && relicOk && itemOk) {
  console.log("PASS: Ember's Bulwark shields Emberwrack behind Bramblehide, Rimefang's Chain fires on a kill, Berserker's Oath grants squad-wide Wounded Fury, Feral Charm grants it only to its wearer")
  process.exit(0)
} else {
  console.log("FAIL", { formationOk, chainOk, relicOk, itemOk, result })
  process.exit(1)
}
