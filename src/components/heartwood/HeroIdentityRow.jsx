// Hearthwood - a hero's IDENTITY on its card (Hero Identity sprint):
// its class signature mechanic, personality quirks, bonds (friends /
// rivals), scars & honours, and a short history log ("Survived the
// Ashen Maw at 2 HP"). Data: entry.identity (heroIdentity.js).
import { SIGNATURES } from "../../data/heartwood/signatures"
import { QUIRK_KINDS, BOND_LEVELS } from "../../data/heartwood/quirks"
import { identityView, familyLabel } from "../../services/heartwood/heroIdentity"

export default function HeroIdentityRow({ entry, classId }) {
  const sig = classId ? SIGNATURES[classId] : null
  if (!entry?.identity && !sig) return null
  const v = identityView(entry)
  const last = v.history.slice(-1)
  return (
    <div className="hw-card-identity" data-identity="true">
      {(sig || v.quirks.length > 0) && (
        <div className="hw-id-chips">
          {sig && (
            <span className="hw-id-chip" data-id-kind="signature" title={`Signature - ${sig.name}: ${sig.text}`}>
              {sig.icon} {sig.name}
            </span>
          )}
          {v.quirks.map((q) => (
            <span key={q.id} className="hw-id-chip" data-id-kind={q.kind} style={{ "--hw-id": QUIRK_KINDS[q.kind]?.color }} title={`${QUIRK_KINDS[q.kind]?.name}: ${q.text}`}>
              {q.icon} {q.name}
            </span>
          ))}
        </div>
      )}
      {(v.bonds.length > 0 || v.scars.length > 0) && (
        <div className="hw-id-chips">
          {v.bonds.slice(0, 3).map((b) => (
            <span key={b.uid} className="hw-id-chip" data-id-kind="bond" data-bond={b.level} style={{ "--hw-id": BOND_LEVELS[b.level].color }} title={`${BOND_LEVELS[b.level].name} with ${b.name}. ${BOND_LEVELS[b.level].text}`}>
              {BOND_LEVELS[b.level].icon} {b.name}
            </span>
          ))}
          {v.scars.map((s) => (
            <span key={s.id} className="hw-id-chip" data-id-kind={s.kind} title={`${s.kind === "scar" ? "Scar" : "Honour"} - ${s.name}: ${s.text}${s.id === "grudge" && v.grudge ? ` (${familyLabel(v.grudge)})` : ""}`}>
              {s.icon} {s.name}
            </span>
          ))}
        </div>
      )}
      {last.length > 0 && (
        <ul className="hw-id-history" title={`${v.career.fights} fights · ${v.career.kills} foes felled\n${v.history.join("\n")}`}>
          {last.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
