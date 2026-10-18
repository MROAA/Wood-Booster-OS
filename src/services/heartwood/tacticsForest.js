// Hearthwood battlefield - the living forest RULES (piece 3).
// Plan: docs/hearthwood-battlefield-plan.md §3.
//
// Purpose: one readable place that says how every forest tile reacts.
// Pure data + pure helpers - no state changes here (tacticsObjects.js
// applies these tables to the battle). Imports nothing, so there is no
// cycle with the engine.
//
// Adding a forest piece: give it a TERRAIN + TERRAIN_INFO entry
// (tacticsTerrain.js), art (TerrainArt.jsx), and - if it burns or breaks -
// one line in BURNS_TO / CRUSHES_TO below. Adding a spell that strikes the
// forest: one line in FOREST_SPELLS.

// What FIRE turns a tile into (it is flames for a while first).
export const BURNS_TO = {
  bush: "ash",
  moss: "ash",
  leaves: "ash",
  roots: "ash",
  log: "ash",
  branches: "ash",
  stump: "ash",
}
// Dry leaves don't just catch - they FLARE: the fire leaps across every
// connected leaf tile at once and scorches whoever stands in them.
export const FLARES = new Set(["leaves"])
// Damp moss never catches from fire next to it (a firebreak) - only a
// direct hit of fire burns it.
export const DAMP = new Set(["moss"])

// What a HEAVY IMPACT (explosion, rolling boulder, earth-shaking spell)
// turns a tile into. Break-down chains: big things become smaller things.
//   log -> branches -> bare ground,  rubble -> gravel,  rocks -> rubble.
export const CRUSHES_TO = {
  bush: "path",
  moss: "path",
  leaves: "path",
  roots: "path",
  log: "branches",
  branches: "path",
  stump: "path",
  rock: "rubble",
  rubble: "gravel",
}

// What a destroyed OBJECT leaves behind (default: rubble).
export const BREAKS_TO = {
  stone: "rubble",
  boulder: "rubble",
  glowcap: "moss",
}

export const MOSS_HEAL = 1
export const LEAF_FLARE_DAMAGE = 2
export const GLOWCAP_HEAL = 4
export const FLARE_TURNS = 1

export const isBurnable = (t) => !!BURNS_TO[t]
export const spreadsInto = (t) => isBurnable(t) && !DAMP.has(t)
export const crushResult = (t) => CRUSHES_TO[t] || null

// Spells and the forest (Marc: "spellit voi rikkoa puita"). An area spell
// strikes every forest object in its area - trees fall away from the blast,
// stones crack, pods burst, glowcaps pop - and its element reshapes the
// ground there.
//   shape:  "self"   around the caster
//           "target" around the target unit / chosen tile
//   radius: tiles (number) or "skill" = the spell's own radius field
//   power:  damage dealt to each object
//   element: "fire" burns the ground and sets trees alight, "frost" freezes
//            water and makes ice pillars brittle
//   quake:  true = a heavy impact - the ground in the area is crushed too
//   delayed: true = not on cast; the effect calls forestSpellStrike itself
export const FOREST_SPELLS = {
  // hero ultimates
  earthshatter: { shape: "self", radius: "skill", power: 6, quake: true },
  "meteor-barrage": { shape: "target", radius: 1, power: 6, element: "fire", quake: true },
  "mana-storm": { shape: "target", radius: 1, power: 4 },
  // class skills
  "thorn-boundary": { shape: "self", radius: "skill", power: 2 },
  "frozen-ground": { shape: "target", radius: 1, power: 2, element: "frost" },
  "complete-ritual": { shape: "self", radius: "skill", power: 3 },
  "volatile-mixture": { shape: "target", radius: 1, power: 2 },
  // Saboteur's charge, when it blows (tacticsClasses detonateCharges)
  "explosive-charge": { shape: "target", radius: 1, power: 6, quake: true, delayed: true },
}

export function forestSpell(id) {
  return FOREST_SPELLS[id] || null
}

// Tiles a forest spell covers: Chebyshev distance <= radius from the centre.
export function spellAreaTiles(center, radius, grid) {
  const tiles = []
  for (let dr = -radius; dr <= radius; dr++) {
    for (let dc = -radius; dc <= radius; dc++) {
      const p = { row: center.row + dr, col: center.col + dc }
      if (p.row >= 0 && p.col >= 0 && p.row < grid.rows && p.col < grid.cols) tiles.push(p)
    }
  }
  return tiles
}
