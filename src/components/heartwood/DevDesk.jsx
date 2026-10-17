// The dev desk - Headquarters is also Marc's development headquarters
// ("päämaja on myös toisaalta minun kehitys pääkonttori") and the place
// to "customise everything in the game from the dev tool".
//
// Purpose: one doorway from the game into every editor. Shown only in a
// dev build (`import.meta.env.DEV`) and only while the corner "✎ Studio"
// switch is on (CSS: html.hw-layout-tools) - players never see it.
//   - Your squad: edit any hero you are looking at, right on top of the
//     game (QuickEditOverlay - the same in-place editor story screens use).
//   - Look & feel: Studio's Colors & Theme (colours, card feel, Market &
//     Headquarters look) and the Market & Headquarters texts/runes.
//   - Everything else: every type Studio can edit, by category, each
//     opening Studio right on that list.
// Dependencies: Studio's own type registry (entityTypes.js) and deep links
// (/hearthwood-studio?view= / ?type= / &id=), so a new Studio type shows up
// here automatically.
import { useEffect, useState } from "react"
import { apiGet } from "../../api/client"
import { ALL_TYPES } from "../hearthwood-studio/entityTypes"
import QuickEditOverlay from "./QuickEditOverlay"
import { UNITS } from "../../data/heartwood/units"

const STUDIO = "/hearthwood-studio"

function studioLink(params) {
  return `${STUDIO}?${new URLSearchParams(params).toString()}`
}

export default function DevDesk({ heroDefIds = [] }) {
  const [editing, setEditing] = useState(null)
  const [showAll, setShowAll] = useState(false)
  // How much of each thing the game holds (Studio's overview) - Marc: "minun
  // on näin helpompi ymmärtää projektin laajuus". Fetched once, when the
  // list opens; without the Studio server the list simply has no numbers.
  const [counts, setCounts] = useState(null)
  useEffect(() => {
    if (!showAll || counts || !import.meta.env.DEV) return
    let cancelled = false
    apiGet("/hearthwood-patchbay/overview")
      .then((data) => {
        if (!cancelled) setCounts(Object.fromEntries((data.types || []).map((t) => [t.type, t.count])))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [showAll, counts])
  if (!import.meta.env.DEV) return null
  const total = counts ? Object.values(counts).reduce((a, n) => a + (n || 0), 0) : null

  const categories = [...new Set(ALL_TYPES.map((t) => t.category))]
  const heroes = [...new Set(heroDefIds)].filter((id) => UNITS[id])

  return (
    <section className="hwm-panel hwq-devdesk" aria-label="Dev desk">
      <h2 className="hwm-panel-title hwq-devdesk-title">
        <span aria-hidden="true">✎</span> Dev desk
        <small>only you see this</small>
      </h2>

      {heroes.length > 0 && (
        <div className="hwq-devdesk-group">
          <span className="hwq-devdesk-label">Edit your squad</span>
          <div className="hwq-devdesk-chips">
            {heroes.map((id) => (
              <button key={id} type="button" className="hwq-devdesk-chip" onClick={() => setEditing({ type: "units", id })}>
                {UNITS[id].name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="hwq-devdesk-group">
        <span className="hwq-devdesk-label">Look &amp; feel</span>
        <div className="hwq-devdesk-chips">
          <a className="hwq-devdesk-chip" href={studioLink({ view: "theme" })} target="_blank" rel="noreferrer">
            Colours, card feel &amp; layout look
          </a>
          <a className="hwq-devdesk-chip" href={studioLink({ type: "marketUi" })} target="_blank" rel="noreferrer">
            Titles &amp; runes
          </a>
        </div>
      </div>

      <div className="hwq-devdesk-group">
        <button type="button" className="hwq-devdesk-label hwq-devdesk-toggle" onClick={() => setShowAll((v) => !v)} aria-expanded={showAll}>
          {showAll ? "▾" : "▸"} Everything in the game ({ALL_TYPES.length} kinds{total != null ? ` · ${total} things` : ""})
        </button>
        {showAll &&
          categories.map((cat) => (
            <div key={cat} className="hwq-devdesk-cat">
              <span className="hwq-devdesk-cat-name">{cat}</span>
              <div className="hwq-devdesk-chips">
                {ALL_TYPES.filter((t) => t.category === cat).map((t) => (
                  <a key={t.type} className="hwq-devdesk-chip" href={studioLink({ type: t.type })} target="_blank" rel="noreferrer">
                    {t.label}
                    {counts?.[t.type] != null && <span className="hwq-devdesk-count">{counts[t.type]}</span>}
                  </a>
                ))}
              </div>
            </div>
          ))}
        <a className="hwq-devdesk-open" href={studioLink({ view: "dashboard" })} target="_blank" rel="noreferrer">
          Open the whole Studio →
        </a>
      </div>

      {editing && <QuickEditOverlay type={editing.type} id={editing.id} onClose={() => setEditing(null)} />}
    </section>
  )
}
