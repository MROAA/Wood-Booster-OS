/*
 * Renders the unified-diff string the API already returns (diffText.js
 * -> the `diff` library's createPatch). Ported verbatim from
 * hearthwood-studio/UnifiedDiffView.jsx - purely presentational, no
 * project-specific logic.
 */

function lineClass(line) {
  if (line.startsWith("+++") || line.startsWith("---")) {
    return "text-[var(--wood-muted)]"
  }

  if (line.startsWith("+")) {
    return "bg-emerald-950/40 text-emerald-300"
  }

  if (line.startsWith("-")) {
    return "bg-red-950/40 text-red-300"
  }

  if (line.startsWith("@@")) {
    return "text-[var(--wood-accent)]"
  }

  return "text-[var(--wood-muted)]"
}

function UnifiedDiffView({ diff }) {
  if (!diff) {
    return null
  }

  const lines = diff.split("\n").filter((_, index, all) => !(index === all.length - 1 && all[index] === ""))

  return (
    <pre className="wood-scroll max-h-72 overflow-auto rounded-lg border border-[var(--wood-border)] bg-[var(--wood-bg)] p-3 text-xs leading-relaxed whitespace-pre-wrap">
      {
        lines.map((line, index) => (
          <span key={index} className={`block ${lineClass(line)}`}>
            {line || " "}
          </span>
        ))
      }
    </pre>
  )
}

export default UnifiedDiffView
