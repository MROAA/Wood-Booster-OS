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
import { loadRunSave, saveRunSave, clearRunSave, loadLastRun, saveLastRun, clearLastRun } from "../services/heartwood/runSaveState"
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
    setRunState(startRun(id, pendingMemory))
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
    // Death Memory: the run that just ended may have just saved one
    // (see the saveLastRun call in the useEffect above) - re-read here
    // so the character-select screen we're about to show reflects it.
    setPendingMemory(loadLastRun())
  }

  if (!characterId || !runState) {
    return (
      <div className="hw-root" style={rootStyle}>
        {exitLink}
        <div className="hw-intro hw-intro--centered">
          <div className="hw-crew-banner">
            <img src={crewBanner} alt="Tommy, Aatos, Spacemonkey, and Fenrir" />
          </div>
          <h1 style={{ fontSize: 22, marginBottom: 6 }}>Hearthwood</h1>
          <p className="hw-flavor">
            Deep inside the Boosterverse, Spacemonkey waits at the heart of the Hearthwood. Choose who
            leads the squad in after him.
          </p>
          {/* Death Memory (Marc's PRD): the previous run's fallen hero
              is remembered once, into this next run only - see
              runEngine.js's buildDeathMemory/startRun and the
              RunEndOverlay below where the memory is first shown. */}
          {pendingMemory && (
            <span className="hw-badge" title="A small Essence boon, carried forward once in their memory">
              In memory of {pendingMemory.heroName}
              {pendingMemory.heroClass && pendingMemory.heroClass !== pendingMemory.heroName
                ? `, the ${pendingMemory.heroClass}`
                : ""}{" "}
              - your squad begins with +1 Essence.
            </span>
          )}
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
        <RunEndOverlay
          phase={runState.phase}
          nodeIndex={runState.nodeIndex}
          path={runState.path}
          onNewRun={handleNewRun}
          deathMemory={runState.deathMemory}
        />
      </div>
    )
  }

  const topButtons = (
    <div style={{ display: "flex", gap: 8, padding: "21px 21px 0" }}>
      {exitLink}
      <button className="hw-move-btn" onClick={handleChangeCharacter}>
        Change Commander
      </button>
      <button className="hw-move-btn" onClick={() => setShowIntro(true)}>
        How to Play
      </button>
    </div>
  )

  const changeCharacterBar = (
    <>
      {topButtons}
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
  if (showMapAfterShop) {
    return (
      <div className="hw-root" style={rootStyle} data-screen="map-after-shop">
        {topButtons}
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
      <div className="hw-root" style={rootStyle}>
        {topButtons}
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
          onContinue={() => setShowMapAfterShop(true)}
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
