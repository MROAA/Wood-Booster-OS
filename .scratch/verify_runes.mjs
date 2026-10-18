// Hearthwood - Runes (First Song PRD §4) verify suite.
// Engine: pouch rules (start / drop / full / carve / spend) and every rune's
// effect AND cost in a REAL run tactics battle (startTacticsFormationBattle +
// buildRunTacticsBattle, same as the game). UI: the Rune Pouch on the
// Formation screen, carving, the board banner, a played turn.
//   PORT=5453 node .scratch/verify_runes.mjs
import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

const PORT = process.env.PORT || 5453
const SHOTS = process.env.SHOTS || ".scratch/shots"
await mkdir(SHOTS, { recursive: true })
const SEED = 424243
const results = []
const ok = (cond, name, extra) => {
  results.push({ ok: !!cond, name })
  if (!cond) console.log("FAIL:", name, extra !== undefined ? JSON.stringify(extra) : "")
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1536, height: 864 } })
const pageErrors = []
page.on("pageerror", (e) => pageErrors.push(e.message))
await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
await page.waitForTimeout(1500)

// ---------------- engine ----------------
const eng = await page.evaluate(async (SEED) => {
  const E = await import("/src/services/heartwood/runEngine.js")
  const M = await import("/src/services/heartwood/tacticsRealMatchup.js")
  const R = await import("/src/services/heartwood/runRunes.js")
  const D = await import("/src/data/heartwood/runes.js")
  const out = {}
  const fresh = E.startRun("tommy", null, { forcedSeed: SEED })
  out.startRunes = fresh.runes
  out.startSame = JSON.stringify(E.startRun("tommy", null, { forcedSeed: SEED }).runes) === JSON.stringify(fresh.runes)
  const idx = E.RUN_PATH.findIndex((n) => n.type === "battle" && n.formationId)
  const bench = ["the-fool", "the-magician"].map((defId, i) => ({ key: `b${i}`, defId, upgradeLevel: 0, upgrades: [] }))
  const base = { ...fresh, nodeIndex: idx, path: E.RUN_PATH.slice(0, idx + 1), phase: "formation", bench, deployed: ["b0", "b1", null, null], items: [], lastSeenAct: E.actIndexForNode(idx, E.RUN_PATH.length) }

  // drops
  out.dropBattle = R.runeDrop({ ...base, runes: [] }, { type: "battle" }).runes.length
  const dropped = R.runeDrop({ ...base, runes: ["growth"] }, { type: "elite" })
  out.dropElite = dropped.runes
  out.dropLine = (dropped.lastAftermath || []).join(" ")
  const full = R.runeDrop({ ...base, runes: ["growth", "echo", "bond"] }, { type: "miniboss" })
  out.fullCount = full.runes.length
  out.fullLine = (full.lastAftermath || []).join(" ")
  // carve / spend
  const pouch = { ...base, runes: ["bond", "shadow", "bond"] }
  out.carveMissing = R.carveRune(pouch, "echo").carvedRune ?? null
  const c1 = R.carveRune(pouch, "bond")
  out.carved = c1.carvedRune
  out.uncarved = R.carveRune(c1, "bond").carvedRune
  out.spent = R.spendCarvedRune(c1).runes
  out.spentCarved = R.spendCarvedRune(c1).carvedRune

  const build = (runeId) => {
    const rs = { ...base, runes: runeId ? [runeId] : [], carvedRune: runeId || null }
    const next = E.startTacticsFormationBattle(rs, (start) => M.buildRunTacticsBattle(rs, start))
    return next
  }
  const summarize = (rs) => {
    const b = rs.battle
    const foes = b.units.filter((u) => u.side === "enemy" && u.hp > 0 && !u.structure && !u.npc)
    const heroes = b.units.filter((u) => u.side === "player" && u.hp > 0 && !u.structure && !u.npc)
    return {
      rune: b.rune?.id || null,
      pouch: rs.runes,
      carvedAfter: rs.carvedRune,
      foes: foes.length,
      foeHp: foes.map((u) => u.maxHp),
      foeStun: foes.map((u) => u.stun || 0),
      foeIds: foes.map((u) => u.id),
      echoFoe: foes.some((u) => u.echo && u.id.startsWith("rune-echo-")),
      beastFoe: foes.some((u) => u.id.startsWith("rune-beast-")),
      skillCdOk: foes.filter((u) => (u.enemySkills || []).length).every((u) => u.enemySkills.every((sk) => (u.skillCd || {})[sk.id] >= 2)),
      skilled: foes.filter((u) => (u.enemySkills || []).length).length,
      foeShell: foes.map((u) => (u.shell || 0) + (u.ward || 0)),
      heroHp: heroes.map((u) => u.hp),
      heroMana: heroes.filter((u) => u.manaMax > 0 && !u.reagents).map((u) => [u.mana, u.manaMax]),
      heroWard: heroes.map((u) => u.ward || 0),
      cmdRoot: (b.units.find((u) => u.id === "player-commander") || {}).root || 0,
      bush: Object.values(b.terrain || {}).filter((t) => t === "bush").length,
      marks: b.units.filter((u) => u.runeMark).length,
      log: b.log.filter((l) => /[ᛒᚨᚷᛇᚺ]/.test(l)),
      events: (b.events || []).filter((e) => /carved/.test(e.label || "")).length,
    }
  }
  out.none = summarize(build(null))
  for (const id of D.RUNE_IDS) out[id] = summarize(build(id))
  out.runeIds = D.RUNE_IDS
  out.allHaveThree = D.RUNE_IDS.every((id) => D.RUNES[id].meaning && D.RUNES[id].effect && D.RUNES[id].cost && D.RUNES[id].glyph)
  return out
}, SEED)

