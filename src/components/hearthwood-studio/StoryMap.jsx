import { useEffect, useState } from "react"

import { apiGet } from "../../api/client"
import { STORY_CHAPTERS } from "../../data/heartwood/campaign"

/*
 * "Read the whole story" - the First Song campaign on ONE page, in story
 * order. Marc, 2026-10-19: "tarina pitää olla helposti työstettävissä
 * minulle" / "sen pitää olla kronologinen tarinaan nähden jotta tiedän
 * missä kohtaa tarinaa olen".
 *
 * Chapter 1 → 7, then the endings. Each chapter shows its story line,
 * the story mission's scene(s) and the chapter events as cards: the title
 * is always visible, the opening line unfolds on hover (the game's pop-up
 * style, heartwood-reveal.css). Clicking a card opens it in the Story
 * Writer. Read-only here - nothing is changed from this page.
 */
const SOURCES = ["storyChapters", "storyBeats", "storyScenes", "chapterEvents", "endings"]

// The first readable sentence of an entry, for the hover preview.
function firstLine(fields = {}) {
  const lines = fields.lines?.items
  if (lines?.length) {
    for (const item of lines) {
      const text = item.fields?.["1"]?.value
      if (text) return item.fields?.["0"]?.value ? `${item.fields["0"].value}: ${text}` : text
    }
  }
  for (const key of ["line", "blurb", "body", "text"]) if (fields[key]?.kind === "string") return fields[key].value
  const epilogue = fields.epilogue?.items
  if (epilogue?.length && epilogue[0].value) return epilogue[0].value
  return ""
}

function Card({ kind, title, preview, note, onOpen, testId }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      data-testid={testId}
      className="hw-reveal w-full rounded-xl border border-[var(--wood-border)] bg-[var(--wood-bg)] p-3 text-left transition-colors hover:border-[var(--wood-accent)] focus:border-[var(--wood-accent)]"
    >
      <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--wood-accent)]">{kind}</div>
      <div className="text-sm font-semibold text-[var(--wood-text)]">{title}</div>
      {note && <div className="text-[11px] text-[var(--wood-muted)]">{note}</div>}
      {preview && <div className="hw-reveal-more mt-1 text-xs italic leading-snug text-[var(--wood-muted)]">“{preview}”</div>}
    </button>
  )
}

function StoryMap({ onOpen }) {
  const [data, setData] = useState(null)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    let cancelled = false
    Promise.all(SOURCES.map(type => apiGet(`/hearthwood-patchbay/entities?type=${type}`).then(result => [type, result.entities || []])))
      .then(pairs => { if (!cancelled) setData(Object.fromEntries(pairs)) })
      .catch(error => { if (!cancelled) setErrorMessage(error.message) })
    return () => { cancelled = true }
  }, [])

  if (errorMessage) return <div className="p-5 text-sm text-red-300">The story couldn't be loaded: {errorMessage}</div>
  if (!data) return <div className="p-5 text-sm text-[var(--wood-muted)]">Loading the story...</div>

  const chapterEntry = n => data.storyChapters.find(e => e.fields?.chapter?.value === n)
  const byId = (list, n) => list.find(e => String(e.id) === String(n))

  return (
    <div className="space-y-4" data-testid="story-map">
      <p className="text-sm text-[var(--wood-muted)]">The whole campaign story in order. Hover a card to read how it opens; click it to rewrite it.</p>

      <ol className="space-y-3">
        {
          STORY_CHAPTERS.map(({ chapter, title }) => {
            const scenes = data.storyScenes.filter(e => e.fields?.chapter?.value === chapter)
            const beats = byId(data.storyBeats, chapter)?.fields?.versions?.items || []
            const events = byId(data.chapterEvents, chapter)?.fields?.versions?.items || []
            const chapterInfo = chapterEntry(chapter)
            return (
              <li key={chapter} className="rounded-2xl border border-[var(--wood-border)] bg-[var(--wood-panel)] p-4" data-chapter-block={chapter}>
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--wood-accent)]">Chapter {chapter}</span>
                  <h3 className="text-lg font-semibold text-[var(--wood-text)]">{title}</h3>
                  {chapterInfo && <button type="button" onClick={() => onOpen("storyChapters", chapterInfo.id)} className="text-[11px] text-[var(--wood-muted)] underline decoration-dotted">edit</button>}
                </div>
                {chapterInfo?.fields?.line?.value && <p className="mt-1 text-sm italic text-[var(--wood-muted)]">{chapterInfo.fields.line.value}</p>}

                <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {
                    beats.length > 0 && (
                      <Card
                        kind={beats.length > 1 ? `Story line · ${beats.length} versions` : "Story line"}
                        title={beats[0].fields?.title?.value || "Story line"}
                        preview={beats[0].fields?.line?.value}
                        note={beats.length > 1 ? "Which one shows depends on earlier choices" : ""}
                        onOpen={() => onOpen("storyBeats", String(chapter))}
                        testId={`map-beat-${chapter}`}
                      />
                    )
                  }
                  {
                    scenes.map(scene => (
                      <Card
                        key={scene.id}
                        kind={scenes.length > 1 ? "Story scene · one of these plays" : "Story scene"}
                        title={scene.name || scene.id}
                        preview={firstLine(scene.fields)}
                        onOpen={() => onOpen("storyScenes", scene.id)}
                        testId={`map-scene-${scene.id}`}
                      />
                    ))
                  }
                  {
                    events.length > 0 && (
                      <Card
                        kind={`Chapter events · ${events.length}`}
                        title={events.map(event => event.fields?.title?.value).filter(Boolean).join(" · ")}
                        preview={firstLine(events[0].fields)}
                        onOpen={() => onOpen("chapterEvents", String(chapter))}
                        testId={`map-events-${chapter}`}
                      />
                    )
                  }
                </div>
              </li>
            )
          })
        }

        <li className="rounded-2xl border border-[var(--wood-accent)] bg-[var(--wood-panel)] p-4" data-chapter-block="endings">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--wood-accent)]">The endings</div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {
              data.endings.map(ending => (
                <Card key={ending.id} kind="Ending" title={ending.name || ending.id} preview={firstLine(ending.fields)} onOpen={() => onOpen("endings", ending.id)} testId={`map-ending-${ending.id}`} />
              ))
            }
          </div>
        </li>
      </ol>
    </div>
  )
}

export default StoryMap
