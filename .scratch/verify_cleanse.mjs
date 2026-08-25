import { chromium } from "playwright"

const PORT = process.env.PORT || 5239

const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForTimeout(500)

const result = await page.evaluate(async () => {
  const { startAutoBattle, resolveRound } = await import("/src/services/heartwood/autoBattleEngine.js")
  const out = {}

  // 1. Willowmend's cleanse step strips its own Poison stack (priority
  // order: stun > poison > weak > vulnerable - poison is what's set
  // here, so it should be the one removed).
  let state = startAutoBattle("tommy", ["willowmend"], "rotwood-husk")
  state = {
    ...state,
    playerUnits: state.playerUnits.map((u) => ({
      ...u,
      powers: { ...u.powers, poison: 2 },
      moveIndex: 0,
      intent: { type: "cleanse" },
    })),
  }
  const afterCleanse = resolveRound(state)
  out.poisonAfterCleanse = afterCleanse.playerUnits[0].powers.poison || 0

  // 2. With nothing to cleanse, it's a safe no-op (distinct log line,
  // no crash, no change to any other power).
  let clean = startAutoBattle("tommy", ["willowmend"], "rotwood-husk")
  clean = {
    ...clean,
    playerUnits: clean.playerUnits.map((u) => ({ ...u, moveIndex: 0, intent: { type: "cleanse" } })),
  }
  const afterNoop = resolveRound(clean)
  out.noopLogPresent = afterNoop.log.some((l) => l.includes("has nothing to cleanse"))

  // 3. Cleanse targets the ACTOR itself, never the enemy - give the
  // enemy Poison too and confirm only the player's own stack is
  // touched (a mis-wired target would strip the enemy's instead).
  let mixed = startAutoBattle("tommy", ["willowmend"], "rotwood-husk")
  mixed = {
    ...mixed,
    playerUnits: mixed.playerUnits.map((u) => ({ ...u, powers: { ...u.powers, weak: 1 }, moveIndex: 0, intent: { type: "cleanse" } })),
    enemies: mixed.enemies.map((e) => ({ ...e, powers: { ...e.powers, weak: 3 } })),
  }
  const afterMixed = resolveRound(mixed)
  out.selfTargeted = {
    playerWeak: afterMixed.playerUnits[0].powers.weak || 0,
    enemyWeakUntouched: afterMixed.enemies[0].powers.weak === 3,
  }

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("console/page errors:", errors)
await browser.close()

// Started at 2, but resolveRound's own tickPoison (effects.js) already
// runs BEFORE actSide/cleanse each round and both deals damage AND
// decrements the stack by 1 on its own (2 -> 1) - cleanse then strips
// one more (1 -> 0) in the same round. Expected 0, not 1.
const cleanseOk = result.poisonAfterCleanse === 0
const noopOk = result.noopLogPresent
const selfTargetOk = result.selfTargeted.playerWeak === 0 && result.selfTargeted.enemyWeakUntouched

if (errors.length) {
  console.log("FAIL: console/page errors present")
  process.exit(1)
}
if (cleanseOk && noopOk && selfTargetOk) {
  console.log("PASS: Cleanse strips one of the unit's own negative status stacks, no-ops safely with nothing to strip, and never touches the enemy")
  process.exit(0)
} else {
  console.log("FAIL", { cleanseOk, noopOk, selfTargetOk, result })
  process.exit(1)
}
