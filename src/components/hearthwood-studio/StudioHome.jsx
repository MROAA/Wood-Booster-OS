import { useEffect, useState } from "react"

import { apiGet } from "../../api/client"
import { labelFor } from "./entityTypes"
import { STUDIO_ROOMS } from "./studioRooms"
import StudioWishBox from "./StudioWishBox"
import RecentlyEdited from "./RecentlyEdited"
import { ProjectOverview, SpacemonkeySuggestions } from "./ProjectOverview"
import { useProjectSources } from "./useProjectSources"
import { TOOL_VIEWS } from "./workspaceTabs"
import { STUDIO_TOOLS, toolLabel } from "./studioTools"
import { roomTitle, t } from "./studioText"

// Studio Home - the pinned first tab (Sprint 4, PRD §5): where development
// stands, what was done last, where to continue, whether something is
// broken, and what to do next. Every number comes from a real source.
// Spacemonkey itself lives in the permanent right-hand panel.

const PURPOSE_SHORT = "Täällä luot ja muokkaat Hearthwoodia itse – tekoälyn avulla ja rehellisin rajoin: jos jotain ei vielä voi tehdä, Studio kertoo sen heti."

const PURPOSE_FULL = [
  "With the Dev Studio I create, edit and build the game's content myself, the way I want it.",
  "It is clear and easy to use, and it works with AI assistance. If something I want to add can't be done, the limits are told to me right away.",
  "The Studio is the game's engine and the headquarters of its development: it uses the themes, styles and everything else the game already has, and it defines the game's style and content.",
  "It is a growing piece of the game - the way I shape Hearthwood myself.",
]

const plaque = "rounded-full border border-[var(--wood-border)] px-3 py-1 text-xs text-[var(--wood-text)] transition-colors hover:border-[var(--wood-accent)] hover:bg-[var(--wood-card)]"
const SECTION = "hws-section-title"

