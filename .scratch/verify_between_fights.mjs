import { chromium } from "playwright"
import fs from "node:fs"

// Between-fights build depth (services/heartwood/betweenFights.js,
// tacticsBetweenFights.js, data/heartwood/buildSets.js + fates.js, the
// new events, runEngine wiring, FloorChoice / CampScreen / RunBuildPanel /
// SetTierBanner / FightFates UI). Mostly pure-engine checks run in-page on
// the REAL modules, then a few UI checks with screenshots.
// Usage: PORT=5451 node .scratch/verify_between_fights.mjs
const PORT = process.env.PORT || 5451
const SHOTS = process.env.SHOTS || ".scratch/shots"
fs.mkdirSync(SHOTS, { recursive: true })
const browser = await chromium.launch()
const errs = []
const out = { errors: [], checks: 0 }

const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 } })
const page = await ctx.newPage()
page.on("pageerror", (e) => errs.push(String(e)))
await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })

// ---------------------------------------------------------------------------
// LOGIC (in-page, the real modules)
// ---------------------------------------------------------------------------
const logic = await page.evaluate(async () => {
  const rt = await import("/src/services/heartwood/runEngine.js")
  const BF = await import("/src/services/heartwood/betweenFights.js")
  const S = await import("/src/data/heartwood/buildSets.js")
  const F = await import("/src/data/heartwood/fates.js")
  const EV = await import("/src/data/heartwood/events.js")
  const TR = await import("/src/services/heartwood/tacticsRealMatchup.js")
  const TD = await import("/src/services/heartwood/tacticsDifficulty.js")
  const { RELICS } = await import("/src/data/heartwood/relics.js")
  const { ITEMS } = await import("/src/data/heartwood/items.js")
  const { UNITS } = await import("/src/data/heartwood/units.js")
  const { RECIPES } = await import("/src/data/heartwood/recipes.js")
  const { levelForXp } = await import("/src/services/heartwood/unitLevels.js")
  const res = { fails: [], n: 0 }
  const ok = (cond, label, data) => {
    res.n++
    if (!cond) res.fails.push(`${label}${data !== undefined ? " " + JSON.stringify(data).slice(0, 300) : ""}`)
  }
  const P = rt.RUN_PATH
  const hero = (key, defId, extra = {}) => ({ key, defId, upgradeLevel: 0, upgrades: [], ...extra })
  const it = (key, defId, owner = null, slot = null) => ({ key, defId, equippedTo: owner, slotIndex: slot })
  const at = (idx, extra = {}) => ({
    ...rt.startRun("tommy", null, { forcedSeed: 5150 }),
    nodeIndex: idx,
    path: P.slice(0, idx + 1),
    phase: "formation",
    bench: [hero("b0", "the-fool"), hero("b1", "the-magician")],
    deployed: ["b0", "b1", null, null],
    items: [],
    itemKeyCounter: 100,
    lastSeenAct: rt.actIndexForNode(idx, P.length),
    ...extra,
  })
  const tactics = (rs) => rt.startTacticsFormationBattle(rs, (start) => TR.buildRunTacticsBattle(rs, start))
  const winAt = (rs) => rt.resolveBattleOutcome({ ...rs, phase: "battle", battle: { phase: "won", round: 1 } })

  // ===== 2. BUILD SETS =====
  const seenPiece = new Map()
  for (const set of Object.values(S.BUILD_SETS)) {
    for (const r of set.relics) {
      ok(!!RELICS[r], `S1 set ${set.id} relic exists`, r)
      ok(!seenPiece.has(`r:${r}`), `S2 relic in one set only`, r)
      seenPiece.set(`r:${r}`, set.id)
    }
    for (const i of set.items) {
      ok(!!ITEMS[i], `S1 set ${set.id} item exists`, i)
      ok(!seenPiece.has(`i:${i}`), `S2 item in one set only`, i)
      seenPiece.set(`i:${i}`, set.id)
    }
    ok(S.setSize(set) >= 6, `S3 set ${set.id} has >= 6 pieces`, S.setSize(set))
    ok(set.tiers[2] && set.tiers[4] && set.tiers[6], `S4 set ${set.id} has 2/4/6 tiers`)
  }
  ok(Object.keys(S.BUILD_SETS).length >= 6, "S5 at least 6 sets")
  // Mana sets exist (Marc: mana is the core fun system).
  ok(Object.values(S.BUILD_SETS).filter((s) => [2, 4, 6].some((n) => s.tiers[n].mana)).length >= 3, "S6 >= 3 sets carry mana bonuses")
  // Counting: distinct pieces, relics + items, duplicates once.
  const wellRs = { relics: ["wellspring-stone", "mana-crystal"], items: [it(1, "mana-gem"), it(2, "mana-gem")] }
  const wp = S.setProgress(wellRs).find((p) => p.set.id === "wellspring")
  ok(wp && wp.count === 3 && wp.tier === 2 && wp.next === 4, "S7 wellspring 3 distinct pieces -> tier 2, next 4", wp && { c: wp.count, t: wp.tier })
  ok(S.setManaBonus(wellRs).pool === 10, "S8 wellspring tier 2 = +10 pool", S.setManaBonus(wellRs))
  const ember4 = { relics: ["ember-core", "emberbrand"], items: [it(1, "ember-charm"), it(2, "pyre-edge")] }
  ok(S.setBonusEffects(ember4).length === 2 && S.setManaBonus(ember4).onHit === 2, "S9 emberkin 4 -> 2 effects + onHit mana")
  const coin2 = { ...at(P.findIndex((n) => n.type === "battle")), relics: ["essence-well", "honest-scale"] }
  const coin0 = { ...coin2, relics: [] }
  const coinDelta = rt.essenceForWin(coin2, P[coin2.nodeIndex]) - rt.essenceForWin(coin0, P[coin2.nodeIndex])
  const relicBonus = (RELICS["essence-well"].essenceBonus || 0) + (RELICS["honest-scale"].essenceBonus || 0)
  ok(coinDelta === 25 + relicBonus, "S10 Hearth & Coin tier 2 pays +25/win", { coinDelta, relicBonus })
  // Banner bookkeeping: new tier keys until acked.
  ok(rt.newSetTierKeys(coin2).includes("hearthcoin:2"), "S11 new tier key reported")
  ok(rt.newSetTierKeys(rt.ackSetTiers(coin2)).length === 0, "S12 ack clears new tier keys")
  // Set mana reaches the real tactics fight.
  const battleIdx = P.findIndex((n, i) => i > 20 && n.type === "battle")
  const tNo = tactics(at(battleIdx)).battle
  const tWell = tactics(at(battleIdx, { relics: ["wellspring-stone", "mana-crystal"], items: [it(1, "mana-gem")] })).battle
  const fool = (b) => b.units.find((u) => u.id === "player-the-fool-0")
  const relicPool = (RELICS["mana-crystal"].mana?.pool || 0) + (RELICS["wellspring-stone"].mana?.pool || 0)
  ok(fool(tWell).manaMax === fool(tNo).manaMax + 10 + relicPool, "S13 wellspring tier 2 raises tactics manaMax by 10", { no: fool(tNo).manaMax, well: fool(tWell).manaMax, relicPool })
  // Shop surfaces set pieces once you've started a set.
  const shopIdx = P.findIndex((n, i) => i > 30 && n.type === "shop")
  let surfaced = 0
  for (let k = 0; k < 12; k++) {
    const rsS = { ...at(shopIdx, { seed: 900 + k }), items: [it(1, "ember-charm")] }
    const offers = rt.freshItemShop(rsS, shopIdx).itemOffers
    if (offers.some((id) => S.setOfItem(id) === "emberkin")) surfaced++
  }
  ok(surfaced === 12, "S14 every market shows a piece of a started set", surfaced)
  const plain = rt.freshItemShop(at(shopIdx), shopIdx).itemOffers
  const plain2 = rt.freshItemShop(at(shopIdx), shopIdx).itemOffers
  ok(JSON.stringify(plain) === JSON.stringify(plain2), "S15 shop roll still deterministic")

  // ===== 1. ROUTE RISK / BRANCHING =====
  let rs = rt.startRun("tommy", null, { forcedSeed: 4242 })
  rs = rt.leaveShop(rs)
  ok(rs.phase === "choice" && rs.floorChoices.length === 2 && rs.nodeIndex === 0, "R1 Act I fork = 2 paths, nodeIndex unchanged", rs.floorChoices?.length)
  ok(rs.floorChoices[0].risk === "safe", "R2 first path is always Quiet")
  ok(rs.floorChoices.every((o) => o.risk !== "cursed"), "R3 no Cursed path in Act I")
  const again = rt.leaveShop(rt.startRun("tommy", null, { forcedSeed: 4242 }))
  ok(JSON.stringify(again.floorChoices) === JSON.stringify(rs.floorChoices), "R4 forks are deterministic per seed")
  // Walk to an Act II fork.
  let w = rt.startRun("tommy", null, { forcedSeed: 4242 })
  let fork2 = null
  let forks = 0
  let campForks = 0
  const riskSeen = new Set()
  for (let guard = 0; guard < 400 && !["victory", "defeat"].includes(w.phase); guard++) {
    if (w.phase === "shop") w = rt.leaveShop(w)
    else if (w.phase === "relic") w = rt.chooseRelic(w, null)
    else if (w.phase === "event") w = rt.resolveEventChoice(w, w.nodeIndex % 2)
    else if (w.phase === "camp") w = rt.leaveCamp(w)
    else if (w.phase === "choice") {
      forks++
      w.floorChoices.forEach((o) => riskSeen.add(o.risk))
      if (w.floorChoices.some((o) => o.leadsTo === "camp")) campForks++
      if (!fork2 && rt.actIndexForNode(w.nodeIndex + 1, P.length) >= 2 && w.floorChoices.length === 3) fork2 = w
      w = rt.chooseFloorEncounter(w, 0)
    } else if (w.phase === "formation") w = winAt(w)
    else break
  }
  ok(w.phase === "victory", "R5 a full run walks to victory through forks + camps", w.phase)
  ok(w.nodeIndex === P.length - 1, "R6 run still ends on RUN_PATH's last index", w.nodeIndex)
  ok(w.path.length === P.length, "R7 path length still matches RUN_PATH", w.path.length)
  ok(fork2 && fork2.floorChoices.length === 3, "R8 Act II+ forks offer 3 paths")
  ok(riskSeen.has("risky") && riskSeen.has("cursed") && riskSeen.has("safe"), "R9 all three risk levels appear", [...riskSeen])
  ok(campForks >= 8, "R10 camp paths show up regularly", { campForks, forks })
  // Every RUN_PATH index keeps its type (camp only replaces a shop).
  ok(w.path.every((n, i) => n.type === P[i].type || (n.type === "camp" && P[i].type === "shop")), "R11 path types match RUN_PATH (camp only on a shop index)")
  // Passed paths: Quiet/Hunted return stripped, Cursed closes.
  const f = { ...fork2, floorChoices: fork2.floorChoices.map((o, i) => ({ ...o, risk: ["safe", "risky", "cursed"][i], closes: i === 2 })) }
  const picked = rt.chooseFloorEncounter(f, 0)
  const key = (n) => n.formationId || n.enemyId
  ok(key(picked.battlePool[0]) === key(f.floorChoices[1]) && !picked.battlePool[0].risk, "R12 passed Hunted path returns as a plain fight")
  ok(!picked.battlePool.some((n) => key(n) === key(f.floorChoices[2])) || P.filter((n) => key(n) === key(f.floorChoices[2])).length > 1, "R13 passed Cursed path is gone")
  ok((picked.closedPaths || []).includes(key(f.floorChoices[2])), "R14 closed path recorded")
  // Risk -> higher threat tier + tougher numbers + better pay.
  const pick = (i) => rt.chooseFloorEncounter(f, i)
  const sp = TR.difficultyForRunNode(pick(0))
  const sc = TR.difficultyForRunNode(pick(2))
  ok(sc.score === sp.score + BF.RISK_LEVELS.cursed.threat && sc.tier >= sp.tier, "R15 Cursed path adds threat score (tacticsDifficulty)", { safe: sp.score, cursed: sc.score })
  ok(TD.difficultyScore({ act: 3, riskBonus: 12 }) === TD.difficultyScore({ act: 3 }) + 12, "R16 difficultyScore riskBonus")
  const hpOf = (r) => rt.previewBattleEnemies(r).reduce((s, e) => s + e.maxHp, 0)
  const nodeQ = { ...pick(0), bench: [hero("b0", "the-fool")], deployed: ["b0", null, null, null] }
  const nodeC = { ...nodeQ, path: [...nodeQ.path.slice(0, -1), { ...nodeQ.path[nodeQ.nodeIndex], risk: "cursed" }] }
  ok(hpOf(nodeC) > hpOf(nodeQ), "R17 Cursed path enemies have more HP", { q: hpOf(nodeQ), c: hpOf(nodeC) })
  const nq = nodeQ.path[nodeQ.nodeIndex]
  ok(rt.essenceForWin(nodeC, { ...nq, risk: "cursed" }) === rt.essenceForWin(nodeQ, nq) + 120, "R18 Cursed pays +120")
  ok(rt.essenceForWin(nodeQ, { ...nq, risk: "risky" }) === rt.essenceForWin(nodeQ, nq) + 60, "R19 Hunted pays +60")
  const wonR = winAt({ ...nodeQ, path: [...nodeQ.path.slice(0, -1), { ...nq, risk: "risky" }] })
  ok(wonR.items.length === nodeQ.items.length + 1, "R20 Hunted win drops a piece of gear")
  const wonC = winAt(nodeC)
  ok(wonC.relics.length === nodeC.relics.length + 1, "R21 Cursed win drops a relic")
  // Old save (no route keys) still forks.
  const oldSave = rt.startRun("tommy", null, { forcedSeed: 1 })
  delete oldSave.fates
  delete oldSave.campAt
  delete oldSave.camp
  const oldFork = rt.leaveShop(oldSave)
  ok(oldFork.phase === "choice" && rt.chooseFloorEncounter(oldFork, 0).phase === "formation", "R22 old save forks fine")

  // ===== 3. CAMP =====
  const bIdx = P.findIndex((n, i) => i > 4 && n.type === "battle" && P[i + 1]?.type === "shop")
  const preCamp = at(bIdx, {
    campAt: bIdx + 1,
    bench: [hero("b0", "the-fool", { hpPct: 0.25, wounded: true }), hero("b1", "the-magician", { hpPct: 0.4 })],
    commanderHpPct: 0.5,
    items: [it(1, "herb-pouch"), it(2, "empty-flask")],
  })
  const camp = winAt(preCamp)
  ok(camp.phase === "camp" && camp.nodeIndex === bIdx + 1 && camp.path[bIdx + 1].type === "camp", "C1 a camp path turns the next market into a Camp at the same index", { phase: camp.phase, ni: camp.nodeIndex })
  ok(BF.campActionsLeft(camp) === 2 && camp.campAt == null, "C2 two actions, campAt consumed")
  const rested = rt.campRest(camp)
  const b0 = rested.bench.find((e) => e.key === "b0")
  ok(b0.wounded === false && b0.hpPct > 0.25 && rested.commanderHpPct === 1 && BF.campActionsLeft(rested) === 1, "C3 Rest heals + tends the Wounded", b0)
  ok(rt.campRest(rested) === rested, "C4 same action twice is refused")
  const trained = rt.campTrain(rested, "b1")
  const b1 = trained.bench.find((e) => e.key === "b1")
  ok(levelForXp(b1.xp) === 2 && BF.campActionsLeft(trained) === 0, "C5 Train = next level (perk / skill point)", b1)
  ok(rt.campScout(trained) === trained && rt.campCraft(trained, "whittle") === trained, "C6 no actions left -> refused (can't do everything)")
  const crafted = rt.campCraft(camp, "healing-draught")
  ok(crafted.items.some((x) => x.defId === RECIPES["healing-draught"].result) && !crafted.items.some((x) => x.defId === "herb-pouch"), "C7 Craft fuses a recipe without lining up")
  const whittled = rt.campCraft(camp, "whittle")
  ok(whittled.items.length === camp.items.length + 1, "C8 Craft: whittle gear")
  const scouted = rt.campScout(camp)
  ok(scouted.scoutedThrough > camp.nodeIndex && BF.routeScouted(scouted), "C9 Scout reveals the road", scouted.scoutedThrough)
  const deep = rt.campCommune(camp, "deepen", "b0")
  ok(deep.bench.find((e) => e.key === "b0").manaBonus === 10, "C10 Commune deepens a hero's well")
  const charged = rt.campCommune(camp, "overcharge")
  ok(charged.campOvercharge === 30, "C11 Commune overcharge queued")
  const left = rt.leaveCamp(trained)
  ok(left.phase !== "camp" && left.camp === null, "C12 break camp moves on", left.phase)
  const saved = rt.deserializeRun(JSON.parse(JSON.stringify(rt.serializeRun(rested))))
  ok(saved && saved.phase === "camp" && BF.campActionsLeft(saved) === 1, "C13 camp survives save/load")
  // Commune reaches the tactics fight.
  const deepFight = tactics(at(battleIdx, { bench: [hero("b0", "the-fool", { manaBonus: 20 }), hero("b1", "the-magician")] })).battle
  ok(fool(deepFight).manaMax === fool(tNo).manaMax + 20, "C14 deepened well = +max mana in the fight", { no: fool(tNo).manaMax, deep: fool(deepFight).manaMax })
  const ocRun = tactics(at(battleIdx, { campOvercharge: 30 }))
  ok(ocRun.campOvercharge === 0, "C15 camp Overcharge is spent by the fight")
  const heroesCharged = ocRun.battle.units.filter((u) => u.side === "player" && u.manaMax > 0 && !u.reagents)
  ok(
    heroesCharged.length > 0 && heroesCharged.every((u) => u.overcharge > 0 || u.startCharged === 30),
    "C15b camp Overcharge charges every hero (Overcharge or a fuller start)",
    heroesCharged.map((u) => [u.id, u.mana, u.overcharge, u.startCharged]),
  )
  ok(BF.campActionLimit({ relics: ["essence-well", "honest-scale", "marked-coin", "market-charter"], items: [] }) === 3, "C16 Hearth & Coin tier 4 = +1 camp action")

  // ===== 4. FATES =====
  const evIds = [
    "the-ferryman",
    "the-poachers-snare",
    "the-bone-saint",
    "the-unlit-lantern",
    "the-paper-king",
    "the-drowned-bell",
    "the-moonlender",
    "the-tide-pool",
    "the-caged-hunter",
    "the-lantern-keeper",
    "the-bell-answers",
  ]
  const fateEvents = EV.EVENTS.filter((e) => e.choices.some((c) => (c.effects || []).some((x) => x.fate)))
  ok(evIds.every((id) => EV.EVENTS.some((e) => e.id === id)), "F1 the new events exist")
  ok(fateEvents.length >= 10, "F2 >= 10 events plant fates (8+ new, + existing)", fateEvents.length)
  ok(fateEvents.every((e) => e.choices.every((c) => (c.effects || []).every((x) => !x.fate || F.FATES[x.fate]))), "F3 every fate id is real")
  ok(Object.values(F.FATES).every((d) => d.kind !== "ally" || UNITS[d.unit]), "F4 ally units exist")
  ok(EV.EVENTS.find((e) => e.id === "trapped-forager").choices.some((c) => c.effects.some((x) => x.fate)), "F5 an existing event gained a fate")
  const kinds = new Set(Object.values(F.FATES).map((d) => d.kind))
  ok(["curse", "ally", "rival", "price", "debt", "tide", "thread"].every((k) => kinds.has(k)), "F6 all fate kinds used", [...kinds])
  // Plant through a real event resolution.
  const evIdx = P.findIndex((n, i) => i > 15 && n.type === "event")
  const evRs = { ...at(evIdx), phase: "event", seenEvents: EV.EVENTS.filter((e) => e.id !== "the-poachers-snare").map((e) => e.id) }
  ok(rt.eventForNode(evRs).id === "the-poachers-snare", "F7 forced event shows")
  const afterEv = rt.resolveEventChoice(evRs, 0)
  ok(afterEv.fates.length === 2 && afterEv.fates.some((x) => x.kind === "ally") && afterEv.fates.some((x) => x.kind === "rival" && x.enemyId), "F8 event plants ally + rival", afterEv.fates)
  // Due next fight-but-one: wait 1 -> first fight they're absent, then they come.
  const fRs = { ...at(battleIdx), fates: afterEv.fates }
  ok(BF.fatesThisFight(fRs).length === 0, "F9 not due yet")
  const t1 = tactics(fRs).battle
  ok(!t1.units.some((u) => u.fateAlly || u.fateRival), "F10 not on the board yet")
  const ticked = BF.tickFatesAfterFight(fRs)
  ok(BF.fatesThisFight(ticked).length === 2, "F11 due after one fight")
  const t2 = tactics({ ...fRs, fates: ticked.fates }).battle
  const ally = t2.units.find((u) => u.fateAlly)
  const rival = t2.units.find((u) => u.fateRival)
  ok(ally && ally.side === "player" && rival && rival.side === "enemy", "F12 ally + rival on the board")
  ok(rival && rival.maxHp > 0 && /Hound/.test(rival.name), "F13 rival is named", rival?.name)
  const paid = BF.tickFatesAfterFight({ ...fRs, fates: ticked.fates, essence: 100 })
  ok(paid.essence === 100 + F.FATES["poacher-rival"].bounty && paid.fates.every((x) => x.done), "F14 beating the rival pays the bounty; both resolve", paid.essence)
  // Through the real win flow (the bounty lands on top of the normal payout).
  const dueRs = { ...fRs, fates: ticked.fates }
  const wonF = winAt(dueRs)
  ok(wonF.essence === dueRs.essence + rt.essenceForWin(dueRs, P[battleIdx]) + rt.bankInterestFor(dueRs) + 120, "F15 real win pays bounty on top", { got: wonF.essence })
  // Curse: relic now + squad effects for N fights.
  let cur = BF.plantFate({ ...at(battleIdx), relics: [] }, "bone-saint-curse", 2)
  ok(cur.relics.length === 1 && BF.fateEffectsForFight(cur).length === 1, "F16 curse grants a relic + a fight effect")
  for (let k = 0; k < 3; k++) cur = BF.tickFatesAfterFight(cur)
  ok(BF.fateEffectsForFight(cur).length === 0 && cur.fates[0].done && cur.relics.length === 1, "F17 curse lifts after 3 fights, relic stays")
  // Price fate changes real recruit prices; counts down on leaving markets.
  const def = UNITS["the-magician"]
  const shopRs = { ...at(shopIdx), phase: "shop" }
  const friend = BF.plantFate(shopRs, "merchant-friend")
  ok(rt.effectiveRecruitCost(friend, def) < rt.effectiveRecruitCost(shopRs, def), "F18 friendly guild discount")
  const grudge = BF.plantFate(shopRs, "merchant-grudge")
  ok(rt.effectiveRecruitCost(grudge, def) > rt.effectiveRecruitCost(shopRs, def), "F19 grudge price hike")
  const leftShop = rt.leaveShop(friend)
  ok(leftShop.fates[0].left === 2, "F20 price fate counts down on leaving a market", leftShop.fates[0])
  // Debt: essence now, collected later.
  let debt = BF.plantFate({ ...shopRs, essence: 0 }, "moonlender-debt")
  ok(debt.essence === 150, "F21 debt pays now")
  debt = { ...debt, essence: 400 }
  for (let k = 0; k < 3; k++) debt = BF.tickFatesAfterShop(debt)
  ok(debt.essence === 150 && debt.fates[0].done, "F22 debt collected at the 3rd market", debt.essence)
  // Tide: overcharge for the next fights.
  const tide = BF.plantFate(at(battleIdx), "high-tide")
  ok(BF.fateOverchargeForFight(tide) === 25, "F23 tide overcharges")
  // Thread: flag set, follow-up resolves it.
  const thread = BF.plantFate({ ...at(evIdx), phase: "event" }, "lantern-thread")
  ok(thread.storyFlags.carries_unlit_lantern === true, "F24 thread sets its story flag")
  const follow = { ...thread, seenEvents: EV.EVENTS.filter((e) => e.id !== "the-lantern-keeper").map((e) => e.id) }
  const fe = rt.eventForNode(follow)
  ok(fe.id === "the-lantern-keeper", "F25 follow-up event unlocked by the thread", fe.id)
  const fr = rt.resolveEventChoice(follow, 0)
  ok(fr.fates.find((x) => x.id === "lantern-thread").done, "F26 thread resolved by the follow-up")
  // Save/load keeps fates.
  const sv = rt.deserializeRun(JSON.parse(JSON.stringify(rt.serializeRun({ ...afterEv }))))
  ok(sv && sv.fates.length === 2, "F27 fates survive save/load")

  return res
})
out.checks += logic.n
out.errors.push(...logic.fails)

