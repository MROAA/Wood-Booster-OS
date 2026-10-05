import { chromium } from "playwright"

// Sprint 3 - Tactics tutorial: the Training Grounds guided fight (real
// clicks, step by step), Skip, the once-only offer on the formation screen,
// replay from Help, the "How to play tactics" help section, and the
// first-time tactics coach tips (each once). Run state must stay untouched.
const PORT = process.env.PORT || 5445
const KEY = "heartwood-tactics-tutorial-v1"
const SAVE = "heartwood-run-save-v1"
const browser = await chromium.launch()
const errs = []
const out = { errors: [] }
const newPage = async () => {
  const p = await browser.newContext({ viewport: { width: 1600, height: 1000 } }).then((c) => c.newPage())
  p.on("pageerror", (e) => errs.push(String(e)))
  return p
}
const stepId = (p) => p.locator(".hwt-training").getAttribute("data-step")
const cell = (p, r, c) => p.locator(`.hwt-cell[data-cell="${r}-${c}"]`)
const token = (p, id) => p.locator(`.hwt-token[data-unit-id="${id}"]`)
const wait = (p, ms = 250) => p.waitForTimeout(ms)
const lsGet = (p, k) => p.evaluate((key) => localStorage.getItem(key), k)

// A saved run sitting on a formation screen (same setup as the deploy suite).
async function seedFormation(p) {
  await p.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
  await p.evaluate(async () => {
    const { startRun, serializeRun, RUN_PATH, actIndexForNode } = await import("/src/services/heartwood/runEngine.js")
    const idx = RUN_PATH.findIndex((n) => n.type === "battle" && n.formationId)
    const rs = {
      ...startRun("tommy", null, { forcedSeed: 777 }),
      nodeIndex: idx,
      path: RUN_PATH.slice(0, idx + 1),
      phase: "formation",
      bench: [{ key: "b0", defId: "the-fool", upgradeLevel: 0, upgrades: [] }],
      deployed: ["b0", null, null, null],
      items: [],
      lastSeenAct: actIndexForNode(idx, RUN_PATH.length),
    }
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(rs)))
  })
  await p.reload({ waitUntil: "domcontentloaded" })
  await p.waitForSelector(".hw-tactics-start", { timeout: 20000 })
  await wait(p, 400)
}

