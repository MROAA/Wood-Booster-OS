import { chromium } from "playwright"
import fs from "node:fs"

// The Long Campaign, part 1 (services/heartwood/campaignEngine.js,
// data/heartwood/campaign.js, components/heartwood/campaign/*). Mostly
// pure-engine checks run in-page on the REAL modules, then UI checks with
// screenshots: world map, Hearth rooms, squad select, a real mission fight
// started from the campaign, and an aftermath with a death.
// Usage: PORT=5451 node .scratch/verify_campaign.mjs
const PORT = process.env.PORT || 5451
const SHOTS = process.env.SHOTS || ".scratch/shots"
fs.mkdirSync(SHOTS, { recursive: true })
const browser = await chromium.launch()
const errs = []
const out = { fails: [], n: 0 }
const ok = (cond, label, data) => {
  out.n++
  if (!cond) out.fails.push(`${label}${data !== undefined ? " " + JSON.stringify(data).slice(0, 300) : ""}`)
}

const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 } })
const page = await ctx.newPage()
page.on("pageerror", (e) => errs.push(String(e)))
await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })

// ---------------------------------------------------------------------------
// LOGIC (in-page, the real modules)
// ---------------------------------------------------------------------------
const logic = await page.evaluate(async () => {
  const CE = await import("/src/services/heartwood/campaignEngine.js")
  const D = await import("/src/data/heartwood/campaign.js")
  const rt = await import("/src/services/heartwood/runEngine.js")
  const TR = await import("/src/services/heartwood/tacticsRealMatchup.js")
  const { UNITS } = await import("/src/data/heartwood/units.js")
  const { levelOffers, nextPendingLevelUp } = await import("/src/services/heartwood/unitLevels.js")
  const res = { fails: [], n: 0 }
  const ok = (cond, label, data) => {
    res.n++
    if (!cond) res.fails.push(`${label}${data !== undefined ? " " + JSON.stringify(data).slice(0, 300) : ""}`)
  }
  const build = (run) => rt.startTacticsFormationBattle(run, (start) => TR.buildRunTacticsBattle(run, start))
  const fresh = (opts = {}) => CE.createCampaign({ commanderId: "tommy", difficulty: "normal", seed: 4242, ...opts })
  const passDays = (c, n) => {
    for (let i = 0; i < n; i++) c = CE.advanceDay(c)
    return c
  }
  // Simulates the end of a launched fight: `dead` = roster keys at 0 HP.
  const finish = (c, phase, dead = []) => {
    const b = c.activeMission.run.battle
    const keys = c.activeMission.run.deployed
    const enemy = b.units.find((u) => u.side === "enemy")
    const units = b.units.map((u) => {
      const k = keys.find((key, i) => u.id === `player-${c.activeMission.run.bench.find((h) => h.key === key).defId}-${i}`)
      if (k != null && dead.includes(k)) return { ...u, hp: 0, lastHitBy: enemy.id }
      if (u.side === "enemy" && phase === "won") return { ...u, hp: 0 }
      return u
    })
    return CE.updateMissionBattle(c, { ...b, units, phase })
  }

  // ===== 1. CREATE =====
  const c0 = fresh()
  ok(c0.roster.length === D.START_ROSTER, "C1 starts with 6 heroes", c0.roster.length)
  ok(new Set(c0.roster.map((h) => UNITS[h.defId].classId)).size === c0.roster.length, "C2 starting heroes have distinct classes")
  ok(c0.roster.every((h) => h.name && Array.isArray(h.heroTraits) && h.identity?.quirks), "C3 heroes have names, traits, quirks")
  ok(JSON.stringify(fresh()) === JSON.stringify(c0), "C4 same seed = same campaign")
  ok(JSON.stringify(fresh({ seed: 9 }).roster) !== JSON.stringify(c0.roster), "C5 another seed = another start")
  ok(c0.day === 1 && c0.doom === 0 && c0.status === "active" && c0.essence === D.CAMPAIGN_DIFFICULTIES.normal.startEssence, "C6 day 1, doom 0, start essence")
  ok(c0.missions.length >= 2 && c0.missions.every((m) => CE.regionOpen(c0, m.regionId)), "C7 opening missions sit in open regions", c0.missions.map((m) => m.regionId))
  ok(c0.missions.every((m) => rt.RUN_PATH[m.nodeIndex] && m.expiresDay > c0.day && m.reward?.essence > 0), "C8 missions have a real node, expiry and reward")
  ok(CE.createCampaign({ difficulty: "hard", seed: 1 }).essence < CE.createCampaign({ difficulty: "story", seed: 1 }).essence, "C9 difficulty changes the start")
  ok(CE.createCampaign({ commanderId: "aatos", seed: 1 }).commanderId === "aatos", "C10 commander choice kept")
  ok(CE.createCampaign({ seed: 1, unlocks: ["start:seasoned"] }).roster.every((h) => h.xp >= 6), "C11 seasoned-start unlock = Lv2 heroes")
  ok(!CE.campaignCommanderIds([], []).includes("kaski") && CE.campaignCommanderIds([], ["commander:kaski"]).includes("kaski"), "C12 campaign unlocks add commanders")

  // ===== 2. DOOM + REGIONS OVER DAYS =====
  const open0 = c0.regions.filter((r) => CE.regionOpen(c0, r.id))
  const c5 = passDays(c0, 5)
  ok(c5.day === 6, "D1 five days pass", c5.day)
  ok(open0.every((r) => c5.regions.find((x) => x.id === r.id).threat > r.threat), "D2 open regions' threat rises")
  ok(c0.regions.filter((r) => !CE.regionOpen(c0, r.id)).every((r) => c5.regions.find((x) => x.id === r.id).threat === r.threat), "D3 regions not reached yet stay quiet")
  let cf = { ...c0, regions: c0.regions.map((r) => (r.id === "outer-grove" ? { ...r, threat: 99.5 } : r)) }
  const bonusBefore = CE.campaignThreatBonus(cf)
  cf = CE.advanceDay(cf)
  ok(cf.regions.find((r) => r.id === "outer-grove").fallen, "D4 a region at 100 falls")
  ok(cf.doom === D.DOOM_PER_FALL, "D5 a fall raises doom", cf.doom)
  ok(CE.campaignThreatBonus(cf) >= bonusBefore + D.FALLEN_ENEMY_BONUS, "D6 a fall raises the enemy difficulty bonus", [bonusBefore, CE.campaignThreatBonus(cf)])
  ok(!cf.missions.some((m) => m.regionId === "outer-grove" && m.type !== "retake"), "D7 a fallen region's missions are gone")
  ok(cf.lastDayReport.lines.some((l) => /FALLEN/.test(l)), "D8 the day report says it fell")
  // The campaign bonus reaches the real DifficultyEngine score.
  const m0 = c0.missions[0]
  const runA = CE.missionRunState(c0, m0.id, [])
  const runB = CE.missionRunState({ ...c0, regions: c0.regions.map((r, i) => (i < 3 ? { ...r, fallen: true } : r)), doom: 12 }, m0.id, [])
  ok(TR.difficultyForRunNode(runB).score > TR.difficultyForRunNode(runA).score, "D9 fallen regions + doom = higher threat score", [TR.difficultyForRunNode(runA).score, TR.difficultyForRunNode(runB).score])
  ok(TR.difficultyForRunNode({ ...runA, campaignThreat: 0 }).score === TR.difficultyForRunNode({ ...runA, campaignThreat: undefined }).score, "D10 an Expedition run (no campaignThreat) is unchanged")
  // Doom ticks on its own; doom max = game over.
  const cd = passDays({ ...c0, regions: c0.regions.map((r) => ({ ...r, threat: 0 })) }, D.DOOM_EVERY_DAYS)
  ok(cd.doom >= 1, "D11 doom ticks up on its own", cd.doom)
  const cdm = CE.advanceDay({ ...c0, doom: CE.doomMax(c0) - 1, day: D.DOOM_EVERY_DAYS - 1 })
  ok(cdm.status === "lost" && /doom/i.test(cdm.lostReason), "D12 a full doom clock loses the campaign", cdm.lostReason)

  // ===== 3. MISSION EXPIRY =====
  const mx = c0.missions[0]
  const withM = { ...c0, regions: c0.regions.map((r) => ({ ...r, threat: 10 })) }
  const without = { ...withM, missions: withM.missions.filter((m) => m.id !== mx.id) }
  const days = mx.expiresDay - c0.day + 1
  const a = passDays(withM, days)
  const b = passDays(without, days)
  ok(!a.missions.some((m) => m.id === mx.id), "E1 a mission is gone after its expiry day")
  const ta = a.regions.find((r) => r.id === mx.regionId).threat
  const tb = b.regions.find((r) => r.id === mx.regionId).threat
  ok(Math.round(ta - tb) === D.IGNORED_THREAT, "E2 an ignored mission adds threat to its region", [ta, tb])
  ok(a.lastDayReport && passDays(withM, days - 1).missions.some((m) => m.id === mx.id), "E3 still there on its last day")

  // ===== 4. MISSION FLOW (real bridge) + FATIGUE + HEALING =====
  const squad = c0.roster.slice(0, 4).map((h) => h.key)
  ok(CE.squadBlocker(c0, mx.id, squad.slice(0, 3)) != null, "F1 fewer than 4 heroes is blocked")
  ok(CE.squadBlocker(c0, mx.id, c0.roster.map((h) => h.key)) == null, "F2 six heroes is fine")
  const launched = CE.launchMission(c0, mx.id, squad, build)
  const bt = launched.activeMission?.run?.battle
  ok(bt?.engine === "tactics", "F3 the mission is a real tactics fight", bt?.engine)
  ok(bt && bt.units.filter((u) => u.side === "player" && !u.npc && u.id !== "player-commander").length === 4 && bt.units.some((u) => u.id === "player-commander"), "F4 4 heroes + the Commander deploy")
  const six = CE.launchMission(c0, mx.id, c0.roster.map((h) => h.key), build).activeMission?.run?.battle
  ok(six && six.units.filter((u) => u.side === "player" && u.id.startsWith("player-") && u.id !== "player-commander" && !u.npc).length === 6, "F5 a 6-hero squad deploys all six")
  ok(launched.activeMission.run.bench.every((h) => h.name && h.identity), "F6 heroes keep their identity in the fight")
  const won = CE.resolveMission(finish(launched, "won"))
  ok(won.day === c0.day + 1, "F7 the mission takes a day", won.day)
  ok(!won.missions.some((m) => m.id === mx.id) && won.stats.missionsWon === 1, "F8 a won mission is done")
  ok(won.essence >= c0.essence + mx.reward.essence, "F9 the reward is paid", [c0.essence, won.essence, mx.reward.essence])
  ok(won.lastAftermath?.outcome === "won" && won.lastAftermath.deaths.length === 0, "F10 aftermath: won, nobody died")
  const fought = won.roster.filter((h) => squad.includes(h.key))
  ok(fought.every((h) => CE.heroBlocker(won, h)?.startsWith("Tired")), "F11 heroes who fought are Tired", fought.map((h) => CE.heroBlocker(won, h)))
  ok(won.roster.filter((h) => !squad.includes(h.key)).every((h) => !CE.heroBlocker(won, h)), "F12 the rest are ready")
  ok(fought.every((h) => h.missions === 1 && (h.xp || 0) > 0), "F13 survivors gain XP + a mission", fought.map((h) => [h.missions, h.xp]))
  const rested = passDays(won, D.TIRED_DAYS)
  ok(rested.roster.every((h) => !CE.heroBlocker(rested, h) || /Wounded/.test(CE.heroBlocker(rested, h))), "F14 Tired wears off after 2 days", rested.roster.map((h) => CE.heroBlocker(rested, h)))
  const reg = (c) => c.regions.find((r) => r.id === mx.regionId).threat
  ok(reg(won) < reg(c0), "F15 a win pushes the region's threat down", [reg(c0), reg(won)])
  // Healing.
  const hurt = { ...c0, roster: c0.roster.map((h, i) => (i === 0 ? { ...h, hpPct: 0.2 } : h)) }
  ok(/Wounded/.test(CE.heroBlocker(hurt, hurt.roster[0]) || ""), "H1 a badly hurt hero is Wounded")
  const need = CE.daysToHeal(hurt, hurt.roster[0])
  ok(need >= 2, "H2 healing takes days", need)
  const healed = passDays(hurt, need)
  ok(!CE.heroBlocker(healed, healed.roster[0]), "H3 after those days they can go again")
  const withInf = { ...hurt, hearth: { ...hurt.hearth, rooms: { ...hurt.hearth.rooms, infirmary: 2 } } }
  ok(CE.daysToHeal(withInf, withInf.roster[0]) < need, "H4 the Infirmary heals faster", [need, CE.daysToHeal(withInf, withInf.roster[0])])
  // Training Hall: resting heroes learn.
  const trained = CE.advanceDay({ ...c0, hearth: { ...c0.hearth, rooms: { ...c0.hearth.rooms, training: 2 } } })
  ok(trained.roster.every((h) => h.xp === 2), "H5 the Training Hall gives resting heroes XP", trained.roster.map((h) => h.xp))

  // ===== 5. PERMADEATH + MEMORIAL =====
  const victim = squad[1]
  const died = CE.resolveMission(finish(launched, "won", [victim]))
  ok(!died.roster.some((h) => h.key === victim), "P1 a hero at 0 HP is gone from the roster")
  const stone = died.memorial.find((m) => m.key === victim)
  ok(stone && stone.name && stone.defId && stone.classId && stone.daysServed >= 1 && typeof stone.kills === "number" && /Fell to/.test(stone.cause), "P2 the Memorial remembers them", stone)
  ok(died.lastAftermath.deaths.length === 1 && died.lastAftermath.deaths[0].key === victim, "P3 the aftermath lists the death")
  ok(died.status === "active" && died.stats.heroesLost === 1, "P4 the campaign goes on")
  ok(!died.lastAftermath.lines.some((l) => /fell and is Wounded/.test(l)), "P5 no 'Wounded' line for the dead")
  // Gear on the fallen comes home to the armoury.
  const geared = { ...launched, items: [{ key: 900, defId: Object.keys((await import("/src/data/heartwood/items.js")).ITEMS)[0], equippedTo: victim, slotIndex: 0 }], itemKeyCounter: 901 }
  const gearRun = { ...geared, activeMission: { ...geared.activeMission, run: { ...geared.activeMission.run, items: geared.items, itemKeyCounter: 901 } } }
  const g2 = CE.resolveMission(finish(gearRun, "won", [victim]))
  ok(g2.items.some((it) => it.key === 900 && it.equippedTo == null), "P6 the fallen hero's gear returns to the armoury")

  // ===== 6. SQUAD WIPE CONTINUES =====
  const wiped = CE.resolveMission(finish(launched, "lost", squad))
  ok(wiped.status === "active", "W1 a squad wipe is not game over")
  ok(wiped.roster.length === c0.roster.length - 4 && wiped.memorial.length === 4, "W2 all four are dead")
  ok(wiped.doom >= D.DOOM_PER_WIPE, "W3 a wipe raises doom", wiped.doom)
  const rookies = wiped.recruitOffers.filter((o) => o.rookie && o.cost === 0)
  ok(rookies.length === D.ROOKIE_OFFERS_ON_WIPE, "W4 free rookie offers appear", wiped.recruitOffers)
  const took = CE.recruitHero(wiped, rookies[0].id)
  ok(took.roster.length === wiped.roster.length + 1 && took.essence === wiped.essence, "W5 a rookie joins for free")
  ok(wiped.missions.some((m) => m.id === mx.id) === false && wiped.lastAftermath.outcome === "lost" && wiped.lastAftermath.wipe, "W6 the mission failed, aftermath says wipe")
  ok(CE.rollRecruitOffers(wiped).recruitOffers.filter((o) => o.rookie).length === D.ROOKIE_OFFERS_ON_WIPE, "W8 free rookies wait through the next recruit visit")
  // Retreat: survivors live, the mission fails.
  const fled = CE.resolveMission(finish(launched, "player", [victim]), { retreat: true })
  ok(fled.roster.length === c0.roster.length - 1 && fled.lastAftermath.outcome === "retreat" && fled.stats.missionsLost === 1, "W7 a retreat keeps the living, loses the mission")

  // ===== 7. HEARTH FALLS = GAME OVER =====
  const home = CE.advanceDay({ ...c0, regions: c0.regions.map((r) => (r.id === "hearthstead" ? { ...r, threat: 99.9 } : r)) })
  ok(home.status === "lost" && /Hearthstead/.test(home.lostReason), "G1 the Hearthstead falling ends the campaign", home.lostReason)
  ok(CE.advanceDay(home).day === home.day, "G2 a lost campaign stops")
  ok(CE.squadBlocker(home, home.missions[0]?.id ?? -1, squad) != null, "G3 no missions after the end")

  // ===== 8. ROOM BUILDING =====
  const rich = { ...c0, essence: 2000, leyShards: 5 }
  const cost = CE.buildCost(rich, "barracks")
  const building = CE.startBuild(rich, "barracks")
  ok(building.essence === rich.essence - cost.essence && building.hearth.building?.roomId === "barracks", "R1 a build costs Essence and starts")
  ok(CE.buildBlocker(building, "infirmary") === "The builders are busy.", "R2 one build at a time")
  ok(CE.rosterCap(passDays(building, cost.days - 1)) === 8, "R3 not done before its days", cost.days)
  const built = passDays(building, cost.days)
  ok(CE.roomLevel(built, "barracks") === 1 && CE.rosterCap(built) === 12 && !built.hearth.building, "R4 done after its days: 12 bunks")
  ok(built.log.some((l) => /Barracks Level 1/.test(l)), "R5 the day report says so")
  ok(CE.buildBlocker({ ...c0, essence: 0 }, "barracks") != null, "R6 can't build without Essence")
  ok(CE.buildBlocker({ ...c0, essence: 9999, leyShards: 0 }, "leywell") != null, "R7 the Ley Well needs Ley Shards")
  // Ley Well + attune deepen every hero's mana pool in the real fight.
  const well = { ...c0, hearth: { ...c0.hearth, rooms: { ...c0.hearth.rooms, leywell: 1 } } }
  const manaOf = (c) => {
    const bb = CE.launchMission(c, mx.id, squad, build).activeMission.run.battle
    return bb.units.find((u) => u.id.startsWith("player-") && u.id !== "player-commander" && u.manaMax > 0 && !u.reagents)
  }
  const base = manaOf(c0)
  const deep = manaOf(well)
  ok(base && deep && deep.manaMax === base.manaMax + D.LEY_WELL_MANA[1], "R8 the Ley Well deepens the mana pool in battle", [base?.manaMax, deep?.manaMax])
  const att = CE.attuneHero({ ...c0, leyShards: 2 }, c0.roster[0].key)
  ok(att.roster[0].attune === 1 && att.leyShards === 1 && CE.heroManaBonus(att, att.roster[0]) === D.ATTUNE_MANA, "R9 attuning spends a shard for +mana")
  // A Ley Site mission starts overcharged.
  const ley = CE.missionRunState({ ...c0, missions: [{ ...mx, type: "ley" }] }, mx.id, squad)
  ok(ley.campOvercharge >= D.LEY_MISSION_OVERCHARGE, "R10 a Ley Site fight starts with Overcharge", ley.campOvercharge)

  // ===== 9. RECRUITING =====
  const offer = c0.recruitOffers[0]
  ok(c0.recruitOffers.length === D.RECRUIT_OFFER_COUNT[0] && offer.cost === CE.recruitCost(c0), "Q1 recruits are on offer at a price")
  const hired = CE.recruitHero(c0, offer.id)
  ok(hired.roster.length === 7 && hired.essence === c0.essence - offer.cost && hired.roster[6].defId === offer.defId && hired.roster[6].name, "Q2 recruiting adds a named hero for Essence")
  ok(!hired.recruitOffers.some((o) => o.id === offer.id), "Q3 the offer is used up")
  const full = { ...c0, roster: [...c0.roster, ...c0.roster.map((h) => ({ ...h, key: h.key + 100 }))] }
  ok(CE.recruitBlocker(full, offer.id) === "The Barracks are full.", "Q4 a full Barracks blocks recruiting")
  const later = passDays(c0, 7)
  ok(later.recruitOffers.some((o) => !c0.recruitOffers.some((x) => x.id === o.id)), "Q5 new recruits come by over time")
  ok(UNITS[hired.roster[6].defId].classId && hired.roster[6].heroTraits.length >= 1 && hired.roster[6].identity.quirks.length >= 1, "Q6 recruits have a class, traits and quirks")

  // ===== 10. STORY + CHAPTERS =====
  const ready = CE.spawnMissions({ ...c0, chapterWins: D.STORY_AFTER_WINS }, 0)
  const story = ready.missions.find((m) => m.type === "story")
  ok(story && story.expiresDay == null && CE.regionOpen(ready, story.regionId), "S1 a story mission appears after enough wins and never expires", story)
  const sl = CE.launchMission(ready, story.id, squad, build)
  const ch2 = CE.resolveMission(finish(sl, "won"))
  ok(ch2.chapter === 2 && ch2.chapterWins === 0, "S2 winning the story mission opens chapter 2", ch2.chapter)
  ok(ch2.regions.filter((r) => CE.regionOpen(ch2, r.id)).length > ready.regions.filter((r) => CE.regionOpen(ready, r.id)).length, "S3 new regions open up")
  ok(ch2.relics.length === 1 || story.reward.relic == null, "S4 a story win brings a relic")
  const last = { ...ready, chapter: D.MAX_CHAPTER, missions: [{ ...story, chapter: D.MAX_CHAPTER }] }
  const fin = CE.resolveMission(finish(CE.launchMission(last, story.id, squad, build), "won"))
  ok(fin.status === "won", "S5 winning the last chapter wins the campaign", fin.status)
  const ch3 = CE.resolveMission(finish(CE.launchMission({ ...ready, chapter: 2 }, story.id, squad, build), "won"))
  ok(ch3.unlocks.includes("commander:kaski"), "S7 reaching chapter 3 unlocks a commander", ch3.unlocks)

  // ===== 11. LEVEL-UPS + GEAR through the run's own helpers =====
  const lv = { ...c0, roster: c0.roster.map((h, i) => (i === 0 ? { ...h, xp: 7 } : h)) }
  const subj = nextPendingLevelUp(CE.campaignRunView(lv))
  ok(subj && subj.key === lv.roster[0].key, "L1 a level-up is pending for the hero")
  const offerId = levelOffers(CE.campaignRunView(lv), subj)[0]
  const leveled = CE.campaignChooseLevelPerk(lv, subj.key, offerId)
  ok(!nextPendingLevelUp(CE.campaignRunView(leveled)), "L2 picking it settles the level-up")
  const { ITEMS } = await import("/src/data/heartwood/items.js")
  const itemId = Object.values(ITEMS).find((i) => i.kind !== "collar" && !i.noShop).id
  const bag = { ...c0, items: [{ key: 1, defId: itemId, equippedTo: null, slotIndex: null }], itemKeyCounter: 2 }
  const eq = CE.campaignEquip(bag, 1, c0.roster[0].key, 0)
  ok(eq.items[0].equippedTo === c0.roster[0].key, "L3 gear can be equipped from the armoury")
  ok(CE.campaignUnequip(eq, 1).items[0].equippedTo == null, "L4 and taken off")

  // ===== 12. SAVE ROUND-TRIP =====
  const mid = launched
  const rtc = CE.deserializeCampaign(JSON.parse(JSON.stringify(CE.serializeCampaign(mid))))
  ok(JSON.stringify(rtc) === JSON.stringify(mid), "V1 a mid-fight campaign survives save + load")
  const late = passDays(died, 3)
  ok(JSON.stringify(CE.deserializeCampaign(JSON.parse(JSON.stringify(CE.serializeCampaign(late))))) === JSON.stringify(late), "V2 a later campaign (memorial, fatigue) round-trips")
  ok(CE.deserializeCampaign({ version: 999, campaign: mid }) === null && CE.deserializeCampaign({ version: D.CAMPAIGN_VERSION, campaign: { ...mid, commanderId: "nobody" } }) === null && CE.deserializeCampaign(null) === null, "V3 bad saves load as nothing")
  ok(D.CAMPAIGN_SAVE_KEY === "heartwood-campaign-save-v1" && D.CAMPAIGN_SAVE_KEY !== "heartwood-run-save-v1", "V4 its own save key")
  // The Expedition run is untouched.
  const run = rt.startRun("tommy", null, { forcedSeed: 5 })
  ok(run.phase === "shop" && run.campaignThreat === undefined, "V5 a normal run has no campaign fields")
  return res
})
out.n += logic.n
out.fails.push(...logic.fails)

