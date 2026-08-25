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
  const { startAutoBattle } = await import("/src/services/heartwood/autoBattleEngine.js")
  const { FORMATIONS, resolveFormation } = await import("/src/data/heartwood/formations.js")
  const { ITEMS } = await import("/src/data/heartwood/items.js")
  const { RELICS } = await import("/src/data/heartwood/relics.js")
  const out = {}

  out.registered = {
    formation: !!FORMATIONS["the-withering-pact"],
    bulwarksMercy: !!ITEMS["bulwarks-mercy"],
    sanctuaryVow: !!RELICS["sanctuary-vow"],
  }

  const formation = resolveFormation("the-withering-pact")
  out.pieces = formation.pieces.map((p) => p.defId)

  let battle = startAutoBattle("tommy", [{ defId: "mosshollow" }], "the-withering-pact")
  out.enemiesSpawned = battle.enemies.map((e) => e.defId)

  // Bulwark's Mercy grants Ward+1 and Regen+3.
  battle = startAutoBattle("tommy", [{ defId: "duskbramble", itemIds: ["bulwarks-mercy"] }], "rotwood-husk")
  const carrier = battle.playerUnits.find((u) => u.defId === "duskbramble")
  out.mercyGrant = { ward: carrier?.powers.ward, regen: carrier?.powers.regen }

  // Sanctuary Vow stacks squad-wide on top of the item.
  battle = startAutoBattle(
    "tommy",
    [{ defId: "duskbramble", itemIds: ["bulwarks-mercy"] }],
    "rotwood-husk",
    ["sanctuary-vow"]
  )
  const stacked = battle.playerUnits.find((u) => u.defId === "duskbramble")
  out.stackedGrant = { ward: stacked?.powers.ward, regen: stacked?.powers.regen }

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("errors:", errors)
await browser.close()

const checks = []
checks.push(["all 3 registered", Object.values(result.registered).every(Boolean)])
checks.push(["formation pairs Hollowspite and Duskwither", result.pieces.includes("hollowspite") && result.pieces.includes("duskwither")])
checks.push(["both enemies spawn in battle", result.enemiesSpawned.includes("hollowspite") && result.enemiesSpawned.includes("duskwither")])
checks.push(["Bulwark's Mercy grants Ward+1 and Regen+3", result.mercyGrant.ward === 1 && result.mercyGrant.regen === 3])
checks.push(["Sanctuary Vow stacks on top (2 ward, 5 regen)", result.stackedGrant.ward === 2 && result.stackedGrant.regen === 5])
checks.push(["no console/page errors", errors.length === 0])

let allPass = true
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`)
  if (!ok) allPass = false
}
process.exit(allPass ? 0 : 1)
