// The Long Campaign - CONTENT SPRINT (data/heartwood/campaignContent.js,
// campaignEnemies.js, campaignBosses.js; services/heartwood/
// campaignContentEngine.js + tacticsCampaignOps.js; components/heartwood/
// campaign/CampaignContentUi.jsx):
//   1. 7 new mission kinds + the Named Foe (generate, start, resolve),
//   2. 7 chapters: roster, events, battlefield feature,
//   3. 11 campaign enemies (kits fire) + 7 mini-bosses (phases, manaburn),
//   4. the intent preview stays exact with the new enemies,
//   5. 12 world events + lasting effects,
//   6. Expedition seeds unchanged (fingerprint vs origin/development).
// Part 1 = pure-engine checks in node: `ENGINE_ONLY=1 node .scratch/verify_campaign_content.mjs`
// Part 2 = UI checks + screenshots (vite on PORT, default 5451).
import { registerHooks } from "node:module"
import { mkdir } from "node:fs/promises"

registerHooks({
  resolve(spec, ctx, next) {
    try {
      return next(spec, ctx)
    } catch (e) {
      if ((spec.startsWith(".") || spec.startsWith("/")) && !/\.(m?js|jsx|json)$/.test(spec)) {
        for (const ext of [".js", "/index.js"]) {
          try {
            return next(spec + ext, ctx)
          } catch {
            // try the next extension
          }
        }
      }
      throw e
    }
  },
  load(url, ctx, next) {
    if (/\.(png|jpe?g|svg|webp|gif|mp3|wav|ogg|css)$/.test(url)) return { format: "module", source: `export default ${JSON.stringify(url)}`, shortCircuit: true }
    return next(url, ctx)
  },
})

const ROOT = new URL("..", import.meta.url).pathname
const SRC = `${ROOT}src/services/heartwood/`
const DATA = `${ROOT}src/data/heartwood/`
const E = await import(`${SRC}tacticsEngine.js`)
const O = await import(`${SRC}tacticsObjectives.js`)
const OPS = await import(`${SRC}tacticsCampaignOps.js`)
const TB = await import(`${SRC}tacticsBosses.js`)
const CE = await import(`${SRC}campaignEngine.js`)
const CC = await import(`${SRC}campaignContentEngine.js`)
const rt = await import(`${SRC}runEngine.js`)
const TR = await import(`${SRC}tacticsRealMatchup.js`)
const MC = await import(`${SRC}tacticsManaColours.js`)
const MANA = await import(`${SRC}tacticsMana.js`)
const SA = await import(`${SRC}tacticsSmartAi.js`)
const EA = await import(`${SRC}tacticsEnemyAbilities.js`)
const { ENEMIES, ACT_ENEMIES, NON_BATTLE_ENEMY_IDS } = await import(`${DATA}enemies.js`)
const { FORMATIONS } = await import(`${DATA}formations.js`)
const D = await import(`${DATA}campaignContent.js`)
const CB = await import(`${DATA}campaignBosses.js`)
const CEN = await import(`${DATA}campaignEnemies.js`)
const { MISSION_TYPES, LEY_LINES } = await import(`${DATA}campaign.js`)
const { feedKitForDef } = await import(`${DATA}manaColours.js`)
const { almanacIds } = await import(`${DATA}almanac.js`)
const { sidesConnected } = await import(`${SRC}tacticsTerrain.js`)

const fails = []
const results = {}
let n = 0
const ok = (cond, label, data) => {
  n++
  if (!cond) fails.push(`${label}${data !== undefined ? " " + JSON.stringify(data).slice(0, 400) : ""}`)
}
const U = (s, id) => s.units.find((u) => u.id === id)
const build = (run) => rt.startTacticsFormationBattle(run, (start) => TR.buildRunTacticsBattle(run, start))
const KINDS = ["escort", "well", "assassinate", "liberate", "night", "storm", "twofront"]
const heroes = (s) => s.units.filter((u) => u.side === "player" && !u.npc && u.hp > 0)
const enemies = (s) => s.units.filter((u) => u.side === "enemy" && u.hp > 0)
const safe = (c) => ({ ...c, regions: c.regions.map((r) => ({ ...r, threat: Math.min(r.threat, 20), fallen: false })), doom: 0 })

// A campaign with one mission of `kind` in `chapter`, launched with 4 heroes.
function launchKind(kind, { seed = 7, chapter = 1, roster = null, feature = null, bossId = null } = {}) {
  let c = CE.createCampaign({ seed })
  c = { ...c, chapter }
  const m0 = c.missions[0]
  const chapterRoster = roster || D.CHAPTER_CONTENT[chapter].rosters[0]
  const m = {
    ...m0,
    type: kind,
    chapterOf: chapter,
    roster: kind === "warlord" ? undefined : chapterRoster,
    bossId: kind === "warlord" ? bossId || CB.bossIdForChapter(chapter) : undefined,
    feature: kind === "warlord" ? null : feature,
    nodeIndex: kind === "warlord" ? CE.missionNodeIndex(m0.act, "elite", () => 0) : m0.nodeIndex,
  }
  c = { ...c, missions: [m, ...c.missions.slice(1)] }
  const keys = c.roster.slice(0, 4).map((h) => h.key)
  const launched = CE.launchMission(c, m.id, keys, build)
  return { c: launched, b: launched.activeMission?.run?.battle, m }
}
// Simulates the end of a launched fight.
function finish(c, phase, patch = (b) => b) {
  const b0 = c.activeMission.run.battle
  const b = patch({ ...b0, units: b0.units.map((u) => (u.side === "enemy" && phase === "won" ? { ...u, hp: 0 } : u)) })
  return CE.updateMissionBattle(c, { ...b, phase })
}
const toPlayer = (s) => ({ ...s, phase: "player", deployDone: true })

