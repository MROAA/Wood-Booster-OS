import { useState } from "react"
import { setProgress, SET_TIERS } from "../../data/heartwood/buildSets"
import { FATE_KINDS, FATES } from "../../data/heartwood/fates"
import { CardGlyph } from "./cardArt"

// The run panel's BUILD section (between-fights build depth): the build
// sets you've started (pieces owned, tier pips, what the next tier does)
// and your Fates - lasting event consequences still waiting to happen,
// plus the last few that resolved. Minimal by default; nothing shows
// until the run actually has a set piece or a fate.
function fateWhen(f) {
  if (f.done) return f.outcome || "Resolved."
  if (f.kind === "price" || f.kind === "debt") return `${f.left} market${f.left === 1 ? "" : "s"} left`
  if (f.kind === "thread") return "Waiting…"
  if ((f.wait || 0) > 0) return `in ${f.wait + 1} fights`
  if (f.kind === "ally" || f.kind === "rival") return "next fight!"
  return `${f.left} fight${f.left === 1 ? "" : "s"} left`
}

export function SetProgressList({ runState, compact = false }) {
  const progress = setProgress(runState)
  if (!progress.length) return null
  return (
    <div className="hw-build-sets" data-compact={compact || undefined}>
      {progress.map(({ set, count, tier, next }) => (
        <div key={set.id} className="hw-build-set" data-set={set.id} data-tier={tier} style={{ "--hw-set": set.color }}>
          <div className="hw-build-set-head">
            <CardGlyph name={set.icon} className="hw-build-set-glyph" />
            <span className="hw-build-set-name">{set.name}</span>
            <span className="hw-build-set-pips" aria-label={`${count} pieces`}>
              {Array.from({ length: SET_TIERS[SET_TIERS.length - 1] }, (_, i) => (
                <span key={i} className="hw-build-set-pip" data-on={i < count || undefined} data-break={SET_TIERS.includes(i + 1) || undefined} />
              ))}
            </span>
          </div>
          {!compact && (
            <div className="hw-build-set-text">
              {tier > 0 && <span className="hw-build-set-active">{set.tiers[tier].text}</span>}
              {next && (
                <span className="hw-build-set-next">
                  {next}: {set.tiers[next].text}
                </span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export function FateList({ runState, compact = false }) {
  const all = runState?.fates || []
  const active = all.filter((f) => !f.done)
  const resolved = all.filter((f) => f.done).slice(-3).reverse()
  if (!active.length && !resolved.length) return null
  return (
    <div className="hw-fates" data-compact={compact || undefined}>
      {[...active, ...(compact ? [] : resolved)].map((f) => {
        const k = FATE_KINDS[f.kind] || FATE_KINDS.thread
        return (
          <div key={f.uid} className="hw-fate" data-kind={f.kind} data-done={f.done || undefined} style={{ "--hw-fate": k.color }} title={FATES[f.id]?.text || f.text}>
            <CardGlyph name={k.icon} className="hw-fate-glyph" />
            <span className="hw-fate-title">{f.title}</span>
            <span className="hw-fate-when">{fateWhen(f)}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function RunBuildPanel({ runState, compact = false }) {
  const [open, setOpen] = useState(true)
  const hasSets = setProgress(runState).length > 0
  const hasFates = (runState?.fates || []).length > 0
  if (!hasSets && !hasFates) return null
  return (
    <section className="hw-build-panel" data-compact={compact || undefined} data-open={open || undefined}>
      <button type="button" className="hw-build-panel-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span>Your build</span>
        <span className="hw-build-panel-caret">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <>
          {hasSets && <div className="hw-build-panel-label">Sets</div>}
          <SetProgressList runState={runState} compact={compact} />
          {hasFates && <div className="hw-build-panel-label">Fates</div>}
          <FateList runState={runState} compact={compact} />
        </>
      )}
    </section>
  )
}
