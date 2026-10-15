// The Long Campaign, part 2 - the branching story (data/heartwood/
// campaignStory.js, services/heartwood/campaignStoryEngine.js, the hooks
// in campaignEngine.js, components/heartwood/campaign/CampaignStoryScene.jsx
// + the Chronicle tab + map marks).
// Part 1 = pure-engine checks, straight in node (memory-tight machine):
//   `ENGINE_ONLY=1 node .scratch/verify_campaign_story.mjs`
// Part 2 = a few UI checks + screenshots (vite on PORT, default 5451):
//   `PORT=5451 node .scratch/verify_campaign_story.mjs`
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
const PORT = process.env.PORT || 5451
const SHOTS = process.env.SHOTS || ".scratch/shots"
const out = { fails: [], n: 0 }
const ok = (cond, label, data) => {
  out.n++
  if (!cond) out.fails.push(`${label}${data !== undefined ? " " + JSON.stringify(data).slice(0, 300) : ""}`)
}

// ---------------------------------------------------------------------------
// PART 1 - pure engine (node)
// ---------------------------------------------------------------------------
const CE = await import(`${SRC}campaignEngine.js`)
const SE = await import(`${SRC}campaignStoryEngine.js`)
const SD = await import(`${DATA}campaignStory.js`)
const D = await import(`${DATA}campaign.js`)
const rt = await import(`${SRC}runEngine.js`)
const TR = await import(`${SRC}tacticsRealMatchup.js`)
const MU = await import(`${SRC}mutations.js`)
const { UNITS } = await import(`${DATA}units.js`)
const { ENEMIES } = await import(`${DATA}enemies.js`)
const { RELICS } = await import(`${DATA}relics.js`)
const { CHARACTERS } = await import(`${DATA}characters.js`)

const build = (run) => rt.startTacticsFormationBattle(run, (start) => TR.buildRunTacticsBattle(run, start))
const fresh = (opts = {}) => CE.createCampaign({ commanderId: "tommy", difficulty: "normal", seed: 4242, ...opts })
const passDays = (c, n) => {
  for (let i = 0; i < n; i++) c = CE.advanceDay(c)
  return c
}
const rested = (c) => ({ ...c, roster: c.roster.map((h) => ({ ...h, tiredUntil: 0, hpPct: 1 })) })
// Wins a mission without fighting it (an empty "won" battle) - the story
// path checks need many wins, not real fights.
const quickWin = (c0, missionId) => {
  const c = rested(c0)
  const keys = c.roster.slice(0, 4).map((h) => h.key)
  const run = CE.missionRunState(c, missionId, keys)
  return CE.resolveMission({ ...c, activeMission: { missionId, squadKeys: keys, run: { ...run, battle: { engine: "tactics", phase: "won", units: [] } } } })
}
const storyMission = (c) => CE.spawnMissions({ ...c, chapterWins: 9 }, 0).missions.find((m) => m.type === "story")
const winStory = (c0) => {
  const c = CE.spawnMissions({ ...c0, chapterWins: 9 }, 0)
  const m = c.missions.find((x) => x.type === "story")
  return { ...quickWin(c, m.id), lastAftermath: null }
}
// Plays the whole story with these picks (one per chapter). Locked picks are skipped (null = first open).
const playPath = (picks, opts = {}) => {
  let c = fresh(opts)
  for (const p of picks) {
    c = winStory(c)
    const scene = c.story.pendingScene
    const open = SE.sceneOptions(c, scene).filter((o) => !o.blocked)
    c = CE.chooseStory(c, p && open.some((o) => o.id === p) ? p : open[0].id)
    c = CE.clearStoryResult(c)
  }
  return c
}

