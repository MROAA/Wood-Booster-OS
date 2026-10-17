// The Long Campaign - NAMED MINI-BOSSES, one per chapter (content sprint).
// Pure data in the tacticsBosses.js BOSS_FIGHTS shape (arena + HP-gated
// phases + telegraphed hazards + weak points + enrage), merged into
// BOSS_FIGHTS, plus each one's formation (merged into formations.js).
//
// As a player reads it: a "Named Foe" mission (👑) turns up once per
// chapter. Its champion has a hand-written intro line, its own arena and
// 1-2 mechanics nobody else has. Every hazard is marked a turn ahead.
// New hazard kind here: `manaburn` - the marked tiles burn mana instead of HP.
//
// Arena chars: # wall, ^ high, ~ water, = bridge, * grass, L lava, I ice,
// r rock, p poison, f forest, _ rubble, T tree, B barrel, O boulder, Y ice pillar.
const P = (row, col) => ({ row, col })
const colTiles = (col, r0, r1) => Array.from({ length: r1 - r0 + 1 }, (_, i) => P(r0 + i, col))

export const CAMPAIGN_BOSS_FIGHTS = {
  "mb-gnarlwick": {
    name: "Old Gnarlwick",
    title: "The Hollow Stump",
    bossDefId: "mb-gnarlwick",
    enemyDefIds: ["rotwood-sapling", "mb-gnarlwick", "ley-cutter"],
    bossStart: P(4, 1),
    chapter: 1,
    arena: [
      "..T...*.....",
      ".T....*.T...",
      "....f.......",
      "..*....T....",
      "............",
      "..*....T....",
      "....f.......",
      ".T....*.T...",
      "..T...*.....",
    ],
    phases: [
      { name: "Roots Wake", text: "Roots snare the heroes standing closest together - spread out.", every: 3, firstAt: 2,
        cycle: [{ kind: "quake", label: "Root Snare", target: "players", shape: "single", max: 2, amount: 5 }] },
      { name: "Sap Knots", atHpPct: 0.55, text: "Two Sap Knots swell on his roots and shield him. Saplings answer his call.",
        enter: { weakPoints: [{ name: "Sap Knot", pos: P(1, 3), hpPct: 0.15 }, { name: "Sap Knot", pos: P(7, 3), hpPct: 0.15 }] },
        every: 2,
        cycle: [
          { kind: "adds", label: "Sapling Call", spawns: [{ defId: "rotwood-sapling", pos: P(0, 0) }, { defId: "rotwood-sapling", pos: P(8, 0) }] },
          { kind: "quake", label: "Root Snare", target: "players", shape: "cross", max: 1, amount: 5 },
        ] },
    ],
  },
  "mb-cinderveil": {
    name: "Sister Cinderveil",
    title: "The Fire That Doesn't Ask",
    bossDefId: "mb-cinderveil",
    enemyDefIds: ["ember-cantor", "mb-cinderveil", "emberthorn-shade"],
    bossStart: P(4, 1),
    chapter: 2,
    arena: [
      "...^........",
      "....L...B...",
      "..*.........",
      "......L.....",
      "^...........",
      "......L.....",
      "..*.........",
      "....L...B...",
      "...^........",
    ],
    phases: [
      { name: "The Veil Smoulders", text: "Ley Scorch: the marked tiles BURN MANA (15) - don't end your turn there with a full bar.", every: 2, firstAt: 2,
        cycle: [{ kind: "manaburn", label: "Ley Scorch", target: "players", shape: "cross", max: 1, amount: 15 }] },
      { name: "Fire That Doesn't Ask", atHpPct: 0.5, text: "The floor melts in rings and cinders fall. She enrages soon - finish her.",
        enter: { enrageIn: 4, enrageAmount: 2 }, every: 2,
        cycle: [
          { kind: "terrain", label: "Molten Ring", to: "lava", waves: [[P(2, 4), P(6, 4), P(3, 7), P(5, 7)], [P(1, 6), P(7, 6), P(4, 8)]] },
          { kind: "quake", label: "Cinder Fall", target: "players", shape: "single", max: 3, amount: 6 },
          { kind: "manaburn", label: "Ley Scorch", target: "players", shape: "cross", max: 1, amount: 15 },
        ] },
    ],
  },
  "mb-choirmother": {
    name: "The Drowned Choir-Mother",
    title: "Voice Under the Water",
    bossDefId: "mb-choirmother",
    enemyDefIds: ["tide-cantor", "mb-choirmother", "drowned-siren"],
    bossStart: P(4, 0),
    chapter: 3,
    arena: [
      "..~~........",
      "..~.....*...",
      "..=.........",
      "..~...~.....",
      "......=.....",
      "..~...~.....",
      "..=.........",
      "..~.....*...",
      "..~~........",
    ],
    phases: [
      { name: "The Choir Sings", text: "Drowned voices climb out of the water to join her.", every: 3, firstAt: 2,
        cycle: [{ kind: "adds", label: "Choir Rises", spawns: [{ defId: "drowned-siren", pos: P(1, 1) }] }] },
      { name: "Choir Bells", atHpPct: 0.6, text: "Two Choir Bells ring her safe. Ring them silent. The water rises around you.",
        enter: { weakPoints: [{ name: "Choir Bell", pos: P(0, 5), hpPct: 0.14 }, { name: "Choir Bell", pos: P(8, 5), hpPct: 0.14 }] },
        every: 2,
        cycle: [
          { kind: "terrain", label: "Rising Water", to: "water", waves: [[P(2, 8), P(6, 8)], [P(1, 7), P(7, 7)]] },
          { kind: "quake", label: "Undertow", target: "row", amount: 5 },
        ] },
      { name: "Under the Water", atHpPct: 0.25, text: "She drags the whole row under - every turn, the row with most of your squad.",
        every: 1,
        cycle: [{ kind: "quake", label: "Drowning Hymn", target: "row", amount: 6 }] },
    ],
  },
  "mb-orrin": {
    name: "Gravel-King Orrin",
    title: "Lord of the Quarry",
    bossDefId: "mb-orrin",
    enemyDefIds: ["ash-hound", "mb-orrin", "ash-hound"],
    bossStart: P(4, 1),
    chapter: 4,
    arena: [
      "....r...O...",
      "..^.........",
      "......#.....",
      "....r.......",
      "^.....O.....",
      "....r.......",
      "......#.....",
      "..^.........",
      "....r...O...",
    ],
    phases: [
      { name: "The Quarry Rumbles", text: "Rockfall crushes the hero with the most friends around it - spread out.", every: 3, firstAt: 2,
        cycle: [{ kind: "quake", label: "Rockfall", target: "players", shape: "3x3", max: 1, amount: 7 }] },
      { name: "Millstone Crown", atHpPct: 0.5, text: "He hauls up walls of quarry stone to box you in. He enrages soon.",
        enter: { enrageIn: 3, enrageAmount: 3 }, every: 2,
        cycle: [
          { kind: "terrain", label: "Stone Walls", to: "wall", waves: [colTiles(7, 1, 3), colTiles(7, 5, 7), [P(2, 9), P(6, 9)]] },
          { kind: "quake", label: "Rockfall", target: "players", shape: "3x3", max: 1, amount: 7 },
        ] },
    ],
  },
  "mb-vesper": {
    name: "Vesper the Unthroned",
    title: "Who Wore the Crown One Night",
    bossDefId: "mb-vesper",
    enemyDefIds: ["void-cantor", "mb-vesper", "crownless-revenant"],
    bossStart: P(4, 1),
    chapter: 5,
    arena: [
      "^^..........",
      "^^...#......",
      "..........*.",
      "....^^......",
      "....^^......",
      "....^^......",
      "..........*.",
      "^^...#......",
      "^^..........",
    ],
    phases: [
      { name: "The Unthroned Court", text: "Crown's Tithe: the marked heroes have mana burned (12). She takes her due.", every: 2, firstAt: 2,
        cycle: [{ kind: "manaburn", label: "Crown's Tithe", target: "players", shape: "single", max: 3, amount: 12 }] },
      { name: "Crown Shards", atHpPct: 0.6, text: "Two Crown Shards shield her, and she steps from shadow to shadow. Break the shards.",
        enter: { weakPoints: [{ name: "Crown Shard", pos: P(0, 3), hpPct: 0.13 }, { name: "Crown Shard", pos: P(8, 3), hpPct: 0.13 }] },
        every: 2,
        cycle: [
          { kind: "teleport", label: "Shadow Step", options: [P(0, 0), P(8, 0), P(4, 4), P(1, 1), P(7, 1)] },
          { kind: "manaburn", label: "Crown's Tithe", target: "players", shape: "single", max: 3, amount: 12 },
        ] },
    ],
  },
  "mb-mirrorwright": {
    name: "The Mirrorwright",
    title: "Maker of Echoes",
    bossDefId: "mb-mirrorwright",
    enemyDefIds: ["echo-shade", "mb-mirrorwright", "hollow-reaver"],
    bossStart: P(4, 1),
    chapter: 6,
    arena: [
      "..I...Y...I.",
      "...I........",
      "..Y.....I...",
      "....I.......",
      "......Y.....",
      "....I.......",
      "..Y.....I...",
      "...I........",
      "..I...Y...I.",
    ],
    phases: [
      { name: "Hold Still", text: "He polishes echoes out of the air - two at a time.", every: 3, firstAt: 2,
        cycle: [{ kind: "adds", label: "Polished Echoes", spawns: [{ defId: "echo-shade", pos: P(0, 1) }, { defId: "echo-shade", pos: P(8, 1) }] }] },
      { name: "Hall of Mirrors", atHpPct: 0.5, text: "A Master Mirror shields him, and he steps between reflections. Shatter the mirror.",
        enter: { weakPoints: [{ name: "Master Mirror", pos: P(4, 3), hpPct: 0.16 }] },
        every: 2,
        cycle: [
          { kind: "teleport", label: "Mirror Step", options: [P(1, 0), P(7, 0), P(4, 2), P(2, 5), P(6, 5)] },
          { kind: "quake", label: "Shatter", target: "players", shape: "cross", max: 2, amount: 6 },
        ] },
    ],
  },
  "mb-rootrot": {
    name: "Rootrot",
    title: "The Last Gardener",
    bossDefId: "mb-rootrot",
    enemyDefIds: ["verge-chanter", "mb-rootrot", "tainted-sapling"],
    bossStart: P(4, 1),
    chapter: 7,
    arena: [
      "...T....f...",
      "..p.........",
      "....T...T...",
      ".......p....",
      "..T.........",
      ".......p....",
      "....T...T...",
      "..p.........",
      "...T....f...",
    ],
    phases: [
      { name: "Weeding", text: "Rot blooms under your heroes' feet - poison pools where they stand.", every: 2, firstAt: 2,
        cycle: [{ kind: "terrain", label: "Rot Bloom", to: "poison", target: "players", shape: "cross", max: 2 }] },
      { name: "Uprooting", atHpPct: 0.66, text: "He tears up the column with most of your squad.",
        every: 2,
        cycle: [
          { kind: "quake", label: "Uprooting", target: "column", amount: 7 },
          { kind: "adds", label: "Weed Seed", spawns: [{ defId: "tainted-sapling", pos: P(4, 0) }] },
        ] },
      { name: "The Last Weed", atHpPct: 0.33, text: "Two Rot Taproots shield him. He enrages soon. Cut the taproots, then cut him down.",
        enter: { weakPoints: [{ name: "Rot Taproot", pos: P(2, 2), hpPct: 0.12 }, { name: "Rot Taproot", pos: P(6, 2), hpPct: 0.12 }], enrageIn: 3, enrageAmount: 3 },
        every: 2,
        cycle: [
          { kind: "terrain", label: "Rot Bloom", to: "poison", target: "players", shape: "cross", max: 2 },
          { kind: "quake", label: "Uprooting", target: "column", amount: 8 },
        ] },
    ],
  },
}

// Each mini-boss fight is also a formation (formations.js): the boss in
// the middle, its chapter's escorts on either side.
export const CAMPAIGN_BOSS_FORMATIONS = Object.fromEntries(
  Object.entries(CAMPAIGN_BOSS_FIGHTS).map(([id, f]) => [
    id,
    {
      id,
      name: `${f.name}, ${f.title}`,
      description: `${f.name} and the foes who serve it.`,
      campaign: true,
      pieces: f.enemyDefIds.map((defId, i) => ({ defId, pos: { row: 0, col: i } })),
      playerStart: { row: 2, col: 1 },
    },
  ]),
)

export const CAMPAIGN_BOSS_IDS = Object.keys(CAMPAIGN_BOSS_FIGHTS)
export const bossIdForChapter = (chapter) => CAMPAIGN_BOSS_IDS.find((id) => CAMPAIGN_BOSS_FIGHTS[id].chapter === chapter) || null
