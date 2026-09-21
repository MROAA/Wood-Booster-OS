import { useState } from "react"

import { apiGet } from "../../api/client"

import { usePatchPreview } from "./usePatchPreview"
import PatchPreviewPanel from "./PatchPreviewPanel"
import { ACT_NAMES } from "./actNames"

/*
 * Marc's story-authoring priority, continued. Cinematics were
 * investigated first for this same "write something brand new" slot,
 * but turned out to be a dead end: CINEMATICS is a fixed set of 5
 * entries each named by a literal id directly in HeartwoodBattle.jsx
 * (CINEMATICS.intro, CINEMATICS["crownless-throne"], ...) - a new
 * entry would have no trigger point and would never actually play.
 *
 * ACT_CROSSROADS (crossroads.js) is different: it's looked up
 * GENERICALLY by Act number (`crossroadsForAct(actIndex)`, called from
 * HeartwoodBattle.jsx as `if (crossroadsForAct(act)) setActCrossroads(act)`)
 * and the file's own header comment confirms Acts VI/VII are missing
 * on purpose ("the bible has them only as sketches"), not because the
 * engine can't show one there - the boundary is just crossed silently
 * today. A new entry for Act 6 or 7 written through this form WILL
 * actually appear the next time a run reaches that Act transition,
 * with zero code changes - a real "write it and it just works" gap,
 * unlike cinematics.
 *
 * Each choice also carries `allegiance`/`forestState`/`flag` -
 * mechanical hooks, not just flavor (runEngine.resolveActCrossroads
 * folds `allegiance` into runState.runModifiers generically, no fixed
 * list to register against first - confirmed safe for a brand-new id).
 * `forestState` is exposed as a plain 3-option choice (own wording,
 * not the raw string) since it directly affects the ending tally
 * (cinematics.js's endingIdForRun); `allegiance`/`flag` stay
 * auto-generated from the choice's own text, same "keep the compose
 * form to plain writing" split AddEventForm made for a choice's own
 * `effects` - Marc can wire a NEW allegiance into cinematics.js's
 * ENDING_AXIS by hand later if he wants this choice to sway which
 * ending plays; until then it's a fully working placeholder scene
 * with real narrative branching and a real (if modest) forestState
 * effect, matching this project's own placeholder-first approach.
 */
const AVAILABLE_ACTS = [6, 7]
const ROMAN = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI", 7: "VII" }

function romanActLabel(actNumber) {
  return `Act ${ROMAN[actNumber]} — ${ACT_NAMES[actNumber]}`
}

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
  return { label: "", result: "", forestState: "restless" }
}

const FOREST_STATE_OPTIONS = [
  { value: "purified", label: "Calms the forest" },
  { value: "restless", label: "Leaves it as it is" },
  { value: "corrupted", label: "Unsettles it further" },
]

function AddCrossroadsForm({ type, onApplied, onPreviewUrlChange }) {
  const [open, setOpen] = useState(false)
  const [act, setAct] = useState(String(AVAILABLE_ACTS[0]))
  const [kicker, setKicker] = useState("")
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
    setAct(String(AVAILABLE_ACTS[0]))
    setKicker("")
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
    const targetAct = Number(act)
    const candidateId = String(targetAct)
    const realChoices = choices.filter(choice => choice.label.trim() && choice.result.trim())

    if (!kicker.trim()) {
      setCheckError("Enter a short title for this crossroads.")
      return
    }

    if (!body.trim()) {
      setCheckError("Enter the scene's text.")
      return
    }

    if (realChoices.length < 2) {
      setCheckError("Enter at least 2 choices (a label and what happens).")
      return
    }

    setChecking(true)
    setCheckError("")

    try {
      await apiGet(`/hearthwood-patchbay/entity/${type}/${candidateId}`)
      setCheckError(`${romanActLabel(targetAct)} already has a crossroads - pick a different Act.`)
      return
    } catch {
      // 404 == free, continue
    } finally {
      setChecking(false)
    }

    const seenIds = new Set()

    const choicesText = realChoices
      .map(choice => {
        let id = slugify(choice.label) || "choice"
        while (seenIds.has(id)) {
          id = `${id}-2`
        }
        seenIds.add(id)

        return [
          "      {",
          `        id: ${jsString(id)},`,
          `        label: ${jsString(choice.label.trim())},`,
          `        result: ${jsString(choice.result.trim())},`,
          `        allegiance: ${jsString(`act${targetAct}-${id}`)},`,
          `        forestState: ${jsString(choice.forestState)},`,
          `        flag: ${jsString(`act${targetAct}_${id}`)},`,
          "      },",
        ].join("\n")
      })
      .join("\n")

    const block = [
      `  ${targetAct}: {`,
      `    actIndex: ${targetAct},`,
      `    fromAct: ${jsString(romanActLabel(targetAct - 1))},`,
      `    intoAct: ${jsString(romanActLabel(targetAct))},`,
      `    kicker: ${jsString(kicker.trim())},`,
      `    body: ${jsString(body.trim())},`,
      "    choices: [",
      choicesText,
      "    ],",
      "  }",
    ].join("\n")

    await preview({
      type,
      entityId: candidateId,
      edits: [{ path: ["ACT_CROSSROADS"], op: "addKey", key: candidateId, block }],
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
        + Write a new crossroads
      </button>
    )
  }

  return (
    <div className="space-y-2 rounded-xl border border-[var(--wood-border)] bg-[var(--wood-bg)] p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-[var(--wood-muted)]">
        New Act Crossroads
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1">
          <div className="text-[10px] text-[var(--wood-muted)]">title</div>
          <input
            value={kicker}
            onChange={event => setKicker(event.target.value)}
            placeholder="e.g. The Echo's Bargain"
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
            {AVAILABLE_ACTS.map(n => <option key={n} value={n}>{romanActLabel(n)}</option>)}
          </select>
        </label>
      </div>

      <label className="block space-y-1">
        <div className="text-[10px] text-[var(--wood-muted)]">the scene - what leads to this decision</div>
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
        <div className="text-[10px] text-[var(--wood-muted)]">choices - what the player can decide</div>

        {
          choices.map((choice, index) => (
            <div key={index} className="space-y-1 rounded-lg border border-[var(--wood-border)] p-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[var(--wood-muted)]">Choice {index + 1}</span>

                {
                  choices.length > 2 && (
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
                placeholder="What the player can choose, e.g. 'Mend the ritual.'"
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

              <label className="block space-y-1">
                <div className="text-[10px] text-[var(--wood-muted)]">how does this choice affect the forest going forward?</div>
                <select
                  value={choice.forestState}
                  onChange={event => updateChoice(index, "forestState", event.target.value)}
                  className="h-8 w-full rounded-lg border border-[var(--wood-border)] bg-[var(--wood-panel)] px-2 text-xs text-[var(--wood-text)] outline-none focus:border-[var(--wood-accent)]"
                >
                  {FOREST_STATE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
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
          {checking ? "Checking..." : previewing ? "Previewing..." : "Preview new crossroads"}
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

export default AddCrossroadsForm
