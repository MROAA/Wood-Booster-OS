// PR verify: arena hazards. Data is well-formed, arenaForNode is
// deterministic and occasional, and startAutoBattle applies an arena's
// effects to the right side(s).  PORT env, needs a dev server.
import { chromium } from "playwright"

const PORT = process.env.PORT || 5316
const browser = await chromium.launch({ args: ["--no-sandbox"] })
const page = await (await browser.newContext()).newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()) })
await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
await page.waitForSelector(".hw-commander-card", { timeout: 15000 })

const out = await page.evaluate(async () => {
  const t = Date.now()
  const { ARENAS, arenaForNode, arenaById } = await import("/src/data/heartwood/arenas.js?t=" + t)
  const { startAutoBattle, resolveRound } = await import("/src/services/heartwood/autoBattleEngine.js?t=" + t)
  const r = {}

  // 1. Data well-formed: id/name/description/scope/effects, valid scope.
  r.arenaCount = ARENAS.length
  r.dataOk = ARENAS.length >= 6 && ARENAS.every(
    (a) => a.id && a.name && a.description && ["player", "enemy", "both"].includes(a.scope) &&
      Array.isArray(a.effects) && a.effects.length >= 1,
  )
  r.scopes = ARENAS.reduce((m, a) => ((m[a.scope] = (m[a.scope] || 0) + 1), m), {})
  r.hasAllScopes = r.scopes.player > 0 && r.scopes.enemy > 0 && r.scopes.both > 0

  // 2. arenaForNode: deterministic, and NOT every fight (a hazard is an
  //    event, not the baseline). Sample 120 positions.
  let withArena = 0
  let mismatch = 0
  for (let i = 0; i < 120; i++) {
    const act = 1 + (i % 7)
    const a1 = arenaForNode(i, act)
    const a2 = arenaForNode(i, act)
    if (a1 !== a2) mismatch++
    if (a1) withArena++
  }
  r.arenaRate = withArena / 120
  r.deterministic = mismatch === 0
  r.rateOk = r.arenaRate > 0.1 && r.arenaRate < 0.6

  // 3. Apply check: a "player" arena hits only the squad; "enemy" only
  //    the enemies; "both" both. Use frostfall (both, Weak 1),
  //    sacred-grove (player, Regen 2), corrupted-soil (enemy, Str 2).
  function powersFor(arenaId) {
    const st = startAutoBattle(
      "tommy", ["ironbark", "the-fool", "the-fool"], "rotwood-husk",
      [], 0, {}, [], [], 1, arenaId,
    )
    return {
      playerMax: Math.max(0, ...st.playerUnits.map((u) => Object.keys(u.powers).length)),
      enemyMax: Math.max(0, ...st.enemies.map((u) => Object.keys(u.powers).length)),
      pWeak: Math.max(0, ...st.playerUnits.map((u) => u.powers.weak || 0)),
      eWeak: Math.max(0, ...st.enemies.map((u) => u.powers.weak || 0)),
      pRegen: Math.max(0, ...st.playerUnits.map((u) => u.powers.regen || 0)),
      eStr: Math.max(0, ...st.enemies.map((u) => u.powers.strength || 0)),
      arenaName: st.arenaName || null,
    }
  }
  const none = powersFor(null)
  const frost = powersFor("frostfall")
  const grove = powersFor("sacred-grove")
  const soil = powersFor("corrupted-soil")
  r.apply = { none, frost, grove, soil }
  r.frostBothSides = frost.pWeak >= 1 && frost.eWeak >= 1 && frost.arenaName === "Frostfall"
  r.grovePlayerOnly = grove.pRegen >= 2 && grove.eStr === 0
  r.soilEnemyOnly = soil.eStr > none.eStr && soil.pWeak === 0

  // 4. Ley Line's ascendant keeps ticking across rounds (it's a player
  //    arena that scales).
  let ley = startAutoBattle("tommy", ["ironbark", "the-fool"], "rotwood-husk", [], 0, {}, [], [], 1, "ley-line")
  const s0 = Math.max(0, ...ley.playerUnits.map((u) => u.powers.strength || 0))
  for (let i = 0; i < 3 && ley.phase === "player"; i++) ley = resolveRound(ley)
  const s3 = Math.max(0, ...ley.playerUnits.map((u) => u.powers.strength || 0))
  r.leyScales = s3 > s0

  void arenaById
  return r
})

console.log(JSON.stringify(out, null, 2))
console.log("=== page errors ===", errors.length ? errors.join("\n") : "(none)")
const pass =
  out.dataOk && out.hasAllScopes && out.deterministic && out.rateOk &&
  out.frostBothSides && out.grovePlayerOnly && out.soilEnemyOnly && out.leyScales && errors.length === 0
console.log(pass ? "\nPASS" : "\nFAIL")
await browser.close()
process.exit(pass ? 0 : 1)
