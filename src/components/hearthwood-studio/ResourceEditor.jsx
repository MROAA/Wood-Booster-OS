import { useMemo, useState } from "react"

import { RESOURCES, GAIN_TEXT, GAUGE_STYLES } from "../../data/heartwood/resources"
import { CLASSES } from "../../data/heartwood/classes"
import { usePatchPreview } from "./usePatchPreview"
import PatchPreviewPanel from "./PatchPreviewPanel"

/*
 * Resources step 2 - the RESOURCE EDITOR (Mana & Skill Resource PRD
 * §61-63). Marc tunes every class resource (Rage, Combo, Holy Power...)
 * here in plain words: how big it is, how it starts, how it is built,
 * what each 25/50/75/100% step gives - and which class uses which
 * resource. Technical fields (gauge style, colour, cost scaling...) sit
 * behind "Show advanced options". Edits go through the same preview ->
 * apply -> one-click revert flow as every other Studio editor
 * (types "resources" and "classes" in the patchbay).
 */

const FRIENDLY = [
  ["name", "Name", "text"],
  ["max", "Biggest it can get (0 = the class's own mana pool)", "number"],
  ["startPct", "Heroes start each fight at (% of max)", "number"],
  ["regen", "Refills by itself each turn", "number"],
  ["decay", "Drains away each turn", "number"],
]
const ADVANCED = [
  ["short", "Short label on buttons", "text"],
  ["icon", "Icon", "text"],
  ["color", "Colour", "text"],
  ["gauge", `Gauge style (${GAUGE_STYLES.join(", ")})`, "text"],
  ["enemyStartPct", "Enemies start at (% of max)", "number"],
  ["regenPct", "Refills % of max each turn", "number"],
  ["decayWhen", "Drains when (always / idle)", "text"],
  ["overflow", "Extra above max becomes Overcharge (true / false)", "boolean"],
  ["costScale", "Signature-ability price scale", "number"],
  ["drainable", "Enemies can drain it (true / false)", "boolean"],
  ["special", "Special rule (read-only)", "readonly"],
]
const BP_KEYS = [
  ["dmg", "+damage"],
  ["aim", "+% to hit"],
  ["heal", "+healing"],
  ["guard", "takes less"],
  ["taken", "takes more"],
  ["skillPct", "skill +%"],
  ["cheaper", "% cheaper"],
]

const BP_SAY = {
  dmg: (v) => `+${v} damage`,
  aim: (v) => `+${v}% to hit`,
  heal: (v) => `+${v} healing`,
  guard: (v) => `takes ${v} less`,
  taken: (v) => `takes ${v} more`,
  skillPct: (v) => `skills +${v}%`,
  cheaper: (v) => `skills ${v}% cheaper`,
}

function usedBy(resId) {
  return Object.values(CLASSES).filter((c) => (c.resource || "arcane") === resId).map((c) => c.name)
}

function coerce(kind, raw) {
  if (kind === "number") {
    const n = Number(raw)
    return Number.isNaN(n) ? raw : n
  }
  if (kind === "boolean") return raw === true || raw === "true"
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
        readOnly={kind === "readonly"}
        onChange={(event) => onChange(event.target.value)}
        className={`h-8 w-full rounded-lg border bg-[var(--wood-bg)] px-2 text-xs text-[var(--wood-text)] outline-none focus:border-[var(--wood-accent)] ${changed ? "border-[var(--wood-accent)]" : "border-[var(--wood-border)]"}`}
      />
    </label>
  )
}

