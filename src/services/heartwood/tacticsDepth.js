// Hearthwood Frontier - COMBAT DEPTH sprint (Marc: "every turn I make the
// same obvious move-and-hit"). Four systems that turn a turn into choices,
// all feeding mana (Marc's "core fun system"):
//
// 1. TURN ORDER. The engine keeps its sound player-phase / enemy-phase
//    loop (the enemy telegraph stays an exact dry-run), and the board
//    shows the round as a timeline: your heroes (any order) -> every enemy
//    in the order it will really act -> the next round.
//    - DELAY: a hero with AP left steps back in the timeline. It gives up
//      the rest of this turn and acts at the END of the round, after the
//      enemies have shown their hand - opening the next round with +1 AP.
//      Not two rounds in a row.
//    - STAGGER: knockbacks, a Finisher / Shock combo and a Parry push an
//      enemy back in the queue: it acts LAST, with only 1 AP (move OR
//      strike). Staggered twice = REELING: its action slides into the next
//      round (it skips this one; a channeled ultimate stays armed).
// 2. HERO COMBOS (setup -> cash-in). Every hero's hits leave a setup on
//    the enemy (by role); ANOTHER hero exploits it for +50% and mana:
//      Off-balance (tanks, ranged)      + a melee hit   = Finisher (+Stagger)
//      Marked (melee DPS, support)      + a ranged hit  = Called Shot (+20% to hit)
//      Soaked (control, any Frost)      + a skill hit   = Shock / Scald with fire (+Stagger)
//      Rooted (any root)                + an area skill = Crush
// 3. STANCES. Picked before the hero acts (free, one click): Aggressive
//    (+25% damage dealt AND taken), Defensive (+2 Block at end of turn -
//    tanks +4 - and -1 move; its Parry fully negates), Focus (+10 resource
//    at end of turn - casters +15 - and -25% damage).
// 4. REACTIONS. 1 AP kept for the enemy turn - one per hero, Overwatch
//    counts as that hero's reaction: Parry (halve one melee hit; tank or
//    Defensive: negate it, the attacker is Staggered), Counter (strike back
//    at the first enemy that attacks it), Interrupt (+20 mana when it
//    fires: cancel an enemy skill or ultimate within 4 tiles).
// Enemies get a cheap mirror: a wounded enemy braces (Defensive, parries
// your first melee hit), a Berserker goes Aggressive.
//
// Opt-in per fight (`state.combatDepth`, real run fights + the prototype),
// so hand-built test states play exactly as before. Pure, deterministic,
// state in -> state out. Engine helpers are imported back from
// tacticsEngine.js (circular, call-time only - same as tacticsRelics.js).
import { emit, getUnit, setUnit, livingUnits, attackUnit } from "./tacticsEngine"
import { canReach } from "./tacticsTerrain"
import { roleOf } from "./tacticsRoles"
import { hasMana, profileOf, gainExternal, scaleAmount, resourceLabel } from "./tacticsMana"
import { breakUltimate, ULT_BROKEN_LEFT } from "./tacticsUltimates"
import { behaviorOf } from "./tacticsSmartAi"
import { abilityElement } from "./tacticsElements"
import { enemySkillsFor } from "./tacticsEnemyAbilities"

const cheb = (a, b) => Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col))
const addLog = (state, line) => ({ ...state, log: [...(state.log || []), line] })
const ended = (s) => s.phase === "won" || s.phase === "lost"
const isHero = (u) => !!u && u.side === "player" && !u.structure && !u.npc

export function depthOn(state) {
  return !!state?.combatDepth
}
// Enemy stances / parries: off for the QA hook (withLowEnemyHp).
const enemyDepthOn = (state) => depthOn(state) && !state.depthQa

export function enableCombatDepth(state) {
  return state ? { ...state, combatDepth: true } : state
}

// --- Numbers ---------------------------------------------------------------------------

