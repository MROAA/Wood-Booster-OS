import { chromium } from "playwright"

// Sprint 3 - enemy factions (tacticsFactions.js): Wanderers (hit-and-run),
// Mirror (echoes of the deployed squad), Corrupted (spreading Blight).
// Per faction: formation loads in tactics, identity mechanic works,
// deterministic run placement (ACT_ENEMIES pools untouched), preview ==
// real, UI tag/badge. Plus: auto-battler doesn't choke on the new bodies.
const PORT = process.env.PORT || 5445
const browser = await chromium.launch()
const errs = []
const out = { errors: [] }
const newPage = async () => {
  const p = await browser.newContext({ viewport: { width: 1600, height: 1000 } }).then((c) => c.newPage())
  p.on("pageerror", (e) => errs.push(String(e)))
  return p
}
const fail = (cond, name) => {
  if (!cond) out.errors.push(name)
}

const page = await newPage()
await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })

const r = await page.evaluate(async () => {
  const E = await import("/src/services/heartwood/tacticsEngine.js")
  const F = await import("/src/services/heartwood/tacticsFactions.js")
  const rt = await import("/src/services/heartwood/runEngine.js")
  const RM = await import("/src/services/heartwood/tacticsRealMatchup.js")
  const EN = await import("/src/data/heartwood/enemies.js")
  const FO = await import("/src/data/heartwood/formations.js")
  const AB = await import("/src/services/heartwood/autoBattleEngine.js")
  const T = await import("/src/services/heartwood/tacticsTerrain.js")
  const res = {}
  const at = (u, p) => u.pos.row === p.row && u.pos.col === p.col
  const u = (s, id) => s.units.find((x) => x.id === id)
  const dist = (a, b) => Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col))
  // preview == real: every previewed intent's end position matches.
  const previewRows = (s, turns) => {
    const rows = []
    for (let t = 0; t < turns && s.phase === "player"; t++) {
      const preview = E.previewEnemyIntents(s)
      // Blight telegraph: the dashed "next" tiles are exactly what spreads.
      const nextBlight = F.blightPreviewKeys(s).slice().sort().join(",")
      const after = E.endPlayerTurn(s)
      if (s.faction === "corrupted") rows.push({ blight: true, ok: nextBlight === (after.blightFresh || []).slice().sort().join(",") })
      // Each previewed enemy ends exactly where the telegraph says:
      // the Fade landing, else the move tile, else where it stood.
      for (const { enemyId, intent } of preview) {
        const before = s.units.find((x) => x.id === enemyId)
        const now = after.units.find((x) => x.id === enemyId)
        if (!now || now.hp <= 0 || !before) continue
        const slid = (to) => at(now, to) || at(now, T.slideLanding({ ...s, terrain: after.terrain }, enemyId, before.pos, to))
        let ok = true
        if (intent.fadeTo) ok = at(now, intent.fadeTo)
        else if (intent.kind === "move" || intent.kind === "move-attack" || (intent.kind === "wall" && intent.to)) ok = slid(intent.to)
        else if (intent.kind === "skill" && intent.skillKind === "pounce") ok = at(now, intent.land)
        else if (intent.kind === "skill" && intent.to) ok = slid(intent.to)
        else if (intent.kind === "hold" || (intent.kind === "attack" && !intent.retreat) || intent.kind === "stunned") ok = at(now, before.pos)
        rows.push({ enemyId, kind: intent.kind, fade: !!intent.fade, ok })
      }
      // Deterministic: the same start state resolves identically.
      const again = E.endPlayerTurn(s)
      const same = after.units.every((x) => { const y = again.units.find((z) => z.id === x.id); return y && y.hp === x.hp && at(y, x.pos) })
      rows.push({ deterministic: true, ok: same })
      s = after
    }
    return rows
  }
  // Stronger preview==real: for single-actor states, the previewed
  // move/fade destination is where the unit really ends up.
  const clean = { block: 0, ward: 0, revive: 0, bulwark: 0, taunt: 0, poison: 0, weak: 0, vulnerable: 0, slow: 0, root: 0, suppressed: 0, stun: 0, phases: [], triggers: [], aoeMove: null, enemySkills: [], ap: 2, apMax: 2 }
  const base = E.createTacticsBattle()
  const pTpl = base.units.find((x) => x.side === "player")
  const eTpl = base.units.find((x) => x.side === "enemy")
  const mk = (tpl, id, side, row, col, extra = {}) => ({ ...tpl, ...clean, id, side, name: id, pos: { row, col }, hp: 30, maxHp: 30, attack: 5, range: 1, move: 2, facing: side === "player" ? "W" : "E", faction: null, skirmisher: false, echo: false, ...extra })
  const P = (id, row, col, extra) => mk(pTpl, id, "player", row, col, extra)
  const En = (id, row, col, extra) => mk(eTpl, id, "enemy", row, col, extra)
  const st = (units, extra = {}) => ({ ...base, formationId: null, faction: null, blight: null, units, terrain: {}, phase: "player", turn: 1, log: [], events: [], ...extra })

  // ---- 0. data + pools ------------------------------------------------------
  const NEW = ["wayfarer-scout", "drift-archer", "vagrant-blade", "echo-shade", "echo-warden", "echo-archer", "blightfang", "tainted-sapling", "blightheart-troll", "blight-seer"]
  const pools = Object.fromEntries(Object.entries(EN.ACT_ENEMIES).map(([a, ids]) => [a, ids.length]))
  res.c0 = {
    defs: NEW.every((id) => EN.ENEMIES[id]),
    nonBattle: NEW.every((id) => EN.NON_BATTLE_ENEMY_IDS.has(id)),
    notInPools: Object.values(EN.ACT_ENEMIES).every((ids) => NEW.every((id) => !ids.includes(id))),
    pools,
    factions: NEW.map((id) => EN.ENEMIES[id].faction),
  }

  // ---- 1. placement ---------------------------------------------------------
  const expect = { 36: ["the-drift", 2], 58: ["the-taint", 3], 74: ["the-roaming-band", 4], 80: ["the-spreading-dark", 4], 84: ["the-looking-pool", 5] }
  const placed = Object.entries(expect).map(([i, [fid, act]]) => {
    const n = rt.RUN_PATH[i]
    return { i: +i, ok: n.type === "battle" && n.formationId === fid && rt.actIndexForNode(+i, rt.RUN_PATH.length) === act && FO.FORMATIONS[fid].faction }
  })
  const poolA = rt.startRun("tommy", null, { forcedSeed: 12345 })?.battlePool?.map((n) => n.formationId || n.enemyId)
  const poolB = rt.startRun("tommy", null, { forcedSeed: 12345 })?.battlePool?.map((n) => n.formationId || n.enemyId)
  res.c1 = {
    len: rt.RUN_PATH.length,
    placed,
    factionOf: ["the-drift", "the-taint", "the-looking-pool"].map(F.factionForEncounter),
    deterministic: JSON.stringify(poolA) === JSON.stringify(poolB),
    inPool: ["the-drift", "the-roaming-band", "the-taint", "the-spreading-dark", "the-looking-pool"].every((id) => (poolA || []).includes(id)),
  }

  // A real run node, built the way HeartwoodBattle.jsx builds it.
  const runAt = (idx, bench) => ({
    ...rt.startRun("tommy", null, { forcedSeed: 777 }),
    nodeIndex: idx,
    path: rt.RUN_PATH.slice(0, idx + 1),
    phase: "formation",
    bench,
    deployed: [...bench.map((b) => b.key), null, null, null].slice(0, 4),
    items: [],
    lastSeenAct: rt.actIndexForNode(idx, rt.RUN_PATH.length),
  })
  const realBattle = (rs) => rt.startTacticsFormationBattle(rs, (s) => RM.buildRunTacticsBattle(rs, s)).battle
  const bench3 = [
    { key: "b1", defId: "the-fool", upgradeLevel: 0, upgrades: [] },
    { key: "b2", defId: "bulwark-of-ages", upgradeLevel: 0, upgrades: [] },
    { key: "b3", defId: "hexbreaker", upgradeLevel: 0, upgrades: [] },
  ]

  // ---- 2. Wanderers ---------------------------------------------------------
  {
    const proto = E.createTacticsBattle("wanderers")
    const enemies = proto.units.filter((x) => x.side === "enemy" && !x.structure)
    const real = realBattle(runAt(36, bench3))
    const realE = real.units.filter((x) => x.side === "enemy" && !x.structure)
    // Hit-and-run: a scout 3 tiles from the archer strikes, then fades.
    const s = st([En("scout", 4, 4, { skirmisher: true, faction: "wanderers", move: 3 }), P("archer", 4, 7, { range: 3, hp: 40, maxHp: 40 }), P("tank", 0, 11, { hp: 40, maxHp: 40 })])
    const intent = E.previewEnemyIntents(s).find((i) => i.enemyId === "scout").intent
    // Replay the preview scratch: where does the preview think it ends?
    const after = E.endPlayerTurn(s)
    const sc = u(after, "scout")
    const fadeEvt = (after.events || []).some((e) => e.kind === "reaction" && e.label === "Fade!")
    // Root holds it in place after the strike.
    const sRoot = st([En("scout", 4, 5, { skirmisher: true, faction: "wanderers", move: 3, root: 2 }), P("archer", 4, 6, { range: 3, hp: 40, maxHp: 40 })])
    const afterRoot = E.endPlayerTurn(sRoot)
    // Backline first: equidistant melee tank vs ranged archer.
    const sBack = st([En("scout", 4, 2, { skirmisher: true, faction: "wanderers", move: 3 }), P("tank", 2, 5, { hp: 30, maxHp: 30 }), P("archer", 6, 5, { range: 3, hp: 30, maxHp: 30 })])
    const backIntent = E.previewEnemyIntents(sBack).find((i) => i.enemyId === "scout").intent
    // Same state without skirmisher: plain enemy doesn't fade.
    const sPlain = st([En("brute", 4, 4, { move: 3 }), P("archer", 4, 7, { range: 3, hp: 40, maxHp: 40 })])
    const plainIntent = E.previewEnemyIntents(sPlain).find((i) => i.enemyId === "brute").intent
    res.wanderers = {
      protoFaction: proto.faction,
      enemyFactions: enemies.map((x) => x.faction),
      moveBonus: enemies.every((x) => x.skirmisher && x.move === (x.maxHp >= 40 ? 2 : 3) + 1),
      realFaction: real.faction,
      realIds: realE.map((x) => x.defId),
      intent,
      archerHp: u(after, "archer").hp,
      scoutPos: sc.pos,
      fadeToMatches: !!intent.fadeTo && at(sc, intent.fadeTo),
      scoutDistFromArcher: dist(sc.pos, u(after, "archer").pos),
      struckFrom: intent.to || u(s, "scout").pos,
      fadeEvt,
      fadeLog: after.log.some((l) => /fades back/.test(l)),
      rootStays: at(u(afterRoot, "scout"), { row: 4, col: 5 }) && u(afterRoot, "archer").hp < 40,
      backTarget: backIntent.targetId,
      plainFade: !!plainIntent.fade,
    }
    // Exact preview: the scout's previewed strike tile + fade land = real.
    // (The preview scratch runs the same applyEnemyIntent incl. applyFade.)
    const prevScratch = E.previewEnemyIntents(s)
    res.wanderers.previewDeterministic = JSON.stringify(prevScratch) === JSON.stringify(E.previewEnemyIntents(s))
    res.wanderers.previewRows = previewRows(E.createTacticsBattle("wanderers"), 4)
    res.wanderers.realPreviewRows = previewRows(real, 3)
  }

  // ---- 3. Mirror ------------------------------------------------------------
  {
    const squad = ["bulwark-of-ages", "the-fool", "hexbreaker", "oathshield"]
    const proto = E.createTacticsBattle("mirror", squad)
    const echoes = proto.units.filter((x) => x.side === "enemy" && !x.structure)
    const players = proto.units.filter((x) => x.side === "player" && x.id !== "player-commander")
    const rs = runAt(84, bench3)
    const real = realBattle(rs)
    const realE = real.units.filter((x) => x.side === "enemy" && !x.structure)
    const preview = rt.previewBattleEnemies(rs)
    // Raw vs mirror factor: echoes are weakened relative to the ramp.
    const rawFactor = rt.difficultyFactorForNode(84, rs.path.length)
    // An echo of The Fool (Regrowth -> Echoed Regrowth mend) heals a hurt echo.
    const fool = echoes.find((x) => x.defId === "the-fool")
    const s = st([
      { ...fool, pos: { row: 4, col: 1 }, ap: 2, apMax: 2 },
      { ...echoes.find((x) => x.defId === "bulwark-of-ages"), pos: { row: 4, col: 2 }, hp: 8 },
      P("p1", 4, 11, { hp: 30 }),
    ])
    const mendIntent = E.previewEnemyIntents(s).find((i) => i.enemyId === fool.id).intent
    const afterMend = E.endPlayerTurn(s)
    res.mirror = {
      protoFaction: proto.faction,
      echoDefIds: echoes.map((x) => x.defId),
      names: echoes.map((x) => x.name),
      allEcho: echoes.every((x) => x.echo && x.faction === "mirror"),
      weakenedHp: echoes.every((e) => { const p = players.find((q) => q.defId === e.defId); return p && e.maxHp === Math.round(p.maxHp * 0.75) }),
      skills: echoes.map((x) => (x.enemySkills || []).map((k) => `${k.kind}:${k.name}`).join("|")),
      realFaction: real.faction,
      realEchoIds: realE.map((x) => x.defId),
      realNames: realE.map((x) => x.name),
      realAllEcho: realE.every((x) => x.echo),
      previewIds: preview.map((x) => x.defId),
      previewNames: preview.map((x) => x.name),
      rawFactor,
      mendIntent: mendIntent.kind === "skill" ? `${mendIntent.skillKind}:${mendIntent.name}` : mendIntent.kind,
      mendedHp: u(afterMend, echoes.find((x) => x.defId === "bulwark-of-ages").id).hp,
      previewRows: previewRows(proto, 3),
      realPreviewRows: previewRows(real, 3),
    }
    // Same deployed squad -> same echoes (deterministic).
    res.mirror.deterministic = JSON.stringify(realBattle(runAt(84, bench3)).units.map((x) => [x.id, x.hp, x.pos])) === JSON.stringify(real.units.map((x) => [x.id, x.hp, x.pos]))
  }

  // ---- 4. Corrupted ---------------------------------------------------------
  {
    const proto = E.createTacticsBattle("corrupted")
    const seeded = Object.keys(proto.blight || {}).length
    const corruptedIds = proto.units.filter((x) => x.side === "enemy" && !x.structure).map((x) => x.id)
    const nextKeys = F.blightPreviewKeys(proto)
    const after = E.endPlayerTurn(proto)
    const grown = Object.keys(after.blight).length
    // Player on Blight gets Poisoned; enemy corrupted on Blight: +2 dmg, mends.
    const sBl = st(
      [
        En("fang", 4, 3, { faction: "corrupted", hp: 20, maxHp: 30, attack: 5, root: 2 }),
        P("victim", 4, 4, { hp: 30, maxHp: 30 }),
      ],
      { faction: "corrupted", blight: { "4-3": true, "4-4": true } },
    )
    const aBl = E.endPlayerTurn(sBl)
    const sOff = st([En("fang", 4, 3, { faction: "corrupted", hp: 20, maxHp: 30, attack: 5, root: 2 }), P("victim", 4, 4, { hp: 30, maxHp: 30 })], { faction: null, blight: null })
    // No spread from off-blight for this one: check the damage delta only.
    const offDmg = 30 - u(E.endPlayerTurn(sOff), "victim").hp
    const onVictim = u(aBl, "victim")
    // Killing every corrupted unit stops the spread.
    const dead = { ...proto, units: proto.units.map((x) => (x.side === "enemy" ? { ...x, hp: 0 } : x)) }
    res.corrupted = {
      protoFaction: proto.faction,
      seeded,
      corrupted: corruptedIds.length,
      nextKeys: nextKeys.length,
      grown,
      freshMatchesTelegraph: nextKeys.slice().sort().join(",") === (after.blightFresh || []).slice().sort().join(","),
      spreadsTowardSquad: (() => {
        const pl = after.units.filter((x) => x.side === "player" && x.hp > 0)
        const d = (k) => { const [r, c] = k.split("-").map(Number); return Math.min(...pl.map((p) => dist(p.pos, { row: r, col: c }))) }
        const seededKeys = Object.keys(proto.blight)
        return Math.min(...(after.blightFresh || []).map(d)) < Math.min(...seededKeys.map(d))
      })(),
      spreadLog: after.log.some((l) => /corruption spreads/.test(l)),
      victimBlighted: aBl.log.some((l) => /stands in the Blight/.test(l)),
      victimPoisonedDmg: 30 - onVictim.hp,
      offDmg,
      fangMended: aBl.log.some((l) => /drinks from the Blight/.test(l)),
      fangHpAfter: u(aBl, "fang").hp,
      bonus: F.blightAttackBonus(sBl, u(sBl, "fang")),
      noSpreadWhenDead: F.nextBlightSpread(dead).length === 0,
      maxCap: (() => {
        let s = proto
        for (let i = 0; i < 12 && s.phase === "player"; i++) s = E.endPlayerTurn({ ...s, units: s.units.map((x) => (x.side === "player" ? { ...x, hp: 999, maxHp: 999 } : x)) })
        return Object.keys(s.blight).length <= F.BLIGHT_MAX
      })(),
      previewRows: previewRows(proto, 4),
    }
    const real = realBattle(runAt(58, bench3))
    res.corrupted.realFaction = real.faction
    res.corrupted.realBlight = Object.keys(real.blight || {}).length
    res.corrupted.realIds = real.units.filter((x) => x.side === "enemy" && !x.structure).map((x) => x.defId)
    res.corrupted.realPreviewRows = previewRows(real, 3)
  }

  // ---- 5. auto-battler still resolves every faction formation ---------------
  res.auto = {}
  for (const fid of ["the-drift", "the-roaming-band", "the-taint", "the-spreading-dark", "the-looking-pool"]) {
    try {
      const b = AB.startAutoBattle("tommy", ["the-fool", "bulwark-of-ages"], fid)
      const done = AB.autoResolveBattle(b)
      res.auto[fid] = done.phase
    } catch (e) {
      res.auto[fid] = `ERR ${e.message}`
    }
  }
  try {
    const b = AB.startAutoBattle("tommy", ["the-fool"], "the-looking-pool", [], 0, {}, [], [], 1, null, "restless", [{ defId: "the-fool", upgrades: [] }])
    res.auto.mirrorSquad = AB.autoResolveBattle(b).phase + ":" + b.enemies.map((e) => e.name).join(",")
  } catch (e) {
    res.auto.mirrorSquad = `ERR ${e.message}`
  }
  return res
})
out.logic = r

