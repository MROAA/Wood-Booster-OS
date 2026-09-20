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
  const { startRun } = await import("/src/services/heartwood/runEngine.js")
  const { ENEMIES } = await import("/src/data/heartwood/enemies.js")
  const out = {}

  out.registered = !!ENEMIES.wyrmgall

  const run = startRun("tommy")
  const path = run.path
  const minibossNodes = path.map((n, i) => ({ ...n, i })).filter((n) => n.type === "miniboss")
  out.minibossNodes = minibossNodes.map((n) => ({ enemyId: n.enemyId, index: n.i, progress: n.i / (path.length - 1) }))
  const bossNodes = path.filter((n) => n.type === "boss")
  out.onlyOneRunEndingBoss = bossNodes.length === 1 && bossNodes[0].enemyId === "spacemonkey"

  let battle = startAutoBattle("tommy", [], "wyrmgall")
  const wg = battle.enemies.find((e) => e.defId === "wyrmgall")
  out.wyrmgallPowers = { execute: wg?.powers.execute, shatter: wg?.powers.shatter, maxHp: wg?.maxHp }

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("errors:", errors)
await browser.close()

const checks = []
checks.push(["Wyrmgall registered", result.registered])
checks.push(["exactly 3 miniboss nodes in RUN_PATH", result.minibossNodes.length === 3])
checks.push(["Wyrmgall sits deep in the run (past 80% progress)", result.minibossNodes.some((n) => n.enemyId === "wyrmgall" && n.progress >= 0.8)])
checks.push(["only Spacemonkey's node ends the run", result.onlyOneRunEndingBoss])
checks.push(["Wyrmgall carries self-Execute+Shatter and 80 HP", result.wyrmgallPowers.execute === 4 && result.wyrmgallPowers.shatter === 3 && result.wyrmgallPowers.maxHp === 80])
checks.push(["no console/page errors", errors.length === 0])

let allPass = true
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`)
  if (!ok) allPass = false
}
process.exit(allPass ? 0 : 1)
