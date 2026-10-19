import { useEffect, useState } from "react"

import { usePatchPreview } from "./usePatchPreview"
import PatchPreviewPanel from "./PatchPreviewPanel"
import { ACT_NAMES } from "./actNames"
import ListFieldEditor from "./ListFieldEditor"

/*
 * "Muokkaa tehokkaammin" / "haluan pystyä päivittämään Hearthwoodia
 * todella kattavasti" (Marc) - suora kenttäkohtainen muokkaus NL-
 * lauseen kirjoittamisen sijaan, nyt myös monimutkaisille kentille
 * (movePattern, effects, passives, ...) raakana JS:nä muokattuna -
 * kind:"complex" -kentät (hearthwood-read-entities.mjs) tulevat
 * `entityDetail.fields`:iin täsmälleen samasta paikasta kuin
 * skalaarit, vain isomman <textarea>:n kautta ja op:"setRaw":lla
 * op:"set":in sijaan. Palvelin (hearthwood-apply-edit.mjs) validoi
 * korvaavan tekstin uudelleenparsimalla koko tiedoston ennen kuin
 * mikään kirjoitetaan - virheellinen JS hylätään, ei koskaan
 * kirjoiteta. `id` on aina lukukohteinen - sen muuttaminen olisi
 * uudelleennimeäminen, ei kenttäeditointia.
 */
function coerceValue(kind, raw) {
  if (kind === "number") {
    const parsed = Number(raw)
    return Number.isNaN(parsed) ? raw : parsed
  }

  if (kind === "boolean") {
    return raw === "true"
  }

  return raw
}

// Marc, 2026-10-19: "olen visuaalinen ihminen" / "en osaa koodaamiseen
// liittyviä" - the fields a person recognises come first, in plain words
// with a symbol, numbers with − / + buttons; every other field (art keys,
// file paths, AI settings...) folds under "Advanced (technical)".
const BASICS = {
  name: { label: "Name", icon: "✎", help: "What the player sees on cards and in the log." },
  title: { label: "Title", icon: "✎" },
  hp: { label: "Health", icon: "❤", help: "How many hits it can take before falling." },
  maxHp: { label: "Health", icon: "❤", help: "How many hits it can take before falling." },
  attack: { label: "Attack", icon: "⚔", help: "How much damage one hit does." },
  baseAttack: { label: "Attack", icon: "⚔", help: "How much damage one hit does." },
  armor: { label: "Armour", icon: "🛡" },
  defense: { label: "Defence", icon: "🛡" },
  block: { label: "Block", icon: "🛡" },
  range: { label: "Range", icon: "🏹", help: "How many tiles away it can hit. 1 = right next to it." },
  move: { label: "Movement", icon: "👣", help: "How many tiles it can walk in one turn." },
  speed: { label: "Speed", icon: "👣" },
  mana: { label: "Mana", icon: "💧", help: "How much mana it costs or holds." },
  cooldown: { label: "Wait between uses", icon: "⏳", help: "Turns to wait before it can be used again." },
  cost: { label: "Cost", icon: "🪙", help: "What it costs in the market." },
  price: { label: "Price", icon: "🪙" },
  rarity: { label: "Rarity", icon: "✦" },
  tier: { label: "Tier", icon: "✦" },
  role: { label: "Role", icon: "🎭" },
  tribe: { label: "Tribe", icon: "🌿" },
  act: { label: "Story Act", icon: "🗺", help: "Which part of the story it belongs to (1-7)." },
  description: { label: "Description", icon: "📜" },
  text: { label: "Text", icon: "📜" },
  blurb: { label: "Short description", icon: "📜" },
  persona: { label: "Personality", icon: "🎭" },
  quirk: { label: "Quirk", icon: "🎭" },
}

function Stepper({ value, onChange, changed }) {
  const n = Number(value)
  const step = delta => onChange(String((Number.isFinite(n) ? n : 0) + delta))
  const button = "h-9 w-9 rounded-lg border border-[var(--wood-border)] text-lg text-[var(--wood-text)] hover:border-[var(--wood-accent)]"
  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={() => step(-1)} className={button} aria-label="Less">−</button>
      <input
        type="number"
        value={value}
        onChange={event => onChange(event.target.value)}
        className={`h-9 w-20 rounded-lg border bg-[var(--wood-bg)] px-2 text-center text-base font-semibold tabular-nums text-[var(--wood-text)] outline-none focus:border-[var(--wood-accent)] ${changed ? "border-[var(--wood-accent)]" : "border-[var(--wood-border)]"}`}
      />
      <button type="button" onClick={() => step(1)} className={button} aria-label="More">+</button>
    </div>
  )
}