// ===== 1. MISSION KINDS ===========================================================
{
  ok(KINDS.every((k) => MISSION_TYPES[k] && D.MISSION_BRIEFS[k]?.rules?.length >= 2) && MISSION_TYPES.warlord && D.MISSION_BRIEFS.warlord, "M1 7 new kinds + Named Foe: type + briefing")
  ok(new Set([...KINDS, "warlord"].map((k) => MISSION_TYPES[k].icon)).size === 8 && [...KINDS, "warlord"].every((k) => !["⚔", "☠", "🕊", "📦", "✦", "📜", "⚑", "🐺", "🔔", "⚡"].includes(MISSION_TYPES[k].icon)), "M2 each kind has its own map-pin icon")
  // Generation: converted from plain fights / rescues by the content engine's own salt.
  const seen = new Set()
  for (let day = 2; day < 400 && seen.size < KINDS.length; day++) {
    for (const id of [1, 2, 3, 4]) {
      const t = CC.specialMissionType({ seed: 4242, day, nextMissionId: id, chapter: 3 }, day % 2 ? "fight" : "rescue", "hollow-ley")
      if (KINDS.includes(t)) seen.add(t)
    }
  }
  ok(seen.size === KINDS.length, "M3 every new kind can be generated (Chapter 3+)", [...seen])
  ok(CC.specialMissionType({ seed: 1, day: 1, nextMissionId: 1, chapter: 3 }, "fight", "deepening") === "fight", "M4 Day 1 stays classic")
  ok(CC.specialMissionType({ seed: 1, day: 9, nextMissionId: 1, chapter: 3 }, "elite", "deepening") === "elite", "M5 only plain fights/rescues convert")
  // Natural spawning over real days.
  let c = { ...CE.createCampaign({ seed: 4242 }), chapter: 3 }
  const spawned = new Set()
  const spawnedMissions = []
  for (let i = 0; i < 40; i++) {
    c = CE.advanceDay(safe(c))
    for (const m of c.missions) {
      spawned.add(m.type)
      spawnedMissions.push(m)
    }
  }
  const newSeen = KINDS.filter((k) => spawned.has(k))
  results.spawned = [...spawned]
  ok(newSeen.length >= 4, "M6 new kinds really turn up on the map over 40 days", [...spawned])
  ok(spawnedMissions.filter((m) => KINDS.includes(m.type)).every((m) => D.CHAPTER_CONTENT[3].rosters.includes(m.roster) && m.feature === D.CHAPTER_CONTENT[3].feature && m.reward?.essence > 0), "M7 new kinds carry the chapter's roster, battlefield and a reward")
  // Named Foe: after the chapter's wins, once.
  const w0 = CE.spawnMissions({ ...CE.createCampaign({ seed: 5 }), chapterWins: D.WARLORD_AFTER_WINS }, 0)
  const wm = w0.missions.find((m) => m.type === "warlord")
  ok(wm && wm.bossId === "mb-gnarlwick" && /Old Gnarlwick/.test(wm.title) && wm.reward.relic, "M8 the Named Foe turns up after 2 chapter wins", wm && { t: wm.title, b: wm.bossId })
  ok(!CE.spawnMissions({ ...CE.createCampaign({ seed: 5 }), chapterWins: 1 }, 0).missions.some((m) => m.type === "warlord"), "M9 ...not before")
  ok(CE.spawnMissions(w0, 0).missions.filter((m) => m.type === "warlord").length === 1, "M10 only one at a time")

  // Start + resolve every kind.
  for (const kind of KINDS) {
    const { c: lc, b, m } = launchKind(kind, { chapter: kind === "storm" ? 3 : 2 })
    ok(b?.engine === "tactics" && b.campaignOps?.kind === kind, `M11-${kind} starts as a real tactics fight with its objective`, b?.campaignOps)
    ok(O.describeObjective(b).type === `campaign-${kind}` && O.describeObjective(b).title, `M12-${kind} the objective panel describes it`, O.describeObjective(b))
    const won = CE.resolveMission(finish(lc, "won"))
    ok(!won.missions.some((x) => x.id === m.id) && won.lastAftermath?.outcome === "won" && won.stats.missionsWon === 1, `M13-${kind} resolves as a win`, won.lastAftermath)
    const lost = CE.resolveMission(finish(lc, "lost"))
    ok(lost.lastAftermath?.outcome === "lost", `M14-${kind} resolves as a loss`)
  }
  const wl = launchKind("warlord", { chapter: 1 })
  ok(wl.b?.boss?.id === "mb-gnarlwick" && wl.b.campaignOps.kind === "warlord" && wl.b.campaignOps.intro && wl.b.log.some((l) => /Little sparks/.test(l)), "M15 the Named Foe fight: boss arena + intro line", wl.b?.boss?.id)
  const wlWon = CE.resolveMission(finish(wl.c, "won"))
  ok(wlWon.content.warlords[1] === "beaten" && wlWon.lastAftermath.lines.some((l) => /Doom -1/.test(l)), "M16 beating it: chapter breathes, Doom -1", wlWon.lastAftermath.lines)
  ok(!CE.spawnMissions({ ...wlWon, chapterWins: 5, missions: [] }, 0).missions.some((m) => m.type === "warlord"), "M17 a beaten Named Foe doesn't come back this chapter")

  // --- mechanics per kind ---
  // ESCORT
  {
    const { b } = launchKind("escort")
    const s0 = toPlayer(b)
    const carrier = U(s0, OPS.CARRIER_ID)
    ok(carrier && carrier.npc && carrier.hp > 0, "K1 escort: the Ley-Carrier is on the field")
    const far = { ...s0, units: s0.units.map((u) => (u.side === "enemy" ? { ...u, pos: { row: 0, col: 0 } } : u)) }
    const walked = O.objectiveNewTurn({ ...far, turn: 2 })
    ok(U(walked, OPS.CARRIER_ID).pos.col === carrier.pos.col - OPS.ESCORT_STEPS, "K2 the carrier walks 2 tiles a turn toward the treeline", [carrier.pos, U(walked, OPS.CARRIER_ID).pos])
    const pinned = { ...far, units: far.units.map((u) => (u.side === "enemy" && u.hp > 0 ? { ...u, pos: { row: carrier.pos.row, col: carrier.pos.col - 1 } } : u)) }
    const pin1 = enemies(pinned)[0]
    const pinnedOnly = { ...pinned, units: pinned.units.filter((u) => u.side !== "enemy" || u.id === pin1.id) }
    ok(U(O.objectiveNewTurn({ ...pinnedOnly, turn: 2 }), OPS.CARRIER_ID).pos.col === carrier.pos.col, "K3 an enemy next to it pins it")
    const near = { ...far, units: far.units.map((u) => (u.id === OPS.CARRIER_ID ? { ...u, pos: { row: u.pos.row, col: 2 } } : u)) }
    const arrived = O.objectiveNewTurn({ ...near, turn: 3 })
    ok(arrived.phase === "won", "K4 reaching the treeline wins", arrived.phase)
    const dead = E.checkTacticsBattleEnd({ ...s0, units: s0.units.map((u) => (u.id === OPS.CARRIER_ID ? { ...u, hp: 0 } : u)) })
    ok(dead.phase === "lost", "K5 the carrier falling loses", dead.phase)
    const h = heroes(far)[0]
    const beside = { ...far, units: far.units.map((u) => (u.id === h.id ? { ...u, pos: { row: carrier.pos.row + 1, col: carrier.pos.col }, mana: 0 } : u)) }
    ok((U(O.objectiveNewTurn({ ...beside, turn: 2 }), h.id).mana || 0) > 0, "K6 heroes beside the carrier drink its lantern's mana")
  }
  // WELL
  {
    const { b } = launchKind("well")
    const s0 = toPlayer(b)
    const well = U(s0, OPS.WELL_ID)
    ok(well && well.npc && well.manaWell, "K7 well: the Mana Well stands mid-field")
    const h = heroes(s0)[0]
    const near = { ...s0, units: s0.units.map((u) => (u.id === h.id ? { ...u, pos: { row: well.pos.row, col: well.pos.col + 1 }, mana: 0 } : u)) }
    ok((U(O.objectiveNewTurn({ ...near, turn: 2 }), h.id).mana || 0) >= 1, "K8 heroes within 2 gain mana each turn")
    ok(O.objectiveNewTurn({ ...s0, turn: OPS.WELL_TURNS + 1 }).phase === "won", "K9 holding 5 turns wins")
    ok(E.checkTacticsBattleEnd({ ...s0, units: s0.units.map((u) => (u.id === OPS.WELL_ID ? { ...u, hp: 0 } : u)) }).phase === "lost", "K10 the Well falling loses")
  }
  // ASSASSINATE
  {
    const { b } = launchKind("assassinate")
    const s0 = toPlayer(b)
    const q = s0.units.find((u) => u.quarry)
    ok(q && b.campaignOps.quarryId === q.id, "K11 assassinate: a quarry is marked", q?.name)
    const ep = O.objectiveEnemyPhaseStart({ ...s0, phase: "enemy", turn: 2 })
    ok(U(ep, q.id).pos.col <= q.pos.col, "K12 the caster runs toward the treeline", [q.pos, U(ep, q.id).pos])
    ok(O.objectiveEnemyPhaseStart({ ...s0, phase: "enemy", turn: OPS.ESCAPE_TURN }).phase === "lost", "K13 at turn 5 it escapes - lost")
    ok(E.checkTacticsBattleEnd({ ...s0, units: s0.units.map((u) => (u.id === q.id ? { ...u, hp: 0 } : u)) }).phase === "won", "K14 killing it wins even with others standing")
    ok(O.objectiveEnemyPhaseStart(E.withLowEnemyHp({ ...s0, phase: "enemy", turn: OPS.ESCAPE_TURN })).phase !== "lost", "K15 QA hook: no escape")
  }
  // LIBERATE
  {
    const { c: lc, b } = launchKind("liberate")
    const s0 = toPlayer(b)
    const cages = s0.units.filter((u) => u.cage)
    ok(cages.length === 2 && cages.every((u) => u.npc), "K16 liberate: two Rot Cages", cages.length)
    const h = heroes(s0)[0]
    const by = { ...s0, units: s0.units.map((u) => (u.id === h.id ? { ...u, pos: { row: cages[0].pos.row, col: cages[0].pos.col + 1 } } : u)) }
    const freed = O.objectiveNewTurn({ ...by, turn: 2 })
    ok(freed.campaignOps.freed === 1 && !U(freed, cages[0].id), "K17 a hero next to a cage frees the captive", freed.campaignOps)
    const before = lc.roster.length
    const won = CE.resolveMission(CE.updateMissionBattle(lc, { ...freed, phase: "won", units: freed.units.map((u) => (u.side === "enemy" ? { ...u, hp: 0 } : u)) }))
    ok(won.roster.length === before + 2 && won.lastAftermath.rewards.filter((r) => /Rot cage/.test(r)).length === 2, "K18 win: the freed + the still-locked captive join the Hearth", [before, won.roster.length, won.lastAftermath.rewards])
  }
  // NIGHT
  {
    const { b } = launchKind("night")
    const s0 = toPlayer(b)
    ok(enemies(s0).every((u) => u.shroud) && heroes(s0).every((u) => u.gearReveal >= OPS.NIGHT_SIGHT) && s0.night, "K19 night: foes hidden, heroes see 2 by torchlight")
    const e = enemies(s0)[0]
    const ranged = { ...heroes(s0)[0], range: 5 }
    const at = (d) => ({ ...s0, units: s0.units.filter((u) => u.side !== "enemy" || u.id === e.id).map((u) => (u.id === ranged.id ? { ...ranged, pos: { row: e.pos.row, col: e.pos.col + d } } : u)) })
    ok(!E.attackableTargets(at(4), ranged.id).some((t) => t.id === e.id) && E.attackableTargets(at(2), ranged.id).some((t) => t.id === e.id), "K20 a foe 4 tiles off can't be shot in the dark; 2 tiles off it can")
  }
  // STORM
  {
    const { b } = launchKind("storm", { chapter: 3 })
    const s0 = toPlayer(b)
    const order = b.campaignOps.storm.order
    ok(order.length === 4 && new Set(order).size === 4 && b.campaignOps.storm.colour === order[0], "K21 storm: a seeded colour order, turn 1 shows the first", order)
    const t2 = O.objectiveNewTurn({ ...s0, turn: 2 })
    ok(t2.campaignOps.storm.colour === order[1] && OPS.stormColourFor(t2, 5) === order[0], "K22 the colour shifts every turn (and cycles)")
    const h = heroes(s0)[0]
    const tuned = { ...s0, units: s0.units.map((u) => (u.id === h.id ? { ...u, affinity: order[1], mana: 0 } : u)) }
    const after = O.objectiveNewTurn({ ...tuned, turn: 2 })
    ok((U(after, h.id).mana || 0) > 0 && U(after, h.id).leyColours.includes(order[1]), "K23 heroes of the storm's colour gain mana + cheaper skills")
    // Attuned foe rages in its colour.
    const cantor = { ...enemies(s0)[0], campKit: { ...ENEMIES["tide-cantor"].campKit, colour: order[1] }, stormRage: 0 }
    const withC = { ...s0, units: s0.units.map((u) => (u.id === cantor.id ? cantor : u)) }
    const raged = O.objectiveNewTurn({ ...withC, turn: 2 })
    ok(U(raged, cantor.id).attack === cantor.attack + OPS.STORM_RAGE && U(raged, cantor.id).stormRage === OPS.STORM_RAGE, "K24 an attuned enemy of that colour rages (+2 attack)")
    const calm = O.objectiveNewTurn({ ...raged, turn: 3 })
    ok(U(calm, cantor.id).attack === cantor.attack, "K25 ...and calms when the colour moves on")
  }
  // TWO FRONTS
  {
    const { b } = launchKind("twofront", { chapter: 4 })
    const s0 = toPlayer(b)
    const reinf = s0.objective?.reinforcements
    ok(reinf?.backline && reinf.templates.length === 2 && enemies(s0).length === 2, "K26 two fronts: half the foes wait behind you", { now: enemies(s0).length, later: reinf?.templates.length })
    ok(reinf.tiles.every((t) => t.col === s0.grid.cols - 1) && /turn 2/.test(O.describeObjective(s0).detail), "K27 they're marked at YOUR back edge", reinf.tiles)
    const t2 = O.objectiveNewTurn({ ...s0, turn: 2 })
    const back = t2.units.filter((u) => /-b\d$/.test(u.id))
    ok(back.length === 2 && back.every((u) => u.pos.col >= s0.grid.cols - 3 && u.facing === "W"), "K28 on turn 2 they come out behind you, facing your squad", back.map((u) => u.pos))
  }
}

