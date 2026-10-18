// Hearthwood - BETWEEN-FIGHTS BUILD DEPTH. Purpose: the run layer that
// makes the map, camps, events and loot ask the player to PLAN a build.
// Four systems, all pure (state in -> state out), all deterministic in
// the run seed, all additive keys on runState (old saves read defaults):
//
//   1. Route risk     - every fork offers 2-3 paths. A path is Quiet,
//                       Hunted or Cursed: harder fights (a higher threat
//                       tier in tacticsDifficulty) for better rewards. A
//                       Cursed path closes for good if you pass it by.
//                       A path can also lead to a Camp instead of the
//                       next Market (a real either/or).
//   2. Build sets     - data/heartwood/buildSets.js (read here for the
//                       camp bonus and the shop "plan toward" pick).
//   3. Camp           - limited actions (Rest / Train / Craft / Scout /
//                       Commune); you can't do everything.
//   4. Fates          - data/heartwood/fates.js: lasting consequences
//                       planted by events, resolved fights/markets later.
//
// Dependencies: data modules + unitLevels (XP table). Never imports
// runEngine (runEngine imports this) - anything Act/RUN_PATH-shaped is
// handed in by the caller.
//
// Public API: see the exports below; runEngine.js wires them into the
// real run flow, tacticsRealMatchup.js into the real fight.
import { streamRng } from "../../data/heartwood/seed"
import { ITEMS, itemPool } from "../../data/heartwood/items"
import { relicPool } from "../../data/heartwood/relics"
import { RECIPES } from "../../data/heartwood/recipes"
import { UNITS } from "../../data/heartwood/units"
import { ACT_ENEMIES, ENEMIES } from "../../data/heartwood/enemies"
import { FATES } from "../../data/heartwood/fates"
import { setCampBonus, setOfItem, startedSetIds } from "../../data/heartwood/buildSets"
import { CHARACTERS } from "../../data/heartwood/characters"
import { LEVEL_XP, MAX_LEVEL, levelForXp } from "./unitLevels"
// Dota depth sprint: tiered build recipes (components + a recipe cost).
import { forgeOptions, forgeRecipe } from "./itemForge"

const pickFrom = (list, rng) => (list.length ? list[Math.floor(rng() * list.length)] : null)

// =============================================================================
// 1. ROUTE RISK
// =============================================================================

// `threat` is added to the DifficultyEngine score (tacticsDifficulty.js -
// ~10-18 points per tier step), `hpMult` scales the fight's enemy factor,
// `essence` is paid on top of the win, `loot` drops after the win.
export const RISK_LEVELS = {
  safe: {
    id: "safe",
    name: "Quiet path",
    short: "Quiet",
    icon: "leaf",
    color: "#8fae6a",
    threat: 0,
    hpMult: 1,
    essence: 0,
    loot: null,
    blurb: "The usual dangers.",
  },
  risky: {
    id: "risky",
    name: "Hunted path",
    short: "Hunted",
    icon: "sword",
    color: "#d08a3a",
    threat: 12,
    hpMult: 1.12,
    essence: 60,
    loot: "item",
    blurb: "Tougher enemies. Pays +60 Essence and a piece of gear.",
  },
  cursed: {
    id: "cursed",
    name: "Cursed path",
    short: "Cursed",
    icon: "moonGlyph",
    color: "#b766a0",
    threat: 22,
    hpMult: 1.22,
    essence: 120,
    loot: "relic",
    closes: true,
    blurb: "Much tougher enemies. Pays +120 Essence and a relic. Closes behind you if you pass it by.",
  },
}

export function riskOf(node) {
  return RISK_LEVELS[node?.risk] || RISK_LEVELS.safe
}

// The route decoration keys - stripped before a passed-by option goes
// back into the battle pool, so it returns as a plain fight.
const ROUTE_KEYS = ["risk", "leadsTo", "closes", "campSlot"]
export function stripRoute(node) {
  if (!node) return node
  const out = { ...node }
  for (const k of ROUTE_KEYS) delete out[k]
  return out
}