function EntityFieldEditor({ type, entityId, entityDetail, onApplied, onPreviewUrlChange }) {
  const [values, setValues] = useState({})

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

  const allFields = entityDetail
    ? Object.entries(entityDetail.fields || {}).filter(([key]) => key !== "id")
    : []

  const scalarFields = allFields.filter(([, field]) => field.kind !== "complex" && field.kind !== "list")
  const basicFields = scalarFields.filter(([key]) => BASICS[key])
  const technicalFields = scalarFields.filter(([key]) => !BASICS[key])
  const complexFields = allFields.filter(([, field]) => field.kind === "complex")
  const listFields = allFields.filter(([, field]) => field.kind === "list")

  useEffect(() => {
    const initial = {}

    for (const [key, field] of scalarFields.concat(complexFields)) {
      initial[key] = String(field.value)
    }

    setValues(initial)
    // entityDetail identity changes on every fetch (new object each
    // select) - re-seed the draft whenever the underlying entity does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityDetail])

  function fieldChanged(key, field) {
    return values[key] !== undefined && values[key] !== String(field.value)
  }

  const changedKeys = allFields
    .filter(([key, field]) => fieldChanged(key, field))
    .map(([key]) => key)

  async function handlePreview() {
    if (changedKeys.length === 0 || !entityId) {
      return
    }

    const edits = changedKeys.map(key => {
      const field = entityDetail.fields[key]

      return field.kind === "complex"
        ? { path: [entityId, key], op: "setRaw", value: values[key] }
        : { path: [entityId, key], op: "set", value: coerceValue(field.kind, values[key]) }
    })

    await preview({ type, entityId, edits })
  }

  if (!entityDetail) {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--wood-muted)]">
          The basics
        </label>

        {
          changedKeys.length > 0 && (
            <span className="text-[11px] text-[var(--wood-accent)]">{changedKeys.length} changed</span>
          )
        }
      </div>

      {basicFields.length === 0 && <div className="text-xs text-[var(--wood-muted)]">Nothing simple to change here - see "Advanced" below.</div>}

      <div className="grid grid-cols-2 gap-3" data-testid="field-basics">
        {
          basicFields.map(([key, field]) => {
            const changed = fieldChanged(key, field)
            const set = value => setValues(previous => ({ ...previous, [key]: value }))
            const long = field.kind === "string" && String(values[key] ?? "").length > 40

            return (
              <label key={key} className={`hw-reveal space-y-1 ${long ? "col-span-2" : ""}`} data-basic={key}>
                <div className="flex items-center gap-1.5 text-xs text-[var(--wood-muted)]">
                  <span aria-hidden="true">{BASICS[key].icon}</span>
                  <span className="font-medium text-[var(--wood-text)]">{BASICS[key].label}</span>
                  {changed && <span className="text-[var(--wood-accent)]">● changed</span>}
                </div>

                {
                  field.kind === "number"
                    ? <Stepper value={values[key] ?? ""} onChange={set} changed={changed} />
                    : field.kind === "boolean"
                      ? (
                        <select value={values[key] ?? ""} onChange={event => set(event.target.value)} className="h-9 w-full rounded-lg border border-[var(--wood-border)] bg-[var(--wood-bg)] px-2 text-sm text-[var(--wood-text)]">
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      )
                      : long
                        ? <textarea value={values[key] ?? ""} onChange={event => set(event.target.value)} rows={2} className={`w-full resize-y rounded-lg border bg-[var(--wood-bg)] px-3 py-2 text-sm text-[var(--wood-text)] outline-none focus:border-[var(--wood-accent)] ${changed ? "border-[var(--wood-accent)]" : "border-[var(--wood-border)]"}`} />
                        : <input value={values[key] ?? ""} onChange={event => set(event.target.value)} className={`h-9 w-full rounded-lg border bg-[var(--wood-bg)] px-3 text-sm text-[var(--wood-text)] outline-none focus:border-[var(--wood-accent)] ${changed ? "border-[var(--wood-accent)]" : "border-[var(--wood-border)]"}`} />
                }

                {key === "act" && ACT_NAMES[Number(values[key])] && <div className="text-[11px] text-[var(--wood-accent)]">{ACT_NAMES[Number(values[key])]}</div>}
                {BASICS[key].help && <div className="hw-reveal-more text-[11px] text-[var(--wood-muted)]">{BASICS[key].help}</div>}
              </label>
            )
          })
        }
      </div>

      {(technicalFields.length > 0 || listFields.length > 0 || complexFields.length > 0) && (
      <details className="rounded-lg border border-[var(--wood-border)] p-2" data-testid="field-advanced">
        <summary className="cursor-pointer text-xs text-[var(--wood-muted)]">Advanced (technical) - {technicalFields.length + listFields.length + complexFields.length} more settings</summary>
        <div className="mt-3 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {
          technicalFields.map(([key, field]) => {
            const changed = fieldChanged(key, field)

            const inputProps = {
              value: values[key] ?? "",
              onChange: event => setValues(previous => ({ ...previous, [key]: event.target.value })),
              className: `
                h-8 w-full rounded-lg border bg-[var(--wood-bg)] px-2 text-xs text-[var(--wood-text)]
                outline-none focus:border-[var(--wood-accent)]
                ${changed ? "border-[var(--wood-accent)]" : "border-[var(--wood-border)]"}
              `,
            }

            return (
              <label key={key} className="space-y-1">
                <div className="flex items-center gap-1 text-[10px] text-[var(--wood-muted)]">
                  {key}
                  {changed && <span className="text-[var(--wood-accent)]">●</span>}
                </div>

                {
                  field.kind === "boolean"
                    ? (
                      <select {...inputProps}>
                        <option value="true">true</option>
                        <option value="false">false</option>
                      </select>
                    )
                    : (
                      <input
                        type={field.kind === "number" ? "number" : "text"}
                        {...inputProps}
                      />
                    )
                }

                {
                  // Marc: "on vieläkin epäselvää että missä kohtaa
                  // tarinaa teksti esiintyy" - a bare Act number here
                  // still doesn't say what that Act IS, even though the
                  // browser list (EntityBrowser.jsx) already names it.
                  // Reacts to the currently TYPED value, not just the
                  // original one, so retargeting this entry to a
                  // different Act shows its name immediately.
                  key === "act" && ACT_NAMES[Number(values[key])] && (
                    <div className="text-[10px] text-[var(--wood-accent)]">
                      {ACT_NAMES[Number(values[key])]}
                    </div>
                  )
                }
              </label>
            )
          })
        }
      </div>

      {
        listFields.length > 0 && (
          <div className="space-y-3">
            {
              listFields.map(([key, field]) => (
                <ListFieldEditor
                  key={key}
                  type={type}
                  entityId={entityId}
                  fieldKey={key}
                  field={field}
                  onApplied={onApplied}
                  onPreviewUrlChange={onPreviewUrlChange}
                />
              ))
            }
          </div>
        )
      }

      {
        complexFields.length > 0 && (
          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-wide text-[var(--wood-muted)]">
              Complex fields (as raw JS)
            </div>

            {
              complexFields.map(([key, field]) => {
                const changed = fieldChanged(key, field)

                return (
                  <label key={key} className="block space-y-1">
                    <div className="flex items-center gap-1 text-[10px] text-[var(--wood-muted)]">
                      {key}
                      {changed && <span className="text-[var(--wood-accent)]">●</span>}
                    </div>

                    <textarea
                      value={values[key] ?? ""}
                      onChange={event => setValues(previous => ({ ...previous, [key]: event.target.value }))}
                      rows={Math.min(10, Math.max(3, (values[key] || "").split("\n").length))}
                      spellCheck={false}
                      className={`
                        wood-scroll w-full resize-y rounded-lg border bg-[var(--wood-bg)] p-2
                        font-mono text-[11px] leading-relaxed text-[var(--wood-text)] outline-none
                        focus:border-[var(--wood-accent)]
                        ${changed ? "border-[var(--wood-accent)]" : "border-[var(--wood-border)]"}
                      `}
                    />
                  </label>
                )
              })
            }
          </div>
        )
      }

        </div>
      </details>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          disabled={changedKeys.length === 0 || previewing}
          onClick={handlePreview}
          className="
            rounded-full border border-[var(--wood-accent)] bg-[var(--wood-accent)]
            px-4 py-1.5 text-sm font-medium text-[#17120c] transition-opacity
            disabled:cursor-not-allowed disabled:opacity-30
          "
        >
          {previewing ? "Preparing..." : changedKeys.length ? `Check my ${changedKeys.length} change${changedKeys.length === 1 ? "" : "s"}` : "Change something above first"}
        </button>
      </div>

      {errorMessage && <div className="text-xs text-red-300">{errorMessage}</div>}

      <PatchPreviewPanel
        result={result}
        applyMode={applyMode}
        onApplyModeChange={setApplyMode}
        onDiscard={discard}
        onApply={apply}
        applying={applying}
      />
    </div>
  )
}

export default EntityFieldEditor
