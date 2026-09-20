import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

// Hearthwood - The Almanac. Marc: "kehitetään peliä lisää" -> meta hook
// -> "Almanakka". A lifetime discovery collection (units/enemies/relics/
// events) that reveals lore on first encounter. runState.seen (additive,
// no RUN_SAVE_VERSION bump) is unioned into meta.almanac on run end.
// 100% inert for combat / the fairness bot.

const PORT = process.env.PORT || 5338
const ROOT = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-almanac"
const SHOT_DIR = `${ROOT}/.scratch/shots`
await mkdir(SHOT_DIR, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1536, height: 864 } })
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text())
})

await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForTimeout(500)

const r = await page.evaluate(async () => {
  const {
    startRun,
    recruitUnit,
    rerollShop,
    startFormationBattle,
    chooseRelic,
    resolveEventChoice,
    eventForNode,
    serializeRun,
    deserializeRun,
    RUN_PATH,
  } = await import("/src/services/heartwood/runEngine.js")
  const { loadMeta } = await import("/src/services/heartwood/metaState.js")
  const {
    ALMANAC_CATEGORIES,
    almanacIds,
    almanacEntry,
    almanacCounts,
    recordAlmanac,
    ALMANAC_LORE,
  } = await import("/src/data/heartwood/almanac.js")

  const out = { ok: {}, detail: {} }
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b)

  // ---- seen scaffolding ------------------------------------------
  const fresh = startRun("tommy")
  out.ok.freshSeenEmpty =
    eq(fresh.seen, { units: [], enemies: [], relics: [], events: [] })

  // recruit -> units
  const rec = recruitUnit({ ...fresh, essence: 9999 }, fresh.shopOffers[0])
  out.ok.recruitMarksUnit = rec.seen.units.includes(fresh.shopOffers[0])
  // 3rd copy -> the "+" id joins
  let three = { ...fresh, essence: 9_999_999 }
  const id = fresh.shopOffers[0]
  three = recruitUnit(three, id)
  three = rerollShop({ ...three, rerollCost: 50, shopOffers: [id, ...three.shopOffers] })
  three = recruitUnit({ ...three, shopOffers: [id] }, id)
  three = rerollShop({ ...three, rerollCost: 50, shopOffers: [id] })
  three = recruitUnit({ ...three, shopOffers: [id] }, id)
  out.ok.fusionMarksPlus = three.seen.units.some((u) => u.endsWith("+"))
  out.detail.seenUnitsAfterFuse = three.seen.units

  // start a battle -> enemies
  let battleIdx = -1
  for (let i = 1; i < RUN_PATH.length; i++) {
    if (RUN_PATH[i]?.type === "battle") { battleIdx = i; break }
  }
  const atBattle = {
    ...fresh,
    nodeIndex: battleIdx,
    path: RUN_PATH.slice(0, battleIdx + 1),
    phase: "formation",
  }
  const started = startFormationBattle(atBattle)
  out.ok.battleMarksEnemies =
    started.seen.enemies.length > 0 &&
    started.battle.enemies.every((e) => started.seen.enemies.includes(e.defId))
  out.detail.seenEnemies = started.seen.enemies

  // chooseRelic
  const relicRs = { ...fresh, phase: "relic", nodeIndex: 5, path: RUN_PATH.slice(0, 6), essence: 9999, relics: [] }
  const someRelic = "ember-core"
  const took = chooseRelic({ ...relicRs, relicOffers: [someRelic] }, someRelic)
  out.ok.relicMarks = took.seen.relics.includes(someRelic)
  const skipped = chooseRelic(relicRs, null)
  out.ok.relicSkipUnchanged = eq(skipped.seen.relics, relicRs.seen.relics)

  // event
  let eventIdx = RUN_PATH.findIndex((n) => n?.type === "event")
  if (eventIdx < 0) eventIdx = 11
  const evRs = { ...fresh, phase: "event", nodeIndex: eventIdx, path: RUN_PATH.slice(0, eventIdx + 1) }
  const ev = eventForNode(evRs)
  const resolved = resolveEventChoice(evRs, 0)
  out.ok.eventMarks = !!ev && resolved.seen.events.includes(ev.id)
  out.detail.eventId = ev?.id

  // legacy run object with no `seen`
  const legacy = { ...fresh }
  delete legacy.seen
  let legacyOk = true
  try {
    recruitUnit({ ...legacy, essence: 9999 }, legacy.shopOffers[0])
    startFormationBattle({ ...legacy, nodeIndex: battleIdx, path: RUN_PATH.slice(0, battleIdx + 1), phase: "formation" })
    chooseRelic({ ...legacy, phase: "relic", essence: 9999, relics: [], relicOffers: ["ember-core"] }, "ember-core")
  } catch (e) {
    legacyOk = false
    out.detail.legacyErr = String(e)
  }
  out.ok.legacyNoSeenSafe = legacyOk

  // ---- recordAlmanac -------------------------------------------
  const seed = { units: ["the-fool", "sapthorn"], enemies: ["rotwood-husk"], relics: ["ember-core"], events: [] }
  const m0 = { acorns: 5, chosenPerks: ["x"], almanac: { units: [], enemies: [], relics: [], events: [] } }
  const m1 = recordAlmanac(m0, seed)
  out.ok.recordUnions =
    m1.almanac.units.length === 2 && m1.almanac.enemies[0] === "rotwood-husk" && m1.acorns === 5 && m1.chosenPerks[0] === "x"
  const m2 = recordAlmanac(m1, seed)
  out.ok.recordIdempotent = eq(m2.almanac, m1.almanac)
  const m3 = recordAlmanac(m1, { units: ["barkwarden", "the-fool"], enemies: [], relics: [], events: [] })
  out.ok.recordMergesNoDupes = m3.almanac.units.length === 3
  out.ok.recordNoSeenNoop = recordAlmanac(m0, undefined) === m0

  // ---- almanacEntry / counts --------------------------------
  const be = almanacEntry("enemies", "spacemonkey")
  out.ok.entryAuthoredWins = be.lore === ALMANAC_LORE["spacemonkey"] && !!be.name && !!be.sub
  const fe = almanacEntry("enemies", "rotwood-husk")
  out.ok.entryFallsBackToDescription = typeof fe.lore === "string" && fe.lore.length > 10 && fe.lore !== be.lore
  const ue = almanacEntry("units", "the-fool")
  out.ok.entryUnitHasSub = !!ue.sub && !!ue.name
  const unknown = almanacEntry("units", "no-such-id")
  out.ok.entryUnknownGraceful = !!unknown.lore && unknown.name === "no-such-id"

  const counts = almanacCounts({ almanac: { units: ["the-fool"], enemies: [], relics: [], events: [] } })
  out.ok.countsShape =
    ALMANAC_CATEGORIES.every((c) => Number.isInteger(counts[c.key].total) && counts[c.key].total > 0) &&
    counts.units.seen === 1 &&
    counts.overall.total === ALMANAC_CATEGORIES.reduce((s, c) => s + c.total, 0) &&
    counts.overall.seen === 1
  const emptyCounts = almanacCounts({})
  out.ok.countsEmpty = emptyCounts.overall.seen === 0 && emptyCounts.overall.total > 0
  out.detail.counts = { overallTotal: counts.overall.total, cats: ALMANAC_CATEGORIES.map((c) => [c.key, c.total]) }

  // a stale id in the store isn't counted
  const stale = almanacCounts({ almanac: { units: ["ghost-unit-xyz"], enemies: [], relics: [], events: [] } })
  out.ok.staleIdNotCounted = stale.units.seen === 0

  // ---- persistence -----------------------------------------
  const withSeen = { ...fresh, seen: { units: ["the-fool"], enemies: ["moss-troll"], relics: [], events: ["roadside-shrine"] } }
  const round = deserializeRun(serializeRun(withSeen))
  out.ok.seenRoundTrips = eq(round.seen, withSeen.seen)
  out.ok.loadMetaNoAlmanacSafe = (() => {
    const m = loadMeta() // real store; may or may not have almanac - just assert shape
    return m.almanac && Array.isArray(m.almanac.units) && Array.isArray(m.almanac.events)
  })()

  // no RNG in the pure resolvers
  out.ok.noRng = !/(Math\.random|Date\.now|crypto)/.test(
    recordAlmanac.toString() + almanacCounts.toString() + almanacEntry.toString(),
  )

  out.pass = Object.values(out.ok).every(Boolean)
  return out
})

