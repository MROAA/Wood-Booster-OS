import { chromium } from "playwright"

const PORT = process.env.PORT || 5311

const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForTimeout(500)

const result = await page.evaluate(async () => {
  const { startAutoBattle, resolveRound } = await import("/src/services/heartwood/autoBattleEngine.js")
  const { ENEMIES } = await import("/src/data/heartwood/enemies.js")
  const { ITEMS } = await import("/src/data/heartwood/items.js")
  const { RELICS } = await import("/src/data/heartwood/relics.js")
  const out = {}

  out.registered = {
    duskwither: !!ENEMIES.duskwither,
    hollowfang: !!ENEMIES.hollowfang,
    quarrystrikeGauntlet: !!ITEMS["quarrystrike-gauntlet"],
    quarryVanguard: !!RELICS["quarry-vanguard"],
  }

  // Duskwither's move data: poison then vulnerable.
  out.duskwitherMoves = {
    poison: ENEMIES.duskwither.movePattern[1],
    vulnerable: ENEMIES.duskwither.movePattern[2],
  }

  // Hollowfang fights and deals damage.
  let battle = startAutoBattle("tommy", [{ defId: "mosshollow" }], "hollowfang")
  const hpBefore = battle.enemies[0].hp
  for (let i = 0; i < 6 && battle.phase === "player"; i++) battle = resolveRound(battle)
  out.hollowfangFight = { finalPhase: battle.phase, enemyHpDropped: battle.enemies[0].hp < hpBefore }

  // Quarrystrike Gauntlet grants both Strength and Shatter.
  battle = startAutoBattle("tommy", [{ defId: "duskbramble", itemIds: ["quarrystrike-gauntlet"] }], "rotwood-husk")
  const carrier = battle.playerUnits.find((u) => u.defId === "duskbramble")
  out.gauntletGrant = { strength: carrier?.powers.strength, shatter: carrier?.powers.shatter }

  // Quarry Vanguard grants both squad-wide, stacking with the item.
  battle = startAutoBattle(
    "tommy",
    [{ defId: "duskbramble", itemIds: ["quarrystrike-gauntlet"] }],
    "rotwood-husk",
    ["quarry-vanguard"]
  )
  const stacked = battle.playerUnits.find((u) => u.defId === "duskbramble")
  out.stackedGrant = { strength: stacked?.powers.strength, shatter: stacked?.powers.shatter }

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("errors:", errors)
await browser.close()

const checks = []
checks.push(["all 4 registered", Object.values(result.registered).every(Boolean)])
checks.push(["Duskwither's 2nd/3rd moves apply Poison then Vulnerable", result.duskwitherMoves.poison?.id === "poison" && result.duskwitherMoves.vulnerable?.id === "vulnerable"])
checks.push(["Hollowfang fight resolves and deals damage", result.hollowfangFight.enemyHpDropped])
// Tommy's own squadPassive already grants Strength+2 to every deployed
// unit (baseline present regardless of any item/relic) - accounted for
// explicitly here rather than assuming a bare item amount, the exact
// "Tommy baseline forgotten" mistake this session has hit before.
checks.push(["Quarrystrike Gauntlet adds Strength+1 and Shatter+2 on top of Tommy's own +2 Strength baseline", result.gauntletGrant.strength === 3 && result.gauntletGrant.shatter === 2])
checks.push(["Quarry Vanguard stacks on top of the item AND Tommy's baseline (2+1+1=4 strength, 2+1=3 shatter)", result.stackedGrant.strength === 4 && result.stackedGrant.shatter === 3])
checks.push(["no console/page errors", errors.length === 0])

let allPass = true
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`)
  if (!ok) allPass = false
}
process.exit(allPass ? 0 : 1)
