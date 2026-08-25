import { ENEMIES } from "../../data/heartwood/enemies"
import { resolveFormation } from "../../data/heartwood/formations"
import { CardGlyph } from "./cardArt"

// The branching-path pick (Marc, direct: "haluan tarinankerronnan kuin
// slay the spiressä... eri tapahtumia ja vihollisia" - storytelling
// like Slay the Spire, different events/enemies to choose between).
// Same "3 choices, pick one" shape as RelicChoice.jsx, but for which
// fight comes next - see runEngine.js's advanceToNextNode/
// chooseFloorEncounter for how the 2 options themselves are chosen
// (drawn from the run's own battle pool, nothing invented here).
function optionArt(node) {
  const formation = resolveFormation(node.formationId || node.enemyId)
  const firstDefId = formation.pieces?.[0]?.defId
  return ENEMIES[firstDefId]?.art || "warden"
}

export default function FloorChoice({ runState, onChoose }) {
  const options = runState.floorChoices || []

  return (
    <div className="hw-intro">
      <h1 style={{ fontSize: 22, margin: 0 }}>Two paths through the Hearthwood</h1>
      <p className="hw-flavor" style={{ marginTop: 14 }}>
        Choose which fight to walk into next - whichever you don't pick isn't lost, it'll come back around later in
        the run.
      </p>
      <div className="hw-select-grid hw-deck-preview">
        {options.map((node, i) => {
          const formation = resolveFormation(node.formationId || node.enemyId)
          const pieceCount = formation.pieces?.length || 1
          // A bare enemyId resolves through resolveFormation's own
          // backward-compat adapter, which returns name/description as
          // null on purpose (formations.js's own comment: "signals
          // callers to fall back to that single piece's own name") -
          // same fallback FormationScreen.jsx already applies for the
          // CURRENT fight's flavor text, needed here too since a solo
          // enemy is one of the two things a choice floor can offer.
          const soloEnemy = ENEMIES[node.enemyId]
          const name = formation.name || soloEnemy?.name || "Unknown"
          const description = formation.description || soloEnemy?.description || ""
          return (
            <div key={`${node.formationId || node.enemyId}-${i}`} className="hw-card hw-card--power" onClick={() => onChoose(i)}>
              <CardGlyph name={optionArt(node)} className="hw-card-glyph" />
              <div className="hw-card-name">{name}</div>
              <div className="hw-card-desc">{description}</div>
              {pieceCount > 1 && (
                <div className="hw-badge" style={{ justifyContent: "center", fontSize: 11 }} title="Multiple enemies in this fight">
                  {pieceCount} enemies
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
