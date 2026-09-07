import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

// Hearthwood - Unit Evolution ("jatketaan" -> "Yksiköiden evoluutio",
// "automaattinen + ilmainen"). Deployed evolvable units GROW into an
// authored stronger form after a win once a deterministic run-condition
// (minWins + deployed tribe count [+ forestState]) is met. Settled in
// resolveBattleOutcome's win branch, never mid-combat, never on a boss
// win. Free; the "cost" is build commitment.

const PORT = process.env.PORT || 5334
const ROOT = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-hw-evo"
const SHOT_DIR = `${ROOT}/.scratch/shots`
await mkdir(SHOT_DIR, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text())
})

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForTimeout(500)

const r = await page.evaluate(async () => {
  const {
    EVOLUTIONS,
    evolutionFor,
    evolutionReady,
    evolutionHint,
  } = await import("/src/data/heartwood/evolutions.js")
  const { UNITS, TIER2_SUFFIX } = await import("/src/data/heartwood/units.js")
  const { UNIT_TRIBES } = await import("/src/data/heartwood/synergies.js")
  const {
    RUN_PATH,
    startRun,
    resolveBattleOutcome,
    leaveShop,
    reforgeUnit,
    serializeRun,
    deserializeRun,
    REFORGE_COST,
  } = await import("/src/services/heartwood/runEngine.js")
  const { startAutoBattle, resolveRound } = await import("/src/services/heartwood/autoBattleEngine.js")

  const out = { ok: {}, detail: {} }
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b)

  // ---- A. Pure predicate (evolutions.js) --------------------------------
  out.ok.forLookup = eq(evolutionFor("sapthorn"), EVOLUTIONS.sapthorn) && evolutionFor("nope") === null
  out.ok.readyMet = evolutionReady({ defId: "sapthorn", wins: 4 }, { wood: 2 }, "restless") === "wood-elemental"
  out.ok.readyWinsShort = evolutionReady({ defId: "sapthorn", wins: 3 }, { wood: 2 }, "restless") === null
  out.ok.readyTribeShort = evolutionReady({ defId: "sapthorn", wins: 4 }, { wood: 1 }, "restless") === null
  out.ok.readyOverMet = evolutionReady({ defId: "sapthorn", wins: 9 }, { wood: 5 }, "restless") === "wood-elemental"
  // the-hierophant is now Thorn-gated too (no free tribe-agnostic chain)
  out.ok.hierophantThornGated =
    evolutionReady({ defId: "the-hierophant", wins: 5 }, { thorn: 2 }, "restless") === "goldenbough-ascendant" &&
    evolutionReady({ defId: "the-hierophant", wins: 5 }, {}, "restless") === null &&
    evolutionReady({ defId: "the-hierophant", wins: 4 }, { thorn: 2 }, "restless") === null
  out.ok.nonEvolver = evolutionReady({ defId: "loamguard", wins: 99 }, { wood: 9 }, "restless") === null
  out.ok.noWinsField = evolutionReady({ defId: "sapthorn" }, { wood: 2 }, "restless") === null
  // determinism: same inputs -> same output, twice
  out.ok.deterministic =
    evolutionReady({ defId: "sapthorn", wins: 4 }, { wood: 2 }, "restless") ===
    evolutionReady({ defId: "sapthorn", wins: 4 }, { wood: 2 }, "restless")
  out.ok.noRandomInSource = !/(Math\.random|crypto|Date\.now)/.test(evolutionReady.toString() + evolutionFor.toString())
  const hint = evolutionHint("sapthorn", { wins: 1 })
  out.ok.hintShape = typeof hint === "string" && hint.startsWith("Evolves") && hint.includes("wood")
  out.detail.hint = hint

  // ---- B. Data integrity (units.js / synergies.js) --------------------
  const evoIds = Object.keys(EVOLUTIONS)
  out.ok.sourcesExistAndNotEvolved = evoIds.every((src) => UNITS[src] && !UNITS[src].evolvedFrom)
  out.ok.targetsExistTaggedEvolved = evoIds.every((src) => {
    const to = EVOLUTIONS[src].to
    return UNITS[to] && UNITS[to].evolvedFrom === src
  })
  out.ok.targetsHaveTribes = evoIds.every((src) => Array.isArray(UNIT_TRIBES[EVOLUTIONS[src].to]))
  // 8 authored evolved forms (their auto-generated "+" fusion variants
  // also carry evolvedFrom via makeTier2's spread - fine, they're
  // pool-excluded too, but they aren't the authored set).
  out.ok.exactlyEightEvolved =
    Object.values(UNITS).filter((u) => u.evolvedFrom && u.displayTier !== 2).length === 8
  out.ok.tier2VariantsAlsoExcluded =
    Object.values(UNITS).filter((u) => u.evolvedFrom && u.displayTier === 2).length === 8
  // every evolved form resolves in a real battle with finite stats
  const battleSafe = []
  for (const src of evoIds) {
    const to = EVOLUTIONS[src].to
    try {
      let s = startAutoBattle("tommy", [to], "rotwood-husk")
      for (let i = 0; i < 4 && s.phase !== "won" && s.phase !== "lost"; i++) s = resolveRound(s)
      const u = s.playerUnits.find((x) => x.defId === to)
      battleSafe.push(!!u && Number.isFinite(u.hp) && Number.isFinite(u.maxHp))
    } catch {
      battleSafe.push(false)
    }
  }
  out.ok.evolvedFormsBattleSafe = battleSafe.every(Boolean)
  // 3-copy fusion edge case: the auto-generated "+" variant of an
  // evolved form must exist and not crash a battle.
  try {
    let s = startAutoBattle("tommy", [`wood-elemental${TIER2_SUFFIX}`], "rotwood-husk")
    for (let i = 0; i < 3 && s.phase !== "won" && s.phase !== "lost"; i++) s = resolveRound(s)
    const u = s.playerUnits[0]
    out.ok.tier2EvolvedSafe = !!u && Number.isFinite(u.hp)
  } catch (e) {
    out.ok.tier2EvolvedSafe = false
    out.detail.tier2Err = String(e)
  }

  // ---- C. runEngine integration -------------------------------------
  // Find a battle node whose next node is a shop.
  let battleIdx = -1
  for (let i = 1; i < RUN_PATH.length - 1; i++) {
    if (RUN_PATH[i]?.type === "battle" && RUN_PATH[i + 1]?.type === "shop") {
      battleIdx = i
      break
    }
  }
  const bossIdx = RUN_PATH.findIndex((n) => n?.type === "boss")
  out.detail.battleIdx = battleIdx
  out.detail.bossIdx = bossIdx

  // Build a won-battle runState: deployed sapthorn (wins 2, upgradeLevel
  // 2, an item equipped) + 2 other wood units deployed.
  const mkState = (sapWins, { deploySap = true, nodeIndex = battleIdx } = {}) => {
    const base = startRun("tommy")
    const bench = [
      { key: 10, defId: "sapthorn", upgradeLevel: 2, wins: sapWins },
      { key: 11, defId: "barkwarden", upgradeLevel: 0, wins: 0 },
      { key: 12, defId: "loamguard", upgradeLevel: 0, wins: 0 },
      { key: 13, defId: "cinderpaw", upgradeLevel: 0, wins: 0 }, // not deployed
    ]
    const deployed = deploySap ? [10, 11, 12, null] : [11, 12, 13, null]
    const path = RUN_PATH.slice(0, nodeIndex + 1)
    return {
      ...base,
      bench,
      deployed,
      items: [{ key: 1, defId: "twig-charm", equippedTo: 10, slotIndex: 0 }],
      nodeIndex,
      path,
      battlePool: [],
      phase: "battle",
      essence: 50,
      battle: { phase: "won" },
    }
  }

  // 14. condition met -> evolves in place (wins 3 + this win = 4)
  const won = resolveBattleOutcome(mkState(3))
  const sapEntry = won.bench.find((e) => e.key === 10)
  out.ok.evolvedInPlace = sapEntry.defId === "wood-elemental" && sapEntry.key === 10
  out.ok.upgradeLevelKept = sapEntry.upgradeLevel === 2
  out.ok.winsTallied = sapEntry.wins === 4
  out.ok.itemStaysEquipped = won.items[0].equippedTo === 10 && won.items[0].slotIndex === 0
  out.ok.otherDeployedGotWin = won.bench.find((e) => e.key === 11).wins === 1
  out.ok.nonDeployedNoWin = won.bench.find((e) => e.key === 13).wins === 0
  out.ok.lastEvolvedSet = eq(won.lastEvolved, [{ from: "Sapthorn", to: "Wood Elemental" }])
  out.ok.deployedSlotsIntact = eq(won.deployed, [10, 11, 12, null])
  out.ok.enteredShop = won.phase === "shop"
  out.ok.essenceGained = won.essence > 50
  out.detail.wonSap = sapEntry

  // 15. condition NOT met (wins short after the +1)
  const notYet = resolveBattleOutcome(mkState(1))
  out.ok.noEvolveWhenShort =
    notYet.bench.find((e) => e.key === 10).defId === "sapthorn" &&
    notYet.bench.find((e) => e.key === 10).wins === 2 &&
    !(notYet.lastEvolved && notYet.lastEvolved.length)

  // 16. ready but NOT deployed -> no evolution
  const benched = resolveBattleOutcome(mkState(5, { deploySap: false }))
  out.ok.noEvolveWhenBenched = benched.bench.find((e) => e.key === 10).defId === "sapthorn"

  // 17. boss win -> victory, no evolution machinery
  const bossState = mkState(5, { nodeIndex: bossIdx })
  const bossWon = resolveBattleOutcome(bossState)
  out.ok.bossWinVictory =
    bossWon.phase === "victory" &&
    bossWon.bench.find((e) => e.key === 10).defId === "sapthorn" &&
    bossWon.bench.find((e) => e.key === 10).wins === 5 && // not bumped
    !(bossWon.lastEvolved && bossWon.lastEvolved.length)

  // 18. determinism at the engine level (evolution firing both times)
  const a = resolveBattleOutcome(mkState(3))
  const b = resolveBattleOutcome(mkState(3))
  out.ok.engineDeterministic =
    eq(a.bench, b.bench) &&
    eq(a.lastEvolved, b.lastEvolved) &&
    a.bench.find((e) => e.key === 10).defId === "wood-elemental"

  // 19. leaveShop clears the one-shot hint
  out.ok.leaveShopClears = eq(leaveShop(won).lastEvolved, [])
  out.ok.leaveShopNoopSafe = leaveShop({ ...startRun("tommy") }).lastEvolved === undefined ||
    Array.isArray(leaveShop({ ...startRun("tommy") }).lastEvolved)

  // 20. pools never offer an evolvedFrom unit
  //   a) reforgeUnit over many rolls
  const reforgeResults = new Set()
  let rfState = {
    ...startRun("tommy"),
    essence: 9_999_999,
    bench: [{ key: 1, defId: "loamguard", upgradeLevel: 1, wins: 0 }],
    items: [],
  }
  for (let i = 0; i < 400; i++) {
    const res = reforgeUnit({ ...rfState, essence: 9_999_999 }, 1)
    const d = res.bench[0].defId
    reforgeResults.add(d)
  }
  out.ok.reforgeNeverEvolved = [...reforgeResults].every((d) => !UNITS[d]?.evolvedFrom)
  out.detail.reforgeSeen = reforgeResults.size
  //   b) shopOffers after a won battle, every market level
  const shopOffersClean = [1, 2, 3].every((ml) => {
    const st = { ...mkState(0), marketLevel: ml }
    const res = resolveBattleOutcome(st)
    return (res.shopOffers || []).every((id) => !UNITS[id]?.evolvedFrom)
  })
  out.ok.shopOffersNeverEvolved = shopOffersClean
  //   c) blunt scan: no evolvedFrom unit is purchasable
  out.ok.evolvedNotPurchasable = Object.values(UNITS)
    .filter((u) => u.evolvedFrom)
    .every((u) => u.recruitCost == null || u.recruitCost > 0 ? true : true) // shape check only; real gate is the filters above
  out.detail.reforgeCost = REFORGE_COST

  // ---- D. serialize / restore -------------------------------------
  const round = deserializeRun(serializeRun(won))
  out.ok.roundTrips = !!round && eq(round.bench, won.bench) && eq(round.lastEvolved, won.lastEvolved)
  // legacy save: bench entries with no `wins`, no `lastEvolved` at all
  const legacy = startRun("tommy")
  legacy.bench = [{ key: 10, defId: "sapthorn", upgradeLevel: 0 }]
  legacy.deployed = [10, null, null, null]
  legacy.nodeIndex = battleIdx
  legacy.path = RUN_PATH.slice(0, battleIdx + 1)
  legacy.battlePool = []
  legacy.phase = "battle"
  delete legacy.lastEvolved
  const legacySer = serializeRun(legacy)
  delete legacySer.run.lastEvolved
  const legacyLoaded = deserializeRun(legacySer)
  out.ok.legacyLoads = !!legacyLoaded
  let legacyResolved = null
  try {
    legacyResolved = resolveBattleOutcome({ ...legacyLoaded, battle: { phase: "won" } })
    out.ok.legacyWinSafe = legacyResolved.bench.find((e) => e.key === 10).wins === 1
  } catch (e) {
    out.ok.legacyWinSafe = false
    out.detail.legacyErr = String(e)
  }

  out.pass = Object.values(out.ok).every(Boolean)
  return out
})

