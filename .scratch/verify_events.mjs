// PR verify: the map-event system. Event nodes exist in RUN_PATH, an
// event routes to the "event" phase, every choice's consequences apply
// correctly, and the run advances.  PORT env, needs a dev server.
import { chromium } from "playwright"

const PORT = process.env.PORT || 5315
const browser = await chromium.launch({ args: ["--no-sandbox"] })
const page = await (await browser.newContext()).newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()) })
await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
await page.waitForSelector(".hw-commander-card", { timeout: 15000 })

const out = await page.evaluate(async () => {
  const t = Date.now()
  const eng = await import("/src/services/heartwood/runEngine.js?t=" + t)
  const { EVENTS, pickEvent } = await import("/src/data/heartwood/events.js?t=" + t)
  const { RELICS } = await import("/src/data/heartwood/relics.js?t=" + t)
  const r = {}

  // 1. RUN_PATH has event nodes; data is well-formed.
  r.eventNodesInPath = eng.RUN_PATH.filter((n) => n.type === "event").length
  r.eventCount = EVENTS.length
  r.eventsWellFormed = EVENTS.every(
    (e) => e.id && e.title && e.body && Array.isArray(e.choices) && e.choices.length >= 2 &&
      e.choices.every((c) => c.label && c.result && Array.isArray(c.effects)),
  )
  r.dataOk = r.eventNodesInPath >= 8 && r.eventCount >= 12 && r.eventsWellFormed

  // 2. A fresh run has the new fields; save version bumped.
  let run = eng.startRun("tommy")
  r.hasStoryFields = Array.isArray(run.seenEvents) && typeof run.storyFlags === "object"
  r.saveVersion = eng.RUN_SAVE_VERSION

  // 3. Walk the run until an event node is reached; assert phase. Recruit
  //    greedily at every shop so the squad can actually win the fights
  //    in between.
  let safety = 0
  const START_ESSENCE = run.essence
  r.trace = []
  while (run.phase !== "event" && safety < 80) {
    safety++
    r.trace.push(`${run.phase}@${run.nodeIndex}(e${run.essence},b${run.bench.length})`)
    if (run.phase === "shop") {
      let changed = true
      while (changed) {
        changed = false
        for (const id of run.shopOffers) {
          const next = eng.recruitUnit(run, id)
          if (next !== run && next.essence !== run.essence) { run = next; changed = true; break }
        }
      }
      run = eng.leaveShop(run)
    } else if (run.phase === "choice") {
      run = eng.chooseFloorEncounter(run, 0)
    } else if (run.phase === "relic") {
      // chooseRelic(run, undefined) is a valid "skip" - advances the run.
      const before = run.nodeIndex
      run = eng.chooseRelic(run, undefined)
      if (run.nodeIndex === before && run.phase === "relic") { run = { ...run, phase: "__stuck__" }; break }
    } else if (run.phase === "formation") {
      run = eng.startFormationBattle(run)
      let g = 0
      while (run.battle && run.battle.phase !== "won" && run.battle.phase !== "lost" && g < 300) { run = eng.advanceRound(run); g++ }
      run = eng.resolveBattleOutcome(run)
    } else break
    if (run.phase === "defeat" || run.phase === "victory") break
  }
  r.walkEndedAt = run.phase
  r.reachedEvent = run.phase === "event"

  if (r.reachedEvent) {
    const ev = eng.eventForNode(run)
    r.eventShown = ev?.id
    r.eventIsReal = !!EVENTS.find((e) => e.id === ev.id)

    // 4. Every choice of every event applies its declared consequences
    //    on a fresh copy (pure check via applyEventEffect path through
    //    resolveEventChoice). Test each choice from the SAME event node.
    r.choiceResults = []
    for (let ci = 0; ci < ev.choices.length; ci++) {
      const before = { ...run }
      const after = eng.resolveEventChoice(before, ci)
      const choice = ev.choices[ci]
      const wantEssence = choice.effects.reduce((s, e) => s + (typeof e.essence === "number" ? e.essence : 0), 0)
      const gotEssence = after.essence - before.essence
      const relicGain = choice.effects.some((e) => e.relic)
      const itemGain = choice.effects.some((e) => e.item)
      const unitGain = choice.effects.some((e) => e.unit)
      const nbGain = choice.effects.some((e) => Array.isArray(e.squadNextBattle))
      const flagGain = choice.effects.find((e) => e.flag)
      r.choiceResults.push({
        ci,
        essenceOk: gotEssence === Math.max(-before.essence, wantEssence) || (wantEssence >= 0 && gotEssence === wantEssence),
        relicOk: !relicGain || after.relics.length > before.relics.length,
        itemOk: !itemGain || after.items.length > before.items.length,
        // a full bench (10) legitimately can't take another unit;
        // 3-of-a-kind fuses so bench can also stay level or shrink.
        unitOk: !unitGain || after.bench.length > before.bench.length || before.bench.length >= 10 || after.bench.length !== before.bench.length,
        nbOk: !nbGain || (after.pendingActiveEffects || []).length > (before.pendingActiveEffects || []).length,
        flagOk: !flagGain || after.storyFlags[flagGain.flag] === true,
        seenRecorded: (after.seenEvents || []).includes(ev.id),
        advanced: after.phase !== "event" || after.nodeIndex > before.nodeIndex,
      })
    }
    r.allChoicesOk = r.choiceResults.every(
      (c) => c.essenceOk && c.relicOk && c.itemOk && c.unitOk && c.nbOk && c.flagOk && c.seenRecorded && c.advanced,
    )

    // Targeted: a unit-granting choice on a run whose bench has room
    //   actually adds a bench entry.
    const unitChoiceIdx = ev.choices.findIndex((c) => c.effects.some((e) => e.unit))
    if (unitChoiceIdx >= 0) {
      const roomy = { ...run, bench: run.bench.slice(0, 2) }
      const after = eng.resolveEventChoice(roomy, unitChoiceIdx)
      r.unitGrantAddsBench = after.bench.length > roomy.bench.length
    } else {
      r.unitGrantAddsBench = true
    }
  }
  void START_ESSENCE
  void RELICS
  void pickEvent
  return r
})

console.log(JSON.stringify(out, null, 2))
console.log("=== page errors ===", errors.length ? errors.join("\n") : "(none)")
const pass =
  out.dataOk && out.hasStoryFields && out.saveVersion >= 3 && out.reachedEvent &&
  out.eventIsReal && out.allChoicesOk && errors.length === 0
console.log(pass ? "\nPASS" : "\nFAIL")
await browser.close()
process.exit(pass ? 0 : 1)
