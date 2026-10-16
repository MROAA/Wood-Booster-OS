// Dota depth 2 sprint (data/heartwood/talents.js + neutrals.js,
// itemBuilds.js COUNTER_KITS / ENEMY_TALENTS, services/heartwood/
// tacticsTalents.js + neutrals.js, unitLevels / runEngine / campaignEngine
// wiring): a Dota-style TALENT TREE for all 38 classes (Lv2 + Lv4 level-ups
// ARE the talent pick), NEUTRAL ITEMS (drops by tier, one slot per hero, a
// stash), five more enemy COUNTER KITS (Bloodfang, Splitting Spores,
// Burrower, Thornmirror, Hushcap) and ENEMY TALENTS by threat tier.
//
// Part 1 = pure-engine checks, straight in node (memory-tight machine):
//   `ENGINE_ONLY=1 node .scratch/verify_dota_depth_2.mjs`
// Part 2 = a few UI checks + screenshots (vite on PORT, default 5451).
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
const rt = await import(`${SRC}runEngine.js`)
const te = await import(`${SRC}tacticsEngine.js`)
const TT = await import(`${SRC}tacticsTalents.js`)
const I = await import(`${SRC}tacticsItems.js`)
const NS = await import(`${SRC}neutrals.js`)
const LV = await import(`${SRC}unitLevels.js`)
const CE = await import(`${SRC}campaignEngine.js`)
const F = await import(`${SRC}itemForge.js`)
const cls = await import(`${SRC}tacticsClasses.js`)
const { buildRunTacticsBattle } = await import(`${SRC}tacticsRealMatchup.js`)
const { CLASSES } = await import(`${DATA}classes.js`)
const TD = await import(`${DATA}talents.js`)
const ND = await import(`${DATA}neutrals.js`)
const B = await import(`${DATA}itemBuilds.js`)
const { ITEMS } = await import(`${DATA}items.js`)

const fails = []
const results = {}
let n = 0
const ok = (cond, label, data) => {
  n++
  if (!cond) fails.push(`${label}${data !== undefined ? " " + JSON.stringify(data).slice(0, 400) : ""}`)
}

const actNode = (act, type = "battle") => rt.RUN_PATH.findIndex((nd, i) => nd.type === type && nd.formationId && rt.actIndexForNode(i, rt.RUN_PATH.length) === act)
const hero = (key, defId, extra = {}) => ({ key, defId, upgradeLevel: 0, upgrades: [], ...extra })
const it = (key, defId, owner = null, slot = null) => ({ key, defId, equippedTo: owner, slotIndex: slot })
const mk = (bench, act = 2, extra = {}, type = "battle") => {
  const idx = actNode(act, type)
  return {
    ...rt.startRun("tommy", null, { forcedSeed: 777 }),
    nodeIndex: idx,
    path: rt.RUN_PATH.slice(0, idx + 1),
    phase: "formation",
    bench,
    deployed: [...bench.map((e) => e.key), null, null, null, null].slice(0, 4),
    items: [],
    itemKeyCounter: 100,
    essence: 1000,
    lastSeenAct: act,
    ...extra,
  }
}
const start = (rs) => rt.startTacticsFormationBattle(rs, (s) => buildRunTacticsBattle(rs, s)).battle
const U = (b, pre) => b.units.find((u) => u.id.startsWith(pre))
const place = (s, id, row, col, extra = {}) => ({ ...s, units: s.units.map((u) => (u.id === id ? { ...u, pos: { row, col }, ...extra } : u)) })
const patch = (s, id, extra) => ({ ...s, units: s.units.map((u) => (u.id === id ? { ...u, ...extra } : u)) })
const clean = (b) => {
  let far = 0
  return {
    ...b,
    terrain: {},
    objective: null,
    phase: "player",
    noGraze: true,
    wallHp: {},
    objHp: {},
    units: b.units.map((u) => ({ ...u, pos: { row: 9, col: far++ }, ...(u.side === "enemy" ? { stun: 0, block: 0, ward: 0, evade: 0, revive: 0, bulwark: 0, kit: null, armor: 0, shell: 0, shellMax: 0, blurCharges: 0, shroud: false, enemyTalents: [] } : {}) })),
  }
}
const foes = (b) => b.units.filter((u) => u.side === "enemy" && u.hp > 0)
// A hero of class `c` (a hatchling-style class override on one def).
const classHero = (c, extra = {}) => hero("b0", "hexbreaker", { classId: c, ...extra })
// Cast skill `skillId` of `uid` on its first valid target (enemy / ally / tile / self).
const castOn = (s, uid, skillId) => {
  const u = te.getUnit(s, uid)
  const sk = cls.classSkillById(u, skillId)
  if (!sk) return s
  if (sk.target === "self") return te.castAbility(s, uid, null, skillId)
  if (sk.target === "tile") {
    const t = cls.classSkillTiles(s, uid, sk)[0]
    return t ? te.castAbility(s, uid, `${t.row}-${t.col}`, skillId) : s
  }
  const t = cls.classSkillTargets(s, uid, sk)[0]
  return t ? te.castAbility(s, uid, t.id, skillId) : s
}

// =========================================================== A. The tree
{
  const ids = Object.keys(CLASSES)
  ok(ids.length === 38, "A1 38 classes", ids.length)
  ok(JSON.stringify(TD.TALENT_LEVELS) === "[2,4]" && LV.MAX_LEVEL === 5, "A2 talent rows at Lv2 + Lv4 (cap 5)")
  const bad = []
  const all = []
  for (const c of ids) {
    const tree = TD.talentTreeFor(c)
    if (tree.length !== TD.TALENT_LEVELS.length) bad.push(`${c}: ${tree.length} rows`)
    for (const row of tree) {
      for (const side of ["L", "R"]) {
        const t = row[side]
        if (!t || !t.name || !t.text || !t.fx || !Object.keys(t.fx).length || t.id !== `${c}:${row.tier}${side}`) bad.push(`${c}:${row.tier}${side}`)
        else all.push(t)
      }
      if (row.L && row.R && row.L.text === row.R.text) bad.push(`${c}:${row.tier} same L/R`)
    }
  }
  ok(!bad.length, "A3 every class: 2 rows x (left, right), each a real talent", bad.slice(0, 8))
  ok(all.length === 152, "A4 152 talents in all", all.length)
  ok(ids.every((c) => TD.talentTreeFor(c).some((r) => r.L.twist || r.R.twist)), "A5 every class has its own twist talent")
  const playChangers = all.filter((t) => t.fx.charges || t.fx.cd || t.fx.skillFx || t.fx.manaCut || t.fx.range || t.fx.radius || t.fx.ap).length
  const manaish = all.filter((t) => t.fx.castMana || t.fx.hitMana || t.fx.killMana || t.fx.manaShield || t.fx.manaPool || t.fx.regen || t.fx.firstFree || t.fx.cheaper || t.fx.manaCut || t.fx.mods).length
  ok(playChangers >= 90, "A6 most talents change how a skill plays (charge / recharge / area / range / cost)", playChangers)
  ok(manaish >= 45, "A7 many talents are about the resource (mana is the core fun)", manaish)
  ok(TD.talentById("guardian:2R")?.name === "Oath of the Wall" && TD.talentById("nope:1L") === null, "A8 talentById")
  results.talents = { all: all.length, playChangers, manaish }
}

