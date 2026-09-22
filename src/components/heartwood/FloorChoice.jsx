import { ENEMIES } from "../../data/heartwood/enemies"
import { resolveFormation } from "../../data/heartwood/formations"
import { CardGlyph } from "./cardArt"
import { useFreeLayout } from "./useFreeLayout.jsx"

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

export default function FloorChoice({ runState, onChoose, difficultyTier }) {
  // Stage B, screen 3 - re-checked live, same as EventScreen/
  // RelicChoice: plain .hw-intro root, no dedicated class of its own,
  // no CSS rule at all for this screen - standard wrapper pattern, no
  // scoped CSS override needed.
  const layout = useFreeLayout({ screenId: "floorChoice", keys: ["title", "tierBanner", "flavor", "choiceGrid"] })
  const options = runState.floorChoices || []

  return (
    <div className="hw-intro">
      {import.meta.env.DEV && (
        <div className="hw-free-layout-toolbar">
          {!layout.editingLayout ? (
            <button className="hw-move-btn" onClick={layout.startEditing} disabled={layout.loading}>
              Edit Layout
            </button>
          ) : (
            <>
              <button className="hw-move-btn" onClick={layout.saveLayout} disabled={layout.saving}>
                Save Layout
              </button>
              <button className="hw-move-btn" onClick={layout.cancelEditing} disabled={layout.saving}>
                Cancel
              </button>
            </>
          )}
          <button className="hw-move-btn" onClick={layout.resetLayout} disabled={layout.saving}>
            Reset Layout
          </button>
          {layout.errorMessage && <span className="hw-free-layout-error">{layout.errorMessage}</span>}
        </div>
      )}
      <div
        ref={layout.containerRef}
        className="hw-free-layout-container"
        style={layout.containerStyle}
        data-free-active={layout.freeActive || undefined}
        data-editing-layout={layout.editingLayout || undefined}
      >
        {layout.renderSection("title", <h1 style={{ fontSize: 22, margin: 0 }}>Two paths through the Hearthwood</h1>)}
        {/* Same act-banner pattern FormationScreen/SquadDraft already use
            for difficultyTier - no new CSS, keeps this choice screen tied
            to the same ongoing story arc instead of feeling like a bare
            mechanical picker (Marc, direct: wanted the branching choice
            itself to carry story weight, not just enemy/formation stats). */}
        {layout.renderSection(
          "tierBanner",
          difficultyTier && (
            <div
              className="hw-section-fade-in"
              style={{
                border: `1px solid ${difficultyTier.color}`,
                borderRadius: 8,
                padding: "12px 16px",
                marginTop: 14,
                background: `color-mix(in srgb, ${difficultyTier.color} 10%, var(--hw-panel))`,
              }}
            >
              <div className="hw-screen-eyebrow" style={{ color: difficultyTier.color, marginBottom: 4 }}>
                {difficultyTier.name}
              </div>
              <div style={{ fontSize: "var(--hw-fs-md)", lineHeight: 1.5 }}>{difficultyTier.lore}</div>
            </div>
          )
        )}
        {layout.renderSection(
          "flavor",
          <p className="hw-flavor" style={{ marginTop: 14 }}>
            Two ways forward through {difficultyTier?.name || "the Hearthwood"}. Whichever you leave behind isn't lost -
            it'll come back around later in the run.
          </p>
        )}
        {layout.renderSection(
          "choiceGrid",
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
        )}
      </div>
    </div>
  )
}
