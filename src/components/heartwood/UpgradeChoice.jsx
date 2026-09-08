import { UNITS, upgradeCost } from "../../data/heartwood/units"
import { UPGRADE_BRANCHES, branchAvailable } from "../../data/heartwood/upgrades"
import { CardGlyph } from "./cardArt"

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

  return (
    <div className="hw-upgrade-overlay" onClick={onCancel}>
      <div className="hw-upgrade-choice hw-screen-frame" onClick={(e) => e.stopPropagation()}>
        <div className="hw-screen-eyebrow">Upgrade — Level {level} → {level + 1}</div>
        <h1 className="hw-screen-title" style={{ fontSize: "var(--hw-fs-xl)", marginBottom: 4 }}>
          {def?.name}
        </h1>
        <p className="hw-screen-sub" style={{ marginBottom: 10 }}>
          Pick a direction. Only Power can be taken more than once — the rest, once each. Cost: {cost} Essence.
        </p>

        {upgrades.length > 0 && (
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
        )}

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

        <button className="hw-move-btn" style={{ marginTop: 12 }} onClick={onCancel}>
          <CardGlyph name="rune" className="hw-intent-glyph" /> Cancel
        </button>
      </div>
    </div>
  )
}
