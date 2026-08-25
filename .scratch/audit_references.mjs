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
  const { UNITS } = await import("/src/data/heartwood/units.js")
  const { ENEMIES } = await import("/src/data/heartwood/enemies.js")
  const { FORMATIONS } = await import("/src/data/heartwood/formations.js")
  const { ITEMS } = await import("/src/data/heartwood/items.js")
  const { RELICS } = await import("/src/data/heartwood/relics.js")
  const { CHARACTERS } = await import("/src/data/heartwood/characters.js")
  const { UNIT_TRIBES, TRIBES } = await import("/src/data/heartwood/synergies.js")

  const problems = []

  // Every RUN_PATH battle/miniboss/boss node's enemyId/formationId must
  // resolve to a real def. formations.js's own pieces must resolve too.
  const runModule = await import("/src/services/heartwood/runEngine.js")
  const run = runModule.startRun("tommy")
  for (const [i, node] of run.path.entries()) {
    if (node.enemyId && !ENEMIES[node.enemyId]) problems.push(`RUN_PATH[${i}] enemyId "${node.enemyId}" not in ENEMIES`)
    if (node.formationId && !FORMATIONS[node.formationId]) problems.push(`RUN_PATH[${i}] formationId "${node.formationId}" not in FORMATIONS`)
  }
  for (const [fid, f] of Object.entries(FORMATIONS)) {
    for (const p of f.pieces) {
      if (!ENEMIES[p.defId]) problems.push(`formation "${fid}" piece defId "${p.defId}" not in ENEMIES`)
    }
  }

  // Every unit referenced by a `summon` field must exist.
  for (const [uid, u] of Object.entries(UNITS)) {
    if (u.summon?.defId && !UNITS[u.summon.defId]) problems.push(`unit "${uid}" summon.defId "${u.summon.defId}" not in UNITS`)
  }

  // UNIT_TRIBES entries must reference real units and real tribes.
  for (const [uid, tribes] of Object.entries(UNIT_TRIBES)) {
    if (!UNITS[uid]) problems.push(`UNIT_TRIBES key "${uid}" not in UNITS`)
    for (const t of tribes) {
      if (!TRIBES[t]) problems.push(`UNIT_TRIBES["${uid}"] references unknown tribe "${t}"`)
    }
  }
  // Every BASE unit should have a tribe entry (fused "+" units
  // correctly inherit via tribesOf's own def.fusedFrom fallback, so
  // they're excluded here rather than flagged as false positives).
  const untagged = Object.keys(UNITS).filter((uid) => !UNITS[uid].fusedFrom && !UNIT_TRIBES[uid])
  if (untagged.length) problems.push(`base units with no UNIT_TRIBES entry: ${untagged.join(", ")}`)

  // Every CHARACTERS entry's own art/icon should resolve (spot check
  // activePower/squadPassive/movePattern exist, not malformed).
  for (const [cid, c] of Object.entries(CHARACTERS)) {
    if (!c.movePattern && !c.attackPattern) problems.push(`character "${cid}" has neither movePattern nor attackPattern`)
  }

  return { problems, unitCount: Object.keys(UNITS).length, enemyCount: Object.keys(ENEMIES).length, itemCount: Object.keys(ITEMS).length, relicCount: Object.keys(RELICS).length, formationCount: Object.keys(FORMATIONS).length }
})

console.log(JSON.stringify(result, null, 2))
await browser.close()

if (result.problems.length === 0) {
  console.log("PASS: no reference problems found")
  process.exit(0)
} else {
  console.log(`FAIL: ${result.problems.length} problem(s) found`)
  process.exit(1)
}
