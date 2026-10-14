// Hearthwood Frontier - combat depth sprint UI (tacticsDepth.js): the
// round timeline, the hero's Stance / Reaction / Delay buttons, and the
// small token chips (stance, held reaction, combo setups, stagger).
// Pure render helpers - every click dispatches a pure engine function
// through `onBattleChange`, same as the rest of TacticsBoard.
import {
  STANCES,
  STANCE_IDS,
  REACTIONS,
  REACTION_IDS,
  SETUPS,
  COMBO_HELP,
  depthOn,
  canChangeStance,
  setStance,
  stanceText,
  reactionBlockReason,
  readyReaction,
  interruptCost,
  canDelay,
  delayAction,
  setupsOn,
  setupOf,
  turnTimeline,
  DELAY_BONUS_AP,
} from "../../services/heartwood/tacticsDepth"
import { hasMana, resourceLabel } from "../../services/heartwood/tacticsMana"
import { useState } from "react"

const INTENT_WORD = {
  attack: "strikes",
  "move-attack": "moves in and strikes",
  move: "moves",
  hold: "holds",
  skill: "uses a skill",
  ultimate: "ULTIMATE",
  aoe: "hits every hero",
  overwatch: "watches",
  wall: "smashes an obstacle",
  stunned: "is stunned",
  reeling: "reels - acts next round",
}

function Chip({ unit, side, extra = {}, title, children, onClick }) {
  const body = (
    <>
      <span className="hwt-tl-name">{unit.name.split(" ")[0]}</span>
      {children}
    </>
  )
  // A span when it isn't clickable (a disabled button would hide its tooltip).
  return onClick ? (
    <button type="button" className="hwt-tl-chip" data-tl-side={side} data-tl-unit={unit.id} title={title} onClick={onClick} {...extra}>
      {body}
    </button>
  ) : (
    <span className="hwt-tl-chip" data-tl-side={side} data-tl-unit={unit.id} title={title} {...extra}>
      {body}
    </span>
  )
}

// The round as a timeline: heroes (any order) -> enemies in the exact
// order they will act (from the enemy preview) -> Delayed heroes at the
// end of the round -> the next round.
export function TurnTimeline({ battle, intents, selectedId, onSelect }) {
  if (!depthOn(battle) || (battle.phase !== "player" && battle.phase !== "enemy")) return null
  const tl = turnTimeline(battle, intents)
  const playerPhase = battle.phase === "player"
  return (
    <div className="hwt-timeline" role="list" aria-label="Turn order this round">
      <span className="hwt-tl-round" title="One round = your heroes act (in any order you like), then every enemy acts in this order">
        Round {tl.round}
      </span>
      <span className="hwt-tl-group" data-tl-group="heroes" data-tl-now={playerPhase || undefined}>
        <span className="hwt-tl-label">{playerPhase ? "NOW - your heroes" : "Your heroes"}</span>
        {tl.heroes.map((h) => (
          <Chip
            key={h.id}
            unit={h.unit}
            side="player"
            extra={{ "data-tl-status": h.status, "data-selected": h.id === selectedId || undefined }}
            title={`${h.name}: ${h.status === "ready" ? `${h.unit.ap} AP left - act in any order` : "done this round"}${h.reaction ? ` · holds ${h.reaction === "overwatch" ? "Overwatch" : REACTIONS[h.reaction].name} for the enemy turn` : ""}`}
            onClick={playerPhase && h.status === "ready" ? () => onSelect(h.unit) : null}
          >
            <span className="hwt-tl-ap">{"●".repeat(Math.max(0, h.unit.ap))}</span>
            {h.reaction && <span className="hwt-tl-react">{h.reaction === "overwatch" ? "👁" : REACTIONS[h.reaction].icon}</span>}
          </Chip>
        ))}
      </span>
      <span className="hwt-tl-arrow" aria-hidden="true">
        ➜
      </span>
      <span className="hwt-tl-group" data-tl-group="enemies" data-tl-now={!playerPhase || undefined}>
        <span className="hwt-tl-label">Enemies, in order</span>
        {tl.enemies.map((e) => (
          <Chip
            key={e.id}
            unit={e.unit}
            side="enemy"
            extra={{ "data-tl-next": e.id === tl.nextEnemyId ? "true" : undefined, "data-tl-staggered": e.staggered || undefined }}
            title={`${e.index}. ${e.name} ${e.intent ? INTENT_WORD[e.intent.kind] || e.intent.kind : ""}${e.staggered ? " - STAGGERED: pushed to the back, only 1 AP" : ""}${e.reactions.length ? ` - sets off your ${e.reactions.map((r) => REACTIONS[r.kind]?.name).join(", ")}` : ""}${e.id === tl.nextEnemyId ? " - acts NEXT" : ""}`}
          >
            <span className="hwt-tl-num">{e.index}</span>
            {e.staggered && <span className="hwt-tl-stag">↓</span>}
            {e.reactions.map((r) => (
              <span key={r.kind + r.heroId} className="hwt-tl-react" data-reaction={r.kind}>
                {REACTIONS[r.kind]?.icon}
              </span>
            ))}
          </Chip>
        ))}
      </span>
      {(tl.delayed.length > 0 || tl.reeling.length > 0) && (
        <>
          <span className="hwt-tl-arrow" aria-hidden="true">
            ➜
          </span>
          <span className="hwt-tl-group" data-tl-group="late">
            <span className="hwt-tl-label">End of round</span>
            {tl.delayed.map((h) => (
              <Chip key={h.id} unit={h.unit} side="player" extra={{ "data-tl-delayed": "true" }} title={`${h.name} DELAYED: acts at the end of the round, after the enemies - opens next round with +${DELAY_BONUS_AP} AP`}>
                <span className="hwt-tl-react">⏳</span>
              </Chip>
            ))}
            {tl.reeling.map((e) => (
              <Chip key={e.id} unit={e.unit} side="enemy" extra={{ "data-tl-reeling": "true" }} title={`${e.name} is REELING - staggered twice, its action slides into the next round`}>
                <span className="hwt-tl-stag">↓↓</span>
              </Chip>
            ))}
          </span>
        </>
      )}
    </div>
  )
}