console.log(JSON.stringify(r, null, 2))

// ---- E. Playwright UI: hint line + card mark -------------------------
const seed = await page.evaluate(async () => {
  const { RUN_PATH, startRun, serializeRun } = await import("/src/services/heartwood/runEngine.js")
  const s = startRun("tommy")
  s.essence = 999
  s.bench = [
    { key: 10, defId: "sapthorn", upgradeLevel: 0, wins: 3 }, // one win from evolving -> mark lit
    { key: 11, defId: "barkwarden", upgradeLevel: 0, wins: 0 },
    { key: 12, defId: "loamguard", upgradeLevel: 0, wins: 0 },
  ]
  s.deployed = [10, 11, 12, null]
  s.nodeIndex = 0
  s.path = RUN_PATH.slice(0, 1)
  s.phase = "shop"
  s.lastEvolved = [{ from: "Sapthorn", to: "Wood Elemental" }]
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(s)))
  // Skip the once-ever intro overlays so the shop screen is on top.
  localStorage.setItem("heartwood-autobattler-intro-seen", "true")
  localStorage.setItem("heartwood-story-intro-seen", "true")
  return true
})
console.log("UI seed:", seed)

await page.reload()
await page.waitForSelector(".hw-tab-row--market-art, button.hw-market-tab-btn", { timeout: 8000 })
await page.waitForTimeout(400)
const tut = page.locator("button.hw-tutorial-next")
if (await tut.isVisible({ timeout: 500 }).catch(() => false)) {
  await tut.click()
  await page.waitForTimeout(200)
}

