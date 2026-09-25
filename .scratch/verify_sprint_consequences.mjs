import { chromium } from "playwright"

// Sprint 2 - Lasting consequences: damage and falls carry across fights.
// Every check drives the REAL runEngine.js / tacticsRealMatchup.js via a
// page.evaluate import (same pattern as verify_tactics_real_battle's
// check42), plus one live-UI check on the shop + formation screens.
const PORT = process.env.PORT || 5446
const browser = await chromium.launch()
const errs = []
const out = { errors: [] }

const page = await browser.newContext({ viewport: { width: 1600, height: 1000 } }).then((c) => c.newPage())
page.on("pageerror", (e) => errs.push(String(e)))
await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })

const r = await page.evaluate(async () => {
  const rt = await import("/src/services/heartwood/runEngine.js")
  const { buildRunTacticsBattle } = await import("/src/services/heartwood/tacticsRealMatchup.js")
  const idx = rt.RUN_PATH.findIndex((n) => n.type === "battle" && n.formationId)
  const mk = (extra = {}) => ({
    ...rt.startRun("tommy", null, { forcedSeed: 777 }),
    nodeIndex: idx,
    path: rt.RUN_PATH.slice(0, idx + 1),
    phase: "formation",
    bench: [
      { key: "b0", defId: "the-fool", upgradeLevel: 0, upgrades: [] },
      { key: "b1", defId: "hexbreaker", upgradeLevel: 0, upgrades: [] },
      { key: "b2", defId: "the-fool", upgradeLevel: 0, upgrades: [], hpPct: 0.5 },
    ],
    deployed: ["b0", "b1", null, null],
    items: [],
    lastSeenAct: rt.actIndexForNode(idx, rt.RUN_PATH.length),
    ...extra,
  })
  const res = {}

  // --- A: a won tactics fight: the-fool ends at 40%, hexbreaker falls,
  // Commander ends at 70%; resolveBattleOutcome records it.
  const rs = mk()
  const started = rt.startTacticsFormationBattle(rs, (s) => buildRunTacticsBattle(rs, s))
  const units = started.battle.units.map((u) => {
    if (u.id === "player-the-fool-0") return { ...u, hp: Math.round(u.maxHp * 0.4) }
    if (u.id === "player-hexbreaker-1") return { ...u, hp: 0 }
    if (u.id === "player-commander") return { ...u, hp: Math.round(u.maxHp * 0.7) }
    if (u.side === "enemy") return { ...u, hp: 0 }
    return u
  })
  const after = rt.resolveBattleOutcome({ ...started, battle: { phase: "won", round: 3, units } })
  const b0 = after.bench.find((e) => e.key === "b0")
  const b1 = after.bench.find((e) => e.key === "b1")
  const b2 = after.bench.find((e) => e.key === "b2")
  res.A = { b0, b1, b2, cmd: after.commanderHpPct, cmdW: after.commanderWounded, lines: after.lastAftermath }

  // --- B: the NEXT fight starts them at that HP (tactics + auto paths).
  const next = { ...after, nodeIndex: idx, path: rt.RUN_PATH.slice(0, idx + 1), phase: "formation" }
  const tac2 = rt.startTacticsFormationBattle(next, (s) => buildRunTacticsBattle(next, s))
  const auto2 = rt.startFormationBattle(next).battle
  const pick = (list, id) => { const u = list.find((x) => x.id === id); return u && { hp: u.hp, maxHp: u.maxHp } }
  res.B = {
    tFool: pick(tac2.battle.units, "player-the-fool-0"),
    tHex: pick(tac2.battle.units, "player-hexbreaker-1"),
    tCmd: pick(tac2.battle.units, "player-commander"),
    aFool: pick(auto2.playerUnits, "p0"),
    aHex: pick(auto2.playerUnits, "p1"),
    aCmd: pick(auto2.playerUnits, "commander"),
    clearedAftermath: tac2.lastAftermath,
  }

  // --- C: Mend: costs mendCost Essence, heals fully, clears Wounded;
  // refuses when broke or when the unit is already healthy.
  const rich = { ...after, essence: 500 }
  const cost = rt.mendCost(rich)
  const mended = rt.mendUnit(rich, "b1")
  const mendedCmd = rt.mendUnit(rich, "commander")
  const broke = rt.mendUnit({ ...after, essence: cost - 1 }, "b1")
  const healthy = rt.mendUnit({ ...rich, bench: rich.bench.map((e) => (e.key === "b1" ? { ...e, hpPct: 1, wounded: false } : e)) }, "b1")
  res.C = {
    cost,
    essAfter: mended.essence,
    b1: mended.bench.find((e) => e.key === "b1"),
    cmd: [mendedCmd.commanderHpPct, mendedCmd.commanderWounded, mendedCmd.essence],
    brokeSame: broke === after || broke.essence === cost - 1 && broke.bench.find((e) => e.key === "b1").wounded,
    healthySame: healthy.essence === 500,
  }

  // --- D: rest event effect `{ mend: "all" }` heals everyone for free.
  const { EVENTS } = await import("/src/data/heartwood/events.js").catch(() => ({}))
  const restEvents = (EVENTS || []).filter((e) => e.choices.some((c) => (c.effects || []).some((f) => f.mend === "all"))).map((e) => e.id)
  const rested = rt.restSquad(after)
  res.D = {
    restEvents,
    allFull: rested.bench.every((e) => rt.unitHpPct(e) === 1 && !e.wounded) && rested.commanderHpPct === 1 && !rested.commanderWounded,
    essSame: rested.essence === after.essence,
  }

  // --- E: save/load round-trip + an old save (no fields) = full HP.
  const loaded = rt.deserializeRun(JSON.parse(JSON.stringify(rt.serializeRun(after))))
  const old = mk({ bench: [{ key: "b0", defId: "the-fool", upgradeLevel: 0, upgrades: [] }], deployed: ["b0", null, null, null] })
  const oldLoaded = rt.deserializeRun(JSON.parse(JSON.stringify(rt.serializeRun(old))))
  const oldTac = rt.startTacticsFormationBattle(oldLoaded, (s) => buildRunTacticsBattle(oldLoaded, s))
  res.E = {
    same: JSON.stringify(loaded.bench) === JSON.stringify(after.bench) && loaded.commanderHpPct === after.commanderHpPct && loaded.commanderWounded === after.commanderWounded,
    oldFull: oldTac.battle.units.filter((u) => u.side === "player").every((u) => u.hp === u.maxHp),
    oldPct: [rt.unitHpPct(oldLoaded.bench[0]), rt.commanderHpPct(oldLoaded)],
  }

  // Stage a shop save for the UI check (F).
  const shopIdx = rt.RUN_PATH.findIndex((n, i) => i > idx && n.type === "shop")
  const shopRs = { ...after, phase: "shop", nodeIndex: shopIdx, path: rt.RUN_PATH.slice(0, shopIdx + 1), essence: 500, lastSeenAct: rt.actIndexForNode(shopIdx, rt.RUN_PATH.length) }
  localStorage.setItem("heartwood-run-save-v1", JSON.stringify(rt.serializeRun(shopRs)))
  localStorage.setItem("heartwood-autobattler-intro-seen", "1"); localStorage.setItem("heartwood-story-intro-seen", "1")
  res.formationSave = rt.serializeRun({ ...after, nodeIndex: idx, path: rt.RUN_PATH.slice(0, idx + 1), phase: "formation", lastAftermath: null })
  res.mendCostShop = rt.mendCost(shopRs)
  return res
})

