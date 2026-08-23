import { useEffect } from "react"
import { UNITS } from "../../data/heartwood/units"
import { ENEMIES } from "../../data/heartwood/enemies"
import { TRIBES, tribesOf, resolveSynergies, nextSynergyThreshold } from "../../data/heartwood/synergies"
import { isShielded } from "../../services/heartwood/targeting"
import { summarizeBattle } from "../../services/heartwood/autoBattleEngine"
import EnemyPieceCard from "./EnemyPieceCard"
import ResultOverlay from "./ResultOverlay"
import FloatingNumbers from "./FloatingNumbers"
import { CardGlyph } from "./cardArt"

// Real time between rounds during auto-playback - fast enough that a
// typical 5-10 round fight resolves in a few seconds, slow enough that
// FloatingNumbers/hit-flash are actually visible as separate events
// rather than a blur.
const ROUND_DELAY_MS = 550

// How long a stagger step waits before the next queued lunge starts -
// several hits can land in the same round (a whole squad's worth), so
// this staggers them into a readable little sequence rather than every
// piece jolting at once.
const LUNGE_STAGGER_MS = 160

function cellsByPos(units) {
  const map = {}
  for (const u of units) map[`${u.pos.row}-${u.pos.col}`] = u
  return map
}

// Marc: "autobattle animoidaan samaan tapaan kuin heartstonen
// battlegroundsissa" (the autobattle should animate the way Hearthstone
// Battlegrounds does) - HSBB's whole visual identity is the attacking
// piece physically lunging toward its target, not just the victim
// flashing (FloatingNumbers' existing hit-flash only ever animates the
// defender - the attacker used to stay completely still). A direct DOM
// transform, same imperative fire-and-forget pattern FloatingNumbers'
// own flashHit already uses, rather than React state - nothing else in
// the app needs to know a lunge happened.
function lungeAttack(actorId, targetId) {
  const actorEl = document.querySelector(`[data-unit-id="${actorId}"]`)
  const targetEl = document.querySelector(`[data-unit-id="${targetId}"]`)
  if (!actorEl || !targetEl) return
  const a = actorEl.getBoundingClientRect()
  const t = targetEl.getBoundingClientRect()
  const dx = t.left + t.width / 2 - (a.left + a.width / 2)
  const dy = t.top + t.height / 2 - (a.top + a.height / 2)
  const dist = Math.hypot(dx, dy) || 1
  // Travel partway, not all the way - a lunge toward the target, not a
  // teleport onto it. Capped so a long diagonal (opposite grid corners)
  // doesn't send a piece flying off its own square.
  const travel = Math.min(dist * 0.35, 46)
  const ux = (dx / dist) * travel
  const uy = (dy / dist) * travel
  actorEl.style.transition = "transform 160ms ease-out"
  actorEl.style.transform = `translate(${ux}px, ${uy}px)`
  setTimeout(() => {
    actorEl.style.transition = "transform 220ms ease-in"
    actorEl.style.transform = ""
  }, 160)
}

