// Hearthwood Frontier - the shared board+panel+result renderer, extracted
// from HeartwoodTactics.jsx (Phase 4 second slice: "fight one real battle
// for real") so the standalone /heartwood-tactics prototype page AND the
// new real-in-run battle branch in HeartwoodBattle.jsx can share ONE
// rendering + interaction-dispatch implementation instead of maintaining
// two copies of every archetype badge/highlight.
//
// Owns ZERO state itself - `battle`/`selectedId`/`abilityMode` are all
// caller-owned props (mirroring exactly how HeartwoodTactics.jsx already
// managed them before this extraction), so the caller decides where that
// state lives (local useState for the standalone page, runState-backed
// for a real fight). This component only decides WHAT to render and WHICH
// pure tacticsEngine.js function a click should call - it dispatches the
// result via `onBattleChange`, never holds the battle itself.
import { useMemo } from "react"
import { CardGlyph } from "./cardArt"
import { kingAdjacent } from "../../services/heartwood/targeting"
import {
  reachableTilesFor,
  attackableTargets,
  moveUnit,
  attackUnit,
  castAbility,
  endPlayerTurn,
  activateCommanderPower,
  previewEnemyIntents,
  previewChargeThreat,
  zoneOfControlCells,
  threatZoneCells,
  fearZoneCells,
  frostZoneCells,
  thornZoneCells,
  flankRole,
} from "../../services/heartwood/tacticsEngine"
import { motion } from "framer-motion"

function apPips(unit) {
  return Array.from({ length: unit.apMax }, (_, i) => (i < unit.ap ? "●" : "○")).join("")
}

// Facing round: a plain compass arrow, no new icon asset - always
// shown (unlike most badges, which are conditional on a stack/status
// being active), since facing is a permanent property of every unit,
// the same "always shown" category the AP-pips indicator already is.
const FACING_ARROW = { N: "↑", S: "↓", E: "→", W: "←" }

function getUnitName(battle, id) {
  return battle.units.find((u) => u.id === id)?.name || "?"
}