console.log(JSON.stringify(r, null, 2))

// ---- UI --------------------------------------------------------
await page.evaluate(async () => {
  const { loadMeta, saveMeta } = await import("/src/services/heartwood/metaState.js")
  const m = loadMeta()
  m.almanac = {
    units: ["the-fool", "sapthorn"],
    enemies: ["spacemonkey", "rotwood-husk"],
    relics: ["ember-core"],
    events: ["roadside-shrine"],
  }
  saveMeta(m)
})
await page.reload()
await page.waitForSelector(".hw-almanac-open-btn", { timeout: 8000 })
await page.waitForTimeout(300)
const openLabel = (await page.locator(".hw-almanac-open-btn").textContent())?.trim()
console.log("open button:", JSON.stringify(openLabel))
await page.click(".hw-almanac-open-btn")
await page.waitForSelector(".hw-almanac-screen", { timeout: 5000 })
await page.waitForTimeout(300)

const tabCount = await page.locator(".hw-almanac-tab").count()
const tiles = await page.locator(".hw-almanac-tile").count()
const locked = await page.locator(".hw-almanac-tile[data-locked]").count()
const unlocked = tiles - locked
console.log("tabs:", tabCount, "| tiles:", tiles, "| unlocked:", unlocked, "| locked:", locked)

