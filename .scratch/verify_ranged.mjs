// Ranged rework (feat/hearthwood-ranged): shared ranged toolkit (Aim,
// Suppressing Fire) for every ranged hero, archetypes (Sniper, Grenadier,
// Hunter, Suppressor), Mage family (beams / area spells ignore cover),
// point-blank penalty, smoke, enemy ranged tools, preview == real, UI.
import { chromium } from "playwright"

const PORT = process.env.PORT || 5445
const SHOT_DIR = process.env.SHOT_DIR || ".scratch/shots"
const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1500, height: 1100 } })).newPage()
const errs = []
page.on("pageerror", (e) => errs.push(String(e)))
page.on("console", (m) => m.type() === "error" && !/ERR_CONNECTION_REFUSED|Failed to load resource/.test(m.text()) && errs.push(m.text()))
await page.addInitScript(() => {
  window.__xf = (name) => {
    const el = document.getElementById("root")
    const stack = [el[Object.keys(el).find((k) => k.startsWith("__reactContainer$"))].stateNode.current]
    while (stack.length) {
      const f = stack.pop()
      if (f.type?.name === name) return f
      if (f.sibling) stack.push(f.sibling)
      if (f.child) stack.push(f.child)
    }
    return null
  }
})
const checks = []
const check = (name, ok, detail) => checks.push({ name, ok: !!ok, detail })

await page.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
await page.waitForSelector(".hwt-board .hwt-token", { timeout: 30000 })

