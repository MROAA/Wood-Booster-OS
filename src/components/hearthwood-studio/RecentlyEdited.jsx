import { useEffect, useState } from "react"

import { apiGet } from "../../api/client"

import { labelFor } from "./entityTypes"
import { plainName } from "./plainWords"

/*
 * "Continue where you left off" on the HQ home: the last things Marc put
 * into the game, newest first, one click to open each. Marc, 2026-10-19:
 * "työkalu on hyvä kun se on tehokas". Built from the Patchbay's own change
 * list (summary "type/id: ..."), so it shows real saves only.
 */
const SAVED = new Set(["applied", "qa_passed"])
const MAX = 6

function ago(iso) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  return `${Math.round(hours / 24)} d ago`
}

function RecentlyEdited({ onOpen }) {
  const [items, setItems] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const rows = await apiGet("/hearthwood-patchbay?archived=false")
        const seen = new Set()
        const recent = []
        for (const row of Array.isArray(rows) ? rows : []) {
          if (!SAVED.has(row.status)) continue
          const match = /^([A-Za-z]+)\/([^:]+):/.exec(row.summary || "")
          if (!match) continue
          const key = `${match[1]}/${match[2]}`
          if (seen.has(key)) continue
          seen.add(key)
          recent.push({ type: match[1], id: match[2], at: row.createdAt })
          if (recent.length === MAX) break
        }
        // Names and pictures from each list (one fetch per list).
        const lists = {}
        await Promise.all([...new Set(recent.map(item => item.type))].map(async type => {
          try {
            lists[type] = (await apiGet(`/hearthwood-patchbay/entities?type=${type}`)).entities || []
          } catch {
            lists[type] = []
          }
        }))
        const withEntity = recent
          .map(item => ({ ...item, entity: (lists[item.type] || []).find(e => String(e.id) === String(item.id)) }))
          .filter(item => item.entity)
        if (!cancelled) setItems(withEntity)
      } catch {
        if (!cancelled) setItems([])
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (!items || items.length === 0) return null

  return (
    <section className="space-y-2" data-testid="recently-edited">
      <div className="text-xs font-semibold uppercase tracking-wide text-[var(--wood-muted)]">Continue where you left off</div>
      <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
        {
          items.map(item => {
            const image = item.entity.fields?.image?.value
            return (
              <button
                key={`${item.type}/${item.id}`}
                type="button"
                onClick={() => onOpen(item.type, item.id)}
                data-recent={`${item.type}/${item.id}`}
                className="hws-card flex items-center gap-3 rounded-xl border border-[var(--wood-border)] p-2 text-left hover:border-[var(--wood-accent)]"
              >
                <span className="flex h-12 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[var(--wood-bg)] text-lg text-[var(--wood-accent)]">
                  {image ? <img src={`/${image}`} alt="" className="h-full w-full object-cover" onError={event => { event.currentTarget.style.display = "none" }} /> : plainName(item.entity).charAt(0)}
                </span>
                <span className="min-w-0">
                  <span className="hws-display block truncate text-base font-semibold text-[var(--wood-text)]">{plainName(item.entity, labelFor(item.type))}</span>
                  <span className="block truncate text-[11px] text-[var(--wood-muted)]">{labelFor(item.type)} · {ago(item.at)}</span>
                </span>
              </button>
            )
          })
        }
      </div>
    </section>
  )
}

export default RecentlyEdited