// Check verdicts
fail(r.c0.defs && r.c0.nonBattle && r.c0.notInPools, "c0 new defs exist, all NON_BATTLE, none in ACT_ENEMIES pools")
fail(JSON.stringify(r.c0.pools) === JSON.stringify({ 1: 8, 2: 18, 3: 9, 4: 11, 5: 3, 6: 2, 7: 2 }), "c0 ACT_ENEMIES pool sizes unchanged")
fail(r.c1.len === 111 && r.c1.placed.every((p) => p.ok) && r.c1.deterministic && r.c1.inPool, "c1 run placement deterministic + in pool")
fail(r.c1.factionOf.join() === "wanderers,corrupted,mirror", "c1 factionForEncounter")
const w = r.wanderers
fail(w.protoFaction === "wanderers" && w.enemyFactions.every((f) => f === "wanderers") && w.moveBonus, "w1 wanderers formation loads (faction, +1 move)")
fail(w.realFaction === "wanderers" && w.realIds.join() === "vagrant-blade,wayfarer-scout,drift-archer", "w2 real run node 36 = The Drift")
fail(w.intent.fade && w.intent.targetId === "archer" && w.archerHp < 40 && w.scoutDistFromArcher >= 2 && w.fadeEvt && w.fadeLog && w.fadeToMatches, "w3 hit-and-run: strike then fade")
fail(w.rootStays, "w4 Root stops the fade")
fail(w.backTarget === "archer", "w5 skirmisher hunts the backline")
fail(!w.plainFade, "w6 non-skirmisher never fades")
fail(w.previewDeterministic && w.previewRows.every((x) => x.ok) && w.realPreviewRows.every((x) => x.ok) && w.previewRows.some((x) => x.fade), "w7 preview == real (fade landing telegraphed)")
const m = r.mirror
fail(m.protoFaction === "mirror" && m.echoDefIds.join() === "bulwark-of-ages,the-fool,hexbreaker,oathshield" && m.allEcho && m.names.every((n) => n.startsWith("Echo of ")) && m.weakenedHp, "m1 prototype mirror = weakened echoes of the squad")
fail(m.skills.every((s) => s.length > 0) && m.skills.some((s) => s.startsWith("mend:Echoed")), "m2 echoes carry their unit's ability as a skill")
fail(m.realFaction === "mirror" && m.realEchoIds.join() === "the-fool,bulwark-of-ages,hexbreaker" && m.realAllEcho && m.realNames.every((n) => n.startsWith("Echo of ")), "m3 real run node 84 mirrors the real deployed squad")
fail(m.previewIds.join() === m.realEchoIds.join() && m.previewNames.join() === m.realNames.join(), "m4 formation preview == real echoes")
fail(m.mendIntent.startsWith("mend:Echoed") && m.mendedHp > 8, "m5 echo uses its copied ability (Echoed heal)")
fail(m.deterministic && m.previewRows.every((x) => x.ok) && m.realPreviewRows.every((x) => x.ok), "m6 mirror deterministic + preview")
const c = r.corrupted
fail(c.protoFaction === "corrupted" && c.seeded === c.corrupted && c.seeded === 3, "k1 corrupted formation seeds Blight under each unit")
fail(c.grown > c.seeded && c.nextKeys > 0 && c.freshMatchesTelegraph && c.spreadsTowardSquad && c.spreadLog, "k2 Blight spreads toward the squad, telegraph exact")
fail(c.victimBlighted && c.victimPoisonedDmg === c.offDmg + 3 && c.bonus === 2, "k3 player on Blight Poisoned + corrupted +2 on Blight")
fail(c.fangMended, "k4 corrupted on Blight mends")
fail(c.noSpreadWhenDead && c.maxCap, "k5 spread stops when corrupted die, capped")
fail(c.realFaction === "corrupted" && c.realBlight === 3 && c.realIds.join() === "blightfang,blightheart-troll,tainted-sapling", "k6 real run node 58 = The Taint with Blight")
fail(c.previewRows.every((x) => x.ok) && c.realPreviewRows.every((x) => x.ok), "k7 corrupted preview == real (blight telegraph)")
fail(Object.values(r.auto).every((v) => /^(won|lost)/.test(v)) && /Echo of/.test(r.auto.mirrorSquad), "a1 auto-battler resolves every faction formation")

