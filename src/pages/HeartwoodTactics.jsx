// Hearthwood Frontier (feat/hearthwood-tactics-prototype) - Phase 1 of the
// turn-based pivot: a fully isolated, playable grid-combat prototype. Local
// state only - no localStorage, no runEngine.js, no autoBattleEngine.js, no
// connection whatsoever to a real run. Its only job is to let Marc actually
// click through a turn-based fight and feel whether it's more fun to PLAY
// than the auto-battler is to watch.
//
// The board/panel/result rendering + click-dispatch logic itself lives in
// TacticsBoard.jsx (Phase 4 second slice: "fight one real battle for
// real") - extracted so the real-in-run battle branch in
// HeartwoodBattle.jsx can share it instead of duplicating every archetype
// badge. This page still owns ALL its own state/handlers exactly as
// before the extraction - only the JSX moved.
import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import TacticsBoard from "../components/heartwood/TacticsBoard"
import {
  createTacticsBattle,
  createRealMatchupBattle,
  withLowEnemyHp,
  previewPlayerRoster,
  ENEMY_FORMATIONS,
  PLAYER_ROSTER_IDS,
} from "../services/heartwood/tacticsEngine"
import { loadRealMatchup } from "../services/heartwood/tacticsRealMatchup"
import "../components/heartwood/heartwood.css"
import "../components/heartwood/heartwood-tactics.css"

// The debugLowHp QA-only hook, never a real feature: `?debugLowHp=1` seeds
// every enemy at 1 HP so a verification pass (or a quick manual check) can
// reach a win in a couple of clicks instead of grinding real attack rounds
// first. Shared by the initial mount, every formation-picker restart, AND
// the real-matchup preview below.
function maybeDebugLowHp(base) {
  const params = new URLSearchParams(window.location.search)
  return params.get("debugLowHp") === "1" ? withLowEnemyHp(base) : base
}

function startBattle(formationId, squadDefIds) {
  return maybeDebugLowHp(createTacticsBattle(formationId, squadDefIds))
}

// Static stat lines for the squad-picker's per-slot preview, computed once
// per module load (previewPlayerRoster is pure and never changes).
const ROSTER_PREVIEW = previewPlayerRoster()

