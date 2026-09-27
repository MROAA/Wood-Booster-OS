import { chromium } from "playwright"

// Sprint 3 - Epic boss fights (tacticsBosses.js). Per boss: the real run
// node loads its arena, a phase transition fires + telegraphs, one
// signature mechanic works, preview == real. Plus the boss bar UI, the
// prototype boss picker, and a real-run phase change (banner + shake).
const PORT = process.env.PORT || 5445
const browser = await chromium.launch()
const errs = []
const out = { errors: [] }
const newPage = async () => {
  const p = await browser.newContext({ viewport: { width: 1600, height: 1000 } }).then((c) => c.newPage())
  p.on("pageerror", (e) => errs.push(String(e)))
  return p
}

const page = await newPage()
await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })

const r = await page.evaluate(async () => {
  const E = await import("/src/services/heartwood/tacticsEngine.js")
  const B = await import("/src/services/heartwood/tacticsBosses.js")
  const T = await import("/src/services/heartwood/tacticsTerrain.js")
  const rt = await import("/src/services/heartwood/runEngine.js")
  const RM = await import("/src/services/heartwood/tacticsRealMatchup.js")
  const res = {}
  const tough = (s) => ({ ...s, units: s.units.map((u) => (u.side === "player" ? { ...u, hp: 999, maxHp: 999 } : u)) })
  const bossOf = (s) => s.units.find((u) => u.id === s.boss.unitId)
  const patch = (s, id, p) => ({ ...s, units: s.units.map((u) => (u.id === id ? { ...u, ...p } : u)) })
  const hit = (s, id, n) => E.applyDamageWithBlock(patch(s, id, { block: 0, ward: 0, revive: 0, bulwark: 0 }), id, n).next
  // Push the boss just under phase `i`'s threshold (shield ignored).
  const toPhase = (s, i) => {
    const b = bossOf(s)
    const f = B.BOSS_FIGHTS[s.boss.id]
    const want = Math.floor(b.maxHp * f.phases[i].atHpPct) - 1
    const dead = s.boss.weakPointIds
    s = { ...s, units: s.units.map((u) => (dead.includes(u.id) ? { ...u, hp: 0 } : u)) }
    return hit(s, b.id, Math.max(1, b.hp - want))
  }
  const endTurns = (s, n) => {
    for (let i = 0; i < n && s.phase === "player"; i++) s = E.endPlayerTurn(s)
    return s
  }
  const at = (u, p) => u.pos.row === p.row && u.pos.col === p.col
  // preview == real: every previewed enemy's end position/fate matches.
  const previewRows = (s, turns) => {
    const rows = []
    for (let t = 0; t < turns && s.phase === "player"; t++) {
      const preview = E.previewEnemyIntents(s)
      const after = E.endPlayerTurn(s)
      for (const { enemyId, intent } of preview) {
        const before = s.units.find((u) => u.id === enemyId)
        const now = after.units.find((u) => u.id === enemyId)
        if (!now) { rows.push({ enemyId, ok: false, why: "missing" }); continue }
        if (now.hp <= 0) continue
        let ok = true
        if (intent.kind === "move" || intent.kind === "move-attack" || (intent.kind === "wall" && intent.to)) ok = at(now, intent.to) || (before && at(now, T.slideLanding({ ...s, terrain: after.terrain }, enemyId, before.pos, intent.to)))
        else if ((intent.kind === "hold" || (intent.kind === "attack" && !intent.retreat)) && before) ok = at(now, before.pos) || !!s.boss?.pending.some((h) => h.kind === "teleport" && enemyId === s.boss.unitId)
        rows.push({ enemyId, kind: intent.kind, ok })
      }
      s = after
    }
    return rows
  }
  // A real run's boss node, built the way HeartwoodBattle.jsx builds it.
  const realBattle = (nodeFilter) => {
    const idx = rt.RUN_PATH.findIndex(nodeFilter)
    const rs = {
      ...rt.startRun("tommy"),
      nodeIndex: idx,
      path: rt.RUN_PATH.slice(0, idx + 1),
      phase: "formation",
      bench: [{ key: "b1", defId: "the-fool", upgradeLevel: 0, upgrades: [] }, { key: "b2", defId: "bulwark-of-ages", upgradeLevel: 0, upgrades: [] }],
      deployed: ["b1", "b2", null, null],
      items: [],
      lastSeenAct: rt.actIndexForNode(idx, rt.RUN_PATH.length),
    }
    return rt.startTacticsFormationBattle(rs, (st) => RM.buildRunTacticsBattle(rs, st)).battle
  }
  const nodeFor = {
    deepwarden: (n) => n.enemyId === "deepwarden",
    "the-gorging-maw": (n) => n.enemyId === "the-gorging-maw",
    "the-iron-sentinel": (n) => n.enemyId === "the-iron-sentinel",
    thornmaw: (n) => n.enemyId === "thornmaw",
    "the-ancient-grove": (n) => n.formationId === "the-ancient-grove",
    "the-elder-hollow": (n) => n.formationId === "the-elder-hollow",
    wyrmgall: (n) => n.enemyId === "wyrmgall",
    spacemonkey: (n) => n.type === "boss",
  }

  // 1: every boss node loads its arena + boss state (real run path); arena crossable.
  res.c1 = {}
  const built = {}
  for (const id of B.BOSS_IDS) {
    const s = realBattle(nodeFor[id])
    built[id] = s
    const arena = B.arenaTerrainFor(id)
    const f = B.BOSS_FIGHTS[id]
    res.c1[id] = {
      boss: s?.boss?.id,
      arenaSame: s && JSON.stringify(s.terrain) === JSON.stringify(arena),
      connected: T.sidesConnected(arena, s.grid),
      atStart: s && at(bossOf(s), f.bossStart),
      phases: f.phases.length,
      thresholds: s?.boss?.thresholds,
    }
  }

  // 2: per boss - phase 2 fires (bossPhase event + log), then the next
  //    hazard is telegraphed for the coming player turn (pending, due = turn).
  res.c2 = {}
  for (const id of B.BOSS_IDS) {
    let s = tough(built[id])
    const seq = s.eventSeq || 0
    s = toPhase(s, 1)
    const ev = (s.events || []).find((e) => e.seq > seq && e.kind === "bossPhase")
    const phaseLog = s.log.some((l) => l.includes(`Phase 2: ${B.BOSS_FIGHTS[id].phases[1].name}`))
    s = E.endPlayerTurn(s)
    const warn = B.bossWarningTiles(s)
    const info = B.describeBoss(s)
    res.c2[id] = { phaseIndex: s.boss.phaseIndex, ev: ev?.name, phaseLog, due: s.boss.pending.map((h) => h.due), turn: s.turn, warn: warn.size, upcoming: info.upcoming.map((u) => u.text) }
  }

  // 3: signature mechanics.
  const resolveNext = (s) => {
    const pend = s.boss.pending.map((h) => ({ ...h }))
    return { pend, after: E.endPlayerTurn(s) }
  }
  const sig = {}
  // Rootkeeper: Root Hearts shield it; break both and it takes damage again.
  {
    let s = toPhase(tough(built.deepwarden), 1)
    const wps = s.boss.weakPointIds
    const hp0 = bossOf(s).hp
    const shielded = hit(s, s.boss.unitId, 10)
    const immuneEv = (shielded.events || []).some((e) => e.kind === "reaction" && e.label === "Immune!")
    let broken = s
    for (const w of wps) broken = hit(broken, w, 999)
    const exposedLog = broken.log.some((l) => l.includes("is exposed"))
    const after = hit(broken, broken.boss.unitId, 10)
    sig.deepwarden = { wps: wps.length, shieldedHp: bossOf(shielded).hp === hp0, immuneEv, exposedLog, damaged: bossOf(after).hp === hp0 - 10, desc: B.describeBoss(s).immune }
  }
  // Gorging Maw: a telegraphed Brood Spill spawns sporelets at the marked tiles.
  {
    let s = endTurns(tough(built["the-gorging-maw"]), 1)
    const { pend, after } = resolveNext(s)
    const adds = after.units.filter((u) => u.id.includes("-boss") && u.hp > 0)
    sig["the-gorging-maw"] = { pend: pend.map((h) => h.kind), adds: adds.map((u) => u.defId), log: after.log.some((l) => l.includes("Brood Spill")) }
  }
  // Iron Sentinel: Forge Heat turns the marked edge tiles to lava; enrage timer ticks.
  {
    let s = endTurns(toPhase(tough(built["the-iron-sentinel"]), 1), 1)
    const pend = s.boss.pending.find((h) => h.kind === "terrain")
    const after = E.endPlayerTurn(s)
    sig["the-iron-sentinel"] = { tiles: pend?.tiles.length, lava: pend && pend.tiles.every((p) => after.terrain[`${p.row}-${p.col}`] === "lava"), enrage: B.describeBoss(after).enrage }
  }
  // Heartwood Warden: Thornwall rises exactly on the marked tiles.
  {
    let s = endTurns(toPhase(tough(built.thornmaw), 1), 1)
    const pend = s.boss.pending.find((h) => h.kind === "terrain")
    const after = E.endPlayerTurn(s)
    sig.thornmaw = { tiles: pend?.tiles.length, walls: pend && pend.tiles.filter((p) => after.terrain[`${p.row}-${p.col}`] === "wall").length, connected: T.sidesConnected(after.terrain, after.grid) }
  }
  // Ancient Oak: Falling Boughs hit exactly the units on the marked tiles.
  {
    let s = endTurns(tough(built["the-ancient-grove"]), 1)
    const pend = s.boss.pending.find((h) => h.kind === "quake")
    const seq = s.eventSeq
    const after = E.endPlayerTurn(s)
    const onTiles = s.units.filter((u) => u.side === "player" && u.hp > 0 && pend?.tiles.some((p) => at(u, p))).map((u) => u.id)
    const firstStrike = after.events.findIndex((e) => e.seq > seq && e.kind === "strike")
    const quakeHits = after.events.filter((e, i) => e.seq > seq && e.kind === "damage" && (firstStrike < 0 || i < firstStrike)).map((e) => e.targetId)
    sig["the-ancient-grove"] = { pend: !!pend, onTiles: onTiles.length, allHit: onTiles.every((id) => quakeHits.includes(id)), log: after.log.some((l) => l.includes("Falling Boughs!")) }
  }
  // Elder Oak: Creeping Frost spreads ice onto the marked tiles.
  {
    let s = endTurns(tough(built["the-elder-hollow"]), 1)
    const pend = s.boss.pending.find((h) => h.kind === "terrain")
    const after = E.endPlayerTurn(s)
    sig["the-elder-hollow"] = { tiles: pend?.tiles.length, ice: pend && pend.tiles.every((p) => after.terrain[`${p.row}-${p.col}`] === "ice") }
  }
  // Veilbound: the outer bridges collapse into water; a unit on one is thrown clear.
  {
    let s = endTurns(toPhase(tough(built.wyrmgall), 1), 1)
    const pend = s.boss.pending.find((h) => h.kind === "terrain")
    const tile = pend?.tiles[0]
    const mover = s.units.find((u) => u.id === "player-commander")
    s = patch(s, mover.id, { pos: { ...tile } })
    const after = E.endPlayerTurn(s)
    const cmd = after.units.find((u) => u.id === mover.id)
    sig.wyrmgall = { tile, water: tile && after.terrain[`${tile.row}-${tile.col}`] === "water", thrown: !at(cmd, tile), log: after.log.some((l) => l.includes("thrown clear")), connected: T.sidesConnected(after.terrain, after.grid) }
  }
  // The Hollow King: all 4 phases; Star Anchors; the room collapses into lava; Last Light returns him to the throne; enrage grows his attack.
  {
    let s = tough(built.spacemonkey)
    const phases = []
    s = toPhase(s, 1)
    phases.push(s.boss.phaseIndex)
    const anchors = s.boss.weakPointIds.length
    const immune = bossOf(hit(s, s.boss.unitId, 5)).hp === bossOf(s).hp
    s = toPhase(s, 2)
    phases.push(s.boss.phaseIndex)
    s = endTurns(s, 1)
    const collapse = s.boss.pending.find((h) => h.label === "Collapse")
    s = E.endPlayerTurn(s)
    const lava = collapse && collapse.tiles.every((p) => s.terrain[`${p.row}-${p.col}`] === "lava")
    const atk0 = bossOf(s).attack
    s = endTurns(s, 4)
    const enraged = bossOf(s).attack > atk0 && s.boss.enraged > 0
    s = toPhase(s, 3)
    phases.push(s.boss.phaseIndex)
    const tele = s.boss.pending.find((h) => h.kind === "teleport")
    s = E.endPlayerTurn(s) // entry hazards get a full player turn of warning
    const seq = s.eventSeq
    const after = E.endPlayerTurn(s)
    const teleEv = after.events.some((e) => e.seq > seq && e.kind === "reaction" && e.label === "Return to the Throne!")
    sig.spacemonkey = { phases, anchors, immune, collapseTiles: collapse?.tiles.length, lava, enraged, tele: tele?.tiles[0], teleEv, lastLight: after.boss.phaseIndex === 3, lastPending: after.boss.pending.map((h) => h.label), phase: after.phase }
  }
  res.c3 = sig

  // 4: preview == real, 4 turns per boss in its hardest phase (hazards + adds + teleports resolving).
  res.c4 = {}
  for (const id of B.BOSS_IDS) {
    const f = B.BOSS_FIGHTS[id]
    let s = tough(built[id])
    const rows = [...previewRows(s, 3)]
    s = toPhase(s, f.phases.length - 1)
    rows.push(...previewRows(endTurns(s, 0), 4))
    res.c4[id] = { rows: rows.length, bad: rows.filter((x) => !x.ok) }
  }

  // 5: QA hook disables arena mechanics; killing the boss wins with adds/weak points still up.
  {
    let s = toPhase(tough(built.spacemonkey), 1)
    const qa = E.withLowEnemyHp(s)
    const q2 = endTurns(qa, 2)
    const won = E.checkTacticsBattleEnd(patch(s, s.boss.unitId, { hp: 0 }))
    const others = won.units.filter((u) => u.side === "enemy" && u.hp > 0).length
    res.c5 = { qa: qa.boss.qa, pending: q2.boss?.pending.length, dmgNotBlocked: bossOf(hit(qa, qa.boss.unitId, 1)).hp === 0, won: won.phase, others, line: won.log.at(-1) }
  }
  // 6: non-boss fights untouched (no boss state, no boss hook effect).
  {
    const s = E.createTacticsBattle("default")
    const n = realBattle((n) => n.type === "battle")
    res.c6 = { proto: s.boss === undefined, real: n.boss === undefined, penalty: B.bossTilePenalty(s, { row: 0, col: 0 }) }
  }
  return res
})
out.engine = r

