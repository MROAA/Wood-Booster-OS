import { useState } from "react"

import { ITEMS, RARITY_INFO } from "../../data/heartwood/items"
import { RECIPES } from "../../data/heartwood/recipes"
import { COLLARS } from "../../data/heartwood/collars"
import { GEAR_FX_TEXT } from "../../services/heartwood/gear"
import { usePatchPreview } from "./usePatchPreview"
import PatchPreviewPanel from "./PatchPreviewPanel"

/*
 * Gear sprint - the GEAR EDITOR. Marc edits every item, recipe and Class
 * Collar in plain words (name, what the player reads). The numbers (price,
 * what it gives in a fight, next-to bonus, aura strength, recipe parts)
 * sit behind "Show the numbers". Same preview -> apply -> one-click
 * revert flow as every other Studio editor (patchbay types "items",
 * "recipes", "collars").
 */

const KINDS = {
  items: { label: "Items", type: "items" },
  recipes: { label: "Recipes", type: "recipes" },
  collars: { label: "Collars", type: "collars" },
}

const FRIENDLY = {
  items: [
    ["name", "Name"],
    ["description", "What the player reads"],
  ],
  recipes: [["text", "Hint the player reads"]],
  collars: [
    ["name", "Name"],
    ["description", "What the player reads"],
  ],
}

const FX_LABEL = {
  hp: "Max HP +/-",
  attack: "Attack +/-",
  aim: "% to hit +/-",
  move: "Movement +/-",
  ward: "Shrugs off N hits",
  evade: "Dodges N hits",
  thorns: "Strikes back for",
  regen: "Mends HP each turn",
  block: "Block each turn",
  leech: "Heals per landed hit",
  manaMax: "Max resource +/-",
  manaRegen: "Resource each turn +/-",
  manaStartPct: "Starts fights with +% resource",
  resGain: "Extra on every resource gain",
  highAt: "Bar % needed for the bonus",
  highDmg: "Damage while bar is high",
  highAim: "% to hit while bar is high",
  overflow: "Overflow it can store",
  tapHp: "HP paid each turn",
  tapRes: "Resource gained for it",
  upkeep: "Spirit held back less per summon",
  cheaper: "Skills % cheaper",
  hurtGain: "Resource when hit",
}

function listFor(kind) {
  if (kind === "recipes") return Object.keys(RECIPES)
  if (kind === "collars") return Object.keys(COLLARS)
  return Object.keys(ITEMS).filter((id) => ITEMS[id].kind !== "collar")
}
function entityFor(kind, id) {
  if (kind === "recipes") return RECIPES[id]
  if (kind === "collars") return COLLARS[id]
  return ITEMS[id]
}
function titleFor(kind, e) {
  if (!e) return ""
  if (kind === "recipes") return `${ITEMS[e.a]?.name || e.a} + ${ITEMS[e.b]?.name || e.b} → ${ITEMS[e.result]?.name || e.result}`
  return e.name
}
// The numbers behind "Show the numbers": [draftKey, label, path].
function numberFields(kind, e) {
  if (!e) return []
  if (kind === "recipes")
    return [
      ["a", "First ingredient (item id)", ["a"]],
      ["b", "Second ingredient (item id)", ["b"]],
      ["result", "Makes (item id)", ["result"]],
    ]
  if (kind === "collars") return [["collarClass", "Class it gives (class id)", ["collarClass"]]]
  const out = [["cost", "Price (Essence)", ["cost"]]]
  for (const k of Object.keys(e.fx || {})) out.push([`fx.${k}`, FX_LABEL[k] || k, ["fx", k]])
  for (const k of Object.keys(e.adj?.bonus || {})) out.push([`adj.bonus.${k}`, `Next-to bonus: ${FX_LABEL[k] || k}`, ["adj", "bonus", k]])
  if (typeof e.adj?.boost === "number") out.push(["adj.boost", "Next-to boost %", ["adj", "boost"]])
  if (typeof e.aura?.amount === "number" && e.aura.type !== "noFlank") out.push(["aura.amount", "Aura strength", ["aura", "amount"]])
  return out
}

function valueAt(e, path) {
  return path.reduce((v, k) => (v == null ? v : v[k]), e)
}

function Field({ label, value, changed, onChange, testId, number }) {
  return (
    <label className="block space-y-1">
      <div className="text-[11px] text-[var(--wood-muted)]">
        {label}
        {changed && <span className="ml-1 text-[var(--wood-accent)]">●</span>}
      </div>
      <input
        data-field={testId}
        type={number ? "number" : "text"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`h-8 w-full rounded-lg border bg-[var(--wood-bg)] px-2 text-xs text-[var(--wood-text)] outline-none focus:border-[var(--wood-accent)] ${changed ? "border-[var(--wood-accent)]" : "border-[var(--wood-border)]"}`}
      />
    </label>
  )
}

