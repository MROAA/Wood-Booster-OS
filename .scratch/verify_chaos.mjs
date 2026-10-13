// Chaos combos (tacticsChaos.js): knockback into every hazard / unit /
// object / the edge, chain reactions in order with numbered callouts,
// the real skills that knock (Shove signature, Shoulder Check, a
// promotion knock), element-terrain interactions (fire -> tall grass,
// frost -> water turns to ice), the enemy AI shoving a hero into lava
// (preview == real) and avoiding tiles where it could be knocked into
// one; a real board screenshot of a chain reaction.
import { chromium } from "playwright"

const PORT = process.env.PORT || 5445
const SHOTS = process.env.SHOTS || "/tmp"
const browser = await chromium.launch()
const errs = []
const out = { errors: [] }
const page = await (await browser.newContext({ viewport: { width: 1600, height: 1000 } })).newPage()
page.on("pageerror", (e) => errs.push(String(e)))
page.on("console", (m) => m.type() === "error" && !/ERR_CONNECTION_REFUSED/.test(m.text()) && errs.push(m.text()))
await page.goto(`http://localhost:${PORT}/heartwood-tactics`, { waitUntil: "domcontentloaded" })
await page.waitForSelector(".hwt-board", { timeout: 20000 })

const r = await page.evaluate(async () => {
  const E = await import("/src/services/heartwood/tacticsEngine.js")
  const C = await import("/src/services/heartwood/tacticsChaos.js")
  const EL = await import("/src/services/heartwood/tacticsElements.js")
  const O = await import("/src/services/heartwood/tacticsObjects.js")
  const TC = await import("/src/services/heartwood/tacticsClasses.js")
  const P2 = await import("/src/services/heartwood/promotions.js")
  const PD = await import("/src/data/heartwood/promotions.js")
  const fails = []
  const res = {}
  const ok = (cond, msg, data) => {
    if (!cond) fails.push(data === undefined ? msg : `${msg} ${JSON.stringify(data).slice(0, 700)}`)
  }
  const base = E.createTacticsBattle()
  const clean = {
    block: 0, ward: 0, revive: 0, bulwark: 0, taunt: 0, poison: 0, weak: 0, vulnerable: 0, slow: 0, root: 0,
    suppressed: 0, stun: 0, execute: 0, shatter: 0, woundedFury: 0, leech: false, poisonOnHit: 0, nimble: false,
    phases: [], phaseIndex: 0, triggers: [], aoeMove: null, charge: null, covenAura: null, cultRitual: null,
    cultFodder: false, broodSplit: null, className: null, classPassive: null, classSkills: [], ap: 2, apMax: 2, regen: 0, strength: 0, enemySkills: [],
    haste: false, spiritbound: false, guardian: false, wary: false, burn: 0, chill: 0, frozen: 0, entangle: 0, ability: null, evade: 0,
  }
  const pTpl = base.units.find((u) => u.side === "player")
  const eTpl = base.units.find((u) => u.side === "enemy")
  const mk = (tpl, id, side, row, col, extra = {}) => ({
    ...tpl, ...clean, id, side, name: id, defId: id, pos: { row, col }, hp: 30, maxHp: 30, attack: 8, baseAttack: 8, range: 1, move: 2,
    facing: side === "player" ? "W" : "E", ...extra,
  })
  const P = (id, row, col, extra) => mk(pTpl, id, "player", row, col, extra)
  const En = (id, row, col, extra) => mk(eTpl, id, "enemy", row, col, extra)
  const st = (units, terrain = {}) => ({ ...base, units, terrain, wallHp: {}, objHp: {}, objFire: {}, tileTimers: {}, phase: "player", turn: 1, log: [], events: [], eventSeq: 0, relicIds: [] })
  const U = (s, id) => s.units.find((u) => u.id === id)
  const hp = (s, id) => U(s, id).hp
  const W = { row: 0, col: -1 }
  const idle = () => En("idle", 8, 11, { move: 0, hp: 99, maxHp: 99, attack: 0 })
  const labels = (s, seq0 = 0) => (s.events || []).filter((e) => e.seq > seq0 && e.kind === "chaos").map((e) => e.label)

  // --- A: knockback into each hazard ------------------------------------------------
  const into = (terrain, extra = {}) => {
    const s = st([P("p", 4, 7), En("e", 4, 6, extra), idle()], terrain)
    const n = C.knockback(s, "p", "e", W, 1)
    const e = U(n, "e")
    return { pos: `${e.pos.row}-${e.pos.col}`, dmg: 30 - e.hp, burn: e.burn || 0, poison: e.poison || 0, chill: e.chill || 0, hp: e.hp, labels: labels(n), n }
  }
  const lava = into({ "4-5": "lava" })
  const fire = into({ "4-5": "fire" })
  const poison = into({ "4-5": "poison" })
  const spikes = into({ "4-5": "spikes" })
  const ice = into({ "4-5": "ice" })
  const plain = into({})
  const drownSmall = into({ "4-5": "water" }, { hp: 10, maxHp: 10 })
  const splashBig = into({ "4-5": "water" }, { hp: 30, maxHp: 30 })
  res.A = { lava, fire, poison, spikes, ice, plain, drownSmall, splashBig }
  for (const k of Object.keys(res.A)) delete res.A[k].n
  ok(lava.pos === "4-5" && lava.dmg === 3 && lava.burn >= 2 && lava.labels.includes("Into the lava!"), "lava: lands in it, 3 damage + Burn", lava)
  ok(fire.pos === "4-5" && fire.burn >= 2 && fire.labels.includes("Into the flames!"), "flames: lands in them, +2 Burn", fire)
  ok(poison.pos === "4-5" && poison.poison === 2 && poison.labels.includes("Into the poison!"), "poison pool: +2 Poison", poison)
  ok(spikes.pos === "4-5" && spikes.dmg === 3 && spikes.labels.includes("Impaled!"), "spikes: 3 damage", spikes)
  ok(ice.pos === "4-4" && ice.dmg === 0, "ice: slides one tile further", ice)
  ok(plain.pos === "4-5" && plain.dmg === 0 && plain.labels.length === 0, "open ground: just moves", plain)
  ok(drownSmall.hp === 0 && drownSmall.labels.includes("Drowned!") && drownSmall.pos === "4-6", "deep water: a small enemy drowns", drownSmall)
  ok(splashBig.hp === 28 && splashBig.chill >= 1 && splashBig.pos === "4-6" && splashBig.labels.includes("Splash!"), "deep water: a big unit splashes (2 + Chill) and stays", splashBig)
  // Hero into deep water never drowns.
  {
    const s = st([En("x", 4, 7), P("hero", 4, 6, { hp: 5, maxHp: 10 }), idle()], { "4-5": "water" })
    const n = C.knockback(s, "x", "hero", W, 1)
    ok(hp(n, "hero") === 3 && U(n, "hero").pos.col === 6, "heroes never drown (splash)", { hp: hp(n, "hero") })
  }
  // Unit collision: both take 2; barrel: explodes; tree: falls the push way; boulder rolls; edge; wall.
  {
    const s = st([P("p", 4, 7), En("e", 4, 6), En("f", 4, 5), idle()])
    const n = C.knockback(s, "p", "e", W, 1)
    res.A.crash = { e: 30 - hp(n, "e"), f: 30 - hp(n, "f"), pos: U(n, "e").pos.col, labels: labels(n) }
    ok(res.A.crash.e === 2 && res.A.crash.f === 2 && res.A.crash.pos === 6 && res.A.crash.labels.includes("Crash!"), "into a unit: both take 2, nobody moves", res.A.crash)
  }
  {
    const s = st([P("p", 4, 8), En("e", 4, 7), En("near", 3, 5), idle()], { "4-6": "barrel" })
    const n = C.knockback(s, "p", "e", W, 1)
    res.A.barrel = { e: 30 - hp(n, "e"), near: 30 - hp(n, "near"), tile: n.terrain["4-6"], boom: n.events.some((x) => x.kind === "object" && x.fx === "boom"), labels: labels(n) }
    ok(res.A.barrel.e === 2 + 4 && res.A.barrel.near === 4 && res.A.barrel.boom && res.A.barrel.labels.some((l) => /BOOM/.test(l)), "into a barrel: 2 impact + it explodes", res.A.barrel)
  }
  {
    const s = st([P("p", 4, 8), En("e", 4, 7), En("under", 4, 5), idle()], { "4-6": "tree" })
    const n = C.knockback(s, "p", "e", W, 1)
    res.A.tree = { e: 30 - hp(n, "e"), under: 30 - hp(n, "under"), tree: n.terrain["4-6"], fall: n.events.find((x) => x.kind === "object" && x.fx === "fall")?.dir }
    ok(res.A.tree.e === 2 && res.A.tree.tree === "stump" && res.A.tree.under === 4 && res.A.tree.fall?.col === -1, "into a tree: it falls the way the unit was pushed", res.A.tree)
  }
  {
    const s = st([P("p", 4, 8), En("e", 4, 7), idle()], { "4-6": "boulder" })
    const n = C.knockback(s, "p", "e", W, 1)
    const at = Object.entries(n.terrain).find(([, v]) => v === "boulder")?.[0]
    ok(30 - hp(n, "e") === 2 && at && at !== "4-6", "into a boulder: it rolls on", { at })
  }
  {
    const s = st([P("p", 4, 1), En("e", 4, 0), idle()])
    const n = C.knockback(s, "p", "e", W, 1)
    ok(30 - hp(n, "e") === 2 && U(n, "e").pos.col === 0, "into the board edge: 2 impact", { hp: hp(n, "e") })
  }
  // Multi-tile: stops at the first hazard.
  {
    const s = st([P("p", 4, 8), En("e", 4, 7), idle()], { "4-5": "lava" })
    const n = C.knockback(s, "p", "e", W, 3)
    ok(U(n, "e").pos.col === 5 && 30 - hp(n, "e") === 3, "a 3-tile knockback stops in the lava on tile 2", U(n, "e").pos)
  }

  // --- B: chain reactions in order ------------------------------------------------------
  {
    // e -> barrel A; its blast sets off barrel B and lights the tree; the chain is numbered.
    const terrain = { "4-6": "barrel", "4-5": "barrel", "3-4": "tree", "5-5": "bush" }
    const s = st([P("p", 4, 8), En("e", 4, 7), En("x", 5, 4), idle()], terrain)
    const n = C.knockback(s, "p", "e", W, 1)
    const fresh = n.events.filter((x) => x.kind === "chaos" || x.kind === "object").map((x) => (x.kind === "chaos" ? `chaos:${x.label}` : `obj:${x.fx}`))
    res.B = { fresh, banner: n.events.find((x) => x.kind === "chaos" && x.big), terrain: n.terrain }
    const iInto = fresh.findIndex((x) => /Into the barrel/.test(x))
    const iBoom = fresh.indexOf("obj:boom")
    const iBoom2 = fresh.indexOf("obj:boom", iBoom + 1)
    ok(iInto === 0 && iBoom > iInto && iBoom2 > iBoom, "chain order: callout -> barrel A blows -> barrel B blows", fresh)
    ok(res.B.banner && res.B.banner.chain >= 3 && /Chain reaction x/.test(res.B.banner.label), "a 3+ chain gets the CHAIN REACTION banner", res.B.banner)
    ok(n.terrain["5-5"] === "fire" || fresh.includes("obj:grassfire"), "the fire blast lights the tall grass", { t: n.terrain["5-5"] })
    ok(n.objFire?.["3-4"] > 0 || n.terrain["3-4"] !== "tree", "the blast sets the tree alight", { t: n.terrain["3-4"], fire: n.objFire })
    // Pure: the same input gives the same output.
    ok(JSON.stringify(C.knockback(s, "p", "e", W, 1).units) === JSON.stringify(n.units), "deterministic")
  }

  // --- C: the real skills knock through chaos -----------------------------------------------
  {
    // Signature Shove into lava (free tile behind).
    const shove = { id: "shove", name: "Shove", kind: "push", cost: 1, bonus: 2, cooldown: 0 }
    const s = st([P("pu", 4, 8, { ability: shove, cooldownRemaining: 0 }), En("e", 4, 7), idle()], { "4-6": "lava" })
    const n = E.castAbility(s, "pu", "e")
    res.C = { shoveLava: { pos: U(n, "e").pos.col, lost: 30 - hp(n, "e"), labels: labels(n) } }
    ok(U(n, "e").pos.col === 6 && res.C.shoveLava.labels.includes("Into the lava!"), "Shove into lava", res.C.shoveLava)
    // Shove blocked by a barrel: the old +2 slam AND the barrel blows.
    const s2 = st([P("pu", 4, 8, { ability: shove, cooldownRemaining: 0 }), En("e", 4, 7), idle()], { "4-6": "barrel" })
    const n2 = E.castAbility(s2, "pu", "e")
    res.C.shoveBarrel = { tile: n2.terrain["4-6"], lost: 30 - hp(n2, "e") }
    ok(n2.terrain["4-6"] !== "barrel" && res.C.shoveBarrel.lost >= 8 + 2 + 4, "Shove into a barrel: slam + explosion", res.C.shoveBarrel)
    // Shove blocked by a small enemy standing in the river... drowned when it's the target and water is behind.
    const s3 = st([P("pu", 4, 8, { ability: shove, cooldownRemaining: 0 }), En("e", 4, 7, { hp: 12, maxHp: 12, attack: 1 }), idle()], { "4-6": "water" })
    const n3 = E.castAbility(s3, "pu", "e")
    ok(hp(n3, "e") === 0 && labels(n3).includes("Drowned!"), "Shove a small enemy into deep water: it drowns", { hp: hp(n3, "e"), l: labels(n3) })
  }
  {
    // Shoulder Check (Bruiser) into a unit -> crash.
    const s = st([P("br", 4, 8, { classId: "bruiser", classPassive: "adrenaline", classSkills: E.createTacticsBattle().units[0].classSkills?.length ? [] : [], ap: 2 }), En("e", 4, 7), En("f", 4, 6), idle()])
    const sk = { id: "shoulder-check", name: "Shoulder Check", icon: "⇥", cost: 1, cooldown: 2, mana: 0, target: "enemy", range: 1, gen: 10, classId: "bruiser" }
    const s1 = { ...s, units: s.units.map((u) => (u.id === "br" ? { ...u, classSkills: [sk], classCds: {} } : u)) }
    const n = E.castAbility(s1, "br", "e", "shoulder-check")
    res.C.check = { e: U(n, "e").pos.col, f: 30 - hp(n, "f"), br: U(n, "br").pos.col, labels: labels(n) }
    ok(res.C.check.e === 7 && res.C.check.f === 2 && res.C.check.br === 8 && res.C.check.labels.includes("Crash!"), "Shoulder Check into another enemy: crash, nobody moves", res.C.check)
    // Into lava: the target goes in and the Bruiser steps up.
    const s2 = { ...s1, terrain: { "4-6": "lava" }, units: s1.units.filter((u) => u.id !== "f") }
    const n2 = E.castAbility(s2, "br", "e", "shoulder-check")
    ok(U(n2, "e").pos.col === 6 && U(n2, "br").pos.col === 7 && labels(n2).includes("Into the lava!"), "Shoulder Check into lava: in it goes, the Bruiser steps up", { e: U(n2, "e").pos, br: U(n2, "br").pos })
  }
  {
    // Promotion knock (Pit Fighter Suplex, 2 tiles) -> spikes on tile 2.
    const promo = PD.PROMOTIONS["pit-fighter"]
    const sk = P2.promoSkill(promo, { barMax: 100 })
    const s = st([P("pf", 4, 8, { classId: "bruiser", classSkills: [sk], classCds: {}, ap: 3 }), En("e", 4, 7), idle()], { "4-5": "spikes" })
    const n = E.castAbility(s, "pf", "e", sk.id)
    res.C.suplex = { pos: U(n, "e").pos.col, labels: labels(n) }
    ok(res.C.suplex.pos === 5 && res.C.suplex.labels.includes("Impaled!"), "promotion knock: thrown 2 tiles onto the spikes", res.C.suplex)
  }

  // --- D: element + terrain interactions -------------------------------------------------------
  {
    // Fire on a unit standing in tall grass sets the grass alight; next round it spreads.
    const s = st([P("p", 4, 8), En("e", 4, 5), idle()], { "4-5": "bush", "4-4": "bush", "4-3": "bush" })
    const n = EL.applyElement(s, "e", "fire", 1)
    const t1 = n.terrain["4-5"]
    const n2 = O.objectsRoundTick(n)
    const n3 = O.objectsRoundTick(O.objectsRoundTick(n2))
    res.D = { lit: t1, spread: n2.terrain["4-4"], after: [n3.terrain["4-5"], n3.terrain["4-4"]] }
    ok(t1 === "fire" && n2.terrain["4-4"] === "fire", "fire lights the grass under a unit and spreads to the grass next to it", res.D)
    ok(n3.terrain["4-5"] === "ash", "burnt grass leaves ash", res.D.after)
    // Frost on a unit next to the river freezes it into an ice bridge.
    const w = st([P("p", 4, 8), En("e", 4, 5), idle()], { "4-4": "water", "3-5": "water", "5-5": "path" })
    const wn = EL.applyElement(w, "e", "frost", 1)
    res.D.ice = { a: wn.terrain["4-4"], b: wn.terrain["3-5"], ev: wn.events.some((x) => x.kind === "object" && x.fx === "freeze") }
    ok(res.D.ice.a === "ice" && res.D.ice.b === "ice" && res.D.ice.ev, "frost turns the water next to the unit into ice (walkable)", res.D.ice)
    // Lightning/storm: no lightning element in the game -> nothing to do (skipped by design).
    res.D.lightning = Object.keys(EL.ELEMENTS)
  }

  // --- E: enemy AI: shoves a hero into lava (preview == real), avoids being shoved -------------------
  {
    const s = st([P("hero", 4, 5, { facing: "E", ap: 0 }), En("moss-troll", 4, 6, { defId: "moss-troll", attack: 6, hp: 46, maxHp: 46, enemySkills: undefined }), idle()], { "4-4": "lava" })
    const troll = U(s, "moss-troll")
    const skills = (await import("/src/services/heartwood/tacticsEnemyAbilities.js")).enemySkillsFor(troll)
    const intents = E.previewEnemyIntents(s)
    const mine = intents.find((x) => x.enemyId === "moss-troll")?.intent
    const after = E.endPlayerTurn(s)
    res.E = { skills: skills.map((x) => x.kind), intent: mine && { kind: mine.kind, skill: mine.skillKind, target: mine.targetId }, heroPos: U(after, "hero").pos, heroLost: 30 - hp(after, "hero") }
    ok(skills.some((x) => x.kind === "shove"), "Moss Troll carries a shove", skills)
    ok(mine?.skillKind === "shove" && mine.targetId === "hero", "the AI picks the shove when lava is behind the hero (telegraphed)", res.E.intent)
    ok(U(after, "hero").pos.col === 4 && res.E.heroLost >= 3, "real enemy turn = preview: the hero lands in the lava", res.E)
    // No hazard behind: no shove (it just attacks).
    const s2 = st([P("hero", 4, 5, { facing: "E", ap: 0 }), En("moss-troll", 4, 6, { defId: "moss-troll", attack: 6, hp: 46, maxHp: 46, enemySkills: undefined }), idle()])
    const i2 = E.previewEnemyIntents(s2).find((x) => x.enemyId === "moss-troll")?.intent
    ok(i2 && i2.skillKind !== "shove", "no hazard: no pointless shove", i2)
    // Avoid: a tile in front of lava is risky when a hero with a Shove can reach it.
    const shove = { id: "shove", name: "Shove", kind: "push", cost: 1, bonus: 2, cooldown: 0 }
    const s3 = st([P("pu", 4, 8, { ability: shove, cooldownRemaining: 0 }), En("e", 2, 2), idle()], { "4-6": "lava" })
    const risky = C.aiKnockbackRisk(s3, U(s3, "e"), { row: 4, col: 7 })
    const safe = C.aiKnockbackRisk(s3, U(s3, "e"), { row: 3, col: 7 })
    const noKnocker = C.aiKnockbackRisk(st([P("pu", 4, 8), En("e", 2, 2), idle()], { "4-6": "lava" }), U(s3, "e"), { row: 4, col: 7 })
    res.E.risk = { risky, safe, noKnocker }
    ok(risky > safe && noKnocker === 0, "AI tile risk: in front of lava next to a shover", res.E.risk)
    // Decision: a melee enemy with two equal attack tiles picks the one NOT in front of the lava.
    const s4 = st([P("pu", 4, 8, { ability: shove, cooldownRemaining: 0, facing: "W" }), En("e", 4, 4, { move: 3, attack: 3 }), idle()], { "4-6": "lava", "3-7": "path", "5-7": "path" })
    const i4 = E.previewEnemyIntents(s4).find((x) => x.enemyId === "e")?.intent
    res.E.choice = i4 && (i4.to || i4.moveTo || i4.dest || null)
    ok(i4 && JSON.stringify(res.E.choice) !== JSON.stringify({ row: 4, col: 7 }), "the AI avoids the tile a hero can shove it into lava from", i4)
  }

  // --- stage a real board with a chain (prototype page) ---
  res.fails = fails
  return res
})
for (const k of ["A", "B", "C", "D", "E"]) out[k] = r[k]
for (const f of r.fails) out.errors.push(f)

