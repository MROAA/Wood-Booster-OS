import { useState } from "react"

import { apiGet } from "../../api/client"

import { usePatchPreview } from "./usePatchPreview"
import PatchPreviewPanel from "./PatchPreviewPanel"

/*
 * Marc: "haluan myös pystyä lisäämään tarinaa tarkkoihin kohtiin story
 * journalin kautta" (want to be able to add story at specific points
 * through the Story Journal too) - CloneEntityForm's "clone as new"
 * always appends at the end of the map (addKey), which would silently
 * undo the chronological Act ordering PRs #516/#517 just built. This
 * form instead asks WHICH Act the new line belongs to, and uses the
 * new insertAfterKey op (hearthwood-apply-edit.mjs) to drop it right
 * after the last existing entry of that same Act - "Any point" falls
 * back to addKey (append at end), matching how an Act-less flag like
 * cut_the_toll_root already sits last by convention.
 */
const ACTS = [1, 2, 3, 4, 5, 6, 7]

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

function insertionPointFor(entities, targetAct) {
  // entities arrive in the file's own order, which is already Act 1->7
  // ascending (the chronological reorder) - the last entity whose own
  // Act is <= targetAct is exactly where a new same-Act (or slightly
  // later, if the target Act has no entries yet) line belongs.
  let afterKey = null

  for (const entity of entities) {
    const act = entity.fields?.act?.value

    if (typeof act === "number" && act <= targetAct) {
      afterKey = entity.id
    }
  }

  return afterKey
}

function AddStoryEntryForm({ type, onApplied, onPreviewUrlChange }) {
  const [open, setOpen] = useState(false)
  const [newId, setNewId] = useState("")
  const [act, setAct] = useState("1")
  const [text, setText] = useState("")
  const [checkError, setCheckError] = useState("")
  const [checking, setChecking] = useState(false)

  const {
    result,
    applyMode,
    setApplyMode,
    previewing,
    applying,
    errorMessage,
    preview,
    discard,
    apply,
  } = usePatchPreview({ onApplied, onPreviewUrlChange })

  function startOpen() {
    setOpen(true)
    setNewId("")
    setAct("1")
    setText("")
    setCheckError("")
  }

  async function handlePreview() {
    const candidateId = slugify(newId)

    if (!candidateId) {
      setCheckError("Enter an id for the new flag.")
      return
    }

    if (!text.trim()) {
      setCheckError("Enter the story text.")
      return
    }

    setChecking(true)
    setCheckError("")

    try {
      await apiGet(`/hearthwood-patchbay/entity/${type}/${candidateId}`)
      setCheckError(`Id "${candidateId}" is already in use - pick another.`)
      return
    } catch {
      // 404 == free, continue
    } finally {
      setChecking(false)
    }

    const targetAct = act === "any" ? null : Number(act)
    const escapedText = JSON.stringify(text.trim())

    const block = targetAct == null
      ? `  ${candidateId}: { text: ${escapedText} }`
      : `  ${candidateId}: { act: ${targetAct}, text: ${escapedText} }`

    const edit = targetAct == null
      ? { path: [candidateId], op: "addKey", key: candidateId, block }
      : {
        path: [candidateId],
        op: "insertAfterKey",
        afterKey: insertionPointFor((await apiGet(`/hearthwood-patchbay/entities?type=${type}`)).entities, targetAct),
        key: candidateId,
        block,
      }

    await preview({ type, entityId: candidateId, edits: [edit] })
  }

  async function handleApply() {
    await apply()
    setOpen(false)
    setNewId("")
    setText("")
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={startOpen}
        className="
          rounded-full border border-[var(--wood-border)] px-3 py-1 text-xs
          text-[var(--wood-muted)] hover:border-[var(--wood-accent)] hover:text-[var(--wood-text)]
        "
      >
        + Add new story entry
      </button>
    )
  }

  return (
    <div className="space-y-2 rounded-xl border border-[var(--wood-border)] bg-[var(--wood-bg)] p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-[var(--wood-muted)]">
        New Story Journal entry
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1">
          <div className="text-[10px] text-[var(--wood-muted)]">flag id</div>
          <input
            value={newId}
            onChange={event => setNewId(event.target.value)}
            placeholder="e.g. found_the_map"
            className="h-8 w-full rounded-lg border border-[var(--wood-border)] bg-[var(--wood-panel)] px-2 text-xs text-[var(--wood-text)] outline-none placeholder:text-[var(--wood-muted)] focus:border-[var(--wood-accent)]"
          />
        </label>

        <label className="space-y-1">
          <div className="text-[10px] text-[var(--wood-muted)]">where in the story</div>
          <select
            value={act}
            onChange={event => setAct(event.target.value)}
            className="h-8 w-full rounded-lg border border-[var(--wood-border)] bg-[var(--wood-panel)] px-2 text-xs text-[var(--wood-text)] outline-none focus:border-[var(--wood-accent)]"
          >
            {ACTS.map(n => <option key={n} value={n}>{`Act ${n}`}</option>)}
            <option value="any">Any point (no specific Act)</option>
          </select>
        </label>
      </div>

      <label className="block space-y-1">
        <div className="text-[10px] text-[var(--wood-muted)]">story text</div>
        <textarea
          value={text}
          onChange={event => setText(event.target.value)}
          rows={3}
          placeholder="What does the journal say happened?"
          className="
            wood-scroll w-full resize-none rounded-lg border border-[var(--wood-border)]
            bg-[var(--wood-panel)] p-2 text-xs text-[var(--wood-text)] outline-none
            placeholder:text-[var(--wood-muted)] focus:border-[var(--wood-accent)]
          "
        />
      </label>

      {checkError && <div className="text-xs text-red-300">{checkError}</div>}
      {errorMessage && <div className="text-xs text-red-300">{errorMessage}</div>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={applying}
          className="rounded-full border border-[var(--wood-border)] px-3 py-1 text-xs text-[var(--wood-muted)] hover:text-[var(--wood-text)] disabled:opacity-30"
        >
          Cancel
        </button>

        <button
          type="button"
          disabled={checking || previewing || !newId.trim() || !text.trim()}
          onClick={handlePreview}
          className="
            rounded-full border border-[var(--wood-accent)] bg-[var(--wood-accent)]
            px-3 py-1 text-xs font-medium text-[#17120c] transition-opacity
            disabled:cursor-not-allowed disabled:opacity-30
          "
        >
          {checking ? "Checking..." : previewing ? "Previewing..." : "Preview new entry"}
        </button>
      </div>

      <PatchPreviewPanel
        result={result}
        applyMode={applyMode}
        onApplyModeChange={setApplyMode}
        onDiscard={discard}
        onApply={handleApply}
        applying={applying}
      />
    </div>
  )
}

export default AddStoryEntryForm
