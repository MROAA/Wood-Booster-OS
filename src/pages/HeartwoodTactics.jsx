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
import {
  createTacticsBattle,
  reachableTilesFor,
  attackableTargets,
  moveUnit,
  attackUnit,
  endPlayerTurn,
  withLowEnemyHp,
} from "../services/heartwood/tacticsEngine"
import "../components/heartwood/heartwood.css"
import "../components/heartwood/heartwood-tactics.css"

// QA-only hook, never a real feature: `?debugLowHp=1` seeds every enemy at
// 1 HP so a verification pass (or a quick manual check) can reach a win in
// a couple of clicks instead of grinding real attack rounds first.
function initialBattle() {
  const base = createTacticsBattle()
  const params = new URLSearchParams(window.location.search)
  return params.get("debugLowHp") === "1" ? withLowEnemyHp(base) : base
}

export default function HeartwoodTactics() {
  const [battle, setBattle] = useState(initialBattle)
  const [selectedId, setSelectedId] = useState(null)

  const selected = battle.units.find((u) => u.id === selectedId) || null
  const reachable = useMemo(
    () => (selected && !selected.moved && battle.phase === "player" ? reachableTilesFor(battle, selected.id) : []),
    [battle, selected],
  )
  const targets = useMemo(
    () => (selected && !selected.attacked && battle.phase === "player" ? attackableTargets(battle, selected.id) : []),
    [battle, selected],
  )

  const cellUnit = (row, col) => battle.units.find((u) => u.pos.row === row && u.pos.col === col && u.hp > 0)
  const isReachable = (row, col) => reachable.some((p) => p.row === row && p.col === col)
  const targetHere = (row, col) => targets.find((t) => t.pos.row === row && t.pos.col === col)

  function handleCellClick(row, col) {
    if (battle.phase !== "player") return
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
    if (occupant && occupant.side === "player" && !(occupant.moved && occupant.attacked)) {
      setSelectedId(occupant.id)
    } else {
      setSelectedId(null)
    }
  }

  function handleEndTurn() {
    setSelectedId(null)
    setBattle(endPlayerTurn(battle))
  }

  function handlePlayAgain() {
    setSelectedId(null)
    setBattle(createTacticsBattle())
  }

  const cells = []
  for (let row = 0; row < battle.grid.rows; row++) {
    for (let col = 0; col < battle.grid.cols; col++) {
      const unit = cellUnit(row, col)
      const reach = selected && isReachable(row, col)
      const target = selected && targetHere(row, col)
      cells.push(
        <div
          key={`${row}-${col}`}
          className="hwt-cell"
          data-reachable={!!reach}
          data-targetable={!!target}
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
              data-acted={unit.moved && unit.attacked}
            >
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
          <div className="hwt-log">
            {[...battle.log].reverse().map((line, i) => (
              <p key={i}>{line}</p>
            ))}
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
