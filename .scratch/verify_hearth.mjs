import { chromium } from "playwright"

// The Hearth (home base between runs) - services/heartwood/hearth.js +
// runEngine startRun veterans + HearthScreen UI. Logic checks drive the
// real modules via page.evaluate import; UI checks use real clicks.
const PORT = process.env.PORT || 5445
const SHOT = process.env.SHOT || "/tmp/hearth_screen.png"
const browser = await chromium.launch()
const errs = []
const out = { errors: [] }
const fail = (m) => out.errors.push(m)

const page = await browser.newContext({ viewport: { width: 1500, height: 1000 } }).then((c) => c.newPage())
page.on("pageerror", (e) => errs.push(String(e)))
await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })

const r = await page.evaluate(async () => {
  const rt = await import("/src/services/heartwood/runEngine.js")
  const H = await import("/src/services/heartwood/hearth.js")
  const D = await import("/src/data/heartwood/hearth.js")
  const { buildRunTacticsBattle } = await import("/src/services/heartwood/tacticsRealMatchup.js")
  const res = {}
  const idx = rt.RUN_PATH.findIndex((n) => n.type === "battle" && n.formationId)
  const baseRun = (bench, deployed, extra = {}) => ({
    ...rt.startRun("tommy", null, { forcedSeed: 4242 }),
    nodeIndex: idx,
    path: rt.RUN_PATH.slice(0, idx + 1),
    phase: "formation",
    bench,
    deployed,
    items: [],
    lastSeenAct: rt.actIndexForNode(idx, rt.RUN_PATH.length),
    ...extra,
  })

  // --- A: survivors of a WON run come home with their progress.
  const benchA = [
    { key: "b0", defId: "the-fool", upgradeLevel: 1, upgrades: ["x"], xp: 17, perks: ["bark", "edge"], skillUpgrades: { signature: "A" } },
    { key: "b1", defId: "hexbreaker", upgradeLevel: 0, upgrades: [], xp: 4, perks: [] },
  ]
  const wonRun = { ...baseRun(benchA, ["b0", "b1", null, null]), phase: "victory" }
  const a = H.harvestRun(H.freshHearth(), wonRun, true, "runA")
  const fool = a.hearth.roster.find((u) => u.defId === "the-fool")
  res.A = {
    n: a.hearth.roster.length, fool, home: a.report.home, runs: a.hearth.runs,
    hooks: fool && fool.parents === null && Array.isArray(fool.mutations) && fool.generation === 0,
  }
  // idempotent per run id
  res.A.again = H.harvestRun(a.hearth, wonRun, true, "runA").hearth === a.hearth

  // --- B: a LOST run - units that fell in the final fight die (memorial);
  // a benched unit survives. Permadeath off -> fallen come home Wounded.
  const benchB = [
    { key: "c0", defId: "the-fool", upgradeLevel: 0, upgrades: [], xp: 9 },
    { key: "c1", defId: "hexbreaker", upgradeLevel: 0, upgrades: [] },
    { key: "c2", defId: "the-fool", upgradeLevel: 0, upgrades: [] },
  ]
  const rsB = baseRun(benchB, ["c0", "c1", null, null])
  const started = rt.startTacticsFormationBattle(rsB, (s) => buildRunTacticsBattle(rsB, s))
  const units = started.battle.units.map((u) => (u.id === "player-the-fool-0" ? { ...u, hp: 0 } : u.id === "player-commander" ? { ...u, hp: 0 } : u))
  const lost = rt.resolveBattleOutcome({ ...started, battle: { ...started.battle, phase: "lost", units } })
  const b = H.harvestRun(H.freshHearth(), lost, false, "runB")
  res.B = {
    phase: lost.phase,
    fallen: b.report.fallen, memorial: b.hearth.memorial, rosterDefs: b.hearth.roster.map((u) => u.defId),
  }
  const bOff = H.harvestRun(H.setPermadeath(H.freshHearth(), false), lost, false, "runB2")
  res.B.off = { n: bOff.hearth.roster.length, memorial: bOff.hearth.memorial.length, wounded: bOff.hearth.roster.filter((u) => u.wounded).length }

  // --- C: veterans picked into a new run start on its bench (max 2),
  // travel-worn, deployed; coming home again updates the SAME units.
  let h = a.hearth
  h = { ...h, roster: [...h.roster, { ...h.roster[1], hid: 99, defId: "the-fool" }] } // 3rd unit
  const ids = h.roster.map((u) => u.hid)
  const hs = H.hearthStartFor(h, ids)
  const run = rt.startRun("tommy", null, { forcedSeed: 11, hearthStart: hs })
  const plain = rt.startRun("tommy", null, { forcedSeed: 11 })
  const vets = run.bench.filter((e) => e.veteran)
  res.C = {
    vets: vets.map((e) => ({ defId: e.defId, xp: e.xp, perks: e.perks, skillUpgrades: e.skillUpgrades, hpPct: e.hpPct, hearthId: e.hearthId, key: e.key })),
    deployed: run.deployed, ids: run.hearthVeteranIds, ess: run.essence, plainEss: plain.essence,
  }
  // Second trip: veterans come home (same hids, age 2) - one sold -> parted.
  const soldOne = { ...run, phase: "victory", bench: run.bench.filter((e) => e.hearthId !== ids[1]), deployed: [vets[0].key, null, null, null] }
  const c2 = H.harvestRun(h, soldOne, true, "runC")
  res.C.back = c2.hearth.roster.map((u) => ({ hid: u.hid, age: u.age })), res.C.parted = c2.report.parted

  // --- D: aging + decline + retirement.
  const old = { ...fool, hid: 50, age: D.OLD_AGE - 1 }
  const hd0 = { ...H.freshHearth(), roster: [old], nextHid: 51 }
  const dRun = { ...rt.startRun("tommy", null, { forcedSeed: 5, hearthStart: H.hearthStartFor(hd0, [50]) }), phase: "victory" }
  const hd = H.harvestRun(hd0, dRun, true, "runD").hearth
  const aged = hd.roster.find((u) => u.hid === 50)
  const vetEntry = H.hearthStartFor(hd, [50]).veterans[0]
  // fight stats: aged veteran vs the same unit without the penalty
  const mkFight = (entry) => {
    const rs = baseRun([{ ...entry, key: "v0" }], ["v0", null, null, null])
    return rt.startTacticsFormationBattle(rs, (s) => buildRunTacticsBattle(rs, s)).battle.units.find((u) => u.id === "player-the-fool-0")
  }
  const agedU = mkFight(vetEntry)
  const youngU = mkFight({ ...vetEntry, agePenalty: undefined })
  const retired = H.retireUnit(hd, 50)
  const young = { ...hd, roster: [{ ...aged, hid: 60, age: 2 }] }
  res.D = {
    age: aged?.age, steps: H.declineSteps(aged?.age), aged: c2 && hd.lastReport.aged, penalty: vetEntry.agePenalty,
    agedHp: agedU?.maxHp, youngHp: youngU?.maxHp, agedAtk: agedU?.attack, youngAtk: youngU?.attack,
    elders: retired.elders.length, rosterAfter: retired.roster.length, bonus: H.startEssenceBonus(retired),
    youngRetire: H.retireUnit(young, 60) === young,
  }

  // --- E: rooms + furniture + recruit cost Acorns and apply.
  const e0 = H.freshHearth()
  const cost = H.roomUpgradeCost(e0, "barracks")
  const poor = H.upgradeRoom(e0, "barracks", cost - 1)
  const up = H.upgradeRoom(e0, "barracks", 100)
  const inf1 = H.upgradeRoom(e0, "infirmary", 100).hearth
  const woundedHome = H.harvestRun(e0, { ...wonRun, bench: [{ ...benchA[0], wounded: true }] }, true, "e1").hearth.roster[0].wounded
  const healedHome = H.harvestRun(inf1, { ...wonRun, bench: [{ ...benchA[0], wounded: true }] }, true, "e2").hearth.roster[0].wounded
  const tr = H.upgradeRoom(a.hearth, "training", 100).hearth
  const trVet = H.hearthStartFor(tr, [fool.hid]).veterans[0]
  const inf2 = H.upgradeRoom(H.upgradeRoom(a.hearth, "infirmary", 100).hearth, "infirmary", 100).hearth
  const inf2Vet = H.hearthStartFor(inf2, [fool.hid]).veterans[0]
  // overflow: 5 survivors into a 4-bed Barracks
  const many = ["the-fool", "hexbreaker", "the-fool", "hexbreaker", "the-fool"].map((d, i) => ({ key: `m${i}`, defId: d, xp: i }))
  const over = H.harvestRun(e0, { ...wonRun, bench: many, deployed: [null, null, null, null] }, true, "e3")
  const furn = H.buyFurniture(e0, "bunk", 100)
  const offers = H.recruitOffers(e0)
  const rec = H.recruitAtHome(e0, offers[0], 100)
  res.E = {
    cost, poor, upLv: up.hearth.rooms.barracks, upCost: up.cost, cap0: H.rosterCapacity(e0), cap1: H.rosterCapacity(up.hearth),
    woundedHome, healedHome, trXp: trVet.xp, baseXp: fool.xp, trHp: trVet.hpPct, inf2Hp: inf2Vet.hpPct,
    overN: over.hearth.roster.length, noRoom: over.report.noRoom.length,
    furnCap: H.rosterCapacity(furn.hearth), furnCost: furn.cost, furnAgain: H.buyFurniture(furn.hearth, "bunk", 100),
    offers: offers.length, recN: rec?.hearth.roster.length, recCost: rec?.cost, recAgain: H.recruitAtHome(rec.hearth, offers[1], 100),
  }

  // --- F: persistence round-trip, empty default, corrupt storage.
  localStorage.setItem("heartwood-run-save-v1", "RUN-SENTINEL")
  localStorage.removeItem(H.HEARTH_KEY)
  const empty = H.loadHearth()
  H.saveHearth(c2.hearth)
  const loaded = H.loadHearth()
  localStorage.setItem(H.HEARTH_KEY, "{not json")
  const corrupt = H.loadHearth()
  localStorage.setItem(H.HEARTH_KEY, JSON.stringify({ version: 999, roster: [1] }))
  const stale = H.loadHearth()
  localStorage.setItem(H.HEARTH_KEY, JSON.stringify({ version: 1, roster: [{ defId: "nope" }, null, { hid: 3, defId: "the-fool" }], rooms: { barracks: 99 } }))
  const junk = H.loadHearth()
  res.F = {
    emptyRoster: empty.roster.length, emptyPerma: empty.permadeath,
    same: JSON.stringify(loaded.roster) === JSON.stringify(c2.hearth.roster) && loaded.runs === c2.hearth.runs,
    corrupt: corrupt.roster.length, stale: stale.roster.length, junkN: junk.roster.length, junkBarracks: junk.rooms.barracks,
    runSaveUntouched: localStorage.getItem("heartwood-run-save-v1") === "RUN-SENTINEL",
  }
  localStorage.clear()
  return res
})
out.logic = r

