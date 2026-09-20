import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

const PORT = process.env.PORT || 5324
const SHOT_DIR = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-hw-boons/.scratch/shots"
await mkdir(SHOT_DIR, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
await page.waitForTimeout(400)

// --- Engine assertions (run in page context so imports resolve) -------
const engine = await page.evaluate(async () => {
  const t = Date.now()
  const eng = await import("/src/services/heartwood/runEngine.js?t=" + t)
  const boons = await import("/src/data/heartwood/boons.js?t=" + t)
  const { EVENTS } = await import("/src/data/heartwood/events.js?t=" + t)
  const out = {}

  // 1. every wired boon/bane id in events resolves to a real modifier
  const wired = new Set()
  for (const ev of EVENTS) for (const c of ev.choices || []) for (const e of c.effects || []) {
    if (e.boon) wired.add(e.boon)
    if (e.bane) wired.add(e.bane)
  }
  out.wiredIds = [...wired].sort()
  out.unknownWired = [...wired].filter((id) => !boons.runModifierById(id))
  out.allDefIds = [...boons.RUN_BOONS, ...boons.RUN_BANES].map((m) => m.id).sort()
  out.unwiredDefs = out.allDefIds.filter((id) => !wired.has(id))

  // 2. applying a boon puts it on runState.runModifiers and it survives advance
  let rs = eng.startRun("tommy")
  out.freshRunModifiers = rs.runModifiers
  // Directly exercise the event-effect path via resolveEventChoice: force
  // an event node. Instead, simulate what applyEventEffect does through
  // the public resolveEventChoice by walking to the first event node.
  // Simpler + deterministic: call the internal path via a crafted state.
  rs = { ...rs, phase: "event", nodeIndex: 11, path: rs.path.concat(Array(11).fill({ type: "shop" })) }
  // node 11 in RUN_PATH is an event; eventForNode is deterministic
  const ev = eng.eventForNode(rs)
  out.eventAtNode11 = ev?.id
  // pick whichever choice grants a boon/bane if any; else choice 0
  let choiceIdx = 0
  ev.choices.forEach((c, i) => { if ((c.effects || []).some((e) => e.boon || e.bane)) choiceIdx = i })
  const hasModChoice = (ev.choices[choiceIdx].effects || []).some((e) => e.boon || e.bane)
  out.node11HasModChoice = hasModChoice
  const after = eng.resolveEventChoice(rs, choiceIdx)
  out.runModifiersAfterChoice = after.runModifiers

  // 3. a modifier's effects reach the battle pending-effects channel
  const withMod = { ...eng.startRun("tommy"), runModifiers: ["hollow-marked", "rootblessed"] }
  out.expandedEffects = boons.expandRunModifierEffects(withMod.runModifiers)
  out.winPct = boons.runModifierWinPct(withMod.runModifiers)

  // 4. essenceForWin scales by essenceWinPct
  const baseRun = eng.startRun("tommy")
  const plainWin = eng.essenceForWin(baseRun, { type: "battle" })
  const markedWin = eng.essenceForWin({ ...baseRun, runModifiers: ["hollow-marked"] }, { type: "battle" })
  out.plainWin = plainWin
  out.markedWin = markedWin
  out.markedIsBigger = markedWin === Math.round(plainWin * 1.3)

  // 5. save/restore round-trips runModifiers, and an OLD save w/o the
  //    field still deserializes (all reads default it)
  const ser = eng.serializeRun({ ...withMod })
  const de = eng.deserializeRun(ser)
  out.roundTrip = de?.runModifiers
  const legacy = eng.serializeRun(withMod)
  delete legacy.run.runModifiers
  const deLegacy = eng.deserializeRun(legacy)
  out.legacyLoads = !!deLegacy && deLegacy.runModifiers === undefined
  out.legacyExpandOk = boons.expandRunModifierEffects(deLegacy?.runModifiers).length === 0

  // 6. unknown / duplicate ids are ignored, never crash
  const dupState = eng.resolveEventChoice(
    { ...eng.startRun("tommy"), phase: "event", nodeIndex: 11, runModifiers: ["rootblessed"],
      path: eng.startRun("tommy").path.concat(Array(11).fill({ type: "shop" })) },
    choiceIdx,
  )
  out.noDupCrash = Array.isArray(dupState.runModifiers)

  return out
}, )

console.log(JSON.stringify(engine, null, 2))

// --- DOM: the strip renders active modifiers --------------------------
await page.evaluate(async () => {
  const t = Date.now()
  const eng = await import("/src/services/heartwood/runEngine.js?t=" + t)
  let rs = eng.startRun("tommy")
  rs = { ...rs, runModifiers: ["rootblessed", "hollow-marked"] }
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(eng.serializeRun(rs)))
})
await page.reload()
await page.waitForTimeout(600)
const tutorialNext = page.locator("button.hw-tutorial-next")
if (await tutorialNext.isVisible({ timeout: 500 }).catch(() => false)) { await tutorialNext.click(); await page.waitForTimeout(200) }

const stripCount = await page.locator(".hw-runmod").count()
const stripNames = await page.locator(".hw-runmod-name").allTextContents()
const boonPills = await page.locator('.hw-runmod[data-kind="boon"]').count()
const banePills = await page.locator('.hw-runmod[data-kind="bane"]').count()
console.log("strip pills:", stripCount, stripNames, "boon:", boonPills, "bane:", banePills)
const stripEl = page.locator(".hw-runmods").first()
if (await stripEl.count()) await stripEl.screenshot({ path: `${SHOT_DIR}/run_modifier_strip.png` })

const pass =
  engine.unknownWired.length === 0 &&
  engine.unwiredDefs.length === 0 &&
  Array.isArray(engine.freshRunModifiers) && engine.freshRunModifiers.length === 0 &&
  engine.node11HasModChoice &&
  engine.runModifiersAfterChoice.length === 1 &&
  engine.expandedEffects.length >= 2 &&
  Math.abs(engine.winPct - 0.3) < 1e-9 &&
  engine.markedIsBigger &&
  Array.isArray(engine.roundTrip) && engine.roundTrip.length === 2 &&
  engine.legacyLoads && engine.legacyExpandOk &&
  engine.noDupCrash &&
  stripCount === 2 && boonPills === 1 && banePills === 1 &&
  errors.length === 0

console.log("errors:", JSON.stringify(errors))
console.log(pass ? "RESULT: PASS" : "RESULT: FAIL")
await browser.close()
process.exit(pass ? 0 : 1)
