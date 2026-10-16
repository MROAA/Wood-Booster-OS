// Hearthwood Frontier - MANA COLOURS + OVERCHANNEL (mana sprint 3).
//
// Purpose: two layers on the resource engine (tacticsMana.js).
//  - COLOURS. Every hero has an affinity (Ember / Tide / Root / Void, from
//    its class) and every skill a colour. Casting two different colours in
//    the same player turn - one hero or two - sets off a COLOUR COMBO
//    spell (6 pairs, data/heartwood/manaColours.js). Mana Wells are
//    coloured too: a hero starting its turn on one has that colour primed.
//    A campaign ley network makes its line colours 15% cheaper to cast.
//  - OVERCHANNEL. A hero with Overchannel armed may cast a skill it can't
//    afford: it pays the missing part in HP and fills its BACKLASH meter.
//    A full meter stuns the hero (and hurts it) at the start of its next
//    turn. Fixed numbers, no rolls - the button shows the exact cost.
// Responsibilities: colour tagging, the per-turn colour tracker, combo
// resolution, overchannel cost/backlash, the player-turn-start tick.
// Dependencies: tacticsEngine helpers (call-time, circular like the other
// tactics modules), tacticsMana, tacticsManaFeed (Hunger on cast).
// Public API: affinityOf, skillColourOf, coloursThisTurn, castWithColours,
// overchannelPlan, armOverchannel, colourPlayerTurnStart, wellColourAt,
// leyCostCut. Pure + deterministic: state in -> state out.
// Tests: .scratch/verify_mana_3.mjs (ENGINE_ONLY=1 for the engine part).
import {
  MANA_COLOURS, COLOUR_IDS, CLASS_AFFINITY, ROLE_AFFINITY, SKILL_COLOURS, KIND_COLOURS, comboForColours,
  COMBO_POWER_MIN, COMBO_POWER_ATK, HELLFLARE_BONUS, HELLFLARE_BURN, UNDERTOW_BURN, FINISHER, OVERCHANNEL, FEED_BIG_CAST_PCT,
} from "../../data/heartwood/manaColours"
import { emit, getUnit, setUnit, applyDamageWithBlock, checkTacticsBattleEnd } from "./tacticsEngine"
import { hasMana, profileOf, manaCostOf, manaOn, burnMana, gainResource } from "./tacticsMana"
import { roleOf } from "./tacticsRoles"
import { isMageClass } from "./tacticsRanged"
import { applyElement } from "./tacticsElements"
import { feedOnCast } from "./tacticsManaFeed"

export const LEY_COLOUR_CUT = 15

const cheb = (a, b) => Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col))
const addLog = (state, line) => (state.log ? { ...state, log: [...state.log, line] } : state)
const ended = (s) => s.phase === "won" || s.phase === "lost"

// --- Colours -----------------------------------------------------------------------------

export function affinityOf(u) {
  if (!u) return null
  if (u.affinity && MANA_COLOURS[u.affinity]) return u.affinity
  if (u.classId && CLASS_AFFINITY[u.classId]) return CLASS_AFFINITY[u.classId]
  return ROLE_AFFINITY[roleOf(u)] || "ember"
}

// A skill's colour: its own, a per-skill override, its kind, else the hero's affinity.
export function skillColourOf(skill, unit) {
  if (!skill) return null
  if (skill.colour && MANA_COLOURS[skill.colour]) return skill.colour
  if (SKILL_COLOURS[skill.id]) return SKILL_COLOURS[skill.id]
  if (!skill.classId && KIND_COLOURS[skill.kind]) return KIND_COLOURS[skill.kind]
  return affinityOf(unit)
}

// Mana Wells are coloured by where they sit (no extra state, same every time).
export function wellColourAt(state, pos) {
  if (!pos) return null
  const key = `${pos.row}-${pos.col}`
  if (state?.wellColours?.[key]) return state.wellColours[key]
  return COLOUR_IDS[(pos.row + 2 * pos.col) % 4]
}

// Campaign ley network: skills of a networked line colour cost 15% less.
export function leyCostCut(unit, skill) {
  if (!unit?.leyColours?.length || !skill) return 0
  return unit.leyColours.includes(skillColourOf(skill, unit)) ? LEY_COLOUR_CUT : 0
}

