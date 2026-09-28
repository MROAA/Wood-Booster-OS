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
  enterDeploy,
  previewPlayerRoster,
  ENEMY_FORMATIONS,
  PLAYER_ROSTER_IDS,
} from "../services/heartwood/tacticsEngine"
import { loadRealMatchup } from "../services/heartwood/tacticsRealMatchup"
import { applyFaction } from "../services/heartwood/tacticsFactions"
import { applyObjective, buildObjectiveSpec, OBJECTIVE_TYPES, OBJECTIVE_NAMES } from "../services/heartwood/tacticsObjectives"
import { BOSS_FIGHTS, BOSS_IDS, arenaTerrainFor, applyBossFight } from "../services/heartwood/tacticsBosses"
import { withObjectShowcase } from "../services/heartwood/tacticsObjects"
import { CLASSES } from "../data/heartwood/classes"
import { UNITS } from "../data/heartwood/units"
import "../components/heartwood/heartwood.css"
import "../components/heartwood/heartwood-tactics.css"

// The debugLowHp QA-only hook, never a real feature: `?debugLowHp=1` seeds
// every enemy at 1 HP so a verification pass (or a quick manual check) can
// reach a win in a couple of clicks instead of grinding real attack rounds
// first. Shared by the initial mount, every formation-picker restart, AND
// the real-matchup preview below.
function maybeDebugLowHp(base, showcase = false) {
  const params = new URLSearchParams(window.location.search)
  const flat = params.get("debugLowHp") === "1" ? withLowEnemyHp(base) : base
  // Destructibles: `?objects=1` (or the picker button) loads the objects showcase map.
  const battle = showcase ? withObjectShowcase(flat) : flat
  // `?deploy=1` opens the prototype in the deployment phase (the real
  // game always does); off by default so the prototype stays instant.
  return params.get("deploy") === "1" ? enterDeploy(battle) : battle
}

// Battle objectives: the prototype can try each one (Act I numbers);
// ?objective=survive|protect|totem[&reinforce=1] picks one from the URL.
function objectiveSpecFor(choice) {
  if (!choice || (choice.type === "kill" && !choice.reinforce)) return null
  const reinforce = choice.reinforce ? { turn: 3, count: 1 } : null
  return buildObjectiveSpec(choice.type, 1, { pulseKind: choice.pulseKind || "mend", reinforce })
}

function initialObjectiveChoice() {
  const params = new URLSearchParams(window.location.search)
  const type = OBJECTIVE_TYPES.includes(params.get("objective")) ? params.get("objective") : "kill"
  return { type, reinforce: params.get("reinforce") === "1", pulseKind: params.get("pulse") === "blast" ? "blast" : "mend" }
}

// `?squad=snareclaw,stoneknit` - try any real units (QA / class testing).
function initialSquad() {
  const ids = (new URLSearchParams(window.location.search).get("squad") || "").split(",").filter((id) => UNITS[id] && !UNITS[id].summonOnly)
  return ids.length ? ids.slice(0, 4) : undefined
}

function initialShowcase() {
  return new URLSearchParams(window.location.search).get("objects") === "1"
}

function startBattle(formationId, squadDefIds = initialSquad(), choice = initialObjectiveChoice(), showcase = initialShowcase()) {
  return maybeDebugLowHp(applyObjective(createTacticsBattle(formationId, squadDefIds), objectiveSpecFor(choice)), showcase)
}

// Boss fights (sprint 3): ?boss=<id> (or the picker) starts that boss's
// arena fight with the current squad.
function initialBossId() {
  const id = new URLSearchParams(window.location.search).get("boss")
  return BOSS_FIGHTS[id] ? id : null
}

function startBossBattle(bossId, squadDefIds) {
  const fight = BOSS_FIGHTS[bossId]
  const base = createRealMatchupBattle(squadDefIds || PLAYER_ROSTER_IDS.slice(0, 4), fight.enemyDefIds, "tommy", 0, arenaTerrainFor(bossId))
  return maybeDebugLowHp(applyBossFight({ ...base, formationId: null, bossPick: bossId }, bossId))
}

// Static stat lines for the squad-picker's per-slot preview, computed once
// per module load (previewPlayerRoster is pure and never changes).
const ROSTER_PREVIEW = previewPlayerRoster()

