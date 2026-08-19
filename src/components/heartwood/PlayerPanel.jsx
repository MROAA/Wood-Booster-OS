export default function PlayerPanel({ player, energy }) {
  const hpPct = Math.max(0, Math.round((player.hp / player.maxHp) * 100))
  const powerEntries = Object.entries(player.powers || {}).filter(([, v]) => v)

  return (
    <div className="hw-panel" style={{ minWidth: 220 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <strong>{player.name}</strong>
        {player.block > 0 && <span className="hw-badge hw-badge--block">Block {player.block}</span>}
      </div>
      <div className="hw-hp-row">
        <div className="hw-hp-bar-track">
          <div className="hw-hp-bar-fill" style={{ width: `${hpPct}%` }} />
        </div>
        <span className="hw-hp-label">{player.hp} / {player.maxHp}</span>
      </div>

      <div className="hw-energy-row" style={{ marginTop: 10 }}>
        {Array.from({ length: energy.max }).map((_, i) => (
          <span key={i} className="hw-energy-pip" data-filled={i < energy.current} />
        ))}
      </div>

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
