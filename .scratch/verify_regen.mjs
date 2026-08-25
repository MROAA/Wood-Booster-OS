import { chromium } from "playwright"

const PORT = process.env.PORT || 5301

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

  // 1. Fernwake's Rally grants adjacent allies Regen at battle start
  //    (not itself - rallyAdjacent targets neighbors only).
  let battle = startAutoBattle(
    "tommy",
    [{ defId: "fernwake", upgradeLevel: 0 }, { defId: "duskbramble", upgradeLevel: 0 }],
    "rotwood-husk"
  )
  const fernwake = battle.playerUnits.find((u) => u.defId === "fernwake")
  const neighbor = battle.playerUnits.find((u) => u.defId === "duskbramble")
  out.rally = { fernwakeRegen: fernwake?.powers.regen, neighborRegen: neighbor?.powers.regen }

  // 2. Regen actually heals a damaged unit and decays by 1 - tested
  //    directly against tickRegen (not a full resolveRound) since a
  //    unit's own movePattern can ALSO include a self-heal move
  //    (Fernwake's own first move is `heal amount:3`), which would
  //    otherwise be conflated with the regen tick itself.
  const { tickRegen } = await import("/src/services/heartwood/effects.js")
  const fakeUnit = { id: "p0", hp: 5, maxHp: 40, powers: { regen: 3 } }
  const fakeState = { phase: "player", playerUnits: [fakeUnit], log: [] }
  const afterTick = tickRegen(fakeState, fakeState.playerUnits)
  const tickedUnit = afterTick.playerUnits.find((u) => u.id === "p0")
  out.tick = { hpBefore: 5, regenBefore: 3, hpAfterTick: tickedUnit.hp, regenAfterTick: tickedUnit.powers.regen }

  // 3. Heartsbloom Seed relic grants regen squad-wide at battle start.
  battle = startAutoBattle("tommy", [{ defId: "duskbramble", upgradeLevel: 0 }], "rotwood-husk", ["heartsbloom-seed"])
  const relicUnit = battle.playerUnits.find((u) => u.defId === "duskbramble")
  out.relic = { regen: relicUnit?.powers.regen }

  // 4. Mendleaf Charm item grants regen only to the equipped unit.
  battle = startAutoBattle(
    "tommy",
    [
      { defId: "duskbramble", upgradeLevel: 0, itemIds: ["mendleaf-charm"] },
      { defId: "hollowmere", upgradeLevel: 0, itemIds: [] },
    ],
    "rotwood-husk"
  )
  const itemUnit = battle.playerUnits.find((u) => u.defId === "duskbramble")
  const otherUnit = battle.playerUnits.find((u) => u.defId === "hollowmere")
  out.item = { itemUnitRegen: itemUnit?.powers.regen, otherUnitRegen: otherUnit?.powers.regen || 0 }

  // 5. Duskmoth (enemy) carries its own Regen passive at battle start.
  battle = startAutoBattle("tommy", [], "duskmoth")
  const duskmoth = battle.enemies.find((e) => e.defId === "duskmoth")
  out.enemy = { regen: duskmoth?.powers.regen, hp: duskmoth?.hp, maxHp: duskmoth?.maxHp }

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("errors:", errors)
await browser.close()

const checks = []
checks.push(["Rally grants regen to neighbor, not self", result.rally.neighborRegen === 2 && !result.rally.fernwakeRegen])
checks.push(["Regen heals by current stacks then decays by 1", result.tick.hpAfterTick === result.tick.hpBefore + result.tick.regenBefore && result.tick.regenAfterTick === result.tick.regenBefore - 1])
checks.push(["Heartsbloom Seed grants regen squad-wide", result.relic.regen === 3])
checks.push(["Mendleaf Charm grants regen only to the equipped unit", result.item.itemUnitRegen === 3 && result.item.otherUnitRegen === 0])
checks.push(["Duskmoth enemy carries its own Regen passive", result.enemy.regen === 4])
checks.push(["no console/page errors", errors.length === 0])

let allPass = true
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`)
  if (!ok) allPass = false
}
process.exit(allPass ? 0 : 1)