export default function HeartwoodTactics() {
  const [objectiveChoice, setObjectiveChoice] = useState(initialObjectiveChoice)
  const [battle, setBattle] = useState(() => (initialBossId() ? startBossBattle(initialBossId()) : startBattle("default", undefined, objectiveChoice)))
  const [selectedId, setSelectedId] = useState(null)
  // null = no ability targeting in progress; "heal" (ally) / "burst" (enemy) = the
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
    return battle.units.filter((u) => u.side === "player" && u.id !== "player-commander" && !u.npc).map((u) => u.defId)
  }

  function restart(formationId, squadDefIds = currentSquadDefIds(), choice = objectiveChoice, showcase = !!battle.objectShowcase) {
    setSelectedId(null)
    setAbilityMode(null)
    setBattle(startBattle(formationId || "default", squadDefIds, choice, showcase))
  }

  function restartBoss(bossId, squadDefIds = currentSquadDefIds()) {
    setSelectedId(null)
    setAbilityMode(null)
    setBattle(startBossBattle(bossId, squadDefIds))
  }

  function handleObjectiveChange(patch) {
    const choice = { ...objectiveChoice, ...patch }
    setObjectiveChoice(choice)
    restart(battle.formationId, currentSquadDefIds(), choice)
  }

  function handlePlayAgain() {
    if (usingReal) {
      startRealMatchup()
      return
    }
    if (battle.bossPick) restartBoss(battle.bossPick)
    else restart(battle.formationId)
  }

  // Swap one squad slot's unit and restart the fight with the new lineup,
  // keeping the other 2 slots and the current enemy formation untouched.
  function handleSquadSlotChange(slotIndex, defId) {
    const nextSquad = currentSquadDefIds().map((id, i) => (i === slotIndex ? defId : id))
    if (battle.bossPick) restartBoss(battle.bossPick, nextSquad)
    else restart(battle.formationId, nextSquad)
  }

  // Load the real run's actual squad + actual enemy - a snapshot preview,
  // not a live connection. Never writes anything back to the real run;
  // see tacticsRealMatchup.js for the full non-mutating guarantee. Also
  // includes the real run's own Commander (characterId/commanderRank) -
  // real-fight wiring round - so this preview stays faithful to what
  // the real Fight button now actually deploys, not a stale subset.
  function startRealMatchup() {
    if (!realMatchup) return
    setSelectedId(null)
    setAbilityMode(null)
    setUsingReal(true)
    const real = createRealMatchupBattle(realMatchup.squadDefIds, realMatchup.enemyDefIds, realMatchup.characterId, realMatchup.commanderRank, realMatchup.terrain)
    const factioned = realMatchup.faction ? applyFaction(real, realMatchup.faction) : real
    setBattle(maybeDebugLowHp(realMatchup.bossId ? applyBossFight(factioned, realMatchup.bossId) : factioned))
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
    setBattle(startBattle("default", undefined, objectiveChoice))
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
                        {preview.classId && CLASSES[preview.classId] ? ` · ${CLASSES[preview.classId].icon} ${CLASSES[preview.classId].name}` : ""}
                        {preview.ability ? ` · ${preview.ability.name}` : ""}
                        {preview.spiritbound ? " · Spirit Shift (brings a Spirit Wolf)" : ""}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {!usingReal && (
          <div className="hwt-formation-picker hwt-objective-picker">
            <p className="hwt-formation-label">Try an objective</p>
            <div className="hwt-formation-buttons">
              {OBJECTIVE_TYPES.map((type) => (
                <button
                  key={type}
                  className="hwt-formation-btn"
                  data-objective-choice={type}
                  data-active={objectiveChoice.type === type}
                  onClick={() => handleObjectiveChange({ type })}
                >
                  {OBJECTIVE_NAMES[type]}
                </button>
              ))}
              {objectiveChoice.type === "totem" && (
                <button
                  className="hwt-formation-btn"
                  data-objective-choice="pulse"
                  onClick={() => handleObjectiveChange({ pulseKind: objectiveChoice.pulseKind === "blast" ? "mend" : "blast" })}
                >
                  Totem: {objectiveChoice.pulseKind === "blast" ? "Blast" : "Mend"}
                </button>
              )}
              <button
                className="hwt-formation-btn"
                data-objective-choice="reinforce"
                data-active={objectiveChoice.reinforce}
                onClick={() => handleObjectiveChange({ reinforce: !objectiveChoice.reinforce })}
              >
                + Reinforcements
              </button>
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
        {!usingReal && (
          <div className="hwt-formation-picker hwt-objects-picker">
            <p className="hwt-formation-label">Battlefield</p>
            <div className="hwt-formation-buttons">
              <button
                className="hwt-formation-btn"
                data-objects-showcase
                data-active={!!battle.objectShowcase}
                title="Trees, powder barrels, a spore pod, a boulder and ice pillars - everything on this map can be smashed"
                onClick={() => (battle.bossPick ? restart("default", currentSquadDefIds(), objectiveChoice, true) : restart(battle.formationId, currentSquadDefIds(), objectiveChoice, !battle.objectShowcase))}
              >
                🌲 Destructibles showcase
              </button>
            </div>
          </div>
        )}
        {!usingReal && (
          <div className="hwt-formation-picker hwt-boss-picker">
            <p className="hwt-formation-label">Boss fights</p>
            <div className="hwt-formation-buttons">
              {BOSS_IDS.map((id) => (
                <button
                  key={id}
                  className="hwt-boss-btn"
                  data-boss-choice={id}
                  data-active={battle.bossPick === id}
                  title={BOSS_FIGHTS[id].title}
                  onClick={() => restartBoss(id)}
                >
                  {BOSS_FIGHTS[id].name}
                </button>
              ))}
            </div>
          </div>
        )}
      </TacticsBoard>
    </div>
  )
}
