// Class promotions (promotions.js): every one of the 38 classes offers
// 2 promotions at Lv3, Lv5 = master / cross-train; the promotion's skill,
// stat bump, passive and RESOURCE twist apply in a real tactics fight;
// every promotion skill casts on a board (preview stays a clean dry-run);
// a Class Collar puts the promotion to sleep (stats stay); UI ceremony
// + card title + token badge + skill bar via real clicks.
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
  const rt = await import("/src/services/heartwood/runEngine.js")
  const E = await import("/src/services/heartwood/tacticsEngine.js")
  const TC = await import("/src/services/heartwood/tacticsClasses.js")
  const lv = await import("/src/services/heartwood/unitLevels.js")
  const P = await import("/src/data/heartwood/promotions.js")
  const { CLASS_IDS, CLASSES } = await import("/src/data/heartwood/classes.js")
  const { buildRunTacticsBattle } = await import("/src/services/heartwood/tacticsRealMatchup.js")
  const fails = []
  const res = {}
  const ok = (cond, msg, data) => {
    if (!cond) fails.push(data === undefined ? msg : `${msg} ${JSON.stringify(data).slice(0, 600)}`)
  }
  const KINDS = new Set(["smite", "nova", "volley", "sanctuary", "rally", "blink", "knock", "zone"])

  // --- A: data: 38 classes x 2 promotions, complete entries --------------------
  const bad = []
  for (const cid of CLASS_IDS) {
    const ps = P.promotionsFor(cid)
    if (ps.length !== 2 || ps[0].name === ps[1].name) bad.push(`${cid}: ${ps.length}`)
    for (const p of ps) {
      if (!p.name || !p.icon || !p.tagline || !p.stats || !p.skill?.name || !p.skill?.text || !KINDS.has(p.skill.kind)) bad.push(`${p.id}: skill`)
      if (!p.passive?.name || !p.passive?.text || !p.passive?.mods) bad.push(`${p.id}: passive`)
      if (!p.twist?.text || !(p.twist.maxPct || p.twist.startPct || p.twist.regen || p.twist.bp)) bad.push(`${p.id}: twist`)
      if (!p.master?.text || !p.master?.patch) bad.push(`${p.id}: master`)
    }
  }
  res.A = { classes: CLASS_IDS.length, promotions: P.PROMOTION_IDS.length, kinds: [...new Set(P.PROMOTION_IDS.map((id) => P.PROMOTIONS[id].skill.kind))] }
  ok(CLASS_IDS.length === 38 && P.PROMOTION_IDS.length === 76 && bad.length === 0, "every class has 2 complete promotions", bad.slice(0, 10))

  // --- helpers --------------------------------------------------------------------
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
  const start = (rs) => rt.startTacticsFormationBattle(rs, (s) => buildRunTacticsBattle(rs, s)).battle
  const U = (b, id) => b.units.find((u) => u.id === id)
  const HERO = "player-the-fool-0"
  const hero = (cid, extra = {}) => ({ key: "b0", defId: "the-fool", upgradeLevel: 0, upgrades: [], classId: cid, ...extra })
  const foe = { block: 0, ward: 0, revive: 0, regen: 0, taunt: 0, bulwark: 0, enemySkills: [], hp: 80, maxHp: 80 }
  const arena = (battle, place) => {
    let far = 0
    return {
      ...battle,
      terrain: {},
      objHp: {},
      objFire: {},
      tileTimers: {},
      objective: null,
      phase: "player",
      units: battle.units.map((u) => {
        const p = place[u.id]
        if (p) return { ...u, ...p, pos: { row: p.row, col: p.col } }
        if (u.side === "enemy") return { ...u, hp: 0 }
        return { ...u, pos: { row: 8, col: 11 - far++ } }
      }),
    }
  }

  // --- B: the Lv3 / Lv5 flow for EVERY class --------------------------------------
  const flowBad = []
  for (const cid of CLASS_IDS) {
    const ids = P.promotionsFor(cid).map((p) => p.id)
    const rs3 = mk([hero(cid, { xp: 15 })])
    const s3 = lv.levelSubject(rs3, "b0")
    if (cid === "commander") continue // the Commander class is checked on the Commander below
    const o3 = lv.promotionOffers(s3)
    if (lv.pendingPromotionRank(s3) !== 1 || JSON.stringify(o3) !== JSON.stringify(ids)) flowBad.push(`${cid}: lv3 ${JSON.stringify(o3)}`)
    const lv2 = lv.levelSubject(mk([hero(cid, { xp: 6 })]), "b0")
    if (lv.pendingPromotionRank(lv2) !== 0) flowBad.push(`${cid}: pending at Lv2`)
    const picked = rt.choosePromotion(rs3, "b0", ids[1])
    if (JSON.stringify(picked.bench[0].promoPicks) !== JSON.stringify([ids[1]]) || lv.pendingPromotionRank(lv.levelSubject(picked, "b0")) !== 0) flowBad.push(`${cid}: pick`)
    const at5 = { ...picked, bench: [{ ...picked.bench[0], xp: 45 }] }
    const s5 = lv.levelSubject(at5, "b0")
    if (lv.pendingPromotionRank(s5) !== 2 || JSON.stringify(lv.promotionOffers(s5)) !== JSON.stringify(["master", "cross"])) flowBad.push(`${cid}: lv5`)
    if (rt.choosePromotion(at5, "b0", ids[0]) !== at5) flowBad.push(`${cid}: bogus lv5 offer accepted`)
  }
  // Commander: the Commander class promotes too (stored on the run).
  const cRs = mk([hero("guardian")], { commanderXp: 15 })
  const cs = lv.levelSubject(cRs, "commander")
  const cOff = lv.promotionOffers(cs)
  const cPick = rt.choosePromotion(cRs, "commander", cOff[0])
  const cUnit = U(start(cPick), "player-commander")
  res.B = { flowBad, cOff, cPicks: cPick.commanderPromo, cSkill: cUnit.classSkills.find((s) => s.promo)?.id, cTitle: cUnit.promoName }
  ok(flowBad.length === 0, "Lv3 offers the 2 promotions of the natural class, Lv5 = master/cross, every class", flowBad.slice(0, 8))
  ok(JSON.stringify(cOff) === JSON.stringify(["warlord", "marshal"]) && cUnit.classSkills.some((s) => s.promoId === "warlord") && cUnit.promoName === "Warlord", "the Commander promotes (Warlord / Marshal)", res.B)
  ok(rt.choosePromotion(mk([hero("guardian", { xp: 6 })]), "b0", "paladin").bench[0].promoPicks === undefined, "no promotion before Lv3")

  // --- C: in a real fight, for every promotion: skill + stats + passive + twist, and it casts ---
  const castBad = []
  const applyBad = []
  let casts = 0
  for (const cid of CLASS_IDS) {
    if (cid === "commander") continue
    const base = U(start(mk([hero(cid, { xp: 15 })])), HERO)
    for (const p of P.promotionsFor(cid)) {
      const b = start(mk([hero(cid, { xp: 15, promoPicks: [p.id] })]))
      const u = U(b, HERO)
      const sk = u.classSkills.find((s) => s.promo)
      const tw = p.twist
      const problems = []
      if (!sk || sk.promoId !== p.id || sk.classId !== cid) problems.push("skill")
      if (u.maxHp !== base.maxHp + (p.stats.hp || 0) || u.attack !== base.attack + (p.stats.attack || 0)) problems.push(`stats ${u.maxHp}/${base.maxHp} ${u.attack}/${base.attack}`)
      if (!(u.extraMods || []).some((m) => m.label === p.passive.name)) problems.push("passive")
      if (tw.maxPct && !u.reagents && !(u.manaMax > base.manaMax)) problems.push(`maxPct ${u.manaMax}/${base.manaMax}`)
      if (tw.startPct && !u.reagents && !(u.mana > base.mana) && base.mana < base.manaMax) problems.push(`startPct ${u.mana}/${base.mana}`)
      if (tw.regen && !((u.manaRegenBonus || 0) > (base.manaRegenBonus || 0))) problems.push("regen")
      if (tw.bp && !(u.extraMods || []).some((m) => m.when === "resAt" && m.label === tw.bp.name)) problems.push("bp")
      if (u.promoName !== p.name || u.promoIcon !== p.icon) problems.push("title")
      if (problems.length) applyBad.push(`${p.id}: ${problems.join(",")}`)
      if (!sk) continue
      // Cast it: the hero in the middle, 2 enemies near, a hurt Commander next to it.
      const E0 = b.units.filter((x) => x.side === "enemy")[0]?.id
      const E1 = b.units.filter((x) => x.side === "enemy")[1]?.id
      const place = {
        // Corruption is inverted: skills ADD to it, so start it empty.
        [HERO]: { row: 4, col: 6, facing: "W", ap: 3, mana: u.resource === "corruption" ? 0 : u.manaMax, classCds: {}, moved: false, root: 0 },
        "player-commander": { row: 5, col: 6, hp: Math.max(1, U(b, "player-commander").maxHp - 6) },
        [E0]: { row: 4, col: 5, ...foe },
      }
      if (E1) place[E1] = { row: 3, col: 5, ...foe }
      let s = arena(b, place)
      if (u.reagents) s = { ...s, units: s.units.map((x) => (x.id === HERO ? { ...x, reagents: { fire: 2, frost: 2, poison: 2, arcane: 2 }, mana: 8 } : x)) }
      if (sk.kind === "zone" || sk.kind === "nova" || sk.kind === "volley") s = { ...s, units: s.units }
      const me = U(s, HERO)
      const live = me.classSkills.find((x) => x.id === sk.id)
      try {
        if (!TC.classSkillUsable(s, me, live)) throw new Error(`not usable: ${TC.classSkillStatus(me, live)}`)
        let target = null
        if (live.target === "tile") target = `${U(s, E0).pos.row}-${U(s, E0).pos.col}`
        else if (live.target !== "self") {
          const ts = TC.classSkillTargets(s, HERO, live)
          if (!ts.length) throw new Error("no targets")
          target = (ts.find((x) => x.id === E0) || ts[0]).id
        }
        const next = E.castAbility(s, HERO, target, live.id)
        if (next === s) throw new Error("cast refused")
        const foeHp = (st) => st.units.filter((x) => x.side === "enemy").reduce((a, x) => a + Math.max(0, x.hp), 0)
        const allyHp = (st) => st.units.filter((x) => x.side === "player").reduce((a, x) => a + x.hp + (x.block || 0) + (x.ward || 0) + (x.empower > 0 ? 10 : 0) + (x.ap || 0), 0)
        const k = live.kind
        const dmgKind = k === "smite" || k === "nova" || k === "volley" || k === "blink" || k === "knock" || (k === "zone" && live.damage > 0)
        if (dmgKind && !(foeHp(next) < foeHp(s))) throw new Error("no damage")
        if ((k === "sanctuary" || k === "rally" || (k === "zone" && live.heal > 0 && !live.damage)) && !(allyHp(next) > allyHp(s) - live.cost)) throw new Error("no ally effect")
        if (k === "knock" && U(next, E0).hp > 0 && JSON.stringify(U(next, E0).pos) === JSON.stringify(U(s, E0).pos)) throw new Error("no knockback")
        if (k === "zone" && live.terrain && !Object.keys(next.terrain || {}).length) throw new Error("no terrain")
        const meAfter = U(next, HERO)
        if (meAfter.mana === me.mana && meAfter.resource !== "reagents") throw new Error(`no resource spent (${me.mana})`)
        E.previewEnemyIntents({ ...next, phase: "player" })
        casts++
      } catch (e) {
        castBad.push(`${p.id}: ${e.message}`)
      }
    }
  }
  res.C = { casts, applyBad, castBad }
  ok(applyBad.length === 0, "promotion stats / passive / resource twist / title apply in a real fight", applyBad.slice(0, 10))
  ok(castBad.length === 0 && casts === 74, "every promotion skill casts on a board and does its thing", { casts, castBad: castBad.slice(0, 10) })

  // --- D: rank II (master patch) and cross-training ---------------------------------
  const m1 = U(start(mk([hero("guardian", { xp: 45, promoPicks: ["bastion"] })])), HERO)
  const m2 = U(start(mk([hero("guardian", { xp: 45, promoPicks: ["bastion", "master"] })])), HERO)
  const m3 = U(start(mk([hero("guardian", { xp: 45, promoPicks: ["bastion", "cross"] })])), HERO)
  const sk1 = m1.classSkills.find((s) => s.promo)
  const sk2 = m2.classSkills.find((s) => s.promo)
  res.D = { r1: [sk1.push, sk1.mult], r2: [sk2.push, sk2.mult], name2: m2.promoName, cross: m3.classSkills.filter((s) => s.promo).map((s) => s.promoId) }
  ok(sk1.push === 2 && sk2.push === 3 && sk2.mult === 1.5 && m2.promoName === "Bastion II", "Lv5 master: rank II numbers + title", res.D)
  ok(JSON.stringify(res.D.cross) === JSON.stringify(["bastion", "paladin"]), "Lv5 cross-train: also learns the other path's skill", res.D)

  // --- E: ALL-IN scales with what was spent (Paladin heals more with more Holy Power) ---
  {
    const b = start(mk([hero("guardian", { xp: 15, promoPicks: ["paladin"] })]))
    const u = U(b, HERO)
    const E0 = b.units.find((x) => x.side === "enemy").id
    const heal = (mana) => {
      const s = arena(b, { [HERO]: { row: 4, col: 6, ap: 3, mana, classCds: {} }, "player-commander": { row: 4, col: 7, hp: 5, block: 0 }, [E0]: { row: 0, col: 0, ...foe } })
      const n = E.castAbility(s, HERO, null, "promo-paladin")
      return { healed: U(n, "player-commander").hp - 5, manaAfter: U(n, HERO).mana, refused: n === s }
    }
    const lo = heal(u.classSkills.find((s) => s.promo).mana)
    const hi = heal(u.manaMax)
    res.E = { lo, hi, max: u.manaMax, price: u.classSkills.find((s) => s.promo).mana }
    // Both casts empty the bar (the 1 left is Holy Power the heal itself builds back).
    ok(!lo.refused && !hi.refused && hi.healed > lo.healed && hi.manaAfter === lo.manaAfter && hi.manaAfter <= 1, "ALL-IN: spends the whole bar and scales with it", res.E)
    const s0 = arena(b, { [HERO]: { row: 4, col: 6, ap: 3, mana: 0, classCds: {} }, [E0]: { row: 0, col: 0, ...foe } })
    ok(E.castAbility(s0, HERO, null, "promo-paladin") === s0, "can't cast without the resource")
  }

  // --- F: a Class Collar puts the promotion to sleep (stats + title stay) ---------------
  {
    const rsA = mk([hero("guardian", { xp: 15, promoPicks: ["paladin"] })])
    const rsC = { ...rsA, items: [{ key: 900, defId: "collar-striker", equippedTo: "b0", slotIndex: 0 }], itemKeyCounter: 901 }
    const plain = U(start(mk([hero("guardian", { xp: 15 })])), HERO)
    const coll = U(start(rsC), HERO)
    const plainC = U(start({ ...mk([hero("guardian", { xp: 15 })]), items: rsC.items, itemKeyCounter: 901 }), HERO)
    res.F = { classId: coll.classId, dormant: coll.promoDormant, promoSkill: coll.classSkills.some((s) => s.promo), hp: [coll.maxHp, plainC.maxHp], title: coll.promoName, plainHp: plain.maxHp }
    ok(coll.classId === "striker" && coll.promoDormant && !coll.classSkills.some((s) => s.promo) && coll.maxHp === plainC.maxHp + 4 && coll.promoName === "Paladin", "collar: fights as the collar class, promotion sleeps, +HP stays", res.F)
    // A hatchling whose natural (bred) class is the promotion's class keeps it.
    const bred = U(start(mk([hero("warden", { xp: 15, promoPicks: ["grovewarden"] })])), HERO)
    ok(bred.classSkills.some((s) => s.promoId === "grovewarden") && !bred.promoDormant, "a bred class counts as natural", { skills: bred.classSkills.map((s) => s.id) })
  }

  // --- G: save/load keeps picks; an old save = none ---------------------------------
  const rsG = rt.choosePromotion(mk([hero("ranger", { xp: 15 })]), "b0", "sniper-hunter")
  const loaded = rt.deserializeRun(JSON.parse(JSON.stringify(rt.serializeRun(rsG))))
  ok(JSON.stringify(loaded.bench[0].promoPicks) === JSON.stringify(["sniper-hunter"]), "save/load keeps the promotion")

  // --- UI saves -------------------------------------------------------------------------
  const shopIdx = rt.RUN_PATH.findIndex((n, i) => i > idx && n.type === "shop")
  const shop = (bench, extra = {}) => ({
    ...mk(bench), phase: "shop", nodeIndex: shopIdx, path: rt.RUN_PATH.slice(0, shopIdx + 1), essence: 500,
    lastSeenAct: rt.actIndexForNode(shopIdx, rt.RUN_PATH.length), ...extra,
  })
  res.ui3 = rt.serializeRun(shop([{ key: "b0", defId: "bulwark-of-ages", upgradeLevel: 0, upgrades: [], xp: 15, perks: ["bark", "edge"] }]))
  res.ui3Offers = lv.promotionOffers(lv.levelSubject(JSON.parse(JSON.stringify(res.ui3)).run, "b0"))
  res.ui5 = rt.serializeRun(shop([{ key: "b0", defId: "bulwark-of-ages", upgradeLevel: 0, upgrades: [], xp: 45, perks: ["bark", "edge", "swift", "ward"], promoPicks: ["paladin"] }]))
  const battleRs = mk([{ key: "b0", defId: "bulwark-of-ages", upgradeLevel: 0, upgrades: [], xp: 15, perks: ["bark", "edge"], promoPicks: ["paladin"] }])
  res.battleSave = rt.serializeRun(rt.startTacticsFormationBattle(battleRs, (s) => buildRunTacticsBattle(battleRs, s)))
  res.fails = fails
  return res
})
for (const k of ["A", "B", "C", "D", "E", "F"]) out[k] = r[k]
for (const f of r.fails) out.errors.push(f)