// Turns 2-3 raw pool fights into a fork. Option 0 is always the Quiet
// path; the others roll Hunted/Cursed (Act I never shows a Cursed path).
// `campSlot` = the RUN_PATH index of the market right after this fight
// (null if none): roughly every other fork, ONE path leads to a Camp
// there instead of the Market.
export function decorateRouteOptions(options, { seed, nodeIndex, act = 1, campSlot = null }) {
  const rng = streamRng(seed ?? 0, "world", `route:${nodeIndex}`)
  const out = options.map((n) => ({ ...stripRoute(n), risk: "safe" }))
  if (out[1]) out[1].risk = rng() < (act <= 1 ? 0.5 : 0.7) ? "risky" : "safe"
  if (out[2]) out[2].risk = act >= 2 && rng() < 0.6 ? "cursed" : "risky"
  for (const o of out) if (RISK_LEVELS[o.risk].closes) o.closes = true
  if (campSlot != null) {
    const campIdx = nodeIndex >= 3 && rng() < 0.5 ? Math.floor(rng() * out.length) : -1
    out.forEach((o, i) => {
      o.leadsTo = i === campIdx ? "camp" : "market"
      o.campSlot = campSlot
    })
  }
  return out
}

// What a path card promises: { risk, essence, loot, leadsTo, closes }.
export function routePreview(node, baseEssence = 0) {
  const risk = riskOf(node)
  return { risk, essence: baseEssence + risk.essence, loot: risk.loot, leadsTo: node?.leadsTo || null, closes: !!node?.closes }
}

// After a won fight on a risky path: the promised loot. Seeded (`loot`).
export function riskLoot(runState, node) {
  const risk = riskOf(node)
  if (!risk.loot) return runState
  const rng = streamRng(runState.seed ?? 0, "loot", `${runState.nodeIndex}:route`)
  if (risk.loot === "item") {
    const id = pickFrom(itemPool().filter((i) => i.rarity !== "legendary").map((i) => i.id), rng)
    if (!id) return runState
    return {
      ...runState,
      items: [...(runState.items || []), { key: runState.itemKeyCounter, defId: id, equippedTo: null, slotIndex: null }],
      itemKeyCounter: runState.itemKeyCounter + 1,
      lastAftermath: [...(runState.lastAftermath || []), `${risk.short} path spoils: ${ITEMS[id].name}.`],
    }
  }
  const owned = new Set(runState.relics || [])
  const id = pickFrom(relicPool().map((r) => r.id).filter((r) => !owned.has(r)), rng)
  if (!id) return runState
  return {
    ...runState,
    relics: [...(runState.relics || []), id],
    lastAftermath: [...(runState.lastAftermath || []), `${risk.short} path spoils: a relic!`],
  }
}

// =============================================================================
// 4. FATES (planted by events, resolved later)
// =============================================================================

export function activeFates(runState) {
  return (runState?.fates || []).filter((f) => !f.done)
}

// Plants a fate. `act` picks a rival from that Act's enemies. One copy of
// a given fate at a time. Returns the new runState.
export function plantFate(runState, fateId, act = 1) {
  const def = FATES[fateId]
  if (!def) return runState
  const fates = runState.fates || []
  if (fates.some((f) => f.id === fateId && !f.done)) return runState
  const rng = streamRng(runState.seed ?? 0, "event", `${runState.nodeIndex}:fate:${fateId}`)
  const inst = {
    uid: `${fateId}@${runState.nodeIndex}`,
    id: fateId,
    kind: def.kind,
    title: def.title,
    text: def.text,
    wait: def.wait || 0,
    left: def.fights ?? def.shops ?? 1,
    done: false,
    outcome: null,
    plantedAt: runState.nodeIndex,
  }
  let rs = runState
  if (def.kind === "curse" && def.relic) {
    const owned = new Set(rs.relics || [])
    const id = def.relic === "random" ? pickFrom(relicPool().map((r) => r.id).filter((r) => !owned.has(r)), rng) : def.relic
    if (id && !owned.has(id)) {
      rs = { ...rs, relics: [...(rs.relics || []), id] }
      inst.relicId = id
    }
  }
  if (def.kind === "rival") {
    const pool = (ACT_ENEMIES[Math.max(1, Math.min(7, act))] || []).filter((id) => ENEMIES[id])
    // A fate can name its own enemy (e.g. the Barrow Shieldmaiden).
    inst.enemyId = (def.enemy && ENEMIES[def.enemy] ? def.enemy : null) || pickFrom(pool, rng) || "mist-growler"
    inst.rivalName = def.rivalName
  }
  if (def.kind === "ally") {
    inst.unit = UNITS[def.unit] ? def.unit : "the-fool"
    inst.allyName = def.allyName
  }
  if (def.kind === "debt") rs = { ...rs, essence: (rs.essence || 0) + (def.essence || 0) }
  if (def.kind === "thread" && def.flag) rs = { ...rs, storyFlags: { ...(rs.storyFlags || {}), [def.flag]: true } }
  return { ...rs, fates: [...fates, inst] }
}