// ---------------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------------
await page.evaluate(() => {
  localStorage.setItem("heartwood-autobattler-intro-seen", "1")
  localStorage.setItem("heartwood-story-intro-seen", "1")
  localStorage.removeItem("heartwood-campaign-save-v1")
  localStorage.removeItem("heartwood-play-mode")
})
await page.reload({ waitUntil: "domcontentloaded" })
await page.waitForTimeout(800)
ok((await page.locator(".hw-commander-card").count()) > 0, "U1 the Expedition commander select still shows")
ok((await page.locator("[data-campaign-open]").count()) === 1, "U2 the menu offers the Long Campaign")
await page.click("[data-campaign-open]")
await page.waitForSelector("[data-screen='campaign-start']")
await page.click("[data-campaign-difficulty='hard']")
await page.click("[data-campaign-begin]")
await page.waitForSelector("[data-campaign-world-map]")
ok((await page.locator(".hwc-region").count()) === 7, "U3 the world map shows 7 regions")
ok((await page.locator(".hwc-pin").count()) >= 2, "U4 mission pins on the map")
ok((await page.locator("[data-campaign-doom]").count()) === 1, "U5 the doom dial shows")
const save1 = await page.evaluate(() => JSON.parse(localStorage.getItem("heartwood-campaign-save-v1")))
ok(save1?.campaign?.difficulty === "hard" && save1.campaign.day === 1, "U6 the campaign autosaves (hard, day 1)")
await page.locator(".hwc-mission-row").first().click()
await page.waitForSelector("[data-campaign-mission-detail]")
await page.screenshot({ path: `${SHOTS}/campaign_world_map.png` })
await page.click("[data-campaign-pass-day]")
await page.waitForTimeout(200)
ok((await page.locator(".hwc-day").innerText()) === "Day 2", "U7 Next day advances the day")
ok((await page.locator("[data-campaign-day-report]").count()) === 1, "U8 the day report shows")

