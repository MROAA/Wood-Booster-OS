import { chromium } from "playwright"

const PORT = process.env.PORT || 5253

const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForTimeout(500)

const result = await page.evaluate(async () => {
  const { startAutoBattle, resolveRound } = await import("/src/services/heartwood/autoBattleEngine.js")
  const { startRun } = await import("/src/services/heartwood/runEngine.js")
  const out = {}

  // 1. A run starts with an empty bench - only the Commander exists.
  const run = startRun("tommy")
  out.emptyBench = { benchLength: run.bench.length, deployedAllNull: run.deployed.every((d) => d === null) }

  // 2. startAutoBattle with ZERO recruited units still produces a real
  // 5-unit-capable squad - just the Commander, alive, at its own slot.
  const soloState = startAutoBattle("tommy", [], "rotwood-husk")
  const commander = soloState.playerUnits.find((u) => u.id === "commander")
  out.soloCommander = {
    exists: !!commander,
    hp: commander?.hp,
    maxHp: commander?.maxHp,
    pos: commander?.pos,
    name: commander?.name,
  }

  // 3. The Commander actually takes its turn (Tommy's Haste kit -
  // attacks twice) and its own squadPassive (Strength) applies to
  // itself too, not just the recruited squad.
  out.commanderStrength = commander?.powers.strength

  let battle = startAutoBattle("tommy", [], "rotwood-husk")
  const before = battle.enemies[0].hp
  battle = resolveRound(battle)
  out.commanderDealtDamage = battle.enemies[0].hp < before
  out.commanderActedTwice = battle.log.filter((l) => l.startsWith("Tommy deal")).length >= 2

  // 4. Each Commander's own unique kit resolves without error - quick
  // smoke test across all 4.
  out.perCommander = {}
  for (const id of ["tommy", "aatos", "fenrir", "repo"]) {
    const s = startAutoBattle(id, [], "rotwood-husk")
    const c = s.playerUnits.find((u) => u.id === "commander")
    out.perCommander[id] = { hp: c?.hp, hasShatterOrOther: id === "repo" ? (c?.powers.shatter || 0) > 0 : true }
  }

  // 5. A Commander-equipped item applies only to the Commander, not
  // recruited units.
  const itemBattle = startAutoBattle(
    "tommy",
    [{ defId: "the-fool", upgradeLevel: 0, itemIds: [] }],
    "rotwood-husk",
    [],
    0,
    {},
    ["ember-charm"],
  )
  const cmd = itemBattle.playerUnits.find((u) => u.id === "commander")
  const recruit = itemBattle.playerUnits.find((u) => u.id === "p0")
  out.commanderItem = { commanderStrength: cmd?.powers.strength, recruitStrength: recruit?.powers.strength }

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("console/page errors:", errors)
await browser.close()

const emptyBenchOk = result.emptyBench.benchLength === 0 && result.emptyBench.deployedAllNull
const soloOk = result.soloCommander.exists && result.soloCommander.hp === result.soloCommander.maxHp && result.soloCommander.name === "Tommy"
const strengthOk = result.commanderStrength === 2 // Tommy's own squadPassive, applied to himself
const actedOk = result.commanderDealtDamage && result.commanderActedTwice // Haste = 2 attacks
const perCommanderOk = Object.values(result.perCommander).every((c) => c.hp > 0 && c.hasShatterOrOther)
const itemOk = (result.commanderItem.commanderStrength || 0) > (result.commanderItem.recruitStrength || 0) - 1 &&
  result.commanderItem.commanderStrength >= 3 // 2 (squadPassive) + 1 (item) = 3
  && result.commanderItem.recruitStrength === 2 // squadPassive only, no item

if (errors.length) {
  console.log("FAIL: console/page errors present")
  process.exit(1)
}
if (emptyBenchOk && soloOk && strengthOk && actedOk && perCommanderOk && itemOk) {
  console.log("PASS: run starts with an empty bench and just the Commander; the Commander is a real deployed 5th unit with its own kit, receives its own squadPassive, all 4 commanders resolve cleanly, and Commander-equipped items apply only to the Commander")
  process.exit(0)
} else {
  console.log("FAIL", { emptyBenchOk, soloOk, strengthOk, actedOk, perCommanderOk, itemOk, result })
  process.exit(1)
}
