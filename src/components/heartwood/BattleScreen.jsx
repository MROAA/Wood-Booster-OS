import { ENEMIES } from "../../data/heartwood/enemies"
import EnemyPanel from "./EnemyPanel"
import PlayerPanel from "./PlayerPanel"
import Hand from "./Hand"
import ResultOverlay from "./ResultOverlay"

export default function BattleScreen({ state, onPlayCard, onEndTurn, onRetry, onChooseAnother }) {
  // Phase 1 bridge: render the first enemy piece through the existing
  // single-enemy EnemyPanel until BattleGrid replaces this in Phase 2.
  // Every formation currently defined (including the 1-piece backward-
  // compat adapter for the 3 original solo fights) has enemies[0].
  const firstEnemy = state.enemies[0]
  const enemyDef = ENEMIES[firstEnemy.defId]
  const interactive = state.phase === "player"

  return (
    <div className="hw-battle" style={{ position: "relative" }}>
      <div className="hw-top-row">
        <EnemyPanel enemy={firstEnemy} art={enemyDef.art} />
        <PlayerPanel player={state.player} energy={state.energy} />
      </div>

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
          onPlayCard={onPlayCard}
          interactive={interactive}
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
        enemyName={firstEnemy.name}
        onRetry={onRetry}
        onChooseAnother={onChooseAnother}
      />
    </div>
  )
}