// The colour tracker for the CURRENT player turn: [{ colour, unitId, used, well }].
export function coloursThisTurn(state) {
  const t = state?.manaColours
  return t && t.turn === state.turn ? t.cast : []
}
export function combosThisTurn(state) {
  const t = state?.manaColours
  return t && t.turn === state.turn ? t.combos || [] : []
}
// The combo the next cast of `colour` would set off right now (UI hint).
export function comboIfCast(state, colour) {
  const partner = [...coloursThisTurn(state)].reverse().find((e) => !e.used && e.colour !== colour)
  return partner ? comboForColours(partner.colour, colour) : null
}

function centerOf(state, actor, targetId) {
  if (typeof targetId === "string") {
    const m = /^(\d+)-(\d+)$/.exec(targetId)
    if (m) return { row: Number(m[1]), col: Number(m[2]) }
    const t = getUnit(state, targetId)
    if (t?.pos) return { ...t.pos }
  }
  return { ...actor.pos }
}

function square(state, c, r = 1) {
  const out = []
  for (let dr = -r; dr <= r; dr++) {
    for (let dc = -r; dc <= r; dc++) {
      const p = { row: c.row + dr, col: c.col + dc }
      if (p.row >= 0 && p.col >= 0 && p.row < state.grid.rows && p.col < state.grid.cols) out.push(p)
    }
  }
  return out
}

export function comboPower(state, actor) {
  const base = Math.max(COMBO_POWER_MIN, Math.round((actor?.attack || 0) * COMBO_POWER_ATK))
  const prism = state.manaRelic?.comboPower || 0
  return Math.round(base * (1 + prism / 100))
}

const foesIn = (state, side, tiles) =>
  state.units.filter((u) => u.hp > 0 && u.side !== side && !u.npc && !u.structure && tiles.some((t) => t.row === u.pos.row && t.col === u.pos.col)).map((u) => u.id)

function hurt(state, id, amount, why) {
  const u = getUnit(state, id)
  if (!u || u.hp <= 0 || ended(state)) return state
  const r = applyDamageWithBlock(state, id, amount)
  return checkTacticsBattleEnd(addLog(r.next, `${u.name} is caught in the ${why} (${r.remaining}).${r.fell ? " It falls." : ""}`))
}

// Resolve one colour combo. Pure; the event drives the callout + tile flash.
export function fireColourCombo(state, actorId, targetId, combo) {
  const actor = getUnit(state, actorId)
  if (!actor || !combo || ended(state)) return state
  const center = centerOf(state, actor, targetId)
  const finisher = affinityOf(actor)
  const p = comboPower(state, actor) + (finisher === "ember" && combo.id !== "lifespring" ? FINISHER.emberDmg : 0)
  let next = state
  let tiles = square(state, center)
  if (combo.id === "lifespring") tiles = square(state, actor.pos, 2)
  next = emit(addLog(next, `${MANA_COLOURS[combo.pair[0]].name} + ${MANA_COLOURS[combo.pair[1]].name}: ${combo.name}!`), {
    kind: "combo",
    unitId: actorId,
    combo: `colour-${combo.id}`,
    label: `${combo.icon} ${combo.name.toUpperCase()}!`,
    tiles: combo.shape === "single" ? [center] : tiles,
    big: true,
    colourCombo: combo.id,
  })
  if (combo.id === "steam") {
    for (const id of foesIn(next, actor.side, tiles)) {
      next = hurt(next, id, p, "Steam Burst")
      const u = getUnit(next, id)
      if (u && u.hp > 0) next = setUnit(next, id, { exposed: Math.max(u.exposed || 0, 2) })
    }
  } else if (combo.id === "wildfire") {
    for (const id of foesIn(next, actor.side, tiles)) if (!ended(next) && getUnit(next, id)?.hp > 0) next = checkTacticsBattleEnd(applyElement(next, id, "fire", 2))
  } else if (combo.id === "hellflare") {
    const around = foesIn(next, actor.side, square(next, center, 1))
    const direct = foesIn(next, actor.side, [center])[0]
    const id = direct || around.sort((a, b) => cheb(getUnit(next, a).pos, center) - cheb(getUnit(next, b).pos, center) || (a < b ? -1 : 1))[0]
    if (id) {
      next = burnMana(next, id, HELLFLARE_BURN, "hellflare").next
      next = hurt(next, id, p + HELLFLARE_BONUS, "Hellflare")
    }
  } else if (combo.id === "lifespring") {
    for (const ally of next.units) {
      if (ally.hp <= 0 || ally.side !== actor.side || ally.structure || cheb(ally.pos, actor.pos) > 2) continue
      const healed = Math.min(ally.maxHp, ally.hp + p)
      next = setUnit(next, ally.id, { hp: healed, poison: 0, burn: 0 })
      if (healed > ally.hp) next = emit(next, { kind: "heal", actorId, targetId: ally.id, amount: healed - ally.hp })
    }
  } else if (combo.id === "undertow") {
    for (const id of foesIn(next, actor.side, tiles)) {
      const u = getUnit(next, id)
      next = setUnit(next, id, { slow: Math.max(u.slow || 0, 2) })
      next = burnMana(next, id, UNDERTOW_BURN, "undertow").next
    }
  } else if (combo.id === "blight") {
    for (const id of foesIn(next, actor.side, tiles)) if (!ended(next) && getUnit(next, id)?.hp > 0) next = checkTacticsBattleEnd(applyElement(next, id, "poison", 3))
  }
  // The finishing hero's affinity adds its own touch.
  const live = getUnit(next, actorId)
  if (live && live.hp > 0 && !ended(next)) {
    if (finisher === "tide") next = setUnit(next, actorId, { hp: Math.min(live.maxHp, live.hp + FINISHER.tideHeal) })
    if (finisher === "root") next = setUnit(next, actorId, { block: (live.block || 0) + FINISHER.rootBlock })
    if (finisher === "void" && hasMana(live)) next = gainResource(next, actorId, FINISHER.voidRes, "void")
  }
  return next
}

