import { useEffect, useState } from "react"

import { apiGet } from "../../api/client"

import { actLabel } from "./actNames"
import StoryTimeline from "./StoryTimeline"

// Marc, 2026-09-20: "elä tee tuhatta alarivistöä vaan selkeästi kaikki
// esille josta voin muokata" / "laita fiksusti kaikki nippuun silleen
// että se on selkeä muokata" (don't make a thousand sub-lists, clearly
// show everything I can edit - put it all together smartly so it's
// clear to edit). The Story/Economy/Guidance/Other split (optgroups
// behind a closed dropdown) grew into exactly the kind of buried
// nesting he was pointing at. Every registered type is now ONE flat,
// always-visible, wrapped list - no menu to open, nothing hidden.
// `category` is kept per entry purely as a small inline tag (see the
// render below), not a separate section - it still tells you what
// KIND of thing you're looking at without making you go find it in a
// submenu first.
const ALL_TYPES = [
  { type: "enemies", label: "Enemies", category: "Content" },
  { type: "units", label: "Units", category: "Content" },
  { type: "cards", label: "Cards", category: "Content" },
  { type: "relics", label: "Relics", category: "Content" },
  { type: "items", label: "Items", category: "Content" },
  { type: "characters", label: "Characters", category: "Content" },
  { type: "formations", label: "Formations", category: "Content" },
  { type: "synergies", label: "Synergies", category: "Content" },
  { type: "dualClasses", label: "Dual Classes", category: "Content" },
  { type: "roles", label: "Unit Roles", category: "Content" },
  { type: "evolutions", label: "Evolutions", category: "Content" },
  { type: "upgradeBranches", label: "Upgrade Branches", category: "Content" },
  { type: "arenas", label: "Arenas", category: "Content" },

  // Marc, 2026-09-19: "en löydä mistä voin muokkaa pelin tarinaa"
  { type: "storyJournal", label: "Story Journal", category: "Story" },
  { type: "cinematics", label: "Cinematics", category: "Story" },
  { type: "crossroads", label: "Act Crossroads", category: "Story" },
  { type: "crownless", label: "Crownless Intro", category: "Story" },
  { type: "events", label: "Map Events", category: "Story" },
  { type: "dialogues", label: "Dialogues", category: "Story" },
  { type: "merchants", label: "Merchant Lines", category: "Story" },
  { type: "moods", label: "Forest Mood", category: "Story" },
  { type: "almanac", label: "Almanac Lore", category: "Story" },

  // Marc: "säädän itse sillä pelin vaikeustasoa"
  { type: "economyLevers", label: "Economy Levers", category: "Economy" },
  { type: "investments", label: "Ledger Investments", category: "Economy" },
  { type: "marketEvents", label: "Market Events", category: "Economy" },
  { type: "economyRoles", label: "Economy Crew Roles", category: "Economy" },
  { type: "depths", label: "Depths (Challenge Ladder)", category: "Economy" },
  { type: "boons", label: "Boons", category: "Economy" },
  { type: "banes", label: "Banes", category: "Economy" },

  // Marc, 2026-09-20: "kaiken" - the reference/onboarding text a
  // player actually reads mid-run.
  { type: "help", label: "Help Glossary", category: "Guidance" },
  { type: "coachTips", label: "Coach Tips", category: "Guidance" },
  { type: "threats", label: "Threat Counterplay", category: "Guidance" },
  { type: "trials", label: "Trials", category: "Guidance" },
  { type: "tutorial", label: "Tutorial", category: "Guidance" },
]

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
function EntityBrowser({ type, onTypeChange, selectedId, onSelect }) {
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
            <StoryTimeline selectedId={selectedId} onSelect={onSelect} />
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
