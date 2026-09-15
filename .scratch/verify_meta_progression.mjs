// PR verify: between-run meta progression - perks apply at startRun,
// acorns are earned by a finished run, the persistence store round-trips.
//   PORT env, needs a dev server.
import { chromium } from "playwright"

const PORT = process.env.PORT || 5319
const browser = await chromium.launch({ args: ["--no-sandbox"] })
const page = await (await browser.newContext()).newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()) })
await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
await page.waitForSelector(".hw-commander-card", { timeout: 15000 })

const out = await page.evaluate(async () => {
  const t = Date.now()
  const { META_PERKS, applyMetaPerks, acornsForRun } = await import("/src/data/heartwood/metaPerks.js?t=" + t)
  const meta = await import("/src/services/heartwood/metaState.js?t=" + t)
  const eng = await import("/src/services/heartwood/runEngine.js?t=" + t)
  const r = {}

  // 1. Perk data well-formed.
  r.perkCount = META_PERKS.length
  r.perksOk = META_PERKS.length >= 6 && META_PERKS.every(
    (p) => p.id && p.name && p.description && typeof p.cost === "number" && typeof p.apply === "function",
  )
  r.uniquePerkIds = new Set(META_PERKS.map((p) => p.id)).size === META_PERKS.length

  // 2. metaState round-trips and shape-guards a corrupt store.
  meta.resetMeta()
  const fresh = meta.loadMeta()
  r.freshShapeOk = fresh.acorns === 0 && Array.isArray(fresh.chosenPerks) && fresh.stats && typeof fresh.stats.runs === "number"
  meta.saveMeta({ ...fresh, acorns: 123, chosenPerks: ["deep-roots"] })
  const loaded = meta.loadMeta()
  r.roundTripOk = loaded.acorns === 123 && loaded.chosenPerks.includes("deep-roots")
  localStorage.setItem("heartwood-meta-v1", "{not json")
  r.corruptGuardOk = meta.loadMeta().acorns === 0
  meta.resetMeta()

  // 3. Perks actually change a fresh run.
  const baseRun = eng.startRun("tommy", null, null)
  const withPerks = eng.startRun("tommy", null, {
    chosenPerks: ["deep-roots", "early-market", "hardy-stock", "wide-bench", "deep-pockets", "essence-flow", "travelers-kit", "veterans-guard"],
  })
  r.perkEffects = {
    essence: withPerks.essence - baseRun.essence, // deep-roots +100
    marketLevel: withPerks.marketLevel,           // early-market -> 2
    commanderRank: withPerks.commanderRank,       // hardy-stock -> 1
    benchCapBonus: withPerks.benchCapBonus || 0,  // wide-bench -> 2
    metaItemSlotBonus: withPerks.metaItemSlotBonus || 0, // deep-pockets -> 1
    metaWinBonus: withPerks.metaWinBonus || 0,    // essence-flow -> 30
    startItems: withPerks.items.length,           // travelers-kit -> 1
    pendingWard: (withPerks.pendingActiveEffects || []).some((e) => e.id === "ward"), // veterans-guard
    noMetaStartItemLeak: withPerks.metaStartItem === undefined,
  }
  r.perkEffectsOk =
    r.perkEffects.essence === 100 &&
    r.perkEffects.marketLevel === 2 &&
    r.perkEffects.commanderRank === 1 &&
    r.perkEffects.benchCapBonus === 2 &&
    r.perkEffects.metaItemSlotBonus === 1 &&
    r.perkEffects.metaWinBonus === 30 &&
    r.perkEffects.startItems === 1 &&
    r.perkEffects.pendingWard &&
    r.perkEffects.noMetaStartItemLeak

  // 4. Downstream reads honour the meta fields.
  r.itemSlots = eng.effectiveItemSlots(withPerks)
  r.itemSlotsHonored = r.itemSlots === eng.effectiveItemSlots(baseRun) + 1
  r.winEssence = eng.essenceForWin(withPerks, { type: "battle" })
  r.winEssenceHonored = r.winEssence === eng.essenceForWin(baseRun, { type: "battle" }) + 30

  // 5. acornsForRun scales with depth and rewards a win.
  r.acorns = {
    fresh: acornsForRun({ nodeIndex: 0 }, false),
    deepLoss: acornsForRun({ nodeIndex: 40 }, false),
    win: acornsForRun({ nodeIndex: 60 }, true),
  }
  r.acornsOk = r.acorns.fresh === 0 && r.acorns.deepLoss >= 8 && r.acorns.win > r.acorns.deepLoss + 15

  // 6. wide-bench actually lifts the recruit cap: fill a run to the base
  //    cap, then one more recruit should still be blocked without the
  //    perk and allowed with it.
  const CAP = 10 // DEPLOY_SLOTS(4) + RESERVE_CAP(6)
  function benchAfterRecruits(perks) {
    let run = eng.startRun("tommy", null, perks ? { chosenPerks: perks } : null)
    run = { ...run, essence: 999999 }
    let guard = 0
    while (run.bench.length < CAP + 4 && guard < 40) {
      guard++
      const id = run.shopOffers[0]
      const next = eng.recruitUnit(run, id)
      if (next === run || next.essence === run.essence) {
        // shop exhausted or blocked; reroll to keep going
        const r2 = eng.rerollShop(run)
        if (r2 === run) break
        run = r2
        continue
      }
      run = next
    }
    return run.bench.length
  }
  r.benchNoPerk = benchAfterRecruits(null)
  r.benchWidePerk = benchAfterRecruits(["wide-bench"])
  r.widebenchOk = r.benchWidePerk > r.benchNoPerk && r.benchWidePerk <= CAP + 2

  applyMetaPerks
  return r
})

console.log(JSON.stringify(out, null, 2))
console.log("=== page errors ===", errors.length ? errors.join("\n") : "(none)")
const pass =
  out.perksOk && out.uniquePerkIds && out.freshShapeOk && out.roundTripOk && out.corruptGuardOk &&
  out.perkEffectsOk && out.itemSlotsHonored && out.winEssenceHonored && out.acornsOk && out.widebenchOk &&
  errors.length === 0
console.log(pass ? "\nPASS" : "\nFAIL")
await browser.close()
process.exit(pass ? 0 : 1)