function ResourceEditor({ onApplied, onPreviewUrlChange }) {
  const ids = Object.keys(RESOURCES)
  const [resId, setResId] = useState(ids[0])
  const [draft, setDraft] = useState({})
  const [classDraft, setClassDraft] = useState({})
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showClasses, setShowClasses] = useState(false)
  const { result, applyMode, setApplyMode, previewing, applying, errorMessage, preview, discard, apply } = usePatchPreview({
    onApplied: () => {
      setDraft({})
      setClassDraft({})
      onApplied?.()
    },
    onPreviewUrlChange,
  })
  const prof = RESOURCES[resId]

  // draft keys: "max", "gain.hit", "bp.1.dmg"
  const current = (key) => {
    const [a, b, c] = key.split(".")
    if (a === "gain") return prof.gain?.[b]
    if (a === "bp") return prof.breakpoints?.[Number(b)]?.[c]
    return prof[a]
  }
  const valueOf = (key) => (draft[key] !== undefined ? draft[key] : String(current(key) ?? ""))
  const changedKeys = Object.keys(draft).filter((k) => String(current(k) ?? "") !== draft[k])
  const changedClasses = Object.entries(classDraft).filter(([cid, r]) => (CLASSES[cid].resource || "arcane") !== r)

  const kindOf = (key) => {
    const v = current(key)
    return typeof v === "number" ? "number" : typeof v === "boolean" ? "boolean" : "text"
  }

  function pick(id) {
    setResId(id)
    setDraft({})
  }

  async function handlePreview() {
    if (changedClasses.length && !changedKeys.length) {
      await preview({ type: "classes", entityId: changedClasses[0][0], edits: changedClasses.map(([c, res]) => ({ path: [c, "resource"], op: "set", value: res })) })
      return
    }
    if (!changedKeys.length) return
    const edits = changedKeys.map((key) => {
      const [a, b, c] = key.split(".")
      const path = a === "gain" ? [resId, "gain", b] : a === "bp" ? [resId, "breakpoints", Number(b), c] : [resId, a]
      return { path, op: "set", value: coerce(kindOf(key), draft[key]) }
    })
    await preview({ type: "resources", entityId: resId, edits })
  }

  const users = useMemo(() => usedBy(resId), [resId])

  return (
    <div className="flex h-full" data-testid="resource-editor">
      <div className="w-[230px] shrink-0 overflow-y-auto wood-scroll border-r border-[var(--wood-border)] p-3 space-y-1">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--wood-muted)]">Hero resources</div>
        {ids.map((id) => (
          <button
            key={id}
            type="button"
            data-resource={id}
            onClick={() => pick(id)}
            className={`w-full rounded-lg px-2 py-1.5 text-left text-sm ${id === resId ? "bg-[var(--wood-accent)] text-[#17120c]" : "text-[var(--wood-text)] hover:bg-[var(--wood-bg)]"}`}
          >
            <span style={{ color: id === resId ? undefined : RESOURCES[id].color }}>{RESOURCES[id].icon}</span> {RESOURCES[id].name}
            <div className={`text-[10px] ${id === resId ? "text-[#2a2010]" : "text-[var(--wood-muted)]"}`}>{usedBy(id).join(", ") || "no class yet"}</div>
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto wood-scroll p-4 space-y-4">
        <div>
          <div className="text-lg font-bold text-[var(--wood-text)]" data-testid="resource-title">
            <span style={{ color: prof.color }}>{prof.icon}</span> {prof.name}
          </div>
          <p className="mt-1 text-xs text-[var(--wood-muted)]">{prof.text}</p>
          <p className="mt-1 text-[11px] text-[var(--wood-accent)]">Used by: {users.join(", ") || "no class"}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {FRIENDLY.map(([key, label, kind]) => (
            <Field key={key} testId={key} label={label} kind={kind} value={valueOf(key)} changed={changedKeys.includes(key)} onChange={(v) => setDraft((d) => ({ ...d, [key]: v }))} />
          ))}
        </div>

        {Object.keys(prof.gain || {}).length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--wood-muted)]">How it is built</div>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(prof.gain).map((g) => (
                <Field key={g} testId={`gain.${g}`} label={`+N ${GAIN_TEXT[g] || g}`} kind="number" value={valueOf(`gain.${g}`)} changed={changedKeys.includes(`gain.${g}`)} onChange={(v) => setDraft((d) => ({ ...d, [`gain.${g}`]: v }))} />
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--wood-muted)]">Power steps (25 / 50 / 75 / 100%)</div>
          {(prof.breakpoints || []).map((b, i) => (
            <div key={b.at} className="rounded-lg border border-[var(--wood-border)] p-2">
              <div className="mb-1 text-xs text-[var(--wood-text)]">
                At {b.at}%:{" "}
                {BP_KEYS.filter(([k]) => b[k]).map(([k]) => BP_SAY[k](b[k])).join(", ") || (b.empower ? "the next skill is Empowered (+50%)" : b.berserk ? "Berserk" : b.grand ? "Grand Curse" : b.storm ? "the Storm" : "-")}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Field testId={`bp.${i}.name`} label="Name" kind="text" value={valueOf(`bp.${i}.name`)} changed={changedKeys.includes(`bp.${i}.name`)} onChange={(v) => setDraft((d) => ({ ...d, [`bp.${i}.name`]: v }))} />
                {BP_KEYS.filter(([k]) => typeof b[k] === "number").map(([k, word]) => (
                  <Field key={k} testId={`bp.${i}.${k}`} label={word} kind="number" value={valueOf(`bp.${i}.${k}`)} changed={changedKeys.includes(`bp.${i}.${k}`)} onChange={(v) => setDraft((d) => ({ ...d, [`bp.${i}.${k}`]: v }))} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <button type="button" data-testid="resource-advanced-toggle" onClick={() => setShowAdvanced((v) => !v)} className="text-xs text-[var(--wood-accent)] underline">
          {showAdvanced ? "Hide advanced options" : "Show advanced options (look, colours, enemy start, scaling)"}
        </button>
        {showAdvanced && (
          <div className="grid grid-cols-2 gap-2" data-testid="resource-advanced">
            {ADVANCED.map(([key, label, kind]) => (
              <Field key={key} testId={key} label={label} kind={kind} value={valueOf(key)} changed={changedKeys.includes(key)} onChange={(v) => setDraft((d) => ({ ...d, [key]: v }))} />
            ))}
          </div>
        )}

        <button type="button" data-testid="class-assign-toggle" onClick={() => setShowClasses((v) => !v)} className="block text-xs text-[var(--wood-accent)] underline">
          {showClasses ? "Hide which class uses which resource" : "Change which class uses which resource"}
        </button>
        {showClasses && (
          <div className="grid grid-cols-2 gap-2" data-testid="class-assign">
            {Object.values(CLASSES).map((c) => (
              <label key={c.id} className="flex items-center justify-between gap-2 text-xs text-[var(--wood-text)]">
                <span>
                  {c.icon} {c.name}
                </span>
                <select
                  data-class={c.id}
                  value={classDraft[c.id] ?? c.resource ?? "arcane"}
                  onChange={(e) => setClassDraft((d) => ({ ...d, [c.id]: e.target.value }))}
                  className="h-7 rounded border border-[var(--wood-border)] bg-[var(--wood-bg)] px-1 text-xs"
                >
                  {ids.map((id) => (
                    <option key={id} value={id}>
                      {RESOURCES[id].name}
                    </option>
                  ))}
                </select>
              </label>
            ))}
            <p className="col-span-2 text-[10px] text-[var(--wood-muted)]">Skill prices stay in the class's numbers - after moving a class to another resource, check its skill prices under Hero Classes.</p>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="resource-preview"
            disabled={previewing || (!changedKeys.length && !changedClasses.length)}
            onClick={handlePreview}
            className="rounded-lg bg-[var(--wood-accent)] px-3 py-1.5 text-xs font-semibold text-[#17120c] disabled:opacity-40"
          >
            {previewing ? "Preparing..." : `Preview ${changedKeys.length + changedClasses.length || ""} change(s)`}
          </button>
          {(changedKeys.length > 0 || changedClasses.length > 0) && (
            <button type="button" onClick={() => (setDraft({}), setClassDraft({}))} className="text-xs text-[var(--wood-muted)] underline">
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

export default ResourceEditor