export const COMBO_MULT = 1.5
export const COMBO_MANA = 15
export const SETUP_TURNS = 2
export const MARKED_AIM = 20
export const STAGGER_MAX = 2
export const PARRY_MANA = 8
export const INTERRUPT_MANA = 20
export const INTERRUPT_RANGE = 4
export const DELAY_BONUS_AP = 1
export const ENEMY_BRACE_HP = 0.4

// --- 3. Stances ------------------------------------------------------------------------

export const STANCES = {
  aggressive: { id: "aggressive", name: "Aggressive", icon: "⚔", dealt: 25, taken: 25, text: "+25% damage dealt, but +25% damage taken." },
  defensive: { id: "defensive", name: "Defensive", icon: "🛡", block: 2, tankBlock: 4, move: -1, text: "+2 Block when your turn ends (tanks +4), 1 less move. A Parry from this stance fully negates the hit." },
  focus: { id: "focus", name: "Focus", icon: "✧", dealt: -25, res: 10, casterRes: 15, text: "+10 resource when your turn ends (healers, support and control +15), but -25% damage dealt." },
}
export const STANCE_IDS = Object.keys(STANCES)

const CASTER_ROLES = new Set(["healer", "support", "control"])

// The class flavour line for a hero's stance button.
export function stanceText(unit, stanceId) {
  const st = STANCES[stanceId]
  if (!st) return ""
  const role = roleOf(unit)
  if (stanceId === "defensive" && role === "tank") return `${st.name}: +${st.tankBlock} Block when your turn ends (a tank's Bulwark stance), 1 less move. Parry fully negates.`
  if (stanceId === "aggressive" && role === "dps") return `${st.name}: +35% damage dealt (a damage dealer's fury), but +25% damage taken.`
  if (stanceId === "focus" && CASTER_ROLES.has(role)) return `${st.name}: +${st.casterRes} resource when your turn ends (a caster's meditation), -25% damage dealt.`
  return `${st.name}: ${st.text}`
}

// A stance is picked BEFORE the hero acts this turn (no attack-then-turtle).
export function canChangeStance(state, unit) {
  if (!depthOn(state) || !isHero(unit) || unit.hp <= 0 || state.phase !== "player") return false
  if (unit.moved) return false
  return unit.ap >= (unit.turnAp ?? unit.apMax) && unit.ap > 0
}

// One click: pick a stance; clicking the active one goes back to Balanced.
export function setStance(state, unitId, stanceId) {
  const u = getUnit(state, unitId)
  if (!canChangeStance(state, u)) return state
  const next = stanceId && STANCES[stanceId] && u.stance !== stanceId ? stanceId : null
  let out = setUnit(state, unitId, { stance: next })
  out = emit(out, { kind: "reaction", unitId, label: next ? `${STANCES[next].icon} ${STANCES[next].name}` : "Balanced" })
  return addLog(out, next ? `${u.name} takes a ${STANCES[next].name} stance.` : `${u.name} returns to a balanced stance.`)
}

export function stanceMove(unit, move) {
  return unit?.stance === "defensive" ? Math.max(1, move + STANCES.defensive.move) : move
}

const pctUp = (amount, pct) => amount + Math.max(1, Math.round((amount * pct) / 100))
const pctDown = (amount, pct) => Math.max(0, amount - Math.max(1, Math.floor((amount * pct) / 100)))

function stanceDamage(attacker, defender, amount) {
  if (!(amount > 0)) return amount
  let a = amount
  if (attacker.stance === "aggressive") a = pctUp(a, roleOf(attacker) === "dps" && attacker.side === "player" ? 35 : STANCES.aggressive.dealt)
  else if (attacker.stance === "focus") a = pctDown(a, 25)
  if (defender.stance === "aggressive") a = pctUp(a, STANCES.aggressive.taken)
  return a
}

// --- 2. Combos -------------------------------------------------------------------------

