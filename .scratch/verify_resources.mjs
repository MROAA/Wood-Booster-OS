// Resources step 2: every class has a resource profile; each profile's
// generation / decay / breakpoints; spending modes (fixed / % / ALL-IN);
// Nature States; Spirit upkeep; Souls; Blood Sacrifice; Reagent combos;
// Corruption trade-off; Hex Grand Curse; resource relics + Ancient Spring;
// enemy profiles (warriors Rage, casters Arcane, necromantic Souls);
// preview == real; UI gauge styles; Studio Resource Editor edits a
// profile and the game uses it.
import { chromium } from "playwright"
import { execFileSync } from "node:child_process"
import fs from "node:fs"

const PORT = process.env.PORT || 5445
const SHOT_DIR = process.env.SHOT_DIR || "/tmp"
const browser = await chromium.launch()
const errs = []
const out = { errors: [] }
const page = await (await browser.newContext({ viewport: { width: 1500, height: 1000 } })).newPage()
page.on("pageerror", (e) => errs.push(String(e)))
page.on("console", (m) => m.type() === "error" && !/ERR_CONNECTION_REFUSED|Failed to load resource|hearthwood-patchbay/.test(m.text()) && errs.push(m.text()))
await page.goto(`http://localhost:${PORT}/heartwood-tactics?rolls=0`, { waitUntil: "domcontentloaded" })
await page.waitForSelector(".hwt-board", { timeout: 30000 })