// Replaces BattleScreen.jsx for combat: no hand, no targeting clicks,
// and (per Marc: "battle should be automated" / "skip the click
// entirely") no Auto-Resolve click either - the fight plays itself out
// automatically via the timer below. It does NOT resolve in one jump
// any more, though: an earlier version had HeartwoodBattle.jsx compute
// the whole fight synchronously before this component ever mounted, so
// `state` always arrived already at its final won/lost result - which
// meant FloatingNumbers (built to diff HP/Block between successive
// renders) never had a "before" state to compare against and silently
// showed nothing, no hit-flash, no damage numbers, just an instant cut
// to the result overlay. Marc: "peli tarvitsee lisää animaatioita ja
// selkeyttä" (the game needs more animations and clarity) - the fix
// keeps the "no clicks needed" promise intact while giving the
// animation system rounds to actually animate: onAdvanceRound fires on
// a timer for as long as state.phase === "player", same as a player
// repeatedly clicking the old "Next Round" button, just automatic.
export default function AutoBattleView({ state, essenceOnWin, nodeType, onAdvanceRound, onContinue }) {
  useEffect(() => {
    if (state.phase !== "player") return
    const timer = setTimeout(onAdvanceRound, ROUND_DELAY_MS)
    return () => clearTimeout(timer)
  }, [state, onAdvanceRound])

  // Stages this round's attacks (effects.js's dealDamage recording each
  // one into state.roundEvents, reset per round by resolveRound) into a
  // short staggered lunge sequence - fires once per round transition,
  // same [state] dependency FloatingNumbers already uses for its own
  // diff-on-change detection.
  useEffect(() => {
    const events = state.roundEvents || []
    const timers = events.map((ev, i) => setTimeout(() => lungeAttack(ev.actorId, ev.targetId), i * LUNGE_STAGGER_MS))
    return () => timers.forEach(clearTimeout)
  }, [state])

  const playerMap = cellsByPos(state.playerUnits)
  const enemyMap = cellsByPos(state.enemies)
  const interactive = state.phase === "player"

  // Tribe synergies, shown live during the fight too - not just on the
  // pre-battle FormationScreen. Same scope autoBattleEngine.js's own
  // tribe-counting loop uses (recruited units only - excludes the
  // Commander and any battle-start summon, neither of which was
  // something the player shopped for), so this can never show
  // something the fight isn't actually granting. Marc: "i like the
  // idea of having tribes in the game" - worth making it feel present
  // throughout the fight, not just a planning-screen footnote.
  const tribeCounts = {}
  for (const u of state.playerUnits) {
    if (u.id === "commander" || u.summoned) continue
    for (const t of tribesOf(u.defId, UNITS[u.defId])) tribeCounts[t] = (tribeCounts[t] || 0) + 1
  }
  const activeSynergies = resolveSynergies(tribeCounts)

  const rows = []
  for (let row = 0; row < state.grid.rows; row++) {
    const cells = []
    for (let col = 0; col < state.grid.cols; col++) {
      const key = `${row}-${col}`
      const enemy = enemyMap[key]
      const playerUnit = playerMap[key]
      let content = null
      if (enemy) {
        content = (
          <EnemyPieceCard enemy={enemy} art={ENEMIES[enemy.defId].art} shielded={isShielded(state, enemy.id)} />
        )
      } else if (playerUnit) {
        // The Commander's own defId is deliberately null (it isn't a
        // UNITS entry) - its art comes from characters.js instead, so
        // it's carried directly on the unit object itself rather than
        // looked up by defId here.
        const art = playerUnit.id === "commander" ? playerUnit.art : UNITS[playerUnit.defId].art
        content = (
          <EnemyPieceCard
            enemy={playerUnit}
            art={art}
            side="player"
            shielded={isShielded(state, playerUnit.id)}
            summoned={playerUnit.summoned}
          />
        )
      }
      cells.push(
        <div key={key} className="hw-grid-cell" data-tile={(row + col) % 2 === 0 ? "a" : "b"} data-empty={!content}>
          {content}
        </div>,
      )
    }
    rows.push(
      <div className="hw-grid-row" key={row}>
        {cells}
      </div>,
    )
  }

  return (
    <div className="hw-battle" data-elevated={nodeType === "miniboss" || nodeType === "boss"} style={{ position: "relative" }}>
      {/* A miniboss/boss fight got zero distinct treatment once the
          actual battle started - FormationScreen.jsx's own flavor text
          was the only cue, gone the moment the fight began. A
          Hearthstone-style elevated banner (own accent, own icon)
          keeps that "this one's different" feeling present for the
          whole fight, not just the moment before it. */}
      {nodeType === "miniboss" && (
        <div className="hw-elevated-banner hw-section-fade-in">
          <CardGlyph name="flame" className="hw-intent-glyph" /> Miniboss
        </div>
      )}
      {nodeType === "boss" && (
        <div className="hw-elevated-banner hw-elevated-banner--boss hw-section-fade-in">
          <CardGlyph name="spacemonkeyBoss" className="hw-intent-glyph" /> The Final Fight
        </div>
      )}

      <div className="hw-hint">{interactive ? `Round ${state.round}. The squads clash automatically.` : "The fight is decided."}</div>

      {Object.keys(tribeCounts).length > 0 && (
        <div className="hw-section-fade-in" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          {Object.entries(tribeCounts).map(([tribeId, count]) => {
            const tribe = TRIBES[tribeId]
            const active = activeSynergies.find((s) => s.tribeId === tribeId)
            const next = nextSynergyThreshold(tribeId, count)
            return (
              <span
                key={tribeId}
                className={`hw-badge${active ? " hw-badge--active" : ""}`}
                style={!active ? { color: tribe?.color, borderColor: tribe?.color } : undefined}
                title={tribe?.description}
              >
                <CardGlyph name={tribe?.icon} className="hw-intent-glyph" />
                {tribe?.name} {count}
                {active ? " ✓" : ""}
                {next ? ` (${next} for more)` : ""}
              </span>
            )
          })}
        </div>
      )}

      <FloatingNumbers state={state} />

      <div className="hw-section-label">Battlefield</div>
      <div className="hw-grid">{rows}</div>

      <details className="hw-log-details">
        <summary>Battle log</summary>
        <div className="hw-log">
          {state.log.slice(-10).map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      </details>

      <ResultOverlay
        phase={state.phase}
        enemyName={state.enemies[0]?.name || "The enemy"}
        stats={state.phase === "won" || state.phase === "lost" ? summarizeBattle(state) : null}
        essenceOnWin={essenceOnWin}
        onContinue={onContinue}
      />
    </div>
  )
}
