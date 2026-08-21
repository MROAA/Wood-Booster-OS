import { UNITS } from "../../data/heartwood/units"
import { ENEMIES } from "../../data/heartwood/enemies"
import { isShielded } from "../../services/heartwood/targeting"
import { summarizeBattle } from "../../services/heartwood/autoBattleEngine"
import EnemyPieceCard from "./EnemyPieceCard"
import ResultOverlay from "./ResultOverlay"
import FloatingNumbers from "./FloatingNumbers"

function cellsByPos(units) {
  const map = {}
  for (const u of units) map[`${u.pos.row}-${u.pos.col}`] = u
  return map
}

// Replaces BattleScreen.jsx for combat: no hand, no targeting clicks,
// and (per Marc: "battle should be automated") no Auto-Resolve click
// either - HeartwoodBattle.jsx's handleStartBattle resolves the whole
// fight synchronously before this ever mounts, so `state` arrives
// already decided. Reuses EnemyPieceCard.jsx for both sides (it
// already renders exactly what a unit needs: art, HP bar, intent,
// block/power badges) and FloatingNumbers.jsx for the same hit-flash/
// damage-pop feedback the turn-based game already had.
export default function AutoBattleView({ state, essenceOnWin, onContinue }) {
  const playerMap = cellsByPos(state.playerUnits)
  const enemyMap = cellsByPos(state.enemies)

  const rows = []
  for (let row = 0; row < state.grid.rows; row++) {
    const cells = []
    for (let col = 0; col < state.grid.cols; col++) {
      const key = `${row}-${col}`
      const enemy = enemyMap[key]
      const playerUnit = playerMap[key]
      let content = null
      if (enemy) {
        content = (
          <EnemyPieceCard enemy={enemy} art={ENEMIES[enemy.defId].art} shielded={isShielded(state, enemy.id)} />
        )
      } else if (playerUnit) {
        content = (
          <EnemyPieceCard
            enemy={playerUnit}
            art={UNITS[playerUnit.defId].art}
            side="player"
            shielded={isShielded(state, playerUnit.id)}
          />
        )
      }
      cells.push(
        <div key={key} className="hw-grid-cell" data-tile={(row + col) % 2 === 0 ? "a" : "b"} data-empty={!content}>
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

  return (
    <div className="hw-battle" style={{ position: "relative" }}>
      <div className="hw-hint">The fight is decided.</div>

      <FloatingNumbers state={state} />

      <div className="hw-section-label">Battlefield</div>
      <div className="hw-grid">{rows}</div>

      <details className="hw-log-details">
        <summary>Battle log</summary>
        <div className="hw-log">
          {state.log.slice(-10).map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      </details>

      <ResultOverlay
        phase={state.phase}
        enemyName={state.enemies[0]?.name || "The enemy"}
        stats={state.phase === "won" || state.phase === "lost" ? summarizeBattle(state) : null}
        essenceOnWin={essenceOnWin}
        onContinue={onContinue}
      />
    </div>
  )
}
