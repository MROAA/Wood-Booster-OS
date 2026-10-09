import { useState } from "react"

import { MUTATIONS, MUTATION_KINDS } from "../../data/heartwood/mutations"
import { usePatchPreview } from "./usePatchPreview"
import PatchPreviewPanel from "./PatchPreviewPanel"

/*
 * Breeding & Mutations sprint - the MUTATION EDITOR. Marc edits every
 * Mewgenics-style mutation in plain words (name, what it says, good /
 * mixed / bad, how often it shows up). The numbers that make it work in
 * a fight sit behind "Show the numbers". Edits go through the same
 * preview -> apply -> one-click revert flow as every other Studio editor
 * (type "mutations" in the patchbay -> data/heartwood/mutations.js).
 */

const FRIENDLY = [
  ["name", "Name", "text"],
  ["text", "What the player reads", "text"],
  ["kind", "Good, mixed or bad (good / mixed / bad)", "text"],
  ["weight", "How often it shows up (0 = never by chance)", "number"],
]

const FX_LABEL = {
  hp: "Max HP +/-",
  hpPct: "Max HP % +/-",
  attack: "Attack +/-",
  move: "Movement +/-",
  range: "Range +/- (ranged heroes)",
  apStart: "AP on the first turn +/-",
  ward: "Ward at fight start",
  evade: "Evade at fight start",
  aim: "% to hit +/-",
  thorns: "Strikes back for",
  regen: "Mends HP each turn",
  block: "Block each turn",
  fireOnHit: "Burn added per hit",
  frostOnHit: "Chill added per hit",
  poisonOnHit: "Poison added per hit",
  natureOnHit: "Entangle per hit",
  leech: "Heals per landed hit",
  manaMax: "Max resource +/-",
  manaRegen: "Resource each turn +/-",
  manaStartPct: "Starts fights with +% resource",
  gills: "Resource per turn near water",
  echo: "AP refunded by its first skill",
}

function coerce(kind, raw) {
  if (kind === "number") {
    const n = Number(raw)
    return Number.isNaN(n) ? raw : n
  }
  return raw
}

function Field({ label, value, kind, changed, onChange, testId }) {
  return (
    <label className="block space-y-1">
      <div className="text-[11px] text-[var(--wood-muted)]">
        {label}
        {changed && <span className="ml-1 text-[var(--wood-accent)]">●</span>}
      </div>
      <input
        data-field={testId}
        type={kind === "number" ? "number" : "text"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`h-8 w-full rounded-lg border bg-[var(--wood-bg)] px-2 text-xs text-[var(--wood-text)] outline-none focus:border-[var(--wood-accent)] ${changed ? "border-[var(--wood-accent)]" : "border-[var(--wood-border)]"}`}
      />
    </label>
  )
}