const dueNow = (f) => !f.done && (f.wait || 0) <= 0

// Squad effects from curses hanging over this fight.
export function fateEffectsForFight(runState) {
  return activeFates(runState)
    .filter((f) => f.kind === "curse" && dueNow(f))
    .flatMap((f) => FATES[f.id]?.effects || [])
}

// The ally / rival / tide that shows up in THIS fight (tactics fights).
export function fateAllyForFight(runState) {
  return activeFates(runState).find((f) => f.kind === "ally" && dueNow(f)) || null
}
export function fateRivalForFight(runState) {
  return activeFates(runState).find((f) => f.kind === "rival" && dueNow(f)) || null
}
export function fateOverchargeForFight(runState) {
  return activeFates(runState)
    .filter((f) => f.kind === "tide" && dueNow(f))
    .reduce((s, f) => s + (FATES[f.id]?.overcharge || 0), 0)
}

// Everything a fate does to the fight about to start - the formation
// screen banner reads this so the player sees it coming.
export function fatesThisFight(runState) {
  return activeFates(runState).filter((f) => ["curse", "ally", "rival", "tide"].includes(f.kind) && dueNow(f))
}

function resolve(f, outcome) {
  return { ...f, done: true, wait: 0, left: 0, outcome }
}

// After a WON fight: counters tick, due allies/rivals resolve, bounties pay.
export function tickFatesAfterFight(runState) {
  const fates = runState.fates || []
  if (!fates.some((f) => !f.done)) return runState
  let essence = runState.essence || 0
  const lines = []
  const next = fates.map((f) => {
    if (f.done || f.kind === "price" || f.kind === "debt" || f.kind === "thread") return f
    const def = FATES[f.id] || {}
    if ((f.wait || 0) > 0) return { ...f, wait: f.wait - 1 }
    if (f.kind === "ally") {
      lines.push(`Fate: ${def.resolvedText || "Your ally moves on."}`)
      return resolve(f, def.resolvedText)
    }
    if (f.kind === "rival") {
      essence += def.bounty || 0
      const text = `${def.resolvedText || "The rival is beaten."} +${def.bounty || 0} Essence.`
      lines.push(`Fate: ${text}`)
      return resolve(f, text)
    }
    const left = (f.left || 1) - 1
    if (left <= 0) {
      lines.push(`Fate: ${def.resolvedText || "It passes."}`)
      return resolve(f, def.resolvedText)
    }
    return { ...f, left }
  })
  return {
    ...runState,
    essence,
    fates: next,
    lastAftermath: lines.length ? [...(runState.lastAftermath || []), ...lines] : runState.lastAftermath,
  }
}

// After LEAVING a market: price fates count down, debts come due.
export function tickFatesAfterShop(runState) {
  const fates = runState.fates || []
  if (!fates.some((f) => !f.done && (f.kind === "price" || f.kind === "debt"))) return runState
  let essence = runState.essence || 0
  const next = fates.map((f) => {
    if (f.done || (f.kind !== "price" && f.kind !== "debt")) return f
    const def = FATES[f.id] || {}
    const left = (f.left || 1) - 1
    if (left > 0) return { ...f, left }
    if (f.kind === "debt") {
      const paid = Math.min(essence, def.owed || 0)
      essence -= paid
      return resolve(f, `${def.resolvedText || "The debt is paid."} (-${paid} Essence)`)
    }
    return resolve(f, def.resolvedText)
  })
  return { ...runState, essence, fates: next }
}

// Recruit price multiplier from market fates (1 = none).
export function fatePriceMult(runState) {
  return activeFates(runState)
    .filter((f) => f.kind === "price")
    .reduce((m, f) => m * (FATES[f.id]?.mult || 1), 1)
}

// A story thread pays off when the event that needs its flag is played.
export function resolveThreads(runState, event) {
  if (!event?.requiresFlag) return runState
  const fates = runState.fates || []
  if (!fates.some((f) => !f.done && f.kind === "thread" && FATES[f.id]?.flag === event.requiresFlag)) return runState
  return {
    ...runState,
    fates: fates.map((f) =>
      !f.done && f.kind === "thread" && FATES[f.id]?.flag === event.requiresFlag ? resolve(f, FATES[f.id]?.resolvedText) : f,
    ),
  }
}

