// Hearthwood HQ - the Studio's "rooms" (StudioHome.jsx).
//
// Marc, 2026-10-19: "en osaa vielä kovin hyvin käyttää dev toolia, tee
// siitä helppokäyttöisempi ja selkeämpi" / "tehdään dev studiosta
// päämaja HQ jolla voin kehittää peliä monipuolisesti ja helposti
// itse". The Studio opens on these 8 rooms instead of 10 tabs + a
// 55-type list: each room is one part of the game, says in one line what
// you can do there, offers 2-3 ready actions, and inside it the left list
// shows ONLY that room's things. Every entityTypes.js type lives in
// exactly one room (verify_studio_home checks it), so nothing is lost -
// the old tabs still sit under "More tools".
//
// Action kinds:
//   type  - open that list in the room          { type, hint? }
//   add   - open that list's "make a new" form  { type }
//   view  - open one of the Studio's own panels { view }
//   link  - open a page in a new tab            { href }
export const STUDIO_ROOMS = [
  {
    id: "heroes",
    rune: "ᚢ",
    title: "Heroes",
    blurb: "Your heroes: pictures, names, health, attack, traits and gear.",
    actions: [
      { label: "Change a hero's picture", kind: "type", type: "units", hint: "Pick a hero on the left - the picture is the first thing on the right." },
      { label: "Edit a hero", kind: "type", type: "units" },
      { label: "Traits", kind: "view", view: "traits" },
      { label: "Gear", kind: "view", view: "gear" },
    ],
    types: ["units", "characters", "traits", "promotions", "signatures", "quirks", "scars", "roles", "evolutions", "upgradeBranches", "dualClasses", "mutations", "tribes", "synergies", "comboSynergies", "positionSynergies", "formations"],
  },
  {
    id: "skills",
    rune: "ᛊ",
    title: "Skills & Mana",
    blurb: "What each class can do: skills, mana costs, damage and the hero resources.",
    actions: [
      { label: "Edit a class's skills & mana", kind: "type", type: "classes" },
      { label: "Hero resources", kind: "view", view: "resources" },
    ],
    types: ["classes", "resources", "cards"],
  },
  {
    id: "enemies",
    rune: "ᚦ",
    title: "Enemies",
    blurb: "Monsters and bosses - how strong they are and what they do.",
    actions: [
      { label: "Edit an enemy", kind: "type", type: "enemies" },
    ],
    types: ["enemies"],
  },
  {
    id: "battlefield",
    rune: "ᛇ",
    title: "Battlefield",
    blurb: "Make your own objects for the battle maps and try them in a practice fight.",
    actions: [
      { label: "Make a new object", kind: "add", type: "battleObjects" },
      { label: "Try my objects in battle", kind: "link", href: "/heartwood-tactics?objects=1" },
      { label: "Arenas", kind: "type", type: "arenas" },
    ],
    types: ["battleObjects", "arenas"],
  },
  {
    id: "story",
    rune: "ᚱ",
    title: "Story",
    blurb: "Every scene and line of dialogue - read it and rewrite it in your own words.",
    actions: [
      { label: "Rewrite scenes & dialogue", kind: "type", type: "storyScenes", hint: "Pick a scene on the left - every line is its own box. Change as many as you like, then press Preview once." },
      { label: "Endings", kind: "type", type: "endings" },
      { label: "Map events", kind: "type", type: "events" },
      { label: "Write a new event", kind: "add", type: "events" },
    ],
    types: ["storyScenes", "storyBeats", "storyChapters", "endings", "startVariants", "storyTimeline", "events", "dialogues", "crossroads", "storyJournal", "cinematics", "crownless"],
  },
  {
    id: "lore",
    rune: "ᛟ",
    title: "World & Lore",
    blurb: "The myths, runes, forest creatures and fates behind the story.",
    actions: [
      { label: "The Four Tellings", kind: "type", type: "tellings" },
      { label: "Runes", kind: "type", type: "runes" },
      { label: "Forest creatures", kind: "type", type: "creatures" },
    ],
    types: ["tellings", "mythEvidence", "runes", "creatures", "regardBands", "loreTruths", "fates", "factions", "nemeses", "uniqueHeroes", "moods", "almanac"],
  },
  {
    id: "market",
    rune: "ᚠ",
    title: "Market & Economy",
    blurb: "Items, relics, prices and the merchant - how tight the money is.",
    actions: [
      { label: "Edit an item", kind: "type", type: "items" },
      { label: "Edit a relic", kind: "type", type: "relics" },
      { label: "Money & difficulty levers", kind: "type", type: "economyLevers" },
    ],
    types: ["items", "relics", "merchants", "marketUi", "economyLevers", "investments", "marketEvents", "economyRoles", "depths", "boons", "banes", "shopLayout"],
  },
  {
    id: "look",
    rune: "ᛚ",
    title: "Look & Colours",
    blurb: "The game's colours, fonts and spacing - see the change before you keep it.",
    actions: [
      { label: "Change colours & fonts", kind: "view", view: "theme" },
    ],
    types: [],
  },
  {
    id: "guidance",
    rune: "ᚨ",
    title: "Help & Tutorial",
    blurb: "The help pages, tips and tutorial the player reads.",
    actions: [
      { label: "Edit help pages", kind: "type", type: "help" },
      { label: "Edit the tutorial", kind: "type", type: "tutorial" },
    ],
    types: ["help", "coachTips", "threats", "trials", "tutorial"],
  },
]

export function roomById(id) {
  return STUDIO_ROOMS.find(room => room.id === id) || null
}

// The room a list belongs to (deep links land in the right room).
export function roomForType(type) {
  return STUDIO_ROOMS.find(room => room.types.includes(type)) || null
}
