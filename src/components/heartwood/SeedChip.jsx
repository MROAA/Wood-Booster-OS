import { useState } from "react"
import { formatSeed } from "../../data/heartwood/seed"

// The run's seed, shown as its shareable "HW-XXXX-XXXX" form with a
// one-click copy (Seed System PRD sections 3-9 - "make the seed visible
// and copyable"). Used on the shop Run Map rail and the run-end screen.
// A plain <button> so it's keyboard-reachable; the value is always on
// screen to copy by hand if the clipboard API is unavailable (older
// webview / non-secure context).
export default function SeedChip({ seed, className = "" }) {
  const [copied, setCopied] = useState(false)
  const text = formatSeed(seed)

  function copy() {
    try {
      navigator.clipboard?.writeText(text)
    } catch {
      /* clipboard blocked - the value is still visible to copy manually */
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <button
      type="button"
      className={`hw-seed-chip ${className}`.trim()}
      onClick={copy}
      title="Copy this run's seed"
      aria-label={`Run seed ${text}. Copy.`}
    >
      <span className="hw-seed-chip-label">Seed</span>
      <span className="hw-seed-chip-value">{text}</span>
      <span className="hw-seed-chip-copy" aria-hidden="true">
        {copied ? "Copied" : "⧉"}
      </span>
    </button>
  )
}
