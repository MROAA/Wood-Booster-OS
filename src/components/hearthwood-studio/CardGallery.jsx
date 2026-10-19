import { useEffect, useState } from "react"

import { apiGet } from "../../api/client"

import { labelFor } from "./entityTypes"
import { plainName } from "./plainWords"

/*
 * A list as picture cards - the page you land on when you open a list
 * (heroes, enemies, relics, items...). Marc, 2026-10-19: "tehdään kaikki
 * visuaalisella tyylillä koska se sopii minulle". Each card: the picture
 * (or a symbol), the name, the key numbers; the description unfolds on
 * hover like the game's cards (heartwood-reveal.css). Click to edit.
 */
const ICON_WORDS = {
  sword: "🗡", shield: "🛡", leaf: "🍃", flame: "🔥", tide: "🌊", moonGlyph: "🌙", gale: "🌬", cosmic: "✨",
  root: "🌿", stone: "🪨", rune: "ᚱ", heart: "❤", ember: "🔥", shadow: "🌑", spark: "⚡",
}
const STATS = [
  ["maxHp", "❤"], ["hp", "❤"], ["attack", "⚔"], ["baseAttack", "⚔"], ["range", "🏹"], ["mana", "💧"], ["manaPool", "💧"], ["cost", "🪙"], ["price", "🪙"], ["value", "🔢"],
]
const TEXT_KEYS = ["description", "desc", "text", "blurb", "line", "effect", "telling", "meaning", "goal"]

function symbolFor(entity) {
  const icon = entity.fields?.icon?.value
  if (icon && ICON_WORDS[icon]) return ICON_WORDS[icon]
  if (icon && [...String(icon)].length <= 2) return icon
  return (plainName(entity) || "?").charAt(0).toUpperCase()
}

function CardGallery({ type, onSelect, reloadKey = 0 }) {
  const [entities, setEntities] = useState(null)
  const [query, setQuery] = useState("")

  useEffect(() => {
    let cancelled = false
    apiGet(`/hearthwood-patchbay/entities?type=${type}`)
      .then(data => { if (!cancelled) setEntities(data.entities || []) })
      .catch(() => { if (!cancelled) setEntities([]) })
    return () => { cancelled = true }
  }, [type, reloadKey])

  if (!entities) return <div className="text-sm text-[var(--wood-muted)]">Loading {labelFor(type)}...</div>

  const needle = query.trim().toLowerCase()
  const shown = needle ? entities.filter(entity => plainName(entity).toLowerCase().includes(needle)) : entities

  return (
    <div className="space-y-3" data-testid="card-gallery">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-[var(--wood-text)]"><span className="text-lg font-semibold">{entities.length}</span> {labelFor(type)} · click a card to change it</div>
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Find by name..."
          className="h-9 w-56 rounded-full border border-[var(--wood-border)] bg-[var(--wood-bg)] px-4 text-sm text-[var(--wood-text)] outline-none focus:border-[var(--wood-accent)]"
          data-testid="card-gallery-search"
        />
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
        {
          shown.map(entity => {
            const image = entity.fields?.image?.value
            const stats = STATS.filter(([key]) => entity.fields?.[key]?.kind === "number").slice(0, 3)
            const textKey = TEXT_KEYS.find(key => entity.fields?.[key]?.kind === "string")
            return (
              <button
                key={entity.id}
                type="button"
                onClick={() => onSelect(type, entity.id)}
                data-card={entity.id}
                className="hw-reveal flex flex-col overflow-hidden rounded-xl border border-[var(--wood-border)] bg-[var(--wood-bg)] text-left transition-colors hover:border-[var(--wood-accent)] focus:border-[var(--wood-accent)]"
              >
                <div className="flex w-full items-center justify-center overflow-hidden bg-[var(--wood-panel)]" style={{ aspectRatio: "3 / 4" }}>
                  {
                    image
                      ? <img src={`/${image}`} alt="" loading="lazy" className="h-full w-full object-cover" />
                      : <span className="text-5xl text-[var(--wood-accent)]" aria-hidden="true">{symbolFor(entity)}</span>
                  }
                </div>
                <div className="space-y-1 p-2">
                  <div className="truncate text-sm font-semibold text-[var(--wood-text)]">{plainName(entity, labelFor(type))}</div>
                  {
                    stats.length > 0 && (
                      <div className="flex flex-wrap gap-x-2 text-xs tabular-nums text-[var(--wood-muted)]">
                        {stats.map(([key, icon]) => <span key={key}>{icon} {entity.fields[key].value}</span>)}
                      </div>
                    )
                  }
                  {textKey && <div className="hw-reveal-more text-[11px] leading-snug text-[var(--wood-muted)]">{entity.fields[textKey].value}</div>}
                </div>
              </button>
            )
          })
        }
      </div>

      {shown.length === 0 && <div className="text-sm text-[var(--wood-muted)]">Nothing called "{query}".</div>}
    </div>
  )
}

export default CardGallery
