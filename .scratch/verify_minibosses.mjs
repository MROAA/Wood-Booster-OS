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
  const { startRun, essenceForWin } = await import("/src/services/heartwood/runEngine.js")
  const { ENEMIES } = await import("/src/data/heartwood/enemies.js")
  const out = {}

  out.thornmawExists = !!ENEMIES.thornmaw

  const run = startRun("tommy")
  const path = run.path
  out.pathLength = path.length

  const minibossNodes = path.map((n, i) => ({ ...n, i })).filter((n) => n.type === "miniboss")
  out.minibossNodes = minibossNodes.map((n) => ({ enemyId: n.enemyId, index: n.i, progress: n.i / (path.length - 1) }))

  // Neither miniboss node ends the run (only literal type: "boss" does).
  const bossNodes = path.filter((n) => n.type === "boss")
  out.onlyOneRunEndingBoss = bossNodes.length === 1 && bossNodes[0].enemyId === "spacemonkey"

  // Miniboss essence payout is higher than a plain solo fight.
  const plainNode = { type: "battle", enemyId: "rotwood-husk" }
  const minibossNode = { type: "miniboss", enemyId: "deepwarden" }
  out.essence = { plain: essenceForWin(run, plainNode), miniboss: essenceForWin(run, minibossNode) }

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("errors:", errors)
await browser.close()

const checks = []
checks.push(["Thornmaw registered", result.thornmawExists])
checks.push(["exactly 2 miniboss nodes in RUN_PATH", result.minibossNodes.length === 2])
checks.push(["Deepwarden sits under the 60% difficulty-ramp threshold", result.minibossNodes.some((n) => n.enemyId === "deepwarden" && n.progress < 0.6)])
checks.push(["Thornmaw sits past the 60% difficulty-ramp threshold", result.minibossNodes.some((n) => n.enemyId === "thornmaw" && n.progress >= 0.6)])
checks.push(["only Spacemonkey's node actually ends the run", result.onlyOneRunEndingBoss])
checks.push(["miniboss essence payout beats a plain fight's", result.essence.miniboss > result.essence.plain])
checks.push(["no console/page errors", errors.length === 0])

let allPass = true
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`)
  if (!ok) allPass = false
}
process.exit(allPass ? 0 : 1)