export const SETUPS = {
  offBalance: { id: "offBalance", field: "cbOffBalance", name: "Off-balance", icon: "⤵", text: "Off-balance - a MELEE hit from another hero lands a Finisher (+50%, Staggers it)." },
  marked: { id: "marked", field: "cbMarked", name: "Marked", icon: "◎", text: "Marked - a RANGED hit from another hero lands a Called Shot (+50%, +20% to hit)." },
  soaked: { id: "soaked", field: "cbSoaked", name: "Soaked", icon: "💧", text: "Soaked - a SKILL from another hero Shocks it (+50%, Staggers it); a fire skill Scalds it." },
  rooted: { id: "rooted", field: "root", name: "Rooted", icon: "🌿", text: "Rooted - an AREA skill Crushes it (+50%)." },
}

export const COMBOS = {
  finisher: { id: "finisher", name: "Finisher", icon: "⤵", setup: "offBalance", stagger: 1, recipe: "Off-balance + melee hit" },
  "called-shot": { id: "called-shot", name: "Called Shot", icon: "◎", setup: "marked", aim: MARKED_AIM, recipe: "Marked + ranged hit" },
  shock: { id: "shock", name: "Shock", icon: "⚡", setup: "soaked", stagger: 1, recipe: "Soaked + skill" },
  crush: { id: "crush", name: "Crush", icon: "🌿", setup: "rooted", recipe: "Rooted + area skill" },
}

export const COMBO_HELP = [
  { id: "finisher", text: "Off-balance (left by tanks and ranged heroes, and by any knockback) + a melee hit from another hero = FINISHER: +50% damage, the enemy is Staggered." },
  { id: "called-shot", text: "Marked (left by melee damage dealers and support heroes) + a ranged hit from another hero = CALLED SHOT: +50% damage, +20% to hit." },
  { id: "shock", text: "Soaked (left by control heroes and any Frost) + a skill from another hero = SHOCK: +50% damage, Staggered. A fire skill Scalds instead." },
  { id: "crush", text: "Rooted + an area skill (cleave, blast, nova...) = CRUSH: +50% damage to the rooted enemy." },
  { id: "mana", text: `Every combo gives the hero who cashes it in +${COMBO_MANA} resource.` },
]

// Which setup a hero's hits leave behind (by battle role).
export function setupOf(unit) {
  if (!isHero(unit)) return null
  const role = roleOf(unit)
  if (role === "tank") return "offBalance"
  if (role === "control") return "soaked"
  if (role === "dps") return (unit.range || 1) > 1 ? "offBalance" : "marked"
  return "marked"
}

// What kind of hit this is: basic (attack, overwatch, counter) or a skill.
// `ability` is abilityHit's own param (a class skill / signature object, or
// a bare {name} for overwatch / riposte / turret / cleave perk).
export function hitCtx(ability) {
  if (!ability || !(ability.id || ability.kind)) return { skill: false, area: false, fire: false }
  const area = !!(ability.area || ability.kind === "cleave" || ability.kind === "aoe" || (ability.radius && (ability.damage || ability.amount)))
  return { skill: true, area, ability }
}

const setupLive = (defender, setupId) => {
  const s = SETUPS[setupId]
  return s && defender[s.field] > 0
}
const setupBy = (defender, setupId) => (defender.cbBy || {})[setupId]

// The combo this hit would cash in (null = none). Pure - the UI preview,
// the AI estimate and the real hit all read it.
export function comboFor(state, attacker, defender, ctx = null) {
  if (!depthOn(state) || !attacker || !defender || attacker.side !== "player" || defender.side !== "enemy" || defender.hp <= 0 || defender.structure) return null
  const c = ctx || { skill: false, area: false }
  const d = cheb(attacker.pos, defender.pos)
  const other = (setupId) => setupBy(defender, setupId) !== attacker.id
  if (c.area && defender.root > 0) return COMBOS.crush
  if (c.skill && setupLive(defender, "soaked") && other("soaked")) {
    const fire = abilityElement(attacker)?.element === "fire" || c.ability?.burn > 0 || /fire|flame|ember|burn/i.test(c.ability?.name || "")
    return fire ? { ...COMBOS.shock, name: "Scald", icon: "🔥" } : COMBOS.shock
  }
  if (d <= 1 && setupLive(defender, "offBalance") && other("offBalance")) return COMBOS.finisher
  if (d >= 2 && setupLive(defender, "marked") && other("marked")) return COMBOS["called-shot"]
  return null
}