// ===== 1. THE GRAPH =====
const scenesFor = (ch) => SD.CHAPTER_SCENES[ch].map((x) => SD.STORY_SCENES[x.scene])
let graphOk = true
for (let ch = 1; ch <= 7; ch++) {
  const list = scenesFor(ch)
  if (!list.length || list.some((s) => !s || s.chapter !== ch)) graphOk = false
  for (const s of list) {
    const n = s.options.length
    if (!s.final && (n < 2 || n > 3)) graphOk = false
    if (!s.lines.length || s.options.some((o) => !o.label || !o.say || !o.stakes?.length || (!s.final && !o.result))) graphOk = false
  }
}
ok(graphOk, "G1 every chapter 1-7 has a choice scene; non-final scenes have 2-3 options with label, words, stakes and outcome")
const allOpts = Object.values(SD.STORY_SCENES).flatMap((s) => s.options)
const regionIds = D.CAMPAIGN_REGIONS.map((r) => r.id)
const badRefs = allOpts.filter((o) => {
  const e = o.effects || {}
  return (
    (e.hero && !UNITS[SD.UNIQUE_HEROES[e.hero]?.defId]) ||
    (e.relic && !RELICS[e.relic]) ||
    (e.nemesis && !SD.NEMESES[e.nemesis]) ||
    (e.endNemesis && !SD.NEMESES[e.endNemesis]) ||
    (e.ending && !SD.ENDINGS[e.ending]) ||
    Object.entries(e.regionMods || {}).some(([r, m]) => !regionIds.includes(r) || !SD.REGION_MODS[m]) ||
    Object.keys(e.threat || {}).some((r) => !regionIds.includes(r)) ||
    (e.open || []).some((r) => !regionIds.includes(r))
  )
})
ok(badRefs.length === 0, "G2 every effect points at a real hero / relic / nemesis / region / ending", badRefs.map((o) => o.id))
ok(Object.values(SD.NEMESES).every((n) => n.enemies.length === 7 && n.enemies.every((id) => ENEMIES[id])), "G3 every nemesis has a real enemy for each Act")
ok(Object.values(SD.FACTIONS).every((f) => UNITS[f.allyUnit] && SD.UNIQUE_HEROES[f.hero] && regionIds.includes(f.region)), "G4 every faction has a real ally unit, unique hero and home region")
ok(Object.values(SD.UNIQUE_HEROES).every((h) => UNITS[h.defId]?.classId), "G5 every unique hero is a real class hero")
const axes = new Set(allOpts.flatMap((o) => Object.keys(o.effects?.flags || {})))
ok(["herald", "ally", "ley", "void", "echo"].every((a) => axes.has(a)), "G6 five branch axes (herald mercy, ally faction, ley, void, echo)", [...axes])
ok(SD.ENDING_ORDER.length >= 4 && SD.ENDING_ORDER.every((id) => SD.ENDINGS[id].epilogue.length >= 3 && D.CAMPAIGN_UNLOCKS.some((u) => u.id === SD.ENDINGS[id].unlock)), "G7 4+ endings, each with an epilogue and an unlock")
ok(new Set(SD.ENDING_ORDER.map((id) => SD.ENDINGS[id].unlock)).size === SD.ENDING_ORDER.length, "G8 every ending unlocks something different")

// ===== 2. SCENE FLOW =====
const c0 = fresh()
ok(c0.story && c0.story.chronicle.length === 0 && !c0.story.pendingScene, "F1 a new campaign has an empty story")
const ch1 = winStory(c0)
ok(ch1.chapter === 2 && ch1.story.pendingScene === "rootkeeper-gate", "F2 winning Chapter 1's story mission opens its choice scene", ch1.story.pendingScene)
ok(CE.chooseStory(ch1, "nope") === ch1, "F3 an unknown option changes nothing")
const spared = CE.chooseStory(ch1, "spare")
ok(!spared.story.pendingScene && spared.story.flags.herald === "spared" && spared.story.chronicle.length === 1 && spared.story.chronicle[0].optionId === "spare", "F4 a choice sets its flag and is written in the chronicle")
ok(spared.story.lastResult?.optionId === "spare" && !CE.clearStoryResult(spared).story.lastResult, "F5 the outcome screen state is set, then cleared")
ok(SE.chronicleEntries(spared)[0].label === "Let her go" && SE.chronicleEntries(spared)[0].result.length > 20, "F6 the chronicle reads back the written choice + outcome")
const sameAgain = CE.chooseStory(winStory(fresh()), "spare")
ok(JSON.stringify(sameAgain) === JSON.stringify(spared), "F7 same seed + same choices = same campaign")

// ===== 3. FLAGS CHANGE WHAT COMES NEXT =====
const broken = CE.chooseStory(ch1, "break")
const captive = CE.chooseStory(ch1, "captive")
const t = (c) => SE.storyBeat(c)
ok(t(spared).title === "Heart of the Deepening" && t(broken).title === "The Herald's Ambush" && t(captive).title === "Maura's Hidden Way", "B1 Chapter 2 is a different chapter for each Chapter 1 choice", [t(spared).title, t(broken).title, t(captive).title])
ok(t(captive).region === "hollow-ley" && CE.regionOpen(captive, "hollow-ley") && !CE.regionOpen(spared, "hollow-ley"), "B2 taking Maura captive opens the Hollow Ley a chapter early")
const capStory = storyMission(CE.clearStoryResult(captive))
ok(capStory.regionId === "hollow-ley" && capStory.title === "Maura's Hidden Way", "B3 the story mission goes where the chapter variant says", [capStory.regionId, capStory.title])
ok(broken.essence === ch1.essence + 200 && broken.relics.includes("sundering-mark") && broken.doom === ch1.doom, "B4 breaking her staff pays Essence + a relic")
ok(captive.doom === Math.max(0, ch1.doom - 1), "B5 taking her captive lowers doom")
const ch3s = ["ember", "tide", "stone"].map((a) => SE.storyBeat({ ...spared, chapter: 3, story: { ...spared.story, flags: { ...spared.story.flags, ally: a } } }))
ok(new Set(ch3s.map((b) => b.title)).size === 3 && new Set(ch3s.map((b) => b.region)).size === 3, "B6 Chapter 3 differs by ally - title and region", ch3s.map((b) => b.title))
const reachA = SE.endingsInReach({ ley: "ward", void: "sunk", herald: "ally" })
const reachB = SE.endingsInReach({ ley: "drain", void: "carried", herald: "slain" })
ok(reachA.includes("rooted") && reachA.includes("peace") && !reachA.includes("hollow") && reachB.includes("hollow") && reachB.includes("ember") && !reachB.includes("rooted"), "B7 the flags open different endings", { reachA, reachB })

