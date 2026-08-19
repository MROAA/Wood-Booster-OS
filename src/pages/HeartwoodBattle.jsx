import { useState } from "react"
import { CARDS, STARTER_DECK } from "../data/heartwood/cards"
import { ENEMIES } from "../data/heartwood/enemies"
import { startBattle, playCard, endTurn } from "../services/heartwood/cardBattleEngine"
import BattleScreen from "../components/heartwood/BattleScreen"
import { CardGlyph } from "../components/heartwood/cardArt"
import "../components/heartwood/heartwood.css"

const UNIQUE_DECK_CARDS = [...new Set(STARTER_DECK)].map((id) => CARDS[id])

export default function HeartwoodBattle() {
  const [enemyId, setEnemyId] = useState(null)
  const [battle, setBattle] = useState(null)

  function beginBattle(id) {
    setEnemyId(id)
    setBattle(startBattle(id, STARTER_DECK))
  }

  function handlePlayCard(instanceId) {
    setBattle((current) => playCard(current, instanceId) || current)
  }

  function handleEndTurn() {
    setBattle((current) => endTurn(current) || current)
  }

  function handleChooseAnother() {
    setEnemyId(null)
    setBattle(null)
  }

  if (battle) {
    return (
      <div className="hw-root" style={{ height: "100%" }}>
        <BattleScreen
          state={battle}
          onPlayCard={handlePlayCard}
          onEndTurn={handleEndTurn}
          onRetry={() => beginBattle(enemyId)}
          onChooseAnother={handleChooseAnother}
        />
      </div>
    )
  }

  return (
    <div className="hw-root" style={{ height: "100%" }}>
      <div className="hw-intro">
        <h1 style={{ fontSize: 22, marginBottom: 6 }}>Heartwood Trial</h1>
        <p className="hw-flavor">
          Deep inside the Boosterverse, past the last mapped rune, Spacemonkey enters the moss-dark
          Heartwood to see what still moves there. Choose what waits for you.
        </p>
        <p style={{ fontSize: 12, color: "var(--hw-muted)", marginTop: 10 }}>
          Starting deck ({UNIQUE_DECK_CARDS.length} cards, {STARTER_DECK.length} in the pile):
        </p>
      </div>

      <div className="hw-select-grid">
        {Object.values(ENEMIES).map((enemy) => (
          <button key={enemy.id} className="hw-enemy-choice" onClick={() => beginBattle(enemy.id)}>
            <CardGlyph name={enemy.art} className="hw-card-glyph" style={{ color: "var(--hw-hp)" }} />
            <strong>{enemy.name}</strong>
            <p style={{ fontSize: 12, color: "var(--hw-muted)", marginTop: 6 }}>{enemy.description}</p>
            <p style={{ fontSize: 11, color: "var(--hw-muted)", marginTop: 6 }}>HP {enemy.maxHp}</p>
          </button>
        ))}
      </div>

      <div className="hw-select-grid">
        {UNIQUE_DECK_CARDS.map((def) => (
          <div key={def.id} className={`hw-card hw-card--${def.type}`} style={{ width: "auto" }}>
            <div className="hw-card-head">
              <span className="hw-card-cost">{def.cost}</span>
              <span className="hw-badge">{def.type}</span>
            </div>
            <CardGlyph name={def.art} className="hw-card-glyph" />
            <div className="hw-card-name">{def.name}</div>
            <div className="hw-card-desc">{def.description}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
