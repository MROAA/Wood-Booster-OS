import { useState } from "react"

import { TRAITS, TRAIT_KINDS } from "../../data/heartwood/traits"
import { PROMOTIONS } from "../../data/heartwood/promotions"
import { CLASSES } from "../../data/heartwood/classes"
import { usePatchPreview } from "./usePatchPreview"
import PatchPreviewPanel from "./PatchPreviewPanel"

/*
 * Promotions / Traits sprint - the 🧬 TRAITS and ⚜ PROMOTIONS editors.
 * Same shape as the Mutation editor (Marc's rule: plain English by
 * default, the fight numbers behind "Show the numbers"). Edits go through
 * the Patchbay preview -> apply -> one-click revert flow
 * (types "traits" -> traits.js, "promotions" -> promotions.js).
 * A field is "a.b.c" = the path inside one entry.
 */

const get = (obj, path) => path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj)

function Field({ label, value, kind, changed, onChange, testId, wide }) {
  return (
    <label className={`block space-y-1 ${wide ? "col-span-2" : ""}`}>
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

function SimpleDataEditor({ type, items, title, testId, friendly, advanced, listSub, header, onApplied, onPreviewUrlChange }) {
  const ids = Object.keys(items)
  const [id, setId] = useState(ids[0])
  const [draft, setDraft] = useState({})
  const [showNumbers, setShowNumbers] = useState(false)
  const { result, applyMode, setApplyMode, previewing, applying, errorMessage, preview, discard, apply } = usePatchPreview({
    onApplied: () => {
      setDraft({})
      onApplied?.()
    },
    onPreviewUrlChange,
  })
  const item = items[id]
  const current = (key) => get(item, key)
  const valueOf = (key) => (draft[key] !== undefined ? draft[key] : String(current(key) ?? ""))
  const changedKeys = Object.keys(draft).filter((k) => String(current(k) ?? "") !== draft[k])
  const kindOf = (key) => (typeof current(key) === "number" ? "number" : "text")
  const fields = (list) =>
    list.map(([key, label, kind, wide]) => (
      <Field key={key} testId={key} label={label} kind={kind || kindOf(key)} wide={wide} value={valueOf(key)} changed={changedKeys.includes(key)} onChange={(v) => setDraft((d) => ({ ...d, [key]: v }))} />
    ))

  async function handlePreview() {
    if (!changedKeys.length) return
    const edits = changedKeys.map((key) => {
      const n = Number(draft[key])
      const value = kindOf(key) === "number" && !Number.isNaN(n) ? n : draft[key]
      return { path: [id, ...key.split(".")], op: "set", value }
    })
    await preview({ type, entityId: id, edits })
  }

  return (
    <div className="flex h-full" data-testid={testId}>
      <div className="w-[230px] shrink-0 overflow-y-auto wood-scroll border-r border-[var(--wood-border)] p-3 space-y-1">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--wood-muted)]">{title}</div>
        {ids.map((x) => (
          <button
            key={x}
            type="button"
            data-entry={x}
            onClick={() => {
              setId(x)
              setDraft({})
            }}
            className={`w-full rounded-lg px-2 py-1.5 text-left text-sm ${x === id ? "bg-[var(--wood-accent)] text-[#17120c]" : "text-[var(--wood-text)] hover:bg-[var(--wood-bg)]"}`}
          >
            {items[x].icon} {items[x].name}
            <div className="text-[10px] opacity-80">{listSub(items[x])}</div>
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto wood-scroll p-4 space-y-4">
        {header(item)}
        <div className="grid grid-cols-2 gap-2">{fields(friendly(item))}</div>
        <button type="button" data-testid={`${testId}-numbers-toggle`} onClick={() => setShowNumbers((v) => !v)} className="text-xs text-[var(--wood-accent)] underline">
          {showNumbers ? "Hide the numbers" : "Show the numbers (Advanced: what it does in a fight)"}
        </button>
        {showNumbers && (
          <div className="grid grid-cols-2 gap-2" data-testid={`${testId}-numbers`}>
            {fields(advanced(item))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid={`${testId}-preview`}
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

const TRAIT_NUMBER_LABEL = {
  hp: "Max HP +/-", attack: "Attack +/-", move: "Movement +/-", apStart: "AP on the first turn +/-", ward: "Ward at fight start", evade: "Dodges at fight start",
  aim: "% to hit +/-", thorns: "Strikes back for", regen: "Mends HP each turn", block: "Block each turn", leech: "Heals per landed hit", fireOnHit: "Burn added per hit",
  manaMax: "Max resource +/-", manaRegen: "Resource each turn +/-", manaStartPct: "Starts fights with +% resource",
}
const MOD_LABEL = { dmg: "+Damage per hit", aim: "+% to hit", heal: "+Healing", guard: "Takes less per hit", taken: "Takes more per hit", cheaper: "% cheaper skills", skillPct: "+% skill damage", at: "At resource %" }

export function TraitEditor(props) {
  return (
    <SimpleDataEditor
      {...props}
      type="traits"
      items={TRAITS}
      title="Traits"
      testId="trait-editor"
      listSub={(t) => TRAIT_KINDS[t.kind]?.name || t.kind}
      header={(t) => (
        <div>
          <div className="text-lg font-bold text-[var(--wood-text)]" data-testid="trait-title">
            {t.icon} {t.name}
          </div>
          <p className="mt-1 text-xs text-[var(--wood-muted)]">{t.text}</p>
          <p className="mt-1 text-[11px]" style={{ color: TRAIT_KINDS[t.kind]?.color }}>
            {TRAIT_KINDS[t.kind]?.name} trait · {t.weight ? "recruits can roll it" : "only from events"}
          </p>
        </div>
      )}
      friendly={() => [
        ["name", "Name", "text"],
        ["text", "What the player reads", "text", true],
        ["kind", "Good, mixed or bad (good / mixed / bad)", "text"],
        ["weight", "How often recruits roll it (0 = events only)", "number"],
      ]}
      advanced={(t) => [
        ["icon", "Icon", "text"],
        ...Object.keys(t.fx || {}).map((k) => [`fx.${k}`, TRAIT_NUMBER_LABEL[k] || k, "number"]),
        ...Object.keys(t.mods || {}).filter((k) => k !== "when").map((k) => [`mods.${k}`, MOD_LABEL[k] || k, "number"]),
        ...(t.mods ? [["mods.when", "When (always / hpAbove50 / hpBelow50 / still / res75 / resBelow25)", "text"]] : []),
        ...Object.keys(t.extra || {}).filter((k) => typeof t.extra[k] === "number").map((k) => [`extra.${k}`, k === "essenceOnWin" ? "Essence after a won fight" : k === "xpBonus" ? "XP after a won fight" : k, "number"]),
      ]}
    />
  )
}

const SKILL_NUMBER_LABEL = { cost: "AP cost", cooldown: "Recharge (turns)", pct: "Resource price (% of the bar)", mult: "Damage x attack", damage: "Damage", heal: "Heal", block: "Block", ward: "Ward", radius: "Radius (tiles)", range: "Range (tiles)", push: "Knockback (tiles)", bonus: "+Damage to allies", ap: "+AP to allies", aim: "+% to hit", execute: "Double damage below this HP share" }

export function PromotionEditor(props) {
  return (
    <SimpleDataEditor
      {...props}
      type="promotions"
      items={PROMOTIONS}
      title="Promotions"
      testId="promotion-editor"
      listSub={(p) => `from ${CLASSES[p.base]?.name || p.base}`}
      header={(p) => (
        <div>
          <div className="text-lg font-bold text-[var(--wood-text)]" data-testid="promotion-title">
            {p.icon} {p.name}
          </div>
          <p className="mt-1 text-xs text-[var(--wood-muted)]">{p.tagline}</p>
          <p className="mt-1 text-[11px] text-[var(--wood-muted)]">
            A {CLASSES[p.base]?.name} can become this at Level 3 (and master it at Level 5).
          </p>
        </div>
      )}
      friendly={() => [
        ["name", "Name", "text"],
        ["tagline", "One-line description", "text", true],
        ["skill.name", "New skill - name", "text"],
        ["skill.text", "New skill - what the player reads", "text", true],
        ["passive.name", "Passive - name", "text"],
        ["passive.text", "Passive - what the player reads", "text", true],
        ["twist.text", "Resource twist - what the player reads", "text", true],
        ["master.text", "Level 5 mastery - what the player reads", "text", true],
      ]}
      advanced={(p) => [
        ["icon", "Icon", "text"],
        ["stats.hp", "+Max HP", "number"],
        ["stats.attack", "+Attack", "number"],
        ...Object.keys(p.skill || {}).filter((k) => typeof p.skill[k] === "number").map((k) => [`skill.${k}`, `Skill: ${SKILL_NUMBER_LABEL[k] || k}`, "number"]),
        ...Object.keys(p.passive?.mods || {}).filter((k) => typeof p.passive.mods[k] === "number").map((k) => [`passive.mods.${k}`, `Passive: ${MOD_LABEL[k] || k}`, "number"]),
        ...["maxPct", "startPct", "regen"].filter((k) => typeof p.twist?.[k] === "number").map((k) => [`twist.${k}`, { maxPct: "Twist: bigger bar %", startPct: "Twist: starts fuller %", regen: "Twist: resource each turn" }[k], "number"]),
        ...Object.keys(p.twist?.bp || {}).filter((k) => typeof p.twist.bp[k] === "number").map((k) => [`twist.bp.${k}`, `Twist breakpoint: ${MOD_LABEL[k] || k}`, "number"]),
        ...Object.keys(p.master?.patch || {}).filter((k) => typeof p.master.patch[k] === "number").map((k) => [`master.patch.${k}`, `Mastery: ${SKILL_NUMBER_LABEL[k] || k}`, "number"]),
      ]}
    />
  )
}
