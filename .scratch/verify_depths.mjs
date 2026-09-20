// PR verify: the Depths challenge ladder - data, cumulative modifiers,
// startRun penalties, the enemy multiplier, Acorn scaling, and a full
// auto-resolved run at a deep Depth.  PORT env, needs a dev server.
import { chromium } from "playwright"

const PORT = process.env.PORT || 5322
const browser = await chromium.launch({ args: ["--no-sandbox"] })
const page = await (await browser.newContext()).newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()) })
await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
await page.waitForSelector(".hw-commander-card", { timeout: 15000 })

const out = await page.evaluate(async () => {
  const t = Date.now()
  const { DEPTHS, MAX_DEPTH, depthModifiersFor, depthAcornMultiplier } = await import("/src/data/heartwood/depths.js?t=" + t)
  const { acornsForRun } = await import("/src/data/heartwood/metaPerks.js?t=" + t)
  const meta = await import("/src/services/heartwood/metaState.js?t=" + t)
  const eng = await import("/src/services/heartwood/runEngine.js?t=" + t)
  const r = {}

  // 1. Data well-formed, MAX_DEPTH matches.
  r.depthCount = DEPTHS.length
  r.maxDepth = MAX_DEPTH
  r.dataOk = DEPTHS.length >= 5 && MAX_DEPTH === DEPTHS.length && DEPTHS.every(
    (d, i) => d.level === i + 1 && d.name && d.description &&
      (d.enemyMult || d.essenceDelta || d.startCurse),
  )

  // 2. Cumulative modifiers: depth 3 stacks 1+2+3, depth 0 is identity.
  const m0 = depthModifiersFor(0)
  const m3 = depthModifiersFor(3)
  const m7 = depthModifiersFor(7)
  r.mods = {
    m0: { mult: m0.enemyMult, ess: m0.essenceDelta, curse: m0.startCurse.length },
    m3: { mult: +m3.enemyMult.toFixed(4), ess: m3.essenceDelta },
    m7: { mult: +m7.enemyMult.toFixed(4), ess: m7.essenceDelta, curse: m7.startCurse.length },
  }
  r.modsOk =
    m0.enemyMult === 1 && m0.essenceDelta === 0 && m0.startCurse.length === 0 &&
    m3.enemyMult > 1.15 && m3.essenceDelta === -75 &&
    m7.enemyMult > 1.35 && m7.essenceDelta === -150 && m7.startCurse.length >= 2

  // 3. Acorn multiplier scales; acornsForRun applies it.
  r.acornMult = { d0: depthAcornMultiplier(0), d5: depthAcornMultiplier(5) }
  const aBase = acornsForRun({ nodeIndex: 40 }, true, [], 0)
  const aD5 = acornsForRun({ nodeIndex: 40 }, true, [], 5)
  r.acornScaleOk = depthAcornMultiplier(0) === 1 && depthAcornMultiplier(5) === 3 && aD5 === Math.round(aBase * 3)

  // 4. startRun honours selectedDepth: essence penalty + first-battle
  //    curse land, and selectedDepth is stored.
  const base = eng.startRun("tommy", null, null)
  const d0 = eng.startRun("tommy", null, { selectedDepth: 0 })
  const d6 = eng.startRun("tommy", null, { selectedDepth: 6 })
  r.startRun = {
    baseDepthField: base.selectedDepth,
    d0DepthField: d0.selectedDepth,
    d6DepthField: d6.selectedDepth,
    essenceDrop: base.essence - d6.essence, // depth 6 -> -150
    curseCount: (d6.pendingActiveEffects || []).filter((e) => e.id === "weak" || e.id === "vulnerable").length,
  }
  r.startRunOk =
    base.selectedDepth === 0 && d0.selectedDepth === 0 && d6.selectedDepth === 6 &&
    r.startRun.essenceDrop === 150 && r.startRun.curseCount >= 2

  // 5. The enemy multiplier reaches the fight: a Depth 7 first battle's
  //    enemy has more HP than a Depth 0 one.
  function firstEnemyHp(depth) {
    let run = eng.startRun("tommy", null, { selectedDepth: depth })
    run = { ...run, essence: 999999 }
    let s = 0
    while (run.phase !== "formation" && s < 20) {
      s++
      if (run.phase === "shop") {
        for (let k = 0; k < 3; k++) { const n = eng.recruitUnit(run, run.shopOffers[k % run.shopOffers.length]); if (n !== run) run = n }
        run = eng.leaveShop(run)
      } else if (run.phase === "choice") run = eng.chooseFloorEncounter(run, 0)
      else if (run.phase === "event") run = eng.resolveEventChoice(run, 0)
      else if (run.phase === "relic") run = eng.chooseRelic(run, undefined)
      else break
    }
    if (run.phase !== "formation") return null
    run = eng.startFormationBattle(run)
    return Math.max(0, ...run.battle.enemies.map((e) => e.maxHp))
  }
  r.enemyHp = { d0: firstEnemyHp(0), d7: firstEnemyHp(7) }
  r.enemyScaleOk = r.enemyHp.d7 > r.enemyHp.d0 * 1.2

  // 6. Full auto-resolved run at Depth 4 - the added difficulty + curse
  //    must not crash it.
  let run = eng.startRun("tommy", null, { selectedDepth: 4 })
  run = { ...run, essence: 999999 }
  let safety = 0
  while (run.phase !== "victory" && run.phase !== "defeat" && safety < 400) {
    safety++
    if (run.phase === "shop") {
      for (let k = 0; k < 4; k++) { const n = eng.recruitUnit(run, run.shopOffers[k % run.shopOffers.length]); if (n !== run) run = n }
      run = eng.leaveShop(run)
    } else if (run.phase === "choice") run = eng.chooseFloorEncounter(run, 0)
    else if (run.phase === "relic") run = eng.chooseRelic(run, undefined)
    else if (run.phase === "event") run = eng.resolveEventChoice(run, 0)
    else if (run.phase === "formation") {
      run = eng.startFormationBattle(run)
      run = eng.autoResolve(run)
      run = eng.resolveBattleOutcome(run)
    } else break
  }
  r.fullRun = { outcome: run.phase, safety }
  r.fullRunOk = (run.phase === "victory" || run.phase === "defeat") && safety < 400

  // 7. meta store carries + clamps depth / selectedDepth.
  meta.resetMeta()
  meta.saveMeta({ ...meta.loadMeta(), depth: 3, selectedDepth: 9 })
  const loaded = meta.loadMeta()
  r.metaClamp = { depth: loaded.depth, selectedDepth: loaded.selectedDepth }
  r.metaClampOk = loaded.depth === 3 && loaded.selectedDepth === 3
  meta.resetMeta()

  return r
})

console.log(JSON.stringify(out, null, 2))
console.log("=== page errors ===", errors.length ? errors.join("\n") : "(none)")
const pass =
  out.dataOk && out.modsOk && out.acornScaleOk && out.startRunOk && out.enemyScaleOk &&
  out.fullRunOk && out.metaClampOk && errors.length === 0
console.log(pass ? "\nPASS" : "\nFAIL")
await browser.close()
process.exit(pass ? 0 : 1)
