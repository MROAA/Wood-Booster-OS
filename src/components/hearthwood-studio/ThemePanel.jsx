import { useEffect, useMemo, useState } from "react"

import { apiGet } from "../../api/client"

import { usePatchPreview } from "./usePatchPreview"
import PatchPreviewPanel from "./PatchPreviewPanel"

const ROOT_SELECTOR = ".hw-root"

const HEX_PATTERN = /^#[0-9a-fA-F]{3,8}$/

// Marc, right after PR #529 shipped: "en osaa nuita colors & theme se
// on liian vaikeaa minulle" (I can't do that colors & theme stuff,
// it's too hard for me) - a flat list of 59 rows of raw CSS variable
// names (--hw-fib-3, --hw-surface-shadow, cubic-bezier(...) values) was
// never going to read as "helppokäyttöinen" no matter how it was
// grouped. Fix: show ONLY the 8 colors that are actually meaningful to
// pick (the HP color + the 7 tribe colors, all already plain hex in
// the CSS, no resolution needed) as big labeled swatches, in plain
// English, no CSS names visible at all. Everything else (base UI
// chrome colors that are shared app-wide tokens, plus fonts/spacing/
// animation timing) moves behind an explicitly-optional "Advanced"
// toggle, collapsed by default, for later/power use - not deleted,
// just no longer the first thing Marc has to make sense of.
const FRIENDLY_COLORS = [
  { prop: "--hw-hp", label: "Health & Damage" },
  { prop: "--hw-tide", label: "Water Tribe" },
  { prop: "--hw-gale", label: "Wind Tribe" },
  { prop: "--hw-stone", label: "Stone Tribe" },
  { prop: "--hw-shadow", label: "Shadow Tribe" },
  { prop: "--hw-wood", label: "Wood Tribe" },
  { prop: "--hw-tribe-ember", label: "Ember Tribe" },
  { prop: "--hw-cosmic", label: "Cosmic Tribe" },
]

const FRIENDLY_PROPS = new Set(FRIENDLY_COLORS.map(entry => entry.prop))

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
 * Colors & Theme - edits the .hw-root custom properties in
 * heartwood.css, the one place the whole game's palette/type/spacing
 * scale is centralized. Same edit -> batched preview -> confirm/apply
 * flow as every other Studio editor (SheetView.jsx). A CSS edit is
 * already forced to at least MEDIUM risk (preview + confirm, never
 * silently auto-applied) by riskModel.js.
 */
function ThemePanel({ onApplied, onPreviewUrlChange }) {
  const [rules, setRules] = useState([])
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [edits, setEdits] = useState({})
  const [reloadKey, setReloadKey] = useState(0)
  const [showAdvanced, setShowAdvanced] = useState(false)

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
          // missing.
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

  const { friendlyRows, advancedColorRows, advancedOtherRows } = useMemo(() => {
    const friendly = []
    const advancedColors = []
    const other = []

    for (const decl of rules) {
      if (!decl.prop.startsWith("--hw-")) {
        continue
      }

      if (FRIENDLY_PROPS.has(decl.prop)) {
        friendly.push(decl)
        continue
      }

      (isColorProp(decl.prop) ? advancedColors : other).push(decl)
    }

    return { friendlyRows: friendly, advancedColorRows: advancedColors, advancedOtherRows: other }
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

  function Swatch({ decl, label }) {
    const value = currentValue(decl)
    const dirty = isDirty(decl)

    return (
      <label className="flex cursor-pointer flex-col items-center gap-2">
        <input
          type="color"
          value={HEX_PATTERN.test(value) ? value : "#888888"}
          onChange={event => setValue(decl, event.target.value)}
          className={`
            h-16 w-16 cursor-pointer rounded-xl border-2 bg-transparent p-0
            ${dirty ? "border-[var(--wood-accent)]" : "border-[var(--wood-border)]"}
          `}
        />
        <span className="text-center text-xs text-[var(--wood-text)]">{label}</span>
      </label>
    )
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
          Click a color to change it. Every game screen updates to match.
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
              <div className="grid grid-cols-4 gap-4 sm:grid-cols-8">
                {
                  FRIENDLY_COLORS.map(entry => {
                    const decl = friendlyRows.find(d => d.prop === entry.prop)
                    return decl ? <Swatch key={entry.prop} decl={decl} label={entry.label} /> : null
                  })
                }
              </div>

              <button
                type="button"
                onClick={() => setShowAdvanced(previous => !previous)}
                className="text-xs text-[var(--wood-muted)] underline decoration-dotted hover:text-[var(--wood-text)]"
              >
                {showAdvanced ? "Hide advanced options" : "Show advanced options (fonts, spacing, more colors)"}
              </button>

              {
                showAdvanced && (
                  <>
                    <div>
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--wood-muted)]">
                        More colors
                      </div>
                      <div className="space-y-0.5">
                        {advancedColorRows.map(decl => <Row key={decl.prop} decl={decl} />)}
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--wood-muted)]">
                        Typography, spacing & motion
                      </div>
                      <div className="space-y-0.5">
                        {advancedOtherRows.map(decl => <Row key={decl.prop} decl={decl} />)}
                      </div>
                    </div>
                  </>
                )
              }
            </>
          )
        }
      </div>
    </div>
  )
}

export default ThemePanel