// ---------- Engine ----------
const eng = await page.evaluate(async () => {
  const E = await import("/src/services/heartwood/tacticsEngine.js")
  const C = await import("/src/services/heartwood/tacticsCover.js")
  const M = await import("/src/services/heartwood/tacticsMana.js")
  const R = await import("/src/services/heartwood/tacticsRanged.js")
  const EA = await import("/src/services/heartwood/tacticsEnemyAbilities.js")
  const r = {}
  const U = (s, id) => s.units.find((u) => u.id === id)
  const pid = (s, defId) => s.units.find((u) => u.defId === defId && u.side === "player").id
  const E0 = "enemy-ironmaw-0"
  const E1 = "enemy-sapling-attendant-1"
  const E2 = "enemy-hoardling-2"
  // Synthetic board: listed units placed, the rest knocked out. rolls = hit rolls on.
  function board(squad, place, { terrain = {}, rolls = false, mana = false } = {}) {
    let s = E.createTacticsBattle("default", squad)
    const all = { "player-commander": { row: 8, col: 11 }, ...place }
    s = {
      ...s,
      terrain,
      wallHp: {},
      objHp: {},
      units: s.units.map((u) => {
        const k = all[u.id] || all[u.defId]
        if (!k) return { ...u, hp: 0 }
        const { row, col, ...patch } = k
        const base = u.side === "enemy" ? { hp: 40, maxHp: 40, ward: 0, revive: 0, regen: 0, taunt: 0, enemySkills: [], block: 0 } : { block: 0 }
        return { ...u, ...base, ...patch, pos: { row, col } }
      }),
    }
    if (rolls) s = { ...s, hitRolls: true }
    if (mana) s = M.enableMana(s)
    return s
  }
  const cast = (s, a, t, id) => E.castAbility(s, a, t, id)

  // 1 Families: range floor + shared toolkit on every ranged hero ------------
  {
    const squads = [
      ["trueshot", "bishops-slash", "the-tower", "windveil", "snareclaw", "hexbreaker"],
      ["frostbind", "hexmother", "huldra", "abyssong", "wheel-of-fortune", "the-devil"],
      ["bulwark-of-ages", "the-fool", "sparrowthorn", "rooks-charge"],
    ]
    r.family = []
    for (const sq of squads) {
      const s = E.createTacticsBattle("default", sq)
      for (const u of s.units.filter((x) => x.side === "player")) r.family.push([u.defId, u.classId, u.range, (u.rangedKit || []).map((k) => k.id).join("+"), R.archetypeOf(u)?.name || ""])
    }
    const byDef = Object.fromEntries(r.family.map((f) => [f[0], f]))
    r.familyOk = {
      archetypesRanged: ["trueshot", "bishops-slash", "the-tower", "windveil", "snareclaw", "sparrowthorn"].every((d) => byDef[d][2] >= 3 && byDef[d][3] === "aim+suppress"),
      magesRanged: ["hexbreaker", "frostbind", "hexmother", "huldra", "abyssong", "wheel-of-fortune", "the-devil"].every((d) => byDef[d][2] >= 3 && byDef[d][4] === "Mage"),
      names: [byDef.trueshot[4], byDef["the-tower"][4], byDef["bishops-slash"][4], byDef.windveil[4], byDef.snareclaw[4]].join(","),
      meleeNoKit: byDef["bulwark-of-ages"][2] === 1 && byDef["bulwark-of-ages"][3] === "" && byDef["the-fool"][3] === "",
      // A naturally ranged hero of a non-ranged class (Juggernaut) still gets the shared kit.
      everyRangedHasKit: r.family.every((f) => (f[2] > 1) === (f[3] === "aim+suppress") || f[0] === "commander-tommy"),
    }
    // Every ranged hero can Aim and Suppress (AP + mana + cooldown paid).
    const tool = []
    for (const sq of squads) {
      for (const defId of sq) {
        const s0 = E.createTacticsBattle("default", [defId])
        const h = s0.units.find((u) => u.side === "player" && u.defId === defId)
        if (!(h.range > 1)) continue
        const s = board([defId], { [defId]: { row: 4, col: 8 }, [E0]: { row: 4, col: 6 }, [E1]: { row: 0, col: 0 }, [E2]: { row: 1, col: 0 } }, { mana: true })
        const id = pid(s, defId)
        const aimed = cast(s, id, null, "aim")
        const sup = cast(s, id, E0, "suppress")
        tool.push({
          defId,
          aim: U(aimed, id).aimed === 1 && U(aimed, id).ap === U(s, id).ap - 1 && U(aimed, id).mana === U(s, id).mana - 10 && U(aimed, id).classCds.aim === 1,
          sup: U(sup, E0).suppressFire === 1 && U(sup, E0).suppressBy === id && U(sup, id).mana === U(s, id).mana - 15 && U(sup, id).classCds.suppress === 3,
        })
      }
    }
    r.toolkit = tool
  }

  // 2 Aim / point blank / mark / smoke in the hit chance --------------------
  {
    const s = board(["bishops-slash"], { "bishops-slash": { row: 4, col: 8 }, [E0]: { row: 4, col: 5 }, [E1]: { row: 0, col: 0 }, [E2]: { row: 1, col: 0 } }, { terrain: { "4-6": "rock" }, rolls: true })
    const h = pid(s, "bishops-slash")
    const before = C.hitChance(s, U(s, h), U(s, E0))
    const aimed = E.castAbility(s, h, null, "aim")
    const after = C.hitChance(aimed, U(aimed, h), U(aimed, E0))
    const shot = E.attackUnit(aimed, h, E0)
    r.aim = { before: before.chance, after: after.chance, parts: after.parts.map((p) => p.label).join("|"), spent: U(shot, h).aimed || 0 }
    // Point blank: ranged adjacent -25, melee adjacent none.
    const pb = board(["bishops-slash", "bulwark-of-ages"], { "bishops-slash": { row: 4, col: 6 }, "bulwark-of-ages": { row: 3, col: 6 }, [E0]: { row: 4, col: 5 }, [E1]: { row: 0, col: 0 }, [E2]: { row: 1, col: 0 } }, { rolls: true })
    r.pointBlank = { ranged: C.hitChance(pb, U(pb, pid(pb, "bishops-slash")), U(pb, E0)).chance, melee: C.hitChance(pb, U(pb, pid(pb, "bulwark-of-ages")), U(pb, E0)).chance }
    // Mark: Hunter's Mark makes the covered enemy count as uncovered.
    const mk = E.castAbility(s, h, E0, "hunters-mark")
    const marked = C.hitChance(mk, U(mk, h), U(mk, E0))
    r.mark = { cover: marked.cover, chance: marked.chance, label: marked.parts.some((p) => p.label === "Marked - no cover") }
    // Smoke: an ally in smoke has half cover from every side vs ranged.
    const sm = { ...s, smoke: { "4-5": 2 } }
    r.smoke = { cover: C.coverAgainst(sm, { row: 4, col: 5 }, { row: 0, col: 5 }), adjacent: C.coverAgainst(sm, { row: 4, col: 5 }, { row: 3, col: 5 }), flanked: C.isFlanked(sm, { row: 4, col: 5 }, { row: 0, col: 5 }) }
  }

  // 3 Sniper (Sentinel): Deadeye no falloff + 2 range from high ground, Headshot, Sniper's Watch.
  {
    const s = board(["trueshot"], { trueshot: { row: 4, col: 11 }, [E0]: { row: 4, col: 5 }, [E1]: { row: 0, col: 0 }, [E2]: { row: 1, col: 0 } }, { terrain: { "4-11": "high" }, rolls: true })
    const t = pid(s, "trueshot")
    const hc = C.hitChance(s, U(s, t), U(s, E0))
    r.sniper = { range: E.rangeAt(s, U(s, t)), canShoot: E.attackableTargets(s, t).some((u) => u.id === E0), base: hc.parts[0].value, chance: hc.chance }
    const moved = { ...s, units: s.units.map((u) => (u.id === t ? { ...u, moved: true } : u)) }
    r.sniper.movedBase = C.hitChance(moved, U(moved, t), U(moved, E0)).parts[0].value
    const pv = E.attackPreview(s, t, E0, { skill: U(s, t).classSkills.find((k) => k.id === "mark-intruder") })
    r.sniper.headshotChance = pv.chance
    r.sniper.headshotLabel = pv.parts.some((p) => p.label === "Headshot" && p.value === 25)
    const flat = board(["trueshot"], { trueshot: { row: 4, col: 9 }, [E0]: { row: 4, col: 7 }, [E1]: { row: 0, col: 0 }, [E2]: { row: 1, col: 0 } })
    const ft = pid(flat, "trueshot")
    const hs = cast(flat, ft, E0, "mark-intruder")
    r.sniper.headshotDmg = 40 - U(hs, E0).hp
    r.sniper.expectDmg = Math.round(U(flat, ft).attack * 1.5) + 1
    // Sniper's Watch: overwatch shot is Aimed (+20) - the log/roll shows it.
    const ow = cast(flat, ft, null, "overwatch")
    r.sniper.owAim = U(ow, ft).owAim
  }

  // 4 Grenadier (Artillery): Frag Grenade + Shred Round --------------------
  {
    const terrain = { "4-4": "tree", "3-5": "rock", "5-5": "log", "4-7": "rock" }
    const s = board(["the-tower"], { "the-tower": { row: 4, col: 9 }, [E0]: { row: 4, col: 5 }, [E1]: { row: 3, col: 6 }, [E2]: { row: 0, col: 0 } }, { terrain })
    const a = pid(s, "the-tower")
    const tiles = E.abilityTargets ? null : null
    const g = cast(s, a, "4-5", "piercing-beam")
    r.grenade = {
      hits: [40 - U(g, E0).hp, 40 - U(g, E1).hp, U(g, E2).hp],
      atk: U(s, a).attack,
      terrain: ["4-4", "3-5", "5-5"].map((k) => g.terrain[k]).join(","),
      shotEvent: (g.events || []).some((e) => e.kind === "shot" && e.fx === "arc"),
      tiles: tiles,
    }
    const rs = board(["the-tower"], { "the-tower": { row: 4, col: 8 }, [E0]: { row: 4, col: 5 }, [E1]: { row: 0, col: 0 }, [E2]: { row: 1, col: 0 } }, { terrain: { "4-6": "rock" }, rolls: true })
    const pv = E.attackPreview(rs, pid(rs, "the-tower"), E0, { skill: U(rs, pid(rs, "the-tower")).classSkills.find((k) => k.id === "piercing-beam") })
    r.grenade.ignoresCover = pv.cover === 0 && pv.parts.some((p) => /Arcing/.test(p.label))
    const sr = cast(rs, pid(rs, "the-tower"), E0, "suppression-fire")
    r.shred = { tile: sr.terrain["4-6"], hit: U(sr, E0).hp < 40, coverAfter: C.coverAgainst(sr, U(sr, E0).pos, U(sr, pid(sr, "the-tower")).pos) }
  }

  // 5 Hunter (Ranger): Ricochet (bounce ignores cover) + Hunter's Stride ----
  {
    const s = board(["bishops-slash"], { "bishops-slash": { row: 4, col: 8 }, [E0]: { row: 4, col: 6 }, [E1]: { row: 2, col: 5 }, [E2]: { row: 0, col: 0 } }, { terrain: { "2-6": "rock" } })
    const h = pid(s, "bishops-slash")
    const rc = cast(s, h, E0, "ricochet-shot")
    const atk = U(s, h).attack
    r.ricochet = { main: 40 - U(rc, E0).hp, bounce: 40 - U(rc, E1).hp, atk, event: (rc.events || []).some((e) => e.kind === "shot" && e.fx === "ricochet") }
    const rolls = { ...s, hitRolls: true }
    r.ricochet.bounceShot = C.hitChance(rolls, U(rolls, h), U(rolls, E1), "front", U(rolls, E0).pos, { ignoreCover: true, coverLabel: "Ricochet - cover doesn't help" }).cover
    r.ricochet.straightCover = C.hitChance(rolls, U(rolls, h), U(rolls, E1)).cover
    const mv = { ...rolls, units: rolls.units.map((u) => (u.id === h ? { ...u, moved: true } : u)) }
    r.stride = C.hitChance(mv, U(mv, h), U(mv, E0)).parts.some((p) => p.label === "On the move" && p.value === 10)
  }

  // 6 Suppressor (Trapper) + Suppressing Fire reaction shot + smoke ---------
  {
    const s = board(["snareclaw"], { snareclaw: { row: 4, col: 9 }, [E0]: { row: 4, col: 6 }, [E1]: { row: 0, col: 0 }, [E2]: { row: 1, col: 0 } })
    const t = pid(s, "snareclaw")
    const pin = cast(s, t, E0, "pinning-shot")
    r.pin = { root: U(pin, E0).root > 0, supp: U(pin, E0).suppressFire === 1, dmg: 40 - U(pin, E0).hp, half: Math.ceil(U(s, t).attack / 2) }
    // Suppressed enemy moves -> reaction shot.
    const sup = cast(s, t, E0, "suppress")
    const enemyTurn = { ...sup, phase: "enemy", units: sup.units.map((u) => (u.id === E0 ? { ...u, ap: 2, root: 0 } : u)) }
    const moved = E.moveUnit(enemyTurn, E0, { row: 4, col: 5 })
    r.supReaction = { moved: U(moved, E0).pos.col === 5, hurt: U(moved, E0).hp < 40, log: moved.log.some((l) => /suppressing fire catches/.test(l)), cleared: !U(moved, E0).suppressFire }
    const rolled = { ...sup, hitRolls: true }
    r.supPenalty = C.hitChance(rolled, U(rolled, E0), U(rolled, t)).parts.some((p) => p.label === "Suppressed" && p.value === -20)
    // Smoke Screen: 3x3 for 2 turns, thins out on later player turns.
    const sm = cast(s, t, "4-9", "smoke-screen")
    const n = Object.keys(sm.smoke || {}).length
    const t1 = E.endPlayerTurn(sm)
    const t2 = E.endPlayerTurn({ ...t1, phase: "player" })
    r.smokeScreen = { tiles: n, turns: sm.smoke["4-9"], after1: t1.smoke?.["4-9"], after2: t2.smoke?.["4-9"] || 0, coverInSmoke: C.coverAgainst(sm, { row: 4, col: 9 }, { row: 4, col: 5 }) }
  }

  // 7 Mages: Arcane Lance beam, Frozen Ground area, mana costs, focus -----
  {
    const terrain = { "4-6": "rock", "4-4": "rock", "4-2": "wall" }
    const s = board(["hexbreaker"], { hexbreaker: { row: 4, col: 8 }, [E0]: { row: 4, col: 5 }, [E1]: { row: 4, col: 3 }, [E2]: { row: 4, col: 1 } }, { terrain, mana: true })
    const h = pid(s, "hexbreaker")
    const lance = U(s, h).classSkills.find((k) => k.id === "arcane-lance")
    const b = cast(s, h, E0, "arcane-lance")
    r.beam = {
      tiles: R.beamTiles(s, U(s, h).pos, U(s, E0).pos, lance.range).map((p) => `${p.row}-${p.col}`).join(","),
      hit: [U(b, E0).hp < 40, U(b, E1).hp < 40, U(b, E2).hp === 40],
      mana: U(s, h).mana - U(b, h).mana,
      event: (b.events || []).some((e) => e.kind === "shot" && e.fx === "beam"),
    }
    const rolls = { ...s, hitRolls: true }
    const pv = E.attackPreview(rolls, h, E1, { skill: lance })
    r.beam.ignoresCover = pv.cover === 0 && pv.parts.some((p) => /Beam/.test(p.label))
    // Frozen Ground (Frostbinder): 2 to every enemy in the area, cover ignored.
    const f = board(["frostbind"], { frostbind: { row: 4, col: 9 }, [E0]: { row: 4, col: 6 }, [E1]: { row: 5, col: 6 }, [E2]: { row: 0, col: 0 } }, { terrain: { "4-7": "rock" } })
    const fg = cast(f, pid(f, "frostbind"), E0, "frozen-ground")
    r.frozen = [40 - U(fg, E0).hp, 40 - U(fg, E1).hp, U(fg, E0).chill || U(fg, E0).frozen ? 1 : 0]
    // Mage heavier mana + channel focus when holding still.
    const mm = board(["hexmother"], { hexmother: { row: 4, col: 10 }, [E0]: { row: 0, col: 0 }, [E1]: { row: 1, col: 0 }, [E2]: { row: 2, col: 0 } }, { mana: true })
    const hm = pid(mm, "hexmother")
    const spent = { ...mm, units: mm.units.map((u) => (u.id === hm ? { ...u, mana: 10 } : u)) }
    const ended = E.endPlayerTurn(spent)
    r.mage = { hexChainCost: U(mm, hm).classSkills.find((k) => k.id === "hex-chain").mana, focusGain: U(ended, hm).mana - 10, regen: M.regenFor(U(mm, hm)) }
  }

  // 8 Enemies: suppress / spot / volley - chosen by the AI, preview == real.
  {
    const kinds = Object.fromEntries(["drift-archer", "echo-archer", "blight-seer", "runewisp-acolyte"].map((d) => [d, EA.enemySkillTable()[d].map((k) => k.kind).join(",")]))
    r.enemyKits = kinds
    const mkEnemy = (defId, pos, extra = {}) => ({ ...E.createRealMatchupBattle(["bulwark-of-ages"], [defId], "tommy").units.find((u) => u.side === "enemy"), id: `x-${defId}`, pos, hp: 40, maxHp: 40, root: 2, ...extra })
    const scenario = (defId, heroPos, enemyPos, terrain, heroMana = null, enemyExtra = {}) => {
      let s = board(["bishops-slash"], { "bishops-slash": { row: heroPos.row, col: heroPos.col }, [E0]: { row: 0, col: 0, hp: 0 }, [E1]: { row: 1, col: 0, hp: 0 }, [E2]: { row: 2, col: 0, hp: 0 }, "player-commander": { row: 8, col: 11 } }, { terrain, rolls: true, mana: true })
      const enemy = mkEnemy(defId, enemyPos, enemyExtra)
      s = M.enableMana({ ...s, units: [...s.units.filter((u) => u.side === "player"), enemy] })
      // A drained hero (< 10 mana) isn't worth a Mana Drain - isolates the volley.
      if (heroMana != null) s = { ...s, units: s.units.map((u) => (u.side === "player" ? { ...u, mana: heroMana } : u)) }
      return { s, enemyId: enemy.id, heroId: pid(s, "bishops-slash") }
    }
    const run = (sc) => {
      const intents = E.previewEnemyIntents(sc.s)
      const real = E.endPlayerTurn(sc.s)
      return { intent: intents.find((i) => i.enemyId === sc.enemyId)?.intent, real }
    }
    // Suppress: rooted archer, hero out of attack reach but within 5.
    const a = scenario("drift-archer", { row: 4, col: 9 }, { row: 4, col: 4 }, {})
    const ra = run(a)
    r.enemySuppress = { kind: ra.intent?.skillKind, target: ra.intent?.targetId === a.heroId, applied: U(ra.real, a.heroId).suppressFire === 1 && U(ra.real, a.heroId).suppressSide === "enemy" }
    // The suppressed hero now shoots at -20%, and moving draws a shot.
    const heroTurn = ra.real
    r.enemySuppress.penalty = C.hitChance(heroTurn, U(heroTurn, a.heroId), U(heroTurn, a.enemyId)).parts.some((p) => p.label === "Suppressed")
    const mv = E.moveUnit(heroTurn, a.heroId, { row: 4, col: 8 })
    r.enemySuppress.reaction = mv.log.some((l) => /suppressing fire catches/.test(l))
    // Spot: hero hides behind a rock -> echo-archer Marks it.
    const b = scenario("echo-archer", { row: 4, col: 9 }, { row: 4, col: 4 }, { "4-8": "rock" })
    const rb = run(b)
    r.enemySpot = { kind: rb.intent?.skillKind, marked: U(rb.real, b.heroId).mark > 0 }
    r.enemySpot.uncovered = C.hitChance(rb.real, U(rb.real, b.enemyId), U(rb.real, b.heroId)).cover === 0
    // Volley: hero in full cover within reach -> blight-seer lobs over it
    // rather than shooting straight into the rock (its hex is recharging).
    const c = scenario("blight-seer", { row: 4, col: 8 }, { row: 4, col: 5 }, { "4-7": "rock" }, 5, { skillCd: { hex: 9 } })
    const rc = run(c)
    r.enemyVolley = { kind: rc.intent?.skillKind, hurt: U(rc.real, c.heroId).hp < U(c.s, c.heroId).hp, log: rc.real.log.some((l) => /Blight Mortar/.test(l)) }
    // Preview == real: what the telegraph said happened, and a re-run is identical.
    const again = E.endPlayerTurn(c.s)
    r.previewReal = {
      suppress: ra.intent?.kind === "skill" && r.enemySuppress.applied,
      spot: rb.intent?.kind === "skill" && r.enemySpot.marked,
      volley: rc.intent?.kind === "skill" && r.enemyVolley.log,
      repro: JSON.stringify(again.units.map((u) => [u.id, u.hp, u.mana])) === JSON.stringify(rc.real.units.map((u) => [u.id, u.hp, u.mana])),
    }
    // Ranged enemies suffer point blank too.
    const pbE = scenario("drift-archer", { row: 4, col: 5 }, { row: 4, col: 4 }, {})
    r.enemyPointBlank = C.hitChance(pbE.s, U(pbE.s, pbE.enemyId), U(pbE.s, pbE.heroId)).parts.some((p) => /Point blank/.test(p.label))
  }
  return r
})

