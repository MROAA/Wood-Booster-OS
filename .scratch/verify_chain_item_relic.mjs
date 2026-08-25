import { chromium } from "playwright"

const PORT = process.env.PORT || 5310

const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForTimeout(500)

const result = await page.evaluate(async () => {
  const { startAutoBattle, resolveRound } = await import("/src/services/heartwood/autoBattleEngine.js")
  const { ITEMS } = await import("/src/data/heartwood/items.js")
  const { RELICS } = await import("/src/data/heartwood/relics.js")
  const out = {}

  out.registered = { item: !!ITEMS["cascading-claw"], relic: !!RELICS["cascading-wound"] }

  // 1. Item grants powers.chainDamage(4) at battle start.
  let battle = startAutoBattle(
    "tommy",
    [{ defId: "duskbramble", itemIds: ["cascading-claw"] }],
    "mist-growler-pack"
  )
  const carrier = battle.playerUnits.find((u) => u.defId === "duskbramble")
  out.itemGrant = carrier?.powers.chainDamage

  // 2. Live chain-on-kill, isolated via an A/B differential (Strength/
  //    Tommy's own attack/Weak-Vulnerable modifiers all apply equally
  //    to both runs, so only the ITEM's own +4 contribution should
  //    explain any difference in the survivor's final HP). Force one
  //    enemy to 1 HP (guaranteed kill by Rimefang's own first hit,
  //    since recruited units act before the Commander each round).
  async function runScenario(itemIds) {
    let b = startAutoBattle("tommy", [{ defId: "rimefang", itemIds }], "mist-growler-pack")
    b = { ...b, enemies: b.enemies.map((e, i) => (i === 0 ? { ...e, hp: 1 } : e)) }
    b = resolveRound(b)
    return { killedHp: b.enemies[0]?.hp, survivorHp: b.enemies[1]?.hp }
  }
  const withoutItem = await runScenario([])
  const withItem = await runScenario(["cascading-claw"])
  out.chainProc = {
    withoutItem,
    withItem,
    // Lower HP (more damage taken) with the item equipped confirms the
    // extra chain contribution actually landed.
    itemAddedExtraChainDamage: withItem.survivorHp < withoutItem.survivorHp,
    extraDamageFromItem: withoutItem.survivorHp - withItem.survivorHp,
  }

  // 4. Relic version grants chainDamage squad-wide.
  battle = startAutoBattle("tommy", [{ defId: "duskbramble" }], "mist-growler-pack", ["cascading-wound"])
  const relicUnit = battle.playerUnits.find((u) => u.defId === "duskbramble")
  out.relicGrant = relicUnit?.powers.chainDamage

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("errors:", errors)
await browser.close()

const checks = []
checks.push(["both registered", result.registered.item && result.registered.relic])
checks.push(["item grants chainDamage(4)", result.itemGrant === 4])
checks.push(["killing blow fires the chain (target actually died)", result.chainProc.withoutItem.killedHp <= 0 && result.chainProc.withItem.killedHp <= 0])
checks.push(["equipping the item adds exactly its own +4 to the chain hit (A/B isolated from Strength/other modifiers)", result.chainProc.itemAddedExtraChainDamage && result.chainProc.extraDamageFromItem === 4])
checks.push(["relic grants chainDamage(4) squad-wide", result.relicGrant === 4])
checks.push(["no console/page errors", errors.length === 0])

let allPass = true
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`)
  if (!ok) allPass = false
}
process.exit(allPass ? 0 : 1)
