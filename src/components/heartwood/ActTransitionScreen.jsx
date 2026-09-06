import { useState } from "react"
import { motion } from "framer-motion"
import marketBanner from "../../assets/heartwood/battle-bg.jpg"

// The Act boundary, made into a moment. Marc: the run "on vielä
// yksinkertainen ja tylsä" - "valinnat eivät tunnu tärkeiltä" and
// "runit ovat samanlaisia". Every time the difficulty band (and story
// Act) turns over, the run now stops for a narrative interstitial - the
// Act that just closed, the Act now opening (both drawn from
// DIFFICULTY_TIERS' own tagline/lore) - and one MANDATORY, run-shaping
// choice from crossroads.js. The pick grants a permanent Act Allegiance
// and sets the world's forestState (runEngine.resolveActCrossroads).
//
// Presentation-only, like the post-shop map interstitial: it renders on
// top of whatever phase the run is in without touching runEngine's
// phase machine. `onChoose(choiceId)` is the only way out.
export default function ActTransitionScreen({ crossroads, fromTier, intoTier, onChoose }) {
  const [chosen, setChosen] = useState(null)
  if (!crossroads) return null
  const chosenChoice = chosen ? crossroads.choices.find((c) => c.id === chosen) : null
  const accent = intoTier?.color || "var(--hw-rune)"

  return (
    <motion.div
      className="hw-root hw-screen-fade hw-act-transition"
      style={{ "--hw-act-accent": accent }}
      data-screen="act-transition"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div
        className="hw-act-transition-banner"
        style={{ backgroundImage: `linear-gradient(180deg, rgba(12,12,14,0.55), rgba(12,12,14,0.9)), url(${marketBanner})` }}
      />
      <div className="hw-act-transition-inner">
        <div className="hw-act-transition-turn">The road turns</div>

        {fromTier && (
          <motion.p
            className="hw-act-transition-close"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
          >
            <span className="hw-act-transition-close-name">{fromTier.name} closes.</span>{" "}
            {fromTier.tagline}
          </motion.p>
        )}

        <motion.div
          className="hw-act-transition-open"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.45 }}
        >
          <h1 className="hw-act-transition-title" style={{ color: accent }}>
            {intoTier?.name || crossroads.intoAct}
          </h1>
          {intoTier?.lore && <p className="hw-flavor hw-act-transition-lore">{intoTier.lore}</p>}
        </motion.div>

        <motion.div
          className="hw-act-transition-choice"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <div className="hw-act-transition-kicker" style={{ color: accent }}>
            {crossroads.kicker}
          </div>
          <p className="hw-flavor hw-act-transition-body">{crossroads.body}</p>

          {!chosenChoice ? (
            <div className="hw-act-transition-options">
              {crossroads.choices.map((c) => (
                <button
                  key={c.id}
                  className="hw-move-btn hw-act-transition-option"
                  onClick={() => setChosen(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35 }}
              className="hw-act-transition-result-wrap"
            >
              <p className="hw-flavor hw-act-transition-result" style={{ borderColor: accent }}>
                {chosenChoice.result}
              </p>
              {chosenChoice.forestState && (
                <div className="hw-act-transition-world" data-forest={chosenChoice.forestState}>
                  The forest is now <strong>{chosenChoice.forestState}</strong>.
                </div>
              )}
              <button className="hw-end-turn" onClick={() => onChoose(chosenChoice.id)}>
                Continue
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}