// ===== 2. CHAPTERS ===================================================================
{
  const features = new Set()
  for (let ch = 1; ch <= 7; ch++) {
    const def = D.CHAPTER_CONTENT[ch]
    const rosters = def.rosters.map((id) => FORMATIONS[id])
    ok(rosters.length >= 3 && rosters.every((f) => f && f.pieces.length >= 3 && f.pieces.every((p) => ENEMIES[p.defId])), `C1-${ch} chapter ${ch}: 3 valid rosters`)
    ok(rosters.every((f) => f.pieces.some((p) => ENEMIES[p.defId].campaign)), `C2-${ch} every roster fields a campaign enemy`)
    ok(D.CHAPTER_EVENTS[ch]?.length >= 2 && D.CHAPTER_EVENTS[ch].every((e) => e.options.length >= 2 && e.lines.length >= 1), `C3-${ch} 2+ chapter events`)
    const t = OPS.chapterTerrain(def.feature, 1234 + ch, E.GRID)
    ok(Object.keys(t).length >= 4 && sidesConnected(t, E.GRID), `C4-${ch} its battlefield (${def.feature}) builds and stays crossable`, Object.keys(t).length)
    features.add(def.feature)
    // A built fight carries the feature terrain.
    const { b } = launchKind("night", { chapter: ch, feature: def.feature })
    ok(b?.campaignOps.feature === def.feature && b.log.some((l) => l.includes(D.CHAPTER_FEATURES[def.feature].name)), `C5-${ch} a chapter fight is fought on it`)
  }
  ok(features.size === 7, "C6 seven different battlefields")
  // Many seeds: the features are always crossable.
  let bad = 0
  for (const f of features) for (let s = 0; s < 120; s++) if (!sidesConnected(OPS.chapterTerrain(f, s, E.GRID, { x: 1 }), E.GRID)) bad++
  ok(bad === 0, "C7 840 seeded battlefields - all crossable", bad)
}

