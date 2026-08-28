import { useEffect, useState } from "react"
import { CardGlyph } from "./cardArt"

// Commander-select / first-launch screen (roadmap: "Komentajavalinta/
// aloitusnayton visuaalinen viimeistely"). This is the literal first
// thing a player sees on opening Hearthwood, and per Marc's PRD
// (sections 7-8) it's meant to be a genuine "I want to touch this"
// moment, not a generic list. Split out of HeartwoodBattle.jsx into
// its own component so the confirm-animation state below can't leak
// into (or be disturbed by) that file's much larger run-state machine.
//
// Proportions throughout this screen and its CSS (heartwood.css,
// .hw-commander-*) are deliberately golden-ratio/Fibonacci-derived per
// Marc's explicit request, not arbitrary: the card is 233x377 (two
// consecutive Fibonacci numbers - 233/377 = 1.618, the golden ratio,
// literally), its portrait medallion is 89px (also Fibonacci), and all
// spacing reuses the app's existing --space-1..6 scale (8/13/21/34/
// 55/89, index.css) rather than inventing new numbers.

// A commander pick isn't instant - the click marks the choice
// ("confirming"), the card itself answers with a real moment (glow +
// scale, CSS below), and only THEN does the run actually begin. This
// timeout is the single source of truth for "how long that moment
// lasts" - the CSS animation on .hw-commander-card[data-confirming]
// is authored to the same 550ms so the visual finishes exactly as
// onConfirm fires, no jump-cut.
const CONFIRM_DELAY_MS = 550

export default function CommanderSelect({ characters, pendingMemory, bannerSrc, bannerAlt, onConfirm }) {
  const [confirmingId, setConfirmingId] = useState(null)

  // Cleanup matters here more than most timers in this codebase: this
  // component can be replaced (HeartwoodBattle re-renders past it into
  // "formation"/"shop") the instant onConfirm actually starts the run,
  // so an uncleared timeout on a genuinely unmounted component would
  // be a silent no-op at best - but a stray double-fire (e.g. React
  // Strict Mode's dev double-invoke) calling onConfirm twice is exactly
  // the kind of thing Marc has asked, repeatedly, not to ship.
  useEffect(() => {
    if (!confirmingId) return
    const timer = setTimeout(() => onConfirm(confirmingId), CONFIRM_DELAY_MS)
    return () => clearTimeout(timer)
  }, [confirmingId, onConfirm])

  function handlePick(id) {
    // One confirm at a time. Once a card is confirming, every card
    // (including the one already picked) is `disabled` below, so this
    // is a defense-in-depth guard, not the only thing preventing a
    // double-start - a fast second click can never queue a second
    // beginRun() call or swap the Commander mid-animation.
    if (confirmingId) return
    setConfirmingId(id)
  }

  return (
    <div className="hw-commander-select">
      <div className="hw-commander-select-header">
        <div className="hw-crew-banner">
          <img src={bannerSrc} alt={bannerAlt} />
        </div>
        <h1 className="hw-commander-select-title">Hearthwood</h1>
        <p className="hw-flavor">
          Deep inside the Boosterverse, Spacemonkey waits at the heart of the Hearthwood. Choose who
          leads the squad in after him.
        </p>
        {/* Death Memory (Marc's PRD): the previous run's fallen hero is
            remembered once, into this next run only - see
            runEngine.js's buildDeathMemory/startRun and RunEndOverlay
            where the memory is first shown. */}
        {pendingMemory && (
          <span className="hw-badge" title="A small Essence boon, carried forward once in their memory">
            In memory of {pendingMemory.heroName}
            {pendingMemory.heroClass && pendingMemory.heroClass !== pendingMemory.heroName
              ? `, the ${pendingMemory.heroClass}`
              : ""}{" "}
            - your squad begins with +1 Essence.
          </span>
        )}
      </div>
      <div className="hw-commander-grid">
        {characters.map((character) => (
          <button
            key={character.id}
            type="button"
            className="hw-commander-card"
            data-confirming={confirmingId === character.id}
            data-dimmed={confirmingId !== null && confirmingId !== character.id}
            disabled={confirmingId !== null}
            onClick={() => handlePick(character.id)}
          >
            <span className="hw-commander-portrait">
              <CardGlyph name={character.art} className="hw-commander-glyph" />
            </span>
            <strong className="hw-commander-name">{character.name}</strong>
            <p className="hw-commander-tagline">{character.tagline}</p>
            <p className="hw-commander-desc">{character.description}</p>
            <span className="hw-commander-cta">
              {confirmingId === character.id ? "Leading the squad..." : "Lead the squad"}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
