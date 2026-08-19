import { useState } from "react"
import { CARDS } from "../../data/heartwood/cards"
import { TUTORIAL_STEPS, TUTORIAL_SEEN_KEY } from "../../data/heartwood/tutorial"
import {
  legalSingleTargets,
  resolvePattern,
  piecesAtPositions,
  emptyAdjacentSquares,
  cardNeedsTarget,
} from "../../services/heartwood/targeting"
import BattleGrid from "./BattleGrid"
import PlayerPanel from "./PlayerPanel"
import Hand from "./Hand"
import ResultOverlay from "./ResultOverlay"
import TutorialSpotlight from "./TutorialSpotlight"

// Legal target ids for a card: pattern cards (Knight's Leap etc.)
// resolve from grid geometry at the player's current square, bypassing
// shielding by construction; ordinary cards go through the normal
// shielded/unshielded single-target rule.
function candidateTargetIds(state, def) {
  if (!def) return []
  if (def.pattern) {
    const squares = resolvePattern(state, def.pattern, state.player.pos)
    return piecesAtPositions(state, squares)
  }
  return legalSingleTargets(state, def).map((e) => e.id)
}

function hintText(state, moveMode, pendingCard) {
  if (state.phase !== "player") return "The enemy is acting..."
  if (pendingCard) return "Click a glowing enemy to target it with that card."
  if (moveMode) return "Click a glowing square to move there. You can move once per turn."
  return "Click a card below to play it. Click Move to reposition, or End Turn when you're done."
}

export default function BattleScreen({
  state,
  onPlayCard,
  onEndTurn,
  onMove,
  onRetry,
  onChooseAnother,
  startTutorial,
  onTutorialDone,
}) {
  const [pendingCard, setPendingCard] = useState(null) // instanceId awaiting a grid-square click
  const [moveMode, setMoveMode] = useState(false)
  const [tutorialStep, setTutorialStep] = useState(startTutorial ? 0 : null) // null = tutorial not active
  const interactive = state.phase === "player"
  const currentTutorialStep = tutorialStep === null ? null : TUTORIAL_STEPS[tutorialStep]

  const pendingDef = pendingCard ? CARDS[state.hand.find((c) => c.instanceId === pendingCard)?.defId] : null
  const highlightIds = pendingDef ? candidateTargetIds(state, pendingDef) : []
  const highlightSquares = moveMode ? emptyAdjacentSquares(state, state.player.pos) : []

  function finishTutorial() {
    localStorage.setItem(TUTORIAL_SEEN_KEY, "true")
    setTutorialStep(null)
    onTutorialDone?.()
  }

  function advanceTutorialManual() {
    if (tutorialStep === null) return
    const next = tutorialStep + 1
    if (next >= TUTORIAL_STEPS.length) finishTutorial()
    else setTutorialStep(next)
  }

  // Called after a real card play / real end-turn actually happens -
  // only advances the tutorial if the step currently in progress is
  // waiting for exactly that action. Steps that just point something
  // out ("manual") are untouched here; they advance via the Next
  // button instead.
  function notifyTutorial(action) {
    if (tutorialStep === null) return
    if (TUTORIAL_STEPS[tutorialStep].advanceOn !== action) return
    advanceTutorialManual()
  }

  function handleCardClick(instanceId) {
    const instance = state.hand.find((c) => c.instanceId === instanceId)
    const def = instance && CARDS[instance.defId]
    if (!def) return

    setMoveMode(false)

    if (!cardNeedsTarget(def)) {
      onPlayCard(instanceId)
      notifyTutorial("cardPlayed")
      return
    }

    const candidates = candidateTargetIds(state, def)
    if (candidates.length === 0) return // Hand already disables this case

    // "Hit everyone the pattern reaches" cards (Rook's Charge, Bishop's
    // Slash) need no per-target choice - the engine fans the effect out
    // across every resolved square itself. Only patternSelect:"one"
    // (Knight's Leap) or an ordinary single-target card with more than
    // one legal candidate needs the player to pick a specific piece.
    const autoFire = def.pattern && def.patternSelect !== "one"
    if (autoFire || candidates.length === 1) {
      onPlayCard(instanceId, candidates[0])
      notifyTutorial("cardPlayed")
      return
    }
    setPendingCard(instanceId)
  }

  function handleSelectTarget(enemyId) {
    if (!pendingCard) return
    onPlayCard(pendingCard, enemyId)
    notifyTutorial("cardPlayed")
    setPendingCard(null)
  }

  function handleMoveToggle() {
    setPendingCard(null)
    setMoveMode((on) => !on)
  }

  function handleMoveClick(pos) {
    onMove(pos)
    setMoveMode(false)
  }

  function handleEndTurn() {
    onEndTurn()
    notifyTutorial("endTurn")
  }

  function candidateCountForHand(def) {
    return candidateTargetIds(state, def).length
  }

  return (
    <div className="hw-battle" style={{ position: "relative" }}>
      {currentTutorialStep ? (
        <div className="hw-hint hw-hint--tutorial">
          <span>{currentTutorialStep.text}</span>
          <div className="hw-tutorial-actions">
            <button className="hw-tutorial-skip" onClick={finishTutorial}>
              Skip tutorial
            </button>
            {currentTutorialStep.advanceOn === "manual" && (
              <button className="hw-tutorial-next" onClick={advanceTutorialManual}>
                {currentTutorialStep.final ? "Got it" : "Next"}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="hw-hint">{hintText(state, moveMode, pendingCard)}</div>
      )}

      <TutorialSpotlight selector={currentTutorialStep?.target} />

      <div className="hw-section-label">Battlefield</div>
      <div className="hw-top-row">
        <BattleGrid
          state={state}
          highlightIds={highlightIds}
          highlightSquares={highlightSquares}
          onSelectTarget={handleSelectTarget}
          onMoveClick={handleMoveClick}
        />
        <div className="hw-side-rail">
          <PlayerPanel player={state.player} energy={state.energy} />
          <button
            className="hw-move-btn"
            disabled={!interactive || state.player.movedThisTurn}
            onClick={handleMoveToggle}
          >
            {moveMode ? "Cancel Move" : "Move"}
          </button>
        </div>
      </div>

      <details className="hw-log-details">
        <summary>Battle log</summary>
        <div className="hw-log">
          {state.log.slice(-8).map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      </details>

      <div className="hw-section-label">Your hand</div>
      <div className="hw-bottom-row">
        <Hand
          hand={state.hand}
          energy={state.energy.current}
          playerBlock={state.player.block}
          candidateCount={candidateCountForHand}
          onCardClick={handleCardClick}
          interactive={interactive && !moveMode}
        />
        <div className="hw-piles">
          <span>Draw {state.drawPile.length}</span>
          <span>Discard {state.discardPile.length}</span>
          <span>Exhaust {state.exhaustPile.length}</span>
        </div>
        <button className="hw-end-turn" disabled={!interactive} onClick={handleEndTurn}>
          End Turn
        </button>
      </div>

      <ResultOverlay
        phase={state.phase}
        enemyName={state.enemies[0].name}
        onRetry={onRetry}
        onChooseAnother={onChooseAnother}
      />
    </div>
  )
}
