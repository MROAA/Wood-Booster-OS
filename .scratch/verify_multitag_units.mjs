// PR1 verify: multi-tag pilot units, the count-3 middle synergy tier,
// and the Root self-debuff fix.
//   node .scratch/verify_multitag_units.mjs   (needs a dev server; set PORT)
import { chromium } from "playwright"

const PORT = process.env.PORT || 5173

const browser = await chromium.launch({ args: ["--no-sandbox"] })
const page = await (await browser.newContext()).newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })

await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
await page.waitForSelector(".hw-commander-card", { timeout: 15000 })

const out = await page.evaluate(async () => {
  const t = Date.now()
  const { UNIT_TRIBES, SYNERGY_TIERS, tribesOf, resolveSynergies } =
    await import("/src/data/heartwood/synergies.js?t=" + t)
  const { startAutoBattle, resolveRound } =
    await import("/src/services/heartwood/autoBattleEngine.js?t=" + t)
  const { UNITS } = await import("/src/data/heartwood/units.js?t=" + t)
  const r = {}

  // 1. The 6 pilot units each carry exactly 2 tribes, the expected pair.
  const expected = {
    "the-empress": ["grove", "warden"],
    "the-lovers": ["thorn", "fang"],
    wraithbriar: ["spirit", "warden"],
    sapkeeper: ["grove", "warden"],
    stoneknoll: ["fang", "thorn"],
    quarrywarden: ["grove", "warden"],
  }
  r.pilot = Object.fromEntries(
    Object.entries(expected).map(([id, want]) => {
      const got = UNIT_TRIBES[id] || []
      return [id, { got, ok: got.length === 2 && want.every((w) => got.includes(w)) }]
    }),
  )
  r.pilotAllOk = Object.values(r.pilot).every((x) => x.ok)

  // 2. Every mechanical tribe now has a 3-tier ladder (count 2 / 3 / 4).
  r.tierLadders = Object.fromEntries(
    Object.entries(SYNERGY_TIERS).map(([tribe, tiers]) => [tribe, tiers.map((x) => x.count)]),
  )
  r.allThreeTiers = Object.values(SYNERGY_TIERS).every(
    (tiers) => tiers.length === 3 && tiers[0].count === 2 && tiers[1].count === 3 && tiers[2].count === 4,
  )

  // 3. A 2-tag unit counts toward BOTH tribes (mirrors the engine loop).
  const counts = {}
  for (const defId of ["the-empress", "sapkeeper", "the-fool", "the-magician"]) {
    for (const tr of tribesOf(defId, UNITS[defId])) counts[tr] = (counts[tr] || 0) + 1
  }
  // the-empress + sapkeeper => grove 2 AND warden 2 from just 2 units.
  r.dualCount = counts
  r.dualCountsBoth = counts.grove === 2 && counts.warden === 2

  // 4. resolveSynergies picks the count-3 middle tier at exactly 3.
  r.mid = {
    at2: resolveSynergies({ thorn: 2 }).find((s) => s.tribeId === "thorn")?.activeTier.count,
    at3: resolveSynergies({ thorn: 3 }).find((s) => s.tribeId === "thorn")?.activeTier.count,
    at4: resolveSynergies({ thorn: 4 }).find((s) => s.tribeId === "thorn")?.activeTier.count,
  }
  r.midOk = r.mid.at2 === 2 && r.mid.at3 === 3 && r.mid.at4 === 4

  // 5. Root fix: with 2 Root units deployed, the units themselves must
  //    NOT gain Weak/Vulnerable in their own powers (the old self-debuff
  //    bug). Instead they carry an onDealDamage trigger, and an enemy
  //    they hit ends up Weak.
  let st = startAutoBattle("tommy", ["rootfang", "hexmother", "the-fool"], "rotwood-husk")
  const rootUnit = st.playerUnits.find((u) => u.defId === "rootfang")
  r.root = {
    selfWeak: rootUnit.powers.weak || 0,
    selfVuln: rootUnit.powers.vulnerable || 0,
    hasOnDealDamage: (rootUnit.triggers || []).some((tg) => tg.trigger === "onDealDamage"),
  }
  // Drive a few rounds; the frontmost enemy should pick up Weak from a
  // player hit landing (onDealDamage -> applyBuff weak target).
  for (let i = 0; i < 4 && st.phase !== "won" && st.phase !== "lost"; i++) st = resolveRound(st)
  r.root.enemyWeak = Math.max(0, ...st.enemies.map((e) => e.powers.weak || 0))
  r.rootOk =
    r.root.selfWeak === 0 && r.root.selfVuln === 0 && r.root.hasOnDealDamage && r.root.enemyWeak > 0

  return r
})

console.log(JSON.stringify(out, null, 2))
console.log("=== page errors ===")
console.log(errors.length ? errors.join("\n") : "(none)")

const pass =
  out.pilotAllOk && out.allThreeTiers && out.dualCountsBoth && out.midOk && out.rootOk && errors.length === 0
console.log(pass ? "\nPASS" : "\nFAIL")
await browser.close()
process.exit(pass ? 0 : 1)