// ===== 4. ALLY FACTION =====
const ch2 = winStory(CE.clearStoryResult(spared))
ok(ch2.story.pendingScene === "elemental-schism", "A1 Chapter 2's scene is the elemental schism")
const ember = CE.chooseStory(ch2, "ember")
const hehku = ember.roster.find((h) => h.uniqueId === "hehku")
ok(hehku && hehku.name === "Hehku" && hehku.defId === SD.UNIQUE_HEROES.hehku.defId && ember.roster.length === ch2.roster.length + 1, "A2 the Ember Clans' Hehku joins the roster by name")
ok(SE.regionMod(ember, "emberwrack") === "allied" && SE.storyThreatMult(ember, "emberwrack") === 0.5, "A3 Emberwrack is Allied (threat x0.5)")
ok(ember.regions.find((r) => r.id === "mistfen").threat >= ch2.regions.find((r) => r.id === "mistfen").threat + 19 || ember.regions.find((r) => r.id === "mistfen").threat === 99, "A4 the snubbed Tide Folk: Mistfen threat +20")
const calm = (c) => ({ ...c, regions: c.regions.map((r) => ({ ...r, threat: 10 })), missions: [] })
const grow = (c, id) => CE.advanceDay(calm(c)).regions.find((r) => r.id === id).threat - 10
ok(Math.abs(grow(ember, "emberwrack") * 2 - grow(ch2, "emberwrack")) < 0.01, "A5 an Allied region's threat grows half as fast", [grow(ember, "emberwrack"), grow(ch2, "emberwrack")])
const tide = CE.chooseStory(ch2, "tide")
const stone = CE.chooseStory(ch2, "stone")
ok(tide.roster.some((h) => h.uniqueId === "merra") && stone.roster.some((h) => h.uniqueId === "kivi") && SE.regionMod(tide, "mistfen") === "allied" && SE.regionMod(stone, "deepening") === "allied", "A6 Tide -> Merra + Mistfen, Stone -> Kivi + the Deepening")
// The faction ally fights in a REAL fight (fate-ally mechanism).
const emberC = rested(CE.clearStoryResult(ember))
const eStory = storyMission(emberC)
const eLaunch = CE.launchMission(CE.spawnMissions({ ...emberC, chapterWins: 9 }, 0), eStory.id, emberC.roster.slice(0, 4).map((h) => h.key), build)
const allyU = eLaunch.activeMission?.run?.battle?.units?.find((u) => u.fateAlly)
ok(allyU && allyU.side === "player" && allyU.name === SD.FACTIONS.ember.allyName, "A7 an Ember-Clan Warrior fights beside you in the story mission", allyU?.name)
const inHome = { ...emberC, missions: [{ ...eStory, id: 900, type: "fight", regionId: "emberwrack" }] }
const inAway = { ...emberC, missions: [{ ...eStory, id: 900, type: "fight", regionId: "outer-grove" }] }
ok(SE.storyFates(inHome, inHome.missions[0]).some((f) => f.kind === "ally") && !SE.storyFates(inAway, inAway.missions[0]).some((f) => f.kind === "ally"), "A8 allies fight in their home region, not elsewhere")
let calls = 0
let cc = { ...emberC, regions: emberC.regions.map((r) => ({ ...r, threat: r.id === "emberwrack" ? 90 : 0 })) }
for (let i = 0; i < 40 && !calls; i++) {
  cc = CE.spawnMissions({ ...cc, missions: [], day: cc.day + 1 }, 3)
  calls += cc.missions.filter((m) => m.type === "allied").length
}
ok(calls > 0, "A9 the allies send Call to Arms missions from their region")

