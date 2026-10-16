// Hearthwood Frontier - MANA SPRINT 3 data (Mana PRD: "mana colours",
// "overload / risk", "environmental resources", "enemies that feed").
//
//  1. MANA COLOURS. Mana comes in four colours - Ember, Tide, Root, Void.
//     Every hero has an AFFINITY (its class), every skill carries a colour
//     (its class's affinity unless the skill names its own), and casting
//     two DIFFERENT colours in the same turn (one hero or two) sets off a
//     COLOUR COMBO spell. The four colours make exactly six pairs.
//  2. OVERCHANNEL. Cast without enough mana: pay the missing part in HP
//     and fill a BACKLASH meter. Full meter = the hero is stunned (and
//     hurt) at the start of its next turn. No hidden rolls.
//  3. MANA-FED ENEMIES. Some enemy families (and the Gorging Maw boss)
//     feed on mana spent near them: every hero cast within reach adds a
//     Hunger stack (+attack); mana burn removes stacks.
// Pure data - the rules live in services/heartwood/tacticsManaColours.js
// and tacticsManaFeed.js. Elements map onto colours: fire = Ember,
// frost = Tide, nature = Root, poison = Void.

export const COLOUR_IDS = ["ember", "tide", "root", "void"]

export const MANA_COLOURS = {
  ember: { id: "ember", name: "Ember", icon: "🔥", color: "#e0773a", element: "fire", word: "fire and fury", finisher: "Combos it finishes hit 2 harder." },
  tide: { id: "tide", name: "Tide", icon: "🌊", color: "#4f9fd6", element: "frost", word: "water, frost and healing", finisher: "Combos it finishes heal it for 3." },
  root: { id: "root", name: "Root", icon: "🌿", color: "#6fae4c", element: "nature", word: "earth, growth and guarding", finisher: "Combos it finishes give it +3 Block." },
  void: { id: "void", name: "Void", icon: "🌑", color: "#9a6ad0", element: "poison", word: "shadow, curses and drain", finisher: "Backlash builds 40% slower; combos it finishes give it +5 of its resource." },
}

// Class affinity (classes.js ids). 38 classes, roughly even.
export const CLASS_AFFINITY = {
  // Ember - aggression, fire, burst.
  juggernaut: "ember",
  bruiser: "ember",
  striker: "ember",
  executioner: "ember",
  spellblade: "ember",
  artillery: "ember",
  saboteur: "ember",
  buffer: "ember",
  alchemist: "ember",
  // Tide - flow, frost, healing, time.
  medic: "tide",
  frostbinder: "tide",
  chronomancer: "tide",
  cleanser: "tide",
  duelist: "tide",
  ranger: "tide",
  commander: "tide",
  merchant: "tide",
  spiritwalker: "tide",
  // Root - earth, growth, guarding.
  guardian: "root",
  warden: "root",
  sentinel: "root",
  healer: "root",
  rootweaver: "root",
  beastmaster: "root",
  shapeshifter: "root",
  gatherer: "root",
  engineer: "root",
  trapper: "root",
  scout: "root",
  // Void - shadow, curses, drain.
  assassin: "void",
  controller: "void",
  disruptor: "void",
  hexer: "void",
  summoner: "void",
  ritualist: "void",
  corruptor: "void",
  "relic-keeper": "void",
  tactician: "void",
}

// Class-less units (the prototype roster, enemies) fall back on battle role.
export const ROLE_AFFINITY = { tank: "root", dps: "ember", healer: "tide", support: "tide", control: "void" }

// Skills that carry a colour OTHER than their class's affinity - so most
// heroes hold two colours and can set off a combo on their own.
export const SKILL_COLOURS = {
  provoke: "ember",
  "ground-breaker": "root",
  "arcane-dash": "void",
  "arcane-lance": "void",
  "group-renewal": "tide",
  "emergency-stim": "ember",
  challenge: "ember",
  "hunters-mark": "void",
  "focus-target": "ember",
  "formation-shift": "tide",
  pull: "tide",
  dispel: "tide",
  "static-disruption": "ember",
  "smoke-screen": "void",
  "poison-flask": "void",
  transmute: "void",
  "smoke-bomb": "void",
  "deploy-turret": "ember",
  "spirit-step": "void",
  "slow-time": "void",
  "predator-form": "ember",
  "purifying-light": "ember",
  "mark-threat": "void",
  "swarm-command": "ember",
  hunt: "ember",
  "sacrificial-summon": "ember",
  "spirit-offering": "tide",
  appraise: "void",
  scavenge: "void",
  "relic-transfer": "tide",
  "thorn-boundary": "ember",
  "mark-intruder": "void",
  "shoulder-check": "root",
  "exploit-opening": "void",
  vanish: "tide",
  leap: "void",
  empower: "tide",
  "frozen-ground": "root",
  "vine-bridge": "tide",
  frenzy: "ember",
  "root-form": "root",
  "beast-form": "root",
  "begin-ritual": "void",
  "complete-ritual": "void",
}

// Signature abilities (no class skill) by kind.
export const KIND_COLOURS = {
  heal: "tide",
  "shield-ally": "root",
  "aura-block": "root",
  rally: "ember",
  "taunt-shout": "ember",
  "poison-strike": "void",
  "root-shot": "root",
}

