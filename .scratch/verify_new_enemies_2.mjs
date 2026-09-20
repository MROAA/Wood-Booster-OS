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
  const { ENEMIES } = await import("/src/data/heartwood/enemies.js")
  const out = {}

  out.registered = { duskhollow: !!ENEMIES.duskhollow, needlefen: !!ENEMIES.needlefen, wraithgale: !!ENEMIES.wraithgale }

  // Duskhollow: Regen persists round to round (re-granted every turnStart,
  // not just a one-shot decaying passive like Duskmoth).
  let battle = startAutoBattle("tommy", [], "duskhollow")
  let dh = battle.enemies.find((e) => e.defId === "duskhollow")
  out.duskhollowRound0 = dh?.powers.regen
  battle = resolveRound(battle)
  dh = battle.enemies.find((e) => e.defId === "duskhollow")
  const afterRound1 = dh?.powers.regen
  battle = resolveRound(battle)
  dh = battle.enemies.find((e) => e.defId === "duskhollow")
  const afterRound2 = dh?.powers.regen
  out.duskhollowRegen = { afterRound1, afterRound2 }

  // Needlefen's 2nd move is the stun debuff.
  out.needlefenStunMove = ENEMIES.needlefen.movePattern[1]

  // Wraithgale spawns and fights without crashing.
  battle = startAutoBattle("tommy", [{ defId: "mosshollow" }], "wraithgale")
  const hpBefore = battle.enemies[0].hp
  for (let i = 0; i < 6 && battle.phase === "player"; i++) battle = resolveRound(battle)
  out.wraithgaleFight = { finalPhase: battle.phase, enemyHpDropped: battle.enemies[0].hp < hpBefore }

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("errors:", errors)
await browser.close()

const checks = []
checks.push(["all 3 enemies registered", result.registered.duskhollow && result.registered.needlefen && result.registered.wraithgale])
checks.push(["Duskhollow's Regen is re-granted every round it acts (persistent, not decaying to 0)", result.duskhollowRegen.afterRound1 > 0 && result.duskhollowRegen.afterRound2 > 0])
checks.push(["Needlefen's 2nd move applies stun to the player", result.needlefenStunMove?.type === "debuff" && result.needlefenStunMove?.id === "stun"])
checks.push(["fight vs Wraithgale resolves and deals damage", result.wraithgaleFight.enemyHpDropped])
checks.push(["no console/page errors", errors.length === 0])

let allPass = true
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`)
  if (!ok) allPass = false
}
process.exit(allPass ? 0 : 1)
