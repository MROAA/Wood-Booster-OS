import { useEffect, useState } from "react"

import { apiGet } from "../../api/client"

import { actLabel } from "./actNames"
import StoryTimeline from "./StoryTimeline"

// Marc, 2026-09-19: "puhun sinulle suomeksi koska se on äidinkieleni
// mutta haluan peliin liittyvät ja pelin itse englanniksi" (he speaks
// to Claude in Finnish, but wants the game itself and everything
// related to it in English) - these labels were originally Finnish;
// converted to English this round for that reason, not a translation
// pass for its own sake.
const PRIMARY_TYPES = [
  { type: "enemies", label: "Enemies" },
  { type: "units", label: "Units" },
  { type: "cards", label: "Cards" },
  { type: "relics", label: "Relics" },
  { type: "items", label: "Items" },
]

// Marc, 2026-09-19: "en löydä mistä voin muokkaa pelin tarinaa" (can't
// find where to edit the game's story) - every one of these WAS already
// reachable, just flattened into one alphabetical dropdown with no
// label saying "this is the story". Grouped by <optgroup> below so
// "Story" is a real, visible category instead of something you have to
// already know to look for.
const STORY_TYPES = [
  { type: "storyJournal", label: "Story Journal" },
  { type: "cinematics", label: "Cinematics" },
  { type: "crossroads", label: "Act Crossroads" },
  { type: "crownless", label: "Crownless Intro" },
  { type: "events", label: "Map Events" },
  { type: "merchants", label: "Merchant Lines" },
  { type: "moods", label: "Forest Mood" },
]

// Marc: "dev studiossa pitää olla mukana myös ekonomia... säädän itse
// sillä pelin vaikeustasoa" (the dev studio needs the economy too - I
// will use it myself to adjust the game's difficulty). These 3 read
// from economyLevers.js (extracted out of the HIGH-risk runEngine.js
// specifically so they could live here).
const ECONOMY_TYPES = [
  { type: "economyLevers", label: "Economy Levers" },
  { type: "investments", label: "Ledger Investments" },
  { type: "marketEvents", label: "Market Events" },
  { type: "economyRoles", label: "Economy Crew Roles" },
  { type: "depths", label: "Depths (Challenge Ladder)" },
]

// Marc, 2026-09-20: "kaiken" (everything) - the reference/onboarding
// text a player actually reads mid-run, as distinct from game mechanics
// content (Other) or narrative (Story).
const GUIDANCE_TYPES = [
  { type: "help", label: "Help Glossary" },
  { type: "coachTips", label: "Coach Tips" },
  { type: "threats", label: "Threat Counterplay" },
]

const OTHER_TYPES = [
  { type: "characters", label: "Characters" },
  { type: "formations", label: "Formations" },
  { type: "synergies", label: "Synergies" },
  { type: "dualClasses", label: "Dual Classes" },
  { type: "trials", label: "Trials" },
  { type: "tutorial", label: "Tutorial" },
  { type: "boons", label: "Boons" },
  { type: "banes", label: "Banes" },
  { type: "almanac", label: "Almanac Lore" },
  { type: "arenas", label: "Arenas" },
  { type: "evolutions", label: "Evolutions" },
  { type: "roles", label: "Unit Roles" },
  { type: "upgradeBranches", label: "Upgrade Branches" },
]

const OVERFLOW_TYPES = [...STORY_TYPES, ...ECONOMY_TYPES, ...GUIDANCE_TYPES, ...OTHER_TYPES]

// Marc: "tämä on liian epäselvä systeemi että osaan editoida tarinaa
// luotettavasti... tarvitsen jonkinlaisen kronologisen tavan pitää
// kirjaa missä kohtaa tarinaa menen" (too unclear to edit the story
// reliably - need a chronological way to track where I am in the
// story) - a per-type Act badge wasn't enough because the story is
// spread across all of STORY_TYPES with no single place to see it as
// one sequence. This isn't a real backend entity type (no
// /entities?type=storyTimeline route) - it's a pseudo-type this
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
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  const isOverflowType = OVERFLOW_TYPES.some(entry => entry.type === type)
  const isStoryTimeline = type === STORY_TIMELINE_TYPE

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
          <option value="">Other types...</option>

          <optgroup label="Story">
            {
              STORY_TYPES.map(entry => (
                <option key={entry.type} value={entry.type}>{entry.label}</option>
              ))
            }
          </optgroup>

          <optgroup label="Economy">
            {
              ECONOMY_TYPES.map(entry => (
                <option key={entry.type} value={entry.type}>{entry.label}</option>
              ))
            }
          </optgroup>

          <optgroup label="Guidance">
            {
              GUIDANCE_TYPES.map(entry => (
                <option key={entry.type} value={entry.type}>{entry.label}</option>
              ))
            }
          </optgroup>

          <optgroup label="Other">
            {
              OTHER_TYPES.map(entry => (
                <option key={entry.type} value={entry.type}>{entry.label}</option>
              ))
            }
          </optgroup>
        </select>

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
