import { useState } from "react"

import { apiGet } from "../../api/client"

import { usePatchPreview } from "./usePatchPreview"
import PatchPreviewPanel from "./PatchPreviewPanel"

/*
 * Marc's top priority this whole round: "aijon itse kirjoittaa pelin
 * tarinaa" (I intend to write the game's story myself). Dialogues
 * (dialogues.js, PR #528) could only be added via "Clone as new" -
 * pick the one existing conversation and rewrite it, same gap
 * AddEventForm.jsx closed for Map Events. This is the blank page for a
 * new NPC conversation: who's speaking, their opening line, and a
 * repeatable list of top-level questions the player can ask (with the
 * NPC's answer to each). Deliberately stops there - deeper follow-up
 * questions (dialogues.js's own `followUps`, nested one level further)
 * are a more advanced, tree-shaped edit that's already possible
 * afterward via the normal ListFieldEditor, same "keep the compose
 * form to plain writing, technical depth comes later" split
 * AddEventForm.jsx made for a choice's own `effects`.
 *
 * DIALOGUES is a flat object map (no Act/chronological position of its
 * own - a dialogue's place in the story comes from whichever event's
 * `dialogueId` triggers it), so this is a plain `addKey`, same as
 * CloneEntityForm's own mechanism for this type.
 */
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

function emptyExchange() {
  return { question: "", answer: "" }
}

function AddDialogueForm({ type, onApplied, onPreviewUrlChange }) {
  const [open, setOpen] = useState(false)
  const [npc, setNpc] = useState("")
  const [greeting, setGreeting] = useState("")
  const [exchanges, setExchanges] = useState([emptyExchange(), emptyExchange()])
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
    setNpc("")
    setGreeting("")
    setExchanges([emptyExchange(), emptyExchange()])
    setCheckError("")
  }

  function updateExchange(index, field, value) {
    setExchanges(previous => previous.map((exchange, i) => (i === index ? { ...exchange, [field]: value } : exchange)))
  }

  function addExchange() {
    setExchanges(previous => [...previous, emptyExchange()])
  }

  function removeExchange(index) {
    setExchanges(previous => previous.filter((_, i) => i !== index))
  }

  async function handlePreview() {
    const candidateId = slugify(npc)
    const realExchanges = exchanges.filter(exchange => exchange.question.trim() && exchange.answer.trim())

    if (!candidateId) {
      setCheckError("Enter the NPC's name.")
      return
    }

    if (!greeting.trim()) {
      setCheckError("Enter the NPC's opening line.")
      return
    }

    if (realExchanges.length < 1) {
      setCheckError("Enter at least one question (and its answer).")
      return
    }

    setChecking(true)
    setCheckError("")

    try {
      await apiGet(`/hearthwood-patchbay/entity/${type}/${candidateId}`)
      setCheckError(`A dialogue with id "${candidateId}" already exists - use a different NPC name.`)
      return
    } catch {
      // 404 == free, continue
    } finally {
      setChecking(false)
    }

    const seenIds = new Set()

    const exchangesText = realExchanges
      .map(exchange => {
        let id = slugify(exchange.question) || "question"
        while (seenIds.has(id)) {
          id = `${id}-2`
        }
        seenIds.add(id)

        return [
          "      {",
          `        id: ${jsString(id)},`,
          `        question: ${jsString(exchange.question.trim())},`,
          `        answer: ${jsString(exchange.answer.trim())},`,
          "        effects: [],",
          "        followUps: [],",
          "      },",
        ].join("\n")
      })
      .join("\n")

    const block = [
      `  ${jsString(candidateId)}: {`,
      `    npc: ${jsString(npc.trim())},`,
      `    greeting: ${jsString(greeting.trim())},`,
      "    exchanges: [",
      exchangesText,
      "    ],",
      "  }",
    ].join("\n")

    await preview({
      type,
      entityId: candidateId,
      edits: [{ path: ["DIALOGUES"], op: "addKey", key: candidateId, block }],
    })
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
        + Write a new dialogue
      </button>
    )
  }

  return (
    <div className="space-y-2 rounded-xl border border-[var(--wood-border)] bg-[var(--wood-bg)] p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-[var(--wood-muted)]">
        New Dialogue
      </div>

      <label className="block space-y-1">
        <div className="text-[10px] text-[var(--wood-muted)]">NPC name</div>
        <input
          value={npc}
          onChange={event => setNpc(event.target.value)}
          placeholder="e.g. The Mosswarden"
          className="h-8 w-full rounded-lg border border-[var(--wood-border)] bg-[var(--wood-panel)] px-2 text-xs text-[var(--wood-text)] outline-none placeholder:text-[var(--wood-muted)] focus:border-[var(--wood-accent)]"
        />
      </label>

      <label className="block space-y-1">
        <div className="text-[10px] text-[var(--wood-muted)]">opening line - what the NPC says first</div>
        <textarea
          value={greeting}
          onChange={event => setGreeting(event.target.value)}
          rows={2}
          placeholder="How the conversation begins..."
          className="
            wood-scroll w-full resize-none rounded-lg border border-[var(--wood-border)]
            bg-[var(--wood-panel)] p-2 text-xs text-[var(--wood-text)] outline-none
            placeholder:text-[var(--wood-muted)] focus:border-[var(--wood-accent)]
          "
        />
      </label>

      <div className="space-y-2">
        <div className="text-[10px] text-[var(--wood-muted)]">questions the player can ask</div>

        {
          exchanges.map((exchange, index) => (
            <div key={index} className="space-y-1 rounded-lg border border-[var(--wood-border)] p-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[var(--wood-muted)]">Question {index + 1}</span>

                {
                  exchanges.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExchange(index)}
                      className="text-[10px] text-[var(--wood-muted)] hover:text-red-300"
                    >
                      Remove
                    </button>
                  )
                }
              </div>

              <input
                value={exchange.question}
                onChange={event => updateExchange(index, "question", event.target.value)}
                placeholder="What the player can ask, e.g. 'Why are you here?'"
                className="h-8 w-full rounded-lg border border-[var(--wood-border)] bg-[var(--wood-panel)] px-2 text-xs text-[var(--wood-text)] outline-none placeholder:text-[var(--wood-muted)] focus:border-[var(--wood-accent)]"
              />

              <textarea
                value={exchange.answer}
                onChange={event => updateExchange(index, "answer", event.target.value)}
                rows={2}
                placeholder="The NPC's answer..."
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
          onClick={addExchange}
          className="text-xs text-[var(--wood-muted)] underline decoration-dotted hover:text-[var(--wood-text)]"
        >
          + Add another question
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
          {checking ? "Checking..." : previewing ? "Previewing..." : "Preview new dialogue"}
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

export default AddDialogueForm
