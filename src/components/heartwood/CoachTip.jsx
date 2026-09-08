import { useEffect, useState } from "react"

// One contextual coaching tip (coach.js). The card itself always sits
// bottom-centre (fixed, never clipped, consistent); when `tip.anchor`
// resolves in the live DOM we ALSO draw the spotlight ring around that
// element - reusing TutorialSpotlight's measure-on-interval so it
// tracks the element as the screen re-lays-out. Non-modal: never blocks
// input, and "Got it" dismisses forever (HeartwoodBattle calls
// markCoachSeen).
export default function CoachTip({ tip, onDismiss }) {
  const [rect, setRect] = useState(null)

  useEffect(() => {
    setRect(null)
    if (!tip?.anchor) return
    let cancelled = false

    function measure() {
      if (cancelled) return
      const el = document.querySelector(tip.anchor)
      if (!el) {
        setRect(null)
        return
      }
      const r = el.getBoundingClientRect()
      if (r.width === 0 && r.height === 0) {
        setRect(null)
        return
      }
      setRect({ top: r.top - 6, left: r.left - 6, width: r.width + 12, height: r.height + 12 })
    }

    measure()
    const interval = setInterval(measure, 200)
    window.addEventListener("resize", measure)
    return () => {
      cancelled = true
      clearInterval(interval)
      window.removeEventListener("resize", measure)
    }
  }, [tip])

  if (!tip) return null

  return (
    <>
      {rect && (
        <div
          className="hw-tutorial-spotlight"
          style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
        />
      )}
      <div className="hw-coach-tip hw-coach-tip--center" role="status">
        <div className="hw-coach-tip-title">{tip.title}</div>
        <div className="hw-coach-tip-text">{tip.text}</div>
        <div className="hw-tutorial-actions">
          <button className="hw-tutorial-next" onClick={onDismiss}>
            Got it
          </button>
        </div>
      </div>
    </>
  )
}