// 1: full walkthrough via real clicks, from the main-menu button.
{
  const p = await newPage()
  await p.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
  await p.waitForSelector(".hw-training-open-btn", { timeout: 20000 })
  await p.locator(".hw-training-open-btn").click()
  await p.waitForSelector(".hwt-training")
  const seen = [await stepId(p)]
  const spot = {}
  const note = async () => {
    const id = await stepId(p)
    if (seen[seen.length - 1] !== id) seen.push(id)
    spot[id] = spot[id] || (await p.locator(".hw-tutorial-spotlight").count())
  }
  await p.locator(".hwt-training-next").click() // welcome
  await wait(p)
  await note()
  // Off-script click is refused with a nudge.
  await token(p, "player-the-fool-0").click()
  await cell(p, 3, 7).click()
  await wait(p)
  const nudged = await p.locator(".hwt-training-nudge").count()
  const stillDeploy = await stepId(p)
  await token(p, "player-the-fool-0").click()
  await cell(p, 1, 6).click()
  await wait(p)
  await note()
  await p.locator(".hwt-begin-battle").click()
  await wait(p)
  await note()
  await token(p, "player-the-fool-0").click()
  await cell(p, 0, 3).click()
  await wait(p, 600)
  await note()
  const gnatBefore = await token(p, "enemy-mire-gnat-0").locator(".hwt-hp-gem").innerText()
  await token(p, "enemy-mire-gnat-0").click()
  await wait(p, 600)
  const gnatAfter = await token(p, "enemy-mire-gnat-0").locator(".hwt-hp-gem").innerText()
  const flankLog = await p.locator(".hwt-log").innerText()
  await note()
  const slamTiles = await p.locator('.hwt-cell[data-skill-zone="release"]').count()
  await p.locator(".hwt-training-next").click() // intent
  await wait(p)
  await note()
  await token(p, "player-bulwark-of-ages-1").click()
  await cell(p, 4, 6).click()
  await wait(p, 600)
  await note()
  await p.locator(".hwt-ability-btn").click()
  await wait(p)
  await note()
  await p.locator(".hwt-power-btn").click()
  await wait(p)
  await note()
  await p.locator(".hwt-end-turn").click()
  await wait(p, 1200)
  await note()
  // Finish: attack anything in reach, else step toward the enemy; End Turn.
  for (let guard = 0; guard < 40 && (await stepId(p)) === "finish"; guard++) {
    const ids = await p.$$eval('.hwt-token[data-side="player"][data-selectable="true"][data-acted="false"]', (els) => els.map((e) => e.dataset.unitId))
    if (!ids.length) {
      await p.locator(".hwt-end-turn").click()
      await wait(p, 1200)
      continue
    }
    await token(p, ids[0]).click()
    await wait(p, 150)
    const tgt = p.locator('.hwt-cell[data-targetable="true"]')
    if (await tgt.count()) {
      await tgt.first().click()
    } else {
      const best = await p.evaluate(() => {
        const enemies = [...document.querySelectorAll('.hwt-token[data-side="enemy"]')].map((t) => t.closest(".hwt-cell").dataset.cell.split("-").map(Number))
        let pick = null
        for (const c of document.querySelectorAll('.hwt-cell[data-reachable="true"]')) {
          const [r, col] = c.dataset.cell.split("-").map(Number)
          const d = Math.min(...enemies.map(([er, ec]) => Math.max(Math.abs(er - r), Math.abs(ec - col))))
          if (!pick || d < pick.d) pick = { d, key: c.dataset.cell }
        }
        return pick?.key
      })
      if (best) await p.locator(`.hwt-cell[data-cell="${best}"]`).click()
      else {
        await p.locator(".hwt-end-turn").click()
        await wait(p, 1200)
      }
    }
    await wait(p, 400)
  }
  await note()
  const won = await p.locator('.hwt-turn-label[data-phase="won"]').count()
  const runSave = await lsGet(p, SAVE)
  await p.locator(".hwt-training-card .hwt-training-next").click() // Finish
  await wait(p, 400)
  const status = await lsGet(p, KEY)
  const backOnMenu = await p.locator(".hw-training-open-btn").count()
  await p.context().close()
  const expected = ["welcome", "deploy", "begin", "move", "flank", "intent", "dodge", "ability", "power", "end-turn", "finish", "victory"]
  out.c1 = { seen, spot, nudged, stillDeploy, gnatBefore, gnatAfter, flanked: /flanked/.test(flankLog), slamTiles, won, runSave, status, backOnMenu }
  if (
    JSON.stringify(seen) !== JSON.stringify(expected) ||
    !nudged ||
    stillDeploy !== "deploy" ||
    !(Number(gnatAfter) < Number(gnatBefore)) ||
    !out.c1.flanked ||
    slamTiles !== 9 ||
    !won ||
    runSave !== null ||
    status !== "done" ||
    !backOnMenu ||
    ["deploy", "begin", "move", "flank", "intent", "dodge", "ability", "power", "end-turn"].some((s) => !spot[s])
  )
    out.errors.push("check1 walkthrough")
}

