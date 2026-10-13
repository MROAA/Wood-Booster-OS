// Difficulty sprint 2 (Marc: "fights are too easy", "enemies feel alike",
// "a ~20-hour campaign"): the DifficultyEngine curve (one table, gradual
// across all 7 Acts), threat tiers scaling HP / damage / count / skills,
// escorts that complete a frontline + backline + support, Mana Wells,
// the smarter AI per intelligence tier (focus fire, retreat, cover, flank
// tanks, protect casters, spread vs AoE, ambush), behaviour PROFILES
// (Berserker, Assassin, Guardian, Caster, Swarmer, Summoner, Marksman),
// enemy mana ULTIMATES (windup -> warning -> release; broken by burn,
// stun, stagger, kill; dodged by stepping out), the QA hook neutralising
// all of it, preview == real, and the UI (threat panel, behaviour badges,
// ultimate bars + ⚠ tiles, formation-screen threat, real run fight).
import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"

const PORT = process.env.PORT || 5451
const SHOT_DIR = process.env.SHOT_DIR || new URL("./shots", import.meta.url).pathname
await mkdir(SHOT_DIR, { recursive: true })
const browser = await chromium.launch()
const errs = []
const out = { errors: [] }
const newPage = async () => {
  const p = await (await browser.newContext({ viewport: { width: 1400, height: 950 } })).newPage()
  p.on("pageerror", (e) => errs.push(String(e)))
  p.on("console", (m) => m.type() === "error" && !/ERR_CONNECTION_REFUSED|Failed to load resource/.test(m.text()) && errs.push(m.text()))
  return p
}
const page = await newPage()
await page.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
await page.waitForSelector(".hwt-board", { timeout: 30000 })

