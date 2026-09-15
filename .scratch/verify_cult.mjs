import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

// Hearthwood - The Cult (7th enemy archetype, Enemy Ecosystem PRD 11 / 39,
// feat/hearthwood-cult). The inverse of The Brood: a Ritual Warden behind
// the line SACRIFICES its own cultFodder every 3rd round to fold their
// strength into the rest (+2 Strength to every surviving enemy, +3 self-
// heal). Race the rite, reach the Warden, or stun it to stall the chant.
// Bounded: it only fires while a fodder ally lives -> 1-2 cycles, then
// the fight DE-ESCALATES. NO new status, NO RUN_SAVE_VERSION bump.

const PORT = process.env.PORT || 5377
const SHOT = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-cult/.scratch/shots"
await mkdir(SHOT, { recursive: true })

const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1536, height: 1000 } })).newPage()
const errs = []
page.on("pageerror", (e) => errs.push(String(e)))
page.on("console", (m) => m.type() === "error" && errs.push(m.text()))
await page.goto(`http://localhost:${PORT}/heartwood`)
await page.waitForSelector(".hw-commander-card", { timeout: 20000 })

const R = await page.evaluate(async () => {
  const engine = await import("/src/services/heartwood/runEngine.js")
  const auto = await import("/src/services/heartwood/autoBattleEngine.js")
  const { UNITS } = await import("/src/data/heartwood/units.js")
  const { ENEMIES, NON_BATTLE_ENEMY_IDS, ACT_ENEMIES } = await import("/src/data/heartwood/enemies.js")
  const { FORMATIONS } = await import("/src/data/heartwood/formations.js")
  const { RELICS, relicPool } = await import("/src/data/heartwood/relics.js")
  const { evaluateThreat } = await import("/src/data/heartwood/threatPreview.js")
  const { evaluateMatchup } = await import("/src/data/heartwood/counterplay.js")
  const {
    startRun, serializeRun, deserializeRun, RUN_SAVE_VERSION, RUN_PATH,
    SHOP_INVESTMENTS, investmentOwned, buyInvestment,
  } = engine
  const out = { errors: [] }

  const du = (defId) => ({ defId, upgradeLevel: 0, upgrades: [], itemIds: [] })
  const start = (squad, formationId, relicIds = []) =>
    auto.startAutoBattle("tommy", squad, formationId, relicIds, 0, {}, [], [], 1, null, "restless")
  const warden = (st) => st.enemies.find((e) => e.defId === "ritual-warden")
  const fodderAlive = (st) => st.enemies.filter((e) => e.defId === "sworn-cultist" && e.hp > 0).length

  // 1. Data -----------------------------------------------------------
  {
    const c = FORMATIONS["the-communion"]
    const l = FORMATIONS["the-long-chant"]
    const shape = (f) =>
      f && f.pieces.length === 3 && f.synergy?.label === "The ritual feeds" && Array.isArray(f.synergy.effects) &&
      f.synergy.effects.length === 0 && !f.pieces.some((p) => p.pos.row === 1 && p.pos.col === 1) &&
      f.pieces.find((p) => p.defId === "ritual-warden")?.pos.row === 1
    const defsOk =
      !!ENEMIES["ritual-warden"]?.cultRitual && ENEMIES["ritual-warden"].act === 4 &&
      ENEMIES["sworn-cultist"]?.cultFodder === true && !ENEMIES["ritual-adept"]?.cultRitual && !ENEMIES["ritual-adept"]?.cultFodder
    const excluded = ["ritual-warden", "sworn-cultist", "ritual-adept"].every(
      (id) => NON_BATTLE_ENEMY_IDS.has(id) && !Object.values(ACT_ENEMIES).flat().includes(id),
    )
    out.data = { communion: shape(c), longChant: shape(l), defsOk, excluded }
    if (!(shape(c) && shape(l) && defsOk && excluded)) out.errors.push("check1 data")
  }

  // 2. The rite fires (cycle 1), then de-escalates ------------------
  {
    // (a) cycle 1 (round 2, every: 2): keep the fodder topped up so the
    //     (weak) squad can't out-race the rite; observe the charge
    //     completing.
    const CH = ENEMIES["sworn-cultist"].maxHp
    let st = start([du("the-fool"), du("the-fool")], "the-communion")
    let sacLine = false
    let wardenFed = false
    for (let r = 0; r < 2 && st.phase === "player"; r++) {
      st = { ...st, enemies: st.enemies.map((e) => (e.defId === "sworn-cultist" ? { ...e, hp: CH } : e)) }
      const lb = st.log.length
      st = auto.resolveRound(st)
      const nl = st.log.slice(lb)
      if (nl.some((s) => /gives .* to the ritual/.test(s))) sacLine = true
      if (nl.some((s) => /Ritual Warden heal \d/.test(s))) wardenFed = true
    }
    const survStr = Math.max(0, ...st.enemies.filter((e) => e.hp > 0).map((e) => e.powers?.strength || 0))
    const cycle1 = sacLine && survStr >= 2 && wardenFed

    // (b) de-escalation: hand-kill both fodder, drive past a charge cycle
    //     with a weak squad -> the rite sputters, no buff, no Strength.
    let ds = start([du("the-fool"), du("the-fool")], "the-communion")
    ds = { ...ds, enemies: ds.enemies.map((e) => (e.defId === "sworn-cultist" ? { ...e, hp: 0 } : e)) }
    let sputter = false
    let buffed = false
    for (let r = 0; r < 5 && ds.phase === "player"; r++) {
      const lb = ds.log.length
      ds = auto.resolveRound(ds)
      const nl = ds.log.slice(lb)
      if (nl.some((s) => /ritual sputters/.test(s))) sputter = true
      if (nl.some((s) => /gives .* to the ritual/.test(s))) buffed = true
    }
    const wStr = ds.enemies.find((e) => e.defId === "ritual-warden")?.powers?.strength || 0
    const deescalated = sputter && !buffed && wStr === 0

    out.rite = { cycle1, sacLine, survStr, wardenFed, deescalated, sputter, buffed, wStr }
    if (!(cycle1 && deescalated)) out.errors.push("check2 rite fires + de-escalates")
  }

  // 3. Kill the leader stops it -----------------------------------
  {
    let st = start([du("bulwark-of-ages"), du("the-fool")], "the-communion")
    // hand-zero the Warden on round 1
    st = { ...st, enemies: st.enemies.map((e) => (e.defId === "ritual-warden" ? { ...e, hp: 0 } : e)) }
    let sac = false
    let maxCultistStr = 0
    for (let r = 0; r < 7 && st.phase === "player"; r++) {
      const before = st.log.length
      st = auto.resolveRound(st)
      if (st.log.slice(before).some((s) => /gives .* to the ritual/.test(s))) sac = true
      for (const e of st.enemies) if (e.defId === "sworn-cultist") maxCultistStr = Math.max(maxCultistStr, e.powers?.strength || 0)
    }
    out.leader = { sac, maxCultistStr }
    if (sac || maxCultistStr >= 2) out.errors.push("check3 killing the leader did not stop the rite")
  }

  // 4. Stun stalls the chant ------------------------------------
  {
    let st = start([du("bulwark-of-ages"), du("the-fool")], "the-communion")
    let sac = false
    for (let r = 0; r < 6 && st.phase === "player"; r++) {
      // keep the Warden stunned at the top of each round
      st = { ...st, enemies: st.enemies.map((e) => (e.defId === "ritual-warden" && e.hp > 0 ? { ...e, powers: { ...e.powers, stun: 1 } } : e)) }
      const before = st.log.length
      st = auto.resolveRound(st)
      if (st.log.slice(before).some((s) => /gives .* to the ritual/.test(s))) sac = true
    }
    const stalledLine = st.log.some((s) => /chant falters/.test(s))
    out.stun = { sac, stalledLine }
    if (sac || !stalledLine) out.errors.push("check4 stun did not stall the chant")
  }

  // 5. Both formations resolve --------------------------------
  {
    const mid = [du("the-hermit"), du("the-tower"), du("bulwark-of-ages"), du("willowmend")]
    const a = auto.autoResolveBattle(start(mid, "the-communion"))
    const b = auto.autoResolveBattle(start(mid, "the-long-chant"))
    const ok = (d) => (d.phase === "won" || d.phase === "lost") && d.round < 30
    out.resolve = { communion: { phase: a.phase, round: a.round }, longChant: { phase: b.phase, round: b.round } }
    if (!(ok(a) && ok(b))) out.errors.push("check5 a formation did not resolve under the cap")
  }

  // 6. The counters ------------------------------------------
  {
    // Drive 8 rounds with the fodder + Warden held alive, so each counter
    // has time to act on the rite (a real fight ends in ~3-5 rounds -
    // that's the "burst it and you only eat one cycle" case, check 5).
    // `slot1` puts the counter in the {2,1} back-centre slot, whose
    // bishop diagonal reaches the Warden at {1,0}.
    // Hold EVERY enemy at full HP each round so the fight runs a clean 8
    // rounds and the rite fires at rounds 3 and 6 - a pure "what does
    // this counter do to an active rite" probe (a real fight ends in
    // ~3 rounds, check 5). `slot1` = the {2,1} back-centre slot whose
    // bishop diagonal reaches the Warden at {1,0}.
    const drive = (squad, slot1 = false) => {
      const dep = slot1 ? [du("the-fool"), du(squad), du("the-fool")] : [du("the-fool"), du("the-fool"), du(squad)]
      let st = start(dep, "the-communion")
      for (let r = 0; r < 8 && st.phase === "player"; r++) {
        st = { ...st, enemies: st.enemies.map((e) => ({ ...e, hp: ENEMIES[e.defId]?.maxHp || e.maxHp })) }
        st = auto.resolveRound(st)
      }
      return st
    }
    // Chantbreaker (bishop + Stun on hit): its diagonal reaches the row-1
    // Warden and freezes the ritual charge -> the "chant falters" line.
    const stC = drive("chantbreaker", true)
    const chantHelps = (stC.log || []).some((s) => /chant falters/.test(s))
    // Oathsworn (Sunder on hit): strips a stack of the rite's Strength
    // off the piece it hits. On the-communion the round-2 rite sacrifices
    // the frontmost fodder and buffs the other one +2; oathsworn then
    // retargets to it -> "loses a stack of Strength" appears.
    let stS = start([du("the-fool"), du("oathsworn")], "the-communion")
    for (let r = 0; r < 7 && stS.phase === "player"; r++) stS = auto.resolveRound(stS)
    const sunderHelps = (stS.log || []).some((s) => /loses a stack of Strength/.test(s))
    // Emberzeal (Growth): its own body out-climbs what the rite grants.
    const stE = drive("emberzeal")
    const emb = stE.playerUnits.find((u) => u.defId === "emberzeal")
    const embScales = (emb?.powers?.strength || 0) >= 10
    out.counters = { chantHelps, sunderHelps, embStr: emb?.powers?.strength || 0, embScales }
    if (!(chantHelps && sunderHelps && embScales)) out.errors.push("check6 the counters")
  }

  // 7. RUN_PATH / save --------------------------------------
  {
    const ids = RUN_PATH.map((n) => n.formationId).filter(Boolean)
    const swapped = ids.includes("the-communion") && ids.includes("the-long-chant")
    const gone = !ids.includes("the-wearing-down") && !ids.includes("the-cursed-thicket")
    const len111 = RUN_PATH.length === 111
    const rs = { ...startRun("tommy"), relics: ["silenced-bell"] }
    const rt = deserializeRun(JSON.parse(JSON.stringify(serializeRun(rs))))
    const rtOk = rt != null && (rt.relics || []).includes("silenced-bell")
    out.path = { swapped, gone, len111, rtOk, ver: RUN_SAVE_VERSION }
    if (!(swapped && gone && len111 && rtOk && RUN_SAVE_VERSION === 3)) out.errors.push("check7 RUN_PATH / save")
  }

  // 8. Threat preview --------------------------------------
  {
    const rs = startRun("tommy")
    const roster = FORMATIONS["the-communion"].pieces.map((p) => ({ defId: p.defId, pos: p.pos, hp: ENEMIES[p.defId].maxHp }))
    const node = { type: "battle", formationId: "the-communion" }
    const t = evaluateThreat(roster, rs, node)
    const primaryCult = t.primary?.id === "cult"
    const mechCult = (t.mechanics || []).includes("Sacrifices its own for power")
    // covered vs gap
    const bench = [
      { key: "k0", defId: "chantbreaker", upgrades: [], itemIds: [] },
      { key: "k1", defId: "oathsworn", upgrades: [], itemIds: [] },
      { key: "k2", defId: "the-fool", upgrades: [], itemIds: [] },
    ]
    const covRs = { ...rs, bench, deployed: ["k0", "k1", "k2", null] }
    const covered = evaluateMatchup(roster, covRs).covered.includes("cult")
    const plainRs = { ...rs, bench: [{ key: "p0", defId: "the-fool", upgrades: [], itemIds: [] }], deployed: ["p0", null, null, null] }
    const gap = evaluateMatchup(roster, plainRs).gaps.includes("cult")
    out.threat = { primaryCult, mechCult, covered, gap, primary: t.primary?.id, mechanics: t.mechanics }
    if (!(primaryCult && mechCult && covered && gap)) out.errors.push("check8 threat preview")
  }

  // 9. The Silenced Bell ----------------------------------
  {
    let rs = { ...startRun("tommy"), essence: 2000 }
    const cost = SHOP_INVESTMENTS["silenced-bell"].cost
    const before = rs.essence
    rs = buyInvestment(rs, "silenced-bell")
    const bought = rs.essence === before - cost && investmentOwned(rs, "silenced-bell") && (rs.relics || []).includes("silenced-bell")
    const rs2 = buyInvestment(rs, "silenced-bell")
    const noDouble = rs2.essence === rs.essence && (rs2.relics || []).filter((r) => r === "silenced-bell").length === 1
    const notRollable = !relicPool().some((r) => r.id === "silenced-bell")
    const noBattleEffect = Array.isArray(RELICS["silenced-bell"].effects) && RELICS["silenced-bell"].effects.length === 0
    // battle start: the Warden (highest maxHp) is stunned, the fodder are not
    const st = start([du("the-hermit"), du("the-tower")], "the-communion", ["silenced-bell"])
    const wStunned = (warden(st)?.powers?.stun || 0) >= 1
    const fodderClean = st.enemies.filter((e) => e.defId === "sworn-cultist").every((e) => (e.powers?.stun || 0) === 0)
    out.bell = { cost, bought, noDouble, notRollable, noBattleEffect, wStunned, fodderClean }
    if (!(cost === 400 && bought && noDouble && notRollable && noBattleEffect && wStunned && fodderClean)) out.errors.push("check9 Silenced Bell")
  }

  return out
})

