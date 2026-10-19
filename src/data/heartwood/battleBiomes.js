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
// toadstool, chanterelle, pebbles, fern, twig, berries, cone, mosstuft,
// reeds, lily, deadtwig, ash, ember, snowtuft, icecrystal, shard, glowmote.
// Tree species (TerrainArt.jsx): birch, aspen, spruce, willow, dead,
// spruce-snow, birch-frost, birch-sun, echo.
// Colours are hex strings; weights are relative (0 = never).
//
// Mostly presentation data; `dressing` says WHICH forest pieces a fight's
// field gets - their rules live in tacticsForest.js.

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
      // raised ground (high ground tiles) - ForestFloor.jsx HillLayer
      hill: { top: ["#5c6a38", "#46522c"], lit: "#b3bf7a", shade: "#141b0e", cliff: ["#6a4a2c", "#33241a"], strata: "#24180d" },
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
    // Living forest pieces the battlefield generator scatters on open
    // middle tiles (rules: tacticsForest.js; generator:
    // tacticsRealMatchup.generateForestDressing). clumps = how many groups,
    // size = tiles per group (orthogonal neighbours, so dry leaves flare
    // across a whole clump). Blocking pieces never cut every route across.
    dressing: [
      { type: "leaves", clumps: [2, 3], size: [2, 3] },
      { type: "moss", clumps: [1, 2], size: [2, 3] },
      { type: "roots", clumps: [1, 2], size: [2, 2] },
      { type: "stone", clumps: [1, 1], size: [1, 1] },
      { type: "glowcap", clumps: [1, 2], size: [1, 1] },
    ],
    // tree species standing on tree tiles (TerrainArt TreeSprite), mixed per tile
    trees: ["birch", "aspen", "spruce"],
    ambient: {
      leaves: 6, // drifting particles over the field
      drift: "leaf", // leaf | snow | ash | spore | mote
      driftColours: ["#b5602a", "#c98a2e", "#8e3f1f", "#d9a441"],
      fireflies: 14,
      fireflyColour: "246, 225, 140",
      butterflies: 2, // they keep to the rim of the field, never the middle
      shafts: true, // soft golden sun shafts
    },
  },

  // Act II - The Deepening Woods: the forest gets wetter and darker.
  mirefall: {
    id: "mirefall",
    name: "Mirefall",
    mood: "Waterlogged ground, mossy roots, reeds and glowing caps under a slow mist - beauty with a hint of danger.",
    palette: {
      floorA: "#0f1511",
      floorB: "#17211b",
      floorC: "#1e2620",
      moss: [0.16, 0.3, 0.24],
      litter: [0.14, 0.22, 0.26],
      light: "170, 225, 205",
      hill: { top: ["#3f5a48", "#2b4034"], lit: "#8fc0a4", shade: "#0b140f", cliff: ["#3b3a2c", "#1f1d16"], strata: "#141209" },
    },
    detail: {
      density: 0.8,
      perTile: 3,
      weights: { mosstuft: 5, reeds: 3, lily: 2, toadstool: 2, fern: 3, leaf: 1, pebbles: 1, glowmote: 1 },
      near: {
        tree: { toadstool: 3, mosstuft: 3, fern: 3, glowmote: 1 },
        forest: { toadstool: 2, mosstuft: 3, fern: 3 },
        bush: { reeds: 3, fern: 3, mosstuft: 2 },
        rock: { pebbles: 3, mosstuft: 4 },
        boulder: { pebbles: 3, mosstuft: 4 },
        stump: { toadstool: 3, mosstuft: 3 },
        log: { toadstool: 3, mosstuft: 3 },
        water: { reeds: 4, lily: 4, mosstuft: 2 },
        poison: { reeds: 3, lily: 2, glowmote: 2 },
      },
      patches: { chance: 0.5, moss: "#25402f", litter: "#1f2f35" },
      colours: {
        leaf: ["#5a6b3a", "#3f5a3a", "#6a7a44"],
        flower: ["#b394d6", "#8fd0c8", "#e8e2c8"],
        moss: ["#3f6a52", "#2f5a48", "#4f7a5e"],
      },
    },
    dressing: [
      { type: "moss", clumps: [2, 3], size: [2, 3] },
      { type: "roots", clumps: [2, 2], size: [2, 3] },
      { type: "glowcap", clumps: [1, 2], size: [1, 1] },
      { type: "sporepod", clumps: [1, 1], size: [1, 1] },
      { type: "stone", clumps: [0, 1], size: [1, 1] },
    ],
    trees: ["spruce", "willow", "spruce"],
    ambient: { leaves: 8, drift: "spore", driftColours: ["#a8e0a0", "#8fd0c8"], fireflies: 10, fireflyColour: "150, 235, 205", butterflies: 0, shafts: false, mist: true },
  },

  // Act III - The Wounded Hearthwood: the autumn forest gone grey.
  woundedgrove: {
    id: "woundedgrove",
    name: "Wounded Grove",
    mood: "Ash, dead wood and brittle leaves; a few embers still glow. The heart of the forest is hurt.",
    palette: {
      floorA: "#13110f",
      floorB: "#1c1916",
      floorC: "#23201b",
      moss: [0.22, 0.22, 0.17],
      litter: [0.3, 0.27, 0.24],
      light: "225, 170, 130",
      hill: { top: ["#4c4a3c", "#34332a"], lit: "#9a957a", shade: "#0e0d0a", cliff: ["#4a3a2a", "#241c14"], strata: "#120d08" },
    },
    detail: {
      density: 0.74,
      perTile: 3,
      weights: { deadtwig: 4, ash: 3, leaf: 2, pebbles: 2, ember: 1, toadstool: 1, mosstuft: 1 },
      near: {
        tree: { deadtwig: 3, ash: 2, leaf: 2, ember: 1 },
        forest: { deadtwig: 3, ash: 2 },
        bush: { leaf: 3, deadtwig: 2 },
        rock: { pebbles: 4, ash: 2 },
        boulder: { pebbles: 4, ash: 2 },
        stump: { ash: 3, ember: 2, deadtwig: 2 },
        log: { ash: 3, deadtwig: 3, ember: 1 },
        water: { pebbles: 2, deadtwig: 2 },
      },
      patches: { chance: 0.45, moss: "#33322a", litter: "#2e2622" },
      colours: {
        leaf: ["#6a5a44", "#5a4a3a", "#7a5a3a"],
        flower: ["#8a7a6a", "#a09080"],
        moss: ["#4a4a38", "#3a3a2c", "#55553f"],
      },
    },
    dressing: [
      { type: "leaves", clumps: [2, 3], size: [2, 3] },
      { type: "roots", clumps: [1, 2], size: [2, 2] },
      { type: "sporepod", clumps: [1, 1], size: [1, 1] },
      { type: "stone", clumps: [1, 1], size: [1, 1] },
    ],
    trees: ["dead", "dead", "spruce"],
    ambient: { leaves: 10, drift: "ash", driftColours: ["#8a847a", "#5a554e", "#a39a8e"], fireflies: 5, fireflyColour: "255, 150, 80", butterflies: 0, shafts: false },
  },

  // Act IV - The Reckoning: winter comes to the roots.
  frostroot: {
    id: "frostroot",
    name: "Frostroot",
    mood: "Frost-covered roots, ice crystals and snowy moss; the light breaks quietly in the ice.",
    palette: {
      floorA: "#11161a",
      floorB: "#1a2127",
      floorC: "#212932",
      moss: [0.24, 0.3, 0.36],
      litter: [0.46, 0.54, 0.62],
      litterAlpha: -0.64, // sparser pale frost blots than the default
      light: "205, 228, 255",
      hill: { top: ["#7f8e9a", "#5a6974"], lit: "#cfdce6", shade: "#18222c", cliff: ["#4a5560", "#262e36"], strata: "#141a20" },
    },
    detail: {
      density: 0.76,
      perTile: 3,
      weights: { snowtuft: 5, icecrystal: 2, pebbles: 2, cone: 2, deadtwig: 1, mosstuft: 1 },
      near: {
        tree: { snowtuft: 3, cone: 3, deadtwig: 1 },
        forest: { snowtuft: 3, cone: 3 },
        bush: { snowtuft: 3, deadtwig: 2 },
        rock: { snowtuft: 3, pebbles: 3, icecrystal: 1 },
        boulder: { snowtuft: 3, pebbles: 3 },
        stump: { snowtuft: 3, cone: 2 },
        log: { snowtuft: 3, deadtwig: 2 },
        water: { icecrystal: 4, snowtuft: 2 },
        ice: { icecrystal: 4, snowtuft: 2 },
        icepillar: { icecrystal: 4, snowtuft: 2 },
      },
      patches: { chance: 0.32, moss: "#3e4b57", litter: "#56646f" },
      colours: {
        leaf: ["#8a7a5a", "#6a5a44"],
        flower: ["#e8f2f8", "#a8c8e0"],
        moss: ["#5a7a6a", "#4a6a60", "#6a8a7a"],
      },
    },
    dressing: [
      { type: "roots", clumps: [2, 2], size: [2, 3] },
      { type: "stone", clumps: [1, 2], size: [1, 1] },
      { type: "icepillar", clumps: [1, 2], size: [1, 1] },
      { type: "moss", clumps: [1, 1], size: [2, 2] },
    ],
    trees: ["spruce-snow", "spruce-snow", "birch-frost"],
    ambient: { leaves: 12, drift: "snow", driftColours: ["#f2f8ff", "#dfeaf5"], fireflies: 0, fireflyColour: "220, 235, 255", butterflies: 0, shafts: true },
  },

  // Act V - The Crownless: a fallen golden court in bright light.
  sunspire: {
    id: "sunspire",
    name: "Sunspire",
    mood: "Tall grass, golden flowers, sun shafts and the old stones of a fallen court - bright and hopeful, but broken.",
    palette: {
      floorA: "#18160f",
      floorB: "#23211a",
      floorC: "#2b291e",
      moss: [0.36, 0.4, 0.18],
      litter: [0.55, 0.45, 0.2],
      light: "255, 232, 165",
      hill: { top: ["#828442", "#646630"], lit: "#ece49e", shade: "#16160a", cliff: ["#6a5434", "#3a2e1c"], strata: "#1e160c" },
    },
    detail: {
      density: 0.8,
      perTile: 3,
      weights: { flower: 5, mosstuft: 2, pebbles: 2, leaf: 2, fern: 1, berries: 1 },
      near: {
        tree: { flower: 3, leaf: 3, mosstuft: 2 },
        forest: { flower: 3, fern: 2 },
        bush: { flower: 4, berries: 2 },
        rock: { pebbles: 4, flower: 2 },
        boulder: { pebbles: 4, flower: 2 },
        stump: { flower: 3, mosstuft: 2 },
        log: { flower: 2, mosstuft: 2 },
        water: { flower: 3, mosstuft: 2 },
        stone: { pebbles: 3, flower: 3 },
      },
      patches: { chance: 0.42, moss: "#5c6630", litter: "#7a6428" },
      colours: {
        leaf: ["#d9b441", "#c9a030", "#e8c860"],
        flower: ["#f0d860", "#f4ecc8", "#e8e2c8", "#e8b84a"],
        moss: ["#7a8a3a", "#6a7a30", "#8a9a44"],
      },
    },
    dressing: [
      { type: "leaves", clumps: [1, 2], size: [2, 3] },
      { type: "stone", clumps: [2, 3], size: [1, 1] },
      { type: "glowcap", clumps: [1, 1], size: [1, 1] },
      { type: "moss", clumps: [1, 1], size: [2, 2] },
    ],
    trees: ["birch-sun", "birch-sun", "aspen"],
    ambient: { leaves: 10, drift: "mote", driftColours: ["#fff0b0", "#ffe08a"], fireflies: 12, fireflyColour: "255, 232, 150", butterflies: 3, shafts: true },
  },

  // Acts VI-VII - The Echo Rift / Verge: the forest's mirrored, uncanny edge.
  echo: {
    id: "echo",
    name: "The Echo",
    mood: "Violet moss, humming crystal shards and a mist that remembers - the forest as an echo of itself.",
    palette: {
      floorA: "#110f17",
      floorB: "#1a1623",
      floorC: "#211b2b",
      moss: [0.28, 0.2, 0.4],
      litter: [0.36, 0.28, 0.52],
      light: "205, 175, 255",
      hill: { top: ["#4a3e60", "#332944"], lit: "#b8a0e8", shade: "#0c0914", cliff: ["#3a2e48", "#1c1626"], strata: "#0e0a14" },
    },
    detail: {
      density: 0.72,
      perTile: 3,
      weights: { shard: 4, glowmote: 3, pebbles: 2, mosstuft: 2, deadtwig: 1 },
      near: {
        tree: { glowmote: 3, mosstuft: 2, shard: 1 },
        forest: { glowmote: 3, mosstuft: 2 },
        bush: { glowmote: 2, mosstuft: 2 },
        rock: { shard: 4, pebbles: 2 },
        boulder: { shard: 4, pebbles: 2 },
        stone: { shard: 3, glowmote: 2 },
        water: { glowmote: 3, shard: 2 },
      },
      patches: { chance: 0.42, moss: "#3a2e58", litter: "#4a3a6e" },
      colours: {
        leaf: ["#7a5aa8", "#5a4a88"],
        flower: ["#c0a0f0", "#8fd0e8"],
        moss: ["#4a3a6a", "#3a2e58", "#5a4a7a"],
      },
    },
    dressing: [
      { type: "stone", clumps: [2, 2], size: [1, 1] },
      { type: "glowcap", clumps: [1, 2], size: [1, 1] },
      { type: "roots", clumps: [1, 1], size: [2, 2] },
      { type: "moss", clumps: [1, 1], size: [2, 2] },
    ],
    trees: ["echo", "echo", "spruce"],
    ambient: { leaves: 10, drift: "mote", driftColours: ["#c8a8ff", "#8fd8f0"], fireflies: 10, fireflyColour: "200, 170, 255", butterflies: 0, shafts: false, mist: true },
  },
}

export const DEFAULT_BIOME_ID = "autumnwood"

// Which biome an Act fights in - the battlefield follows the story
// (docs/hearthwood-battlefield-plan.md §4, act names in
// src/components/hearthwood-studio/actNames.js).
export const BIOME_FOR_ACT = {
  1: "autumnwood", // The Outer Grove
  2: "mirefall", // The Deepening Woods
  3: "woundedgrove", // The Wounded Hearthwood
  4: "frostroot", // The Reckoning
  5: "sunspire", // The Crownless
  6: "echo", // The Echo Rift
  7: "echo", // The Echo Verge
}

export function biomeForAct(act) {
  return BIOMES[BIOME_FOR_ACT[act]] || BIOMES[DEFAULT_BIOME_ID]
}

// The biome a battle is drawn in: an explicit `battle.biome` id wins.
export function biomeForBattle(battle) {
  return BIOMES[battle?.biome] || BIOMES[DEFAULT_BIOME_ID]
}
