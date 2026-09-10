import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

// Hearthwood - The Collectors (8th enemy archetype, Enemy Ecosystem PRD
// 13, feat/hearthwood-collectors). Thieves that STEAL your buffs: every
// hit a Collector lands on a buffed player unit moves one stack of the
// first leechable buff (Strength / Bulwark / Ward / Regen / Evade) from
// the victim to the Collector (its `leech` marker -> an onDealDamage
// trigger -> effects.js's leech()). Burst it, Sunder it back, or field
// flat bodies. NO new status, NO RUN_SAVE_VERSION bump.

const PORT = process.env.PORT || 5379
const SHOT = "/home/marc/Wood-Booster-AI/Wood-Booster-OS-collectors/.scratch/shots"
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
  const { ENEMIES, NON_BATTLE_ENEMY_IDS, ACT_ENEMIES } = await import("/src/data/heartwood/enemies.js")
  const { FORMATIONS } = await import("/src/data/heartwood/formations.js")
  const { evaluateThreat } = await import("/src/data/heartwood/threatPreview.js")
  const { evaluateMatchup } = await import("/src/data/heartwood/counterplay.js")
  const { startRun, serializeRun, deserializeRun, RUN_SAVE_VERSION, RUN_PATH } = engine
  const out = { errors: [] }

  const du = (defId) => ({ defId, upgradeLevel: 0, upgrades: [], itemIds: [] })
  const start = (squad, formationId) =>
    auto.startAutoBattle("tommy", squad, formationId, [], 0, {}, [], [], 1, null, "restless")
  const collectors = (st) => st.enemies.filter((e) => ["hoardling", "tithe-warden"].includes(e.defId))
  const enemyStr = (st) => collectors(st).reduce((s, e) => s + (e.powers?.strength || 0), 0)
  const playerStr = (st) => st.playerUnits.reduce((s, u) => s + (u.hp > 0 ? u.powers?.strength || 0 : 0), 0)
  const setStrAll = (st, n) => ({ ...st, playerUnits: st.playerUnits.map((u) => ({ ...u, powers: { ...u.powers, strength: n } })) })

  // 1. Data ---------------------------------------------------------
  {
    const t = FORMATIONS["the-tithe"]
    const h = FORMATIONS["the-hoard"]
    const shape = (f) =>
      f && f.pieces.length === 3 && f.synergy?.label === "They take what's yours" &&
      Array.isArray(f.synergy.effects) && f.synergy.effects.length === 0 &&
      !f.pieces.some((p) => p.pos.row === 1 && p.pos.col === 1)
    const defsOk =
      ENEMIES["hoardling"]?.leech === true && ENEMIES["tithe-warden"]?.leech === true &&
      ENEMIES["hoardling"].act === 4 && ENEMIES["tithe-warden"].act === 5
    const excluded = ["hoardling", "tithe-warden"].every(
      (id) => NON_BATTLE_ENEMY_IDS.has(id) && !Object.values(ACT_ENEMIES).flat().includes(id),
    )
    out.data = { tithe: shape(t), hoard: shape(h), defsOk, excluded }
    if (!(shape(t) && shape(h) && defsOk && excluded)) out.errors.push("check1 data")
  }

  // 2. leech transfers a stack ----------------------------------
  {
    let st = setStrAll(start([du("the-fool"), du("the-fool")], "the-tithe"), 6)
    const pBefore = playerStr(st)
    const eBefore = enemyStr(st)
    let took = false
    let nothing = false
    for (let r = 0; r < 5 && st.phase === "player"; r++) {
      // top the squad's Strength back up so the theft is observable over
      // several rounds without the buff running dry.
      st = setStrAll(st, 6)
      const lb = st.log.length
      st = auto.resolveRound(st)
      const nl = st.log.slice(lb)
      if (nl.some((s) => /takes a stack of Strength from/.test(s))) took = true
      if (nl.some((s) => /finds nothing worth taking/.test(s))) nothing = true
    }
    // over the run the Collectors ACCUMULATED Strength they didn't start with
    const gained = enemyStr(st) - eBefore
    // the "nothing worth taking" no-op branch: a synthetic hit on a
    // buff-less unit logs it (drive a fight where the squad is stripped
    // of every leechable buff at the top of each round).
    let bl = start([du("the-fool"), du("the-fool")], "the-tithe")
    for (let r = 0; r < 4 && bl.phase === "player"; r++) {
      bl = {
        ...bl,
        playerUnits: bl.playerUnits.map((u) => ({ ...u, powers: { ...u.powers, strength: 0, bulwark: 0, ward: 0, regen: 0, evade: 0 } })),
      }
      bl = auto.resolveRound(bl)
    }
    const blNothing = (bl.log || []).some((s) => /finds nothing worth taking/.test(s))
    out.leech = { took, gained, eBefore, pBefore, blNothing, nothing }
    if (!(took && gained >= 2 && blNothing)) out.errors.push("check2 leech transfer")
  }

  // 3. No-op guards -------------------------------------------
  {
    // a dead Collector never leeches: hand-kill all Collectors, top the
    // squad's Strength, drive - no "takes a stack" line.
    let st = setStrAll(start([du("the-fool"), du("the-fool")], "the-tithe"), 6)
    st = { ...st, enemies: st.enemies.map((e) => (["hoardling", "tithe-warden"].includes(e.defId) ? { ...e, hp: 0 } : e)) }
    for (let r = 0; r < 3 && st.phase === "player"; r++) {
      st = setStrAll(st, 6)
      st = auto.resolveRound(st)
    }
    const deadNoLeech = !(st.log || []).some((s) => /takes a stack of/.test(s))
    out.guards = { deadNoLeech }
    if (!deadNoLeech) out.errors.push("check3 no-op guards")
  }

  // 4. vengeful (Wardknot) ----------------------------------
  {
    // the-hoard = 2 Tithe-Wardens (attack 5) for a reliable unblocked hit.
    // Wardknot at slot 1 ({2,1}) - NOT slot 0, which the Commander at
    // {1,0} shields (the #424 gotcha), so it's a legal single-target.
    // Strip its block + keep Strength at exactly 4 at the top of each
    // round, so a landed theft = -1 (leech) then +3 (vengeful) = net
    // 5 > 4 -> proof the theft PAID Wardknot.
    let st = start([du("the-fool"), du("wardknot")], "the-hoard")
    const wk = () => st.playerUnits.find((u) => u.defId === "wardknot")
    const vengefulStashed = (wk()?.powers?.vengeful || 0) === 3
    let bristled = false
    let netGain = false
    for (let r = 0; r < 8 && st.phase === "player"; r++) {
      st = {
        ...st,
        playerUnits: st.playerUnits.map((u) =>
          u.defId === "wardknot" ? { ...u, block: 0, powers: { ...u.powers, strength: 4 } } : u,
        ),
      }
      const lb = st.log.length
      st = auto.resolveRound(st)
      if (st.log.slice(lb).some((s) => /bristles at the theft/.test(s))) {
        bristled = true
        if ((wk()?.powers?.strength || 0) >= 5) netGain = true
      }
    }
    out.vengeful = { vengefulStashed, bristled, netGain, wkStr: wk()?.powers?.strength || 0 }
    if (!(vengefulStashed && bristled && netGain)) out.errors.push("check4 vengeful")
  }

  // 5. Both formations resolve -----------------------------
  {
    const mid = [du("the-hermit"), du("the-tower"), du("bulwark-of-ages"), du("willowmend")]
    const a = auto.autoResolveBattle(start(mid, "the-tithe"))
    const b = auto.autoResolveBattle(start(mid, "the-hoard"))
    const ok = (d) => (d.phase === "won" || d.phase === "lost") && d.round < 30
    out.resolve = { tithe: { phase: a.phase, round: a.round }, hoard: { phase: b.phase, round: b.round } }
    if (!(ok(a) && ok(b))) out.errors.push("check5 a formation did not resolve")
  }

  // 6. The counters ---------------------------------------
  {
    // Plainhewer (no buffs): the Collectors end with LESS stolen Strength
    // than against a Strength-stacked squad.
    const drive = (squad, topUp) => {
      let st = start(squad, "the-tithe")
      for (let r = 0; r < 8 && st.phase === "player"; r++) {
        st = { ...st, enemies: st.enemies.map((e) => (["hoardling", "tithe-warden"].includes(e.defId) ? { ...e, hp: ENEMIES[e.defId].maxHp } : e)) }
        if (topUp) st = setStrAll(st, 6)
        st = auto.resolveRound(st)
      }
      return st
    }
    const stFlat = drive([du("plainhewer"), du("plainhewer")], false)
    const stBuff = drive([du("the-fool"), du("the-fool")], true)
    const flatDenies = enemyStr(stFlat) < enemyStr(stBuff)
    // A Sunder unit strips the Collectors' accumulated stacks.
    const stSun = drive([du("oathsworn"), du("the-fool")], true)
    const sunderStrips = (stSun.log || []).some((s) => /Hoardling loses a stack of Strength|Tithe-Warden loses a stack of Strength/.test(s))
    out.counters = { flatDenies, sunderStrips, flatStr: enemyStr(stFlat), buffStr: enemyStr(stBuff) }
    if (!(flatDenies && sunderStrips)) out.errors.push("check6 the counters")
  }

  // 7. RUN_PATH / save ----------------------------------
  {
    const nodes = RUN_PATH.filter((n) => n.formationId === "the-tithe" || n.formationId === "the-hoard")
    const swapped = nodes.length === 2
    const hoardNoBeat = !RUN_PATH.find((n) => n.formationId === "the-hoard")?.beat
    const gone = !RUN_PATH.some((n) => n.formationId === "the-hollow-court" || n.enemyId === "thornfen")
    const len111 = RUN_PATH.length === 111
    const rs = startRun("tommy")
    const rt = deserializeRun(JSON.parse(JSON.stringify(serializeRun(rs))))
    out.path = { swapped, hoardNoBeat, gone, len111, rtOk: rt != null, ver: RUN_SAVE_VERSION }
    if (!(swapped && hoardNoBeat && gone && len111 && rt != null && RUN_SAVE_VERSION === 3)) out.errors.push("check7 RUN_PATH / save")
  }

  // 8. Threat preview ----------------------------------
  {
    const rs = startRun("tommy")
    const roster = FORMATIONS["the-tithe"].pieces.map((p) => ({ defId: p.defId, pos: p.pos, hp: ENEMIES[p.defId].maxHp }))
    const node = { type: "battle", formationId: "the-tithe" }
    const t = evaluateThreat(roster, rs, node)
    const primaryCol = t.primary?.id === "collectors"
    const mechCol = (t.mechanics || []).includes("Steals your buffs")
    const covRs = {
      ...rs,
      bench: [
        { key: "k0", defId: "plainhewer", upgrades: [], itemIds: [] },
        { key: "k1", defId: "oathsworn", upgrades: [], itemIds: [] },
        { key: "k2", defId: "the-fool", upgrades: [], itemIds: [] },
      ],
      deployed: ["k0", "k1", "k2", null],
    }
    const covered = evaluateMatchup(roster, covRs).covered.includes("collectors")
    const plainRs = { ...rs, bench: [{ key: "p0", defId: "the-fool", upgrades: [], itemIds: [] }], deployed: ["p0", null, null, null] }
    const gap = evaluateMatchup(roster, plainRs).gaps.includes("collectors")
    out.threat = { primaryCol, mechCol, covered, gap, primary: t.primary?.id, mechanics: t.mechanics }
    if (!(primaryCol && mechCol && covered && gap)) out.errors.push("check8 threat preview")
  }

  return out
})