// =============================================================================
// 3. CAMP
// =============================================================================

export const CAMP_BASE_ACTIONS = 2
export const CAMP_REST_PCT = 0.5
export const COMMUNE_POOL = 10
export const COMMUNE_POOL_CAP = 30
export const COMMUNE_OVERCHARGE = 30

export const CAMP_ACTIONS = [
  { id: "rest", name: "Rest", icon: "heart", text: "Everyone heals half their health. The Wounded are tended and fight fresh." },
  { id: "train", name: "Train", icon: "sword", text: "One hero drills until dark: enough XP for their next level - a perk or a skill-tree point." },
  { id: "craft", name: "Craft", icon: "rune", text: "Fuse a gear recipe from parts you carry, no lining up needed. Or whittle a simple piece of gear." },
  { id: "scout", name: "Scout", icon: "moonGlyph", text: "Read the road ahead: the next forks show their enemies, objectives and exact spoils." },
  { id: "commune", name: "Commune", icon: "cosmic", text: "Sit with the old stones. Deepen one hero's well (+10 max mana for good), or charge the squad for the next fight (Overcharge +30)." },
]

export function campActionLimit(runState) {
  return CAMP_BASE_ACTIONS + setCampBonus(runState)
}

export function enterCampState(runState) {
  return { ...runState, camp: { used: [], limit: campActionLimit(runState), log: [] } }
}

export function campActionsLeft(runState) {
  const c = runState?.camp
  return c ? Math.max(0, (c.limit || CAMP_BASE_ACTIONS) - (c.used || []).length) : 0
}

export function canUseCamp(runState, actionId) {
  return runState?.phase === "camp" && campActionsLeft(runState) > 0 && !(runState.camp?.used || []).includes(actionId)
}

function spendCamp(runState, actionId, line) {
  const c = runState.camp || { used: [], limit: CAMP_BASE_ACTIONS, log: [] }
  return { ...runState, camp: { ...c, used: [...(c.used || []), actionId], log: [...(c.log || []), line] } }
}

const heroName = (e) => UNITS[e?.defId]?.name || e?.defId || "A hero"

export function campRest(runState) {
  if (!canUseCamp(runState, "rest")) return runState
  const heal = (pct) => Math.min(1, (typeof pct === "number" ? pct : 1) + CAMP_REST_PCT)
  return spendCamp(
    {
      ...runState,
      bench: runState.bench.map((e) => (e.hpPct != null || e.wounded ? { ...e, hpPct: heal(e.hpPct), wounded: false } : e)),
      commanderHpPct: heal(runState.commanderHpPct),
      commanderWounded: false,
    },
    "rest",
    "The squad sleeps by the fire. Wounds close.",
  )
}

// Heroes (and the Commander) who can still level: [{ key, name, level }].
export function campTrainOptions(runState) {
  const order = [...(runState.deployed || []).filter((k) => k !== null), ...runState.bench.map((e) => e.key)]
  const seen = new Set()
  const out = []
  for (const key of order) {
    if (seen.has(key)) continue
    seen.add(key)
    const e = runState.bench.find((b) => b.key === key)
    if (!e || !UNITS[e.defId]) continue
    const level = levelForXp(e.xp)
    if (level < MAX_LEVEL) out.push({ key, name: heroName(e), level })
  }
  const cmdLevel = levelForXp(runState.commanderXp)
  if (cmdLevel < MAX_LEVEL) out.push({ key: "commander", name: CHARACTERS[runState.characterId]?.name || "Commander", level: cmdLevel })
  return out
}

export function campTrain(runState, key) {
  if (!canUseCamp(runState, "train")) return runState
  const opt = campTrainOptions(runState).find((o) => o.key === key)
  if (!opt) return runState
  const need = LEVEL_XP[opt.level]
  const line = `${opt.name} trains until dark - Level ${opt.level + 1}!`
  if (key === "commander") return spendCamp({ ...runState, commanderXp: Math.max(runState.commanderXp || 0, need) }, "train", line)
  return spendCamp(
    { ...runState, bench: runState.bench.map((e) => (e.key === key ? { ...e, xp: Math.max(e.xp || 0, need) } : e)) },
    "train",
    line,
  )
}

