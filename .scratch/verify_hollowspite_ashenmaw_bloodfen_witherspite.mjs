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
    hollowspite: !!ENEMIES.hollowspite,
    ashenmaw: !!ENEMIES.ashenmaw,
    bloodfenRing: !!ITEMS["bloodfen-ring"],
    witherspiteCrown: !!RELICS["witherspite-crown"],
  }

  // Hollowspite's move sequence: attack, then poison, then weak -
  // checked via the movePattern data directly rather than a full
  // simulated fight, since a 40 HP mook dies to the always-present
  // Commander (Haste) plus a recruit well before reaching move index 2
  // (the same trap this session's own Quillfang test hit earlier).
  out.hollowspiteDebuffs = {
    poisonMove: ENEMIES.hollowspite.movePattern[1],
    weakMove: ENEMIES.hollowspite.movePattern[2],
  }

  // Ashenmaw fights and deals damage.
  battle = startAutoBattle("tommy", [{ defId: "mosshollow" }], "ashenmaw")
  const hpBefore = battle.enemies[0].hp
  for (let i = 0; i < 6 && battle.phase === "player"; i++) battle = resolveRound(battle)
  out.ashenmawFight = { finalPhase: battle.phase, enemyHpDropped: battle.enemies[0].hp < hpBefore }

  // Bloodfen Ring grants Wounded Fury.
  battle = startAutoBattle("tommy", [{ defId: "duskbramble", itemIds: ["bloodfen-ring"] }], "rotwood-husk")
  const carrier = battle.playerUnits.find((u) => u.defId === "duskbramble")
  out.bloodfenGrant = carrier?.powers.woundedFury

  // Witherspite Crown grants both Poison and Weak on hit, squad-wide.
  battle = startAutoBattle("tommy", [{ defId: "duskbramble" }], "rotwood-husk", ["witherspite-crown"])
  battle = resolveRound(battle)
  out.witherspiteDebuffs = { poison: battle.enemies[0]?.powers.poison, weak: battle.enemies[0]?.powers.weak }

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("errors:", errors)
await browser.close()

const checks = []
checks.push(["all 4 registered", Object.values(result.registered).every(Boolean)])
checks.push(["Hollowspite's 2nd and 3rd moves apply Poison and Weak", result.hollowspiteDebuffs.poisonMove?.id === "poison" && result.hollowspiteDebuffs.weakMove?.id === "weak"])
checks.push(["Ashenmaw fight resolves and deals damage", result.ashenmawFight.enemyHpDropped])
checks.push(["Bloodfen Ring grants Wounded Fury", result.bloodfenGrant === 1])
checks.push(["Witherspite Crown grants Poison and Weak squad-wide on hit", result.witherspiteDebuffs.poison > 0 && result.witherspiteDebuffs.weak > 0])
checks.push(["no console/page errors", errors.length === 0])

let allPass = true
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`)
  if (!ok) allPass = false
}
process.exit(allPass ? 0 : 1)
