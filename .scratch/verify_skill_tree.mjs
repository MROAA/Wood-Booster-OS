// Skill tree via level-ups: every class skill (38 classes) + every
// signature kind has 2 upgrade branches; a sample of branches verified
// exactly on synthetic boards; the level-up choice (2 branches of one
// skill + a stat perk) is seeded + exclusive + persists; applied in the
// next real tactics fight; UI (tree view, ★ on the skill bar, card tooltip).
import { chromium } from "playwright"

const PORT = process.env.PORT || 5445
const SHOTS = process.env.SHOTS || "/tmp"
const browser = await chromium.launch()
const errs = []
const out = { errors: [] }
const page = await (await browser.newContext({ viewport: { width: 1600, height: 1000 } })).newPage()
page.on("pageerror", (e) => errs.push(String(e)))
page.on("console", (m) => m.type() === "error" && !/ERR_CONNECTION_REFUSED/.test(m.text()) && errs.push(m.text()))
await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })

const r = await page.evaluate(async () => {
  const E = await import("/src/services/heartwood/tacticsEngine.js")
  const TC = await import("/src/services/heartwood/tacticsClasses.js")
  const TA = await import("/src/services/heartwood/tacticsAbilities.js")
  const rt = await import("/src/services/heartwood/runEngine.js")
  const lv = await import("/src/services/heartwood/unitLevels.js")
  const { buildRunTacticsBattle } = await import("/src/services/heartwood/tacticsRealMatchup.js")
  const { UNITS } = await import("/src/data/heartwood/units.js")
  const { CLASSES, CLASS_IDS } = await import("/src/data/heartwood/classes.js")
  const fails = []
  const res = {}
  const ok = (cond, msg, data) => {
    if (!cond) fails.push(data === undefined ? msg : `${msg} ${JSON.stringify(data)}`)
  }

  // --- A: data - every skill of all 38 classes + every signature kind ---------
  const FX = { t: 1, self: 1, splash: 1, aura: 1, near: 1, pet: 1, kill: 1, tile: 1 }
  const HANDLER_PARAMS = new Set(["hits", "owRoot", "poison", "root"])
  let skills = 0
  const badData = []
  for (const id of CLASS_IDS) {
    for (const sk of CLASSES[id].skills) {
      skills++
      for (const b of ["A", "B"]) {
        const up = sk.upgrades?.[b]
        if (!up || !up.name || !up.text || !(up.patch || up.fx)) badData.push(`${sk.id}:${b}`)
        for (const k of Object.keys(up?.patch || {})) if (!(k in sk) && !HANDLER_PARAMS.has(k)) badData.push(`${sk.id}:${b}:patch.${k}`)
        for (const k of Object.keys(up?.fx || {})) if (!FX[k]) badData.push(`${sk.id}:${b}:fx.${k}`)
      }
      if (sk.upgrades?.A?.name === sk.upgrades?.B?.name) badData.push(`${sk.id}: same names`)
    }
  }
  const kinds = Object.keys(TA.SIGNATURE_UPGRADES)
  for (const k of kinds) for (const b of ["A", "B"]) if (!TA.SIGNATURE_UPGRADES[k][b]?.name || !TA.SIGNATURE_UPGRADES[k][b]?.text) badData.push(`sig ${k}:${b}`)
  // Every recruitable unit: tree = its class skills + its signature.
  const badTree = []
  const sigKinds = new Set()
  for (const def of Object.values(UNITS)) {
    if (def.summonOnly) continue
    const u = E.createTacticsBattle("default", [def.id]).units.find((x) => x.defId === def.id)
    const tree = lv.skillTreeFor(def)
    sigKinds.add(u.ability?.kind)
    const want = u.classSkills.length + (u.ability ? 1 : 0)
    if (tree.length !== want || !tree.every((s) => s.upgrades?.A && s.upgrades?.B)) badTree.push(def.id)
  }
  res.A = { classes: CLASS_IDS.length, skills, kinds: kinds.length, unitKinds: [...sigKinds] }
  ok(CLASS_IDS.length === 38 && skills >= 76 && badData.length === 0, "every class skill has 2 valid branches", badData)
  ok([...sigKinds].every((k) => kinds.includes(k)), "every signature kind in use has branches", [...sigKinds])
  ok(badTree.length === 0, "every unit's skill tree = class skills + signature, all with A/B", badTree.slice(0, 10))

  // --- synthetic board helpers (same shape as verify_classes_a) ---------------
  const E0 = "enemy-ironmaw-0"
  const E1 = "enemy-sapling-attendant-1"
  const E2 = "enemy-hoardling-2"
  const C = "player-commander"
  function board(squad, place, ups = {}) {
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
        let unit = { ...u, block: 0, ...base, ...patch, pos: { row, col } }
        const my = ups[u.defId]
        if (my) {
          unit = TC.applySkillUpgrades(unit, my)
          if (my.signature) unit = { ...unit, ability: TA.upgradeAbility(unit.ability, my.signature) }
        }
        return unit
      }),
    }
    return s
  }
  const pid = (s, defId) => s.units.find((u) => u.defId === defId && u.side === "player").id
  const U = (s, id) => s.units.find((u) => u.id === id)
  const dmg = (a, b, id) => U(a, id).hp - U(b, id).hp
  const labels = (s) => (s.events || []).filter((e) => e.kind === "reaction").map((e) => e.label)
  const cast = (s, id, target, skill) => E.castAbility(s, id, target, skill)

  // --- B: every branch of every class casts cleanly (smoke) ------------------
  const byClass = {}
  for (const def of Object.values(UNITS)) if (!def.summonOnly && def.classId && !byClass[def.classId]) byClass[def.classId] = def.id
  let casts = 0
  const castErr = []
  for (const cid of CLASS_IDS) {
    const defId = byClass[cid]
    if (!defId) continue
    for (const b of ["A", "B"]) {
      const allUps = Object.fromEntries(CLASSES[cid].skills.map((sk) => [sk.id, b]))
      allUps.signature = b
      const s = board([defId, "the-fool"], { [defId]: { row: 4, col: 7 }, "the-fool": { row: 4, col: 8 }, [E0]: { row: 4, col: 6 }, [E1]: { row: 3, col: 5 } }, { [defId]: allUps })
      const me = pid(s, defId)
      for (const sk of U(s, me).classSkills) {
        try {
          if (!sk.upgrade || sk.upgrade.branch !== b) throw new Error("not upgraded")
          if (!TC.classSkillUsable(s, U(s, me), sk)) continue
          const tgt = sk.target === "tile" ? TC.classSkillTiles(s, me, sk)[0] : sk.target === "self" ? null : TC.classSkillTargets(s, me, sk)[0]
          if (sk.target !== "self" && !tgt) continue
          const next = cast(s, me, sk.target === "tile" ? `${tgt.row}-${tgt.col}` : tgt?.id || null, sk.id)
          if (next === s) throw new Error("cast refused")
          E.previewEnemyIntents(next)
          casts++
        } catch (e) {
          castErr.push(`${cid}/${sk.id}/${b}: ${e.message}`)
        }
      }
    }
  }
  res.B = { casts, classes: Object.keys(byClass).length }
  ok(castErr.length === 0 && casts >= 120, "every upgraded class skill casts cleanly", { casts, castErr: castErr.slice(0, 8) })

  // --- C: sample branches - exact effects vs the base skill ------------------
  const sample = {}
  // 1-2 Guardian Shield Wall: Bastion +5 self / Rallying Wall taunts.
  {
    const place = { "bulwark-of-ages": { row: 4, col: 7 }, "the-fool": { row: 4, col: 8 }, [E0]: { row: 4, col: 3 }, [E1]: { row: 8, col: 0 } }
    const base = board(["bulwark-of-ages", "the-fool"], place)
    const g = pid(base, "bulwark-of-ages")
    const f = pid(base, "the-fool")
    const bA = cast(board(["bulwark-of-ages", "the-fool"], place, { "bulwark-of-ages": { "shield-wall": "A" } }), g, null, "shield-wall")
    const bB = cast(board(["bulwark-of-ages", "the-fool"], place, { "bulwark-of-ages": { "shield-wall": "B" } }), g, null, "shield-wall")
    const b0 = cast(base, g, null, "shield-wall")
    sample.shieldWall = { base: U(b0, g).block, A: U(bA, g).block, allyA: U(bA, f).block, tauntB: U(bB, g).shoutTurn === bB.turn, tauntBase: U(b0, g).shoutTurn === b0.turn }
    ok(U(b0, g).block === 3 && U(bA, g).block === 5 && U(bA, f).block === 2 && sample.shieldWall.tauntB && !sample.shieldWall.tauntBase && labels(bB).includes("Taunt!"), "Shield Wall A Bastion / B Rallying Wall", sample.shieldWall)
    // Taunt changes the enemy's real plan: the preview's target is the Guardian.
    const tB = E.previewEnemyIntents({ ...bB, units: bB.units.map((u) => (u.id === E0 ? { ...u, pos: { row: 4, col: 5 } } : u)) }).find((i) => i.enemyId === E0)?.intent
    sample.shieldWall.previewTarget = tB?.targetId
    ok(!tB?.targetId || tB.targetId === g, "Rallying Wall: taunted enemy goes for the Guardian", tB)
  }
  // 3-4 Juggernaut Charge: A stuns (preview shows stunned), B reaches 6.
  {
    const place = { "rooks-charge": { row: 4, col: 10 }, [E0]: { row: 4, col: 6 }, [E1]: { row: 8, col: 0 } }
    const sA = board(["rooks-charge"], place, { "rooks-charge": { charge: "A" } })
    const j = pid(sA, "rooks-charge")
    const cA = cast(sA, j, E0, "charge")
    const c0 = cast(board(["rooks-charge"], place), j, E0, "charge")
    const prev = E.previewEnemyIntents(cA).find((i) => i.enemyId === E0)?.intent
    const real = E.endPlayerTurn(cA)
    const far = { "rooks-charge": { row: 4, col: 11 }, [E0]: { row: 4, col: 5 }, [E1]: { row: 8, col: 0 } }
    const canBase = TC.classSkillTargets(board(["rooks-charge"], far), j, U(board(["rooks-charge"], far), j).classSkills.find((s) => s.id === "charge")).some((u) => u.id === E0)
    const sB = board(["rooks-charge"], far, { "rooks-charge": { charge: "B" } })
    const cB = cast(sB, j, E0, "charge")
    sample.charge = { stun: U(cA, E0).stun, baseStun: U(c0, E0).stun || 0, sameDmg: dmg(sA, cA, E0) === dmg(sA, c0, E0), prev: prev?.kind, realMoved: U(real, E0).pos.col === 6, canBase, bPos: U(cB, j).pos, bDmg: dmg(sB, cB, E0) }
    ok(sample.charge.stun === 1 && sample.charge.baseStun === 0 && sample.charge.sameDmg && prev?.kind === "stunned" && sample.charge.realMoved, "Charge A Stunning Impact (preview exact)", sample.charge)
    ok(!canBase && U(cB, j).pos.col === 6 && dmg(sB, cB, E0) === U(sB, j).attack + 5, "Charge B Long Charge reaches 6 tiles", sample.charge)
  }
  // 5 Striker Double Strike A Flurry: 3 hits at 45% (+rhythm 1+2).
  {
    const place = { "the-hierophant": { row: 4, col: 7 }, [E0]: { row: 4, col: 6 }, [E1]: { row: 8, col: 0 } }
    const s = board(["the-hierophant"], place, { "the-hierophant": { "double-strike": "A" } })
    const st = pid(s, "the-hierophant")
    const a = U(s, st).attack
    const d = cast(s, st, E0, "double-strike")
    sample.flurry = { d: dmg(s, d, E0), want: 3 * Math.ceil(a * 0.45) + 3, hits: (d.log || []).filter((l) => l.includes("Double Strike hits")).length }
    ok(sample.flurry.d === sample.flurry.want && sample.flurry.hits === 3, "Double Strike A Flurry: 3 hits", sample.flurry)
  }
  // 6 Striker Exploit Opening B: target Exposed 1.
  {
    const s = board(["the-hierophant"], { "the-hierophant": { row: 4, col: 7 }, [E0]: { row: 4, col: 6 }, [E1]: { row: 8, col: 0 } }, { "the-hierophant": { "exploit-opening": "B" } })
    const st = pid(s, "the-hierophant")
    const c = cast(s, st, E0, "exploit-opening")
    sample.openWound = U(c, E0).exposed
    ok(sample.openWound === 1, "Exploit Opening B Open Wound: Exposed", sample.openWound)
  }
  // 7 Assassin Execution B: works at 45% HP (base doesn't).
  {
    const place = { duskclaw: { row: 4, col: 7 }, [E0]: { row: 4, col: 6, hp: 18 }, [E1]: { row: 8, col: 0 } }
    const s0 = board(["duskclaw"], place)
    const sB = board(["duskclaw"], place, { duskclaw: { execution: "B" } })
    const as = pid(s0, "duskclaw")
    const a = U(s0, as).attack
    sample.merciless = { base: dmg(s0, cast(s0, as, E0, "execution"), E0), B: dmg(sB, cast(sB, as, E0, "execution"), E0), a }
    ok(sample.merciless.base === a && sample.merciless.B === Math.min(18, Math.round(a * 2.5)), "Execution B Merciless: below 50%", sample.merciless)
  }
  // 8 Executioner Execute B: a kill heals 3.
  {
    const s = board(["culler"], { culler: { row: 4, col: 7, hp: 5 }, [E0]: { row: 4, col: 6, hp: 1 }, [E1]: { row: 8, col: 0 } }, { culler: { execute: "B" } })
    const x = pid(s, "culler")
    const c = cast(s, x, E0, "execute")
    sample.reaper = [U(s, x).hp, U(c, x).hp, U(c, E0).hp]
    ok(U(c, E0).hp === 0 && U(c, x).hp === Math.min(U(s, x).maxHp, 8), "Execute B Reaper's Toll: kill heals 3", sample.reaper)
  }
  // 9 Healer Group Renewal B: everyone healed also +1 Block.
  {
    // Gentle Hands already gives +1 Block per heal; Blessed Circle adds 1 more.
    const place = { "the-high-priestess": { row: 4, col: 7 }, "the-fool": { row: 4, col: 8 }, [E0]: { row: 0, col: 3 }, [E1]: { row: 8, col: 0 } }
    const s0 = board(["the-high-priestess", "the-fool"], place)
    const s = board(["the-high-priestess", "the-fool"], place, { "the-high-priestess": { "group-renewal": "B" } })
    const h = pid(s, "the-high-priestess")
    const f = pid(s, "the-fool")
    const c = cast(s, h, null, "group-renewal")
    const c0 = cast(s0, h, null, "group-renewal")
    sample.circle = { B: [U(c, h).block, U(c, f).block], base: [U(c0, h).block, U(c0, f).block] }
    ok(U(c, h).block === U(c0, h).block + 1 && U(c, f).block === U(c0, f).block + 1, "Group Renewal B Blessed Circle: +1 Block", sample.circle)
  }
  // 10 Medic Emergency Stim B: ally +1 attack for the fight.
  {
    const s = board(["mosswalker", "the-fool"], { mosswalker: { row: 4, col: 7 }, "the-fool": { row: 4, col: 8 }, [E0]: { row: 0, col: 3 }, [E1]: { row: 8, col: 0 } }, { mosswalker: { "emergency-stim": "B" } })
    const m = pid(s, "mosswalker")
    const f = pid(s, "the-fool")
    const c = cast(s, m, f, "emergency-stim")
    sample.rageStim = [U(s, f).attack, U(c, f).attack, U(c, f).ap]
    ok(U(c, f).attack === U(s, f).attack + 1 && U(c, f).ap === U(s, f).ap + 1, "Emergency Stim B Rage Stim: +1 attack", sample.rageStim)
  }
  // 11 Controller Silence B: 3 turns.
  {
    const s = board(["the-magician"], { "the-magician": { row: 4, col: 7 }, [E0]: { row: 4, col: 6 }, [E1]: { row: 8, col: 0 } }, { "the-magician": { silence: "B" } })
    const c = cast(s, pid(s, "the-magician"), E0, "silence")
    sample.deepSilence = U(c, E0).silenced
    ok(sample.deepSilence === 3, "Silence B Deep Silence: 3 turns", sample.deepSilence)
  }
  // 12 Rootweaver Growing Wall B: enemies next to the wall take 2.
  {
    const place = { thornwisp: { row: 4, col: 8 }, [E0]: { row: 4, col: 5 }, [E1]: { row: 8, col: 0 } }
    const s0 = board(["thornwisp"], place)
    const sB = board(["thornwisp"], place, { thornwisp: { "growing-wall": "B" } })
    const w = pid(s0, "thornwisp")
    const w0 = cast(s0, w, "4-6", "growing-wall")
    const wB = cast(sB, w, "4-6", "growing-wall")
    sample.bramble = { base: dmg(s0, w0, E0), B: dmg(sB, wB, E0), rootB: U(wB, E0).root, wall: wB.terrain["4-6"] }
    ok(sample.bramble.base === 0 && sample.bramble.B === 2 && sample.bramble.rootB > 0 && sample.bramble.wall === "wall", "Growing Wall B Bramble Wall: 2 damage", sample.bramble)
  }
  // 13 Trapper (ranged rework: Suppressor) Pinning Shot A Heavy Pin: full damage
  // (Poison Mine left the Trapper's kit).
  {
    const place = { snareclaw: { row: 4, col: 9 }, [E0]: { row: 4, col: 6 }, [E1]: { row: 8, col: 0 } }
    const run = (ups) => {
      const s = board(["snareclaw"], place, ups)
      const t = pid(s, "snareclaw")
      const m = cast(s, t, E0, "pinning-shot")
      return { dmg: U(s, E0).hp - U(m, E0).hp, atk: U(s, t).attack, root: U(m, E0).root || 0 }
    }
    sample.stickyMine = { base: run({}), A: run({ snareclaw: { "pinning-shot": "A" } }) }
    ok(sample.stickyMine.base.dmg === Math.ceil(sample.stickyMine.base.atk / 2) && sample.stickyMine.A.dmg === sample.stickyMine.A.atk && sample.stickyMine.A.root > 0, "Pinning Shot A Heavy Pin: full damage", sample.stickyMine)
  }
  // 14 Summoner Summon Spirit B: the Spirit acts right away (1 AP); A +4 HP.
  {
    const place = { mycelist: { row: 4, col: 8 }, [E0]: { row: 0, col: 3 }, [E1]: { row: 8, col: 0 } }
    const pet = (s) => s.units.find((u) => u.ownerId && u.hp > 0 && !u.structure)
    const s0 = board(["mycelist"], place)
    const m = pid(s0, "mycelist")
    const p0 = pet(cast(s0, m, null, "summon-spirit"))
    const pA = pet(cast(board(["mycelist"], place, { mycelist: { "summon-spirit": "A" } }), m, null, "summon-spirit"))
    const pB = pet(cast(board(["mycelist"], place, { mycelist: { "summon-spirit": "B" } }), m, null, "summon-spirit"))
    sample.spirit = { base: [p0.ap, p0.maxHp], A: [pA.ap, pA.maxHp], B: [pB.ap, pB.maxHp] }
    ok(p0.ap === 0 && pB.ap === 1 && pA.maxHp === p0.maxHp + 4 && pA.hp === p0.hp + 4 && pB.maxHp === p0.maxHp, "Summon Spirit A Alpha / B Eager", sample.spirit)
  }
  // 15 Ritualist Complete Ritual A: 4 per stack.
  {
    const place = { abyssong: { row: 4, col: 8, ritual: 2 }, [E0]: { row: 4, col: 6 }, [E1]: { row: 8, col: 0 } }
    const s0 = board(["abyssong"], place)
    const sA = board(["abyssong"], place, { abyssong: { "complete-ritual": "A" } })
    const r = pid(s0, "abyssong")
    sample.rite = { base: dmg(s0, cast(s0, r, null, "complete-ritual"), E0), A: dmg(sA, cast(sA, r, null, "complete-ritual"), E0) }
    ok(sample.rite.base === 6 && sample.rite.A === 8, "Complete Ritual A Wrathful Rite: 4 per stack", sample.rite)
  }
  // 16 Sentinel Overwatch A: the shot also Roots.
  {
    const place = { trueshot: { row: 4, col: 9 }, [E0]: { row: 4, col: 4 }, [E1]: { row: 0, col: 0 } }
    const sA = board(["trueshot"], place, { trueshot: { overwatch: "A" } })
    const t = pid(sA, "trueshot")
    const ow = { ...cast(sA, t, null, "overwatch"), phase: "enemy" }
    const mv = E.moveUnit(ow, E0, { row: 4, col: 6 })
    const ow0 = { ...cast(board(["trueshot"], place), t, null, "overwatch"), phase: "enemy" }
    const mv0 = E.moveUnit(ow0, E0, { row: 4, col: 6 })
    sample.pinning = { root: U(mv, E0).root || 0, base: U(mv0, E0).root || 0, shot: labels(mv).includes("Overwatch!") }
    ok(sample.pinning.root > 0 && sample.pinning.base === 0 && sample.pinning.shot, "Overwatch A Pinning Watch: roots", sample.pinning)
  }
  // 17-19 Signatures: heal B cleanses, burst A kill refunds 1 AP, aura-block B slows.
  {
    const s = board(["the-fool"], { "the-fool": { row: 4, col: 8, hp: 10, poison: 3, root: 2 }, [E0]: { row: 0, col: 3 }, [E1]: { row: 8, col: 0 } }, { "the-fool": { signature: "B" } })
    const f = pid(s, "the-fool")
    const c = cast(s, f, f)
    const s0 = board(["the-fool"], { "the-fool": { row: 4, col: 8, hp: 10, poison: 3, root: 2 }, [E0]: { row: 0, col: 3 }, [E1]: { row: 8, col: 0 } })
    const c0 = cast(s0, f, f)
    sample.purify = { up: [U(c, f).poison, U(c, f).root, U(c, f).hp], base: [U(c0, f).poison, U(c0, f).root, U(c0, f).hp], name: U(s, f).ability.upgrade?.name }
    ok(U(c, f).poison === 0 && U(c, f).root === 0 && U(c0, f).poison === 3 && U(c, f).hp === U(c0, f).hp, "Signature heal B Purifying Touch cleanses", sample.purify)
    const sb = board(["hexbreaker"], { hexbreaker: { row: 4, col: 8 }, [E0]: { row: 4, col: 6, hp: 1 }, [E1]: { row: 8, col: 0 } }, { hexbreaker: { signature: "A" } })
    const hb = pid(sb, "hexbreaker")
    const cb = cast(sb, hb, E0)
    const sb0 = board(["hexbreaker"], { hexbreaker: { row: 4, col: 8 }, [E0]: { row: 4, col: 6, hp: 1 }, [E1]: { row: 8, col: 0 } })
    const cb0 = cast(sb0, hb, E0)
    sample.finisher = { ap: U(cb, hb).ap, base: U(cb0, hb).ap, dead: U(cb, E0).hp }
    ok(U(cb, E0).hp === 0 && U(cb, hb).ap === U(cb0, hb).ap + 1, "Signature burst A Finisher: kill refunds 1 AP", sample.finisher)
    const sa = board(["bulwark-of-ages"], { "bulwark-of-ages": { row: 4, col: 8 }, [E0]: { row: 4, col: 7 }, [E1]: { row: 8, col: 0 } }, { "bulwark-of-ages": { signature: "B" } })
    const ba = pid(sa, "bulwark-of-ages")
    const ca = cast(sa, ba, null)
    const sA2 = board(["bulwark-of-ages"], { "bulwark-of-ages": { row: 4, col: 8 }, [E0]: { row: 4, col: 7 }, [E1]: { row: 8, col: 0 } }, { "bulwark-of-ages": { signature: "A" } })
    const cA2 = cast(sA2, ba, null)
    sample.bristle = { slowB: U(ca, E0).slow || 0, blockB: U(ca, ba).block, blockA: U(cA2, ba).block }
    ok(sample.bristle.slowB === 2 && sample.bristle.blockB === 2 && sample.bristle.blockA === 3, "Signature aura-block A Stone Skin / B Bristling", sample.bristle)
  }
  res.C = sample

  // --- D: the level-up choice: seeded, exclusive, persists, applied ----------
  const idx = rt.RUN_PATH.findIndex((n) => n.type === "battle" && n.formationId)
  const mk = (bench, extra = {}) => ({
    ...rt.startRun("tommy", null, { forcedSeed: 777 }),
    nodeIndex: idx,
    path: rt.RUN_PATH.slice(0, idx + 1),
    phase: "formation",
    bench,
    deployed: bench.map((b) => b.key).concat([null, null, null, null]).slice(0, 4),
    items: [],
    lastSeenAct: rt.actIndexForNode(idx, rt.RUN_PATH.length),
    ...extra,
  })
  const rs = mk([
    { key: "b0", defId: "bulwark-of-ages", upgradeLevel: 0, upgrades: [], xp: 45 },
    { key: "b1", defId: "hexbreaker", upgradeLevel: 0, upgrades: [] },
  ])
  const subj = lv.levelSubject(rs, "b0")
  const o1 = lv.levelOffers(rs, subj)
  const o2 = lv.levelOffers(JSON.parse(JSON.stringify(rs)), lv.levelSubject(JSON.parse(JSON.stringify(rs)), "b0"))
  const seeds = new Set([1, 2, 3, 4, 5, 6, 7, 8].map((sd) => lv.levelOffers({ ...rs, seed: sd }, subj)[0]))
  const up1 = lv.parseOffer(o1[0])
  const pickA = rt.chooseLevelPerk(rs, "b0", o1[0])
  const e0 = pickA.bench.find((e) => e.key === "b0")
  const pickB = rt.chooseLevelPerk(pickA, "b0", `up:${up1.skillId}:B`)
  // Walk every level: always take a branch while offered.
  let walk = pickA
  const taken = [up1.skillId]
  for (let i = 0; i < 3; i++) {
    const s = lv.levelSubject(walk, "b0")
    const offers = lv.levelOffers(walk, s)
    const up = lv.parseOffer(offers[0])
    if (up.kind === "upgrade") taken.push(up.skillId)
    walk = rt.chooseLevelPerk(walk, "b0", offers[up.kind === "upgrade" ? 1 : 0])
  }
  const walked = lv.levelSubject(walk, "b0")
  const perkPick = rt.chooseLevelPerk(rs, "b0", o1[2])
  const loaded = rt.deserializeRun(JSON.parse(JSON.stringify(rt.serializeRun(pickA))))
  // Old save: no skillUpgrades anywhere.
  const old = mk([{ key: "b0", defId: "bulwark-of-ages", upgradeLevel: 0, upgrades: [], xp: 6, perks: [] }])
  const oldLoaded = rt.deserializeRun(JSON.parse(JSON.stringify(rt.serializeRun(old))))
  const oldOffers = lv.levelOffers(oldLoaded, lv.levelSubject(oldLoaded, "b0"))
  const start = (st) => rt.startTacticsFormationBattle(st, (sd) => buildRunTacticsBattle(st, sd))
  const oldBattle = start(oldLoaded).battle
  const nb = start(loaded).battle
  const nu = nb.units.find((u) => u.id === "player-bulwark-of-ages-0")
  const upSkill = up1.skillId === "signature" ? nu.ability : nu.classSkills.find((s) => s.id === up1.skillId)
  // Commander tree: commander class skills, stored on runState.
  const cmdRs = { ...rs, commanderXp: 6 }
  const cs = lv.levelSubject(cmdRs, "commander")
  const cOffers = lv.levelOffers(cmdRs, cs)
  const cPick = rt.chooseLevelPerk(cmdRs, "commander", cOffers[1])
  const cBattle = start(cPick).battle.units.find((u) => u.id === C)
  const cUp = lv.parseOffer(cOffers[1])
  res.D = {
    o1, o2, seeds: seeds.size, pickedUps: e0.skillUpgrades, perksAfter: e0.perks || [], pendingAfter: lv.pendingPerkCount(lv.levelSubject(pickA, "b0")),
    exclusive: pickB === pickA, taken, walkedUps: walked.skillUpgrades, walkPerks: walked.perks, walkPending: lv.pendingPerkCount(walked),
    perkPick: perkPick.bench.find((e) => e.key === "b0").perks, perkPickUps: perkPick.bench.find((e) => e.key === "b0").skillUpgrades || null,
    loadedSame: JSON.stringify(loaded.bench) === JSON.stringify(pickA.bench),
    oldOffers, oldHasUpgrade: oldBattle.units.some((u) => u.side === "player" && ((u.classSkills || []).some((s) => s.upgrade) || u.ability?.upgrade)),
    applied: upSkill?.upgrade, nuUps: nu.skillUpgrades,
    cs: cs.skills.map((s) => s.id), cOffers, cUps: cPick.commanderSkillUpgrades, cApplied: cBattle.classSkills.find((s) => s.id === cUp.skillId)?.upgrade?.branch,
  }
  ok(o1.length === 3 && /^up:/.test(o1[0]) && /^up:/.test(o1[1]) && lv.parseOffer(o1[0]).skillId === lv.parseOffer(o1[1]).skillId && lv.parseOffer(o1[0]).branch === "A" && lv.parseOffer(o1[1]).branch === "B" && lv.PERKS[o1[2]], "offers = both branches of one skill + a stat perk", o1)
  ok(JSON.stringify(o1) === JSON.stringify(o2) && seeds.size >= 2, "offers are seeded + deterministic", { o1, o2, seeds: seeds.size })
  ok(e0.skillUpgrades[up1.skillId] === "A" && (e0.perks || []).length === 0 && pickB === pickA, "a branch is stored + exclusive (B refused after A)", res.D)
  ok(new Set(taken).size === taken.length && Object.keys(walked.skillUpgrades).length === 3 && walked.perks.length === 1 && res.D.walkPending === 0, "each level offers a new skill; a full tree falls back to stat perks", { taken, w: walked.skillUpgrades, p: walked.perks })
  ok(res.D.perkPick.length === 1 && res.D.perkPick[0] === o1[2] && !res.D.perkPickUps, "the stat perk card still works", res.D.perkPick)
  ok(res.D.loadedSame && oldOffers.length === 3 && !res.D.oldHasUpgrade, "save/load keeps branches; an old save defaults to none", { oldOffers })
  ok(res.D.applied?.branch === "A" && res.D.nuUps?.[up1.skillId] === "A", "the branch is applied in the next real tactics fight", { applied: res.D.applied })
  ok(cs.skills.length === 3 && res.D.cUps?.[cUp.skillId] === cUp.branch && res.D.cApplied === cUp.branch, "Commander skill tree", { cs: res.D.cs, cUps: res.D.cUps })

  // --- stage UI saves ---------------------------------------------------------
  const shopIdx = rt.RUN_PATH.findIndex((n, i) => i > idx && n.type === "shop")
  const shopRs = {
    ...rs, phase: "shop", nodeIndex: shopIdx, path: rt.RUN_PATH.slice(0, shopIdx + 1), essence: 500,
    lastSeenAct: rt.actIndexForNode(shopIdx, rt.RUN_PATH.length),
    bench: rs.bench.map((e) => (e.key === "b0" ? { ...e, xp: 6, skillUpgrades: {} } : e)),
  }
  const shopSubj = lv.levelSubject(shopRs, "b0")
  res.uiOffers = lv.levelOffers(shopRs, shopSubj)
  res.uiSkills = shopSubj.skills.map((s) => s.id)
  res.shopSave = rt.serializeRun(shopRs)
  const battleRs = { ...pickA, bench: pickA.bench.map((e) => (e.key === "b0" ? { ...e, skillUpgrades: { "shield-wall": "B", signature: "A" } } : e)) }
  res.battleSave = rt.serializeRun(start(battleRs))
  res.fails = fails
  return res
})
out.A = r.A
out.B = r.B
out.C = r.C
out.D = r.D
for (const f of r.fails) out.errors.push(f)

