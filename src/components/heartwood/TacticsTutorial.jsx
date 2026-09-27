// Hearthwood Frontier - "Training Grounds" (sprint 3): the guided first
// tactics fight. Plays the REAL TacticsBoard on a small hand-authored
// battle (tacticsTutorial.js) and walks TRAINING_STEPS: a spotlight on the
// thing to click, one short sentence, Skip always available. The battle
// lives only in this component's state - it never touches runState.
import { useEffect, useMemo, useState } from "react"
import TacticsBoard from "./TacticsBoard"
import TutorialSpotlight from "./TutorialSpotlight"
import { TRAINING_STEPS, buildTrainingBattle, armTrainingSlam } from "../../services/heartwood/tacticsTutorial"
import "./heartwood-tactics.css"

export default function TacticsTutorial({ onExit }) {
  const [battle, setBattle] = useState(() => buildTrainingBattle())
  const [stepIndex, setStepIndex] = useState(0)
  const [selectedId, setSelectedId] = useState(null)
  const [abilityMode, setAbilityMode] = useState(null)
  const [nudge, setNudge] = useState(null)
  const step = TRAINING_STEPS[stepIndex]

  // Auto-advance once the board shows the step's goal.
  useEffect(() => {
    if (step.manual || !step.done || !step.done(battle)) return
    setNudge(null)
    setStepIndex((i) => Math.min(i + 1, TRAINING_STEPS.length - 1))
  }, [battle, step])

  function handleBattleChange(next) {
    // Scripted steps only accept the move they teach; manual steps (read,
    // then Next) accept nothing so the lesson can't run ahead.
    if (step.manual || (step.allow && !step.allow(battle, next))) {
      setNudge(step.manual ? "Read this, then press Next." : step.nudge)
      return
    }
    setNudge(null)
    setBattle(battle.phase === "deploy" && next.phase === "player" ? armTrainingSlam(next) : next)
  }

  function restart() {
    setBattle(buildTrainingBattle())
    setStepIndex(0)
    setSelectedId(null)
    setAbilityMode(null)
    setNudge(null)
  }

  const target = useMemo(() => step.target(battle, { selectedId }), [step, battle, selectedId])
  const lost = battle.phase === "lost"

  return (
    <div className="hwt-training" data-step={step.id}>
      <div className="hwt-training-bar">
        <span className="hwt-training-name">Training Grounds</span>
        <span className="hwt-training-progress">
          Step {stepIndex + 1} of {TRAINING_STEPS.length}
        </span>
        <button className="hwt-training-skip" onClick={() => onExit("skipped")}>
          Skip tutorial
        </button>
      </div>
      <TacticsBoard
        battle={battle}
        onBattleChange={handleBattleChange}
        selectedId={selectedId}
        onSelectedIdChange={setSelectedId}
        abilityMode={abilityMode}
        onAbilityModeChange={setAbilityMode}
        resultActions={
          battle.phase === "won" ? (
            <button className="hwt-continue-btn" onClick={() => onExit("done")}>
              Leave the Training Grounds
            </button>
          ) : (
            <button className="hwt-continue-btn" onClick={restart}>
              Try again
            </button>
          )
        }
      />
      {!lost && <TutorialSpotlight selector={target} />}
      <div className="hwt-training-card" role="status" data-step={step.id}>
        <div className="hwt-training-title">{lost ? "Knocked down" : step.title}</div>
        <div className="hwt-training-text">{lost ? "No harm done - it's practice. Try again?" : step.text}</div>
        {nudge && !lost && <div className="hwt-training-nudge">{nudge}</div>}
        <div className="hwt-training-actions">
          {lost && (
            <button className="hwt-training-next" onClick={restart}>
              Try again
            </button>
          )}
          {!lost && step.manual && !step.final && (
            <button className="hwt-training-next" onClick={() => { setNudge(null); setStepIndex((i) => i + 1) }}>
              Next
            </button>
          )}
          {!lost && step.final && (
            <button className="hwt-training-next" onClick={() => onExit("done")}>
              Finish
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
