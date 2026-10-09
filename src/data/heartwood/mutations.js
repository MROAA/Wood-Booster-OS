// Hearthwood - MUTATIONS (Mewgenics-style). Weird, visible, permanent
// quirks a hero carries for life: some good, some mixed, some bad.
// Pure data - Studio-editable (Hearthwood Studio > 🧬 Mutations).
// The rules live in services/heartwood/mutations.js (pure) and
// services/heartwood/tacticsMutations.js (the in-fight hooks).
//
// As a player reads it:
// - A hero can carry up to MAX_MUTATIONS mutations.
// - They are gained rarely after fights (surviving a Corrupted fight,
//   ending a fight on Blight, killing an elite/boss), from a few strange
//   events, and from breeding at the Hearth's Nest (inheritance).
// - They work in every tactics fight, and show as badges on the hero's
//   card and battle token.
//
// Mutation fields:
//   name / icon / text - what the player sees (`text` = plain English)
//   kind   - "good" | "mixed" | "bad" (badge colour + which rolls can give it)
//   weight - how common it is when rolled (0 = never rolled randomly)
//   fx     - the numbers (all optional; several can stack):
//     hp          +/- max HP                hpPct     +/- % of max HP
//     attack      +/- attack                move      +/- movement
//     range       +/- range (ranged heroes only)
//     apStart     +/- AP on the first turn of each fight
//     ward        Ward stacks at fight start (blocks a whole hit each)
//     evade       Evade stacks at fight start (dodges a hit each)
//     aim         +/- % to hit
//     thorns      strikes back for N when hit
//     regen       mends N HP at the start of each own turn
//     block       gains N Block at the start of each own turn
//     fireOnHit / frostOnHit / poisonOnHit / natureOnHit
//                 landed hits add that element to the target (Burn /
//                 Chill / Poison / Entangle) - sets off element combos
//     leech       heals N on every landed hit
//     manaMax     +/- max resource (written for a 100-ish bar; small
//                 pools like Combo pips get it scaled down)
//     manaRegen   +/- resource refilled each own turn
//     manaStartPct  starts each fight with +N% of max resource
//     gills       +N resource at turn start when next to water, on a
//                 bridge or on ice
//     echo        its first skill each fight refunds N AP

export const MAX_MUTATIONS = 3

export const MUTATION_KINDS = {
  good: { name: "Good", color: "#8fd18b" },
  mixed: { name: "Mixed", color: "#e0b85a" },
  bad: { name: "Bad", color: "#e07a6a" },
}

