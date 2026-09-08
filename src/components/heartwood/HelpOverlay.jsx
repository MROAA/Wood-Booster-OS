import { HELP_SECTIONS } from "../../data/heartwood/help"

// The "?" reference overlay - a plain-language glossary of every run
// system (help.js). Same framed-panel shape as SettingsScreen /
// AlmanacScreen; reachable any time from the ? button in the utility
// bar. Pure content, no engine calls.
export default function HelpOverlay({ onBack }) {
  return (
    <div className="hw-intro hw-help-screen hw-screen-frame">
      <button className="hw-exit-link hw-utility-btn" style={{ position: "absolute", top: 16, left: 16 }} onClick={onBack}>
        ← Back
      </button>

      <div className="hw-screen-eyebrow">Reference</div>
      <h1 className="hw-screen-title">How Hearthwood works</h1>
      <p className="hw-screen-sub" style={{ marginTop: 2 }}>
        A quick reminder of every system a run throws at you. Nothing here changes the game - it&rsquo;s just here when you
        want it.
      </p>

      <div className="hw-help-body">
        {HELP_SECTIONS.map((section) => (
          <section className="hw-help-section" key={section.heading}>
            <h2 className="hw-help-heading">{section.heading}</h2>
            <dl className="hw-help-list">
              {section.entries.map((entry) => (
                <div className="hw-help-row" key={entry.term}>
                  <dt className="hw-help-term">{entry.term}</dt>
                  <dd className="hw-help-blurb">{entry.blurb}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </div>
  )
}