// A. HP carries / fallen -> Wounded / passive recovery
{
  const { b0, b1, b2, cmd, cmdW, lines } = r.A
  out.A = r.A
  const ok =
    Math.abs(b0.hpPct - (0.4 + 0.15)) < 0.02 && !b0.wounded &&
    b1.wounded === true && b1.hpPct === 0.25 &&
    Math.abs(b2.hpPct - 0.65) < 1e-9 &&
    Math.abs(cmd - 0.85) < 0.02 && !cmdW &&
    lines.length === 1 && /Hexbreaker/i.test(lines[0]) && /Wounded/.test(lines[0])
  if (!ok) out.errors.push("checkA survivors did not keep their HP (+15% recovery), or the fallen unit was not Wounded at 25%")
}
// B. next fight starts at carried HP, both engines agree
{
  const { tFool, tHex, tCmd, aFool, aHex, aCmd, clearedAftermath } = r.B
  out.B = r.B
  const near = (u, pct) => u && Math.abs(u.hp - Math.round(u.maxHp * pct)) <= 1
  const ok =
    near(tFool, r.A.b0.hpPct) && near(tHex, 0.25) && near(tCmd, r.A.cmd) &&
    tFool.hp === aFool.hp && tHex.hp === aHex.hp && tCmd.hp === aCmd.hp &&
    tHex.hp < tHex.maxHp && clearedAftermath === null
  if (!ok) out.errors.push("checkB the next fight did not start units at their carried HP (tactics + auto)")
}
// C. Mend
{
  out.C = r.C
  const ok =
    r.C.cost > 0 && r.C.essAfter === 500 - r.C.cost && r.C.b1.hpPct === 1 && r.C.b1.wounded === false &&
    r.C.cmd[0] === 1 && r.C.cmd[1] === false && r.C.cmd[2] === 500 - r.C.cost &&
    r.C.brokeSame && r.C.healthySame
  if (!ok) out.errors.push("checkC Mend did not charge/heal/clear Wounded correctly")
}
// D. rest
{
  out.D = r.D
  const ok = r.D.allFull && r.D.essSame && (r.D.restEvents.length === 0 || r.D.restEvents.length >= 2)
  if (!ok) out.errors.push("checkD a rest did not heal the whole squad for free")
}
// E. save/load
{
  out.E = r.E
  const ok = r.E.same && r.E.oldFull && r.E.oldPct[0] === 1 && r.E.oldPct[1] === 1
  if (!ok) out.errors.push("checkE save/load did not round-trip, or an old save did not default to full HP")
}
// F. UI: shop shows HP/Wounded + Mend + the summary line; Mend works live;
//    formation board shows the wounded unit's reduced HP.
{
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.waitForTimeout(800)
  const aftermath = await page.locator("[data-aftermath]").first().textContent().catch(() => null)
  // Open the Your Squad tab if the bench is tabbed away.
  const squadTab = page.locator("button:has-text('Your Squad'), [aria-label*='Your Squad']").first()
  if (await squadTab.count()) await squadTab.click().catch(() => {})
  await page.waitForTimeout(300)
  const woundedCards = await page.locator(".hw-card-health[data-wounded]").count()
  const hurtCards = await page.locator(".hw-card-health").count()
  const mendBtns = await page.locator(".hw-mend-btn").count()
  const cmdBadge = await page.locator("[data-commander-health]").count()
  const unitMend = page.locator(".hw-mend-btn:not([data-mend-commander])").first()
  const mendLabel = await unitMend.textContent().catch(() => null)
  await unitMend.click().catch(() => {})
  await page.waitForTimeout(300)
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("heartwood-run-save-v1")).run)
  const mendBtnsAfter = await page.locator(".hw-mend-btn").count()
  await page.screenshot({ path: "/tmp/claude-1000/-home-marc-Wood-Booster-AI/bb7f551b-ac23-44f6-901f-0ed262880f88/scratchpad/consequences_shop.png" }).catch(() => {})
  // Formation board
  await page.evaluate((s) => localStorage.setItem("heartwood-run-save-v1", JSON.stringify(s)), r.formationSave)
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.waitForTimeout(800)
  const formWounded = await page.locator(".hw-card-health[data-wounded]").count()
  const formWoundedName = await page.getByText("(Wounded)").count()
  await page.screenshot({ path: "/tmp/claude-1000/-home-marc-Wood-Booster-AI/bb7f551b-ac23-44f6-901f-0ed262880f88/scratchpad/consequences_formation.png" }).catch(() => {})
  out.F = { aftermath, woundedCards, hurtCards, mendBtns, cmdBadge, mendLabel, essAfter: saved.essence, mendBtnsAfter, formWounded, formWoundedName }
  const ok =
    /Wounded/.test(aftermath || "") && woundedCards >= 1 && hurtCards >= 2 && mendBtns >= 3 && cmdBadge === 1 &&
    mendLabel?.includes(String(r.mendCostShop)) && saved.essence === 500 - r.mendCostShop && mendBtnsAfter === mendBtns - 1 &&
    formWounded >= 1 && formWoundedName >= 1
  if (!ok) out.errors.push("checkF the shop/formation UI did not show HP/Wounded/Mend/summary, or a live Mend click did not apply")
}

await page.close()
console.log(JSON.stringify(out, null, 2))
console.log("\npageErrors:", errs.length, errs.slice(0, 8))
await browser.close()
const pass = out.errors.length === 0 && errs.length === 0
console.log(pass ? "\n✅ verify_sprint_consequences PASS" : "\n❌ verify_sprint_consequences FAIL")
process.exit(pass ? 0 : 1)