const f = eng.familyOk
check("families: archetype classes shoot from 3+ and carry Aim + Suppressing Fire", f.archetypesRanged, eng.family)
check("families: all 7 mage classes shoot from 3+ and read as Mage", f.magesRanged, eng.family)
check("families: archetype names Sniper/Grenadier/Hunter/Hunter/Suppressor", f.names === "Sniper,Grenadier,Hunter,Hunter,Suppressor", f.names)
check("families: melee heroes get no ranged kit; every ranged hero does", f.meleeNoKit && f.everyRangedHasKit, eng.family)
check("toolkit: every ranged hero can Aim (1 AP, 10 mana, cd 1) and Suppress (1 AP, 15 mana, cd 3)", eng.toolkit.length >= 13 && eng.toolkit.every((t) => t.aim && t.sup), eng.toolkit)
check("aim: +20% to the next shot, spent by the shot", eng.aim.after === eng.aim.before + 20 && /Aimed/.test(eng.aim.parts) && eng.aim.spent === 0, eng.aim)
check("point blank: a ranged hero shooting an adjacent enemy gets -25%, melee doesn't", eng.pointBlank.ranged === 60 && eng.pointBlank.melee === 85, eng.pointBlank)
check("mark: a Marked enemy counts as uncovered", eng.mark.cover === 0 && eng.mark.label, eng.mark)
check("smoke: half cover from every side vs ranged, none vs melee, never flanked", eng.smoke.cover === 1 && eng.smoke.adjacent === 0 && !eng.smoke.flanked, eng.smoke)
check("sniper: Deadeye no range loss standing still; +2 range from high ground (shoots 6 tiles)", eng.sniper.range === 6 && eng.sniper.canShoot && eng.sniper.base === 85 && eng.sniper.movedBase === 65, eng.sniper)
check("sniper: Headshot +25% to hit and x1.5 damage; Sniper's Watch is Aimed", eng.sniper.headshotLabel && eng.sniper.headshotDmg === eng.sniper.expectDmg && eng.sniper.owAim === 20, eng.sniper)
check("grenadier: Frag Grenade hits every enemy in the 3x3 and shreds its cover", eng.grenade.hits[0] > 0 && eng.grenade.hits[1] > 0 && eng.grenade.hits[2] === 40 && eng.grenade.terrain === "stump,rubble,path" && eng.grenade.shotEvent, eng.grenade)
check("grenadier: the grenade ignores cover (arcing)", eng.grenade.ignoresCover, eng.grenade)
check("grenadier: Shred Round turns the rock to rubble (full -> half) then hits", eng.shred.tile === "rubble" && eng.shred.hit && eng.shred.coverAfter === 1, eng.shred)
check("hunter: Ricochet hits the target, then bounces for half to a second enemy", eng.ricochet.main === eng.ricochet.atk && eng.ricochet.bounce > 0, eng.ricochet)
// (+1 = Hunter's Stride at 3+ tiles)
check("hunter: the bounce ignores cover (straight shot would face full cover)", eng.ricochet.bounce === Math.ceil(eng.ricochet.atk / 2) + 1 && eng.ricochet.bounceShot === 0 && eng.ricochet.straightCover === 2 && eng.ricochet.event, eng.ricochet)
check("hunter: Hunter's Stride +10% after moving", eng.stride, eng.stride)
check("suppressor: Pinning Shot = half damage + Root + Suppressed", eng.pin.root && eng.pin.supp && eng.pin.dmg === eng.pin.half, eng.pin)
check("suppress: a suppressed enemy that moves eats a reaction shot; -20% to hit while suppressed", eng.supReaction.moved && eng.supReaction.hurt && eng.supReaction.log && eng.supReaction.cleared && eng.supPenalty, eng.supReaction)
check("smoke screen: 3x3 smoke for 2 turns that thins out, half cover inside", eng.smokeScreen.tiles === 9 && eng.smokeScreen.turns === 2 && eng.smokeScreen.after1 === 1 && eng.smokeScreen.after2 === 0 && eng.smokeScreen.coverInSmoke === 1, eng.smokeScreen)
check("mage: Arcane Lance hits every enemy on the line, a wall stops it, 25 mana", eng.beam.hit.every(Boolean) && eng.beam.tiles === "4-7,4-6,4-5,4-4,4-3" && eng.beam.mana === 25 && eng.beam.event, eng.beam)
check("mage: the beam ignores cover", eng.beam.ignoresCover, eng.beam)
check("mage: Frozen Ground deals 2 to each enemy in the area (cover ignored) + chill", eng.frozen[0] === 2 && eng.frozen[1] === 2 && eng.frozen[2] === 1, eng.frozen)
check("mage: heavier mana (Hex Chain 25) and channel focus when holding still", eng.mage.hexChainCost === 25 && eng.mage.focusGain >= 5 + eng.mage.regen, eng.mage)
check("enemies: archers/casters carry suppress / spot / volley", /suppress/.test(eng.enemyKits["drift-archer"]) && /spot/.test(eng.enemyKits["echo-archer"]) && /volley/.test(eng.enemyKits["blight-seer"]) && /volley/.test(eng.enemyKits["runewisp-acolyte"]), eng.enemyKits)
check("enemies: an archer suppresses a hero out of reach - -20% to hit, moving draws a shot", eng.enemySuppress.kind === "suppress" && eng.enemySuppress.target && eng.enemySuppress.applied && eng.enemySuppress.penalty && eng.enemySuppress.reaction, eng.enemySuppress)
check("enemies: an archer spots (Marks) a hero hiding in cover - its cover stops counting", eng.enemySpot.kind === "spot" && eng.enemySpot.marked && eng.enemySpot.uncovered, eng.enemySpot)
check("enemies: a caster lobs a volley over a hero's full cover", eng.enemyVolley.kind === "volley" && eng.enemyVolley.hurt && eng.enemyVolley.log, eng.enemyVolley)
check("enemies: preview == real for the new tools (+ reproducible)", Object.values(eng.previewReal).every(Boolean), eng.previewReal)
check("enemies: ranged enemies take the point-blank penalty too", eng.enemyPointBlank, eng.enemyPointBlank)