const A = r.A
if (!(A.n === 2 && A.fool?.xp === 17 && A.fool.perks.join() === "bark,edge" && A.fool.skillUpgrades?.signature === "A" && A.fool.upgradeLevel === 1 && A.fool.age === 1 && A.hooks && A.again))
  fail("checkA survivors of a won run did not come home with level/XP/perks/skill upgrades (+ hooks, idempotent)")
const B = r.B
if (!(B.phase === "defeat" && B.fallen.length === 1 && B.memorial[0]?.name && B.rosterDefs.join() === "hexbreaker,the-fool" && B.off.n === 3 && B.off.memorial === 0 && B.off.wounded >= 1))
  fail("checkB lost-run permadeath / memorial / permadeath-off wounded rule wrong")
const C = r.C
if (!(C.vets.length === 2 && C.vets[0].xp === 17 && C.vets[0].perks.join() === "bark,edge" && C.vets[0].hpPct === 0.8 && C.deployed.filter((k) => k !== null).length === 2 && C.ids.length === 2 && C.back.length === 2 && C.back.every((u) => u.age === 2 || u.hid === 99) && C.parted.length === 1))
  fail("checkC veterans did not start on the new run's bench / did not return as the same units / sold one not parted")
const Dd = r.D
if (!(Dd.age === 5 && Dd.steps === 1 && Dd.penalty === 1 && Dd.agedHp === Dd.youngHp - 2 && Dd.agedAtk === Dd.youngAtk - 1 && Dd.elders === 1 && Dd.rosterAfter === 0 && Dd.bonus === 10 && Dd.youngRetire))
  fail("checkD aging / decline in fights / retirement to Elders wrong")