const engine = await page.evaluate(async () => {
  const E = await import("/src/services/heartwood/tacticsEngine.js")
  const M = await import("/src/services/heartwood/tacticsMana.js")
  const C = await import("/src/data/heartwood/classes.js")
  const R = await import("/src/data/heartwood/resources.js")
  const RL = await import("/src/data/heartwood/relics.js")
  const EV = await import("/src/data/heartwood/events.js")
  const r = {}
  const fails = []
  const ok = (cond, msg, data) => {
    if (!cond) fails.push(data === undefined ? msg : `${msg} ${JSON.stringify(data)}`)
  }
  const CMD = "player-commander"
  const E0 = "enemy-ironmaw-0"
  const E1 = "enemy-sapling-attendant-1"
  const E2 = "enemy-hoardling-2"
  const U = (s, id) => s.units.find((u) => u.id === id)
  const pid = (s, defId) => s.units.find((u) => u.defId === defId && u.side === "player").id
  // Synthetic board, resources ON; `mana` etc. in a placement override the start.
  function board(squad, place, terrain = {}, relics = []) {
    let s = E.createTacticsBattle("default", squad)
    const all = { [CMD]: { row: 8, col: 11 }, ...place }
    s = {
      ...s,
      terrain,
      wallHp: {},
      units: s.units.map((u) => {
        const k = all[u.id] || all[u.defId]
        if (!k) return { ...u, hp: 0 }
        const { row, col, mana, natureState, reagents, ...patch } = k
        const base = u.side === "enemy" ? { hp: 40, maxHp: 40, ward: 0, revive: 0, regen: 0, taunt: 0, enemySkills: [] } : {}
        return { ...u, block: 0, ...base, ...patch, pos: { row, col } }
      }),
    }
    s = M.enableMana(s, relics)
    return {
      ...s,
      units: s.units.map((u) => {
        const k = all[u.id] || all[u.defId]
        if (!k) return u
        return { ...u, ...(k.mana != null ? { mana: k.mana } : {}), ...(k.natureState ? { natureState: k.natureState } : {}), ...(k.reagents ? { reagents: k.reagents, mana: Object.values(k.reagents).reduce((a, b) => a + b, 0) } : {}) }
      }),
    }
  }
  const far = { [E0]: { row: 0, col: 0 }, [E1]: { row: 1, col: 0 }, [E2]: { row: 2, col: 0 } }
  const set = (s, id, patch) => ({ ...s, units: s.units.map((u) => (u.id === id ? { ...u, ...patch } : u)) })

  // 1 Every class has a profile; every profile has 25/50/75/100 steps ------------
  {
    const classes = Object.values(C.CLASSES)
    r.map = Object.fromEntries(classes.map((c) => [c.id, c.resource]))
    ok(classes.length === 38 && classes.every((c) => R.RESOURCES[c.resource]), "all 38 classes have a resource profile", r.map)
    const used = new Set(classes.map((c) => c.resource))
    ok(used.size >= 15, "15+ different resources in use", [...used])
    ok(Object.values(R.RESOURCES).every((p) => JSON.stringify(p.breakpoints.map((b) => b.at)) === "[25,50,75,100]"), "every profile has 25/50/75/100% breakpoints")
    for (const [cls, res] of Object.entries({ bruiser: "rage", juggernaut: "rage", executioner: "fury", striker: "combo", duelist: "combo", assassin: "shadow", guardian: "holy", warden: "holy", sentinel: "focus", ranger: "focus", healer: "nature", summoner: "spirit", ritualist: "souls", hexer: "hex", corruptor: "corruption", medic: "blood", alchemist: "reagents", commander: "inspiration", frostbinder: "frost", spellblade: "arcane" })) {
      ok(C.CLASSES[cls].resource === res, `${cls} uses ${res}`, C.CLASSES[cls].resource)
    }
    // Every hero always has a way to BUILD: every class has a free skill, or its profile builds from basics/regen.
    const builds = (p) => p.regen > 0 || p.regenPct > 0 || p.gain?.role || p.gain?.hit || p.gain?.rangedHit || p.gain?.calm || p.gain?.block || p.gain?.still || p.special === "tokens" || p.special === "inverted"
    ok(classes.every((c) => builds(R.RESOURCES[c.resource]) || c.skills.some((k) => (k.mana || 0) === 0)), "no starvation: every class can build its resource", classes.filter((c) => !builds(R.RESOURCES[c.resource])).map((c) => c.id))
  }

  // 2 Starts ----------------------------------------------------------------------------
  {
    const s = M.enableMana(E.createTacticsBattle("default", ["strength", "bulwark-of-ages", "swiftclaw", "knights-leap"]))
    r.starts = s.units.map((u) => [u.defId, u.resource, u.mana, u.manaMax])
    const v = (d) => U(s, pid(s, d))
    ok(v("strength").resource === "rage" && v("strength").mana === 0 && v("strength").manaMax === 100, "Rage starts EMPTY (0/100)", r.starts)
    ok(v("bulwark-of-ages").mana === 1 && v("bulwark-of-ages").manaMax === 5, "Holy Power 1/5 pips")
    ok(v("swiftclaw").mana === 0 && v("swiftclaw").manaMax === 10, "Combo 0/10")
    ok(v("knights-leap").mana === 30, "Shadow starts 30")
    ok(U(s, CMD).resource === "inspiration" && U(s, CMD).mana === 30, "Commander: Inspiration 30")
    const alc = M.enableMana(E.createTacticsBattle("default", ["huldra"]))
    ok(U(alc, pid(alc, "huldra")).reagents.arcane === 1 && U(alc, pid(alc, "huldra")).mana === 1, "Reagents start with 1 Arcane token")
  }

  // 3 Rage: hits, pain, idle decay, breakpoints, Berserk ---------------------------------
  {
    const s = board(["strength"], { strength: { row: 4, col: 6 }, [E0]: { row: 4, col: 5, attack: 4 } })
    const b = pid(s, "strength")
    const hit = E.attackUnit(s, b, E0)
    ok(U(hit, b).mana === 10, "Rage +10 per hit", U(hit, b).mana)
    const hurt = E.attackUnit({ ...s, phase: "enemy" }, E0, b)
    const lost = U(s, b).hp - U(hurt, b).hp
    ok(U(hurt, b).mana === Math.min(20, 2 * lost) && lost > 0, "Rage +2 per HP lost", [lost, U(hurt, b).mana])
    const idle = board(["strength"], { strength: { row: 4, col: 11, mana: 40 }, ...far })
    ok(U(E.endPlayerTurn(idle), b).mana === 30, "Rage cools 10 a turn when idle", U(E.endPlayerTurn(idle), b).mana)
    const at = (m) => 40 - U(E.attackUnit(set(s, b, { mana: m }), b, E0), E0).hp
    r.rageDmg = [at(0), at(25), at(50), at(75)]
    ok(at(25) === at(0) + 1 && at(50) === at(0) + 2 && at(75) === at(0) + 3, "Rage 25/50/75%: +1/+2/+3 damage", r.rageDmg)
    const berserk = M.gainMana(set(s, b, { mana: 95 }), b, 10, "t")
    ok(U(berserk, b).berserk === 2, "100 Rage = Berserk for 2 turns", U(berserk, b).berserk)
    const bd = 40 - U(E.attackUnit(set(berserk, b, { mana: 0 }), b, E0), E0).hp
    ok(bd === Math.round(at(0) * 1.5), "Berserk: +50% damage", [bd, at(0)])
  }

  // 4 Fury tiers ------------------------------------------------------------------------
  {
    const s = board(["the-hanged-man"], { "the-hanged-man": { row: 4, col: 6 }, [E0]: { row: 4, col: 5 } })
    const x = pid(s, "the-hanged-man")
    ok(U(s, x).resource === "fury" && U(s, x).mana === 0, "Executioner: Fury from 0")
    ok(U(E.attackUnit(s, x, E0), x).mana === 15, "Fury +15 a hit (fast)")
    const fu = (m) => U(set(s, x, { mana: m }), x)
    ok(M.furyTier(fu(40))?.name === "Enraged" && M.furyTier(fu(80))?.name === "Blood Frenzy" && !M.furyTier(fu(10)), "tiers 30 Enraged / 70 Blood Frenzy")
    const d = (m) => 40 - U(E.castAbility(set(s, x, { mana: m }), x, E0, "sever"), E0).hp
    r.fury = [d(0), d(40), d(80)]
    ok(d(40) > d(0) && d(80) > d(40), "Fury tiers make skills stronger", r.fury)
    ok(M.regenFor(fu(50)) === 0, "Fury never refills by itself")
  }

  // 5 Combo: pips from flank/back, decay, ALL-IN finisher ----------------------------------
  {
    // the-hierophant: a Striker without Haste (one swing per attack).
    const s = board(["the-hierophant"], { "the-hierophant": { row: 4, col: 6 }, [E0]: { row: 4, col: 5, facing: "W" } })
    const c = pid(s, "the-hierophant")
    ok(U(E.attackUnit(s, c, E0), c).mana === 3, "back hit: 1 + 2 Combo", U(E.attackUnit(s, c, E0), c).mana)
    const side = board(["the-hierophant"], { "the-hierophant": { row: 4, col: 6 }, [E0]: { row: 4, col: 5, facing: "N" } })
    ok(U(E.attackUnit(side, c, E0), c).mana === 2, "side hit: 1 + 1 Combo")
    ok(U(E.endPlayerTurn(set(board(["the-hierophant"], { "the-hierophant": { row: 4, col: 11 }, ...far }), c, { mana: 5 })), c).mana === 4, "Combo decays 1 a turn")
    const fin = (m) => {
      const st = set(s, c, { mana: m })
      const after = E.castAbility(st, c, E0, "finishing-blow")
      return { dmg: 40 - U(after, E0).hp, left: U(after, c).mana, same: after === st }
    }
    r.finisher = [fin(2), fin(3), fin(8)]
    ok(fin(2).same, "finisher needs 3+ Combo")
    // 8 pips = +5 more spent, plus the 75% Combo step (+2 damage) that was active.
    ok(fin(8).dmg === fin(3).dmg + 5 + 2 && fin(3).left === 0 && fin(8).left === 0, "ALL-IN finisher: +1 per pip spent, spends all", r.finisher)
  }

  // 6 Shadow: calm +20, losing HP -15 -------------------------------------------------------
  {
    const s = board(["knights-leap"], { "knights-leap": { row: 4, col: 11 }, ...far })
    const a = pid(s, "knights-leap")
    ok(U(E.endPlayerTurn(s), a).mana === 50, "Shadow +20 a turn it took no damage", U(E.endPlayerTurn(s), a).mana)
    const h = board(["knights-leap"], { "knights-leap": { row: 4, col: 6, mana: 50 }, [E0]: { row: 4, col: 5, attack: 5 } })
    ok(U(E.attackUnit({ ...h, phase: "enemy" }, E0, a), a).mana === 35, "losing HP costs 15 Shadow")
  }

  // 7 Holy Power: block, Bodyguard build, cap 5 -----------------------------------------------
  {
    const s = board(["bulwark-of-ages", "the-fool"], { "bulwark-of-ages": { row: 4, col: 6, mana: 0, block: 9 }, "the-fool": { row: 4, col: 7 }, [E0]: { row: 4, col: 5, attack: 4 } })
    const g = pid(s, "bulwark-of-ages")
    ok(U(E.attackUnit({ ...s, phase: "enemy" }, E0, g), g).mana === 1, "Holy +1 for a blocked hit")
    const guard = E.castAbility(s, g, pid(s, "the-fool"), "guard")
    ok(U(guard, g).mana === 1 && U(guard, g).classCds.guard > 0, "Bodyguard is free and builds 1 Holy", U(guard, g).mana)
    ok(U(M.gainMana(set(s, g, { mana: 4 }), g, 9), g).mana === 5, "Holy caps at 5 pips")
    // 50% (3 pips): takes 1 less per hit.
    const t = (m) => U(s, g).hp - U(E.attackUnit({ ...set(s, g, { mana: m, block: 0 }), phase: "enemy" }, E0, g), g).hp
    ok(t(3) === t(0) - 1, "Holy 50%+: takes 1 less", [t(0), t(3)])
  }

  // 8 Focus: still at turn end, aim breakpoints ----------------------------------------------
  {
    const s = board(["the-hermit"], { "the-hermit": { row: 4, col: 10, mana: 0 }, ...far })
    const f = pid(s, "the-hermit")
    ok(U(s, f).resource === "focus", "Sniper uses Focus")
    ok(U(E.endPlayerTurn(s), f).mana === 12, "Focus +12 for ending the turn still", U(E.endPlayerTurn(s), f).mana)
    ok(U(E.endPlayerTurn(set(s, f, { moved: true })), f).mana === 0, "no Focus after moving")
    ok(U(E.endPlayerTurn(board(["the-hermit"], { "the-hermit": { row: 4, col: 10, mana: 0 }, ...far }, { "4-10": "high" })), f).mana === 16, "+4 on high ground")
    const aim = M.resourceMods(U(set(s, f, { mana: 60 }), f)).aim
    ok(aim === 10 && M.resourceMods(U(set(s, f, { mana: 20 }), f)).aim === 0, "Focus 25/50%: +5/+10% to hit", aim)
  }

  // 9 Nature: states switch, regen, Storm at 100 ----------------------------------------------
  {
    const s = board(["thornwisp"], { thornwisp: { row: 4, col: 6, mana: 50 }, [E0]: { row: 4, col: 4 } })
    const n = pid(s, "thornwisp")
    const snare = E.castAbility(s, n, E0, "root-snare")
    ok(U(snare, n).natureState === "root", "Root Snare switches to Root state", U(snare, n).natureState)
    ok(M.resourceMods(U(snare, n)).guard >= 1, "Root state: takes 1 less")
    ok(M.resourceMods(U(set(s, n, { natureState: "beast", mana: 10 }), n)).dmg === 2, "Beast state: +2 damage")
    ok(M.regenFor(U(set(s, n, { natureState: "bloom" }), n)) === M.regenFor(U(s, n)) + 4, "Bloom: refills +4")
    const storm = M.gainMana(set(s, n, { mana: 95 }), n, 10, "t")
    ok(U(storm, n).natureState === "storm", "100 Nature calls the Storm")
    ok(M.regenFor(U(s, n)) === 8, "Nature refills 8 a turn")
  }

  // 10 Spirit upkeep -----------------------------------------------------------------------------
  {
    const s = board(["mycelist"], { mycelist: { row: 4, col: 8 }, ...far })
    const m = pid(s, "mycelist")
    const sum = E.castAbility(s, m, null, "summon-spirit")
    const wolf = sum.units.find((u) => u.ownerId === m && u.hp > 0)
    r.spirit = { mana: U(sum, m).mana, reserved: M.reservedFor(sum, U(sum, m)), upkeep: wolf?.upkeep }
    ok(wolf && wolf.upkeep === 35 && M.reservedFor(sum, U(sum, m)) === 35, "a summon RESERVES 35 Spirit", r.spirit)
    ok(U(sum, m).mana <= 65, "Spirit can't refill into the reserved part", r.spirit)
    const g = M.gainMana(sum, m, 100)
    ok(U(g, m).mana === 65, "cap = max - reserved", U(g, m).mana)
    const dead = set(g, wolf.id, { hp: 0 })
    ok(M.reservedFor(dead, U(dead, m)) === 0 && U(M.gainMana(dead, m, 50), m).mana === 100, "a fallen summon frees its reserve")
  }

  // 11 Souls ------------------------------------------------------------------------------------
  {
    const s = board(["abyssong", "strength"], { abyssong: { row: 4, col: 8 }, strength: { row: 4, col: 6 }, [E0]: { row: 4, col: 5, hp: 1 }, [E1]: { row: 0, col: 0 }, [E2]: { row: 1, col: 0 } })
    const rit = pid(s, "abyssong")
    ok(U(s, rit).resource === "souls" && U(s, rit).mana === 0 && U(s, rit).manaMax === 30, "Ritualist: Souls 0/30")
    const k = E.attackUnit(s, pid(s, "strength"), E0)
    ok(U(k, rit).mana === 4, "an enemy falling within 4 tiles: +4 Souls", U(k, rit).mana)
    const farKill = board(["abyssong", "strength"], { abyssong: { row: 8, col: 11 }, strength: { row: 4, col: 2 }, [E0]: { row: 4, col: 1, hp: 1 }, [E1]: { row: 0, col: 0 }, [E2]: { row: 1, col: 0 } })
    ok(U(E.attackUnit(farKill, pid(farKill, "strength"), E0), rit).mana === 0, "too far: no Souls")
    const ch = E.castAbility(s, rit, null, "begin-ritual")
    ok(U(ch, rit).mana === 2 && U(ch, rit).ritual === 1, "Begin Ritual is free and gathers 2 Souls")
  }

  // 12 Blood: Sacrifice + bleed -----------------------------------------------------------------
  {
    const s = board(["mosswalker", "bulwark-of-ages"], { mosswalker: { row: 4, col: 8, mana: 30 }, "bulwark-of-ages": { row: 4, col: 7 }, [E0]: { row: 4, col: 6, attack: 5 } })
    const md = pid(s, "mosswalker")
    ok(U(s, md).resource === "blood", "Medic uses Blood")
    const sac = M.sacrifice(s, md)
    r.sac = { hp: [U(s, md).hp, U(sac, md).hp], mana: U(sac, md).mana, cost: M.sacrificeCost(U(s, md)) }
    ok(U(sac, md).hp === U(s, md).hp - M.sacrificeCost(U(s, md)) && U(sac, md).mana === 60, "Sacrifice: -10% HP, +30 Blood", r.sac)
    ok(M.sacrifice(sac, md) === sac, "once a turn")
    const hit = E.attackUnit({ ...s, phase: "enemy" }, E0, pid(s, "bulwark-of-ages"))
    const lost = U(s, pid(s, "bulwark-of-ages")).hp - U(hit, pid(s, "bulwark-of-ages")).hp
    ok(lost > 0 && U(hit, md).mana === 30 + Math.min(8, lost), "an ally's wound nearby feeds Blood", [lost, U(hit, md).mana])
  }

  // 13 Reagents: gather + combos ---------------------------------------------------------------
  {
    const s = board(["huldra"], { huldra: { row: 4, col: 9 }, [E0]: { row: 4, col: 6 }, [E1]: { row: 4, col: 5 }, [E2]: { row: 0, col: 0 } })
    const h = pid(s, "huldra")
    const fl = E.castAbility(s, h, E0, "poison-flask")
    ok(M.tokensOf(U(fl, h)).poison === 1, "Poison Flask gathers a Poison reagent", M.tokensOf(U(fl, h)))
    const plain = set(s, h, { reagents: { fire: 0, frost: 0, poison: 1, arcane: 0 }, mana: 1 })
    const venom = set(s, h, { reagents: { fire: 1, frost: 0, poison: 1, arcane: 0 }, mana: 2 })
    const p1 = E.castAbility(plain, h, E0, "volatile-mixture")
    const v1 = E.castAbility(venom, h, E0, "volatile-mixture")
    r.venom = { plainE1: 40 - U(p1, E1).hp, venomE1: 40 - U(v1, E1).hp, tokens: M.tokensOf(U(v1, h)), log: v1.log.slice(-4) }
    ok(r.venom.venomE1 >= r.venom.plainE1 + 3, "Fire+Poison = Explosive Venom hits the enemy next to the target", r.venom)
    ok(U(v1, h).mana === 0, "Volatile Mixture throws every reagent")
    const empty = set(s, h, { reagents: { fire: 0, frost: 0, poison: 0, arcane: 0 }, mana: 0 })
    ok(E.castAbility(empty, h, E0, "volatile-mixture") === empty, "nothing to throw without reagents")
  }

  // 14 Corruption: skills ADD, trade-off, cap ----------------------------------------------------
  {
    const s = board(["the-devil"], { "the-devil": { row: 4, col: 8 }, [E0]: { row: 4, col: 6, corruption: 1, poison: 1 } })
    const d = pid(s, "the-devil")
    ok(U(s, d).mana === 0, "Corruption starts at 0")
    const c1 = E.castAbility(s, d, E0, "invert-blessing")
    ok(U(c1, d).mana === 20, "a skill ADDS 20 Corruption", U(c1, d).mana)
    const hi = set(s, d, { mana: 80 })
    const blocked = set(s, d, { mana: 90 })
    ok(!M.canAfford(U(blocked, d), U(blocked, d).classSkills.find((k) => k.id === "invert-blessing")), "can't cast past 100 Corruption")
    const m = M.resourceMods(U(hi, d))
    ok(m.dmg === 3 && m.taken === 1 && m.cheaper === 25, "75%: +3 damage, -25% added, takes +1", m)
    ok(M.manaCostOf(U(hi, d).classSkills.find((k) => k.id === "invert-blessing"), U(hi, d)) === 15, "high Corruption: skills add less")
    ok(U(E.endPlayerTurn(set(board(["the-devil"], { "the-devil": { row: 4, col: 11 }, ...far }), d, { mana: 50 })), d).mana === 40, "Corruption cools 10 a turn")
  }

  // 15 Hex Power + Grand Curse --------------------------------------------------------------------
  {
    const s = board(["hexmother"], { hexmother: { row: 4, col: 8 }, [E0]: { row: 4, col: 5 }, [E1]: { row: 5, col: 5 }, [E2]: { row: 0, col: 0 } })
    const x = pid(s, "hexmother")
    const v = E.castAbility(s, x, E0, "vulnerability")
    ok(U(v, x).mana === 20 + 15, "a curse builds 15 Hex Power (free skill)", U(v, x).mana)
    const full = set(set(s, x, { mana: 100 }), E1, { cursed: 2 })
    const g = E.castAbility(full, x, E0, "vulnerability")
    r.grand = { e1: 40 - U(g, E1).hp, hex: U(g, x).mana, log: g.log.filter((l) => /Grand/.test(l)) }
    ok(r.grand.e1 >= 3 && U(g, E1).exposed >= 2 && r.grand.hex < 100 && r.grand.log.length === 2, "FULL Hex: the next skill sets off a Grand Curse", r.grand)
  }

  // 16 Spending modes ---------------------------------------------------------------------------
  {
    const s = board(["bishops-slash"], { "bishops-slash": { row: 4, col: 9, mana: 100 }, [E0]: { row: 4, col: 6 }, [E1]: { row: 4, col: 5 } })
    const rg = pid(s, "bishops-slash")
    const ric = U(s, rg).classSkills.find((k) => k.id === "ricochet-shot")
    ok(ric.spend === "pct" && M.manaCostOf(ric, U(s, rg)) === 30, "%-cost: Ricochet 30% of max Focus")
    const after = E.castAbility(s, rg, E0, "ricochet-shot")
    ok(after !== s && U(after, rg).mana >= 70 && U(after, rg).mana < 100, "pct skill paid (30, hits pay a little back)", U(after, rg).mana)
    const all = Object.values(C.CLASSES).flatMap((c) => c.skills)
    const modes = Object.values(C.CLASSES).filter((c) => c.skills.some((k) => k.spend === "all" || k.spend === "pct")).length
    r.modes = { allIn: all.filter((k) => k.spend === "all").length, pct: all.filter((k) => k.spend === "pct").length, classesWithMode: modes }
    ok(r.modes.allIn >= 15 && r.modes.pct >= 10 && modes >= 30, "ALL-IN + %-cost skills across 30+ classes", r.modes)
    ok(all.every((k) => typeof k.mana === "number" && k.mana >= 0), "every class skill has a price")
    // ALL-IN scaling: Whirlwind with 30 vs 90 Rage.
    const w = board(["strength"], { strength: { row: 4, col: 6 }, [E0]: { row: 4, col: 5 }, [E1]: { row: 5, col: 5 }, [E2]: { row: 0, col: 0 } })
    const b = pid(w, "strength")
    const ww = (m) => 40 - U(E.castAbility(set(w, b, { mana: m }), b, E0, "heavy-swing"), E1).hp
    r.whirl = [ww(29), ww(30), ww(90)]
    ok(ww(29) === 0 && ww(90) > ww(30) && ww(30) > 0, "Whirlwind ALL-IN: needs 30, more Rage = more damage, hits every adjacent foe", r.whirl)
    // Empowered at 100% (arcane).
    const sb = board(["hexbreaker"], { hexbreaker: { row: 4, col: 6 }, [E0]: { row: 4, col: 5 } })
    const h = pid(sb, "hexbreaker")
    const full = 40 - U(E.castAbility(sb, h, E0, "elemental-strike"), E0).hp
    const low = 40 - U(E.castAbility(set(sb, h, { mana: 30 }), h, E0, "elemental-strike"), E0).hp
    ok(full > low, "Arcane 100%: the next skill is Empowered", [low, full])
  }

  // 17 Resource relics + Ancient Spring ------------------------------------------------------------
  {
    const s = board(["strength", "bulwark-of-ages"], { strength: { row: 4, col: 6 }, "bulwark-of-ages": { row: 4, col: 8 }, [E0]: { row: 4, col: 5, attack: 5, hp: 1 } }, {}, ["mana-crystal", "blood-chalice", "soul-lantern"])
    const b = pid(s, "strength")
    ok(U(s, b).manaMax === 120 && U(s, pid(s, "bulwark-of-ages")).manaMax === 5, "Mana Crystal: +20 to bars, pips unchanged", [U(s, b).manaMax, U(s, pid(s, "bulwark-of-ages")).manaMax])
    const k = E.attackUnit(s, b, E0)
    ok(U(k, b).mana >= 10 + 15 + 5, "Soul Lantern: +5 when an enemy falls nearby", U(k, b).mana)
    const s2 = board(["strength"], { strength: { row: 4, col: 6 }, [E0]: { row: 4, col: 5, attack: 5 } }, {}, ["blood-chalice"])
    const hurt = E.attackUnit({ ...s2, phase: "enemy" }, E0, b)
    const lost = U(s2, b).hp - U(hurt, b).hp
    ok(U(hurt, b).mana === Math.min(20, 2 * lost) + lost, "Blood Chalice: +1 per HP lost", [lost, U(hurt, b).mana])
    ok(["mana-crystal", "blood-chalice", "soul-lantern"].every((id) => RL.RELICS[id]?.mana), "3 resource relics")
    const spring = EV.EVENTS.find((e) => e.id === "ancient-spring")
    ok(spring && spring.choices[1].effects.some((x) => x.relic === "mana-crystal") && spring.choices[1].effects.some((x) => x.bane), "Ancient Spring: drink deeply = Mana Crystal + a curse")
  }

  // 18 Enemy profiles ----------------------------------------------------------------------------
  {
    const s = M.enableMana(E.createRealMatchupBattle(["strength"], ["bonewarden", "hex-acolyte", "sapling-attendant", "gravemaw"], "tommy"))
    r.enemies = s.units.filter((u) => u.side === "enemy").map((u) => [u.defId, u.resource, u.mana, u.manaMax])
    const byDef = (d) => s.units.find((u) => u.defId === d && u.side === "enemy")
    ok(byDef("bonewarden").resource === "souls" && byDef("gravemaw").resource === "souls", "necromantic enemies gather Souls", r.enemies)
    ok(byDef("hex-acolyte").resource === "arcane", "casters use Arcane mana")
    ok(byDef("sapling-attendant").resource === "rage" && byDef("sapling-attendant").mana === 40, "warriors build Rage (start 40)")
  }

  // 19 Preview == real (mixed resources, several turns) --------------------------------------------
  {
    let s = M.enableMana(E.createRealMatchupBattle(["strength", "bulwark-of-ages", "knights-leap", "hexmother"], ["bonewarden", "hex-acolyte", "sapling-attendant"], "tommy"))
    const rows = []
    for (let turn = 0; turn < 5 && s.phase === "player"; turn++) {
      const pv = E.previewEnemyIntents(s)
      const pv2 = E.previewEnemyIntents(s)
      const after = E.endPlayerTurn(s)
      for (const { enemyId, intent } of pv) {
        const now = U(after, enemyId)
        if (!now) continue
        let good = JSON.stringify(pv) === JSON.stringify(pv2)
        if (intent.kind === "move" || intent.kind === "move-attack") good = good && now.pos.row === intent.to.row && now.pos.col === intent.to.col
        if (intent.kind === "skill" && intent.phase !== "release" && intent.skillKind !== "enrage") good = good && (now.skillCd || {})[intent.skillId] > 0
        rows.push({ turn, enemyId, kind: intent.skillKind || intent.kind, good })
      }
      s = after
    }
    r.preview = rows.length
    ok(rows.length > 4 && rows.every((x) => x.good), "preview == real with class resources", rows.filter((x) => !x.good))
  }

  r.fails = fails
  return r
})
out.engine = engine
out.errors.push(...engine.fails)