const c1bad = Object.entries(r.c1).filter(([id, v]) => !(v.boss === id && v.arenaSame && v.connected && v.atStart))
if (c1bad.length) out.errors.push(`check1 arena/boss state on real nodes: ${JSON.stringify(c1bad)}`)
const c2bad = Object.entries(r.c2).filter(([, v]) => !(v.phaseIndex === 1 && v.ev && v.phaseLog && v.due.includes(v.turn) && v.warn > 0 && v.upcoming.length > 0))
if (c2bad.length) out.errors.push(`check2 phase transition + telegraph: ${JSON.stringify(c2bad)}`)
const s3 = r.c3
if (!(s3.deepwarden.wps === 2 && s3.deepwarden.shieldedHp && s3.deepwarden.immuneEv && s3.deepwarden.exposedLog && s3.deepwarden.damaged && s3.deepwarden.desc)) out.errors.push("check3a Rootkeeper Root Hearts shield")
if (!(s3["the-gorging-maw"].pend.includes("adds") && s3["the-gorging-maw"].adds.length === 2 && s3["the-gorging-maw"].adds.every((d) => d === "sporelet") && s3["the-gorging-maw"].log)) out.errors.push("check3b Gorging Maw Brood Spill")
if (!(s3["the-iron-sentinel"].tiles > 0 && s3["the-iron-sentinel"].lava && /Enrages in/.test(s3["the-iron-sentinel"].enrage || ""))) out.errors.push("check3c Iron Sentinel Molten Floor")
if (!(s3.thornmaw.tiles > 0 && s3.thornmaw.walls > 0 && s3.thornmaw.connected)) out.errors.push("check3d Warden Thornwall")
if (!(s3["the-ancient-grove"].pend && s3["the-ancient-grove"].onTiles > 0 && s3["the-ancient-grove"].allHit && s3["the-ancient-grove"].log)) out.errors.push("check3e Ancient Oak Falling Boughs")
if (!(s3["the-elder-hollow"].tiles > 0 && s3["the-elder-hollow"].ice)) out.errors.push("check3f Elder Oak Creeping Frost")
if (!(s3.wyrmgall.water && s3.wyrmgall.thrown && s3.wyrmgall.log && s3.wyrmgall.connected)) out.errors.push("check3g Veilbound Bridge Collapse")
const sm = s3.spacemonkey
if (!(JSON.stringify(sm.phases) === "[1,2,3]" && sm.anchors === 2 && sm.immune && sm.collapseTiles > 0 && sm.lava && sm.enraged && sm.tele && sm.teleEv && sm.lastLight && sm.lastPending.includes("Void Nova"))) out.errors.push("check3h Hollow King 4-phase fight")
const c4bad = Object.entries(r.c4).filter(([, v]) => !(v.rows >= 3 && v.bad.length === 0))
if (c4bad.length) out.errors.push(`check4 preview == real: ${JSON.stringify(c4bad)}`)
if (!(r.c5.qa && r.c5.pending === 0 && r.c5.dmgNotBlocked && r.c5.won === "won" && r.c5.others > 0 && /falls! Victory/.test(r.c5.line))) out.errors.push("check5 QA hook + boss-down victory")
if (!(r.c6.proto && r.c6.real && r.c6.penalty === 0)) out.errors.push("check6 non-boss fights untouched")
await page.close()

