import { useEffect, useState } from "react"

import { apiGet } from "../../api/client"

import { labelFor } from "./entityTypes"
import { STUDIO_ROOMS } from "./studioRooms"
import StudioWishBox from "./StudioWishBox"
import RecentlyEdited from "./RecentlyEdited"

/*
 * Hearthwood HQ - the Studio's front door (studioRooms.js has the why).
 * Eight rooms, each: a rune, a name, one plain sentence, and ready
 * buttons. Clicking the room itself opens its list; a button jumps
 * straight to that one job.
 */
// Marc's own statement of what the Studio is for (2026-10-19, Finnish
// original + full PRD: docs/hearthwood-dev-studio-prd.md §0).
const PURPOSE_SHORT = "Here you create and shape Hearthwood yourself - with AI help, and with honest limits: if something can't be done yet, the Studio tells you right away."
const PURPOSE_FULL = [
  "With the Dev Studio I create, edit and build the game's content myself, the way I want it.",
  "It is clear and easy to use, and it works with AI assistance. If something I want to add can't be done, the limits are told to me right away.",
  "The Studio is the game's engine and the headquarters of its development: it uses the themes, styles and everything else the game already has, and it defines the game's style and content.",
  "It is a growing piece of the game - the way I shape Hearthwood myself.",
]

const plaque = "rounded-full border border-[var(--wood-border)] px-3 py-1 text-xs text-[var(--wood-text)] transition-colors hover:border-[var(--wood-accent)] hover:bg-[var(--wood-card)]"

function StudioHome({ onEnterRoom, onAction, onWish, onOpenEntity }) {
  const [showPurpose, setShowPurpose] = useState(false)
  // How many things each room holds (Marc: "haluan etusivun lohkoille
  // numerot että kuinka paljon niitä asioita on") - from /overview.
  const [counts, setCounts] = useState(null)

  useEffect(() => {
    let cancelled = false
    apiGet("/hearthwood-patchbay/overview")
      .then(data => { if (!cancelled) setCounts(Object.fromEntries((data.types || []).map(entry => [entry.type, entry.count]))) })
      .catch(() => { if (!cancelled) setCounts({}) })
    return () => { cancelled = true }
  }, [])

  const roomCount = room => {
    if (!counts) return null
    const parts = room.types.filter(type => counts[type] > 0).map(type => ({ type, count: counts[type] })).sort((a, b) => b.count - a.count)
    return { total: parts.reduce((sum, part) => sum + part.count, 0), parts }
  }

  return (
    <div className="space-y-4" data-testid="studio-home">
      <div className="max-w-3xl text-sm text-[var(--wood-text)]" data-testid="studio-purpose">
        {PURPOSE_SHORT}{" "}
        <button type="button" onClick={() => setShowPurpose(open => !open)} className="text-xs text-[var(--wood-accent)] underline decoration-dotted">
          {showPurpose ? "Less" : "Read more"}
        </button>
        {
          showPurpose && (
            <div className="mt-2 space-y-1 border-l border-[var(--wood-accent)] pl-3 text-xs italic leading-relaxed text-[var(--wood-muted)]">
              {PURPOSE_FULL.map(line => <p key={line}>{line}</p>)}
            </div>
          )
        }
      </div>

      <StudioWishBox onGo={onWish} />

      <RecentlyEdited onOpen={onOpenEntity} />

      <ol className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-[var(--wood-muted)]">
        <li><span className="text-[var(--wood-accent)]">1.</span> Pick a room below</li>
        <li><span className="text-[var(--wood-accent)]">2.</span> Make your change and look at the preview</li>
        <li><span className="text-[var(--wood-accent)]">3.</span> Press "Put it in the game". Changed your mind? <span className="text-[var(--wood-text)]">↩ Undo a change</span></li>
      </ol>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {
          STUDIO_ROOMS.map(room => (
            <article
              key={room.id}
              data-room={room.id}
              tabIndex={-1}
              className="hws-card hw-reveal flex flex-col rounded-2xl border border-[var(--wood-border)] bg-[var(--wood-panel)] p-4 transition-colors hover:border-[var(--wood-accent)]"
            >
              <button type="button" onClick={() => onEnterRoom(room)} className="flex items-start gap-3 text-left" data-testid={`room-${room.id}`}>
                <span className="hws-rune text-3xl leading-none text-[var(--wood-accent)] opacity-90" aria-hidden="true">{room.rune}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="hws-display block text-2xl font-semibold leading-tight text-[var(--wood-text)]">{room.title}</span>
                    {
                      roomCount(room)?.total > 0 && (
                        <span className="shrink-0 text-right" data-testid={`room-count-${room.id}`}>
                          <span className="block text-2xl font-bold leading-none tabular-nums text-[var(--wood-accent)]">{roomCount(room).total.toLocaleString("en")}</span>
                          <span className="block text-[10px] uppercase tracking-wide text-[var(--wood-muted)]">things</span>
                        </span>
                      )
                    }
                  </span>
                  {/* the explanation opens on hover, like the game's cards (heartwood-reveal.css) */}
                  <span className="hw-reveal-more mt-1 block text-xs leading-snug text-[var(--wood-muted)]">{room.blurb}</span>
                  {
                    roomCount(room)?.parts.length > 1 && (
                      <span className="hw-reveal-more mt-1 block text-[11px] leading-snug text-[var(--wood-text)]" data-testid={`room-breakdown-${room.id}`}>
                        {roomCount(room).parts.slice(0, 6).map(part => `${part.count} ${labelFor(part.type)}`).join(" · ")}
                        {roomCount(room).parts.length > 6 ? ` · +${roomCount(room).parts.length - 6} more lists` : ""}
                      </span>
                    )
                  }
                </span>
              </button>

              <div className="mt-auto pt-3">
                <button type="button" onClick={() => onAction(room, room.actions[0])} className={plaque}>
                  {room.actions[0].label}
                </button>
                {
                  room.actions.length > 1 && (
                    <div className="hw-reveal-more flex flex-wrap gap-1.5 pt-1.5">
                      {
                        room.actions.slice(1).map(action => (
                          <button key={action.label} type="button" onClick={() => onAction(room, action)} className={plaque}>
                            {action.label}
                          </button>
                        ))
                      }
                    </div>
                  )
                }
              </div>
            </article>
          ))
        }
      </div>
    </div>
  )
}

export default StudioHome