// ===== 3. ENEMIES + MINI-BOSSES ======================================================
{
  const regular = CEN.CAMPAIGN_REGULAR_IDS
  ok(regular.length >= 8 && regular.length <= 12, "E1 8-12 campaign enemies", regular.length)
  ok(CEN.CAMPAIGN_ENEMY_IDS.every((id) => NON_BATTLE_ENEMY_IDS.has(id) && !Object.values(ACT_ENEMIES).flat().includes(id)), "E2 none of them join the Expedition's solo pool")
  ok(CEN.CAMPAIGN_ENEMY_IDS.every((id) => almanacIds("enemies").includes(id)), "E3 all listed in the Almanac")
  ok(regular.every((id) => ENEMIES[id].campKit && ENEMIES[id].art && ENEMIES[id].description && ENEMIES[id].behavior), "E4 each has a kit, token art, words and a behaviour profile")
  ok(new Set(regular.map((id) => ENEMIES[id].art)).size >= 10, "E5 readable, mostly distinct token art", regular.map((id) => ENEMIES[id].art))
  ok(regular.every((id) => EA.enemySkillTable()[id]?.length >= 1), "E6 each has an active skill")
  ok(["ember-cantor", "tide-cantor", "void-cantor", "root-cantor"].every((id) => ENEMIES[id].campKit.colour) && feedKitForDef("ley-glutton") && feedKitForDef("shard-hoarder"), "E7 mana angle: 4 colour-attuned cantors + 2 mana-fed gluttons")
  // Every campaign enemy builds a valid battle (via a chapter roster).
  const rosterOf = (id) => Object.values(D.CHAPTER_CONTENT).flatMap((c) => c.rosters).find((r) => FORMATIONS[r].pieces.some((p) => p.defId === id))
  for (const id of regular) {
    const roster = rosterOf(id)
    const ch = Number(Object.entries(D.CHAPTER_CONTENT).find(([, c]) => c.rosters.includes(roster))[0])
    const { b } = launchKind("night", { chapter: ch, roster })
    const u = b?.units.find((x) => x.defId === id)
    ok(u && u.campKit?.id === ENEMIES[id].campKit.id && u.hp > 0 && SA.behaviorOf(u, b) === ENEMIES[id].behavior, `E8-${id} builds in a real fight (${roster}) with kit + behaviour`, u && { kit: u.campKit?.id, beh: SA.behaviorOf(u, b) })
    if (["ley-glutton", "shard-hoarder"].includes(id)) ok(u?.manaFeed?.family === "ley-glutton", `E9-${id} feeds on mana`, u?.manaFeed)
  }
  // Kit mechanics on a stripped board: the tested foes + the squad.
  const { b: base } = launchKind("night", { chapter: 2, roster: "camp-c2-gluttons" })
  const board = (foes, heroPatch = {}) => {
    const s = toPlayer({ ...base, night: false, campaignOps: { ...base.campaignOps, kind: null } })
    const hs = heroes(s)
    const units = [
      ...s.units.filter((u) => u.side === "player").map((u, i) => (hs.some((h) => h.id === u.id) ? { ...u, shroud: false, mana: 50, ...(heroPatch[i] || {}) } : u)),
      ...foes.map((f, i) => {
        const d = E.deriveTacticsUnit ? null : null
        void d
        return { ...f.unit, id: `enemy-${f.defId}-t${i}`, pos: f.pos, campKit: ENEMIES[f.defId].campKit ? { ...ENEMIES[f.defId].campKit } : null, kitCount: f.kitCount || 0, kitBonus: 0, shroud: false, hp: f.hp ?? f.unit.maxHp }
      }),
    ]
    return { ...s, units }
  }
  const tpl = (defId) => {
    const roster = rosterOf(defId)
    const ch = Number(Object.entries(D.CHAPTER_CONTENT).find(([, c]) => c.rosters.includes(roster))[0])
    return launchKind("night", { chapter: ch, roster }).b.units.find((u) => u.defId === defId)
  }
  const enemyStart = (s) => O.objectiveEnemyPhaseStart({ ...s, phase: "enemy" })
  const hs0 = heroes(base)
  // Mana burns only reach heroes with a drainable pool (Mana / Focus...), not Rage.
  const drainable = (u) => MANA.profileOf(u)?.drainable
  const DI = hs0.findIndex(drainable)
  const DJ = hs0.findIndex((u, i) => i !== DI && drainable(u))
  // Ley-Cutter.
  {
    const cut = { defId: "ley-cutter", unit: tpl("ley-cutter"), pos: { row: 0, col: 0 }, kitCount: 2 }
    const s = board([cut])
    const after = enemyStart(s)
    ok(heroes(after).filter(drainable).every((h) => h.mana < 50) && after.campaignOps.leySevered === 1, "E10 Ley-Cutter: 3rd unguarded turn - every hero loses mana, the ley is marked for cutting", heroes(after).map((h) => h.mana))
    const guarded = board([{ ...cut, pos: { row: hs0[0].pos.row, col: hs0[0].pos.col - 1 } }])
    ok(enemyStart(guarded).campaignOps.leySevered === 0, "E11 ...a hero next to it stops the knife")
    ok(enemyStart(E.withLowEnemyHp(s)).campaignOps.leySevered === 0, "E12 QA hook: kits off")
    // After the fight, a line touching the region is cut.
    const { c: lc } = launchKind("night", { chapter: 1, roster: "camp-c1-cutters" })
    const b2 = { ...lc.activeMission.run.battle, campaignOps: { ...lc.activeMission.run.battle.campaignOps, leySevered: 1 } }
    const res = CE.resolveMission(CE.updateMissionBattle(lc, { ...b2, phase: "won", units: b2.units.map((u) => (u.side === "enemy" ? { ...u, hp: 0 } : u)) }))
    const rid = lc.missions[0].regionId
    ok(res.ley.cut.some((id) => LEY_LINES.find((l) => l.id === id && (l.a === rid || l.b === rid))) && res.lastAftermath.lines.some((l) => /CUT/.test(l)), "E13 ...and after the fight a ley line by the region is CUT", { cut: res.ley.cut, rid })
  }
  // Cantors (4 colours).
  for (const id of ["ember-cantor", "tide-cantor", "void-cantor", "root-cantor"]) {
    const colour = ENEMIES[id].campKit.colour
    const h = hs0[DI]
    const other = colour === "ember" ? "tide" : "ember"
    const patch = Object.fromEntries(hs0.map((_, i) => [i, { affinity: i === DI ? colour : other }]))
    const s = board([{ defId: id, unit: tpl(id), pos: { row: h.pos.row, col: h.pos.col - 3 } }], patch)
    const after = enemyStart(s)
    const c0 = s.units.find((u) => u.defId === id)
    ok(U(after, h.id).mana < 50 && U(after, hs0[DJ].id).mana === 50 && U(after, c0.id).attack === c0.attack + 1, `E14-${id} drains only ${colour} heroes in reach, grows +1 attack`, { m: [U(after, h.id).mana, U(after, hs0[DJ].id).mana], atk: [c0.attack, U(after, c0.id).attack] })
  }
  // Bulwark.
  {
    const w = tpl("thornwall-warden")
    const ally = tpl("ley-cutter")
    const s = board([{ defId: "thornwall-warden", unit: w, pos: { row: 4, col: 0 } }, { defId: "ley-cutter", unit: ally, pos: { row: 4, col: 1 } }])
    const after = enemyStart(s)
    ok(after.units.find((u) => u.defId === "ley-cutter").block >= 4, "E15 Thornwall Warden braces its neighbour (+4 Block)")
  }
  // Pack Howl.
  {
    const hd = tpl("ash-hound")
    const s = board([0, 1, 2].map((i) => ({ defId: "ash-hound", unit: hd, pos: { row: i * 3, col: 0 } })))
    const after = enemyStart(s)
    ok(after.units.filter((u) => u.defId === "ash-hound").every((u) => u.kitBonus === 2 && u.attack === hd.attack + 2), "E16 Ash Hounds: +1 attack per packmate")
  }
  // Voidstep.
  {
    const r = tpl("hollow-reaver")
    const s0 = board([{ defId: "hollow-reaver", unit: r, pos: { row: 0, col: 0 }, kitCount: 1 }])
    const weak = heroes(s0)[2]
    const s = { ...s0, units: s0.units.map((u) => (u.id === weak.id ? { ...u, hp: 3 } : u)) }
    const after = enemyStart(s)
    const ru = after.units.find((u) => u.defId === "hollow-reaver")
    ok(Math.max(Math.abs(ru.pos.row - weak.pos.row), Math.abs(ru.pos.col - weak.pos.col)) <= 1, "E17 Hollow Reaver voidsteps to the most wounded hero", { r: ru.pos, w: weak.pos })
  }
  // Ley Anchor.
  {
    const vc = tpl("verge-chanter")
    const al = tpl("ash-hound")
    const s = board([{ defId: "verge-chanter", unit: vc, pos: { row: 0, col: 0 } }, { defId: "ash-hound", unit: al, pos: { row: 6, col: 0 }, hp: 5 }])
    const after = enemyStart(s)
    ok(after.units.find((u) => u.defId === "ash-hound").hp === 5 + ENEMIES["verge-chanter"].campKit.regen, "E18 Verge Chanter knits its allies back (+3 HP)")
  }
  // Shard Hoarder: its shard is yours.
  {
    const { c: lc } = launchKind("night", { chapter: 4, roster: "camp-c4-hoard" })
    const shards = lc.leyShards || 0
    const res = CE.resolveMission(finish(lc, "won"))
    ok(res.leyShards >= shards + 1 + (lc.missions[0].reward.leyShards || 0) && res.lastAftermath.rewards.some((r) => /Shard Hoarder/.test(r)), "E19 a slain Shard Hoarder pays its Ley Shard", res.lastAftermath.rewards)
  }
  ok(EA.enemySkillTable()["mire-lantern"].some((k) => k.kind === "spot"), "E20 Mire Lantern marks heroes (spot)")

  // Mini-bosses.
  ok(CB.CAMPAIGN_BOSS_IDS.length === 7 && [1, 2, 3, 4, 5, 6, 7].every((ch) => CB.bossIdForChapter(ch)), "B1 one Named Foe per chapter")
  for (const id of CB.CAMPAIGN_BOSS_IDS) {
    const fight = CB.CAMPAIGN_BOSS_FIGHTS[id]
    const { b } = launchKind("warlord", { chapter: fight.chapter })
    const bu = b && U(b, b.boss?.unitId)
    ok(b?.boss?.id === id && bu?.defId === id && ENEMIES[id].introLine && b.campaignOps.intro === ENEMIES[id].introLine, `B2-${id} builds its arena fight with an intro line`, b?.boss?.id)
    ok(fight.phases.length >= 2 && fight.enemyDefIds.every((x) => ENEMIES[x]), `B3-${id} 2+ phases, valid escorts`)
    // A hazard gets telegraphed within a couple of turns.
    let s = toPlayer(E.withLowEnemyHp ? b : b)
    s = { ...s, units: s.units.map((u) => (u.side === "player" ? { ...u, hp: u.maxHp * 50, maxHp: u.maxHp * 50 } : u)) }
    let telegraphed = false
    for (let t = 0; t < 3 && s.phase === "player"; t++) {
      s = E.endPlayerTurn(s)
      if (s.boss?.pending?.length) telegraphed = true
    }
    ok(telegraphed, `B4-${id} its hazards are telegraphed a turn ahead`)
    // Crossing a threshold enters phase 2 (weak points / enrage as written).
    const p2 = fight.phases[1]
    const hit = { ...b, units: b.units.map((u) => (u.id === b.boss.unitId ? { ...u, hp: Math.floor(u.maxHp * p2.atHpPct) } : u)) }
    const ph = TB.bossAfterDamage(hit, b.boss.unitId)
    ok(ph.boss.phaseIndex >= 1 && (!p2.enter?.weakPoints || ph.boss.weakPointIds.length === p2.enter.weakPoints.length), `B5-${id} phase 2 at ${p2.atHpPct * 100}%: ${p2.name}`, ph.boss)
  }
  // Mana Burn hazard (new kind).
  {
    const { b } = launchKind("warlord", { chapter: 2 })
    const h = heroes(b).find((u) => MANA.profileOf(u)?.drainable)
    const s = { ...toPlayer(b), turn: 3, units: b.units.map((u) => (u.id === h.id ? { ...u, mana: 40 } : u)), boss: { ...b.boss, pending: [{ kind: "manaburn", label: "Ley Scorch", due: 3, tiles: [h.pos], amount: 15 }] } }
    const after = TB.bossEnemyPhaseStart({ ...s, phase: "enemy" })
    ok(U(after, h.id).mana < 40 && U(after, h.id).hp === h.hp, "B6 Ley Scorch burns mana, not HP", [U(after, h.id).mana, U(after, h.id).hp])
    ok(TB.describeBoss(s).upcoming.some((x) => /mana/.test(x.text)) && TB.bossWarningTiles(s).size === 1, "B7 ...and is marked on the board + boss bar")
  }
}

