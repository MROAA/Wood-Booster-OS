// Class system part A: every recruitable unit has a class + signature,
// each of the 19 classes' passive + skills (engine, synthetic boards),
// old castAbility still works, preview == real, and the UI skill bar.
import { chromium } from "playwright"

const PORT = process.env.PORT || 5445
const browser = await chromium.launch()
const errs = []
const out = { errors: [] }
const page = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
page.on("pageerror", (e) => errs.push(String(e)))
page.on("console", (m) => m.type() === "error" && !/ERR_CONNECTION_REFUSED/.test(m.text()) && errs.push(m.text()))
await page.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
await page.waitForSelector(".hwt-board", { timeout: 20000 })

const engine = await page.evaluate(async () => {
  const E = await import("/src/services/heartwood/tacticsEngine.js")
  const { UNITS } = await import("/src/data/heartwood/units.js")
  const { CLASSES, CLASS_IDS, PART_B_CANDIDATES } = await import("/src/data/heartwood/classes.js")
  const r = {}
  const fails = []
  const ok = (cond, msg, data) => {
    if (!cond) fails.push(data === undefined ? msg : `${msg} ${JSON.stringify(data)}`)
  }

  // --- every recruitable unit: a class + 2-3 skills + a signature ---------
  const bad = []
  const perClass = {}
  for (const def of Object.values(UNITS)) {
    if (def.summonOnly) continue
    const u = E.createTacticsBattle("default", [def.id]).units.find((x) => x.defId === def.id)
    const good = u && CLASSES[u.classId] && u.classSkills.length >= 2 && u.classSkills.length <= 3 && u.ability && u.classPassive === CLASSES[u.classId].passive.id
    if (!good) bad.push(def.id)
    if (!def.fusedFrom) perClass[def.classId] = (perClass[def.classId] || 0) + 1
  }
  r.classCounts = perClass
  // Part B added 19 more classes (38 total).
  ok(CLASS_IDS.length === 38, "38 classes", CLASS_IDS.length)
  ok(bad.length === 0, "units without class/signature", bad)
  ok(CLASS_IDS.every((c) => perClass[c] > 0), "every class used by some unit", perClass)
  ok(Object.keys(PART_B_CANDIDATES).every((id) => UNITS[id]), "PART_B_CANDIDATES ids exist")
  const cmd = E.createTacticsBattle("default", ["swiftclaw"]).units.find((u) => u.id === "player-commander")
  ok(cmd.classId === "commander" && cmd.classSkills.length === 3 && cmd.ability === null, "Commander character uses the Commander class kit", { c: cmd.classId })

  // --- synthetic board helper ----------------------------------------------
  const E0 = "enemy-ironmaw-0"
  const E1 = "enemy-sapling-attendant-1"
  const E2 = "enemy-hoardling-2"
  const C = "player-commander"
  function board(squad, place) {
    let s = E.createTacticsBattle("default", squad)
    const withDefaults = { [C]: { row: 8, col: 11 }, [E2]: { row: 0, col: 0 }, ...place }
    s = {
      ...s,
      terrain: {},
      wallHp: {},
      units: s.units.map((u) => {
        const k = withDefaults[u.id] || withDefaults[u.defId]
        if (!k) return { ...u, hp: 0 }
        const { row, col, ...patch } = k
        const base = u.side === "enemy" ? { hp: 40, maxHp: 40, ward: 0, revive: 0, regen: 0, taunt: 0, enemySkills: [] } : {}
        return { ...u, block: 0, ...base, ...patch, pos: { row, col } }
      }),
    }
    return s
  }
  const pid = (s, defId) => s.units.find((u) => u.defId === defId && u.side === "player").id
  const U = (s, id) => s.units.find((u) => u.id === id)
  const dmg = (a, b, id) => U(a, id).hp - U(b, id).hp
  const labels = (s) => (s.events || []).filter((e) => e.kind === "reaction").map((e) => e.label)
  const strip = (s, id) => ({ ...s, units: s.units.map((u) => (u.id === id ? { ...u, classPassive: null } : u)) })
  const enemyHit = (s, attacker, target) => E.attackUnit({ ...s, phase: "enemy" }, attacker, target)
  const cast = (s, id, target, skill) => E.castAbility(s, id, target, skill)

  // 1 Guardian ---------------------------------------------------------------
  {
    const s = board(["bulwark-of-ages", "the-fool"], { "bulwark-of-ages": { row: 4, col: 7 }, "the-fool": { row: 3, col: 8 }, [E0]: { row: 2, col: 8 }, [E1]: { row: 3, col: 7 } })
    const g = pid(s, "bulwark-of-ages")
    const f = pid(s, "the-fool")
    const withBlock = { ...s, units: s.units.map((u) => (u.id === g ? { ...u, block: 4 } : u)) }
    const side = enemyHit(withBlock, E1, g)
    const sideCtl = enemyHit(strip(withBlock, g), E1, g)
    ok(!side.log.join(" ").includes("Block is weakened") && sideCtl.log.join(" ").includes("Block is weakened"), "Guardian Stalwart keeps Block on a side hit")
    const guarded = cast(s, g, f, "guard")
    ok(U(guarded, f).guarded === 1 && U(guarded, g).ap === 1, "Guard applies", U(guarded, f))
    const hitG = enemyHit(guarded, E0, f)
    const hitCtl = enemyHit(s, E0, f)
    ok(dmg(guarded, hitG, g) > 0 && dmg(guarded, hitG, f) < dmg(s, hitCtl, f) && labels(hitG).includes("Guard!"), "Guard splits the hit", { g: dmg(guarded, hitG, g), f: dmg(guarded, hitG, f), ctl: dmg(s, hitCtl, f) })
    const wall = cast(s, g, null, "shield-wall")
    ok(U(wall, g).block === 3 && U(wall, f).block === 2 && U(wall, g).classCds["shield-wall"] === 3, "Shield Wall", { g: U(wall, g).block, f: U(wall, f).block })
  }
  // 2 Warden -----------------------------------------------------------------
  {
    const s = board(["justice", "the-fool"], { justice: { row: 4, col: 8 }, "the-fool": { row: 4, col: 9 }, [E0]: { row: 4, col: 6 }, [E1]: { row: 1, col: 8 } })
    const w = pid(s, "justice")
    const f = pid(s, "the-fool")
    const ended = E.endPlayerTurn(s)
    const moved = E.endPlayerTurn(E.moveUnit(s, w, { row: 5, col: 9 }))
    ok(labels(ended).includes("Hold Ground!") && !labels(moved).includes("Hold Ground!"), "Warden Hold Ground only when it didn't move")
    const zone = cast(s, w, null, "warden-zone")
    ok(U(zone, w).zoneGuard === 1 && U(zone, f).zoneGuard === 1 && U(zone, w).block === 1 && U(zone, f).block === 1, "Warden Zone applies")
    const noBlock = { ...zone, units: zone.units.map((u) => (u.id === f ? { ...u, block: 0 } : u)) }
    const near = board(["justice", "the-fool"], { justice: { row: 4, col: 8 }, "the-fool": { row: 4, col: 9 }, [E0]: { row: 4, col: 10 }, [E1]: { row: 1, col: 8 } })
    const nearZone = { ...cast(near, w, null, "warden-zone") }
    const nz = { ...nearZone, units: nearZone.units.map((u) => (u.id === f ? { ...u, block: 0 } : u)) }
    ok(dmg(nz, enemyHit(nz, E0, f), f) === dmg(near, enemyHit(near, E0, f), f) - 1, "Warden Zone: -1 damage per hit", { z: dmg(nz, enemyHit(nz, E0, f), f), c: dmg(near, enemyHit(near, E0, f), f) })
    void noBlock
    const thorn = cast(s, w, null, "thorn-boundary")
    ok(dmg(s, thorn, E0) >= 2 && U(thorn, E0).slow === 2 && dmg(s, thorn, E1) === 0, "Thorn Boundary hits + slows only within 2", { e0: dmg(s, thorn, E0), e1: dmg(s, thorn, E1) })
  }
  // 3 Juggernaut -------------------------------------------------------------
  {
    const s = board(["rooks-charge"], { "rooks-charge": { row: 4, col: 10, root: 2 }, [E0]: { row: 4, col: 6 }, [E1]: { row: 8, col: 0 } })
    const j = pid(s, "rooks-charge")
    const a = U(s, j).attack
    const ch = cast(s, j, E0, "charge")
    ok(U(ch, j).pos.col === 7 && dmg(s, ch, E0) === a + 3 && U(ch, j).root === 0, "Charge: shakes Root, +1 per tile", { pos: U(ch, j).pos, d: dmg(s, ch, E0), a })
    const s2 = board(["rooks-charge"], { "rooks-charge": { row: 4, col: 7 }, [E0]: { row: 4, col: 6 }, [E1]: { row: 3, col: 6 } })
    const s2w = { ...s2, terrain: { "5-8": "wall" }, wallHp: { "5-8": 8 } }
    const gb = cast(s2w, j, null, "ground-breaker")
    ok(dmg(s2w, gb, E0) === a && dmg(s2w, gb, E1) === a && U(gb, E0).slow === 2 && gb.terrain["5-8"] === "rubble", "Ground Breaker", { e0: dmg(s2w, gb, E0), e1: dmg(s2w, gb, E1), t: gb.terrain })
    const low = { ...s2, units: s2.units.map((u) => (u.id === j ? { ...u, hp: Math.floor(u.maxHp * 0.4) } : u)) }
    ok(dmg(low, enemyHit(low, E0, j), j) === dmg(s2, enemyHit(s2, E0, j), j) - 1, "Juggernaut Last Stand -1 below half HP")
  }
  // 4 Sentinel ---------------------------------------------------------------
  {
    const s = board(["trueshot"], { trueshot: { row: 4, col: 9 }, [E0]: { row: 4, col: 7 }, [E1]: { row: 0, col: 3 } })
    const t = pid(s, "trueshot")
    const still = E.attackUnit(s, t, E0)
    const movedS = { ...s, units: s.units.map((u) => (u.id === t ? { ...u, moved: true } : u)) }
    ok(dmg(s, still, E0) === dmg(movedS, E.attackUnit(movedS, t, E0), E0) + 1, "Sentinel Defensive Aim +1 when it hasn't moved")
    // Ranged rework: Mark Intruder became the Sniper's Headshot (x1.5, +25% to hit).
    const mk = cast(s, t, E0, "mark-intruder")
    ok(dmg(s, mk, E0) === Math.round(U(s, t).attack * 1.5) + 1, "Headshot x1.5 (+1 Deadeye)", { m: dmg(s, mk, E0), a: U(s, t).attack })
    const ow = cast(s, t, null, "overwatch")
    ok(U(ow, t).overwatch === 1, "Overwatch set")
    const far = board(["trueshot"], { trueshot: { row: 4, col: 9 }, [E0]: { row: 4, col: 4 }, [E1]: { row: 0, col: 0 } })
    const ow2 = { ...cast(far, t, null, "overwatch"), phase: "enemy" }
    const mv = E.moveUnit(ow2, E0, { row: 4, col: 6 })
    ok(U(mv, E0).pos.col === 6 && dmg(ow2, mv, E0) > 0 && U(mv, t).overwatch === 0 && labels(mv).includes("Overwatch!"), "Overwatch fires on an enemy that moves into range", { hp: dmg(ow2, mv, E0) })
  }
  // 5 Bruiser ----------------------------------------------------------------
  {
    const s = board(["strength"], { strength: { row: 4, col: 7 }, [E0]: { row: 4, col: 6 }, [E1]: { row: 3, col: 6 } })
    const b = pid(s, "strength")
    const a = U(s, b).attack
    const half = { ...s, units: s.units.map((u) => (u.id === b ? { ...u, hp: Math.floor(u.maxHp / 2) } : u)) }
    ok(dmg(half, E.attackUnit(half, b, E0), E0) === dmg(s, E.attackUnit(s, b, E0), E0) + 2, "Bruiser Adrenaline +2 at half HP")
    const hs = cast(s, b, E0, "heavy-swing")
    ok(dmg(s, hs, E0) === a && dmg(s, hs, E1) === Math.ceil(a / 2), "Heavy Swing", { e0: dmg(s, hs, E0), e1: dmg(s, hs, E1), a })
    const sc = cast(s, b, E0, "shoulder-check")
    ok(U(sc, E0).pos.col === 5 && U(sc, b).pos.col === 6 && dmg(s, sc, E0) === Math.ceil(a / 2), "Shoulder Check pushes + steps in", { e: U(sc, E0).pos, b: U(sc, b).pos })
  }
  // 6 Striker ----------------------------------------------------------------
  {
    const s = board(["the-hierophant"], { "the-hierophant": { row: 4, col: 7 }, [E0]: { row: 4, col: 6 }, [E1]: { row: 8, col: 0 } })
    const st = pid(s, "the-hierophant")
    const a = U(s, st).attack
    const h1 = E.attackUnit(s, st, E0)
    const h2 = E.attackUnit(h1, st, E0)
    ok(dmg(h1, h2, E0) === dmg(s, h1, E0) + 1, "Striker Battle Rhythm +1 on its next hit", { a: dmg(s, h1, E0), b: dmg(h1, h2, E0) })
    const ds = cast(s, st, E0, "double-strike")
    ok(dmg(s, ds, E0) === 2 * Math.ceil(a * 0.6) + 1, "Double Strike (2 hits, rhythm)", { d: dmg(s, ds, E0), a })
    const pois = { ...s, units: s.units.map((u) => (u.id === E0 ? { ...u, poison: 2 } : u)) }
    ok(dmg(pois, cast(pois, st, E0, "exploit-opening"), E0) === a + 3 && dmg(s, cast(s, st, E0, "exploit-opening"), E0) === a, "Exploit Opening +3 vs a statused target")
  }
  // 7 Assassin ---------------------------------------------------------------
  {
    const s = board(["duskclaw"], { duskclaw: { row: 4, col: 9 }, [E0]: { row: 4, col: 6 }, [E1]: { row: 8, col: 0 } })
    const as = pid(s, "duskclaw")
    const a = U(s, as).attack
    const step = cast(s, as, E0, "shadow-step")
    ok(U(step, as).pos.col === 5 && U(step, as).pos.row === 4 && U(step, as).ap === 1, "Shadow Step lands behind", U(step, as).pos)
    const back = E.attackUnit(step, as, E0)
    const backCtl = E.attackUnit(strip(step, as), as, E0)
    ok(back.log.join(" ").includes("from behind") && dmg(step, back, E0) === dmg(step, backCtl, E0) + 3, "Backstab +3 from behind", { b: dmg(step, back, E0), c: dmg(step, backCtl, E0) })
    const s2 = board(["duskclaw"], { duskclaw: { row: 4, col: 7 }, [E0]: { row: 4, col: 6, hp: 12 }, [E1]: { row: 8, col: 0 } })
    const ex = cast(s2, as, E0, "execution")
    const s3 = board(["duskclaw"], { duskclaw: { row: 4, col: 7 }, [E0]: { row: 4, col: 6 }, [E1]: { row: 8, col: 0 } })
    ok(dmg(s2, ex, E0) === Math.min(12, Math.round(a * 2.5)) && dmg(s3, cast(s3, as, E0, "execution"), E0) === a, "Execution x2.5 below 40%", { d: dmg(s2, ex, E0), a })
  }
  // 8 Duelist ----------------------------------------------------------------
  {
    const s = board(["the-lovers"], { "the-lovers": { row: 4, col: 7 }, [E0]: { row: 4, col: 6 }, [E1]: { row: 8, col: 0 } })
    const d = pid(s, "the-lovers")
    const a = U(s, d).attack
    const hit1 = enemyHit(s, E0, d)
    const hit2 = E.attackUnit(hit1, E0, d)
    ok(dmg(s, hit1, E0) === Math.ceil(a / 2) && labels(hit1).includes("Riposte!") && dmg(hit1, hit2, E0) === 0, "Riposte once per round", { r: dmg(s, hit1, E0) })
    const s2 = board(["the-lovers"], { "the-lovers": { row: 4, col: 6 }, [C]: { row: 5, col: 4, hp: 5 }, [E0]: { row: 4, col: 3 }, [E1]: { row: 8, col: 0 } })
    const before = E.previewEnemyIntents(s2).find((i) => i.enemyId === E0)?.intent
    const chal = cast(s2, d, E0, "challenge")
    ok(U(chal, E0).challenged === 2 && U(chal, E0).challengedBy === d, "Challenge applies")
    const after = E.previewEnemyIntents(chal).find((i) => i.enemyId === E0)?.intent
    ok(before?.targetId === C && after?.targetId === d, "Challenged enemy goes for the Duelist", { before, after })
    const s3 = board(["the-lovers"], { "the-lovers": { row: 4, col: 7 }, [E0]: { row: 4, col: 6 }, [E1]: { row: 8, col: 0 } })
    const c3 = { ...s3, units: s3.units.map((u) => (u.id === E0 ? { ...u, challenged: 2, challengedBy: d } : u)) }
    ok(dmg(c3, E.attackUnit(c3, d, E0), E0) === dmg(s3, E.attackUnit(s3, d, E0), E0) + 2, "Duelist +2 vs its challenged rival")
    const dis = cast(s3, d, E0, "disarm")
    ok(dmg(s3, dis, E0) === Math.ceil(a / 2) && U(dis, E0).disarmed === 1, "Disarm applies")
    const cmdHitCtl = board(["the-lovers"], { "the-lovers": { row: 2, col: 9 }, [C]: { row: 4, col: 7 }, [E0]: { row: 4, col: 6 }, [E1]: { row: 8, col: 0 } })
    const disarmed = { ...cmdHitCtl, units: cmdHitCtl.units.map((u) => (u.id === E0 ? { ...u, disarmed: 1 } : u)) }
    const full = dmg(cmdHitCtl, enemyHit(cmdHitCtl, E0, C), C)
    ok(dmg(disarmed, enemyHit(disarmed, E0, C), C) === Math.floor(full / 2), "Disarmed enemy hits for half")
  }
  // 9 Ranger -----------------------------------------------------------------
  {
    const s = board(["bishops-slash"], { "bishops-slash": { row: 4, col: 9 }, [E0]: { row: 4, col: 6 }, [E1]: { row: 8, col: 0 } })
    const rg = pid(s, "bishops-slash")
    const a = U(s, rg).attack
    ok(dmg(s, E.attackUnit(s, rg, E0), E0) === dmg(s, E.attackUnit(strip(s, rg), rg, E0), E0) + 1, "Ranger Steady Aim +1 at 3+ tiles")
    const hm = cast(s, rg, E0, "hunters-mark")
    ok(U(hm, E0).mark === 2 && U(hm, E0).markBonus === 2, "Hunter's Mark applies")
    const near = board(["bishops-slash"], { "bishops-slash": { row: 4, col: 7 }, [E0]: { row: 4, col: 6 }, [E1]: { row: 8, col: 0 } })
    const marked = { ...near, units: near.units.map((u) => (u.id === E0 ? { ...u, mark: 2, markBonus: 2 } : u)) }
    ok(dmg(marked, E.attackUnit(marked, rg, E0), E0) === dmg(near, E.attackUnit(near, rg, E0), E0) + 2, "Hunter's Mark: allies +2")
    const rs = cast(s, rg, E0, "retreat-shot")
    ok(dmg(s, rs, E0) === a + 1 && U(rs, rg).pos.col === 11, "Retreat Shot hits + jumps back 2", { d: dmg(s, rs, E0), pos: U(rs, rg).pos })
  }
  // 10 Artillery -------------------------------------------------------------
  {
    const s = board(["bramble-sweep"], { "bramble-sweep": { row: 4, col: 10 }, [E0]: { row: 4, col: 8 }, [E1]: { row: 4, col: 6 } })
    const ar = pid(s, "bramble-sweep")
    const a = U(s, ar).attack
    const walled = { ...s, terrain: { "3-10": "wall" }, wallHp: { "3-10": 20 } }
    const wh = E.attackWall(walled, ar, { row: 3, col: 10 })
    ok(wh.wallHp["3-10"] === 20 - 2 * a, "Siege: double damage to barricades", { hp: wh.wallHp["3-10"], a })
    const blocked = { ...s, units: s.units.map((u) => (u.id === E0 ? { ...u, block: 3 } : u)) }
    ok(dmg(blocked, E.attackUnit(blocked, ar, E0), E0) === dmg(blocked, E.attackUnit(strip(blocked, ar), ar, E0), E0) + 2, "Siege +2 vs a target with Block")
    // Ranged rework: Piercing Beam became the Grenadier's Frag Grenade (tile, 3x3).
    const beam = cast(s, ar, "4-7", "piercing-beam")
    ok(dmg(s, beam, E0) > 0 && dmg(s, beam, E1) > 0, "Frag Grenade hits every enemy in the blast", { e0: dmg(s, beam, E0), e1: dmg(s, beam, E1) })
    // Suppression Fire became Shred Round: tears the cover away, then hits.
    const s2 = board(["bramble-sweep"], { "bramble-sweep": { row: 4, col: 10 }, [E0]: { row: 4, col: 8 }, [E1]: { row: 3, col: 7 } })
    const sup = cast({ ...s2, terrain: { "4-9": "rock" } }, ar, E0, "suppression-fire")
    ok(dmg(s2, sup, E0) >= a && sup.terrain["4-9"] === "rubble" && dmg(s2, sup, E1) === 0, "Shred Round shreds the cover then hits", { e0: dmg(s2, sup, E0), t: sup.terrain })
  }
  // 11 Executioner -----------------------------------------------------------
  {
    const s = board(["culler"], { culler: { row: 4, col: 7 }, [E0]: { row: 4, col: 6, hp: 2 }, [E1]: { row: 3, col: 6, hp: 2 } })
    const ex = pid(s, "culler")
    const k1 = E.attackUnit(s, ex, E0)
    const k2 = E.attackUnit(k1, ex, E1)
    ok(U(k1, E0).hp === 0 && U(k1, ex).ap === 2 && U(k2, ex).ap === 1 && labels(k1).includes("Momentum!"), "Finisher's Momentum: first kill refunds 1 AP", { ap1: U(k1, ex).ap, ap2: U(k2, ex).ap })
    const s2 = board(["culler"], { culler: { row: 4, col: 7 }, [E0]: { row: 4, col: 6, hp: 16 }, [E1]: { row: 8, col: 0 } })
    const a = U(s2, ex).attack
    ok(dmg(s2, cast(s2, ex, E0, "execute"), E0) === Math.min(16, 2 * a), "Execute x2 below half")
    const s3 = board(["culler"], { culler: { row: 4, col: 7 }, [E0]: { row: 4, col: 6, ward: 1, revive: 1 }, [E1]: { row: 8, col: 0 } })
    const sv = cast(s3, ex, E0, "sever")
    ok(dmg(s3, sv, E0) === a && U(sv, E0).revive === 0 && U(sv, E0).ward === 0, "Sever strips Ward/Revive", { d: dmg(s3, sv, E0) })
  }
  // 12 Spellblade ------------------------------------------------------------
  {
    const s = board(["hexbreaker"], { hexbreaker: { row: 4, col: 8 }, [E0]: { row: 4, col: 6 }, [E1]: { row: 8, col: 0 } })
    const sb = pid(s, "hexbreaker")
    const a = U(s, sb).attack
    const es = cast(s, sb, E0, "elemental-strike")
    ok(U(es, E0).burn >= 2 && dmg(s, es, E0) === a && U(es, sb).edge === 1, "Elemental Strike (turn 1 = Fire) + Arcane Edge armed", { burn: U(es, E0).burn })
    const edgeHit = E.attackUnit(es, sb, E0)
    ok(dmg(es, edgeHit, E0) === a + 2 && U(edgeHit, sb).edge === 0, "Arcane Edge: next hit +2", { d: dmg(es, edgeHit, E0) })
    const far = board(["hexbreaker"], { hexbreaker: { row: 4, col: 10 }, [E0]: { row: 4, col: 7 }, [E1]: { row: 8, col: 0 } })
    const dash = cast(far, sb, E0, "arcane-dash")
    ok(U(dash, sb).pos.col === 8 && dmg(far, dash, E0) === a + 1 && U(dash, E0).chill === 1, "Arcane Dash blinks, hits +1, chills", { pos: U(dash, sb).pos, d: dmg(far, dash, E0) })
  }
  // 13 Healer ----------------------------------------------------------------
  {
    const s = board(["the-fool", "bulwark-of-ages"], { "the-fool": { row: 4, col: 9 }, "bulwark-of-ages": { row: 4, col: 10, hp: 30 }, [E0]: { row: 0, col: 0 }, [E1]: { row: 8, col: 0 } })
    const h = pid(s, "the-fool")
    const b = pid(s, "bulwark-of-ages")
    const sig = E.castAbility(s, h, b)
    ok(U(sig, b).hp > 30 && U(sig, b).block === 1, "Gentle Hands: a heal also gives +1 Block", { hp: U(sig, b).hp, block: U(sig, b).block })
    const gr = cast(s, h, null, "group-renewal")
    ok(U(gr, b).hp === 33 && U(gr, b).block === 1, "Group Renewal heals adjacent allies 3")
    const lb = cast(s, h, b, "lingering-bloom")
    ok(U(lb, b).hp === 32 && U(lb, b).hot === 2, "Lingering Bloom heals 2 + sets a bloom")
    const next = E.endPlayerTurn(lb)
    ok(U(next, b).hp === 34 && U(next, b).hot === 1, "Lingering Bloom ticks at turn start", { hp: U(next, b).hp })
  }
  // 14 Medic -----------------------------------------------------------------
  {
    const s = board(["mosswalker", "bulwark-of-ages"], { mosswalker: { row: 4, col: 9 }, "bulwark-of-ages": { row: 4, col: 10, hp: 20, poison: 3, root: 2, weak: 1 }, [E0]: { row: 0, col: 0 }, [E1]: { row: 8, col: 0 } })
    const m = pid(s, "mosswalker")
    const b = pid(s, "bulwark-of-ages")
    const cl = cast(s, m, b, "cleanse")
    ok(U(cl, b).poison === 0 && U(cl, b).root === 0 && U(cl, b).weak === 0 && U(cl, b).hp === 23, "Cleanse + Triage (+50% heal below half HP)", { hp: U(cl, b).hp })
    const s2 = board(["mosswalker", "bulwark-of-ages"], { mosswalker: { row: 4, col: 9 }, "bulwark-of-ages": { row: 4, col: 7, hp: 1 }, [E0]: { row: 4, col: 6 }, [E1]: { row: 8, col: 0 } })
    const st = cast(s2, m, b, "stabilize")
    const hitSt = enemyHit(st, E0, b)
    ok(U(hitSt, b).hp === 1 && U(enemyHit(s2, E0, b), b).hp === 0, "Stabilize: a killing blow leaves 1 HP")
    const stim = cast(s, m, b, "emergency-stim")
    ok(U(stim, b).ap === 3 && U(stim, b).exhausted === 1, "Emergency Stim +1 AP now")
    const nt = E.endPlayerTurn(stim)
    ok(U(nt, b).ap === U(nt, b).apMax - 1, "Emergency Stim: -1 AP next turn", { ap: U(nt, b).ap })
  }
  // 15 Buffer ----------------------------------------------------------------
  {
    const s = board(["ashenhorn", "the-hierophant"], { ashenhorn: { row: 3, col: 7 }, "the-hierophant": { row: 4, col: 7 }, [E0]: { row: 4, col: 6 }, [E1]: { row: 8, col: 0 } })
    const bf = pid(s, "ashenhorn")
    const ally = pid(s, "the-hierophant")
    const em = cast(s, bf, ally, "empower")
    ok(U(em, ally).empower === 1 && U(em, ally).block === 1, "Empower + Uplift (+1 Block)")
    ok(dmg(em, E.attackUnit(em, ally, E0), E0) === dmg(s, E.attackUnit(s, ally, E0), E0) + 3, "Empowered ally +3 damage")
    const co = cast(s, bf, E0, "coordinated-strike")
    const expect = Math.ceil(U(s, ally).attack / 2)
    ok(dmg(s, co, E0) === expect, "Coordinated Strike: each adjacent ally hits for half", { d: dmg(s, co, E0), expect })
  }
  // 16 Commander -------------------------------------------------------------
  {
    const s = board(["the-hierophant"], { "the-hierophant": { row: 4, col: 7 }, [C]: { row: 4, col: 9, classCds: { "hold-formation": 3 } }, [E0]: { row: 4, col: 6, hp: 1 }, [E1]: { row: 8, col: 0 } })
    const ally = pid(s, "the-hierophant")
    const kill = E.attackUnit(s, ally, E0)
    ok(U(kill, C).classCds["hold-formation"] === 2, "Chain of Command: a kill cuts cooldowns", U(kill, C).classCds)
    const to = cast(s, C, ally, "tactical-order")
    ok(U(to, ally).ap === 3, "Tactical Order +1 AP")
    const ft = cast(s, C, E0, "focus-target")
    ok(U(ft, E0).mark === 1 && U(ft, E0).markBonus === 2, "Focus Target marks")
    const hf = cast(s, C, null, "hold-formation")
    ok(U(hf, C).classCds["hold-formation"] === 3, "Hold Formation on cooldown -> not castable")
    const s2 = board(["the-hierophant"], { "the-hierophant": { row: 4, col: 7 }, [C]: { row: 4, col: 9 }, [E0]: { row: 0, col: 0 }, [E1]: { row: 8, col: 0 } })
    const hf2 = cast(s2, C, null, "hold-formation")
    ok(U(hf2, ally).block === 2 && U(hf2, C).block === 2, "Hold Formation +2 Block to all")
  }
  // 17 Tactician -------------------------------------------------------------
  {
    const s = board(["motley", "the-hierophant"], { motley: { row: 4, col: 7 }, "the-hierophant": { row: 6, col: 9 }, [E0]: { row: 4, col: 8 }, [E1]: { row: 8, col: 0 } })
    const t = pid(s, "motley")
    const ally = pid(s, "the-hierophant")
    const back = enemyHit(s, E0, t)
    const backCtl = enemyHit(strip(s, t), E0, t)
    ok(!back.log.join(" ").includes("from behind") && backCtl.log.join(" ").includes("from behind"), "Foresight: never hit from behind")
    const rw = cast(s, t, E0, "reveal-weakness")
    ok(U(rw, E0).exposed === 2, "Reveal Weakness applies")
    const ctl = dmg(s, E.attackUnit(s, t, E0), E0)
    ok(dmg(rw, E.attackUnit({ ...rw, units: rw.units.map((u) => (u.id === t ? { ...u, ap: 2 } : u)) }, t, E0), E0) === Math.floor(ctl * 1.25), "Exposed: +25% damage taken")
    const fs = cast(s, t, ally, "formation-shift")
    ok(U(fs, t).pos.row === 6 && U(fs, ally).pos.row === 4, "Formation Shift swaps places")
  }
  // 18 Controller ------------------------------------------------------------
  {
    const s = board(["the-magician"], { "the-magician": { row: 4, col: 7 }, [E0]: { row: 4, col: 6 }, [E1]: { row: 4, col: 3 } })
    const c = pid(s, "the-magician")
    const a = U(s, c).attack
    const rooted = { ...s, units: s.units.map((u) => (u.id === E0 ? { ...u, root: 2 } : u)) }
    ok(dmg(rooted, E.attackUnit(rooted, c, E0), E0) === dmg(s, E.attackUnit(s, c, E0), E0) + 2, "Lockdown +2 vs a Rooted enemy")
    const si = cast(s, c, E0, "silence")
    ok(dmg(s, si, E0) === Math.ceil(a / 2) && U(si, E0).silenced === 2, "Silence applies")
    const sp = board(["the-magician"], { "the-magician": { row: 4, col: 7 }, [E0]: { row: 2, col: 6 }, [E1]: { row: 4, col: 4 } })
    const pl = cast(sp, c, E1, "pull")
    ok(U(pl, E1).pos.col === 6 && U(pl, E1).slow === 2, "Pull drags 2 tiles + slows", U(pl, E1).pos)
  }
  // 19 Frostbinder -----------------------------------------------------------
  {
    const s = board(["frostbind"], { frostbind: { row: 4, col: 7 }, [E0]: { row: 4, col: 6 }, [E1]: { row: 8, col: 0 } })
    const f = pid(s, "frostbind")
    const a = U(s, f).attack
    const chilled = { ...s, units: s.units.map((u) => (u.id === E0 ? { ...u, chill: 1 } : u)) }
    ok(dmg(chilled, E.attackUnit(chilled, f, E0), E0) >= dmg(s, E.attackUnit(s, f, E0), E0) + 2, "Cold Snap +2 vs Chilled")
    const fb = cast(s, f, E0, "frost-bolt")
    ok(dmg(s, fb, E0) === a && U(fb, E0).chill === 1 && U(fb, E0).slow === 2, "Frost Bolt", { d: dmg(s, fb, E0), chill: U(fb, E0).chill })
    const frozen = { ...s, units: s.units.map((u) => (u.id === E0 ? { ...u, frozen: 1 } : u)) }
    ok(dmg(frozen, cast(frozen, f, E0, "shatter"), E0) >= 2 * a, "Shatter x2 vs Frozen")
    const fg = cast(s, f, E0, "frozen-ground")
    ok(fg.terrain["4-6"] === "ice" && fg.terrain["3-5"] === "ice" && U(fg, E0).chill === 1, "Frozen Ground ices the area + chills")
  }

  // --- old castAbility signature + signature id -----------------------------
  {
    const s = board(["hexbreaker"], { hexbreaker: { row: 4, col: 8 }, [E0]: { row: 4, col: 6 }, [E1]: { row: 8, col: 0 } })
    const h = pid(s, "hexbreaker")
    const old = E.castAbility(s, h, E0)
    const byId = E.castAbility(s, h, E0, U(s, h).ability.id)
    ok(dmg(s, old, E0) > 0 && U(old, h).cooldownRemaining === 3 && U(old, h).ap === 0 && JSON.stringify(old.units) === JSON.stringify(byId.units), "castAbility without skillId = signature")
    const both = E.castAbility(E.castAbility(board(["the-fool", "bulwark-of-ages"], { "the-fool": { row: 4, col: 9 }, "bulwark-of-ages": { row: 4, col: 10, hp: 30 }, [E0]: { row: 0, col: 0 }, [E1]: { row: 8, col: 0 } }), "player-the-fool-0", null, "group-renewal"), "player-the-fool-0", "player-bulwark-of-ages-1")
    ok(both.units.find((u) => u.id === "player-the-fool-0").ap === 0, "a class skill and the signature in one turn")
  }

  // --- preview == real with class effects on enemies' targets ---------------
  {
    let s = board(["bulwark-of-ages", "the-lovers", "ashenhorn"], {
      "bulwark-of-ages": { row: 4, col: 6 },
      "the-lovers": { row: 5, col: 6 },
      ashenhorn: { row: 3, col: 7 },
      [C]: { row: 4, col: 8 },
      [E0]: { row: 4, col: 3 },
      [E1]: { row: 6, col: 3 },
      [E2]: { row: 2, col: 3 },
    })
    const g = pid(s, "bulwark-of-ages")
    const d = pid(s, "the-lovers")
    s = cast(s, g, d, "guard")
    s = cast(s, d, E0, "challenge")
    s = cast(s, C, null, "hold-formation")
    const preview = E.previewEnemyIntents(s)
    const again = E.previewEnemyIntents(s)
    const endReal = E.endPlayerTurn(s)
    const rows = preview.map(({ enemyId, intent }) => {
      const now = U(endReal, enemyId)
      let good = true
      if (intent.to) good = now.pos.row === intent.to.row && now.pos.col === intent.to.col
      if (intent.targetId) good = good && U(endReal, intent.targetId).hp < U(s, intent.targetId).hp
      return { enemyId, kind: intent.kind, targetId: intent.targetId, good }
    })
    r.preview = rows
    ok(JSON.stringify(preview) === JSON.stringify(again) && rows.length >= 2 && rows.every((x) => x.good), "preview == real with Guard/Challenge/Hold Formation", rows)
  }

  r.fails = fails
  return r
})
out.engine = engine
for (const f of engine.fails) out.errors.push(f)