// ===== 5. NEMESIS =====
ok(broken.story.nemeses.some((n) => n.id === "herald" && !n.routed), "N1 breaking Maura's staff makes her your nemesis")
let hunted = CE.clearStoryResult(broken)
let huntM = null
for (let i = 0; i < 8 && !huntM; i++) {
  hunted = CE.advanceDay(hunted)
  huntM = hunted.missions.find((m) => m.type === "hunt")
}
ok(huntM && huntM.nemesisId === "herald" && /Maura/.test(huntM.title), "N2 a Hunted mission appears within days", huntM?.title)
ok(!CE.spawnMissions({ ...CE.clearStoryResult(spared), day: 30 }, 6).missions.some((m) => m.type === "hunt") && !passDays(CE.clearStoryResult(spared), 10).missions.some((m) => m.type === "hunt"), "N3 no hunters without a nemesis")
const hL = CE.launchMission(rested(hunted), huntM.id, hunted.roster.slice(0, 4).map((h) => h.key), build)
const rival = hL.activeMission?.run?.battle?.units?.find((u) => u.fateRival)
ok(rival && rival.side === "enemy" && rival.name === "Maura the Rot-Herald", "N4 Maura herself is in the Hunted fight (a stronger named enemy)", rival?.name)
ok(TR.difficultyForRunNode(CE.missionRunState(hunted, huntM.id, [])).score > TR.difficultyForRunNode({ ...CE.missionRunState(hunted, huntM.id, []), campaignThreat: CE.campaignThreatBonus(hunted) }).score, "N5 a Hunted mission is a harder fight")
const brokenStoryFates = SE.storyFates(CE.clearStoryResult(broken), storyMission(CE.clearStoryResult(broken)))
ok(brokenStoryFates.some((f) => f.kind === "rival" && f.rivalName === "Maura the Rot-Herald"), "N6 the nemesis also turns up at your story missions")
const beat1 = quickWin(hunted, huntM.id)
ok(beat1.story.nemeses.find((n) => n.id === "herald").beaten === 1 && !beat1.story.nemeses[0].routed && beat1.chapterWins === hunted.chapterWins, "N7 beating a hunt once: beaten back (and it doesn't count as a chapter win)")
const routed = SE.beatNemesis(beat1, "herald").c
ok(routed.story.nemeses.find((n) => n.id === "herald").routed && SE.activeNemeses(routed).length === 0, "N8 beaten twice: driven off")
const ignored = passDays(hunted, huntM.expiresDay - hunted.day + 1)
ok(ignored.doom >= hunted.doom + SD.HUNT_IGNORED_DOOM && ignored.log.some((l) => /struck/.test(l)), "N9 an ignored hunt strikes: Doom +1", [hunted.doom, ignored.doom])

// ===== 6. THE LEY (mana) =====
const ch3 = winStory(CE.clearStoryResult(ember))
ok(ch3.story.pendingScene === "ley-wound", "L1 Chapter 3's scene is the ley wound")
const ward = CE.chooseStory(ch3, "ward")
const drain = CE.chooseStory(ch3, "drain")
ok(ward.roster.some((h) => h.uniqueId === "saarni") && SE.regionMod(ward, "mistfen") === "warded" && SE.regionMod(ward, "hollow-ley") === "warded", "L2 Ward: Saarni joins, ley regions Warded")
ok(drain.leyShards === ch3.leyShards + 5 && drain.doom === ch3.doom + 3 && SE.regionMod(drain, "mistfen") === "drained" && drain.story.nemeses.some((n) => n.id === "wardens"), "L3 Drain: +5 shards, Doom +3, Mistfen Drained, the Wardens hunt you")
const anyM = CE.clearStoryResult(drain).missions[0] || storyMission(CE.clearStoryResult(drain))
const dc = { ...CE.clearStoryResult(drain), missions: [anyM] }
const wc = { ...CE.clearStoryResult(ward), missions: [anyM] }
ok(CE.missionRunState(dc, anyM.id, []).campOvercharge >= CE.missionRunState(wc, anyM.id, []).campOvercharge + SD.LEY_DRAIN_OVERCHARGE - D.LEY_REGION_OVERCHARGE, "L4 Drain: every fight starts Overcharged")
let leyInDrained = 0
let leyAnywhere = 0
let sc = { ...dc, regions: dc.regions.map((r) => ({ ...r, threat: r.id === "mistfen" ? 95 : 0 })) }
for (let i = 0; i < 40; i++) {
  sc = CE.spawnMissions({ ...sc, missions: [], day: sc.day + 1 }, 4)
  leyInDrained += sc.missions.filter((m) => m.type === "ley" && m.regionId === "mistfen").length
  leyAnywhere += sc.missions.filter((m) => m.type === "ley").length
}
ok(leyInDrained === 0, "L5 a Drained region has no more Ley Sites", leyInDrained)
const withLey = { ...ch3, missions: [...ch3.missions, { ...anyM, id: 991, type: "ley", regionId: "mistfen", expiresDay: ch3.day + 3 }] }
ok(!CE.chooseStory(withLey, "drain").missions.some((m) => m.type === "ley" && m.regionId === "mistfen") && CE.chooseStory(withLey, "ward").missions.some((m) => m.id === 991), "L5b draining dries up the Ley Sites already on the map there")
const leyW = CE.spawnMissions({ ...CE.clearStoryResult(ward), missions: [] }, 0)
const mkLey = (c) => {
  for (let i = 0; i < 60; i++) {
    c = CE.spawnMissions({ ...c, missions: [], day: c.day + 1, regions: c.regions.map((r) => ({ ...r, threat: r.id === "hollow-ley" ? 90 : 0 })) }, 4)
    const m = c.missions.find((x) => x.type === "ley" && x.regionId === "hollow-ley")
    if (m) return m
  }
  return null
}
const wLey = mkLey(leyW)
const nLey = mkLey({ ...leyW, story: { ...leyW.story, flags: { ...leyW.story.flags, ley: undefined } } })
ok(wLey && nLey && wLey.reward.leyShards === nLey.reward.leyShards + SD.LEY_WARD_SHARD_BONUS, "L6 Ward: Ley Sites pay +1 Ley Shard", [wLey?.reward, nLey?.reward])
ok(SE.storyFates({ ...leyW, missions: [wLey] }, wLey).some((f) => f.kind === "ally" && f.allyName === "Ley Warden"), "L7 Ward: a Ley Warden fights beside you at Ley Sites")