// =========================================================== B. Level-ups
{
  const rs = mk([hero("b0", "bulwark-of-ages", { xp: 6 })])
  const s2 = LV.levelSubject(rs, "b0")
  const o2 = LV.levelOffers(rs, s2)
  ok(o2.join() === "talent:1:L,talent:1:R", "B1 the Lv2 level-up offers the 2 talents of row 1", o2)
  const picked = rt.chooseLevelPerk(rs, "b0", "talent:1:R")
  ok(picked.bench[0].talents?.[1] === "R" && !LV.nextPendingLevelUp(picked), "B2 picking one settles Lv2 (stored as talents {1: R})", picked.bench[0].talents)
  ok(rt.chooseLevelPerk(picked, "b0", "talent:1:L") === picked, "B3 a row can't be picked twice")
  const lv3 = { ...picked, bench: [{ ...picked.bench[0], xp: 15 }] }
  const o3 = LV.levelOffers(lv3, LV.levelSubject(lv3, "b0"))
  ok(o3.length && o3.every((id) => !id.startsWith("talent:")), "B4 Lv3 = the skill branch / perk pick as before", o3)
  const lv3b = rt.chooseLevelPerk(lv3, "b0", o3[0])
  const lv4 = { ...lv3b, bench: [{ ...lv3b.bench[0], xp: 28 }] }
  ok(LV.levelOffers(lv4, LV.levelSubject(lv4, "b0")).join() === "talent:2:L,talent:2:R", "B5 Lv4 offers talent row 2")
  const old = mk([hero("b0", "bulwark-of-ages", { xp: 15, perks: ["bark"] })])
  ok(LV.levelOffers(old, LV.levelSubject(old, "b0")).join() === "talent:1:L,talent:1:R", "B6 an older save that spent Lv2 on a perk gets row 1 at its next level-up")
  const cmd = { ...mk([]), commanderXp: 6 }
  const cs = LV.levelSubject(cmd, "commander")
  const cmdPicked = rt.chooseLevelPerk(cmd, "commander", LV.levelOffers(cmd, cs)[0])
  ok(cmdPicked.commanderTalents?.[1] === "L", "B7 the Commander picks talents too", cmdPicked.commanderTalents)
  const promoPending = mk([hero("b0", "bulwark-of-ages", { xp: 15, talents: { 1: "L" } })])
  const ps = LV.levelSubject(promoPending, "b0")
  ok(LV.pendingPerkCount(ps) === 1 && LV.pendingPromotionRank(ps) === 1 && !LV.levelOffers(promoPending, ps).some((id) => id.startsWith("talent:")), "B8 Lv3: one level-up card + the promotion ceremony, no talent screen on top")
  const tree = LV.talentTreeOf(LV.levelSubject(picked, "b0"))
  ok(tree.length === 2 && tree[0].chosen === "R" && tree[1].chosen === null, "B9 talentTreeOf marks chosen / open rows")
}

// =========================================================== C. Every talent applies in a fight
{
  const missing = []
  const fieldsOf = (u) => JSON.stringify({ s: u.classSkills, tal: u.tal, m: u.extraMods, mx: u.manaMax, mn: u.mana, rg: u.manaRegenBonus, hp: u.maxHp, at: u.attack, mv: u.move, w: u.ward, ap: u.ap })
  for (const c of Object.keys(CLASSES)) {
    const base = U(start(mk([classHero(c, { xp: 28 })], 2)), "player-hexbreaker")
    for (const tier of [1, 2])
      for (const side of ["L", "R"]) {
        const u = U(start(mk([classHero(c, { xp: 28, talents: { [tier]: side } })], 2)), "player-hexbreaker")
        const id = `${c}:${tier}${side}`
        if (!u?.talents?.includes(id) || fieldsOf(u) === fieldsOf(base) || u.talentDormant) missing.push(id)
      }
  }
  ok(!missing.length, "C1 all 152 talents change the hero in a real fight", missing.slice(0, 10))
  // Commander talents land on the Commander.
  const cb = start({ ...mk([hero("b0", "bulwark-of-ages")]), commanderTalents: { 1: "L", 2: "R" } })
  ok(U(cb, "player-commander").talents?.join() === "commander:1L,commander:2R", "C2 the Commander's talents ride into the fight", U(cb, "player-commander").talents)
  // A Class Collar: skill changes sleep, the rest still works.
  const collarId = Object.values(ITEMS).find((x) => x.kind === "collar" && x.collarClass && x.collarClass !== "bruiser")?.id
  if (collarId) {
    const d = U(start(mk([classHero("bruiser", { xp: 28, talents: { 1: "L" } })], 2, { items: [it(1, collarId, "b0", 0)] })), "player-hexbreaker")
    ok(d.talentDormant && d.tal?.manaShield === 25, "C3 under a Class Collar the skill talents sleep, Mana Shield still works", { dormant: d.talentDormant, tal: d.tal })
  }
}

