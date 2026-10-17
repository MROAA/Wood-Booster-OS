// Graphics pass: one small corner switch for the Studio layout tools.
//
// Every screen's "Edit Layout / Reset Layout" toolbar (useFreeLayout)
// is a dev-mode authoring tool, but it used to sit on every screen all
// the time - up to four pairs of bright green buttons on the Market.
// The toolbars now stay hidden (heartwood-graphics.css) until this
// switch adds `hw-layout-tools` to <html>; the choice is remembered
// per browser. Dev builds only, like the toolbars themselves.
import { useEffect, useState } from "react"

const KEY = "hw-layout-tools"

function readOn() {
  try {
    return localStorage.getItem(KEY) === "1"
  } catch {
    return false
  }
}

export default function LayoutToolsToggle() {
  const [on, setOn] = useState(readOn)
  useEffect(() => {
    document.documentElement.classList.toggle("hw-layout-tools", on)
    try {
      localStorage.setItem(KEY, on ? "1" : "0")
    } catch {
      /* storage blocked - the switch still works for this page */
    }
  }, [on])
  if (!import.meta.env.DEV) return null
  return (
    <button
      type="button"
      className="hw-layout-tools-toggle"
      data-on={on || undefined}
      onClick={() => setOn((v) => !v)}
      title={on ? "Hide the Edit Layout buttons" : "Show the Edit Layout buttons on every screen"}
    >
      ✎ Layout{on ? ": on" : ""}
    </button>
  )
}