export default function TacticsBoard({
  battle,
  onBattleChange,
  selectedId,
  onSelectedIdChange,
  abilityMode,
  onAbilityModeChange,
  resultActions,
  children,
}) {
  const selected = battle.units.find((u) => u.id === selectedId) || null
  const reachable = useMemo(
    () => (selected && selected.ap > 0 && !abilityMode && battle.phase === "player" ? reachableTilesFor(battle, selected.id) : []),
    [battle, selected, abilityMode],
  )
  const targets = useMemo(
    () => (selected && selected.ap > 0 && battle.phase === "player" && abilityMode !== "heal" ? attackableTargets(battle, selected.id) : []),
    [battle, selected, abilityMode],
  )
  // Ability-only highlight: self + adjacent living allies, only while the
  // Regrowth heal ability is armed. Distinct data-attr from the move
  // highlight even though both lean on the same moss accent.
  const healable = useMemo(
    () =>
      selected && abilityMode === "heal" && battle.phase === "player"
        ? battle.units.filter((u) => u.hp > 0 && u.side === selected.side && (u.id === selected.id || kingAdjacent(u.pos, selected.pos)))
        : [],
    [battle, selected, abilityMode],
  )
  // What every living enemy currently plans to do this coming enemy phase -
  // recomputed fresh from the live board each render, so it's always exactly
  // what will happen if the player ends the turn right now, never a stale
  // guess. See tacticsEngine.js's previewEnemyIntents for the accuracy proof.
  const intents = useMemo(
    () => (battle.phase === "player" ? previewEnemyIntents(battle) : []),
    [battle],
  )
  const intentByEnemyId = useMemo(() => new Map(intents.map((i) => [i.enemyId, i.intent])), [intents])
  const threatenedIds = useMemo(() => {
    const ids = new Set()
    for (const { intent } of intents) {
      if (intent.kind === "attack" || intent.kind === "move-attack") ids.add(intent.targetId)
      // The final boss's real AoE - unlike a single-target attack, it
      // hits every living player unit at once, so every one of them is
      // threatened, not just one chosen target.
      if (intent.kind === "aoe") {
        for (const p of battle.units) {
          if (p.side === "player" && p.hp > 0) ids.add(p.id)
        }
      }
    }
    return ids
  }, [intents, battle])
  // Same idea, for the Ancients' telegraphed AoE: whether ending the turn
  // right now lands the payoff, and on whom. Distinct from the per-target
  // intent above since a charge payoff hits every living player unit at
  // once, not a single chosen target.
  const chargeThreat = useMemo(
    () => (battle.phase === "player" ? previewChargeThreat(battle) : { enemyIds: [], playerIds: [] }),
    [battle],
  )
  const chargeThreatenedIds = useMemo(() => new Set(chargeThreat.playerIds), [chargeThreat])
  const chargeFiringIds = useMemo(() => new Set(chargeThreat.enemyIds), [chargeThreat])
  // Zone of Control round: a static board property (which tiles are
  // dangerous to retreat FROM), not relative to whichever unit is
  // currently selected - visible throughout the player's own turn,
  // same phase-gating as the charge/intent telegraphs above.
  const zocCells = useMemo(() => (battle.phase === "player" ? zoneOfControlCells(battle, "enemy") : new Set()), [battle])
  // Threat Zone round: same static, phase-gated pattern as zocCells
  // above - a separate set since a cell can be in one, both, or
  // neither (the 2 mechanics are additive, not mutually exclusive).
  const threatCells = useMemo(() => (battle.phase === "player" ? threatZoneCells(battle, "enemy") : new Set()), [battle])
  // Fear Zone round: same static, phase-gated pattern as zocCells/
  // threatCells above - a separate set since a cell can be in any
  // combination of the 3 zone types at once (they're additive, not
  // mutually exclusive).
  const fearCells = useMemo(() => (battle.phase === "player" ? fearZoneCells(battle, "enemy") : new Set()), [battle])
  // Frost Zone round: same static, phase-gated pattern as the 3 zone
  // sets above - side "player" here, not "enemy", since this round's
  // one real hand-authored example (frostbind) is a PLAYER unit (no
  // enemy carries any cold/ice flavor today) - a deliberate, stated
  // flip from every prior zone overlay.
  const frostCells = useMemo(() => (battle.phase === "player" ? frostZoneCells(battle, "player") : new Set()), [battle])
  // Thorn Zone round: back to side "enemy" like every zone type
  // except Frost Zone's own player-side flip - rootbind-thicket is an
  // enemy.
  const thornCells = useMemo(() => (battle.phase === "player" ? thornZoneCells(battle, "enemy") : new Set()), [battle])

  const cellUnit = (row, col) => battle.units.find((u) => u.pos.row === row && u.pos.col === col && u.hp > 0)
  const isReachable = (row, col) => reachable.some((p) => p.row === row && p.col === col)
  // A cell's own terrain type - an omitted entry (every pre-terrain
  // formation, and every cell not named in a formation's own terrain
  // map) defaults to "path", the exact same fallback tacticsEngine.js's
  // own terrainAt uses.
  const terrainHere = (row, col) => battle.terrain?.[`${row}-${col}`] || "path"
  const targetHere = (row, col) => targets.find((t) => t.pos.row === row && t.pos.col === col)
  const healableHere = (row, col) => healable.find((u) => u.pos.row === row && u.pos.col === col)

  function handleCellClick(row, col) {
    if (battle.phase !== "player") return

    if (selected && abilityMode === "heal") {
      const healTarget = healableHere(row, col)
      if (healTarget) onBattleChange(castAbility(battle, selected.id, healTarget.id))
      onAbilityModeChange(null)
      return
    }

    if (selected && abilityMode === "burst") {
      const target = targetHere(row, col)
      if (target) onBattleChange(castAbility(battle, selected.id, target.id))
      onAbilityModeChange(null)
      return
    }

    const target = targetHere(row, col)
    if (selected && target) {
      onBattleChange(attackUnit(battle, selected.id, target.id))
      return
    }
    if (selected && isReachable(row, col)) {
      onBattleChange(moveUnit(battle, selected.id, { row, col }))
      return
    }
    const occupant = cellUnit(row, col)
    if (occupant && occupant.side === "player" && occupant.ap > 0) {
      onSelectedIdChange(occupant.id)
    } else {
      onSelectedIdChange(null)
    }
    onAbilityModeChange(null)
  }

  function handleAbilityClick() {
    if (!selected || !selected.ability || battle.phase !== "player") return
    const ability = selected.ability
    if (selected.ap < ability.cost || selected.cooldownRemaining > 0) return
    if (ability.kind === "aura-block") {
      onBattleChange(castAbility(battle, selected.id))
      onAbilityModeChange(null)
      return
    }
    const kind = ability.kind === "heal" ? "heal" : "burst"
    onAbilityModeChange(abilityMode === kind ? null : kind)
  }

  function handleActivePower() {
    onAbilityModeChange(null)
    onBattleChange(activateCommanderPower(battle))
  }

  function handleEndTurn() {
    onSelectedIdChange(null)
    onAbilityModeChange(null)
    onBattleChange(endPlayerTurn(battle))
  }

  const cells = []
  for (let row = 0; row < battle.grid.rows; row++) {
    for (let col = 0; col < battle.grid.cols; col++) {
      const unit = cellUnit(row, col)
      const reach = selected && isReachable(row, col)
      const target = selected && targetHere(row, col)
      const healTarget = selected && healableHere(row, col)
      const threatened = unit && unit.side === "player" && (threatenedIds.has(unit.id) || chargeThreatenedIds.has(unit.id))
      const intent = unit && unit.side === "enemy" ? intentByEnemyId.get(unit.id) : null
      const terrain = terrainHere(row, col)
      const zoc = zocCells.has(`${row}-${col}`)
      const threatZone = threatCells.has(`${row}-${col}`)
      const fearZone = fearCells.has(`${row}-${col}`)
      const frostZone = frostCells.has(`${row}-${col}`)
      const thornZone = thornCells.has(`${row}-${col}`)
      cells.push(
        <div
          key={`${row}-${col}`}
          className="hwt-cell"
          data-reachable={!!reach}
          data-targetable={!!target}
          data-healable={!!healTarget}
          data-threatened={!!threatened}
          data-terrain={terrain}
          data-zoc={zoc}
          data-threat-zone={threatZone}
          data-fear-zone={fearZone}
          data-frost-zone={frostZone}
          data-thorn-zone={thornZone}
          onClick={() => handleCellClick(row, col)}
        >
          {unit && (
            <motion.div
              layout
              layoutId={unit.id}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="hwt-token"
              data-side={unit.side}
              data-selectable={unit.side === "player" && battle.phase === "player"}
              data-selected={unit.id === selectedId}
              data-acted={unit.ap <= 0}
              data-power-surge={unit.side === "player" && battle.activePower?.used && battle.activePower.firedTurn === battle.turn}
              data-spirit={!!unit.isSpirit}
            >
              <div className="hwt-token-status">
                {unit.id === "player-commander" && (
                  <span className="hwt-commander-badge" title={`${unit.name} - your Commander`}>
                    ♛
                  </span>
                )}
                {unit.haste && (
                  <span className="hwt-haste-badge" title="Haste - attacks a second time whenever it lands an attack">
                    ⇉
                  </span>
                )}
                {unit.spiritbound && (
                  <span
                    className="hwt-spiritshift-badge"
                    data-used={!!unit.spiritShiftUsed}
                    title={
                      unit.spiritShiftUsed
                        ? "Spirit Shift - already used this round"
                        : "Spirit Shift - when attacked on the enemy's turn, swaps places with a spirit within 2 tiles, and the spirit takes the blow (once per round)"
                    }
                  >
                    ⇄
                  </span>
                )}
                {flankRole(unit.className) === "benefit" && (
                  <span className="hwt-flank-benefit-badge" title={`${unit.className} - deals +5%/+10% extra when attacking from the side/behind`}>
                    ⚔
                  </span>
                )}
                {flankRole(unit.className) === "resist" && (
                  <span className="hwt-flank-resist-badge" title={`${unit.className} - takes 5%/10% less when hit from the side/behind`}>
                    🛡
                  </span>
                )}
                <span className="hwt-ap-pips" title={`${unit.ap}/${unit.apMax} AP`}>
                  {apPips(unit)}
                </span>
                <span className="hwt-facing-badge" title={`Facing ${unit.facing} - attacked from the side (+10%) or behind (+25%) takes more damage`}>
                  {FACING_ARROW[unit.facing]}
                </span>
                {unit.block > 0 && (
                  <span className="hwt-block-badge" title={`${unit.block} Block`}>
                    <CardGlyph name="shield" className="hwt-block-icon" />
                    {unit.block}
                  </span>
                )}
                {unit.cooldownRemaining > 0 && (
                  <span className="hwt-cooldown-badge" title={`Ability recharging - ${unit.cooldownRemaining} turn(s)`}>
                    ⏳{unit.cooldownRemaining}
                  </span>
                )}
                {unit.charge && (
                  <span
                    className="hwt-charge-badge"
                    data-imminent={chargeFiringIds.has(unit.id)}
                    title={
                      chargeFiringIds.has(unit.id)
                        ? `${unit.charge.label} lands on the whole squad this turn!`
                        : `Charging ${unit.charge.label} - ${unit.chargeCounter} turn(s) to the hit`
                    }
                  >
                    {chargeFiringIds.has(unit.id) ? "⚡!" : `⚡${unit.chargeCounter}`}
                  </span>
                )}
                {unit.attack > unit.baseAttack && (
                  <span className="hwt-strength-badge" title={`+${unit.attack - unit.baseAttack} Strength`}>
                    ▲{unit.attack - unit.baseAttack}
                  </span>
                )}
                {unit.cultRitual && (
                  <span
                    className="hwt-ritual-badge"
                    title={`Ritual gathering - ${unit.cultRitual.every - unit.ritualCharge} turn(s) to the sacrifice`}
                  >
                    ☾{unit.cultRitual.every - unit.ritualCharge}
                  </span>
                )}
                {unit.poison > 0 && (
                  <span
                    className="hwt-poison-badge"
                    title={`${unit.poison} Poison - ticks for that much damage (ignoring Block) at the top of your next turn, then decays by 1`}
                  >
                    ☠{unit.poison}
                  </span>
                )}
                {unit.execute > 0 && (
                  <span className="hwt-execute-badge" title={`Execute ${unit.execute} - deals ${unit.execute} bonus damage to a target at or below 30% HP`}>
                    †{unit.execute}
                  </span>
                )}
                {unit.shatter > 0 && (
                  <span className="hwt-shatter-badge" title={`Shatter ${unit.shatter} - deals ${unit.shatter} bonus damage to a target still holding Block`}>
                    ✕{unit.shatter}
                  </span>
                )}
                {unit.woundedFury > 0 && unit.hp < unit.maxHp * 0.5 && (
                  <span className="hwt-woundedfury-badge" title="Wounded Fury - below half HP, this unit's attacks deal +3 damage">
                    🔥
                  </span>
                )}
                {unit.weak > 0 && (
                  <span className="hwt-weak-badge" title={`Weak ${unit.weak} - this unit's own outgoing damage is cut by 25%`}>
                    ▼{unit.weak}
                  </span>
                )}
                {unit.slow > 0 && (
                  <span className="hwt-slow-badge" title={`Slow ${unit.slow} - this unit's own movement is reduced by 1 for a turn, then decays`}>
                    ❄{unit.slow}
                  </span>
                )}
                {unit.root > 0 && (
                  <span className="hwt-root-badge" title={`Root ${unit.root} - this unit cannot move at all for a turn, then decays (can still attack)`}>
                    ⛓{unit.root}
                  </span>
                )}
                {unit.suppressed > 0 && (
                  <span className="hwt-suppressed-badge" title={`Suppressed ${unit.suppressed} - this unit's own reactions (Zone of Control, Intercept, Retreat Step, Sidestep, Spirit Shift) are disabled for a turn, then decays`}>
                    ⊘{unit.suppressed}
                  </span>
                )}
                {unit.bulwark > 0 && (
                  <span className="hwt-bulwark-badge" title={`Bulwark ${unit.bulwark} - permanent armour, absorbs that much off every hit and never runs out`}>
                    ⛰{unit.bulwark}
                  </span>
                )}
                {unit.regen > 0 && (
                  <span className="hwt-regen-badge" title={`Regen ${unit.regen} - heals that much at the top of its next turn, then decays by 1`}>
                    ♥{unit.regen}
                  </span>
                )}
                {unit.taunt > 0 && (
                  <span className="hwt-taunt-badge" title="Taunt - while this is alive, it's the ONLY valid attack target on its side">
                    ⚑{unit.taunt}
                  </span>
                )}
                {unit.revive > 0 && (
                  <span className="hwt-revive-badge" title={`Revive ${unit.revive} - the next hit that would drop this to 0 HP instead leaves it at 1, consuming one stack`}>
                    ✚{unit.revive}
                  </span>
                )}
                {intent && (intent.kind === "attack" || intent.kind === "move-attack") && (
                  <span className="hwt-intent-badge" data-intent="attack" title={`Will strike ${getUnitName(battle, intent.targetId)}`}>
                    <CardGlyph name="sword" className="hwt-intent-icon" />
                  </span>
                )}
                {intent && intent.kind === "move" && (
                  <span className="hwt-intent-badge" data-intent="move" title="Advancing">
                    ➤
                  </span>
                )}
                {intent && intent.kind === "aoe" && (
                  <span className="hwt-intent-badge" data-intent="aoe" title="Will strike every player unit at once">
                    ✺
                  </span>
                )}
              </div>
              <CardGlyph name={unit.art} className="hwt-token-glyph" />
              <span className="hwt-token-name">{unit.name}</span>
              <div className="hwt-hp-track">
                <div className="hwt-hp-fill" style={{ width: `${Math.max(0, Math.round((unit.hp / unit.maxHp) * 100))}%` }} />
              </div>
            </motion.div>
          )}
        </div>,
      )
    }
  }

  return (
    <>
      <div className="hwt-layout">
        <div
          className="hwt-board"
          style={{ gridTemplateColumns: `repeat(${battle.grid.cols}, 76px)`, gridTemplateRows: `repeat(${battle.grid.rows}, 76px)` }}
        >
          {cells}
        </div>

        <div className="hwt-panel">
          <div className="hwt-turn-label" data-phase={battle.phase}>
            {battle.phase === "player" && `Player Turn ${battle.turn}`}
            {battle.phase === "enemy" && "Enemy Turn"}
            {battle.phase === "won" && "Victory"}
            {battle.phase === "lost" && "Defeat"}
          </div>
          <button className="hwt-end-turn" onClick={handleEndTurn} disabled={battle.phase !== "player"}>
            End Turn
          </button>
          {battle.activePower && (() => {
            const power = battle.activePower
            const commander = battle.units.find((u) => u.id === "player-commander")
            const ready = !power.used && battle.phase === "player" && commander && commander.hp > 0 && commander.ap >= 1
            const status = power.used
              ? "Used this battle"
              : !commander || commander.hp <= 0
                ? "Your Commander has fallen"
                : commander.ap < 1
                  ? "Your Commander needs 1 AP"
                  : "Once per battle · 1 Commander AP"
            return (
              <div className="hwt-power-panel" data-used={power.used}>
                <button className="hwt-power-btn" disabled={!ready} onClick={handleActivePower} title={power.description}>
                  <span className="hwt-power-crown">♛</span> {power.name}
                </button>
                <p className="hwt-power-desc">{power.description}</p>
                <p className="hwt-power-status">{status}</p>
              </div>
            )
          })()}
          {selected && selected.side === "player" && selected.ability && battle.phase === "player" && (
            <div className="hwt-ability-panel">
              <button
                className="hwt-ability-btn"
                data-active={!!abilityMode}
                disabled={selected.ap < selected.ability.cost || selected.cooldownRemaining > 0}
                onClick={handleAbilityClick}
              >
                {selected.cooldownRemaining > 0
                  ? `${selected.ability.name} · Recharging (${selected.cooldownRemaining})`
                  : `${selected.ability.name} · ${selected.ability.cost} AP`}
              </button>
              {abilityMode && (
                <p className="hwt-ability-hint">
                  {abilityMode === "heal" ? "Choose an ally to heal." : "Choose an enemy for Focused Shot."}
                </p>
              )}
            </div>
          )}
          <div className="hwt-log">
            {[...battle.log].reverse().map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>

          {children}
        </div>
      </div>

      {(battle.phase === "won" || battle.phase === "lost") && (
        <div className="hwt-result">
          <div className="hwt-result-title" data-outcome={battle.phase}>
            {battle.phase === "won" ? "Victory" : "Defeat"}
          </div>
          <div className="hwt-result-actions">{resultActions}</div>
        </div>
      )}
    </>
  )
}
