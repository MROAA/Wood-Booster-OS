// Hearthwood - the forest's creatures (First Song PRD §6, NAR-04:
// "creatures react to the environment and to what the player does").
// Hearthwood's own fictional creatures, inspired by - not copied from -
// Finnish / Nordic folklore (forest guardians, water spirits, shapeshifters).
//
// FOREST REGARD - how the forest sees you, -100..100, starts at 0. The
// forest remembers how you treat it:
//   a fight where no tree fell  +3      each tree that fell   -2 (max -10)
//   carving Growth              +5      carving Break         -5
//   a "purified" crossroads    +15      a "corrupted" one    -15
//   some events (the Water-Rememberer...)
// Rules: services/heartwood/forestRegard.js. Fight side: tacticsCreatures.js.
//
// The creatures:
//   Forest Wardens   - Regard >= +25: one fights BESIDE you. <= -25: one
//                      fights AGAINST you. In between they only watch.
//   Shapeshifters    - from Act II, some fights hide one among the trees.
//                      It looks like a tree - but trees don't move. It
//                      steps toward your squad each enemy turn and bursts
//                      out when it reaches a hero or is struck.
//   Water-Rememberers - an event (events.js "the-rememberer"): trade a
//                      memory for something.
// (Root-Eaters: next round.)

export const REGARD_MIN = -100
export const REGARD_MAX = 100

export const REGARD = {
  cleanFight: 3,
  perTreeLost: -2,
  maxTreeLoss: -10,
  carve: { growth: 5, break: -5 },
  crossroads: { purified: 15, corrupted: -15 },
}

// Bands, lowest first: the first whose `upTo` >= regard wins.
export const REGARD_BANDS = [
  { id: "hostile", upTo: -50, name: "Hostile", text: "The forest wants you gone. Its Wardens fight against you.", color: "#d0614a" },
  { id: "wary", upTo: -25, name: "Wary", text: "The forest remembers what you broke. A Warden stands against you.", color: "#d79a5a" },
  { id: "watching", upTo: 24, name: "Watching", text: "The forest is watching how you treat it. Its Wardens only watch.", color: "#a8a089" },
  { id: "friendly", upTo: 49, name: "Friendly", text: "The forest trusts you. A Warden fights beside you.", color: "#8fbf6a" },
  { id: "kin", upTo: 100, name: "Kin", text: "The forest counts you as its own. A Warden fights beside you.", color: "#6fcf8a" },
]

export const WARDEN_THRESHOLD = 25

export const CREATURES = {
  wardenAlly: {
    id: "warden-ally",
    unit: "stonemoot-sentinel",
    name: "Forest Warden",
    tag: "Warden",
    title: "The forest sent one of its Wardens to stand with you",
  },
  wardenFoe: {
    id: "warden-foe",
    enemy: "rootward",
    name: "Wrathful Warden",
    tag: "Warden",
    title: "The forest remembers what you broke",
  },
  shapeshifter: {
    id: "shapeshifter",
    enemy: "mossback-lurker",
    name: "Shapeshifter",
    fromAct: 2,
    chance: 0.35,
    hint: "One of these trees is not a tree. Trees don't move - watch which one does.",
    reveal: "It was never a tree!",
  },
}

export function regardBand(regard = 0) {
  const r = Number(regard) || 0
  return REGARD_BANDS.find((b) => r <= b.upTo) || REGARD_BANDS[REGARD_BANDS.length - 1]
}
