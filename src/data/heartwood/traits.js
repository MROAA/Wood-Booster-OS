// Hearthwood - HERO TRAITS (Mewgenics-style inheritable genes).
// Every recruit rolls 1-2 small personality quirks when it joins. They
// work in every tactics fight, show as chips on the hero's card, and are
// passed on at the Hearth's Nest (each parent trait 50%, plus a rare new
// one). Some come only from strange events (weight 0).
// Pure data - Studio-editable (Hearthwood Studio > 🧬 Traits).
// The rules live in services/heartwood/traits.js.
//
// Trait fields:
//   name / icon / text - what the player sees (`text` = plain English)
//   kind   - "good" | "mixed" | "bad" (chip colour)
//   weight - how common it is when a recruit rolls (0 = events only)
//   fx     - fight-start numbers, the SAME keys as mutations.js `fx`
//            (hp, attack, move, apStart, ward, evade, aim, thorns, regen,
//            block, leech, fireOnHit, manaMax, manaRegen, manaStartPct...)
//   mods   - conditional bonuses read every hit (all optional):
//            when: "always" | "hpAbove50" | "hpBelow50" | "still" (hasn't
//                  moved this turn) | "res75" (resource 75%+ full) |
//                  "resBelow25"
//            dmg (+damage per hit), aim (+% to hit), heal (+healing),
//            guard (takes N less per hit), taken (takes N more per hit),
//            cheaper (% cheaper skills), skillPct (+% skill damage)
//   extra  - run-level effects: essenceOnWin (Essence after a won fight
//            it survives), xpBonus (XP after a won fight), stubborn (can't
//            be knocked back), clumsy (+1 knockback impact taken)

export const MAX_TRAITS = 3

export const TRAIT_KINDS = {
  good: { name: "Good", color: "#8fd18b" },
  mixed: { name: "Mixed", color: "#e0b85a" },
  bad: { name: "Bad", color: "#e07a6a" },
}

