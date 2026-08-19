import { ENEMIES } from "../../data/heartwood/enemies"
import { isShielded } from "../../services/heartwood/targeting"
import EnemyPieceCard from "./EnemyPieceCard"

function enemyAt(state, row, col) {
  return state.enemies.find((e) => e.pos.row === row && e.pos.col === col)
}

// The 3x3 tactical board. Each square holds at most one enemy piece
// (living or defeated, kept for the death visual) or the player token.
// Two independent highlight sets can be active at once conceptually but
// the UI only ever shows one at a time: `highlightIds` (enemy pieces
// that are legal targets for the card/pattern currently being played)
// or `highlightSquares` (empty squares the player can move into).
export default function BattleGrid({ state, highlightIds = [], highlightSquares = [], onSelectTarget, onMoveClick }) {
  const rows = []
  for (let row = 0; row < state.grid.rows; row++) {
    const cells = []
    for (let col = 0; col < state.grid.cols; col++) {
      const enemy = enemyAt(state, row, col)
      const isPlayerHere = state.player.pos.row === row && state.player.pos.col === col
      const isMoveTarget = highlightSquares.some((s) => s.row === row && s.col === col)

      let content = null
      if (enemy) {
        content = (
          <EnemyPieceCard
            enemy={enemy}
            art={ENEMIES[enemy.defId].art}
            shielded={isShielded(state, enemy.id)}
            highlighted={highlightIds.includes(enemy.id)}
            onClick={highlightIds.includes(enemy.id) ? () => onSelectTarget(enemy.id) : undefined}
          />
        )
      } else if (isPlayerHere) {
        content = <div className="hw-player-token">You</div>
      }

      cells.push(
        <div
          key={`${row}-${col}`}
          className="hw-grid-cell"
          data-move-target={isMoveTarget}
          onClick={isMoveTarget ? () => onMoveClick({ row, col }) : undefined}
        >
          {content}
        </div>,
      )
    }
    rows.push(
      <div className="hw-grid-row" key={row}>
        {cells}
      </div>,
    )
  }

  return <div className="hw-grid">{rows}</div>
}