// Hit-chance parts (tacticsCover.hitChance): a Called Shot aims better.
export function comboHitParts(state, attacker, defender, dist) {
  if (!depthOn(state) || attacker?.side !== "player" || dist < 2) return []
  const combo = comboFor(state, attacker, defender)
  return combo?.aim ? [{ label: "Called Shot (Marked)", value: combo.aim }] : []
}

// modifiedAttackAmount hook: stances both ways, then the combo bonus.
export function depthAmount(attacker, defender, amount, state, ctx = null) {
  if (!(amount > 0) || !attacker || !defender) return amount
  let a = stanceDamage(attacker, defender, amount)
  if (comboFor(state, attacker, defender, ctx)) a = Math.round(a * COMBO_MULT)
  return a
}

// After a hero hit lands (attackUnit / abilityHit / burst): pay the combo
// out (consume the setup, COMBO! callout, mana, stagger), then leave this
// hero's own setup on the enemy.
export function afterHeroHit(state, actorId, targetId, combo, { graze = false } = {}) {
  if (!depthOn(state) || ended(state)) return state
  const actor = getUnit(state, actorId)
  if (!isHero(actor)) return state
  let next = state
  const t0 = getUnit(next, targetId)
  if (!t0 || t0.side !== "enemy") return next
  if (combo) {
    const setup = SETUPS[combo.setup]
    const by = { ...(t0.cbBy || {}) }
    delete by[combo.setup]
    next = setUnit(next, targetId, { [setup.field]: 0, cbBy: by })
    next = emit(next, { kind: "heroCombo", unitId: targetId, actorId, combo: combo.id, label: `${combo.icon} ${combo.name}!`, tiles: [{ ...t0.pos }] })
    next = addLog(next, `COMBO! ${actor.name}'s ${combo.name} cashes in ${setup.name} on ${t0.name} (+50%).`)
    next = gainExternal(next, actorId, COMBO_MANA, "combo")
    if (combo.stagger && getUnit(next, targetId)?.hp > 0) next = staggerUnit(next, targetId, combo.stagger)
  }
  const t = getUnit(next, targetId)
  const mine = setupOf(actor)
  if (graze || !t || t.hp <= 0 || !mine || mine === "rooted" || (combo && combo.setup === mine)) return next
  return applySetup(next, targetId, mine, actorId)
}

export function applySetup(state, targetId, setupId, byId = null) {
  const t = getUnit(state, targetId)
  const s = SETUPS[setupId]
  if (!depthOn(state) || !t || t.hp <= 0 || !s || setupId === "rooted" || t.structure) return state
  const fresh = !(t[s.field] > 0)
  let next = setUnit(state, targetId, { [s.field]: SETUP_TURNS, cbBy: { ...(t.cbBy || {}), [setupId]: byId } })
  if (fresh) next = emit(next, { kind: "reaction", unitId: targetId, label: `${s.icon} ${s.name}` })
  return next
}

// Frost on an enemy soaks it too (tacticsElements' Chill).
export function onChill(state, targetId) {
  const t = getUnit(state, targetId)
  if (!depthOn(state) || !t || t.side !== "enemy") return state
  return applySetup(state, targetId, "soaked", null)
}

// --- 1. Stagger / Delay / turn order ---------------------------------------------------