ok(eng.startRunes.length === 1 && eng.runeIds.includes(eng.startRunes[0]), "E1 a run starts with one rune", eng.startRunes)
ok(eng.startSame, "E2 the starting rune comes from the seed")
ok(eng.allHaveThree && eng.runeIds.length === 5, "E3 five runes, each with glyph, meaning, effect and cost")
ok(eng.dropBattle === 0, "E4 a plain fight drops no rune")
ok(eng.dropElite.length === 2 && eng.dropElite[1] !== "growth" && /Rune found/.test(eng.dropLine), "E5 an elite drops a new rune, and says so", eng.dropElite)
ok(eng.fullCount === 3 && /Pouch is full/.test(eng.fullLine), "E6 a full pouch leaves the find behind, and says so")
ok(eng.carveMissing === null && eng.carved === "bond" && eng.uncarved === null, "E7 carve marks a held rune, clicking again unmarks, a missing rune can't be carved")
ok(JSON.stringify(eng.spent) === JSON.stringify(["shadow", "bond"]) && eng.spentCarved === null, "E8 spending takes ONE copy out of the pouch", eng.spent)
const N = eng.none
ok(N.rune === null && N.marks === 0, "E9 no rune carved = an untouched fight")
for (const id of eng.runeIds) {
  const r = eng[id]
  ok(r.rune === id && r.pouch.length === 0 && r.carvedAfter === null, `E10 ${id}: carved into the fight and spent from the pouch`, r.pouch)
  ok(r.log.length >= 1 && r.events >= 1, `E11 ${id}: the board log + a callout say what happened`, r.log)
}
const G = eng.growth
ok(G.bush > N.bush && G.heroHp.every((h, i) => h >= N.heroHp[i]), "E12 Growth: brush grows, heroes mend", { bush: [N.bush, G.bush] })
ok(G.foes === N.foes + 1 && G.beastFoe, "E13 Growth cost: one more beast on the enemy side", [N.foes, G.foes])
const Ec = eng.echo
ok(Ec.heroMana.every(([m, max]) => m === max) && Ec.heroWard.every((w) => w >= 1), "E14 Echo: full resource bars and Ward", Ec.heroMana)
ok(Ec.foes === N.foes + 1 && Ec.echoFoe, "E15 Echo cost: an echo of your strongest hero fights you", [N.foes, Ec.foes])
const B = eng.bond
ok(Math.max(...B.foeStun) >= 2 && B.foeStun.filter((s) => s >= 2).length === 1, "E16 Bond: the strongest enemy loses 2 turns", B.foeStun)
ok(B.cmdRoot >= 2, "E17 Bond cost: your Commander is rooted", B.cmdRoot)
const S = eng.shadow
ok(S.foeStun.every((s) => s >= 1), "E18 Shadow: every enemy loses its first turn", S.foeStun)
ok(S.foeHp.every((h, i) => h >= Math.round(N.foeHp[i] * 1.15)), "E19 Shadow cost: enemies +20% health", [N.foeHp, S.foeHp])
const K = eng.break
ok(K.foeShell.every((v) => v === 0) && (K.skilled === 0 || K.skillCdOk), "E20 Break: enemy shields gone, skills on cooldown", { skilled: K.skilled })
ok(K.heroMana.every(([m]) => m === 0), "E21 Break cost: your heroes' resource bars are empty", K.heroMana)