// ===== 7. THE MAP: SUNK / SHARED, LOCKED OPTIONS =====
const ch4w = winStory(CE.clearStoryResult(ward))
const ch4d = winStory(CE.clearStoryResult(drain))
ok(ch4w.story.pendingScene === "hollow-flood" && SE.storyBeat({ ...ch3, story: ward.story, chapter: 4 }).title !== SE.storyBeat({ ...ch3, story: drain.story, chapter: 4 }).title, "M1 Chapter 4's variant follows the ley choice")
const shareOpt = (c) => SE.sceneOptions(c, "hollow-flood").find((o) => o.id === "share")
ok(!shareOpt(ch4w).blocked && shareOpt(ch4d).blocked, "M2 'hold it everywhere' is only open if you warded the ley")
ok(CE.chooseStory(ch4d, "share") === ch4d, "M3 a locked option can't be picked")
const sunk = CE.chooseStory(ch4w, "sink")
ok(CE.regionState(sunk, "hollow-ley") === "sunk" && !sunk.missions.some((m) => m.regionId === "hollow-ley"), "M4 sinking the flood: the Hollow Ley is Sunk, its missions gone")
const sunkLater = passDays(CE.clearStoryResult(sunk), 12)
ok(!sunkLater.missions.some((m) => m.regionId === "hollow-ley") && sunkLater.regions.find((r) => r.id === "hollow-ley").threat === 0, "M5 nothing happens in a sunk region again")
const shared = CE.chooseStory(ch4w, "share")
ok(shared.regions.filter((r) => !r.fallen && r.threat > 0).every((r) => r.threat <= ch4w.regions.find((x) => x.id === r.id).threat - 14 || r.threat === 0), "M6 'hold it everywhere': every region's threat -15")
const carried = CE.chooseStory(ch4d, "carry")
ok(carried.roster.every((h, i) => h.xp === ch4d.roster[i].xp + 6) && carried.story.nemeses.some((n) => n.id === "echo"), "M7 carrying it: every hero +6 XP, and the Echo hunts you")

// ===== 8. ALL ENDINGS REACHABLE =====
const PATHS = {
  rooted: ["spare", "stone", "ward", "sink", "join", "rest", "rooted"],
  ember: ["break", "ember", "drain", "carry", "end", "burn", "ember"],
  hollow: ["captive", "tide", "drain", "carry", "keep", "rest", "hollow"],
  echo: ["spare", "tide", "ward", "share", "strike", "carry", "echo"],
  peace: ["captive", "stone", "ward", "share", "keeper", "rest", "peace"],
  watch: ["break", "tide", "ward", "sink", "peace", "rest", "watch"],
}
const ends = {}
for (const [ending, picks] of Object.entries(PATHS)) {
  const c = playPath(picks)
  ends[ending] = { status: c.status, ending: c.story.ending, unlocks: c.unlocks, chronicle: c.story.chronicle.map((e) => e.optionId) }
  ok(c.status === "won" && c.story.ending === ending && c.unlocks.includes(SD.ENDINGS[ending].unlock), `E-${ending} the "${SD.ENDINGS[ending].title}" ending is reachable and unlocks ${SD.ENDINGS[ending].unlock}`, ends[ending])
  ok(JSON.stringify(c.story.chronicle.map((e) => e.optionId)) === JSON.stringify(picks), `E-${ending}b every pick on that road was open`, c.story.chronicle.map((e) => e.optionId))
}
ok(new Set(Object.values(ends).map((e) => e.ending)).size === 6, "E1 six different endings from six different roads")
const rootedRun = playPath(PATHS.rooted.slice(0, 6))
const lastScene = winStory(rootedRun)
const finalOpen = SE.sceneOptions(lastScene, "last-root").filter((o) => !o.blocked).map((o) => o.id)
ok(lastScene.status === "won" && lastScene.story.pendingScene === "last-root" && JSON.stringify(finalOpen) === JSON.stringify(SE.endingsInReach(lastScene.story.flags)), "E2 the Last Root offers exactly the endings your flags opened", finalOpen)
ok(finalOpen.includes("watch") && !finalOpen.includes("hollow"), "E3 the Long Watch is always open; roads not taken stay shut")