// --- UI: a chain reaction on the REAL run board (Shove an enemy into a barrel line) ------
{
  await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
  const staged = await page.evaluate(async () => {
    const rt = await import("/src/services/heartwood/runEngine.js")
    const { buildRunTacticsBattle } = await import("/src/services/heartwood/tacticsRealMatchup.js")
    const { UNITS } = await import("/src/data/heartwood/units.js")
    const { signatureAbilityForDef } = await import("/src/services/heartwood/tacticsEngine.js")
    // A Bruiser: its Shoulder Check knocks back 1 tile (through tacticsChaos).
    const pusher = UNITS.grimtusk
    void signatureAbilityForDef
    const idx = rt.RUN_PATH.findIndex((n) => n.type === "battle" && n.formationId)
    const rs = {
      ...rt.startRun("tommy", null, { forcedSeed: 777 }), nodeIndex: idx, path: rt.RUN_PATH.slice(0, idx + 1), phase: "formation",
      bench: [{ key: "b0", defId: pusher.id, upgradeLevel: 0, upgrades: [], heroTraits: [] }], deployed: ["b0", null, null, null], items: [],
      lastSeenAct: rt.actIndexForNode(idx, rt.RUN_PATH.length),
    }
    const st = rt.startTacticsFormationBattle(rs, (x) => buildRunTacticsBattle(rs, x))
    const b = st.battle
    const hero = b.units.find((u) => u.defId === pusher.id && u.side === "player")
    const foes = b.units.filter((u) => u.side === "enemy")
    let far = 0
    const units = b.units.map((u) => {
      if (u.id === hero.id) return { ...u, pos: { row: 4, col: 8 }, ap: 2, cooldownRemaining: 0, facing: "W", mana: u.manaMax }
      if (u.id === foes[0].id) return { ...u, pos: { row: 4, col: 7 }, hp: 30, maxHp: 30, block: 0, ward: 0, revive: 0, evade: 0 }
      if (u.side === "enemy") return { ...u, pos: { row: 1 + far, col: 1 }, hp: 30 + far++ }
      return { ...u, pos: { row: 8, col: 11 } }
    })
    const terrain = { "4-6": "barrel", "4-5": "barrel", "3-5": "bush", "5-5": "bush", "5-6": "bush", "3-4": "tree" }
    const battle = { ...b, units, terrain, objHp: {}, objFire: {}, tileTimers: {}, wallHp: {}, objective: null, phase: "player", deploy: null }
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(rt.serializeRun({ ...st, battle })))
    localStorage.setItem("heartwood-autobattler-intro-seen", "1")
    localStorage.setItem("heartwood-story-intro-seen", "1")
    localStorage.setItem("heartwood-tactics-tutorial-v1", "skipped")
    return { hero: hero.id, foe: foes[0].id, pusher: pusher.id }
  })
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.waitForSelector(".hwt-board", { timeout: 15000 }).catch(() => {})
  const begin = page.locator(".hwt-begin-battle")
  if (await begin.count()) {
    await begin.click().catch(() => {})
    await page.waitForTimeout(400)
  }
  await page.locator(`.hwt-token[data-unit-id="${staged.hero}"]`).first().click().catch(() => {})
  await page.waitForTimeout(250)
  await page.locator("button:has-text('Got it')").first().click({ timeout: 1500 }).catch(() => {})
  await page.locator('.hwt-skill-btn[data-skill-id="shoulder-check"]').first().click({ timeout: 5000 }).catch(() => {})
  await page.waitForTimeout(250)
  await page.locator(`.hwt-token[data-unit-id="${staged.foe}"]`).first().click().catch(() => {})
  // The chain plays beat by beat; catch the banner on its way.
  await page.evaluate(() => document.querySelector(".hwt-board")?.scrollIntoView({ block: "center" }))
  const banner = await page.waitForSelector(".hwt-chaos-banner", { timeout: 6000 }).then(() => true).catch(() => false)
  await page.waitForTimeout(450)
  out.bannerBox = await page.locator(".hwt-chaos-banner").first().evaluate((el) => {
    const r = el.getBoundingClientRect()
    const hits = []
    for (const sh of document.styleSheets) {
      let rules
      try { rules = sh.cssRules } catch { continue }
      for (const ru of rules) if (ru.selectorText && el.matches(ru.selectorText) && ru.style.position) hits.push(`${ru.selectorText} -> ${ru.style.position}`)
    }
    return { y: r.y, pos: getComputedStyle(el).position, hits }
  }).catch((e) => String(e).slice(0, 80))
  await page.screenshot({ path: `${SHOTS}/chaos_chain_board.png` }).catch(() => {})
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("heartwood-run-save-v1")).run.battle)
  const evs = (saved.events || []).filter((e) => e.kind === "chaos").map((e) => e.label)
  out.ui = { staged, banner, chaos: evs, barrels: Object.values(saved.terrain || {}).filter((t) => t === "barrel").length }
  if (!(banner && evs.some((l) => /Chain reaction/.test(l)) && out.ui.barrels === 0)) out.errors.push(`UI: chain reaction on the board ${JSON.stringify(out.ui)}`)
}

await page.close()
console.log(JSON.stringify(out, null, 2))
console.log("\npageErrors:", errs.length, errs.slice(0, 8))
await browser.close()
const pass = out.errors.length === 0 && errs.length === 0
console.log(pass ? "\n✅ verify_chaos PASS" : "\n❌ verify_chaos FAIL")
process.exit(pass ? 0 : 1)
