import { useEffect, useMemo, useState } from "react"

import { apiGet } from "../../api/client"

import { usePatchPreview } from "./usePatchPreview"
import PatchPreviewPanel from "./PatchPreviewPanel"

/*
 * "Haluan että dev toolissa on excelin kaltainen kasa kortteja mitä
 * voin muokata vapaasti. kaikki on muokattavissa nimestä lähtien"
 * (Marc) - every entity of the selected type as a row, every scalar
 * field as a column, edit as many cells as you like, then ONE batched
 * preview/apply for the whole set (>=2 ops is already MEDIUM per
 * riskModel.js, which is the right gate for "I just changed 12
 * things"). `id` stays pinned + read-only (same reasoning as
 * EntityFieldEditor.jsx: it's the object's own key, not just a value -
 * renaming it here wouldn't rename the key or fix up other files that
 * reference it).
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

function SheetView({ type, onApplied, onPreviewUrlChange }) {
  const [entities, setEntities] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [query, setQuery] = useState("")
  const [edits, setEdits] = useState({})
  const [reloadKey, setReloadKey] = useState(0)

  const {
    result,
    applyMode,
    setApplyMode,
    previewing,
    applying,
    errorMessage: previewError,
    preview,
    discard,
    apply,
  } = usePatchPreview({
    onApplied: () => {
      setEdits({})
      setReloadKey(previous => previous + 1)
      onApplied?.()
    },
    onPreviewUrlChange,
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setErrorMessage("")

      try {
        const data = await apiGet(`/hearthwood-patchbay/entities?type=${type}`)

        if (!cancelled) {
          setEntities(data.entities || [])
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error.message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [type, reloadKey])

  useEffect(() => {
    setEdits({})
  }, [type])

  const columns = useMemo(() => {
    const seen = new Set()
    const ordered = []

    for (const entity of entities) {
      for (const [key, field] of Object.entries(entity.fields || {})) {
        // Complex fields (movePattern, effects, ...) are raw JS blocks -
        // unwieldy in a grid cell; EntityFieldEditor's single-entity view
        // is where those get edited (its own <textarea> per field).
        if (key !== "id" && field.kind !== "complex" && !seen.has(key)) {
          seen.add(key)
          ordered.push(key)
        }
      }
    }

    ordered.sort((a, b) => (a === "name" ? -1 : b === "name" ? 1 : 0))

    return ordered
  }, [entities])

  const filteredEntities = useMemo(() => {
    const needle = query.trim().toLowerCase()

    if (!needle) {
      return entities
    }

    return entities.filter(entity =>
      String(entity.id || "").toLowerCase().includes(needle)
      || String(entity.name || "").toLowerCase().includes(needle),
    )
  }, [entities, query])

  function cellValue(entity, field) {
    if (edits[entity.id]?.[field] !== undefined) {
      return edits[entity.id][field]
    }

    const cellField = entity.fields?.[field]

    return cellField ? String(cellField.value) : ""
  }

  function setCellValue(entity, field, raw) {
    setEdits(previous => ({
      ...previous,
      [entity.id]: { ...previous[entity.id], [field]: raw },
    }))
  }

  function isDirty(entity, field) {
    const cellField = entity.fields?.[field]

    if (!cellField) {
      return false
    }

    const editedValue = edits[entity.id]?.[field]

    return editedValue !== undefined && editedValue !== String(cellField.value)
  }

  const dirtyCount = Object.values(edits).reduce(
    (total, fields) => total + Object.keys(fields).length,
    0,
  )

  async function handlePreview() {
    const ops = []

    for (const entity of entities) {
      const entityEdits = edits[entity.id]

      if (!entityEdits) {
        continue
      }

      for (const [field, raw] of Object.entries(entityEdits)) {
        const cellField = entity.fields?.[field]

        if (!cellField || raw === String(cellField.value)) {
          continue
        }

        ops.push({
          path: [entity.id, field],
          op: "set",
          value: coerceValue(cellField.kind, raw),
        })
      }
    }

    if (ops.length === 0) {
      return
    }

    await preview({ type, edits: ops })
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--wood-border)] p-4">
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Hae nimellä tai id:llä..."
          className="
            h-9 w-64 rounded-full border border-[var(--wood-border)] bg-[var(--wood-bg)]
            px-4 text-xs text-[var(--wood-text)] outline-none
            placeholder:text-[var(--wood-muted)] focus:border-[var(--wood-accent)]
          "
        />

        <div className="flex items-center gap-2">
          {dirtyCount > 0 && <span className="text-xs text-[var(--wood-accent)]">{dirtyCount} muutettu</span>}

          <button
            type="button"
            disabled={dirtyCount === 0 || previewing}
            onClick={handlePreview}
            className="
              rounded-full border border-[var(--wood-accent)] bg-[var(--wood-accent)]
              px-4 py-1.5 text-sm font-medium text-[#17120c] transition-opacity
              disabled:cursor-not-allowed disabled:opacity-30
            "
          >
            {previewing ? "Esikatsellaan..." : `Esikatsele ${dirtyCount || ""} muutos${dirtyCount === 1 ? "" : "ta"}`}
          </button>
        </div>
      </div>

      {previewError && <div className="px-4 pt-2 text-xs text-red-300">{previewError}</div>}

      {
        result && (
          <div className="shrink-0 p-4">
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

      <div className="wood-scroll min-h-0 flex-1 overflow-auto">
        {loading && <div className="p-4 text-sm text-[var(--wood-muted)]">Ladataan...</div>}

        {errorMessage && <div className="p-4 text-xs text-red-300">{errorMessage}</div>}

        {
          !loading && !errorMessage && (
            <table className="w-full border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-[var(--wood-panel)]">
                <tr>
                  <th className="sticky left-0 z-20 min-w-[140px] border-b border-r border-[var(--wood-border)] bg-[var(--wood-panel)] px-3 py-2 text-left font-semibold text-[var(--wood-muted)]">
                    id
                  </th>

                  {
                    columns.map(field => (
                      <th key={field} className="min-w-[120px] border-b border-[var(--wood-border)] px-3 py-2 text-left font-semibold text-[var(--wood-muted)] whitespace-nowrap">
                        {field}
                      </th>
                    ))
                  }
                </tr>
              </thead>

              <tbody>
                {
                  filteredEntities.map(entity => (
                    <tr key={entity.id} className="hover:bg-[var(--wood-card)]/40">
                      <td className="sticky left-0 z-10 border-b border-r border-[var(--wood-border)] bg-[var(--wood-bg)] px-3 py-1.5 font-mono text-[var(--wood-muted)] whitespace-nowrap">
                        {entity.id}
                      </td>

                      {
                        columns.map(field => {
                          const cellField = entity.fields?.[field]
                          const dirty = isDirty(entity, field)

                          return (
                            <td key={field} className="border-b border-[var(--wood-border)] p-0.5">
                              {
                                cellField
                                  ? (
                                    <input
                                      value={cellValue(entity, field)}
                                      onChange={event => setCellValue(entity, field, event.target.value)}
                                      className={`
                                        h-7 w-full min-w-[110px] rounded border bg-transparent px-1.5
                                        text-[var(--wood-text)] outline-none
                                        focus:border-[var(--wood-accent)] focus:bg-[var(--wood-bg)]
                                        ${dirty ? "border-[var(--wood-accent)] bg-[var(--wood-bg)]" : "border-transparent"}
                                      `}
                                    />
                                  )
                                  : <span className="block px-1.5 text-[var(--wood-muted)]">—</span>
                              }
                            </td>
                          )
                        })
                      }
                    </tr>
                  ))
                }
              </tbody>
            </table>
          )
        }
      </div>
    </div>
  )
}

export default SheetView
