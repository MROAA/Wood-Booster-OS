import { useState } from "react"
import { PERKS, levelForXp, parseOffer, spentLevels, pendingPromotionRank } from "../../services/heartwood/unitLevels"
import { PROMOTIONS, promotionsFor } from "../../data/heartwood/promotions"
import { CLASSES } from "../../data/heartwood/classes"
import { RESOURCES, CLASS_RESOURCE_DEFAULT } from "../../data/heartwood/resources"

// Class promotions: the CEREMONY (Lv3 = pick 1 of 2 advanced classes,
// Lv5 = master the path or cross-train). Shown right after the level-up
// choice. A pick plays a short crowning flourish, then `onChoose(key, id)`.
export function PromotionCeremony({ subject, offers, onChoose }) {
  const [chosen, setChosen] = useState(null)
  const rank = pendingPromotionRank(subject)
  const base = CLASSES[subject.naturalClass]
  const res = RESOURCES[base?.resource || CLASS_RESOURCE_DEFAULT[subject.naturalClass]] || RESOURCES.arcane
  const current = PROMOTIONS[subject.promoPicks?.[0]]
  const other = current ? promotionsFor(current.base).find((p) => p.id !== current.id) : null
  const pick = (id) => {
    if (chosen) return
    setChosen(id)
    setTimeout(() => onChoose(subject.key, id), 900)
  }
  const card = (id, promo, { title, sub, skill, lines }) => (
    <button
      key={id}
      className={`hw-promo-card${chosen === id ? " is-chosen" : chosen ? " is-dimmed" : ""}`}
      data-promo-offer={id}
      onClick={() => pick(id)}
      disabled={!!chosen}
    >
      <span className="hw-promo-crest" aria-hidden="true">
        {promo.icon}
      </span>
      <span className="hw-promo-name">{title}</span>
      <span className="hw-promo-tagline">{sub}</span>
      {skill && (
        <span className="hw-promo-skill">
          <b>
            {skill.icon} {skill.name}
          </b>{" "}
          - {skill.text}
        </span>
      )}
      {lines.map((l, i) => (
        <span key={i} className="hw-promo-line" data-line={l.kind}>
          <b>{l.label}</b> {l.text}
        </span>
      ))}
    </button>
  )
  return (
    <div className="hw-intro hw-promotion" data-screen="promotion" data-promo-rank={rank} data-promo-subject={subject.key}>
      <div className="hw-promo-rays" aria-hidden="true" />
      <div className="hw-promo-eyebrow">{rank === 1 ? "Promotion ceremony" : "Mastery ceremony"}</div>
      <h2 className="hw-promo-title">
        {rank === 1 ? `${subject.name} is ready to rise!` : `${subject.name} reached Level 5!`}
      </h2>
      <p className="hw-promo-sub">
        {rank === 1
          ? `A ${base?.name || "hero"} can become one of two advanced classes. Choose - it's for life.`
          : `Master the ${current?.name} path, or cross-train and learn the ${other?.name}'s skill too.`}
      </p>
      <div className="hw-promo-grid">
        {rank === 1 &&
          offers.map((id) => {
            const p = PROMOTIONS[id]
            if (!p) return null
            return card(id, p, {
              title: p.name,
              sub: p.tagline,
              skill: p.skill,
              lines: [
                { kind: "stats", label: "Body:", text: `+${p.stats?.hp || 0} max HP, +${p.stats?.attack || 0} attack.` },
                { kind: "passive", label: `${p.passive?.name}:`, text: p.passive?.text || "" },
                { kind: "twist", label: `${res.icon} ${res.name}:`, text: p.twist?.text || "" },
              ],
            })
          })}
        {rank === 2 && current && (
          <>
            {card("master", current, {
              title: `Master: ${current.name} II`,
              sub: "Perfect the path you chose.",
              skill: null,
              lines: [{ kind: "master", label: `${current.skill.icon} ${current.skill.name}:`, text: current.master?.text || "" }],
            })}
            {other &&
              card("cross", other, {
                title: `Cross-train: ${other.name}`,
                sub: `Keep ${current.name}, and also learn:`,
                skill: other.skill,
                lines: [],
              })}
          </>
        )}
      </div>
    </div>
  )
}

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
