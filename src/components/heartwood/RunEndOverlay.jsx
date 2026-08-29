import { motion } from "framer-motion"
import { CardGlyph } from "./cardArt"
import { ENEMIES } from "../../data/heartwood/enemies"
import { resolveTrial } from "../../data/heartwood/trials"
import { RUN_PATH, MEMORY_ESSENCE_BONUS } from "../../services/heartwood/runEngine"

// Distinct from the per-fight ResultOverlay.jsx (which still plays out
// after each individual battle) - this is the run's actual ending,
// reached only after the Spacemonkey boss (victory) or a loss anywhere
// along the path (permadeath). One button: start over.
// A fight is any RUN_PATH node that's actually a battle, not a shop/
// relic stop between them.
function isFightNode(node) {
  return node?.type === "battle" || node?.type === "miniboss" || node?.type === "boss"
}

// Visual-polish pass (Marc's PRD section 21 + "kultainen leikkaus"
// direction): every size/spacing/timing value on this screen comes
// from one of two related number systems instead of eyeballed pixels -
//   - the golden ratio itself (--hw-phi, 1.618), used directly for the
//     emblem-zone : content-zone flex proportion below, and
//   - the Fibonacci sequence (--hw-fib-*, in heartwood.css), used for
//     every padding/gap/size on this screen AND for the reveal
//     stagger timings just below - consecutive Fibonacci terms
//     converge on phi (55/34 = 1.618), so both asks share one rhythm
//     rather than being two unrelated "nice number" systems.
// REVEAL_DELAY: consecutive Fibonacci numbers / 100 (seconds). Marc:
// "kaikki pitaa animoida" - every element on this screen enters on its
// own staggered beat, nothing just appears static.
const REVEAL_DELAY = { panel: 0.13, glyph: 0.21, title: 0.34, flavor: 0.55, stats: 0.89, cta: 1.44 }

// Silhouette -> reveal (Marc's PRD 21: "Pelaaja voi ensin nahda
// palkinnon siluettina. Valinnan jalkeen reveal-animation" - the
// player sees the reward as a silhouette first, then a reveal
// animation). This screen shows no pickable reward (that's
// RewardScreen.jsx, a separate mid-run moment) - but it does show the
// run's own tangible payoff (fights cleared, and on defeat the Death
// Memory's Essence legacy). Both get the same silhouette-first
// treatment: dark/blurred/desaturated on mount, then sharpening into
// full color, rather than an instant static badge.
const silhouetteReveal = {
  initial: { opacity: 0, scale: 0.85, filter: "blur(6px) grayscale(1) brightness(0.35)" },
  animate: { opacity: 1, scale: 1, filter: "blur(0px) grayscale(0) brightness(1)" },
}