// --- UI 1: the Lv3 ceremony via a real click ----------------------------------------
{
  await page.evaluate((s) => {
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(s))
    localStorage.setItem("heartwood-autobattler-intro-seen", "1")
    localStorage.setItem("heartwood-story-intro-seen", "1")
  }, r.ui3)
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.waitForSelector("[data-screen='promotion']", { timeout: 15000 }).catch(() => {})
  const offers = await page.locator("[data-promo-offer]").evaluateAll((els) => els.map((e) => e.dataset.promoOffer))
  const rank = await page.locator("[data-screen='promotion']").getAttribute("data-promo-rank").catch(() => null)
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${SHOTS}/promotion_ceremony.png` }).catch(() => {})
  await page.locator("[data-promo-offer='paladin']").click().catch(() => {})
  await page.waitForTimeout(1500)
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("heartwood-run-save-v1")).run.bench[0].promoPicks)
  const gone = (await page.locator("[data-screen='promotion']").count()) === 0
  const squadTab = page.locator("button:has-text('Your Squad'), [aria-label*='Your Squad']").first()
  if (await squadTab.count()) await squadTab.click().catch(() => {})
  await page.waitForTimeout(400)
  const badge = await page.locator(".hw-card-promo[data-promo-badge='paladin']").count()
  const badgeText = await page.locator(".hw-card-promo").first().innerText().catch(() => "")
  out.ui1 = { offers, rank, saved, gone, badge, badgeText }
  if (!(JSON.stringify(offers) === JSON.stringify(r.ui3Offers) && rank === "1" && JSON.stringify(saved) === '["paladin"]' && gone && badge >= 1 && badgeText.includes("Paladin")))
    out.errors.push(`UI: Lv3 ceremony ${JSON.stringify(out.ui1)}`)
}
// --- UI 2: the Lv5 ceremony (cross-train) -------------------------------------------
{
  await page.evaluate((s) => localStorage.setItem("heartwood-run-save-v1", JSON.stringify(s)), r.ui5)
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.waitForSelector("[data-screen='promotion']", { timeout: 15000 }).catch(() => {})
  const offers = await page.locator("[data-promo-offer]").evaluateAll((els) => els.map((e) => e.dataset.promoOffer))
  await page.locator("[data-promo-offer='cross']").click().catch(() => {})
  await page.waitForTimeout(1500)
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("heartwood-run-save-v1")).run.bench[0].promoPicks)
  out.ui2 = { offers, saved }
  if (!(JSON.stringify(offers) === '["master","cross"]' && JSON.stringify(saved) === '["paladin","cross"]')) out.errors.push(`UI: Lv5 ceremony ${JSON.stringify(out.ui2)}`)
}
// --- UI 3: in battle - token badge + promotion skill on the skill bar -------------------
{
  await page.evaluate((s) => localStorage.setItem("heartwood-run-save-v1", JSON.stringify(s)), r.battleSave)
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.waitForSelector(".hwt-board", { timeout: 15000 }).catch(() => {})
  const begin = page.locator(".hwt-begin-battle")
  if (await begin.count()) {
    await begin.click().catch(() => {})
    await page.waitForTimeout(400)
  }
  const tokenBadge = await page.locator('.hwt-token[data-unit-id="player-bulwark-of-ages-0"] .hwt-promo-badge[data-promo-badge="paladin"]').count()
  await page.locator('.hwt-token[data-side="player"][data-unit-id="player-bulwark-of-ages-0"]').first().click().catch(() => {})
  await page.waitForTimeout(300)
  const btn = await page.locator('.hwt-skill-btn[data-promo="paladin"]').count()
  const head = await page.locator(".hwt-skill-bar-promo").innerText().catch(() => "")
  await page.screenshot({ path: `${SHOTS}/promotion_battle.png` }).catch(() => {})
  out.ui3 = { tokenBadge, btn, head }
  if (!(tokenBadge === 1 && btn === 1 && head.includes("Paladin"))) out.errors.push(`UI: battle badge / skill bar ${JSON.stringify(out.ui3)}`)
}

await page.close()
console.log(JSON.stringify(out, null, 2))
console.log("\npageErrors:", errs.length, errs.slice(0, 8))
await browser.close()
const pass = out.errors.length === 0 && errs.length === 0
console.log(pass ? "\n✅ verify_promotions PASS" : "\n❌ verify_promotions FAIL")
process.exit(pass ? 0 : 1)