// Stance (free, before acting) + Reactions / Delay (hold the AP left).
export function DepthActions({ battle, selected, onBattleChange, onClearMode }) {
  if (!depthOn(battle) || !selected || selected.side !== "player" || battle.phase !== "player") return null
  const stanceOpen = canChangeStance(battle, selected)
  const act = (next) => {
    onClearMode()
    onBattleChange(next)
  }
  const setup = setupOf(selected)
  return (
    <div className="hwt-depth-actions">
      <div className="hwt-depth-row" data-row="stance">
        <span className="hwt-depth-label" title="Pick a stance BEFORE this hero acts this turn (free). Clicking the active one returns to Balanced.">
          Stance
        </span>
        {STANCE_IDS.map((id) => (
          <button
            key={id}
            type="button"
            className="hwt-depth-btn"
            data-action={`stance-${id}`}
            data-active={selected.stance === id || undefined}
            disabled={!stanceOpen}
            onClick={() => act(setStance(battle, selected.id, id))}
            title={`${stanceText(selected, id)}${stanceOpen ? "" : "\nThe stance is picked before the hero acts this turn."}`}
          >
            <span className="hwt-universal-icon">{STANCES[id].icon}</span> {STANCES[id].name}
          </button>
        ))}
      </div>
      <div className="hwt-depth-row" data-row="react">
        <span className="hwt-depth-label" title="Keep 1 AP for the ENEMY turn. One reaction per hero - Overwatch counts as one.">
          React
        </span>
        {REACTION_IDS.map((id) => {
          const why = reactionBlockReason(battle, selected, id)
          const cost = id === "interrupt" && hasMana(selected) ? interruptCost(selected) : 0
          return (
            <button
              key={id}
              type="button"
              className="hwt-depth-btn"
              data-action={`react-${id}`}
              data-active={selected.reaction === id || undefined}
              disabled={!!why}
              onClick={() => act(readyReaction(battle, selected.id, id))}
              title={`${REACTIONS[id].name} (1 AP, held for the enemy turn): ${REACTIONS[id].text}${why ? `\n${why}.` : selected.reaction === id ? "\nClick again to stand down (AP back)." : ""}`}
            >
              <span className="hwt-universal-icon">{REACTIONS[id].icon}</span> {REACTIONS[id].name}
              {cost > 0 && cost !== Infinity && <small className="hwt-universal-cost">{cost} {resourceLabel(selected)}</small>}
            </button>
          )
        })}
        <button
          type="button"
          className="hwt-depth-btn"
          data-action="delay"
          disabled={!canDelay(battle, selected)}
          onClick={() => act(delayAction(battle, selected.id))}
          title={`Delay: this hero steps back in the turn order - it ends its turn now and acts at the END of the round, after the enemies. It opens the next round with +${DELAY_BONUS_AP} AP. Not two rounds in a row.${selected.delayLock ? "\nIt delayed last round." : ""}`}
        >
          <span className="hwt-universal-icon">⏳</span> Delay
        </button>
      </div>
      {setup && (
        <div className="hwt-depth-hint" title={COMBO_HELP.map((c) => c.text).join("\n")}>
          Combos: this hero's hits leave <b>{SETUPS[setup].icon} {SETUPS[setup].name}</b> - another hero cashes it in. {SETUPS[setup].text.split(" - ")[1]}
        </div>
      )}
    </div>
  )
}

