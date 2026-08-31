/*
 * Patchbayn /preview ja /apply palauttavat diffin valmiina
 * unified-diff-merkkijonona (diffText.js -> `diff`-kirjaston
 * createPatch), ei devstudio/DiffView.jsx:n odottamana
 * {added,removed,value}-taulukkona - siksi oma, hyvin ohut näkymä
 * sen sijaan että muotoa vääntäisi väkisin yhteensopivaksi.
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
