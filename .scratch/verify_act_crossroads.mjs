import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

const PORT = process.env.PORT || 5325
const SHOT_DIR = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-hw-crossroads/.scratch/shots"
await mkdir(SHOT_DIR, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
await page.waitForTimeout(400)

const eng = await page.evaluate(async () => {
  const t = Date.now()
  const E = await import("/src/services/heartwood/runEngine.js?t=" + t)
  const B = await import("/src/data/heartwood/boons.js?t=" + t)
  const C = await import("/src/data/heartwood/crossroads.js?t=" + t)
  const out = {}

  // fresh run defaults
  const rs0 = E.startRun("tommy")
  out.defaults = { forestState: rs0.forestState, lastSeenAct: rs0.lastSeenAct, allegiances: rs0.allegiances }

  // every crossroads choice's allegiance id resolves to a real modifier
  const bad = []
  for (const [act, cr] of Object.entries(C.ACT_CROSSROADS)) {
    for (const ch of cr.choices) {
      if (!B.runModifierById(ch.allegiance)) bad.push(`${act}:${ch.id}:${ch.allegiance}`)
    }
  }
  out.unknownAllegiances = bad
  out.allegianceCount = B.ACT_ALLEGIANCES.length

  // resolve act 2 "purify"
  const a2 = E.resolveActCrossroads(rs0, 2, "purify")
  out.a2 = {
    allegiance2: a2.allegiances[2],
    forestState: a2.forestState,
    hasRunMod: (a2.runModifiers || []).includes("rite-purified"),
    flag: !!a2.storyFlags.rite_purified,
    lastSeenAct: a2.lastSeenAct,
    nodeUntouched: a2.nodeIndex === rs0.nodeIndex && a2.phase === rs0.phase,
  }
  out.a2Effects = B.expandRunModifierEffects(a2.runModifiers)

  // resolving twice / a dup allegiance doesn't double-add
  const a2again = E.resolveActCrossroads(a2, 2, "purify")
  out.noDup = (a2again.runModifiers || []).filter((x) => x === "rite-purified").length === 1

  // unknown act -> no-op that still bumps lastSeenAct
  const a6 = E.resolveActCrossroads({ ...rs0, lastSeenAct: 5 }, 6, "whatever")
  out.a6 = { lastSeenAct: a6.lastSeenAct, sameRunMods: (a6.runModifiers || []).length === 0 }

  // markActSeen
  out.marked = E.markActSeen(rs0, 3).lastSeenAct

  // essence % from an allegiance that carries one (rite-untouched +10%)
  const base = E.essenceForWin(rs0, { type: "battle" })
  const withPct = E.essenceForWin({ ...rs0, runModifiers: ["rite-untouched"] }, { type: "battle" })
  out.essence = { base, withPct, ok: withPct === Math.round(base * 1.1) }

  // save/restore round-trips the new fields; legacy save w/o them loads
  const ser = E.serializeRun(a2)
  const de = E.deserializeRun(ser)
  out.roundTrip = {
    allegiances: de?.allegiances?.[2],
    forestState: de?.forestState,
    lastSeenAct: de?.lastSeenAct,
  }
  const legacy = E.serializeRun(a2)
  delete legacy.run.allegiances
  delete legacy.run.forestState
  delete legacy.run.lastSeenAct
  const deLegacy = E.deserializeRun(legacy)
  out.legacyLoads = !!deLegacy

  return out
})
console.log(JSON.stringify(eng, null, 2))

// --- DOM: the interstitial fires when the run enters Act II ----------
await page.evaluate(async () => {
  const t = Date.now()
  const E = await import("/src/services/heartwood/runEngine.js?t=" + t)
  let rs = E.startRun("tommy")
  // Park the run at a shop node well inside Act II, still on lastSeenAct 1.
  rs = { ...rs, phase: "shop", nodeIndex: 20, lastSeenAct: 1, essence: 400,
    path: rs.path.concat(Array(20).fill({ type: "shop" })) }
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(E.serializeRun(rs)))
})
await page.reload()
await page.waitForTimeout(900)
const tn = page.locator("button.hw-tutorial-next")
if (await tn.isVisible({ timeout: 500 }).catch(() => false)) { await tn.click(); await page.waitForTimeout(200) }

const screenVisible = await page.locator('[data-screen="act-transition"]').isVisible().catch(() => false)
const kicker = await page.locator(".hw-act-transition-kicker").textContent().catch(() => null)
const optionCount = await page.locator(".hw-act-transition-option").count()
await page.screenshot({ path: `${SHOT_DIR}/act_transition.png` })
console.log("interstitial visible:", screenVisible, "| kicker:", kicker, "| options:", optionCount)

// pick the first option -> result -> continue
await page.locator(".hw-act-transition-option").first().click()
await page.waitForTimeout(300)
const resultShown = await page.locator(".hw-act-transition-result").isVisible().catch(() => false)
const worldLine = await page.locator(".hw-act-transition-world").textContent().catch(() => null)
await page.screenshot({ path: `${SHOT_DIR}/act_transition_result.png` })
await page.locator(".hw-end-turn").first().click()
await page.waitForTimeout(500)

const screenGone = !(await page.locator('[data-screen="act-transition"]').isVisible().catch(() => false))
const allegiancePill = await page.locator('.hw-runmod[data-kind="allegiance"]').count()
const savedState = await page.evaluate(() => {
  const raw = localStorage.getItem("heartwood-run-save-v1")
  const r = raw ? JSON.parse(raw).run : null
  return r ? { allegiances: r.allegiances, forestState: r.forestState, lastSeenAct: r.lastSeenAct, runModifiers: r.runModifiers } : null
})
console.log("result shown:", resultShown, "| world line:", worldLine?.trim())
console.log("screen gone after continue:", screenGone, "| allegiance pills:", allegiancePill)
console.log("saved run state:", JSON.stringify(savedState))

const pass =
  eng.defaults.forestState === "restless" && eng.defaults.lastSeenAct === 1 &&
  eng.unknownAllegiances.length === 0 && eng.allegianceCount === 10 &&
  eng.a2.allegiance2 === "purify" && eng.a2.forestState === "purified" &&
  eng.a2.hasRunMod && eng.a2.flag && eng.a2.lastSeenAct === 2 && eng.a2.nodeUntouched &&
  eng.a2Effects.length >= 1 && eng.noDup &&
  eng.a6.lastSeenAct === 6 && eng.a6.sameRunMods &&
  eng.marked === 3 && eng.essence.ok &&
  eng.roundTrip.allegiances === "purify" && eng.roundTrip.forestState === "purified" && eng.roundTrip.lastSeenAct === 2 &&
  eng.legacyLoads &&
  screenVisible && optionCount >= 2 && resultShown && screenGone &&
  allegiancePill >= 1 &&
  savedState && savedState.allegiances && Object.keys(savedState.allegiances).length === 1 &&
  savedState.forestState !== "restless" &&
  errors.length === 0

console.log("errors:", JSON.stringify(errors))
console.log(pass ? "RESULT: PASS" : "RESULT: FAIL")
await browser.close()
process.exit(pass ? 0 : 1)
