import { UNITS } from "../../data/heartwood/units"
import { ENEMIES } from "../../data/heartwood/enemies"
import { resolveFormation } from "../../data/heartwood/formations"
import UnitCard from "./UnitCard"
import EnemyPieceCard from "./EnemyPieceCard"

// Same 4 positions autoBattleEngine.js deploys units to - kept in sync
// by hand since the engine doesn't export it, but both only ever
// change together.
const SLOT_POSITIONS = [
  { row: 2, col: 0 },
  { row: 2, col: 1 },
  { row: 2, col: 2 },
  { row: 1, col: 1 },
]

function slotIndexAt(row, col) {
  return SLOT_POSITIONS.findIndex((p) => p.row === row && p.col === col)
}

// The battlefield preview: the same checkerboard grid the fight itself
// resolves on, with the real upcoming enemy formation ghosted in at its
// real positions and empty/filled deploy slots where the squad goes -
// placement now happens on an actual board, not a generic card list.
export default function FormationScreen({ runState, node, onAssign, onClear, onStartBattle }) {
  const isBoss = node.type === "boss"
  const formation = resolveFormation(node.formationId || node.enemyId)
  const deployedCount = runState.deployed.filter((k) => k !== null).length

  function handleBenchClick(benchKey) {
    const slotIndex = runState.deployed.indexOf(benchKey)
    if (slotIndex !== -1) {
      onClear(slotIndex)
      return
    }
    const emptySlot = runState.deployed.indexOf(null)
    if (emptySlot !== -1) onAssign(emptySlot, benchKey)
  }

  const rows = []
  for (let row = 0; row < 3; row++) {
    const cells = []
    for (let col = 0; col < 3; col++) {
      const enemyPiece = formation.pieces.find((p) => p.pos.row === row && p.pos.col === col)
      const slotIndex = slotIndexAt(row, col)
      let content = null

      if (enemyPiece) {
        const def = ENEMIES[enemyPiece.defId]
        const previewEnemy = { id: `preview-${row}-${col}`, name: def.name, hp: def.maxHp, maxHp: def.maxHp, block: 0, intent: null, powers: {} }
        content = <EnemyPieceCard enemy={previewEnemy} art={def.art} />
      } else if (slotIndex !== -1) {
        const benchKey = runState.deployed[slotIndex]
        const entry = benchKey !== null ? runState.bench.find((e) => e.key === benchKey) : null
        if (entry) {
          const def = UNITS[entry.defId]
          const previewUnit = { id: `slot-${slotIndex}`, name: def.name, hp: def.maxHp, maxHp: def.maxHp, block: 0, intent: null, powers: {} }
          // Same column-1 forward/back pair as autoBattleEngine.js's
          // real isShielded check, computed by hand here since there's
          // no battle state yet to ask - slot 1 (row 2, col 1) is
          // shielded exactly when slot 3 (row 1, col 1) is filled.
          const shielded = slotIndex === 1 && runState.deployed[3] !== null
          content = (
            <EnemyPieceCard
              enemy={previewUnit}
              art={def.art}
              side="player"
              shielded={shielded}
              onClick={() => handleBenchClick(entry.key)}
            />
          )
        }
      }

      cells.push(
        <div
          key={`${row}-${col}`}
          className="hw-grid-cell"
          data-tile={(row + col) % 2 === 0 ? "a" : "b"}
          data-empty={!content}
          data-move-target={slotIndex !== -1 && !content}
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

  return (
    <div className="hw-intro">
      <h1 style={{ fontSize: 22, marginBottom: 6 }}>Take the field</h1>
      <p className="hw-flavor">
        {isBoss ? "The final fight." : formation.description || ENEMIES[node.enemyId]?.description}
      </p>

      <div className="hw-section-label">Battlefield</div>
      <div className="hw-grid" style={{ marginBottom: 16 }}>
        {rows}
      </div>
      <p className="hw-flavor" style={{ marginTop: -10, marginBottom: 10 }}>
        The front-center slot shields whoever you place directly behind it.
      </p>

      <p style={{ fontSize: 12, color: "var(--hw-muted)" }}>
        Bench ({deployedCount} / {runState.deployed.length} deployed) - click to place, click again to pull back.
        Three of the same unit fuse automatically.
      </p>
      <div className="hw-select-grid hw-deck-preview">
        {runState.bench.map((entry) => (
          <UnitCard
            key={entry.key}
            def={UNITS[entry.defId]}
            selected={runState.deployed.includes(entry.key)}
            onClick={() => handleBenchClick(entry.key)}
          />
        ))}
      </div>

      <button className="hw-end-turn" disabled={deployedCount === 0} onClick={onStartBattle} style={{ marginTop: 16 }}>
        Start Battle
      </button>
    </div>
  )
}
