import { PERKS, levelForXp, parseOffer, spentLevels } from "../../services/heartwood/unitLevels"

// Unit levels (sprint 3) + skill tree: shown between fights while any
// unit (or the Commander) has an earned level not yet spent. One unit at
// a time: the 2 upgrade branches of one of its skills + a stat perk
// (or 3 perks once every skill is upgraded). Below: the unit's skill
// tree, taken branches lit, so the build is visible as it forms.
export default function LevelUpChoice({ subject, offers, onChoose }) {
  const level = spentLevels(subject) + 2
  const reached = levelForXp(subject.xp)
  const ups = subject.skillUpgrades || {}
  const offered = new Set(offers.map(parseOffer).filter((o) => o.kind === "upgrade").map((o) => `${o.skillId}:${o.branch}`))
  const hasUpgrade = offered.size > 0
  return (
    <div className="hw-intro hw-levelup" data-screen="level-up">
      <h2 className="hw-levelup-title">
        {subject.name} reached Level {level}!
      </h2>
      <p className="hw-levelup-sub">
        {hasUpgrade ? "Upgrade a skill (pick A or B - it's permanent) or take a perk." : "Pick one perk. It works in every fight from now on."}
        {reached > level ? ` (${reached - level + 1} level-ups waiting)` : ""}
      </p>
      <div className="hw-levelup-grid">
        {offers.map((id) => {
          const o = parseOffer(id)
          if (o.kind === "upgrade") {
            const sk = (subject.skills || []).find((s) => s.id === o.skillId)
            const up = sk?.upgrades?.[o.branch]
            if (!up) return null
            return (
              <button key={id} className="hw-levelup-card hw-levelup-card--upgrade" data-perk={id} data-branch={o.branch} onClick={() => onChoose(subject.key, id)}>
                <span className="hw-levelup-branch" aria-hidden="true">
                  {o.branch}
                </span>
                <span className="hw-levelup-skill">
                  {sk.icon} {sk.name}
                </span>
                <span className="hw-levelup-name">★ {up.name}</span>
                <span className="hw-levelup-text">{up.text}</span>
              </button>
            )
          }
          const p = PERKS[id]
          if (!p) return null
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
      {(subject.skills || []).length > 0 && (
        <div className="hw-skilltree" data-skilltree={subject.key}>
          <div className="hw-skilltree-title">Skill tree</div>
          {subject.skills.map((sk) => (
            <div key={sk.id} className="hw-skilltree-row" data-skill-id={sk.id} data-taken={ups[sk.id] || ""}>
              <span className="hw-skilltree-skill">
                {sk.icon} {sk.name}
              </span>
              {["A", "B"].map((b) => {
                const state = ups[sk.id] === b ? "taken" : ups[sk.id] ? "closed" : offered.has(`${sk.id}:${b}`) ? "offered" : "open"
                return (
                  <span key={b} className="hw-skilltree-branch" data-branch={b} data-state={state} title={sk.upgrades[b].text}>
                    {state === "taken" ? "★ " : ""}
                    {b}: {sk.upgrades[b].name}
                  </span>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
