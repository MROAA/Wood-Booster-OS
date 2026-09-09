import { useMemo } from "react"
import { evaluateThreat } from "../../data/heartwood/threatPreview"
import { THREATS } from "../../data/heartwood/counterplay"
import { CardGlyph } from "./cardArt"

// The enemy threat preview (threatPreview.js, Enemy Ecosystem PRD 50-51).
// "Here is the problem" - a danger rating, the threat that dominates,
// the mechanics to expect - sitting directly above counterplay.js's
// "Next fight" checkrow ("do you have the answer"). Pure display from
// the FormationScreen's already-computed previewEnemies + node.
const ICON_FOR = Object.fromEntries(THREATS.map((t) => [t.id, t.icon]))

export default function ThreatPreview({ runState, node, previewEnemies }) {
  const t = useMemo(
    () => evaluateThreat(previewEnemies, runState, node),
    [previewEnemies, runState, node],
  )
  if (!previewEnemies || previewEnemies.length === 0) return null

  return (
    <div className="hw-threat-preview hw-section-fade-in" data-rating={t.rating} aria-label="Enemy threat preview">
      <div className="hw-threat-head">
        <span className="hw-section-label">Enemy threat</span>
        <span className="hw-threat-stars" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} className="hw-threat-star" data-on={n <= t.rating}>
              ★
            </span>
          ))}
        </span>
        <span className="hw-threat-rating-label">{t.ratingLabel}</span>
      </div>

      {t.primary && (
        <p className="hw-threat-lead">
          <span className="hw-threat-lead-part">
            <CardGlyph name={ICON_FOR[t.primary.id] || "sword"} className="hw-intent-glyph" />
            Primary: <strong>{t.primary.label}</strong>
          </span>
          {t.secondary && (
            <span className="hw-threat-lead-part hw-threat-lead-secondary">
              <CardGlyph name={ICON_FOR[t.secondary.id] || "sword"} className="hw-intent-glyph" />
              Secondary: {t.secondary.label}
            </span>
          )}
        </p>
      )}

      {t.mechanics.length > 0 && (
        <p className="hw-threat-mechanics">
          <span className="hw-threat-expect">Expect:</span> {t.mechanics.join(" · ")}
        </p>
      )}

      {t.note && <p className="hw-threat-note">{t.note}</p>}
    </div>
  )
}
