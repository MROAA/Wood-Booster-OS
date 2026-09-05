import { useEffect, useState } from "react"

import { apiGet } from "../../api/client"

const PRIMARY_TYPES = [
  { type: "enemies", label: "Viholliset" },
  { type: "units", label: "Yksiköt" },
  { type: "cards", label: "Kortit" },
  { type: "relics", label: "Reliikit" },
  { type: "items", label: "Esineet" },
]

const OVERFLOW_TYPES = [
  { type: "characters", label: "Hahmot" },
  { type: "formations", label: "Muodostelmat" },
  { type: "synergies", label: "Synergiat" },
  { type: "dualClasses", label: "Kaksoisluokat" },
  { type: "trials", label: "Koitokset" },
  { type: "tutorial", label: "Tutoriaali" },
]

/*
 * Entiteettiselain: tyyppivälilehdet (enemies|units|cards|relics|items
 * suoraan näkyvissä, loput pudotusvalikossa) + haku id/name-kentästä,
 * ks. GET /api/hearthwood-patchbay/entities?type=&q= (paths.js:n
 * ENTITY_TYPES on totuuden lähde tyypeille).
 */
function EntityBrowser({ type, onTypeChange, selectedId, onSelect }) {
  const [entities, setEntities] = useState([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  const isOverflowType = OVERFLOW_TYPES.some(entry => entry.type === type)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setErrorMessage("")

      try {
        const params = new URLSearchParams({ type })

        if (query.trim()) {
          params.set("q", query.trim())
        }

        const data = await apiGet(`/hearthwood-patchbay/entities?${params.toString()}`)

        if (!cancelled) {
          setEntities(data.entities || [])
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error.message)
          setEntities([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [type, query])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 space-y-3 p-4">
        <div className="flex flex-wrap gap-1.5">
          {
            PRIMARY_TYPES.map(entry => (
              <button
                key={entry.type}
                type="button"
                onClick={() => onTypeChange(entry.type)}
                className={`
                  rounded-full border px-3 py-1 text-xs font-medium transition-colors
                  ${
                    type === entry.type
                      ? "border-[var(--wood-accent)] bg-[var(--wood-accent)] text-[#17120c]"
                      : "border-[var(--wood-border)] text-[var(--wood-muted)] hover:text-[var(--wood-text)]"
                  }
                `}
              >
                {entry.label}
              </button>
            ))
          }
        </div>

        <select
          value={isOverflowType ? type : ""}
          onChange={event => event.target.value && onTypeChange(event.target.value)}
          className={`
            h-8 w-full rounded-full border px-3 text-xs outline-none
            ${
              isOverflowType
                ? "border-[var(--wood-accent)] text-[var(--wood-text)]"
                : "border-[var(--wood-border)] text-[var(--wood-muted)]"
            }
          `}
        >
          <option value="">Muut tyypit...</option>
          {
            OVERFLOW_TYPES.map(entry => (
              <option key={entry.type} value={entry.type}>{entry.label}</option>
            ))
          }
        </select>

        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Hae nimellä tai id:llä..."
          className="
            h-9 w-full rounded-full border border-[var(--wood-border)] bg-[var(--wood-bg)]
            px-4 text-xs text-[var(--wood-text)] outline-none
            placeholder:text-[var(--wood-muted)] focus:border-[var(--wood-accent)]
          "
        />
      </div>

      <div className="wood-scroll min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-3">
        {loading && <div className="px-2 py-1 text-xs text-[var(--wood-muted)]">Ladataan...</div>}

        {errorMessage && <div className="px-2 py-1 text-xs text-red-300">{errorMessage}</div>}

        {
          !loading && !errorMessage && entities.length === 0 && (
            <div className="px-2 py-1 text-xs text-[var(--wood-muted)]">Ei tuloksia.</div>
          )
        }

        {
          entities.map(entity => (
            <button
              key={entity.id}
              type="button"
              onClick={() => onSelect(type, entity.id)}
              className={`
                w-full rounded-lg border px-3 py-2 text-left text-xs transition-colors
                ${
                  selectedId === entity.id
                    ? "border-[var(--wood-accent)] bg-[var(--wood-card)] text-[var(--wood-text)]"
                    : "border-transparent text-[var(--wood-muted)] hover:bg-[var(--wood-card)] hover:text-[var(--wood-text)]"
                }
              `}
            >
              <div className="font-medium">{entity.name || entity.id}</div>
              <div className="font-mono text-[10px] opacity-70">{entity.id}</div>
            </button>
          ))
        }
      </div>
    </div>
  )
}

export default EntityBrowser