export function staggerUnit(state, unitId, n = 1) {
  const u = getUnit(state, unitId)
  if (!depthOn(state) || !u || u.hp <= 0 || u.side !== "enemy" || u.structure) return state
  const stagger = Math.min(STAGGER_MAX, (u.stagger || 0) + n)
  if (stagger === (u.stagger || 0)) return state
  const next = setUnit(state, unitId, { stagger })
  return emit(addLog(next, `${u.name} is ${stagger >= 2 ? "reeling - it loses its next action" : "staggered - it acts last next round, with 1 AP"}.`), { kind: "reaction", unitId, label: stagger >= 2 ? "↓↓ Reeling!" : "↓ Staggered!" })
}

// tacticsChaos.knockback: a hero shoving an enemy knocks it off-balance.
export function onKnockback(state, actorId, targetId) {
  const actor = getUnit(state, actorId)
  const t = getUnit(state, targetId)
  if (!depthOn(state) || !isHero(actor) || !t || t.hp <= 0 || t.side !== "enemy") return state
  return staggerUnit(applySetup(state, targetId, "offBalance", actorId), targetId, 1)
}

// The order enemies act this phase: un-staggered first (board order), then
// the staggered ones. Shared by runEnemyTurn and previewEnemyIntents.
export function enemyQueue(state) {
  const living = state.units.filter((u) => u.side === "enemy" && u.hp > 0)
  if (!depthOn(state)) return living.map((u) => u.id)
  return [...living.filter((u) => !(u.stagger > 0)), ...living.filter((u) => u.stagger > 0)].map((u) => u.id)
}

// Right before an enemy acts: a stagger is spent. { state, skip }.
export function beginEnemyAction(state, enemyId) {
  const u = getUnit(state, enemyId)
  if (!depthOn(state) || !u || !(u.stagger > 0)) return { state, skip: false }
  if (u.stagger >= STAGGER_MAX) {
    const next = emit(setUnit(state, enemyId, { stagger: 0 }), { kind: "reaction", unitId: enemyId, label: "↓↓ Reeling" })
    return { state: addLog(next, `${u.name} reels and loses this action - it will act next round.`), skip: true, reeling: true }
  }
  const next = setUnit(state, enemyId, { stagger: 0, ap: Math.max(1, Math.min(u.ap, (u.ap || 1) - 1)) })
  return { state: addLog(next, `${u.name} recovers from the stagger (1 AP).`), skip: false, staggered: true }
}

export function canDelay(state, unit) {
  return depthOn(state) && isHero(unit) && unit.hp > 0 && state.phase === "player" && unit.ap >= 1 && !unit.delayLock && !unit.reaction && !(unit.overwatch > 0) && !unit.delayed
}

export function delayAction(state, unitId) {
  const u = getUnit(state, unitId)
  if (!canDelay(state, u)) return state
  const next = emit(setUnit(state, unitId, { ap: 0, delayed: DELAY_BONUS_AP }), { kind: "reaction", unitId, label: "⏳ Delayed" })
  return addLog(next, `${u.name} waits - it will act at the end of the round, after the enemies (+${DELAY_BONUS_AP} AP next turn).`)
}

// --- 4. Reactions ------------------------------------------------------------------------

export const REACTIONS = {
  parry: { id: "parry", name: "Parry", icon: "🛡", text: "Halve the first melee hit on this hero (a tank or Defensive stance negates it) and Stagger the attacker. +8 resource." },
  counter: { id: "counter", name: "Counter", icon: "⚔", text: "Strike back at the first enemy that attacks this hero, if it can reach it." },
  interrupt: { id: "interrupt", name: "Interrupt", icon: "✋", text: `Cancel the first enemy SKILL or ULTIMATE within ${INTERRUPT_RANGE} tiles - costs ${INTERRUPT_MANA} resource when it fires.` },
}
export const REACTION_IDS = Object.keys(REACTIONS)

export function interruptCost(u) {
  if (!hasMana(u)) return 0
  const sp = profileOf(u).special
  if (sp === "tokens" || sp === "inverted") return Infinity
  return scaleAmount(u, INTERRUPT_MANA)
}