// =========================================================== D. Talents in combat (behaviour)
const arena = (c, talents, act = 2, extra = {}) => {
  let b = clean(start(mk([classHero(c, { xp: 28, talents })], act, extra)))
  const h = U(b, "player-hexbreaker")
  const [e1, e2] = foes(b)
  b = place(b, h.id, 4, 6, { ap: 6, mana: h.manaMax, hp: h.maxHp, classCds: {} })
  b = place(b, e1.id, 4, 5, { hp: 40, maxHp: 40 })
  if (e2) b = place(b, e2.id, 3, 5, { hp: 40, maxHp: 40 })
  return { b, h: te.getUnit(b, h.id), e1, e2 }
}
{
  // D1 Second charge: Frost Bolt (frostbinder twist 2R) casts twice before it recharges.
  {
    const { b, h } = arena("frostbinder", { 2: "R" })
    const one = castOn(b, h.id, "frost-bolt")
    const u1 = te.getUnit(one, h.id)
    const two = castOn(patch(one, h.id, { mana: u1.manaMax }), h.id, "frost-bolt")
    const u2 = te.getUnit(two, h.id)
    const sk = cls.classSkillById(h, "frost-bolt")
    ok(one !== b && (u1.classCds["frost-bolt"] || 0) === 0 && two !== one && u2.classCds["frost-bolt"] === sk.cooldown && sk.charges === 2, "D1 2 charges: cast, cast again, then the recharge", { cd1: u1.classCds, cd2: u2.classCds })
    const plain = arena("frostbinder", {})
    const p1 = castOn(plain.b, plain.h.id, "frost-bolt")
    ok(te.getUnit(p1, plain.h.id).classCds["frost-bolt"] > 0, "D2 ...without the talent it recharges at once")
  }
  // D3 Area rider: Shoulder Check (bruiser 2R) splashes the foe next to the target.
  {
    const a = arena("bruiser", { 2: "R" })
    const p = arena("bruiser", {})
    const sa = te.castAbility(a.b, a.h.id, a.e1.id, "shoulder-check")
    const sp = te.castAbility(p.b, p.h.id, p.e1.id, "shoulder-check")
    const e2a = te.getUnit(sa, a.e2.id)
    const e2p = te.getUnit(sp, p.e2.id)
    ok(sa !== a.b && sp !== p.b && e2a.hp < e2p.hp, "D3 Splintering: the skill also hits the foe next to its target", { withT: e2a.hp, without: e2p.hp })
  }
  // D4 Cooldown / cost talents reshape the skill.
  {
    const { h } = arena("guardian", { 2: "R" })
    const base = arena("guardian", {}).h
    ok(cls.classSkillById(h, "guard").cooldown === cls.classSkillById(base, "guard").cooldown - 1, "D4 Oath of the Wall: Bodyguard recharges 1 sooner")
    const sp = arena("spiritwalker", { 1: "R" }).h
    ok(cls.classSkillById(sp, "spirit-step").mana === 0 && cls.classSkillById(arena("spiritwalker", {}).h, "spirit-step").mana > 0, "D5 Ley Stride: Spirit Step costs nothing")
  }
  // D6 Mana Shield (frontline 1L): part of a hit is paid from the bar.
  {
    const { b, h } = arena("bruiser", { 1: "L" })
    const p = arena("bruiser", {})
    const r = te.applyDamageWithBlock(patch(b, h.id, { mana: 60 }), h.id, 8)
    const rp = te.applyDamageWithBlock(patch(p.b, p.h.id, { mana: 60 }), p.h.id, 8)
    const after = te.getUnit(r.next, h.id)
    const afterP = te.getUnit(rp.next, p.h.id)
    ok(h.hp - after.hp < p.h.hp - afterP.hp && after.mana < afterP.mana, "D6 Mana Shield: less HP lost, resource spent", { lost: h.hp - after.hp, lostP: p.h.hp - afterP.hp, mana: after.mana, manaP: afterP.mana })
    const empty = te.applyDamageWithBlock(patch(b, h.id, { mana: 0 }), h.id, 8)
    ok(h.hp - te.getUnit(empty.next, h.id).hp === 8, "D7 ...an empty bar shields nothing")
  }
  // D8 Resource per basic hit (ranger 1L Sap Thief).
  {
    const a = arena("ranger", { 1: "L" })
    const p = arena("ranger", {})
    const sa = te.attackUnit(patch(a.b, a.h.id, { mana: 10 }), a.h.id, a.e1.id)
    const sp = te.attackUnit(patch(p.b, p.h.id, { mana: 10 }), p.h.id, p.e1.id)
    ok(te.getUnit(sa, a.h.id).mana > te.getUnit(sp, p.h.id).mana, "D8 Sap Thief: a basic hit gives resource", { withT: te.getUnit(sa, a.h.id).mana, without: te.getUnit(sp, p.h.id).mana })
  }
  // D9 Resource per kill (assassin twist 1R Night Feeder).
  {
    const a = arena("assassin", { 1: "R" })
    const p = arena("assassin", {})
    const ka = te.attackUnit(patch(patch(a.b, a.h.id, { mana: 0 }), a.e1.id, { hp: 1 }), a.h.id, a.e1.id)
    const kp = te.attackUnit(patch(patch(p.b, p.h.id, { mana: 0 }), p.e1.id, { hp: 1 }), p.h.id, p.e1.id)
    ok(te.getUnit(ka, a.e1.id).hp <= 0 && te.getUnit(ka, a.h.id).mana > te.getUnit(kp, p.h.id).mana, "D9 Night Feeder: a kill gives Shadow", { withT: te.getUnit(ka, a.h.id).mana, without: te.getUnit(kp, p.h.id).mana })
  }
  // D10 Resource back per cast (healer 1L Wellspring Echo).
  {
    const a = arena("healer", { 1: "L" })
    const p = arena("healer", {})
    const ally = (b, hid) => b.units.find((u) => u.side === "player" && u.id !== hid)
    const prep = (x) => {
      const al = ally(x.b, x.h.id)
      return place(patch(x.b, x.h.id, { mana: 40 }), al.id, 4, 7, { hp: 3 })
    }
    const ca = castOn(prep(a), a.h.id, "lingering-bloom")
    const cp = castOn(prep(p), p.h.id, "lingering-bloom")
    ok(ca !== prep(a) && te.getUnit(ca, a.h.id).mana > te.getUnit(cp, p.h.id).mana, "D10 Wellspring Echo: a cast gives resource back", { withT: te.getUnit(ca, a.h.id).mana, without: te.getUnit(cp, p.h.id).mana })
  }
  // D11 First skill free (relic-keeper 1R Opening Gambit).
  {
    const a = arena("relic-keeper", { 1: "R" })
    const s0 = patch(a.b, a.h.id, { mana: 40 })
    const one = castOn(s0, a.h.id, "forbidden-relic")
    const u1 = te.getUnit(one, a.h.id)
    ok(one !== s0 && u1.mana >= 40 - 1 && u1.firstFreeUsed, "D11 Opening Gambit: the first class skill costs nothing", { mana: u1.mana })
  }
}

