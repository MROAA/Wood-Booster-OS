// Hearthwood Frontier - mana sprint 3 board UI: mana COLOURS (skill pips,
// the "colours cast this turn" tracker, combo callouts are TacticsFx's),
// OVERCHANNEL (the toggle, a red cost preview on skill buttons, the Backlash
// meter on tokens), MANA-FED enemies (the Hunger meter on tokens, the
// "Feeds on mana" panel) and the "Mana colours & risks" help legend.
// Engine: services/heartwood/tacticsManaColours.js + tacticsManaFeed.js.
import { useState } from "react"
import { MANA_COLOURS, COLOUR_COMBOS, OVERCHANNEL, FEED_ANSWER } from "../../data/heartwood/manaColours"
import { affinityOf, skillColourOf, coloursThisTurn, combosThisTurn, comboIfCast, overchannelPlan, armOverchannel, LEY_COLOUR_CUT } from "../../services/heartwood/tacticsManaColours"
import { feedersIn, feedSummary } from "../../services/heartwood/tacticsManaFeed"
import { hasMana, canAfford } from "../../services/heartwood/tacticsMana"
import "./tactics-mana-colours.css"

const colourStyle = (id) => ({ "--mc": MANA_COLOURS[id]?.color || "#c9a35c" })

export function ColourPip({ colour, title, small = false }) {
  const c = MANA_COLOURS[colour]
  if (!c) return null
  return (
    <span className="hwt-colour-pip" data-colour={colour} data-small={small || undefined} style={colourStyle(colour)} title={title || `${c.name} mana - ${c.word}`}>
      {c.icon}
    </span>
  )
}

// On a skill button: its colour, the combo it would finish now, and (with
// Overchannel armed and the bar short) the exact HP + Backlash price.
export function SkillColourPip({ battle, unit, skill }) {
  if (!battle?.manaRules || !unit || !skill || unit.side !== "player") return null
  const colour = skillColourOf(skill, unit)
  const combo = battle.phase === "player" ? comboIfCast(battle, colour) : null
  const plan = unit.overchannelArmed && !canAfford({ ...unit, overchannelArmed: false }, skill) ? overchannelPlan(unit, skill, battle) : null
  const ley = unit.leyColours?.includes(colour)
  return (
    <span className="hwt-skill-colour" data-colour={colour}>
      <ColourPip colour={colour} small title={`${MANA_COLOURS[colour].name} skill${ley ? ` (ley line: ${LEY_COLOUR_CUT}% cheaper)` : ""}${combo ? ` - casting it now sets off ${combo.name}!` : ""}`} />
      {combo && (
        <span className="hwt-skill-combo-hint" data-combo={combo.id} title={`${combo.name}: ${combo.text}`}>
          → {combo.icon}
        </span>
      )}
      {plan && (
        <span className="hwt-overchannel-cost" data-blocked={plan.why ? "true" : undefined} title={plan.why || `Overchannel: ${plan.missing} short - pay ${plan.hp} HP and +${plan.backlash} Backlash (stunned at ${OVERCHANNEL.backlashMax}).`}>
          ⚡-{plan.hp} HP · +{plan.backlash}
        </span>
      )}
    </span>
  )
}

