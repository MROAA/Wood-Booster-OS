import { UNITS } from "../../data/heartwood/units"
import { ENEMIES } from "../../data/heartwood/enemies"
import { CHARACTERS } from "../../data/heartwood/characters"
import { resolveFormation } from "../../data/heartwood/formations"
import { TRIBES, resolveSynergies, nextSynergyThreshold } from "../../data/heartwood/synergies"
import { effectiveRole } from "../../data/heartwood/items"
import { deployedTribeCounts } from "../../services/heartwood/runEngine"
import UnitCard from "./UnitCard"
import EnemyPieceCard from "./EnemyPieceCard"
import { CardGlyph } from "./cardArt"

// Same 4 positions autoBattleEngine.js deploys units to - kept in sync
// by hand since the engine doesn't export it, but both only ever
// change together.
const SLOT_POSITIONS = [
  { row: 2, col: 0 },
  { row: 2, col: 1 },
  { row: 2, col: 2 },
  { row: 1, col: 1 },
]

// The Commander's own fixed slot - autoBattleEngine.js's own
// COMMANDER_POSITION, duplicated here for the same reason
// SLOT_POSITIONS already is (no shared export between the engine and
// this preview).
const COMMANDER_POSITION = { row: 1, col: 0 }

function slotIndexAt(row, col) {
  return SLOT_POSITIONS.findIndex((p) => p.row === row && p.col === col)
}

// The battlefield preview: the same checkerboard grid the fight itself
// resolves on, with the real upcoming enemy formation ghosted in at its
// real positions and empty/filled deploy slots where the squad goes -
// placement now happens on an actual board, not a generic card list.
export default function FormationScreen({ runState, node, onAssign, onClear, onStartBattle }) {
  const isBoss = node.type === "boss"
  const isMiniboss = node.type === "miniboss"
  const formation = resolveFormation(node.formationId || node.enemyId)
  const deployedCount = runState.deployed.filter((k) => k !== null).length
  // Tribe synergies (synergies.js) - counted from DEPLOYED units only,
  // same scope autoBattleEngine.js's own tribe loop uses for the real
  // effect, so this tracker can never show something the battle won't
  // actually grant. This screen (pre-battle planning) is where the
  // "easy to play, hard to master" depth is supposed to live, per the
  // game's own design rule - a squad-composition decision belongs here.
  const tribeCounts = deployedTribeCounts(runState)
  const activeSynergies = resolveSynergies(tribeCounts)
  const commander = CHARACTERS[runState.characterId]
  const primedPower = (runState.pendingActiveEffects || []).length > 0 ? commander?.activePower : null

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

      const isCommanderSlot = row === COMMANDER_POSITION.row && col === COMMANDER_POSITION.col

      if (enemyPiece) {
        const def = ENEMIES[enemyPiece.defId]
        const previewEnemy = { id: `preview-${row}-${col}`, name: def.name, hp: def.maxHp, maxHp: def.maxHp, block: 0, intent: null, powers: {} }
        content = <EnemyPieceCard enemy={previewEnemy} art={def.art} />
      } else if (isCommanderSlot) {
        // The Commander always deploys here - not something the player
        // assigns/reorders, so it's shown but never clickable.
        const commander = CHARACTERS[runState.characterId]
        const previewCommander = { id: "commander-preview", name: commander?.name, hp: commander?.maxHp, maxHp: commander?.maxHp, block: 0, intent: null, powers: {} }
        content = <EnemyPieceCard enemy={previewCommander} art={commander?.art} side="player" />
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
        {isBoss
          ? "The final fight."
          : isMiniboss
            ? `A greater foe. ${formation.description || ENEMIES[node.enemyId]?.description || ""}`
            : formation.description || ENEMIES[node.enemyId]?.description}
      </p>

      {primedPower && (
        <div className="hw-badge hw-badge--active" style={{ marginBottom: 10 }} title={primedPower.description}>
          {primedPower.name} primed - applies at the start of this battle
        </div>
      )}

      {Object.keys(tribeCounts).length > 0 && (
        <div className="hw-section-fade-in">
          <div className="hw-section-label">Synergies</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            {Object.entries(tribeCounts).map(([tribeId, count]) => {
              const tribe = TRIBES[tribeId]
              const active = activeSynergies.find((s) => s.tribeId === tribeId)
              // "how far from the next payoff" - shown whenever there's
              // still a higher tier to reach, active or not (2/2 active
              // still has a 4-count tier worth knowing about).
              const next = nextSynergyThreshold(tribeId, count)
              return (
                <span
                  key={tribeId}
                  className={`hw-badge${active ? " hw-badge--active" : ""}`}
                  style={!active ? { color: tribe?.color, borderColor: tribe?.color } : undefined}
                  title={tribe?.description}
                >
                  <CardGlyph name={tribe?.icon} className="hw-intent-glyph" />
                  {tribe?.name} {count}
                  {active ? " ✓" : ""}
                  {next ? ` (${next} for more)` : ""}
                </span>
              )
            })}
          </div>
        </div>
      )}

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
        {runState.bench.map((entry) => {
          const def = UNITS[entry.defId]
          const equippedItemIds = runState.items.filter((it) => it.equippedTo === entry.key).map((it) => it.defId)
          const bentRole = def ? effectiveRole(def.role, equippedItemIds) : def?.role
          return (
            <UnitCard
              key={entry.key}
              def={def}
              selected={runState.deployed.includes(entry.key)}
              onClick={() => handleBenchClick(entry.key)}
              role={bentRole}
              bent={bentRole !== def?.role}
            />
          )
        })}
      </div>

      {/* No longer gated on deployedCount > 0 - the Commander is
          always a 5th deployed unit now (Marc: "peli alkaa siitä että
          commander on yksin" - the game starts with the Commander
          alone), so a squad of zero recruited units is a real, valid
          state, not an empty one. */}
      <button className="hw-end-turn" onClick={onStartBattle} style={{ marginTop: 16 }}>
        Start Battle
      </button>
    </div>
  )
}