// ---------- UI ----------
const setBattle = (fn) =>
  page.evaluate(async (src) => {
    const f = window.__xf("HeartwoodTactics")
    const hook = f.memoizedState.next
    // eslint-disable-next-line no-new-func
    hook.queue.dispatch(new Function("cur", src)(hook.memoizedState))
    await new Promise((res) => setTimeout(res, 300))
  }, fn)
const readBattle = () => page.evaluate(() => window.__xf("TacticsBoard")?.memoizedProps.battle)
await page.evaluate(async () => {
  const E = await import("/src/services/heartwood/tacticsEngine.js")
  const M = await import("/src/services/heartwood/tacticsMana.js")
  let s = E.createTacticsBattle("default", ["trueshot", "hexbreaker", "the-tower", "snareclaw"])
  const place = { trueshot: [4, 11], hexbreaker: [1, 9], "the-tower": [7, 10], snareclaw: [6, 11], "player-commander": [8, 11] }
  const enemies = s.units.filter((u) => u.side === "enemy")
  const epos = [[4, 5], [1, 5], [1, 3]]
  s = {
    ...s,
    hitRolls: true,
    terrain: { "4-6": "rock", "4-11": "high", "1-6": "log" },
    wallHp: {},
    objHp: {},
    units: s.units.map((u) => {
      if (u.side === "player") {
        const p = place[u.defId] || place[u.id]
        return p ? { ...u, pos: { row: p[0], col: p[1] } } : u
      }
      const i = enemies.indexOf(u)
      return { ...u, pos: { row: epos[i][0], col: epos[i][1] }, hp: 40, maxHp: 40, enemySkills: [] }
    }),
  }
  window.__rb = M.enableMana(s)
})
await setBattle("return window.__rb")
const b0 = await readBattle()
const id = (defId) => b0.units.find((u) => u.defId === defId && u.side === "player").id
const enemyAt = (row, col) => b0.units.find((u) => u.side === "enemy" && u.pos.row === row && u.pos.col === col).id

