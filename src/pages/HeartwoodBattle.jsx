import { useEffect, useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { CHARACTERS } from "../data/heartwood/characters"
import { resolveTrial } from "../data/heartwood/trials"
import {
  startRun,
  recruitUnit,
  rankUpCommander,
  upgradeRelic,
  reforgeUnit,
  upgradeUnit,
  sellUnit,
  retrainCommander,
  rerollShop,
  buyInvestment,
  reclaimBuyback,
  rerollRelicOffers,
  leaveShop,
  assignToSlot,
  clearSlot,
  startFormationBattle,
  advanceRound,
  resolveBattleOutcome,
  chooseRelic,
  essenceForWin,
  bankInterest,
  buyItem,
  equipItem,
  unequipItem,
  levelUpMarket,
  toggleFreeze,
  activateCommanderPower,
  difficultyTierForNode,
  actIndexForNode,
  resolveActCrossroads,
  markActSeen,
  serializeRun,
  deserializeRun,
  chooseFloorEncounter,
  eventForNode,
  resolveEventChoice,
  startActFive,
  startCrownlessBattle,
  endCrownlessBattle,
  chooseForestPath,
  markEchoEpilogueSeen,
  DIFFICULTY_TIERS,
  RUN_PATH,
} from "../services/heartwood/runEngine"
import { crossroadsForAct } from "../data/heartwood/crossroads"
import { crownlessIntroLine } from "../data/heartwood/crownless"
import { loadRunSave, saveRunSave, clearRunSave, loadLastRun, saveLastRun, clearLastRun } from "../services/heartwood/runSaveState"
import { loadMeta, saveMeta } from "../services/heartwood/metaState"
import { META_PERKS, acornsForRun } from "../data/heartwood/metaPerks"
import { MAX_DEPTH } from "../data/heartwood/depths"
import GroveScreen from "../components/heartwood/GroveScreen"
import AlmanacScreen from "../components/heartwood/AlmanacScreen"
import SettingsScreen from "../components/heartwood/SettingsScreen"
import BattleSound from "../components/heartwood/BattleSound"
import { almanacCounts, recordAlmanac } from "../data/heartwood/almanac"
import { initAudioFromStorage, installClickSound, setMusicMode, play as playSfx } from "../services/heartwood/soundManager"
import CommanderSelect from "../components/heartwood/CommanderSelect"
import GuildHallScreen from "../components/heartwood/GuildHallScreen"
import SquadDraft from "../components/heartwood/SquadDraft"
import FormationScreen from "../components/heartwood/FormationScreen"
import AutoBattleView from "../components/heartwood/AutoBattleView"
import RelicChoice from "../components/heartwood/RelicChoice"
import FloorChoice from "../components/heartwood/FloorChoice"
import EventScreen from "../components/heartwood/EventScreen"
import RunEndOverlay from "../components/heartwood/RunEndOverlay"
import RunMap from "../components/heartwood/RunMap"
import ActTransitionScreen from "../components/heartwood/ActTransitionScreen"
import StoryCinematic from "../components/heartwood/StoryCinematic"
import ForestChoiceScreen from "../components/heartwood/ForestChoiceScreen"
import CoachTip from "../components/heartwood/CoachTip"
import HelpOverlay from "../components/heartwood/HelpOverlay"
import { nextCoachTip, markCoachSeen } from "../data/heartwood/coach"
import { UNITS } from "../data/heartwood/units"
import { UNIT_TRIBES } from "../data/heartwood/synergies"
import { CINEMATICS, cinematicById, suggestedEndingId } from "../data/heartwood/cinematics"
import battleBg from "../assets/heartwood/battle-bg.jpg"
import crewBanner from "../assets/heartwood/crew-banner.jpg"
import "../components/heartwood/heartwood.css"

const rootStyle = { height: "100%", "--hw-bg-image": `url(${battleBg})` }
const AUTOBATTLER_INTRO_SEEN_KEY = "heartwood-autobattler-intro-seen"
// Story intro cinematic (cinematics.js) - shown once ever, before the
// first shop, same once-and-skippable contract as the tutorial hint
// above. Separate key so clearing one doesn't affect the other.
const STORY_INTRO_SEEN_KEY = "heartwood-story-intro-seen"

// Heartwood Trial as an autobattler: pick a Commander, then a fixed
// loop of Shop -> Formation -> Auto-Battle repeats until the
// Spacemonkey boss fight ends the run one way or the other. No card is
// ever played by hand - the player's only actions are recruiting,
// placing units on the grid, and choosing when to leave the shop.
export default function HeartwoodBattle() {
  // Restore a saved run on mount (Marc, direct: refreshing the page
  // loses all progress, "that needs to change"). useMemo(() => ..., [])
  // rather than an effect - an effect-based restore would show a
  // flash of the character-select screen before the saved run lands,
  // plus a redundant first write once it does. deserializeRun
  // (runEngine.js) already returns null for anything corrupt/stale/
  // out-of-range, so a bad save just falls through to character select
  // rather than crashing.
  const restored = useMemo(() => deserializeRun(loadRunSave()), [])
  const [characterId, setCharacterId] = useState(restored?.characterId ?? null)
  const [runState, setRunState] = useState(restored)
  const [showIntro, setShowIntro] = useState(
    () => typeof localStorage !== "undefined" && !localStorage.getItem(AUTOBATTLER_INTRO_SEEN_KEY),
  )
  // Story intro cinematic gate. Presentation-only (like showGuildHall):
  // renders on top of an already-"shop" runState, cleared by its own
  // Continue/Skip. Only meaningful once a run exists; the localStorage
  // key makes it once-ever.
  const [showStoryIntro, setShowStoryIntro] = useState(
    () => typeof localStorage !== "undefined" && !localStorage.getItem(STORY_INTRO_SEEN_KEY),
  )
  // Ending cinematic: set to an id ("ending-rooted" | "-ember" |
  // "-hollow") once a run reaches victory; StoryCinematic plays it, then
  // clears it and RunEndOverlay takes over. Defeat gets no cinematic.
  const [endingCinematic, setEndingCinematic] = useState(null)
  const endingShownRef = useRef(null)
  const endingRearmRef = useRef(null)
  // Death Memory (Marc's PRD, runEngine.js's buildDeathMemory): the
  // PREVIOUS run's fallen hero, if any - real state, not a one-time
  // useMemo, because it has to pick up a memory saved LATER in the
  // same page session (a run that ends in defeat writes one via
  // saveLastRun - see the useEffect below - well after this component
  // already mounted). Re-read explicitly whenever the player actually
  // lands back on the character-select screen (handleNewRun/
  // handleChangeCharacter), not on every render. Consumed (cleared)
  // only once a new run actually begins (see beginRun), not on read,
  // so it survives a page reload that lands back on character select
  // without a run yet started.
  const [pendingMemory, setPendingMemory] = useState(() => loadLastRun())
  // Marc: "haluan että the outer grove on erillinen map funktionsa ja
  // näkyy shopping phasen jälkeen" (I want 'The Outer Grove' to be its
  // own separate map screen, shown after the shopping phase) -
  // followed by "sitä ei tarvita shopping phasessa näyttää" (it
  // doesn't need to show during the shop phase). RunMap used to render
  // as a persistent strip at the top of shop/choice/relic/formation
  // alike; now it's pulled OUT of the shop screen specifically and
  // shown as its own dedicated interstitial step right after leaving
  // shop, before whatever phase comes next (choice/relic/formation -
  // engine.advanceToNextNode only produces a "choice" phase sometimes,
  // when the next node is a contested battle slot, so anchoring this
  // to that phase instead of a plain local flag would have made the
  // map screen appear inconsistently). Purely a presentation-layer
  // insert - runEngine.js's phase machine is untouched, the actual
  // leaveShop() call is just deferred one click.
  const [showMapAfterShop, setShowMapAfterShop] = useState(false)

  // Act Crossroads (crossroads.js): holds the Act number whose boundary
  // interstitial is currently due, or null. Armed by the effect below
  // when actIndexForNode passes runState.lastSeenAct and a crossroads
  // exists for that Act; cleared by the screen's own choice. Same
  // presentation-only shape as showMapAfterShop - runEngine's phase
  // machine is untouched; resolveActCrossroads only edits runState
  // fields (allegiances / forestState / runModifiers / lastSeenAct).
  const [actCrossroads, setActCrossroads] = useState(null)

  // Guild Hall (PRD v2.0 Phase 4): a one-time arrival screen for THIS
  // run, shown right after a Commander is confirmed and before the
  // first shop render. Same shape as showMapAfterShop above - a purely
  // presentational gate, armed by beginRun below and cleared by the
  // screen's own CTA, never touching runEngine.js's actual phase
  // machine (runState.phase is already "shop" the whole time this is
  // true; this state only decides what HeartwoodBattle renders on top
  // of it). Starts false (not derived from restored/runState) so a
  // page reload mid-run - or resuming a saved run - lands straight
  // back on its real phase instead of replaying the arrival beat.
  const [showGuildHall, setShowGuildHall] = useState(false)

  // Between-run meta progression (metaState.js / metaPerks.js). Loaded
  // once; the Grove screen (from commander select) spends Acorns, and a
  // finished run awards Acorns exactly once via the effect below.
  const [meta, setMeta] = useState(() => loadMeta())
  const [showGrove, setShowGrove] = useState(false)
  const [showAlmanac, setShowAlmanac] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  // The ? reference overlay (HelpOverlay) + the contextual coach
  // (coach.js). `coachTick` forces a re-eval of nextCoachTip after a
  // tip is dismissed (the seen-set lives in localStorage);
  // coachDoneKeyRef holds the screen key a tip was last dismissed on so
  // the rest of that screen's tips stay suppressed until the run moves.
  const [showHelp, setShowHelp] = useState(false)
  const [coachTick, setCoachTick] = useState(0)
  const coachDoneKeyRef = useRef(null)
  const [lastAcornsEarned, setLastAcornsEarned] = useState(null)
  const awardedRunRef = useRef(null)

  function handleBuyPerk(perkId) {
    setMeta((m) => {
      const perk = META_PERKS.find((p) => p.id === perkId)
      if (!perk || m.acorns < perk.cost || (m.chosenPerks || []).includes(perkId)) return m
      const next = { ...m, acorns: m.acorns - perk.cost, chosenPerks: [...(m.chosenPerks || []), perkId] }
      saveMeta(next)
      return next
    })
  }

  function handleSelectDepth(level) {
    setMeta((m) => {
      const clamped = Math.max(0, Math.min(m.depth || 0, level))
      if (clamped === (m.selectedDepth || 0)) return m
      const next = { ...m, selectedDepth: clamped }
      saveMeta(next)
      return next
    })
  }

  function handleUnlockCommander(id) {
    setMeta((m) => {
      const c = CHARACTERS[id]
      if (!c?.locked || (m.unlockedCommanders || []).includes(id) || m.acorns < (c.unlockCost || 0)) return m
      const next = {
        ...m,
        acorns: m.acorns - (c.unlockCost || 0),
        unlockedCommanders: [...(m.unlockedCommanders || []), id],
      }
      saveMeta(next)
      return next
    })
  }

  // Audio (soundManager.js): apply persisted volumes + the reduce-motion
  // class on mount, and install the one delegated button-click sound
  // (which is also the user gesture that unlocks the AudioContext).
  // Everything is a silent no-op without Web Audio.
  useEffect(() => {
    initAudioFromStorage()
    installClickSound()
  }, [])

  // Procedural music mode follows the screen the player is on. Derived
  // here (not inside the effect) so the dep is a plain string.
  const musicMode = (() => {
    if (showGrove || showAlmanac || showSettings || showHelp || !runState) return "menu"
    if (runState.phase === "victory" || runState.phase === "defeat") return "end"
    if (runState.phase === "shop") return "shop"
    if (runState.phase === "battle" || runState.phase === "formation") {
      const nodeType = runState.path?.[runState.nodeIndex]?.type
      return nodeType === "boss" || nodeType === "miniboss" || nodeType === "elite" ? "boss" : "battle"
    }
    return "menu"
  })()
  useEffect(() => {
    setMusicMode(musicMode)
  }, [musicMode])

  // Every one of this component's ~20 handlers funnels through
  // setRunState, so one effect covers all of them rather than a save
  // call in each handler. Saving mid-battle is deliberate (see
  // serializeRun's own comment, runEngine.js) - a reload during a
  // losing fight resumes it instead of re-rolling it.
  useEffect(() => {
    if (!runState) return
    saveRunSave(serializeRun(runState))
    // Death Memory: written once, the moment a run actually ends in
    // defeat (runState.deathMemory is only ever set by
    // resolveBattleOutcome's "lost" branch) - the next run's
    // character-select screen reads it back via loadLastRun() above.
    if (runState.phase === "defeat" && runState.deathMemory) saveLastRun(runState.deathMemory)

    // Act V - The Crownless (runEngine startActFive). On a win, the run
    // isn't over: begin the finale sequence (throne -> Crownless fight ->
    // Forest's Choice -> ending -> Echo epilogue -> RunEndOverlay). The
    // `!runState.actFive` guard means a reload mid-Act-V resumes from the
    // saved step instead of restarting the sequence, even though the ref
    // resets. `phase` stays "victory" throughout.
    if (runState.phase === "victory" && !runState.actFive && endingShownRef.current !== runState) {
      endingShownRef.current = runState
      setRunState((rs) => startActFive(rs))
    }

    // Reload landing on a run whose Act V is already resolved (choice
    // made): re-arm the chosen ending cinematic so the sequence still
    // reaches RunEndOverlay via the ending (+ Echo epilogue if unseen),
    // not straight past it. Ref-guarded so it's a one-time re-arm.
    if (
      runState.phase === "victory" &&
      runState.actFive === "done" &&
      runState.chosenEnding &&
      !endingCinematic &&
      endingRearmRef.current !== runState
    ) {
      endingRearmRef.current = runState
      setEndingCinematic(runState.chosenEnding)
    }

    // Award Acorns for a finished run - once per run. Keyed by the run's
    // own honoredMemory.ts / a stable per-run stamp isn't available, so
    // guard on a ref holding the runState object identity of the ended
    // run (setRunState always makes a new object, and the end state is
    // terminal - no more transitions - so this fires exactly once).
    if ((runState.phase === "victory" || runState.phase === "defeat") && awardedRunRef.current !== runState) {
      awardedRunRef.current = runState
      const won = runState.phase === "victory"
      const ranDepth = runState.selectedDepth || 0
      const earned = acornsForRun(runState, won, meta.chosenPerks || [], ranDepth)
      setLastAcornsEarned(earned)
      setMeta((m) => {
        // Beating a run at the deepest Depth you've unlocked unlocks the
        // next one (Ascension-style).
        const unlockedNext = won && ranDepth === (m.depth || 0) && (m.depth || 0) < MAX_DEPTH
        const next = recordAlmanac(
          {
            ...m,
            acorns: m.acorns + earned,
            depth: unlockedNext ? (m.depth || 0) + 1 : m.depth || 0,
            stats: {
              runs: (m.stats?.runs || 0) + 1,
              wins: (m.stats?.wins || 0) + (won ? 1 : 0),
              bestNodeIndex: Math.max(m.stats?.bestNodeIndex || 0, runState.nodeIndex || 0),
            },
          },
          // The Almanac (almanac.js): everything this run met, win or
          // loss - same once-per-run cadence as the Acorn award.
          runState.seen,
        )
        saveMeta(next)
        return next
      })
    }
    // meta.chosenPerks is only ever changed on the commander-select
    // screen (no Grove access mid-run), so it's stable for a run's
    // whole lifetime - reading it here without it in the dep array is
    // deliberate, not a stale-closure bug.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runState])

  // Act Crossroads gate (crossroads.js): whenever the run has moved into
  // a later Act than the last one acknowledged, arm the boundary
  // interstitial - or, for an Act with no crossroads (VI/VII), just
  // record it as seen so this can't loop. Deferred while a battle is
  // resolving or the run has ended: the next non-battle render picks it
  // up. Presentation-only; resolveActCrossroads / markActSeen edit
  // runState fields, never its phase.
  useEffect(() => {
    if (!runState) return
    const act = actIndexForNode(runState.nodeIndex, RUN_PATH.length)
    if (act <= (runState.lastSeenAct || 1)) return
    if (["battle", "victory", "defeat"].includes(runState.phase)) return
    if (crossroadsForAct(act)) setActCrossroads(act)
    else setRunState((rs) => markActSeen(rs, act))
  }, [runState])

  function handleActCrossroads(choiceId) {
    setRunState((rs) => resolveActCrossroads(rs, actCrossroads, choiceId))
    setActCrossroads(null)
  }

  // Renders outside OSLayout now (App.jsx) - no Sidebar to fall back on
  // to get back to the rest of Wood-Booster HQ, so every screen needs
  // its own way out.
  const exitLink = (
    <Link to="/" className="hw-exit-link">
      ← Wood-Booster HQ
    </Link>
  )

  // Change Commander / How to Play used to render as two full-size
  // .hw-move-btn pills at the top-LEFT of every shop-adjacent screen,
  // right above the actual cards - Marc, marking up a screenshot
  // directly: crossed both out, circled the whole header area as one
  // undifferentiated clump ("iso möykky"), and said to move them
  // rather than delete the feature ("poista raksitut ja siirrä
  // nappeja"). Relocated to the same fixed top-RIGHT corner as the
  // exit link, in its exact subdued style - these are both rare
  // "step out of the moment" utility actions, not part of the
  // shop's actual decision-making, so they read as one small utility
  // cluster instead of competing with the cards for top-left
  // attention.
  const utilityBar = (
    <div className="hw-utility-bar">
      <button className="hw-exit-link hw-utility-btn" onClick={() => setShowIntro(true)}>
        How to Play
      </button>
      <button className="hw-exit-link hw-utility-btn" onClick={() => setShowHelp(true)}>
        Help
      </button>
      <button className="hw-exit-link hw-utility-btn" onClick={handleChangeCharacter}>
        Change Commander
      </button>
      {exitLink}
    </div>
  )

  function dismissIntro() {
    localStorage.setItem(AUTOBATTLER_INTRO_SEEN_KEY, "true")
    setShowIntro(false)
  }

  function dismissStoryIntro() {
    try {
      localStorage.setItem(STORY_INTRO_SEEN_KEY, "true")
    } catch {
      // private-mode / storage-disabled: fine, it just replays next run
    }
    setShowStoryIntro(false)
  }

  function beginRun(id) {
    // Defence-in-depth: CommanderSelect never fires onConfirm for a
    // still-locked Commander (it routes the click to onUnlock instead),
    // but never start a run with one regardless.
    const c = CHARACTERS[id]
    if (c?.locked && !(meta.unlockedCommanders || []).includes(id)) return
    setCharacterId(id)
    setRunState(startRun(id, pendingMemory, meta))
    setLastAcornsEarned(null)
    // Arrival beat, once per run - see showGuildHall's own comment
    // above. The shop phase is already set on runState at this point;
    // this only delays HeartwoodBattle from rendering it.
    setShowGuildHall(true)
    // Honored once, then cleared - a fallen hero is remembered for
    // exactly the next run, not forever (see startRun's own comment).
    if (pendingMemory) clearLastRun()
  }

  // Now that a run persists across reloads, abandoning one here is a
  // real, permanent loss (not just a discard of in-memory state) -
  // CLAUDE.md: "never execute destructive actions automatically", same
  // reasoning as any other unrecoverable action in this codebase.
  function handleChangeCharacter() {
    if (runState && !window.confirm("Abandon your current run and choose a different Commander?")) return
    clearRunSave()
    setRunState(null)
    setCharacterId(null)
    setPendingMemory(loadLastRun())
  }

  function handleRecruit(unitDefId) {
    playSfx("buy")
    setRunState((current) => recruitUnit(current, unitDefId))
  }

  function handleRankUp() {
    setRunState((current) => rankUpCommander(current))
  }

  function handleUpgradeRelic(relicId) {
    setRunState((current) => upgradeRelic(current, relicId))
  }

  function handleReforge(benchKey) {
    setRunState((current) => reforgeUnit(current, benchKey))
  }

  function handleUpgradeUnit(benchKey, branchId) {
    setRunState((current) => upgradeUnit(current, benchKey, branchId))
  }

  function handleSell(benchKey) {
    setRunState((current) => sellUnit(current, benchKey))
  }

  function handleBuyInvestment(id) {
    setRunState((current) => buyInvestment(current, id))
  }

  function handleReclaimBuyback() {
    setRunState((current) => reclaimBuyback(current))
  }

  function handleRetrain(newCharacterId) {
    setRunState((current) => retrainCommander(current, newCharacterId))
  }

  function handleReroll() {
    playSfx("reroll")
    setRunState((current) => rerollShop(current))
  }

  function handleBuyItem(itemDefId) {
    playSfx("buy")
    setRunState((current) => buyItem(current, itemDefId))
  }

  function handleEquipItem(itemKey, benchKey, slotIndex) {
    setRunState((current) => equipItem(current, itemKey, benchKey, slotIndex))
  }

  function handleUnequipItem(itemKey) {
    setRunState((current) => unequipItem(current, itemKey))
  }

  function handleLevelUpMarket() {
    setRunState((current) => levelUpMarket(current))
  }

  function handleToggleFreeze() {
    setRunState((current) => toggleFreeze(current))
  }

  function handleUseCommanderActive() {
    setRunState((current) => activateCommanderPower(current))
  }

  function handleRerollRelics() {
    setRunState((current) => rerollRelicOffers(current))
  }

  function handleLeaveShop() {
    setRunState((current) => leaveShop(current))
  }

  function handleAssign(slotIndex, benchIndex) {
    setRunState((current) => assignToSlot(current, slotIndex, benchIndex))
  }

  function handleClear(slotIndex) {
    setRunState((current) => clearSlot(current, slotIndex))
  }

  // Marc: "battle should be automated" - no click needed once the fight
  // starts. The fight still resolves itself with zero player input, but
  // (per the later "peli tarvitsee lisää animaatioita" ask) it now
  // plays out round by round on a timer inside AutoBattleView instead
  // of jumping straight to the end in one synchronous call - see that
  // component's own comment for why an instant jump silently broke the
  // whole floating-number/hit-flash animation system.
  function handleStartBattle() {
    setRunState((current) => startFormationBattle(current))
  }

  function handleAdvanceRound() {
    setRunState((current) => advanceRound(current))
  }

  function handleBattleContinue() {
    setRunState((current) => resolveBattleOutcome(current))
  }

  // Act V - The Crownless fight ends here instead of resolveBattleOutcome
  // (which would advance a run node / re-end the run). Win or loss both
  // go on to the Forest's Choice. handleAdvanceRound is reused as-is -
  // it only touches runState.battle.
  function handleCrownlessContinue() {
    setRunState((current) => endCrownlessBattle(current))
  }

  function handleChooseRelic(relicId) {
    setRunState((current) => chooseRelic(current, relicId))
  }

  function handleChooseFloorEncounter(choiceIndex) {
    setRunState((current) => chooseFloorEncounter(current, choiceIndex))
  }

  function handleResolveEvent(choiceIndex) {
    setRunState((current) => resolveEventChoice(current, choiceIndex))
  }

  function handleNewRun() {
    clearRunSave()
    setRunState(null)
    setCharacterId(null)
    // Death Memory: the run that just ended may have just saved one
    // (see the saveLastRun call in the useEffect above) - re-read here
    // so the character-select screen we're about to show reflects it.
    setPendingMemory(loadLastRun())
  }

  // At most one coach tip per screen (nodeIndex + phase) - dismissing
  // one suppresses the rest until the run actually moves on, so a first
  // shop shows one concept, not a cascade of four.
  const coachKey = runState ? `${runState.nodeIndex}:${runState.phase}` : null

  // The ? reference overlay (HelpOverlay) - checked before every other
  // branch so it opens over any screen (character-select, shop, a
  // fight) and returns you exactly where you were.
  if (showHelp) {
    return (
      <div className="hw-root hw-screen-fade" style={rootStyle} key="help">
        {exitLink}
        <HelpOverlay onBack={() => setShowHelp(false)} />
      </div>
    )
  }

  // Contextual coach (coach.js): which mechanics are on screen right
  // now, derived from runState alone - no engine call - most-specific
  // first, then the first tip not yet dismissed. `coachTick` is read
  // only to re-run this after a "Got it".
  const activeCoachTip = (() => {
    void coachTick
    if (!runState || showGrove || showAlmanac || showSettings || showStoryIntro || showIntro) return null
    if (coachDoneKeyRef.current === coachKey) return null
    const phase = runState.phase
    const node = runState.path?.[runState.nodeIndex]
    const battle = runState.battle
    const isElite = node?.type === "elite"
    const benchLegendary = (runState.bench || []).some((b) => UNITS[b.defId]?.tier === "legendary")
    const shopLegendary = (runState.shopOffers || []).some((id) => UNITS[id]?.tier === "legendary")
    const deployedLegendary = (battle?.playerUnits || []).some((u) => UNITS[u.defId]?.tier === "legendary")
    let squadHasTribePair = false
    if (battle?.playerUnits) {
      const counts = {}
      for (const u of battle.playerUnits) {
        for (const t of UNIT_TRIBES[u.defId] || []) {
          counts[t] = (counts[t] || 0) + 1
          if (counts[t] >= 2) squadHasTribePair = true
        }
      }
    }
    const ids = []
    if (runState.lastEvolved?.length) ids.push("evolution")
    if (phase === "shop") {
      // `shop` first - the "how a run works at all" tip. The rest are
      // more advanced and only surface on later visits, once it's seen.
      ids.push("shop")
      ids.push("roles")
      if (shopLegendary || benchLegendary) ids.push("legendary")
      if ((runState.marketLevel || 1) > 1) ids.push("market-level")
      if (bankInterest(runState.essence) > 0) ids.push("interest")
      if ((runState.bench || []).some((e) => UNITS[e.defId]?.displayTier !== 2 && runState.essence >= 150)) ids.push("upgrade")
      ids.push("ledger")
    }
    if (phase === "relic") ids.push("relic")
    if (phase === "formation") {
      if (isElite) ids.push("elite")
      if (benchLegendary) ids.push("legendary")
      ids.push("formation-position")
    }
    if (phase === "battle" && battle) {
      if (isElite) ids.push("elite")
      if (deployedLegendary) ids.push("legendary")
      if (battle.arenaId) ids.push("arena")
      if (typeof battle.forestMood === "number") ids.push("forest-mood")
      if (squadHasTribePair || battle.enemySynergyLabel) ids.push("synergy")
    }
    return nextCoachTip(ids)
  })()
  const dismissCoach = () => {
    if (activeCoachTip) markCoachSeen(activeCoachTip.id)
    coachDoneKeyRef.current = coachKey
    setCoachTick((n) => n + 1)
  }

  if (!characterId || !runState) {
    if (showGrove) {
      return (
        <div className="hw-root hw-screen-fade" style={rootStyle} key="grove">
          {exitLink}
          <GroveScreen meta={meta} onBuy={handleBuyPerk} onSelectDepth={handleSelectDepth} onBack={() => setShowGrove(false)} />
        </div>
      )
    }
    if (showAlmanac) {
      return (
        <div className="hw-root hw-screen-fade" style={rootStyle} key="almanac">
          {exitLink}
          <AlmanacScreen meta={meta} onBack={() => setShowAlmanac(false)} />
        </div>
      )
    }
    if (showSettings) {
      return (
        <div className="hw-root hw-screen-fade" style={rootStyle} key="settings">
          {exitLink}
          <SettingsScreen onBack={() => setShowSettings(false)} />
        </div>
      )
    }
    const almCounts = almanacCounts(meta)
    return (
      <div className="hw-root hw-screen-fade" style={rootStyle} key="select">
        {exitLink}
        <CommanderSelect
          characters={Object.values(CHARACTERS)}
          pendingMemory={pendingMemory}
          bannerSrc={crewBanner}
          bannerAlt="Tommy, Aatos, Spacemonkey, and Fenrir"
          onConfirm={beginRun}
          unlockedIds={meta.unlockedCommanders || []}
          acorns={meta.acorns}
          onUnlock={handleUnlockCommander}
          depthLevel={Math.max(0, Math.min(meta.depth || 0, meta.selectedDepth || 0))}
        />
        <button className="hw-grove-open-btn" onClick={() => setShowGrove(true)}>
          &#127807; The Grove{meta.acorns > 0 ? ` — ${meta.acorns} Acorns` : ""}
        </button>
        <button className="hw-almanac-open-btn" onClick={() => setShowAlmanac(true)}>
          &#128214; The Almanac — {almCounts.overall.seen}/{almCounts.overall.total}
        </button>
        <button className="hw-help-open-btn" onClick={() => setShowHelp(true)} aria-label="Help" title="How Hearthwood works">
          ?
        </button>
        <button className="hw-settings-open-btn" onClick={() => setShowSettings(true)} aria-label="Settings" title="Settings">
          &#9881;
        </button>
      </div>
    )
  }

  // Story intro cinematic (cinematics.js) - once ever, before anything
  // else, only at the very first shop of a run (nodeIndex 0). Sits
  // ahead of the Guild Hall so the order reads: the forest wakes you ->
  // meet your crew -> first market.
  if (showStoryIntro && runState.phase === "shop" && runState.nodeIndex === 0) {
    return <StoryCinematic cinematic={CINEMATICS.intro} onDone={dismissStoryIntro} />
  }

  // --- Act V: The Crownless (runEngine startActFive) ------------------
  // All four steps run while phase === "victory"; each reads runState so
  // a reload resumes from the saved actFive step. They sit BEFORE the
  // ending-cinematic and RunEndOverlay branches.
  if (runState.phase === "victory" && runState.actFive === "throne") {
    return (
      <StoryCinematic
        key="crownless-throne"
        cinematic={CINEMATICS["crownless-throne"]}
        onDone={() => setRunState((rs) => startCrownlessBattle(rs))}
      />
    )
  }

  if (runState.phase === "victory" && runState.actFive === "crownless" && runState.battle) {
    return (
      <div className="hw-root hw-screen-fade" style={rootStyle} key="crownless-battle" data-screen="crownless-battle">
        <p className="hw-flavor hw-crownless-intro">&ldquo;{crownlessIntroLine(runState)}&rdquo;</p>
        <BattleSound state={runState.battle} />
        <AutoBattleView
          state={runState.battle}
          nodeType="boss"
          actIndex={5}
          victoryLine={resolveTrial("the-crownless")?.victoryLine}
          onAdvanceRound={handleAdvanceRound}
          onContinue={handleCrownlessContinue}
        />
      </div>
    )
  }

  if (runState.phase === "victory" && runState.actFive === "choice") {
    return (
      <ForestChoiceScreen
        suggested={suggestedEndingId(runState)}
        onChoose={(endingId) => {
          setRunState((rs) => chooseForestPath(rs, endingId))
          setEndingCinematic(endingId)
        }}
      />
    )
  }

  // Ending cinematic (cinematics.js) - the player's chosen ending (Act V)
  // or, before Act V shipped, the tally. onDone chains the one-time Echo
  // Age epilogue, then clears through to RunEndOverlay.
  if (runState.phase === "victory" && endingCinematic) {
    return (
      <StoryCinematic
        key={endingCinematic}
        cinematic={cinematicById(endingCinematic)}
        onDone={() => {
          if (endingCinematic !== "echo-epilogue" && runState.chosenEnding && !runState.echoEpilogueSeen) {
            setRunState((rs) => markEchoEpilogueSeen(rs))
            setEndingCinematic("echo-epilogue")
          } else {
            setEndingCinematic(null)
          }
        }}
      />
    )
  }

  // Guild Hall (see showGuildHall's own comment above) - checked here,
  // right after the CommanderSelect branch and before every other
  // phase branch, so it can only ever appear in the exact window
  // between a fresh commander confirm and this run's first shop
  // render, never mid-run and never on a reload.
  if (showGuildHall) {
    return (
      <div className="hw-root" style={rootStyle}>
        {exitLink}
        <GuildHallScreen
          character={CHARACTERS[characterId]}
          pendingMemory={runState.honoredMemory}
          bannerSrc={crewBanner}
          bannerAlt="Tommy, Aatos, Spacemonkey, and Fenrir"
          onEnterMarket={() => setShowGuildHall(false)}
        />
      </div>
    )
  }

  if (runState.phase === "victory" || runState.phase === "defeat") {
    return (
      <div
        className="hw-root hw-screen-fade"
        style={{ ...rootStyle, position: "relative", minHeight: "100%" }}
        key="end"
      >
        {exitLink}
        <RunEndOverlay
          phase={runState.phase}
          nodeIndex={runState.nodeIndex}
          path={runState.path}
          onNewRun={handleNewRun}
          deathMemory={runState.deathMemory}
          acornsEarned={lastAcornsEarned}
          totalAcorns={meta.acorns}
          depthLevel={runState.selectedDepth || 0}
        />
      </div>
    )
  }

  const changeCharacterBar = (
    <>
      {utilityBar}
      <RunMap runState={runState} />
    </>
  )

  // The dedicated map interstitial (see showMapAfterShop's own comment
  // above) - shown once, right after leaving shop, before whatever
  // phase actually comes next. MUST be checked BEFORE the "shop"
  // branch below: arming showMapAfterShop deliberately does NOT change
  // runState.phase yet (still "shop" - handleLeaveShop is deferred
  // until this screen's own Continue is clicked), so if the shop
  // check ran first it would always win and this branch would never
  // be reached. Real bug caught via a live click-through, not assumed
  // safe from reading the JSX order - a first attempt had these two
  // checks the other way around and silently never showed the map at
  // all (both clicks landed back on the shop screen, `runState.phase`
  // never moved).
  // Act Crossroads interstitial (see the gate effect above). Checked
  // before every phase-driven branch below - the run's phase is still
  // whatever it was; this only decides what renders on top.
  if (actCrossroads) {
    return (
      <ActTransitionScreen
        key={`act-transition-${actCrossroads}`}
        crossroads={crossroadsForAct(actCrossroads)}
        fromTier={DIFFICULTY_TIERS[actCrossroads - 2] || null}
        intoTier={DIFFICULTY_TIERS[actCrossroads - 1] || null}
        onChoose={handleActCrossroads}
      />
    )
  }

  if (showMapAfterShop) {
    return (
      <div className="hw-root hw-screen-fade" style={rootStyle} data-screen="map-after-shop" key="map-after-shop">
        {utilityBar}
        <RunMap runState={runState} />
        <div style={{ padding: "0 21px" }}>
          <button
            className="hw-end-turn"
            onClick={() => {
              handleLeaveShop()
              setShowMapAfterShop(false)
            }}
          >
            Continue
          </button>
        </div>
      </div>
    )
  }

  if (runState.phase === "shop") {
    return (
      <div className="hw-root hw-screen-fade" style={rootStyle} key="shop">
        {utilityBar}
        {activeCoachTip && <CoachTip tip={activeCoachTip} onDismiss={dismissCoach} />}
        <SquadDraft
          runState={runState}
          onRecruit={handleRecruit}
          onRankUp={handleRankUp}
          onUpgradeRelic={handleUpgradeRelic}
          onUpgradeUnit={handleUpgradeUnit}
          onReforge={handleReforge}
          onSell={handleSell}
          onRetrain={handleRetrain}
          onBuyItem={handleBuyItem}
          onEquipItem={handleEquipItem}
          onUnequipItem={handleUnequipItem}
          onLevelUpMarket={handleLevelUpMarket}
          onToggleFreeze={handleToggleFreeze}
          onUseCommanderActive={handleUseCommanderActive}
          onReroll={handleReroll}
          onBuyInvestment={handleBuyInvestment}
          onReclaimBuyback={handleReclaimBuyback}
          onContinue={() => setShowMapAfterShop(true)}
          showIntro={showIntro}
          onDismissIntro={dismissIntro}
          mapSlot={<RunMap runState={runState} mode="rail" />}
        />
      </div>
    )
  }

  if (runState.phase === "choice") {
    return (
      <div className="hw-root hw-screen-fade" style={rootStyle} key="choice">
        {changeCharacterBar}
        <FloorChoice
          runState={runState}
          onChoose={handleChooseFloorEncounter}
          difficultyTier={difficultyTierForNode(runState.nodeIndex, RUN_PATH.length)}
        />
      </div>
    )
  }

  if (runState.phase === "relic") {
    return (
      <div className="hw-root hw-screen-fade" style={rootStyle} key="relic">
        {changeCharacterBar}
        {activeCoachTip && <CoachTip tip={activeCoachTip} onDismiss={dismissCoach} />}
        <RelicChoice runState={runState} onChoose={handleChooseRelic} onReroll={handleRerollRelics} />
      </div>
    )
  }

  if (runState.phase === "event") {
    return (
      <div className="hw-root hw-screen-fade" style={rootStyle} key="event">
        {changeCharacterBar}
        <EventScreen event={eventForNode(runState)} onResolve={handleResolveEvent} />
      </div>
    )
  }

  if (runState.phase === "formation") {
    return (
      <div className="hw-root hw-screen-fade" style={rootStyle} key="formation">
        {changeCharacterBar}
        {activeCoachTip && <CoachTip tip={activeCoachTip} onDismiss={dismissCoach} />}
        <FormationScreen
          runState={runState}
          node={runState.path[runState.nodeIndex]}
          onAssign={handleAssign}
          onClear={handleClear}
          onStartBattle={handleStartBattle}
        />
      </div>
    )
  }

  // phase === "battle"
  const currentPathNode = runState.path[runState.nodeIndex]
  // Includes bankInterest so the victory overlay's number is exactly
  // what resolveBattleOutcome pays out (its doc-comment's promise).
  const essenceOnWin =
    currentPathNode?.type === "boss"
      ? null
      : essenceForWin(runState, currentPathNode) + bankInterest(runState.essence)
  // A Trial (trials.js) wrapping this node gets its own written victory
  // line on the per-fight result overlay - see trials.js's own comment
  // for why this reuses the enemy's existing combat, just its story voice.
  const trial = resolveTrial(currentPathNode?.trialId)
  // actIndexForNode is 1-based (1..7, one per DIFFICULTY_TIERS entry) -
  // used directly as the [data-act] value the spectacle CSS keys on.
  const battleActIndex = actIndexForNode(runState.nodeIndex, RUN_PATH.length)
  return (
    <div
      className="hw-root hw-screen-fade"
      style={rootStyle}
      key="battle"
      data-screen="battle"
      data-act={battleActIndex}
    >
      {exitLink}
      {activeCoachTip && <CoachTip tip={activeCoachTip} onDismiss={dismissCoach} />}
      <BattleSound state={runState.battle} />
      <AutoBattleView
        state={runState.battle}
        essenceOnWin={essenceOnWin}
        nodeType={currentPathNode?.type}
        difficultyTier={difficultyTierForNode(runState.nodeIndex, RUN_PATH.length)}
        actIndex={battleActIndex}
        victoryLine={trial?.victoryLine}
        onAdvanceRound={handleAdvanceRound}
        onContinue={handleBattleContinue}
      />
    </div>
  )
}
