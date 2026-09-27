// Class system part B: the 19 new classes (passive + every skill on
// synthetic boards), all 38 classes used, preview == real with summons /
// traps / terrain skills, and the UI (a part-B tile skill via clicks).
// NODE_ONLY=1 runs just the engine checks in node (needs a loader that
// stubs image imports) - the real run is in the browser.

// Standalone (serialized into the page by playwright): no closure vars.
async function engineChecks(base) {
  const E = await import(base + "/src/services/heartwood/tacticsEngine.js")
  const C = await import(base + "/src/services/heartwood/tacticsClasses.js")
  const R = await import(base + "/src/services/heartwood/runEngine.js")
  const { UNITS } = await import(base + "/src/data/heartwood/units.js")
  const { CLASSES, CLASS_IDS, CLASS_GROUPS, PART_B_CANDIDATES } = await import(base + "/src/data/heartwood/classes.js")
  const r = {}
  const fails = []
  const ok = (cond, msg, data) => {
    if (!cond) fails.push(data === undefined ? msg : `${msg} ${JSON.stringify(data)}`)
  }
  const PART_B = ["rootweaver", "disruptor", "trapper", "hexer", "summoner", "beastmaster", "alchemist", "scout", "saboteur", "engineer", "spiritwalker", "ritualist", "chronomancer", "shapeshifter", "corruptor", "merchant", "relic-keeper", "cleanser", "gatherer"]

  // --- data: 38 classes, all used, candidates moved -----------------------
  const perClass = {}
  const bad = []
  for (const def of Object.values(UNITS)) {
    if (def.summonOnly) continue
    if (!def.fusedFrom) perClass[def.classId] = (perClass[def.classId] || 0) + 1
    const cls = CLASSES[def.classId]
    if (!cls || !CLASS_GROUPS[cls.group] || !cls.passive?.id || cls.skills.length < 2 || cls.skills.length > 3 || cls.skills.some((s) => !s.icon)) bad.push(def.id)
  }
  r.classCounts = perClass
  ok(CLASS_IDS.length === 38 && PART_B.every((c) => CLASSES[c]), "38 classes incl. the 19 part-B ones", CLASS_IDS.length)
  ok(CLASS_IDS.every((c) => perClass[c] > 0), "every class used by some unit", perClass)
  ok(bad.length === 0, "units with a bad class", bad)
  ok(Object.entries(PART_B_CANDIDATES).every(([id, c]) => UNITS[id].classId === c), "PART_B_CANDIDATES reassigned")

  // --- synthetic board helper (same shape as verify_classes_a) -------------
  const E0 = "enemy-ironmaw-0"
  const E1 = "enemy-sapling-attendant-1"
  const E2 = "enemy-hoardling-2"
  const CMD = "player-commander"
  function board(squad, place, extra = {}) {
    let s = E.createTacticsBattle("default", squad)
    const withDefaults = { [CMD]: { row: 8, col: 11 }, [E2]: { row: 0, col: 0 }, ...place }
    s = {
      ...s,
      terrain: {},
      wallHp: {},
      ...extra,
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
  const patchU = (s, id, p) => ({ ...s, units: s.units.map((u) => (u.id === id ? { ...u, ...p } : u)) })
  const strip = (s, id) => patchU(s, id, { classPassive: null })
  const enemyHit = (s, attacker, target) => E.attackUnit({ ...s, phase: "enemy" }, attacker, target)
  const cast = (s, id, target, skill) => E.castAbility(s, id, target, skill)
  const cd = (s, id, skill) => (U(s, id).classCds || {})[skill]
  const skillOf = (s, id, skill) => U(s, id).classSkills.find((k) => k.id === skill)

  // 1 Rootweaver ------------------------------------------------------------
  {
    const s = board(["thornwisp"], { thornwisp: { row: 4, col: 8 }, [E0]: { row: 4, col: 6 }, [E1]: { row: 1, col: 5 } }, { terrain: { "2-8": "water" } })
    const w = pid(s, "thornwisp")
    const snare = cast(s, w, E0, "root-snare")
    ok(dmg(s, snare, E0) > 0 && U(snare, E0).root === 2 && cd(snare, w, "root-snare") === 2, "Root Snare roots + damages", { d: dmg(s, snare, E0), root: U(snare, E0).root })
    const wall = cast(s, w, "4-7", "growing-wall")
    ok(wall.terrain["4-7"] === "wall" && wall.wallHp["4-7"] === 5 && U(wall, E0).root === 2, "Growing Wall: 5-HP barricade, roots adjacent enemies", { t: wall.terrain, hp: wall.wallHp })
    const bridge = cast(s, w, "2-8", "vine-bridge")
    ok(bridge.terrain["2-8"] === "bridge" && cast(s, w, "3-8", "vine-bridge") === s, "Vine Bridge only over water/lava/rock")
    const far = board(["thornwisp"], { thornwisp: { row: 4, col: 8 }, [E0]: { row: 4, col: 6 }, [E1]: { row: 2, col: 6 } })
    let mv = E.moveUnit({ ...far, phase: "enemy" }, E0, { row: 4, col: 7 })
    mv = E.moveUnit(mv, E1, { row: 3, col: 7 })
    ok(U(mv, E0).pos.col === 7 && U(mv, E0).root === 2 && !(U(mv, E1).root > 0) && labels(mv).includes("Rooted!"), "Grasping Roots: first adjacent enemy only", { e0: U(mv, E0).root, e1: U(mv, E1).root })
  }
  // 2 Disruptor ---------------------------------------------------------------
  {
    const s = board(["the-moon"], { "the-moon": { row: 4, col: 8 }, [E0]: { row: 4, col: 7 }, [E1]: { row: 0, col: 3 } })
    const d = pid(s, "the-moon")
    const buffed = patchU(s, E0, { block: 3, ward: 1, regen: 2, taunt: 1, bulwark: 2, attack: U(s, E0).baseAttack + 2 })
    const dp = cast(buffed, d, E0, "dispel")
    const e = U(dp, E0)
    ok(e.block === 0 && e.ward === 0 && e.regen === 0 && e.taunt === 0 && e.bulwark === 0 && e.attack === U(s, E0).baseAttack && labels(dp).includes("Dispelled!"), "Dispel strips buffs", e)
    const push = cast(s, d, E0, "displace")
    ok(U(push, E0).pos.col === 5 && dmg(s, push, E0) === 0, "Displace pushes 2 tiles", U(push, E0).pos)
    const blockedS = board(["the-moon"], { "the-moon": { row: 4, col: 8 }, [E0]: { row: 4, col: 7 }, [E1]: { row: 4, col: 5 } })
    const push2 = cast(blockedS, d, E0, "displace")
    ok(U(push2, E0).pos.col === 6 && dmg(blockedS, push2, E0) === 2, "Displace into something: 2 damage", { pos: U(push2, E0).pos, d: dmg(blockedS, push2, E0) })
    const st = cast(s, d, E0, "static-disruption")
    ok(U(st, E0).drained === 1 && dmg(s, st, E0) > 0, "Static Disruption drains", U(st, E0).drained)
    // drained enemy 2 tiles away can only move, not move+attack
    const away = (x) => E.moveUnit(x, d, { row: 4, col: 10 })
    const intentOf = (x) => E.previewEnemyIntents(x).find((i) => i.enemyId === E0)?.intent.kind
    const drainedK = intentOf(away(st))
    const ctlK = intentOf(away(s))
    r.static = { drainedK, ctlK }
    ok(ctlK === "move-attack" && drainedK === "move", "drained enemy can't move AND attack", r.static)
    const wound = patchU(s, E0, { windup: { skillId: "x", name: "Slam", tiles: [] } })
    const hitW = E.attackUnit(wound, d, E0)
    ok(U(hitW, E0).windup === null && labels(hitW).includes("Interrupted!"), "Interrupt cancels a wind-up")
  }
  // 3 Trapper -------------------------------------------------------------------
  {
    const s = board(["snareclaw"], { snareclaw: { row: 4, col: 9 }, [E0]: { row: 4, col: 6 }, [E1]: { row: 3, col: 7 } })
    const t = pid(s, "snareclaw")
    const tr = cast(s, t, "4-7", "thorn-trap")
    ok(tr.classTraps["4-7"]?.kind === "thorn" && cd(tr, t, "thorn-trap") === 2, "Thorn Trap placed")
    const sprung = E.moveUnit({ ...tr, phase: "enemy" }, E0, { row: 4, col: 7 })
    ok(dmg(tr, sprung, E0) === 3 && U(sprung, E0).root === 2 && !sprung.classTraps["4-7"] && labels(sprung).includes("Trap!"), "Thorn Trap springs: 3 dmg + Root", { d: dmg(tr, sprung, E0) })
    ok(dmg(tr, sprung, E1) === 2, "Ambush Network: adjacent enemy takes 2", dmg(tr, sprung, E1))
    const mine = cast(s, t, "5-7", "poison-mine")
    const pm = E.moveUnit({ ...mine, phase: "enemy" }, E0, { row: 5, col: 7 })
    ok(U(pm, E0).poison === 3, "Poison Mine: 3 Poison", U(pm, E0).poison)
    const dec = cast(s, t, "4-7", "decoy")
    const decoy = dec.units.find((u) => u.decoy)
    const prev = E.previewEnemyIntents(dec).find((i) => i.enemyId === E0)?.intent
    r.decoy = prev
    ok(decoy && decoy.npc && decoy.taunt > 0 && decoy.hp === 6 && prev && prev.targetId === decoy.id, "Decoy draws the enemy", prev)
    ok(cast(s, t, "4-9", "thorn-trap") === s && cast(s, t, "0-0", "thorn-trap") === s, "trap needs an empty tile in range")
  }
  // 4 Hexer ---------------------------------------------------------------------
  {
    const s = board(["hexmother"], { hexmother: { row: 4, col: 8 }, [E0]: { row: 4, col: 7 }, [E1]: { row: 3, col: 6 } })
    const h = pid(s, "hexmother")
    const hit = E.attackUnit(s, h, E0)
    ok(U(hit, E0).cursed === 1, "Malediction curses on hit")
    const cursed = patchU(s, E0, { cursed: 1 })
    ok(dmg(cursed, enemyHit(cursed, E0, h), h) === dmg(s, enemyHit(s, E0, h), h) - 1, "Cursed enemy deals 1 less")
    ok(dmg(cursed, E.attackUnit(strip(cursed, h), h, E0), E0) === dmg(s, E.attackUnit(strip(s, h), h, E0), E0) + 1, "Cursed enemy takes 1 more")
    const v = cast(s, h, E0, "vulnerability")
    ok(U(v, E0).exposed === 2, "Vulnerability exposes")
    const chain = cast(s, h, E0, "hex-chain")
    ok(U(chain, E0).cursed === 2 && U(chain, E1).cursed === 2 && dmg(s, chain, E0) > 0 && dmg(s, chain, E1) > 0, "Hex Chain curses the cluster")
    const sd = cast(s, h, E0, "soul-debt")
    const paid = enemyHit(sd, E0, h)
    ok(U(sd, E0).soulDebt === 2 && dmg(sd, paid, E0) === 3 && labels(paid).includes("Soul Debt!"), "Soul Debt: 3 when it attacks", dmg(sd, paid, E0))
  }
  // 5 Summoner ------------------------------------------------------------------
  {
    const s = board(["mycelist"], { mycelist: { row: 4, col: 8, hp: 5 }, [E0]: { row: 4, col: 5 }, [E1]: { row: 0, col: 3 } })
    const m = pid(s, "mycelist")
    const sm = cast(s, m, null, "summon-spirit")
    const wolf = sm.units.find((u) => u.ownerId === m)
    ok(wolf && wolf.isSpirit && wolf.bonded && wolf.ap === 0 && cd(sm, m, "summon-spirit") === 3, "Summon Spirit", wolf && { id: wolf.id, ap: wolf.ap })
    const again = patchU(sm, m, { classCds: {}, ap: 2 })
    ok(!C.classSkillUsable(again, U(again, m), skillOf(again, m, "summon-spirit")) && cast(again, m, null, "summon-spirit") === again, "one Spirit at a time")
    const near = patchU(patchU(sm, wolf.id, { pos: { row: 4, col: 6 }, ap: 2 }), m, { ap: 2, classCds: {} })
    ok(dmg(near, E.attackUnit(near, wolf.id, E0), E0) === dmg(near, E.attackUnit(patchU(near, wolf.id, { bonded: false }), wolf.id, E0), E0) + 1, "Spirit Bond +1")
    const sw = cast(near, m, E0, "swarm-command")
    ok(dmg(near, sw, E0) > 0 && labels(sw).includes("Swarm Command!"), "Swarm Command: spirits strike")
    const sac = cast(near, m, null, "sacrificial-summon")
    ok(U(sac, wolf.id).hp === 0 && dmg(near, sac, E0) === 4 && U(sac, m).hp === Math.min(U(near, m).maxHp, 5 + Math.min(5, U(near, wolf.id).hp)), "Sacrificial Summon", { e0: dmg(near, sac, E0), hp: U(sac, m).hp })
  }
  // 6 Beastmaster ---------------------------------------------------------------
  {
    const WOLF = "player-beastcaller-0-summon-spirit-wolf"
    const s = board(["beastcaller"], { beastcaller: { row: 4, col: 9 }, [WOLF]: { row: 4, col: 8 }, [E0]: { row: 4, col: 4 }, [E1]: { row: 0, col: 3 } })
    const b = pid(s, "beastcaller")
    ok(U(s, WOLF).ownerId === b && !C.classSkillUsable(s, U(s, b), skillOf(s, b, "call-companion")), "battle-start wolf is its companion")
    const hunt = cast(s, b, E0, "hunt")
    ok(Math.max(Math.abs(U(hunt, WOLF).pos.row - 4), Math.abs(U(hunt, WOLF).pos.col - 4)) === 1 && dmg(s, hunt, E0) > 0 && labels(hunt).includes("Hunt!"), "Hunt: companion leaps + bites", U(hunt, WOLF).pos)
    const adj = patchU(s, WOLF, { pos: { row: 4, col: 5 }, ap: 1 })
    const fr = cast(adj, b, null, "frenzy")
    ok(U(fr, WOLF).ap === 2 && U(fr, WOLF).frenzy === 1, "Frenzy: +1 AP")
    ok(dmg(fr, E.attackUnit(fr, WOLF, E0), E0) === dmg(adj, E.attackUnit(adj, WOLF, E0), E0) + 3, "Frenzy: +3 damage")
    const dead = board(["beastcaller"], { beastcaller: { row: 4, col: 9 }, [WOLF]: { row: 4, col: 8, hp: 0 }, [E0]: { row: 0, col: 0 }, [E1]: { row: 8, col: 0 } })
    const after = E.endPlayerTurn({ ...dead, units: dead.units.map((u) => (u.id === b ? { ...u, classCds: { "call-companion": 3 } } : u)) })
    ok(after.phase === "player" && U(after, b).attack === U(dead, b).attack + 2 && cd(after, b, "call-companion") === 0 && labels(after).includes("Pack Bond!"), "Pack Bond on a fallen companion", { a: U(after, b).attack })
    const called = cast(after, b, null, "call-companion")
    ok(called.units.some((u) => u.ownerId === b && u.hp > 0 && u.id !== WOLF), "Call Companion summons a new one")
  }
  // 7 Alchemist -------------------------------------------------------------------
  {
    const s = board(["rootfang"], { rootfang: { row: 4, col: 8 }, [E0]: { row: 4, col: 7 }, [E1]: { row: 3, col: 7 } })
    const a = pid(s, "rootfang")
    ok((U(E.attackUnit(s, a, E0), E0).poison || 0) === (U(E.attackUnit(strip(s, a), a, E0), E0).poison || 0) + 1, "Catalyst: +1 Poison per hit")
    const fl = cast(s, a, E0, "poison-flask")
    ok(U(fl, E0).poison === 2 && U(fl, E1).poison === 2, "Poison Flask splashes")
    const vm = cast(patchU(fl, a, { ap: 2 }), a, E0, "volatile-mixture")
    ok((vm.events || []).some((e) => e.kind === "combo" && e.combo === "toxic-blaze") && !(U(vm, E0).poison > 0), "Volatile Mixture sets off Toxic Blaze")
    const tm = cast(patchU(s, E0, { block: 3, regen: 2 }), a, E0, "transmute")
    ok(U(tm, E0).block === 0 && U(tm, E0).regen === 0 && U(tm, E0).poison === 5, "Transmute: Block+Regen -> Poison", U(tm, E0))
  }
  // 8 Scout -----------------------------------------------------------------------
  {
    const s = board(["stormwing", "the-fool"], { stormwing: { row: 4, col: 8 }, "the-fool": { row: 5, col: 9, slow: 2, root: 1 }, [E0]: { row: 4, col: 3 }, [E1]: { row: 0, col: 3 } })
    const sc = pid(s, "stormwing")
    const f = pid(s, "the-fool")
    const m1 = E.moveUnit(s, sc, { row: 3, col: 8 })
    const m2 = E.moveUnit(m1, sc, { row: 2, col: 8 })
    ok(U(m1, sc).ap === 2 && U(m2, sc).ap === 1 && labels(m1).includes("Pathfinder!"), "Pathfinder: first move free", { a1: U(m1, sc).ap, a2: U(m2, sc).ap })
    const mk = cast(s, sc, E0, "mark-threat")
    ok(U(mk, E0).mark === 2 && U(mk, E0).markBonus === 2, "Mark Threat")
    const tb = cast(s, sc, null, "trailblazer")
    const fm = E.moveUnit(tb, f, { row: 6, col: 9 })
    ok(U(tb, f).root === 0 && U(tb, f).slow === 0 && U(fm, f).ap === 2, "Trailblazer: clears Root/Slow, free move", { ap: U(fm, f).ap })
  }
  // 9 Saboteur ----------------------------------------------------------------------
  {
    const s = board(["ashcaller"], { ashcaller: { row: 4, col: 8 }, [E0]: { row: 4, col: 7 }, [E1]: { row: 0, col: 3 } }, { terrain: { "3-8": "wall", "4-5": "wall" }, wallHp: { "3-8": 8, "4-5": 8 } })
    const sb = pid(s, "ashcaller")
    const w1 = E.attackWall(s, sb, { row: 3, col: 8 })
    const w0 = E.attackWall(strip(s, sb), sb, { row: 3, col: 8 })
    const lost = (x) => (x.terrain["3-8"] === "wall" ? 8 - x.wallHp["3-8"] : 8)
    ok(lost(w1) === Math.min(8, 3 * lost(w0)), "Demolitions: triple wall damage", { d: lost(w1), c: lost(w0) })
    const sab = cast(patchU(s, E0, { block: 5, ward: 1, bulwark: 2 }), sb, E0, "sabotage")
    ok(U(sab, E0).block === 0 && U(sab, E0).ward === 0 && U(sab, E0).bulwark === 0 && U(sab, E0).hp < 40, "Sabotage strips then hits")
    const ch = cast(s, sb, "4-6", "explosive-charge")
    ok(ch.classCharges.length === 1, "Charge planted")
    const blown = E.endPlayerTurn(ch)
    ok(U(blown, E0).hp <= 36 && blown.terrain["4-5"] === "rubble" && !(blown.classCharges || []).length, "Charge blows at turn end (4 dmg, walls crumble)", { hp: U(blown, E0).hp, t: blown.terrain["4-5"] })
    const smoke = cast(s, sb, "2-8", "smoke-bomb")
    ok(["1-7", "1-8", "1-9", "2-7", "2-8", "2-9", "3-7", "3-9"].every((k) => smoke.terrain[k] === "bush") && smoke.terrain["3-8"] === "wall", "Smoke Bomb: 3x3 tall grass (walls stay)")
  }
  // 10 Engineer ---------------------------------------------------------------------
  {
    const s = board(["stoneknit"], { stoneknit: { row: 4, col: 9 }, [E0]: { row: 4, col: 5 }, [E1]: { row: 0, col: 3 } })
    const en = pid(s, "stoneknit")
    const tu = cast(s, en, "4-7", "deploy-turret")
    const turret = tu.units.find((u) => u.turret)
    ok(turret && turret.npc && turret.structure && turret.hp === 8 && turret.ownerId === en, "Turret built")
    const again = patchU(tu, en, { classCds: {}, ap: 2 })
    ok(!C.classSkillUsable(again, U(again, en), skillOf(again, en, "deploy-turret")), "one turret at a time")
    const shot = E.endPlayerTurn(tu)
    ok(labels(shot).includes("Turret!") && (shot.events || []).some((e) => e.kind === "strike" && e.actorId === turret.id && e.targetId === E0), "Turret fires at turn end")
    const bar = cast(s, en, "3-9", "build-barricade")
    ok(bar.terrain["3-9"] === "wall" && bar.wallHp["3-9"] === 8, "Build Barricade")
    const dmgd = { ...bar, wallHp: { "3-9": 4 } }
    const rep = E.endPlayerTurn(dmgd)
    ok(rep.wallHp["3-9"] === 6, "Field Repairs +2 on adjacent barricade", rep.wallHp)
  }
  // 11 Spiritwalker -----------------------------------------------------------------
  {
    const s = board(["wispkeeper"], { wispkeeper: { row: 4, col: 9, hp: 5 }, [E0]: { row: 0, col: 0 }, [E1]: { row: 8, col: 0 } }, { terrain: { "4-7": "water", "3-7": "water", "5-7": "water", "4-8": "wall" } })
    const sw = pid(s, "wispkeeper")
    const veil = E.endPlayerTurn(s)
    ok(labels(veil).includes("Veil!"), "Veil: +2 Block when no enemy near")
    const step = cast(s, sw, "4-6", "spirit-step")
    ok(U(step, sw).pos.col === 6, "Spirit Step through water/walls", U(step, sw).pos)
    const near = board(["wispkeeper"], { wispkeeper: { row: 4, col: 8 }, [E0]: { row: 4, col: 7 }, [E1]: { row: 0, col: 3 } })
    const ph = cast(near, sw, sw, "phase-shift")
    ok(U(ph, sw).phased === 1 && dmg(ph, enemyHit(ph, E0, sw), sw) === 0 && dmg(near, enemyHit(near, E0, sw), sw) > 0, "Phase Shift: no damage from hits")
    const home = board(["wispkeeper"], { wispkeeper: { row: 4, col: 5, hp: 5 }, [E0]: { row: 4, col: 3 }, [E1]: { row: 0, col: 3 } })
    const hh = cast(home, sw, null, "return-to-hearth")
    ok(U(hh, sw).pos.col === 11 && U(hh, sw).hp === 9, "Return to Hearth: back line + heal 4", U(hh, sw).pos)
  }
  // 12 Ritualist ----------------------------------------------------------------------
  {
    const s = board(["abyssong", "the-fool"], { abyssong: { row: 4, col: 8 }, "the-fool": { row: 4, col: 9, hp: 3 }, [E0]: { row: 4, col: 6 }, [E1]: { row: 0, col: 3 } })
    const ri = pid(s, "abyssong")
    const f = pid(s, "the-fool")
    const b1 = cast(s, ri, null, "begin-ritual")
    ok(U(b1, ri).ritual === 1 && cast(patchU(s, ri, { ritual: 3 }), ri, null, "begin-ritual") !== s, "Begin Ritual stacks")
    const three = patchU(s, ri, { ritual: 3 })
    ok(cast(three, ri, null, "begin-ritual") === three, "ritual max 3")
    const done = cast(three, ri, null, "complete-ritual")
    ok(dmg(three, done, E0) === 9 && U(done, f).hp === 9 && U(done, ri).ritual === 0, "Complete Ritual: 3/stack dmg, 2/stack heal", { d: dmg(three, done, E0), f: U(done, f).hp })
    const adj = patchU(board(["abyssong"], { abyssong: { row: 4, col: 8 }, [E0]: { row: 4, col: 7 }, [E1]: { row: 0, col: 3 } }), ri, { ritual: 2 })
    const broke = enemyHit(adj, E0, ri)
    ok(U(broke, ri).ritual === 0 && dmg(adj, broke, E0) === 3 && labels(broke).includes("Ritual breaks!"), "Interrupted Ritual: half power early", dmg(adj, broke, E0))
    const off = cast(s, ri, f, "spirit-offering")
    ok(U(off, f).ap === 3 && U(off, ri).hp === U(s, ri).hp - 3, "Spirit Offering: 3 HP for +1 AP")
  }
  // 13 Chronomancer -------------------------------------------------------------------
  {
    const s = board(["wheel-of-fortune", "the-fool"], { "wheel-of-fortune": { row: 4, col: 9 }, "the-fool": { row: 5, col: 9, hp: 4 }, [E0]: { row: 0, col: 0 }, [E1]: { row: 8, col: 0 } })
    const ch = pid(s, "wheel-of-fortune")
    const f = pid(s, "the-fool")
    const h = cast(patchU(s, ch, { classCds: { "slow-time": 3 } }), ch, f, "haste-time")
    const nt = E.endPlayerTurn(h)
    ok(U(nt, f).ap === 3 && cd(nt, ch, "slow-time") === 1 && cd(nt, ch, "haste-time") === 1, "Haste Time +1 AP next turn; Temporal Flow ticks x2", { ap: U(nt, f).ap, cds: U(nt, ch).classCds })
    const near = board(["wheel-of-fortune"], { "wheel-of-fortune": { row: 4, col: 9 }, [E0]: { row: 4, col: 6, enemySkills: [{ id: "slam", kind: "slam" }], skillCd: {} }, [E1]: { row: 0, col: 3 } })
    const sl = cast(near, ch, E0, "slow-time")
    ok(U(sl, E0).slow === 2 && U(sl, E0).skillCd.slam === 2, "Slow Time: Slow + skills +2 cooldown", U(sl, E0).skillCd)
    const rw = patchU(s, f, { rewindHp: 10 })
    ok(U(cast(rw, ch, f, "rewind"), f).hp === 10 && cast(s, ch, f, "rewind") === s, "Rewind restores lost HP")
  }
  // 14 Shapeshifter ---------------------------------------------------------------------
  {
    const s = board(["chimera"], { chimera: { row: 4, col: 8 }, [E0]: { row: 4, col: 7, hp: 15 }, [E1]: { row: 0, col: 3 } })
    const sh = pid(s, "chimera")
    const beast = cast(s, sh, null, "beast-form")
    ok(U(beast, sh).form === "beast" && U(beast, sh).block === 2, "Beast Form (+2 Block Form Mastery)")
    const clean = patchU(beast, sh, { block: 0 })
    const base = patchU(s, sh, { ap: 1 })
    ok(dmg(clean, E.attackUnit(clean, sh, E0), E0) === dmg(base, E.attackUnit(base, sh, E0), E0) + 2, "Beast Form +2 damage")
    ok(cast(beast, sh, null, "beast-form") === beast, "same form can't be re-cast")
    const root = cast(s, sh, null, "root-form")
    const rootNoBlock = patchU(root, sh, { block: 0 })
    ok(U(root, sh).block === 5 && C.immovable(U(root, sh)) && dmg(rootNoBlock, enemyHit(rootNoBlock, E0, sh), sh) === dmg(s, enemyHit(s, E0, sh), sh) - 1, "Root Form: +3 Block, -1 dmg, immovable")
    const pred = patchU(cast(s, sh, null, "predator-form"), sh, { block: 0 })
    ok(dmg(pred, E.attackUnit(pred, sh, E0), E0) === dmg(base, E.attackUnit(base, sh, E0), E0) + 3, "Predator Form +3 vs wounded")
  }
  // 15 Corruptor -------------------------------------------------------------------------
  {
    const s = board(["death"], { death: { row: 4, col: 8 }, [E0]: { row: 4, col: 7 }, [E1]: { row: 3, col: 7 } })
    const co = pid(s, "death")
    ok(U(E.attackUnit(s, co, E0), E0).corruption === 1, "Corruption +1 per hit")
    const c4 = patchU(s, E0, { corruption: 4 })
    const c5 = patchU(s, E0, { corruption: 5 })
    ok(dmg(c5, E.attackUnit(c5, co, E0), E0) === dmg(c4, E.attackUnit(c4, co, E0), E0) + 2, "Heart Rot: +2 at 5 Corruption")
    const cc = patchU(s, E0, { corruption: 3, poison: 2, root: 1 })
    const eat = cast(cc, co, E0, "consume-curse")
    ok(U(eat, E0).corruption === 1 && !(U(eat, E0).poison > 0) && dmg(cc, eat, E0) >= 8, "Consume Curse: 2/stack + 1/ailment", dmg(cc, eat, E0))
    const inv = cast(patchU(s, E0, { block: 3, ward: 1, regen: 2 }), co, E0, "invert-blessing")
    ok(U(inv, E0).corruption === 3 && U(inv, E0).block === 0 && U(inv, E0).ward === 0, "Invert Blessing: buffs -> Corruption")
    const sp = cast(patchU(s, E0, { corruption: 4, poison: 2 }), co, E0, "spread-corruption")
    ok(U(sp, E1).corruption === 2 && U(sp, E1).poison === 2, "Spread Corruption")
  }
  // 16 Merchant ----------------------------------------------------------------------------
  {
    const s = board(["grove-merchant", "the-fool"], { "grove-merchant": { row: 4, col: 8, hp: 5 }, "the-fool": { row: 3, col: 6 }, [E0]: { row: 4, col: 7, hp: 1 }, [E1]: { row: 3, col: 5 } })
    const me = pid(s, "grove-merchant")
    const f = pid(s, "the-fool")
    const kill = E.attackUnit(s, me, E0)
    ok(kill.bonusEssence === 1 && labels(kill).includes("+1 Essence"), "Bounty: +1 Essence on a kill", kill.bonusEssence)
    ok(!E.attackUnit({ ...s, merchantBounty: 3 }, me, E0).bonusEssence, "Bounty capped at 3")
    const ap = cast(s, me, E1, "appraise")
    ok(U(ap, E1).appraised === 2, "Appraise")
    const fs = patchU(ap, f, { ap: 2 })
    const fs0 = patchU(s, f, { ap: 2 })
    ok(dmg(fs, E.attackUnit(fs, f, E1), E1) === dmg(fs0, E.attackUnit(fs0, f, E1), E1) + 1, "Appraised takes +1")
    const low = patchU(fs, E1, { hp: 1 })
    ok(E.attackUnit(low, f, E1).bonusEssence === 1, "Appraised kill pays +1 Essence")
    const sup = cast(s, me, me, "emergency-supply")
    ok(U(sup, me).hp === 8 && U(sup, me).block === 2, "Emergency Supply: +3 HP, +2 Block")
    const rs = R.startRun("tommy")
    const after = R.recordFightAftermath(rs, { units: [], bonusEssence: 2 })
    ok(after.essence === rs.essence + 2, "bonus Essence reaches the run", { a: after.essence, b: rs.essence })
  }
  // 17 Relic Keeper ---------------------------------------------------------------------------
  {
    const relic = { trigger: "turnEnd", effect: { type: "heal", amount: 3 }, source: "Test Relic" }
    const s = board(["fortunes-root", "the-fool"], { "fortunes-root": { row: 4, col: 8, hp: 5, triggers: [relic] }, "the-fool": { row: 4, col: 9 }, [E0]: { row: 0, col: 0 }, [E1]: { row: 8, col: 0 } })
    const rk = pid(s, "fortunes-root")
    const f = pid(s, "the-fool")
    const res = E.endPlayerTurn(s)
    const res0 = E.endPlayerTurn(strip(s, rk))
    ok(U(res, rk).hp === U(res0, rk).hp + 3 && labels(res).includes("Resonance!"), "Resonance fires relic effects again", { a: U(res, rk).hp, b: U(res0, rk).hp })
    const tr = cast(s, rk, f, "relic-transfer")
    ok((U(tr, f).triggers || []).some((t) => t.source === "Test Relic" && t.transferred), "Relic Transfer copies the relic effect")
    const none = patchU(s, rk, { triggers: [] })
    ok(U(cast(none, rk, f, "relic-transfer"), f).block === 2, "Relic Transfer without relics: +2 Block")
    const fb = cast(s, rk, null, "forbidden-relic")
    ok(U(fb, rk).hp === 2 && U(fb, rk).attack === U(s, rk).attack + 2 && cast(patchU(s, rk, { hp: 3 }), rk, null, "forbidden-relic").units.find((u) => u.id === rk).hp === 3, "Forbidden Relic: -3 HP, +2 attack (needs >3 HP)")
  }
  // 18 Cleanser -----------------------------------------------------------------------------------
  {
    const s = board(["glimmerward", "the-fool"], { glimmerward: { row: 4, col: 8 }, "the-fool": { row: 4, col: 9, poison: 2 }, [E0]: { row: 0, col: 0 }, [E1]: { row: 8, col: 0 } })
    const cl = pid(s, "glimmerward")
    const f = pid(s, "the-fool")
    const pure = E.endPlayerTurn(s)
    const pure0 = E.endPlayerTurn(strip(s, cl))
    ok(!(U(pure, f).poison > 0) && U(pure0, f).poison === 1 && labels(pure).includes("Purity!"), "Purity strips an ailment at turn end", { a: U(pure, f).poison, b: U(pure0, f).poison })
    const hurt = patchU(s, f, { hp: 5, poison: 2, weak: 1, root: 1 })
    const pg = cast(hurt, cl, f, "purge")
    ok(!(U(pg, f).poison > 0) && !(U(pg, f).weak > 0) && !(U(pg, f).root > 0) && U(pg, f).hp === 8, "Purge: all ailments, heal 1 each", U(pg, f).hp)
    const lightS = board(["glimmerward", "the-fool"], { glimmerward: { row: 4, col: 8 }, "the-fool": { row: 4, col: 9, root: 1 }, [E0]: { row: 4, col: 6, cursed: 1 }, [E1]: { row: 0, col: 3 } })
    const li = cast(lightS, cl, null, "purifying-light")
    ok(!(U(li, f).root > 0) && U(li, f).block === 1 && dmg(lightS, li, E0) > 0, "Purifying Light")
  }
  // 19 Gatherer ---------------------------------------------------------------------------------
  {
    const s = board(["hollow-forager"], { "hollow-forager": { row: 4, col: 8, hp: 5 }, [E0]: { row: 0, col: 0 }, [E1]: { row: 8, col: 0 } }, { terrain: { "4-9": "forest" } })
    const g = pid(s, "hollow-forager")
    const fo = E.endPlayerTurn(s)
    ok(U(fo, g).hp === 7 && labels(fo).includes("Forage!") && U(E.endPlayerTurn({ ...s, terrain: {} }), g).hp === 5, "Forage heals 2 near forest")
    const k = board(["hollow-forager"], { "hollow-forager": { row: 4, col: 8, hp: 5 }, [E0]: { row: 4, col: 7, hp: 1 }, [E1]: { row: 0, col: 3 } })
    const sc = cast(k, g, E0, "scavenge")
    ok(U(sc, E0).hp === 0 && U(sc, g).hp === 8 && sc.bonusEssence === 1, "Scavenge kill: heal 3 + 1 Essence")
    const og = cast(s, g, "2-8", "overgrow")
    ok(["2-8", "1-8", "3-8", "2-7", "2-9"].every((key) => og.terrain[key] === "bush") && og.terrain["1-7"] !== "bush", "Overgrow plants a plus of tall grass")
  }

  // --- preview == real with summons, traps, turret, wall, charge -------------
  {
    let s = board(["snareclaw", "stoneknit", "mycelist", "thornwisp", "ashcaller"], {
      snareclaw: { row: 2, col: 9 },
      stoneknit: { row: 6, col: 9 },
      mycelist: { row: 4, col: 10 },
      thornwisp: { row: 3, col: 9 },
      ashcaller: { row: 5, col: 9 },
      [CMD]: { row: 4, col: 11 },
      [E0]: { row: 4, col: 4 },
      [E1]: { row: 5, col: 6 },
      [E2]: { row: 2, col: 4 },
    })
    s = cast(s, pid(s, "snareclaw"), "3-7", "thorn-trap")
    s = cast(s, pid(s, "stoneknit"), "6-7", "deploy-turret")
    s = cast(s, pid(s, "mycelist"), null, "summon-spirit")
    s = cast(s, pid(s, "thornwisp"), "4-7", "growing-wall")
    s = cast(s, pid(s, "ashcaller"), "5-7", "explosive-charge")
    const preview = E.previewEnemyIntents(s)
    const again = E.previewEnemyIntents(s)
    const endReal = E.endPlayerTurn(s)
    const rows = preview.map(({ enemyId, intent }) => {
      const now = U(endReal, enemyId)
      let good = true
      if (intent.to) good = now.pos.row === intent.to.row && now.pos.col === intent.to.col
      if (intent.targetId) good = good && U(endReal, intent.targetId).hp < U(s, intent.targetId).hp
      return { enemyId, kind: intent.kind, targetId: intent.targetId, to: intent.to, good }
    })
    r.preview = rows
    ok(JSON.stringify(preview) === JSON.stringify(again) && rows.length >= 2 && rows.every((x) => x.good), "preview == real with traps/turret/summon/wall/charge", rows)
    // The whole enemy phase replays identically (deterministic).
    ok(JSON.stringify(E.endPlayerTurn(s).units) === JSON.stringify(endReal.units), "enemy phase deterministic")
  }
  r.fails = fails
  return r
}

const out = { errors: [] }
if (process.env.NODE_ONLY) {
  const res = await engineChecks("file://" + process.cwd())
  console.log(JSON.stringify(res, null, 2))
  process.exit(res.fails.length ? 1 : 0)
}

const { chromium } = await import("playwright")
const PORT = process.env.PORT || 5445
const browser = await chromium.launch()
const errs = []
const page = await (await browser.newContext({ viewport: { width: 1300, height: 900 } })).newPage()
page.on("pageerror", (e) => errs.push(String(e)))
page.on("console", (m) => m.type() === "error" && !/ERR_CONNECTION_REFUSED/.test(m.text()) && errs.push(m.text()))
await page.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
await page.waitForSelector(".hwt-board", { timeout: 20000 })

const engine = await page.evaluate(engineChecks, "")
out.engine = engine
for (const f of engine.fails) out.errors.push(f)

// --- UI: a part-B unit (Snareclaw, Trapper) places a trap by clicks -------
{
  await page.locator(".hwt-squad-select").nth(0).selectOption("snareclaw")
  await page.waitForTimeout(250)
  const token = page.locator('.hwt-token[data-side="player"]', { hasText: "Snareclaw" }).first()
  const badge = await token.locator(".hwt-token-class").getAttribute("data-class-id").catch(() => null)
  await token.click()
  await page.waitForTimeout(150)
  const skills = await page.locator(".hwt-skill-btn").count()
  const cls = await page.locator(".hwt-class-badge").innerText()
  await page.locator('.hwt-skill-btn[data-skill-id="thorn-trap"]').click()
  await page.waitForTimeout(150)
  const hint = await page.locator(".hwt-skill-hint").innerText().catch(() => "")
  const tiles = await page.locator('.hwt-cell[data-skill-tile="true"]').count()
  const first = page.locator('.hwt-cell[data-skill-tile="true"]').first()
  const cell = await first.getAttribute("data-cell")
  await first.click()
  await page.waitForTimeout(250)
  const trapKind = await page.locator(`.hwt-cell[data-cell="${cell}"]`).getAttribute("data-trap")
  const icon = await page.locator(`.hwt-cell[data-cell="${cell}"] .hwt-trap-icon`).count()
  const log = (await page.locator(".hwt-log p").allInnerTexts()).join("\n")
  await token.click()
  await page.waitForTimeout(150)
  const cdText = await page.locator('.hwt-skill-btn[data-skill-id="thorn-trap"]').innerText().catch(() => "")
  out.ui = { badge, skills, cls, hint, tiles, cell, trapKind, icon, cdText, logHas: log.includes("hides a thorn trap") }
  if (!(badge === "trapper" && skills === 3 && cls.includes("Trapper"))) out.errors.push("UI: Trapper skill bar / badge")
  if (!(hint.includes("Choose a tile for Thorn Trap") && tiles > 0)) out.errors.push("UI: tile targeting armed")
  if (!(trapKind === "thorn" && icon === 1 && out.ui.logHas)) out.errors.push("UI: trap placed by clicking a tile")
  if (!cdText.includes("Recharging")) out.errors.push("UI: Thorn Trap recharging")
  await page.screenshot({ path: ".scratch/shots/classes_b_board.png" })
}
// Unit card: part-B class chip.
{
  await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(600)
  await page.evaluate(async () => {
    const mod = await import("/src/services/heartwood/runEngine.js")
    let rs = mod.startRun("tommy")
    rs = { ...rs, essence: 999, shopOffers: ["snareclaw", "grove-merchant", "chimera"] }
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
      cls: c.querySelector(".hw-card-tclass")?.getAttribute("data-class-id") || null,
      tip: c.querySelector(".hw-card-tclass")?.getAttribute("title") || "",
    })),
  )
  out.ui.cards = chips.map((c) => c.cls)
  const want = ["trapper", "merchant", "shapeshifter"]
  if (!want.every((w) => chips.some((c) => c.cls === w)) || !chips.find((c) => c.cls === "merchant")?.tip.includes("Summoning & Economy")) out.errors.push("UI: part-B class chips on unit cards")
}

console.log(JSON.stringify(out, null, 2))
console.log("\npageErrors:", errs.length, errs.slice(0, 8))
await browser.close()
const pass = out.errors.length === 0 && errs.length === 0
console.log(pass ? "\n✅ verify_classes_b PASS" : "\n❌ verify_classes_b FAIL")
process.exit(pass ? 0 : 1)