// ---------------------------------------------------------------------------
// UI (seeded saves, real clicks)
// ---------------------------------------------------------------------------
async function seed(builderSrc) {
  await page.evaluate(async (src) => {
    localStorage.setItem("heartwood-autobattler-intro-seen", "true")
    localStorage.setItem("heartwood-story-intro-seen", "true")
    localStorage.setItem("heartwood-tactics-tutorial-v1", "skipped")
    localStorage.setItem("heartwood-coach-enabled-v1", "false")
    const rt = await import("/src/services/heartwood/runEngine.js")
    const BF = await import("/src/services/heartwood/betweenFights.js")
    // eslint-disable-next-line no-new-func
    const build = new Function("rt", "BF", `return (${src})(rt, BF)`)
    const rs = build(rt, BF)
    localStorage.setItem("heartwood-run-save-v1", JSON.stringify(rt.serializeRun(rs)))
  }, builderSrc)
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.waitForTimeout(900)
}
const check = (cond, label, data) => {
  out.checks++
  if (!cond) out.errors.push(`${label}${data !== undefined ? " " + JSON.stringify(data).slice(0, 300) : ""}`)
}

// U1: a 3-path fork with risk, threat tier, reward and camp tags.
await seed(`(rt) => {
  const P = rt.RUN_PATH
  const shop = P.findIndex((n, i) => i > 25 && n.type === "shop" && P[i + 1].type === "battle")
  let rs = { ...rt.startRun("tommy", null, { forcedSeed: 4243 }), nodeIndex: shop, path: P.slice(0, shop + 1), phase: "shop",
    bench: [{ key: "b0", defId: "the-fool", upgradeLevel: 0, upgrades: [] }], deployed: ["b0", null, null, null], items: [], lastSeenAct: rt.actIndexForNode(shop, P.length) }
  rs = rt.leaveShop(rs)
  rs.floorChoices = rs.floorChoices.map((o, i) => ({ ...o, risk: ["safe", "risky", "cursed"][i], closes: i === 2, leadsTo: i === 1 ? "camp" : "market", campSlot: o.campSlot ?? shop + 2 }))
  return rs
}`)
const fork = await page.evaluate(() => ({
  cards: document.querySelectorAll(".hw-route-card").length,
  risks: [...document.querySelectorAll(".hw-route-card")].map((c) => c.getAttribute("data-risk")),
  threat: [...document.querySelectorAll(".hw-route-threat")].map((c) => c.textContent),
  essence: [...document.querySelectorAll(".hw-route-essence")].map((c) => c.textContent),
  camp: !!document.querySelector('.hw-route-tag[data-tag="camp"]'),
  closes: !!document.querySelector('.hw-route-tag[data-tag="closes"]'),
}))
await page.screenshot({ path: `${SHOTS}/between_fights_fork.png` })
check(fork.cards === 3 && fork.risks.join() === "safe,risky,cursed", "U1 fork shows 3 risk-coded paths", fork)
check(fork.camp && fork.closes && fork.essence.length === 3 && fork.threat.length === 3, "U2 fork shows camp/closes tags, threat + essence", fork)
check(Number(fork.essence[2].match(/\d+/)[0]) === Number(fork.essence[0].match(/\d+/)[0]) + 120 || fork.essence[2] !== fork.essence[0], "U3 cursed path promises more Essence", fork.essence)
// Pick the camp path -> formation shows the risk line.
await page.locator(".hw-route-card").nth(1).click()
await page.waitForTimeout(500)
const formation = await page.evaluate(() => ({
  fates: [...document.querySelectorAll(".hw-fight-fate")].map((e) => e.textContent),
  save: JSON.parse(localStorage.getItem("heartwood-run-save-v1")).run,
}))
check(formation.save.phase === "formation" && formation.save.path[formation.save.nodeIndex].risk === "risky", "U4 picking a path enters its fight", formation.save.phase)
check(formation.fates.some((t) => /Hunted path/.test(t)), "U5 formation shows the chosen risk", formation.fates)
check(formation.save.campAt === formation.save.nodeIndex + 1, "U6 camp path schedules a Camp at the next market index", formation.save.campAt)

