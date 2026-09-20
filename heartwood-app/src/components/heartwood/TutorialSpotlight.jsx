import { useEffect, useState } from "react"

// Finds `selector` in the real, live DOM and draws a glowing ring
// around it, dimming everything else via a giant box-shadow "cutout" -
// the element itself stays fully interactive (this overlay has
// pointer-events: none), so the player is highlighting and playing the
// real game, not a mockup. Re-measures on an interval since the hand
// and grid change size as the battle progresses.
export default function TutorialSpotlight({ selector }) {
  const [rect, setRect] = useState(null)

  useEffect(() => {
    if (!selector) {
      setRect(null)
      return
    }

    function measure() {
      const el = document.querySelector(selector)
      if (!el) {
        setRect(null)
        return
      }
      const r = el.getBoundingClientRect()
      setRect({ top: r.top - 6, left: r.left - 6, width: r.width + 12, height: r.height + 12 })
    }

    measure()
    const interval = setInterval(measure, 200)
    window.addEventListener("resize", measure)
    return () => {
      clearInterval(interval)
      window.removeEventListener("resize", measure)
    }
  }, [selector])

  if (!rect) return null

  return (
    <div
      className="hw-tutorial-spotlight"
      style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
    />
  )
}
