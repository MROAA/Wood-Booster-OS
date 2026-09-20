import { useEffect, useMemo, useState } from "react"

import { apiGet } from "../../api/client"

import { usePatchPreview } from "./usePatchPreview"
import PatchPreviewPanel from "./PatchPreviewPanel"

const ROOT_SELECTOR = ".hw-root"

const HEX_PATTERN = /^#[0-9a-fA-F]{3,8}$/

// Simple prop-name buckets so the panel reads as "Colors" then
// "Typography & Spacing" instead of one flat 30-row list (Marc:
// "laita fiksusti kaikki nippuun silleen että se on selkeä muokata") -
// just section headers on one page, nothing hidden behind a click.
const COLOR_HINTS = [
  "bg", "panel", "card", "border", "text", "muted", "ember", "moss", "rune",
  "curse", "hp", "tide", "gale", "stone", "shadow", "wood", "cosmic", "accent",
  "mev-accent", "runend-divider-color",
]

function isColorProp(prop) {
  const name = prop.replace(/^--hw-/, "")
  return COLOR_HINTS.some(hint => name === hint || name.startsWith(`${hint}-`) || name.endsWith(`-${hint}`))
}

/*
 * Colors & Theme - Marc, 2026-09-20: "haluan myös jotenkin muokata
 * pelin visuaalista ilmettä" / "mutta haluan muokata siitä kokoajan
 * parempaa" (I want to keep making it better, continuously). Edits the
 * .hw-root custom properties in heartwood.css - the single place the
 * whole game's palette/type/spacing scale is already centralized - so
 * this is genuinely "the whole game's look," not one screen's colors.
 *
 * Same shape as SheetView.jsx: edit freely, batch-preview, one
 * confirm/apply. A CSS edit is already forced to at least MEDIUM risk
 * (preview + confirm, never silently auto-applied) by riskModel.js.
 */
function ThemePanel({ onApplied, onPreviewUrlChange }) {
  const [rules, setRules] = useState([])
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
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
        const data = await apiGet("/hearthwood-patchbay/styles")

        if (!cancelled) {
          setFile(data.file)
          // heartwood.css defines .hw-root in TWO separate blocks (the
          // core palette/scale, then later a timing/easing block) - merge
          // every declaration from every block sharing this selector so
          // nothing (e.g. the --hw-dur-*/--hw-ease-out tokens) is silently
          // missing from the panel.
          const rootRules = (data.rules || []).filter(rule => rule.selector.replace(/\s+/g, " ").trim() === ROOT_SELECTOR)
          setRules(rootRules.flatMap(rule => rule.declarations || []))
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
  }, [reloadKey])

  const { colorRows, otherRows } = useMemo(() => {
    const colors = []
    const other = []

    for (const decl of rules) {
      if (!decl.prop.startsWith("--hw-")) {
        continue
      }

      (isColorProp(decl.prop) ? colors : other).push(decl)
    }

    return { colorRows: colors, otherRows: other }
  }, [rules])

  function currentValue(decl) {
    return edits[decl.prop] !== undefined ? edits[decl.prop] : decl.value
  }

  function setValue(decl, raw) {
    setEdits(previous => ({ ...previous, [decl.prop]: raw }))
  }

  function isDirty(decl) {
    return edits[decl.prop] !== undefined && edits[decl.prop] !== decl.value
  }

  const dirtyCount = Object.keys(edits).filter(prop => {
    const decl = rules.find(d => d.prop === prop)
    return decl && edits[prop] !== decl.value
  }).length

  async function handlePreview() {
    const cssEdits = []

    for (const decl of rules) {
      const raw = edits[decl.prop]

      if (raw === undefined || raw === decl.value) {
        continue
      }

      cssEdits.push({ selector: ROOT_SELECTOR, prop: decl.prop, value: raw, filePath: file })
    }

    if (cssEdits.length === 0) {
      return
    }

    await preview({ edits: cssEdits })
  }

  function Row({ decl }) {
    const value = currentValue(decl)
    const dirty = isDirty(decl)
    const looksHex = HEX_PATTERN.test(value)

    return (
      <div className="flex items-center gap-2 py-1">
        <code className="w-44 shrink-0 truncate text-xs text-[var(--wood-muted)]" title={decl.prop}>
          {decl.prop.replace(/^--hw-/, "")}
        </code>

        {
          looksHex && (
            <input
              type="color"
              value={value}
              onChange={event => setValue(decl, event.target.value)}
              className="h-7 w-9 shrink-0 cursor-pointer rounded border border-[var(--wood-border)] bg-transparent p-0"
            />
          )
        }

        <input
          value={value}
          onChange={event => setValue(decl, event.target.value)}
          className={`
            h-7 flex-1 min-w-0 rounded border bg-transparent px-2 font-mono text-xs
            text-[var(--wood-text)] outline-none
            focus:border-[var(--wood-accent)] focus:bg-[var(--wood-bg)]
            ${dirty ? "border-[var(--wood-accent)] bg-[var(--wood-bg)]" : "border-transparent"}
          `}
        />
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--wood-border)] p-4">
        <div className="text-sm text-[var(--wood-muted)]">
          Editing <code className="text-[var(--wood-text)]">{ROOT_SELECTOR}</code> in {file || "heartwood.css"} - the whole game's shared palette, type scale and spacing.
        </div>

        <div className="flex items-center gap-2">
          {dirtyCount > 0 && <span className="text-xs text-[var(--wood-accent)]">{dirtyCount} changed</span>}

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
            {previewing ? "Previewing..." : `Preview ${dirtyCount || ""} change${dirtyCount === 1 ? "" : "s"}`}
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

      <div className="wood-scroll min-h-0 flex-1 overflow-auto p-4 space-y-6">
        {loading && <div className="text-sm text-[var(--wood-muted)]">Loading...</div>}

        {errorMessage && <div className="text-xs text-red-300">{errorMessage}</div>}

        {
          !loading && !errorMessage && (
            <>
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--wood-muted)]">
                  Colors
                </div>
                <div className="space-y-0.5">
                  {colorRows.map(decl => <Row key={decl.prop} decl={decl} />)}
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--wood-muted)]">
                  Typography, spacing & motion
                </div>
                <div className="space-y-0.5">
                  {otherRows.map(decl => <Row key={decl.prop} decl={decl} />)}
                </div>
              </div>
            </>
          )
        }
      </div>
    </div>
  )
}

export default ThemePanel