// ---- UI: prototype picker + board -----------------------------------------
{
  const p = await newPage()
  await p.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await p.waitForSelector(".hwt-board", { timeout: 20000 })
  const ui = {}
  const begin = async () => {
    const b = p.locator(".hwt-begin-battle")
    if (await b.count()) await b.click()
    await p.waitForTimeout(250)
  }
  ui.buttons = await p.locator(".hwt-formation-btn").allInnerTexts()
  await p.locator(".hwt-formation-btn", { hasText: "The Corrupted" }).click()
  await p.waitForTimeout(300)
  await begin()
  ui.corruptBanner = await p.locator(".hwt-faction-banner").innerText().catch(() => "")
  ui.blight0 = await p.locator('.hwt-cell[data-blight="true"]').count()
  ui.blightNext = await p.locator('.hwt-cell[data-blight-next="true"]').count()
  ui.corruptBadges = await p.locator('.hwt-faction-badge[data-faction="corrupted"]').count()
  await p.locator(".hwt-end-turn").click()
  await p.waitForTimeout(1200)
  ui.blight1 = await p.locator('.hwt-cell[data-blight="true"]').count()
  ui.blightFresh = await p.locator('.hwt-cell[data-blight-fresh="true"]').count()
  await p.screenshot({ path: "/tmp/factions_corrupted.png" })
  await p.locator(".hwt-formation-btn", { hasText: "The Mirror" }).click()
  await p.waitForTimeout(300)
  await begin()
  ui.echoes = await p.locator('.hwt-token[data-echo="true"]').count()
  ui.echoNames = await p.locator('.hwt-token[data-echo="true"] .hwt-token-name').allInnerTexts()
  ui.echoOpacity = await p.locator('.hwt-token[data-echo="true"] .hwt-token-art').first().evaluate((el) => getComputedStyle(el).opacity)
  ui.mirrorBanner = await p.locator(".hwt-faction-banner").innerText().catch(() => "")
  await p.locator(".hwt-board").scrollIntoViewIfNeeded()
  await p.screenshot({ path: "/tmp/factions_mirror.png" })
  await p.locator(".hwt-formation-btn", { hasText: "Wanderers" }).click()
  await p.waitForTimeout(300)
  await begin()
  ui.wanderBanner = await p.locator(".hwt-faction-banner").innerText().catch(() => "")
  ui.wanderBadges = await p.locator('.hwt-faction-badge[data-faction="wanderers"]').count()
  await p.locator(".hwt-end-turn").click()
  await p.waitForTimeout(1200)
  ui.fadeTiles = await p.locator('.hwt-cell[data-fade-to="true"]').count()
  await p.locator(".hwt-board").scrollIntoViewIfNeeded()
  await p.screenshot({ path: "/tmp/factions_wanderers.png" })
  await p.close()
  out.ui = ui
  fail(["Wanderers", "The Mirror", "The Corrupted"].every((n) => ui.buttons.some((b) => b.includes(n))), "u1 picker lists the 3 factions")
  fail(/The Corrupted - the ground itself turns on you/.test(ui.corruptBanner) && ui.blight0 === 3 && ui.blightNext > 0 && ui.corruptBadges === 3, "u2 corrupted banner + Blight tiles + badges")
  fail(ui.blight1 > ui.blight0 && ui.blightFresh > 0, "u3 Blight visibly spreads after End Turn")
  fail(ui.echoes >= 3 && ui.echoNames.every((n) => n.startsWith("Echo of")) && Number(ui.echoOpacity) < 0.9 && /The Mirror/.test(ui.mirrorBanner), "u4 ghostly echoes + mirror banner")
  fail(/they strike and vanish/.test(ui.wanderBanner) && ui.wanderBadges === 3, "u5 wanderers banner + badges")
}

