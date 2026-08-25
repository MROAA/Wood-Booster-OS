import { chromium } from "playwright"

const PORT = process.env.PORT || 5219

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

  // 1. Ironbark grants itself Taunt at battle start.
  const ibState = startAutoBattle("tommy", ["ironbark"], "rotwood-husk")
  out.ironbark = ibState.playerUnits[0].powers.taunt || 0

  // 2. Briarblade's Chain fires on a kill, hitting a different enemy.
  let bbState = startAutoBattle("tommy", ["briarblade"], "rune-warden")
  bbState = { ...bbState, enemies: [
    { ...bbState.enemies[0], hp: 5, maxHp: 40, pos: { row: 0, col: 1 } },
    { ...bbState.enemies[0], id: "e1", hp: 40, maxHp: 40, pos: { row: 1, col: 1 } },
  ]}
  const afterBb = resolveRound(bbState)
  out.briarblade = { frontDead: afterBb.enemies[0].hp <= 0, secondDamaged: afterBb.enemies[1].hp < 40 }

  // 3. Sapkeeper's rallyHeal is a REPEATING per-round aura, not a
  // battle-start no-op - damage an adjacent ally first, then confirm
  // it heals back over a couple of rounds.
  const skState = startAutoBattle("tommy", ["sapkeeper", "the-fool", "the-fool", "the-fool"], "rotwood-husk")
  const damaged = { ...skState, playerUnits: skState.playerUnits.map((u, i) => (i === 1 ? { ...u, hp: u.maxHp - 10 } : u)) }
  const hpBefore = damaged.playerUnits[1].hp
  let s = damaged
  const hpHistory = [hpBefore]
  for (let i = 0; i < 2; i++) {
    s = resolveRound(s)
    hpHistory.push(s.playerUnits[1].hp)
  }
  out.sapkeeper = { hpHistory, healLines: s.log.filter((l) => l.startsWith("Mosskit heal")).length }

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("console/page errors:", errors)
await browser.close()

const ironbarkOk = result.ironbark === 1
const briarbladeOk = result.briarblade.frontDead && result.briarblade.secondDamaged
const sapkeeperOk = result.sapkeeper.hpHistory[2] > result.sapkeeper.hpHistory[0] && result.sapkeeper.healLines >= 2

if (errors.length) {
  console.log("FAIL: console/page errors present")
  process.exit(1)
}
if (ironbarkOk && briarbladeOk && sapkeeperOk) {
  console.log("PASS: Ironbark grants itself Taunt; Briarblade's Chain hits a second enemy on a kill; Sapkeeper's rallyHeal actually heals the adjacent ally over multiple rounds")
  process.exit(0)
} else {
  console.log("FAIL", { ironbarkOk, briarbladeOk, sapkeeperOk, result })
  process.exit(1)
}
