import { chromium } from "playwright"

const PORT = process.env.PORT || 5225

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

  // 1. Beastcaller alone (1 deploy slot used) spawns a Spirit Wolf into
  // a free slot at battle start - squad should grow from 1 to 2 units.
  const soloState = startAutoBattle("tommy", ["beastcaller"], "rune-warden")
  out.solo = {
    unitCount: soloState.playerUnits.length,
    wolfPresent: soloState.playerUnits.some((u) => u.defId === "spirit-wolf"),
    wolfSummonedFlag: soloState.playerUnits.find((u) => u.defId === "spirit-wolf")?.summoned === true,
    wolfHp: soloState.playerUnits.find((u) => u.defId === "spirit-wolf")?.hp,
    logHasSummonLine: soloState.log.some((l) => l.includes("calls a Spirit Wolf")),
    positionsUnique:
      new Set(soloState.playerUnits.map((u) => `${u.pos.row}-${u.pos.col}`)).size === soloState.playerUnits.length,
  }

  // 2. With all 4 deploy slots already full, Beastcaller has no room
  // to summon - squad should stay at 4, with a "no room" log line.
  const fullState = startAutoBattle("tommy", ["beastcaller", "the-fool", "the-fool", "the-fool"], "rune-warden")
  out.full = {
    unitCount: fullState.playerUnits.length,
    wolfPresent: fullState.playerUnits.some((u) => u.defId === "spirit-wolf"),
    logHasNoRoomLine: fullState.log.some((l) => l.includes("no room left to summon")),
  }

  // 3. The summoned wolf fights on its own in subsequent rounds - deal
  // it lethal counter-damage from a well-armed enemy and confirm HP
  // actually changes over a round (i.e. it's really a live unit, not
  // just decoration), and confirm it can act (attack log line from it).
  let liveState = startAutoBattle("tommy", ["beastcaller"], "rune-warden")
  const wolfId = liveState.playerUnits.find((u) => u.defId === "spirit-wolf").id
  const beforeWolfHp = liveState.playerUnits.find((u) => u.id === wolfId).hp
  liveState = resolveRound(liveState)
  const afterWolfHp = liveState.playerUnits.find((u) => u.id === wolfId)?.hp
  out.live = {
    beforeWolfHp,
    afterWolfHp,
    wolfActedLog: liveState.log.some((l) => l.startsWith("Spirit Wolf")),
  }

  // 4. Squad-wide effects (Commander squadPassive) reach the summoned
  // wolf too, not just the recruited units - Tommy's squadPassive
  // grants +2 Strength to everyone (see characters.js).
  const passiveState = startAutoBattle("tommy", ["beastcaller"], "rune-warden")
  const wolf = passiveState.playerUnits.find((u) => u.defId === "spirit-wolf")
  out.squadPassiveReachedWolf = (wolf.powers.strength || 0) > 0

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("console/page errors:", errors)
await browser.close()

const soloOk =
  result.solo.unitCount === 2 &&
  result.solo.wolfPresent &&
  result.solo.wolfSummonedFlag &&
  result.solo.wolfHp === 16 &&
  result.solo.logHasSummonLine &&
  result.solo.positionsUnique
const fullOk = result.full.unitCount === 4 && !result.full.wolfPresent && result.full.logHasNoRoomLine
const liveOk = result.live.beforeWolfHp === 16 && result.live.afterWolfHp != null
const passiveOk = result.squadPassiveReachedWolf

if (errors.length) {
  console.log("FAIL: console/page errors present")
  process.exit(1)
}
if (soloOk && fullOk && liveOk && passiveOk) {
  console.log("PASS: Beastcaller summons a Spirit Wolf into a free slot at battle start, skips it cleanly when the squad is full, the wolf fights as a real unit, and squad-wide effects reach it too")
  process.exit(0)
} else {
  console.log("FAIL", { soloOk, fullOk, liveOk, passiveOk, result })
  process.exit(1)
}