// ===== 9. UNLOCKS FOR THE NEXT CAMPAIGN =====
ok(CE.campaignCommanderIds([], ["commander:lehva"]).includes("lehva") && !CE.campaignCommanderIds([], []).includes("lehva"), "X1 The Rooted King unlocks Lehva as a commander")
ok(fresh({ unlocks: ["relic:emberbrand"] }).relics.includes("emberbrand") && fresh().relics.length === 0, "X2 a relic unlock: new campaigns start with it")
const hr = fresh({ unlocks: ["variant:hollow-road"], variant: "hollow-road" })
ok(hr.story.variant === "hollow-road" && hr.leyShards === 4 && hr.doom === 2 && hr.log.length === 2, "X3 The Hollow Road start: 4 shards, doom 2, its own opening line")
ok(CE.missionRunState(hr, hr.missions[0].id, []).campOvercharge >= SD.HOLLOW_ROAD_OVERCHARGE, "X4 The Hollow Road: fights start Overcharged")
ok(fresh({ variant: "hollow-road" }).story.variant === null, "X5 a story start you haven't unlocked is ignored")
const ec = fresh({ unlocks: ["variant:echo"], variant: "echo" })
ok(CE.roomLevel(ec, "leywell") === 1 && ec.leyShards === 2, "X6 Spacemonkey's Echo start: the Ley Well is built")
const un = fresh({ unlocks: ["variant:unhooded"], variant: "unhooded" })
ok(un.roster.some((h) => h.uniqueId === "ilta" && h.name === "Ilta") && CE.storyWinsNeeded(un) === D.STORY_AFTER_WINS - 1, "X7 Maura Unhooded start: Ilta joins, the first story mission needs one win fewer")

// ===== 10. SAVE ROUND-TRIP =====
const rtrip = (c) => CE.deserializeCampaign(JSON.parse(JSON.stringify(CE.serializeCampaign(c))))
ok(JSON.stringify(rtrip(ch4w)) === JSON.stringify(ch4w), "V1 a campaign waiting on a story choice survives save + load")
const deep = playPath(PATHS.echo.slice(0, 5))
ok(JSON.stringify(rtrip(deep)) === JSON.stringify(deep), "V2 a deep story (flags, nemeses, marks, chronicle) round-trips")
const oldSave = { ...c0 }
delete oldSave.story
const loadedOld = rtrip(oldSave)
ok(loadedOld && loadedOld.story && loadedOld.story.chronicle.length === 0 && loadedOld.story.pendingScene === null, "V3 a part-1 save (no story) loads with an empty story")
ok(rtrip({ ...ch4w, story: { ...ch4w.story, pendingScene: "no-such-scene" } }).story.pendingScene === null, "V4 a bad pending scene is dropped")

// ===== 11. HERO NAMES IN THE AFTERMATH (the campaign polish fix) =====
const hermit = Object.values(UNITS).find((u) => u.id === "the-hermit")
const nameRun = { ...rt.startRun("tommy", null, { forcedSeed: 3 }), bench: [{ key: 1, defId: "the-hermit", name: "Aino", xp: 0 }], deployed: [1] }
const fellRun = rt.recordFightAftermath(nameRun, { units: [{ id: "player-the-hermit-0", side: "player", hp: 0, maxHp: 10 }, { id: "player-commander", side: "player", hp: 5, maxHp: 10 }] })
ok(fellRun.lastAftermath?.some((l) => l.startsWith("Aino fell")) && !fellRun.lastAftermath.some((l) => l.includes(hermit.name)), "H1 aftermath lines use the hero's name, not the unit's", fellRun.lastAftermath)
let mutLine = null
for (let i = 0; i < 400 && !mutLine; i++) {
  const r = MU.rollFightMutations({ ...nameRun, seed: i, nodeIndex: i }, { units: [{ id: "player-the-hermit-0", side: "player", hp: 5, maxHp: 10, kills: 1, pos: { row: 0, col: 0 } }] }, { type: "elite" })
  mutLine = r.lines[0] || null
}
ok(mutLine && mutLine.includes("Aino grew") && !mutLine.includes(hermit.name), "H2 mutation lines use the hero's name (\"Aino grew...\", not \"Hollowreed grew...\")", mutLine)
const anon = MU.rollFightMutations({ ...nameRun, bench: [{ key: 1, defId: "the-hermit", xp: 0 }], seed: 1, nodeIndex: 1 }, { units: [] }, { type: "elite" })
ok(Array.isArray(anon.lines), "H3 an unnamed (Expedition) hero still works")
ok(CHARACTERS.lehva?.locked, "H4 (sanity) Lehva is a locked commander until earned")

