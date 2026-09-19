import { useEffect, useState } from "react"

import { apiGet } from "../../api/client"

import { actLabel } from "./actNames"

/*
 * Marc: "tämä on liian epäselvä systeemi että osaan editoida tarinaa
 * luotettavasti, en tiedä missä jaotellut paikat on... tarvitsen
 * jonkinlaisen kronologisen tavan pitää kirjaa missä kohtaa tarinaa
 * menen" (too unclear a system to edit the story reliably - I don't
 * know where the split-up places are, I need some chronological way to
 * track where I am in the story). Per-type Act badges (EntityBrowser)
 * weren't enough - the actual problem was that "the story" is spread
 * across SEVEN separate types (cinematics/crossroads/crownless/events/
 * merchants/storyJournal - moods/boons/banes are mechanical, not
 * narrative, and stay out of this view) that Marc had to browse one at
 * a time and mentally stitch together himself. This merges all six
 * into ONE chronological list, grouped by Act, regardless of which
 * data file or "type" a piece of text actually lives in - "kaiken
 * tarinaan liittyvä saa olla samassa valikossa" (everything story-
 * related can be in the same menu).
 *
 * Each entry only carries enough to render a row and hand off to the
 * existing onSelect(type, id) - clicking a row opens it in the SAME
 * detail panel (EntityFieldEditor/ListFieldEditor/ImageUploadField)
 * every other type already uses. No new editing surface here, purely
 * orientation: "where am I, and what's the next thing to click".
 */
const TIMELINE_TYPES = ["cinematics", "crossroads", "events", "storyJournal", "merchants", "crownless"]

// cinematics.js has no numeric `act` field of its own (see cinematics.js's
// own file comment: "the two bookends" plus later additions) - these are
// its real story positions, fixed by hand since there's nothing to read
// them from. `act` doubles as this view's sort bucket; 0 = before Act 1,
// 8 = after Act 7 (the three mutually-exclusive endings), 9 = after
// THAT (the epilogue).
const CINEMATIC_POSITIONS = {
  intro: { act: 0, priority: 0 },
  "crownless-throne": { act: 5, priority: -1 },
  "ending-rooted": { act: 8, priority: 0 },
  "ending-ember": { act: 8, priority: 0 },
  "ending-hollow": { act: 8, priority: 0 },
  "echo-epilogue": { act: 9, priority: 0 },
}

const TYPE_ICON = {
  cinematics: "🎬",
  crossroads: "🧭",
  events: "🗺",
  storyJournal: "📖",
  merchants: "🛒",
  crownless: "👑",
}

const TYPE_LABEL = {
  cinematics: "Cinematic",
  crossroads: "Crossroads",
  events: "Map Event",
  storyJournal: "Journal",
  merchants: "Merchant",
  crownless: "Crownless",
}

function groupLabelFor(act) {
  if (act === 0) return "Before Act 1 — The Opening"
  if (act === 8) return "After Act 7 — The Ending"
  if (act === 9) return "After the Ending — Epilogue"
  if (act === 99) return "Any point in the story"

  return actLabel(act)
}

function rowsFromEntities(byType) {
  const rows = []

  for (const entity of byType.crossroads || []) {
    const act = entity.fields?.actIndex?.value

    if (typeof act !== "number") {
      continue
    }

    rows.push({
      type: "crossroads",
      id: entity.id,
      act,
      priority: 0,
      label: entity.fields?.kicker?.value || entity.name || entity.id,
    })
  }

  for (const entity of byType.cinematics || []) {
    const fixed = CINEMATIC_POSITIONS[entity.id]

    if (!fixed) {
      continue
    }

    rows.push({
      type: "cinematics",
      id: entity.id,
      act: fixed.act,
      priority: fixed.priority,
      label: entity.fields?.title?.value || entity.name || entity.id,
    })
  }

  for (const entity of byType.events || []) {
    const act = entity.fields?.act?.value

    rows.push({
      type: "events",
      id: entity.id,
      act: typeof act === "number" ? act : 99,
      priority: 1,
      label: entity.name || entity.id,
    })
  }

  for (const entity of byType.storyJournal || []) {
    const act = entity.fields?.act?.value

    rows.push({
      type: "storyJournal",
      id: entity.id,
      act: typeof act === "number" ? act : 99,
      priority: 2,
      label: entity.name || entity.id,
    })
  }

  for (const entity of byType.merchants || []) {
    const act = Number(entity.id)

    rows.push({
      type: "merchants",
      id: entity.id,
      act: Number.isInteger(act) ? act : 99,
      priority: 3,
      label: entity.name || `Merchant (Act ${entity.id})`,
    })
  }

  for (const entity of byType.crownless || []) {
    // The Crownless court is a single Act V encounter, branching only by
    // the squad's dominant tribe - every entry sits at the same point.
    rows.push({
      type: "crownless",
      id: entity.id,
      act: 5,
      priority: 4,
      label: entity.name || entity.id,
    })
  }

  rows.sort((a, b) => a.act - b.act || a.priority - b.priority)

  return rows
}

function StoryTimeline({ selectedId, onSelect }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setErrorMessage("")

      try {
        const results = await Promise.all(
          TIMELINE_TYPES.map(type => apiGet(`/hearthwood-patchbay/entities?type=${type}`)),
        )

        const byType = {}

        TIMELINE_TYPES.forEach((type, index) => {
          byType[type] = results[index]?.entities || []
        })

        if (!cancelled) {
          setRows(rowsFromEntities(byType))
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

  if (loading) {
    return <div className="px-2 py-1 text-xs text-[var(--wood-muted)]">Loading the story timeline...</div>
  }

  if (errorMessage) {
    return <div className="px-2 py-1 text-xs text-red-300">{errorMessage}</div>
  }

  let lastGroup = null

  return (
    <div className="space-y-1">
      {
        rows.map(row => {
          const group = groupLabelFor(row.act)
          const showHeader = group !== lastGroup

          lastGroup = group

          return (
            <div key={`${row.type}:${row.id}`}>
              {
                showHeader && (
                  <div className="sticky top-0 z-10 -mx-3 mb-1 bg-[var(--wood-panel)] px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--wood-accent)]">
                    {group}
                  </div>
                )
              }

              <button
                type="button"
                onClick={() => onSelect(row.type, row.id)}
                className={`
                  flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors
                  ${
                    selectedId === row.id
                      ? "border-[var(--wood-accent)] bg-[var(--wood-card)] text-[var(--wood-text)]"
                      : "border-transparent text-[var(--wood-muted)] hover:bg-[var(--wood-card)] hover:text-[var(--wood-text)]"
                  }
                `}
              >
                <span className="shrink-0">{TYPE_ICON[row.type]}</span>

                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{row.label}</div>
                  <div className="truncate font-mono text-[10px] opacity-70">{TYPE_LABEL[row.type]} · {row.id}</div>
                </div>
              </button>
            </div>
          )
        })
      }
    </div>
  )
}

export default StoryTimeline