const E = r.E
if (!(E.poor === null && E.upLv === 1 && E.upCost === E.cost && E.cap0 === 4 && E.cap1 === 6 && E.woundedHome === true && E.healedHome === false && E.trXp === E.baseXp + 3 && E.trHp === 0.8 && E.inf2Hp === undefined && E.overN === 4 && E.noRoom === 1 && E.furnCap === 5 && E.furnAgain === null && E.offers === 3 && E.recN === 1 && E.recCost === 8 && E.recAgain === null))
  fail("checkE room upgrades / furniture / recruit costs or effects wrong")
const F = r.F
if (!(F.emptyRoster === 0 && F.emptyPerma === true && F.same && F.corrupt === 0 && F.stale === 0 && F.junkN === 1 && F.junkBarracks === 3 && F.runSaveUntouched))
  fail("checkF persistence round-trip / empty default / corrupt-storage safety wrong")

// --- G: UI - Hearth screen from the menu, upgrade a room, pick 2 veterans,
// start a run with them via real clicks.
{
  await page.evaluate(() => {
    localStorage.clear()
    localStorage.setItem("heartwood-autobattler-intro-seen", "1")
    localStorage.setItem("heartwood-story-intro-seen", "1")
    localStorage.setItem("heartwood-tactics-tutorial-v1", "skipped")
    localStorage.setItem("heartwood-meta-v1", JSON.stringify({ version: 1, acorns: 100, chosenPerks: [], unlockedCommanders: [] }))
    const u = (hid, defId, xp, age, extra = {}) => ({ hid, defId, xp, age, runs: age, upgradeLevel: 0, upgrades: [], perks: [], skillUpgrades: {}, ...extra })
    localStorage.setItem("hearthwood-hearth-v1", JSON.stringify({
      version: 1, runs: 6, nextHid: 4,
      roster: [u(1, "the-fool", 16, 2, { perks: ["bark"] }), u(2, "hexbreaker", 7, 6), u(3, "the-fool", 30, 3, { wounded: true })],
      memorial: [{ name: "Old Bram", defId: "hexbreaker", level: 3, age: 4, run: 5, commander: "Tommy" }],
      elders: [], rooms: {}, furniture: [], permadeath: true,
    }))
  })
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.locator("[data-hearth-open]").click()
  await page.locator("[data-screen=hearth]").waitFor({ timeout: 8000 })
  const ui = {}
  ui.rooms = await page.locator("[data-hearth-room]").count()
  ui.roster = await page.locator("[data-hearth-unit]").count()
  ui.memorial = await page.locator("[data-hearth-memorial]").getAttribute("data-hearth-memorial")
  ui.oldBadge = await page.locator("[data-hearth-unit='2'] .hw-hearth-badge.is-old").count()
  await page.locator("[data-hearth-upgrade=barracks]").click()
  ui.barracksLv = await page.locator("[data-hearth-room=barracks]").getAttribute("data-level")
  const stored = await page.evaluate(() => ({ h: JSON.parse(localStorage.getItem("hearthwood-hearth-v1")), m: JSON.parse(localStorage.getItem("heartwood-meta-v1")) }))
  ui.storedBarracks = stored.h.rooms.barracks
  ui.acorns = stored.m.acorns
  await page.locator("[data-hearth-pick='1']").click()
  await page.locator("[data-hearth-pick='3']").click()
  ui.thirdDisabled = await page.locator("[data-hearth-pick='2']").isDisabled()
  ui.picked = await page.locator("[data-hearth-picked]").getAttribute("data-hearth-picked")
  await page.screenshot({ path: SHOT, fullPage: true })
  await page.locator("[data-hearth-start]").click()
  ui.banner = await page.locator("[data-hearth-banner]").innerText().catch(() => "")
  await page.locator(".hw-commander-card:not([data-locked=true])").first().click()
  await page.waitForFunction(() => !!localStorage.getItem("heartwood-run-save-v1"), null, { timeout: 8000 })
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem("heartwood-run-save-v1")).run)
  const vets = run.bench.filter((e) => e.veteran)
  ui.runVets = vets.map((e) => ({ hid: e.hearthId, xp: e.xp, wounded: !!e.wounded, hpPct: e.hpPct }))
  ui.deployed = run.deployed.filter((k) => k !== null).length
  out.ui = ui
  const okG = ui.rooms === 4 && ui.roster === 3 && ui.memorial === "1" && ui.oldBadge === 1 && ui.barracksLv === "1" && ui.storedBarracks === 1 &&
    ui.acorns === 85 && ui.thirdDisabled && ui.picked === "2" && /Mosskit/.test(ui.banner) &&
    ui.runVets.length === 2 && ui.runVets.map((v) => v.hid).sort().join() === "1,3" && ui.runVets.find((v) => v.hid === 3)?.wounded && ui.deployed >= 2
  if (!okG) fail("checkG Hearth UI: rooms/roster/memorial/upgrade/picker/start-run-with-veterans via clicks wrong")
}

