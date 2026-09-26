// Hearthwood Frontier - element combo UI (sprint 3): the small colored
// element badges on a token, and the "Element combos" help panel.
import { useState } from "react"
import { ELEMENTS, ELEMENT_TIPS, COMBO_HELP } from "../../services/heartwood/tacticsElements"

const BADGES = [
  { key: "burn", icon: ELEMENTS.fire.icon, element: "fire", word: "Burn" },
  { key: "chill", icon: ELEMENTS.frost.icon, element: "frost", word: "Chill" },
  { key: "frozen", icon: "🧊", element: "frost", word: "Frozen" },
  { key: "entangle", icon: ELEMENTS.nature.icon, element: "nature", word: "Entangled" },
]

// Rendered inside .hwt-token-status (Poison keeps its own existing badge).
export function ElementBadges({ unit }) {
  return BADGES.filter((b) => unit[b.key] > 0).map((b) => (
    <span
      key={b.key}
      className="hwt-element-badge"
      data-element={b.element}
      data-status={b.key}
      title={`${b.word} ${unit[b.key]} - ${ELEMENT_TIPS[b.key]}`}
    >
      {b.icon}
      {b.key === "frozen" ? "" : unit[b.key]}
    </span>
  ))
}

export function ElementHelp() {
  const [open, setOpen] = useState(false)
  return (
    <div className="hwt-element-help" data-open={open}>
      <button className="hwt-element-help-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {ELEMENTS.fire.icon}
        {ELEMENTS.frost.icon}
        {ELEMENTS.poison.icon}
        {ELEMENTS.nature.icon} Element combos {open ? "▴" : "▾"}
      </button>
      {open && (
        <div className="hwt-element-help-body">
          <p className="hwt-element-help-intro">
            Fire, Frost, Poison and Nature stick to units. Land a second element on a unit that already carries a partner and they combine:
          </p>
          <ul>
            {COMBO_HELP.map((c) => (
              <li key={c.id} data-combo={c.id}>
                <b>{c.name}</b> <span className="hwt-element-help-recipe">{c.recipe}</span> - {c.text}
              </li>
            ))}
          </ul>
          <p className="hwt-element-help-intro">Enemies use elements too - watch the icons on your own units.</p>
        </div>
      )}
    </div>
  )
}
