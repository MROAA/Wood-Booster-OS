import { chromium } from "playwright"

const PORT = process.env.PORT || 5571
const browser = await chromium.launch({ args: ["--no-sandbox"] })
const page = await (await browser.newContext()).newPage()
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (msg) => {
  const t = msg.text()
  if (msg.type() === "error") errors.push(t)
  if (t.includes("[heartwood]")) console.log("DEV WARN >>", t)
})

await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
await page.waitForTimeout(800)

const result = await page.evaluate(async () => {
  const enemiesMod = await import("/src/data/heartwood/enemies.js")
  const engine = await import("/src/services/heartwood/runEngine.js")
  const cardArt = await import("/src/components/heartwood/cardArt.jsx")
  const { startAutoBattle, resolveRound } = await import("/src/services/heartwood/autoBattleEngine.js")
  const { ENEMIES, ACT_ENEMIES, actEnemyForNode } = enemiesMod
  const { RUN_PATH, actIndexForNode, difficultyTierForNode, DIFFICULTY_TIERS, ACT_STAT_FLOOR } = engine
  const out = { checks: [], fights: [] }
  const A = (name, ok, extra) => out.checks.push({ name, ok: !!ok, extra })

  // 1. every ENEMIES entry has a valid act 1..7
  const badAct = Object.values(ENEMIES).filter((e) => !(Number.isInteger(e.act) && e.act >= 1 && e.act <= 7))
  A("every ENEMIES entry has act 1..7", badAct.length === 0, badAct.map((e) => e.id))

  // 2. every ENEMIES entry resolves a glyph (or the documented Rune fallback)
  const missingArt = Object.values(ENEMIES).filter((e) => !e.art)
  A("every ENEMIES entry has an art glyph name", missingArt.length === 0, missingArt.map((e) => e.id))

  // 3. every act 1..7 has >= 1 enemy in ACT_ENEMIES
  const emptyActs = []
  for (let a = 1; a <= 7; a++) if (!(ACT_ENEMIES[a] && ACT_ENEMIES[a].length)) emptyActs.push(a)
  A("every act 1..7 has >= 1 enemy", emptyActs.length === 0, { sizes: Object.fromEntries(Object.entries(ACT_ENEMIES).map(([k, v]) => [k, v.length])) })

  // 4. actIndexForNode agrees with difficultyTierForNode across a spread
  let agree = true
  const spread = []
  for (let i = 0; i < RUN_PATH.length; i += 7) {
    const idx = actIndexForNode(i, RUN_PATH.length)
    const tier = difficultyTierForNode(i, RUN_PATH.length)
    const ok = DIFFICULTY_TIERS[idx - 1] === tier
    if (!ok) agree = false
    spread.push({ node: i, act: idx, tier: tier.name.split(" - ")[0], ok })
  }
  A("actIndexForNode matches difficultyTierForNode for a node spread", agree, spread)

  // 5. ACT_STAT_FLOOR is a rising floor, Acts I-II == 1.0, monotonic non-decreasing, modest
  const fl = ACT_STAT_FLOOR
  const rising = fl[1] === 1 && fl[2] === 1 && fl[3] >= fl[2] && fl[4] >= fl[3] && fl[5] >= fl[4] && fl[6] >= fl[5] && fl[7] >= fl[6] && fl[7] <= 1.25
  A("ACT_STAT_FLOOR is a modest rising floor (I-II flat, non-decreasing, <=1.25)", rising, fl)

  // 6. one NEW sample enemy per act runs a real battle with no throw / no undefined field
  const SAMPLES = {
    1: "rotbore-grub", 2: "runewisp-acolyte", 3: "veilgnaw", 4: "hollowmarrow-sentinel",
    5: "crownless-revenant", 6: "echo-stalker", 7: "verge-warden",
  }
  for (const [act, id] of Object.entries(SAMPLES)) {
    const def = ENEMIES[id]
    const rec = { act: Number(act), id, present: !!def }
    try {
      rec.hasName = typeof def.name === "string" && def.name.length > 0
      rec.hasMaxHp = Number.isFinite(def.maxHp) && def.maxHp > 0
      rec.hasMovePattern = Array.isArray(def.movePattern) && def.movePattern.length > 0
      rec.actMatches = def.act === Number(act)
      let b = startAutoBattle("tommy", [{ defId: "mosshollow" }, { defId: "ironbark" }], id, [], 0, {}, [], [], 1.5)
      const e0 = b.enemies[0]
      rec.spawnHp = e0.hp
      rec.spawnName = e0.name
      rec.glyph = cardArt.CardGlyph ? "ok" : "missing"
      let rounds = 0
      while (b.phase === "player" && rounds < 40) { b = resolveRound(b); rounds++ }
      rec.finalPhase = b.phase
      rec.rounds = rounds
      rec.enemyHpDropped = b.enemies[0].hp < rec.spawnHp || b.phase === "won"
      rec.ok = rec.present && rec.hasName && rec.hasMaxHp && rec.hasMovePattern && rec.actMatches && rec.enemyHpDropped && b.phase !== "error"
    } catch (err) {
      rec.error = String(err)
      rec.ok = false
    }
    out.fights.push(rec)
  }
  A("a real battle vs one NEW sample enemy per act resolves with no error", out.fights.every((f) => f.ok), out.fights)

  // 7. act-fallback: a displaced solo node swaps to an act-appropriate id
  const nodeInAct7 = RUN_PATH.length - 2
  const swapped = actEnemyForNode(7, nodeInAct7, null)
  A("actEnemyForNode(7, ...) returns an Act 7 enemy id", ENEMIES[swapped] && ENEMIES[swapped].act === 7, swapped)

  return out
})

for (const c of result.checks) {
  console.log(`${c.ok ? "PASS" : "FAIL"}: ${c.name}`)
  if (!c.ok) console.log("   ", JSON.stringify(c.extra))
}
console.log("\nfights:")
for (const f of result.fights) console.log("  ", JSON.stringify(f))
console.log("\npage/console errors:", errors)

await browser.close()
const allPass = result.checks.every((c) => c.ok) && errors.length === 0
console.log(allPass ? "\nALL GREEN" : "\nFAILURES PRESENT")
process.exit(allPass ? 0 : 1)