// Hearth rooms.
await page.click("[data-campaign-hearth]")
await page.waitForSelector("[data-campaign-rooms]")
ok((await page.locator(".hwc-room").count()) === 5, "U9 five rooms at the Hearth")
await page.click("[data-campaign-build='barracks']")
await page.waitForTimeout(150)
ok((await page.locator(".hwc-room[data-room='barracks'][data-building]").count()) === 1, "U10 building shows progress")
await page.screenshot({ path: `${SHOTS}/campaign_hearth_rooms.png` })
await page.click("[data-campaign-tab='recruit']")
ok((await page.locator("[data-campaign-recruit]").count()) >= 2, "U11 recruit offers show")
await page.click("[data-campaign-back-to-map]")

// Squad select -> a real fight.
await page.goto(`http://localhost:${PORT}/heartwood?debugLowHp=1&rolls=0`, { waitUntil: "domcontentloaded" })
await page.waitForSelector("[data-campaign-world-map]")
await page.locator(".hwc-mission-row").first().click()
await page.click("[data-campaign-assemble]")
await page.waitForSelector("[data-screen='campaign-squad']")
const heroes = page.locator("[data-campaign-hero]:not([data-blocked])")
ok((await heroes.count()) === 6, "U12 six ready heroes to choose from", await heroes.count())
ok(await page.locator("[data-campaign-launch]").isDisabled(), "U13 launch is locked until 4 are chosen")
for (let i = 0; i < 4; i++) await heroes.nth(i).locator(".hw-card").first().click()
await page.waitForTimeout(100)
ok((await page.locator("[data-campaign-squad-count]").getAttribute("data-campaign-squad-count")) === "4", "U14 four chosen")
await page.screenshot({ path: `${SHOTS}/campaign_squad_select.png` })
await page.click("[data-campaign-launch]")
await page.waitForSelector("[data-campaign-fight]", { timeout: 8000 }).catch(() => {})
ok((await page.locator("[data-campaign-fight] .hwt-board").count()) === 1, "U15 the mission opens the real tactics board")
ok((await page.locator('.hwt-token[data-side="player"]').count()) === 5, "U16 four heroes + the Commander on the board", await page.locator('.hwt-token[data-side="player"]').count())
const boardNames = await page.locator('.hwt-token[data-side="player"] .hwt-token-name').allInnerTexts()
const rosterNames = await page.evaluate(() => JSON.parse(localStorage.getItem("heartwood-campaign-save-v1")).campaign.roster.map((h) => h.name))
ok(boardNames.filter((n) => rosterNames.includes(n)).length === 4, "U16b heroes fight under their own names", boardNames)
ok((await page.locator("[data-campaign-retreat]").count()) === 1, "U17 Retreat is offered (Hard allows it)")
await page.reload({ waitUntil: "domcontentloaded" })
await page.waitForSelector("[data-campaign-fight]", { timeout: 8000 }).catch(() => {})
ok((await page.locator("[data-campaign-fight] .hwt-board").count()) === 1, "U18 a reload resumes the fight")
const begin = page.locator(".hwt-begin-battle")
if (await begin.count()) await begin.click()
await page.waitForTimeout(300)
await page.screenshot({ path: `${SHOTS}/campaign_mission_fight.png` })
let phase = "player"
// Every hero acts each turn (one hero alone can't clear a 4-6 enemy mission
// in 20 turns - the old single-token bot made U19 flaky).
for (let turns = 0; phase !== "won" && phase !== "lost" && turns < 20; turns++) {
  const heroCount = await page.locator('.hwt-token[data-side="player"]').count()
  for (let h = 0; h < heroCount; h++) {
    await page.locator('.hwt-token[data-side="player"]').nth(h).click({ force: true }).catch(() => {})
    await page.waitForTimeout(80)
    let targets = page.locator('.hwt-cell[data-targetable="true"]')
    if ((await targets.count()) === 0) {
      const reach = page.locator('.hwt-cell[data-reachable="true"]')
      if ((await reach.count()) > 0) {
        await reach.first().click().catch(() => {})
        await page.waitForTimeout(80)
      }
    }
    targets = page.locator('.hwt-cell[data-targetable="true"]')
    if ((await targets.count()) > 0) {
      await targets.first().click().catch(() => {})
      await page.waitForTimeout(100)
    }
    if ((await page.locator(".hwt-turn-label").getAttribute("data-phase").catch(() => null)) === "won") break
  }
  await page.locator(".hwt-end-turn").click().catch(() => {})
  await page.waitForTimeout(350)
  phase = await page.locator(".hwt-turn-label").getAttribute("data-phase").catch(() => null)
}
ok(phase === "won", "U19 the mission fight can be won", phase)
if (phase === "won") {
  await page.click("[data-campaign-continue]")
  await page.waitForSelector("[data-screen='campaign-aftermath']")
  ok((await page.locator("[data-screen='campaign-aftermath'][data-outcome='won']").count()) === 1, "U20 aftermath after a real win")
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem("heartwood-campaign-save-v1")).campaign)
  ok(after.day === 3 && after.stats.missionsWon === 1 && after.roster.filter((h) => h.tiredUntil > after.day).length === 4, "U21 the real win counts: day 3, 4 heroes Tired", [after.day, after.stats])
  await page.click("[data-campaign-aftermath-continue]")
  await page.waitForTimeout(200)
}