const engine = await page.evaluate(async () => {
  const E = await import("/src/services/heartwood/tacticsEngine.js")
  const D = await import("/src/services/heartwood/tacticsDifficulty.js")
  const S = await import("/src/services/heartwood/tacticsSmartAi.js")
  const X = await import("/src/services/heartwood/tacticsUltimates.js")
  const M = await import("/src/services/heartwood/tacticsMana.js")
  const RM = await import("/src/services/heartwood/tacticsRealMatchup.js")
  const R = await import("/src/services/heartwood/runEngine.js")
  const RO = await import("/src/services/heartwood/tacticsRoles.js")
  const r = {}
  const fails = []
  const ok = (cond, msg, data) => {
    if (!cond) fails.push(data === undefined ? msg : `${msg} ${JSON.stringify(data)}`)
  }
  const E0 = "enemy-ironmaw-0"
  const E1 = "enemy-sapling-attendant-1"
  const E2 = "enemy-hoardling-2"
  const CMD = "player-commander"
  const U = (s, id) => s.units.find((u) => u.id === id)
  const pid = (s, defId) => s.units.find((u) => u.defId === defId && u.side === "player").id
  const cheb = (a, b) => Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col))
  // Synthetic board (verify_mana_1's helper) + an optional AI tier.
  function board(squad, place, { tier = null, terrain = {}, mana = false } = {}) {
    let s = E.createTacticsBattle("default", squad)
    const withDefaults = { [CMD]: { row: 8, col: 11 }, ...place }
    s = {
      ...s,
      terrain,
      wallHp: {},
      units: s.units.map((u) => {
        const k = withDefaults[u.id] || withDefaults[u.defId]
        if (!k) return { ...u, hp: 0 }
        const { row, col, ...patch } = k
        const base = u.side === "enemy" ? { hp: 40, maxHp: 40, ward: 0, revive: 0, regen: 0, taunt: 0, enemySkills: [] } : {}
        return { ...u, block: 0, ...base, ...patch, pos: { row, col } }
      }),
    }
    if (mana) s = M.enableMana(s)
    if (tier != null) s = { ...s, difficulty: { tier, ai: tier, id: `T${tier}`, name: "test" } }
    return s
  }
  const intentOf = (s, id) => E.previewEnemyIntents(s).find((i) => i.enemyId === id)?.intent

  // 1 The curve: ONE table, gradual + continuous over the 7 Acts --------------------------
  {
    const C = D.DIFFICULTY_CURVE
    ok(C && C.tiers === D.THREAT_TIERS && C.tiers.length === 6 && C.actScore && C.kindBonus, "one tuning table (DIFFICULTY_CURVE)")
    const pts = []
    for (let a = 1; a <= 7; a++) for (const d of [0, 0.25, 0.5, 0.75, 1]) pts.push({ a, d, s: D.difficultyScore({ act: a, depth: d }) })
    ok(pts.every((p, i) => i === 0 || p.s >= pts[i - 1].s), "score never drops across the campaign", pts.map((p) => p.s))
    const cont = [1, 2, 3, 4, 5, 6].every((a) => D.difficultyScore({ act: a, depth: 1 }) === D.difficultyScore({ act: a + 1, depth: 0 }))
    ok(cont, "no cliff between Acts (end of Act N == start of Act N+1)")
    const steps = pts.slice(1).map((p, i) => p.s - pts[i].s)
    ok(Math.max(...steps) <= 5, "the ramp is gradual (no step bigger than 5)", steps)
    ok(D.tierForScore(D.difficultyScore({ act: 1, depth: 0 })).tier === 0 && D.tierForScore(D.difficultyScore({ act: 7, depth: 1 })).tier === 5, "Act I opens at T0, the last Act ends at T5")
    ok(D.tierForScore(D.difficultyScore({ act: 1, depth: 1 })).tier <= 1, "Act I normal fights stay gentle (<= T1)")
    const T = C.tiers
    ok(T.every((t, i) => i === 0 || (t.hp >= T[i - 1].hp && t.atk >= T[i - 1].atk && t.ai >= T[i - 1].ai && t.min > T[i - 1].min)), "every tier is at least as hard as the one before")
    ok(D.difficultyScore({ act: 3, kind: "elite", depth: 0.5 }) > D.difficultyScore({ act: 3, depth: 0.5 }) && D.difficultyScore({ act: 3, kind: "boss" }) > D.difficultyScore({ act: 3, kind: "elite" }), "elites and bosses score higher")
    // Every real run node: tiers rise through the campaign (normal fights).
    const rs = R.startRun("tommy", null, { forcedSeed: 424243 })
    const tiers = []
    R.RUN_PATH.forEach((n, i) => {
      if (n.type !== "battle") return
      tiers.push(RM.difficultyForRunNode({ ...rs, path: R.RUN_PATH, nodeIndex: i }, i).tier)
    })
    r.runTiers = tiers.join("")
    ok(tiers.every((t, i) => i === 0 || t >= tiers[i - 1]) && tiers[0] === 0 && tiers[tiers.length - 1] >= 4, "real run: normal-fight tiers climb T0 -> T4+ and never drop", r.runTiers)
    ok(new Set(tiers).size >= 5, "real run: at least 5 distinct tiers over the campaign", r.runTiers)
  }

  // 2 Scaling: T0 changes nothing, T4 scales HP / damage / count / skills -------------------
  {
    const base = E.createRealMatchupBattle(["bulwark-of-ages", "the-fool"], ["ironmaw", "mossmender"], "tommy")
    const t0 = D.applyDifficulty(base, D.difficultySpec({ tier: 0, act: 1, seedKey: "a" }))
    const same = base.units.every((u) => { const v = U(t0, u.id); return v.hp === u.hp && v.attack === u.attack && v.maxHp === u.maxHp })
    ok(same && t0.units.length === base.units.length && !Object.values(t0.terrain || {}).includes("manawell") && !t0.units.some((u) => u.ult), "T0: same stats, no escorts, no wells, no ultimates")
    ok(t0.difficulty?.tier === 0, "T0 recorded on the battle")
    const spec = D.difficultySpec({ tier: 4, act: 4, seedKey: "a" })
    const t4 = D.applyDifficulty(base, spec)
    const iron0 = base.units.find((u) => u.defId === "ironmaw")
    const iron4 = U(t4, iron0.id)
    r.t4 = { hp: [iron0.maxHp, iron4.maxHp], atk: [iron0.attack, iron4.attack] }
    ok(iron4.maxHp === Math.round(iron0.maxHp * 1.25) && iron4.attack === iron0.attack + 2, "T4: enemy HP x1.25, attack +2", r.t4)
    const esc = t4.units.filter((u) => u.escort)
    r.escorts = esc.map((u) => `${u.defId}:${u.escort}:${RO.roleOf(u)}`)
    ok(esc.length === 2 && new Set(t4.units.map((u) => u.id)).size === t4.units.length, "T4 normal fight: +2 enemies, unique ids", r.escorts)
    ok(esc.every((u) => u.pos.col <= 2 && u.hp === u.maxHp), "escorts stand in the enemy's columns at full HP")
    // Composition: base = tank (ironmaw) + healer (mossmender) -> the missing line is backline.
    const lines = new Set(t4.units.filter((u) => u.side === "enemy").map((u) => D.lineOf(u)))
    ok(lines.has("frontline") && lines.has("backline") && lines.has("support"), "escorts complete frontline + backline + support", [...lines])
    const mend0 = (base.units.find((u) => u.defId === "mossmender").enemySkills || []).length
    const mm = t4.units.find((u) => u.defId === "mossmender")
    const sk = mm.enemySkills.find((k) => k.kind === "mend")
    ok(sk && sk.cooldown === 1 && sk.amount > 0, "T4 skills: cooldown -1, stronger", { sk, mend0 })
    const wells = Object.entries(t4.terrain).filter(([, t]) => t === "manawell").map(([k]) => k)
    ok(wells.length === 2 && wells.every((k) => [5, 6].includes(Number(k.split("-")[1]))), "T4: 2 Mana Wells in the middle columns", wells)
    ok(t4.units.filter((u) => u.side === "enemy").every((u) => S.BEHAVIORS[u.behavior]), "every enemy has a behaviour profile")
    ok(t4.units.some((u) => u.ult), "T4: a caster carries an ultimate")
    // Deterministic per seed key.
    const again = D.applyDifficulty(base, spec)
    ok(JSON.stringify(again) === JSON.stringify(t4), "same seed key -> the same fight")
    // Never more than MAX_ENEMIES.
    const big = D.applyDifficulty(E.createRealMatchupBattle(["bulwark-of-ages"], ["ironmaw", "ironmaw", "ironmaw", "ironmaw", "ironmaw"], "tommy"), D.difficultySpec({ tier: 5, act: 5, seedKey: "b" }))
    ok(big.units.filter((u) => u.side === "enemy").length === D.MAX_ENEMIES, "escorts capped at 6 enemies")
    // Elite fight: the leader gets the ultimate; bosses get no escorts.
    const elite = D.applyDifficulty(E.createRealMatchupBattle(["bulwark-of-ages"], ["deepwarden"], "tommy"), D.difficultySpec({ tier: 3, act: 3, kind: "elite", seedKey: "c" }))
    ok(elite.units.find((u) => u.defId === "deepwarden").ult && elite.units.filter((u) => u.escort).length === 1, "elite T3: leader ultimate + 1 escort")
    const boss = D.applyDifficulty(E.createRealMatchupBattle(["bulwark-of-ages"], ["deepwarden"], "tommy"), D.difficultySpec({ tier: 3, act: 3, kind: "boss", seedKey: "c" }))
    ok(!boss.units.some((u) => u.escort) && boss.units.find((u) => u.defId === "deepwarden").ult?.boss, "boss: no escorts, a boss ultimate")
    // Mana: escorts get a bar once mana is enabled after the difficulty.
    const withMana = M.enableMana(t4)
    ok(withMana.units.filter((u) => u.escort).every((u) => typeof u.mana === "number" && u.manaMax > 0), "escorts get a resource bar")
  }

  // 3 Behaviour profiles: picked from the kit, distinct play -------------------------------
  {
    const s = board(["bulwark-of-ages", "the-fool"], {}, { tier: 0 })
    const fake = (patch) => ({ id: "x", side: "enemy", hp: 30, maxHp: 30, range: 1, attack: 5, pos: { row: 0, col: 0 }, ...patch })
    r.picks = {
      summoner: S.behaviorOf(fake({ enemySkills: [{ kind: "summon", id: "summon" }] })),
      caster: S.behaviorOf(fake({ range: 3, enemySkills: [{ kind: "hex", id: "hex" }] })),
      marksman: S.behaviorOf(fake({ range: 3 })),
      berserker: S.behaviorOf(fake({ enemySkills: [{ kind: "enrage", id: "enrage" }] })),
      assassin: S.behaviorOf(fake({ enemySkills: [{ kind: "pounce", id: "pounce" }] })),
      guardian: S.behaviorOf(fake({ taunt: 1 })),
      swarmer: S.behaviorOf(fake({ maxHp: 18, hp: 18 })),
    }
    ok(Object.entries(r.picks).every(([k, v]) => k === v), "kit -> profile", r.picks)
    ok(Object.values(S.BEHAVIORS).every((b) => b.icon && b.name && b.text.length > 10) && S.BEHAVIOR_IDS.length === 7, "7 profiles, each with icon + text")
    ok(S.behaviorsOn(s), "profiles live in a difficulty fight")
    ok(!S.behaviorsOn(board(["bulwark-of-ages"], {})), "no difficulty -> no profiles (old states unchanged)")
  }
  // Berserker vs Assassin: same board, different target. Tank right next to
  // the enemy, a wounded healer 3 tiles away (still in reach).
  {
    const place = (beh) => ({
      "bulwark-of-ages": { row: 4, col: 5 },
      "the-fool": { row: 1, col: 6, hp: 12 },
      [E0]: { row: 4, col: 4, attack: 6, move: 3, behavior: beh },
    })
    const ber = intentOf(board(["bulwark-of-ages", "the-fool"], place("berserker"), { tier: 1 }), E0)
    const asn = intentOf(board(["bulwark-of-ages", "the-fool"], place("assassin"), { tier: 1 }), E0)
    r.berVsAsn = { ber, asn }
    ok(ber?.targetId === "player-bulwark-of-ages-0" && asn?.targetId === "player-the-fool-1", "Berserker hits the nearest hero, Assassin dives the wounded healer", r.berVsAsn)
  }
  // Guardian / Caster / Summoner / Marksman / Swarmer: where they stand + who they hit.
  {
    const s = board(["bulwark-of-ages", "the-hermit"], {
      "bulwark-of-ages": { row: 4, col: 8 },
      "the-hermit": { row: 2, col: 9 },
      [E0]: { row: 4, col: 3, behavior: "guardian" },
      [E1]: { row: 4, col: 1, range: 3, behavior: "caster" },
      [E2]: { row: 6, col: 2, behavior: "summoner" },
    }, { tier: 1, terrain: { "1-3": "high" } })
    const g = U(s, E0)
    const nearCaster = S.tileBonus(s, g, { row: 4, col: 2 })
    const farFromCaster = S.tileBonus(s, g, { row: 8, col: 4 })
    const c = U(s, E1)
    const casterClose = S.tileBonus(s, c, { row: 4, col: 7 })
    const casterFar = S.tileBonus(s, c, { row: 4, col: 1 })
    const sm = U(s, E2)
    const hidden = S.tileBonus(s, sm, { row: 4, col: 0 })
    const exposed = S.tileBonus(s, sm, { row: 4, col: 7 })
    const mk = { ...c, behavior: "marksman" }
    const high = S.tileBonus(s, mk, { row: 1, col: 3 })
    const low = S.tileBonus(s, mk, { row: 0, col: 4 })
    r.tiles = { nearCaster, farFromCaster, casterClose, casterFar, hidden, exposed, high, low }
    ok(nearCaster > farFromCaster, "Guardian likes body-blocking for its caster", r.tiles)
    ok(casterFar > casterClose, "Caster keeps its distance", r.tiles)
    ok(hidden > exposed, "Summoner hides behind the others", r.tiles)
    ok(high > low, "Marksman seeks high ground", r.tiles)
    // Swarmer: a hero already surrounded is worth more.
    const sw = board(["bulwark-of-ages", "the-fool"], {
      "bulwark-of-ages": { row: 4, col: 6 },
      "the-fool": { row: 1, col: 6 },
      [E0]: { row: 4, col: 5, behavior: "swarmer" },
      [E1]: { row: 3, col: 6, behavior: "swarmer" },
      [E2]: { row: 5, col: 6, behavior: "swarmer" },
    }, { tier: 1 })
    const surrounded = S.attackBonus(sw, U(sw, E0), U(sw, "player-bulwark-of-ages-0"))
    const alone = S.attackBonus(sw, U(sw, E0), U(sw, "player-the-fool-1"))
    ok(surrounded > alone + 15, "Swarmer piles onto the surrounded hero", { surrounded, alone })
    // Guardian punishes whoever threatens its caster.
    const gp = board(["bulwark-of-ages", "the-fool"], {
      "bulwark-of-ages": { row: 4, col: 5 },
      "the-fool": { row: 6, col: 5 },
      [E0]: { row: 5, col: 4, behavior: "guardian" },
      [E1]: { row: 3, col: 4, range: 3, behavior: "caster" },
    }, { tier: 1 })
    ok(S.attackBonus(gp, U(gp, E0), U(gp, "player-bulwark-of-ages-0")) > S.attackBonus(gp, U(gp, E0), U(gp, "player-the-fool-1")), "Guardian strikes the hero next to its caster")
  }

  // 4 Intelligence tiers ------------------------------------------------------------------------
  {
    // Focus fire (T1+): the wounded hero is worth more.
    const s1 = board(["bulwark-of-ages", "the-fool"], { "bulwark-of-ages": { row: 4, col: 6 }, "the-fool": { row: 5, col: 6, hp: 6 }, [E0]: { row: 4, col: 5, behavior: "guardian" } }, { tier: 1 })
    const s0 = { ...s1, difficulty: { ...s1.difficulty, ai: 0 } }
    const wounded = U(s1, "player-the-fool-1")
    ok(S.attackBonus(s1, U(s1, E0), wounded) > 10 && S.attackBonus(s0, U(s0, E0), wounded) === 0, "T1 focus fire: wounded heroes score higher (T0: no bonus)")
    // Flank tanks (T3+).
    const s3 = { ...s1, difficulty: { ...s1.difficulty, ai: 3 } }
    const tank = U(s3, "player-bulwark-of-ages-0")
    ok(RO.roleOf(tank) === "tank" && S.attackBonus(s3, U(s3, E0), { ...tank, hp: tank.maxHp }) < 0, "T3: hitting a healthy tank is avoided")
    ok(S.focusBonus(s3, U(s3, E0), { ...tank, hp: tank.maxHp }) < 0, "T3: walks around tanks toward softer heroes")
    // Spread vs AoE (T3+): neighbours cost when the squad has area attacks.
    const aoe = { ...s3, units: s3.units.map((u) => (u.id === "player-the-fool-1" ? { ...u, classSkills: [{ id: "storm", radius: 1 }] } : u)) }
    const e = U(aoe, E0)
    const withAlly = (st) => ({ ...st, units: st.units.map((u) => (u.id === E1 ? { ...u, hp: 40, pos: { row: 0, col: 1 }, range: 1 } : u)) })
    const clumpedAoe = S.tileBonus(withAlly(aoe), e, { row: 1, col: 1 })
    const plain = { ...s3, units: s3.units.map((u) => (u.side === "player" ? { ...u, classSkills: [], ability: null } : u)) }
    const clumpedNoAoe = S.tileBonus(withAlly(plain), e, { row: 1, col: 1 })
    ok(S.squadHasAoe(aoe) && !S.squadHasAoe(plain) && clumpedAoe < clumpedNoAoe, "T3: enemies spread out against area attacks", { clumpedAoe, clumpedNoAoe })
    // Cover from shooters (T2+): a wall between it and your archer.
    const cv = board(["the-hermit"], { "the-hermit": { row: 4, col: 8 }, [E0]: { row: 6, col: 2, behavior: "guardian" } }, { tier: 2, terrain: { "4-4": "wall" } })
    const covered = S.tileBonus(cv, U(cv, E0), { row: 4, col: 3 })
    const open = S.tileBonus(cv, U(cv, E0), { row: 2, col: 3 })
    ok(covered > open, "T2: takes cover from your shooters", { covered, open })
    // Retreat (T2+): a badly hurt enemy falls back instead of trading blows.
    // Two tiles off (not in the hero's zone, so it CAN walk away).
    const placeR = (beh) => ({ "bulwark-of-ages": { row: 4, col: 6 }, [E0]: { row: 4, col: 4, hp: 6, maxHp: 40, attack: 4, behavior: beh } })
    const t0 = intentOf(board(["bulwark-of-ages"], placeR("guardian"), { tier: 0 }), E0)
    const t2 = intentOf(board(["bulwark-of-ages"], placeR("guardian"), { tier: 2 }), E0)
    const ber = intentOf(board(["bulwark-of-ages"], placeR("berserker"), { tier: 2 }), E0)
    r.retreat = { t0, t2, ber }
    ok(t0?.kind === "move-attack" && t2?.kind === "move" && t2.to.col < 4 && ber?.kind === "move-attack", "T2: hurt enemies retreat (a Berserker never does)", r.retreat)
    const rb = board(["bulwark-of-ages"], placeR("guardian"), { tier: 2 })
    ok(S.isRetreating(rb, U(rb, E0)) && !S.isRetreating(rb, { ...U(rb, E0), hp: 20 }) && !S.isRetreating({ ...rb, difficulty: { ...rb.difficulty, ai: 1 } }, U(rb, E0)), "isRetreating: below 35% HP, from T2")
    // Protect casters (T3+): a melee enemy values standing next to its threatened caster.
    const pc = board(["the-hermit"], { "the-hermit": { row: 4, col: 6 }, [E0]: { row: 6, col: 2 }, [E1]: { row: 4, col: 2, range: 3 } }, { tier: 3 })
    const pcE = { ...U(pc, E0), behavior: "assassin" }
    const pcNo = { ...pc, difficulty: { ...pc.difficulty, ai: 2 } }
    ok(S.tileBonus(pc, pcE, { row: 4, col: 3 }) - S.tileBonus(pc, pcE, { row: 8, col: 3 }) > S.tileBonus(pcNo, pcE, { row: 4, col: 3 }) - S.tileBonus(pcNo, pcE, { row: 8, col: 3 }), "T3: melee enemies guard their casters")
    // Ambush (T4+): a melee enemy out of reach holds still on watch.
    const amb = (tier) => board(["bulwark-of-ages", "the-fool", "swiftclaw"], {
      "bulwark-of-ages": { row: 4, col: 5 },
      "the-fool": { row: 3, col: 5 },
      swiftclaw: { row: 5, col: 5 },
      [E0]: { row: 4, col: 1, move: 2, behavior: "guardian" },
    }, { tier })
    const a4 = intentOf(amb(4), E0)
    const a3 = intentOf(amb(3), E0)
    r.ambush = { a4, a3 }
    ok(a4?.kind === "overwatch" && a4.ambush && a3?.kind === "move", "T4: lies in ambush instead of walking into reach (T3 walks)", r.ambush)
    const after = E.endPlayerTurn(amb(4))
    ok(U(after, E0).overwatch > 0 && U(after, E0).ambushTurn === 1, "ambush = real Overwatch on the board")
    const again = intentOf({ ...after, units: after.units }, E0)
    ok(!(again?.kind === "overwatch" && again.ambush), "no ambush two turns in a row", again)
  }

  // 5 Enemy ULTIMATES ---------------------------------------------------------------------------
  const ultBoard = (patchE = {}, extra = {}) => {
    let s = board(["bulwark-of-ages", "the-fool", "the-magician"], {
      "bulwark-of-ages": { row: 4, col: 9 },
      "the-fool": { row: 4, col: 8 },
      "the-magician": { row: 1, col: 9 },
      [E0]: { row: 4, col: 3, attack: 6, move: 2, ...patchE },
      ...extra,
    }, { tier: 4, mana: true })
    const spec = D.difficultySpec({ tier: 4, act: 4 })
    s = { ...s, units: s.units.map((u) => (u.id === E0 ? { ...u, ult: { id: "cataclysm", name: "Cataclysm", icon: "☄", shape: "blast", radius: 1, range: 6, burn: 0, amount: 10, gain: spec.ultGain }, ultCharge: 100, ultArmed: null, behavior: "guardian" } : u)) }
    return s
  }
  {
    const s = ultBoard()
    const pv = intentOf(s, E0)
    ok(pv?.kind === "ultimate" && pv.phase === "windup" && pv.tiles.length === 9 && pv.then, "full bar -> preview shows the windup + its tiles + the follow-up action", pv)
    const w = E.endPlayerTurn(s)
    const armed = U(w, E0).ultArmed
    ok(armed && armed.tiles.some((t) => t.row === 4 && t.col === 8), "after the enemy turn it is channeling at the heroes' cluster", armed)
    ok(w.log.some((l) => /fires NEXT turn/.test(l)), "log warns one turn ahead")
    const rel = intentOf(w, E0)
    ok(rel?.kind === "ultimate" && rel.phase === "release" && JSON.stringify(rel.tiles) === JSON.stringify(armed.tiles), "the next turn's preview: RELEASE on the exact same tiles", rel)
    const hpBefore = U(w, "player-the-fool-1").hp
    const fired = E.endPlayerTurn(w)
    ok(U(fired, "player-the-fool-1").hp < hpBefore && U(fired, E0).ultCharge === 0 && !U(fired, E0).ultArmed, "release: heroes in the tiles are hit, bar empties", [hpBefore, U(fired, "player-the-fool-1").hp])
    ok((fired.events || []).some((e) => e.kind === "combo" && e.combo === "ultimate"), "release = big ultimate callout + tile flash")
    // The bar does NOT fill while channeling.
    const tick = E.endPlayerTurn({ ...w, units: w.units.map((u) => (u.id === E0 ? { ...u, ultCharge: 100 } : u)) })
    ok(U(tick, E0).ultCharge === 0, "fired from a full channel")
    // Step out: the hero walks out of the marked tiles -> nothing hit.
    const moved = { ...w, units: w.units.map((u) => (u.side === "player" && u.hp > 0 && armed.tiles.some((t) => t.row === u.pos.row && t.col === u.pos.col) ? { ...u, pos: { row: 8, col: u.id === "player-the-fool-1" ? 6 : 7 } } : u)) }
    const dodged = E.endPlayerTurn(moved)
    ok(dodged.log.some((l) => /hits nothing/.test(l)), "stepping out of the tiles dodges it")
    // BREAK 1: burn any mana (the Controller's Silence).
    const mag = "player-the-magician-2"
    const ready = { ...w, units: w.units.map((u) => (u.id === mag ? { ...u, pos: { row: 4, col: 5 }, mana: u.manaMax, ap: 2 } : u.id === E0 ? { ...u, pos: { row: 4, col: 4 } } : u)) }
    const silenced = E.castAbility(ready, mag, E0, "silence")
    r.silence = { changed: silenced !== ready, armed: !!U(silenced, E0).ultArmed, charge: U(silenced, E0).ultCharge }
    ok(silenced !== ready && !U(silenced, E0).ultArmed && U(silenced, E0).ultCharge <= X.ULT_BROKEN_LEFT, "a mana burn skill breaks a channeled ultimate", r.silence)
    ok((silenced.events || []).some((e) => e.combo === "ult-break"), "'Ultimate broken!' callout")
    ok(intentOf(silenced, E0)?.kind !== "ultimate", "broken -> no ultimate in the preview")
    // A burn on a NON-channeling enemy eats the bar.
    const charging = { ...s, units: s.units.map((u) => (u.id === E0 ? { ...u, ultCharge: 60 } : u)) }
    ok(U(M.burnMana(charging, E0, 10).next, E0).ultCharge === 60 - 10 * X.ULT_BURN_MULT, "burn on a charging enemy drains the ultimate bar")
    // BREAK 2: a stun -> skips the turn and the channel breaks (preview says so).
    const stunned = { ...w, units: w.units.map((u) => (u.id === E0 ? { ...u, stun: 1 } : u)) }
    const sPv = intentOf(stunned, E0)
    const sAfter = E.endPlayerTurn(stunned)
    ok(sPv?.kind === "stunned" && sPv.breaksUlt && !U(sAfter, E0).ultArmed && !sAfter.log.some((l) => /unleashes Cataclysm/.test(l)), "a stun breaks it (preview: stunned + breaks)", sPv)
    // BREAK 3: one big hit (20%+ max HP) staggers it.
    const big = { ...w, units: w.units.map((u) => (u.id === "player-bulwark-of-ages-0" ? { ...u, pos: { row: 4, col: 5 }, attack: 20, ap: 2 } : u.id === E0 ? { ...u, pos: { row: 4, col: 4 }, hp: 60, maxHp: 60 } : u)) }
    const hit = E.attackUnit(big, "player-bulwark-of-ages-0", E0)
    ok(!U(hit, E0).ultArmed && (hit.events || []).some((e) => e.combo === "ult-break" && /Stagger/.test(e.label)), "a big hit staggers it")
    const small = { ...big, units: big.units.map((u) => (u.id === "player-bulwark-of-ages-0" ? { ...u, attack: 3 } : u)) }
    ok(!!U(E.attackUnit(small, "player-bulwark-of-ages-0", E0), E0).ultArmed, "a small hit does not")
    // Fizzle: a channel below full when it would fire (defensive path).
    const low = { ...w, units: w.units.map((u) => (u.id === E0 ? { ...u, ultCharge: 70 } : u)) }
    const fz = intentOf(low, E0)
    const fzA = E.endPlayerTurn(low)
    ok(fz?.phase === "fizzle" && !U(fzA, E0).ultArmed && fzA.log.some((l) => /collapses/.test(l)), "below full when it fires -> fizzles, loses the turn")
    // No hero in reach -> waits with a full bar (no windup at nobody).
    const far = ultBoard({ pos: { row: 0, col: 0 } }, { [E0]: { row: 0, col: 0 } })
    const farS = { ...far, units: far.units.map((u) => (u.id === E0 ? { ...u, ult: { ...u.ult, range: 2 } } : u)) }
    ok(intentOf(farS, E0)?.kind !== "ultimate", "out of reach: no windup")
    // The bar fills on the enemy turn (+ a Mana Well), and starts at the tier's start value.
    const fill = ultBoard({}, {})
    const f0 = { ...fill, units: fill.units.map((u) => (u.id === E0 ? { ...u, ultCharge: 10, pos: { row: 0, col: 0 } } : u)) }
    const f1 = E.endPlayerTurn(f0)
    const onWell = E.endPlayerTurn({ ...f0, terrain: { ...f0.terrain, "0-0": "manawell" } })
    ok(U(f1, E0).ultCharge === 10 + U(f0, E0).ult.gain, "fills by its gain every enemy turn", U(f1, E0).ultCharge)
    ok(U(onWell, E0).ultCharge === 10 + U(f0, E0).ult.gain + X.WELL_ULT_GAIN, "a Mana Well charges it faster", U(onWell, E0).ultCharge)
    // War Chant + Void Rend.
    const wc = { ...w, units: w.units.map((u) => (u.side === "enemy" && u.hp > 0 ? { ...u, hp: 10 } : u)).map((u) => (u.id === E0 ? { ...u, ult: { ...u.ult, id: "war-chant", shape: "allies", name: "War Chant" } } : u)) }
    const wcA = E.endPlayerTurn(wc)
    ok(U(wcA, E0).hp > 10 && U(wcA, E0).block >= 4, "War Chant heals + braces the enemies")
    const vr = { ...w, units: w.units.map((u) => (u.id === E0 ? { ...u, ult: { ...u.ult, id: "void-rend", burn: 25 } } : u)) }
    const foolMana = U(vr, "player-the-fool-1").mana
    ok(U(E.endPlayerTurn(vr), "player-the-fool-1").mana < foolMana + 20, "Void Rend burns the heroes' mana")
    // Disruptor interrupt also breaks it.
    // QA hook neutralises: no ultimates, AI tier 0, profiles off.
    const qa = E.withLowEnemyHp(w)
    ok(qa.units.filter((u) => u.side === "enemy").every((u) => !u.ult && !u.ultArmed) && qa.difficulty.ai === 0 && !S.behaviorsOn(qa), "withLowEnemyHp: ultimates + smart AI + profiles off")
    ok(intentOf(qa, E0)?.kind !== "ultimate", "QA: no ultimate intent")
  }

  // 6 Preview == real over several turns at T5 (real enemies, ultimates, escorts) ------------
  {
    let s = M.enableMana(D.applyDifficulty(E.createRealMatchupBattle(["bulwark-of-ages", "the-fool", "the-hermit"], ["hex-acolyte", "mossmender", "ironmaw"], "tommy"), D.difficultySpec({ tier: 5, act: 5, seedKey: "pv" })))
    s = { ...s, units: s.units.map((u) => (u.ult ? { ...u, ultCharge: 90 } : u)) }
    const rows = []
    const kinds = new Set()
    for (let turn = 0; turn < 6 && s.phase === "player"; turn++) {
      const pv = E.previewEnemyIntents(s)
      const pv2 = E.previewEnemyIntents(s)
      const after = E.endPlayerTurn(s)
      for (const { enemyId, intent } of pv) {
        const now = U(after, enemyId)
        if (!now) continue
        kinds.add(intent.kind + (intent.phase ? `:${intent.phase}` : ""))
        let good = JSON.stringify(pv) === JSON.stringify(pv2)
        if (intent.kind === "move" || intent.kind === "move-attack") good = good && (now.hp <= 0 || (now.pos.row === intent.to.row && now.pos.col === intent.to.col))
        if (intent.kind === "ultimate" && intent.phase === "windup") good = good && JSON.stringify(now.ultArmed?.tiles || []) === JSON.stringify(intent.armed.tiles)
        if (intent.kind === "ultimate" && intent.phase === "release") good = good && now.ultCharge === 0 && !now.ultArmed
        if (intent.kind === "overwatch") good = good && now.overwatch > 0
        rows.push({ turn, enemyId, kind: intent.kind, phase: intent.phase, good })
      }
      s = after
    }
    r.previewKinds = [...kinds]
    ok(rows.length > 8 && rows.every((x) => x.good), "T5 preview == real over several turns", rows.filter((x) => !x.good))
    ok(kinds.has("ultimate:windup") && kinds.has("ultimate:release"), "ultimates show up in a real T5 fight", r.previewKinds)
  }
  return { r, fails }
})
out.engine = engine.r
for (const f of engine.fails) out.errors.push(f)

