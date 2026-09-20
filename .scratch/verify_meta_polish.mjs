// PR verify: meta polish - 5 more perks (13 total), the new perk
// effects (first-blood, forager, deep-reserves, heirloom, seed-vault),
// and acornsForRun's seed-vault bonus.  PORT env, needs a dev server.
import { chromium } from "playwright"

const PORT = process.env.PORT || 5321
const browser = await chromium.launch({ args: ["--no-sandbox"] })
const page = await (await browser.newContext()).newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()) })
await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
await page.waitForSelector(".hw-commander-card", { timeout: 15000 })

const out = await page.evaluate(async () => {
  const t = Date.now()
  const { META_PERKS, acornsForRun } = await import("/src/data/heartwood/metaPerks.js?t=" + t)
  const eng = await import("/src/services/heartwood/runEngine.js?t=" + t)
  const r = {}

  // 1. 13 perks, all still well-formed and unique.
  r.perkCount = META_PERKS.length
  r.wellFormed = META_PERKS.every(
    (p) => p.id && p.name && p.description && typeof p.cost === "number" && typeof p.apply === "function",
  )
  r.uniqueIds = new Set(META_PERKS.map((p) => p.id)).size === META_PERKS.length
  r.newPerksPresent = ["first-blood", "forager", "deep-reserves", "heirloom", "seed-vault"].every(
    (id) => META_PERKS.some((p) => p.id === id),
  )

  // 2. seed-vault: +2 Acorns on a finished run.
  r.acornsPlain = acornsForRun({ nodeIndex: 40 }, false, [])
  r.acornsSeedVault = acornsForRun({ nodeIndex: 40 }, false, ["seed-vault"])
  r.seedVaultOk = r.acornsSeedVault === r.acornsPlain + 2

  // 3. Each new perk changes a fresh run in the expected way.
  const base = eng.startRun("tommy", null, null)
  const fb = eng.startRun("tommy", null, { chosenPerks: ["first-blood"] })
  const fg = eng.startRun("tommy", null, { chosenPerks: ["forager"] })
  const dr = eng.startRun("tommy", null, { chosenPerks: ["deep-reserves"] })
  const hl = eng.startRun("tommy", null, { chosenPerks: ["heirloom"] })
  const all = eng.startRun("tommy", null, {
    chosenPerks: ["wide-bench", "deep-reserves", "first-blood", "forager", "heirloom"],
  })
  r.effects = {
    firstBloodStr: (fb.pendingActiveEffects || []).filter((e) => e.id === "strength").reduce((s, e) => s + e.amount, 0),
    foragerBench: fg.bench.length,
    foragerDeployed: fg.deployed.filter((k) => k !== null).length,
    foragerNoSignalLeak: fg.metaStartUnit === undefined,
    deepReservesBonus: dr.benchCapBonus || 0,
    heirloomRelic: hl.relics.includes("ember-core"),
    heirloomNoDupe: eng.startRun("tommy", null, { chosenPerks: ["heirloom", "heirloom"] }).relics.filter((x) => x === "ember-core").length,
    stackedBenchBonus: all.benchCapBonus || 0, // wide-bench(2) + deep-reserves(1) = 3
  }
  r.effectsOk =
    r.effects.firstBloodStr === 2 &&
    r.effects.foragerBench >= 1 &&
    r.effects.foragerDeployed >= 1 &&
    r.effects.foragerNoSignalLeak &&
    r.effects.deepReservesBonus === 1 &&
    r.effects.heirloomRelic &&
    r.effects.heirloomNoDupe === 1 &&
    r.effects.stackedBenchBonus === 3

  // 4. A full auto-resolved run with every new perk on - no crash.
  let run = eng.startRun("tommy", null, {
    chosenPerks: ["first-blood", "forager", "deep-reserves", "heirloom", "seed-vault", "wide-bench", "deep-roots"],
  })
  run = { ...run, essence: 999999 }
  let safety = 0
  while (run.phase !== "victory" && run.phase !== "defeat" && safety < 400) {
    safety++
    if (run.phase === "shop") {
      for (let k = 0; k < 4; k++) {
        const id = run.shopOffers[k % run.shopOffers.length]
        const next = eng.recruitUnit(run, id)
        if (next !== run) run = next
      }
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

  void base
  return r
})

console.log(JSON.stringify(out, null, 2))
console.log("=== page errors ===", errors.length ? errors.join("\n") : "(none)")
const pass =
  out.perkCount >= 13 && out.wellFormed && out.uniqueIds && out.newPerksPresent &&
  out.seedVaultOk && out.effectsOk && out.fullRunOk && errors.length === 0
console.log(pass ? "\nPASS" : "\nFAIL")
await browser.close()
process.exit(pass ? 0 : 1)
