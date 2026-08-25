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
  const { UNITS } = await import("/src/data/heartwood/units.js")
  const { UNIT_TRIBES } = await import("/src/data/heartwood/synergies.js")
  const out = {}

  out.registered = { palefen: !!UNITS.palefen, mistveil: !!UNITS.mistveil }
  out.tribes = { palefen: UNIT_TRIBES.palefen, mistveil: UNIT_TRIBES.mistveil }
  out.tier = { palefen: UNITS.palefen.tier, mistveil: UNITS.mistveil.tier }

  // Palefen carries its own Ward passive at battle start.
  let battle = startAutoBattle("tommy", [{ defId: "palefen" }], "rotwood-husk")
  const pf = battle.playerUnits.find((u) => u.defId === "palefen")
  out.palefenWard = pf?.powers.ward

  // Mistveil actually heals on its own hit (Lifesteal) - measured via
  // the exact log line, not a net HP delta the enemy's own 50/50
  // random targeting (no Taunt present) could perturb independently.
  // Docked below max HP first - gainHeal clamps to maxHp, so a full-HP
  // unit would log "heal 0" regardless of whether the trigger fired.
  battle = startAutoBattle("tommy", [{ defId: "mistveil" }], "rotwood-husk")
  battle = { ...battle, playerUnits: battle.playerUnits.map((u) => (u.defId === "mistveil" ? { ...u, hp: 10 } : u)) }
  battle = resolveRound(battle)
  out.mistveilHealLogLine = battle.log.some((line) => line === "Mistveil heal 1.")

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("errors:", errors)
await browser.close()

const checks = []
checks.push(["both registered", result.registered.palefen && result.registered.mistveil])
checks.push(["both tagged Spirit", result.tribes.palefen?.includes("spirit") && result.tribes.mistveil?.includes("spirit")])
checks.push(["Palefen is common, Mistveil is uncommon", result.tier.palefen === "common" && result.tier.mistveil === "uncommon"])
checks.push(["Palefen carries a self-Ward passive", result.palefenWard === 1])
checks.push(["Mistveil heals itself via Lifesteal on its own hit", result.mistveilHealLogLine])
checks.push(["no console/page errors", errors.length === 0])

let allPass = true
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`)
  if (!ok) allPass = false
}
process.exit(allPass ? 0 : 1)
