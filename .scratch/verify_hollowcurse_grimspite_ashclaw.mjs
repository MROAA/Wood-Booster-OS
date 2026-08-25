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
    hollowcurse: !!ENEMIES.hollowcurse,
    grimspite: !!ENEMIES.grimspite,
    ashclawFang: !!ITEMS["ashclaw-fang"],
    ashclawStandard: !!RELICS["ashclaw-standard"],
  }

  // Hollowcurse's move data: attack, sunder, then poison debuff.
  out.hollowcurseMoves = {
    sunder: ENEMIES.hollowcurse.movePattern[1],
    poison: ENEMIES.hollowcurse.movePattern[2],
  }

  // Grimspite fights and deals damage.
  let battle = startAutoBattle("tommy", [{ defId: "mosshollow" }], "grimspite")
  const hpBefore = battle.enemies[0].hp
  for (let i = 0; i < 6 && battle.phase === "player"; i++) battle = resolveRound(battle)
  out.grimspiteFight = { finalPhase: battle.phase, enemyHpDropped: battle.enemies[0].hp < hpBefore }

  // Ashclaw Fang: grants Strength and its onDealDamage sunder strips a stack.
  battle = startAutoBattle("tommy", [{ defId: "duskbramble", itemIds: ["ashclaw-fang"] }], "ironmaw")
  const before = battle.enemies.find((e) => e.defId === "ironmaw").powers.strength
  battle = resolveRound(battle)
  const after = battle.enemies.find((e) => e.defId === "ironmaw")?.powers.strength
  out.ashclawFangProc = { before, after }

  // Ashclaw Standard: squad-wide, even a unit with no dedicated item strips a stack too.
  battle = startAutoBattle("tommy", [{ defId: "duskbramble" }], "ironmaw", ["ashclaw-standard"])
  const before2 = battle.enemies.find((e) => e.defId === "ironmaw").powers.strength
  battle = resolveRound(battle)
  const after2 = battle.enemies.find((e) => e.defId === "ironmaw")?.powers.strength
  out.ashclawStandardProc = { before: before2, after: after2 }

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("errors:", errors)
await browser.close()

const checks = []
checks.push(["all 4 registered", Object.values(result.registered).every(Boolean)])
checks.push(["Hollowcurse's 2nd/3rd moves are sunder then poison", result.hollowcurseMoves.sunder?.type === "sunder" && result.hollowcurseMoves.poison?.id === "poison"])
checks.push(["Grimspite fight resolves and deals damage", result.grimspiteFight.enemyHpDropped])
checks.push(["Ashclaw Fang's onDealDamage sunder strips a Strength stack", result.ashclawFangProc.before === 3 && result.ashclawFangProc.after < 3])
checks.push(["Ashclaw Standard squad-wide sunder also strips a stack", result.ashclawStandardProc.before === 3 && result.ashclawStandardProc.after < 3])
checks.push(["no console/page errors", errors.length === 0])

let allPass = true
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`)
  if (!ok) allPass = false
}
process.exit(allPass ? 0 : 1)
