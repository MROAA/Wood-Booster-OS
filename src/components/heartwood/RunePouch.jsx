// Hearthwood - the Rune Pouch on the Formation screen (First Song PRD §4).
// Shows the runes the run carries; click one to mark it for carving into
// the coming fight (click again to unmark). The marked rune's meaning,
// effect and COST are spelled out before you commit - it is spent when
// the battle starts. Rules: services/heartwood/runRunes.js.
import { RUNES, RUNE_POUCH_MAX } from "../../data/heartwood/runes"
import { runePouch, carvedRuneId } from "../../services/heartwood/runRunes"
import "./heartwood-runes.css"

export default function RunePouch({ runState, onCarve }) {
  const pouch = runePouch(runState)
  const carved = carvedRuneId(runState)
  const shown = RUNES[carved] || null
  return (
    <section className="hw-rune-pouch" data-rune-pouch aria-label="Rune Pouch">
      <div className="hw-rune-pouch-head">
        <span className="hw-rune-pouch-title">Rune Pouch</span>
        <span className="hw-rune-pouch-count">
          {pouch.length}/{RUNE_POUCH_MAX}
        </span>
        <span className="hw-rune-pouch-hint">
          {pouch.length ? "Carve one rune into this fight. It is spent when the battle starts." : "Empty. Elites and minibosses drop runes."}
        </span>
      </div>
      {pouch.length > 0 && (
        <div className="hw-rune-pouch-stones">
          {pouch.map((id, i) => {
            const r = RUNES[id]
            const on = carved === id && pouch.indexOf(id) === i
            return (
              <button
                key={`${id}-${i}`}
                type="button"
                className="hw-rune-stone"
                data-rune={id}
                data-carved={on || undefined}
                style={{ "--hw-rune-colour": r.color }}
                onClick={() => onCarve?.(id)}
                title={`${r.name} - ${r.meaning}\nEffect: ${r.effect}\nCost: ${r.cost}`}
              >
                <span className="hw-rune-glyph" aria-hidden="true">
                  {r.glyph}
                </span>
                <span className="hw-rune-name">{r.name}</span>
              </button>
            )
          })}
        </div>
      )}
      {shown && (
        <div className="hw-rune-carved" data-rune-carved={shown.id} style={{ "--hw-rune-colour": shown.color }}>
          <div className="hw-rune-carved-title">
            <span className="hw-rune-glyph" aria-hidden="true">
              {shown.glyph}
            </span>{" "}
            {shown.name} will be carved · <span className="hw-rune-force">{shown.force}</span>
          </div>
          <div className="hw-rune-line" data-tone="good">
            ✦ {shown.effect}
          </div>
          <div className="hw-rune-line" data-tone="bad">
            ✕ {shown.cost}
          </div>
        </div>
      )}
    </section>
  )
}