// 2: Skip works and is remembered (no auto-offer afterwards).
{
  const p = await newPage()
  await seedFormation(p)
  const offer1 = await p.locator(".hwt-training-offer").count()
  const saveBefore = await lsGet(p, SAVE)
  await p.locator(".hwt-training-offer .hwt-training-next").click() // Play it
  await p.waitForSelector(".hwt-training")
  await p.locator(".hwt-training-skip").click()
  await wait(p, 400)
  const backOnFormation = await p.locator(".hw-tactics-start").count()
  const status = await lsGet(p, KEY)
  const saveAfter = await lsGet(p, SAVE)
  await p.reload({ waitUntil: "domcontentloaded" })
  await p.waitForSelector(".hw-tactics-start")
  await wait(p, 300)
  const offer2 = await p.locator(".hwt-training-offer").count()
  await p.context().close()
  out.c2 = { offer1, backOnFormation, status, runUntouched: saveBefore === saveAfter, offer2 }
  if (!(offer1 === 1 && backOnFormation && status === "skipped" && saveBefore === saveAfter && offer2 === 0)) out.errors.push("check2 skip")
}

// 3: offered once - "No thanks" and "Start Battle" both retire it.
{
  const p = await newPage()
  await seedFormation(p)
  await p.locator(".hwt-training-later").click()
  await wait(p)
  const gone = await p.locator(".hwt-training-offer").count()
  const s1 = await lsGet(p, KEY)
  await p.context().close()
  const q = await newPage()
  await seedFormation(q)
  const offer = await q.locator(".hwt-training-offer").count()
  await q.locator(".hw-tactics-start").click()
  await wait(q, 500)
  const s2 = await lsGet(q, KEY)
  const deploying = await q.locator('.hwt-turn-label[data-phase="deploy"]').count()
  await seedFormation(q)
  const offerAgain = await q.locator(".hwt-training-offer").count()
  await q.context().close()
  out.c3 = { gone, s1, offer, s2, deploying, offerAgain }
  if (!(gone === 0 && s1 === "skipped" && offer === 1 && s2 === "offered" && deploying === 1 && offerAgain === 0)) out.errors.push("check3 offered once")
}

// 4: Help overlay: tactics reference section + replay the tutorial.
{
  const p = await newPage()
  await seedFormation(p)
  await p.evaluate((k) => localStorage.setItem(k, "done"), KEY)
  await p.locator(".hw-utility-bar button", { hasText: "Help" }).click()
  await p.waitForSelector(".hwt-help-tactics")
  const cards = await p.locator(".hwt-help-card").count()
  const terms = await p.locator(".hwt-help-card .hw-help-term").allInnerTexts()
  await p.locator(".hwt-help-training-btn").click()
  await p.waitForSelector(".hwt-training")
  const step = await stepId(p)
  await p.locator(".hwt-training-skip").click()
  await wait(p, 300)
  const status = await lsGet(p, KEY)
  await p.context().close()
  const need = ["Deployment", "Action points", "Facing & flanking", "Zone of control", "Abilities", "Commander Power", "Enemy intents", "Telegraphed skills", "Terrain", "Element combos", "Objectives", "Boss phases", "Factions", "Hero levels", "Wounds carry over", "Mana"]
  out.c4 = { cards, step, status }
  if (!(cards >= 15 && need.every((t) => terms.includes(t)) && step === "welcome" && status === "done")) out.errors.push("check4 help + replay")
}

