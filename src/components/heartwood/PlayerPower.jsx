import { useMemo } from "react"
import { evaluatePlayerPower, POWER_COMPONENTS } from "../../data/heartwood/playerPower"
import { CardGlyph } from "./cardArt"

// Run Power (playerPower.js) - the DifficultyEngine's Player Power Score:
// a magnitude read of the run's real strength across seven components,
// plus a band and a ratio vs the run's expected power. Pure display,
// runState in only. `compact` renders the one-line "Power - Strong
// (1.1x)" for the shop's Run-Map rail; the full panel (RunEndOverlay)
// shows all seven component bars + the lead / thin lines.
const BAND_ACCENT = {
  Fragile: "--hw-hp",
  Holding: "--hw-ember",
  Strong: "--hw-moss",
  Commanding: "--hw-rune",
  Overwhelming: "--hw-cosmic",
}

const COMP_MAX = 20 // raw component scale for the bar fill

export default function PlayerPower({ runState, compact = false }) {
  const power = useMemo(() => evaluatePlayerPower(runState), [runState])
  const { total, ratio, band, components, lead, gap } = power
  const accent = `var(${BAND_ACCENT[band] || "--hw-ember"})`
  const leadLabel = POWER_COMPONENTS.find((c) => c.id === lead)?.label

  if (compact) {
    if (!runState?.bench?.length) return null
    return (
      <div
        className="hw-power-compact"
        style={{ color: accent }}
        title={`Run Power ${total} · ${band} · ${ratio}× your expected power for this point in the run`}
      >
        <CardGlyph name="cosmic" className="hw-intent-glyph" />
        Power · {band} ({ratio}×)
      </div>
    )
  }

  return (
    <div className="hw-power hw-section-fade-in" aria-label="Run power">
      <div className="hw-section-label">Run Power</div>
      <p className="hw-power-headline">
        <strong style={{ color: accent }}>
          {total} · {band}
        </strong>{" "}
        <span className="hw-power-ratio">{ratio}× expected</span>
      </p>
      <div className="hw-power-bars">
        {POWER_COMPONENTS.map((c) => {
          const v = components[c.id] || 0
          return (
            <div className="hw-power-row" key={c.id} title={`${c.label}: ${v}`}>
              <span className="hw-power-name">
                <CardGlyph name={c.icon} className="hw-intent-glyph" />
                {c.label}
              </span>
              <span className="hw-power-track">
                <span
                  className="hw-power-fill"
                  style={{ width: `${Math.max(0, Math.min(100, (v / COMP_MAX) * 100))}%`, background: accent }}
                />
              </span>
              <span className="hw-power-num">{v}</span>
            </div>
          )
        })}
      </div>
      {leadLabel && (
        <p className="hw-power-note">
          <strong>Leading:</strong> {leadLabel}
        </p>
      )}
      {gap?.note && (
        <p className="hw-power-note hw-power-note--gap">
          <strong>Thin:</strong> {gap.note}
        </p>
      )}
    </div>
  )
}