function MutationEditor({ onApplied, onPreviewUrlChange }) {
  const ids = Object.keys(MUTATIONS)
  const [mutId, setMutId] = useState(ids[0])
  const [draft, setDraft] = useState({})
  const [showNumbers, setShowNumbers] = useState(false)
  const { result, applyMode, setApplyMode, previewing, applying, errorMessage, preview, discard, apply } = usePatchPreview({
    onApplied: () => {
      setDraft({})
      onApplied?.()
    },
    onPreviewUrlChange,
  })
  const mut = MUTATIONS[mutId]

  // draft keys: "name", "fx.attack"
  const current = (key) => {
    const [a, b] = key.split(".")
    return a === "fx" ? mut.fx?.[b] : mut[a]
  }
  const valueOf = (key) => (draft[key] !== undefined ? draft[key] : String(current(key) ?? ""))
  const changedKeys = Object.keys(draft).filter((k) => String(current(k) ?? "") !== draft[k])
  const kindOf = (key) => (typeof current(key) === "number" ? "number" : "text")

  function pick(id) {
    setMutId(id)
    setDraft({})
  }

  async function handlePreview() {
    if (!changedKeys.length) return
    const edits = changedKeys.map((key) => {
      const [a, b] = key.split(".")
      return { path: a === "fx" ? [mutId, "fx", b] : [mutId, a], op: "set", value: coerce(kindOf(key), draft[key]) }
    })
    await preview({ type: "mutations", entityId: mutId, edits })
  }

  return (
    <div className="flex h-full" data-testid="mutation-editor">
      <div className="w-[230px] shrink-0 overflow-y-auto wood-scroll border-r border-[var(--wood-border)] p-3 space-y-1">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--wood-muted)]">Mutations</div>
        {ids.map((id) => (
          <button
            key={id}
            type="button"
            data-mutation={id}
            onClick={() => pick(id)}
            className={`w-full rounded-lg px-2 py-1.5 text-left text-sm ${id === mutId ? "bg-[var(--wood-accent)] text-[#17120c]" : "text-[var(--wood-text)] hover:bg-[var(--wood-bg)]"}`}
          >
            {MUTATIONS[id].icon} {MUTATIONS[id].name}
            <div className={`text-[10px] ${id === mutId ? "text-[#2a2010]" : ""}`} style={id === mutId ? undefined : { color: MUTATION_KINDS[MUTATIONS[id].kind]?.color }}>
              {MUTATION_KINDS[MUTATIONS[id].kind]?.name || MUTATIONS[id].kind}
            </div>
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto wood-scroll p-4 space-y-4">
        <div>
          <div className="text-lg font-bold text-[var(--wood-text)]" data-testid="mutation-title">
            {mut.icon} {mut.name}
          </div>
          <p className="mt-1 text-xs text-[var(--wood-muted)]">{mut.text}</p>
          <p className="mt-1 text-[11px]" style={{ color: MUTATION_KINDS[mut.kind]?.color }}>
            {MUTATION_KINDS[mut.kind]?.name || mut.kind} mutation
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {FRIENDLY.map(([key, label, kind]) => (
            <Field key={key} testId={key} label={label} kind={kind} value={valueOf(key)} changed={changedKeys.includes(key)} onChange={(v) => setDraft((d) => ({ ...d, [key]: v }))} />
          ))}
        </div>

        <button type="button" data-testid="mutation-numbers-toggle" onClick={() => setShowNumbers((v) => !v)} className="text-xs text-[var(--wood-accent)] underline">
          {showNumbers ? "Hide the numbers" : "Show the numbers (what it does in a fight, icon)"}
        </button>
        {showNumbers && (
          <div className="grid grid-cols-2 gap-2" data-testid="mutation-numbers">
            <Field testId="icon" label="Icon" kind="text" value={valueOf("icon")} changed={changedKeys.includes("icon")} onChange={(v) => setDraft((d) => ({ ...d, icon: v }))} />
            {Object.keys(mut.fx || {}).map((k) => (
              <Field key={k} testId={`fx.${k}`} label={FX_LABEL[k] || k} kind="number" value={valueOf(`fx.${k}`)} changed={changedKeys.includes(`fx.${k}`)} onChange={(v) => setDraft((d) => ({ ...d, [`fx.${k}`]: v }))} />
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="mutation-preview"
            disabled={previewing || !changedKeys.length}
            onClick={handlePreview}
            className="rounded-lg bg-[var(--wood-accent)] px-3 py-1.5 text-xs font-semibold text-[#17120c] disabled:opacity-40"
          >
            {previewing ? "Preparing..." : `Preview ${changedKeys.length || ""} change(s)`}
          </button>
          {changedKeys.length > 0 && (
            <button type="button" onClick={() => setDraft({})} className="text-xs text-[var(--wood-muted)] underline">
              Undo edits
            </button>
          )}
        </div>
        {errorMessage && <div className="text-xs text-red-400">{errorMessage}</div>}
        <PatchPreviewPanel result={result} applyMode={applyMode} onApplyModeChange={setApplyMode} onDiscard={discard} onApply={apply} applying={applying} />
      </div>
    </div>
  )
}

export default MutationEditor
