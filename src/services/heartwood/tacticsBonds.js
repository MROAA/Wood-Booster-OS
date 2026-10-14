// Hearthwood Frontier - HERO PERSONALITY in a fight (Hero Identity sprint).
// Purpose: quirks (likes / fears), bonds (friends / sworn / rivals) and
// scars & honours change a hero's numbers on the board, and the fight
// remembers what happened to each hero (near-death, kills, bosses, saves)
// so heroIdentity.js can turn it into history + scars after the fight.
// Data: data/heartwood/quirks.js. Units carry (from heroIdentity.js):
//   quirks [ids], scars [ids], grudge (family id), bondMap {unitId: level}
// Tracking fields written during the fight (h* prefix):
//   hMin (lowest HP share), hNear {by, family, hp}, hKills, hBig [names],
//   hSavedBy [unitIds], hSaved [unitIds], lastHitBy (enemy id)
// Pure, deterministic, state in -> state out. Only active when the fight
// runs hero identity (state.heroSig, tacticsSignatures.enableHeroIdentity).
// Public API: familyOf, isBig, fearOf, bondsAround, bondLinks,
// identityAmount, identityHitParts, identityTurnStart, trackHit,
// trackHitBy, trackDamaged, trackHeals.
import { familyOf, familyLabel } from "./heroIdentity"
import { QUIRKS, BONDS, BOND_LEVELS, SCARS, SCAR_RULES } from "../../data/heartwood/quirks"
import { emit, getUnit, setUnit, livingUnits } from "./tacticsEngine"
import { isHigh, terrainAt } from "./tacticsTerrain"

const cheb = (a, b) => Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col))
const arr = (v) => (Array.isArray(v) ? v : [])
const isHero = (u) => !!u && u.side === "player" && !u.structure && !u.npc
export const identityOn = (state) => !!state?.heroSig
const GREEN = new Set(["forest", "bush", "tree", "grass", "tallgrass"])
const FIRE_TILES = new Set(["lava", "fire"])

// --- Families -------------------------------------------------------------------

export { familyOf }

// A boss / miniboss / elite's centrepiece (the biggest enemy of an elite fight).
export function isBig(u, state) {
  if (!u || u.side !== "enemy") return false
  if (state?.boss?.unitId === u.id || (u.phases?.length || 0) > 0) return true
  const kind = state?.difficulty?.kind
  if (kind !== "elite" && kind !== "miniboss" && kind !== "boss") return false
  const foes = (state.units || []).filter((x) => x.side === "enemy" && !x.structure && !x.escort)
  const top = Math.max(0, ...foes.map((x) => x.maxHp || 0))
  return !u.escort && (u.maxHp || 0) >= top
}

const familyName = familyLabel

function fearMatches(state, quirk, hero) {
  for (const e of state.units || []) {
    if (e.side !== "enemy" || e.hp <= 0 || e.structure || cheb(e.pos, hero.pos) > 1) continue
    if (quirk.family === "giant" ? isBig(e, state) : familyOf(e) === quirk.family || (quirk.family === "fire" && (e.burnOnHit > 0 || e.fireOnHit > 0))) return e
  }
  if (quirk.family === "fire") {
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        const p = { row: hero.pos.row + dr, col: hero.pos.col + dc }
        if (FIRE_TILES.has(terrainAt(state, p)) || state.objFire?.[`${p.row}-${p.col}`] > 0) return { name: "the flames" }
      }
  }
  return null
}

// The fear this hero is feeling right now ({ quirk, of }) or null.
export function fearOf(state, hero) {
  if (!identityOn(state) || !isHero(hero) || hero.hp <= 0 || !hero.quirks?.length) return null
  for (const id of hero.quirks) {
    const q = QUIRKS[id]
    if (q?.kind !== "fear") continue
    const of = fearMatches(state, q, hero)
    if (of) return { quirk: q, of }
  }
  return null
}

function likeOn(state, hero, q) {
  if (q?.kind !== "like") return false
  const near = (side) => (state.units || []).filter((x) => x.side === side && x.hp > 0 && !x.structure && x.id !== hero.id && cheb(x.pos, hero.pos) <= 1)
  switch (q.when) {
    case "high":
      return isHigh(state, hero.pos)
    case "green":
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if (GREEN.has(terrainAt(state, { row: hero.pos.row + dr, col: hero.pos.col + dc }))) return true
      return false
    case "early":
      return (state.turn || 1) <= 2
    case "crowd":
      return near("enemy").length >= 2
    case "alone":
      return near("player").filter((x) => !x.npc).length === 0
    case "wounded":
      return hero.hp <= hero.maxHp / 2
    default:
      return false
  }
}

export function likesOn(state, hero) {
  if (!identityOn(state) || !isHero(hero)) return []
  return arr(hero.quirks).map((id) => QUIRKS[id]).filter((q) => likeOn(state, hero, q))
}

