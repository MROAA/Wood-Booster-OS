export default function ResultOverlay({ phase, enemyName, onRetry, onChooseAnother }) {
  if (phase !== "won" && phase !== "lost") return null

  const won = phase === "won"

  return (
    <div className="hw-overlay">
      <div className="hw-overlay-title" style={{ color: won ? "var(--hw-moss)" : "var(--hw-hp)" }}>
        {won ? "Victory" : "Defeat"}
      </div>
      <p className="hw-flavor">
        {won
          ? `${enemyName} falls still. The runes dim, and the forest holds its breath.`
          : `The dark closes in. ${enemyName} was stronger than the trial allowed for.`}
      </p>
      <div style={{ display: "flex", gap: 12 }}>
        <button className="hw-end-turn" onClick={onRetry}>Fight Again</button>
        <button
          className="hw-end-turn"
          style={{ background: "var(--hw-panel)", color: "var(--hw-text)", border: "1px solid var(--hw-border)" }}
          onClick={onChooseAnother}
        >
          Choose Another Enemy
        </button>
      </div>
    </div>
  )
}
