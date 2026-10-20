import { useEffect, useMemo, useState } from "react"

import { apiGet } from "../../api/client"

import { usePatchPreview } from "./usePatchPreview"
import PatchPreviewPanel from "./PatchPreviewPanel"
import { useReportUnsaved } from "./unsavedWork"

/*
 * Skill workshop (docs/hearthwood-dev-studio-prd.md §7 - "the Studio's
 * most important feature"), part 1: every skill in the game as a card,
 * class by class, changed with plain words and − / + buttons. A number's
 * "typical in the game" range opens on hover (§7.4: balance from the
 * game's real data, not an opinion). Each card saves on its own through
 * the normal "Check your change" step.
 *
 * Class skills: classes.js CLASSES[id].skills[i]; promotion skills:
 * promotions.js PROMOTIONS[id].skill (only when its numbers are a flat
 * group - reader `group`). New KINDS of skills need code; a "make a new
 * skill from ready-made kinds" part 2 builds on promotions' 8 kinds.
 */
const NUMBERS = {
  mana: { label: "Mana", icon: "💧", step: 1 },
  cost: { label: "Action points", icon: "⚡", step: 1 },
  cooldown: { label: "Wait between uses", icon: "⏳", step: 1 },
  range: { label: "Range", icon: "🏹", step: 1 },
  damage: { label: "Damage", icon: "⚔", step: 1 },
  mult: { label: "Damage ×", icon: "⚔", step: 0.1 },
  heal: { label: "Healing", icon: "❤", step: 1 },
  block: { label: "Block", icon: "🛡", step: 1 },
  amount: { label: "Amount", icon: "🔢", step: 1 },
  bonus: { label: "Bonus", icon: "✦", step: 1 },
  radius: { label: "Area size", icon: "◎", step: 1 },
  push: { label: "Knock back", icon: "➜", step: 1 },
  turns: { label: "Lasts (turns)", icon: "⏳", step: 1 },
  gen: { label: "Builds resource", icon: "＋", step: 1 },
  pct: { label: "Resource needed (%)", icon: "％", step: 5 },
}
const TARGETS = { enemy: "An enemy", ally: "An ally", self: "Itself", tile: "A spot on the board" }

const round = n => Math.round(n * 100) / 100

// Typical range of each number across every skill in the game.
function typicalRanges(skills) {
  const out = {}
  for (const key of Object.keys(NUMBERS)) {
    const values = skills.map(s => s.fields[key]).filter(f => f && f.kind === "number").map(f => f.value).sort((a, b) => a - b)
    if (values.length >= 3) out[key] = { low: values[Math.floor(values.length * 0.2)], high: values[Math.floor(values.length * 0.8)], count: values.length }
  }
  return out
}