// 5: contextual tactics tips - each once, one at a time, remembered.
{
  const p = await newPage()
  await p.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
  const setup = await p.evaluate(async () => {
    const rt = await import("/src/services/heartwood/runEngine.js")
    const E = await import("/src/services/heartwood/tacticsEngine.js")
    const B = await import("/src/services/heartwood/tacticsBosses.js")
    const O = await import("/src/services/heartwood/tacticsObjectives.js")
    const F = await import("/src/services/heartwood/tacticsFactions.js")
    const idx = rt.RUN_PATH.findIndex((n) => n.type === "battle" && n.formationId)
    const L = await import("/src/services/heartwood/unitLevels.js")
    const rs = {
      ...rt.startRun("tommy", null, { forcedSeed: 777 }),
      nodeIndex: idx,
      path: rt.RUN_PATH.slice(0, idx + 1),
      phase: "formation",
      bench: [{ key: "b0", defId: "the-fool", upgradeLevel: 0, upgrades: [], xp: 40, perks: [Object.keys(L.PERKS)[0]] }],
      deployed: ["b0", null, null, null],
      items: [],
      commanderWounded: true,
      commanderHpPct: 0.25,
      lastSeenAct: rt.actIndexForNode(idx, rt.RUN_PATH.length),
    }
    const bossId = B.BOSS_IDS[0]
    const fight = B.BOSS_FIGHTS[bossId]
    const built = rt.startTacticsFormationBattle(rs, () => {
      let b = E.createRealMatchupBattle(["the-fool"], [fight.bossDefId, "mire-gnat"], "tommy", 0, { "4-6": "rock" })
      b = B.applyBossFight(b, bossId)
      b = F.applyFaction(b, "wanderers")
      b = O.applyObjective(b, O.buildObjectiveSpec("survive", 1))
      b = { ...b, units: b.units.map((u) => (u.id === "player-the-fool-0" ? { ...u, burn: 2 } : u.id === "player-commander" ? { ...u, hp: Math.round(u.maxHp * 0.25) } : u)) }
      return b
    })
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(rt.serializeRun(built)))
    // A returning player: the shop intros are done (they suppress the coach).
    localStorage.setItem("heartwood-autobattler-intro-seen", "true")
    localStorage.setItem("heartwood-story-intro-seen", "true")
    return { engine: built.battle?.engine, boss: !!built.battle?.boss, faction: built.battle?.faction, obj: built.battle?.objective?.type }
  })
  await p.reload({ waitUntil: "domcontentloaded" })
  await p.waitForSelector(".hwt-board", { timeout: 20000 })
  const shown = []
  for (let i = 0; i < 10; i++) {
    await wait(p, 400)
    const tip = p.locator(".hw-coach-tip")
    if (!(await tip.count())) break
    shown.push({ id: await tip.getAttribute("data-coach-id"), n: await tip.count(), ring: await p.locator(".hw-tutorial-spotlight").count() })
    await tip.locator(".hw-tutorial-next").click()
  }
  await p.reload({ waitUntil: "domcontentloaded" })
  await p.waitForSelector(".hwt-board")
  await wait(p, 600)
  const afterReload = await p.locator(".hw-coach-tip").count()
  const seenKey = JSON.parse((await lsGet(p, "heartwood-coach-seen-v1")) || "[]")
  const runStill = await p.evaluate(() => JSON.parse(localStorage.getItem("heartwood-run-save-v1")).run.battle.engine)
  await p.context().close()
  const want = ["t-boss", "t-faction", "t-objective", "t-wounded", "t-level", "t-element", "t-terrain"]
  out.c5 = { setup, shown, afterReload, seenKey }
  if (
    JSON.stringify(shown.map((s) => s.id)) !== JSON.stringify(want) ||
    shown.some((s) => s.n !== 1 || !s.ring) ||
    afterReload !== 0 ||
    !want.every((id) => seenKey.includes(id)) ||
    runStill !== "tactics"
  )
    out.errors.push("check5 contextual tips")
}

// 6: the scenario itself is pure - building it never touches storage.
{
  const p = await newPage()
  await p.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
  const r = await p.evaluate(async () => {
    localStorage.clear()
    const T = await import("/src/services/heartwood/tacticsTutorial.js")
    const b = T.buildTrainingBattle()
    return { phase: b.phase, units: b.units.length, grid: b.grid, keys: localStorage.length, tutorial: b.tutorial }
  })
  await p.context().close()
  out.c6 = r
  if (!(r.phase === "deploy" && r.units === 5 && r.keys === 0 && r.tutorial)) out.errors.push("check6 pure scenario")
}

out.pageErrors = errs
await browser.close()
console.log(JSON.stringify(out, null, 2))
console.log(out.errors.length === 0 && errs.length === 0 ? "ALL PASS" : "FAIL")
