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
  crystal: "gravel",
}

export const MOSS_HEAL = 1
export const LEAF_FLARE_DAMAGE = 2
export const GLOWCAP_HEAL = 4
export const FLARE_TURNS = 1

// Battlefield piece 6 - heavy heroes TOPPLE runestones (Marc: "kaada kivi").
// A Juggernaut or Bruiser striking a runestone from right next to it pushes
// it over, away from them: whoever stands on the next tile takes
// TOPPLE_DAMAGE, and both tiles are left as rubble. A stone toppled into
// deep water makes a stepping-stone crossing. For everyone else runestones
// stay the field's anchors.
export const TOPPLERS = new Set(["juggernaut", "bruiser"])
export const TOPPLE_DAMAGE = 4
// Mana crystals (Skills/Mana/Environment PRD §7): breaking one releases its
// mana - every hero within 1 tile (yours AND theirs) gains this much.
export const CRYSTAL_MANA = 15
// The ground answers elements (PRD §7): a hero standing on charred ground
// (ash) that catches fire burns harder; one on ice that is frosted freezes
// sooner.
export const CHARRED_BURN = 1
export const FROZEN_POOL_CHILL = 1
export const GROUND_ELEMENT_BONUS = {
  fire: { on: "ash", extra: CHARRED_BURN, label: "Charred! +1 Burn" },
  frost: { on: "ice", extra: FROZEN_POOL_CHILL, label: "Frozen pool! +1 Chill" },
}

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
  "ground-breaker": { shape: "self", radius: 1, power: 4, quake: true },
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

// Forest-shaping skills (plan piece 6, Marc: "manipuloitavissa"): after
// these skills resolve, the forest GROWS - the hero changes the field.
// Existing skills, so the skill tree and balance stay as they are.
//   grow:   the forest piece that sprouts (a TERRAIN id)
//   on:     "around-self"    open ground around the caster
//           "around-target"  open ground around the target unit / tile
//           "under-allies"   under the caster and its side within `radius`
//           "under-target"   under the target unit / tile
//   radius: how far; count: at most this many tiles (closest first)
//   text:   one line for the skill's tooltip
export const FOREST_SHAPING = {
  "thorn-boundary": { grow: "roots", on: "around-self", radius: 1, count: 4, text: "Thorns root into the ground: roots grow on up to 4 open tiles around the Warden (they snag whoever stops in them)." },
  "growing-wall": { grow: "roots", on: "around-target", radius: 1, count: 3, text: "Roots spread from the wall onto up to 3 open tiles next to it." },
  "group-renewal": { grow: "moss", on: "under-allies", radius: 1, count: 4, text: "Healing moss grows under the healer and the allies it heals (moss heals 1 at the end of each turn)." },
  "lingering-bloom": { grow: "moss", on: "under-target", radius: 0, count: 1, text: "Soft moss grows under the ally it blooms on." },
  overgrow: { grow: "glowcap", on: "around-target", radius: 1, count: 1, text: "A glowcap sprouts at the edge of the new grass - pop it to heal everyone around it." },
  "heavy-swing": { grow: "leaves", on: "around-self", radius: 1, count: 3, text: "The spin kicks dry leaves up around the hero - tinder for a fire trap." },
  // hero ultimates
  wellspring: { grow: "moss", on: "under-allies", radius: 3, count: 6, text: "Moss springs up under the heroes it heals." },
  "grove-sanctum": { grow: "roots", on: "around-self", radius: 2, count: 6, text: "A ring of roots bursts up around the Warden." },
}
export function forestShaping(id) {
  return FOREST_SHAPING[id] || null
}
// Ground a growing piece may take over: open floor and soft leftovers.
// (Objects only grow on empty, unoccupied ground and never cut every path.)
export const GROWABLE = new Set(["path", "forest", "ash", "gravel", "rubble", "branches", "moss", "leaves"])
