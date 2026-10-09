// Hearthwood Frontier - MUTATIONS during a tactics fight (the reactions
// that need the engine). The stat side (HP, attack, move, Ward, thorns,
// regen...) is folded onto the unit at fight start by
// services/heartwood/mutations.js applyMutationsToTactics. Fields read here:
//   mutHit   { fire|frost|poison|nature: n } - landed hits add that element
//   mutLeech n - heals n per landed hit
//   mutGills n - +n resource (100-bar amount) at own turn start when next
//              to water / on a bridge / on ice
//   mutEcho  n - its first skill each fight refunds n AP
// Engine helpers are imported back from tacticsEngine.js (circular, used
// only at call time - same pattern as tacticsRelics.js).
import { getUnit, setUnit, emit, livingUnits } from "./tacticsEngine"
import { applyElement } from "./tacticsElements"
import { gainExternal, hasMana } from "./tacticsMana"
import { terrainAt } from "./tacticsTerrain"

function callout(state, unitId, label, line) {
  const next = emit(state, { kind: "reaction", unitId, label, mutation: true })
  return line ? { ...next, log: [...next.log, line] } : next
}

// A landed hit (remaining > 0) by a mutated hero.
export function mutationOnDealDamage(state, actorId, targetId, remaining) {
  const actor = getUnit(state, actorId)
  if (!actor || remaining <= 0 || (!actor.mutHit && !actor.mutLeech)) return state
  let next = state
  for (const [el, n] of Object.entries(actor.mutHit || {})) {
    const target = getUnit(next, targetId)
    if (!target || target.hp <= 0 || next.phase === "won" || next.phase === "lost") break
    next = applyElement(next, targetId, el, n)
  }
  if (actor.mutLeech > 0) {
    const live = getUnit(next, actorId)
    if (live && live.hp > 0 && live.hp < live.maxHp) {
      const hp = Math.min(live.maxHp, live.hp + actor.mutLeech)
      next = emit(setUnit(next, actorId, { hp }), { kind: "heal", actorId, targetId: actorId, amount: hp - live.hp })
    }
  }
  return next
}

const WET = new Set(["water", "bridge", "ice"])
export function nearWater(state, pos) {
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      const t = terrainAt(state, { row: pos.row + dr, col: pos.col + dc })
      if (dr === 0 && dc === 0 ? t === "bridge" || t === "ice" : WET.has(t)) return true
    }
  return false
}

// Start of the player's turn: Mana Gills.
export function mutationTurnStart(state) {
  let next = state
  for (const u of livingUnits(state, "player")) {
    if (!(u.mutGills > 0) || !hasMana(u) || !nearWater(state, u.pos)) continue
    next = gainExternal(next, u.id, u.mutGills, "gills")
    next = callout(next, u.id, "Mana Gills!", `${u.name} breathes power from the wet air.`)
  }
  return next
}

// After a successful skill cast: Echo Voice refunds AP once per fight.
export function mutationAfterCast(state, actorId) {
  const u = getUnit(state, actorId)
  if (!u || !(u.mutEcho > 0) || u.echoUsed || u.hp <= 0) return state
  const next = setUnit(state, actorId, { ap: (u.ap || 0) + u.mutEcho, echoUsed: true })
  return callout(next, actorId, "Echo!", `${u.name}'s skill echoes - ${u.mutEcho} AP back.`)
}