// =========================================================== E. Neutral items
{
  ok(Object.keys(ND.NEUTRAL_ITEMS).length >= 15 && [1, 2, 3, 4, 5].every((t) => ND.neutralsOfTier(t).length >= 3), "E1 15+ neutrals over 5 tiers")
  const manaN = Object.values(ND.NEUTRAL_ITEMS).filter((x) => x.fx.regen || x.fx.manaPool || x.fx.castMana || x.fx.hitMana || x.fx.killMana || x.fx.manaShield || x.fx.firstFree || x.fx.cheaper || x.fx.mods).length
  ok(manaN >= 10, "E2 most neutrals are about the resource", manaN)
  ok(NS.neutralTierForAct(1) === 1 && NS.neutralTierForAct(2) === 2 && NS.neutralTierForAct(4) === 3 && NS.neutralTierForAct(5) === 4 && NS.neutralTierForAct(7) === 5, "E3 tiers open by Act")
  // Drop rates + tiers over many seeds.
  const dropsAt = (act, type) => {
    const idx = actNode(act, type) >= 0 ? actNode(act, type) : actNode(act)
    const out = []
    for (let seed = 1; seed <= 200; seed++) {
      const id = NS.rollNeutralDrop({ seed, nodeIndex: idx, bench: [] }, { type }, act)
      if (id) out.push(ND.NEUTRAL_ITEMS[id].tier)
    }
    return out
  }
  const a1 = dropsAt(1, "elite")
  const a3 = dropsAt(3, "elite")
  const a7 = dropsAt(7, "elite")
  const nb = dropsAt(2, "battle")
  const boss = dropsAt(3, "miniboss")
  ok(a1.length > 80 && a1.every((t) => t === 1), "E4 Act I elites drop tier I only (often)", { n: a1.length, tiers: [...new Set(a1)] })
  ok(a3.every((t) => t === 2 || t === 3) && a3.filter((t) => t === 3).length > a3.length / 2, "E5 Act III: mostly tier III, sometimes II", [...new Set(a3)])
  ok(a7.every((t) => t >= 4) && a7.includes(5), "E6 Act VII: tier IV-V", [...new Set(a7)])
  ok(nb.length > 10 && nb.length < 60, "E7 normal fights drop rarely (~15%)", nb.length)
  ok(boss.length === 200, "E8 minibosses always drop", boss.length)
  const r1 = NS.rollNeutralDrop({ seed: 5, nodeIndex: 9, bench: [] }, { type: "elite" }, 3)
  ok(r1 === NS.rollNeutralDrop({ seed: 5, nodeIndex: 9, bench: [] }, { type: "elite" }, 3), "E9 deterministic per seed + node")
  // Stash + slot.
  let rs = mk([hero("b0", "bulwark-of-ages"), hero("b1", "hexbreaker")], 3, {}, "elite")
  rs = NS.neutralDrop(rs, { type: "miniboss" }, 3)
  const got = rs.neutralStash?.[0]
  ok(got && rs.lastNeutralDrop?.id === got && /Neutral drop/.test(rs.lastAftermath.join(" ")), "E10 a drop goes to the stash + the banner", rs.lastNeutralDrop)
  rs = { ...rs, neutralStash: ["wisp-lantern", "sap-dewdrop"] }
  const eq = NS.equipNeutral(rs, "b0", "wisp-lantern")
  ok(eq.bench[0].neutral === "wisp-lantern" && eq.neutralStash.join() === "sap-dewdrop", "E11 equip: stash -> the hero's ONE neutral slot")
  const sw = NS.equipNeutral(eq, "b0", "sap-dewdrop")
  ok(sw.bench[0].neutral === "sap-dewdrop" && sw.neutralStash.join() === "wisp-lantern", "E12 swap: the old one goes back to the stash")
  ok(NS.equipNeutral(eq, "b0", "star-crown") === eq, "E13 can't equip what isn't in the stash")
  const off = NS.unequipNeutral(sw, "b0")
  ok(!off.bench[0].neutral && off.neutralStash.length === 2, "E14 take it off")
  const cmd = NS.equipNeutral(rs, "commander", "sap-dewdrop")
  ok(cmd.commanderNeutral === "sap-dewdrop", "E15 the Commander has a neutral slot too")
  ok(!eq.items.length, "E16 the neutral slot is apart from the gear row (no item used)")
  // Effects in a fight.
  const plain = U(start(mk([hero("b0", "bulwark-of-ages")], 3)), "player-bulwark")
  const wl = U(start(mk([hero("b0", "bulwark-of-ages", { neutral: "wisp-lantern" })], 3)), "player-bulwark")
  ok(wl.neutral === "wisp-lantern" && wl.manaMax > plain.manaMax, "E17 Wisp Lantern: bigger bar in the fight", { with: wl.manaMax, without: plain.manaMax })
  const ac = U(start(mk([hero("b0", "bulwark-of-ages", { neutral: "pocket-acorn" })], 3)), "player-bulwark")
  ok(ac.maxHp === plain.maxHp + 4, "E18 Pocket Acorn: +4 max HP")
  const cl = U(start(mk([hero("b0", "bulwark-of-ages", { neutral: "moonmoth-cloak" })], 3)), "player-bulwark")
  ok(cl.tal?.manaShield === 30, "E19 Moonmoth Cloak: Mana Shield 30%")
  const sl = U(start(mk([hero("b0", "bulwark-of-ages", { neutral: "seven-league-root" })], 3)), "player-bulwark")
  ok(sl.move === plain.move + 2 && sl.ap === plain.ap + 1, "E20 Seven-League Root: +2 move, +1 AP on turn 1")
  const ce = U(start({ ...mk([hero("b0", "bulwark-of-ages")], 3), commanderNeutral: "pocket-acorn" }), "player-commander")
  const ce0 = U(start(mk([hero("b0", "bulwark-of-ages")], 3)), "player-commander")
  ok(ce.maxHp === ce0.maxHp + 4, "E21 the Commander's neutral works in the fight")
  // A won elite fight in a run really drops (resolveBattleOutcome path).
  {
    const idx = actNode(2, "elite") >= 0 ? actNode(2, "elite") : rt.RUN_PATH.findIndex((nd) => nd.type === "elite")
    let found = null
    for (let seed = 1; seed <= 20 && !found; seed++) {
      const base = { ...rt.startRun("tommy", null, { forcedSeed: seed }), nodeIndex: idx, path: rt.RUN_PATH.slice(0, idx + 1), phase: "formation", bench: [hero("b0", "bulwark-of-ages")], deployed: ["b0", null, null, null], items: [], itemKeyCounter: 100 }
      const fought = rt.startTacticsFormationBattle(base, (s) => buildRunTacticsBattle(base, s))
      const won = { ...fought, phase: "battle", battle: { ...fought.battle, phase: "won", units: fought.battle.units.map((u) => (u.side === "enemy" ? { ...u, hp: 0 } : u)) } }
      const after = rt.resolveBattleOutcome(won)
      if (after.neutralStash?.length) found = after
    }
    ok(found && found.lastNeutralDrop && ND.NEUTRAL_ITEMS[found.neutralStash[0]].tier <= 2, "E22 a won elite fight drops a neutral into the run's stash", found?.lastNeutralDrop)
  }
}

