import { PERKS, levelForXp } from "../../services/heartwood/unitLevels"

// Unit levels (sprint 3): shown between fights while any unit (or the
// Commander) has an earned level not yet spent. One unit at a time,
// 3 perk cards - pick one.
export default function LevelUpChoice({ subject, offers, onChoose }) {
  const level = subject.perks.length + 2
  const reached = levelForXp(subject.xp)
  return (
    <div className="hw-intro hw-levelup" data-screen="level-up">
      <h2 className="hw-levelup-title">
        {subject.name} reached Level {level}!
      </h2>
      <p className="hw-levelup-sub">
        Pick one perk. It works in every fight from now on.
        {reached > level ? ` (${reached - level + 1} level-ups waiting)` : ""}
      </p>
      <div className="hw-levelup-grid">
        {offers.map((id) => {
          const p = PERKS[id]
          return (
            <button key={id} className="hw-levelup-card" data-perk={id} onClick={() => onChoose(subject.key, id)}>
              <span className="hw-levelup-icon" aria-hidden="true">
                {p.icon}
              </span>
              <span className="hw-levelup-name">{p.name}</span>
              <span className="hw-levelup-text">{p.text}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