export default function RunEndOverlay({ phase, nodeIndex, path, onNewRun, deathMemory }) {
  if (phase !== "victory" && phase !== "defeat") return null
  const won = phase === "victory"
  // How far the run actually got - this screen used to show nothing
  // but "you won" or "you lost," no sense of the run's own shape,
  // especially bare on a defeat (the moment a player most wants to
  // know "how close was I"). On a loss, nodeIndex sits on the fight
  // that ended the run - not a win, so only nodes strictly BEFORE it
  // count as cleared; on a win, every fight in the path was cleared by
  // definition, nodeIndex included.
  //
  // totalFights reads from RUN_PATH (the run's fixed SHAPE), not
  // `path` (what was actually visited) - since the branching-path work
  // (runEngine.js's advanceToNextNode), `path` only ever holds nodes
  // reached SO FAR, not the whole run, so it can no longer answer "how
  // many fights does a full run have." RUN_PATH's own type/position
  // sequence is unaffected by which specific enemy ends up filling a
  // given battle slot, so its fight-type count is still exactly right.
  const totalFights = RUN_PATH.filter(isFightNode).length
  const clearedThrough = won ? nodeIndex + 1 : nodeIndex
  const fightsCleared = (path || []).slice(0, clearedThrough).filter(isFightNode).length
  // The final boss's own Trial (trials.js), if one wraps it - a win
  // here shows its written victoryLine instead of the raw enemy's own,
  // same "story identity overrides presentation, never touches combat"
  // pattern every other Trial already uses.
  const bossNode = (path || []).find((n) => n.type === "boss")
  const bossTrial = resolveTrial(bossNode?.trialId)

  return (
    <motion.div
      className="hw-overlay hw-runend-overlay"
      data-outcome={won ? "won" : "lost"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="hw-runend-panel"
        data-outcome={won ? "won" : "lost"}
        initial={{ opacity: 0, scale: 0.9, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.55, delay: REVEAL_DELAY.panel, ease: "easeOut" }}
      >
        <div className="hw-runend-emblem">
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotate: won ? -8 : 8 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, delay: REVEAL_DELAY.glyph, ease: "easeOut" }}
          >
            <CardGlyph
              name={won ? "the-sun" : "the-tower"}
              className="hw-runend-glyph"
              style={{ color: won ? "var(--hw-moss)" : "var(--hw-hp)" }}
            />
          </motion.div>
          <motion.div
            className="hw-runend-title"
            style={{ color: won ? "var(--hw-moss)" : "var(--hw-hp)" }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: REVEAL_DELAY.title, ease: "easeOut" }}
          >
            {won ? "The Hearthwood Falls Silent" : "The Trial Ends Here"}
          </motion.div>
        </div>

        <div className="hw-runend-divider" />

        <div className="hw-runend-content">
          <motion.p
            className="hw-flavor"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: REVEAL_DELAY.flavor, ease: "easeOut" }}
          >
            {won
              ? bossTrial?.victoryLine || ENEMIES.spacemonkey.victoryLine
              : // Death Memory (Marc's PRD): this line used to flatly deny
                // any memory ever existed - now a real one is built the
                // moment the run ends (runEngine.js's buildDeathMemory,
                // resolveBattleOutcome) and shown here first, before it's
                // even saved for the next run to honor (HeartwoodBattle.jsx).
                // Skips the class clause when the unit's own name and its
                // Class happen to be the same word (e.g. Ironbark, whose
                // id doubles as its Class name) - "Ironbark, the Ironbark"
                // reads as a copy bug, not a memorial.
                deathMemory
                ? `${deathMemory.heroName}${
                    deathMemory.heroClass && deathMemory.heroClass !== deathMemory.heroName ? `, the ${deathMemory.heroClass}` : ""
                  } falls silent. The Hearthwood remembers - this trial's ending will carry forward.`
                : "The Hearthwood keeps no memory of you. Another trial can always begin fresh."}
          </motion.p>

          <div className="hw-runend-stats">
            {totalFights > 0 && (
              <motion.span
                className="hw-badge hw-runend-badge"
                title="Fights cleared before the run ended"
                initial={silhouetteReveal.initial}
                animate={silhouetteReveal.animate}
                transition={{ duration: 0.65, delay: REVEAL_DELAY.stats, ease: "easeOut" }}
              >
                <CardGlyph name="sword" className="hw-intent-glyph" />
                {fightsCleared} / {totalFights} fights cleared
              </motion.span>
            )}
            {/* Legacy Essence boon (runEngine.js's MEMORY_ESSENCE_BONUS,
                actually applied the moment the NEXT run starts via
                startRun's carriedMemory branch) - only a real, already-
                computed number, presented here rather than left implied
                by the flavor text alone. */}
            {!won && deathMemory && (
              <motion.span
                className="hw-badge hw-essence-badge hw-runend-badge"
                title="Carried into the next run, once"
                initial={silhouetteReveal.initial}
                animate={silhouetteReveal.animate}
                transition={{ duration: 0.65, delay: REVEAL_DELAY.stats + 0.13, ease: "easeOut" }}
              >
                <CardGlyph name="spark" className="hw-intent-glyph" />
                +{MEMORY_ESSENCE_BONUS} Essence next run
              </motion.span>
            )}
          </div>

          <motion.button
            className="hw-end-turn hw-runend-cta"
            onClick={onNewRun}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: REVEAL_DELAY.cta, ease: "easeOut" }}
          >
            New Run
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}
