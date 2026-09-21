import { useEffect, useState } from "react"

import { apiGet } from "../../api/client"

import { actLabel } from "./actNames"
import { ALL_TYPES } from "./entityTypes"
import StoryTimeline from "./StoryTimeline"

// Marc: "tämä on liian epäselvä systeemi että osaan editoida tarinaa
// luotettavasti... tarvitsen jonkinlaisen kronologisen tavan pitää
// kirjaa missä kohtaa tarinaa menen" (too unclear to edit the story
// reliably - need a chronological way to track where I am in the
// story) - a per-type Act badge wasn't enough because the story is
// spread across several "Story"-category types (see ALL_TYPES above)
// with no single place to see it as one sequence. This isn't a real
// backend entity type (no /entities?type=storyTimeline route) - it's a pseudo-type this
// component itself recognizes to swap its whole list for
// StoryTimeline.jsx, which merges several real types into one
// chronological view.
const STORY_TIMELINE_TYPE = "storyTimeline"

/*
 * Entiteettiselain: tyyppivälilehdet (enemies|units|cards|relics|items
 * suoraan näkyvissä, loput pudotusvalikossa) + haku id/name-kentästä,
 * ks. GET /api/hearthwood-patchbay/entities?type=&q= (paths.js:n
 * ENTITY_TYPES on totuuden lähde tyypeille).
 */