function GearEditor({ onApplied, onPreviewUrlChange }) {
  const [kind, setKind] = useState("items")
  const ids = listFor(kind)
  const [selected, setSelected] = useState({ items: "whetstone", recipes: ids[0], collars: Object.keys(COLLARS)[0] })
  const [draft, setDraft] = useState({})
  const [showNumbers, setShowNumbers] = useState(false)
  const { result, applyMode, setApplyMode, previewing, applying, errorMessage, preview, discard, apply } = usePatchPreview({
    onApplied: () => {
      setDraft({})
      onApplied?.()
    },
    onPreviewUrlChange,
  })
  const id = ids.includes(selected[kind]) ? selected[kind] : ids[0]
  const e = entityFor(kind, id)
  const fields = [...FRIENDLY[kind].map(([key, label]) => [key, label, [key]]), ...numberFields(kind, e)]
  const pathOf = (key) => fields.find((f) => f[0] === key)?.[2] || [key]
  const current = (key) => valueAt(e, pathOf(key))
  const valueOf = (key) => (draft[key] !== undefined ? draft[key] : String(current(key) ?? ""))
  const changedKeys = Object.keys(draft).filter((k) => String(current(k) ?? "") !== draft[k])

  function pick(next) {
    setSelected((s) => ({ ...s, [kind]: next }))
    setDraft({})
  }
  function switchKind(next) {
    setKind(next)
    setDraft({})
  }

  async function handlePreview() {
    if (!changedKeys.length) return
    const edits = changedKeys.map((key) => {
      const n = Number(draft[key])
      const isNum = typeof current(key) === "number" && !Number.isNaN(n)
      return { path: [id, ...pathOf(key)], op: "set", value: isNum ? n : draft[key] }
    })
    await preview({ type: KINDS[kind].type, entityId: id, edits })
  }

  return (
    <div className="flex h-full" data-testid="gear-editor">
      <div className="w-[240px] shrink-0 overflow-y-auto wood-scroll border-r border-[var(--wood-border)] p-3 space-y-1">
        <div className="mb-2 flex gap-1">
          {Object.entries(KINDS).map(([k, v]) => (
            <button
              key={k}
              type="button"
              data-gear-kind={k}
              onClick={() => switchKind(k)}
              className={`rounded-full border px-2 py-0.5 text-[11px] ${k === kind ? "border-[var(--wood-accent)] bg-[var(--wood-accent)] text-[#17120c]" : "border-[var(--wood-border)] text-[var(--wood-muted)]"}`}
            >
              {v.label}
            </button>
          ))}
        </div>
        {ids.map((x) => {
          const ent = entityFor(kind, x)
          return (
            <button
              key={x}
              type="button"
              data-gear-entity={x}
              onClick={() => pick(x)}
              className={`w-full rounded-lg px-2 py-1.5 text-left text-sm ${x === id ? "bg-[var(--wood-accent)] text-[#17120c]" : "text-[var(--wood-text)] hover:bg-[var(--wood-bg)]"}`}
            >
              {titleFor(kind, ent)}
              {kind === "items" && (
                <div className="text-[10px]" style={x === id ? undefined : { color: RARITY_INFO[ent.rarity]?.color }}>
                  {RARITY_INFO[ent.rarity]?.name} {ent.kind}
                </div>
              )}
            </button>
          )
        })}
      </div>
      <div className="flex-1 overflow-y-auto wood-scroll p-4 space-y-4">
        <div>
          <div className="text-lg font-bold text-[var(--wood-text)]" data-testid="gear-title">
            {titleFor(kind, e)}
          </div>
          <p className="mt-1 text-xs text-[var(--wood-muted)]">{e?.description || e?.text}</p>
          {kind === "items" && e?.fx && Object.keys(e.fx).length > 0 && (
            <p className="mt-1 text-[11px] text-[var(--wood-accent)]" data-testid="gear-fx-text">
              In a fight:{" "}
              {Object.entries(e.fx)
                .map(([k, v]) => GEAR_FX_TEXT[k]?.(v))
                .filter(Boolean)
                .join(", ")}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {FRIENDLY[kind].map(([key, label]) => (
            <Field key={key} testId={key} label={label} value={valueOf(key)} changed={changedKeys.includes(key)} onChange={(v) => setDraft((d) => ({ ...d, [key]: v }))} />
          ))}
        </div>

        <button type="button" data-testid="gear-numbers-toggle" onClick={() => setShowNumbers((v) => !v)} className="text-xs text-[var(--wood-accent)] underline">
          {showNumbers ? "Hide the numbers" : "Show the numbers (price, what it does in a fight)"}
        </button>
        {showNumbers && (
          <div className="grid grid-cols-2 gap-2" data-testid="gear-numbers">
            {numberFields(kind, e).map(([key, label]) => (
              <Field key={key} testId={key} label={label} number={typeof current(key) === "number"} value={valueOf(key)} changed={changedKeys.includes(key)} onChange={(v) => setDraft((d) => ({ ...d, [key]: v }))} />
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="gear-preview"
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

export default GearEditor