// =========================================================== F. New counter kits
{
  ok(F.counterKitFor("ashenmaw", 3)?.id === "bloodfang" && !F.counterKitFor("ashenmaw", 2), "F1 Bloodfang from Act III")
  ok(F.counterKitFor("thornfen", 4)?.id === "burrow" && F.counterKitFor("bramblespite", 4)?.id === "reflect" && F.counterKitFor("drift-archer", 5)?.id === "hush" && !F.counterKitFor("drift-archer", 4), "F2 Burrower / Thornmirror Act IV, Hushcap Act V")
  ok(F.counterKitFor("gravequill", 3)?.id === "splitter", "F3 Splitting Spores Act III")
  const read = F.counterReadFor(["ashenmaw", "thornfen", "bramblespite", "drift-archer", "gravequill"], 5)
  ok(read.kits.length === 5 && F.bringText(read.bring) === "Bring: healing cut, reveal, dispel, item actives, area damage", "F4 the 'Bring:' line answers all five", F.bringText(read.bring))
  const ekit = (b, id, kit) => {
    const k = B.COUNTER_KITS[kit]
    return patch(b, id, { kit, ...TT.kitStartFields(k) })
  }
  // Bloodfang: its hits heal it; Wither stops it.
  {
    const { b, h, e1 } = arena("bruiser", {})
    let s = ekit({ ...b, phase: "enemy" }, e1.id, "bloodfang")
    s = patch(s, e1.id, { hp: 20 })
    const hit = te.attackUnit(s, e1.id, h.id)
    ok(te.getUnit(hit, e1.id).hp > 20 && te.getUnit(hit, h.id).hp < h.hp, "F5 Bloodfang: its hit heals it", te.getUnit(hit, e1.id).hp)
    const wither = te.attackUnit(patch(s, e1.id, { withered: 2 }), e1.id, h.id)
    ok(te.getUnit(wither, e1.id).hp === 20, "F6 ...a Withered Bloodfang can't drink (healing cut answers it)")
  }
  // Splitting Spores: it splits in two; the pieces stand together (area answers it).
  {
    const { b, h, e1 } = arena("bruiser", {})
    const s = ekit(patch(b, e1.id, { hp: 1 }), e1.id, "splitter")
    const k = te.attackUnit(s, h.id, e1.id)
    const kids = k.units.filter((u) => u.id.startsWith(`${e1.id}-b`) && u.hp > 0)
    ok(kids.length === 2 && kids.every((u) => u.maxHp < 40), "F7 Splitting Spores: falls -> 2 small copies", kids.map((u) => u.hp))
    ok(kids.length === 2 && Math.max(Math.abs(kids[0].pos.row - kids[1].pos.row), Math.abs(kids[0].pos.col - kids[1].pos.col)) <= 2, "F8 ...right next to each other (one area hit catches both)")
    const kid = kids[0]
    const k2 = kid ? te.attackUnit(patch(patch(k, kid.id, { hp: 1 }), h.id, { ap: 3 }), h.id, kid.id) : k
    ok(k2.units.filter((u) => u.id.startsWith(`${kid?.id}-b`)).length === 0, "F9 ...and the copies don't split again")
  }
  // Burrower: underground on your turn, can't be targeted or hurt; reveal / its own turn brings it up.
  {
    const { b, h, e1 } = arena("bruiser", {})
    let s = ekit(b, e1.id, "burrow")
    s = TT.talentPlayerTurnStart(s)
    const e = te.getUnit(s, e1.id)
    ok(e.burrowed === 1, "F10 Burrower digs in on your turn")
    ok(!te.attackableTargets(s, h.id).some((u) => u.id === e1.id), "F11 ...it can't be targeted, even next to it")
    ok(te.applyDamageWithBlock(s, e1.id, 10).next.units.find((u) => u.id === e1.id).hp === e.hp, "F12 ...or hurt by splash")
    const lit = patch(s, e1.id, { revealed: 1 })
    ok(te.attackableTargets(lit, h.id).some((u) => u.id === e1.id), "F13 revealed (Glowdust / Owl Lantern) -> a target again")
    const up = TT.talentEnemyPhaseStart(s)
    ok(te.getUnit(up, e1.id).burrowed === 0, "F14 it surfaces on its own turn")
    ok(te.getUnit(TT.talentPlayerTurnStart(up), e1.id).burrowed !== 1, "F15 ...and stays up the next turn (every other turn)")
  }
  // Thornmirror: the first skill each turn bounces back; basic attacks don't; dispel stops it.
  {
    const { b, h, e1 } = arena("bruiser", {})
    const s = ekit(b, e1.id, "reflect")
    const hit = te.castAbility(s, h.id, e1.id, "shoulder-check")
    ok(hit !== s && te.getUnit(hit, h.id).hp < h.hp && te.getUnit(hit, e1.id).reflectUsed, "F16 Thornmirror: a skill on it hurts the caster", { hp: te.getUnit(hit, h.id).hp, was: h.hp })
    const again = te.attackUnit(patch(hit, h.id, { ap: 3 }), h.id, e1.id)
    ok(te.getUnit(again, h.id).hp >= te.getUnit(hit, h.id).hp, "F17 ...basic attacks are never reflected")
    const broken = patch(s, e1.id, { reflectBroken: 2 })
    const hit2 = te.castAbility(broken, h.id, e1.id, "shoulder-check")
    ok(te.getUnit(hit2, h.id).hp === h.hp, "F18 dispelled (Unbind) -> no reflection")
    const rearm = TT.talentPlayerTurnStart(hit)
    ok(!te.getUnit(rearm, e1.id).reflectUsed, "F19 it re-arms every turn")
  }
  // Hushcap: heroes within 2 can't cast; items + attacks still work; dispel quiets it.
  {
    const { b, h, e1 } = arena("bruiser", {}, 3, { items: [it(1, "sapling-salve", "b0", 0)] })
    const s = ekit(b, e1.id, "hush")
    ok(TT.hushedNow(s, h) && te.castAbility(s, h.id, e1.id, "shoulder-check") === s, "F20 Hushcap: a hero next to it can't cast")
    ok(!cls.classSkillUsable(s, h, cls.classSkillById(h, "shoulder-check")), "F21 ...the skill button greys out")
    ok(te.attackUnit(s, h.id, e1.id) !== s, "F22 ...basic attacks still work")
    const salve = I.castItemActive(patch(s, h.id, { hp: h.maxHp - 5 }), h.id, "salve", h.id)
    ok(te.getUnit(salve, h.id).hp > h.maxHp - 5, "F23 ...item actives still work (the answer)")
    const far = place(s, e1.id, 4, 1)
    ok(!TT.hushedNow(far, h), "F24 3+ tiles away: free to cast")
    ok(!TT.hushedNow(patch(s, e1.id, { hushBroken: 2 }), h), "F25 dispelled -> no aura")
    const unb = TT.dispelKit(s, e1.id, 2)
    ok(te.getUnit(unb, e1.id).hushBroken === 2, "F26 Unbind's dispel hook quiets it")
  }
  // QA hook switches the new kits off.
  {
    const { b, e1 } = arena("bruiser", {})
    const s = ekit(ekit(b, e1.id, "splitter"), e1.id, "burrow")
    const q = te.withLowEnemyHp(patch(s, e1.id, { burrowed: 1, broodSplit: { count: 2, hpFactor: 0.35, maxGen: 1 }, kit: "splitter" }))
    const u = te.getUnit(q, e1.id)
    ok(!u.kit && !u.burrowed && !u.broodSplit, "F27 QA hook (withLowEnemyHp): new kits off", { kit: u.kit, b: u.burrowed, s: u.broodSplit })
  }
  // A real Act V fight hands out the new kits from the formation.
  {
    const kitsAt = (act) => {
      const seen = new Set()
      for (let i = 0; i < rt.RUN_PATH.length; i++) {
        const nd = rt.RUN_PATH[i]
        if (!nd.formationId || rt.actIndexForNode(i, rt.RUN_PATH.length) !== act) continue
        const rs = { ...mk([hero("b0", "bulwark-of-ages")], act), nodeIndex: i, path: rt.RUN_PATH.slice(0, i + 1) }
        for (const u of foes(start(rs))) if (u.kit) seen.add(u.kit)
      }
      return [...seen]
    }
    const k4 = kitsAt(4)
    const k5 = kitsAt(5)
    ok([...k4, ...k5].some((k) => ["bloodfang", "splitter", "burrow", "reflect", "hush"].includes(k)), "F28 real later-Act fights carry the new kits", { k4, k5 })
    results.kits = { k4, k5 }
  }
}

