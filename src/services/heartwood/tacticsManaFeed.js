// Hearthwood Frontier - MANA-FED ENEMIES (mana sprint 3).
//
// Purpose: some enemy families (Ley Leeches, Manamoths, Silence-eaters)
// and the Gorging Maw boss FEED on mana spent near them. Every hero skill
// cast within the feeder's reach adds a Hunger stack (+1 more for a big
// cast or an overchannel): each stack is +attack, a full family feeder is
// GORGED (extra attack), and the full Maw releases a MANA NOVA on every
// hero within 2 at the start of the enemy turn (telegraphed: its tiles are
// marked all player turn).
// Counterplay: STARVE it (cast out of its reach, attack / use items
// instead), DRAIN it (any mana burn removes Hunger: 1 stack per 5 burned,
// min 1), or BURST it before it feeds.
// AI: feeders walk toward the heroes that cast the most (`castHeat`).
// Responsibilities: the kit fields, Hunger gain/loss, the Nova, AI bonuses,
// UI reads. Dependencies: tacticsEngine helpers (call-time).
// Public API: feedKitFields, feedOnCast, feedBurn, feedEnemyPhaseStart,
// feedNovaTiles, feedTileBonus, feedFocusBonus, feedersIn, feedReadFor.
// Everything is a pure function of the state - previewEnemyIntents stays
// an exact dry run (the Nova runs inside the shared enemyPhaseStart).
// Tests: .scratch/verify_mana_3.mjs.
import { FEED_BURN_PER_STACK, feedKitForDef, FEED_ANSWER } from "../../data/heartwood/manaColours"
import { emit, getUnit, setUnit, applyDamageWithBlock, checkTacticsBattleEnd } from "./tacticsEngine"

const cheb = (a, b) => Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col))
const addLog = (state, line) => (state.log ? { ...state, log: [...state.log, line] } : state)

// Fields a feeder starts a fight with (tacticsMana.initUnit).
export function feedKitFields(u) {
  if (!u || u.side !== "enemy" || u.structure || u.npc || u.manaFeed) return null
  const kit = feedKitForDef(u.defId)
  return kit ? { manaFeed: kit, hunger: 0, feedBonus: 0 } : null
}

export const isFeeder = (u) => !!u?.manaFeed && u.hp > 0
export const feedersIn = (state) => (state?.units || []).filter((u) => u.side === "enemy" && isFeeder(u))

function bonusFor(kit, stacks) {
  return stacks * (kit.per || 1) + (!kit.boss && stacks >= kit.max ? kit.gorged || 0 : 0)
}

// Sets Hunger (clamped) and moves attack by the change in the bonus.
function setHunger(state, id, stacks) {
  const u = getUnit(state, id)
  if (!u?.manaFeed) return state
  const kit = u.manaFeed
  const h = Math.max(0, Math.min(kit.max, stacks))
  const bonus = bonusFor(kit, h)
  const delta = bonus - (u.feedBonus || 0)
  return setUnit(state, id, { hunger: h, feedBonus: bonus, attack: Math.max(0, (u.attack || 0) + delta) })
}

export function feedGain(state, id, n = 1) {
  const u = getUnit(state, id)
  if (!isFeeder(u) || !(n > 0)) return state
  const was = u.hunger || 0
  if (was >= u.manaFeed.max) return state
  let next = setHunger(state, id, was + n)
  const now = getUnit(next, id).hunger
  next = emit(next, { kind: "mana", unitId: id, amount: 0, label: "feed", text: `🍽 Hunger ${now}/${u.manaFeed.max}` })
  if (now >= u.manaFeed.max) {
    next = emit(next, { kind: "reaction", unitId: id, label: u.manaFeed.boss ? "GORGED - Mana Nova next turn!" : "GORGED!" })
    next = addLog(next, u.manaFeed.boss ? `${u.name} is GORGED on your mana - a MANA NOVA bursts at the start of its turn!` : `${u.name} is GORGED on your mana (+${bonusFor(u.manaFeed, now)} attack).`)
  }
  return next
}

// A hero skill was cast: feeders in reach eat it; the caster grows hotter.
export function feedOnCast(state, actorId, { big = false } = {}) {
  const a = getUnit(state, actorId)
  if (!a || a.side !== "player") return state
  let next = setUnit(state, actorId, { castHeat: (a.castHeat || 0) + 1 + (big ? 1 : 0) })
  for (const f of feedersIn(next)) {
    if (cheb(f.pos, a.pos) > (f.manaFeed.range || 3)) continue
    next = feedGain(next, f.id, 1 + (big ? 1 : 0))
  }
  return next
}

