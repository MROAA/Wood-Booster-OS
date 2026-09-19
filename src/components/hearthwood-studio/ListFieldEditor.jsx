import { useState } from "react"

import { usePatchPreview } from "./usePatchPreview"
import PatchPreviewPanel from "./PatchPreviewPanel"

/*
 * Marc: "valintaikkunan ja muut tarinanhaarat ei vielä ole
 * muokattavissa" (the choice window and other story branches aren't
 * editable yet) - a `choices`/`effects`/`lines`-style array of records
 * (hearthwood-read-entities.mjs's new `kind: "list"`) used to be one
 * raw-JS blob in the "complex fields" textarea. This renders each item
 * as its own small card of ordinary scalar inputs - recursing into a
 * nested list (an event choice's own `effects`) the same way - and
 * collects every changed leaf into one batched preview, keyed by its
 * own full path from the entity root (e.g. [entityId, "choices", 0,
 * "label"] or two levels deep, [entityId, "choices", 0, "effects", 1,
 * "essence"]) - resolvePath (hearthwood-apply-edit.mjs) already walks
 * any depth of object/array nesting generically, so no backend op was
 * needed beyond what "set" already does.
 */
function pathKey(pathSegments) {
  return pathSegments.join(".")
}

function initialDraftFor(items, prefix, draft) {
  items.forEach((item, index) => {
    const itemPrefix = [...prefix, index]

    if (item.fields) {
      for (const [key, field] of Object.entries(item.fields)) {
        if (field.kind === "list") {
          initialDraftFor(field.items, [...itemPrefix, key], draft)
        } else if (field.kind !== "complex") {
          draft[pathKey([...itemPrefix, key])] = String(field.value)
        }
      }
    } else {
      draft[pathKey(itemPrefix)] = String(item.value)
    }
  })
}

function ItemFields({ fields, prefix, draft, setDraft }) {
  const entries = Object.entries(fields).filter(([, field]) => field.kind !== "complex")

  return (
    <div className="grid grid-cols-2 gap-2">
      {
        entries.map(([key, field]) => {
          if (field.kind === "list") {
            return (
              <div key={key} className="col-span-2">
                <NestedList label={key} field={field} prefix={[...prefix, key]} draft={draft} setDraft={setDraft} />
              </div>
            )
          }

          const fullPath = [...prefix, key]
          const draftKey = pathKey(fullPath)
          const changed = draft[draftKey] !== undefined && draft[draftKey] !== String(field.value)
          const isLong = field.kind === "string" && field.value && field.value.length > 60

          const inputProps = {
            value: draft[draftKey] ?? "",
            onChange: event => setDraft(previous => ({ ...previous, [draftKey]: event.target.value })),
            className: `
              w-full rounded-lg border bg-[var(--wood-bg)] px-2 text-xs text-[var(--wood-text)]
              outline-none focus:border-[var(--wood-accent)]
              ${changed ? "border-[var(--wood-accent)]" : "border-[var(--wood-border)]"}
              ${isLong ? "min-h-[3.5rem] resize-y py-1.5" : "h-8"}
            `,
          }

          return (
            <label key={key} className={isLong ? "col-span-2 space-y-1" : "space-y-1"}>
              <div className="flex items-center gap-1 text-[10px] text-[var(--wood-muted)]">
                {key}
                {changed && <span className="text-[var(--wood-accent)]">●</span>}
              </div>

              {
                isLong
                  ? <textarea rows={2} {...inputProps} />
                  : <input type={field.kind === "number" ? "number" : "text"} {...inputProps} />
              }
            </label>
          )
        })
      }
    </div>
  )
}