// A cast of `colour` by `actorId`: log it; a different unused colour this
// turn pairs with it into a combo.
export function registerColour(state, actorId, targetId, colour, { well = false } = {}) {
  if (!colour) return state
  const cast = coloursThisTurn(state).map((e) => ({ ...e }))
  const combos = [...combosThisTurn(state)]
  let partnerIdx = -1
  for (let i = cast.length - 1; i >= 0; i--) {
    if (!cast[i].used && cast[i].colour !== colour) {
      partnerIdx = i
      break
    }
  }
  const combo = !well && partnerIdx >= 0 ? comboForColours(cast[partnerIdx].colour, colour) : null
  if (combo) cast[partnerIdx].used = true
  cast.push({ colour, unitId: actorId, used: !!combo, ...(well ? { well: true } : {}) })
  if (combo) combos.push(combo.id)
  const next = { ...state, manaColours: { turn: state.turn, cast, combos } }
  return combo ? fireColourCombo(next, actorId, targetId, combo) : next
}

// --- Overchannel -------------------------------------------------------------------------

export const backlashMax = () => OVERCHANNEL.backlashMax

function backlashMult(state, u) {
  let m = 1
  if (affinityOf(u) === "void") m *= 1 - OVERCHANNEL.voidCut
  if (isMageClass(u.classId)) m *= 1 - OVERCHANNEL.mageCut
  const cut = state?.manaRelic?.backlashCut || 0
  if (cut) m *= 1 - cut / 100
  return m
}

// What overchannelling `skill` would cost right now, or null (affordable /
// not allowed). { missing, hp, backlash, why }.
export function overchannelPlan(u, skill, state = null) {
  if (!u || !skill || u.side !== "player" || !hasMana(u) || u.hp <= 0) return null
  const prof = profileOf(u)
  if (prof.special === "inverted" || prof.special === "tokens" || skill.spend === "all") return null
  const cost = manaCostOf(skill, u)
  if (!(cost > u.mana)) return null
  const missing = cost - u.mana
  const pct = Math.max(1, Math.round((missing / Math.max(1, u.manaMax || 1)) * 100))
  let hp = Math.max(OVERCHANNEL.hpMin, Math.ceil(pct / OVERCHANNEL.hpPerPct))
  if (prof.special === "sacrifice") hp = Math.max(1, Math.ceil(hp * (1 - OVERCHANNEL.bloodHpCut)))
  if ((state?.manaRelic?.overchannelHp || 0) > 0) hp = Math.max(1, hp - state.manaRelic.overchannelHp)
  const backlash = Math.max(1, Math.round((OVERCHANNEL.backlashBase + pct) * backlashMult(state, u)))
  const plan = { missing, pct, hp, backlash, cost }
  if ((u.backlash || 0) >= OVERCHANNEL.backlashMax) return { ...plan, why: "Backlash meter is full - it can't take more." }
  if (u.hp <= hp) return { ...plan, why: `Needs more than ${hp} HP.` }
  return plan
}
export const canOverchannel = (u, skill, state = null) => {
  const p = overchannelPlan(u, skill, state)
  return !!p && !p.why
}

// The skill-button toggle (pure: lives on the hero, cleared after one overchannel).
export function armOverchannel(state, unitId, on = true) {
  const u = getUnit(state, unitId)
  if (!u || u.side !== "player" || !hasMana(u)) return state
  return setUnit(state, unitId, { overchannelArmed: !!on })
}

