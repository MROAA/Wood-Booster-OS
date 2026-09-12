// Hearthwood Frontier (feat/hearthwood-tactics-prototype) - Phase 1 of the
// turn-based pivot: a fully isolated, playable grid-combat prototype. Local
// state only - no localStorage, no runEngine.js, no autoBattleEngine.js, no
// connection whatsoever to a real run. Its only job is to let Marc actually
// click through a turn-based fight and feel whether it's more fun to PLAY
// than the auto-battler is to watch.
import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { CardGlyph } from "../components/heartwood/cardArt"
import { kingAdjacent } from "../services/heartwood/targeting"
import {
  createTacticsBattle,
  reachableTilesFor,
  attackableTargets,
  moveUnit,
  attackUnit,
  castAbility,
  endPlayerTurn,
  withLowEnemyHp,
  previewEnemyIntents,
  ENEMY_FORMATIONS,
} from "../services/heartwood/tacticsEngine"
import "../components/heartwood/heartwood.css"
import "../components/heartwood/heartwood-tactics.css"

function apPips(unit) {
  return Array.from({ length: unit.apMax }, (_, i) => (i < unit.ap ? "●" : "○")).join("")
}

function getUnitName(battle, id) {
  return battle.units.find((u) => u.id === id)?.name || "?"
}

// The debugLowHp QA-only hook, never a real feature: `?debugLowHp=1` seeds
// every enemy at 1 HP so a verification pass (or a quick manual check) can
// reach a win in a couple of clicks instead of grinding real attack rounds
// first. Shared by the initial mount AND every formation-picker restart.
function startBattle(formationId) {
  const base = createTacticsBattle(formationId)
  const params = new URLSearchParams(window.location.search)
  return params.get("debugLowHp") === "1" ? withLowEnemyHp(base) : base
}