// Token chips: stance + held reaction (right edge), setups + stagger (left).
export function DepthTokenChips({ unit, battle }) {
  if (!depthOn(battle)) return null
  const setups = setupsOn(unit)
  const stance = unit.stance && STANCES[unit.stance]
  const reaction = unit.reaction && REACTIONS[unit.reaction]
  return (
    <>
      {(stance || reaction || unit.delayed > 0) && (
        <span className="hwt-depth-right">
          {stance && (
            <span className="hwt-hero-stance" data-stance={unit.stance} title={`${unit.side === "player" ? "" : "Enemy "}${stanceText(unit, unit.stance)}${unit.parryReady ? " It will parry your first melee hit." : ""}`}>
              {stance.icon}
            </span>
          )}
          {reaction && (
            <span className="hwt-react-badge" data-reaction={unit.reaction} title={`${reaction.name} ready: ${reaction.text}`}>
              {reaction.icon}
            </span>
          )}
          {unit.delayed > 0 && (
            <span className="hwt-react-badge" data-reaction="delay" title={`Delayed - acts after the enemies: +${unit.delayed} AP next round`}>
              ⏳
            </span>
          )}
        </span>
      )}
      {(setups.length > 0 || unit.stagger > 0) && (
        <span className="hwt-depth-left">
          {setups.map((s) => (
            <span key={s.id} className="hwt-setup-badge" data-setup={s.id} title={s.text}>
              {s.icon}
            </span>
          ))}
          {unit.stagger > 0 && (
            <span className="hwt-stagger-badge" data-stagger={unit.stagger} title={unit.stagger >= 2 ? "REELING - loses its next action (it slides into the next round)" : "STAGGERED - acts last next round, with only 1 AP"}>
              {unit.stagger >= 2 ? "↓↓" : "↓"}
            </span>
          )}
        </span>
      )}
    </>
  )
}

// On an enemy's intent: the held reactions this action will set off.
export function IntentReactionMarks({ intent }) {
  if (!intent?.reactions?.length && !intent?.staggered && intent?.kind !== "reeling") return null
  return (
    <span className="hwt-intent-depth">
      {intent.kind === "reeling" && <span title="Reeling - loses this action">↓↓</span>}
      {intent.staggered && <span title="Staggered - acts last, with 1 AP">↓</span>}
      {(intent.reactions || []).map((r) => (
        <span key={r.kind + r.heroId} data-reaction={r.kind} title={`Sets off your ${REACTIONS[r.kind]?.name}`}>
          {REACTIONS[r.kind]?.icon}
        </span>
      ))}
    </span>
  )
}

// Panel help: the four combat-depth systems in plain words.
export function DepthHelp({ battle }) {
  const [open, setOpen] = useState(false)
  if (!depthOn(battle)) return null
  return (
    <div className="hwt-element-help hwt-depth-help" data-open={open}>
      <button className="hwt-element-help-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        ⤵◎💧 Hero combos &amp; tactics {open ? "▴" : "▾"}
      </button>
      {open && (
        <div className="hwt-element-help-body">
          <p className="hwt-element-help-intro">Each hero's hits leave a mark on the enemy. ANOTHER hero cashes it in (gold glow + COMBO tag):</p>
          <ul>
            {COMBO_HELP.map((c) => (
              <li key={c.id}>{c.text}</li>
            ))}
          </ul>
          <p className="hwt-element-help-intro">
            <b>Stance</b> (free, before the hero acts): ⚔ Aggressive hits harder but takes more, 🛡 Defensive braces (Block, 1 less move), ✧ Focus builds resource but hits softer.
          </p>
          <p className="hwt-element-help-intro">
            <b>React</b> (keep 1 AP for the enemy turn): 🛡 Parry, ⚔ Counter, ✋ Interrupt (costs resource). The enemy's plan shows which of its actions set them off. Overwatch counts as the hero's reaction.
          </p>
          <p className="hwt-element-help-intro">
            <b>Turn order</b> (bar above the board): ⏳ Delay a hero to act after the enemies (+{DELAY_BONUS_AP} AP next round). Knockbacks, Finishers, Shocks and Parries ↓ Stagger an enemy: it acts last with 1 AP; twice = ↓↓ Reeling, it loses its action.
          </p>
          <p className="hwt-element-help-intro">Enemies brace too: a badly hurt enemy turns Defensive and parries your first melee hit; Berserkers go Aggressive.</p>
        </div>
      )}
    </div>
  )
}
