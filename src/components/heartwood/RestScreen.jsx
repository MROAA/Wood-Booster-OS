// The run's one real path choice (see runEngine.js's fixed RUN_PATH):
// heal now, or bank the time and press on at your current HP. Everything
// after this point only gets harder, so the flavor text says that
// plainly instead of hiding the tradeoff.
export default function RestScreen({ runState, onChoose }) {
  return (
    <div className="hw-intro">
      <h1 style={{ fontSize: 22, marginBottom: 6 }}>A quiet clearing</h1>
      <p className="hw-flavor">
        {runState.runHp} / {runState.runMaxHp} HP. The path ahead only gets harder from here.
      </p>
      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <button className="hw-move-btn" onClick={() => onChoose("rest")}>
          Rest — heal a third of your HP
        </button>
        <button
          className="hw-move-btn"
          style={{ background: "var(--hw-panel)", color: "var(--hw-text)", border: "1px solid var(--hw-border)" }}
          onClick={() => onChoose("push")}
        >
          Push on
        </button>
      </div>
    </div>
  )
}