// --- UI: skill bar, skill 2 via clicks, class badge on token + card --------
{
  await page.locator(".hwt-squad-select").nth(0).selectOption("bulwark-of-ages")
  await page.waitForTimeout(250)
  const token = page.locator('.hwt-token[data-side="player"]', { hasText: "Bulwark of Ages" }).first()
  const badge = await token.locator(".hwt-token-class").getAttribute("data-class-id").catch(() => null)
  await token.click()
  await page.waitForTimeout(150)
  const bar = page.locator(".hwt-skill-bar")
  const count = await bar.getAttribute("data-count")
  const skills = await page.locator(".hwt-skill-btn").count()
  const cls = await page.locator(".hwt-class-badge").innerText()
  // skill 2 = first class skill (1 = signature): Guard -> click an ally
  await page.locator('.hwt-skill-btn[data-skill-id="shield-wall"]').click()
  await page.waitForTimeout(250)
  const cd = await page.locator('.hwt-skill-btn[data-skill-id="shield-wall"]').innerText()
  const log = (await page.locator(".hwt-log p").allInnerTexts()).join("\n")
  out.ui = { badge, count, skills, cls, cd, logHas: log.includes("Shield Wall") }
  if (!(badge === "guardian" && count === "3" && skills === 2 && cls.includes("Guardian"))) out.errors.push("UI: skill bar / class badge")
  if (!(cd.includes("Recharging") && out.ui.logHas)) out.errors.push("UI: Shield Wall via the skill bar")
  // targeted skill: Guard on an adjacent ally via clicks (key 2)
  const tokenBox = await token.boundingBox()
  void tokenBox
  await token.click()
  await page.waitForTimeout(100)
  const guardBtn = page.locator('.hwt-skill-btn[data-skill-id="guard"]')
  const guardEnabled = await guardBtn.isEnabled()
  out.ui.guardEnabled = guardEnabled
  if (guardEnabled) {
    await page.keyboard.press("2")
    await page.waitForTimeout(150)
    const hint = await page.locator(".hwt-skill-hint").innerText().catch(() => "")
    out.ui.guardHint = hint
    if (!hint.includes("Choose an ally for Guard")) out.errors.push("UI: key 2 arms Guard")
  }
  await page.screenshot({ path: ".scratch/shots/classes_a_board.png" })
}
// Picker stat line shows the class.
{
  const stat = await page.locator(".hwt-squad-slot-stats").first().innerText()
  out.ui.pickerStat = stat
  if (!stat.includes("Guardian")) out.errors.push("UI: picker stat line shows the class")
}
// Unit card (shop / Squad Draft): class chip + skill-list tooltip.
{
  await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(600)
  await page.evaluate(async () => {
    const mod = await import("/src/services/heartwood/runEngine.js")
    let rs = mod.startRun("tommy")
    rs = { ...rs, essence: 999, shopOffers: ["the-fool", "duskclaw", "frostbind"] }
    window.localStorage.setItem("heartwood-run-save-v1", JSON.stringify(mod.serializeRun(rs)))
  })
  await page.reload()
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(600)
    if (await page.locator(".hw-card").count()) break
    const skip = page.getByText(/^skip$/i)
    if (await skip.count()) await skip.first().click().catch(() => {})
  }
  await page.waitForTimeout(400)
  const chips = await page.evaluate(() =>
    [...document.querySelectorAll(".hw-card")].map((c) => ({
      name: c.querySelector(".hw-card-name")?.textContent?.trim(),
      cls: c.querySelector(".hw-card-tclass")?.getAttribute("data-class-id") || null,
      tip: c.querySelector(".hw-card-tclass")?.getAttribute("title") || "",
    })),
  )
  out.ui.cards = chips.map((c) => `${c.name}:${c.cls}`)
  const dusk = chips.find((c) => c.cls === "assassin")
  const unitCards = chips.filter((c) => ["Mosskit", "Duskclaw", "Frostbind"].includes(c.name))
  if (unitCards.length !== 3 || !unitCards.every((c) => c.cls) || !dusk || !dusk.tip.includes("Shadow Step") || !dusk.tip.includes("Backstab") || !dusk.tip.includes("signature")) {
    out.errors.push("UI: unit cards show the class chip with a skill tooltip")
  }
  await page.screenshot({ path: ".scratch/shots/classes_a_cards.png" })
}

console.log(JSON.stringify(out, null, 2))
console.log("\npageErrors:", errs.length, errs.slice(0, 8))
await browser.close()
const pass = out.errors.length === 0 && errs.length === 0
console.log(pass ? "\n✅ verify_classes_a PASS" : "\n❌ verify_classes_a FAIL")
process.exit(pass ? 0 : 1)