export function reactionBlockReason(state, unit, kind) {
  if (!depthOn(state) || !isHero(unit) || unit.hp <= 0 || state.phase !== "player") return "Not now"
  if (!REACTIONS[kind]) return "Unknown"
  if (unit.reaction === kind) return null
  if (unit.ap < 1) return "Needs 1 AP"
  if (unit.reaction) return "Already holds a reaction"
  if (unit.overwatch > 0) return "On Overwatch"
  if (unit.delayed) return "Delayed"
  if (kind === "counter" && !(unit.attack > 0)) return "No attack"
  if (kind === "interrupt") {
    const cost = interruptCost(unit)
    if (cost === Infinity) return `Its ${resourceLabel(unit)} can't pay for it`
    if (hasMana(unit) && unit.mana < cost) return `Needs ${cost} ${resourceLabel(unit)}`
  }
  return null
}

// Hold 1 AP as a reaction for the enemy turn. Clicking the held one again
// cancels it (AP back).
export function readyReaction(state, unitId, kind) {
  const u = getUnit(state, unitId)
  if (!u || reactionBlockReason(state, u, kind)) return state
  if (u.reaction === kind) return addLog(setUnit(state, unitId, { reaction: null, ap: u.ap + 1 }), `${u.name} stands down.`)
  const r = REACTIONS[kind]
  const next = emit(setUnit(state, unitId, { reaction: kind, ap: u.ap - 1 }), { kind: "reaction", unitId, label: `${r.icon} ${r.name} ready` })
  return addLog(next, `${u.name} readies a ${r.name}.`)
}

function reactEvent(state, unitId, label, reaction, enemyId) {
  return emit(state, { kind: "reaction", unitId, label, depthReaction: reaction, enemyId })
}

// attackUnit (a NORMAL attack, before damage): Parry - hero side (its held
// reaction) or enemy side (a bracing enemy). Returns { state, amount }.
export function parryHit(state, actorId, targetId, amount) {
  if (!depthOn(state)) return { state, amount }
  const actor = getUnit(state, actorId)
  const t = getUnit(state, targetId)
  if (!actor || !t || cheb(actor.pos, t.pos) > 1 || !(amount > 0)) return { state, amount }
  if (t.side === "player" && t.reaction === "parry" && !(t.stun > 0) && !(t.frozen > 0)) {
    const full = roleOf(t) === "tank" || t.stance === "defensive"
    let next = setUnit(state, targetId, { reaction: null })
    next = reactEvent(next, targetId, full ? "🛡 PERFECT PARRY!" : "🛡 Parry!", "parry", actorId)
    next = addLog(next, `${t.name} parries ${actor.name}'s blow${full ? " completely" : " (half damage)"}!`)
    next = gainExternal(next, targetId, PARRY_MANA, "parry")
    next = staggerUnit(next, actorId, 1)
    return { state: next, amount: full ? 0 : Math.floor(amount / 2) }
  }
  if (t.side === "enemy" && actor.side === "player" && t.parryReady && enemyDepthOn(state)) {
    const next = emit(addLog(setUnit(state, targetId, { parryReady: false }), `${t.name} parries ${actor.name}'s blow (half damage)!`), { kind: "reaction", unitId: targetId, label: "🛡 Parry!" })
    return { state: next, amount: Math.floor(amount / 2) }
  }
  return { state, amount }
}

// After an enemy's normal attack on a hero: Counter.
export function afterEnemyAttack(state, actorId, targetId) {
  if (!depthOn(state) || ended(state)) return state
  const actor = getUnit(state, actorId)
  const t = getUnit(state, targetId)
  if (!actor || !t || actor.hp <= 0 || t.hp <= 0 || t.reaction !== "counter" || t.stun > 0 || t.frozen > 0) return state
  if (!canReach(state, t, t.pos, actor.pos)) return state
  let next = setUnit(state, targetId, { reaction: null })
  next = reactEvent(next, targetId, "⚔ Counter!", "counter", actorId)
  next = addLog(next, `${t.name} counters ${actor.name}!`)
  return attackUnit(next, targetId, actorId, { isReaction: true })
}

