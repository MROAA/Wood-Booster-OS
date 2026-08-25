import { motion } from "framer-motion"
import { CardGlyph } from "./cardArt"
import { ENEMIES } from "../../data/heartwood/enemies"
import { resolveTrial } from "../../data/heartwood/trials"

// Distinct from the per-fight ResultOverlay.jsx (which still plays out
// after each individual battle) - this is the run's actual ending,
// reached only after the Spacemonkey boss (victory) or a loss anywhere
// along the path (permadeath). One button: start over.
// A fight is any RUN_PATH node that's actually a battle, not a shop/
// relic stop between them.
function isFightNode(node) {
  return node?.type === "battle" || node?.type === "miniboss" || node?.type === "boss"
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
  const totalFights = (path || []).filter(isFightNode).length
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
      className="hw-overlay"
      data-outcome={won ? "won" : "lost"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.6, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, maxWidth: 440, textAlign: "center" }}
      >
        <CardGlyph
          name={won ? "the-sun" : "the-tower"}
          className="hw-overlay-glyph"
          style={{ color: won ? "var(--hw-moss)" : "var(--hw-hp)" }}
        />
        <div className="hw-overlay-title" style={{ color: won ? "var(--hw-moss)" : "var(--hw-hp)" }}>
          {won ? "The Hearthwood Falls Silent" : "The Trial Ends Here"}
        </div>
        <p className="hw-flavor">
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
        </p>
        {totalFights > 0 && (
          <span className="hw-badge" title="Fights cleared before the run ended">
            <CardGlyph name="sword" className="hw-intent-glyph" />
            {fightsCleared} / {totalFights} fights cleared
          </span>
        )}
        <button className="hw-end-turn" onClick={onNewRun}>
          New Run
        </button>
      </motion.div>
    </motion.div>
  )
}
