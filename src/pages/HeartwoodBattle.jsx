import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { CHARACTERS } from "../data/heartwood/characters"
import { resolveTrial } from "../data/heartwood/trials"
import {
  startRun,
  recruitUnit,
  rankUpCommander,
  upgradeRelic,
  reforgeUnit,
  sellUnit,
  retrainCommander,
  rerollShop,
  rerollRelicOffers,
  leaveShop,
  assignToSlot,
  clearSlot,
  startFormationBattle,
  advanceRound,
  resolveBattleOutcome,
  chooseRelic,
  essenceForWin,
  buyItem,
  equipItem,
  unequipItem,
  levelUpMarket,
  toggleFreeze,
  activateCommanderPower,
  difficultyTierForNode,
  serializeRun,
  deserializeRun,
  chooseFloorEncounter,
  RUN_PATH,
} from "../services/heartwood/runEngine"
import { loadRunSave, saveRunSave, clearRunSave } from "../services/heartwood/runSaveState"
import SquadDraft from "../components/heartwood/SquadDraft"
import FormationScreen from "../components/heartwood/FormationScreen"
import AutoBattleView from "../components/heartwood/AutoBattleView"
import RelicChoice from "../components/heartwood/RelicChoice"
import FloorChoice from "../components/heartwood/FloorChoice"
import RunEndOverlay from "../components/heartwood/RunEndOverlay"
import RunMap from "../components/heartwood/RunMap"
import { CardGlyph } from "../components/heartwood/cardArt"
import battleBg from "../assets/heartwood/battle-bg.jpg"
import crewBanner from "../assets/heartwood/crew-banner.jpg"
import "../components/heartwood/heartwood.css"

const rootStyle = { height: "100%", "--hw-bg-image": `url(${battleBg})` }
const AUTOBATTLER_INTRO_SEEN_KEY = "heartwood-autobattler-intro-seen"

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

  // Every one of this component's ~20 handlers funnels through
  // setRunState, so one effect covers all of them rather than a save
  // call in each handler. Saving mid-battle is deliberate (see
  // serializeRun's own comment, runEngine.js) - a reload during a
  // losing fight resumes it instead of re-rolling it.
  useEffect(() => {
    if (!runState) return
    saveRunSave(serializeRun(runState))
  }, [runState])

  // Renders outside OSLayout now (App.jsx) - no Sidebar to fall back on
  // to get back to the rest of Wood-Booster HQ, so every screen needs
  // its own way out.
  const exitLink = (
    <Link to="/" className="hw-exit-link">
      ← Wood-Booster HQ
    </Link>
  )

  function dismissIntro() {
    localStorage.setItem(AUTOBATTLER_INTRO_SEEN_KEY, "true")
    setShowIntro(false)
  }

  function beginRun(id) {
    setCharacterId(id)
    setRunState(startRun(id))
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
  }

  function handleRecruit(unitDefId) {
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

  function handleSell(benchKey) {
    setRunState((current) => sellUnit(current, benchKey))
  }

  function handleRetrain(newCharacterId) {
    setRunState((current) => retrainCommander(current, newCharacterId))
  }

  function handleReroll() {
    setRunState((current) => rerollShop(current))
  }

  function handleBuyItem(itemDefId) {
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

  function handleChooseRelic(relicId) {
    setRunState((current) => chooseRelic(current, relicId))
  }

  function handleChooseFloorEncounter(choiceIndex) {
    setRunState((current) => chooseFloorEncounter(current, choiceIndex))
  }

  function handleNewRun() {
    clearRunSave()
    setRunState(null)
    setCharacterId(null)
  }

  if (!characterId || !runState) {
    return (
      <div className="hw-root" style={rootStyle}>
        {exitLink}
        <div className="hw-intro">
          <div className="hw-crew-banner">
            <img src={crewBanner} alt="Tommy, Aatos, Spacemonkey, and Fenrir" />
          </div>
          <h1 style={{ fontSize: 22, marginBottom: 6 }}>Hearthwood</h1>
          <p className="hw-flavor">
            Deep inside the Boosterverse, Spacemonkey waits at the heart of the Hearthwood. Choose who
            leads the squad in after him.
          </p>
        </div>
        <div className="hw-select-grid">
          {Object.values(CHARACTERS).map((character) => (
            <button key={character.id} className="hw-enemy-choice" onClick={() => beginRun(character.id)}>
              <CardGlyph name={character.art} className="hw-card-glyph" style={{ color: "var(--hw-ember)" }} />
              <strong>{character.name}</strong>
              <p style={{ fontSize: 12, color: "var(--hw-muted)", marginTop: 6 }}>{character.tagline}</p>
              <p style={{ fontSize: 11, color: "var(--hw-muted)", marginTop: 6 }}>{character.description}</p>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (runState.phase === "victory" || runState.phase === "defeat") {
    return (
      <div className="hw-root" style={{ ...rootStyle, position: "relative", minHeight: "100%" }}>
        {exitLink}
        <RunEndOverlay phase={runState.phase} nodeIndex={runState.nodeIndex} path={runState.path} onNewRun={handleNewRun} />
      </div>
    )
  }

  const changeCharacterBar = (
    <>
      <div style={{ display: "flex", gap: 8, padding: "21px 21px 0" }}>
        {exitLink}
        <button className="hw-move-btn" onClick={handleChangeCharacter}>
          Change Commander
        </button>
        <button className="hw-move-btn" onClick={() => setShowIntro(true)}>
          How to Play
        </button>
      </div>
      <RunMap runState={runState} />
    </>
  )

  if (runState.phase === "shop") {
    return (
      <div className="hw-root" style={rootStyle}>
        {changeCharacterBar}
        <SquadDraft
          runState={runState}
          onRecruit={handleRecruit}
          onRankUp={handleRankUp}
          onUpgradeRelic={handleUpgradeRelic}
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
          onContinue={handleLeaveShop}
          showIntro={showIntro}
          onDismissIntro={dismissIntro}
        />
      </div>
    )
  }

  if (runState.phase === "choice") {
    return (
      <div className="hw-root" style={rootStyle}>
        {changeCharacterBar}
        <FloorChoice runState={runState} onChoose={handleChooseFloorEncounter} />
      </div>
    )
  }

  if (runState.phase === "relic") {
    return (
      <div className="hw-root" style={rootStyle}>
        {changeCharacterBar}
        <RelicChoice runState={runState} onChoose={handleChooseRelic} onReroll={handleRerollRelics} />
      </div>
    )
  }

  if (runState.phase === "formation") {
    return (
      <div className="hw-root" style={rootStyle}>
        {changeCharacterBar}
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
  const essenceOnWin = currentPathNode?.type === "boss" ? null : essenceForWin(runState, currentPathNode)
  // A Trial (trials.js) wrapping this node gets its own written victory
  // line on the per-fight result overlay - see trials.js's own comment
  // for why this reuses the enemy's existing combat, just its story voice.
  const trial = resolveTrial(currentPathNode?.trialId)
  return (
    <div className="hw-root" style={rootStyle}>
      {exitLink}
      <AutoBattleView
        state={runState.battle}
        essenceOnWin={essenceOnWin}
        nodeType={currentPathNode?.type}
        difficultyTier={difficultyTierForNode(runState.nodeIndex, RUN_PATH.length)}
        victoryLine={trial?.victoryLine}
        onAdvanceRound={handleAdvanceRound}
        onContinue={handleBattleContinue}
      />
    </div>
  )
}
