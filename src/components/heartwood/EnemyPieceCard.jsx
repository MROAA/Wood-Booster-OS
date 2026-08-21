import { CardGlyph, formatPowerLabel } from "./cardArt"

// Sword/shield icons instead of "Attack 8"/"Guard 8" text - the point
// is to be able to tell what's about to happen without reading.
function intentDisplay(intent) {
  if (!intent) return null
  if (intent.type === "attack") return { icon: "sword", amount: intent.amount, className: "hw-intent--attack" }
  if (intent.type === "block") return { icon: "shield", amount: intent.amount, className: "hw-intent--block" }
  if (intent.type === "heal") return { icon: "heart", amount: intent.amount, className: "hw-intent--heal" }
  if (intent.type === "aoe")
    return { icon: null, text: `Strikes the whole squad for ${intent.amount}`, className: "hw-intent--attack" }
  if (intent.type === "debuff")
    return { icon: null, text: `${formatPowerLabel(intent.id)} +${intent.amount}`, className: "hw-intent--debuff" }
  return null
}

// One enemy piece as it renders inside a BattleGrid square. Reuses the
// same visual language EnemyPanel used to own (glyph/HP/intent/power
// badges) at grid-cell scale, plus a shield badge when the piece is
// currently protected from ordinary single-target cards.
export default function EnemyPieceCard({ enemy, art, shielded, highlighted, onClick, side = "enemy" }) {
  const dead = enemy.hp <= 0
  const intent = intentDisplay(enemy.intent)
  const hpPct = Math.max(0, Math.round((enemy.hp / enemy.maxHp) * 100))
  const powerEntries = Object.entries(enemy.powers || {}).filter(([, v]) => v)

  return (
    <div
      className="hw-piece"
      data-side={side}
      data-dead={dead}
      data-highlighted={highlighted}
      data-unit-id={enemy.id}
      onClick={!dead && onClick ? onClick : undefined}
    >
      {shielded && !dead && (
        <span className="hw-badge hw-shield-badge" title="Shielded - ordinary attacks can't reach this piece">
          🛡
        </span>
      )}
      <CardGlyph name={art} className="hw-piece-glyph" />
      <div className="hw-piece-name">{enemy.name}</div>
      {!dead && (
        <>
          <div className="hw-hp-row">
            <div className="hw-hp-bar-track">
              <div className="hw-hp-bar-fill" style={{ width: `${hpPct}%` }} />
            </div>
            <span className="hw-hp-label">{enemy.hp}/{enemy.maxHp}</span>
          </div>
          {intent && (
            <div className={`hw-intent ${intent.className}`}>
              {intent.icon ? (
                <>
                  <CardGlyph name={intent.icon} className="hw-intent-glyph" />
                  {intent.amount}
                </>
              ) : (
                intent.text
              )}
            </div>
          )}
          {enemy.block > 0 && <span className="hw-badge hw-badge--block">Block {enemy.block}</span>}
          {powerEntries.length > 0 && (
            <div className="hw-powers">
              {powerEntries.map(([id, amount]) => (
                <span key={id} className="hw-badge">{formatPowerLabel(id)} {amount}</span>
              ))}
            </div>
          )}
        </>
      )}
      {dead && <div className="hw-piece-dead">Defeated</div>}
    </div>
  )
}