console.log(`verify_campaign_story ENGINE: ${out.n - out.fails.length}/${out.n} passed`)
if (process.env.ENGINE_ONLY) {
  if (out.fails.length) {
    console.log("FAILS:\n" + out.fails.join("\n"))
    process.exitCode = 1
  }
  process.exit()
}

// ---------------------------------------------------------------------------
// PART 2 - UI (one browser, a few screenshots)
// ---------------------------------------------------------------------------
const { chromium } = await import("playwright")
await mkdir(SHOTS, { recursive: true })
const browser = await chromium.launch()
const errs = []
const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 } })
const page = await ctx.newPage()
page.on("pageerror", (e) => errs.push(String(e)))
await page.goto(`http://localhost:${PORT}/heartwood`, { waitUntil: "domcontentloaded" })
await page.evaluate(() => {
  localStorage.setItem("heartwood-autobattler-intro-seen", "1")
  localStorage.setItem("heartwood-story-intro-seen", "1")
  localStorage.removeItem("heartwood-campaign-save-v1")
  localStorage.removeItem("heartwood-campaign-unlocks-v1")
})
// Builds a campaign in-page with the real modules: `picks` story choices
// made, the next chapter's story mission won, its scene waiting.
const inject = (picks) =>
  page.evaluate(async (picks) => {
    const CE = await import("/src/services/heartwood/campaignEngine.js")
    const SE = await import("/src/services/heartwood/campaignStoryEngine.js")
    const rested = (c) => ({ ...c, roster: c.roster.map((h) => ({ ...h, tiredUntil: 0, hpPct: 1, xp: 0 })) })
    const winStory = (c0) => {
      const c = rested(CE.spawnMissions({ ...c0, chapterWins: 9 }, 0))
      const m = c.missions.find((x) => x.type === "story")
      const keys = c.roster.slice(0, 4).map((h) => h.key)
      const run = CE.missionRunState(c, m.id, keys)
      const done = CE.resolveMission({ ...c, activeMission: { missionId: m.id, squadKeys: keys, run: { ...run, battle: { engine: "tactics", phase: "won", units: [] } } } })
      return { ...done, lastAftermath: null, roster: done.roster.map((h) => ({ ...h, xp: 0 })) }
    }
    let c = CE.createCampaign({ commanderId: "tommy", difficulty: "normal", seed: 777 })
    for (const p of picks) {
      c = winStory(c)
      const open = SE.sceneOptions(c, c.story.pendingScene).filter((o) => !o.blocked)
      c = CE.clearStoryResult(CE.chooseStory(c, open.some((o) => o.id === p) ? p : open[0].id))
      c = { ...c, roster: c.roster.map((h) => ({ ...h, xp: 0 })) }
    }
    c = winStory(c)
    CE.saveCampaign(c)
  }, picks)
const openCampaign = async () => {
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.waitForTimeout(500)
  if ((await page.locator("[data-screen^='campaign']").count()) === 0) {
    await page.click("[data-campaign-open]")
  }
}

// U1: the Chapter 1 choice scene.
await inject([])
await openCampaign()
await page.waitForSelector("[data-screen='campaign-story']", { timeout: 8000 }).catch(() => {})
ok((await page.locator("[data-screen='campaign-story'][data-scene='rootkeeper-gate']").count()) === 1, "U1 winning a story mission opens its choice scene")
ok((await page.locator("[data-campaign-story-option]").count()) === 3 && (await page.locator(".hwc-story-speaker").count()) >= 2, "U2 speakers + three choice cards")
ok((await page.locator("[data-campaign-story-option='break'] .hwc-stake[data-tone='bad']").count()) >= 1 && (await page.locator("[data-campaign-story-option='break'] .hwc-stake[data-tone='good']").count()) >= 1, "U3 each card shows its stakes, good and bad")
await page.waitForTimeout(1600)
await page.screenshot({ path: `${SHOTS}/campaign_story_choice.png` })
await page.click("[data-campaign-story-option='captive']")
await page.waitForSelector("[data-screen='campaign-story-result']", { timeout: 4000 }).catch(() => {})
ok((await page.locator("[data-screen='campaign-story-result'][data-option='captive']").count()) === 1, "U4 the outcome screen follows the choice")
await page.click("[data-campaign-story-continue]")
await page.waitForSelector("[data-campaign-world-map]", { timeout: 4000 }).catch(() => {})
ok((await page.locator(".hwc-region[data-region='hollow-ley']").getAttribute("data-state")) !== "dormant", "U5 the world map changed: the Hollow Ley opened early")

