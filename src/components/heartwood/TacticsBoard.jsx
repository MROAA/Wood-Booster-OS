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
  previewEnemyIntents,
  previewChargeThreat,
} from "../../services/heartwood/tacticsEngine"
import { motion } from "framer-motion"

function apPips(unit) {
  return Array.from({ length: unit.apMax }, (_, i) => (i < unit.ap ? "●" : "○")).join("")
}

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
    }
    return ids
  }, [intents])
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

  const cellUnit = (row, col) => battle.units.find((u) => u.pos.row === row && u.pos.col === col && u.hp > 0)
  const isReachable = (row, col) => reachable.some((p) => p.row === row && p.col === col)
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
      cells.push(
        <div
          key={`${row}-${col}`}
          className="hwt-cell"
          data-reachable={!!reach}
          data-targetable={!!target}
          data-healable={!!healTarget}
          data-threatened={!!threatened}
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
            >
              <div className="hwt-token-status">
                <span className="hwt-ap-pips" title={`${unit.ap}/${unit.apMax} AP`}>
                  {apPips(unit)}
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
