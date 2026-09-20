import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

// Hearthwood - The Fortress (feat/hearthwood-fortress). Second enemy
// archetype, the Swarm's opposite: 3 very tough bodies + a self-mender,
// a FLAT per-round +3 Block formation synergy (block resets each round
// -> non-compounding by construction, unlike #433's strength ramp).
// Real combat change on 2 swapped RUN_PATH nodes -> RUNS=100 is the hard
// gate; these assertions pin the mechanic + save-safety + that the
// armour-break / DoT counter beats a slow grind.

const PORT = process.env.PORT || 5363
const SHOT = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-fortress/.scratch/shots"
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
  const { FORMATIONS, resolveFormation } = await import("/src/data/heartwood/formations.js")
  const { ENEMIES, ACT_ENEMIES, NON_BATTLE_ENEMY_IDS } = await import("/src/data/heartwood/enemies.js")
  const { evaluateThreat } = await import("/src/data/heartwood/threatPreview.js")
  const { startRun, serializeRun, deserializeRun, RUN_SAVE_VERSION, RUN_PATH } = engine
  const out = { errors: [] }

  // 1. data ---------------------------------------------------------------
  {
    const FB = ["oakshell-warden", "mossmender", "grave-bastion"]
    const forms = [
      ["the-bulwark", 3],
      ["the-bastion", 3],
    ].map(([id, n]) => {
      const f = FORMATIONS[id]
      if (!f) return { id, ok: false }
      const noCenter = f.pieces.every((p) => !(p.pos.row === 1 && p.pos.col === 1))
      const cols = f.pieces.every((p) => p.pos.col === 0 || p.pos.col === 2)
      const flatBlock =
        f.synergy?.label === "The wall holds firm" &&
        f.synergy.effects.length === 1 &&
        f.synergy.effects[0].type === "addTrigger" &&
        f.synergy.effects[0].trigger === "turnStart" &&
        f.synergy.effects[0].effect.type === "block" &&
        f.synergy.effects[0].effect.amount === 3
      return { id, ok: f.pieces.length === n && noCenter && cols && flatBlock, n: f.pieces.length }
    })
    const bodies = FB.map((id) => {
      const d = ENEMIES[id]
      const notInPool = !Object.values(ACT_ENEMIES).some((arr) => arr.includes(id))
      const hpOk = (d?.maxHp || 0) >= 52 && (d?.maxHp || 0) <= 60
      const hasAtk = (d?.movePattern || []).some((m) => m.type === "attack" && (m.amount || 0) > 0)
      return { id, ok: !!d && Number.isInteger(d.act) && hpOk && hasAtk && NON_BATTLE_ENEMY_IDS.has(id) && notInPool, hp: d?.maxHp, act: d?.act }
    })
    const menderHeals = (ENEMIES["mossmender"].movePattern || []).some((m) => m.type === "heal")
    const bastionWard = (ENEMIES["grave-bastion"].passive || []).some((p) => p.type === "applyBuff" && p.id === "ward")
    // the-bulwark must NOT trip the 4+ Swarm gate
    const notSwarmSized = FORMATIONS["the-bulwark"].pieces.length < 4 && FORMATIONS["the-bastion"].pieces.length < 4
    out.data = { forms, bodies, menderHeals, bastionWard, notSwarmSized }
    if (!forms.every((x) => x.ok) || !bodies.every((x) => x.ok) || !menderHeals || !bastionWard || !notSwarmSized) {
      out.errors.push("check1 data")
    }
  }

  const du = (defId) => ({ defId, upgradeLevel: 0, upgrades: [], itemIds: [] })
  const start = (formationId, squad) =>
    auto.startAutoBattle("tommy", squad, formationId, [], 0, {}, [], [], 1, null, "restless")

  // 2. wall synergy is FLAT (block resets each round -> turnStart block 3
  //    is non-compounding by construction) -------------------------------
  {
    let st = start("the-bulwark", [])
    const labelSet = st.enemySynergyLabel === "The wall holds firm"
    const trig = (e) => (e.triggers || []).find((t) => t.trigger === "turnStart" && t.effect?.type === "block")
    const eachHasTrigger = (st.enemies || []).length === 3 && st.enemies.every((e) => trig(e)?.effect?.amount === 3)
    // drive 3 rounds; the trigger amount must still be exactly 3 (it does
    // not ramp), and no living piece's block runs away past
    // synergy(3) + its own biggest pattern block step + margin.
    let s = st
    for (let i = 0; i < 3 && s.phase === "player"; i++) s = auto.resolveRound(s)
    const stillFlat = (s.enemies || []).filter((e) => e.hp > 0).every((e) => {
      const t = trig(e)
      const patBlock = Math.max(0, ...(ENEMIES[e.defId].movePattern || []).filter((m) => m.type === "block").map((m) => m.amount || 0))
      return (!t || t.effect.amount === 3) && (e.block || 0) <= 3 + patBlock + 4
    })
    out.synergy = { labelSet, eachHasTrigger, stillFlat, roundAfter: s.round }
    if (!(labelSet && eachHasTrigger && stillFlat)) out.errors.push("check2 wall synergy not flat")
  }

  // 3. armour-break / DoT beats a slow grind --------------------------------
  {
    // counter = a lone shatter carrier (strips the +3/round wall); grind =
    // a lone plain attacker of near-identical stats (atk 5 vs knoll's
    // atk 6 - a conservative handicap: the counter must still clearly
    // win). Solo carries so the wall actually matters - a full squad +
    // commander steamrolls either way and the signal vanishes.
    const counterSquad = [du("stoneknoll")]
    const grindSquad = [du("strength")]
    const run = (squad) => {
      const done = auto.autoResolveBattle(start("the-bulwark", squad))
      return { round: done.round, hp: done.lowestSquadHpPct ?? 1, phase: done.phase }
    }
    const counter = run(counterSquad)
    const grind = run(grindSquad)
    out.counter = { counter, grind }
    if (!(counter.round <= grind.round && counter.hp >= grind.hp - 0.01)) {
      out.errors.push("check3 shatter counter not clearly better than grind")
    }
  }

  // 4. both formations RESOLVE vs a mid squad (not stuck at the 30-round
  //    cap - the wall is breakable and the bodies threaten) --------------
  {
    const mid = [du("the-chariot"), du("stoneknoll"), du("the-fool")]
    const check = (fid) => {
      const done = auto.autoResolveBattle(start(fid, mid))
      return { fid, round: done.round, phase: done.phase, resolved: (done.phase === "won" || done.phase === "lost") && done.round < 30 }
    }
    const a = check("the-bulwark")
    const b = check("the-bastion")
    out.resolve = { a, b }
    if (!(a.resolved && b.resolved)) out.errors.push("check4 a fortress fight did not resolve under the cap")
  }

  // 5. RUN_PATH ----------------------------------------------------------
  {
    const ids = RUN_PATH.filter((n) => n.type === "battle" && n.formationId).map((n) => n.formationId)
    const hasBulwark = ids.includes("the-bulwark")
    const hasBastion = ids.includes("the-bastion")
    const noOld = !ids.includes("twin-watch") && !ids.includes("sirens-bodyguard")
    const round = deserializeRun(JSON.parse(JSON.stringify(serializeRun(startRun("tommy")))))
    out.runpath = { len: RUN_PATH.length, hasBulwark, hasBastion, noOld, roundOk: round != null, ver: RUN_SAVE_VERSION }
    if (!(hasBulwark && hasBastion && noOld && round != null && RUN_PATH.length === 111 && RUN_SAVE_VERSION === 3)) {
      out.errors.push("check5 RUN_PATH")
    }
  }

  // 6. threat preview (#432) reads a Fortress ----------------------------
  {
    const f = resolveFormation("the-bulwark")
    const roster = f.pieces.map((p, i) => ({ defId: p.defId, hp: 40, maxHp: ENEMIES[p.defId].maxHp, pos: p.pos, id: `e${i}` }))
    const t = evaluateThreat(roster, { ...startRun("tommy"), deployed: [] }, { type: "battle" })
    const answersCounter = /armour-break|damage-over-time|Shatter|Sunder|burst/i.test(t.note || "")
    out.threat = { primary: t.primary?.id, secondary: t.secondary?.id, mechanics: t.mechanics, note: t.note, rating: t.rating }
    if (!(["armor", "sustain"].includes(t.primary?.id) && t.mechanics.includes("Heals itself") && answersCounter)) {
      out.errors.push("check6 threat preview")
    }
  }

  return out
})

