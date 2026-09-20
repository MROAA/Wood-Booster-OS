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
    rootward: !!ENEMIES.rootward,
    briarmaw: !!ENEMIES.briarmaw,
    recklessVow: !!ITEMS["reckless-vow"],
    recklessOath: !!RELICS["reckless-oath"],
  }

  // Rootward's own move data: attack, then cleanse.
  out.rootwardCleanseMove = ENEMIES.rootward.movePattern[1]

  // Rootward's cleanse actually strips its own poison stack.
  let battle = startAutoBattle("tommy", [], "rootward")
  battle = { ...battle, enemies: battle.enemies.map((e) => ({ ...e, powers: { ...e.powers, poison: 3 } })) }
  battle = resolveRound(battle)
  out.rootwardPoisonAfterCleanse = battle.enemies[0]?.powers.poison

  // Briarmaw fights and deals damage.
  battle = startAutoBattle("tommy", [{ defId: "mosshollow" }], "briarmaw")
  const hpBefore = battle.enemies[0].hp
  for (let i = 0; i < 6 && battle.phase === "player"; i++) battle = resolveRound(battle)
  out.briarmawFight = { finalPhase: battle.phase, enemyHpDropped: battle.enemies[0].hp < hpBefore }

  // Reckless Vow grants Execute+Ward on top of Tommy's own baseline
  // (Strength+2 only - no Execute/Ward baseline, so these read raw).
  battle = startAutoBattle("tommy", [{ defId: "duskbramble", itemIds: ["reckless-vow"] }], "rotwood-husk")
  const carrier = battle.playerUnits.find((u) => u.defId === "duskbramble")
  out.vowGrant = { execute: carrier?.powers.execute, ward: carrier?.powers.ward }

  // Reckless Oath stacks squad-wide on top of the item.
  battle = startAutoBattle(
    "tommy",
    [{ defId: "duskbramble", itemIds: ["reckless-vow"] }],
    "rotwood-husk",
    ["reckless-oath"]
  )
  const stacked = battle.playerUnits.find((u) => u.defId === "duskbramble")
  out.stackedGrant = { execute: stacked?.powers.execute, ward: stacked?.powers.ward }

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("errors:", errors)
await browser.close()

const checks = []
checks.push(["all 4 registered", Object.values(result.registered).every(Boolean)])
checks.push(["Rootward's 2nd move is cleanse", result.rootwardCleanseMove?.type === "cleanse"])
checks.push(["Rootward's cleanse strips its own Poison stack", result.rootwardPoisonAfterCleanse === 2])
checks.push(["Briarmaw fight resolves and deals damage", result.briarmawFight.enemyHpDropped])
checks.push(["Reckless Vow grants Execute+3 and Ward+1", result.vowGrant.execute === 3 && result.vowGrant.ward === 1])
checks.push(["Reckless Oath stacks on top of the item (5 execute, 2 ward)", result.stackedGrant.execute === 5 && result.stackedGrant.ward === 2])
checks.push(["no console/page errors", errors.length === 0])

let allPass = true
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`)
  if (!ok) allPass = false
}
process.exit(allPass ? 0 : 1)