// Sniper aims, then hovers a target in full cover.
await page.locator(`.hwt-token[data-unit-id="${id("trueshot")}"]`).click()
await page.waitForTimeout(200)
const archetypeText = await page.locator(".hwt-skill-bar .hwt-archetype").textContent().catch(() => null)
const kitButtons = await page.locator('.hwt-universal-btn[data-action^="ranged-"]').count()
await page.locator('.hwt-universal-btn[data-action="ranged-aim"]').click()
await page.waitForTimeout(350)
const aimBadge = await page.locator(`.hwt-token[data-unit-id="${id("trueshot")}"] .hwt-ranged-badge[data-status="aimed"]`).count()
await page.locator('.hwt-cell[data-cell="4-5"]').hover()
await page.waitForTimeout(300)
const sniperUi = await page.evaluate(() => {
  const b = document.querySelector('.hwt-cell[data-cell="4-5"] .hwt-hit-badge')
  return { text: b?.textContent || null, hit: Number(b?.dataset.hit), panel: document.querySelector(".hwt-hit-panel")?.textContent || "" }
})
const sniperExpect = await page.evaluate(async ([a, t]) => {
  const E = await import("/src/services/heartwood/tacticsEngine.js")
  return E.attackPreview(window.__xf("TacticsBoard").memoizedProps.battle, a, t).chance
}, [id("trueshot"), enemyAt(4, 5)])
check("ui: archetype tag on the skill bar + Aim/Suppress buttons for a ranged hero", archetypeText && /Sniper/.test(archetypeText) && kitButtons === 2, { archetypeText, kitButtons })
check("ui: Aim shows an aim icon and the hit badge includes Aimed +20 / Full cover (matches engine)", aimBadge === 1 && sniperUi.hit === sniperExpect && /Aimed \+20/.test(sniperUi.panel) && /Half cover -20/.test(sniperUi.panel) && /Deadeye/.test(sniperUi.panel), { aimBadge, sniperUi, sniperExpect })
await page.screenshot({ path: `${SHOT_DIR}/ranged_sniper_aim.png` })

