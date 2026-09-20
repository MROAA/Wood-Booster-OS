// Hearthwood - The Almanac. Marc: "kehitetään peliä lisää" -> meta
// hook -> "Almanakka". A lifetime discovery collection: the units,
// enemies, relics and events you've encountered across all runs, each
// revealing its lore the first time you meet it. A completionist "see
// the one I'm missing" pull. Nothing here touches a run - it reads
// meta.almanac (metaState.js), which runEngine.noteSeen fills as
// runState.seen and HeartwoodBattle unions in when a run ends.
//
// Pure data + pure resolvers. `lore` for an entry is, in order:
//   ALMANAC_LORE[id]  (hand-authored, below - the ones that earn a
//                       real field-notes paragraph)
//   -> the entity's own text (ENEMIES.description / EVENTS.body /
//      RELICS.description)
//   -> FALLBACK_LORE  (a generic line - placeholder-first).

import { UNITS } from "./units"
import { ENEMIES } from "./enemies"
import { RELICS } from "./relics"
import { EVENTS } from "./events"
import { tribesOf, TRIBES } from "./synergies"
import { ROLES, unitProfile } from "./roles"

const FALLBACK_LORE = "Seen once, in passing. The wood keeps no other record of it - yet."

// Hand-authored field notes. Keyed by entity id. ~a dozen: the four
// Trial bosses, a handful of signature units, a few landmark relics.
// Everything else rides on its own blurb (see moduleEntry below).
export const ALMANAC_LORE = {
  // --- Bosses (the enemy id the Trial wraps) ---------------------
  deepwarden:
    "The Rootkeeper. The oldest thing still standing watch in the Outer Grove, and the first to be reached by the rot he was set to guard against. He fights the way a tree falls - slowly, and then all at once. Beat him and the roots let go: he was never the enemy, only the alarm.",
  thornmaw:
    "The Heartwood Warden. Not corrupted - suspicious. He stands between every traveller and the forest's heart and decides, on the spot, whether you are a protector or a destroyer. He will not be rushed, out-lasted, or talked around. Only shown.",
  wyrmgall:
    "The Veilbound. A shape the border of the world put on to have something to test you with. It has no side. It punishes the reckless and the turtled alike, because it isn't measuring your strength - it's measuring whether what you brought this far is true.",
  spacemonkey:
    "The Hollow King. The forest's first guardian, the one who failed - and kept failing, alone, until failing was all that was left of him. There is no crown and no face, only the space where a protector used to be. He does not fall when you win. He simply stops needing to hold on.",

  // --- Signature units ------------------------------------------
  "the-fool":
    "Mosskit. Barely a handspan of moss and nerve. Every warden's roster starts with one; most forget it was ever there. It asks for nothing and gives what little it has, which on the worst road is more than most.",
  sapthorn:
    "Sapthorn. A sliver of the deep wood that learned to walk. Keep it on the line long enough, in company that leans its way, and it stops being a sliver - the forest reclaims its own and hands it back grown.",
  "wood-elemental":
    "Wood Elemental. What a Sapthorn becomes when a squad commits to the green: no longer a seedling carried along, but a standing part of the wood that chose to march with you. Growth from purpose, the old texts say, not from power.",
  "the-hierophant":
    "Goldenbough. A common thing that simply refused to stay common - carried a Thorn line on its back through fight after fight until the line, and it, came out the other end changed.",

  // --- Landmark relics ---------------------------------------
  "ember-core":
    "A coal that has not gone out since before the first warden. Hold it and the whole squad strikes a little hotter, every swing, every fight. It asks nothing back. That alone should worry you.",
  "essence-well":
    "A cupped stone that is always, faintly, wet. Coin left near it does not sit still - it seeps, and gathers, and is somehow more when you come back for it.",
}

function collectableUnits() {
  return Object.values(UNITS).filter((u) => u && u.id && !u.summonOnly)
}

// Category definitions - order + label + the id universe each draws
// from. `total` is derived, never hard-coded, so adding content just
// grows the denominator.
export const ALMANAC_CATEGORIES = [
  { key: "units", label: "Wardens", total: collectableUnits().length },
  { key: "enemies", label: "The Wood's Own", total: Object.keys(ENEMIES).length },
  { key: "relics", label: "Relics", total: Object.keys(RELICS).length },
  { key: "events", label: "Waypoints", total: EVENTS.length },
]