// Recipes the run carries both parts of (anywhere - bag or worn).
// Dota depth sprint: plus the tiered BUILD recipes open at this Act that
// the run has every part of and can pay the recipe cost for. Legacy
// two-part recipes keep their `a`/`b` shape.
export function campCraftOptions(runState, act = 1) {
  const items = runState.items || []
  const legacy = Object.values(RECIPES).filter((r) => {
    if (!ITEMS[r.result]) return false
    const a = items.find((it) => it.defId === r.a)
    const b = items.find((it) => it.defId === r.b && it.key !== a?.key)
    return !!(a && b)
  })
  const built = forgeOptions(runState, act).filter((r) => !r.legacy)
  return [...legacy, ...built]
}

export function campCraft(runState, recipeId, act = 1) {
  if (!canUseCamp(runState, "craft")) return runState
  const items = runState.items || []
  if (recipeId === "whittle") {
    const rng = streamRng(runState.seed ?? 0, "loot", `${runState.nodeIndex}:camp-whittle`)
    const started = new Set(startedSetIds(runState))
    const commons = itemPool().filter((i) => i.rarity === "common")
    // Whittling leans toward a set you've started (plan-toward).
    const setCommons = commons.filter((i) => started.has(setOfItem(i.id)))
    const id = pickFrom((setCommons.length ? setCommons : commons).map((i) => i.id), rng)
    if (!id) return runState
    return spendCamp(
      { ...runState, items: [...items, { key: runState.itemKeyCounter, defId: id, equippedTo: null, slotIndex: null }], itemKeyCounter: runState.itemKeyCounter + 1 },
      "craft",
      `You whittle a ${ITEMS[id].name} by the fire.`,
    )
  }
  const r = campCraftOptions(runState, act).find((x) => x.id === recipeId)
  if (!r) return runState
  if (r.parts && !RECIPES[r.id]) {
    const forged = forgeRecipe(runState, r.id, act)
    if (forged === runState) return runState
    return spendCamp(forged, "craft", `You forge a ${ITEMS[r.result].name}${r.cost ? ` (-${r.cost} Essence)` : ""}.`)
  }
  const a = items.find((it) => it.defId === r.a)
  const b = items.find((it) => it.defId === r.b && it.key !== a.key)
  const key = runState.itemKeyCounter
  const found = runState.recipesFound || []
  return spendCamp(
    {
      ...runState,
      items: items.filter((it) => it.key !== a.key && it.key !== b.key).concat({ key, defId: r.result, equippedTo: a.equippedTo, slotIndex: a.slotIndex }),
      itemKeyCounter: key + 1,
      recipesFound: found.includes(r.id) ? found : [...found, r.id],
    },
    "craft",
    `You craft a ${ITEMS[r.result].name}.`,
  )
}

// `scoutedThrough` (the RUN_PATH index of the fight after next) is worked
// out by runEngine, which knows RUN_PATH.
export function campScout(runState, scoutedThrough) {
  if (!canUseCamp(runState, "scout")) return runState
  return spendCamp(
    { ...runState, scoutedThrough: Math.max(runState.scoutedThrough || 0, scoutedThrough || 0), routeScoutedUntil: runState.nodeIndex + 12 },
    "scout",
    "Your scouts come back with the lay of the land.",
  )
}

// mode "deepen" (+10 max mana on one hero, for good; cap 30) or
// "overcharge" (the whole squad starts the next fight Overcharged).
export function campCommune(runState, mode, key = null) {
  if (!canUseCamp(runState, "commune")) return runState
  if (mode === "overcharge") {
    return spendCamp({ ...runState, campOvercharge: COMMUNE_OVERCHARGE }, "commune", "The stones hum. Your squad will start the next fight Overcharged.")
  }
  const e = runState.bench.find((b) => b.key === key)
  if (!e || (e.manaBonus || 0) >= COMMUNE_POOL_CAP) return runState
  return spendCamp(
    { ...runState, bench: runState.bench.map((b) => (b.key === key ? { ...b, manaBonus: Math.min(COMMUNE_POOL_CAP, (b.manaBonus || 0) + COMMUNE_POOL) } : b)) },
    "commune",
    `${heroName(e)}'s well runs deeper (+${COMMUNE_POOL} max mana).`,
  )
}

// Has the camp's Scout revealed this fork? (FloorChoice shows full detail.)
export function routeScouted(runState) {
  return (runState?.routeScoutedUntil || -1) >= (runState?.nodeIndex || 0)
}