function SkillCard({ skill, typical, onApplied }) {
  const [draft, setDraft] = useState({})
  const { result, applyMode, setApplyMode, previewing, applying, errorMessage, preview, discard, apply } = usePatchPreview({ onApplied })
  const fields = skill.fields
  const value = key => draft[key] ?? fields[key]?.value
  const set = (key, next) => setDraft(previous => {
    const copy = { ...previous, [key]: next }
    if (String(next) === String(fields[key]?.value)) delete copy[key]
    return copy
  })
  const changed = Object.keys(draft)
  useReportUnsaved(changed.length > 0) // editor's own "changed" count: unsaved work for the tab
  const numberKeys = Object.keys(NUMBERS).filter(key => fields[key]?.kind === "number")

  async function check() {
    await preview({
      type: skill.type,
      entityId: skill.entityId,
      edits: changed.map(key => ({ path: [...skill.path, key], op: "set", value: fields[key].kind === "number" ? Number(draft[key]) : draft[key] })),
    })
  }

  return (
    <article className="hws-card space-y-3 rounded-2xl border border-[var(--wood-border)] p-4" data-skill={skill.key}>
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[var(--wood-border)] bg-[var(--wood-bg)] text-2xl text-[var(--wood-accent)]" aria-hidden="true">{fields.icon?.value || "✦"}</span>
        <div className="min-w-0 flex-1 space-y-1">
          <input
            value={value("name") ?? ""}
            onChange={event => set("name", event.target.value)}
            className="hws-display w-full rounded-lg border border-transparent bg-transparent text-xl font-semibold text-[var(--wood-text)] outline-none hover:border-[var(--wood-border)] focus:border-[var(--wood-accent)]"
            aria-label="Skill name"
          />
          <div className="text-[11px] uppercase tracking-wide text-[var(--wood-muted)]">{skill.source}</div>
        </div>
      </div>

      <label className="block space-y-1">
        <div className="text-xs text-[var(--wood-muted)]">What it does (the player reads this)</div>
        <textarea
          value={value("text") ?? ""}
          onChange={event => set("text", event.target.value)}
          rows={Math.max(2, Math.ceil(String(value("text") ?? "").length / 70))}
          className="w-full resize-y rounded-lg border border-[var(--wood-border)] bg-[var(--wood-bg)] px-3 py-2 text-sm leading-relaxed text-[var(--wood-text)] outline-none focus:border-[var(--wood-accent)]"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {
          fields.target?.kind === "string" && (
            <label className="space-y-1">
              <div className="text-xs text-[var(--wood-muted)]">🎯 Who it's used on</div>
              <select value={value("target")} onChange={event => set("target", event.target.value)} className="h-9 w-full rounded-lg border border-[var(--wood-border)] bg-[var(--wood-bg)] px-2 text-sm text-[var(--wood-text)]">
                {Object.entries(TARGETS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                {!TARGETS[fields.target.value] && <option value={fields.target.value}>{fields.target.value}</option>}
              </select>
            </label>
          )
        }
        {
          numberKeys.map(key => {
            const info = NUMBERS[key]
            const n = Number(value(key))
            const range = typical[key]
            return (
              <div key={key} className="hw-reveal space-y-1" data-number={key}>
                <div className="text-xs text-[var(--wood-muted)]">{info.icon} {info.label}{draft[key] !== undefined && <span className="ml-1 text-[var(--wood-accent)]">● changed</span>}</div>
                <div className="flex items-center gap-1">
                  <button type="button" aria-label="Less" onClick={() => set(key, round(Math.max(0, n - info.step)))} className="h-9 w-9 rounded-lg border border-[var(--wood-border)] text-lg text-[var(--wood-text)] hover:border-[var(--wood-accent)]">−</button>
                  <input type="number" step={info.step} value={value(key)} onChange={event => set(key, event.target.value)} className="h-9 w-16 rounded-lg border border-[var(--wood-border)] bg-[var(--wood-bg)] text-center text-base font-semibold tabular-nums text-[var(--wood-text)] outline-none focus:border-[var(--wood-accent)]" />
                  <button type="button" aria-label="More" onClick={() => set(key, round(n + info.step))} className="h-9 w-9 rounded-lg border border-[var(--wood-border)] text-lg text-[var(--wood-text)] hover:border-[var(--wood-accent)]">+</button>
                </div>
                {range && <div className="hw-reveal-more text-[11px] text-[var(--wood-muted)]">Most skills in the game: {range.low === range.high ? range.low : `${range.low}–${range.high}`}{n > range.high * 1.5 ? " · this one is well above" : ""}</div>}
              </div>
            )
          })
        }
      </div>

      {
        changed.length > 0 && !result && (
          <div className="flex items-center justify-end gap-3">
            <span className="text-xs text-[var(--wood-accent)]">{changed.length} change{changed.length === 1 ? "" : "s"} not in the game yet</span>
            <button type="button" onClick={() => setDraft({})} className="text-xs text-[var(--wood-muted)] hover:text-[var(--wood-text)]">Throw away</button>
            <button type="button" disabled={previewing} onClick={check} data-testid="skill-check" className="rounded-full border border-[var(--wood-accent)] bg-[var(--wood-accent)] px-4 py-1.5 text-sm font-medium text-[#17120c] disabled:opacity-30">
              {previewing ? "Preparing..." : "Check my changes"}
            </button>
          </div>
        )
      }
      {errorMessage && <div className="text-xs text-red-300">{errorMessage}</div>}
      <PatchPreviewPanel result={result} applyMode={applyMode} onApplyModeChange={setApplyMode} onDiscard={discard} onApply={async () => { await apply(); setDraft({}) }} applying={applying} />
    </article>
  )
}

function SkillWorkshop({ onApplied, reloadKey = 0 }) {
  const [data, setData] = useState(null)
  const [classId, setClassId] = useState(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([apiGet("/hearthwood-patchbay/entities?type=classes"), apiGet("/hearthwood-patchbay/entities?type=promotions")])
      .then(([classes, promotions]) => { if (!cancelled) setData({ classes: classes.entities || [], promotions: promotions.entities || [] }) })
      .catch(() => { if (!cancelled) setData({ classes: [], promotions: [] }) })
    return () => { cancelled = true }
  }, [reloadKey])

  // Every skill in the game, flattened into one shape.
  const skills = useMemo(() => {
    if (!data) return []
    const out = []
    for (const cls of data.classes) {
      (cls.fields?.skills?.items || []).forEach((item, index) => {
        if (item.fields) out.push({ key: `${cls.id}/${index}`, classId: cls.id, type: "classes", entityId: cls.id, path: [cls.id, "skills", index], fields: item.fields, source: `${cls.name} · class skill ${index + 1}` })
      })
    }
    for (const promo of data.promotions) {
      const group = promo.fields?.skill?.group
      const base = promo.fields?.base?.value
      if (group && base) out.push({ key: `promo/${promo.id}`, classId: base, type: "promotions", entityId: promo.id, path: [promo.id, "skill"], fields: group, source: `${promo.name} · promotion skill (Level 3)` })
    }
    return out
  }, [data])
  const typical = useMemo(() => typicalRanges(skills), [skills])

  if (!data) return <div className="text-sm text-[var(--wood-muted)]">Loading the skills...</div>

  const current = classId || data.classes[0]?.id
  const classSkills = skills.filter(skill => skill.classId === current)

  return (
    <div className="space-y-4" data-testid="skill-workshop">
      <div className="space-y-2">
        <div className="text-sm text-[var(--wood-text)]"><span className="text-lg font-semibold">{skills.length}</span> skills in {data.classes.length} classes · pick a class</div>
        <div className="flex flex-wrap gap-1.5" data-testid="skill-classes">
          {
            data.classes.map(cls => (
              <button
                key={cls.id}
                type="button"
                onClick={() => setClassId(cls.id)}
                data-class={cls.id}
                className={`rounded-full border px-3 py-1 text-xs ${cls.id === current ? "border-[var(--wood-accent)] bg-[var(--wood-accent)] text-[#17120c]" : "border-[var(--wood-border)] text-[var(--wood-text)] hover:border-[var(--wood-accent)]"}`}
              >
                <span aria-hidden="true">{cls.fields?.icon?.value}</span> {cls.name}
              </button>
            ))
          }
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        {classSkills.map(skill => <SkillCard key={`${skill.key}-${reloadKey}`} skill={skill} typical={typical} onApplied={onApplied} />)}
      </div>

      <p className="text-xs text-[var(--wood-muted)]">
        A brand-new kind of skill needs new game code. Making a new skill from ready-made kinds (big hit, area hit, heal, knock back, blink, ground change…) is the next part of the workshop.
      </p>
    </div>
  )
}

export default SkillWorkshop