// U7: Camp screen - action cards, counter, real clicks, level-up from Train.
await seed(`(rt) => {
  const P = rt.RUN_PATH
  const b = P.findIndex((n, i) => i > 30 && n.type === "battle" && P[i + 1].type === "shop")
  const rs = { ...rt.startRun("tommy", null, { forcedSeed: 77 }), nodeIndex: b, path: P.slice(0, b + 1), phase: "battle", campAt: b + 1,
    battle: { phase: "won", round: 1 }, lastSeenAct: rt.actIndexForNode(b + 1, P.length),
    bench: [{ key: "b0", defId: "the-fool", upgradeLevel: 0, upgrades: [], hpPct: 0.25, wounded: true }, { key: "b1", defId: "the-magician", upgradeLevel: 0, upgrades: [] }],
    deployed: ["b0", "b1", null, null], relics: ["wellspring-stone"], setTiersSeen: [],
    items: [{ key: 1, defId: "herb-pouch", equippedTo: null, slotIndex: null }, { key: 2, defId: "empty-flask", equippedTo: null, slotIndex: null }, { key: 3, defId: "mana-gem", equippedTo: null, slotIndex: null }],
    itemKeyCounter: 10 }
  return { ...rt.resolveBattleOutcome(rs), lastAftermath: null }
}`)
// The Wellspring tier-2 banner (2 pieces) celebrates first.
const banner = await page.locator(".hw-set-tier-banner").count()
await page.screenshot({ path: `${SHOTS}/between_fights_set_banner.png` })
check(banner === 1, "U7 set tier banner celebrates a new tier", banner)
if (banner) await page.locator(".hw-set-tier-ok").click()
await page.waitForTimeout(300)
const campUi = await page.evaluate(() => ({
  cards: [...document.querySelectorAll(".hw-camp-card")].map((c) => c.getAttribute("data-action")),
  counter: document.querySelector(".hw-camp-counter")?.getAttribute("data-left"),
  panel: !!document.querySelector(".hw-build-panel"),
  banner: !!document.querySelector(".hw-set-tier-overlay"),
}))
await page.screenshot({ path: `${SHOTS}/between_fights_camp.png` })
check(campUi.cards.join() === "rest,train,craft,scout,commune" && campUi.counter === "2", "U8 camp shows 5 actions + counter 2", campUi)
check(campUi.panel && !campUi.banner, "U9 build panel visible, banner dismissed for good", campUi)
await page.locator('.hw-camp-card[data-action="rest"] .hw-camp-do').click()
await page.waitForTimeout(250)
await page.locator('.hw-camp-card[data-action="craft"] .hw-camp-do').click()
await page.locator('.hw-camp-card[data-action="craft"] .hw-camp-pick').first().click()
await page.waitForTimeout(300)
const campAfter = await page.evaluate(() => ({
  counter: document.querySelector(".hw-camp-counter")?.getAttribute("data-left"),
  done: [...document.querySelectorAll('.hw-camp-card[data-done]')].map((c) => c.getAttribute("data-action")),
  disabled: document.querySelectorAll('.hw-camp-card[data-disabled]').length,
  run: JSON.parse(localStorage.getItem("heartwood-run-save-v1")).run,
}))
await page.screenshot({ path: `${SHOTS}/between_fights_camp_done.png` })
check(campAfter.counter === "0" && campAfter.done.join() === "rest,craft" && campAfter.disabled === 5, "U10 two actions used, the rest locked", campAfter)
check(campAfter.run.bench.find((e) => e.key === "b0").wounded === false && campAfter.run.items.some((x) => x.defId === "healing-draught"), "U11 Rest + Craft really applied")
await page.locator(".hw-camp-leave").click()
await page.waitForTimeout(400)
const leftCamp = await page.evaluate(() => JSON.parse(localStorage.getItem("heartwood-run-save-v1")).run.phase)
check(leftCamp !== "camp", "U12 Break camp moves on", leftCamp)