export default function HeartwoodTactics() {
  const [battle, setBattle] = useState(() => startBattle("default"))
  const [selectedId, setSelectedId] = useState(null)
  // null = no ability targeting in progress; "heal" / "burst" = the
  // selected unit's ability is armed and waiting for a target click.
  // "aura-block" needs no mode - it applies the instant the button is hit.
  const [abilityMode, setAbilityMode] = useState(null)

  const selected = battle.units.find((u) => u.id === selectedId) || null
  const reachable = useMemo(
    () => (selected && selected.ap > 0 && !abilityMode && battle.phase === "player" ? reachableTilesFor(battle, selected.id) : []),
    [battle, selected, abilityMode],
  )
  const targets = useMemo(
    () => (selected && selected.ap > 0 && battle.phase === "player" && abilityMode !== "heal" ? attackableTargets(battle, selected.id) : []),
    [battle, selected, abilityMode],
  )
  // Ability-only highlight: self + adjacent living allies, only while the
  // Regrowth heal ability is armed. Distinct data-attr from the move
  // highlight even though both lean on the same moss accent.
  const healable = useMemo(
    () =>
      selected && abilityMode === "heal" && battle.phase === "player"
        ? battle.units.filter((u) => u.hp > 0 && u.side === selected.side && (u.id === selected.id || kingAdjacent(u.pos, selected.pos)))
        : [],
    [battle, selected, abilityMode],
  )
  // What every living enemy currently plans to do this coming enemy phase -
  // recomputed fresh from the live board each render, so it's always exactly
  // what will happen if the player ends the turn right now, never a stale
  // guess. See tacticsEngine.js's previewEnemyIntents for the accuracy proof.
  const intents = useMemo(
    () => (battle.phase === "player" ? previewEnemyIntents(battle) : []),
    [battle],
  )
  const intentByEnemyId = useMemo(() => new Map(intents.map((i) => [i.enemyId, i.intent])), [intents])
  const threatenedIds = useMemo(() => {
    const ids = new Set()
    for (const { intent } of intents) {
      if (intent.kind === "attack" || intent.kind === "move-attack") ids.add(intent.targetId)
    }
    return ids
  }, [intents])

  const cellUnit = (row, col) => battle.units.find((u) => u.pos.row === row && u.pos.col === col && u.hp > 0)
  const isReachable = (row, col) => reachable.some((p) => p.row === row && p.col === col)
  const targetHere = (row, col) => targets.find((t) => t.pos.row === row && t.pos.col === col)
  const healableHere = (row, col) => healable.find((u) => u.pos.row === row && u.pos.col === col)

  function handleCellClick(row, col) {
    if (battle.phase !== "player") return

    if (selected && abilityMode === "heal") {
      const healTarget = healableHere(row, col)
      if (healTarget) setBattle(castAbility(battle, selected.id, healTarget.id))
      setAbilityMode(null)
      return
    }

    if (selected && abilityMode === "burst") {
      const target = targetHere(row, col)
      if (target) setBattle(castAbility(battle, selected.id, target.id))
      setAbilityMode(null)
      return
    }

    const target = targetHere(row, col)
    if (selected && target) {
      setBattle(attackUnit(battle, selected.id, target.id))
      return
    }
    if (selected && isReachable(row, col)) {
      setBattle(moveUnit(battle, selected.id, { row, col }))
      return
    }
    const occupant = cellUnit(row, col)
    if (occupant && occupant.side === "player" && occupant.ap > 0) {
      setSelectedId(occupant.id)
    } else {
      setSelectedId(null)
    }
    setAbilityMode(null)
  }

  function handleAbilityClick() {
    if (!selected || !selected.ability || battle.phase !== "player") return
    const ability = selected.ability
    if (selected.ap < ability.cost || selected.cooldownRemaining > 0) return
    if (ability.kind === "aura-block") {
      setBattle(castAbility(battle, selected.id))
      setAbilityMode(null)
      return
    }
    const kind = ability.kind === "heal" ? "heal" : "burst"
    setAbilityMode((prev) => (prev === kind ? null : kind))
  }

  function handleEndTurn() {
    setSelectedId(null)
    setAbilityMode(null)
    setBattle(endPlayerTurn(battle))
  }

  function restart(formationId) {
    setSelectedId(null)
    setAbilityMode(null)
    setBattle(startBattle(formationId))
  }

  function handlePlayAgain() {
    restart(battle.formationId)
  }

  const cells = []
  for (let row = 0; row < battle.grid.rows; row++) {
    for (let col = 0; col < battle.grid.cols; col++) {
      const unit = cellUnit(row, col)
      const reach = selected && isReachable(row, col)
      const target = selected && targetHere(row, col)
      const healTarget = selected && healableHere(row, col)
      const threatened = unit && unit.side === "player" && threatenedIds.has(unit.id)
      const intent = unit && unit.side === "enemy" ? intentByEnemyId.get(unit.id) : null
      cells.push(
        <div
          key={`${row}-${col}`}
          className="hwt-cell"
          data-reachable={!!reach}
          data-targetable={!!target}
          data-healable={!!healTarget}
          data-threatened={!!threatened}
          onClick={() => handleCellClick(row, col)}
        >
          {unit && (
            <motion.div
              layout
              layoutId={unit.id}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="hwt-token"
              data-side={unit.side}
              data-selectable={unit.side === "player" && battle.phase === "player"}
              data-selected={unit.id === selectedId}
              data-acted={unit.ap <= 0}
            >
              <div className="hwt-token-status">
                <span className="hwt-ap-pips" title={`${unit.ap}/${unit.apMax} AP`}>
                  {apPips(unit)}
                </span>
                {unit.block > 0 && (
                  <span className="hwt-block-badge" title={`${unit.block} Block`}>
                    <CardGlyph name="shield" className="hwt-block-icon" />
                    {unit.block}
                  </span>
                )}
                {unit.cooldownRemaining > 0 && (
                  <span className="hwt-cooldown-badge" title={`Ability recharging - ${unit.cooldownRemaining} turn(s)`}>
                    ⏳{unit.cooldownRemaining}
                  </span>
                )}
                {intent && (intent.kind === "attack" || intent.kind === "move-attack") && (
                  <span className="hwt-intent-badge" data-intent="attack" title={`Will strike ${getUnitName(battle, intent.targetId)}`}>
                    <CardGlyph name="sword" className="hwt-intent-icon" />
                  </span>
                )}
                {intent && intent.kind === "move" && (
                  <span className="hwt-intent-badge" data-intent="move" title="Advancing">
                    ➤
                  </span>
                )}
              </div>
              <CardGlyph name={unit.art} className="hwt-token-glyph" />
              <span className="hwt-token-name">{unit.name}</span>
              <div className="hwt-hp-track">
                <div className="hwt-hp-fill" style={{ width: `${Math.max(0, Math.round((unit.hp / unit.maxHp) * 100))}%` }} />
              </div>
            </motion.div>
          )}
        </div>,
      )
    }
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

      <div className="hwt-layout">
        <div
          className="hwt-board"
          style={{ gridTemplateColumns: `repeat(${battle.grid.cols}, 76px)`, gridTemplateRows: `repeat(${battle.grid.rows}, 76px)` }}
        >
          {cells}
        </div>

        <div className="hwt-panel">
          <div className="hwt-turn-label" data-phase={battle.phase}>
            {battle.phase === "player" && `Player Turn ${battle.turn}`}
            {battle.phase === "enemy" && "Enemy Turn"}
            {battle.phase === "won" && "Victory"}
            {battle.phase === "lost" && "Defeat"}
          </div>
          <button className="hwt-end-turn" onClick={handleEndTurn} disabled={battle.phase !== "player"}>
            End Turn
          </button>
          {selected && selected.side === "player" && selected.ability && battle.phase === "player" && (
            <div className="hwt-ability-panel">
              <button
                className="hwt-ability-btn"
                data-active={!!abilityMode}
                disabled={selected.ap < selected.ability.cost || selected.cooldownRemaining > 0}
                onClick={handleAbilityClick}
              >
                {selected.cooldownRemaining > 0
                  ? `${selected.ability.name} · Recharging (${selected.cooldownRemaining})`
                  : `${selected.ability.name} · ${selected.ability.cost} AP`}
              </button>
              {abilityMode && (
                <p className="hwt-ability-hint">
                  {abilityMode === "heal" ? "Choose an ally to heal." : "Choose an enemy for Focused Shot."}
                </p>
              )}
            </div>
          )}
          <div className="hwt-log">
            {[...battle.log].reverse().map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>

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
        </div>
      </div>

      {(battle.phase === "won" || battle.phase === "lost") && (
        <div className="hwt-result">
          <div className="hwt-result-title" data-outcome={battle.phase}>
            {battle.phase === "won" ? "Victory" : "Defeat"}
          </div>
          <div className="hwt-result-actions">
            <button onClick={handlePlayAgain}>Play Again</button>
            <Link to="/heartwood">Back to Hearthwood</Link>
          </div>
        </div>
      )}
    </div>
  )
}
