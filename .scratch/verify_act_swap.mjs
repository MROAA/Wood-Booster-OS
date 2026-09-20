// Focused check: resolveEncounterId's Act-mismatch swap + dev warn, and
// that startFormationBattle/previewBattleEnemies agree, when the
// branching path displaces a fixed-id fight into another Act.
import { chromium } from "playwright"
const PORT = process.env.PORT || 5199
const b = await chromium.launch({ args: ["--no-sandbox"] })
const p = await (await b.newContext()).newPage()
const warns = [], errs = []
p.on("pageerror", e => errs.push(String(e)))
p.on("console", m => {
  const t = m.text()
  if (m.type() === "error") errs.push(t)
  if (t.includes("Act-mismatch swap")) warns.push(t)
})
await p.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
await p.waitForTimeout(500)
const r = await p.evaluate(async () => {
  const eng = await import("/src/services/heartwood/runEngine.js")
  const { ENEMIES } = await import("/src/data/heartwood/enemies.js")
  const { startRun, recruitUnit, leaveShop, chooseFloorEncounter } = eng
  let run = startRun("tommy")
  for (const id of [...run.shopOffers]) run = recruitUnit(run, id)
  run = leaveShop(run)
  if (run.phase === "choice") run = chooseFloorEncounter(run, 0)
  // Force the current node to be an Act I enemy sitting at an Act VII position.
  const lastIdx = eng.RUN_PATH.length - 2 // Act VII band
  const path = eng.RUN_PATH.slice(0, lastIdx).map(n => ({ ...n }))
  path.push({ type: "battle", enemyId: "rotwood-husk" }) // Act 1 enemy, displaced to Act 7
  run = { ...run, path, nodeIndex: lastIdx, phase: "formation", battlePool: [], floorChoices: null }

  const preview = eng.previewBattleEnemies(run)
  const battle = eng.startFormationBattle(run)
  const fightId = battle.battle.enemies[0].defId
  return {
    posAct: eng.actIndexForNode(lastIdx, eng.RUN_PATH.length),
    authoredEnemy: "rotwood-husk", authoredAct: ENEMIES["rotwood-husk"].act,
    previewEnemyId: preview[0].defId, previewAct: ENEMIES[preview[0].defId]?.act,
    fightEnemyId: fightId, fightAct: ENEMIES[fightId]?.act,
    previewMatchesFight: preview[0].defId === fightId,
  }
})
console.log(JSON.stringify(r, null, 2))
console.log("swap warns seen:", warns)
console.log("errors:", errs)
await b.close()
const ok = r.fightAct === 7 && r.previewMatchesFight && r.fightEnemyId !== "rotwood-husk" && warns.length >= 1 && errs.length === 0
console.log(ok ? "PASS: displaced fight swapped to an Act 7 enemy, preview==fight, dev warn fired, no errors" : "FAIL")
process.exit(ok ? 0 : 1)