// --- UI: level-up screen tree + branch pick via a real click ---------------
{
  await page.evaluate((s) => {
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(s))
    localStorage.setItem("heartwood-autobattler-intro-seen", "1")
    localStorage.setItem("heartwood-story-intro-seen", "1")
  }, r.shopSave)
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.waitForSelector("[data-screen='level-up']", { timeout: 15000 }).catch(() => {})
  const cards = await page.locator(".hw-levelup-card").evaluateAll((els) => els.map((e) => e.dataset.perk))
  const rows = await page.locator(".hw-skilltree-row").evaluateAll((els) => els.map((e) => e.dataset.skillId))
  const offered = await page.locator(".hw-skilltree-branch[data-state='offered']").count()
  await page.screenshot({ path: `${SHOTS}/skilltree_choice.png` }).catch(() => {})
  await page.locator(".hw-levelup-card[data-branch='B']").first().click().catch(() => {})
  await page.waitForTimeout(400)
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("heartwood-run-save-v1")).run)
  const savedUps = saved.bench.find((e) => e.key === "b0").skillUpgrades
  const screenAfter = await page.locator("[data-screen='level-up']").count()
  const up = r.uiOffers[1].split(":")
  // The unit card chip now lists the chosen branch.
  const squadTab = page.locator("button:has-text('Your Squad'), [aria-label*='Your Squad']").first()
  if (await squadTab.count()) await squadTab.click().catch(() => {})
  await page.waitForTimeout(300)
  const chipTitles = await page.locator(".hw-card-tclass").evaluateAll((els) => els.map((e) => e.getAttribute("title") || ""))
  const chipUps = await page.locator(".hw-card-tclass-ups").count()
  out.uiChoice = { cards, rows, offered, savedUps, screenAfter, chipUps, chipHas: chipTitles.some((t) => t.includes("★") && t.includes(`(${up[2]})`)) }
  const ok =
    JSON.stringify(cards) === JSON.stringify(r.uiOffers) && JSON.stringify(rows) === JSON.stringify(r.uiSkills) && offered === 2 &&
    savedUps?.[up[1]] === "B" && screenAfter === 0 && chipUps >= 1 && out.uiChoice.chipHas
  if (!ok) out.errors.push("UI: level-up tree / branch click / card tooltip")
}
// --- UI: tactics skill bar shows ★ + branch name ----------------------------
{
  await page.evaluate((s) => localStorage.setItem("heartwood-run-save-v1", JSON.stringify(s)), r.battleSave)
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.waitForSelector(".hwt-board", { timeout: 15000 }).catch(() => {})
  const begin = page.locator(".hwt-begin-battle")
  if (await begin.count()) {
    await begin.click().catch(() => {})
    await page.waitForTimeout(400)
  }
  await page.locator('.hwt-token[data-side="player"][data-unit-id="player-bulwark-of-ages-0"]').first().click().catch(() => {})
  await page.waitForTimeout(250)
  const btn = page.locator('.hwt-skill-btn[data-skill-id="shield-wall"]')
  const upgraded = await btn.getAttribute("data-upgraded").catch(() => null)
  const text = await btn.innerText().catch(() => "")
  const title = await btn.getAttribute("title").catch(() => "")
  const sigUp = await page.locator(".hwt-ability-btn").getAttribute("data-upgraded").catch(() => null)
  const sigText = await page.locator(".hwt-ability-btn").innerText().catch(() => "")
  await page.screenshot({ path: `${SHOTS}/skilltree_battle.png` }).catch(() => {})
  out.uiBattle = { upgraded, text, title, sigUp, sigText }
  const ok = upgraded === "B" && text.includes("★ Rallying Wall") && title.includes("Shield Wall") && title.includes("★ Rallying Wall") && sigUp === "A" && sigText.includes("★")
  if (!ok) out.errors.push("UI: ★ + branch name on the skill bar")
}

await page.close()
console.log(JSON.stringify(out, null, 2))
console.log("\npageErrors:", errs.length, errs.slice(0, 8))
await browser.close()
const pass = out.errors.length === 0 && errs.length === 0
console.log(pass ? "\n✅ verify_skill_tree PASS" : "\n❌ verify_skill_tree FAIL")
process.exit(pass ? 0 : 1)
