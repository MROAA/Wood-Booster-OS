import { chromium } from "playwright"

// Sprint 3 - Units level up in battle (unitLevels.js). Engine checks drive
// the REAL runEngine.js / tacticsRealMatchup.js / tacticsEngine.js via a
// page.evaluate import; check F drives the live game UI.
const PORT = process.env.PORT || 5446
const SHOTS = process.env.SHOTS || "/tmp"
const browser = await chromium.launch()
const errs = []
const out = { errors: [] }

const page = await browser.newContext({ viewport: { width: 1600, height: 1000 } }).then((c) => c.newPage())
page.on("pageerror", (e) => errs.push(String(e)))
await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })

const r = await page.evaluate(async () => {
  const rt = await import("/src/services/heartwood/runEngine.js")
  const te = await import("/src/services/heartwood/tacticsEngine.js")
  const lv = await import("/src/services/heartwood/unitLevels.js")
  const { buildRunTacticsBattle } = await import("/src/services/heartwood/tacticsRealMatchup.js")
  const idx = rt.RUN_PATH.findIndex((n) => n.type === "battle" && n.formationId)
  const mk = (bench, extra = {}) => ({
    ...rt.startRun("tommy", null, { forcedSeed: 777 }),
    nodeIndex: idx,
    path: rt.RUN_PATH.slice(0, idx + 1),
    phase: "formation",
    bench: bench || [
      { key: "b0", defId: "the-fool", upgradeLevel: 0, upgrades: [] },
      { key: "b1", defId: "hexbreaker", upgradeLevel: 0, upgrades: [] },
    ],
    deployed: ["b0", "b1", null, null],
    items: [],
    lastSeenAct: rt.actIndexForNode(idx, rt.RUN_PATH.length),
    ...extra,
  })
  const start = (rs) => rt.startTacticsFormationBattle(rs, (s) => buildRunTacticsBattle(rs, s))
  // A clean arena: no terrain, no objective, every unit placed by hand.
  // `place` = { unitId: {row,col,...patch} }; unlisted enemies parked far away.
  const arena = (battle, place) => {
    let far = 0
    return {
      ...battle,
      terrain: {},
      objective: null,
      phase: "player",
      units: battle.units.map((u) => {
        const p = place[u.id]
        if (p) return { ...u, ...p, pos: { row: p.row, col: p.col } }
        if (u.side === "enemy") return { ...u, pos: { row: far, col: 0 }, farParked: far++ }
        return { ...u, pos: { row: 8, col: 11 - far++ } }
      }),
    }
  }
  const enemyIds = (b) => b.units.filter((u) => u.side === "enemy").map((u) => u.id)
  const U = (b, id) => b.units.find((u) => u.id === id)
  const foe = { block: 0, ward: 0, revive: 0, nimble: false, taunt: 0, bulwark: 0 }
  const res = {}

  // --- A: a kill = hit (+1) + kill (+3) XP; winning adds +2 for survivors.
  const rsA = mk()
  const stA = start(rsA)
  const [e0, e1] = enemyIds(stA.battle)
  let bA = arena(stA.battle, {
    "player-the-fool-0": { row: 4, col: 6, facing: "W" },
    [e0]: { row: 4, col: 5, hp: 1, ...foe },
  })
  bA = te.attackUnit(bA, "player-the-fool-0", e0)
  res.A = {
    startFields: [U(stA.battle, "player-the-fool-0").level, U(stA.battle, "player-the-fool-0").xpGained, U(stA.battle, "player-commander").level],
    foolGained: U(bA, "player-the-fool-0").xpGained,
    e0Hp: U(bA, e0).hp,
  }
  const endUnits = bA.units.map((u) => (u.id === "player-hexbreaker-1" ? { ...u, hp: 0 } : u.side === "enemy" ? { ...u, hp: 0 } : u))
  const afterA = rt.resolveBattleOutcome({ ...stA, battle: { phase: "won", round: 3, units: endUnits } })
  res.A.bench = afterA.bench.map((e) => [e.key, e.xp, e.perks])
  res.A.cmdXp = afterA.commanderXp
  res.A.levelUps = afterA.lastLevelUps

  // --- B: crossing a threshold mid-fight shows a "Level up!" callout.
  const rsB = mk([
    { key: "b0", defId: "the-fool", upgradeLevel: 0, upgrades: [], xp: 5 },
    { key: "b1", defId: "hexbreaker", upgradeLevel: 0, upgrades: [] },
  ])
  const stB = start(rsB)
  const eB = enemyIds(stB.battle)[0]
  let bB = arena(stB.battle, { "player-the-fool-0": { row: 4, col: 6, facing: "W" }, [eB]: { row: 4, col: 5, hp: 60, maxHp: 60, ...foe } })
  const seq0 = bB.eventSeq || 0
  bB = te.attackUnit(bB, "player-the-fool-0", eB)
  const newEvents = (bB.events || []).filter((ev) => ev.seq > seq0)
  res.B = {
    xpStart: U(bB, "player-the-fool-0").xpStart,
    gained: U(bB, "player-the-fool-0").xpGained,
    callout: newEvents.some((ev) => ev.kind === "reaction" && ev.unitId === "player-the-fool-0" && ev.label === "Level up!"),
    levelStill: U(bB, "player-the-fool-0").level,
  }
  // Support cast (heal self) = +1 XP.
  const hurt = { ...bB, units: bB.units.map((u) => (u.id === "player-the-fool-0" ? { ...u, hp: u.maxHp - 5, ap: 2, cooldownRemaining: 0 } : u)) }
  const healed = te.castAbility(hurt, "player-the-fool-0", "player-the-fool-0")
  res.B.supportXp = U(healed, "player-the-fool-0").xpGained - U(hurt, "player-the-fool-0").xpGained

  // --- C: perk offers deterministic; a pick is validated; perks apply.
  const subj = lv.levelSubject(afterA, "b0")
  const o1 = lv.perkOffers(afterA, subj)
  const o2 = lv.perkOffers(JSON.parse(JSON.stringify(afterA)), lv.levelSubject(afterA, "b0"))
  const bogus = rt.chooseLevelPerk(afterA, "b0", "not-a-perk")
  const picked = rt.chooseLevelPerk(afterA, "b0", o1[0])
  const offersOther = lv.perkOffers({ ...afterA, seed: 12345 }, subj)
  const offersNextLevel = lv.perkOffers(afterA, { ...subj, perks: [o1[0]] })
  res.C = {
    o1, o2, offersOther, offersNextLevel,
    bogusSame: bogus === afterA,
    pickedPerks: picked.bench.find((e) => e.key === "b0").perks,
    pendingAfter: lv.pendingPerkCount(lv.levelSubject(picked, "b0")),
    doubleSame: rt.chooseLevelPerk(picked, "b0", o1[1]) === picked,
  }
  // Applied in the next tactics fight: stat perks vs a no-perk twin.
  const plain = mk()
  const perked = mk([
    { key: "b0", defId: "the-fool", upgradeLevel: 0, upgrades: [], xp: 45, perks: ["swift", "bark", "edge", "ward", "head", "thirst"] },
    { key: "b1", defId: "hexbreaker", upgradeLevel: 0, upgrades: [], xp: 6, perks: ["quick"] },
  ])
  const place = { "player-the-fool-0": { row: 4, col: 8 }, "player-hexbreaker-1": { row: 0, col: 11 } }
  const bPlain = arena(start(plain).battle, place)
  const bPerk = arena(start(perked).battle, place)
  const fP = U(bPlain, "player-the-fool-0"), fK = U(bPerk, "player-the-fool-0")
  res.C.stats = {
    move: [fP.move, fK.move], maxHp: [fP.maxHp, fK.maxHp], attack: [fP.attack, fK.attack], ward: [fP.ward || 0, fK.ward], ap: [fP.ap, fK.ap], level: fK.level,
    reach: [te.reachableTilesFor(bPlain, "player-the-fool-0").length, te.reachableTilesFor(bPerk, "player-the-fool-0").length],
  }
  const hP = U(bPlain, "player-hexbreaker-1"), hK = U(bPerk, "player-hexbreaker-1")
  const eQ = enemyIds(bPerk)[0]
  const bQ = arena(bPerk, { "player-hexbreaker-1": { row: 4, col: 8 }, "player-the-fool-0": { row: 8, col: 11 }, [eQ]: { row: 4, col: 6, hp: 80, maxHp: 80, ...foe } })
  const castQ = te.castAbility(bQ, "player-hexbreaker-1", eQ)
  res.C.quick = { costPlain: hP.ability.cost, costPerk: hK.ability.cost, apAfter: U(castQ, "player-hexbreaker-1").ap, costAfter: U(castQ, "player-hexbreaker-1").ability.cost, hit: U(castQ, eQ).hp < 80 }
  // Bloodthirst: a kill heals 3.
  const eT = enemyIds(bPerk)[0]
  let bT = arena(bPerk, { "player-the-fool-0": { row: 4, col: 6, facing: "W", hp: 10 }, [eT]: { row: 4, col: 5, hp: 1, ...foe } })
  bT = te.attackUnit(bT, "player-the-fool-0", eT)
  res.C.thirst = [10, U(bT, "player-the-fool-0").hp]
  // Cleave: the enemy next to the target takes half damage.
  const cleaveRs = mk([
    { key: "b0", defId: "the-fool", upgradeLevel: 0, upgrades: [], xp: 6, perks: ["cleave"] },
    { key: "b1", defId: "hexbreaker", upgradeLevel: 0, upgrades: [] },
  ])
  const run2 = (rs) => {
    const b = start(rs).battle
    const [x, y] = enemyIds(b)
    const s = arena(b, { "player-the-fool-0": { row: 4, col: 6, facing: "W" }, [x]: { row: 4, col: 5, hp: 90, maxHp: 90, ...foe }, [y]: { row: 3, col: 5, hp: 90, maxHp: 90, ...foe } })
    const a = te.attackUnit(s, "player-the-fool-0", x)
    return [U(a, x).hp, U(a, y).hp]
  }
  res.C.cleave = { plain: run2(plain), perk: run2(cleaveRs), twoEnemies: enemyIds(start(plain).battle).length }

  // --- D: the Commander levels too.
  const stD = start(mk())
  const eD = enemyIds(stD.battle)[0]
  let bD = arena(stD.battle, { "player-commander": { row: 4, col: 6, facing: "W" }, [eD]: { row: 4, col: 5, hp: 1, ...foe } })
  bD = te.attackUnit(bD, "player-commander", eD)
  const afterD = rt.resolveBattleOutcome({ ...stD, battle: { phase: "won", round: 2, units: bD.units.map((u) => (u.side === "enemy" ? { ...u, hp: 0 } : u)) } })
  const cSubj = lv.levelSubject(afterD, "commander")
  const benchDone = afterD.bench.reduce((rs, e) => {
    const s = lv.levelSubject(rs, e.key)
    return lv.pendingPerkCount(s) ? rt.chooseLevelPerk(rs, e.key, lv.perkOffers(rs, s)[0]) : rs
  }, afterD)
  const cOffer = lv.perkOffers(benchDone, cSubj)
  const cPicked = rt.chooseLevelPerk(benchDone, "commander", cOffer[0])
  const nextD = { ...cPicked, nodeIndex: idx, path: rt.RUN_PATH.slice(0, idx + 1), phase: "formation" }
  const cmdNext = U(start(nextD).battle, "player-commander")
  res.D = {
    gained: U(bD, "player-commander").xpGained,
    cmdXp: afterD.commanderXp,
    pendingIsCmd: lv.nextPendingLevelUp(benchDone)?.key,
    cOffer,
    cmdPerks: cPicked.commanderPerks,
    noQuick: !cOffer.includes("quick"),
    nextLevel: cmdNext.level,
    nextPerks: cmdNext.perks,
    none: lv.nextPendingLevelUp(cPicked),
  }

  // --- E: save/load + an old save defaults to Lv1 / 0 XP.
  const loaded = rt.deserializeRun(JSON.parse(JSON.stringify(rt.serializeRun(cPicked))))
  const old = mk()
  const oldLoaded = rt.deserializeRun(JSON.parse(JSON.stringify(rt.serializeRun(old))))
  const oldT = start(oldLoaded).battle
  res.E = {
    same: JSON.stringify(loaded.bench) === JSON.stringify(cPicked.bench) && JSON.stringify(loaded.commanderPerks) === JSON.stringify(cPicked.commanderPerks) && loaded.commanderXp === cPicked.commanderXp,
    oldSubj: [lv.levelSubject(oldLoaded, "b0").xp, lv.levelForXp(lv.levelSubject(oldLoaded, "b0").xp), lv.levelForXp(oldLoaded.commanderXp)],
    oldUnits: oldT.units.filter((u) => u.side === "player").map((u) => [u.level, u.xpGained, (u.perks || []).length]),
    oldPending: lv.nextPendingLevelUp(oldLoaded),
    progress: lv.levelProgress(10),
  }

  // Stage a shop save with a pending level-up for the UI check (F).
  const shopIdx = rt.RUN_PATH.findIndex((n, i) => i > idx && n.type === "shop")
  const shopRs = {
    ...afterA, phase: "shop", nodeIndex: shopIdx, path: rt.RUN_PATH.slice(0, shopIdx + 1), essence: 500,
    lastSeenAct: rt.actIndexForNode(shopIdx, rt.RUN_PATH.length), commanderXp: 7, commanderPerks: ["bark"],
  }
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(rt.serializeRun(shopRs)))
  localStorage.setItem("heartwood-autobattler-intro-seen", "1"); localStorage.setItem("heartwood-story-intro-seen", "1")
  res.uiOffers = lv.perkOffers(shopRs, lv.levelSubject(shopRs, "b0"))
  const lvlRs = { ...shopRs, bench: shopRs.bench.map((e) => (e.key === "b0" ? { ...e, perks: ["swift"] } : e)) }
  res.formationSave = rt.serializeRun({ ...lvlRs, nodeIndex: idx, path: rt.RUN_PATH.slice(0, idx + 1), phase: "formation", lastSeenAct: rt.actIndexForNode(idx, rt.RUN_PATH.length) })
  const battleRs = { ...lvlRs, nodeIndex: idx, path: rt.RUN_PATH.slice(0, idx + 1), phase: "formation", lastSeenAct: rt.actIndexForNode(idx, rt.RUN_PATH.length) }
  res.battleSave = rt.serializeRun(rt.startTacticsFormationBattle(battleRs, (s) => te.enterDeploy(buildRunTacticsBattle(battleRs, s))))
  return res
})

