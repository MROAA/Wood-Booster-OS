// The Long Campaign - CAMPAIGN-ONLY ENEMIES (content sprint). Pure data.
//
// As a player reads it: the campaign's chapters field their own foes -
// ley-cutters that sever your ley lines, colour-attuned cantors that eat
// mana of their own colour, mana-gluttons, pack hounds, a lantern-bearer
// that marks your heroes - and one NAMED mini-boss per chapter.
//
// They are merged into ENEMIES (enemies.js) and listed in
// NON_BATTLE_ENEMY_IDS, so the Expedition's seeded solo pool
// (ACT_ENEMIES / actEnemyForNode) is untouched - they only ever appear
// through the campaign's own formations (campaignContent.js) and mini-boss
// fights (campaignBosses.js).
//
// `campKit` = the in-battle mechanic (services/heartwood/tacticsCampaignOps.js
// runs it at the top of the enemy phase, so the intent preview stays exact).
// `behavior` = the smart-AI behaviour profile (tacticsSmartAi BEHAVIORS).
// Every word here is hand-written.
import enemyPlaceholderImg from "../../assets/heartwood/enemies/enemy-placeholder.svg"

const img = enemyPlaceholderImg

export const CAMPAIGN_ENEMIES = {
  // --- Chapter 1 --------------------------------------------------------
  "ley-cutter": {
    id: "ley-cutter",
    act: 1,
    name: "Ley-Cutter",
    maxHp: 30,
    art: "gale",
    image: img,
    campaign: true,
    behavior: "assassin",
    description: "It carries a hooked knife made for one job: opening the ley under your feet and letting the light run out.",
    campKit: { id: "leycut", icon: "✂", label: "Cuts the ley", every: 3, burn: 10, text: "Every 3rd enemy turn with no hero next to it, it CUTS the ley: every hero loses 10 mana, and after the fight a ley line here is cut. Stand next to it to stop the knife." },
    moveSelect: "sequence",
    movePattern: [
      { type: "attack", amount: 7 },
      { type: "attack", amount: 6 },
    ],
  },
  "mire-lantern": {
    id: "mire-lantern",
    act: 1,
    name: "Mire Lantern",
    maxHp: 24,
    art: "spark",
    image: img,
    campaign: true,
    behavior: "marksman",
    attackPattern: "rook",
    description: "A little lamp-carrier from the marsh. Wherever its light lands, the others know where to bite.",
    campKit: { id: "lantern", icon: "🏮", label: "Lantern", text: "Shines a light on a hero (Marked: its cover doesn't count). Kill it first in the dark." },
    moveSelect: "sequence",
    movePattern: [
      { type: "attack", amount: 5 },
      { type: "block", amount: 3 },
    ],
  },

  // --- Chapter 2 --------------------------------------------------------
  "ember-cantor": {
    id: "ember-cantor",
    act: 2,
    name: "Ember Cantor",
    maxHp: 30,
    art: "ember",
    image: img,
    campaign: true,
    behavior: "caster",
    attackPattern: "rook",
    description: "It sings in the key of fire. Heroes who burn with the same colour hear it - and their mana answers.",
    campKit: { id: "resonate", colour: "ember", icon: "🔥", label: "Attuned: Ember", range: 4, drain: 8, cap: 4, text: "Each enemy turn it pulls 8 mana from every EMBER hero within 4, and grows +1 attack (max +4). Send heroes of other colours." },
    moveSelect: "sequence",
    movePattern: [
      { type: "attack", amount: 6 },
      { type: "debuff", id: "weak", amount: 1, target: "player" },
    ],
  },
  "ley-glutton": {
    id: "ley-glutton",
    act: 2,
    name: "Ley Glutton",
    maxHp: 48,
    art: "the-moon",
    image: img,
    campaign: true,
    behavior: "berserker",
    description: "Fat on spilled ley. Every spell cast near it is another mouthful.",
    campKit: { id: "glutton", icon: "🍽", label: "Mana-fed", text: "Feeds on mana spent near it (Hunger: +attack). Starve it - cast far away - or burn its mana." },
    moveSelect: "sequence",
    movePattern: [
      { type: "attack", amount: 9 },
      { type: "attack", amount: 8 },
      { type: "block", amount: 5 },
    ],
  },

  // --- Chapter 3 --------------------------------------------------------
  "tide-cantor": {
    id: "tide-cantor",
    act: 3,
    name: "Tide Cantor",
    maxHp: 34,
    art: "tide",
    image: img,
    campaign: true,
    behavior: "caster",
    attackPattern: "rook",
    description: "A drowned singer. It hums low, and every Tide-blooded hero nearby feels the pull of the current.",
    campKit: { id: "resonate", colour: "tide", icon: "🌊", label: "Attuned: Tide", range: 4, drain: 8, cap: 4, text: "Each enemy turn it pulls 8 mana from every TIDE hero within 4, and grows +1 attack (max +4)." },
    moveSelect: "sequence",
    movePattern: [
      { type: "attack", amount: 6 },
      { type: "heal", amount: 6 },
    ],
  },
  "thornwall-warden": {
    id: "thornwall-warden",
    act: 3,
    name: "Thornwall Warden",
    maxHp: 56,
    art: "stone",
    image: img,
    campaign: true,
    behavior: "guardian",
    description: "Bark like a palisade. It plants itself beside the others and dares you to reach past it.",
    campKit: { id: "bulwark", icon: "🛡", label: "Bulwark", block: 4, text: "Each enemy turn every enemy next to it gains +4 Block. Pull its friends away, or break it first." },
    moveSelect: "sequence",
    movePattern: [
      { type: "block", amount: 6 },
      { type: "attack", amount: 8 },
    ],
  },

  // --- Chapter 4 --------------------------------------------------------
  "ash-hound": {
    id: "ash-hound",
    act: 4,
    name: "Ash Hound",
    maxHp: 26,
    art: "forgehowl",
    image: img,
    campaign: true,
    behavior: "swarmer",
    description: "Ember-eyed and never alone. Each one's howl makes the rest braver.",
    campKit: { id: "pack", icon: "🐺", label: "Pack Howl", text: "+1 attack for every other Ash Hound still standing. Thin the pack and the rest lose heart." },
    moveSelect: "sequence",
    movePattern: [
      { type: "attack", amount: 7 },
      { type: "attack", amount: 7 },
    ],
  },
  "shard-hoarder": {
    id: "shard-hoarder",
    act: 4,
    name: "Shard Hoarder",
    maxHp: 44,
    art: "stoneheart",
    image: img,
    campaign: true,
    behavior: "guardian",
    description: "Its back is a crust of stolen ley-crystal. It feeds on spell-light, and it does not like to share.",
    campKit: { id: "shard", icon: "✦", label: "Carries a Ley Shard", text: "Mana-fed (Hunger from casts nearby). Kill it and its Ley Shard is yours after the mission." },
    moveSelect: "sequence",
    movePattern: [
      { type: "block", amount: 7 },
      { type: "attack", amount: 9 },
    ],
  },

  // --- Chapter 5 --------------------------------------------------------
  "void-cantor": {
    id: "void-cantor",
    act: 5,
    name: "Void Cantor",
    maxHp: 36,
    art: "shadow",
    image: img,
    campaign: true,
    behavior: "caster",
    attackPattern: "rook",
    description: "It sings no notes at all. Void-touched heroes feel the silence pull at them like a tide going out.",
    campKit: { id: "resonate", colour: "void", icon: "🌑", label: "Attuned: Void", range: 4, drain: 10, cap: 4, text: "Each enemy turn it pulls 10 mana from every VOID hero within 4, and grows +1 attack (max +4)." },
    moveSelect: "sequence",
    movePattern: [
      { type: "attack", amount: 7 },
      { type: "debuff", id: "vulnerable", amount: 1, target: "player" },
    ],
  },
  "root-cantor": {
    id: "root-cantor",
    act: 5,
    name: "Root Cantor",
    maxHp: 40,
    art: "leaf",
    image: img,
    campaign: true,
    behavior: "caster",
    attackPattern: "rook",
    description: "Moss for a voice. Root-blooded heroes nearby feel their strength sink back into the ground.",
    campKit: { id: "resonate", colour: "root", icon: "🌿", label: "Attuned: Root", range: 4, drain: 8, cap: 4, text: "Each enemy turn it pulls 8 mana from every ROOT hero within 4, and grows +1 attack (max +4)." },
    moveSelect: "sequence",
    movePattern: [
      { type: "attack", amount: 7 },
      { type: "block", amount: 6 },
    ],
  },

  // --- Chapter 6 --------------------------------------------------------
  "hollow-reaver": {
    id: "hollow-reaver",
    act: 6,
    name: "Hollow Reaver",
    maxHp: 40,
    art: "entropy",
    image: img,
    campaign: true,
    behavior: "assassin",
    description: "A gap in the air with a blade in it. It steps through nothing and comes out behind whoever is bleeding most.",
    campKit: { id: "voidstep", icon: "⟿", label: "Voidstep", every: 2, text: "Every other enemy turn it steps through the void to your most wounded hero. Keep the hurt ones close to friends." },
    moveSelect: "sequence",
    movePattern: [
      { type: "attack", amount: 11 },
      { type: "attack", amount: 9 },
    ],
  },

  // --- Chapter 7 --------------------------------------------------------
  "verge-chanter": {
    id: "verge-chanter",
    act: 7,
    name: "Verge Chanter",
    maxHp: 46,
    art: "cosmic",
    image: img,
    campaign: true,
    behavior: "summoner",
    attackPattern: "rook",
    description: "It holds the edge of the world shut with a song. While it sings, the others knit back together.",
    campKit: { id: "anchor", icon: "⚓", label: "Ley Anchor", regen: 3, text: "While it stands, every other enemy mends 3 HP at the start of each enemy turn. Silence it first." },
    moveSelect: "sequence",
    movePattern: [
      { type: "attack", amount: 8 },
      { type: "block", amount: 6 },
    ],
  },

  // --- Named mini-bosses (one per chapter, campaignBosses.js) -------------
  "mb-gnarlwick": {
    id: "mb-gnarlwick",
    act: 1,
    name: "Old Gnarlwick",
    maxHp: 78,
    art: "rootbindThicket",
    image: img,
    campaign: true,
    miniboss: true,
    description: "A stump that was a guardian once. Now it guards only its own hunger.",
    introLine: "\"Little sparks. I was old when your Hearth was a twig. Sit down. Stay.\"",
    passive: [{ type: "applyBuff", id: "strength", amount: 2 }],
    moveSelect: "sequence",
    movePattern: [
      { type: "attack", amount: 10 },
      { type: "block", amount: 8 },
      { type: "attack", amount: 12 },
    ],
  },
  "mb-cinderveil": {
    id: "mb-cinderveil",
    act: 2,
    name: "Sister Cinderveil",
    maxHp: 82,
    art: "flame",
    image: img,
    campaign: true,
    miniboss: true,
    attackPattern: "rook",
    description: "A clan-singer who listened to the wrong song. Her veil smoulders and never burns away.",
    introLine: "\"The clans burn too politely. Let me show you a fire that doesn't ask.\"",
    moveSelect: "sequence",
    movePattern: [
      { type: "attack", amount: 11 },
      { type: "debuff", id: "weak", amount: 1, target: "player" },
      { type: "attack", amount: 10 },
    ],
  },
  "mb-choirmother": {
    id: "mb-choirmother",
    act: 3,
    name: "The Drowned Choir-Mother",
    maxHp: 92,
    art: "drownedSiren",
    image: img,
    campaign: true,
    miniboss: true,
    attackPattern: "rook",
    description: "She leads a choir under the water. Every voice in it was somebody once.",
    introLine: "\"Hush now. Come down under. The water is warm, and the singing never stops.\"",
    moveSelect: "sequence",
    movePattern: [
      { type: "attack", amount: 11 },
      { type: "heal", amount: 10 },
      { type: "attack", amount: 12 },
    ],
  },
  "mb-orrin": {
    id: "mb-orrin",
    act: 4,
    name: "Gravel-King Orrin",
    maxHp: 108,
    art: "troll",
    image: img,
    campaign: true,
    miniboss: true,
    description: "A troll who crowned himself with a millstone. He rules a quarry and everything that falls into it.",
    introLine: "\"My quarry. My stones. My little crushed things. You'll be mine too, by sundown.\"",
    passive: [{ type: "applyBuff", id: "strength", amount: 2 }],
    moveSelect: "sequence",
    movePattern: [
      { type: "attack", amount: 14 },
      { type: "block", amount: 10 },
      { type: "attack", amount: 13 },
    ],
  },
  "mb-vesper": {
    id: "mb-vesper",
    act: 5,
    name: "Vesper the Unthroned",
    maxHp: 104,
    art: "the-emperor",
    image: img,
    campaign: true,
    miniboss: true,
    attackPattern: "rook",
    description: "She sat on the empty throne for one night, and it was enough to ruin her. She wants it back.",
    introLine: "\"One night I wore it. One night. Do you know what it's like to give a crown back to the dark?\"",
    moveSelect: "sequence",
    movePattern: [
      { type: "attack", amount: 13 },
      { type: "debuff", id: "vulnerable", amount: 1, target: "player" },
      { type: "attack", amount: 12 },
    ],
  },
  "mb-mirrorwright": {
    id: "mb-mirrorwright",
    act: 6,
    name: "The Mirrorwright",
    maxHp: 110,
    art: "the-magician",
    image: img,
    campaign: true,
    miniboss: true,
    description: "A maker of echoes. It polishes each one until it looks back at you with your own tired eyes.",
    introLine: "\"Hold still. I only need your outline. The rest I can make from memory.\"",
    moveSelect: "sequence",
    movePattern: [
      { type: "attack", amount: 13 },
      { type: "attack", amount: 12 },
      { type: "block", amount: 9 },
    ],
  },
  "mb-rootrot": {
    id: "mb-rootrot",
    act: 7,
    name: "Rootrot, the Last Gardener",
    maxHp: 124,
    art: "grovekeeper",
    image: img,
    campaign: true,
    miniboss: true,
    description: "It tended the last root for an age, and somewhere in the dark it decided the root was the weed.",
    introLine: "\"Every garden ends. I am only the one honest enough to pull it up.\"",
    passive: [{ type: "applyBuff", id: "strength", amount: 3 }],
    moveSelect: "sequence",
    movePattern: [
      { type: "attack", amount: 15 },
      { type: "debuff", id: "poison", amount: 3, target: "player" },
      { type: "attack", amount: 14 },
    ],
  },
}

export const CAMPAIGN_ENEMY_IDS = Object.keys(CAMPAIGN_ENEMIES)
export const CAMPAIGN_REGULAR_IDS = CAMPAIGN_ENEMY_IDS.filter((id) => !CAMPAIGN_ENEMIES[id].miniboss)
export const CAMPAIGN_MINIBOSS_IDS = CAMPAIGN_ENEMY_IDS.filter((id) => CAMPAIGN_ENEMIES[id].miniboss)
