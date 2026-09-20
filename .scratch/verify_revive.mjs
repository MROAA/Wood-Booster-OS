import { chromium } from "playwright"

const PORT = process.env.PORT || 5207

const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForTimeout(500)

const result = await page.evaluate(async () => {
  const { applyEffects, checkBattleEnd } = await import("/src/services/heartwood/effects.js")
  const out = {}

  // Minimal synthetic state: one Wraithbriar-like unit with 1 revive
  // stack at low HP, one enemy attacker. First lethal hit should leave
  // it at 1 HP and consume the stack (not die, not stay above 1); the
  // SECOND lethal hit (no stacks left) should actually kill it.
  const baseState = () => ({
    round: 1,
    phase: "player",
    grid: { rows: 3, cols: 3 },
    playerUnits: [
      { id: "p0", defId: "wraithbriar", name: "Wraithbriar", hp: 10, maxHp: 54, block: 0, powers: { revive: 1 }, triggers: [], pos: { row: 2, col: 0 }, moveIndex: 0, intent: null },
    ],
    enemies: [
      { id: "e0", defId: "rotwood-husk", name: "Husk", hp: 40, maxHp: 40, block: 0, powers: {}, triggers: [], pos: { row: 0, col: 0 }, moveIndex: 0, intent: null },
    ],
    stats: {},
    log: [],
  })

  let state = baseState()
  // First lethal-sized hit (20 dmg vs 10 hp): should revive to 1 HP,
  // consume the stack, and NOT end the battle.
  state = applyEffects(state, [{ type: "damage", amount: 20 }], { actorId: "e0", targetId: "p0" })
  out.afterFirstHit = { hp: state.playerUnits[0].hp, revive: state.playerUnits[0].powers.revive || 0, phase: state.phase, log: state.log.slice(-2) }

  // Second lethal hit: no stacks left, should actually die this time
  // and the battle should end in a loss (it's the only player unit).
  state = applyEffects(state, [{ type: "damage", amount: 20 }], { actorId: "e0", targetId: "p0" })
  out.afterSecondHit = { hp: state.playerUnits[0].hp, revive: state.playerUnits[0].powers.revive || 0, phase: state.phase }

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("console/page errors:", errors)
await browser.close()

const firstOk = result.afterFirstHit.hp === 1 && result.afterFirstHit.revive === 0 && result.afterFirstHit.phase === "player"
const secondOk = result.afterSecondHit.hp === 0 && result.afterSecondHit.phase === "lost"

if (errors.length) {
  console.log("FAIL: console/page errors present")
  process.exit(1)
}
if (firstOk && secondOk) {
  console.log("PASS: Revive triggers exactly once, clamps to 1 HP, battle continues; a second lethal hit actually kills")
  process.exit(0)
} else {
  console.log("FAIL", { firstOk, secondOk })
  process.exit(1)
}