// A. XP from a kill + surviving a won fight
{
  out.A = r.A
  const b0 = r.A.bench.find((b) => b[0] === "b0"), b1 = r.A.bench.find((b) => b[0] === "b1")
  const ok =
    r.A.startFields[0] === 1 && r.A.startFields[1] === 0 && r.A.startFields[2] === 1 &&
    r.A.foolGained === 4 && r.A.e0Hp === 0 &&
    b0[1] === 6 && b1[1] === 0 && r.A.cmdXp === 2 &&
    r.A.levelUps.length === 1 && r.A.levelUps[0].name === "Mosskit" && r.A.levelUps[0].level === 2
  if (!ok) out.errors.push("checkA a kill did not give hit+kill XP, or the won fight did not add survival XP / record the level-up")
}
// B. threshold -> Level up! callout (level applies after), support XP
{
  out.B = r.B
  const ok = r.B.xpStart === 5 && r.B.gained === 1 && r.B.callout && r.B.levelStill === 1 && r.B.supportXp === 1
  if (!ok) out.errors.push("checkB crossing the XP threshold did not show a Level up! callout (or support XP missing)")
}
// C. offers deterministic + pick validated + perks apply in the next fight
{
  out.C = r.C
  const s = r.C.stats
  const ok =
    r.C.o1.length === 3 && new Set(r.C.o1).size === 3 && JSON.stringify(r.C.o1) === JSON.stringify(r.C.o2) &&
    !r.C.o1.includes("reach") && // the-fool is melee
    r.C.bogusSame && r.C.pickedPerks.length === 1 && r.C.pickedPerks[0] === r.C.o1[0] && r.C.pendingAfter === 0 && r.C.doubleSame &&
    s.move[1] === s.move[0] + 1 && s.reach[1] > s.reach[0] && s.maxHp[1] === s.maxHp[0] + 3 && s.attack[1] === s.attack[0] + 2 &&
    s.ward[1] === s.ward[0] + 1 && s.ap[1] === s.ap[0] + 1 && s.level === 5 &&
    r.C.quick.costPerk === r.C.quick.costPlain - 1 && r.C.quick.hit && r.C.quick.costAfter === r.C.quick.costPlain &&
    r.C.thirst[1] === 13 &&
    r.C.cleave.twoEnemies >= 2 && r.C.cleave.plain[1] === 90 && r.C.cleave.perk[1] < 90 && r.C.cleave.perk[0] === r.C.cleave.plain[0]
  if (!ok) out.errors.push("checkC perk offers not deterministic/validated, or a perk did not apply in the next tactics fight")
}
// D. Commander
{
  out.D = r.D
  const ok =
    r.D.gained === 4 && r.D.cmdXp === 6 && r.D.pendingIsCmd === "commander" && r.D.noQuick &&
    r.D.cmdPerks.length === 1 && r.D.nextLevel === 2 && r.D.nextPerks[0] === r.D.cmdPerks[0] && r.D.none === null
  if (!ok) out.errors.push("checkD the Commander did not earn XP / level / keep its perk into the next fight")
}
// E. save/load + old save default
{
  out.E = r.E
  const ok =
    r.E.same && r.E.oldSubj.join() === "0,1,1" && r.E.oldUnits.every((u) => u[0] === 1 && u[1] === 0 && u[2] === 0) &&
    r.E.oldPending === null && r.E.progress.level === 2 && r.E.progress.into === 4 && r.E.progress.need === 9
  if (!ok) out.errors.push("checkE save/load did not round-trip XP/perks, or an old save did not default to Lv1 / 0 XP")
}
// F. UI: perk choice screen -> shop badges/XP bar; formation card; tactics token badge
{
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.waitForTimeout(900)
  const screen = await page.locator("[data-screen='level-up']").count()
  const title = await page.locator(".hw-levelup-title").first().textContent().catch(() => null)
  const cardPerks = await page.locator(".hw-levelup-card").evaluateAll((els) => els.map((e) => e.dataset.perk))
  await page.screenshot({ path: `${SHOTS}/levels_choice.png` }).catch(() => {})
  await page.locator(".hw-levelup-card").first().click().catch(() => {})
  await page.waitForTimeout(400)
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("heartwood-run-save-v1")).run)
  const screenAfter = await page.locator("[data-screen='level-up']").count()
  const squadTab = page.locator("button:has-text('Your Squad'), [aria-label*='Your Squad']").first()
  if (await squadTab.count()) await squadTab.click().catch(() => {})
  await page.waitForTimeout(300)
  const shopBadges = await page.locator(".hw-card-level .hw-level-badge").allTextContents()
  const xpBars = await page.locator(".hw-xp-bar").count()
  const perkIcons = await page.locator(".hw-card-level .hw-perk-icon").count()
  const cmdLevel = await page.locator("[data-commander-level]").first().textContent().catch(() => null)
  await page.screenshot({ path: `${SHOTS}/levels_shop.png` }).catch(() => {})
  // Formation
  await page.evaluate((s) => localStorage.setItem("heartwood-run-save-v1", JSON.stringify(s)), r.formationSave)
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.waitForTimeout(900)
  const formBadges = await page.locator(".hw-card-level .hw-level-badge").allTextContents()
  // Tactics battle
  await page.evaluate((s) => localStorage.setItem("heartwood-run-save-v1", JSON.stringify(s)), r.battleSave)
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.waitForTimeout(1200)
  const tokenBadges = await page.locator(".hwt-level-badge").allTextContents()
  await page.screenshot({ path: `${SHOTS}/levels_battle.png` }).catch(() => {})
  out.F = { screen, title, cardPerks, savedPerks: saved.bench.find((e) => e.key === "b0").perks, screenAfter, shopBadges, xpBars, perkIcons, cmdLevel, formBadges, tokenBadges }
  const ok =
    screen === 1 && /Level 2/.test(title || "") && JSON.stringify(cardPerks) === JSON.stringify(r.uiOffers) &&
    JSON.stringify(out.F.savedPerks) === JSON.stringify([r.uiOffers[0]]) && screenAfter === 0 &&
    shopBadges.includes("Lv2") && xpBars >= 2 && perkIcons >= 1 && /Lv2/.test(cmdLevel || "") &&
    formBadges.includes("Lv2") && tokenBadges.includes("Lv2") && tokenBadges.length >= 3
  if (!ok) out.errors.push("checkF the perk choice screen / level badges / XP bars / token badge did not show in the real game")
}

await page.close()
console.log(JSON.stringify(out, null, 2))
console.log("\npageErrors:", errs.length, errs.slice(0, 8))
await browser.close()
const pass = out.errors.length === 0 && errs.length === 0
console.log(pass ? "\n✅ verify_sprint_levels PASS" : "\n❌ verify_sprint_levels FAIL")
process.exit(pass ? 0 : 1)
