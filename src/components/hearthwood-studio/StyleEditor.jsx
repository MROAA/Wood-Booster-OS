import { useEffect, useMemo, useState } from "react"

import { apiGet } from "../../api/client"

import { usePatchPreview } from "./usePatchPreview"
import PatchPreviewPanel from "./PatchPreviewPanel"

/*
 * "Hieroa UI" (Marc's own PRD term) - browse heartwood.css's rules and
 * tweak a declaration's value (a colour, a size) through the same
 * preview/apply/revert flow as every other edit here. riskModel.js
 * already forces any CSS edit to at least MEDIUM ("vain esikatselu
 * paljastaa ulkoasuvirheen" - vite build can't see a visual
 * regression), which is why this always shows a live preview before
 * confirming.
 *
 * The backend's generic /preview only builds a CSS proposal from the
 * FIRST edit in the array (applyPatch.js's resolveProposal) - CSS
 * edits are one declaration at a time, not batched like entity field
 * edits. So each declaration gets its own small preview/apply
 * mini-flow (its own usePatchPreview instance) rather than one shared
 * batch like EntityFieldEditor/SheetView.
 */
function DeclarationRow({ selector, prop, currentValue, onApplied, onPreviewUrlChange }) {
  const [value, setValue] = useState(currentValue)

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

  const changed = value !== currentValue

  async function handlePreview() {
    if (!changed) {
      return
    }

    await preview({ edits: [{ selector, prop, value }] })
  }

  return (
    <div className="space-y-2 rounded-lg border border-[var(--wood-border)] bg-[var(--wood-bg)] p-2">
      <div className="flex items-center gap-2">
        <span className="w-40 shrink-0 truncate font-mono text-xs text-[var(--wood-muted)]" title={prop}>
          {prop}
        </span>

        <input
          value={value}
          onChange={event => setValue(event.target.value)}
          className={`
            h-8 flex-1 rounded-lg border bg-[var(--wood-panel)] px-2 font-mono text-xs
            text-[var(--wood-text)] outline-none focus:border-[var(--wood-accent)]
            ${changed ? "border-[var(--wood-accent)]" : "border-[var(--wood-border)]"}
          `}
        />

        <button
          type="button"
          disabled={!changed || previewing}
          onClick={handlePreview}
          className="
            shrink-0 rounded-full border border-[var(--wood-accent)] bg-[var(--wood-accent)]
            px-3 py-1 text-xs font-medium text-[#17120c] transition-opacity
            disabled:cursor-not-allowed disabled:opacity-30
          "
        >
          {previewing ? "..." : "Esikatsele"}
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

function StyleEditor({ onApplied, onPreviewUrlChange }) {
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [query, setQuery] = useState("")
  const [selectedRuleKey, setSelectedRuleKey] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setErrorMessage("")

      try {
        const data = await apiGet("/hearthwood-patchbay/styles")

        if (!cancelled) {
          // heartwood.css legitimately repeats the same selector across
          // separate rule blocks (multiple @keyframes each with their
          // own 0%/100% steps, a class re-opened later in the file for
          // a different property group) - `rule.selector` alone isn't a
          // stable React key or a unique way to select one, so each
          // rule gets its position in the file as an identity.
          const withKeys = (data.rules || []).map((rule, index) => ({ ...rule, ruleKey: index }))

          setRules(withKeys)
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

  const filteredRules = useMemo(() => {
    const needle = query.trim().toLowerCase()

    if (!needle) {
      return rules
    }

    return rules.filter(rule => rule.selector.toLowerCase().includes(needle))
  }, [rules, query])

  const selectedRule = rules.find(rule => rule.ruleKey === selectedRuleKey)

  function handleApplied() {
    setReloadKey(previous => previous + 1)
    onApplied?.()
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-[280px_1fr] gap-4">
      <div className="flex min-h-0 flex-col">
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Hae valitsinta (esim. .hw-card)..."
          className="
            mb-2 h-9 w-full shrink-0 rounded-full border border-[var(--wood-border)] bg-[var(--wood-bg)]
            px-4 text-xs text-[var(--wood-text)] outline-none
            placeholder:text-[var(--wood-muted)] focus:border-[var(--wood-accent)]
          "
        />

        <div className="wood-scroll min-h-0 flex-1 space-y-1 overflow-y-auto">
          {loading && <div className="px-2 py-1 text-xs text-[var(--wood-muted)]">Ladataan...</div>}
          {errorMessage && <div className="px-2 py-1 text-xs text-red-300">{errorMessage}</div>}

          {
            filteredRules.map(rule => (
              <button
                key={rule.ruleKey}
                type="button"
                onClick={() => setSelectedRuleKey(rule.ruleKey)}
                className={`
                  w-full truncate rounded-lg border px-3 py-1.5 text-left font-mono text-xs transition-colors
                  ${
                    selectedRuleKey === rule.ruleKey
                      ? "border-[var(--wood-accent)] bg-[var(--wood-card)] text-[var(--wood-text)]"
                      : "border-transparent text-[var(--wood-muted)] hover:bg-[var(--wood-card)] hover:text-[var(--wood-text)]"
                  }
                `}
              >
                {rule.selector}
                {rule.declarations.length > 0 && (
                  <span className="ml-1 text-[var(--wood-muted)]">({rule.declarations.length})</span>
                )}
              </button>
            ))
          }
        </div>
      </div>

      <div className="wood-scroll min-h-0 overflow-y-auto">
        {
          !selectedRule
            ? (
              <div className="p-4 text-sm text-[var(--wood-muted)]">
                Valitse valitsin vasemmalta nähdäksesi sen ominaisuudet.
              </div>
            )
            : (
              <div className="space-y-2 p-1">
                <div className="mb-2 font-mono text-sm font-semibold text-[var(--wood-text)]">
                  {selectedRule.selector}
                </div>

                {
                  selectedRule.declarations.map((decl, index) => (
                    <DeclarationRow
                      key={`${decl.prop}-${index}`}
                      selector={selectedRule.selector}
                      prop={decl.prop}
                      currentValue={decl.value}
                      onApplied={handleApplied}
                      onPreviewUrlChange={onPreviewUrlChange}
                    />
                  ))
                }
              </div>
            )
        }
      </div>
    </div>
  )
}

export default StyleEditor
