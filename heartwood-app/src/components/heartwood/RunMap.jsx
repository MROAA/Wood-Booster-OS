import { CARDS } from "../../data/heartwood/cards"
import { CHARACTERS } from "../../data/heartwood/characters"
import { ENEMIES } from "../../data/heartwood/enemies"
import { FORMATIONS } from "../../data/heartwood/formations"
import Card from "./Card"
import { CardGlyph } from "./cardArt"

// A short, fixed track (see runEngine.js's RUN_PATH) rendered as a row
// of icons so the run reads as a real journey with a visible end, not
// just "pick any fight" forever - past nodes fade, the current node
// glows via the same medallion treatment every other glyph already
// uses.
function nodeGlyph(node) {
  if (node.type === "rest") return "heart"
  if (node.formationId) return "warden"
  return ENEMIES[node.enemyId]?.art
}

export default function RunMap({ runState, onContinue }) {
  const character = CHARACTERS[runState.characterId]
  const node = runState.path[runState.nodeIndex]
  const isRest = node.type === "rest"
  const isBoss = node.type === "boss"
  const enemy = !isRest ? ENEMIES[node.enemyId] : null
  const formation = node.formationId ? FORMATIONS[node.formationId] : null
  const deckCards = [...new Set(runState.deck)].map((id) => CARDS[id])

  return (
    <div className="hw-intro">
      <h1 style={{ fontSize: 22, marginBottom: 6 }}>Heartwood Trial</h1>
      <p className="hw-flavor">
        {character.name} presses deeper into the Heartwood. {runState.runHp} / {runState.runMaxHp} HP.
      </p>

      <div className="hw-run-track">
        {runState.path.map((n, i) => (
          <div key={i} className="hw-run-node" data-current={i === runState.nodeIndex} data-done={i < runState.nodeIndex}>
            <CardGlyph
              name={nodeGlyph(n)}
              className="hw-piece-glyph"
              style={{ color: n.type === "boss" ? "var(--hw-hp)" : n.type === "rest" ? "var(--hw-moss)" : "var(--hw-ember)" }}
            />
          </div>
        ))}
      </div>

      <div className="hw-select-grid">
        <div className="hw-enemy-choice" style={{ cursor: "default" }}>
          <CardGlyph
            name={nodeGlyph(node)}
            className="hw-card-glyph"
            style={{ color: isBoss ? "var(--hw-hp)" : isRest ? "var(--hw-moss)" : "var(--hw-ember)" }}
          />
          <strong>{isRest ? "A quiet clearing" : formation ? formation.name : enemy.name}</strong>
          <p style={{ fontSize: 12, color: "var(--hw-muted)", marginTop: 6 }}>
            {isRest ? "Rest here, or press on while you still can." : formation ? formation.description : enemy.description}
          </p>
          {!isRest && (
            <p style={{ fontSize: 11, color: "var(--hw-muted)", marginTop: 6 }}>
              {formation
                ? `${formation.pieces.length} pieces · grid formation`
                : `HP ${enemy.maxHp}`}
            </p>
          )}
        </div>
      </div>

      <button className="hw-end-turn" onClick={onContinue} style={{ marginTop: 6, marginBottom: 20 }}>
        Continue
      </button>

      <p style={{ fontSize: 12, color: "var(--hw-muted)" }}>Your deck ({deckCards.length} cards):</p>
      <div className="hw-select-grid hw-deck-preview">
        {deckCards.map((def) => (
          <Card key={def.id} def={def} playable={false} />
        ))}
      </div>
    </div>
  )
}