// ===== 4. THE PREVIEW STAYS EXACT ====================================================
{
  for (const [roster, ch] of [["camp-c6-reavers", 6], ["camp-c7-verge", 7], ["camp-c1-cutters", 1], ["camp-c4-pack", 4]]) {
    const { b } = launchKind("night", { chapter: ch, roster })
    let s = toPlayer({ ...b, units: b.units.map((u) => (u.side === "enemy" ? { ...u, shroud: false } : u)) })
    let exact = true
    let checked = 0
    for (let t = 0; t < 3 && s.phase === "player"; t++) {
      const p1 = E.previewEnemyIntents(s)
      const p2 = E.previewEnemyIntents(s)
      if (JSON.stringify(p1) !== JSON.stringify(p2)) exact = false
      const real = E.endPlayerTurn(s)
      for (const { enemyId, intent } of p1) {
        const to = intent.to || intent.fadeTo
        const u = U(real, enemyId)
        if (!to || !u || u.hp <= 0) continue
        checked++
        if (u.pos.row !== to.row || u.pos.col !== to.col) exact = false
      }
      s = real
    }
    ok(exact && checked > 0, `P1-${roster} the intent preview is the real enemy turn (${checked} moves)`, { checked })
  }
}

// ===== 5. EVENTS + LASTING EFFECTS ===================================================
{
  ok(D.WORLD_EVENTS.length >= 10 && D.WORLD_EVENTS.every((e) => e.options.length >= 2 && e.title && e.icon), "W1 10+ world events, each a real choice", D.WORLD_EVENTS.length)
  const allIds = [...D.WORLD_EVENTS, ...Object.values(D.CHAPTER_EVENTS).flat()].map((e) => e.id)
  ok(new Set(allIds).size === allIds.length, "W2 event ids are unique")
  // Every option of every event resolves.
  let resolved = 0
  const bad = []
  const rich = (c) => ({ ...safe(c), essence: 2000, leyShards: 9, ley: { ...c.ley, cut: ["hearth-grove", "grove-mist"] }, chapter: 7 })
  for (const ev of [...D.WORLD_EVENTS, ...Object.values(D.CHAPTER_EVENTS).flat()]) {
    for (const opt of ev.options) {
      let c = rich(CE.createCampaign({ seed: 3 }))
      const region = ev.region === "home" ? "hearthstead" : ev.region === "ley" ? "mistfen" : "outer-grove"
      c = { ...c, content: { ...CC.contentOf(c), events: [{ uid: 77, id: ev.id, regionId: region, day: c.day, expiresDay: c.day + 2 }] } }
      const after = CE.chooseEvent(c, 77, opt.id)
      const ok1 = !CC.contentOf(after).events.length && CC.contentOf(after).lastEvent?.optionId === opt.id && after.status === "active"
      const eff = opt.effects || {}
      const essOk = eff.essence == null || after.essence === c.essence + eff.essence
      const lastOk = !eff.lasting || CC.contentOf(after).effects.length === [eff.lasting].flat().length
      const recOk = !eff.recruit || after.roster.length === c.roster.length + 1
      const mendOk = !eff.mendLine || after.ley.cut.length === c.ley.cut.length - 1
      if (ok1 && essOk && lastOk && recOk && mendOk) resolved++
      else bad.push(`${ev.id}/${opt.id}`)
    }
  }
  ok(!bad.length, `W3 every option of every event resolves and applies its effects (${resolved})`, bad)
  // Costs block.
  {
    let c = { ...CE.createCampaign({ seed: 3 }), essence: 10 }
    c = { ...c, content: { ...CC.contentOf(c), events: [{ uid: 5, id: "w-caravan", regionId: "outer-grove", day: 1, expiresDay: 3 }] } }
    ok(CC.eventOptions(c, 5).find((o) => o.id === "buy").blocked && CE.chooseEvent(c, 5, "buy") === c, "W4 an option you can't pay for is locked")
  }
  // Events turn up over days, and lapse.
  {
    let c = CE.createCampaign({ seed: 4242 })
    const ids = []
    let lapsed = 0
    for (let i = 0; i < 40; i++) {
      c = CE.advanceDay(safe(c))
      for (const ev of CC.contentOf(c).events) if (!ids.includes(ev.id)) ids.push(ev.id)
      if (c.lastDayReport.lines.some((l) => /passed unanswered/.test(l))) lapsed++
    }
    results.eventsSeen = ids
    ok(ids.length >= 5 && ids.some((id) => id.startsWith("c1-")) && ids.some((id) => id.startsWith("w-")), "W5 chapter + world events turn up on the map", ids)
    ok(lapsed >= 1, "W6 ignored events lapse", lapsed)
    const again = (() => {
      let x = CE.createCampaign({ seed: 4242 })
      for (let i = 0; i < 40; i++) x = CE.advanceDay(safe(x))
      return x
    })()
    ok(JSON.stringify(CC.contentOf(again)) === JSON.stringify(CC.contentOf(c)), "W7 deterministic: same seed, same events")
  }
  // Lasting effects reach the fights.
  {
    const base = CE.createCampaign({ seed: 11 })
    const withFx = (fx) => ({ ...base, content: { ...CC.contentOf(base), effects: fx.map((e, i) => ({ uid: 100 + i, untilDay: base.day + 3, label: "t", ...e })) } })
    const m = base.missions[0]
    const oc0 = CE.missionRunState(base, m.id, []).campOvercharge
    ok(CE.missionRunState(withFx([{ kind: "overcharge", amount: 15 }]), m.id, []).campOvercharge === oc0 + 15, "W8 overcharge: fights start Overcharged")
    ok(CE.campaignThreatBonus(withFx([{ kind: "enemyBonus", amount: -4 }])) === CE.campaignThreatBonus(base) - 4, "W9 enemy threat bonus")
    const keys = base.roster.slice(0, 4).map((h) => h.key)
    const ally = CE.launchMission(withFx([{ kind: "ally", unit: "stoneward", name: "Petra", title: "Hired Spear" }]), m.id, keys, build)
    ok(ally.activeMission.run.battle.units.some((u) => u.fateAlly && u.name === "Petra"), "W10 an event ally fights beside you")
    const rival = CE.launchMission(withFx([{ kind: "rival", enemyId: "moss-troll", name: "the Trap-Taker", title: "Quarry", bounty: 150 }]), m.id, keys, build)
    ok(rival.activeMission.run.battle.units.some((u) => u.fateRival && /Trap-Taker/.test(u.name)), "W11 an event rival hunts you")
    const paid = CE.resolveMission(finish(rival, "won"))
    ok(paid.lastAftermath.rewards.some((r) => /Bounty: \+150/.test(r)) && !CC.contentOf(paid).effects.some((e) => e.kind === "rival"), "W12 beat it: bounty paid, the rival is spent", paid.lastAftermath.rewards)
    const rich = CE.resolveMission(finish(CE.launchMission(withFx([{ kind: "essenceMult", mult: 1.5 }]), m.id, keys, build), "won"))
    const plain = CE.resolveMission(finish(CE.launchMission(base, m.id, keys, build), "won"))
    ok(rich.essence > plain.essence, "W13 Essence bonus scales mission pay", [plain.essence, rich.essence])
    const hurt = (c) => ({ ...c, roster: c.roster.map((h) => ({ ...h, hpPct: 0.3 })) })
    ok(CE.advanceDay(hurt(withFx([{ kind: "heal", amount: 0.1 }]))).roster[0].hpPct > CE.advanceDay(hurt(base)).roster[0].hpPct, "W14 healing bonus")
    const slow = CE.advanceDay(withFx([{ kind: "threatMult", mult: 2 }]))
    const norm = CE.advanceDay(base)
    ok(slow.regions.find((r) => r.id === "outer-grove").threat > norm.regions.find((r) => r.id === "outer-grove").threat, "W15 threat multiplier")
    let fade = withFx([{ kind: "overcharge", amount: 5 }])
    for (let i = 0; i < 4; i++) fade = CE.advanceDay(safe(fade))
    ok(!CC.lastingList(fade).length, "W16 lasting effects fade after their days")
    const saved = CE.deserializeCampaign(JSON.parse(JSON.stringify(CE.serializeCampaign(withFx([{ kind: "overcharge", amount: 5 }])))))
    ok(saved && CC.contentOf(saved).effects.length === 1, "W17 events + effects survive a save/load")
  }
}