// U13: Train leads into the real level-up choice (skill point).
await seed(`(rt) => {
  const P = rt.RUN_PATH
  const b = P.findIndex((n, i) => i > 30 && n.type === "battle" && P[i + 1].type === "shop")
  const rs = { ...rt.startRun("tommy", null, { forcedSeed: 77 }), nodeIndex: b, path: P.slice(0, b + 1), phase: "battle", campAt: b + 1,
    battle: { phase: "won", round: 1 }, lastSeenAct: rt.actIndexForNode(b + 1, P.length),
    bench: [{ key: "b0", defId: "the-fool", upgradeLevel: 0, upgrades: [] }], deployed: ["b0", null, null, null], items: [] }
  return { ...rt.resolveBattleOutcome(rs), lastAftermath: null }
}`)
await page.locator('.hw-camp-card[data-action="train"] .hw-camp-do').click()
await page.locator('.hw-camp-card[data-action="train"] .hw-camp-pick').first().click()
await page.waitForTimeout(400)
const lvl = await page.evaluate(() => ({ camp: !!document.querySelector(".hw-camp"), text: document.body.innerText.slice(0, 2000) }))
await page.screenshot({ path: `${SHOTS}/between_fights_train_levelup.png` })
check(!lvl.camp && /level/i.test(lvl.text), "U13 Train opens the level-up choice", lvl.text.slice(0, 120))

