import { useEffect, useState } from "react"

import { usePatchPreview } from "./usePatchPreview"
import PatchPreviewPanel from "./PatchPreviewPanel"

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

  const scalarFields = allFields.filter(([, field]) => field.kind !== "complex")
  const complexFields = allFields.filter(([, field]) => field.kind === "complex")

  useEffect(() => {
    const initial = {}

    for (const [key, field] of allFields) {
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
          Kenttäeditori
        </label>

        {
          changedKeys.length > 0 && (
            <span className="text-[11px] text-[var(--wood-accent)]">{changedKeys.length} muutettu</span>
          )
        }
      </div>

      <div className="grid grid-cols-2 gap-2">
        {
          scalarFields.map(([key, field]) => {
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
              </label>
            )
          })
        }
      </div>

      {
        complexFields.length > 0 && (
          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-wide text-[var(--wood-muted)]">
              Monimutkaiset kentät (raakana JS:nä)
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
          {previewing ? "Esikatsellaan..." : `Esikatsele ${changedKeys.length || ""} muutos${changedKeys.length === 1 ? "" : "ta"}`}
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
