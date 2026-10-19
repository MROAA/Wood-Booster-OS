import { useEffect, useMemo, useState } from "react"

import { apiGet } from "../../api/client"
import { STORY_CHAPTERS, MAX_CHAPTER } from "../../data/heartwood/campaign"

import { usePatchPreview } from "./usePatchPreview"
import PatchPreviewPanel from "./PatchPreviewPanel"

/*
 * Story Writer - the First Song, as a script you rewrite by hand.
 * Marc, 2026-10-19: "haluan muokata niitä ihmisen muokkaamaksi" / "tee
 * tarinan muokkaamisesta helppo sekä selkeä jotta sitä on mukava
 * käyttää" / "sen pitää olla kronologinen tarinaan nähden jotta tiedän
 * missä kohtaa tarinaa olen".
 *
 * Shows ONLY the words of one entry (scene, ending, myth, rune...):
 * dialogue as speaker + line rows (narration in italics), the player's
 * choices as cards, plain-English labels, boxes that grow with the text.
 * Change any number of lines, then ONE "Preview my changes" -> the normal
 * Patchbay review/apply/undo. A header says where in the story you are
 * (Chapter 3 of 7) and Previous/Next walk the story in order.
 * Paths match ListFieldEditor's: [id, key], [id, list, i, key],
 * [id, "lines", i, "1"] for a [speaker, line] pair, [id, i, key] for a
 * map entry that IS the list (STORY_BEATS' `versions`).
 */
export const STORY_WRITER_TYPES = new Set([
  "storyScenes", "storyBeats", "storyChapters", "endings", "startVariants",
  "tellings", "mythEvidence", "runes", "creatures", "regardBands", "loreTruths", "fates", "factions", "nemeses", "uniqueHeroes",
  "events", "dialogues", "crossroads", "storyJournal", "cinematics", "crownless", "almanac", "moods",
])

// Technical keys - never words the player reads.
const SKIP = new Set([
  "id", "icon", "color", "light", "unlock", "region", "scene", "chapter", "glyph", "force", "kind", "tag", "unit", "defId",
  "flag", "relic", "short", "hero", "telling", "wait", "upTo", "actIndex", "allegiance", "forestState", "image", "npc_id", "type",
])

const LABELS = {
  title: "Title", name: "Name", label: "Button text", say: "What your hero says", result: "What happens", text: "Text",
  line: "Line", lines: "The scene", options: "What the player can choose", choices: "What the player can choose",
  epilogue: "Epilogue", blurb: "Short description", meaning: "Meaning", teller: "Who tells it", rivalName: "Rival name",
  kicker: "Title", body: "Scene text", log: "Log line", stakes: "What's at stake", versions: "Versions (depends on earlier choices)",
  value: "Text", heading: "Heading", npc: "Who speaks", fromAct: "From", intoAct: "Into",
}
const TUPLE_LABELS = {
  lines: ["Who speaks", "What they say"],
  stakes: ["Kind", "What it means"],
}
const labelFor = key => LABELS[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, c => c.toUpperCase())
const shown = field => (field.kind === "null" ? "" : String(field.value ?? ""))
const isText = (key, field) => field.kind === "string" && !SKIP.has(key)

// Every text leaf of one entry, in reading order: { path, key, label, value, group }.
function textLeaves(entityId, fields) {
  const out = []
  const walk = (fieldMap, prefix, inTuple, listName) => {
    for (const [key, field] of Object.entries(fieldMap)) {
      if (field.kind === "list") {
        const root = field.rootList ? prefix : [...prefix, key]
        field.items.forEach((item, index) => {
          if (!item.fields) {
            if (item.kind === "string") out.push({ path: [...root, index], key, label: labelFor(key), value: String(item.value), list: key, index })
            return
          }
          walk(item.fields, [...root, index], item.tuple, key)
        })
        continue
      }
      if (inTuple) {
        if (field.kind === "string" || field.kind === "null") out.push({ path: [...prefix, Number(key)], key, label: TUPLE_LABELS[listName]?.[Number(key)] || `Part ${Number(key) + 1}`, value: shown(field), tuple: listName, slot: Number(key) })
        continue
      }
      if (isText(key, field)) out.push({ path: [...prefix, key], key, label: labelFor(key), value: shown(field) })
    }
  }
  walk(fields || {}, [entityId], false, "")
  return out
}

const pathKey = path => path.join("\u0001")

