import { ENEMIES } from "../../data/heartwood/enemies"
import { runeRouteOptions } from "../../services/heartwood/runRunes"
import { RUNES } from "../../data/heartwood/runes"
import { riskOf } from "../../services/heartwood/betweenFights"
import "./heartwood-runes.css"
import { resolveFormation } from "../../data/heartwood/formations"
import { CardGlyph } from "./cardArt"
import { useFreeLayout } from "./useFreeLayout.jsx"
import { essenceForWin, actIndexForNode, RUN_PATH } from "../../services/heartwood/runEngine"
import { difficultyForRunNode } from "../../services/heartwood/tacticsRealMatchup"
import { routePreview, routeScouted } from "../../services/heartwood/betweenFights"
import { objectiveForNode, objectiveSummary } from "../../services/heartwood/tacticsObjectives"
import RunBuildPanel from "./RunBuildPanel"
import "./heartwood-road-screens.css"

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

export default function FloorChoice({ runState, onChoose, difficultyTier, onRunePath }) {
  // Stage B, screen 3 - re-checked live, same as EventScreen/
  // RelicChoice: plain .hw-intro root, no dedicated class of its own,
  // no CSS rule at all for this screen - standard wrapper pattern, no
  // scoped CSS override needed.
  const layout = useFreeLayout({ screenId: "floorChoice", keys: ["title", "tierBanner", "flavor", "choiceGrid"] })
  const options = runState.floorChoices || []

  return (
    <div className="hw-intro hw-route-screen">
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
        {layout.renderSection("title", <h1 style={{ fontSize: 22, margin: 0 }}>{options.length === 3 ? "Three" : "Two"} paths through the Hearthwood</h1>)}
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
            Pick your road through {difficultyTier?.name || "the Hearthwood"}. Danger pays better. A quiet road you skip comes back
            around later - a cursed one closes behind you.
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
              // Route risk (between-fights build depth): the path's danger, the
              // threat tier it really fights at, and what it pays.
              const preview = routePreview(node, essenceForWin(runState, node))
              const threat = difficultyForRunNode({ ...runState, path: [...runState.path, node] }, runState.nodeIndex + 1)
              const scouted = routeScouted(runState)
              const objective = scouted
                ? objectiveSummary(objectiveForNode(runState.seed, runState.nodeIndex + 1, node.type, actIndexForNode(runState.nodeIndex + 1, RUN_PATH.length)))
                : null
              return (
                <div
                  key={`${node.formationId || node.enemyId}-${i}`}
                  className="hw-card hw-card--power hw-route-card"
                  data-risk={preview.risk.id}
                  data-leads-to={preview.leadsTo || undefined}
                  style={{ "--hw-risk": preview.risk.color }}
                  onClick={() => onChoose(i)}
                >
                  <div className="hw-route-risk" title={preview.risk.blurb}>
                    <CardGlyph name={preview.risk.icon} className="hw-route-risk-glyph" />
                    <span>{preview.risk.name}</span>
                    <span className="hw-route-threat" title={`Threat tier ${threat.id}: ${threat.name}`}>
                      {threat.id}
                    </span>
                  </div>
                  <CardGlyph name={optionArt(node)} className="hw-card-glyph" />
                  <div className="hw-card-name">{name}</div>
                  <div className="hw-card-desc">{description}</div>
                  {pieceCount > 1 && (
                    <div className="hw-badge" style={{ justifyContent: "center", fontSize: 11 }} title="Multiple enemies in this fight">
                      {pieceCount} enemies
                    </div>
                  )}
                  {objective && (
                    <div className="hw-route-scouted" title="Scouted at camp">
                      👁 {objective}
                    </div>
                  )}
                  <div className="hw-route-reward">
                    <span className="hw-route-essence">+{preview.essence} Essence</span>
                    {preview.loot === "item" && <span className="hw-route-loot">+ gear</span>}
                    {preview.loot === "relic" && <span className="hw-route-loot">+ relic</span>}
                  </div>
                  <div className="hw-route-tags">
                    {preview.leadsTo === "camp" && (
                      <span className="hw-route-tag" data-tag="camp" title="The stop after this fight is a Camp instead of a Market">
                        <CardGlyph name="flame" className="hw-route-tag-glyph" /> then Camp
                      </span>
                    )}
                    {preview.leadsTo === "market" && (
                      <span className="hw-route-tag" data-tag="market">
                        <CardGlyph name="spark" className="hw-route-tag-glyph" /> then Market
                      </span>
                    )}
                    {preview.closes && (
                      <span className="hw-route-tag" data-tag="closes" title="If you take another path, this one is gone for good">
                        🔒 closes if passed
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      {/* Rune paths (First Song PRD §4): a carried rune opens a way the fork doesn't show. */}
      {runeRouteOptions(runState).length > 0 && (
        <div className="hw-rune-paths" data-rune-paths>
          <div className="hw-rune-paths-title">Your runes open other ways</div>
          {runeRouteOptions(runState).map((opt) => {
            const rune = RUNES[opt.rune]
            const risk = riskOf(opt.node)
            const f = resolveFormation(opt.node.formationId || opt.node.enemyId)
            const fightName = f.name || ENEMIES[opt.node.enemyId]?.name || "a fight"
            return (
              <button key={opt.rune} type="button" className="hw-rune-path" data-rune-path={opt.rune} style={{ "--hw-rune-colour": rune.color }} onClick={() => onRunePath?.(opt.rune)}>
                <span className="hw-rune-glyph" aria-hidden="true">{rune.glyph}</span>
                <span className="hw-rune-path-text">
                  <strong>Carve {rune.name}: the {risk.name}</strong>
                  <small>{fightName} - {risk.blurb} Spends the rune.</small>
                </span>
              </button>
            )
          })}
        </div>
      )}
      <RunBuildPanel runState={runState} />
    </div>
  )
}
