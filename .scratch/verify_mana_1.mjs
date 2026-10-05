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
    ok(heroes.every((u) => u.manaMax === C.CLASSES[u.classId].manaPool && u.mana === u.manaMax), "hero pool = class manaPool, starts full", r.pools)
    const g = U(s, pid(s, "bulwark-of-ages"))
    const h = U(s, pid(s, "the-fool"))
    ok(g.manaMax === 45 && h.manaMax === 75 && g.manaMax < h.manaMax, "tank small, healer big", [g.manaMax, h.manaMax])
    ok(s.units.filter((u) => u.side === "enemy").every((u) => u.manaMax > 0 && u.mana === u.manaMax), "enemies have full mana")
    ok(s.manaRules === true, "manaRules on")
    // Bosses get a bigger pool.
    const boss = M.enableMana(E.createRealMatchupBattle(["bulwark-of-ages"], ["deepwarden"], "tommy")).units.find((u) => u.side === "enemy")
    r.boss = [boss.defId, boss.phases?.length, boss.manaMax]
    ok(boss.phases?.length > 0 ? boss.manaMax === M.MANA_POOL[M.manaRole(boss)] + M.BOSS_POOL_BONUS : true, "boss pool bonus", r.boss)
    // Without enableMana nothing changes (old synthetic states).
    const plain = E.createTacticsBattle("default", ["bulwark-of-ages"])
    ok(plain.units.every((u) => u.mana === undefined) && !plain.manaRules, "no mana fields without enableMana")
    // Reset per fight: a spent hero is full again in the next fight.
    const spent = { ...s, units: s.units.map((u) => (u.id === g.id ? { ...u, mana: 0 } : u)) }
    const next = M.enableMana(E.createTacticsBattle("default", ["bulwark-of-ages", "the-fool", "swiftclaw", "sparrowthorn"]))
    ok(U(spent, g.id).mana === 0 && U(next, g.id).mana === 45, "next fight starts full again")
  }

  // 2 Costs gate skills; basics are free --------------------------------------
  {
    const low = board(["bulwark-of-ages"], { "bulwark-of-ages": { row: 4, col: 6, mana: 5 }, [E0]: { row: 4, col: 5 } })
    const g = pid(low, "bulwark-of-ages")
    ok(E.castAbility(low, g, null, "shield-wall") === low, "class skill refused without mana")
    ok(E.castAbility(low, g) === low, "signature refused without mana")
    ok(CF.classSkillStatus(U(low, g), U(low, g).classSkills.find((k) => k.id === "shield-wall")) === "Needs 15 mana", "status says why", CF.classSkillStatus(U(low, g), U(low, g).classSkills[1]))
    ok(!CF.classSkillUsable(low, U(low, g), U(low, g).classSkills[1]), "class skill not usable")
    const full = board(["bulwark-of-ages"], { "bulwark-of-ages": { row: 4, col: 6 }, [E0]: { row: 4, col: 5 } })
    const cast = E.castAbility(full, g, null, "shield-wall")
    r.cast = { mana: U(cast, g).mana, ap: U(cast, g).ap, cd: U(cast, g).classCds }
    ok(U(cast, g).mana === 30 && U(cast, g).ap === 1 && U(cast, g).classCds["shield-wall"] > 0, "skill costs AP + mana + keeps cooldown", r.cast)
    const sig = E.castAbility(full, g)
    ok(U(sig, g).mana === 35 && U(sig, g).cooldownRemaining > 0, "signature costs mana", U(sig, g).mana)
    // Free basics: attack, move, overwatch, hunker.
    const mid = board(["bulwark-of-ages"], { "bulwark-of-ages": { row: 4, col: 6, mana: 20 }, [E0]: { row: 4, col: 5 } })
    ok(U(E.attackUnit(mid, g, E0), g).mana === 20, "attack free (tank gains nothing on hit)")
    ok(U(E.moveUnit(mid, g, { row: 5, col: 7 }), g).mana === 20, "move free")
    ok(U(E.overwatchAction(mid, g), g).mana === 20, "overwatch free")
    ok(U(E.hunkerDown(mid, g), g).mana === 20, "hunker free")
  }

  // 3 Regen (medium) ------------------------------------------------------------------
  {
    const s = board(["bulwark-of-ages", "the-fool"], { "bulwark-of-ages": { row: 4, col: 11, mana: 0 }, "the-fool": { row: 6, col: 11, mana: 0 }, [CMD]: { row: 8, col: 11, mana: 0 }, ...far })
    const g = pid(s, "bulwark-of-ages")
    const h = pid(s, "the-fool")
    const a = E.endPlayerTurn(s)
    r.regen = { tank: U(a, g).mana, healer: U(a, h).mana, cmd: U(a, CMD).mana, enemy: U(a, E0).mana }
    ok(U(a, g).mana === M.regenFor(U(s, g)) && U(a, g).mana >= 4 && U(a, g).mana <= 6, "tank regen ~10% (one cheap skill per ~2 turns)", r.regen)
    ok(U(a, h).mana === Math.round(75 * 0.1) + M.CASTER_REGEN, "healer steady extra regen", r.regen)
    ok(U(a, CMD).mana === Math.round(70 * 0.1) + M.CASTER_REGEN + M.COMMANDER_REGEN, "commander regen", r.regen)
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
    ok(U(hit, g).mana === Math.min(M.GAIN.blockMax, 6) && (hit.events || []).some((e) => e.kind === "mana" && e.unitId === g && e.amount > 0), "tank gains mana from blocked damage + callout", r.block)
    ok(U(M.onGraze(s, g), g).mana === M.GAIN.graze, "tank gains on a graze")
    // Melee DPS: +5 per hit, +10 more on a kill.
    const m = board(["the-hierophant"], { "the-hierophant": { row: 4, col: 6, mana: 0 }, [E0]: { row: 4, col: 5 }, [E1]: { row: 3, col: 5, hp: 1 } })
    const sc = pid(m, "the-hierophant")
    ok(M.manaRole(U(m, sc)) === "melee", "the-hierophant is melee", M.manaRole(U(m, sc)))
    const m1 = E.attackUnit(m, sc, E0)
    const m2 = E.attackUnit(m, sc, E1)
    r.melee = { hit: U(m1, sc).mana, kill: U(m2, sc).mana }
    ok(U(m1, sc).mana === M.GAIN.hit && U(m2, sc).mana === M.GAIN.hit + M.GAIN.kill, "melee: hit / kill gains", r.melee)
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
    const s = board(["bulwark-of-ages"], { "bulwark-of-ages": { row: 4, col: 6 }, ...far })
    const g = pid(s, "bulwark-of-ages")
    const over = M.gainMana(s, g, 30, "test")
    r.over = { mana: U(over, g).mana, oc: U(over, g).overcharge, cap: M.overchargeCap(U(s, g)) }
    ok(U(over, g).mana === 45 && U(over, g).overcharge === 22, "overflow stored in Overcharge (cap 50%)", r.over)
    // Self-buff skill: no hit/heal -> bonus as Block.
    const plainWall = U(E.castAbility(s, g, null, "shield-wall"), g)
    const surged = E.castAbility(over, g, null, "shield-wall")
    r.overWall = { plain: plainWall.block, surged: U(surged, g).block, oc: U(surged, g).overcharge, surge: M.surgeFor(U(over, g)) }
    ok(U(surged, g).block === plainWall.block + M.surgeFor(U(over, g)) && U(surged, g).overcharge === 0, "Overcharge spent: +Block bonus", r.overWall)
    // Damage skill: +damage.
    const d = board(["swiftclaw"], { swiftclaw: { row: 4, col: 6 }, [E0]: { row: 4, col: 5 } })
    const sc = pid(d, "swiftclaw")
    const dOver = M.gainMana(d, sc, 20, "t")
    const base = 40 - U(E.castAbility(d, sc, E0, "exploit-opening"), E0).hp
    const boosted = 40 - U(E.castAbility(dOver, sc, E0, "exploit-opening"), E0).hp
    r.overDmg = { base, boosted, surge: M.surgeFor(U(dOver, sc)) }
    ok(boosted === base + M.surgeFor(U(dOver, sc)), "Overcharge spent: +damage", r.overDmg)
    // Healer: +heal.
    const hh = board(["the-fool", "bulwark-of-ages"], { "the-fool": { row: 4, col: 8 }, "bulwark-of-ages": { row: 4, col: 7, hp: 5 }, ...far })
    const f = pid(hh, "the-fool")
    const b = pid(hh, "bulwark-of-ages")
    const hOver = M.gainMana(hh, f, 30, "t")
    const h1 = U(E.castAbility(hh, f, b), b).hp
    const h2 = U(E.castAbility(hOver, f, b), b).hp
    ok(h2 === h1 + M.surgeFor(U(hOver, f)), "Overcharge spent: +heal", [h1, h2])
  }

  // 6 Commander mana ultimate -------------------------------------------------------
  {
    const s = board(["bulwark-of-ages"], { "bulwark-of-ages": { row: 4, col: 10 }, ...far })
    ok(!!s.activePower, "has an active power")
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
    const s = board(["bulwark-of-ages"], { "bulwark-of-ages": { row: 4, col: 10, mana: 0, potions: ["mana-draught"] }, ...far })
    const g = pid(s, "bulwark-of-ages")
    const d1 = M.drinkPotion(s, g)
    r.potion = { mana: U(d1, g).mana, ap: U(d1, g).ap, used: U(d1, g).potionsUsed }
    ok(U(d1, g).mana === 25 && U(d1, g).ap === 1 && U(d1, g).potionsUsed[0] === "mana-draught", "potion restores 25 for 1 AP", r.potion)
    ok(M.drinkPotion(d1, g) === d1, "potion used up")
    const hi = { ...s, units: s.units.map((u) => (u.id === g ? { ...u, mana: 40 } : u)) }
    ok(U(M.drinkPotion(hi, g), g).overcharge === 20, "potion overflow -> Overcharge")
    ok(JSON.stringify(M.potionsFrom(["mana-draught", "twig-charm", "deepwell-tonic"])) === '["mana-draught","deepwell-tonic"]', "potions from equipped items")
    // After the fight the drunk potion leaves the bag.
    const runState = {
      characterId: "tommy",
      deployed: [7],
      bench: [{ key: 7, defId: "bulwark-of-ages" }],
      items: [{ key: 1, defId: "mana-draught", equippedTo: 7, slotIndex: 0 }, { key: 2, defId: "mana-draught", equippedTo: null, slotIndex: null }],
    }
    const after = R.recordFightAftermath(runState, { units: [{ ...U(d1, g), id: "player-bulwark-of-ages-0" }] })
    r.aftermath = { items: after.items.map((i) => i.key), lines: after.lastAftermath }
    ok(after.items.length === 1 && after.items[0].key === 2, "drunk potion removed from the run", r.aftermath)
    // Relics.
    const well = board(["bulwark-of-ages"], { "bulwark-of-ages": { row: 4, col: 10 }, ...far }, {}, ["wellspring-stone"])
    ok(M.regenFor(U(well, g)) === M.regenFor(U(s, g)) + 3, "Wellspring Stone +3 regen")
    const chal = board(["bulwark-of-ages"], { "bulwark-of-ages": { row: 4, col: 10 }, ...far }, {}, ["brimming-chalice"])
    ok(U(chal, g).manaMax === 55 && U(chal, g).overcharge === 15, "Brimming Chalice: +10 pool, starts with 15 Overcharge", [U(chal, g).manaMax, U(chal, g).overcharge])
    const fang = board(["bulwark-of-ages"], { "bulwark-of-ages": { row: 4, col: 6, mana: 0 }, [E0]: { row: 4, col: 5 } }, {}, ["siphon-fang"])
    ok(U(E.attackUnit(fang, g, E0), g).mana === 3, "Siphon Fang: +3 mana on hit")
    // Skill restore: Merchant's Emergency Supply gives an ally 15 mana.
    const mer = board(["grove-merchant", "bulwark-of-ages"], { "grove-merchant": { row: 4, col: 9 }, "bulwark-of-ages": { row: 4, col: 10, mana: 0 }, ...far })
    const gm = pid(mer, "grove-merchant")
    const gb = pid(mer, "bulwark-of-ages")
    ok(U(mer, gm).classId === "merchant", "grove-merchant is a Merchant")
    const sup = E.castAbility(mer, gm, gb, "emergency-supply")
    ok(U(sup, gb).mana === 15, "Emergency Supply restores 15 mana", U(sup, gb).mana)
  }

  // 8 Drain / burn both sides ----------------------------------------------------------
  {
    const s = board(["the-magician"], { "the-magician": { row: 4, col: 6 }, [E0]: { row: 4, col: 5 } })
    const mg = pid(s, "the-magician")
    ok(U(s, mg).classId === "controller", "the-magician is a Controller")
    const sil = E.castAbility(s, mg, E0, "silence")
    r.burn = { enemy: U(sil, E0).mana, max: U(s, E0).manaMax }
    ok(U(sil, E0).mana === U(s, E0).manaMax - 15 && (sil.events || []).some((e) => e.kind === "mana" && e.unitId === E0 && e.amount < 0), "Silence burns 15 enemy mana + callout", r.burn)
    const hx = board(["hexmother"], { hexmother: { row: 4, col: 6, mana: 30 }, [E0]: { row: 4, col: 4 } })
    const hm = pid(hx, "hexmother")
    const debt = E.castAbility(hx, hm, E0, "soul-debt")
    r.steal = { hexer: U(debt, hm).mana, enemy: U(debt, E0).mana }
    ok(U(debt, hm).mana === 30 - 15 + 10 && U(debt, E0).mana === U(hx, E0).manaMax - 10, "Soul Debt steals 10 mana", r.steal)
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
    ok(all.length === 92 && all.every((k) => typeof k.mana === "number" && k.mana >= 10 && k.mana <= 35), "every class skill has a mana cost", all.length)
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
  if (!(costGems.length === 2 && costGems.every((t) => /^\d+ mana$/.test(t)) && stat.includes("45/45") && abil.includes("10 mana"))) out.errors.push("UI: skill costs + selected mana")
  await page.screenshot({ path: `${SHOT_DIR}/mana_1_fight.png` })
  // Callout: the Commander ultimate drains the bar (-N mana) and the panel says why it's off.
  await page.locator(".hwt-power-btn").click()
  await page.waitForSelector(".hw-floating-number--mana-drain", { timeout: 3000 }).catch(() => {})
  const drainPop = await page.locator(".hw-floating-number--mana-drain").count()
  const status = await page.locator(".hwt-power-status").innerText()
  const powerDisabled = await page.locator(".hwt-power-btn").isDisabled()
  out.ui.ultimate = { drainPop, status, powerDisabled }
  if (!(drainPop > 0 && powerDisabled && status.includes("needs a full mana bar"))) out.errors.push("UI: ultimate spends the bar, callout, panel status")
  // "+N mana" gain callout from real clicks: the healer heals its neighbour.
  await page.goto(`http://localhost:${PORT}/heartwood-tactics?rolls=0`, { waitUntil: "domcontentloaded" })
  await page.waitForSelector(".hwt-board")
  await page.locator('.hwt-token[data-unit-id="player-the-fool-1"]').click()
  await page.locator(".hwt-ability-btn").click()
  await page.locator('.hwt-token[data-unit-id="player-bulwark-of-ages-0"]').click()
  await page.waitForSelector(".hw-floating-number--mana", { timeout: 3000 }).catch(() => {})
  const gainPop = await page.locator(".hw-floating-number--mana").allInnerTexts()
  out.ui.gainPop = gainPop
  if (!gainPop.some((t) => /\+6 mana/.test(t))) out.errors.push("UI: '+N mana' callout on a heal")
}
{
  // Greyed skills when short on mana.
  await page.goto(`http://localhost:${PORT}/heartwood-tactics?rolls=0&manaStart=5`, { waitUntil: "domcontentloaded" })
  await page.waitForSelector(".hwt-board")
  await page.locator('.hwt-token[data-unit-id="player-bulwark-of-ages-0"]').click()
  await page.waitForSelector(".hwt-skill-btn")
  const btns = page.locator(".hwt-skill-btn")
  const n = await btns.count()
  const states = []
  for (let i = 0; i < n; i++) states.push({ disabled: await btns.nth(i).isDisabled(), noMana: await btns.nth(i).getAttribute("data-no-mana"), title: await btns.nth(i).getAttribute("title"), cost: await btns.nth(i).locator(".hwt-skill-cost").innerText() })
  const abil = await page.locator(".hwt-ability-btn").innerText()
  const abilDisabled = await page.locator(".hwt-ability-btn").isDisabled()
  out.ui.greyed = { states: states.map((x) => [x.disabled, x.noMana, x.cost]), abil, abilDisabled }
  if (!(states.length === 2 && states.every((x) => x.disabled && x.noMana === "true" && x.title.includes("Not enough mana") && x.cost.startsWith("Needs")) && abilDisabled && abil.includes("Needs 10 mana"))) out.errors.push("UI: unaffordable skills greyed with the reason")
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