export default function HeartwoodTactics() {
  const [battle, setBattle] = useState(() => startBattle("default"))
  const [selectedId, setSelectedId] = useState(null)
  // null = no ability targeting in progress; "heal" / "burst" = the
  // selected unit's ability is armed and waiting for a target click.
  // "aura-block" needs no mode - it applies the instant the button is hit.
  const [abilityMode, setAbilityMode] = useState(null)
  // Phase 4's "real preview" bridge: a one-time read of the real run's
  // save (a snapshot, not a live sync - this is a preview, not a mirror).
  // null when there's no real run, the player isn't in front of a fight,
  // or the encounter/squad can't be resolved - see tacticsRealMatchup.js.
  const realMatchup = useMemo(() => loadRealMatchup(), [])
  const [usingReal, setUsingReal] = useState(false)

  // The squad currently deployed, read straight off the live battle state
  // rather than a module constant - so a formation-only restart (below)
  // preserves whatever squad is actually in play instead of silently
  // resetting to the default. Excludes the Commander (Commander round):
  // it isn't recruited or swappable via the roster in the real game
  // either - a fixed, separate slot, not a 5th interchangeable pick.
  function currentSquadDefIds() {
    return battle.units.filter((u) => u.side === "player" && u.id !== "player-commander").map((u) => u.defId)
  }

  function restart(formationId, squadDefIds = currentSquadDefIds()) {
    setSelectedId(null)
    setAbilityMode(null)
    setBattle(startBattle(formationId, squadDefIds))
  }

  function handlePlayAgain() {
    if (usingReal) {
      startRealMatchup()
      return
    }
    restart(battle.formationId)
  }

  // Swap one squad slot's unit and restart the fight with the new lineup,
  // keeping the other 2 slots and the current enemy formation untouched.
  function handleSquadSlotChange(slotIndex, defId) {
    const nextSquad = currentSquadDefIds().map((id, i) => (i === slotIndex ? defId : id))
    restart(battle.formationId, nextSquad)
  }

  // Load the real run's actual squad + actual enemy - a snapshot preview,
  // not a live connection. Never writes anything back to the real run;
  // see tacticsRealMatchup.js for the full non-mutating guarantee.
  function startRealMatchup() {
    if (!realMatchup) return
    setSelectedId(null)
    setAbilityMode(null)
    setUsingReal(true)
    setBattle(maybeDebugLowHp(createRealMatchupBattle(realMatchup.squadDefIds, realMatchup.enemyDefIds)))
  }

  // The one way out of real-matchup mode - back to today's exact default
  // state (calls startBattle("default") with no squad arg, so it resolves
  // through createTacticsBattle's own PLAYER_DEF_IDS default - the 4
  // recruited units plus the Commander, since the Commander round - never
  // whatever real squad happened to be on the board).
  function backToTestSquad() {
    setUsingReal(false)
    setSelectedId(null)
    setAbilityMode(null)
    setBattle(startBattle("default"))
  }

  return (
    <div className="hw-root hwt-page">
      <div className="hwt-header">
        <h1 className="hwt-title">
          Hearthwood Frontier <span className="hwt-wip">Prototype</span>
        </h1>
        <Link className="hwt-exit" to="/heartwood">
          ← Back to Hearthwood
        </Link>
      </div>

      <TacticsBoard
        battle={battle}
        onBattleChange={setBattle}
        selectedId={selectedId}
        onSelectedIdChange={setSelectedId}
        abilityMode={abilityMode}
        onAbilityModeChange={setAbilityMode}
        resultActions={
          <>
            <button onClick={handlePlayAgain}>Play Again</button>
            <Link to="/heartwood">Back to Hearthwood</Link>
          </>
        }
      >
        {realMatchup && (
          <div className="hwt-real-matchup">
            {usingReal ? (
              <>
                <p className="hwt-real-matchup-label">
                  Previewing your real run's next fight — nothing here affects your real run.
                </p>
                <button className="hwt-real-matchup-btn" onClick={backToTestSquad}>
                  Back to test squad
                </button>
              </>
            ) : (
              <>
                <p className="hwt-real-matchup-label">A real fight from your run is available: {realMatchup.label}</p>
                <button className="hwt-real-matchup-btn" onClick={startRealMatchup}>
                  Preview it
                </button>
              </>
            )}
          </div>
        )}

        {!usingReal && (
          <div className="hwt-squad-picker">
            <p className="hwt-squad-picker-label">Choose your squad</p>
            <div className="hwt-squad-picker-slots">
              {currentSquadDefIds().map((defId, slotIndex) => {
                const preview = ROSTER_PREVIEW.find((u) => u.defId === defId)
                const otherSlots = currentSquadDefIds().filter((_, i) => i !== slotIndex)
                const options = PLAYER_ROSTER_IDS.filter((id) => id === defId || !otherSlots.includes(id))
                return (
                  <div className="hwt-squad-slot" key={slotIndex}>
                    <select
                      className="hwt-squad-select"
                      value={defId}
                      onChange={(e) => handleSquadSlotChange(slotIndex, e.target.value)}
                    >
                      {options.map((id) => {
                        const opt = ROSTER_PREVIEW.find((u) => u.defId === id)
                        return (
                          <option key={id} value={id}>
                            {opt.name}
                          </option>
                        )
                      })}
                    </select>
                    {preview && (
                      <p className="hwt-squad-slot-stats">
                        HP {preview.maxHp} · Atk {preview.attack} · Range {preview.range}
                        {preview.ability ? ` · ${preview.ability.name}` : ""}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {!usingReal && (
          <div className="hwt-formation-picker">
            <p className="hwt-formation-label">Choose your opponent</p>
            <div className="hwt-formation-buttons">
              {Object.values(ENEMY_FORMATIONS).map((f) => (
                <button
                  key={f.id}
                  className="hwt-formation-btn"
                  data-active={battle.formationId === f.id}
                  title={f.description}
                  onClick={() => restart(f.id)}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </TacticsBoard>
    </div>
  )
}