// =========================================================== G. Enemy talents by tier
{
  ok([0, 1].every((t) => TT.enemyTalentsFor("bark-brute", t).length === 0) && TT.enemyTalentsFor("bark-brute", 2).length === 1 && TT.enemyTalentsFor("bark-brute", 4).length === 2 && TT.enemyTalentsFor("bark-brute", 5).length === 3, "G1 talents per leader: T0-T1 none, T2-T3 one, T4 two, T5 three")
  ok(JSON.stringify(TT.enemyTalentsFor("moss-troll", 5)) === JSON.stringify(TT.enemyTalentsFor("moss-troll", 5)), "G2 deterministic")
  const withTier = (tier, kind) => {
    const base = clean(start(mk([hero("b0", "bulwark-of-ages")], 3)))
    const restored = { ...base, units: base.units.map((u) => (u.side === "enemy" ? { ...u, kit: null } : u)), difficulty: { ...(base.difficulty || {}), tier, kind } }
    return TT.assignEnemyTalents(restored)
  }
  const t2 = withTier(2, "elite")
  const t4 = withTier(4, "boss")
  const t1 = withTier(1, "elite")
  const nb = withTier(5, "battle")
  const count = (b) => b.units.filter((u) => u.enemyTalents?.length).map((u) => u.enemyTalents.length)
  ok(count(t2).join() === "1", "G3 T2 elite: the leader gets 1 talent", count(t2))
  ok(count(t4).sort().join() === "1,2" || (foes(t4).length === 1 && count(t4).join() === "2"), "G4 T4 boss: the leader 2 + the next foe 1", count(t4))
  ok(!count(t1).length && !count(nb).length, "G5 T1 elites / normal fights: none")
  const lead = t4.units.find((u) => u.enemyTalents?.length === 2)
  const before = withTier(0, "elite").units.find((u) => u.id === lead.id)
  const bump = lead.enemyTalents.reduce((a, id) => a + (B.ENEMY_TALENTS[id].attack || 0), 0)
  ok(lead.attack === before.attack + bump, "G6 the talents' numbers land on the unit", { ids: lead.enemyTalents, atk: lead.attack, was: before.attack })
  ok(TT.enemyTalentRead(t4).length === count(t4).length && TT.enemyTalentRead(t4)[0].talents[0].name, "G7 the Threat panel read lists them")
  const qa = te.withLowEnemyHp(t4)
  ok(!qa.units.some((u) => u.enemyTalents?.length) && qa.units.find((u) => u.id === lead.id).attack === before.attack, "G8 QA hook strips enemy talents")
  // Behaviours.
  const { b, h, e1 } = arena("bruiser", {})
  const sw = patch({ ...b, phase: "enemy" }, e1.id, { enemyTalents: ["second-wind", "bloodrage"], hp: 10, maxHp: 40 })
  const fired = TT.talentEnemyPhaseStart(sw)
  const ef = te.getUnit(fired, e1.id)
  ok(ef.hp === 22 && ef.attack === te.getUnit(sw, e1.id).attack + 3, "G9 Second Wind heals 30% + Bloodrage +3 attack below half HP", { hp: ef.hp, atk: ef.attack })
  const twice = TT.talentEnemyPhaseStart(patch(fired, e1.id, { hp: 10 }))
  ok(te.getUnit(twice, e1.id).hp === 10, "G10 ...each only once")
  const si = te.attackUnit(patch(patch(sw, e1.id, { enemyTalents: ["mana-siphon"] }), h.id, { mana: 50 }), e1.id, h.id)
  const sn = te.attackUnit(patch(patch(sw, e1.id, { enemyTalents: [] }), h.id, { mana: 50 }), e1.id, h.id)
  ok(te.getUnit(si, h.id).mana < te.getUnit(sn, h.id).mana, "G11 Mana Siphon drains the hero it hits", [te.getUnit(si, h.id).mana, te.getUnit(sn, h.id).mana])
  // Real elite fight at a high Act: the leader is talented.
  {
    let found = null
    for (const type of ["elite", "miniboss", "boss"])
      for (let i = 0; i < rt.RUN_PATH.length && !found; i++) {
        if (rt.RUN_PATH[i].type !== type || !rt.RUN_PATH[i].formationId || rt.actIndexForNode(i, rt.RUN_PATH.length) < 4) continue
        const rs = { ...mk([hero("b0", "bulwark-of-ages")], 4), nodeIndex: i, path: rt.RUN_PATH.slice(0, i + 1) }
        const bt = start(rs)
        if (bt.units.some((u) => u.enemyTalents?.length)) found = { i, tier: bt.difficulty?.tier, t: TT.enemyTalentRead(bt) }
      }
    ok(!!found && found.tier >= 2, "G12 a real late-Act elite / boss fight has enemy talents", found)
    results.enemyTalents = found
  }
}

// =========================================================== H. Preview == real
{
  const rs = mk([classHero("bruiser", { xp: 28, talents: { 1: "L", 2: "R" }, neutral: "moonmoth-cloak" }), hero("b1", "bulwark-of-ages", { neutral: "sap-dewdrop" })], 4)
  let s = start(rs)
  const kits = ["bloodfang", "burrow", "reflect", "splitter"]
  s = {
    ...s,
    units: s.units.map((u, i) => (u.side === "enemy" ? { ...u, kit: kits[i % 4], ...TT.kitStartFields(B.COUNTER_KITS[kits[i % 4]]), enemyTalents: ["second-wind", "mana-siphon", "bloodrage"], hp: Math.ceil(u.maxHp / 2) } : u)),
  }
  const rows = []
  for (let turn = 0; turn < 4 && s.phase === "player"; turn++) {
    const pv = te.previewEnemyIntents(s)
    const pv2 = te.previewEnemyIntents(s)
    const after = te.endPlayerTurn(s)
    for (const { enemyId, intent } of pv) {
      const now = after.units.find((u) => u.id === enemyId)
      let good = JSON.stringify(pv) === JSON.stringify(pv2)
      if (now && (intent.kind === "move" || intent.kind === "move-attack")) good = good && now.pos.row === intent.to.row && now.pos.col === intent.to.col
      rows.push({ turn, enemyId, kind: intent.kind, good })
    }
    s = after
  }
  ok(rows.length >= 4 && rows.every((x) => x.good), "H1 preview == real with talents, neutrals, new kits + enemy talents", rows.filter((x) => !x.good).slice(0, 5))
  results.previewRows = rows.length
}

