// Heartwood Trial - card definitions.
//
// Card names are the 22 Tarot Major Arcana (see the approved plan for the
// full design rationale). Nature/glossary words like "Heartwood" stay as
// world-level lore naming only, not card names.
//
// Every card is plain data built from the small effect-primitive
// vocabulary in ../../services/heartwood/effects.js - adding a new card is
// "add an object here", never new engine code.

export const CARDS = {
  "the-fool": {
    id: "the-fool",
    name: "The Fool",
    type: "skill",
    cost: 0,
    art: "the-fool",
    description: "Draw 1 card.",
    flavor: "A leap into the unknown, unburdened by what came before.",
    effects: [{ type: "draw", amount: 1 }],
  },
  "the-magician": {
    id: "the-magician",
    name: "The Magician",
    type: "skill",
    cost: 1,
    art: "the-magician",
    description: "Gain 4 Block. Deal 3 damage.",
    flavor: "Will made manifest - a little of everything, shaped by intent.",
    effects: [
      { type: "block", amount: 4 },
      { type: "damage", amount: 3 },
    ],
  },
  "the-high-priestess": {
    id: "the-high-priestess",
    name: "The High Priestess",
    type: "skill",
    cost: 1,
    art: "the-high-priestess",
    description: "Draw 2 cards.",
    flavor: "What is hidden becomes known, if only for a moment.",
    effects: [{ type: "draw", amount: 2 }],
  },
  "the-empress": {
    id: "the-empress",
    name: "The Empress",
    type: "skill",
    cost: 2,
    art: "the-empress",
    description: "Heal 5. Gain 5 Block.",
    flavor: "Abundance shared is abundance doubled.",
    effects: [
      { type: "heal", amount: 5 },
      { type: "block", amount: 5 },
    ],
  },
  "the-emperor": {
    id: "the-emperor",
    name: "The Emperor",
    type: "power",
    cost: 2,
    art: "the-emperor",
    description: "Power. At the start of each of your turns, gain 5 Block.",
    flavor: "Order commands the day; the guard is raised before it is needed.",
    effects: [
      {
        type: "addTrigger",
        trigger: "turnStart",
        effect: { type: "block", amount: 5 },
      },
    ],
  },
  "the-hierophant": {
    id: "the-hierophant",
    name: "The Hierophant",
    type: "power",
    cost: 1,
    art: "the-hierophant",
    description: "Power. Gain 1 Strength permanently.",
    flavor: "A technique passed down strikes truer than one learned alone.",
    effects: [{ type: "applyBuff", id: "strength", amount: 1 }],
  },
  "the-lovers": {
    id: "the-lovers",
    name: "The Lovers",
    type: "attack",
    cost: 1,
    art: "the-lovers",
    description: "Deal 3 damage twice.",
    flavor: "Two struck as one - a union that cannot be split.",
    effects: [
      { type: "damage", amount: 3 },
      { type: "damage", amount: 3 },
    ],
  },
  "the-chariot": {
    id: "the-chariot",
    name: "The Chariot",
    type: "attack",
    cost: 2,
    costReducedIfBlocked: 1,
    art: "the-chariot",
    description: "Deal 14 damage. Costs 1 less if you have Block.",
    flavor: "Guard becomes momentum; momentum becomes force.",
    effects: [{ type: "damage", amount: 14 }],
  },
  strength: {
    id: "strength",
    name: "Strength",
    type: "power",
    cost: 1,
    art: "strength",
    description: "Power. Gain 2 Strength permanently.",
    flavor: "Not given - grown, one trial at a time.",
    effects: [{ type: "applyBuff", id: "strength", amount: 2 }],
  },
  "the-hermit": {
    id: "the-hermit",
    name: "The Hermit",
    type: "skill",
    cost: 1,
    art: "the-hermit",
    description: "Exhaust. Draw 3 cards.",
    flavor: "Withdraw from the noise, and the shape of things becomes clear.",
    exhaust: true,
    effects: [{ type: "draw", amount: 3 }],
  },
  "wheel-of-fortune": {
    id: "wheel-of-fortune",
    name: "Wheel of Fortune",
    type: "skill",
    cost: 1,
    art: "wheel-of-fortune",
    description: "Randomly deal 10 damage or gain 10 Block.",
    flavor: "Order and chaos, spinning on the same axle.",
    effects: [
      {
        type: "random",
        options: [
          [{ type: "damage", amount: 10 }],
          [{ type: "block", amount: 10 }],
        ],
      },
    ],
  },
  justice: {
    id: "justice",
    name: "Justice",
    type: "skill",
    cost: 1,
    art: "justice",
    description: "Gain 7 Block.",
    flavor: "Balance restored, in equal and opposite measure.",
    effects: [{ type: "block", amount: 7 }],
  },
  "the-hanged-man": {
    id: "the-hanged-man",
    name: "The Hanged Man",
    type: "skill",
    cost: 0,
    art: "the-hanged-man",
    description: "Lose 5 HP. Gain 2 Energy. Draw 1 card.",
    flavor: "Surrender what you were holding, and see what was underneath.",
    effects: [
      { type: "loseHp", amount: 5 },
      { type: "gainEnergy", amount: 2 },
      { type: "draw", amount: 1 },
    ],
  },
  death: {
    id: "death",
    name: "Death",
    type: "skill",
    cost: 1,
    art: "death",
    description: "Exhaust. Draw 2 cards.",
    flavor: "Something ends here, so that something else can begin.",
    exhaust: true,
    effects: [{ type: "draw", amount: 2 }],
  },
  temperance: {
    id: "temperance",
    name: "Temperance",
    type: "power",
    cost: 1,
    art: "temperance",
    description: "Power. At the end of each of your turns, gain 3 Block.",
    flavor: "Neither too much nor too little - a steady hand against the storm.",
    effects: [
      {
        type: "addTrigger",
        trigger: "turnEnd",
        effect: { type: "block", amount: 3 },
      },
    ],
  },
  "the-devil": {
    id: "the-devil",
    name: "The Devil",
    type: "attack",
    cost: 1,
    art: "the-devil",
    description: "Deal 16 damage. Lose 4 HP.",
    flavor: "Spacemonkey's other face grins back, and the price is always paid later.",
    effects: [
      { type: "damage", amount: 16 },
      { type: "loseHp", amount: 4 },
    ],
  },
  "the-tower": {
    id: "the-tower",
    name: "The Tower",
    type: "attack",
    cost: 2,
    art: "the-tower",
    description: "Deal 18 damage. Lose 5 HP. Add an Entropy card to your discard pile.",
    flavor: "What stood suddenly does not. Nothing that falls, falls alone.",
    effects: [
      { type: "damage", amount: 18 },
      { type: "loseHp", amount: 5 },
      { type: "addCard", defId: "entropy", pile: "discardPile" },
    ],
  },
  "the-star": {
    id: "the-star",
    name: "The Star",
    type: "power",
    cost: 1,
    art: "the-star",
    description: "Power. At the end of each of your turns, heal 3.",
    flavor: "Even in the dark, something keeps burning quietly overhead.",
    effects: [
      {
        type: "addTrigger",
        trigger: "turnEnd",
        effect: { type: "heal", amount: 3 },
      },
    ],
  },
  "the-moon": {
    id: "the-moon",
    name: "The Moon",
    type: "skill",
    cost: 1,
    art: "the-moon",
    description: "Draw 2 cards. Gain 4 Block.",
    flavor: "Nothing is quite what it seems by this light - which is its own kind of shelter.",
    effects: [
      { type: "draw", amount: 2 },
      { type: "block", amount: 4 },
    ],
  },
  "the-sun": {
    id: "the-sun",
    name: "The Sun",
    type: "attack",
    cost: 2,
    art: "the-sun",
    description: "Deal 16 damage.",
    flavor: "Clarity, undisguised. Nothing left to hide behind.",
    effects: [{ type: "damage", amount: 16 }],
  },
  judgement: {
    id: "judgement",
    name: "Judgement",
    type: "skill",
    cost: 1,
    art: "judgement",
    description: "Draw 2 cards.",
    flavor: "A second look, and a second chance.",
    effects: [{ type: "draw", amount: 2 }],
  },
  "the-world": {
    id: "the-world",
    name: "The World",
    type: "attack",
    cost: 3,
    art: "the-world",
    description: "Exhaust. Once per battle. Deal 24 damage.",
    flavor: "The arc completes itself.",
    exhaust: true,
    once: true,
    effects: [{ type: "damage", amount: 24 }],
  },

  // Grid-tactics cards - not part of the 22 Arcana, chess-pattern
  // targeting on the battle grid. See src/services/heartwood/targeting.js.
  "knights-leap": {
    id: "knights-leap",
    name: "Knight's Leap",
    type: "attack",
    cost: 2,
    art: "spark",
    description: "Deal 12 damage to a piece an L-move away. Ignores shielding.",
    flavor: "A real knight jumps what stands in the way.",
    pattern: "knight",
    patternSelect: "one",
    effects: [{ type: "damage", amount: 12, pattern: "knight", patternSelect: "one" }],
  },
  "rooks-charge": {
    id: "rooks-charge",
    name: "Rook's Charge",
    type: "attack",
    cost: 2,
    art: "spark",
    description: "Deal 6 damage to every piece in your row.",
    flavor: "A straight line, and nothing left standing in it.",
    pattern: "rook",
    effects: [{ type: "damage", amount: 6, pattern: "rook" }],
  },
  "bishops-slash": {
    id: "bishops-slash",
    name: "Bishop's Slash",
    type: "attack",
    cost: 2,
    art: "spark",
    description: "Deal 5 damage to every piece on your diagonals.",
    flavor: "The cut finds everything standing at an angle.",
    pattern: "bishop",
    effects: [{ type: "damage", amount: 5, pattern: "bishop" }],
  },
  zugzwang: {
    id: "zugzwang",
    name: "Zugzwang",
    type: "skill",
    cost: 1,
    art: "moonGlyph",
    description: "Choose a piece: it can't Guard on its next turn.",
    flavor: "Every option left to it is a bad one.",
    effects: [{ type: "applyBuff", target: "target", id: "zugzwang", amount: 1 }],
  },
  castling: {
    id: "castling",
    name: "Castling",
    type: "skill",
    cost: 1,
    art: "root",
    description: "Return to your home square. Gain 6 Block.",
    flavor: "Retreat behind the wall you built for this.",
    effects: [
      { type: "move", target: "self", pos: { row: 2, col: 1 } },
      { type: "block", amount: 6 },
    ],
  },

  // Curse cards - unplayable, enter the deck via enemy effects, exist to
  // clog the hand/draw pile rather than do anything useful when played.
  sawdust: {
    id: "sawdust",
    name: "Sawdust",
    type: "curse",
    cost: 1,
    art: "root",
    description: "Unplayable.",
    flavor: "Clutters the hand. Does nothing else.",
    unplayable: true,
    effects: [],
  },
  rot: {
    id: "rot",
    name: "Rot",
    type: "curse",
    cost: 1,
    art: "root",
    description: "Unplayable. When drawn, lose 2 HP.",
    flavor: "Some things spread the moment you touch them.",
    unplayable: true,
    effects: [],
    onDraw: [{ type: "loseHp", amount: 2 }],
  },

  // Entropy - not part of the 22 Arcana, not in any starting deck. Enters
  // play only through a chaotic in-battle event (currently: The Tower).
  entropy: {
    id: "entropy",
    name: "Entropy",
    type: "special",
    cost: 0,
    art: "entropy",
    description: "Randomly deal 20 damage, or lose 10 HP.",
    flavor: "Collapse the wave. See what was underneath.",
    effects: [
      {
        type: "random",
        options: [
          [{ type: "damage", amount: 20 }],
          [{ type: "loseHp", amount: 10 }],
        ],
      },
    ],
  },
}

// Curated MVP starter deck - a subset of the Arcana above, not all 22.
// Each Arcana card in the deck is distinct - no duplicates, matching
// the Tarot conceit (there is only one Fool). The rest of the Arcana
// exist as ready-to-use data for the post-MVP expansion.
//
// Rook's Charge and Bishop's Slash are included deliberately, not just
// left in the grid-tactics test deck: without a pattern card in the
// real deck, the free Move action has no payoff in a solo fight (one
// enemy, no reason to reposition). With them, moving one square off
// the start square lines up a row/diagonal strike even against a lone
// enemy - verified directly against the grid math, not just assumed.
export const STARTER_DECK = [
  "the-fool",
  "strength",
  "the-magician",
  "the-high-priestess",
  "the-empress",
  "the-hermit",
  "the-lovers",
  "the-chariot",
  "the-devil",
  "the-emperor",
  "judgement",
  "wheel-of-fortune",
  "rooks-charge",
  "bishops-slash",
]
