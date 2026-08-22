import { useEffect } from "react"
import { UNITS } from "../../data/heartwood/units"
import { ENEMIES } from "../../data/heartwood/enemies"
import { isShielded } from "../../services/heartwood/targeting"
import { summarizeBattle } from "../../services/heartwood/autoBattleEngine"
import EnemyPieceCard from "./EnemyPieceCard"
import ResultOverlay from "./ResultOverlay"
import FloatingNumbers from "./FloatingNumbers"

// Real time between rounds during auto-playback - fast enough that a
// typical 5-10 round fight resolves in a few seconds, slow enough that
// FloatingNumbers/hit-flash are actually visible as separate events
// rather than a blur.
const ROUND_DELAY_MS = 550

function cellsByPos(units) {
  const map = {}
  for (const u of units) map[`${u.pos.row}-${u.pos.col}`] = u
  return map
}

// Replaces BattleScreen.jsx for combat: no hand, no targeting clicks,
// and (per Marc: "battle should be automated" / "skip the click
// entirely") no Auto-Resolve click either - the fight plays itself out
// automatically via the timer below. It does NOT resolve in one jump
// any more, though: an earlier version had HeartwoodBattle.jsx compute
// the whole fight synchronously before this component ever mounted, so
// `state` always arrived already at its final won/lost result - which
// meant FloatingNumbers (built to diff HP/Block between successive
// renders) never had a "before" state to compare against and silently
// showed nothing, no hit-flash, no damage numbers, just an instant cut
// to the result overlay. Marc: "peli tarvitsee lisää animaatioita ja
// selkeyttä" (the game needs more animations and clarity) - the fix
// keeps the "no clicks needed" promise intact while giving the
// animation system rounds to actually animate: onAdvanceRound fires on
// a timer for as long as state.phase === "player", same as a player
// repeatedly clicking the old "Next Round" button, just automatic.
export default function AutoBattleView({ state, essenceOnWin, onAdvanceRound, onContinue }) {
  useEffect(() => {
    if (state.phase !== "player") return
    const timer = setTimeout(onAdvanceRound, ROUND_DELAY_MS)
    return () => clearTimeout(timer)
  }, [state, onAdvanceRound])

  const playerMap = cellsByPos(state.playerUnits)
  const enemyMap = cellsByPos(state.enemies)
  const interactive = state.phase === "player"

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
            summoned={playerUnit.summoned}
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
      <div className="hw-hint">{interactive ? `Round ${state.round}. The squads clash automatically.` : "The fight is decided."}</div>

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
