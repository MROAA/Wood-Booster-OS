import { UNITS, upgradeCost } from "../../data/heartwood/units"
import { UPGRADE_BRANCHES, branchAvailable } from "../../data/heartwood/upgrades"
import { CardGlyph } from "./cardArt"
import { useFreeLayout } from "./useFreeLayout.jsx"

// The per-unit Upgrade beat (feat/hearthwood-upgrade-branches): instead
// of a silent linear buff, level-up opens this pick - one of the five
// branches (upgrades.js). Same "cards, pick one, or cancel" shape as
// RelicChoice, scoped to a single bench unit. Rendered as an overlay
// from SquadDraft, driven by its local `upgradingKey`.
export default function UpgradeChoice({ unit, essence, onPick, onCancel }) {
  const def = UNITS[unit.defId]
  const upgrades = unit.upgrades || []
  const level = upgrades.length
  const cost = upgradeCost(level)
  // Stage B, screen 5 (RestScreen/RewardScreen turned out to be dead
  // code, never actually wired into HeartwoodBattle.jsx - skipped).
  // Different shape from the previous 3 screens - a MODAL overlay, not
  // a full-page .hw-intro - but .hw-upgrade-choice itself (the modal
  // card) has no flex/grid of its own (just width/max-height/overflow
  // sizing), so its direct children already stack in plain block flow
  // - the standard wrapper pattern is safe here too, no scoped CSS
  // override needed. The outer .hw-upgrade-overlay (the fixed, centered
  // backdrop that closes on click) stays untouched - only the modal's
  // OWN internal sections become individually positionable.
  const layout = useFreeLayout({ screenId: "upgradeChoice", keys: ["header", "chipRow", "branches", "cancelBtn"] })

  return (
    <div className="hw-upgrade-overlay" onClick={onCancel}>
      <div className="hw-upgrade-choice hw-screen-frame" onClick={(e) => e.stopPropagation()}>
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
          {layout.renderSection(
            "header",
            <>
              <div className="hw-screen-eyebrow">Upgrade — Level {level} → {level + 1}</div>
              <h1 className="hw-screen-title" style={{ fontSize: "var(--hw-fs-xl)", marginBottom: 4 }}>
                {def?.name}
              </h1>
              <p className="hw-screen-sub" style={{ marginBottom: 10 }}>
                Pick a direction. Only Power can be taken more than once — the rest, once each. Cost: {cost} Essence.
              </p>
            </>
          )}
          {layout.renderSection(
            "chipRow",
            upgrades.length > 0 && (
              <div className="hw-upgrade-chip-row" style={{ marginBottom: 12 }}>
                {upgrades.map((id, i) => {
                  const b = UPGRADE_BRANCHES.find((x) => x.id === id)
                  return (
                    <span key={i} className="hw-upgrade-chip" style={{ color: b?.accent, borderColor: b?.accent }}>
                      ▲ {b?.label || id}
                    </span>
                  )
                })}
              </div>
            )
          )}
          {layout.renderSection(
            "branches",
            <div className="hw-upgrade-branches">
              {UPGRADE_BRANCHES.map((b) => {
                const available = branchAvailable(b.id, upgrades, level)
                const taken = !b.repeatable && upgrades.includes(b.id)
                const disabled = !available || essence < cost
                return (
                  <button
                    key={b.id}
                    className="hw-upgrade-branch"
                    style={{ borderColor: b.accent }}
                    data-disabled={disabled || undefined}
                    disabled={disabled}
                    onClick={() => onPick(b.id)}
                  >
                    <span className="hw-upgrade-branch-label" style={{ color: b.accent }}>
                      {b.label}
                      {b.repeatable && <span className="hw-upgrade-branch-tag"> · repeatable</span>}
                      {taken && <span className="hw-upgrade-branch-tag"> · already chosen</span>}
                    </span>
                    <span className="hw-upgrade-branch-desc">{b.desc}</span>
                  </button>
                )
              })}
            </div>
          )}
          {layout.renderSection(
            "cancelBtn",
            <button className="hw-move-btn" style={{ marginTop: 12 }} onClick={onCancel}>
              <CardGlyph name="rune" className="hw-intent-glyph" /> Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