// 7: prototype - ?boss=spacemonkey shows the boss bar (name, 3 phase
//    markers, phase text); End Turn -> warning tiles + "next" line; the
//    picker switches to another boss.
{
  const p = await newPage()
  await p.goto(`http://localhost:${PORT}/heartwood-tactics?boss=spacemonkey`, { waitUntil: "domcontentloaded" })
  await p.locator(".hwt-boss-bar").waitFor({ timeout: 8000 })
  const bar = {
    name: await p.locator(".hwt-boss-name").innerText(),
    markers: await p.locator(".hwt-boss-marker").count(),
    phase: await p.locator(".hwt-boss-phase").innerText(),
    bossToken: await p.locator('.hwt-token[data-boss="exposed"]').count(),
    lava: await p.locator('.hwt-cell[data-terrain="lava"]').count(),
    buttons: await p.locator("[data-boss-choice]").count(),
  }
  await p.locator(".hwt-end-turn").click()
  await p.waitForTimeout(700)
  bar.warnTiles = await p.locator(".hwt-cell[data-boss-warn]").count()
  bar.next = await p.locator(".hwt-boss-next").allInnerTexts()
  await p.screenshot({ path: "/tmp/boss_bar_spacemonkey.png" })
  await p.locator('[data-boss-choice="wyrmgall"]').click()
  await p.waitForTimeout(400)
  bar.switched = await p.locator(".hwt-boss-name").innerText()
  bar.bridges = await p.locator('.hwt-cell[data-terrain="bridge"]').count()
  await p.close()
  out.ui = bar
  if (!(bar.name === "The Hollow King" && bar.markers === 3 && /Phase 1\/4/.test(bar.phase) && bar.bossToken === 1 && bar.lava > 0 && bar.buttons === 8 && bar.warnTiles > 0 && bar.next.length > 0 && bar.switched === "Veilbound" && bar.bridges === 3)) {
    out.errors.push("check7 prototype boss bar / warnings / picker")
  }
}

