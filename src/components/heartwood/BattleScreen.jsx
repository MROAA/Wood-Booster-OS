import { useState } from "react"
import { CARDS } from "../../data/heartwood/cards"
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

export default function BattleScreen({ state, onPlayCard, onEndTurn, onMove, onRetry, onChooseAnother }) {
  const [pendingCard, setPendingCard] = useState(null) // instanceId awaiting a grid-square click
  const [moveMode, setMoveMode] = useState(false)
  const interactive = state.phase === "player"

  const pendingDef = pendingCard ? CARDS[state.hand.find((c) => c.instanceId === pendingCard)?.defId] : null
  const highlightIds = pendingDef ? candidateTargetIds(state, pendingDef) : []
  const highlightSquares = moveMode ? emptyAdjacentSquares(state, state.player.pos) : []

  function handleCardClick(instanceId) {
    const instance = state.hand.find((c) => c.instanceId === instanceId)
    const def = instance && CARDS[instance.defId]
    if (!def) return

    setMoveMode(false)

    if (!cardNeedsTarget(def)) {
      onPlayCard(instanceId)
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
      return
    }
    setPendingCard(instanceId)
  }

  function handleSelectTarget(enemyId) {
    if (!pendingCard) return
    onPlayCard(pendingCard, enemyId)
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

  function candidateCountForHand(def) {
    return candidateTargetIds(state, def).length
  }

  return (
    <div className="hw-battle" style={{ position: "relative" }}>
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

      <div className="hw-hint">{hintText(state, moveMode, pendingCard)}</div>

      <div className="hw-panel hw-mid-row">
        <div className="hw-log">
          {state.log.slice(-8).map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      </div>

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
        <button className="hw-end-turn" disabled={!interactive} onClick={onEndTurn}>
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
