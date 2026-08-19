import { useState } from "react"
import { CARDS, STARTER_DECK } from "../data/heartwood/cards"
import { ENEMIES } from "../data/heartwood/enemies"
import { FORMATIONS } from "../data/heartwood/formations"
import { CHARACTERS } from "../data/heartwood/characters"
import { startBattle, playCard, endTurn, moveTo } from "../services/heartwood/cardBattleEngine"
import BattleScreen from "../components/heartwood/BattleScreen"
import { CardGlyph } from "../components/heartwood/cardArt"
import battleBg from "../assets/heartwood/battle-bg.jpg"
import crewBanner from "../assets/heartwood/crew-banner.jpg"
import "../components/heartwood/heartwood.css"

const rootStyle = { height: "100%", "--hw-bg-image": `url(${battleBg})` }

const UNIQUE_DECK_CARDS = [...new Set(STARTER_DECK)].map((id) => CARDS[id])

// Temporary dev-only deck for trying the new grid-tactics cards against
// a real multi-piece formation, per the plan's own Phase 3 note: the
// final curated deck for these cards is a game-design decision, not an
// engineering one, and shouldn't block verifying the mechanic works.
const GRID_TEST_DECK = [...STARTER_DECK, "knights-leap", "rooks-charge", "bishops-slash", "zugzwang", "castling"]

export default function HeartwoodBattle() {
  const [characterId, setCharacterId] = useState(null)
  const [encounterId, setEncounterId] = useState(null)
  const [battle, setBattle] = useState(null)

  function beginBattle(id) {
    const deck = FORMATIONS[id] ? GRID_TEST_DECK : STARTER_DECK
    setEncounterId(id)
    setBattle(startBattle(characterId, id, deck))
  }

  function handlePlayCard(instanceId, targetId) {
    setBattle((current) => playCard(current, instanceId, targetId) || current)
  }

  function handleEndTurn() {
    setBattle((current) => endTurn(current) || current)
  }

  function handleMove(pos) {
    setBattle((current) => moveTo(current, pos) || current)
  }

  function handleChooseAnother() {
    setEncounterId(null)
    setBattle(null)
  }

  function handleChangeCharacter() {
    setCharacterId(null)
    setEncounterId(null)
    setBattle(null)
  }

  if (battle) {
    return (
      <div className="hw-root" style={rootStyle}>
        <BattleScreen
          state={battle}
          onPlayCard={handlePlayCard}
          onEndTurn={handleEndTurn}
          onMove={handleMove}
          onRetry={() => beginBattle(encounterId)}
          onChooseAnother={handleChooseAnother}
        />
      </div>
    )
  }

  if (!characterId) {
    return (
      <div className="hw-root" style={rootStyle}>
        <div className="hw-intro">
          <div className="hw-crew-banner">
            <img src={crewBanner} alt="Tommy, Aatos, Spacemonkey, and Fenrir" />
          </div>
          <h1 style={{ fontSize: 22, marginBottom: 6 }}>Heartwood Trial</h1>
          <p className="hw-flavor">
            Deep inside the Boosterverse, Spacemonkey waits at the heart of the Heartwood. Choose who
            goes in after him.
          </p>
        </div>
        <div className="hw-select-grid">
          {Object.values(CHARACTERS).map((character) => (
            <button key={character.id} className="hw-enemy-choice" onClick={() => setCharacterId(character.id)}>
              <CardGlyph name={character.art} className="hw-card-glyph" style={{ color: "var(--hw-ember)" }} />
              <strong>{character.name}</strong>
              <p style={{ fontSize: 12, color: "var(--hw-muted)", marginTop: 6 }}>{character.tagline}</p>
              <p style={{ fontSize: 11, color: "var(--hw-muted)", marginTop: 6 }}>{character.description}</p>
              <p style={{ fontSize: 11, color: "var(--hw-muted)", marginTop: 6 }}>HP {character.maxHp}</p>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="hw-root" style={rootStyle}>
      <div className="hw-intro">
        <h1 style={{ fontSize: 22, marginBottom: 6 }}>Heartwood Trial</h1>
        <p className="hw-flavor">
          {CHARACTERS[characterId].name} enters the moss-dark Heartwood to see what still moves there.
          Choose what waits ahead.
        </p>
        <button className="hw-move-btn" style={{ marginTop: 10 }} onClick={handleChangeCharacter}>
          Change Character
        </button>
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
        {Object.values(FORMATIONS).map((formation) => (
          <button key={formation.id} className="hw-enemy-choice" onClick={() => beginBattle(formation.id)}>
            <CardGlyph name="warden" className="hw-card-glyph" style={{ color: "var(--hw-hp)" }} />
            <strong>{formation.name}</strong>
            <p style={{ fontSize: 12, color: "var(--hw-muted)", marginTop: 6 }}>{formation.description}</p>
            <p style={{ fontSize: 11, color: "var(--hw-muted)", marginTop: 6 }}>
              {formation.pieces.length} pieces &middot; grid formation
            </p>
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