// =========================================================== I. Campaign persistence
{
  const build = (run) => rt.startTacticsFormationBattle(run, (st) => buildRunTacticsBattle(run, st))
  let c = CE.createCampaign({ commanderId: "tommy", difficulty: "normal", seed: 4242 })
  const k0 = c.roster[0].key
  c = { ...c, roster: c.roster.map((h, i) => (i === 0 ? { ...h, xp: 7 } : h)), commander: { ...c.commander, xp: 7 }, neutralStash: ["wisp-lantern", "fox-tooth"] }
  c = CE.campaignChooseLevelPerk(c, k0, "talent:1:L")
  c = CE.campaignChooseLevelPerk(c, "commander", "talent:1:R")
  c = CE.campaignEquipNeutral(c, k0, "wisp-lantern")
  ok(c.roster[0].talents?.[1] === "L" && c.commander.talents?.[1] === "R", "I1 campaign heroes + the Commander pick talents", { h: c.roster[0].talents, c: c.commander.talents })
  ok(c.roster[0].neutral === "wisp-lantern" && c.neutralStash.join() === "fox-tooth", "I2 the campaign stash feeds a hero's neutral slot")
  const saved = CE.deserializeCampaign(JSON.parse(JSON.stringify(CE.serializeCampaign(c))))
  ok(saved.roster[0].talents?.[1] === "L" && saved.roster[0].neutral === "wisp-lantern" && saved.commander.talents?.[1] === "R" && saved.neutralStash.join() === "fox-tooth", "I3 they survive a save round-trip")
  const m = saved.missions[0]
  const { min } = CE.squadLimits(saved)
  const squad = saved.roster.slice(0, Math.max(min, 2)).map((h) => h.key)
  const why = CE.squadBlocker(saved, m.id, squad)
  ok(!why, "I3b the squad can launch", why)
  const launched = CE.launchMission(saved, m.id, squad, build)
  const bu = launched.activeMission.run.battle.units
  const hu = bu.find((u) => u.id === `player-${saved.roster[0].defId}-0`)
  ok(hu?.talents?.length === 1 && hu.neutral === "wisp-lantern" && bu.find((u) => u.id === "player-commander")?.talents?.length === 1, "I4 a mission fight carries the heroes' talents + neutral", { t: hu?.talents, n: hu?.neutral })
  const b = launched.activeMission.run.battle
  const won = CE.updateMissionBattle(launched, { ...b, phase: "won", units: b.units.map((u) => (u.side === "enemy" ? { ...u, hp: 0 } : u)) })
  const done = CE.resolveMission(won)
  const back = done.roster.find((h) => h.key === k0)
  ok(back?.talents?.[1] === "L" && back.neutral === "wisp-lantern" && done.commander.talents?.[1] === "R" && done.neutralStash.includes("fox-tooth"), "I5 after the mission: talents, neutral and stash kept", { t: back?.talents, n: back?.neutral, s: done.neutralStash })
  // A fallen hero's neutral comes home to the stash.
  const dead = CE.updateMissionBattle(launched, { ...b, phase: "won", units: b.units.map((u) => (u.side === "enemy" ? { ...u, hp: 0 } : u.id === hu.id ? { ...u, hp: 0, lastHitBy: b.units.find((x) => x.side === "enemy").id } : u)) })
  const after = CE.resolveMission(dead)
  ok(!after.roster.some((h) => h.key === k0) && after.neutralStash.includes("wisp-lantern"), "I6 a fallen hero's neutral returns to the stash", after.neutralStash)
}

console.log(JSON.stringify(results, null, 1))
console.log(`ENGINE: ${n} checks, ${fails.length ? `${fails.length} FAIL` : "all pass"}`)
for (const f of fails) console.log("  FAIL", f)

