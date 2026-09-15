// PR4 verify: cross-tribe COMBO_SYNERGIES and formation/positional
// POSITION_SYNERGIES - data shape, resolvers, and the engine actually
// applying them.  PORT env, needs a dev server.
import { chromium } from "playwright"

const PORT = process.env.PORT || 5313
const browser = await chromium.launch({ args: ["--no-sandbox"] })
const page = await (await browser.newContext()).newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()) })
await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
await page.waitForSelector(".hw-commander-card", { timeout: 15000 })

const out = await page.evaluate(async () => {
  const t = Date.now()
  const { COMBO_SYNERGIES, POSITION_SYNERGIES, resolveComboSynergies, resolvePositionSynergies, activePositionSlots } =
    await import("/src/data/heartwood/synergies.js?t=" + t)
  const { startAutoBattle, resolveRound } = await import("/src/services/heartwood/autoBattleEngine.js?t=" + t)
  const r = {}

  // 1. Data present.
  r.comboCount = COMBO_SYNERGIES.length
  r.positionCount = POSITION_SYNERGIES.length
  r.dataOk = COMBO_SYNERGIES.length >= 6 && POSITION_SYNERGIES.length >= 4

  // 2. resolveComboSynergies: bloodhunt needs fang 2 + root 2.
  r.comboResolve = {
    none: resolveComboSynergies({ fang: 2 }).map((c) => c.id),
    both: resolveComboSynergies({ fang: 2, root: 2 }).map((c) => c.id),
  }
  r.comboResolveOk =
    r.comboResolve.none.length === 0 && r.comboResolve.both.includes("bloodhunt")

  // 3. resolvePositionSynergies: back row all Fang/Gale -> skirmish-line.
  const skirmish = resolvePositionSynergies({ 0: ["fang"], 1: ["gale"], 2: ["fang"] })
  r.skirmish = skirmish.map((h) => ({ id: h.synergy.id, scope: h.scope, slots: h.slots }))
  r.skirmishOk = skirmish.some((h) => h.synergy.id === "skirmish-line" && h.slots.join() === "0,1,2")
  // phalanx: forward slot (3) a Warden -> self + squad effects.
  const phalanx = resolvePositionSynergies({ 3: ["warden"] })
  r.phalanxScopes = phalanx.filter((h) => h.synergy.id === "phalanx").map((h) => h.scope)
  r.phalanxOk = r.phalanxScopes.includes("self") && r.phalanxScopes.includes("squad")
  r.activeSlots = activePositionSlots({ 0: ["root"], 1: ["shadow"], 2: ["root"] })
  r.activeSlotsOk = r.activeSlots.sort().join() === "0,1,2"
  // column-wall / vanguard are tribe-GATED, not "any full squad": a
  // plain 4-slot fill with no Warden/Stone in 1&3 and no Fang/Thorn in
  // 0&3 lights NEITHER (so they don't become a flat squad buff).
  const plain = resolvePositionSynergies({ 0: ["grove"], 1: ["grove"], 2: ["grove"], 3: ["grove"] }).map((h) => h.synergy.id)
  r.plainFill = plain
  r.gatingOk = !plain.includes("column-wall") && !plain.includes("vanguard")
  const walled = resolvePositionSynergies({ 1: ["warden"], 3: ["stone"] }).map((h) => h.synergy.id)
  r.gatingOk = r.gatingOk && walled.includes("column-wall")

  // 4. Engine applies a combo: deploy 2 Fang + 2 Root -> bloodhunt ->
  //    squad gains +1 Execute and an onDealDamage poison trigger.
  //    fang units: swiftclaw, duskclaw; root units: rootfang, frostbind.
  let st = startAutoBattle("tommy", ["swiftclaw", "duskclaw", "rootfang", "frostbind"], "rotwood-husk")
  const anyUnit = st.playerUnits.find((u) => u.id === "p0")
  r.comboEngine = {
    execute: anyUnit?.powers.execute || 0,
    hasPoisonTrigger: (anyUnit?.triggers || []).some(
      (tg) => tg.trigger === "onDealDamage",
    ),
  }
  r.comboEngineOk = (anyUnit?.powers.execute || 0) >= 1 && r.comboEngine.hasPoisonTrigger

  // 5. Engine applies a position synergy: vanguard needs Fang/Thorn in
  //    slots 0 and 3 -> those two units +1 Strength, slot 1 not.
  //    the-fool is Thorn; ironbark (Warden) sits in slots 1,2.
  let vg = startAutoBattle("tommy", ["the-fool", "ironbark", "ironbark", "the-fool"], "rotwood-husk")
  const s0 = vg.playerUnits.find((u) => u.id === "p0")
  const s3 = vg.playerUnits.find((u) => u.id === "p3")
  const s1 = vg.playerUnits.find((u) => u.id === "p1")
  const S0 = s0?.powers.strength || 0
  const S1 = s1?.powers.strength || 0
  const S3 = s3?.powers.strength || 0
  r.vanguard = { s0: S0, s1: S1, s3: S3 }
  // slots 0 and 3 get vanguard's +1 Strength; slot 1 does not - so both
  // flank slots sit exactly 1 above the middle slot (which still has
  // whatever squad-wide Strength the commander/tribe tiers granted).
  r.vanguardOk = S0 === S1 + 1 && S3 === S1 + 1

  void resolveRound
  return r
})

console.log(JSON.stringify(out, null, 2))
console.log("=== page errors ===", errors.length ? errors.join("\n") : "(none)")
const pass =
  out.dataOk && out.comboResolveOk && out.skirmishOk && out.phalanxOk && out.activeSlotsOk &&
  out.gatingOk && out.comboEngineOk && out.vanguardOk && errors.length === 0
console.log(pass ? "\nPASS" : "\nFAIL")
await browser.close()
process.exit(pass ? 0 : 1)
