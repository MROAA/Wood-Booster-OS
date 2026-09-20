import { useMemo } from "react"
import { evaluatePlaystyle, PLAYSTYLE_AXES } from "../../data/heartwood/playstyle"
import { CardGlyph } from "./cardArt"

// The Strategic Playstyle profile (playstyle.js) - six 0-100 bars for
// how the run's choices have added up, plus the dominant lean. Pure
// display, runState in only. `compact` renders just the one-line
// "Playstyle - AGGRESSION" for the shop's Run-Map rail; the full panel
// (RunEndOverlay) shows all six bars + the blurb.
export default function PlaystyleProfile({ runState, compact = false }) {
  const { scores, dominant, blurb } = useMemo(() => evaluatePlaystyle(runState), [runState])
  const domAxis = dominant && PLAYSTYLE_AXES.find((a) => a.id === dominant)

  // Decision history (runEngine.js's styleLog) - the non-zero parts, for
  // the full panel only.
  const sl = runState?.styleLog || {}
  const history = [
    sl.rerolls ? `${sl.rerolls} reroll${sl.rerolls > 1 ? "s" : ""}` : null,
    sl.pivots ? `${sl.pivots} swap${sl.pivots > 1 ? "s" : ""}` : null,
    sl.grinds ? `${sl.grinds} long fight${sl.grinds > 1 ? "s" : ""}` : null,
  ].filter(Boolean)

  if (compact) {
    if (!domAxis) return null
    return (
      <div className="hw-playstyle-compact" style={{ color: `var(${domAxis.accent})` }} title={blurb}>
        <CardGlyph name={domAxis.icon} className="hw-intent-glyph" />
        Playstyle · {domAxis.label}
      </div>
    )
  }

  return (
    <div className="hw-playstyle hw-section-fade-in" aria-label="Strategic playstyle">
      <div className="hw-section-label">Playstyle</div>
      <div className="hw-playstyle-bars">
        {PLAYSTYLE_AXES.map((a) => {
          const v = scores[a.id]
          return (
            <div className="hw-playstyle-row" key={a.id} title={`${a.label}: ${v} / 100`}>
              <span className="hw-playstyle-name">
                <CardGlyph name={a.icon} className="hw-intent-glyph" />
                {a.label}
              </span>
              <span className="hw-playstyle-track">
                <span
                  className="hw-playstyle-fill"
                  style={{ width: `${v}%`, background: `var(${a.accent})` }}
                />
              </span>
              <span className="hw-playstyle-num">{v}</span>
            </div>
          )
        })}
      </div>
      <p className="hw-playstyle-leaning">
        {domAxis ? (
          <>
            <strong style={{ color: `var(${domAxis.accent})` }}>Leaning:</strong> {blurb}
          </>
        ) : (
          blurb
        )}
      </p>
      {history.length > 0 && <p className="hw-playstyle-history">This run: {history.join(" · ")}</p>}
    </div>
  )
}
