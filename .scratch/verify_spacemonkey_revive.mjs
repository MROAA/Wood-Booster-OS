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
  const { startAutoBattle } = await import("/src/services/heartwood/autoBattleEngine.js")
  const { applyEffects } = await import("/src/services/heartwood/effects.js")
  const out = {}

  let battle = startAutoBattle("tommy", [{ defId: "duskbramble" }], "spacemonkey")
  const sm = battle.enemies.find((e) => e.defId === "spacemonkey")
  out.passive = { revive: sm?.powers.revive, woundedFury: sm?.powers.woundedFury, maxHp: sm?.maxHp }

  // A lethal hit clings him to 1 HP instead of dying outright.
  battle = applyEffects(battle, [{ type: "damage", amount: 1000 }], { actorId: "p0", targetId: "e0" })
  const afterKill = battle.enemies.find((e) => e.defId === "spacemonkey")
  out.afterFirstKill = { hp: afterKill?.hp, revive: afterKill?.powers.revive }

  // A SECOND lethal hit actually kills him - Revive is one-shot.
  battle = applyEffects(battle, [{ type: "damage", amount: 1000 }], { actorId: "p0", targetId: "e0" })
  const afterSecondKill = battle.enemies.find((e) => e.defId === "spacemonkey")
  out.afterSecondKill = { hp: afterSecondKill?.hp }

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("errors:", errors)
await browser.close()

const checks = []
checks.push(["Spacemonkey carries Revive(1) + WoundedFury(1) and 108 HP", result.passive.revive === 1 && result.passive.woundedFury === 1 && result.passive.maxHp === 108])
checks.push(["a lethal hit clings him to 1 HP and consumes the revive stack", result.afterFirstKill.hp === 1 && result.afterFirstKill.revive === 0])
checks.push(["a second lethal hit actually kills him (revive is one-shot)", result.afterSecondKill.hp === 0])
checks.push(["no console/page errors", errors.length === 0])

let allPass = true
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`)
  if (!ok) allPass = false
}
process.exit(allPass ? 0 : 1)