// Above the skill row: the turn's colour tracker, the hero's affinity and
// the Overchannel toggle.
export function ManaColourPanel({ battle, selected, onBattleChange }) {
  if (!battle?.manaRules) return null
  const cast = coloursThisTurn(battle)
  const hero = selected && selected.side === "player" && hasMana(selected) ? selected : null
  const aff = hero ? affinityOf(hero) : null
  const backlash = hero?.backlash || 0
  const full = backlash >= OVERCHANNEL.backlashMax
  const short = hero ? (hero.classSkills || []).some((sk) => !canAfford({ ...hero, overchannelArmed: false }, sk) && overchannelPlan(hero, sk, battle)) : false
  return (
    <div className="hwt-colour-panel">
      <div className="hwt-colour-tracker" data-colours={cast.map((e) => e.colour).join(" ") || undefined} title="Mana colours cast this turn. Two DIFFERENT colours in one turn set off a colour combo spell.">
        <span className="hwt-colour-tracker-label">This turn</span>
        {cast.length === 0 && <span className="hwt-colour-tracker-empty">no colours yet</span>}
        {cast.map((e, i) => (
          <span key={i} className="hwt-colour-cast" data-used={e.used || undefined} data-well={e.well || undefined} style={colourStyle(e.colour)} title={`${MANA_COLOURS[e.colour].name}${e.well ? " (from a Mana Well)" : ""}${e.used ? " - spent in a combo" : " - waiting for a partner colour"}`}>
            {MANA_COLOURS[e.colour].icon}
          </span>
        ))}
        {combosThisTurn(battle).map((id, i) => (
          <span key={`${id}${i}`} className="hwt-colour-combo-chip" data-combo={id} title={COLOUR_COMBOS[id].text}>
            {COLOUR_COMBOS[id].icon} {COLOUR_COMBOS[id].name}
          </span>
        ))}
      </div>
      {battle.leyNet?.colours?.length > 0 && (
        <div className="hwt-colour-ley" data-ley-colours={battle.leyNet.colours.join(" ")} title={`Your campaign ley network (strength ${battle.leyNet.strength}): skills of these colours cost ${LEY_COLOUR_CUT}% less.`}>
          Ley lines:
          {battle.leyNet.colours.map((c) => (
            <ColourPip key={c} colour={c} small />
          ))}
          <span className="hwt-colour-ley-note">-{LEY_COLOUR_CUT}% cost</span>
        </div>
      )}
      {hero && (
        <div className="hwt-colour-hero">
          <span className="hwt-affinity" data-affinity={aff} style={colourStyle(aff)} title={`${hero.name}'s affinity: ${MANA_COLOURS[aff].name}. ${MANA_COLOURS[aff].finisher}`}>
            {MANA_COLOURS[aff].icon} {MANA_COLOURS[aff].name} affinity
          </span>
          {battle.phase === "player" && (
            <button
              type="button"
              className="hwt-overchannel-btn"
              data-action="overchannel"
              data-armed={hero.overchannelArmed || undefined}
              data-short={short || undefined}
              disabled={full && !hero.overchannelArmed}
              onClick={() => onBattleChange(armOverchannel(battle, hero.id, !hero.overchannelArmed))}
              title={
                full
                  ? "The Backlash meter is full - this hero will be stunned at the start of its next turn. No more overchannelling."
                  : `OVERCHANNEL: cast a skill you can't afford by paying the missing mana in HP (1 HP per 4% short). Each overchannel fills the Backlash meter (+20 + % short${aff === "void" ? ", Void affinity: 40% less" : ""}). At ${OVERCHANNEL.backlashMax} the hero is STUNNED and takes ${OVERCHANNEL.backlashDamage} damage at the start of its next turn. The meter drains ${OVERCHANNEL.backlashDecay} a turn. One cast per toggle.`
              }
            >
              ⚡ {hero.overchannelArmed ? "Overchannel ON" : "Overchannel"}
            </button>
          )}
          {backlash > 0 && (
            <span className="hwt-backlash-readout" data-full={full || undefined}>
              Backlash {backlash}/{OVERCHANNEL.backlashMax}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// On a token: the Backlash meter (heroes) / the Hunger meter (feeders).
export function ManaTokenMarks({ unit }) {
  if (!unit || unit.hp <= 0) return null
  if (unit.side === "player" && unit.backlash > 0) {
    const pct = Math.min(100, Math.round((unit.backlash / OVERCHANNEL.backlashMax) * 100))
    const full = unit.backlash >= OVERCHANNEL.backlashMax
    return (
      <span className="hwt-backlash-meter" data-full={full || undefined} title={`Backlash ${unit.backlash}/${OVERCHANNEL.backlashMax}${full ? " - STUNNED + " + OVERCHANNEL.backlashDamage + " damage at the start of its next turn!" : ` - drains ${OVERCHANNEL.backlashDecay} a turn`}`}>
        <span className="hwt-backlash-fill" style={{ width: `${pct}%` }} />
        {full && <span className="hwt-backlash-warn">⚡</span>}
      </span>
    )
  }
  if (unit.side === "player" && unit.backlashStunned) {
    return (
      <span className="hwt-backlash-meter" data-stunned="true" title="Stunned by its own Backlash this turn.">
        <span className="hwt-backlash-warn">⚡</span>
      </span>
    )
  }
  if (unit.side === "enemy" && unit.manaFeed) {
    const k = unit.manaFeed
    const full = (unit.hunger || 0) >= k.max
    return (
      <span className="hwt-feed-meter" data-hunger={unit.hunger || 0} data-gorged={full || undefined} data-boss={k.boss || undefined} title={feedSummary(unit)}>
        <span className="hwt-feed-icon">{k.icon}</span>
        {Array.from({ length: k.max }, (_, i) => (
          <span key={i} className="hwt-feed-pip" data-on={i < (unit.hunger || 0) || undefined} />
        ))}
      </span>
    )
  }
  return null
}

// Under the Threat panel: which enemies feed on mana + the answer.
export function ManaFeedPanel({ battle }) {
  const feeders = feedersIn(battle)
  if (!feeders.length) return null
  const kinds = [...new Map(feeders.map((f) => [f.manaFeed.name, f])).values()]
  return (
    <div className="hwt-feed-panel" data-feed-panel={kinds.map((f) => f.manaFeed.id).join(" ")}>
      <div className="hwt-feed-title">🍽 Feeds on mana</div>
      {kinds.map((f) => (
        <div key={f.manaFeed.name} className="hwt-feed-row" title={feedSummary(f)}>
          <span className="hwt-feed-icon">{f.manaFeed.icon}</span>
          <span className="hwt-feed-name">{f.manaFeed.name}</span>
          <span className="hwt-feed-range">casts within {f.manaFeed.range} feed it</span>
        </div>
      ))}
      <div className="hwt-feed-answer">Bring: {FEED_ANSWER}.</div>
    </div>
  )
}

// "Mana colours & risks" legend (battle panel), like Element combos.
export function ManaColoursHelp() {
  const [open, setOpen] = useState(false)
  return (
    <div className="hwt-element-help hwt-colour-help" data-open={open}>
      <button className="hwt-element-help-btn" data-colour-help onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        🔥🌊🌿🌑 Mana colours & risks {open ? "▴" : "▾"}
      </button>
      {open && (
        <div className="hwt-element-help-body">
          <p className="hwt-element-help-intro">Every skill has a colour (the pip on its button). Cast two DIFFERENT colours in one turn - one hero or two - and they combine:</p>
          <ul>
            {Object.values(COLOUR_COMBOS).map((c) => (
              <li key={c.id} data-colour-combo={c.id}>
                <b>
                  {c.icon} {c.name}
                </b>{" "}
                <span className="hwt-element-help-recipe">
                  {MANA_COLOURS[c.pair[0]].icon} {MANA_COLOURS[c.pair[0]].name} + {MANA_COLOURS[c.pair[1]].icon} {MANA_COLOURS[c.pair[1]].name}
                </span>{" "}
                - {c.text}
              </li>
            ))}
          </ul>
          <p className="hwt-element-help-intro">
            Affinity: {Object.values(MANA_COLOURS).map((c) => `${c.icon} ${c.name}: ${c.finisher}`).join(" ")} A hero starting its turn on a Mana Well has the well's colour primed.
          </p>
          <p className="hwt-element-help-intro">
            ⚡ Overchannel: arm it, then cast a skill you can't afford - pay the shortfall in HP and fill the red Backlash meter. At {OVERCHANNEL.backlashMax} the hero is stunned and hurt at the start of its next turn. No luck involved.
          </p>
          <p className="hwt-element-help-intro">🍽 Some enemies feed on mana spent near them (the purple Hunger pips): cast away from them, attack instead, burn their mana, or kill them first.</p>
        </div>
      )}
    </div>
  )
}
