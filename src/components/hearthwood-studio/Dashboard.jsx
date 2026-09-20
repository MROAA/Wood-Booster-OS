import { useEffect, useState } from "react"

import { apiGet } from "../../api/client"

import { ALL_TYPES, labelFor } from "./entityTypes"

/*
 * Dashboard - the Studio's front door (Marc, 2026-09-20: "tahdon paljon
 * eri toiminnallisuuksia dev studioon" / "kaiken" / "selkeä, yksinkertainen
 * ja tehokas" - picked "easier ways to find/use what's already editable"
 * over new game systems). Two things, both new: an at-a-glance count of
 * every content type (so "is X actually in there, and how much of it"
 * is answered in one glance, not a fetch-per-type click) and ONE search
 * box that finds anything across ALL 34 types at once - the existing
 * search box only ever searched within whichever single type was
 * already selected.
 */
function Dashboard({ onNavigate, onSelectEntity }) {
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  const [query, setQuery] = useState("")
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setErrorMessage("")

      try {
        const data = await apiGet("/hearthwood-patchbay/overview")

        if (!cancelled) {
          setOverview(data)
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error.message)
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
  }, [])

  useEffect(() => {
    const needle = query.trim()

    if (!needle) {
      setResults([])
      return
    }

    let cancelled = false

    const timer = setTimeout(async () => {
      setSearching(true)

      try {
        const data = await apiGet(`/hearthwood-patchbay/search?q=${encodeURIComponent(needle)}`)

        if (!cancelled) {
          setResults(data.results || [])
        }
      } catch {
        if (!cancelled) {
          setResults([])
        }
      } finally {
        if (!cancelled) {
          setSearching(false)
        }
      }
    }, 250)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query])

  const countByType = new Map((overview?.types || []).map(entry => [entry.type, entry.count]))

  const categories = [...new Set(ALL_TYPES.map(entry => entry.category))]

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 space-y-2 border-b border-[var(--wood-border)] p-4">
        <div className="text-sm font-semibold text-[var(--wood-text)]">Search everything</div>

        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Search across all content, story, economy and guidance at once..."
          className="
            h-10 w-full rounded-full border border-[var(--wood-border)] bg-[var(--wood-bg)]
            px-4 text-sm text-[var(--wood-text)] outline-none
            placeholder:text-[var(--wood-muted)] focus:border-[var(--wood-accent)]
          "
        />

        {
          query.trim() && (
            <div className="wood-scroll max-h-64 overflow-y-auto rounded-lg border border-[var(--wood-border)] bg-[var(--wood-bg)]">
              {
                searching && (
                  <div className="px-3 py-2 text-xs text-[var(--wood-muted)]">Searching...</div>
                )
              }

              {
                !searching && results.length === 0 && (
                  <div className="px-3 py-2 text-xs text-[var(--wood-muted)]">No matches for "{query}".</div>
                )
              }

              {
                !searching && results.map(result => (
                  <button
                    key={`${result.type}:${result.id}`}
                    type="button"
                    onClick={() => onSelectEntity(result.type, result.id)}
                    className="
                      flex w-full items-center justify-between gap-2 border-b border-[var(--wood-border)]
                      px-3 py-2 text-left text-xs last:border-b-0
                      hover:bg-[var(--wood-card)]
                    "
                  >
                    <span className="truncate text-[var(--wood-text)]">{result.name || result.id}</span>
                    <span className="shrink-0 rounded-full border border-[var(--wood-border)] px-2 py-0.5 text-[10px] text-[var(--wood-muted)]">
                      {labelFor(result.type)}
                    </span>
                  </button>
                ))
              }
            </div>
          )
        }
      </div>

      <div className="wood-scroll min-h-0 flex-1 overflow-y-auto p-4 space-y-6">
        {loading && <div className="text-sm text-[var(--wood-muted)]">Loading...</div>}

        {errorMessage && <div className="text-xs text-red-300">{errorMessage}</div>}

        {
          !loading && !errorMessage && (
            <>
              <div className="text-sm text-[var(--wood-muted)]">
                <span className="font-semibold text-[var(--wood-text)]">{overview?.totalEntities ?? 0}</span> things across{" "}
                <span className="font-semibold text-[var(--wood-text)]">{ALL_TYPES.length}</span> editable content types.
              </div>

              {
                categories.map(category => (
                  <div key={category}>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--wood-muted)]">
                      {category}
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                      {
                        ALL_TYPES.filter(entry => entry.category === category).map(entry => (
                          <button
                            key={entry.type}
                            type="button"
                            onClick={() => onNavigate(entry.type)}
                            className="
                              flex items-center justify-between gap-2 rounded-lg border border-[var(--wood-border)]
                              bg-[var(--wood-bg)] px-3 py-2 text-left text-xs transition-colors
                              hover:border-[var(--wood-accent)] hover:text-[var(--wood-text)]
                            "
                          >
                            <span className="truncate text-[var(--wood-text)]">{entry.label}</span>
                            <span className="shrink-0 rounded-full bg-[var(--wood-card)] px-2 py-0.5 text-[10px] text-[var(--wood-muted)]">
                              {countByType.get(entry.type) ?? "-"}
                            </span>
                          </button>
                        ))
                      }
                    </div>
                  </div>
                ))
              }
            </>
          )
        }
      </div>
    </div>
  )
}

export default Dashboard
