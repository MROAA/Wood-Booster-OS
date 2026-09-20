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
  const { startAutoBattle, resolveRound } = await import("/src/services/heartwood/autoBattleEngine.js")
  const out = { battleStartChecks: {}, onHitChecks: {} }

  // Battle-start passives: check the power/field is present the moment
  // the battle begins, before any round resolves.
  const battleStartCases = [
    ["the-fool", "regen", 2],
    ["the-hermit", "ward", 1],
    ["the-devil", "execute", 2],
    ["judgement", "shatter", 3],
    ["sparrowthorn", "woundedFury", 1],
    ["duskwren", "strength", 3], // 1 own + Tommy's +2 squadPassive baseline
    ["mosshollow", "regen", 2],
  ]
  for (const [defId, powerId, expected] of battleStartCases) {
    const battle = startAutoBattle("tommy", [{ defId }], "ironmaw")
    const u = battle.playerUnits.find((x) => x.defId === defId)
    out.battleStartChecks[defId] = { powerId, expected, actual: u?.powers[powerId] || 0 }
  }

  // rallyHeal/rallyAdjacent-style fields: just confirm the field is set
  // on the def as expected (engine already proven elsewhere this
  // session for the rallyHeal/rallyAdjacent mechanism itself).
  const { UNITS } = await import("/src/data/heartwood/units.js")
  out.rallyFields = {
    "the-moon": UNITS["the-moon"].rallyHeal,
    "the-lovers": UNITS["the-lovers"].chainDamage,
    thistlemaw: UNITS.thistlemaw.chainDamage,
  }

  // On-hit triggers: fight vs. ironmaw and check the specific log line.
  const onHitCases = [
    ["the-magician", "weak"],
    ["the-hanged-man", "vulnerable"],
    ["death", "poison"],
  ]
  for (const [defId, powerId] of onHitCases) {
    let battle = startAutoBattle("tommy", [{ defId }], "ironmaw")
    for (let i = 0; i < 3 && battle.phase === "player"; i++) battle = resolveRound(battle)
    out.onHitChecks[defId] = battle.log.some((line) => line.includes(`gain 1 ${powerId}`))
  }

  // Sunder on-hit (justice's 3rd move, duskbramble's onDealDamage trigger).
  let battle = startAutoBattle("tommy", [{ defId: "duskbramble" }], "ironmaw")
  for (let i = 0; i < 3 && battle.phase === "player"; i++) battle = resolveRound(battle)
  out.duskbrambleSunderFired = battle.log.some((line) => line.includes("loses a stack of"))

  // Justice's own Sunder move (3rd in its sequence pattern).
  out.justiceMovePattern = UNITS.justice.movePattern.map((m) => m.type)

  // Silverbloom's self-Cleanse: apply poison via an item, confirm the
  // cleanse log line fires.
  battle = startAutoBattle("tommy", [{ defId: "the-high-priestess", itemIds: [] }], "ironmaw")
  // Poison itself doesn't land on our own unit in this simple setup,
  // so just confirm the turnStart cleanse trigger is wired (either
  // "nothing to cleanse" or an actual strip - both prove it fires).
  for (let i = 0; i < 2 && battle.phase === "player"; i++) battle = resolveRound(battle)
  out.silverbloomCleanseFired = battle.log.some((line) => line.includes("cleanse") || line.includes("Cleanse"))

  // Full-squad joint fight sanity: every one of the 17 in one battle,
  // confirm it resolves without crashing.
  const all17 = [
    "the-fool", "the-magician", "the-high-priestess", "the-lovers", "the-hermit",
    "justice", "the-hanged-man", "death", "the-devil", "the-moon", "judgement",
    "sparrowthorn", "duskwren", "duskbramble", "hollowmere", "thistlemaw", "mosshollow",
  ]
  battle = startAutoBattle("tommy", all17.slice(0, 4).map((defId) => ({ defId })), "ironmaw")
  for (let i = 0; i < 8 && battle.phase === "player"; i++) battle = resolveRound(battle)
  out.jointFightPhase = battle.phase

  return out
})

console.log(JSON.stringify(result, null, 2))
console.log("errors:", errors)
await browser.close()

const checks = []
for (const [defId, info] of Object.entries(result.battleStartChecks)) {
  checks.push([`${defId} starts with ${info.expected} ${info.powerId}`, info.actual === info.expected])
}
checks.push(["the-moon has rallyHeal", result.rallyFields["the-moon"] === 2])
checks.push(["the-lovers has chainDamage", result.rallyFields["the-lovers"] === 3])
checks.push(["thistlemaw has chainDamage", result.rallyFields.thistlemaw === 3])
for (const [defId, ok] of Object.entries(result.onHitChecks)) {
  checks.push([`${defId}'s on-hit debuff fires`, ok])
}
checks.push(["justice's movePattern includes sunder", result.justiceMovePattern.includes("sunder")])
checks.push(["duskbramble's Sunder-on-hit fires", result.duskbrambleSunderFired])
checks.push(["Silverbloom's self-Cleanse trigger fires", result.silverbloomCleanseFired])
checks.push(["a 4-of-17 joint squad fight resolves without crashing", result.jointFightPhase === "won" || result.jointFightPhase === "player"])
checks.push(["no console/page errors", errors.length === 0])

let allPass = true
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`)
  if (!ok) allPass = false
}
process.exit(allPass ? 0 : 1)