function StudioHome({ onEnterRoom, onAction, onWish, onOpenEntity, onOpenView, onContinue, lastEditor }) {
  const [showPurpose, setShowPurpose] = useState(false)
  // undefined = still reading, null = could not be read
  const [overview, setOverview] = useState(undefined)
  const sources = useProjectSources()

  useEffect(() => {
    let cancelled = false
    apiGet("/hearthwood-patchbay/overview")
      .then(data => { if (!cancelled) setOverview(data) })
      .catch(() => { if (!cancelled) setOverview(null) })
    return () => { cancelled = true }
  }, [])

  const counts = Object.fromEntries((overview?.types || []).map(entry => [entry.type, entry.count]))
  const roomCount = room => {
    if (!overview) return null
    const parts = room.types
      .filter(type => counts[type] > 0)
      .map(type => ({ type, count: counts[type] }))
      .sort((a, b) => b.count - a.count)
    return { total: parts.reduce((sum, part) => sum + part.count, 0), parts }
  }

  return (
    <div className="hws-home" data-testid="studio-home">
      <div className="max-w-3xl text-sm text-[var(--wood-text)]" data-testid="studio-purpose">
        {PURPOSE_SHORT}{" "}
        <button type="button" onClick={() => setShowPurpose(open => !open)} className="text-xs text-[var(--wood-accent)] underline decoration-dotted">
          {showPurpose ? "Vähemmän" : "Lue lisää"}
        </button>
        {showPurpose && (
          <div className="mt-2 space-y-1 border-l border-[var(--wood-accent)] pl-3 text-xs italic leading-relaxed text-[var(--wood-muted)]">
            {PURPOSE_FULL.map(line => <p key={line}>{line}</p>)}
          </div>
        )}
      </div>

      <div className="hws-home-columns">
        <section className="hws-home-section" aria-labelledby="hws-continue">
          <h2 id="hws-continue" className={SECTION}><span aria-hidden="true">ᚷ</span> {t("continueTitle")}</h2>
          {lastEditor ? (
            <button type="button" className="hws-continue" onClick={() => onContinue(lastEditor)} data-testid="continue-last-editor">
              <span className="hws-continue-kicker">{t("continueKicker")}</span>
              <span className="hws-display hws-continue-title">{lastEditor.title}</span>
              <span className="hws-continue-meta">{TOOL_VIEWS[lastEditor.location?.view] || TOOL_VIEWS.single} · {t("continueOpen")}</span>
            </button>
          ) : (
            <p className="mb-3 text-sm text-[var(--wood-muted)]" data-testid="continue-none">{t("continueNone")}</p>
          )}
          <RecentlyEdited onOpen={onOpenEntity} />
        </section>

        <section className="hws-home-section" aria-labelledby="hws-overview">
          <h2 id="hws-overview" className={SECTION}><span aria-hidden="true">ᛟ</span> {t("overviewTitle")}</h2>
          <ProjectOverview overview={overview} sources={sources} onOpenView={onOpenView} />
        </section>
      </div>

      <section className="hws-home-section" aria-labelledby="hws-suggest">
        <h2 id="hws-suggest" className={SECTION}><span aria-hidden="true">ᛋ</span> {t("suggestionsTitle")}</h2>
        <SpacemonkeySuggestions sources={sources} onOpenView={onOpenView} />
      </section>

      <section className="hws-home-section" aria-labelledby="hws-workspaces">
        <h2 id="hws-workspaces" className={SECTION}><span aria-hidden="true">ᚹ</span> {t("workspacesTitle")}</h2>
        <div className="mb-3">
          <StudioWishBox onGo={onWish} />
        </div>
        <ol className="mb-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-[var(--wood-muted)]">
          <li><span className="text-[var(--wood-accent)]">1.</span> {t("step1")}</li>
          <li><span className="text-[var(--wood-accent)]">2.</span> {t("step2")}</li>
          <li><span className="text-[var(--wood-accent)]">3.</span> {t("step3")} <span className="text-[var(--wood-text)]">{t("undoLink")}</span></li>
        </ol>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
          {STUDIO_ROOMS.map(room => (
            <article
              key={room.id}
              data-room={room.id}
              tabIndex={-1}
              className="hws-card hw-reveal flex flex-col rounded-xl border border-[var(--wood-border)] bg-[var(--wood-bg)] p-4 transition-colors hover:border-[var(--wood-accent)]"
            >
              <button type="button" onClick={() => onEnterRoom(room)} className="flex items-start gap-3 text-left" data-testid={`room-${room.id}`}>
                <span className="hws-rune text-3xl leading-none text-[var(--wood-accent)] opacity-90" aria-hidden="true">{room.rune}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="hws-display block text-2xl font-semibold leading-tight text-[var(--wood-text)]">{roomTitle(room)}</span>
                    {roomCount(room)?.total > 0 && (
                      <span className="shrink-0 text-right" data-testid={`room-count-${room.id}`}>
                        <span className="block text-2xl font-bold leading-none tabular-nums text-[var(--wood-accent)]">{roomCount(room).total.toLocaleString("fi")}</span>
                        <span className="block text-[10px] uppercase tracking-wide text-[var(--wood-muted)]">kohdetta</span>
                      </span>
                    )}
                  </span>
                  <span className="hw-reveal-more mt-1 block text-xs leading-snug text-[var(--wood-muted)]">{room.blurb}</span>
                  {roomCount(room)?.parts.length > 1 && (
                    <span className="hw-reveal-more mt-1 block text-[11px] leading-snug text-[var(--wood-text)]" data-testid={`room-breakdown-${room.id}`}>
                      {roomCount(room).parts.slice(0, 6).map(part => `${part.count} ${labelFor(part.type)}`).join(" · ")}
                      {roomCount(room).parts.length > 6 ? ` · +${roomCount(room).parts.length - 6} listaa lisää` : ""}
                    </span>
                  )}
                </span>
              </button>

              <div className="mt-auto pt-3">
                <button type="button" onClick={() => onAction(room, room.actions[0])} className={plaque}>{room.actions[0].label}</button>
                {room.actions.length > 1 && (
                  <div className="hw-reveal-more flex flex-wrap gap-1.5 pt-1.5">
                    {room.actions.slice(1).map(action => (
                      <button key={action.label} type="button" onClick={() => onAction(room, action)} className={plaque}>{action.label}</button>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>

        <div className="hws-tools" data-testid="studio-tools">
          {STUDIO_TOOLS.map(tool => (
            <button
              key={tool.id}
              type="button"
              className="hws-tool"
              data-testid={`tool-${tool.id}`}
              onClick={() => (tool.href ? window.open(tool.href, "_blank", "noopener") : onOpenView(tool.view))}
            >
              <span className="hws-rune hws-tool-rune" aria-hidden="true">{tool.rune}</span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-[var(--wood-text)]">{toolLabel(tool)}{tool.href ? " ↗" : ""}</span>
                <span className="block text-xs text-[var(--wood-muted)]">{tool.blurb}</span>
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

export default StudioHome