// Any mana burn on a feeder strips Hunger (tacticsMana.burnMana).
export function feedBurn(state, id, amount) {
  const u = getUnit(state, id)
  if (!isFeeder(u) || !(u.hunger > 0) || !(amount > 0)) return state
  const lose = Math.min(u.hunger, Math.max(1, Math.floor(amount / FEED_BURN_PER_STACK)))
  const next = setHunger(state, id, u.hunger - lose)
  return emit(addLog(next, `${u.name} loses ${lose} Hunger to the mana burn.`), { kind: "mana", unitId: id, amount: 0, label: "feed", text: `🍽 Hunger -${lose}` })
}

// The Maw's Nova tiles (warned all player turn when it is full).
export function feedNovaTiles(state) {
  const out = []
  for (const f of feedersIn(state)) {
    const nova = f.manaFeed.nova
    if (!f.manaFeed.boss || !nova || (f.hunger || 0) < f.manaFeed.max) continue
    for (let dr = -nova.radius; dr <= nova.radius; dr++) {
      for (let dc = -nova.radius; dc <= nova.radius; dc++) {
        const p = { row: f.pos.row + dr, col: f.pos.col + dc }
        if (p.row >= 0 && p.col >= 0 && p.row < state.grid.rows && p.col < state.grid.cols) out.push(p)
      }
    }
  }
  return out
}

// Top of the enemy phase (inside the shared enemyPhaseStart): a full Maw bursts.
export function feedEnemyPhaseStart(state) {
  let next = state
  for (const f0 of feedersIn(state)) {
    const nova = f0.manaFeed.nova
    if (!f0.manaFeed.boss || !nova || (f0.hunger || 0) < f0.manaFeed.max) continue
    const f = getUnit(next, f0.id)
    const tiles = []
    for (const p of feedNovaTiles({ ...next, units: [f] })) tiles.push(p)
    next = emit(addLog(next, `${f.name} vomits up the mana it ate - MANA NOVA!`), { kind: "combo", unitId: f.id, combo: "colour-nova", label: "👄 MANA NOVA!", tiles, big: true })
    for (const h of next.units.filter((u) => u.side === "player" && u.hp > 0 && !u.structure && cheb(u.pos, f.pos) <= nova.radius).map((u) => u.id)) {
      if (next.phase === "won" || next.phase === "lost") break
      const u = getUnit(next, h)
      const r = applyDamageWithBlock(next, h, nova.damage)
      next = checkTacticsBattleEnd(addLog(r.next, `${u.name} is hit by the Mana Nova (${r.remaining}).${r.fell ? " It falls." : ""}`))
    }
    next = setHunger(next, f.id, nova.keep || 0)
  }
  return next
}

// --- AI -------------------------------------------------------------------------------------

// Where a feeder wants to stand: in reach of the heroes casting the most.
export function feedTileBonus(state, enemy, pos) {
  if (!isFeeder(enemy) || state?.difficulty?.qa) return 0
  let b = 0
  for (const h of state.units) {
    if (h.side !== "player" || h.hp <= 0 || !(h.castHeat > 0)) continue
    if (cheb(h.pos, pos) <= (enemy.manaFeed.range || 3)) b += 3 * Math.min(4, h.castHeat)
  }
  return Math.min(18, b)
}
// Who a feeder walks toward: the heavy caster.
export function feedFocusBonus(enemy, target) {
  if (!isFeeder(enemy) || !(target?.castHeat > 0)) return 0
  return 15 * Math.min(4, target.castHeat)
}

// QA hook (withLowEnemyHp): feeders off.
export function feedQa(u) {
  if (!u?.manaFeed) return u
  return { ...u, manaFeed: null, hunger: 0, attack: Math.max(0, (u.attack || 0) - (u.feedBonus || 0)), feedBonus: 0 }
}

// --- Reads ----------------------------------------------------------------------------------

// Pre-fight "Feeds on mana" line from enemy def ids.
export function feedReadFor(defIds = []) {
  const seen = new Map()
  for (const id of defIds) {
    const kit = feedKitForDef(id)
    if (!kit) continue
    const k = seen.get(kit.id) || { kit, count: 0 }
    k.count++
    seen.set(kit.id, k)
  }
  return { feeders: [...seen.values()], answer: FEED_ANSWER }
}

export function feedSummary(u) {
  if (!u?.manaFeed) return ""
  const k = u.manaFeed
  const full = (u.hunger || 0) >= k.max
  return `${k.icon} Feeds on mana (${k.name}): every hero skill cast within ${k.range} tiles adds Hunger (+${k.per} attack each). Hunger ${u.hunger || 0}/${k.max}.${full ? (k.boss ? " FULL - Mana Nova (" + k.nova.damage + " to heroes within " + k.nova.radius + ") when you end your turn!" : " GORGED.") : ""} Mana burn removes Hunger.`
}
