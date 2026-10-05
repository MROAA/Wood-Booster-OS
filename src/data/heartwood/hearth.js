// The Hearth - a persistent home camp between runs (Mewgenics-style).
// Pure data; the rules live in services/heartwood/hearth.js.
// As a player reads it:
// - Units still standing when a run ends come home with their level,
//   XP, perks and skill upgrades. On a LOST run, units that fell in the
//   final fight die for good (memorial) - can be switched off.
// - Bring up to MAX_VETERANS of them into the next run. They arrive
//   travel-worn (start at TRAVEL_HP of their HP).
// - Every run a unit goes on adds 1 age. From OLD_AGE on, each extra run
//   costs it 2 max HP and 1 attack in fights (max 3 steps). Retire it to
//   become an Elder: +ELDER_ESSENCE starting Essence per Elder (max 3).
// - Rooms + furniture are bought with Acorns (the Grove's currency).

export const HEARTH_VERSION = 1
export const MAX_VETERANS = 2
export const TRAVEL_HP = 0.8
export const OLD_AGE = 5 // age at which decline starts
export const MAX_DECLINE = 3
export const DECLINE_HP = 2 // per decline step
export const DECLINE_ATTACK = 1
export const ELDER_ESSENCE = 10
export const MAX_ELDER_BONUS = 3
export const RECRUIT_COST = 8 // Acorns, one recruit per run
export const RECRUIT_OFFERS = 3
export const MEMORIAL_MAX = 30

// level 0 = not built. `levels[i]` = what level i+1 gives + its cost.
export const HEARTH_ROOMS = [
  {
    id: "barracks",
    name: "Barracks",
    icon: "🛏",
    blurb: "Room for your roster.",
    base: "Holds 4 heroes.",
    levels: [
      { cost: 15, text: "Holds 6 heroes." },
      { cost: 30, text: "Holds 8 heroes." },
      { cost: 50, text: "Holds 10 heroes." },
    ],
  },
  {
    id: "training",
    name: "Training Yard",
    icon: "🎯",
    blurb: "Veterans drill between runs.",
    base: "No extra training.",
    levels: [
      { cost: 20, text: "Veterans start each run with +3 XP." },
      { cost: 40, text: "Veterans start each run with +6 XP." },
    ],
  },
  {
    id: "infirmary",
    name: "Infirmary",
    icon: "🩹",
    blurb: "Rest and mend at home.",
    base: "Wounded heroes stay wounded.",
    levels: [
      { cost: 15, text: "Wounded heroes heal at home." },
      { cost: 35, text: "Also: veterans start runs at full HP." },
    ],
  },
  {
    id: "workshop",
    name: "Workshop",
    icon: "🔨",
    blurb: "Tinkering pays. Gear and recipes come later.",
    base: "Empty benches.",
    levels: [
      { cost: 25, text: "+10 starting Essence each run." },
      { cost: 50, text: "+20 starting Essence each run." },
    ],
  },
]

// One-time buys, each a small passive.
export const HEARTH_FURNITURE = [
  { id: "bunk", name: "Extra Bunk", icon: "🪵", cost: 10, text: "+1 roster space." },
  { id: "rack", name: "Weapon Rack", icon: "🗡", cost: 12, text: "Veterans start each run with +2 XP." },
  { id: "kettle", name: "Herb Kettle", icon: "🫖", cost: 10, text: "Travel-worn veterans start at 90% HP instead of 80%." },
  { id: "map", name: "Old Map", icon: "🗺", cost: 15, text: "+5 starting Essence each run." },
]

export const BASE_CAPACITY = 4
export const CAPACITY_BY_LEVEL = [4, 6, 8, 10]
export const TRAINING_XP_BY_LEVEL = [0, 3, 6]
export const WORKSHOP_ESSENCE_BY_LEVEL = [0, 10, 20]

export function roomById(id) {
  return HEARTH_ROOMS.find((r) => r.id === id) || null
}

export function furnitureById(id) {
  return HEARTH_FURNITURE.find((f) => f.id === id) || null
}
