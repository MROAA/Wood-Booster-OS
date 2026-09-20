import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

const PORT = process.env.PORT || 5330
const SHOT_DIR = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-hw-roster/.scratch/shots"
await mkdir(SHOT_DIR, { recursive: true })

const NEW_UNITS = ["barkwarden","sapthorn","cinderpaw","ashmaw","tidewarden","brinecaller","stoneward","cairnfist","galeblade","windveil","shadefang","starcaller"]
const NEW_RELICS = ["emberveil-charm","stoneblood-totem","tideworn-band","windstep-standard","starlit-standard","stormgrove-charm"]
const NEW_ITEMS = ["emberflow-oil","tidestone-band","galeheart-charm","voidfang-edge","starbound-shard","wardknot-charm"]

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()) })
await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
await page.waitForTimeout(400)

const eng = await page.evaluate(async ({ NEW_UNITS, NEW_RELICS, NEW_ITEMS }) => {
  const t = Date.now()
  const U = await import("/src/data/heartwood/units.js?t=" + t)
  const S = await import("/src/data/heartwood/synergies.js?t=" + t)
  const R = await import("/src/data/heartwood/relics.js?t=" + t)
  const I = await import("/src/data/heartwood/items.js?t=" + t)
  const AB = await import("/src/services/heartwood/autoBattleEngine.js?t=" + t)
  const out = {}

  // 1. every new unit exists, has a tribe, and auto-generated a + variant
  out.unitsExist = NEW_UNITS.filter((id) => !U.UNITS[id])
  out.unitsMissingTribe = NEW_UNITS.filter((id) => !(S.UNIT_TRIBES[id] && S.UNIT_TRIBES[id].length))
  out.unitsMissingFusion = NEW_UNITS.filter((id) => !U.UNITS[`${id}${U.TIER2_SUFFIX}`])
  out.tribesUnknown = []
  for (const id of NEW_UNITS) for (const tr of (S.UNIT_TRIBES[id] || [])) if (!S.TRIBES[tr]) out.tribesUnknown.push(`${id}:${tr}`)

  // 2. every elemental tribe now has >= 7 recruitable units
  const elemental = ["wood", "ember", "tide", "gale", "stone", "shadow", "cosmic"]
  const counts = Object.fromEntries(elemental.map((e) => [e, 0]))
  for (const [uid, tribes] of Object.entries(S.UNIT_TRIBES)) {
    const def = U.UNITS[uid]
    if (!def || def.fusedFrom || def.summonOnly) continue
    for (const tr of tribes) if (tr in counts) counts[tr]++
  }
  out.elementalCounts = counts
  out.elementalThin = elemental.filter((e) => counts[e] < 7)

  // 3. relics + items resolve and their effects are well-formed objects
  out.relicsExist = NEW_RELICS.filter((id) => !R.RELICS[id])
  out.relicTiers = Object.fromEntries(NEW_RELICS.map((id) => [id, R.RELICS[id]?.tier]))
  out.relicsBadEffects = NEW_RELICS.filter((id) => !Array.isArray(R.RELICS[id]?.effects) || !R.RELICS[id].effects.length)
  out.itemsExist = NEW_ITEMS.filter((id) => !I.ITEMS[id])
  out.itemTiers = Object.fromEntries(NEW_ITEMS.map((id) => [id, I.ITEMS[id]?.tier]))
  out.itemsBadEffects = NEW_ITEMS.filter((id) => !Array.isArray(I.ITEMS[id]?.effects) || !I.ITEMS[id].effects.length)

  // 4. a squad of ONLY new units + a new relic survives a full auto battle
  const deployed = NEW_UNITS.slice(0, 4).map((id) => ({ defId: id, upgradeLevel: 0, itemIds: [] }))
  deployed[0].itemIds = ["starbound-shard"]
  let crashed = null
  try {
    let battle = AB.startAutoBattle("tommy", deployed, "mist-growler-pack", ["emberveil-charm", "starlit-standard"], 0, {}, [], [], 1.4, null)
    battle = AB.autoResolveBattle(battle)
    out.battlePhase = battle.phase
  } catch (e) {
    crashed = String(e)
  }
  out.battleCrash = crashed

  // 5. fusion of a new unit: recruit 3 copies via the real path -> 1 tier2
  const E = await import("/src/services/heartwood/runEngine.js?t=" + t)
  let fr = { ...E.startRun("tommy"), essence: 99999 }
  for (let i = 0; i < 3; i++) {
    fr = { ...fr, shopOffers: ["cinderpaw"] }
    fr = E.recruitUnit(fr, "cinderpaw")
  }
  out.fuseTest = fr.bench.filter((e) => e.defId === `cinderpaw${U.TIER2_SUFFIX}`).length
  out.fuseBaseGone = fr.bench.filter((e) => e.defId === "cinderpaw").length

  return out
}, { NEW_UNITS, NEW_RELICS, NEW_ITEMS })
console.log(JSON.stringify(eng, null, 2))

// --- DOM: a new unit shows in the shop with a glyph fallback ----------
await page.evaluate(async () => {
  const t = Date.now()
  const E = await import("/src/services/heartwood/runEngine.js?t=" + t)
  let rs = E.startRun("tommy")
  rs = { ...rs, essence: 999, shopOffers: ["barkwarden", "cinderpaw", "starcaller"], marketLevel: 3, shopOffers2: undefined }
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(E.serializeRun(rs)))
  localStorage.setItem("heartwood-story-intro-seen", "true")
})
await page.reload()
await page.waitForTimeout(900)
const tn = page.locator("button.hw-tutorial-next")
if (await tn.isVisible({ timeout: 500 }).catch(() => false)) { await tn.click(); await page.waitForTimeout(200) }
const cardCount = await page.locator(".hw-card-name").filter({ hasText: /Barkwarden|Cinderpaw|Starcaller/ }).count()
await page.screenshot({ path: `${SHOT_DIR}/roster_shop.png` })
console.log("new unit cards in shop:", cardCount)

const pass =
  eng.unitsExist.length === 0 && eng.unitsMissingTribe.length === 0 &&
  eng.unitsMissingFusion.length === 0 && eng.tribesUnknown.length === 0 &&
  eng.elementalThin.length === 0 &&
  eng.relicsExist.length === 0 && eng.relicsBadEffects.length === 0 &&
  eng.itemsExist.length === 0 && eng.itemsBadEffects.length === 0 &&
  eng.battleCrash === null && ["won", "lost"].includes(eng.battlePhase) &&
  eng.fuseTest === 1 &&
  cardCount >= 3 &&
  errors.length === 0

console.log("errors:", JSON.stringify(errors))
console.log(pass ? "RESULT: PASS" : "RESULT: FAIL")
await browser.close()
process.exit(pass ? 0 : 1)