// 8: real run - a real click-driven hit pushes the Hollow King into
//    phase 2: banner + board shake + Star Anchors on the board + shield shown.
{
  const p = await newPage()
  await p.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
  await p.evaluate(async () => {
    const { startRun, serializeRun, RUN_PATH, actIndexForNode } = await import("/src/services/heartwood/runEngine.js")
    const idx = RUN_PATH.findIndex((n) => n.type === "boss")
    const rs = { ...startRun("tommy"), nodeIndex: idx, path: RUN_PATH.slice(0, idx + 1), phase: "formation", bench: [{ key: "b1", defId: "the-fool", upgradeLevel: 0, upgrades: [] }], deployed: ["b1", null, null, null], items: [], lastSeenAct: actIndexForNode(idx, RUN_PATH.length) }
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(rs)))
  })
  await p.reload({ waitUntil: "domcontentloaded" })
  await p.waitForTimeout(500)
  await p.locator(".hw-tactics-start").click()
  const begin = p.locator(".hwt-begin-battle")
  await begin.waitFor({ timeout: 5000 }).catch(() => {})
  if (await begin.count()) await begin.click()
  await p.waitForTimeout(300)
  const setup = await p.evaluate(() => {
    const save = JSON.parse(localStorage.getItem("heartwood-run-save-v1"))
    const battle = save.run.battle
    const boss = battle.units.find((u) => u.id === battle.boss.unitId)
    const fool = battle.units.find((u) => u.defId === "the-fool")
    boss.hp = Math.floor(boss.maxHp * 0.7) + 1
    boss.block = 0
    boss.ward = 0
    boss.bulwark = 0
    fool.pos = { row: boss.pos.row, col: boss.pos.col + 1 }
    fool.ap = fool.apMax
    fool.attack = 30
    battle.units = battle.units.map((u) => (u.id === fool.id ? fool : u.id === boss.id ? boss : u.side === "player" ? { ...u, pos: { row: 8, col: 11 - battle.units.indexOf(u) % 2 } } : u))
    save.run.battle = battle
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(save))
    return { fool: fool.name, boss: boss.name, hasBoss: !!battle.boss, arena: battle.terrain["4-5"] }
  })
  await p.reload({ waitUntil: "domcontentloaded" })
  await p.waitForTimeout(600)
  const barBefore = await p.locator(".hwt-boss-bar").getAttribute("data-phase-index").catch(() => null)
  await p.locator(".hwt-token", { hasText: setup.fool }).click({ force: true })
  await p.waitForTimeout(200)
  await p.locator('.hwt-cell[data-targetable="true"]').first().click()
  const shook = await p.waitForFunction(() => document.querySelector(".hwt-board")?.classList.contains("hw-stage-shake"), null, { timeout: 2000, polling: 20 }).then(() => true).catch(() => false)
  const banner = await p.locator(".hwt-boss-phase-banner").innerText({ timeout: 2000 }).catch(() => "")
  await p.waitForTimeout(300)
  const barAfter = await p.locator(".hwt-boss-bar").getAttribute("data-phase-index")
  const immune = await p.locator(".hwt-boss-bar").getAttribute("data-immune")
  const anchors = await p.locator('.hwt-token[data-weak-point="true"]').count()
  const shield = await p.locator(".hwt-boss-shield").innerText().catch(() => "")
  const log = await p.locator(".hwt-log").innerText()
  await p.screenshot({ path: "/tmp/boss_phase_real.png" })
  await p.close()
  out.realPhase = { setup, barBefore, banner, shook, barAfter, immune, anchors, shield, logPhase: log.includes("Phase 2: Crown of Stars") }
  if (!(setup.hasBoss && setup.arena === "wall" && barBefore === "0" && /Crown of Stars/.test(banner) && shook && barAfter === "1" && immune === "true" && anchors === 2 && /Star Anchor/.test(shield) && out.realPhase.logPhase)) {
    out.errors.push("check8 real-run phase change: banner/shield/anchors")
  }
}

await browser.close()
out.pageErrors = errs
if (errs.length) out.errors.push(`${errs.length} page error(s)`)
console.log(JSON.stringify(out, null, 1))
console.log(out.errors.length ? `FAIL (${out.errors.length})` : "ALL PASS")
process.exit(out.errors.length ? 1 : 0)
