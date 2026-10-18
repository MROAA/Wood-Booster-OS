import { motion } from "framer-motion"
import { FOREST_PATHS } from "../../data/heartwood/crownless"
import { newVerseStatus } from "../../services/heartwood/forestMemory"
import "./heartwood-creatures.css"
import marketBanner from "../../assets/heartwood/battle-bg.jpg"

// Act V's final beat: the Forest's Choice. The Crownless has shown you
// your build; now the forest offers three paths and you pick the ending
// yourself. `suggested` is the endingId the run's accumulated
// allegiances lean toward (cinematics.suggestedEndingId) - it's
// pre-highlighted as "the forest leans this way", but the pick is
// final and overrides that tally.
const PATH_ACCENT = {
  "ending-rooted": "var(--hw-moss)",
  "ending-ember": "var(--hw-hp)",
  "ending-hollow": "var(--hw-curse)",
  "ending-newverse": "var(--hw-goldleaf, #e0b04a)",
}

export default function ForestChoiceScreen({ suggested, onChoose, runState }) {
  // New Game+: The New Verse opens on a return journey that knows enough truths.
  const verse = newVerseStatus(runState)
  const lockedWhy = verse.open
    ? null
    : !verse.returning
      ? "Only a traveller on a return journey can try this. Finish a run, and come back."
      : `You need to know more of the forest's story: ${verse.known}/${verse.needed} truths.`
  return (
    <motion.div
      className="hw-root hw-screen-fade hw-forest-choice"
      data-screen="forest-choice"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div
        className="hw-forest-choice-banner"
        style={{ backgroundImage: `linear-gradient(180deg, rgba(10,10,12,0.6), rgba(10,10,12,0.92)), url(${marketBanner})` }}
      />
      <div className="hw-forest-choice-inner">
        <div className="hw-forest-choice-kicker">The Forest's Choice</div>
        <h1 className="hw-forest-choice-title">What becomes of the Heartwood?</h1>
        <p className="hw-flavor hw-forest-choice-lede">
          The Crownless folds back into the throne. {verse.open ? "Four roots rise - one of them you have never seen before." : "Three roots rise."} The forest falls silent, and waits for you
          to answer.
        </p>

        <div className="hw-forest-choice-paths">
          {FOREST_PATHS.map((p, i) => {
            const isSuggested = p.endingId === suggested
            const locked = p.requiresNewVerse && lockedWhy
            return (
              <motion.button
                key={p.id}
                className="hw-forest-choice-path"
                data-suggested={isSuggested || undefined}
                data-path={p.id}
                data-locked={locked ? "true" : undefined}
                disabled={!!locked}
                title={locked || undefined}
                style={{ "--hw-path-accent": PATH_ACCENT[p.endingId] || "var(--hw-rune)" }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
                onClick={() => !locked && onChoose(p.endingId)}
              >
                <span className="hw-forest-choice-path-name">{p.name}</span>
                <span className="hw-forest-choice-path-tagline">{p.tagline}</span>
                <span className="hw-forest-choice-path-blurb">{p.blurb}</span>
                {isSuggested && <span className="hw-forest-choice-lean">the forest leans this way</span>}
                {locked && <span className="hw-forest-choice-locked">🔒 {locked}</span>}
                {p.requiresNewVerse && !locked && <span className="hw-forest-choice-lean">🌀 the forest remembers you</span>}
              </motion.button>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
