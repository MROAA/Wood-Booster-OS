// Hearthwood battlefield - biomes (theme-based generation).
// Plan: docs/hearthwood-battlefield-plan.md §4.
//
// Purpose: ONE place that says how a battlefield looks in each part of the
// forest. A biome is plain data - floor palette, the small forest-floor
// details scattered on empty ground, the ambient life over the field.
// The renderer (ForestFloor.jsx + BoardAmbience) reads it; nothing else
// needs to change to add a new biome.
//
// Adding a biome: copy `autumnwood`, change the values, add it to BIOMES.
// Detail kinds available (ForestFloor.jsx DETAIL_ART): leaf, leaves, flower,
// toadstool, chanterelle, pebbles, fern, twig, berries, cone, mosstuft.
// Colours are hex strings; weights are relative (0 = never).
//
// Pure presentation data - no game rules live here.

export const BIOMES = {
  autumnwood: {
    id: "autumnwood",
    name: "Autumnwood",
    mood: "Fallen leaves, red caps and golden evening light - warm, homely, ancient.",
    palette: {
      // the painted floor (dark, low contrast - units stay the stars)
      floorA: "#15150d",
      floorB: "#22231a",
      floorC: "#2b2519",
      moss: [0.24, 0.32, 0.15], // rgb 0-1 of the moss blots
      litter: [0.42, 0.24, 0.1], // rgb 0-1 of the copper leaf-litter blots
      light: "255, 214, 140", // rgb of the canopy light / sun shafts
    },
    detail: {
      density: 0.78, // share of empty tiles that get at least one detail
      perTile: 3, // at most this many details on one tile
      weights: { leaf: 5, leaves: 3, flower: 2, toadstool: 1, chanterelle: 1, pebbles: 2, fern: 2, twig: 2, berries: 1, cone: 1, mosstuft: 3 },
      // Nature gathers around things: next to these terrain types the
      // floor gets busier and uses these weights instead (composed, not
      // confetti). Keys are terrain ids (tacticsTerrain.js TERRAIN).
      near: {
        tree: { toadstool: 3, chanterelle: 2, mosstuft: 3, fern: 3, cone: 3, leaves: 3, twig: 2 },
        forest: { toadstool: 2, chanterelle: 2, mosstuft: 3, fern: 3, cone: 3, leaves: 2 },
        bush: { fern: 3, flower: 3, mosstuft: 2, berries: 3, leaves: 1 },
        rock: { pebbles: 4, mosstuft: 3, fern: 1 },
        boulder: { pebbles: 4, mosstuft: 3 },
        stump: { toadstool: 2, chanterelle: 3, mosstuft: 3, twig: 2 },
        log: { toadstool: 2, chanterelle: 2, mosstuft: 3, twig: 3 },
        water: { fern: 3, flower: 2, mosstuft: 3, pebbles: 2 },
      },
      // Soft moss / leaf-litter patches that drift across tile borders, so
      // the floor reads as one painted ground instead of a grid of boxes.
      patches: { chance: 0.42, moss: "#3c5226", litter: "#6a3d1c" },
      colours: {
        leaf: ["#b5602a", "#c98a2e", "#8e3f1f", "#d9a441", "#7a5a22"],
        flower: ["#e8e2c8", "#8fb0e0", "#b394d6", "#e2c25a"],
        moss: ["#4f6b2e", "#5d7d34", "#3f5a26"],
      },
    },
    ambient: {
      leaves: 6, // drifting leaves over the field
      fireflies: 14,
      butterflies: 2, // they keep to the rim of the field, never the middle
      shafts: true, // soft golden sun shafts
    },
  },
}

export const DEFAULT_BIOME_ID = "autumnwood"

// Which biome an Act fights in. Acts without their own biome yet use the
// default (plan §4: Frostroot / Sunspire / Mirefall come in piece 5).
export const BIOME_FOR_ACT = {}

export function biomeForAct(act) {
  return BIOMES[BIOME_FOR_ACT[act]] || BIOMES[DEFAULT_BIOME_ID]
}

// The biome a battle is drawn in: an explicit `battle.biome` id wins.
export function biomeForBattle(battle) {
  return BIOMES[battle?.biome] || BIOMES[DEFAULT_BIOME_ID]
}