console.log(JSON.stringify(R, null, 2))
console.log("\npageErrors:", errs.length, errs.slice(0, 8))

// screenshot the FormationScreen vs the-communion
try {
  await page.evaluate(async () => {
    const engine = await import("/src/services/heartwood/runEngine.js")
    const { RUN_PATH } = engine
    const idx = RUN_PATH.findIndex((n) => n.formationId === "the-communion")
    let run = engine.startRun("tommy", null, { forcedSeed: 0xc017 })
    run = {
      ...run,
      nodeIndex: idx,
      path: RUN_PATH.slice(0, idx + 1),
      phase: "formation",
      lastSeenAct: 7,
      bench: [
        { key: 1, defId: "chantbreaker", upgrades: [], upgradeLevel: 0, wins: 0 },
        { key: 2, defId: "oathsworn", upgrades: [], upgradeLevel: 0, wins: 0 },
      ],
      deployed: [1, 2, null, null],
      items: [],
    }
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(engine.serializeRun(run)))
    localStorage.setItem("heartwood-story-intro-seen", "1")
    localStorage.setItem("heartwood-coach-enabled-v1", "false")
  })
  await page.reload()
  await page.waitForSelector(".hw-cult-hint", { timeout: 20000 })
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${SHOT}/cult_formation.png` })
  console.log("cult hint:", await page.$eval(".hw-cult-hint", (el) => el.textContent.replace(/\s+/g, " ").trim()))
  console.log("threat panel:", await page.$eval(".hw-threat-preview", (el) => el.textContent.replace(/\s+/g, " ").trim().slice(0, 180)).catch(() => "(none)"))
} catch (e) {
  console.log("shot skip:", e.message)
}

await browser.close()
const pass = R.errors.length === 0 && errs.length === 0
console.log(pass ? "\n✅ verify_cult PASS" : "\n❌ verify_cult FAIL")
process.exit(pass ? 0 : 1)