// applyEnemyIntent, before a skill / ultimate: Interrupt. null = no one.
export function tryInterrupt(state, enemyId, intent) {
  if (!depthOn(state) || !intent) return null
  const isSkill = intent.kind === "skill" && intent.skillKind !== "enrage"
  const isUlt = intent.kind === "ultimate" && (intent.phase === "windup" || intent.phase === "release")
  if (!isSkill && !isUlt) return null
  const enemy = getUnit(state, enemyId)
  if (!enemy || enemy.hp <= 0) return null
  const hero = livingUnits(state, "player").find(
    (h) => h.reaction === "interrupt" && !(h.stun > 0) && !(h.frozen > 0) && cheb(h.pos, enemy.pos) <= INTERRUPT_RANGE && (!hasMana(h) || h.mana >= interruptCost(h)),
  )
  if (!hero) return null
  const cost = interruptCost(hero)
  let next = setUnit(state, hero.id, { reaction: null, ...(hasMana(hero) && cost > 0 ? { mana: hero.mana - cost } : {}) })
  if (hasMana(hero) && cost > 0) next = emit(next, { kind: "mana", unitId: hero.id, amount: -cost, label: "interrupt", res: resourceLabel(hero) })
  next = reactEvent(next, hero.id, "✋ Interrupt!", "interrupt", enemyId)
  const what = isUlt ? enemy.ult?.name || "ultimate" : intent.name || "skill"
  next = addLog(next, `${hero.name} INTERRUPTS ${enemy.name}'s ${what}!`)
  if (isUlt) {
    next = enemy.ultArmed ? breakUltimate(next, enemyId, "interrupt") : setUnit(next, enemyId, { ultCharge: Math.min(enemy.ultCharge || 0, ULT_BROKEN_LEFT) })
  } else {
    const skill = enemySkillsFor(enemy).find((s) => s.id === intent.skillId)
    const cd = { ...(enemy.skillCd || {}), [intent.skillId]: Math.max(skill?.cooldown || 2, 2) }
    next = setUnit(next, enemyId, { skillCd: cd, ...(enemy.windup ? { windup: null } : {}) })
  }
  next = setUnit(next, enemyId, { ap: 0 })
  return emit(next, { kind: "reaction", unitId: enemyId, label: "Interrupted!" })
}

// AI: a Parry halves (or negates) a melee hit the enemy plans.
export function aiParryFactor(state, attacker, target, pos) {
  if (!depthOn(state) || target.side !== "player" || target.reaction !== "parry" || cheb(pos, target.pos) > 1) return 1
  return roleOf(target) === "tank" || target.stance === "defensive" ? 0 : 0.5
}

// --- Turn hooks (inside the engine's shared phase starts, so the preview is exact) ----

// End of the player's turn (top of enemyPhaseStart): stance payouts.
export function playerTurnEnd(state) {
  if (!depthOn(state)) return state
  let next = state
  for (const u of livingUnits(state, "player")) {
    if (u.stance === "defensive") {
      const add = roleOf(u) === "tank" ? STANCES.defensive.tankBlock : STANCES.defensive.block
      next = emit(setUnit(next, u.id, { block: (getUnit(next, u.id).block || 0) + add }), { kind: "reaction", unitId: u.id, label: `🛡 +${add} Block` })
    } else if (u.stance === "focus" && hasMana(u)) {
      next = gainExternal(next, u.id, CASTER_ROLES.has(roleOf(u)) ? STANCES.focus.casterRes : STANCES.focus.res, "stance")
    }
  }
  return next
}