// --- UI gauges per style ------------------------------------------------------------------
{
  const styles = new Set()
  for (const squad of ["strength,swiftclaw,huldra,abyssong", "the-hanged-man,mycelist,thornwisp,bulwark-of-ages"]) {
    await page.goto(`http://localhost:${PORT}/heartwood-tactics?rolls=0&squad=${squad}`, { waitUntil: "domcontentloaded" })
    await page.waitForSelector(".hwt-board")
    for (const st of await page.locator(".hwt-token [data-style]").evaluateAll((els) => els.map((e) => e.dataset.style))) styles.add(st)
  }
  out.ui = { styles: [...styles] }
  if (!["bar", "pips", "counter", "wheel", "tokens", "reserve", "tiers"].every((x) => styles.has(x))) out.errors.push(`UI: all 7 gauge styles on the board (${[...styles]})`)
  // Selected hero card shows the resource name, steps + rules; costs in the resource.
  await page.locator('.hwt-token[data-unit-id="player-the-hanged-man-0"]').click()
  await page.waitForSelector(".hwt-res-info")
  const info = await page.locator(".hwt-res-info").innerText()
  const gems = await page.locator(".hwt-skill-btn .hwt-skill-mana").allInnerTexts()
  out.ui.info = info.slice(0, 120)
  out.ui.gems = gems
  if (!/Fury/.test(info) || !/25%/.test(info) || !/Blood Frenzy/.test(info)) out.errors.push("UI: resource panel (name, steps, rules)")
  if (!gems.some((g) => /ALL-IN 20\+ Fury/.test(g)) || !gems.some((g) => /free/.test(g))) out.errors.push(`UI: skill costs in Fury (${gems})`)
  await page.screenshot({ path: `${SHOT_DIR}/resources_gauges.png` })
  // Gain callout in the resource's own name ("+15 Fury").
  await page.goto(`http://localhost:${PORT}/heartwood-tactics?rolls=0&squad=strength,swiftclaw,knights-leap,hexmother&debugLowHp=0`, { waitUntil: "domcontentloaded" })
  await page.waitForSelector(".hwt-board")
}