// U6: an ally choice, then a map with every kind of story mark.
await inject(["captive"])
await openCampaign()
await page.waitForSelector("[data-scene='elemental-schism']", { timeout: 8000 }).catch(() => {})
await page.click("[data-campaign-story-option='ember']")
await page.waitForSelector("[data-campaign-joined='hehku']", { timeout: 4000 }).catch(() => {})
ok((await page.locator("[data-campaign-joined='hehku']").count()) === 1, "U6 Hehku joins - the outcome shows the new hero")
await page.screenshot({ path: `${SHOTS}/campaign_story_result.png` })
await page.click("[data-campaign-story-continue]")
await page.waitForSelector("[data-campaign-world-map]", { timeout: 4000 }).catch(() => {})
ok((await page.locator(".hwc-region[data-region='emberwrack'][data-mod='allied'] [data-campaign-banner='ember']").count()) === 1, "U7 the map shows Emberwrack under the Ember Clans' banner")
// Further down that road: drain the ley, sink the flood.
await inject(["captive", "ember", "drain"])
await openCampaign()
await page.waitForSelector("[data-scene='hollow-flood']", { timeout: 8000 }).catch(() => {})
ok((await page.locator("[data-campaign-story-option='share'][data-blocked]").count()) === 1, "U8 a locked option shows, greyed, with why")
await page.click("[data-campaign-story-option='sink']")
await page.click("[data-campaign-story-continue]")
await page.waitForSelector("[data-campaign-world-map]", { timeout: 4000 }).catch(() => {})
ok((await page.locator(".hwc-region[data-region='hollow-ley'][data-state='sunk']").count()) === 1 && (await page.locator(".hwc-region[data-region='mistfen'][data-mod='drained']").count()) === 1, "U9 the map shows the Hollow Ley Sunk and Mistfen Drained")
ok((await page.locator("[data-campaign-standing]").innerText()).includes("Ember Clans"), "U10 the map's side panel says where the story stands")
await page.click("[data-campaign-help]")
ok((await page.locator("[data-campaign-help-panel] .hwc-help-row").count()) >= 6, "U11 the campaign help panel explains the map, doom, roster, permadeath, rooms, story")
await page.click("[data-campaign-help]")
await page.screenshot({ path: `${SHOTS}/campaign_story_map.png` })

// U12: the Chronicle.
await page.click("[data-campaign-hearth]")
await page.click("[data-campaign-tab='chronicle']")
ok((await page.locator("[data-campaign-chronicle-entry]").count()) === 4, "U12 the Chronicle lists every choice so far", await page.locator("[data-campaign-chronicle-entry]").count())
ok((await page.locator("[data-campaign-chronicle]").innerText()).includes("Endings still within reach"), "U13 the Chronicle shows which endings are still within reach")
await page.screenshot({ path: `${SHOTS}/campaign_story_chronicle.png` })

// U14: the ending.
await inject(["spare", "stone", "ward", "sink", "join", "rest"])
await openCampaign()
await page.waitForSelector("[data-scene='last-root']", { timeout: 8000 }).catch(() => {})
ok((await page.locator("[data-campaign-story-option='rooted']:not([data-blocked])").count()) === 1 && (await page.locator("[data-campaign-story-option='hollow'][data-blocked]").count()) === 1, "U14 the Last Root: your road's endings open, the others locked")
await page.click("[data-campaign-story-option='rooted']")
await page.waitForSelector("[data-campaign-ending='rooted']", { timeout: 4000 }).catch(() => {})
ok((await page.locator("[data-screen='campaign-end'] [data-campaign-ending='rooted']").count()) === 1, "U15 the epilogue screen for The Rooted King")
ok((await page.locator("[data-campaign-ending-unlock='commander:lehva']").count()) === 1, "U16 it names what it unlocked")
await page.waitForTimeout(2800)
await page.screenshot({ path: `${SHOTS}/campaign_story_ending.png` })
const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("heartwood-campaign-unlocks-v1") || "[]"))
ok(stored.includes("commander:lehva"), "U17 the ending's unlock is kept for future campaigns", stored)
await page.click("[data-campaign-new]")
await page.waitForSelector("[data-screen='campaign-start']", { timeout: 4000 }).catch(() => {})
ok((await page.locator("[data-campaign-commander='lehva']").count()) === 1, "U18 a new campaign can be led by Lehva")
ok((await page.locator("[data-campaign-endings-found='1']").count()) === 1, "U19 the start screen counts endings found")

ok(errs.length === 0, "U20 no page errors", errs)
await browser.close()
console.log(`verify_campaign_story: ${out.n - out.fails.length}/${out.n} passed`)
if (out.fails.length) {
  console.log("FAILS:\n" + out.fails.join("\n"))
  process.exitCode = 1
}
