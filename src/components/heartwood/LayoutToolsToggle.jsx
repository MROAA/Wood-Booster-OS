// Graphics pass: one small corner switch for the Studio layout tools.
//
// Every screen's "Edit Layout / Reset Layout" toolbar (useFreeLayout)
// and every "✏️ Edit in Studio" link (EditInStudioLink)
// is a dev-mode authoring tool, but it used to sit on every screen all
// the time - up to four pairs of bright green buttons on the Market.
// The toolbars now stay hidden (heartwood-graphics.css) until this
// switch adds `hw-layout-tools` to <html>; the choice is remembered
// per browser. Dev builds only, like the toolbars themselves.
import { useEffect, useState } from "react"

const KEY = "hw-layout-tools"

// Automated verify suites (navigator.webdriver) were written with the
// Studio tools visible, so they start with the switch on unless they
// set it themselves; players start with it off.
function readOn() {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === "1" || saved === "0") return saved === "1"
  } catch {
    /* storage blocked - fall through to the default */
  }
  return typeof navigator !== "undefined" && !!navigator.webdriver
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
      title={on ? "Hide the Studio edit tools" : "Show the Studio edit tools (Edit Layout, Edit in Studio) on every screen"}
    >
      ✎ Studio{on ? ": on" : ""}
    </button>
  )
}
