// The Long Campaign (part 1) - pure data. Rules live in
// services/heartwood/campaignEngine.js. As a player reads it:
// - One save, played over many evenings. Days pass; the Rot grows.
// - The world map has 7 regions. Each one's threat rises every day you
//   leave it alone. At 100 it FALLS: doom rises and every fight gets
//   harder. If the Hearthstead falls, or doom fills up, the campaign is lost.
// - Missions appear on the map and expire. You can't do them all.
// - Heroes who fall in a mission are dead for good (the Memorial).
// - The Hearth: rooms take days to build.
// - Part 2 (campaignStory.js): every chapter ends in a story choice that
//   changes the chapters, allies, nemeses, the map and the ending.

export const CAMPAIGN_VERSION = 1
export const CAMPAIGN_SAVE_KEY = "heartwood-campaign-save-v1"
export const CAMPAIGN_UNLOCKS_KEY = "heartwood-campaign-unlocks-v1"

// Difficulty levels. `enemyBonus` is added to the DifficultyEngine score
// (tacticsDifficulty.js, ~10-18 points per threat tier), `threatRate` is
// threat per day per region, `doomMax` the doom clock size.
export const CAMPAIGN_DIFFICULTIES = {
  story: {
    id: "story",
    name: "Story",
    icon: "🕯",
    blurb: "A gentle pace. The Rot spreads slowly and fights are softer.",
    threatRate: 1,
    enemyBonus: -10,
    doomMax: 30,
    startEssence: 600,
    retreat: true,
  },
  normal: {
    id: "normal",
    name: "Normal",
    icon: "🌲",
    blurb: "The campaign as meant. You will lose heroes, and some regions.",
    threatRate: 1.5,
    enemyBonus: 0,
    doomMax: 24,
    startEssence: 400,
    retreat: true,
  },
  hard: {
    id: "hard",
    name: "Hard",
    icon: "🔥",
    blurb: "The Rot is hungry. Every choice costs something.",
    threatRate: 2,
    enemyBonus: 8,
    doomMax: 20,
    startEssence: 300,
    retreat: true,
  },
  ironman: {
    id: "ironman",
    name: "Ironman",
    icon: "⛓",
    blurb: "Hard, and no retreat from a fight once it starts. Every save is final.",
    threatRate: 2.2,
    enemyBonus: 10,
    doomMax: 18,
    startEssence: 300,
    retreat: false,
  },
}
export const DEFAULT_DIFFICULTY = "normal"

// Threat (0-100) bands.
export const THREAT_THREATENED = 40
export const THREAT_FALLEN = 100

// The world map. `offset` = how many Acts ahead of the campaign chapter
// this region's fights are; x/y = position on the map (0-100).
export const CAMPAIGN_REGIONS = [
  { id: "hearthstead", name: "The Hearthstead", short: "Hearthstead", offset: 0, ley: false, home: true, x: 50, y: 72, threatMult: 0.4, blurb: "Home. If it falls, everything falls." },
  { id: "outer-grove", name: "The Outer Grove", short: "Outer Grove", offset: 0, ley: false, x: 24, y: 62, threatMult: 1, blurb: "Old trees, sick roots. The first to feel the Rot." },
  { id: "mistfen", name: "Mistfen Ley", short: "Mistfen", offset: 0, ley: true, x: 14, y: 34, threatMult: 1, blurb: "A ley marsh. Mana pools in the water here." },
  { id: "deepening", name: "The Deepening Woods", short: "Deepening", offset: 1, ley: false, x: 44, y: 44, threatMult: 1, blurb: "Gold light that won't hold still." },
  { id: "emberwrack", name: "Emberwrack Ridge", short: "Emberwrack", offset: 1, ley: false, x: 78, y: 58, threatMult: 1, blurb: "Smoke over the ridge, day and night." },
  { id: "hollow-ley", name: "The Hollow Ley", short: "Hollow Ley", offset: 2, ley: true, x: 72, y: 24, threatMult: 1, blurb: "A ley-line wound. Mana-rich, and watched." },
  { id: "crownless", name: "The Crownless Reach", short: "Crownless", offset: 2, ley: false, x: 40, y: 12, threatMult: 1, blurb: "Where the Rot began. The road ends here." },
]

// Roads drawn between regions (also: a fallen region pushes threat into its neighbours).
export const CAMPAIGN_ROADS = [
  ["hearthstead", "outer-grove"],
  ["hearthstead", "emberwrack"],
  ["hearthstead", "deepening"],
  ["outer-grove", "mistfen"],
  ["outer-grove", "deepening"],
  ["deepening", "hollow-ley"],
  ["deepening", "crownless"],
  ["emberwrack", "hollow-ley"],
  ["mistfen", "crownless"],
]