function applyOverchannel(state, actorId, plan) {
  const u = getUnit(state, actorId)
  if (!u) return state
  const hp = Math.max(1, u.hp - plan.hp)
  const meter = Math.min(OVERCHANNEL.backlashMax, (u.backlash || 0) + plan.backlash)
  let next = setUnit(state, actorId, { hp, backlash: meter, overchannelArmed: false, overchannels: (u.overchannels || 0) + 1 })
  next = emit(next, { kind: "damage", targetId: actorId, amount: u.hp - hp })
  next = emit(next, { kind: "reaction", unitId: actorId, label: `⚡ Overchannel -${u.hp - hp} HP` })
  next = addLog(next, `${u.name} OVERCHANNELS: ${plan.missing} short, paid ${u.hp - hp} HP. Backlash ${meter}/${OVERCHANNEL.backlashMax}.${meter >= OVERCHANNEL.backlashMax ? " It will be STUNNED next turn!" : ""}`)
  if (meter >= OVERCHANNEL.backlashMax) next = emit(next, { kind: "reaction", unitId: actorId, label: "⚠ Backlash next turn!" })
  return next
}

// --- The cast wrapper (tacticsEngine.castAbility) ----------------------------------------

// `run` = the real cast (talents + base). Overchannel is settled after a
// successful cast; then the colour is logged (maybe a combo) and nearby
// mana-fed enemies feed.
export function castWithColours(state, actorId, targetId, skill, run) {
  const u = getUnit(state, actorId)
  if (!u || !skill || u.side !== "player" || !manaOn(state)) return run(state)
  const plan = u.overchannelArmed ? overchannelPlan(u, skill, state) : null
  const usable = plan && !plan.why ? plan : null
  const cost = hasMana(u) ? manaCostOf(skill, u) : 0
  const out = run(state)
  if (out === state) return state
  let next = usable ? applyOverchannel(out, actorId, usable) : out
  if (ended(next)) return next
  next = registerColour(next, actorId, targetId, skillColourOf(skill, u))
  if (ended(next)) return next
  const big = !!usable || (u.manaMax > 0 && (cost / u.manaMax) * 100 >= FEED_BIG_CAST_PCT)
  return feedOnCast(next, actorId, { big })
}

// canAfford hook (tacticsMana): an armed hero may cast past its bar.
export function armedOverchannelOk(unit, skill) {
  return !!unit?.overchannelArmed && canOverchannel(unit, skill, null)
}

// --- Player turn start --------------------------------------------------------------------

// Backlash goes off (stun + damage) or drains; Mana Wells prime their colour.
export function colourPlayerTurnStart(state) {
  if (!manaOn(state) || state.phase !== "player") return state
  let next = state
  for (const u0 of state.units) {
    if (u0.side !== "player" || u0.hp <= 0) continue
    const u = getUnit(next, u0.id)
    const patch = {}
    if (u.backlashStunned) patch.backlashStunned = false
    if ((u.backlash || 0) >= OVERCHANNEL.backlashMax) {
      const hp = Math.max(1, u.hp - OVERCHANNEL.backlashDamage)
      next = setUnit(next, u.id, { ...patch, hp, ap: 0, backlash: 0, backlashStunned: true, overchannelArmed: false })
      next = emit(next, { kind: "damage", targetId: u.id, amount: u.hp - hp })
      next = emit(next, { kind: "reaction", unitId: u.id, label: "⚡ BACKLASH! Stunned" })
      next = addLog(next, `${u.name}'s overchannelled mana BACKLASHES: ${u.hp - hp} damage and it loses this turn.`)
      continue
    }
    if (u.backlash > 0) patch.backlash = Math.max(0, u.backlash - OVERCHANNEL.backlashDecay)
    if (Object.keys(patch).length) next = setUnit(next, u.id, patch)
  }
  // Coloured Mana Wells: a hero starting here has the well's colour primed.
  next = { ...next, manaColours: { turn: next.turn, cast: [], combos: [] } }
  for (const u of next.units) {
    if (u.side !== "player" || u.hp <= 0 || (next.terrain || {})[`${u.pos.row}-${u.pos.col}`] !== "manawell") continue
    const colour = wellColourAt(next, u.pos)
    next = registerColour(next, u.id, null, colour, { well: true })
    next = emit(next, { kind: "mana", unitId: u.id, amount: 0, label: "well-colour", text: `${MANA_COLOURS[colour].icon} ${MANA_COLOURS[colour].name} primed` })
  }
  return next
}