// ------------------------------------------------------------------ UI PART
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
    const page = await (await browser.newContext({ viewport: { width: 1500, height: 950 } })).newPage()
    const errs = []
    page.on("pageerror", (e) => errs.push(String(e)))
    await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(1200)
    const flags = () => {
      localStorage.setItem("heartwood-autobattler-intro-seen", "1")
      localStorage.setItem("heartwood-story-intro-seen", "1")
      localStorage.setItem("heartwood-tactics-tutorial-v1", "skipped")
      localStorage.setItem("heartwood-coach-enabled-v1", "false")
    }
    const readRun = () => page.evaluate(() => JSON.parse(localStorage.getItem("heartwood-run-save-v1")).run)
    const seed = (spec) =>
      page.evaluate(
        async ({ flagsSrc, spec }) => {
          localStorage.clear()
          new Function(flagsSrc)()
          const rt = await import("/src/services/heartwood/runEngine.js")
          const want = spec.type || "battle"
          const idx = rt.RUN_PATH.findIndex((n, i) => (want === "shop" ? n.type === "shop" : n.type === want && n.formationId) && i > 0 && rt.actIndexForNode(i, rt.RUN_PATH.length) >= spec.act)
          const rs = { ...rt.startRun("tommy", null, { forcedSeed: 424243 }), nodeIndex: idx, path: rt.RUN_PATH.slice(0, idx + 1), lastSeenAct: rt.actIndexForNode(idx, rt.RUN_PATH.length), ...spec.patch }
          localStorage.setItem("heartwood-run-save-v1", JSON.stringify(rt.serializeRun(rs)))
          return idx
        },
        { flagsSrc: `(${flags.toString()})()`, spec },
      )

    const step = async (name, fn) => {
      try {
        await fn()
      } catch (e) {
        out.push(`${name}: ${String(e).split("\n")[0]}`)
        await page.screenshot({ path: `${SHOTS}/dota2-fail-${name}.png` }).catch(() => {})
      }
    }
    // UI-1: the level-up IS the talent pick at Lv2 (cards + the tree).
    await step("ui1", async () => {
    await seed({ type: "shop", act: 2, patch: { phase: "shop", essence: 300, bench: [{ key: 10, defId: "bulwark-of-ages", upgradeLevel: 0, upgrades: [], xp: 6 }], benchKeyCounter: 11, deployed: [10, null, null, null], items: [], itemKeyCounter: 10 } })
    await page.reload({ waitUntil: "domcontentloaded" })
    await page.locator('[data-screen="level-up"]').waitFor({ timeout: 15000 })
    await page.waitForTimeout(300)
    ui.levelUp = await page.evaluate(() => ({
      tier: document.querySelector('[data-screen="level-up"]')?.getAttribute("data-talent-pick"),
      cards: [...document.querySelectorAll("[data-talent-offer]")].map((e) => e.getAttribute("data-talent-offer")),
      offered: document.querySelectorAll('.hw-talent-cell[data-state="offered"]').length,
      locked: document.querySelectorAll('.hw-talent-cell[data-state="locked"]').length,
    }))
    check(ui.levelUp.tier === "1" && ui.levelUp.cards.join() === "guardian:1L,guardian:1R" && ui.levelUp.offered === 2 && ui.levelUp.locked === 2, "U1 Lv2 level-up: 2 talent cards + the tree (row 1 offered, row 2 locked)", ui.levelUp)
    await page.screenshot({ path: `${SHOTS}/dota2-levelup-talent.png` })
    await page.locator('[data-talent-offer="guardian:1R"]').click()
    await page.waitForTimeout(400)
    ui.picked = (await readRun()).bench[0].talents
    check(ui.picked?.[1] === "R", "U2 clicking a talent card saves it", ui.picked)

    })
    // UI-2: Gear screen - talent tree (chosen / passed / locked) + neutral slot + stash.
    await step("ui2", async () => {
    await seed({
      type: "shop",
      act: 3,
      patch: { phase: "shop", essence: 300, bench: [{ key: 10, defId: "bulwark-of-ages", upgradeLevel: 0, upgrades: [], xp: 28, perks: ["bark"], promoPicks: ["paladin"], talents: { 1: "L", 2: "R" }, neutral: "pocket-acorn" }], benchKeyCounter: 11, deployed: [10, null, null, null], items: [], itemKeyCounter: 10, neutralStash: ["wisp-lantern", "sap-dewdrop"] },
    })
    await page.reload({ waitUntil: "domcontentloaded" })
    await page.locator(".hw-squad-tab-btn").first().waitFor({ timeout: 15000 })
    await page.locator(".hw-squad-tab-btn").first().click()
    await page.locator('[data-gear-open="10"]').click()
    await page.locator("[data-talent-tree]").waitFor({ timeout: 5000 })
    ui.gear = await page.evaluate(() => ({
      chosen: [...document.querySelectorAll('[data-talent-tree] .hw-talent-cell[data-state="chosen"]')].map((e) => e.getAttribute("data-talent-id")),
      passed: document.querySelectorAll('[data-talent-tree] .hw-talent-cell[data-state="passed"]').length,
      slot: document.querySelector("[data-neutral-slot]")?.getAttribute("data-neutral-slot"),
      stash: [...document.querySelectorAll("[data-neutral-equip]")].map((e) => e.getAttribute("data-neutral-equip")),
    }))
    check(ui.gear.chosen.sort().join() === "guardian:1L,guardian:2R" && ui.gear.passed === 2, "U3 Gear screen: the talent tree shows chosen + passed-over talents", ui.gear)
    check(ui.gear.slot === "pocket-acorn" && ui.gear.stash.join() === "wisp-lantern,sap-dewdrop", "U4 Gear screen: the neutral slot + the stash", ui.gear)
    await page.locator(".hw-gear-screen").screenshot({ path: `${SHOTS}/dota2-gear-talents-neutral.png` }).catch(() => page.screenshot({ path: `${SHOTS}/dota2-gear-talents-neutral.png` }))
    await page.locator('[data-neutral-equip="wisp-lantern"]').click()
    await page.waitForTimeout(300)
    const r2 = await readRun()
    check(r2.bench[0].neutral === "wisp-lantern" && r2.neutralStash.includes("pocket-acorn") && !r2.neutralStash.includes("wisp-lantern"), "U5 Swap click: the new neutral in, the old one to the stash", { n: r2.bench[0].neutral, s: r2.neutralStash })

    })
    // UI-3: the neutral drop banner.
    await step("ui3", async () => {
    await seed({ type: "shop", act: 2, patch: { phase: "shop", essence: 300, bench: [{ key: 10, defId: "bulwark-of-ages", upgradeLevel: 0, upgrades: [] }], benchKeyCounter: 11, deployed: [10, null, null, null], items: [], itemKeyCounter: 10, neutralStash: ["thiefs-glove"], lastNeutralDrop: { id: "thiefs-glove", tier: 2 } } })
    await page.reload({ waitUntil: "domcontentloaded" })
    await page.locator("[data-neutral-drop]").waitFor({ timeout: 15000 })
    ui.banner = await page.locator("[data-neutral-drop]").innerText()
    check(/Mana-Thief/.test(ui.banner) && /Tier II/i.test(ui.banner), "U6 a 'Neutral drop' banner names the item + tier", ui.banner)
    await page.waitForTimeout(700)
    await page.screenshot({ path: `${SHOTS}/dota2-neutral-drop.png` })
    await page.locator("[data-neutral-drop-ok]").click()
    await page.waitForTimeout(300)
    check(!(await page.locator("[data-neutral-drop]").count()) && !(await readRun()).lastNeutralDrop, "U7 dismissing clears it")

    })
    // UI-4: a late elite fight - enemy talents on the Threat panel, hero talent / neutral marks.
    await step("ui4", async () => {
    await seed({
      type: "elite",
      act: 4,
      patch: { phase: "formation", essence: 300, bench: [{ key: "b0", defId: "bulwark-of-ages", upgradeLevel: 0, upgrades: [], xp: 28, perks: ["bark"], promoPicks: ["paladin"], talents: { 1: "L", 2: "L" }, neutral: "moonmoth-cloak" }], deployed: ["b0", null, null, null], items: [], itemKeyCounter: 10 },
    })
    await page.reload({ waitUntil: "domcontentloaded" })
    await page.locator(".hw-tactics-start").waitFor({ timeout: 15000 })
    await page.locator(".hw-tactics-start").click()
    const begin = page.locator(".hwt-begin-battle")
    await begin.waitFor({ timeout: 6000 }).catch(() => {})
    if (await begin.count()) await begin.click()
    await page.waitForTimeout(600)
    ui.fight = await page.evaluate(() => ({
      etalents: [...document.querySelectorAll("[data-enemy-talent]")].map((e) => e.getAttribute("data-enemy-talent")),
      etBadge: document.querySelectorAll("[data-enemy-talents]").length,
      talentBadge: document.querySelector(".hwt-talent-badge")?.getAttribute("title") || "",
      neutralBadge: document.querySelector("[data-neutral-badge]")?.getAttribute("data-neutral-badge"),
      tier: document.querySelector(".hwt-threat")?.getAttribute("data-tier"),
    }))
    check(ui.fight.etalents.length >= 1 && ui.fight.etBadge >= 1, "U8 the Threat panel lists enemy talents (+ ✧ on the enemy)", ui.fight)
    check(/Talents/.test(ui.fight.talentBadge) && ui.fight.neutralBadge === "moonmoth-cloak", "U9 hero token: talent mark (tooltip lists them) + neutral mark", ui.fight)
    const panel = page.locator(".hwt-threat")
    if (await panel.count()) await panel.screenshot({ path: `${SHOTS}/dota2-threat-enemy-talents.png` })
    await page.screenshot({ path: `${SHOTS}/dota2-fight.png` })
    // The talented skill shows its charges on the skill bar.
    await page.locator('.hwt-token[data-side="player"][data-unit-id^="player-bulwark"]').click()
    await page.waitForTimeout(300)
    ui.skill = await page.evaluate(() => ({ charges: document.querySelector('.hwt-skill-btn[data-skill-id="shield-wall"]')?.getAttribute("data-charges"), talent: document.querySelector('.hwt-skill-btn[data-skill-id="shield-wall"] .hwt-skill-talent')?.textContent }))
    check(ui.skill.charges === "2" && /×2/.test(ui.skill.talent || ""), "U10 skill bar: Shield Wall shows ✦ ×2 charges", ui.skill)
    })
    check(errs.length === 0, "U11 no page errors", errs.slice(0, 3))
  } finally {
    await browser.close()
  }
  console.log(JSON.stringify(ui, null, 1))
  return out
}
