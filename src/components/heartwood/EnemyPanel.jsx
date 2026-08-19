import { CardGlyph } from "./cardArt"

function intentLabel(intent) {
  if (intent.type === "attack") return { text: `Attack ${intent.amount}`, className: "hw-intent--attack" }
  if (intent.type === "block") return { text: `Guard ${intent.amount}`, className: "hw-intent--block" }
  if (intent.type === "debuff") return { text: `${intent.id} +${intent.amount}`, className: "hw-intent--debuff" }
  return { text: "...", className: "" }
}

export default function EnemyPanel({ enemy, art }) {
  const intent = intentLabel(enemy.intent)
  const hpPct = Math.max(0, Math.round((enemy.hp / enemy.maxHp) * 100))
  const powerEntries = Object.entries(enemy.powers || {}).filter(([, v]) => v)

  return (
    <div className="hw-panel" style={{ flex: 1 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <CardGlyph name={art} className="hw-card-glyph" style={{ color: "var(--hw-hp)" }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong>{enemy.name}</strong>
            {enemy.block > 0 && <span className="hw-badge hw-badge--block">Block {enemy.block}</span>}
          </div>
          <div className="hw-hp-row">
            <div className="hw-hp-bar-track">
              <div className="hw-hp-bar-fill" style={{ width: `${hpPct}%` }} />
            </div>
            <span className="hw-hp-label">{enemy.hp} / {enemy.maxHp}</span>
          </div>
        </div>
      </div>

      <div className={`hw-intent ${intent.className}`}>Next: {intent.text}</div>

      {powerEntries.length > 0 && (
        <div className="hw-powers">
          {powerEntries.map(([id, amount]) => (
            <span key={id} className="hw-badge">{id} {amount}</span>
          ))}
        </div>
      )}
    </div>
  )
}