// U14: shop rail - build panel with sets + fates, set badge on gear.
await seed(`(rt, BF) => {
  const P = rt.RUN_PATH
  const shop = P.findIndex((n, i) => i > 25 && n.type === "shop")
  let rs = { ...rt.startRun("tommy", null, { forcedSeed: 31 }), nodeIndex: shop, path: P.slice(0, shop + 1), phase: "shop",
    bench: [{ key: "b0", defId: "the-fool", upgradeLevel: 0, upgrades: [] }], deployed: ["b0", null, null, null],
    relics: ["ember-core", "wellspring-stone", "mana-crystal"], items: [{ key: 1, defId: "ember-charm", equippedTo: null, slotIndex: null }], itemKeyCounter: 5,
    lastSeenAct: rt.actIndexForNode(shop, P.length) }
  rs = { ...rs, ...rt.freshItemShop(rs, shop) }
  rs = BF.plantFate(rs, "poacher-rival", 2)
  rs = BF.plantFate(rs, "merchant-friend", 2)
  rs = BF.plantFate(rs, "lantern-thread", 2)
  return rt.ackSetTiers(rs)
}`)
const shopUi = await page.evaluate(() => ({
  sets: [...document.querySelectorAll(".hw-build-set")].map((e) => e.getAttribute("data-set")),
  fates: document.querySelectorAll(".hw-fate").length,
  badges: document.querySelectorAll(".hw-set-badge").length,
  road: document.querySelectorAll(".hw-road-stop").length,
}))
await page.screenshot({ path: `${SHOTS}/between_fights_shop_panel.png` })
check(shopUi.sets.includes("emberkin") && shopUi.sets.includes("wellspring") && shopUi.fates === 3, "U14 run panel lists sets + fates", shopUi)
check(shopUi.badges >= 1 && shopUi.road >= 3, "U15 shop gear shows set badges; road ahead listed", shopUi)