// ===== 6. EXPEDITION SEEDS UNCHANGED ==================================================
{
  // Fingerprint of origin/development before this sprint: every battle /
  // elite / boss node's enemies + map template + objective for 4 seeds.
  const EXPECTED_HASH = "d9a91e60"
  const EXPECTED_POOLS = { 1: 8, 2: 18, 3: 9, 4: 11, 5: 3, 6: 2, 7: 2 }
  const EXPECTED_4242 = ["1:rotwood-husk+rotwood-sapling:river-crossing:kill", "3:drowned-siren:ruined-walls:kill", "5:mist-growler:river-crossing:totem", "7:mist-growler+mist-growler:ruined-walls:kill", "10:deepwarden:ruined-walls:kill", "12:bark-brute:forest-glade:totem", "14:moss-troll:hill-fort:totem", "16:bloomrot-stalker:forest-glade:kill"]
  const out = { pools: Object.fromEntries(Object.entries(ACT_ENEMIES).map(([a, l]) => [a, l.length])) }
  for (const seed of [1, 4242, 99, 123456]) {
    const run = rt.startRun("tommy", null, { forcedSeed: seed })
    const picks = []
    rt.RUN_PATH.forEach((node, i) => {
      if (!["battle", "elite", "miniboss", "boss"].includes(node.type)) return
      const rs = { ...run, path: rt.RUN_PATH, nodeIndex: i }
      picks.push(`${i}:${rt.previewBattleEnemies(rs).map((e) => e.defId).join("+")}:${TR.mapTemplateForNode(seed, i).template.id}:${TR.objectiveForRunNode(rs)?.type}`)
    })
    out[seed] = picks
  }
  const h = (s) => {
    let x = 2166136261
    for (const ch of s) {
      x ^= ch.charCodeAt(0)
      x = Math.imul(x, 16777619) >>> 0
    }
    return x.toString(16)
  }
  ok(JSON.stringify(out.pools) === JSON.stringify(EXPECTED_POOLS), "S1 the Expedition's per-Act solo pools are unchanged", out.pools)
  ok(JSON.stringify(out[4242].slice(0, 8)) === JSON.stringify(EXPECTED_4242), "S2 seed 4242: the first 8 fights pick the same enemies / maps / objectives", out[4242].slice(0, 8))
  ok(h(JSON.stringify(out)) === EXPECTED_HASH, "S3 4 seeds x every fight node: identical to origin/development", h(JSON.stringify(out)))
}

