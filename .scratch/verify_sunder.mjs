import { chromium } from "playwright"

const PORT = process.env.PORT || 5212

const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForTimeout(500)

const result = await page.evaluate(async () => {
  const { applyEffects } = await import("/src/services/heartwood/effects.js")
  const out = {}

  function baseUnit(powers) {
    return { id: "p0", defId: "the-fool", name: "The Fool", hp: 32, maxHp: 32, block: 0, powers, triggers: [], pos: { row: 2, col: 0 }, moveIndex: 0, intent: null }
  }
  function baseState(powers) {
    return {
      round: 1, phase: "player", grid: { rows: 3, cols: 3 },
      playerUnits: [baseUnit(powers)],
      enemies: [{ id: "e0", defId: "witherfang", name: "Witherfang", hp: 42, maxHp: 42, block: 0, powers: {}, triggers: [], pos: { row: 0, col: 0 }, moveIndex: 0, intent: null }],
      stats: {}, log: [],
    }
  }

  // 1. Priority order: Ward should be stripped before Strength, even
  // though Strength appears "first" in a naive object-key sense.
  // target: "target" is required here - the raw effect vocabulary
  // defaults an omitted target to ctx.actorId (self), and without it
  // this would silently check Witherfang's own (always empty) powers
  // instead of the player's - the real intentToEffects conversion
  // always adds this automatically, but a hand-built effect has to
  // say so explicitly.
  const priorityState = applyEffects(baseState({ strength: 3, ward: 2 }), [{ type: "sunder", target: "target" }], { actorId: "e0", targetId: "p0" })
  out.priority = { ward: priorityState.playerUnits[0].powers.ward, strength: priorityState.playerUnits[0].powers.strength }

  // 2. Only Strength present - that gets stripped.
  const onlyStrengthState = applyEffects(baseState({ strength: 3 }), [{ type: "sunder", target: "target" }], { actorId: "e0", targetId: "p0" })
  out.onlyStrength = { strength: onlyStrengthState.playerUnits[0].powers.strength }

  // 3. Nothing sunderable present - no-op, no crash, distinct log line.
  const nothingState = applyEffects(baseState({}), [{ type: "sunder", target: "target" }], { actorId: "e0", targetId: "p0" })
  out.nothing = { log: nothingState.log, phase: nothingState.phase }

  // 4. Real fight vs Witherfang: force its 2nd move (sunder) against a
  // Ward-carrying unit via a real startAutoBattle + resolveRound path.
  const { startAutoBattle, resolveRound } = await import("/src/services/heartwood/autoBattleEngine.js")
  let fightState = startAutoBattle("tommy", ["thornguard"], "witherfang")
  fightState = { ...fightState, enemies: fightState.enemies.map((e) => ({ ...e, moveIndex: 1, intent: { type: "sunder", target: "player" } })) }
  const afterFight = resolveRound(fightState)
  out.realFight = { wardBefore: 2, wardAfter: afterFight.playerUnits[0].powers.ward, log: afterFight.log.filter((l) => l.includes("Sunder") || l.includes("loses")) }

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("console/page errors:", errors)
await browser.close()

const priorityOk = result.priority.ward === 1 && result.priority.strength === 3
const onlyStrengthOk = result.onlyStrength.strength === 2
const nothingOk = result.nothing.phase === "player" && result.nothing.log.some((l) => l.includes("nothing to sunder"))
const realFightOk = result.realFight.wardAfter === 1

if (errors.length) {
  console.log("FAIL: console/page errors present")
  process.exit(1)
}
if (priorityOk && onlyStrengthOk && nothingOk && realFightOk) {
  console.log("PASS: Sunder strips in priority order (Ward before Strength), no-ops safely with nothing to strip, and works through a real fight")
  process.exit(0)
} else {
  console.log("FAIL", { priorityOk, onlyStrengthOk, nothingOk, realFightOk, result })
  process.exit(1)
}