// --- Colour combos (all 6 pairs) ------------------------------------------------------
// `power` = the combo's base number (scaled by the finishing hero's attack
// in the engine: max(4, 60% of its attack)); shape = where it lands.
export const COLOUR_COMBOS = {
  steam: { id: "steam", pair: ["ember", "tide"], name: "Steam Burst", icon: "💨", shape: "3x3", text: "A scalding cloud on the target: every enemy in the 3x3 takes damage and is Exposed (takes +25%) for 2 turns." },
  wildfire: { id: "wildfire", pair: ["ember", "root"], name: "Wildfire Bloom", icon: "🔥", shape: "3x3", text: "The ground bursts into flame: every enemy in the 3x3 starts Burning (2)." },
  hellflare: { id: "hellflare", pair: ["ember", "void"], name: "Hellflare", icon: "☄", shape: "single", text: "A black-fire lance hits the target hard and burns 10 of its mana (also eats Hunger stacks and ultimate charge)." },
  lifespring: { id: "lifespring", pair: ["tide", "root"], name: "Lifespring", icon: "❋", shape: "allies", text: "Spring water wells up: allies within 2 of the caster heal and are cleansed of Poison and Burn." },
  undertow: { id: "undertow", pair: ["tide", "void"], name: "Undertow", icon: "🌀", shape: "3x3", text: "A dark current drags at every enemy in the 3x3: Slowed for 2 turns and 8 mana burned (Hunger stacks too)." },
  blight: { id: "blight", pair: ["root", "void"], name: "Blight Bloom", icon: "☣", shape: "3x3", text: "Rot flowers on the target: every enemy in the 3x3 is Poisoned (3)." },
}
export const COLOUR_COMBO_IDS = Object.keys(COLOUR_COMBOS)

// The combo two colours make (order doesn't matter).
export function comboForColours(a, b) {
  if (!a || !b || a === b) return null
  return Object.values(COLOUR_COMBOS).find((c) => c.pair.includes(a) && c.pair.includes(b)) || null
}

export const COMBO_POWER_MIN = 4
export const COMBO_POWER_ATK = 0.6
export const HELLFLARE_BONUS = 3
export const HELLFLARE_BURN = 10
export const UNDERTOW_BURN = 8
export const FINISHER = { emberDmg: 2, tideHeal: 3, rootBlock: 3, voidRes: 5 }

// --- Overchannel -----------------------------------------------------------------------
// HP cost = 1 per 4% of the bar you are short (min 2). Backlash = 20 + the
// % short; at 100 the hero is stunned + takes BACKLASH_DAMAGE at the start
// of its next turn, then the meter empties. It drains 15 a turn otherwise.
export const OVERCHANNEL = {
  hpPerPct: 4,
  hpMin: 2,
  backlashBase: 20,
  backlashMax: 100,
  backlashDecay: 15,
  backlashDamage: 4,
  voidCut: 0.4, // Void affinity: backlash x0.6
  mageCut: 0.2, // mage classes: x0.8
  bloodHpCut: 0.5, // Blood heroes pay half the HP
}

// --- Mana-fed enemies -------------------------------------------------------------------
// range = how close a hero cast must be; per = attack per Hunger stack;
// max = stack cap; gorged = extra attack once full (families). The boss
// instead releases a MANA NOVA at the start of the enemy turn once full.
export const FEED_FAMILIES = {
  "ley-leech": {
    id: "ley-leech",
    name: "Ley Leeches",
    icon: "🩸",
    members: ["hollowfen", "hollowspite", "hollowfang", "hollowcurse", "duskhollow", "hollowmarrow-sentinel"],
    range: 3,
    per: 1,
    max: 4,
    gorged: 2,
    text: "Hollow-things born from the ley wound. They drink the mana your heroes spend nearby.",
  },
  manamoth: {
    id: "manamoth",
    name: "Manamoths",
    icon: "🦋",
    members: ["duskmoth", "runewisp-acolyte", "veilgnaw", "mire-gnat"],
    range: 3,
    per: 1,
    max: 3,
    gorged: 2,
    text: "Moths drawn to spell-light. Every cast near them makes them bite harder.",
  },
  "silence-eater": {
    id: "silence-eater",
    name: "Silence-eaters",
    icon: "🕳",
    members: ["silence-weaver", "thinreach-wraith", "wraithgale"],
    range: 4,
    per: 1,
    max: 5,
    gorged: 3,
    text: "Wraiths that feed on spellcraft from a long way off.",
  },
}
export const FEED_BOSSES = {
  "the-gorging-maw": { id: "maw", name: "The Gorging Maw", icon: "👄", range: 4, per: 1, max: 6, nova: { radius: 2, damage: 8, keep: 1 }, text: "The Maw gorges on spent mana. Full Hunger = a MANA NOVA on every hero within 2 at the start of its turn." },
}
// Extra Hunger for a big cast (40%+ of the bar) or an overchannel.
export const FEED_BIG_CAST_PCT = 40
// Mana burned per Hunger stack removed (min 1 stack per burn).
export const FEED_BURN_PER_STACK = 5

export function feedKitForDef(defId) {
  if (!defId) return null
  if (FEED_BOSSES[defId]) return { ...FEED_BOSSES[defId], boss: true, family: "boss" }
  const fam = Object.values(FEED_FAMILIES).find((f) => f.members.includes(defId))
  return fam ? { id: fam.id, name: fam.name, icon: fam.icon, range: fam.range, per: fam.per, max: fam.max, gorged: fam.gorged, boss: false, family: fam.id } : null
}

// The "Bring:" answer to a mana-fed enemy.
export const FEED_ANSWER = "cast away from it (stay out of its reach), attack or use items instead, burn its mana (removes Hunger), or burst it before it feeds"