console.log(JSON.stringify(results, null, 1).slice(0, 2000))
console.log(`ENGINE: ${n - fails.length}/${n} pass`)
for (const f of fails) console.log("  FAIL", f)

if (!process.env.ENGINE_ONLY) {
  const uiFails = await uiChecks()
  console.log(`UI: ${uiFails.length ? `${uiFails.length} FAIL` : "all pass"}`)
  for (const f of uiFails) console.log("  FAIL", f)
  process.exitCode = fails.length || uiFails.length ? 1 : 0
} else process.exitCode = fails.length ? 1 : 0

async function uiChecks() {
  const { chromium } = await import("playwright")
  const PORT = process.env.PORT || 5451
  const SHOTS = `${ROOT}.scratch/shots`
  await mkdir(SHOTS, { recursive: true })
  const out = []
  const ui = {}
  const check = (cond, msg, data) => cond || out.push(data === undefined ? msg : `${msg} ${JSON.stringify(data).slice(0, 300)}`)
  const browser = await chromium.launch()
  try {
    const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } })
    // Each seeded step gets a FRESH tab: after 4-5 navigations of one dev-server
    // tab the next load hung on a blank page (ui5 flake), never a game error.
    await ctx.addInitScript(() => {
      if (location.search.includes("fresh=1")) {
        localStorage.removeItem("heartwood-campaign-save-v1")
        localStorage.removeItem("heartwood-play-mode")
      }
    })
    let page = await ctx.newPage()
    const errs = []
    page.on("pageerror", (e) => errs.push(String(e)))
    const step = async (name, fn) => {
      try {
        await fn()
      } catch (e) {
        out.push(`${name}: ${String(e).split("\n")[0]}`)
        await page.screenshot({ path: `${SHOTS}/content-fail-${name}.png` }).catch(() => {})
      }
    }
    // Seeds a campaign save (built in-page from the real modules) and opens the campaign.
    page.on("crash", () => errs.push("page crashed"))
    // A mounted campaign fight autosaves on every state change, so a previous
    // step's fight could overwrite the new seed: ?fresh=1 (init script above)
    // clears the campaign save BEFORE the app boots.
    const seedCampaign = async (setup) => {
      await page.close().catch(() => {})
      page = await ctx.newPage()
      page.on("pageerror", (e) => errs.push(String(e)))
      await page.goto(`http://localhost:${PORT}/heartwood?fresh=1`, { waitUntil: "domcontentloaded" })
      await page.waitForTimeout(600)
      await page.evaluate(async (setupSrc) => {
        localStorage.setItem("heartwood-autobattler-intro-seen", "1")
        localStorage.setItem("heartwood-story-intro-seen", "1")
        localStorage.setItem("heartwood-coach-enabled-v1", "false")
        const CE = await import("/src/services/heartwood/campaignEngine.js")
        const CC = await import("/src/services/heartwood/campaignContentEngine.js")
        const CB = await import("/src/data/heartwood/campaignBosses.js")
        const rt = await import("/src/services/heartwood/runEngine.js")
        const TR = await import("/src/services/heartwood/tacticsRealMatchup.js")
        const E = await import("/src/services/heartwood/tacticsEngine.js")
        const build = (run) => rt.startTacticsFormationBattle(run, (start) => E.enterDeploy(TR.buildRunTacticsBattle(run, start)))
        const fn = new Function("CE", "CC", "CB", "build", `return (${setupSrc})(CE, CC, CB, build)`)
        const c = fn(CE, CC, CB, build)
        localStorage.setItem("heartwood-campaign-save-v1", JSON.stringify(CE.serializeCampaign(c)))
        localStorage.setItem("heartwood-play-mode", "campaign")
      }, setup.toString())
      await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
    }
    const missionSetup = (kind, chapter) => `(CE, CC, CB) => {
      let c = CE.createCampaign({ seed: 21 })
      c = { ...c, chapter: ${chapter}, regions: c.regions.map((r) => ({ ...r, threat: 20 })) }
      const m0 = c.missions[0]
      const extra = "${kind}" === "warlord" ? { bossId: CB.bossIdForChapter(${chapter}), title: "Old Gnarlwick - Outer Grove" } : { roster: "camp-c${chapter}-${chapter === 1 ? "cutters" : chapter === 3 ? "tide" : "cantors"}", feature: "${chapter === 1 ? "root-hollows" : "ley-fault"}" }
      return { ...c, missions: [{ ...m0, type: "${kind}", chapterOf: ${chapter}, ...extra }, ...c.missions.slice(1)] }
    }`
    // UI-1: a new mission's briefing.
    await step("ui1", async () => {
      await seedCampaign(eval(missionSetup("liberate", 1)))
      await page.waitForSelector("[data-campaign-world-map]", { timeout: 20000 })
      const pin = await page.locator('[data-campaign-pin][data-type="liberate"]').count()
      await page.locator('.hwc-mission-row[data-type="liberate"]').first().click()
      await page.locator('[data-campaign-briefing="liberate"]').waitFor({ timeout: 5000 })
      ui.brief = await page.evaluate(() => ({
        text: document.querySelector('[data-campaign-briefing="liberate"]')?.innerText || "",
        foes: [...document.querySelectorAll("[data-campaign-foe]")].map((x) => x.getAttribute("data-campaign-foe")),
        feature: document.querySelector("[data-campaign-feature]")?.getAttribute("data-campaign-feature"),
      }))
      await page.screenshot({ path: `${SHOTS}/content_mission_briefing.png` })
      check(pin === 1 && /Free the captives/.test(ui.brief.text) && ui.brief.foes.includes("ley-cutter") && ui.brief.feature === "root-hollows", "U1 a new mission: its own pin + briefing (rules, chapter foes, battlefield)", { pin, ...ui.brief })
    })
    // UI-2: a chapter event on the map, choose, see what it did.
    await step("ui2", async () => {
      await seedCampaign(`(CE, CC) => { const c = CE.createCampaign({ seed: 21 }); return { ...c, essence: 500, content: { ...CC.contentOf(c), events: [{ uid: 1, id: "c1-widow", regionId: "outer-grove", day: 1, expiresDay: 3 }] } } }`)
      await page.waitForSelector('[data-campaign-event="c1-widow"]', { timeout: 20000 })
      ui.marker = await page.locator('[data-campaign-event-marker="c1-widow"]').count()
      ui.options = await page.locator("[data-campaign-event-option]").count()
      await page.screenshot({ path: `${SHOTS}/content_chapter_event.png` })
      await page.locator('[data-campaign-event-option="boy"]').click()
      await page.locator('[data-campaign-event-result="c1-widow"]').waitFor({ timeout: 5000 })
      ui.result = await page.locator('[data-campaign-event-result="c1-widow"]').innerText()
      await page.screenshot({ path: `${SHOTS}/content_chapter_event_result.png` })
      check(ui.marker === 1 && ui.options === 3 && /joins the Hearth/.test(ui.result), "U2 a chapter event: map marker, 3 choices, the result card", ui)
      await page.locator("[data-campaign-event-dismiss]").click()
      check((await page.locator("[data-campaign-event-result]").count()) === 0, "U3 the result card closes")
    })
    // UI-3: a world event with a lasting effect.
    await step("ui3", async () => {
      await seedCampaign(`(CE, CC) => { const c = CE.createCampaign({ seed: 21 }); return { ...c, essence: 500, content: { ...CC.contentOf(c), events: [{ uid: 1, id: "w-ley-storm", regionId: "mistfen", day: 1, expiresDay: 3 }] } } }`)
      await page.waitForSelector('[data-campaign-event="w-ley-storm"]', { timeout: 20000 })
      await page.screenshot({ path: `${SHOTS}/content_world_event.png` })
      await page.locator('[data-campaign-event-option="bottle"]').click()
      await page.locator("[data-campaign-lasting]").waitFor({ timeout: 5000 })
      ui.lasting = await page.locator("[data-campaign-lasting]").innerText()
      await page.screenshot({ path: `${SHOTS}/content_world_event_lasting.png` })
      check(/Overcharge/.test(ui.lasting), "U4 a world event's lasting effect shows as a chip", ui.lasting)
    })
    // UI-4: a mini-boss fight: boss bar + the campaign fight panel with its intro.
    await step("ui4", async () => {
      await seedCampaign(`(CE, CC, CB, build) => {
        let c = CE.createCampaign({ seed: 21 })
        const m0 = c.missions[0]
        const m = { ...m0, type: "warlord", chapterOf: 1, bossId: "mb-gnarlwick", nodeIndex: CE.missionNodeIndex(m0.act, "elite", () => 0), title: "Old Gnarlwick - Outer Grove" }
        c = { ...c, missions: [m, ...c.missions.slice(1)] }
        return CE.launchMission(c, m.id, c.roster.slice(0, 4).map((h) => h.key), build)
      }`)
      await page.waitForSelector("[data-campaign-fight]", { timeout: 20000 })
      await page.locator('[data-campaign-ops="warlord"]').waitFor({ timeout: 5000 })
      ui.boss = await page.evaluate(() => ({
        ops: document.querySelector("[data-campaign-ops]")?.innerText || "",
        bossBar: !!document.querySelector('[data-boss], .hwt-boss-bar, [class*="boss"]'),
        tokens: [...document.querySelectorAll(".hwt-token[data-unit-id]")].map((t) => t.getAttribute("data-unit-id")).filter((id) => id.includes("mb-gnarlwick")),
      }))
      await page.screenshot({ path: `${SHOTS}/content_miniboss_fight.png`, fullPage: true })
      check(/Little sparks/.test(ui.boss.ops) && ui.boss.tokens.length === 1 && ui.boss.bossBar, "U5 the Named Foe fight: token + boss bar + its intro in the campaign panel", ui.boss)
    })
    // UI-5: a mana storm fight: the panel shows the storm colour + the kits.
    await step("ui5", async () => {
      await seedCampaign(`(CE, CC, CB, build) => {
        let c = { ...CE.createCampaign({ seed: 21 }), chapter: 3 }
        const m0 = c.missions[0]
        const m = { ...m0, type: "storm", chapterOf: 3, roster: "camp-c3-tide", feature: "ley-fault" }
        c = { ...c, missions: [m, ...c.missions.slice(1)] }
        return CE.launchMission(c, m.id, c.roster.slice(0, 4).map((h) => h.key), build)
      }`)
      await page.waitForSelector('[data-campaign-ops="storm"]', { timeout: 20000 })
      ui.storm = await page.evaluate(() => ({
        storm: document.querySelector("[data-campaign-storm]")?.getAttribute("data-campaign-storm"),
        kits: [...document.querySelectorAll("[data-campaign-kit]")].map((x) => x.getAttribute("data-campaign-kit")),
        objective: document.querySelector("[data-objective]")?.getAttribute("data-objective"),
      }))
      await page.screenshot({ path: `${SHOTS}/content_storm_fight.png`, fullPage: true })
      check(ui.storm.storm && ui.storm.kits.includes("tide-cantor") && ui.storm.objective === "campaign-storm", "U6 a mana storm fight: colour, foe kits, its objective", ui.storm)
      await page.evaluate(() => {
        localStorage.removeItem("heartwood-campaign-save-v1")
        localStorage.removeItem("heartwood-play-mode")
      })
    })
    check(errs.length === 0, "U7 no page errors", errs.slice(0, 3))
  } finally {
    await browser.close()
  }
  console.log(JSON.stringify(ui, null, 1).slice(0, 2500))
  return out
}
