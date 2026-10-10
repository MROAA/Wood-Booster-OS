// Hero traits (traits.js): every recruit rolls 1-2 (seeded); fusions keep
// them; the effects apply in real tactics fights (stats, conditional
// mods, resource ones, run extras: Greedy Essence / Bookish XP /
// Stubborn); inheritance at the Nest (each parent trait ~50%, a rare
// fresh one) carries into a run and home again; UI chips on cards +
// a token badge + the Nest's "Traits from its blood" line via real clicks.
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
  const M = await import("/src/services/heartwood/tacticsMana.js")
  const T = await import("/src/services/heartwood/traits.js")
  const TD = await import("/src/data/heartwood/traits.js")
  const H = await import("/src/services/heartwood/hearth.js")
  const { UNITS } = await import("/src/data/heartwood/units.js")
  const { buildRunTacticsBattle } = await import("/src/services/heartwood/tacticsRealMatchup.js")
  const fails = []
  const res = {}
  const ok = (cond, msg, data) => {
    if (!cond) fails.push(data === undefined ? msg : `${msg} ${JSON.stringify(data).slice(0, 600)}`)
  }

  // --- A: data ------------------------------------------------------------------
  const all = Object.values(TD.TRAITS)
  const RES_KEYS = ["manaMax", "manaRegen", "manaStartPct"]
  const resource = all.filter((t) => RES_KEYS.some((k) => t.fx?.[k]) || t.mods?.cheaper || t.mods?.when?.startsWith("res")).map((t) => t.id)
  res.A = { count: all.length, rollable: all.filter((t) => t.weight > 0).length, resource }
  ok(all.length >= 20 && res.A.rollable >= 18 && resource.length >= 5 && all.every((t) => t.name && t.icon && t.text && TD.TRAIT_KINDS[t.kind]), "20+ traits, 5+ resource ones, complete", res.A)

  // --- B: recruits roll 1-2, deterministically; fusions keep theirs --------------
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
  const run = { ...rt.startRun("tommy", null, { forcedSeed: 4242 }), essence: 999 }
  const commons = Object.values(UNITS).filter((u) => u.tier === "common" && !u.fusedFrom && !u.summonOnly && !u.evolvedFrom).map((u) => u.id)
  // A real shop buy (the offer has to be on the shelf).
  const buy = (st, id) => rt.recruitUnit({ ...st, shopOffers: [id] }, id)
  let rs = run
  for (const id of commons.slice(0, 5)) rs = buy(rs, id)
  const rolled = rs.bench.map((e) => e.heroTraits)
  let rs2 = run
  for (const id of commons.slice(0, 5)) rs2 = buy(rs2, id)
  const other = { ...rt.startRun("tommy", null, { forcedSeed: 99 }), essence: 999 }
  let rs3 = other
  for (const id of commons.slice(0, 5)) rs3 = buy(rs3, id)
  // Fusion: 3 copies of one common fuse; the fused hero keeps their traits.
  let fz = run
  for (let i = 0; i < 3; i++) fz = buy(fz, commons[0])
  const fused = fz.bench.find((e) => UNITS[e.defId]?.displayTier === 2)
  res.B = { rolled, sameSeed: JSON.stringify(rolled) === JSON.stringify(rs2.bench.map((e) => e.heroTraits)), other: rs3.bench.map((e) => e.heroTraits), fused: fused && fused.heroTraits }
  ok(rolled.length === 5 && rolled.every((t) => Array.isArray(t) && t.length >= 1 && t.length <= 2 && t.every((id) => TD.TRAITS[id]?.weight > 0)), "every recruit rolls 1-2 rollable traits", rolled)
  ok(res.B.sameSeed && JSON.stringify(rolled) !== JSON.stringify(res.B.other), "seeded: same run = same traits, another seed differs", res.B)
  ok(fused && Array.isArray(fused.heroTraits) && fused.heroTraits.length >= 1, "a fused Tier 2 keeps its parts' traits", res.B.fused)

  // --- C: effects in real fights -----------------------------------------------------
  const start = (bench, extra) => rt.startTacticsFormationBattle(mk(bench, extra), (s) => buildRunTacticsBattle(mk(bench, extra), s)).battle
  const H0 = "player-the-fool-0"
  const U = (b, id) => b.units.find((u) => u.id === id)
  const hero = (traits, extra = {}) => [{ key: "b0", defId: "the-fool", upgradeLevel: 0, upgrades: [], heroTraits: traits, ...extra }]
  const plain = U(start(hero([])), H0)
  const fx = (t) => U(start(hero([t])), H0)
  const foe = { block: 0, ward: 0, revive: 0, regen: 0, taunt: 0, bulwark: 0, enemySkills: [], hp: 90, maxHp: 90 }
  const arena = (b, place) => ({
    ...b, terrain: {}, objective: null, phase: "player",
    units: b.units.map((u) => (place[u.id] ? { ...u, ...place[u.id], pos: { row: place[u.id].row, col: place[u.id].col } } : u.side === "enemy" ? { ...u, hp: 0 } : { ...u, pos: { row: 8, col: 11 } })),
  })
  const fragile = fx("fragile")
  const early = fx("early-bird")
  const touched = fx("mana-touched")
  const lucky = fx("lucky")
  const hot = fx("hot-headed")
  res.C = {
    fragile: [plain.maxHp, fragile.maxHp], early: [plain.ap, early.ap], touched: [plain.manaMax, touched.manaMax], lucky: [plain.evade || 0, lucky.evade], hot: [plain.attack, hot.attack, hot.mutAim],
    traitsOnUnit: fragile.heroTraits,
  }
  ok(fragile.maxHp === plain.maxHp - 3 && early.ap === plain.ap + 1 && touched.manaMax > plain.manaMax && lucky.evade === (plain.evade || 0) + 1 && hot.attack === plain.attack + 2 && hot.mutAim === -10, "stat traits apply (Fragile, Early Bird, Mana-touched, Lucky, Hot-headed)", res.C)
  // Brave: +1 damage above half HP, nothing below.
  const brave = start(hero(["brave"]))
  const plainB = start(hero([]))
  const E0 = brave.units.find((u) => u.side === "enemy").id
  const hitFor = (b, hp) => {
    const s = arena(b, { [H0]: { row: 4, col: 6, facing: "W", hp, ap: 2 }, [E0]: { row: 4, col: 5, facing: "E", ...foe } })
    const n = E.attackUnit(s, H0, E0)
    return 90 - U(n, E0).hp
  }
  res.C.brave = { full: [hitFor(plainB, plain.maxHp), hitFor(brave, plain.maxHp)], low: [hitFor(plainB, 3), hitFor(brave, 3)] }
  ok(res.C.brave.full[1] === res.C.brave.full[0] + 1 && res.C.brave.low[1] === res.C.brave.low[0], "Brave: +1 damage only above half HP", res.C.brave)
  // Thrifty: skills cost 10% less resource.
  const thr = U(start(hero(["thrifty"])), H0)
  const sk = plain.classSkills.find((s) => (s.mana || 0) >= 10)
  res.C.thrifty = sk ? [M.manaCostOf(sk, plain), M.manaCostOf(sk, thr)] : null
  ok(sk && res.C.thrifty[1] < res.C.thrifty[0], "Thrifty: cheaper skills", res.C.thrifty)
  // Zealous: +2 damage only at 75%+ resource.
  const zeal = U(start(hero(["zealous"])), H0)
  const zFull = M.resourceMods({ ...zeal, mana: zeal.manaMax }).dmg
  const zLow = M.resourceMods({ ...zeal, mana: 0 }).dmg
  const pFull = M.resourceMods({ ...plain, mana: plain.manaMax }).dmg
  res.C.zealous = { zFull, zLow, pFull }
  ok(zFull === pFull + 2 && zLow === M.resourceMods({ ...plain, mana: 0 }).dmg, "Zealous: +2 damage at 75%+ resource", res.C.zealous)
  // Calm: +10% to hit shows in the hit-chance parts while unmoved.
  const calm = U(start(hero(["calm"])), H0)
  res.C.calm = { still: M.resourceMods({ ...calm, moved: false }).parts, moved: M.resourceMods({ ...calm, moved: true }).parts }
  ok(res.C.calm.still.some((p) => p.label === "Calm" && p.value === 10) && !res.C.calm.moved.some((p) => p.label === "Calm"), "Calm: +10% to hit while unmoved", res.C.calm)
  // Stubborn: a Shove can't move it.
  {
    const st = U(start(hero(["stubborn"])), H0)
    ok(st.stubborn === true, "Stubborn flag on the unit")
    const C = await import("/src/services/heartwood/tacticsChaos.js")
    const s = arena(start(hero(["stubborn"])), { [H0]: { row: 4, col: 6 } })
    const n = C.knockback(s, "x", H0, { row: 0, col: -1 }, 2)
    ok(JSON.stringify(U(n, H0).pos) === JSON.stringify({ row: 4, col: 6 }), "Stubborn: knockback does nothing", U(n, H0).pos)
  }
  // Greedy + Bookish: run-level extras after a won fight.
  {
    const win = (traits) => {
      const st = rt.startTacticsFormationBattle(mk(hero(traits)), (s) => buildRunTacticsBattle(mk(hero(traits)), s))
      const after = rt.resolveBattleOutcome({ ...st, battle: { ...st.battle, phase: "won", round: 2, units: st.battle.units.map((u) => (u.side === "enemy" ? { ...u, hp: 0 } : u)) } })
      return { essence: after.essence - st.essence, xp: after.bench[0].xp || 0 }
    }
    const p0 = win([])
    const g = win(["greedy"])
    const bk = win(["bookish"])
    res.C.run = { p0, g, bk }
    ok(g.essence === p0.essence + 2 && bk.xp === p0.xp + 2, "Greedy +2 Essence / Bookish +2 XP after a won fight", res.C.run)
  }

  // --- D: inheritance at the Nest --------------------------------------------------------
  const u = (hid, defId, extra = {}) => ({ hid, defId, xp: 16, age: 1, runs: 1, upgradeLevel: 0, upgrades: [], perks: [], skillUpgrades: {}, ...extra })
  const A = u(1, "the-fool", { heroTraits: ["brave", "calm"] })
  const B = u(2, "hexbreaker", { heroTraits: ["greedy"] })
  let passed = 0
  let freshN = 0
  const N = 60
  for (let i = 0; i < N; i++) {
    const h = H.normalizeHearth({ version: 1, runs: 3, nextHid: 10, roster: [A, B], elders: [], rooms: { nest: 1 }, furniture: [], births: i })
    const kid = H.hatchling(h, 1, 2)
    passed += kid.heroTraits.filter((id) => ["brave", "calm", "greedy"].includes(id)).length
    if (kid.traitFresh) freshN++
    if (i === 0) res.D0 = { kid: kid.heroTraits, origins: kid.traitOrigins, again: H.hatchling(h, 1, 2).heroTraits }
  }
  const rate = passed / (N * 3)
  res.D = { rate, freshN, ...res.D0 }
  ok(rate > 0.35 && rate < 0.65 && freshN > 0 && freshN < N * 0.35, "each parent trait passes ~50%, a fresh one now and then", res.D)
  ok(JSON.stringify(res.D0.kid) === JSON.stringify(res.D0.again), "inheritance is seeded (same pair + birth = same traits)")
  // The hatchling carries its traits into a run and they come home again.
  const h1 = H.normalizeHearth({ version: 1, runs: 3, nextHid: 10, roster: [A, { ...B, heroTraits: ["lazy"] }], elders: [], rooms: { nest: 1 }, furniture: [] })
  const vet = H.hearthStartFor(h1, [1]).veterans[0]
  const runV = rt.startRun("tommy", null, { forcedSeed: 5, hearthStart: { veterans: [vet], essenceBonus: 0 } })
  const back = H.harvestRun(h1, { ...runV, bench: runV.bench.map((e) => ({ ...e, heroTraits: [...e.heroTraits, "lucky"] })) }, true, "t1").hearth
  res.D.carry = { vet: vet.heroTraits, inRun: runV.bench[0]?.heroTraits, home: back.roster.find((x) => x.hid === 1).heroTraits }
  ok(JSON.stringify(vet.heroTraits) === '["brave","calm"]' && JSON.stringify(runV.bench[0]?.heroTraits) === '["brave","calm"]' && JSON.stringify(res.D.carry.home) === '["brave","calm","lucky"]', "traits ride into a run and come home (with any gained on the road)", res.D.carry)

  // --- UI saves -------------------------------------------------------------------------
  const shopIdx = rt.RUN_PATH.findIndex((n, i) => i > idx && n.type === "shop")
  const shopRs = {
    ...mk([
      { key: "b0", defId: "the-fool", upgradeLevel: 0, upgrades: [], heroTraits: ["brave", "greedy"] },
      { key: "b1", defId: "hexbreaker", upgradeLevel: 0, upgrades: [], heroTraits: ["fragile"] },
    ]),
    phase: "shop", nodeIndex: shopIdx, path: rt.RUN_PATH.slice(0, shopIdx + 1), essence: 500, lastSeenAct: rt.actIndexForNode(shopIdx, rt.RUN_PATH.length),
    // Gear row polish shot: a staff + a gem side by side (a glowing link).
    items: [{ key: 1, defId: "oak-staff", equippedTo: "b0", slotIndex: 0 }, { key: 2, defId: "mana-gem", equippedTo: "b0", slotIndex: 1 }, { key: 3, defId: "whetstone", equippedTo: "b0", slotIndex: 3 }],
    itemKeyCounter: 4,
  }
  res.shopSave = rt.serializeRun(shopRs)
  const bRs = mk([{ key: "b0", defId: "the-fool", upgradeLevel: 0, upgrades: [], heroTraits: ["brave", "greedy"] }])
  res.battleSave = rt.serializeRun(rt.startTacticsFormationBattle(bRs, (s) => buildRunTacticsBattle(bRs, s)))
  res.fails = fails
  return res
})
for (const k of ["A", "B", "C", "D"]) out[k] = r[k]
for (const f of r.fails) out.errors.push(f)

