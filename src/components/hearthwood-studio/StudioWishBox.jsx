import { useEffect, useState } from "react"

import { apiGet, apiPost } from "../../api/client"

import { labelFor } from "./entityTypes"
import { roomForType } from "./studioRooms"
import { routeWish, searchWords } from "./wishRouter"

/*
 * Hearthwood HQ - "What do you want to make today?" (wishRouter.js has
 * the why). One box on the HQ home page: Marc writes a wish in his own
 * words and gets ONE honest answer - open it, change it (the AI prepares
 * the change, nothing saved before Apply), use a form, or "the Studio
 * can't do this yet" with what exists today and a button that puts the
 * wish on the development list (HeartwoodTask, category studio-request)
 * that Claude Code works through.
 */
const REQUEST_CATEGORY = "studio-request"
const STATUS_LABELS = { backlog: "Waiting", ready: "Ready", in_progress: "Being built", blocked: "Blocked", review: "In review", testing: "Testing", done: "Done" }

function StudioWishBox({ onGo }) {
  const [text, setText] = useState("")
  const [asking, setAsking] = useState(false)
  const [answer, setAnswer] = useState(null)
  const [asked, setAsked] = useState("")
  const [saved, setSaved] = useState(null)
  const [saveError, setSaveError] = useState("")
  const [requests, setRequests] = useState([])

  async function loadRequests() {
    try {
      const tasks = await apiGet("/heartwood/tasks")
      setRequests((tasks || []).filter(task => task.category === REQUEST_CATEGORY).slice(-5).reverse())
    } catch {
      setRequests([])
    }
  }

  useEffect(() => { loadRequests() }, [])

  async function ask() {
    const wish = text.trim()
    if (!wish) return
    setAsking(true)
    setSaved(null)
    setSaveError("")
    try {
      const lists = await Promise.all(searchWords(wish).map(word =>
        apiGet(`/hearthwood-patchbay/search?q=${encodeURIComponent(word)}`).then(data => data.results || []).catch(() => []),
      ))
      setAnswer(routeWish(wish, lists.flat()))
    } finally {
      setAsked(wish)
      setAsking(false)
    }
  }

  async function addToList() {
    setSaveError("")
    try {
      const task = await apiPost("/heartwood/tasks", {
        title: asked.length > 90 ? `${asked.slice(0, 87)}...` : asked,
        description: `Marc's wish from Hearthwood HQ: "${asked}"\n\nThe Studio said: it can't do ${answer.what} yet. ${answer.today}`,
        category: REQUEST_CATEGORY,
        status: "backlog",
      })
      setSaved(task)
      loadRequests()
    } catch (error) {
      setSaveError(`It couldn't be saved: ${error.message}`)
    }
  }

  const name = entity => entity.name || entity.id
  const where = type => {
    const room = roomForType(type)
    return `${room ? `${room.title} › ` : ""}${labelFor(type)}`
  }

  return (
    <section className="space-y-3 rounded-2xl border border-[var(--wood-border)] bg-[var(--wood-panel)] p-4" data-testid="studio-wish">
      <label htmlFor="studio-wish-text" className="block text-lg font-semibold text-[var(--wood-text)]">What do you want to make or change today?</label>
      <div className="flex flex-wrap gap-2">
        <textarea
          id="studio-wish-text"
          value={text}
          onChange={event => setText(event.target.value)}
          onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); ask() } }}
          rows={2}
          placeholder={'In your own words, e.g. "vaihda Tommyn kuva", "tee uusi tapahtuma", "make the Rotwood Husk tougher"'}
          className="min-w-0 flex-1 resize-y rounded-xl border border-[var(--wood-border)] bg-[var(--wood-bg)] px-3 py-2 text-sm text-[var(--wood-text)] outline-none placeholder:text-[var(--wood-muted)] focus:border-[var(--wood-accent)]"
          data-testid="studio-wish-input"
        />
        <button
          type="button"
          onClick={ask}
          disabled={!text.trim() || asking}
          data-testid="studio-wish-ask"
          className="self-start rounded-full border border-[var(--wood-accent)] bg-[var(--wood-accent)] px-5 py-2 text-sm font-medium text-[#17120c] disabled:opacity-30"
        >
          {asking ? "Looking..." : "Ask"}
        </button>
      </div>

      {
        answer && (
          <div className="space-y-2 rounded-xl border border-[var(--wood-border)] bg-[var(--wood-bg)] p-3 text-sm" data-testid="studio-wish-answer" data-kind={answer.kind}>
            {
              answer.kind === "needsCode" ? (
                <>
                  <div className="font-semibold text-[var(--wood-accent)]">The Studio can't do {answer.what} yet.</div>
                  <p className="text-[var(--wood-text)]">{answer.today}</p>
                  <p className="text-xs text-[var(--wood-muted)]">Put it on the development list and it gets built into the game as a new feature - then it becomes editable here.</p>
                  {
                    saved
                      ? <div className="text-xs text-[var(--wood-accent)]" data-testid="studio-wish-saved">Added to the development list (#{saved.id}).</div>
                      : <button type="button" onClick={addToList} data-testid="studio-wish-add" className="rounded-full border border-[var(--wood-accent)] px-4 py-1 text-xs text-[var(--wood-text)] hover:bg-[var(--wood-card)]">Add to the development list</button>
                  }
                  {saveError && <div className="text-xs text-red-300">{saveError}</div>}
                </>
              ) : answer.kind === "unclear" ? (
                <p className="text-[var(--wood-muted)]">{answer.reason}</p>
              ) : (
                <>
                  <p className="text-[var(--wood-text)]">{answer.why}</p>
                  {answer.entity && <p className="text-xs text-[var(--wood-muted)]">{name(answer.entity)} · {where(answer.entity.type)}</p>}
                  <button
                    type="button"
                    onClick={() => onGo(answer, asked)}
                    data-testid="studio-wish-go"
                    className="rounded-full border border-[var(--wood-accent)] bg-[var(--wood-accent)] px-4 py-1 text-xs font-medium text-[#17120c]"
                  >
                    {answer.kind === "change" ? "Prepare the change" : answer.kind === "add" || answer.kind === "clone" ? "Open the form" : "Open it"}
                  </button>
                </>
              )
            }
          </div>
        )
      }

      {
        requests.length > 0 && (
          <div className="space-y-1" data-testid="studio-wish-requests">
            <div className="text-[11px] uppercase tracking-wide text-[var(--wood-muted)]">Your requests on the development list</div>
            {
              requests.map(task => (
                <div key={task.id} className="flex items-center justify-between gap-2 text-xs text-[var(--wood-text)]">
                  <span className="min-w-0 truncate">#{task.id} {task.title}</span>
                  <span className="shrink-0 rounded-full border border-[var(--wood-border)] px-2 py-0.5 text-[10px] text-[var(--wood-muted)]">{STATUS_LABELS[task.status] || task.status}</span>
                </div>
              ))
            }
          </div>
        )
      }
    </section>
  )
}

export default StudioWishBox
