// Plain-English words for the Studio's save step (PatchPreviewPanel.jsx).
// Marc, 2026-10-19: "en ole kovin hyvä IT-juttujen kanssa" - the review
// step showed risk tiers, model names, `a → b → c` paths and a code diff.
// These turn that into "what changes" in words he reads at a glance; the
// technical view stays one click away ("Technical details").

const FIELD_WORDS = {
  name: "Name", title: "Title", label: "Button text", text: "Text", line: "Line", say: "What your hero says", result: "What happens",
  hp: "Health", maxHp: "Health", attack: "Attack", baseAttack: "Attack", cost: "Cost", price: "Price", mana: "Mana", range: "Range",
  move: "Movement", cooldown: "Cooldown", power: "Strength", image: "Picture", icon: "Symbol", description: "Description",
  lines: "Line", options: "Choice", choices: "Choice", stakes: "What's at stake", epilogue: "Epilogue", blurb: "Short description",
  start: "Start-of-fight line", joy: "Happy line", hurt: "Hurt line", victory: "Victory line", defeat: "Defeat line",
  perBattle: "How many per battle", fromAct: "From Act", onBreak: "When it breaks", leaves: "What it leaves", note: "Note",
}

// ["tommy", "lines", "joy"] -> "tommy · Happy line"; ["rootkeeper-gate","lines",2,1] -> "rootkeeper-gate · Line 3".
export function plainWhere(path) {
  if (!Array.isArray(path) || !path.length) return "?"
  const [entity, ...rest] = path
  const parts = []
  for (let i = 0; i < rest.length; i++) {
    const seg = rest[i]
    // A named group of lines (`lines.joy`) needs only the line's own name.
    if (seg === "lines" && typeof rest[i + 1] === "string" && !/^\d+$/.test(rest[i + 1])) continue
    if (typeof seg === "number" || /^\d+$/.test(String(seg))) {
      // A list position: show it 1-based after the list's name; a tuple slot (0/1 at the end) is skipped.
      if (i === rest.length - 1 && i > 0 && typeof rest[i - 1] === "number") continue
      if (parts.length) parts[parts.length - 1] += ` ${Number(seg) + 1}`
      continue
    }
    parts.push(FIELD_WORDS[seg] || String(seg).replace(/([A-Z])/g, " $1").replace(/^./, c => c.toUpperCase()))
  }
  return [String(entity), parts.slice(-2).join(" · ")].filter(Boolean).join(" · ")
}

// Before/after pairs from a unified diff, cleaned of code punctuation.
export function plainChanges(diff, max = 6) {
  if (!diff) return []
  const minus = []
  const plus = []
  const clean = line => {
    const text = line.slice(1).trim().replace(/,$/, "")
    // A dialogue pair `["Maura", "Well?"]` -> "Maura: Well?" (narration has no name).
    if (text.startsWith("[") && text.endsWith("]")) {
      try {
        const parts = JSON.parse(text)
        if (Array.isArray(parts)) return parts.filter(part => part !== null && part !== "").join(": ")
      } catch {
        // not plain JSON - fall through
      }
    }
    return text.replace(/^[\w$"'-]+:\s*/, "").replace(/^"(.*)"$/, "$1")
  }
  for (const line of String(diff).split("\n")) {
    if (line.startsWith("---") || line.startsWith("+++")) continue
    if (line.startsWith("-")) minus.push(clean(line))
    else if (line.startsWith("+")) plus.push(clean(line))
  }
  const pairs = []
  for (let i = 0; i < Math.max(minus.length, plus.length) && pairs.length < max; i++) {
    const before = minus[i] ?? ""
    const after = plus[i] ?? ""
    if (before !== after) pairs.push({ before, after })
  }
  return pairs
}

// One calm sentence about safety, by the Patchbay's risk tier.
export const SAFETY_WORDS = {
  LOW: "A small, safe change. A backup is made first, and you can undo it anytime.",
  MEDIUM: "A normal change. A backup is made first, the game is checked automatically, and you can undo it anytime.",
  HIGH: "This touches how the game itself works, so the Studio won't put it in on its own. Ask Claude Code to do this one.",
  CRITICAL: "This touches the game's core files, so the Studio won't put it in on its own. Ask Claude Code to do this one.",
}