// U16: a fated ally + rival on the real tactics board.
await seed(`(rt, BF) => {
  const P = rt.RUN_PATH
  const b = P.findIndex((n, i) => i > 20 && n.type === "battle")
  let rs = { ...rt.startRun("tommy", null, { forcedSeed: 424243 }), nodeIndex: b, path: P.slice(0, b + 1), phase: "formation",
    bench: [{ key: "b0", defId: "the-fool", upgradeLevel: 0, upgrades: [] }], deployed: ["b0", null, null, null], items: [],
    lastSeenAct: rt.actIndexForNode(b, P.length) }
  rs = BF.plantFate(rs, "wolf-ally", 2)
  rs = BF.plantFate(rs, "poacher-rival", 2)
  return { ...rs, fates: rs.fates.map((f) => ({ ...f, wait: 0 })) }
}`)
const formFates = await page.evaluate(() => [...document.querySelectorAll(".hw-fight-fate")].map((e) => e.getAttribute("data-kind")))
await page.screenshot({ path: `${SHOTS}/between_fights_formation_fates.png` })
check(formFates.includes("ally") && formFates.includes("rival"), "U16 formation warns of ally + rival", formFates)
await page.locator(".hw-tactics-start").click()
await page.waitForTimeout(700)
const board = await page.evaluate(() => ({
  ally: document.querySelectorAll('.hwt-token[data-fate="ally"]').length,
  rival: document.querySelectorAll('.hwt-token[data-fate="rival"]').length,
  tags: [...document.querySelectorAll(".hwt-fate-tag")].map((e) => e.textContent),
}))
await page.screenshot({ path: `${SHOTS}/between_fights_board_ally_rival.png` })
check(board.ally === 1 && board.rival === 1 && board.tags.includes("Ally") && board.tags.includes("Rival"), "U17 board shows the Ally + Rival", board)

out.pageErrors = errs
if (errs.length) out.errors.push(...errs.map((e) => `pageerror: ${e}`))
await browser.close()
console.log(JSON.stringify(out, null, 2))
console.log(out.errors.length ? `FAIL ${out.errors.length}/${out.checks}` : `PASS ${out.checks}/${out.checks}`)
process.exit(out.errors.length ? 1 : 0)
