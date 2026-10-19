import { useState } from "react"

import { apiGet, apiUpload } from "../../api/client"
import { BREAK_EFFECTS, LEAVES_OPTIONS } from "../../data/heartwood/battleObjects"
import { TERRAIN, CUSTOM_OBJECT_IDS } from "../../services/heartwood/tacticsTerrain"

import { usePatchPreview } from "./usePatchPreview"
import PatchPreviewPanel from "./PatchPreviewPanel"
import { ACT_NAMES } from "./actNames"

/*
 * Marc, 2026-10-19: "haluaisin dev toolilla luoda uutta peliin" /
 * "tämän pitää olla helppokäyttöinen koska en tunne koodauspuolta" -
 * make his OWN battlefield objects. Every question is plain English
 * with a choice list; the numbers behind "Sturdy" or "Strong" never
 * show. Writes one new entry into BATTLE_OBJECTS (battleObjects.js)
 * through the normal preview/apply flow (undo in Change history); the
 * game picks it up on the next battle - tacticsTerrain/tacticsObjects
 * turn it into a real blocking, breakable tile, and
 * tacticsRealMatchup.withStudioObjects scatters it on the map.
 */
const TOUGHNESS = [
  { value: 1, label: "Breaks in one hit" },
  { value: 3, label: "Fragile" },
  { value: 6, label: "Sturdy (like a tree)" },
  { value: 10, label: "Very tough (like a runestone)" },
  { value: 15, label: "Nearly unbreakable" },
]
const STRENGTH = [
  { value: 2, label: "Weak" },
  { value: 4, label: "Medium" },
  { value: 6, label: "Strong" },
]
const HOW_MANY = [
  { value: 0, label: "None for now (saved, but not used yet)" },
  { value: 1, label: "1 per battle" },
  { value: 2, label: "2 per battle" },
  { value: 3, label: "3 per battle" },
]
const ICON_IDEAS = ["🐝", "🏮", "🪵", "🗿", "🔥", "💎", "🍯", "🌋", "🪺", "🕯️", "⚱️", "🌸"]
const ROMAN = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI", 7: "VII" }
const NO_STRENGTH = new Set(["crumble", "fall"])
// The practice board (HeartwoodTactics.jsx ?objects=1) lays out every
// object, Studio-made ones included, right in reach of the squad.
const PRACTICE_URL = "/heartwood-tactics?objects=1"