function EntityBrowser({ type, onTypeChange, selectedId, onSelect, onAddNew, onCreateNew }) {
  const [entities, setEntities] = useState([])
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  const isStoryTimeline = type === STORY_TIMELINE_TYPE

  const needle = typeFilter.trim().toLowerCase()
  const visibleTypes = needle
    ? ALL_TYPES.filter(entry =>
      entry.label.toLowerCase().includes(needle) || entry.category.toLowerCase().includes(needle),
    )
    : ALL_TYPES

  useEffect(() => {
    if (isStoryTimeline) {
      // StoryTimeline.jsx does its own fetching across several real
      // types - there is no /entities?type=storyTimeline route.
      setLoading(false)
      return
    }

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
  }, [type, query, isStoryTimeline])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 space-y-3 p-4">
        <button
          type="button"
          onClick={() => onTypeChange(STORY_TIMELINE_TYPE)}
          className={`
            flex w-full items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors
            ${
              isStoryTimeline
                ? "border-[var(--wood-accent)] bg-[var(--wood-accent)] text-[#17120c]"
                : "border-[var(--wood-accent)] text-[var(--wood-accent)] hover:bg-[var(--wood-card)]"
            }
          `}
        >
          📖 Story Timeline
        </button>

        <input
          value={typeFilter}
          onChange={event => setTypeFilter(event.target.value)}
          placeholder="Filter types (e.g. story, economy)..."
          className="
            h-8 w-full rounded-full border border-[var(--wood-border)] bg-[var(--wood-bg)]
            px-3 text-xs text-[var(--wood-text)] outline-none
            placeholder:text-[var(--wood-muted)] focus:border-[var(--wood-accent)]
          "
        />

        <div className="wood-scroll max-h-40 overflow-y-auto rounded-lg border border-[var(--wood-border)] bg-[var(--wood-bg)] p-2">
          <div className="flex flex-wrap gap-1.5">
            {
              visibleTypes.map(entry => (
                <button
                  key={entry.type}
                  type="button"
                  title={entry.category}
                  onClick={() => onTypeChange(entry.type)}
                  className={`
                    rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors
                    ${
                      type === entry.type
                        ? "border-[var(--wood-accent)] bg-[var(--wood-accent)] text-[#17120c]"
                        : "border-[var(--wood-border)] text-[var(--wood-muted)] hover:border-[var(--wood-accent)] hover:text-[var(--wood-text)]"
                    }
                  `}
                >
                  {entry.label}
                </button>
              ))
            }

            {
              visibleTypes.length === 0 && (
                <div className="px-1 py-1 text-[11px] text-[var(--wood-muted)]">No types match "{typeFilter}".</div>
              )
            }
          </div>
        </div>

        {
          !isStoryTimeline && (
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search by name or id..."
              className="
                h-9 w-full rounded-full border border-[var(--wood-border)] bg-[var(--wood-bg)]
                px-4 text-xs text-[var(--wood-text)] outline-none
                placeholder:text-[var(--wood-muted)] focus:border-[var(--wood-accent)]
              "
            />
          )
        }
      </div>

      {
        isStoryTimeline && (
          <div className="wood-scroll min-h-0 flex-1 overflow-y-auto px-3 pb-3">
            <StoryTimeline selectedId={selectedId} onSelect={onSelect} onAddNew={onAddNew} />
          </div>
        )
      }

      {
        !isStoryTimeline && (
          <div className="wood-scroll min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-3">
            {loading && <div className="px-2 py-1 text-xs text-[var(--wood-muted)]">Loading...</div>}

            {errorMessage && <div className="px-2 py-1 text-xs text-red-300">{errorMessage}</div>}

            {
              !loading && !errorMessage && entities.length === 0 && (
                <div className="px-2 py-1 text-xs text-[var(--wood-muted)]">No results.</div>
              )
            }

            {
              // Marc: "haluan pystyä myös luomaan uusia yksikköjä,
              // vihuja, reliccejä, etc... en löydä vielä uuden luomisen
              // mahdollisuutta dev studiossa" (I want to be able to
              // create new units, enemies, relics too - I still can't
              // find where to create new ones). Creating a new entry
              // has always meant "Clone as new" (CloneEntityForm), but
              // that only ever appeared once you'd already clicked INTO
              // some existing entity - nothing here said "you can add
              // one" until you did. This button clones the first entry
              // of whichever type is open, landing straight on its
              // already-open Clone form (renamed id/name fields, ready
              // to edit) - one click instead of "find an entity, notice
              // its small Clone button, click that too."
              !loading && !errorMessage && entities.length > 0 && (
                <button
                  type="button"
                  onClick={() => onCreateNew?.(type, entities[0].id)}
                  className="mb-1 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-[var(--wood-border)] px-3 py-2 text-xs font-medium text-[var(--wood-muted)] transition-colors hover:border-[var(--wood-accent)] hover:text-[var(--wood-text)]"
                >
                  + Add new
                </button>
              )
            }

            {
              entities.map(entity => {
                const imagePath = entity.fields?.image?.value
                const act = entity.fields?.act?.value

                return (
                  <button
                    key={entity.id}
                    type="button"
                    onClick={() => onSelect(type, entity.id)}
                    className={`
                      flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors
                      ${
                        selectedId === entity.id
                          ? "border-[var(--wood-accent)] bg-[var(--wood-card)] text-[var(--wood-text)]"
                          : "border-transparent text-[var(--wood-muted)] hover:bg-[var(--wood-card)] hover:text-[var(--wood-text)]"
                      }
                    `}
                  >
                    {
                      imagePath && (
                        <img
                          src={`/${imagePath}`}
                          alt=""
                          className="h-8 w-8 shrink-0 rounded object-cover bg-[var(--wood-bg)]"
                        />
                      )
                    }

                    <div className="min-w-0 flex-1">
                      {
                        // Marc: "sen pitää kertoa minulle missä kohtaa
                        // tarinaa menen" (it needs to tell me where I am in
                        // the story) - any entity with a numeric `act`
                        // field (Map Events, Story Journal) gets this for
                        // free, without the browser needing to know which
                        // type it's looking at. A bare "Act 3" still left
                        // it unclear (Marc: "on vieläkin epäselvää") - the
                        // Act's own theme name (actNames.js) is what
                        // actually places it. Its own line, full width, so
                        // the name it's a caption goes above.
                        typeof act === "number" && (
                          <div className="truncate text-[10px] font-semibold uppercase tracking-wide text-[var(--wood-accent)]">
                            {actLabel(act)}
                          </div>
                        )
                      }
                      <div className="truncate font-medium">{entity.name || entity.id}</div>
                      <div className="truncate font-mono text-[10px] opacity-70">{entity.id}</div>
                    </div>
                  </button>
                )
              })
            }
          </div>
        )
      }
    </div>
  )
}

export default EntityBrowser
