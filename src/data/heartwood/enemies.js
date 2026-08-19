// Heartwood Trial - enemy definitions. Original forest/rune lore
// creatures, not existing Boosterverse "named agents".
//
// moveSelect: "sequence" cycles movePattern deterministically.
// moveSelect: "weightedRandom" picks among movePattern by weight each
// time an intent is computed, then commits to it (still telegraphed one
// turn ahead, just less predictable to plan around).

export const ENEMIES = {
  "rotwood-husk": {
    id: "rotwood-husk",
    name: "Rotwood Husk",
    maxHp: 40,
    art: "husk",
    description:
      "A hollowed trunk, moving on roots long since gone soft. Slow, but it does not tire.",
    moveSelect: "sequence",
    movePattern: [
      { type: "attack", amount: 8 },
      { type: "attack", amount: 8 },
      { type: "block", amount: 6 },
    ],
  },
  "moss-troll": {
    id: "moss-troll",
    name: "Moss Troll",
    maxHp: 46,
    art: "troll",
    description:
      "Thick with lichen and old grudges. Its grip saps the strength from a struck limb.",
    moveSelect: "sequence",
    movePattern: [
      { type: "attack", amount: 10 },
      { type: "debuff", id: "weak", amount: 2, target: "player" },
      { type: "attack", amount: 6 },
      { type: "block", amount: 8 },
    ],
  },
  "rune-warden": {
    id: "rune-warden",
    name: "Rune Warden",
    maxHp: 50,
    art: "warden",
    description:
      "Carved to guard the deep runes. What it does next is never quite certain.",
    moveSelect: "weightedRandom",
    movePattern: [
      { type: "attack", amount: 12, weight: 2 },
      { type: "block", amount: 12, weight: 1 },
      { type: "debuff", id: "weak", amount: 2, target: "player", weight: 1 },
    ],
  },
  "bark-brute": {
    id: "bark-brute",
    name: "Bark Brute",
    maxHp: 48,
    art: "barkBrute",
    description: "A knotted fist of root and stone. It only knows one move, and it is heavy.",
    moveSelect: "sequence",
    movePattern: [
      { type: "attack", amount: 15 },
      { type: "attack", amount: 5 },
      { type: "block", amount: 10 },
    ],
  },
  "mist-growler": {
    id: "mist-growler",
    name: "Mist Growler",
    maxHp: 36,
    art: "mistGrowler",
    description: "Fog with teeth. It snaps before you see it coming.",
    moveSelect: "weightedRandom",
    movePattern: [
      { type: "attack", amount: 9, weight: 2 },
      { type: "debuff", id: "weak", amount: 2, target: "player", weight: 1 },
      { type: "attack", amount: 6, weight: 1 },
    ],
  },
}