// --- Studio Resource Editor: edits a profile, the game uses it --------------------------------
{
  await page.goto(`http://localhost:${PORT}/hearthwood-studio?view=resources`, { waitUntil: "domcontentloaded" })
  await page.waitForSelector('[data-testid="resource-editor"]', { timeout: 20000 })
  await page.locator('[data-resource="rage"]').click()
  const title = await page.locator('[data-testid="resource-title"]').innerText()
  const hasHit = await page.locator('[data-field="gain.hit"]').count()
  const advBefore = await page.locator('[data-testid="resource-advanced"]').count()
  await page.locator('[data-testid="resource-advanced-toggle"]').click()
  const advAfter = await page.locator('[data-field="gauge"]').count()
  await page.locator('[data-field="gain.hit"]').fill("13")
  const previewEnabled = await page.locator('[data-testid="resource-preview"]').isEnabled()
  await page.locator('[data-testid="class-assign-toggle"]').click()
  const classSelects = await page.locator('[data-testid="class-assign"] select').count()
  await page.locator('[data-testid="class-assign-toggle"]').click()
  await page.locator('[data-testid="resource-advanced-toggle"]').click()
  await page.screenshot({ path: `${SHOT_DIR}/resources_studio.png` })
  out.studio = { title, hasHit, advBefore, advAfter, previewEnabled, classSelects }
  if (!/Rage/.test(title) || hasHit !== 1 || advBefore !== 0 || advAfter !== 1 || !previewEnabled || classSelects !== 38) out.errors.push("Studio: Resource Editor view")
  // The patchbay pipeline the editor posts to: apply the same edit with the
  // patchbay's own script, load the game, check the new number, restore.
  const file = "src/data/heartwood/resources.js"
  const orig = fs.readFileSync(file, "utf8")
  try {
    const res = JSON.parse(execFileSync(process.execPath, ["scripts/hearthwood-apply-edit.mjs"], { input: JSON.stringify({ filePath: file, exportName: "RESOURCES", edits: [{ path: ["rage", "gain", "hit"], op: "set", value: 13 }] }), encoding: "utf8" }))
    out.studio.applied = res.applied?.length
    if (!res.ok || res.applied?.length !== 1) out.errors.push("Studio: apply-edit rejected the resource edit")
    fs.writeFileSync(file, res.proposedCode)
    await new Promise((r) => setTimeout(r, 1200))
    await page.goto(`http://localhost:${PORT}/heartwood-tactics?rolls=0`, { waitUntil: "domcontentloaded" })
    await page.waitForSelector(".hwt-board")
    const rage = await page.evaluate(async () => {
      const E = await import("/src/services/heartwood/tacticsEngine.js")
      const M = await import("/src/services/heartwood/tacticsMana.js")
      let s = M.enableMana(E.createTacticsBattle("default", ["strength"]))
      const b = s.units.find((u) => u.defId === "strength").id
      s = { ...s, units: s.units.map((u) => (u.id === b ? { ...u, pos: { row: 4, col: 6 } } : u.id === "enemy-ironmaw-0" ? { ...u, pos: { row: 4, col: 5 }, hp: 40, maxHp: 40, block: 0, ward: 0 } : u)) }
      return s.units.find((u) => u.id === b) && E.attackUnit(s, b, "enemy-ironmaw-0").units.find((u) => u.id === b).mana
    })
    out.studio.rageAfterEdit = rage
    if (rage !== 13) out.errors.push(`Studio edit not used by the game (rage ${rage})`)
  } catch (e) {
    out.errors.push(`Studio pipeline: ${e.message.slice(0, 200)}`)
  } finally {
    fs.writeFileSync(file, orig)
  }
  // Reader exposes the resources type.
  const json = JSON.parse(execFileSync(process.execPath, ["scripts/hearthwood-read-entities.mjs", "--type", "resources"], { encoding: "utf8", maxBuffer: 8e6 }))
  if (json.entities.length !== 16) out.errors.push("Studio reader: 16 resource profiles")
}

out.pageErrors = errs
if (errs.length) out.errors.push(`page errors: ${errs.slice(0, 3).join(" | ")}`)
await browser.close()
console.log(JSON.stringify(out, null, 1))
console.log(out.errors.length ? `FAIL (${out.errors.length})` : "PASS")
process.exit(out.errors.length ? 1 : 0)