// --- Bonds -------------------------------------------------------------------

// Living heroes next to `hero` it has a bond with: [{ unit, level }].
export function bondsAround(state, hero, pos = hero?.pos) {
  if (!identityOn(state) || !isHero(hero) || !hero.bondMap || !pos) return []
  const out = []
  for (const [id, level] of Object.entries(hero.bondMap)) {
    const o = getUnit(state, id)
    if (o && o.hp > 0 && cheb(o.pos, pos) <= 1 && BOND_LEVELS[level]) out.push({ unit: o, level })
  }
  return out
}

// Every bonded pair standing side by side (board lines).
export function bondLinks(state) {
  if (!identityOn(state)) return []
  const out = []
  const seen = new Set()
  for (const u of state.units || []) {
    if (!isHero(u) || u.hp <= 0) continue
    for (const b of bondsAround(state, u)) {
      const key = [u.id, b.unit.id].sort().join("|")
      if (seen.has(key)) continue
      seen.add(key)
      out.push({ a: u.id, b: b.unit.id, level: b.level })
    }
  }
  return out
}

const best = (list) => (list.some((b) => b.level === "sworn") ? "sworn" : list.some((b) => b.level === "friend") ? "friend" : null)

// --- Scars ---------------------------------------------------------------------

function scarOn(state, hero, s, defender) {
  switch (s.when) {
    case "always":
      return true
    case "below30":
      return hero.hp <= hero.maxHp * 0.3
    case "vsFamily":
      return !!defender && !!hero.grudge && (hero.grudge === "giant" ? isBig(defender, state) : familyOf(defender) === hero.grudge)
    case "vsBig":
      return !!defender && isBig(defender, state)
    default:
      return false
  }
}
function scarsFor(hero) {
  return arr(hero?.scars).map((id) => SCARS[id]).filter(Boolean)
}

// --- Damage + aim ---------------------------------------------------------------

// modifiedAttackAmount: likes, bonds, fears and scars, both ways. A hero's
// own hit never drops below 1 (a fear can't stall a fight).
export function identityAmount(attacker, defender, amount, state) {
  if (!identityOn(state) || !(amount > 0) || !attacker || !defender) return amount
  let a = amount
  if (isHero(attacker) && defender.side === "enemy") {
    for (const q of likesOn(state, attacker)) a += q.dmg || 0
    const bond = best(bondsAround(state, attacker))
    if (bond === "sworn") a += BONDS.swornDmg
    else if (bond === "friend") a += BONDS.friendDmg
    for (const s of scarsFor(attacker)) if (s.dmg && scarOn(state, attacker, s, defender)) a += s.dmg
    const fear = fearOf(state, attacker)
    if (fear) a = Math.max(1, a - (fear.quirk.dmg || 0))
  }
  if (isHero(defender) && attacker.side === "enemy") {
    if (bondsAround(state, defender).some((b) => b.level === "rival")) a += BONDS.rivalTaken
    for (const s of scarsFor(defender)) if (s.guard && scarOn(state, defender, s, attacker)) a = Math.max(0, a - s.guard)
  }
  return a
}

export function identityHitParts(state, attacker, defender, atkPos = attacker?.pos) {
  if (!identityOn(state) || !isHero(attacker) || defender?.side !== "enemy") return []
  const at = atkPos && (atkPos.row !== attacker.pos.row || atkPos.col !== attacker.pos.col) ? { ...attacker, pos: atkPos } : attacker
  const parts = []
  for (const q of likesOn(state, at)) if (q.aim) parts.push({ label: `${q.icon} ${q.name}`, value: q.aim })
  const bonds = bondsAround(state, at)
  if (best(bonds)) parts.push({ label: `${BOND_LEVELS[best(bonds)].icon} Next to a friend`, value: BONDS.friendAim })
  if (bonds.some((b) => b.level === "rival")) parts.push({ label: "⚡ Showing off for a rival", value: BONDS.rivalAim })
  for (const s of scarsFor(at)) if (s.aim && scarOn(state, at, s, defender)) parts.push({ label: `${s.icon} ${s.name}`, value: s.aim })
  const fear = fearOf(state, at)
  if (fear) parts.push({ label: `😨 ${fear.quirk.name}`, value: -(fear.quirk.aim || 0) })
  return parts
}

// --- Turn start: fear callouts, Guardian Angel ------------------------------------

