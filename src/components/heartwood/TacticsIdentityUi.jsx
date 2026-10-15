// Hearthwood Frontier - HERO IDENTITY on the board (Hero Identity sprint).
// - SigChip: every hero's class signature mechanic as a token chip (icon +
//   pips / count / on-off glow), tooltip = the rule in plain English.
// - SigMarks: what a signature leaves on an enemy (Doom, Static, Rigged,
//   Quarry, Tether, Spotted, Scented) / on a hero (Anthem, fear, Thrall).
// - SignatureInfo + IdentityInfo: the selected hero's card - its mechanic,
//   its legendary, its quirks (lit when they apply right now), bonds, scars.
// Data: data/heartwood/signatures.js + quirks.js. Rules: tacticsSignatures.js.
import { QUIRK_KINDS, BOND_LEVELS, SCARS, QUIRKS } from "../../data/heartwood/quirks"
import { signatureOf, sigToken, sigNumbers, enemySigMarks, heroSigMarks, sigOn } from "../../services/heartwood/tacticsSignatures"
import { fearOf, likesOn, bondsAround } from "../../services/heartwood/tacticsBonds"
import { familyLabel } from "../../services/heartwood/heroIdentity"

export function SigChip({ battle, unit }) {
  const t = sigToken(battle, unit)
  if (!t) return null
  const pips = t.gauge === "pips" && t.max > 0 && t.max <= 8
  return (
    <span className="hwt-sig-chip" data-sig={t.id} data-on={t.on || undefined} data-full={t.full || undefined} data-legend={unit.sigLegend ? "true" : undefined} title={t.title}>
      <span className="hwt-sig-icon">{t.icon}</span>
      {pips ? (
        <span className="hwt-sig-pips">
          {Array.from({ length: t.max }, (_, i) => (
            <span key={i} className="hwt-sig-pip" data-lit={i < t.value || undefined} />
          ))}
        </span>
      ) : t.gauge === "count" && t.value > 0 ? (
        <b className="hwt-sig-count">{t.value}</b>
      ) : null}
    </span>
  )
}

export function SigMarks({ battle, unit }) {
  const marks = unit.side === "enemy" ? enemySigMarks(battle, unit) : heroSigMarks(battle, unit)
  if (!marks.length) return null
  return (
    <span className="hwt-sig-marks" data-side={unit.side}>
      {marks.map((m) => (
        <span key={m.key} className="hwt-sig-mark" data-mark={m.key} title={m.title}>
          {m.icon}
        </span>
      ))}
    </span>
  )
}

// Selected hero: the class signature, big and readable.
export function SignatureInfo({ battle, unit }) {
  const s = signatureOf(unit)
  if (!s || !sigOn(battle) || unit.ownerId) return null
  const t = sigToken(battle, unit)
  const n = sigNumbers(unit)
  const legend = unit.sigLegend === s.id ? s.legendary : null
  return (
    <div className="hwt-sig-info" data-sig={s.id} data-legend={legend ? "true" : undefined}>
      <div className="hwt-sig-info-head">
        <span className="hwt-sig-info-name">
          {s.icon} {s.name}
        </span>
        <span className="hwt-sig-info-tag">Signature</span>
        {t?.gauge === "pips" && (
          <span className="hwt-sig-info-num">
            {t.value}/{n.max}
          </span>
        )}
      </div>
      <p className="hwt-sig-info-text">{s.text}</p>
      {s.combo && <p className="hwt-sig-info-combo">⚔ {s.combo}</p>}
      {legend && (
        <p className="hwt-sig-info-legend" title={legend.text}>
          ★ {legend.name}: {legend.text}
        </p>
      )}
    </div>
  )
}

// Selected hero: personality - quirks (lit = in effect now), bonds nearby, scars.
export function IdentityInfo({ battle, unit }) {
  if (!sigOn(battle) || unit.side !== "player" || unit.ownerId) return null
  const quirks = (unit.quirks || []).map((id) => QUIRKS[id]).filter(Boolean)
  const scars = (unit.scars || []).map((id) => SCARS[id]).filter(Boolean)
  const bonds = Object.entries(unit.bondMap || {})
    .map(([id, level]) => ({ unit: battle.units.find((u) => u.id === id), level }))
    .filter((b) => b.unit && BOND_LEVELS[b.level])
  if (!quirks.length && !scars.length && !bonds.length) return null
  const fear = fearOf(battle, unit)
  const likes = new Set(likesOn(battle, unit).map((q) => q.id))
  const near = new Set(bondsAround(battle, unit).map((b) => b.unit.id))
  return (
    <div className="hwt-identity-info">
      {quirks.length > 0 && (
        <div className="hwt-id-row">
          {quirks.map((q) => {
            const lit = likes.has(q.id) || fear?.quirk.id === q.id
            return (
              <span key={q.id} className="hwt-id-chip" data-kind={q.kind} data-lit={lit || undefined} style={{ "--chip": QUIRK_KINDS[q.kind]?.color }} title={`${QUIRK_KINDS[q.kind]?.name}: ${q.text}${lit ? " (in effect now)" : ""}`}>
                {q.icon} {q.name}
              </span>
            )
          })}
        </div>
      )}
      {bonds.length > 0 && (
        <div className="hwt-id-row">
          {bonds.map((b) => (
            <span key={b.unit.id} className="hwt-id-chip" data-bond={b.level} data-lit={near.has(b.unit.id) || undefined} style={{ "--chip": BOND_LEVELS[b.level].color }} title={`${BOND_LEVELS[b.level].text}${near.has(b.unit.id) ? " (side by side now)" : " Stand next to each other."}`}>
              {BOND_LEVELS[b.level].icon} {b.unit.name}
            </span>
          ))}
        </div>
      )}
      {scars.length > 0 && (
        <div className="hwt-id-row">
          {scars.map((s) => (
            <span key={s.id} className="hwt-id-chip" data-scar={s.kind} title={`${s.name}: ${s.text}${s.id === "grudge" && unit.grudge ? ` (${familyLabel(unit.grudge)})` : ""}`}>
              {s.icon} {s.name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
