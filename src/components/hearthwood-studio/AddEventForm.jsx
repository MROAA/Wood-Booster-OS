import { useState } from "react"

import { apiGet } from "../../api/client"

import { usePatchPreview } from "./usePatchPreview"
import PatchPreviewPanel from "./PatchPreviewPanel"
import { actLabel } from "./actNames"
import { insertionPointFor } from "./chronologicalInsert"

/*
 * Marc, 2026-09-20: "aijon itse kirjoittaa pelin tarinaa" / "eniten
 * minua kiinnostaa tarinan muokkaaminen ja tekstisisällön tuottaminen"
 * (I intend to write the game's story myself - what interests me most
 * is editing the story and producing text content). Map Events
 * (events.js) are the game's main branching-scene narrative unit -
 * title + a vignette + 2-3 choices - and "Clone as new" (CloneEntityForm)
 * meant starting from an existing scene's full text and rewriting it,
 * not writing a new one from a blank page. This form is that blank
 * page: title/body/choices only (no `effects` - a choice's own
 * consequences are more technical than the writing itself and are
 * already editable via the normal field editor once the event exists).
 *
 * events.js is a plain ARRAY (not a keyed map like storyLog.js), so
 * this needed hearthwood-apply-edit.mjs's `insertAfterKey` op extended
 * to support array roots (matching an element by its own `id` field
 * instead of a map key) - without that, a new event would always land
 * at the very END of the file regardless of its Act, undoing the
 * chronological ordering Marc relies on to navigate events.js.
 */
const ACTS = [1, 2, 3, 4, 5, 6, 7]

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function jsString(text) {
  return JSON.stringify(text)
}

function emptyChoice() {
  return { label: "", result: "" }
}

function AddEventForm({ type, onApplied, onPreviewUrlChange }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [act, setAct] = useState("1")
  const [body, setBody] = useState("")
  const [choices, setChoices] = useState([emptyChoice(), emptyChoice()])
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
    setTitle("")
    setAct("1")
    setBody("")
    setChoices([emptyChoice(), emptyChoice()])
    setCheckError("")
  }

  function updateChoice(index, field, value) {
    setChoices(previous => previous.map((choice, i) => (i === index ? { ...choice, [field]: value } : choice)))
  }

  function addChoice() {
    setChoices(previous => [...previous, emptyChoice()])
  }

  function removeChoice(index) {
    setChoices(previous => previous.filter((_, i) => i !== index))
  }

  async function handlePreview() {
    const candidateId = slugify(title)
    const realChoices = choices.filter(choice => choice.label.trim() && choice.result.trim())

    if (!candidateId) {
      setCheckError("Enter a title.")
      return
    }

    if (!body.trim()) {
      setCheckError("Enter the scene's text.")
      return
    }

    if (realChoices.length < 1) {
      setCheckError("Enter at least one choice (a label and what happens).")
      return
    }

    setChecking(true)
    setCheckError("")

    try {
      await apiGet(`/hearthwood-patchbay/entity/${type}/${candidateId}`)
      setCheckError(`An event with id "${candidateId}" already exists - use a different title.`)
      return
    } catch {
      // 404 == free, continue
    } finally {
      setChecking(false)
    }

    const targetAct = act === "any" ? null : Number(act)

    const choicesText = realChoices
      .map(choice => `      { label: ${jsString(choice.label.trim())}, result: ${jsString(choice.result.trim())}, effects: [] },`)
      .join("\n")

    const fields = [
      `    id: ${jsString(candidateId)},`,
      targetAct != null ? `    act: ${targetAct},` : null,
      `    title: ${jsString(title.trim())},`,
      `    body: ${jsString(body.trim())},`,
      "    choices: [",
      choicesText,
      "    ],",
    ].filter(Boolean).join("\n")

    const block = `  {\n${fields}\n  }`

    const edit = targetAct == null
      ? { path: ["EVENTS"], op: "addKey", key: candidateId, block }
      : {
        path: ["EVENTS"],
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
        + Write a new event
      </button>
    )
  }

  return (
    <div className="space-y-2 rounded-xl border border-[var(--wood-border)] bg-[var(--wood-bg)] p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-[var(--wood-muted)]">
        New Map Event
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1">
          <div className="text-[10px] text-[var(--wood-muted)]">title</div>
          <input
            value={title}
            onChange={event => setTitle(event.target.value)}
            placeholder="e.g. The Sleeping Root"
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
            {ACTS.map(n => <option key={n} value={n}>{actLabel(n)}</option>)}
            <option value="any">Any point (no specific Act)</option>
          </select>
        </label>
      </div>

      <label className="block space-y-1">
        <div className="text-[10px] text-[var(--wood-muted)]">the scene - what the player sees</div>
        <textarea
          value={body}
          onChange={event => setBody(event.target.value)}
          rows={3}
          placeholder="Describe what's happening..."
          className="
            wood-scroll w-full resize-none rounded-lg border border-[var(--wood-border)]
            bg-[var(--wood-panel)] p-2 text-xs text-[var(--wood-text)] outline-none
            placeholder:text-[var(--wood-muted)] focus:border-[var(--wood-accent)]
          "
        />
      </label>

      <div className="space-y-2">
        <div className="text-[10px] text-[var(--wood-muted)]">choices - what the player can do</div>

        {
          choices.map((choice, index) => (
            <div key={index} className="space-y-1 rounded-lg border border-[var(--wood-border)] p-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[var(--wood-muted)]">Choice {index + 1}</span>

                {
                  choices.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeChoice(index)}
                      className="text-[10px] text-[var(--wood-muted)] hover:text-red-300"
                    >
                      Remove
                    </button>
                  )
                }
              </div>

              <input
                value={choice.label}
                onChange={event => updateChoice(index, "label", event.target.value)}
                placeholder="What the player can choose, e.g. 'Wake it gently.'"
                className="h-8 w-full rounded-lg border border-[var(--wood-border)] bg-[var(--wood-panel)] px-2 text-xs text-[var(--wood-text)] outline-none placeholder:text-[var(--wood-muted)] focus:border-[var(--wood-accent)]"
              />

              <textarea
                value={choice.result}
                onChange={event => updateChoice(index, "result", event.target.value)}
                rows={2}
                placeholder="What happens as a result..."
                className="
                  wood-scroll w-full resize-none rounded-lg border border-[var(--wood-border)]
                  bg-[var(--wood-panel)] p-2 text-xs text-[var(--wood-text)] outline-none
                  placeholder:text-[var(--wood-muted)] focus:border-[var(--wood-accent)]
                "
              />
            </div>
          ))
        }

        <button
          type="button"
          onClick={addChoice}
          className="text-xs text-[var(--wood-muted)] underline decoration-dotted hover:text-[var(--wood-text)]"
        >
          + Add another choice
        </button>
      </div>

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
          disabled={checking || previewing}
          onClick={handlePreview}
          className="
            rounded-full border border-[var(--wood-accent)] bg-[var(--wood-accent)]
            px-3 py-1 text-xs font-medium text-[#17120c] transition-opacity
            disabled:cursor-not-allowed disabled:opacity-30
          "
        >
          {checking ? "Checking..." : previewing ? "Previewing..." : "Preview new event"}
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

export default AddEventForm