// click an unlocked tile -> detail lore
const firstUnlocked = page.locator('.hw-almanac-tile:not([data-locked])').first()
await firstUnlocked.click()
await page.waitForTimeout(250)
const loreText = (await page.locator(".hw-almanac-detail-lore").textContent().catch(() => ""))?.trim()
console.log("detail lore length:", (loreText || "").length)
await page.locator(".hw-almanac-screen").screenshot({ path: `${SHOT_DIR}/almanac_A_units.png` }).catch(() => {})

// switch to enemies tab, open spacemonkey (authored lore)
await page.locator(".hw-almanac-tab", { hasText: "The Wood's Own" }).click()
await page.waitForTimeout(250)
const enemyUnlocked = await page.locator('.hw-almanac-tile:not([data-locked])').count()
await page.locator('.hw-almanac-tile:not([data-locked])').first().click()
await page.waitForTimeout(200)
const enemyLore = (await page.locator(".hw-almanac-detail-lore").textContent().catch(() => ""))?.trim()
console.log("enemies unlocked:", enemyUnlocked, "| enemy lore length:", (enemyLore || "").length)
await page.locator(".hw-almanac-screen").screenshot({ path: `${SHOT_DIR}/almanac_B_enemies.png` }).catch(() => {})

// back
await page.click(".hw-almanac-screen .hw-exit-link")
await page.waitForTimeout(250)
const backOk = await page.locator(".hw-almanac-open-btn").isVisible().catch(() => false)

const noHScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
await browser.close()

const uiOk =
  /\d+\/\d+/.test(openLabel || "") &&
  tabCount === 4 &&
  tiles > 20 &&
  unlocked >= 2 &&
  (loreText || "").length > 20 &&
  enemyUnlocked >= 2 &&
  (enemyLore || "").length > 20 &&
  backOk &&
  noHScroll

console.log("\nengine/data pass:", r.pass)
console.log("ui pass:", uiOk, "| noHScroll:", noHScroll)
console.log("page errors:", JSON.stringify(errors))

if (r.pass && uiOk && errors.length === 0) {
  console.log("\nRESULT: PASS")
  process.exit(0)
} else {
  const failed = Object.entries(r.ok).filter(([, v]) => !v).map(([k]) => k)
  console.log("\nRESULT: FAIL", JSON.stringify({ failedChecks: failed, uiOk, errCount: errors.length }))
  process.exit(1)
}
