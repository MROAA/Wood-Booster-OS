import { ENEMIES } from "../../data/heartwood/enemies"
import EnemyPanel from "./EnemyPanel"
import PlayerPanel from "./PlayerPanel"
import Hand from "./Hand"
import ResultOverlay from "./ResultOverlay"

export default function BattleScreen({ state, onPlayCard, onEndTurn, onRetry, onChooseAnother }) {
  const enemyDef = ENEMIES[state.enemy.id]
  const interactive = state.phase === "player"

  return (
    <div className="hw-battle" style={{ position: "relative" }}>
      <div className="hw-top-row">
        <EnemyPanel enemy={state.enemy} art={enemyDef.art} />
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
        enemyName={state.enemy.name}
        onRetry={onRetry}
        onChooseAnother={onChooseAnother}
      />
    </div>
  )
}
