// Mana step 1: pools by class, start full / reset per fight, costs gate
// skills (free basics), medium regen, role gains (block / hit+kill /
// focus+high ground+cover / heal), Overcharge store + spend, Commander
// mana ultimate, potion / relic / skill restore, drain + burn both sides,
// enemy AI respects mana, preview == real over several turns, UI (blue
// bars, costs on buttons, greyed, callouts, ultimate panel), "hero"
// wording, Studio exposes mana fields.
import { chromium } from "playwright"
import { execFileSync } from "node:child_process"

const PORT = process.env.PORT || 5445
const SHOT_DIR = process.env.SHOT_DIR || "/tmp"
const browser = await chromium.launch()
const errs = []
const out = { errors: [] }
const page = await (await browser.newContext({ viewport: { width: 1400, height: 950 } })).newPage()
page.on("pageerror", (e) => errs.push(String(e)))
page.on("console", (m) => m.type() === "error" && !/ERR_CONNECTION_REFUSED|Failed to load resource/.test(m.text()) && errs.push(m.text()))
await page.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
await page.waitForSelector(".hwt-board", { timeout: 20000 })

const engine = await page.evaluate(async () => {
  const E = await import("/src/services/heartwood/tacticsEngine.js")
  const M = await import("/src/services/heartwood/tacticsMana.js")
  const C = await import("/src/data/heartwood/classes.js")
  const CF = await import("/src/services/heartwood/tacticsClasses.js")
  const R = await import("/src/services/heartwood/runEngine.js")
  // Resources step 2: classes now use their own resource profiles (Holy,
  // Combo, Nature...). The generic classic-mana checks below use Arcane
  // heroes (hexbreaker = Spellblade, the-magician = Controller).
  const RES = (await import("/src/data/heartwood/resources.js")).RESOURCES
  const T = await import("/src/services/heartwood/tacticsTutorial.js")
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
  // Synthetic board with mana ON; `mana`/`overcharge` in a placement override the full start.
  function board(squad, place, terrain = {}, relics = []) {
    let s = E.createTacticsBattle("default", squad)
    const withDefaults = { [CMD]: { row: 8, col: 11 }, ...place }
    s = {
      ...s,
      terrain,
      wallHp: {},
      units: s.units.map((u) => {
        const k = withDefaults[u.id] || withDefaults[u.defId]
        if (!k) return { ...u, hp: 0 }
        const { row, col, mana, overcharge, ...patch } = k
        const base = u.side === "enemy" ? { hp: 40, maxHp: 40, ward: 0, revive: 0, regen: 0, taunt: 0, enemySkills: [] } : {}
        return { ...u, block: 0, ...base, ...patch, pos: { row, col } }
      }),
    }
    s = M.enableMana(s, relics)
    return {
      ...s,
      units: s.units.map((u) => {
        const k = withDefaults[u.id] || withDefaults[u.defId]
        if (!k) return u
        return { ...u, ...(k.mana != null ? { mana: k.mana } : {}), ...(k.overcharge != null ? { overcharge: k.overcharge } : {}) }
      }),
    }
  }
  const far = { [E0]: { row: 0, col: 0 }, [E1]: { row: 1, col: 0 }, [E2]: { row: 2, col: 0 } }

  // 1 Pools by class, start full -------------------------------------------
  {
    const s = M.enableMana(E.createTacticsBattle("default", ["bulwark-of-ages", "the-fool", "swiftclaw", "sparrowthorn"]))
    const heroes = s.units.filter((u) => u.side === "player")
    r.pools = heroes.map((u) => [u.defId, u.classId, u.manaMax])
    // Resources step 2: a class's PROFILE sets max + start (classic mana = manaPool, full).
    const expect = (u) => {
      const p = RES[C.CLASSES[u.classId].resource]
      const max = p.max > 0 ? p.max : C.CLASSES[u.classId].manaPool
      return [max, Math.round((max * p.startPct) / 100)]
    }
    ok(heroes.filter((u) => u.classId).every((u) => u.manaMax === expect(u)[0] && u.mana === expect(u)[1]), "hero pool + start = class resource profile", r.pools)
    const g = U(s, pid(s, "bulwark-of-ages"))
    const h = U(s, pid(s, "the-fool"))
    ok(g.manaMax === 5 && g.mana === 1 && h.manaMax === 100 && h.mana === 50, "Guardian: 1/5 Holy pips, Healer: 50/100 Nature", [g.mana, g.manaMax, h.mana, h.manaMax])
    ok(s.units.filter((u) => u.side === "enemy").every((u) => u.manaMax > 0 && u.mana === Math.round((u.manaMax * RES[u.resource].enemyStartPct) / 100)), "enemies start at their profile's enemy start")
    ok(s.manaRules === true, "manaRules on")
    // Bosses get a bigger pool.
    const boss = M.enableMana(E.createRealMatchupBattle(["bulwark-of-ages"], ["deepwarden"], "tommy")).units.find((u) => u.side === "enemy")
    r.boss = [boss.defId, boss.phases?.length, boss.manaMax]
    ok(boss.phases?.length > 0 && boss.resource === "arcane" ? boss.manaMax === M.MANA_POOL[M.manaRole(boss)] + M.BOSS_POOL_BONUS : true, "boss pool bonus", r.boss)
    // Without enableMana nothing changes (old synthetic states).
    const plain = E.createTacticsBattle("default", ["bulwark-of-ages"])
    ok(plain.units.every((u) => u.mana === undefined) && !plain.manaRules, "no mana fields without enableMana")
    // Reset per fight: a spent hero is full again in the next fight.
    const spent = { ...s, units: s.units.map((u) => (u.id === g.id ? { ...u, mana: 0 } : u)) }
    const next = M.enableMana(E.createTacticsBattle("default", ["bulwark-of-ages", "the-fool", "swiftclaw", "sparrowthorn"]))
    ok(U(spent, g.id).mana === 0 && U(next, g.id).mana === 1, "next fight starts fresh again")
  }

  // 2 Costs gate skills; basics are free --------------------------------------
  {
    // Resources step 2: an Arcane hero (Spellblade, 50 mana) for the generic gate.
    const low = board(["hexbreaker"], { hexbreaker: { row: 4, col: 6, mana: 5 }, [E0]: { row: 4, col: 5 } })
    const g = pid(low, "hexbreaker")
    ok(E.castAbility(low, g, E0, "elemental-strike") === low, "class skill refused without mana")
    ok(E.castAbility(low, g, E0) === low, "signature refused without mana")
    ok(CF.classSkillStatus(U(low, g), U(low, g).classSkills.find((k) => k.id === "elemental-strike")) === "Needs 15 mana", "status says why", CF.classSkillStatus(U(low, g), U(low, g).classSkills[0]))
    ok(!CF.classSkillUsable(low, U(low, g), U(low, g).classSkills[0]), "class skill not usable")
    const full = board(["hexbreaker"], { hexbreaker: { row: 4, col: 6, mana: 40 }, [E0]: { row: 4, col: 5 } })
    const cast = E.castAbility(full, g, E0, "elemental-strike")
    r.cast = { mana: U(cast, g).mana, ap: U(cast, g).ap, cd: U(cast, g).classCds }
    // 40 - 15 + Arcane's "a skill that lands pays back 2".
    ok(U(cast, g).mana === 40 - 15 + RES.arcane.gain.spell && U(cast, g).ap === 1 && U(cast, g).classCds["elemental-strike"] > 0, "skill costs AP + mana + keeps cooldown", r.cast)
    const sig = E.castAbility(full, g, E0)
    ok(U(sig, g).mana < 40 && U(sig, g).cooldownRemaining > 0, "signature costs mana", U(sig, g).mana)
    // Free basics: attack, move, overwatch, hunker.
    const mid = board(["hexbreaker"], { hexbreaker: { row: 4, col: 6, mana: 20 }, [E0]: { row: 4, col: 5 } })
    ok(U(E.attackUnit(mid, g, E0), g).mana === 20, "attack free (a ranged caster gains nothing on hit)")
    ok(U(E.moveUnit(mid, g, { row: 5, col: 7 }), g).mana === 20, "move free")
    ok(U(E.overwatchAction(mid, g), g).mana === 20, "overwatch free")
    ok(U(E.hunkerDown(mid, g), g).mana === 20, "hunker free")
  }

  // 3 Regen (medium) ------------------------------------------------------------------
  {
    const s = board(["hexbreaker", "the-fool"], { hexbreaker: { row: 4, col: 11, mana: 0, moved: true }, "the-fool": { row: 6, col: 11, mana: 0 }, [CMD]: { row: 8, col: 11, mana: 0 }, ...far })
    const g = pid(s, "hexbreaker")
    const h = pid(s, "the-fool")
    const a = E.endPlayerTurn(s)
    r.regen = { arcane: U(a, g).mana, healer: U(a, h).mana, cmd: U(a, CMD).mana, enemy: U(a, E0).mana }
    ok(U(a, g).mana === M.regenFor(U(s, g)) && U(a, g).mana === 5, "classic mana regen ~10% (one cheap skill per ~2 turns)", r.regen)
    // Resources step 2: Healer = Nature (8 a turn), Commander = Inspiration (5 a turn).
    ok(U(a, h).mana === RES.nature.regen, "healer: Nature refills 8", r.regen)
    ok(U(a, CMD).mana === RES.inspiration.regen, "commander: Inspiration refills 5", r.regen)
    const a2 = E.endPlayerTurn(a)
    ok(U(a2, g).mana >= 10, "2 turns of regen = one cheap skill", U(a2, g).mana)
  }

  // 4 Role gains ------------------------------------------------------------------------
  {
    // Tank: blocked damage -> mana (Block 8 absorbs an attack of 6).
    const s = board(["bulwark-of-ages"], { "bulwark-of-ages": { row: 4, col: 6, mana: 0, block: 8 }, [E0]: { row: 4, col: 5, attack: 6 } })
    const g = pid(s, "bulwark-of-ages")
    const hit = E.attackUnit({ ...s, phase: "enemy" }, E0, g)
    r.block = U(hit, g).mana
    // Resources step 2: a Guardian builds 1 Holy Power per blocked hit / graze.
    ok(U(hit, g).mana === 1 && (hit.events || []).some((e) => e.kind === "mana" && e.unitId === g && e.amount > 0), "tank gains Holy from blocked damage + callout", r.block)
    ok(U(M.onGraze(s, g), g).mana === 1, "tank gains on a graze")
    // Melee DPS: +5 per hit, +10 more on a kill.
    const m = board(["the-hierophant"], { "the-hierophant": { row: 4, col: 6, mana: 0 }, [E0]: { row: 4, col: 5 }, [E1]: { row: 3, col: 5, hp: 1 } })
    const sc = pid(m, "the-hierophant")
    ok(M.manaRole(U(m, sc)) === "melee", "the-hierophant is melee", M.manaRole(U(m, sc)))
    const m1 = E.attackUnit(m, sc, E0)
    const m2 = E.attackUnit(m, sc, E1)
    r.melee = { hit: U(m1, sc).mana, kill: U(m2, sc).mana }
    // Resources step 2: a Striker builds Combo pips (1 a hit, +1 on a kill).
    ok(U(m1, sc).mana >= 1 && U(m2, sc).mana === U(m1, sc).mana + 1, "melee: hit / kill gains (Combo)", r.melee)
    // Ranged focus: held still at turn end (+high ground / cover).
    const rp = (patch, terrain = {}) => board(["hexbreaker"], { hexbreaker: { row: 4, col: 10, mana: 0, ...patch }, ...far }, terrain)
    const ra = rp({})
    const rid = pid(ra, "hexbreaker")
    ok(M.manaRole(U(ra, rid)) === "ranged", "hexbreaker is ranged", M.manaRole(U(ra, rid)))
    const still = U(E.endPlayerTurn(ra), rid).mana
    const moved = U(E.endPlayerTurn(rp({ moved: true })), rid).mana
    const high = U(E.endPlayerTurn(rp({}, { "4-10": "high" })), rid).mana
    const covered = U(E.endPlayerTurn(rp({}, { "4-9": "rock" })), rid).mana
    r.focus = { still, moved, high, covered }
    ok(still - moved === M.GAIN.focus && high - still === M.GAIN.high && covered - still === M.GAIN.cover, "ranged focus + high ground + cover", r.focus)
    // Healer: healing an ally pays back (+6), healing itself doesn't.
    const hs = board(["the-fool", "bulwark-of-ages"], { "the-fool": { row: 4, col: 8, mana: 20 }, "bulwark-of-ages": { row: 4, col: 7, hp: 10 }, ...far })
    const h = pid(hs, "the-fool")
    const g2 = pid(hs, "bulwark-of-ages")
    const healed = E.castAbility(hs, h, g2)
    const self = E.castAbility({ ...hs, units: hs.units.map((u) => (u.id === h ? { ...u, hp: 5 } : u)) }, h, h)
    r.heal = { ally: U(healed, h).mana, self: U(self, h).mana, hp: U(healed, g2).hp }
    ok(U(healed, g2).hp > 10 && U(healed, h).mana === 20 - 10 + M.GAIN.support && U(self, h).mana === 10, "healer gains when healing an ally", r.heal)
  }

  // 5 Overcharge: store above max, next skill spends it for a bonus -------------
  {
    // Resources step 2: Overcharge is classic (Arcane) mana's - the Controller.
    const s = board(["the-magician"], { "the-magician": { row: 4, col: 8 }, [E0]: { row: 4, col: 5 }, [E1]: { row: 1, col: 0 }, [E2]: { row: 2, col: 0 } })
    const g = pid(s, "the-magician")
    const over = M.gainMana(s, g, 40, "test")
    r.over = { mana: U(over, g).mana, oc: U(over, g).overcharge, cap: M.overchargeCap(U(s, g)) }
    ok(U(over, g).mana === 65 && U(over, g).overcharge === 32, "overflow stored in Overcharge (cap 50%)", r.over)
    // Non-damage skill (Pull): no hit/heal -> bonus as Block.
    const plainPull = U(E.castAbility(s, g, E0, "pull"), g)
    const surged = E.castAbility(over, g, E0, "pull")
    r.overPull = { plain: plainPull.block, surged: U(surged, g).block, oc: U(surged, g).overcharge, surge: M.surgeFor(U(over, g)) }
    ok(U(surged, g).block === (plainPull.block || 0) + M.surgeFor(U(over, g)) && U(surged, g).overcharge === 0, "Overcharge spent: +Block bonus", r.overPull)
    // Damage skill: +damage (60% mana: no Surge / Empowered steps in the way).
    const d = board(["hexbreaker"], { hexbreaker: { row: 4, col: 6, mana: 30 }, [E0]: { row: 4, col: 5 } })
    const sc = pid(d, "hexbreaker")
    const dOver = { ...d, units: d.units.map((u) => (u.id === sc ? { ...u, overcharge: 20 } : u)) }
    const base = 40 - U(E.castAbility(d, sc, E0, "elemental-strike"), E0).hp
    const boosted = 40 - U(E.castAbility(dOver, sc, E0, "elemental-strike"), E0).hp
    r.overDmg = { base, boosted, surge: M.surgeFor(U(dOver, sc)) }
    ok(boosted === base + M.surgeFor(U(dOver, sc)), "Overcharge spent: +damage", r.overDmg)
    // Profiles without overflow (Nature) just cap.
    const hh = board(["the-fool"], { "the-fool": { row: 4, col: 8, mana: 90 }, ...far })
    const f = pid(hh, "the-fool")
    ok(U(M.gainMana(hh, f, 30, "t"), f).mana === 100 && !U(M.gainMana(hh, f, 30, "t"), f).overcharge, "Nature has no Overcharge: it just caps")
  }

  // 6 Commander mana ultimate -------------------------------------------------------
  {
    // Resources step 2: the Commander's Inspiration starts at 30 - fill it first.
    const s = board(["bulwark-of-ages"], { "bulwark-of-ages": { row: 4, col: 10 }, [CMD]: { row: 8, col: 11, mana: 100 }, ...far })
    ok(!!s.activePower, "has an active power")
    ok(E.activateCommanderPower(board(["bulwark-of-ages"], { "bulwark-of-ages": { row: 4, col: 10 }, ...far })).activePower.timesFired === undefined, "not ready at the fight's start (Inspiration 30/100)")
    const fired = E.activateCommanderPower(s)
    r.ult = { mana: U(fired, CMD).mana, ap: U(fired, CMD).ap, times: fired.activePower.timesFired, used: fired.activePower.used }
    ok(U(fired, CMD).mana === 0 && U(fired, CMD).ap === U(s, CMD).ap - 1 && fired.activePower.timesFired === 1, "ultimate spends ALL mana + 1 AP", r.ult)
    ok(fired.log.some((l) => l.includes(s.activePower.name)), "power effect applied (log)")
    ok(E.activateCommanderPower(fired) === fired, "not again until refilled")
    const refilled = { ...fired, units: fired.units.map((u) => (u.id === CMD ? { ...u, mana: u.manaMax, ap: 2 } : u)) }
    const again = E.activateCommanderPower(refilled)
    ok(again !== refilled && again.activePower.timesFired === 2 && U(again, CMD).mana === 0, "reusable once refilled")
    const half = { ...fired, units: fired.units.map((u) => (u.id === CMD ? { ...u, mana: u.manaMax - 1, ap: 2 } : u)) }
    ok(E.activateCommanderPower(half) === half, "needs a FULL bar")
    // Without mana: the old once-per-battle Power.
    const plain = E.createTacticsBattle("default", ["bulwark-of-ages"])
    const p1 = E.activateCommanderPower(plain)
    const p2 = E.activateCommanderPower({ ...p1, units: p1.units.map((u) => (u.id === CMD ? { ...u, ap: 2 } : u)) })
    ok(p1 !== plain && p2.activePower.timesFired === 1, "no-mana fights keep once per battle")
    // Tutorial still accepts it (activePower.used).
    ok(T.TRAINING_STEPS.find((x) => x.id === "power").done(fired), "tutorial power step done")
    ok(T.buildTrainingBattle().manaRules === true, "tutorial runs with mana")
  }

  // 7 Restore: potion, relics, skills ---------------------------------------------------
  {
    const s = board(["hexbreaker"], { hexbreaker: { row: 4, col: 10, mana: 0, potions: ["mana-draught"] }, ...far })
    const g = pid(s, "hexbreaker")
    const d1 = M.drinkPotion(s, g)
    r.potion = { mana: U(d1, g).mana, ap: U(d1, g).ap, used: U(d1, g).potionsUsed }
    ok(U(d1, g).mana === 25 && U(d1, g).ap === 1 && U(d1, g).potionsUsed[0] === "mana-draught", "potion restores 25 for 1 AP", r.potion)
    ok(M.drinkPotion(d1, g) === d1, "potion used up")
    const hi = { ...s, units: s.units.map((u) => (u.id === g ? { ...u, mana: 40 } : u)) }
    ok(U(M.drinkPotion(hi, g), g).overcharge === 15, "potion overflow -> Overcharge (50 pool)")
    ok(JSON.stringify(M.potionsFrom(["mana-draught", "twig-charm", "deepwell-tonic"])) === '["mana-draught","deepwell-tonic"]', "potions from equipped items")
    // After the fight the drunk potion leaves the bag.
    const runState = {
      characterId: "tommy",
      deployed: [7],
      bench: [{ key: 7, defId: "hexbreaker" }],
      items: [{ key: 1, defId: "mana-draught", equippedTo: 7, slotIndex: 0 }, { key: 2, defId: "mana-draught", equippedTo: null, slotIndex: null }],
    }
    const after = R.recordFightAftermath(runState, { units: [{ ...U(d1, g), id: "player-hexbreaker-0" }] })
    r.aftermath = { items: after.items.map((i) => i.key), lines: after.lastAftermath }
    ok(after.items.length === 1 && after.items[0].key === 2, "drunk potion removed from the run", r.aftermath)
    // Relics.
    const well = board(["hexbreaker"], { hexbreaker: { row: 4, col: 10 }, ...far }, {}, ["wellspring-stone"])
    ok(M.regenFor(U(well, g)) === M.regenFor(U(s, g)) + 3, "Wellspring Stone +3 regen")
    const chal = board(["hexbreaker"], { hexbreaker: { row: 4, col: 10 }, ...far }, {}, ["brimming-chalice"])
    ok(U(chal, g).manaMax === 60 && U(chal, g).overcharge === 15, "Brimming Chalice: +10 pool, starts with 15 Overcharge", [U(chal, g).manaMax, U(chal, g).overcharge])
    const fang = board(["hexbreaker"], { hexbreaker: { row: 4, col: 6, mana: 0 }, [E0]: { row: 4, col: 5 } }, {}, ["siphon-fang"])
    ok(U(E.attackUnit(fang, g, E0), g).mana === 3, "Siphon Fang: +3 mana on hit")
    // Skill restore: Merchant's Emergency Supply gives an ally 15 mana.
    const mer = board(["grove-merchant", "hexbreaker"], { "grove-merchant": { row: 4, col: 9 }, hexbreaker: { row: 4, col: 10, mana: 0 }, ...far })
    const gm = pid(mer, "grove-merchant")
    const gb = pid(mer, "hexbreaker")
    ok(U(mer, gm).classId === "merchant", "grove-merchant is a Merchant")
    const sup = E.castAbility(mer, gm, gb, "emergency-supply")
    ok(U(sup, gb).mana === 15, "Emergency Supply restores 15 mana", U(sup, gb).mana)
  }

  // 8 Drain / burn both sides ----------------------------------------------------------
  {
    // Resources step 2: this stripped-down Ironmaw would count as a Rage warrior - keep it a caster.
    const s = board(["the-magician"], { "the-magician": { row: 4, col: 6 }, [E0]: { row: 4, col: 5, resource: "arcane" } })
    const mg = pid(s, "the-magician")
    ok(U(s, mg).classId === "controller", "the-magician is a Controller")
    const sil = E.castAbility(s, mg, E0, "silence")
    r.burn = { enemy: U(sil, E0).mana, max: U(s, E0).manaMax }
    ok(U(sil, E0).mana === U(s, E0).manaMax - 15 && (sil.events || []).some((e) => e.kind === "mana" && e.unitId === E0 && e.amount < 0), "Silence burns 15 enemy mana + callout", r.burn)
    const hx = board(["hexmother"], { hexmother: { row: 4, col: 6, mana: 30 }, [E0]: { row: 4, col: 4, resource: "arcane" } })
    const hm = pid(hx, "hexmother")
    const debt = E.castAbility(hx, hm, E0, "soul-debt")
    r.steal = { hexer: U(debt, hm).mana, enemy: U(debt, E0).mana }
    // Ranged rework: mages pay heavier mana (Soul Debt 15 -> 20).
    // Resources step 2: Hexer = Hex Power; Soul Debt is ALL-IN (spends the 30),
    // the 10 stolen mana becomes Hex, and the curse itself builds 15 Hex.
    ok(U(debt, hm).mana === 0 + 10 + RES.hex.gain.debuff && U(debt, E0).mana === U(hx, E0).manaMax - 10, "Soul Debt steals 10 mana", r.steal)
    // Enemy Mana Leech goes for the Commander close to its ultimate.
    const leech = { id: "mana-drain", kind: "drain", cooldown: 3, mana: 5, amount: 15, name: "Mana Leech" }
    const es = board(["bulwark-of-ages"], { "bulwark-of-ages": { row: 4, col: 9 }, [CMD]: { row: 6, col: 8 }, [E0]: { row: 5, col: 5, enemySkills: [leech] } })
    const intent = E.previewEnemyIntents(es).find((i) => i.enemyId === E0)?.intent
    const after = E.endPlayerTurn(es)
    r.leech = { intent: intent && [intent.kind, intent.skillKind, intent.targetId], cmd: U(after, CMD).mana, log: after.log.filter((l) => l.includes("mana")) }
    ok(intent?.skillKind === "drain" && intent.targetId === CMD, "enemy AI drains the Commander near its ultimate", r.leech)
    ok(after.log.some((l) => /steals 1\d mana/.test(l)) && U(after, CMD).mana < 70, "real turn steals the mana", r.leech)
  }

  // 9 Enemy AI respects mana ---------------------------------------------------------------
  {
    const mend = { id: "mend", kind: "mend", cooldown: 2, mana: 15, amount: 10, name: "Sap Mend" }
    const mk = (mana) => board(["bulwark-of-ages"], { "bulwark-of-ages": { row: 4, col: 11 }, [E0]: { row: 4, col: 1, enemySkills: [mend], mana }, [E1]: { row: 4, col: 0, hp: 10 } })
    // Enemy regen lands at enemy-phase start (a healer-role pool: 0 -> 11 < 15).
    const broke = mk(0)
    const rich = mk(45)
    const iBroke = E.previewEnemyIntents(broke).find((i) => i.enemyId === E0).intent
    const iRich = E.previewEnemyIntents(rich).find((i) => i.enemyId === E0).intent
    const realBroke = E.endPlayerTurn(broke)
    r.ai = { broke: iBroke.skillKind || iBroke.kind, rich: iRich.skillKind || iRich.kind, hpAfterBroke: U(realBroke, E1).hp }
    ok(iBroke.skillKind !== "mend" && iRich.skillKind === "mend" && U(realBroke, E1).hp === 10, "enemy can't cast without mana", r.ai)
    const realRich = E.endPlayerTurn(rich)
    ok(U(realRich, E0).mana === Math.min(U(rich, E0).manaMax, 45 + M.regenFor(U(rich, E0))) - 15, "enemy pays mana for the skill", U(realRich, E0).mana)
  }

  // 10 Preview == real over several turns (mana battle with casters) -----------------------
  {
    let s = M.enableMana(E.createRealMatchupBattle(["bulwark-of-ages", "the-fool"], ["hex-acolyte", "mossmender", "silence-weaver"], "tommy"))
    const rows = []
    for (let turn = 0; turn < 5 && s.phase === "player"; turn++) {
      const pv = E.previewEnemyIntents(s)
      const pv2 = E.previewEnemyIntents(s)
      const after = E.endPlayerTurn(s)
      for (const { enemyId, intent } of pv) {
        const before = U(s, enemyId)
        const now = U(after, enemyId)
        if (!now) continue
        let good = JSON.stringify(pv) === JSON.stringify(pv2)
        if (intent.kind === "move" || intent.kind === "move-attack") good = good && now.pos.row === intent.to.row && now.pos.col === intent.to.col
        if (intent.kind === "skill" && intent.phase !== "release" && intent.skillKind !== "enrage") {
          good = good && (now.skillCd || {})[intent.skillId] > 0
          // It could afford it after its own regen.
          good = good && before.mana + M.regenFor(before) >= M.manaCostOf((now.enemySkills || []).find((k) => k.id === intent.skillId) || { kind: intent.skillKind })
        }
        rows.push({ turn, enemyId, kind: intent.skillKind || intent.kind, good })
      }
      s = after
    }
    r.previewRows = rows.length
    r.previewSkills = rows.filter((x) => x.kind !== "move" && x.kind !== "attack" && x.kind !== "move-attack" && x.kind !== "hold").map((x) => `${x.turn}:${x.kind}`)
    ok(rows.length > 4 && rows.every((x) => x.good), "preview == real (with mana) over several turns", rows.filter((x) => !x.good))
  }

  // 11 Data: skill costs + Studio fields ----------------------------------------------------
  {
    const all = Object.values(C.CLASSES).flatMap((c) => c.skills)
    // Ranged rework: 92 -> 94 class skills (+Ricochet, Arcane Lance, Pinning Shot, Smoke Screen; -Decoy, Poison Mine).
    // Melee rework: 94 -> 101 class skills (+Provoke, Bastion, Hook, Finishing Blow, Lunge, Vanish, Leap);
    // prices are in each class's own resource now (0 = a free builder).
    ok(all.length === 101 && all.every((k) => typeof k.mana === "number" && k.mana >= 0 && k.mana <= 40), "every class skill has a price", all.length)
    ok(Object.values(C.CLASSES).every((c) => typeof c.manaPool === "number"), "every class has a manaPool")
    const { enemySkillTable } = await import("/src/services/heartwood/tacticsEnemyAbilities.js")
    const drainers = Object.entries(enemySkillTable()).filter(([, ks]) => ks.some((k) => k.kind === "drain")).map(([id]) => id)
    r.drainers = drainers
    ok(drainers.length >= 5, "several enemies carry Mana Leech", drainers)
    const { ALL_TYPES } = await import("/src/components/hearthwood-studio/entityTypes.js")
    ok(ALL_TYPES.some((t) => t.type === "classes") && ALL_TYPES.find((t) => t.type === "units").label === "Heroes", "Studio lists Hero Classes & Mana")
    ok(T.TRAINING_STEPS.some((x) => /mana/i.test(x.text)) && !T.TRAINING_STEPS.some((x) => /\bunits?\b/i.test(x.text)), "tutorial says hero + explains mana")
  }

  r.fails = fails
  return r
})
out.engine = engine
out.errors.push(...engine.fails)

