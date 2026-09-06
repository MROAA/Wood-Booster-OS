import { activeRunModifiers } from "../../data/heartwood/boons"

// Run Modifiers (boons.js) made visible. Marc: map-event choices used to
// pay out once and vanish - "valinnat eivät tunnu tärkeiltä". A boon or
// bane is now permanent, so it needs to be permanently on screen: a
// compact row of named pills, boons in moss, banes in ember-curse, each
// carrying its full description as a tooltip. Rendered wherever the run
// state is on show between fights - the run-map header and the shop's
// map rail (RunMap.jsx).
export default function RunModifierStrip({ modifiers, compact = false }) {
  const active = activeRunModifiers(modifiers || [])
  if (!active.length) return null
  return (
    <div className={`hw-runmods${compact ? " hw-runmods--compact" : ""}`} role="list" aria-label="Run modifiers">
      {active.map((m) => (
        <span
          key={m.id}
          role="listitem"
          className="hw-runmod"
          data-kind={m.kind}
          title={`${m.name} — ${m.description}`}
        >
          <span className="hw-runmod-dot" aria-hidden="true" />
          <span className="hw-runmod-name">{m.name}</span>
        </span>
      ))}
    </div>
  )
}
