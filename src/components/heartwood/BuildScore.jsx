import { useMemo } from "react"
import { evaluateBuild, SCORE_DIMS } from "../../data/heartwood/buildScore"
import { CardGlyph } from "./cardArt"

// The build-evaluation panel (buildScore.js). Reads the deployed squad
// and shows seven 0-10 bars + a core unit + the biggest gap - the PRD's
// "what kind of squad have I built?" readout. Pure display, no inputs
// other than runState.
export default function BuildScore({ runState }) {
  // runState is a fresh object on every setRunState, so keying the memo
  // on it re-evaluates exactly when the squad could have changed.
  const { deployedCount, scores, core, notes } = useMemo(() => evaluateBuild(runState), [runState])

  return (
    <div className="hw-buildscore hw-section-fade-in" aria-label="Build evaluation">
      <div className="hw-section-label">Your build</div>
      {deployedCount === 0 ? (
        <p className="hw-buildscore-empty">{notes[0]}</p>
      ) : (
        <>
          <div className="hw-buildscore-bars">
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
          {core && (
            <p className="hw-buildscore-core">
              <strong>Core:</strong> {core.name} — {core.why.toLowerCase()}
            </p>
          )}
          {notes.map((note) => (
            <p className="hw-buildscore-note" key={note}>
              <strong>Watch:</strong> {note}
            </p>
          ))}
        </>
      )}
    </div>
  )
}