function NestedList({ label, field, prefix, draft, setDraft }) {
  return (
    <div className="space-y-1.5 rounded-lg border border-dashed border-[var(--wood-border)] p-2">
      <div className="text-[10px] uppercase tracking-wide text-[var(--wood-muted)]">{label}</div>

      {
        field.items.map((item, index) => {
          const itemPrefix = [...prefix, index]

          return (
            <div key={index} className="rounded-lg border border-[var(--wood-border)] bg-[var(--wood-bg)] p-2">
              {
                item.fields
                  ? <ItemFields fields={item.fields} prefix={itemPrefix} draft={draft} setDraft={setDraft} />
                  : (
                    <input
                      value={draft[pathKey(itemPrefix)] ?? ""}
                      onChange={event => {
                        const value = event.target.value
                        setDraft(previous => ({ ...previous, [pathKey(itemPrefix)]: value }))
                      }}
                      className="h-8 w-full rounded-lg border border-[var(--wood-border)] bg-[var(--wood-panel)] px-2 text-xs text-[var(--wood-text)] outline-none focus:border-[var(--wood-accent)]"
                    />
                  )
              }
            </div>
          )
        })
      }
    </div>
  )
}

function collectEdits(items, prefix, draft, entityId, fieldKeyRoot) {
  const edits = []

  items.forEach((item, index) => {
    const itemPrefix = [...prefix, index]

    if (item.fields) {
      for (const [key, field] of Object.entries(item.fields)) {
        if (field.kind === "list") {
          edits.push(...collectEdits(field.items, [...itemPrefix, key], draft, entityId, fieldKeyRoot))
          continue
        }

        if (field.kind === "complex") {
          continue
        }

        const draftKey = pathKey([...itemPrefix, key])
        const raw = draft[draftKey]

        if (raw === undefined || raw === String(field.value)) {
          continue
        }

        const value = field.kind === "number" ? (Number.isNaN(Number(raw)) ? raw : Number(raw))
          : field.kind === "boolean" ? raw === "true"
          : raw

        edits.push({ path: [entityId, fieldKeyRoot, ...itemPrefix, key], op: "set", value })
      }
    } else {
      const draftKey = pathKey(itemPrefix)
      const raw = draft[draftKey]

      if (raw === undefined || raw === String(item.value)) {
        return
      }

      edits.push({ path: [entityId, fieldKeyRoot, ...itemPrefix], op: "set", value: raw })
    }
  })

  return edits
}

function ListFieldEditor({ type, entityId, fieldKey, field, onApplied, onPreviewUrlChange }) {
  const [draft, setDraft] = useState(() => {
    const initial = {}

    initialDraftFor(field.items, [], initial)

    return initial
  })

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

  const edits = collectEdits(field.items, [], draft, entityId, fieldKey)

  async function handlePreview() {
    if (edits.length === 0) {
      return
    }

    await preview({ type, entityId, edits })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--wood-muted)]">
          {fieldKey}
        </label>

        {edits.length > 0 && <span className="text-[11px] text-[var(--wood-accent)]">{edits.length} changed</span>}
      </div>

      <div className="space-y-2">
        {
          field.items.map((item, index) => (
            <div key={index} className="rounded-xl border border-[var(--wood-border)] bg-[var(--wood-bg)] p-3">
              {
                item.fields
                  ? <ItemFields fields={item.fields} prefix={[index]} draft={draft} setDraft={setDraft} />
                  : (
                    <input
                      value={draft[pathKey([index])] ?? ""}
                      onChange={event => {
                        const value = event.target.value
                        setDraft(previous => ({ ...previous, [pathKey([index])]: value }))
                      }}
                      className="h-8 w-full rounded-lg border border-[var(--wood-border)] bg-[var(--wood-panel)] px-2 text-xs text-[var(--wood-text)] outline-none focus:border-[var(--wood-accent)]"
                    />
                  )
              }
            </div>
          ))
        }
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          disabled={edits.length === 0 || previewing}
          onClick={handlePreview}
          className="
            rounded-full border border-[var(--wood-accent)] bg-[var(--wood-accent)]
            px-4 py-1.5 text-sm font-medium text-[#17120c] transition-opacity
            disabled:cursor-not-allowed disabled:opacity-30
          "
        >
          {previewing ? "Previewing..." : `Preview ${edits.length || ""} change${edits.length === 1 ? "" : "s"}`}
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

export default ListFieldEditor