// Studio reader: the classes type exposes manaPool + each skill's mana.
try {
  const json = JSON.parse(execFileSync(process.execPath, ["scripts/hearthwood-read-entities.mjs", "--type", "classes"], { encoding: "utf8", maxBuffer: 8e6 }))
  const g = json.entities.find((e) => e.id === "guardian")
  const skill = g.fields.skills.items[0].fields
  out.studio = { count: json.entities.length, pool: g.fields.manaPool, skillMana: skill.mana }
  if (!(json.entities.length === 38 && g.fields.manaPool.value === 45 && skill.mana.kind === "number")) out.errors.push("Studio: classes mana fields")
} catch (e) {
  out.errors.push(`Studio reader failed: ${e.message.slice(0, 200)}`)
}

// --- UI -------------------------------------------------------------------------
{
  await page.goto(`http://localhost:${PORT}/heartwood-tactics?rolls=0`, { waitUntil: "domcontentloaded" })
  await page.waitForSelector(".hwt-board")
  const tokens = await page.locator(".hwt-token").count()
  const bars = await page.locator(".hwt-token .hwt-mana-track").count()
  const enemyBars = await page.locator('.hwt-token[data-side="enemy"] .hwt-mana-track').count()
  const squadMana = await page.locator(".hwt-sb-mana-num").count()
  await page.locator('.hwt-token[data-unit-id="player-bulwark-of-ages-0"]').click()
  await page.waitForSelector(".hwt-skill-btn")
  const costGems = await page.locator(".hwt-skill-btn .hwt-skill-mana").allInnerTexts()
  const stat = await page.locator('.hwt-selected-stats [data-stat="mana"]').innerText()
  const abil = await page.locator(".hwt-ability-btn").innerText()
  out.ui = { tokens, bars, enemyBars, squadMana, costGems, stat, abil }
  if (!(bars === tokens && enemyBars >= 3 && squadMana >= 5)) out.errors.push("UI: blue mana bars on every hero + enemy, squad bar numbers")
  // Resources step 2: the Guardian's costs + stat are in Holy Power pips.
  if (!(costGems.length === 3 && costGems.every((t) => /Holy/.test(t)) && stat.includes("1/5") && abil.includes("1 Holy"))) out.errors.push("UI: skill costs + selected resource")
  await page.screenshot({ path: `${SHOT_DIR}/mana_1_fight.png` })
  // Callout: the Commander ultimate drains the bar (-N mana) and the panel says why it's off.
  // (Resources step 2: Inspiration starts at 30 - QA start full.)
  await page.goto(`http://localhost:${PORT}/heartwood-tactics?rolls=0&manaStart=100`, { waitUntil: "domcontentloaded" })
  await page.waitForSelector(".hwt-board")
  await page.locator(".hwt-power-btn").click()
  await page.waitForSelector(".hw-floating-number--mana-drain", { timeout: 3000 }).catch(() => {})
  const drainPop = await page.locator(".hw-floating-number--mana-drain").count()
  const status = await page.locator(".hwt-power-status").innerText()
  const powerDisabled = await page.locator(".hwt-power-btn").isDisabled()
  out.ui.ultimate = { drainPop, status, powerDisabled }
  if (!(drainPop > 0 && powerDisabled && status.includes("needs a full Inspiration bar"))) out.errors.push("UI: ultimate spends the bar, callout, panel status")
  // "+N" gain callout from real clicks. Resources step 2: healing a FULL-HP
  // ally no longer pays (Nature pays per real heal) - the Guardian's free
  // Bodyguard on its neighbour builds 1 Holy Power instead.
  await page.goto(`http://localhost:${PORT}/heartwood-tactics?rolls=0`, { waitUntil: "domcontentloaded" })
  await page.waitForSelector(".hwt-board")
  await page.locator('.hwt-token[data-unit-id="player-bulwark-of-ages-0"]').click()
  await page.locator('.hwt-skill-btn[data-skill-id="guard"]').click()
  await page.locator('.hwt-token[data-unit-id="player-the-fool-1"]').click()
  await page.waitForSelector(".hw-floating-number--mana", { timeout: 3000 }).catch(() => {})
  const gainPop = await page.locator(".hw-floating-number--mana").allInnerTexts()
  out.ui.gainPop = gainPop
  if (!gainPop.some((t) => /\+1 Holy/.test(t))) out.errors.push("UI: '+1 Holy' callout on a Bodyguard")
}
{
  // Greyed skills when short on mana.
  // Resources step 2: an Arcane hero (the Spellblade) - the Guardian's Holy pips max at 5.
  await page.goto(`http://localhost:${PORT}/heartwood-tactics?rolls=0&manaStart=5`, { waitUntil: "domcontentloaded" })
  await page.waitForSelector(".hwt-board")
  await page.locator('.hwt-token[data-unit-id="player-hexbreaker-2"]').click()
  await page.waitForSelector(".hwt-skill-btn")
  const btns = page.locator(".hwt-skill-btn")
  const n = await btns.count()
  const states = []
  for (let i = 0; i < n; i++) states.push({ disabled: await btns.nth(i).isDisabled(), noMana: await btns.nth(i).getAttribute("data-no-mana"), title: await btns.nth(i).getAttribute("title"), cost: await btns.nth(i).locator(".hwt-skill-cost").innerText() })
  const abil = await page.locator(".hwt-ability-btn").innerText()
  const abilDisabled = await page.locator(".hwt-ability-btn").isDisabled()
  out.ui.greyed = { states: states.map((x) => [x.disabled, x.noMana, x.cost]), abil, abilDisabled }
  if (!(states.length === 3 && states.every((x) => x.disabled && x.noMana === "true" && x.title.includes("Not enough mana") && x.cost.startsWith("Needs")) && abilDisabled && /Needs \d+ mana/.test(abil))) out.errors.push("UI: unaffordable skills greyed with the reason")
  // Overwatch / Hunker stay free + hero wording.
  const ow = await page.locator(".hwt-universal-btn[data-action=overwatch]").isDisabled()
  const owTitle = await page.locator(".hwt-universal-btn[data-action=overwatch]").getAttribute("title")
  if (ow || !owTitle.includes("hero's turn")) out.errors.push("UI: Overwatch free + 'hero' wording")
  // Deploy wording.
  await page.goto(`http://localhost:${PORT}/heartwood-tactics?deploy=1`, { waitUntil: "domcontentloaded" })
  await page.waitForSelector(".hwt-board")
  const sub = await page.locator(".hwt-turn-sub").innerText()
  out.ui.deploySub = sub
  if (!/place your heroes/i.test(sub)) out.errors.push("UI: deploy says heroes")
}
out.pageErrors = errs
if (errs.length) out.errors.push(`page errors: ${errs.slice(0, 3).join(" | ")}`)
await browser.close()
console.log(JSON.stringify(out, null, 1))
console.log(out.errors.length ? `FAIL (${out.errors.length})` : "PASS")
process.exit(out.errors.length ? 1 : 0)
