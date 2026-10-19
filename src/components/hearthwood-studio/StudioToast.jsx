import { useEffect, useState } from "react"

/*
 * A plain message after every save (usePatchPreview fires
 * "hw-studio-applied"). Marc, 2026-10-19: he needs to see that a change
 * worked - or that the automatic check undid it - without reading logs.
 */
const MESSAGES = {
  qa_passed: { tone: "ok", text: "✓ Done - your change is in the game.", sub: "Changed your mind? ↩ Undo a change at the top." },
  applied: { tone: "ok", text: "✓ Saved - the game is being checked now.", sub: "If the check finds a problem, the change is undone by itself." },
  qa_running: { tone: "ok", text: "✓ Saved - the game is being checked now.", sub: "If the check finds a problem, the change is undone by itself." },
  rolled_back: { tone: "warn", text: "The change was undone automatically.", sub: "It would have broken the game, so nothing was changed. You can try a smaller change, or ask Claude Code." },
  qa_failed: { tone: "warn", text: "The automatic check found a problem.", sub: "Open ↩ Undo a change to put things back, or ask Claude Code to look at it." },
}

function StudioToast() {
  const [message, setMessage] = useState(null)

  useEffect(() => {
    let timer = null
    function onApplied(event) {
      setMessage(MESSAGES[event.detail?.status] || MESSAGES.applied)
      clearTimeout(timer)
      timer = setTimeout(() => setMessage(null), 9000)
    }
    window.addEventListener("hw-studio-applied", onApplied)
    return () => {
      window.removeEventListener("hw-studio-applied", onApplied)
      clearTimeout(timer)
    }
  }, [])

  if (!message) return null

  return (
    <div
      role="status"
      data-testid="studio-toast"
      data-tone={message.tone}
      className={`fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl border px-4 py-3 shadow-lg ${message.tone === "ok" ? "border-[var(--wood-accent)] bg-[var(--wood-panel)]" : "border-amber-700 bg-[var(--wood-panel)]"}`}
    >
      <div className={`text-sm font-semibold ${message.tone === "ok" ? "text-[var(--wood-text)]" : "text-amber-300"}`}>{message.text}</div>
      <div className="mt-1 text-xs text-[var(--wood-muted)]">{message.sub}</div>
      <button type="button" onClick={() => setMessage(null)} className="mt-2 text-[11px] text-[var(--wood-muted)] underline decoration-dotted">Close</button>
    </div>
  )
}

export default StudioToast