// Mage beam preview.
await page.mouse.move(5, 5)
await page.locator(`.hwt-token[data-unit-id="${id("hexbreaker")}"]`).click({ force: true })
await page.waitForTimeout(200)
await page.locator('.hwt-skill-btn[data-skill-id="arcane-lance"]').click()
await page.waitForTimeout(200)
await page.locator('.hwt-cell[data-cell="1-5"]').hover()
await page.waitForTimeout(300)
const beamCells = await page.evaluate(() => [...document.querySelectorAll('.hwt-cell[data-shot-preview="beam"]')].map((c) => c.dataset.cell))
const beamPanel = await page.evaluate(() => document.querySelector(".hwt-hit-panel")?.textContent || "")
check("ui: Arcane Lance hover previews the beam line tiles; badge shows the beam ignores cover", beamCells.sort().join(",") === "1-4,1-5,1-6,1-7,1-8" && /Beam - cover doesn't help/.test(beamPanel), { beamCells, beamPanel })
await page.screenshot({ path: `${SHOT_DIR}/ranged_mage_beam.png` })
// Cast it: a beam animation runs.
await page.locator('.hwt-cell[data-cell="1-5"]').click()
let beamFx = false
for (let i = 0; i < 20 && !beamFx; i++) {
  beamFx = (await page.locator(".hwt-shot-beam").count()) > 0
  if (!beamFx) await page.waitForTimeout(40)
}
check("ui: casting the beam plays a beam animation", beamFx, beamFx)
await page.waitForTimeout(900)

// Grenade blast preview (tile skill).
await page.locator(`.hwt-token[data-unit-id="${id("the-tower")}"]`).click({ force: true })
await page.waitForTimeout(200)
await page.locator('.hwt-skill-btn[data-skill-id="piercing-beam"]').click()
await page.waitForTimeout(200)
await page.locator('.hwt-cell[data-cell="4-7"]').hover()
await page.waitForTimeout(250)
const blastCells = await page.locator('.hwt-cell[data-shot-preview="grenade"]').count()
check("ui: Frag Grenade hover previews the 3x3 blast", blastCells === 9, blastCells)
await page.keyboard.press("Escape").catch(() => {})
await page.mouse.move(5, 5)

// Smoke tiles + suppressed / marked icons drawn.
await setBattle(`
  const tr = cur.units.find((u) => u.defId === "snareclaw")
  const e = cur.units.find((u) => u.side === "enemy" && u.hp > 0)
  const smoke = {}
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) smoke[(6 + dr) + "-" + (10 + dc)] = 2
  return { ...cur, smoke, units: cur.units.map((u) => (u.id === e.id ? { ...u, suppressFire: 1, suppressBy: tr.id, suppressSide: "player", mark: 2, markBonus: 2 } : u)) }
`)
const ui2 = await page.evaluate(() => ({
  smoke: document.querySelectorAll(".hwt-cell[data-smoke] .hwt-smoke svg").length,
  smokeTitle: document.querySelector('.hwt-cell[data-cell="6-10"]')?.title || "",
  supp: document.querySelectorAll('.hwt-ranged-badge[data-status="suppress"]').length,
  mark: document.querySelectorAll('.hwt-ranged-badge[data-status="marked"]').length,
  suppTitle: document.querySelector('.hwt-ranged-badge[data-status="suppress"]')?.title || "",
}))
check("ui: smoke clouds drawn on the 9 smoke tiles with a tooltip", ui2.smoke === 9 && /Smoke/.test(ui2.smokeTitle), ui2)
check("ui: suppressed + marked status icons with tooltips", ui2.supp === 1 && ui2.mark === 1 && /-20% to hit/.test(ui2.suppTitle), ui2)
await page.screenshot({ path: `${SHOT_DIR}/ranged_smoke_status.png` })

// "hero" wording in the new player-facing text.
const words = await page.evaluate(async () => {
  const R = await import("/src/services/heartwood/tacticsRanged.js")
  return R.RANGED_TOOLKIT.map((k) => k.text).join(" ") + Object.values(R.ARCHETYPES).map((a) => a.what).join(" ")
})
check("text: no 'unit' wording in the new player-facing text", !/\bunits?\b/i.test(words), words)

const failed = checks.filter((c) => !c.ok)
for (const c of checks) console.log(`${c.ok ? "PASS" : "FAIL"} ${c.name}${c.ok ? "" : ` ${JSON.stringify(c.detail).slice(0, 900)}`}`)
console.log(`page errors: ${errs.length}${errs.length ? ` ${errs.slice(0, 3).join(" | ")}` : ""}`)
console.log(`${checks.length - failed.length}/${checks.length} checks passed`)
await browser.close()
process.exit(failed.length || errs.length ? 1 : 0)