function TryItLink() {
  return (
    <a
      href={PRACTICE_URL}
      target="_blank"
      rel="noreferrer"
      data-testid="battle-object-try"
      className="rounded-full border border-[var(--wood-border)] px-3 py-1 text-xs text-[var(--wood-muted)] hover:border-[var(--wood-accent)] hover:text-[var(--wood-text)]"
    >
      ⚔ Try my objects in a practice battle
    </a>
  )
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

const jsString = text => JSON.stringify(text)

const fieldClass = "h-8 w-full rounded-lg border border-[var(--wood-border)] bg-[var(--wood-panel)] px-2 text-xs text-[var(--wood-text)] outline-none placeholder:text-[var(--wood-muted)] focus:border-[var(--wood-accent)]"

function Question({ label, children }) {
  return (
    <label className="block space-y-1">
      <div className="text-[11px] text-[var(--wood-muted)]">{label}</div>
      {children}
    </label>
  )
}

function emptyForm() {
  return { name: "", icon: "🐝", hp: 3, onBreak: "crumble", power: 4, leaves: "rubble", perBattle: 1, fromAct: 1, note: "" }
}

// autoOpen: an HQ room button ("Write a new event"...) opens it straight away.
function AddBattleObjectForm({ type, onApplied, onPreviewUrlChange, autoOpen = false }) {
  const [open, setOpen] = useState(autoOpen)
  const [form, setForm] = useState(emptyForm)
  const [picture, setPicture] = useState(null)
  const [checkError, setCheckError] = useState("")
  const [checking, setChecking] = useState(false)

  const { result, applyMode, setApplyMode, previewing, applying, errorMessage, preview, discard, apply } =
    usePatchPreview({ onApplied, onPreviewUrlChange })

  const set = (field, value) => {
    setForm(previous => ({ ...previous, [field]: value }))
    setCheckError("")
  }
  const effect = BREAK_EFFECTS[form.onBreak]
  const effectSentence = effect.text.replace("{power}", form.power)

  function startOpen() {
    setForm(emptyForm())
    setPicture(null)
    setCheckError("")
    setOpen(true)
  }

  function pickPicture(event) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (file) setPicture({ file, url: URL.createObjectURL(file) })
  }

  async function handlePreview() {
    const name = form.name.trim()
    const id = slugify(name)

    if (!name || !id) {
      setCheckError("Give your object a name (letters or numbers).")
      return
    }

    // (Studio-made objects are in TERRAIN too - the server check below names those.)
    if (TERRAIN[id] && !CUSTOM_OBJECT_IDS.includes(id)) {
      setCheckError(`"${name}" is already a built-in part of the battlefield - pick another name.`)
      return
    }

    setChecking(true)
    setCheckError("")

    let image = ""

    try {
      try {
        await apiGet(`/hearthwood-patchbay/entity/${type}/${id}`)
        setCheckError(`You already have an object called "${name}" - pick another name, or edit that one from the list.`)
        return
      } catch {
        // 404 == the name is free
      }

      if (picture) {
        const formData = new FormData()
        formData.append("type", type)
        formData.append("entityId", id)
        formData.append("file", picture.file)
        const uploaded = await apiUpload("/hearthwood-patchbay/upload-image", formData)
        image = uploaded.filename
      }
    } catch (error) {
      setCheckError(`The picture could not be saved: ${error.message}`)
      return
    } finally {
      setChecking(false)
    }

    const block = [
      `  ${jsString(id)}: {`,
      `    name: ${jsString(name)},`,
      `    icon: ${jsString(form.icon || "❖")},`,
      `    image: ${jsString(image)},`,
      `    hp: ${Number(form.hp)},`,
      `    onBreak: ${jsString(form.onBreak)},`,
      `    power: ${NO_STRENGTH.has(form.onBreak) ? 0 : Number(form.power)},`,
      `    leaves: ${jsString(form.leaves)},`,
      `    perBattle: ${Number(form.perBattle)},`,
      `    fromAct: ${Number(form.fromAct)},`,
      `    note: ${jsString(form.note.trim())},`,
      "  }",
    ].join("\n")

    await preview({
      type,
      entityId: id,
      edits: [{ path: ["BATTLE_OBJECTS"], op: "addKey", key: id, block }],
    })
  }

  async function handleApply() {
    await apply()
    setOpen(false)
  }

  if (!open) {
    return (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={startOpen}
          data-testid="add-battle-object-open"
          className="rounded-full border border-[var(--wood-border)] px-3 py-1 text-xs text-[var(--wood-muted)] hover:border-[var(--wood-accent)] hover:text-[var(--wood-text)]"
        >
          + Make a new battlefield object
        </button>
        <TryItLink />
      </div>
    )
  }

  return (
    <div className="space-y-3 rounded-xl border border-[var(--wood-border)] bg-[var(--wood-bg)] p-3" data-testid="add-battle-object-form">
      <div className="text-xs font-semibold uppercase tracking-wide text-[var(--wood-muted)]">New battlefield object</div>

      <div className="flex gap-3">
        {/* What it will look like on the board, and what it does. */}
        <div className="flex w-32 shrink-0 flex-col items-center gap-1 rounded-lg border border-[var(--wood-border)] bg-[var(--wood-panel)] p-2 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-md bg-[#2b3a2a]" data-testid="battle-object-preview">
            {picture ? <img src={picture.url} alt="" className="h-14 w-14 object-contain" /> : <span className="text-4xl">{form.icon}</span>}
          </div>
          <div className="text-xs font-semibold text-[var(--wood-text)]">{form.name.trim() || "Your object"}</div>
          <div className="text-[10px] leading-snug text-[var(--wood-muted)]">{effectSentence}</div>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-2">
          <Question label="What is it called?">
            <input value={form.name} onChange={event => set("name", event.target.value)} placeholder="e.g. Wasp nest" className={fieldClass} data-testid="battle-object-name" />
          </Question>

          <Question label="How tough is it?">
            <select value={form.hp} onChange={event => set("hp", Number(event.target.value))} className={fieldClass}>
              {TOUGHNESS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </Question>

          <Question label="What happens when it breaks?">
            <select value={form.onBreak} onChange={event => set("onBreak", event.target.value)} className={fieldClass} data-testid="battle-object-effect">
              {Object.entries(BREAK_EFFECTS).map(([value, option]) => <option key={value} value={value}>{option.label}</option>)}
            </select>
          </Question>

          {
            NO_STRENGTH.has(form.onBreak)
              ? <div />
              : (
                <Question label="How strong is that?">
                  <select value={form.power} onChange={event => set("power", Number(event.target.value))} className={fieldClass}>
                    {STRENGTH.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </Question>
              )
          }

          <Question label="What is left on the ground?">
            <select value={form.leaves} onChange={event => set("leaves", event.target.value)} className={fieldClass}>
              {Object.entries(LEAVES_OPTIONS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </Question>

          <Question label="How many on each battlefield?">
            <select value={form.perBattle} onChange={event => set("perBattle", Number(event.target.value))} className={fieldClass}>
              {HOW_MANY.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </Question>

          <Question label="From which part of the story?">
            <select value={form.fromAct} onChange={event => set("fromAct", Number(event.target.value))} className={fieldClass}>
              {[1, 2, 3, 4, 5, 6, 7].map(n => <option key={n} value={n}>{`From Act ${ROMAN[n]} — ${ACT_NAMES[n]}`}</option>)}
            </select>
          </Question>

          <Question label="A line about it (optional)">
            <input value={form.note} onChange={event => set("note", event.target.value)} placeholder="e.g. Humming angrily." className={fieldClass} />
          </Question>
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-[11px] text-[var(--wood-muted)]">How does it look? Pick a symbol, or use your own picture.</div>
        <div className="flex flex-wrap items-center gap-1">
          {
            ICON_IDEAS.map(icon => (
              <button
                key={icon}
                type="button"
                onClick={() => { set("icon", icon); setPicture(null) }}
                className={`h-8 w-8 rounded-lg border text-lg ${!picture && form.icon === icon ? "border-[var(--wood-accent)] bg-[var(--wood-panel)]" : "border-[var(--wood-border)]"}`}
              >
                {icon}
              </button>
            ))
          }
          <label className="ml-2 cursor-pointer rounded-full border border-[var(--wood-border)] px-3 py-1 text-xs text-[var(--wood-muted)] hover:text-[var(--wood-text)]">
            {picture ? "Change picture" : "Use my own picture…"}
            <input type="file" accept=".png,.jpg,.jpeg,.webp,.gif" onChange={pickPicture} className="hidden" />
          </label>
          {picture && (
            <button type="button" onClick={() => setPicture(null)} className="text-[10px] text-[var(--wood-muted)] hover:text-red-300">
              Remove picture
            </button>
          )}
        </div>
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
          data-testid="battle-object-preview-button"
          className="rounded-full border border-[var(--wood-accent)] bg-[var(--wood-accent)] px-3 py-1 text-xs font-medium text-[#17120c] transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
        >
          {checking ? "Checking..." : previewing ? "Preparing..." : "Add to the game"}
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

export default AddBattleObjectForm