function GrowingText({ value, onChange, changed, italic, placeholder, testId }) {
  return (
    <textarea
      value={value}
      onChange={event => onChange(event.target.value)}
      placeholder={placeholder}
      data-testid={testId}
      rows={Math.max(1, Math.ceil(value.length / 80))}
      className={`
        w-full resize-y rounded-lg border bg-[var(--wood-bg)] px-3 py-2 text-sm leading-relaxed text-[var(--wood-text)] outline-none
        focus:border-[var(--wood-accent)] ${italic ? "italic text-[var(--wood-muted)]" : ""}
        ${changed ? "border-[var(--wood-accent)]" : "border-[var(--wood-border)]"}
      `}
    />
  )
}

function StoryWriter({ type, entityId, entityDetail, onSelect, onApplied, onPreviewUrlChange }) {
  const leaves = useMemo(() => textLeaves(entityId, entityDetail?.fields), [entityId, entityDetail])
  const [draft, setDraft] = useState({})
  const [order, setOrder] = useState([])
  const { result, applyMode, setApplyMode, previewing, applying, errorMessage, preview, discard, apply } =
    usePatchPreview({ onApplied, onPreviewUrlChange })

  useEffect(() => { setDraft({}) }, [type, entityId, entityDetail])

  // The list in file order = story order for every story file.
  useEffect(() => {
    let cancelled = false
    apiGet(`/hearthwood-patchbay/entities?type=${type}`)
      .then(data => { if (!cancelled) setOrder((data.entities || []).map(e => ({ id: String(e.id), name: e.name, chapter: chapterOf(type, e) }))) })
      .catch(() => { if (!cancelled) setOrder([]) })
    return () => { cancelled = true }
  }, [type])

  const valueOf = leaf => draft[pathKey(leaf.path)] ?? leaf.value
  const setLeaf = (leaf, value) => setDraft(previous => ({ ...previous, [pathKey(leaf.path)]: value }))
  const changedLeaves = leaves.filter(leaf => draft[pathKey(leaf.path)] !== undefined && draft[pathKey(leaf.path)] !== leaf.value)
  const changed = leaf => changedLeaves.includes(leaf)

  async function handlePreview() {
    if (!changedLeaves.length) return
    await preview({ type, entityId, edits: changedLeaves.map(leaf => ({ path: leaf.path, op: "set", value: valueOf(leaf) })) })
  }

  // Where am I in the story?
  const position = order.findIndex(entry => entry.id === String(entityId))
  const here = order[position]
  const chapter = here?.chapter || chapterOf(type, entityDetail)
  const chapterInfo = STORY_CHAPTERS.find(c => c.chapter === chapter)
  const sameChapter = chapter ? order.filter(entry => entry.chapter === chapter) : []
  const prev = position > 0 ? order[position - 1] : null
  const next = position >= 0 && position < order.length - 1 ? order[position + 1] : null

  // Group the leaves: plain fields first, then each list as its own block.
  const plain = leaves.filter(leaf => !leaf.tuple && leaf.path.length === 2)
  const dialogue = leaves.filter(leaf => leaf.tuple === "lines")
  const dialogueRows = []
  for (const leaf of dialogue) {
    const row = leaf.path.slice(0, -1).join("/")
    let entry = dialogueRows.find(r => r.row === row)
    if (!entry) dialogueRows.push(entry = { row, speaker: null, text: null })
    if (leaf.slot === 0) entry.speaker = leaf
    else entry.text = leaf
  }
  const rest = leaves.filter(leaf => !plain.includes(leaf) && leaf.tuple !== "lines")
  const restGroups = []
  for (const leaf of rest) {
    // [id, list, i, ...] - or [id, i, ...] when the entry IS the list.
    const rootList = typeof leaf.path[1] === "number"
    const list = rootList ? "versions" : String(leaf.path[1])
    const index = rootList ? leaf.path[1] : leaf.path[2]
    const groupKey = `${list}/${index}`
    let group = restGroups.find(g => g.key === groupKey)
    if (!group) restGroups.push(group = { key: groupKey, list, index, leaves: [] })
    group.leaves.push(leaf)
  }

  if (!leaves.length) {
    return <div className="text-sm text-[var(--wood-muted)]">This entry has no text to write - its other settings are under "All fields" below.</div>
  }

  return (
    <div className="space-y-4" data-testid="story-writer">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--wood-border)] bg-[var(--wood-bg)] px-3 py-2">
        <div className="text-xs text-[var(--wood-muted)]" data-testid="story-writer-where">
          {chapter ? <>Chapter <span className="font-semibold text-[var(--wood-text)]">{chapter} of {MAX_CHAPTER}</span>{chapterInfo ? ` — ${chapterInfo.title}` : ""}</> : <>Entry <span className="font-semibold text-[var(--wood-text)]">{position + 1} of {order.length}</span></>}
          {sameChapter.length > 1 && <span> · one of {sameChapter.length} versions of this chapter (which one plays depends on earlier choices)</span>}
        </div>
        <div className="flex gap-2">
          <button type="button" disabled={!prev} onClick={() => prev && onSelect(type, prev.id)} data-testid="story-writer-prev" className="rounded-full border border-[var(--wood-border)] px-3 py-1 text-xs text-[var(--wood-text)] hover:border-[var(--wood-accent)] disabled:opacity-30">◀ Previous</button>
          <button type="button" disabled={!next} onClick={() => next && onSelect(type, next.id)} data-testid="story-writer-next" className="rounded-full border border-[var(--wood-border)] px-3 py-1 text-xs text-[var(--wood-text)] hover:border-[var(--wood-accent)] disabled:opacity-30">Next ▶</button>
        </div>
      </div>

      {
        plain.map(leaf => (
          <label key={pathKey(leaf.path)} className="block space-y-1">
            <div className="text-[11px] text-[var(--wood-muted)]">{leaf.label}{changed(leaf) && <span className="ml-1 text-[var(--wood-accent)]">● changed</span>}</div>
            <GrowingText value={valueOf(leaf)} onChange={value => setLeaf(leaf, value)} changed={changed(leaf)} />
          </label>
        ))
      }

      {
        dialogueRows.length > 0 && (
          <section className="space-y-2" data-testid="story-writer-dialogue">
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--wood-muted)]">The scene</div>
            {
              dialogueRows.map(row => {
                const narrator = !valueOf(row.speaker).trim()
                return (
                  <div key={row.row} className="grid grid-cols-[150px_1fr] items-start gap-2">
                    <input
                      value={valueOf(row.speaker)}
                      onChange={event => setLeaf(row.speaker, event.target.value)}
                      placeholder="Narrator"
                      title="Who speaks - leave empty for the narrator"
                      className={`h-9 rounded-lg border bg-[var(--wood-bg)] px-2 text-xs font-semibold text-[var(--wood-accent)] outline-none placeholder:font-normal placeholder:italic placeholder:text-[var(--wood-muted)] focus:border-[var(--wood-accent)] ${changed(row.speaker) ? "border-[var(--wood-accent)]" : "border-[var(--wood-border)]"}`}
                    />
                    {row.text && <GrowingText value={valueOf(row.text)} onChange={value => setLeaf(row.text, value)} changed={changed(row.text)} italic={narrator} testId="story-writer-line" />}
                  </div>
                )
              })
            }
          </section>
        )
      }

      {
        restGroups.map(group => (
          <section key={group.key} className="space-y-2 rounded-xl border border-[var(--wood-border)] bg-[var(--wood-bg)] p-3">
            {group.list && <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--wood-muted)]">{labelFor(group.list)}{Number.isInteger(group.index) ? ` · ${group.index + 1}` : ""}</div>}
            {
              group.leaves.map(leaf => (
                <label key={pathKey(leaf.path)} className="block space-y-1">
                  <div className="text-[11px] text-[var(--wood-muted)]">{leaf.label}{changed(leaf) && <span className="ml-1 text-[var(--wood-accent)]">● changed</span>}</div>
                  <GrowingText value={valueOf(leaf)} onChange={value => setLeaf(leaf, value)} changed={changed(leaf)} />
                </label>
              ))
            }
          </section>
        ))
      }

      <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-[var(--wood-border)] bg-[var(--wood-panel)] py-2">
        {changedLeaves.length > 0 && <span className="text-xs text-[var(--wood-accent)]">{changedLeaves.length} changed</span>}
        {changedLeaves.length > 0 && <button type="button" onClick={() => setDraft({})} className="text-xs text-[var(--wood-muted)] hover:text-[var(--wood-text)]">Start over</button>}
        <button
          type="button"
          disabled={!changedLeaves.length || previewing}
          onClick={handlePreview}
          data-testid="story-writer-preview"
          className="rounded-full border border-[var(--wood-accent)] bg-[var(--wood-accent)] px-4 py-1.5 text-sm font-medium text-[#17120c] disabled:cursor-not-allowed disabled:opacity-30"
        >
          {previewing ? "Preparing..." : "Preview my changes"}
        </button>
      </div>

      {errorMessage && <div className="text-xs text-red-300">{errorMessage}</div>}

      <PatchPreviewPanel result={result} applyMode={applyMode} onApplyModeChange={setApplyMode} onDiscard={discard} onApply={apply} applying={applying} />
    </div>
  )
}

// The campaign chapter an entry belongs to, when it has one.
export function chapterOf(type, entity) {
  const fields = entity?.fields || {}
  if (fields.chapter?.kind === "number") return fields.chapter.value
  if ((type === "storyBeats") && /^\d+$/.test(String(entity?.id))) return Number(entity.id)
  return null
}

export default StoryWriter