// ---- UI: formation screen tag (real run save) -----------------------------
{
  const p = await newPage()
  await p.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
  const setSave = async (idx) =>
    p.evaluate(async (idx) => {
      const { startRun, serializeRun, RUN_PATH, actIndexForNode } = await import("/src/services/heartwood/runEngine.js")
      const bench = [
        { key: "b1", defId: "the-fool", upgradeLevel: 0, upgrades: [] },
        { key: "b2", defId: "bulwark-of-ages", upgradeLevel: 0, upgrades: [] },
      ]
      const rs = { ...startRun("tommy"), nodeIndex: idx, path: RUN_PATH.slice(0, idx + 1), phase: "formation", bench, deployed: ["b1", "b2", null, null], items: [], lastSeenAct: actIndexForNode(idx, RUN_PATH.length) }
      localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(rs)))
    }, idx)
  const fs = {}
  for (const [idx, key] of [[36, "wanderers"], [58, "corrupted"], [84, "mirror"]]) {
    await setSave(idx)
    await p.reload({ waitUntil: "domcontentloaded" })
    await p.waitForTimeout(700)
    fs[key] = {
      tag: await p.locator(".hw-faction-tag").innerText().catch(() => ""),
      attr: await p.locator(".hw-faction-tag").getAttribute("data-faction").catch(() => null),
      body: key === "mirror" ? (await p.locator("body").innerText()).match(/Echo of [A-Za-z' -]+/g) : null,
    }
  }
  // Start the real Mirror fight: the board shows echoes of the squad.
  await p.locator(".hw-tactics-start").click()
  const b = p.locator(".hwt-begin-battle")
  await b.waitFor({ timeout: 5000 }).catch(() => {})
  if (await b.count()) await b.click()
  await p.waitForTimeout(400)
  fs.realEchoes = await p.locator('.hwt-token[data-echo="true"]').count()
  fs.realBanner = await p.locator(".hwt-faction-banner").innerText().catch(() => "")
  await p.screenshot({ path: "/tmp/factions_real_mirror.png" })
  await p.close()
  out.formationScreen = fs
  fail(fs.wanderers.tag.includes("Wanderers - they strike and vanish") && fs.wanderers.attr === "wanderers", "f1 formation screen tag: Wanderers")
  fail(fs.corrupted.tag.includes("The Corrupted") && fs.mirror.tag.includes("The Mirror"), "f2 formation screen tag: Corrupted + Mirror")
  fail((fs.mirror.body || []).length >= 2, "f3 formation screen shows the echoes")
  fail(fs.realEchoes === 2 && /The Mirror/.test(fs.realBanner), "f4 real Mirror fight on the board")
}

await browser.close()
out.pageErrors = errs
if (errs.length) out.errors.push(`${errs.length} page error(s)`)
console.log(JSON.stringify(out, null, 1))
console.log(out.errors.length ? `FAIL (${out.errors.length})` : "ALL PASS")
process.exit(out.errors.length ? 1 : 0)