const EVENT_BY_ID = Object.fromEntries(EVENTS.map((e) => [e.id, e]))

function unitSub(def) {
  // Role & tag identity model (roles.js): "Tank / Support" instead of a
  // bare legacy role string.
  const p = def.role ? unitProfile(def) : null
  const role = p
    ? `${ROLES[p.primary].label}${p.secondary ? " / " + ROLES[p.secondary].label : ""}`
    : "Unit"
  const tribes = tribesOf(def.id, def)
    .map((t) => TRIBES[t]?.name || t)
    .join(", ")
  const tier = def.displayTier === 2 ? " · fused" : def.evolvedFrom ? " · evolved" : ""
  return tribes ? `${role} · ${tribes}${tier}` : `${role}${tier}`
}

function enemySub(def) {
  return def.act ? `Act ${def.act} · ${def.maxHp} HP` : `${def.maxHp} HP`
}

// Resolve one entry to what the screen renders. `id` need not be known
// (a stale saved id just yields a graceful "unknown" entry).
export function almanacEntry(categoryKey, id) {
  if (categoryKey === "units") {
    const def = UNITS[id]
    if (!def) return { id, name: id, art: "rune", lore: FALLBACK_LORE }
    return {
      id,
      name: def.name,
      art: def.art,
      image: def.image || null,
      sub: unitSub(def),
      lore: ALMANAC_LORE[id] || FALLBACK_LORE,
    }
  }
  if (categoryKey === "enemies") {
    const def = ENEMIES[id]
    if (!def) return { id, name: id, art: "husk", lore: FALLBACK_LORE }
    return {
      id,
      name: def.name,
      art: def.art,
      image: def.image || null,
      sub: enemySub(def),
      lore: ALMANAC_LORE[id] || def.description || FALLBACK_LORE,
    }
  }
  if (categoryKey === "relics") {
    const def = RELICS[id]
    if (!def) return { id, name: id, art: "rune", lore: FALLBACK_LORE }
    return {
      id,
      name: def.name,
      art: def.icon || "rune",
      image: def.image || null,
      sub: "Relic",
      lore: ALMANAC_LORE[id] || def.description || FALLBACK_LORE,
    }
  }
  // events
  const ev = EVENT_BY_ID[id]
  if (!ev) return { id, name: id, art: "moonGlyph", lore: FALLBACK_LORE }
  return {
    id,
    name: ev.title,
    art: "moonGlyph",
    image: null,
    sub: ev.act ? `Act ${ev.act}` : "Waypoint",
    lore: ALMANAC_LORE[id] || ev.body || FALLBACK_LORE,
  }
}

// Every id that CAN appear in a category, in a stable order - the
// screen renders one tile per id, locked until it's in meta.almanac.
export function almanacIds(categoryKey) {
  if (categoryKey === "units") return collectableUnits().map((u) => u.id)
  if (categoryKey === "enemies") return Object.keys(ENEMIES)
  if (categoryKey === "relics") return Object.keys(RELICS)
  return EVENTS.map((e) => e.id)
}

// { units: {seen,total}, ..., overall: {seen,total} } from a meta store.
export function almanacCounts(meta) {
  const alm = meta?.almanac || {}
  const out = { overall: { seen: 0, total: 0 } }
  for (const cat of ALMANAC_CATEGORIES) {
    const ids = new Set(almanacIds(cat.key))
    const seen = (alm[cat.key] || []).filter((id) => ids.has(id)).length
    out[cat.key] = { seen, total: cat.total }
    out.overall.seen += seen
    out.overall.total += cat.total
  }
  return out
}

// Pure: fold a run's `runState.seen` into a meta store's `almanac`,
// deduped. Idempotent. Leaves every other meta field untouched.
export function recordAlmanac(meta, seen) {
  if (!seen) return meta
  const base = meta?.almanac || { units: [], enemies: [], relics: [], events: [] }
  const almanac = { ...base }
  for (const cat of ["units", "enemies", "relics", "events"]) {
    const merged = new Set([...(base[cat] || []), ...(seen[cat] || [])])
    almanac[cat] = [...merged]
  }
  return { ...meta, almanac }
}