export const TRAITS = {
  brave: { id: "brave", name: "Brave", icon: "🦁", kind: "good", weight: 3, text: "Charges in with a grin. +1 damage while above half HP.", mods: { when: "hpAbove50", dmg: 1 } },
  veteran: { id: "veteran", name: "Veteran", icon: "🎖", kind: "good", weight: 2, text: "Has seen worse. Takes 1 less damage per hit while below half HP.", mods: { when: "hpBelow50", guard: 1 } },
  lucky: { id: "lucky", name: "Lucky", icon: "🍀", kind: "good", weight: 2, text: "Things just go its way. Dodges the first hit of each fight.", fx: { evade: 1 } },
  calm: { id: "calm", name: "Calm", icon: "🍵", kind: "good", weight: 3, text: "Breathes, then strikes. +10% to hit while it hasn't moved this turn.", mods: { when: "still", aim: 10 } },
  "early-bird": { id: "early-bird", name: "Early Bird", icon: "🐦", kind: "good", weight: 2, text: "First up, every morning. +1 AP on the first turn of each fight.", fx: { apStart: 1 } },
  "mana-touched": { id: "mana-touched", name: "Mana-touched", icon: "✨", kind: "good", weight: 2, text: "Faintly glows in the dark. +15 max resource.", fx: { manaMax: 15 } },
  hoarder: { id: "hoarder", name: "Hoarder", icon: "🐿", kind: "good", weight: 2, text: "Always saves a little for later. Starts each fight with +25% of its resource.", fx: { manaStartPct: 25 } },
  thrifty: { id: "thrifty", name: "Thrifty", icon: "🪙", kind: "good", weight: 2, text: "Never wastes a drop. Its skills cost 10% less resource.", mods: { when: "always", cheaper: 10 } },
  zealous: { id: "zealous", name: "Zealous", icon: "🔆", kind: "good", weight: 2, text: "Burns brightest when full. +2 damage while its resource is 75% full or more.", mods: { when: "res75", dmg: 2 } },
  spiteful: { id: "spiteful", name: "Spiteful", icon: "😠", kind: "mixed", weight: 2, text: "Holds grudges for exactly one second. Strikes back for 1 when hit, -1 max HP.", fx: { thorns: 1, hp: -1 } },
  "hot-headed": { id: "hot-headed", name: "Hot-headed", icon: "🌶", kind: "mixed", weight: 3, text: "Swings first, aims later. +2 attack, -10% to hit.", fx: { attack: 2, aim: -10 } },
  greedy: { id: "greedy", name: "Greedy", icon: "💰", kind: "mixed", weight: 2, text: "Pockets everything shiny. +2 Essence after every won fight it survives, -5% to hit (distracted).", fx: { aim: -5 }, extra: { essenceOnWin: 2 } },
  bookish: { id: "bookish", name: "Bookish", icon: "📚", kind: "mixed", weight: 2, text: "Reads during battles. +2 XP after every won fight, -1 max HP.", fx: { hp: -1 }, extra: { xpBonus: 2 } },
  "night-owl": { id: "night-owl", name: "Night Owl", icon: "🦉", kind: "mixed", weight: 2, text: "Wide awake when it matters. +5 resource each turn, -5% to hit.", fx: { manaRegen: 5, aim: -5 } },
  stubborn: { id: "stubborn", name: "Stubborn", icon: "🪨", kind: "mixed", weight: 2, text: "Will not be moved. Can't be knocked back, -1 movement.", fx: { move: -1 }, extra: { stubborn: true } },
  glutton: { id: "glutton", name: "Glutton", icon: "🍖", kind: "mixed", weight: 2, text: "Snacks mid-fight. Heals 1 on every landed hit, -1 movement.", fx: { leech: 1, move: -1 } },
  brimful: { id: "brimful", name: "Brimful", icon: "🌊", kind: "mixed", weight: 2, text: "A deep well that fills slowly. +20 max resource, but starts each fight 25% emptier.", fx: { manaMax: 20, manaStartPct: -25 } },
  pyromaniac: { id: "pyromaniac", name: "Pyromaniac", icon: "🔥", kind: "mixed", weight: 1, text: "Loves the smell of smoke. Landed hits add 1 Burn, -2 max HP.", fx: { fireOnHit: 1, hp: -2 } },
  fragile: { id: "fragile", name: "Fragile", icon: "🥚", kind: "bad", weight: 2, text: "Bruises like a peach. -3 max HP.", fx: { hp: -3 } },
  clumsy: { id: "clumsy", name: "Clumsy", icon: "🍌", kind: "bad", weight: 2, text: "Trips over its own feet. -5% to hit, and takes +1 extra damage when knocked into something.", fx: { aim: -5 }, extra: { clumsy: true } },
  lazy: { id: "lazy", name: "Lazy", icon: "😴", kind: "bad", weight: 2, text: "Would rather nap. -1 movement, but mends 1 HP each turn.", fx: { move: -1, regen: 1 } },
  // --- events only (weight 0) -------------------------------------------------
  lovestruck: { id: "lovestruck", name: "Lovestruck", icon: "💘", kind: "mixed", weight: 0, text: "Head over heels. +2 Block at the start of each turn (showing off), -10% to hit (staring).", fx: { block: 2, aim: -10 } },
  hexed: { id: "hexed", name: "Hexed", icon: "🕯", kind: "bad", weight: 0, text: "Something follows it around. Takes 1 more damage from every hit.", mods: { when: "always", taken: 1 } },
  "mushroom-friend": { id: "mushroom-friend", name: "Mushroom Friend", icon: "🍄", kind: "good", weight: 0, text: "A tiny mushroom rides on its shoulder and gives advice. +10% to hit, mends 1 HP each turn.", fx: { aim: 10, regen: 1 } },
}

export const TRAIT_IDS = Object.keys(TRAITS)

// How traits are rolled / passed on (services/heartwood/traits.js).
export const TRAIT_ODDS = {
  second: 0.35, // a recruit rolls a 2nd trait with this chance
  inherit: 0.5, // each parent trait passes to the hatchling with this chance
  fresh: 0.15, // a brand-new random trait at birth
}

export function traitById(id) {
  return TRAITS[id] || null
}