// ---- UI --------------------------------------------------------------------------------------
{
  await page.goto(`http://localhost:${PORT}/heartwood-tactics?threat=4&rolls=0`, { waitUntil: "domcontentloaded" })
  await page.waitForSelector(".hwt-threat")
  const head = await page.locator(".hwt-threat-head").innerText()
  const pips = await page.locator(".hwt-threat .hwt-threat-pip[data-on]").count()
  const traits = await page.locator(".hwt-threat-trait").allInnerTexts()
  const scaled = await page.locator(".hwt-threat-scaled").innerText()
  const lines = await page.locator(".hwt-threat-lines").innerText()
  const enemies = await page.locator('.hwt-token[data-side="enemy"]').count()
  const badges = await page.locator('.hwt-token[data-side="enemy"] .hwt-behavior-badge').count()
  const titles = await page.locator(".hwt-behavior-badge").evaluateAll((els) => els.map((e) => e.getAttribute("title")))
  const ultBars = await page.locator(".hwt-ult-track").count()
  const wells = await page.locator('.hwt-cell[data-terrain="manawell"][data-art="manawell"]').count()
  const legend = await page.locator(".hwt-terrain-legend").innerText()
  out.ui = { head, pips, traits: traits.length, scaled, lines, enemies, badges, titles: titles.slice(0, 3), ultBars, wells }
  if (!(/Threat T4/.test(head) && /Elite/.test(head) && pips === 4)) out.errors.push("UI: threat panel T4 + 4 pips")
  if (!(traits.length === 7 && /HP \+25%/.test(scaled) && /\+2 enem/.test(scaled))) out.errors.push("UI: threat panel lists AI behaviours + what scaled")
  if (!/Frontline/.test(lines) || !/Support|Backline/.test(lines)) out.errors.push("UI: formation composition line")
  if (!(enemies === 5 && badges === enemies && titles.every((t) => /^(Berserker|Assassin|Guardian|Caster|Swarmer|Summoner|Marksman): /.test(t)))) out.errors.push("UI: every enemy shows its behaviour icon + tooltip")
  if (!(ultBars >= 1)) out.errors.push("UI: ultimate bar on enemies that have one")
  if (!(wells === 2 && /Mana Well/.test(legend))) out.errors.push("UI: Mana Well tiles with art + legend")
  await page.screenshot({ path: `${SHOT_DIR}/difficulty_threat_panel.png` })
  // No threat param = the old prototype (no panel, no badges).
  await page.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
  await page.waitForSelector(".hwt-board")
  if ((await page.locator(".hwt-threat").count()) || (await page.locator(".hwt-behavior-badge").count())) out.errors.push("UI: no threat panel / badges without a difficulty")
}
{
  // Ultimate warning on the board: T5 starts the bar at 30 (+30 a turn) -
  // end turns (heroes hunker so they survive) until an enemy channels.
  await page.goto(`http://localhost:${PORT}/heartwood-tactics?threat=5&rolls=0&seed=ult`, { waitUntil: "domcontentloaded" })
  await page.waitForSelector(".hwt-board")
  let armed = 0
  for (let i = 0; i < 6 && !armed; i++) {
    await page.locator(".hwt-end-turn").click()
    await page.waitForTimeout(500)
    armed = await page.locator('.hwt-ult-track[data-armed]').count()
  }
  const releaseTiles = await page.locator('.hwt-cell[data-ult-zone="release"]').count()
  const warnIcons = await page.locator('.hwt-ult-warn-icon[data-phase="release"]').count()
  const badge = await page.locator('.hwt-intent-badge[data-intent="ultimate"][data-ult-phase="release"]').count()
  const badgeTitle = badge ? await page.locator('.hwt-intent-badge[data-intent="ultimate"]').first().getAttribute("title") : ""
  out.ui.ult = { armed, releaseTiles, warnIcons, badge, badgeTitle }
  if (!(armed >= 1 && badge >= 1 && /Break it/.test(badgeTitle))) out.errors.push("UI: channeling enemy: glowing bar + ⚠ release intent with how to break it")
  if (!(releaseTiles >= 1 ? warnIcons === releaseTiles : true)) out.errors.push("UI: ⚠ on every release tile")
  await page.screenshot({ path: `${SHOT_DIR}/difficulty_ultimate_warning.png` })
}
{
  // Formation screen + a real run fight late in the campaign show the threat.
  const p = await newPage()
  await p.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
  const seeded = await p.evaluate(async () => {
    const { startRun, serializeRun, RUN_PATH, actIndexForNode } = await import("/src/services/heartwood/runEngine.js")
    const idx = RUN_PATH.findIndex((n, i) => n.type === "battle" && actIndexForNode(i, RUN_PATH.length) === 4)
    const bench = ["the-fool", "bulwark-of-ages"].map((defId, i) => ({ key: `b${i}`, defId, upgradeLevel: 0, upgrades: [] }))
    const rs = { ...startRun("tommy", null, { forcedSeed: 424243 }), nodeIndex: idx, path: RUN_PATH.slice(0, idx + 1), phase: "formation", bench, deployed: ["b0", "b1", null, null], items: [], lastSeenAct: 4 }
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(serializeRun(rs)))
    localStorage.setItem("heartwood-tactics-tutorial-v1", "done")
    return { idx }
  })
  await p.reload({ waitUntil: "domcontentloaded" })
  await p.waitForSelector(".hwt-formation-threat", { timeout: 15000 }).catch(() => {})
  const formThreat = (await p.locator(".hwt-formation-threat").count()) ? await p.locator(".hwt-formation-threat").innerText() : ""
  await p.screenshot({ path: `${SHOT_DIR}/difficulty_formation_threat.png` })
  await p.locator(".hw-tactics-start").click()
  const begin = p.locator(".hwt-begin-battle")
  await begin.waitFor({ timeout: 8000 }).catch(() => {})
  await p.waitForSelector(".hwt-threat", { timeout: 8000 }).catch(() => {})
  const fightThreat = (await p.locator(".hwt-threat-head").count()) ? await p.locator(".hwt-threat-head").innerText() : ""
  const runInfo = await p.evaluate(() => {
    const save = JSON.parse(localStorage.getItem("heartwood-run-save-v1") || "{}")
    const b = save.run?.battle
    return b ? { tier: b.difficulty?.tier, enemies: b.units.filter((u) => u.side === "enemy").length, escorts: b.units.filter((u) => u.escort).length, behaviors: b.units.filter((u) => u.side === "enemy").map((u) => u.behavior) } : null
  })
  out.ui.run = { seeded, formThreat, fightThreat, runInfo }
  if (!/Threat T[2-4]/.test(formThreat)) out.errors.push("UI: formation screen shows the node's threat tier")
  if (!(fightThreat && formThreat.startsWith(fightThreat.split("\n")[0].trim().slice(0, 9)))) out.errors.push("UI: the real fight shows the same threat as the formation screen")
  if (!(runInfo && runInfo.tier >= 2 && runInfo.escorts >= 1 && runInfo.behaviors.every(Boolean))) out.errors.push("real run: a late fight gets escorts + behaviour profiles")
  await p.screenshot({ path: `${SHOT_DIR}/difficulty_real_fight.png` })
  await p.context().close()
}
out.pageErrors = errs
if (errs.length) out.errors.push(`page errors: ${errs.slice(0, 3).join(" | ")}`)
await browser.close()
console.log(JSON.stringify(out, null, 1))
console.log(out.errors.length ? `FAIL (${out.errors.length})` : "PASS")
process.exit(out.errors.length ? 1 : 0)