export function identityTurnStart(state) {
  if (!identityOn(state)) return state
  let next = state
  for (const u of livingUnits(state, "player")) {
    if (!isHero(u)) continue
    const fear = fearOf(next, u)
    if (fear) next = emit({ ...next, log: [...next.log, `${u.name} is afraid of ${familyName(fear.quirk.family)} (-${fear.quirk.dmg} damage, -${fear.quirk.aim}% to hit).`] }, { kind: "reaction", unitId: u.id, label: `😨 ${fear.quirk.name}!` })
    if (arr(u.scars).includes("guardian-angel")) {
      const hurt = livingUnits(next, "player").some((o) => o.id !== u.id && isHero(o) && cheb(o.pos, u.pos) <= 1 && o.hp <= o.maxHp / 2)
      if (hurt) next = emit(setUnit(next, u.id, { block: (getUnit(next, u.id).block || 0) + (SCARS["guardian-angel"].block || 1) }), { kind: "reaction", unitId: u.id, label: "😇 Guardian Angel" })
    }
  }
  return next
}

// A bond pays out on a hit: one callout per hero per turn.
export function bondCallout(state, actorId) {
  const a = getUnit(state, actorId)
  if (!identityOn(state) || !isHero(a) || a.bondCallTurn === state.turn) return state
  const bonds = bondsAround(state, a)
  if (!bonds.length) return state
  const lvl = best(bonds) || "rival"
  const other = bonds.find((b) => b.level === lvl)?.unit
  return emit(setUnit(state, actorId, { bondCallTurn: state.turn }), { kind: "reaction", unitId: actorId, label: `${BOND_LEVELS[lvl].icon} ${BOND_LEVELS[lvl].name}!`, bond: lvl, withId: other?.id })
}

// --- Tracking (what the hero will remember) --------------------------------------

// A hero hit an enemy (attack or skill).
export function trackHit(state, actorId, targetId, fell) {
  if (!identityOn(state)) return state
  const a = getUnit(state, actorId)
  const t = getUnit(state, targetId)
  if (!isHero(a) || !t || t.side !== "enemy") return state
  let next = bondCallout(state, actorId)
  if (!fell) return next
  const patch = { hKills: (a.hKills || 0) + 1 }
  if (isBig(t, state)) patch.hBig = [...arr(a.hBig), t.name]
  next = setUnit(next, actorId, patch)
  // Saved: a badly hurt ally this enemy was threatening (it hit them, or
  // it stood right next to them).
  for (const h of livingUnits(next, "player")) {
    if (!isHero(h) || h.id === actorId || h.hp > h.maxHp * SCAR_RULES.savedPct) continue
    if (h.lastHitBy !== targetId && cheb(h.pos, t.pos) > 1) continue
    next = setUnit(next, h.id, { hSavedBy: [...arr(h.hSavedBy), actorId] })
    next = setUnit(next, actorId, { hSaved: [...arr(getUnit(next, actorId).hSaved), h.id] })
    next = emit(next, { kind: "reaction", unitId: h.id, label: `🤝 Saved by ${a.name}!` })
  }
  return next
}

// An enemy hit a hero.
export function trackHitBy(state, enemyId, heroId) {
  const h = getUnit(state, heroId)
  if (!identityOn(state) || !isHero(h)) return state
  return h.lastHitBy === enemyId ? state : setUnit(state, heroId, { lastHitBy: enemyId })
}

// A hero lost HP (any source): lowest point + who brought it there.
export function trackDamaged(state, heroId) {
  const h = getUnit(state, heroId)
  if (!identityOn(state) || !isHero(h) || !(h.maxHp > 0)) return state
  const pct = h.hp / h.maxHp
  if (h.hMin != null && pct >= h.hMin) return state
  const patch = { hMin: pct }
  if (h.hp > 0 && pct <= SCAR_RULES.nearDeathPct) {
    let by = h.lastHitBy ? getUnit(state, h.lastHitBy) : null
    if (!by || by.hp <= 0) by = livingUnits(state, "enemy").filter((e) => !e.structure).sort((x, y) => cheb(x.pos, h.pos) - cheb(y.pos, h.pos))[0] || by
    patch.hNear = { by: by?.name || "the enemy", family: by ? (isBig(by, state) ? "giant" : familyOf(by)) : null, hp: h.hp }
  }
  return setUnit(state, heroId, patch)
}

// After a cast: a heal that pulled an ally back from <= 30% is a save.
export function trackHeals(before, after, actorId) {
  if (!identityOn(after)) return after
  const a = getUnit(after, actorId)
  if (!isHero(a)) return after
  let next = after
  for (const b of before.units) {
    if (!isHero(b) || b.id === actorId || b.hp <= 0 || b.hp > b.maxHp * SCAR_RULES.savedPct) continue
    const now = getUnit(next, b.id)
    if (!now || now.hp <= b.hp) continue
    next = setUnit(next, b.id, { hSavedBy: [...arr(now.hSavedBy), actorId] })
    next = setUnit(next, actorId, { hSaved: [...arr(getUnit(next, actorId).hSaved), b.id] })
    next = emit(next, { kind: "reaction", unitId: b.id, label: `🤝 Saved by ${a.name}!` })
  }
  return next
}