// Mission types. `threatDrop` = region threat removed on a win.
export const MISSION_TYPES = {
  fight: { id: "fight", name: "Skirmish", icon: "⚔", node: "battle", threatDrop: 25, expiry: [3, 5], blurb: "Drive off a raiding party." },
  elite: { id: "elite", name: "Elite Hunt", icon: "☠", node: "elite", threatDrop: 35, expiry: [4, 6], blurb: "A dangerous beast leads the Rot here. Kill it." },
  rescue: { id: "rescue", name: "Rescue", icon: "🕊", node: "battle", threatDrop: 20, expiry: [2, 4], blurb: "Someone is trapped out there. Win, and they join you." },
  supply: { id: "supply", name: "Supply Cache", icon: "📦", node: "battle", threatDrop: 15, expiry: [3, 5], blurb: "A cache of Essence, guarded." },
  ley: { id: "ley", name: "Ley Site", icon: "✦", node: "battle", threatDrop: 20, expiry: [3, 5], blurb: "A mana spring. Your heroes start overcharged. Pays Ley Shards." },
  story: { id: "story", name: "Story", icon: "📜", node: "story", threatDrop: 40, expiry: null, blurb: "The road onward. Win to open the next chapter." },
  retake: { id: "retake", name: "Retake", icon: "⚑", node: "elite", threatDrop: 0, expiry: [4, 6], blurb: "Take a fallen region back." },
  // Story (part 2, campaignStory.js): a nemesis hunting you, and your allies calling.
  hunt: { id: "hunt", name: "Hunted", icon: "🐺", node: "elite", threatDrop: 15, expiry: [2, 4], blurb: "Your nemesis has found you. Meet them - or they strike while you're away (Doom +1)." },
  allied: { id: "allied", name: "Call to Arms", icon: "🔔", node: "battle", threatDrop: 25, expiry: [3, 5], blurb: "Your allies call for help. Their warriors fight beside you." },
}

// Hand-written story mission titles, one per chapter (1-7). The story
// (campaignStory.js STORY_BEATS) swaps in a chapter VARIANT by your choices;
// these are the defaults.
export const STORY_CHAPTERS = [
  { chapter: 1, title: "The Rootkeeper's Gate", line: "Something old guards the first gate. It does not want you through." },
  { chapter: 2, title: "Heart of the Deepening", line: "The forest's heart is hiding. Find what it hides from." },
  { chapter: 3, title: "The Wounded Hearthwood", line: "Reality is thin here. Hold your squad together." },
  { chapter: 4, title: "The Reckoning", line: "The guardian at the centre never wanted this. Neither did you." },
  { chapter: 5, title: "The Empty Throne", line: "The crown is still warm. Someone must take it from the dark." },
  { chapter: 6, title: "The Echo Rift", line: "The forest remembers you too hard. Break the echo." },
  { chapter: 7, title: "The Last Root", line: "The end of the road. Win, and the Hearthwood lives." },
]
export const MAX_CHAPTER = 7
// Wins inside a chapter before its story mission appears.
export const STORY_AFTER_WINS = 4

// Doom.
export const DOOM_PER_FALL = 3
export const DOOM_PER_WIPE = 2
export const DOOM_EVERY_DAYS = 8 // +1 doom on its own every N days
export const DOOM_STORY_RELIEF = 2
export const FALLEN_ENEMY_BONUS = 6 // DifficultyEngine score per fallen region
export const DOOM_ENEMY_BONUS = 12 // at full doom (scaled)
export const IGNORED_THREAT = 15 // a mission that expires unanswered
export const FAILED_THREAT = 10
export const FALLEN_NEIGHBOUR_THREAT = 1 // per day, per fallen neighbour

// Roster + recovery.
export const START_ROSTER = 6
export const SQUAD_MIN = 4
export const SQUAD_MAX = 6
export const TIRED_DAYS = 2
export const DEPLOY_MIN_HP = 0.5 // below this a hero is Wounded and can't go
export const HEAL_PER_DAY = 0.12
export const RECRUIT_BASE_COST = 150
export const RECRUIT_COST_PER_CHAPTER = 25
export const ROOKIE_OFFERS_ON_WIPE = 2

// Ley Shards: mana currency. Attune = a permanent +manaBonus on a hero.
export const ATTUNE_COST = 1
export const ATTUNE_MANA = 5
export const ATTUNE_MAX = 3
export const LEY_MISSION_OVERCHARGE = 25
export const LEY_REGION_OVERCHARGE = 10

