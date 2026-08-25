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
  const { ITEMS } = await import("/src/data/heartwood/items.js")
  const { RELICS } = await import("/src/data/heartwood/relics.js")
  const out = {}

  out.registered = {
    cripplebiteFang: !!ITEMS["cripplebite-fang"],
    cripplebiteStandard: !!RELICS["cripplebite-standard"],
  }

  // Cripplebite Fang: single-target item. duskbramble carries it,
  // strikes ironmaw - the hit should land Weak AND Vulnerable on
  // ironmaw in the same round.
  let battle = startAutoBattle("tommy", [{ defId: "duskbramble", itemIds: ["cripplebite-fang"] }], "ironmaw")
  let target = battle.enemies.find((e) => e.defId === "ironmaw")
  out.fangBefore = { weak: target.powers.weak || 0, vulnerable: target.powers.vulnerable || 0 }
  battle = resolveRound(battle)
  target = battle.enemies.find((e) => e.defId === "ironmaw")
  out.fangAfter = { weak: target?.powers.weak || 0, vulnerable: target?.powers.vulnerable || 0 }

  // Cripplebite Standard: squad-wide relic. A unit with NO item
  // equipped should still land both debuffs via the relic alone.
  battle = startAutoBattle("tommy", [{ defId: "duskbramble" }], "ironmaw", ["cripplebite-standard"])
  target = battle.enemies.find((e) => e.defId === "ironmaw")
  out.standardBefore = { weak: target.powers.weak || 0, vulnerable: target.powers.vulnerable || 0 }
  battle = resolveRound(battle)
  target = battle.enemies.find((e) => e.defId === "ironmaw")
  out.standardAfter = { weak: target?.powers.weak || 0, vulnerable: target?.powers.vulnerable || 0 }

  // A/B differential: same fight, WITHOUT the relic, should show no
  // Weak/Vulnerable landing at all (isolates the relic's own effect
  // from anything duskbramble's base kit or ironmaw's own moves do).
  battle = startAutoBattle("tommy", [{ defId: "duskbramble" }], "ironmaw")
  battle = resolveRound(battle)
  target = battle.enemies.find((e) => e.defId === "ironmaw")
  out.controlAfter = { weak: target?.powers.weak || 0, vulnerable: target?.powers.vulnerable || 0 }

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("errors:", errors)
await browser.close()

const checks = []
checks.push(["both registered", Object.values(result.registered).every(Boolean)])
checks.push(["Fang starts with no Weak/Vulnerable on target", result.fangBefore.weak === 0 && result.fangBefore.vulnerable === 0])
checks.push(["Fang lands both Weak and Vulnerable on hit", result.fangAfter.weak > 0 && result.fangAfter.vulnerable > 0])
checks.push(["Standard starts with no Weak/Vulnerable on target", result.standardBefore.weak === 0 && result.standardBefore.vulnerable === 0])
checks.push(["Standard (squad-wide, no item) lands both on hit", result.standardAfter.weak > 0 && result.standardAfter.vulnerable > 0])
checks.push(["control (no item, no relic) lands neither", result.controlAfter.weak === 0 && result.controlAfter.vulnerable === 0])
checks.push(["no console/page errors", errors.length === 0])

let allPass = true
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`)
  if (!ok) allPass = false
}
process.exit(allPass ? 0 : 1)
