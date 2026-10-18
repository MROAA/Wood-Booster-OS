import { useMemo } from "react"
import { evaluateBuild, SCORE_DIMS } from "../../data/heartwood/buildScore"
import { CardGlyph } from "./cardArt"

// The build-evaluation panel (buildScore.js). Reads the deployed squad
// and shows seven 0-10 bars + a core unit + the biggest gap - the PRD's
// "what kind of squad have I built?" readout. Pure display, no inputs
// other than runState.
// `variant="camp"` (Headquarters): the verdict first - strongest and
// weakest as two small tiles - then the seven bars in one calm hue.
export default function BuildScore({ runState, variant = null }) {
  // runState is a fresh object on every setRunState, so keying the memo
  // on it re-evaluates exactly when the squad could have changed.
  const { deployedCount, scores, core, notes, positioning } = useMemo(() => evaluateBuild(runState), [runState])

  // the seven bars + positioning - in the camp they fold behind "All seven"
  const bars = (
    <div className="hw-buildscore-bars" data-variant={variant || undefined}>
      {SCORE_DIMS.map((d) => {
        const v = scores[d.id]
        return (
          <div className="hw-buildscore-row" key={d.id} title={`${d.label}: ${v} / 10`}>
            <span className="hw-buildscore-name">
              <CardGlyph name={d.icon} className="hw-intent-glyph" />
              {d.label}
            </span>
            <span className="hw-buildscore-track">
              <span
                className={`hw-buildscore-fill hw-buildscore-fill--${d.id}`}
                style={{ width: `${v * 10}%` }}
              />
            </span>
            <span className="hw-buildscore-num">{v}</span>
          </div>
        )
      })}
    </div>
  )
  const positioningLine = positioning && (
    <p
      className="hw-buildscore-positioning"
      data-off={positioning.matched < positioning.total || undefined}
      title="A hero in its preferred slot (tanks forward, the rest back) starts the fight with a small edge."
    >
      Positioning: {positioning.matched}/{positioning.total} in place
    </p>
  )
  const coreLine = core && (
    <p className="hw-buildscore-core">
      <strong>Core:</strong> {core.name} — {core.why.toLowerCase()}
    </p>
  )

  return (
    <div className="hw-buildscore hw-section-fade-in" aria-label="Build evaluation">
      <div className="hw-section-label">Your build</div>
      {deployedCount === 0 ? (
        <p className="hw-buildscore-empty">{notes[0]}</p>
      ) : (
        <>
          {variant === "camp" && (() => {
            const ranked = [...SCORE_DIMS].sort((a, b) => scores[b.id] - scores[a.id])
            const top = ranked[0]
            const low = ranked[ranked.length - 1]
            return (
              <div className="hw-buildscore-verdict">
                <span className="hw-buildscore-tile" data-kind="strong" title={`Strongest: ${top.label} ${scores[top.id]} / 10`}>
                  <span className="hw-buildscore-tile-label">Strongest</span>
                  <span className="hw-buildscore-tile-value">
                    <CardGlyph name={top.icon} className="hw-intent-glyph" />
                    {top.label} <b>{scores[top.id]}</b>
                  </span>
                </span>
                <span className="hw-buildscore-tile" data-kind="weak" title={`Weakest: ${low.label} ${scores[low.id]} / 10`}>
                  <span className="hw-buildscore-tile-label">Weakest</span>
                  <span className="hw-buildscore-tile-value">
                    <CardGlyph name={low.icon} className="hw-intent-glyph" />
                    {low.label} <b>{scores[low.id]}</b>
                  </span>
                </span>
              </div>
            )
          })()}
          {variant !== "camp" && bars}
          {variant !== "camp" && positioningLine}
          {variant !== "camp" && coreLine}
          {notes.map((note) => (
            <p className="hw-buildscore-note" key={note}>
              <strong>Watch:</strong> {note}
            </p>
          ))}
          {/* the camp keeps the verdict and the one warning in view; the
              full readout opens on demand */}
          {variant === "camp" && (
            <details className="hw-buildscore-more">
              <summary>Full readout</summary>
              {bars}
              {positioningLine}
              {coreLine}
            </details>
          )}
        </>
      )}
    </div>
  )
}