export const MUTATIONS = {
  // --- good ---------------------------------------------------------------
  "extra-eye": { id: "extra-eye", name: "Extra Eye", icon: "👁", kind: "good", weight: 3, text: "A third eye blinks open on its brow. +10% to hit.", fx: { aim: 10 } },
  "thorny-back": { id: "thorny-back", name: "Thorny Back", icon: "🌵", kind: "good", weight: 3, text: "Spines along its spine. Strikes back for 2 when hit.", fx: { thorns: 2 } },
  "split-tail": { id: "split-tail", name: "Split Tail", icon: "〰", kind: "good", weight: 3, text: "Two tails, twice the balance. +1 movement.", fx: { move: 1 } },
  "mossy-hide": { id: "mossy-hide", name: "Mossy Hide", icon: "🌿", kind: "good", weight: 3, text: "Moss grows in its fur and keeps it patched up. Mends 1 HP each turn.", fx: { regen: 1 } },
  "third-arm": { id: "third-arm", name: "Third Arm", icon: "🦾", kind: "good", weight: 2, text: "An extra arm, mostly for waving. +1 AP on the first turn of each fight.", fx: { apStart: 1 } },
  "mana-gills": { id: "mana-gills", name: "Mana Gills", icon: "🐟", kind: "good", weight: 2, text: "Gills that breathe magic out of wet air. +10 resource each turn next to water, on a bridge or on ice.", fx: { gills: 10 } },
  "echo-voice": { id: "echo-voice", name: "Echo Voice", icon: "🔊", kind: "good", weight: 2, text: "Everything it says, it says twice. Its first skill each fight refunds 1 AP.", fx: { echo: 1 } },
  "bottomless-belly": { id: "bottomless-belly", name: "Bottomless Belly", icon: "🫙", kind: "good", weight: 2, text: "It stores power somewhere nobody wants to ask about. +15 max resource.", fx: { manaMax: 15 } },
  "bark-skin": { id: "bark-skin", name: "Bark Skin", icon: "🪵", kind: "good", weight: 3, text: "Its skin has gone woody. +4 max HP.", fx: { hp: 4 } },
  "ember-blood": { id: "ember-blood", name: "Ember Blood", icon: "🔥", kind: "good", weight: 2, text: "Its blood smoulders. Landed hits set the target Burning (+1 Burn).", fx: { fireOnHit: 1 } },
  "frost-fangs": { id: "frost-fangs", name: "Frost Fangs", icon: "❄", kind: "good", weight: 2, text: "Teeth like icicles. Landed hits add 1 Chill (2 Chill = Frozen).", fx: { frostOnHit: 1 } },
  "moth-wings": { id: "moth-wings", name: "Moth Wings", icon: "🦋", kind: "good", weight: 2, text: "Dusty little wings flutter at the worst moment for enemies. Dodges the first hit of each fight.", fx: { evade: 1 } },
  "lucky-whisker": { id: "lucky-whisker", name: "Lucky Whisker", icon: "🍀", kind: "good", weight: 2, text: "One whisker glows faintly green. Starts each fight with 1 Ward.", fx: { ward: 1 } },
  "storm-heart": { id: "storm-heart", name: "Storm Heart", icon: "⚡", kind: "good", weight: 2, text: "Its heart crackles. Starts each fight with +25% of its resource.", fx: { manaStartPct: 25 } },
  // --- mixed --------------------------------------------------------------
  "glass-bones": { id: "glass-bones", name: "Glass Bones", icon: "🦴", kind: "mixed", weight: 2, text: "Light, sharp and fragile. -20% max HP, +2 attack.", fx: { hpPct: -20, attack: 2 } },
  "hollow-heart": { id: "hollow-heart", name: "Hollow Heart", icon: "🕳", kind: "mixed", weight: 2, text: "There's an echo where its heart should be. +4 resource each turn, -3 max HP.", fx: { manaRegen: 4, hp: -3 } },
  "venom-spit": { id: "venom-spit", name: "Venom Spit", icon: "☠", kind: "mixed", weight: 2, text: "It drools something green. Landed hits Poison (+1), but -1 attack.", fx: { poisonOnHit: 1, attack: -1 } },
  "long-neck": { id: "long-neck", name: "Long Neck", icon: "🦒", kind: "mixed", weight: 2, text: "It sees far and trips often. +1 range for ranged heroes, -1 movement.", fx: { range: 1, move: -1 } },
  "leech-tongue": { id: "leech-tongue", name: "Leech Tongue", icon: "👅", kind: "mixed", weight: 2, text: "Don't ask. Heals 1 on every landed hit, -2 max HP.", fx: { leech: 1, hp: -2 } },
  "vine-fingers": { id: "vine-fingers", name: "Vine Fingers", icon: "🌱", kind: "mixed", weight: 2, text: "Its fingers keep sprouting. Landed hits Entangle the target, -5% to hit.", fx: { natureOnHit: 1, aim: -5 } },
  "shell-back": { id: "shell-back", name: "Shell Back", icon: "🐚", kind: "mixed", weight: 2, text: "A heavy shell. +2 Block each turn, -1 movement.", fx: { block: 2, move: -1 } },
  // --- bad ----------------------------------------------------------------
  "wobbly-legs": { id: "wobbly-legs", name: "Wobbly Legs", icon: "🦵", kind: "bad", weight: 3, text: "Its knees bend both ways. -1 movement.", fx: { move: -1 } },
  "cloudy-eye": { id: "cloudy-eye", name: "Cloudy Eye", icon: "🌫", kind: "bad", weight: 3, text: "One eye has gone milky. -10% to hit.", fx: { aim: -10 } },
  "leaky-pores": { id: "leaky-pores", name: "Leaky Pores", icon: "💦", kind: "bad", weight: 2, text: "Power drips out of it. -10 max resource, -2 resource each turn.", fx: { manaMax: -10, manaRegen: -2 } },
  "soft-teeth": { id: "soft-teeth", name: "Soft Teeth", icon: "🦷", kind: "bad", weight: 3, text: "Its teeth wobble. -1 attack.", fx: { attack: -1 } },
  "sickly": { id: "sickly", name: "Sickly", icon: "🤢", kind: "bad", weight: 3, text: "Always a little green. -4 max HP.", fx: { hp: -4 } },
  "stage-fright": { id: "stage-fright", name: "Stage Fright", icon: "😰", kind: "bad", weight: 2, text: "Freezes up when the fight starts. -1 AP on the first turn.", fx: { apStart: -1 } },
}

export const MUTATION_IDS = Object.keys(MUTATIONS)

// How mutations are gained during a run (services/heartwood/mutations.js
// rollFightMutations). Chances are per surviving deployed hero per won
// fight; a hero gains at most one per fight.
export const MUTATION_ODDS = {
  base: 0.03, // any won fight
  corrupted: 0.25, // won a fight against the Corrupted
  blight: 0.25, // extra, when it ends the fight standing on Blight
  bigKill: 0.3, // it landed a kill in an elite / miniboss / boss fight (good only)
}

// Breeding at the Nest (services/heartwood/hearth.js breedHeroes).
export const BREEDING = {
  inheritChance: 0.4, // each parent mutation passes on with this chance
  freshChance: 0.1, // a brand-new random mutation
  badBase: 0.05, // a bad mutation, even between strangers
  badPerKin: 0.7, // + this x kinship (siblings / parent+child = 0.5 -> +35%)
  crossClassChance: 0.15, // takes the OTHER parent's class
  affinityMax: 10, // resource affinity: +max resource
  affinityRegen: 3, // ...or +resource each turn
}

export function mutationById(id) {
  return MUTATIONS[id] || null
}