// Enemy phase start (after the enemy Block reset): enemies pick a stance.
export function enemyStances(state) {
  if (!enemyDepthOn(state)) return state
  let next = state
  for (const u of state.units) {
    if (u.side !== "enemy" || u.hp <= 0 || u.structure) continue
    const want = u.hp <= u.maxHp * ENEMY_BRACE_HP ? "defensive" : behaviorOf(u, state) === "berserker" ? "aggressive" : null
    const patch = { stance: want, parryReady: want === "defensive" }
    if (want === "defensive") patch.block = (u.block || 0) + (roleOf(u) === "tank" ? STANCES.defensive.tankBlock : STANCES.defensive.block)
    next = setUnit(next, u.id, patch)
    if (want !== (u.stance || null) && want) {
      next = emit(addLog(next, `${u.name} ${want === "defensive" ? "braces itself (Defensive - it will parry your first melee hit)" : "goes Aggressive (+25% damage dealt and taken)"}.`), { kind: "reaction", unitId: u.id, label: `${STANCES[want].icon} ${STANCES[want].name}` })
    }
  }
  return next
}

// Start of the player's turn (last step): setups tick, reactions lapse,
// Delayed heroes cash in their extra AP.
export function playerTurnStart(state) {
  if (!depthOn(state)) return state
  let next = state
  for (const u of state.units) {
    if (u.hp <= 0) continue
    const patch = {}
    for (const s of Object.values(SETUPS)) if (s.field !== "root" && u[s.field] > 0) patch[s.field] = u[s.field] - 1
    if (u.side === "player") {
      if (u.reaction) patch.reaction = null
      if (u.delayed) {
        patch.delayed = 0
        patch.delayLock = true
        if (u.ap > 0) patch.ap = u.ap + u.delayed
      } else if (u.delayLock) patch.delayLock = false
    }
    if (Object.keys(patch).length) next = setUnit(next, u.id, patch)
    if (u.side === "player" && u.delayed && u.ap > 0) next = emit(next, { kind: "reaction", unitId: u.id, label: `⏳ +${u.delayed} AP` })
  }
  return { ...next, units: next.units.map((u) => (u.side === "player" && u.hp > 0 ? { ...u, turnAp: u.ap } : u)) }
}

// --- UI read-outs ------------------------------------------------------------------------

export function setupsOn(unit) {
  if (!unit) return []
  return Object.values(SETUPS).filter((s) => s.id !== "rooted" && unit[s.field] > 0)
}

// The round as a timeline: heroes (any order) -> enemies in their real
// action order (from the exact preview) -> next round.
export function turnTimeline(state, intents = []) {
  const heroes = state.units.filter((u) => isHero(u) && u.hp > 0)
  const byId = new Map(intents.map((i) => [i.enemyId, i.intent]))
  const order = intents.length ? intents.map((i) => i.enemyId) : enemyQueue(state)
  const enemies = order
    .map((id) => state.units.find((u) => u.id === id))
    .filter((u) => u && u.hp > 0)
    .map((u, i) => {
      const intent = byId.get(u.id) || null
      return { id: u.id, name: u.name, unit: u, index: i + 1, intent, staggered: !!intent?.staggered, reeling: intent?.kind === "reeling", reactions: intent?.reactions || [] }
    })
  const heroSlots = heroes.map((u) => ({
    id: u.id,
    name: u.name,
    unit: u,
    status: u.delayed ? "delayed" : u.ap > 0 ? "ready" : "done",
    reaction: u.reaction || (u.overwatch > 0 ? "overwatch" : null),
  }))
  return {
    round: state.turn,
    phase: state.phase,
    heroes: heroSlots.filter((h) => h.status !== "delayed"),
    delayed: heroSlots.filter((h) => h.status === "delayed"),
    enemies: enemies.filter((e) => !e.reeling),
    reeling: enemies.filter((e) => e.reeling),
    nextEnemyId: enemies.find((e) => !e.reeling)?.id || null,
  }
}
