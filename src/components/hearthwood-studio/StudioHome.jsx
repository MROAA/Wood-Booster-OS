import { useState } from "react"

import { STUDIO_ROOMS } from "./studioRooms"
import StudioWishBox from "./StudioWishBox"

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

function StudioHome({ onEnterRoom, onAction, onWish }) {
  const [showPurpose, setShowPurpose] = useState(false)

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
              className="flex flex-col rounded-2xl border border-[var(--wood-border)] bg-[var(--wood-panel)] p-4 transition-colors hover:border-[var(--wood-accent)]"
            >
              <button type="button" onClick={() => onEnterRoom(room)} className="flex items-start gap-3 text-left" data-testid={`room-${room.id}`}>
                <span className="text-3xl leading-none text-[var(--wood-accent)] opacity-80" aria-hidden="true">{room.rune}</span>
                <span>
                  <span className="block text-lg font-semibold text-[var(--wood-text)]">{room.title}</span>
                  <span className="mt-1 block text-xs leading-snug text-[var(--wood-muted)]">{room.blurb}</span>
                </span>
              </button>

              <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
                {
                  room.actions.map(action => (
                    <button
                      key={action.label}
                      type="button"
                      onClick={() => onAction(room, action)}
                      className={plaque}
                    >
                      {action.label}
                    </button>
                  ))
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