// Aftermath with a death (state injected: one hero at 0 HP in a won fight).
await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
await page.waitForTimeout(400)
await page.evaluate(async () => {
  const CE = await import("/src/services/heartwood/campaignEngine.js")
  const rt = await import("/src/services/heartwood/runEngine.js")
  const TR = await import("/src/services/heartwood/tacticsRealMatchup.js")
  let c = CE.loadCampaign()
  // Level-ups would show first - settle them out of the way for this check.
  c = { ...c, roster: c.roster.map((h) => ({ ...h, xp: 0 })) }
  const m = c.missions[0]
  c = { ...c, activeMission: null }
  const keys = c.roster.filter((h) => !CE.heroBlocker(c, h)).slice(0, CE.squadLimits(c).min).map((h) => h.key)
  window.__why = CE.squadBlocker(c, m.id, keys) + " day" + c.day + " " + JSON.stringify(c.roster.map((h) => CE.heroBlocker(c, h)))
  c = CE.launchMission(c, m.id, keys, (run) => rt.startTacticsFormationBattle(run, (start) => TR.buildRunTacticsBattle(run, start)))
  if (!c.activeMission) return
  const b = c.activeMission.run.battle
  const victim = c.activeMission.run.bench[0]
  const units = b.units.map((u) => (u.id === `player-${victim.defId}-0` ? { ...u, hp: 0, lastHitBy: b.units.find((x) => x.side === "enemy").id } : u.side === "enemy" ? { ...u, hp: 0 } : u))
  c = CE.updateMissionBattle(c, { ...b, units, phase: "won" })
  CE.saveCampaign(c)
  window.__victim = victim.name
})
const victimName = await page.evaluate(() => window.__victim)
if (!victimName) console.log("inject failed:", await page.evaluate(() => window.__why))
await page.reload({ waitUntil: "domcontentloaded" })
await page.waitForSelector("[data-campaign-continue]", { timeout: 8000 }).catch(() => {})
await page.click("[data-campaign-continue]")
await page.waitForSelector("[data-campaign-fallen]", { timeout: 5000 }).catch(() => {})
ok((await page.locator("[data-campaign-fallen]").count()) === 1, "U22 the sombre fallen callout shows")
ok((await page.locator("[data-campaign-fallen]").innerText()).includes(victimName), "U23 it names the fallen hero", victimName)
await page.waitForTimeout(1500)
await page.screenshot({ path: `${SHOTS}/campaign_aftermath_death.png` })
await page.click("[data-campaign-aftermath-continue]")
await page.click("[data-campaign-hearth]")
await page.click("[data-campaign-tab='memorial']")
ok((await page.locator("[data-campaign-memorial]").innerText()).includes(victimName), "U24 the Memorial remembers them")
await page.screenshot({ path: `${SHOTS}/campaign_memorial.png` })

// Back to the Expedition: the menu still works and the mode is remembered.
await page.click("[data-campaign-back-to-map]")
await page.locator(".hwc-topbar-actions button", { hasText: "Menu" }).click()
await page.waitForTimeout(300)
ok((await page.locator(".hw-commander-card").count()) > 0, "U25 back to the Expedition menu")
ok((await page.evaluate(() => localStorage.getItem("heartwood-campaign-save-v1"))) != null, "U26 leaving keeps the campaign save")

ok(errs.length === 0, "U27 no page errors", errs)
await browser.close()
console.log(`verify_campaign: ${out.n - out.fails.length}/${out.n} passed`)
if (out.fails.length) {
  console.log("FAILS:\n" + out.fails.join("\n"))
  process.exitCode = 1
}