console.log(JSON.stringify(R, null, 2))
console.log("\npageErrors:", errs.length, errs.slice(0, 8))

// screenshot the FormationScreen vs the-tithe
try {
  await page.evaluate(async () => {
    const engine = await import("/src/services/heartwood/runEngine.js")
    const { RUN_PATH } = engine
    const idx = RUN_PATH.findIndex((n) => n.formationId === "the-tithe")
    let run = engine.startRun("tommy", null, { forcedSeed: 0xc011 })
    run = {
      ...run, nodeIndex: idx, path: RUN_PATH.slice(0, idx + 1), phase: "formation", lastSeenAct: 7,
      bench: [
        { key: 1, defId: "plainhewer", upgrades: [], upgradeLevel: 0, wins: 0 },
        { key: 2, defId: "wardknot", upgrades: [], upgradeLevel: 0, wins: 0 },
        { key: 3, defId: "oathsworn", upgrades: [], upgradeLevel: 0, wins: 0 },
      ],
      deployed: [1, 2, 3, null], items: [],
    }
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(engine.serializeRun(run)))
    localStorage.setItem("heartwood-story-intro-seen", "1")
    localStorage.setItem("heartwood-coach-enabled-v1", "false")
  })
  await page.reload()
  await page.waitForSelector(".hw-collectors-hint", { timeout: 20000 })
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${SHOT}/collectors_formation.png` })
  console.log("collectors hint:", await page.$eval(".hw-collectors-hint", (el) => el.textContent.replace(/\s+/g, " ").trim()))
  console.log("threat panel:", await page.$eval(".hw-threat-preview", (el) => el.textContent.replace(/\s+/g, " ").trim().slice(0, 180)).catch(() => "(none)"))
} catch (e) {
  console.log("shot skip:", e.message)
}

await browser.close()
const pass = R.errors.length === 0 && errs.length === 0
console.log(pass ? "\n✅ verify_collectors PASS" : "\n❌ verify_collectors FAIL")
process.exit(pass ? 0 : 1)