// --- H: UI - a lost run restored at its end screen brings survivors home
// and buries the fallen; "Go home to the Hearth" shows the report.
{
  await page.evaluate(async () => {
    localStorage.clear()
    localStorage.setItem("heartwood-autobattler-intro-seen", "1")
    localStorage.setItem("heartwood-story-intro-seen", "1")
    localStorage.setItem("heartwood-tactics-tutorial-v1", "skipped")
    const rt = await import("/src/services/heartwood/runEngine.js")
    const { buildRunTacticsBattle } = await import("/src/services/heartwood/tacticsRealMatchup.js")
    const idx = rt.RUN_PATH.findIndex((n) => n.type === "battle" && n.formationId)
    const rs = {
      ...rt.startRun("tommy", null, { forcedSeed: 99 }),
      nodeIndex: idx, path: rt.RUN_PATH.slice(0, idx + 1), phase: "formation", items: [],
      bench: [{ key: "k0", defId: "the-fool", upgradeLevel: 0, upgrades: [], xp: 8 }, { key: "k1", defId: "hexbreaker", upgradeLevel: 0, upgrades: [], xp: 3 }],
      deployed: ["k0", "k1", null, null], lastSeenAct: rt.actIndexForNode(idx, rt.RUN_PATH.length), hearthRunId: "ui-h",
    }
    const st = rt.startTacticsFormationBattle(rs, (s) => buildRunTacticsBattle(rs, s))
    const units = st.battle.units.map((u) => (u.id === "player-hexbreaker-1" || u.id === "player-commander" ? { ...u, hp: 0 } : u))
    const lost = rt.resolveBattleOutcome({ ...st, battle: { ...st.battle, phase: "lost", units } })
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(rt.serializeRun(lost)))
  })
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.locator("[data-hearth-home]").waitFor({ timeout: 10000 })
  await page.waitForTimeout(300)
  await page.reload({ waitUntil: "domcontentloaded" }) // reload on the end screen must not harvest twice
  await page.locator("[data-hearth-home]").click()
  await page.locator("[data-screen=hearth]").waitFor({ timeout: 8000 })
  const h = await page.evaluate(() => JSON.parse(localStorage.getItem("hearthwood-hearth-v1")))
  const ui = {
    roster: h.roster.map((u) => u.defId), memorial: h.memorial.map((m) => m.defId), runs: h.runs,
    report: await page.locator("[data-hearth-report]").innerText().catch(() => ""),
    cards: await page.locator("[data-hearth-unit]").count(),
  }
  out.uiH = ui
  if (!(ui.roster.join() === "the-fool" && ui.memorial.join() === "hexbreaker" && ui.runs === 1 && /Fell for good/.test(ui.report) && ui.cards === 1))
    fail("checkH run end -> Hearth harvest (survivor home, fallen in memorial, once) via the real end screen wrong")
}

await browser.close()
console.log(JSON.stringify(out, null, 2))
console.log("\npageErrors:", errs.length, errs.slice(0, 8))
const pass = out.errors.length === 0 && errs.length === 0
console.log(pass ? "\n✅ verify_hearth PASS" : "\n❌ verify_hearth FAIL")
process.exit(pass ? 0 : 1)