// Hearth rooms in the campaign. Rooms take days to build; one build at a
// time. Barracks / Training / Infirmary are the Hearth's own rooms
// (data/heartwood/hearth.js) - the campaign reuses their name + icon.
export const CAMPAIGN_ROOMS = [
  {
    id: "infirmary",
    blurb: "Wounded heroes heal faster.",
    base: "Heroes heal 12% HP a day.",
    levels: [
      { cost: 150, days: 2, text: "Heal 20% a day." },
      { cost: 300, days: 3, text: "Heal 28% a day." },
      { cost: 500, days: 4, text: "Heal 36% a day." },
    ],
  },
  {
    id: "barracks",
    blurb: "Room for a bigger roster.",
    base: "Holds 8 heroes.",
    levels: [
      { cost: 150, days: 2, text: "Holds 12 heroes." },
      { cost: 300, days: 3, text: "Holds 16 heroes." },
      { cost: 500, days: 4, text: "Holds 20 heroes." },
    ],
  },
  {
    id: "training",
    blurb: "Heroes resting at home keep learning.",
    base: "No training at home.",
    levels: [
      { cost: 200, days: 2, text: "Resting heroes gain 1 XP a day." },
      { cost: 350, days: 3, text: "Resting heroes gain 2 XP a day." },
      { cost: 550, days: 4, text: "Resting heroes gain 3 XP a day." },
    ],
  },
  {
    id: "leywell",
    name: "Ley Well",
    icon: "✦",
    blurb: "Draws mana up from the ley lines. Deeper pools for every hero.",
    base: "No well yet.",
    levels: [
      { cost: 200, shards: 1, days: 3, text: "Every hero: +6 max mana." },
      { cost: 350, shards: 2, days: 4, text: "+12 max mana, and fights start with +10 Overcharge." },
      { cost: 550, shards: 4, days: 5, text: "+18 max mana, and +20 Overcharge." },
    ],
  },
  {
    id: "recruitment",
    name: "Recruitment Post",
    icon: "📯",
    blurb: "Word travels. More heroes come looking for you.",
    base: "2 recruits come by every 7 days.",
    levels: [
      { cost: 120, days: 2, text: "3 recruits every 5 days." },
      { cost: 280, days: 3, text: "3 recruits every 4 days, some seasoned." },
      { cost: 450, days: 4, text: "4 recruits every 3 days, some rare." },
    ],
  },
]
export const ROSTER_CAP_BY_LEVEL = [8, 12, 16, 20]
export const HEAL_BONUS_BY_LEVEL = [0, 0.08, 0.16, 0.24]
export const TRAINING_XP_BY_DAY = [0, 1, 2, 3]
export const LEY_WELL_MANA = [0, 6, 12, 18]
export const LEY_WELL_OVERCHARGE = [0, 0, 10, 20]
export const RECRUIT_EVERY_DAYS = [7, 5, 4, 3]
export const RECRUIT_OFFER_COUNT = [2, 3, 3, 4]

// Hero names (hand-written). Recruits draw from these.
export const HERO_NAMES = [
  "Aino", "Brann", "Corwen", "Della", "Eero", "Fianna", "Gorm", "Hilde", "Ilmari", "Jory", "Kaarin", "Lasse",
  "Maren", "Niilo", "Orla", "Pekka", "Quill", "Riika", "Sami", "Tuuli", "Ulla", "Veikko", "Wynn", "Ylva",
  "Ashby", "Birch", "Cedric", "Dunya", "Elsi", "Fenna", "Hollis", "Ivo", "Kestrel", "Linnea", "Marek", "Nessa",
]

// Replay unlocks: earned by reaching a chapter, kept across campaigns.
export const CAMPAIGN_UNLOCKS = [
  { id: "commander:kaski", chapter: 3, name: "Kaski joins the commanders", commanderId: "kaski" },
  { id: "commander:louhi", chapter: 5, name: "Louhi joins the commanders", commanderId: "louhi" },
  { id: "start:seasoned", chapter: 8, name: "Seasoned start: new campaigns begin with Level 2 heroes" },
  // Endings (campaignStory.js ENDINGS) - each unlocks one of these.
  { id: "commander:lehva", ending: "rooted", name: "Lehva joins the commanders", commanderId: "lehva" },
  { id: "relic:emberbrand", ending: "ember", name: "New campaigns start with the Emberbrand relic", relicId: "emberbrand" },
  { id: "variant:hollow-road", ending: "hollow", name: "Story start: The Hollow Road", variant: "hollow-road" },
  { id: "variant:echo", ending: "echo", name: "Story start: Spacemonkey's Echo", variant: "echo" },
  { id: "variant:unhooded", ending: "peace", name: "Story start: Maura Unhooded", variant: "unhooded" },
  { id: "relic:weathered-standard", ending: "watch", name: "New campaigns start with the Weathered Standard relic", relicId: "weathered-standard" },
]

export function campaignRoomDef(id) {
  return CAMPAIGN_ROOMS.find((r) => r.id === id) || null
}
export function regionDef(id) {
  return CAMPAIGN_REGIONS.find((r) => r.id === id) || null
}
