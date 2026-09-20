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
  const out = {}

  out.registered = {
    bramblespite: !!ENEMIES.bramblespite,
    thornfen: !!ENEMIES.thornfen,
    bramblehideStandard: !!ITEMS["bramblehide-standard"],
  }

  // Bramblespite carries both Taunt and Wounded Fury at battle start.
  let battle = startAutoBattle("tommy", [], "bramblespite")
  const bs = battle.enemies.find((e) => e.defId === "bramblespite")
  out.bramblespitePowers = { taunt: bs?.powers.taunt, woundedFury: bs?.powers.woundedFury }

  // Thornfen fights and deals damage.
  battle = startAutoBattle("tommy", [{ defId: "mosshollow" }], "thornfen")
  const hpBefore = battle.enemies[0].hp
  for (let i = 0; i < 6 && battle.phase === "player"; i++) battle = resolveRound(battle)
  out.thornfenFight = { finalPhase: battle.phase, enemyHpDropped: battle.enemies[0].hp < hpBefore }

  // Bramblehide Standard grants both Taunt and Wounded Fury.
  battle = startAutoBattle("tommy", [{ defId: "duskbramble", itemIds: ["bramblehide-standard"] }], "rotwood-husk")
  const carrier = battle.playerUnits.find((u) => u.defId === "duskbramble")
  out.itemGrant = { taunt: carrier?.powers.taunt, woundedFury: carrier?.powers.woundedFury }

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("errors:", errors)
await browser.close()

const checks = []
checks.push(["all 3 registered", Object.values(result.registered).every(Boolean)])
checks.push(["Bramblespite carries both Taunt and Wounded Fury", result.bramblespitePowers.taunt === 1 && result.bramblespitePowers.woundedFury === 1])
checks.push(["Thornfen fight resolves and deals damage", result.thornfenFight.enemyHpDropped])
checks.push(["Bramblehide Standard grants both Taunt and Wounded Fury", result.itemGrant.taunt === 1 && result.itemGrant.woundedFury === 1])
checks.push(["no console/page errors", errors.length === 0])

let allPass = true
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`)
  if (!ok) allPass = false
}
process.exit(allPass ? 0 : 1)