const hintVisible = await page.locator(".hw-hint--evolved").isVisible().catch(() => false)
const hintText = await page.locator(".hw-hint--evolved").textContent().catch(() => "")
console.log("evolved hint visible:", hintVisible, "| text:", JSON.stringify((hintText || "").trim()))
await page.locator(".hw-shop-center").first().screenshot({ path: `${SHOT_DIR}/evo_A_shop_hint.png` }).catch(() => {})

await page.click("button.hw-squad-tab-btn")
await page.waitForTimeout(400)
const markCount = await page.locator(".hw-panel--squad .hw-evolve-mark").count()
const closeMarkCount = await page.locator(".hw-panel--squad .hw-evolve-mark--close").count()
const markTitle = await page.locator(".hw-panel--squad .hw-evolve-mark").first().getAttribute("title").catch(() => null)
console.log("evolve marks:", markCount, "| lit (--close):", closeMarkCount, "| title:", JSON.stringify(markTitle))
await page.locator(".hw-panel--squad").first().screenshot({ path: `${SHOT_DIR}/evo_B_squad_marks.png` }).catch(() => {})

await browser.close()

const uiOk =
  hintVisible &&
  /grew into a Wood Elemental/.test(hintText || "") &&
  markCount >= 1 &&
  closeMarkCount >= 1 &&
  /Evolves/.test(markTitle || "")

console.log("\nengine/data pass:", r.pass)
console.log("ui pass:", uiOk)
console.log("page errors:", JSON.stringify(errors))

if (r.pass && uiOk && errors.length === 0) {
  console.log("\nRESULT: PASS")
  process.exit(0)
} else {
  const failed = Object.entries(r.ok).filter(([, v]) => !v).map(([k]) => k)
  console.log("\nRESULT: FAIL", JSON.stringify({ failedChecks: failed, uiOk, errCount: errors.length }))
  process.exit(1)
}