// --- UI 1: chips on the squad cards ----------------------------------------------------
{
  await page.evaluate((s) => {
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(s))
    localStorage.setItem("heartwood-autobattler-intro-seen", "1")
    localStorage.setItem("heartwood-story-intro-seen", "1")
  }, r.shopSave)
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.waitForTimeout(1200)
  const squadTab = page.locator("button:has-text('Your Squad'), [aria-label*='Your Squad']").first()
  if (await squadTab.count()) await squadTab.click().catch(() => {})
  await page.waitForTimeout(500)
  const chips = await page.locator(".hw-trait-chip").evaluateAll((els) => els.map((e) => e.dataset.trait))
  const title = await page.locator(".hw-trait-chip[data-trait='greedy']").first().getAttribute("title").catch(() => "")
  await page.locator("button:has-text('Got it')").first().click({ timeout: 1500 }).catch(() => {})
  await page.locator(".hw-trait-chip").first().scrollIntoViewIfNeeded().catch(() => {})
  await page.waitForTimeout(300)
  // The first hero card + its gear row (the bench entry's own wrapper).
  await page.locator(".hw-gear-row[data-gear-owner=\"b0\"]").first().locator("xpath=../..").screenshot({ path: `${SHOTS}/trait_chips_gear_row.png` }).catch(() => {})
  const link = await page.locator(".hw-gear-row[data-gear-owner=\"b0\"] .hw-gear-link").first().innerText().catch(() => "")
  const slotSize = await page.locator(".hw-gear-row[data-gear-owner=\"b0\"] .hw-gear-slot").first().evaluate((e) => e.getBoundingClientRect().width).catch(() => 0)
  out.ui1 = { chips, title, link, slotSize }
  if (!(["brave", "greedy", "fragile"].every((t) => chips.includes(t)) && /Essence/.test(title || ""))) out.errors.push(`UI: trait chips ${JSON.stringify(out.ui1)}`)
  // Gear row polish: bigger slots (30px) and a readable link label.
  if (!(slotSize >= 29 && link.length > 0)) out.errors.push(`UI: gear row ${JSON.stringify(out.ui1)}`)
}
// --- UI 2: token badge in battle ---------------------------------------------------------
{
  await page.evaluate((s) => localStorage.setItem("heartwood-run-save-v1", JSON.stringify(s)), r.battleSave)
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.waitForSelector(".hwt-board", { timeout: 15000 }).catch(() => {})
  const badge = await page.locator('.hwt-token[data-unit-id="player-the-fool-0"] .hwt-trait-badge').getAttribute("title").catch(() => "")
  out.ui2 = { badge }
  if (!(/Brave/.test(badge || "") && /Greedy/.test(badge || ""))) out.errors.push(`UI: token trait badge ${JSON.stringify(out.ui2)}`)
}
// --- UI 3: the Nest via real clicks - the hatchling's "Traits from its blood" ----------------
{
  await page.evaluate(() => {
    localStorage.clear()
    localStorage.setItem("heartwood-autobattler-intro-seen", "1")
    localStorage.setItem("heartwood-story-intro-seen", "1")
    localStorage.setItem("heartwood-tactics-tutorial-v1", "skipped")
    localStorage.setItem("heartwood-meta-v1", JSON.stringify({ version: 1, acorns: 100, chosenPerks: [], unlockedCommanders: [] }))
    const u = (hid, defId, xp, extra = {}) => ({ hid, defId, xp, age: 2, runs: 2, upgradeLevel: 0, upgrades: [], perks: [], skillUpgrades: {}, ...extra })
    localStorage.setItem("hearthwood-hearth-v1", JSON.stringify({
      version: 1, runs: 4, nextHid: 20, births: 0,
      roster: [u(11, "the-fool", 16, { name: "Moss", heroTraits: ["brave", "calm"] }), u(12, "hexbreaker", 30, { name: "Fen", heroTraits: ["greedy", "lucky"] })],
      elders: [], lineage: {}, memorial: [], rooms: { nest: 1, barracks: 1 }, furniture: [], permadeath: true,
    }))
  })
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.locator("[data-hearth-open]").click()
  await page.locator("[data-screen=hearth]").waitFor({ timeout: 8000 })
  const parentChips = await page.locator("[data-hearth-unit='11'] .hw-trait-chip").count()
  await page.locator("[data-nest-parent='11']").click()
  await page.locator("[data-nest-parent='12']").click()
  await page.locator("[data-nest-breed]").click()
  await page.waitForTimeout(300)
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("hearthwood-hearth-v1")).roster.find((x) => x.hid === 20))
  await page.locator("[data-hearth-family='20']").click().catch(() => {})
  const genes = await page.locator("[data-family='20'] [data-family-genes]").innerText().catch(() => "")
  await page.locator("[data-hearth-unit='20']").scrollIntoViewIfNeeded().catch(() => {})
  await page.screenshot({ path: `${SHOTS}/trait_nest.png` }).catch(() => {})
  out.ui3 = { parentChips, kid: stored?.heroTraits, origins: stored?.traitOrigins, genes }
  const hasGenes = (stored?.heroTraits || []).length === 0 || /Traits from its blood/.test(genes)
  if (!(parentChips === 2 && Array.isArray(stored?.heroTraits) && hasGenes)) out.errors.push(`UI: Nest traits ${JSON.stringify(out.ui3)}`)
}

await page.close()
console.log(JSON.stringify(out, null, 2))
console.log("\npageErrors:", errs.length, errs.slice(0, 8))
await browser.close()
const pass = out.errors.length === 0 && errs.length === 0
console.log(pass ? "\n✅ verify_traits PASS" : "\n❌ verify_traits FAIL")
process.exit(pass ? 0 : 1)
