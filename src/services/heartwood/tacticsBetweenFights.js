// Hearthwood - the between-fights layer reaching INTO a real tactics fight.
// Purpose: the run-map decisions (fates, build sets, camp Commune) show
// up on the board, visibly:
//   - an ALLY fate: a friendly hero fights on your side (gold "Ally" tag)
//   - a RIVAL fate: a tougher named enemy hunts you (red "Rival" tag)
//   - mana: build-set tiers, a camp Commune (+max mana on one hero or an
//     Overcharged start) and a mana-tide fate feed enableMana's `extra`.
// Dependencies: tacticsEngine (unit builder), betweenFights (fates),
// buildSets (mana tiers). Pure, deterministic.
import { deriveTacticsUnit, freeCellsNear } from "./tacticsEngine"
import { ENEMIES } from "../../data/heartwood/enemies"
import { UNITS } from "../../data/heartwood/units"
import { setManaBonus } from "../../data/heartwood/buildSets"
import { fateAllyForFight, fateRivalForFight, fateOverchargeForFight } from "./betweenFights"

export const RIVAL_HP_MULT = 1.3
export const RIVAL_ATTACK_BONUS = 1

const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s)

// Adds the fated ally / rival to a freshly built run battle. Call BEFORE
// the DifficultyEngine so the rival gets the tier's AI + scaling too.
export function withFateArrivals(battle, runState, factor = 1) {
  if (!battle?.units || !runState) return battle
  let state = battle
  const ally = fateAllyForFight(runState)
  if (ally && UNITS[ally.unit]) {
    const cmd = state.units.find((u) => u.id === "player-commander") || state.units.find((u) => u.side === "player")
    const [pos] = cmd ? freeCellsNear(state, cmd.pos, 1) : []
    if (pos) {
      const u = deriveTacticsUnit(ally.unit, "player", pos, `fate-ally-${ally.unit}`)
      state = {
        ...state,
        units: [...state.units, { ...u, name: ally.allyName || u.name, baseAttack: u.attack, fateAlly: true, fateTitle: ally.title }],
        log: [...(state.log || []), `${ally.allyName || u.name} joins the fight - ${ally.title}.`],
      }
    }
  }
  const rival = fateRivalForFight(runState)
  if (rival && ENEMIES[rival.enemyId]) {
    const foe = state.units.find((u) => u.side === "enemy" && u.hp > 0) || null
    const origin = foe?.pos || { row: Math.floor(state.grid.rows / 2), col: 0 }
    const [pos] = freeCellsNear(state, origin, 1)
    if (pos) {
      const base = deriveTacticsUnit(rival.enemyId, "enemy", pos, `fate-rival-${rival.enemyId}`)
      const maxHp = Math.max(1, Math.round(base.maxHp * (factor || 1) * RIVAL_HP_MULT))
      const attack = (base.attack > 0 ? Math.round(base.attack * (factor || 1)) : base.attack) + RIVAL_ATTACK_BONUS
      state = {
        ...state,
        units: [...state.units, { ...base, name: cap(rival.rivalName) || base.name, hp: maxHp, maxHp, attack, baseAttack: attack, facing: "E", fateRival: true, fateTitle: rival.title }],
        log: [...(state.log || []), `${cap(rival.rivalName) || base.name} has tracked you down - ${rival.title}!`],
      }
    }
  }
  return state
}

// Camp Commune "deepen": bench entry `manaBonus` -> the hero's unit
// `manaPoolBonus` (tacticsMana initUnit reads it). Call before enableMana.
export function withCommunePools(battle, runState) {
  if (!battle?.units || !runState) return battle
  const keys = (runState.deployed || []).filter((k) => k !== null && runState.bench.some((e) => e.key === k))
  const byId = {}
  keys.forEach((k, i) => {
    const e = runState.bench.find((b) => b.key === k)
    if (e?.manaBonus > 0) byId[`player-${e.defId}-${i}`] = e.manaBonus
  })
  if (!Object.keys(byId).length) return battle
  return { ...battle, units: battle.units.map((u) => (byId[u.id] ? { ...u, manaPoolBonus: (u.manaPoolBonus || 0) + byId[u.id] } : u)) }
}

// The `extra` resource bonus for enableMana: set tiers + a camp
// Commune Overcharge + a mana-tide fate.
export function betweenFightsMana(runState) {
  const m = setManaBonus(runState)
  return { ...m, startOvercharge: m.startOvercharge + (runState?.campOvercharge || 0) + fateOverchargeForFight(runState) }
}