console.log(JSON.stringify(R, null, 2))
console.log("\npageErrors:", errs.length, errs.slice(0, 8))

// screenshot the FormationScreen vs the-bulwark
try {
  await page.evaluate(async () => {
    const engine = await import("/src/services/heartwood/runEngine.js")
    const { RUN_PATH } = engine
    const idx = RUN_PATH.findIndex((n) => n.formationId === "the-bulwark")
    let run = engine.startRun("tommy", null, { forcedSeed: 0xf0f0f })
    run = {
      ...run,
      nodeIndex: idx,
      path: RUN_PATH.slice(0, idx + 1),
      phase: "formation",
      lastSeenAct: 7, // suppress the Act-boundary crossroads interstitial
      bench: [
        { key: 1, defId: "the-fool", upgrades: [], upgradeLevel: 0, wins: 0 },
        { key: 2, defId: "the-fool", upgrades: [], upgradeLevel: 0, wins: 0 },
      ],
      deployed: [1, 2, null, null],
      items: [],
    }
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(engine.serializeRun(run)))
    localStorage.setItem("heartwood-story-intro-seen", "1")
    localStorage.setItem("heartwood-coach-enabled-v1", "false")
  })
  await page.reload()
  await page.waitForSelector(".hw-fortress-hint", { timeout: 20000 })
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${SHOT}/fortress.png` })
  const txt = await page.$eval(".hw-fortress-hint", (el) => el.textContent.replace(/\s+/g, " ").trim())
  const badge = await page.$eval(".hw-badge", (el) => el.textContent.replace(/\s+/g, " ").trim()).catch(() => "(no badge)")
  console.log("fortress hint:", txt)
  console.log("formation badge:", badge)
} catch (e) {
  console.log("shot skip:", e.message)
}

await browser.close()
const pass = R.errors.length === 0 && errs.length === 0
console.log(pass ? "\n✅ verify_fortress PASS" : "\n❌ verify_fortress FAIL")
process.exit(pass ? 0 : 1)