// ---------------- UI ----------------
await page.evaluate(async (SEED) => {
  localStorage.setItem("heartwood-story-intro-seen", "true")
  const E = await import("/src/services/heartwood/runEngine.js")
  const idx = E.RUN_PATH.findIndex((n) => n.type === "battle" && n.formationId)
  const bench = ["the-fool", "the-magician"].map((defId, i) => ({ key: `b${i}`, defId, upgradeLevel: 0, upgrades: [] }))
  const rs = { ...E.startRun("tommy", null, { forcedSeed: SEED }), runes: ["shadow", "bond"], nodeIndex: idx, path: E.RUN_PATH.slice(0, idx + 1), phase: "formation", bench, deployed: ["b0", "b1", null, null], items: [], lastSeenAct: E.actIndexForNode(idx, E.RUN_PATH.length) }
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(E.serializeRun(rs)))
}, SEED)
await page.reload({ waitUntil: "domcontentloaded" })
await page.waitForSelector("[data-rune-pouch]", { timeout: 15000 }).catch(() => {})
ok((await page.locator("[data-rune-pouch] .hw-rune-stone").count()) === 2, "U1 the Formation screen shows the Rune Pouch with both runes")
await page.locator(".hw-rune-stone[data-rune='bond']").click()
await page.waitForTimeout(600)
const carvedPanel = await page.locator("[data-rune-carved='bond']").innerText().catch(() => "")
ok((await page.locator(".hw-rune-stone[data-rune='bond'][data-carved]").count()) === 1 && /bound/.test(carvedPanel) && /Commander is rooted/.test(carvedPanel), "U2 clicking a rune marks it and spells out effect AND cost", carvedPanel)
await page.locator("[data-rune-pouch]").scrollIntoViewIfNeeded()
await page.screenshot({ path: `${SHOTS}/runes_pouch.png` })
await page.locator(".hw-rune-stone[data-rune='bond']").click()
ok((await page.locator(".hw-rune-stone[data-carved]").count()) === 0, "U3 clicking again unmarks it")
await page.locator(".hw-rune-stone[data-rune='shadow']").click()
await page.locator(".hw-tactics-start").click()
const begin = page.locator(".hwt-begin-battle")
await begin.waitFor({ timeout: 8000 }).catch(() => {})
ok((await page.locator("[data-rune-banner='shadow']").count()) === 1, "U4 the battle shows the carved rune's banner (effect + cost)")
ok((await page.locator("[data-rune-mark]").count()) >= 1, "U5 units the rune touched carry its glyph")
const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("heartwood-run-save-v1") || "null")?.run)
ok(saved && JSON.stringify(saved.runes) === JSON.stringify(["bond"]) && !saved.carvedRune, "U6 the carved rune left the pouch in the saved run", saved?.runes)
if (await begin.count()) await begin.click()
await page.waitForTimeout(800)
await page.locator("[data-rune-banner]").scrollIntoViewIfNeeded().catch(() => {})
await page.screenshot({ path: `${SHOTS}/runes_battle.png` })
// Play one turn: Shadow means every enemy skips its first turn.
const hpBefore = await page.evaluate(() => JSON.parse(localStorage.getItem("heartwood-run-save-v1")).run.battle.units.filter((u) => u.side === "player").map((u) => u.hp))
await page.locator(".hwt-end-turn").click()
await page.waitForTimeout(3500)
const after = await page.evaluate(() => {
  const b = JSON.parse(localStorage.getItem("heartwood-run-save-v1")).run.battle
  return { turn: b.turn, phase: b.phase, hp: b.units.filter((u) => u.side === "player").map((u) => u.hp), stunned: b.log.filter((l) => /stunned and skips/.test(l)).length }
})
ok(after.turn >= 2 && after.stunned >= 1 && JSON.stringify(after.hp) === JSON.stringify(hpBefore), "U7 a played turn: hidden by Shadow, the enemies lose their turn and nobody is hit", after)
ok(pageErrors.length === 0, "U8 no page errors", pageErrors)

await browser.close()
const failed = results.filter((r) => !r.ok)
console.log(`verify_runes: ${results.length - failed.length}/${results.length} passed`)
process.exit(failed.length ? 1 : 0)
