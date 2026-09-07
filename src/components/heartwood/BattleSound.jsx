import { useEffect, useRef } from "react"
import { play } from "../../services/heartwood/soundManager"

// Sonifies the auto-battle - the audio sibling of FloatingNumbers.jsx,
// watching the exact same `state.roundEvents` / `state.phase`. Renders
// nothing. Every call goes through soundManager.play, which is a silent
// no-op when Web Audio is unavailable.
const BIG_HIT = 15 // match FloatingNumbers.jsx

export default function BattleSound({ state }) {
  const phaseRef = useRef(null)

  useEffect(() => {
    if (!state) return
    for (const ev of state.roundEvents || []) {
      if (ev.kind === "damage" && ev.amount) play(ev.amount >= BIG_HIT ? "hitBig" : "hit")
      else if (ev.kind === "tick" && ev.amount) play(ev.statusId === "regen" ? "heal" : "tick", { gain: 0.7 })
      else if (ev.kind === "ward" || ev.kind === "evade") play("block", { gain: 0.7 })
    }
  }, [state])

  useEffect(() => {
    const phase = state?.phase
    if (phase === phaseRef.current) return
    phaseRef.current = phase
    if (phase === "won") play("victory")
    else if (phase === "lost") play("defeat")
  }, [state?.phase])

  return null
}
