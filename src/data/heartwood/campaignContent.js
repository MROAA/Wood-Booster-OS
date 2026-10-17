// The Long Campaign - CONTENT (content sprint). Pure data, every word
// hand-written. Rules: services/heartwood/campaignContentEngine.js (the
// campaign side) + services/heartwood/tacticsCampaignOps.js (the fight).
//
// As a player reads it:
// - New MISSION KINDS (campaign.js MISSION_TYPES): escort a ley-carrier,
//   hold a Mana Well, hunt a fleeing caster, free captives, a night raid,
//   a mana storm, a two-front battle, and a Named Foe per chapter.
// - Each CHAPTER has its own enemy roster, its own battlefield feature and
//   its own world-map events.
// - WORLD EVENTS turn up on the map on any day: a caravan, a ley storm,
//   refugees, an omen... Each is a choice with lasting effects.
//
// Event shape:
//   { id, icon, title, region: "live"|"ley"|"home", days, lines: [[speaker|null, text]],
//     options: [{ id, label, say, cost?: {essence, leyShards}, stakes: [[tone, text]], result, effects }],
//     ignore?: { result, effects } }
// Effect vocabulary (campaignContentEngine.applyContentEffects):
//   essence n, leyShards n, doom n, threatHere n, threatAll n, threat {regionId: n},
//   healAll true, hurtAll pct, xpAll n, recruit "common"|"uncommon"|"rare",
//   item "common"|"rare", relic "random", mendLine true (a cut line by the event's
//   region), tire n (n ready heroes rest a day), lasting {kind, days, ...}.
// Lasting kinds (LASTING_KINDS): overcharge, essenceMult, threatMult, enemyBonus,
//   heal, ally (one fight), rival (one fight, bounty).

// ---------------------------------------------------------------------------
// Mission kinds - the briefing every new mission shows before you go
// ---------------------------------------------------------------------------

export const MISSION_BRIEFS = {
  escort: {
    goal: "Get the Ley-Carrier to the far waystone alive.",
    rules: [
      "The carrier walks up to 2 tiles toward the waystone at the start of each of your turns.",
      "An enemy standing next to it pins it in place - clear the road.",
      "Heroes next to the carrier at the start of a turn drink +6 mana from its lantern.",
      "If the carrier falls, the mission fails.",
    ],
  },
  well: {
    goal: "Hold the Mana Well for 5 turns.",
    rules: [
      "The Well pours +8 mana into every hero within 2 tiles at the start of your turn.",
      "The Rot wants it broken. If the Well falls, the mission fails.",
      "Survive 5 turns (or clear the field) to win.",
    ],
  },
  assassinate: {
    goal: "Kill the fleeing caster before it escapes.",
    rules: [
      "The caster runs a tile toward the treeline every enemy turn.",
      "At the end of turn 5 it is gone - and the mission with it.",
      "Kill it and the rest scatter: that alone wins the fight.",
    ],
  },
  liberate: {
    goal: "Free the captives from the Rot's cages.",
    rules: [
      "Start your turn next to a cage and the captive inside walks free.",
      "The jailers will strike the cages - every captive that survives joins the Hearth.",
      "Win and any cage still standing opens.",
    ],
  },
  night: {
    goal: "Raid the Rot camp under cover of dark.",
    rules: [
      "Enemies are hidden in the dark: your heroes only see 2 tiles by torchlight.",
      "Close in - a foe you can see, you can strike.",
      "The raid pays half again its Essence.",
    ],
  },
  storm: {
    goal: "Win inside a mana storm.",
    rules: [
      "The storm takes a colour each turn (Ember, Tide, Root, Void) - the next one is shown.",
      "Heroes of the storm's colour gain +10 mana each turn, and its skills cost 15% less.",
      "Attuned enemies of that colour rage: +2 attack while the storm is theirs.",
    ],
  },
  twofront: {
    goal: "Fight on two fronts.",
    rules: [
      "Half the enemy force waits in the trees behind you.",
      "On turn 2 they come out at YOUR back edge - the marked tiles.",
      "Don't leave the wounded at the rear.",
    ],
  },
  warlord: {
    goal: "Defeat a named champion of the Rot.",
    rules: [
      "It has its own arena, phases and hazards - every hazard is marked a turn ahead.",
      "Weak points shield it: break them first.",
      "Win and the whole chapter breathes easier: Doom -1, and its region's threat drops.",
    ],
  },
}

// Extra rewards on new kinds (campaignContentEngine.contentReward).
export const NIGHT_ESSENCE_MULT = 1.5
export const WARLORD_DOOM_RELIEF = 1

// Which new kinds a chapter can spawn (from Chapter `from`).
export const SPECIAL_MISSIONS = [
  { type: "escort", from: 1 },
  { type: "well", from: 1 },
  { type: "liberate", from: 1 },
  { type: "night", from: 2 },
  { type: "assassinate", from: 2 },
  { type: "twofront", from: 2 },
  { type: "storm", from: 3 },
]
// Chance a regular fight / rescue becomes one of the kinds above (from Day 2).
export const SPECIAL_CHANCE = 0.45
// Chance an ordinary fight draws its chapter's roster instead of the Act's own.
export const CHAPTER_ROSTER_CHANCE = 0.5
// Chance a non-boss campaign fight is fought on the chapter's own battlefield.
export const CHAPTER_MAP_CHANCE = 0.5
// The Named Foe turns up once a chapter has this many wins.
export const WARLORD_AFTER_WINS = 2

// ---------------------------------------------------------------------------
// Chapters - roster, battlefield, events
// ---------------------------------------------------------------------------

const f = (id, name, defIds, description) => ({
  id,
  name,
  description,
  campaign: true,
  pieces: defIds.map((defId, i) => ({ defId, pos: { row: Math.floor(i / 3), col: i % 3 } })),
  playerStart: { row: 2, col: 1 },
})

export const CAMPAIGN_FORMATIONS = Object.fromEntries(
  [
    f("camp-c1-cutters", "Ley-Cutter Gang", ["ley-cutter", "moss-troll", "mire-lantern"], "A troll for muscle, a lantern for eyes, and a knife for the ley."),
    f("camp-c1-marsh", "Marsh Lights", ["mire-lantern", "drowned-siren", "rotwood-husk", "ley-cutter"], "Lights over the reeds. Follow them and something follows you."),
    f("camp-c1-hollow", "Hollow Grove Raiders", ["bark-brute", "ley-cutter", "mossback-lurker"], "Old bark, new knives."),
    f("camp-c2-cantors", "Ember Choir", ["ember-cantor", "bramblehide", "emberthorn-shade"], "A cantor sings the fire; the rest carry it."),
    f("camp-c2-gluttons", "The Feeding Line", ["ley-glutton", "duskmoth", "ley-cutter"], "One cuts the ley open. The others drink."),
    f("camp-c2-mixed", "Gold-Light Hunters", ["ember-cantor", "ley-glutton", "cragfang", "mire-lantern"], "They hunt by the light your spells give off."),
    f("camp-c3-tide", "Tide Choir", ["tide-cantor", "thornwall-warden", "needlefen"], "A wall of bark, and behind it, the singing."),
    f("camp-c3-wall", "The Palisade", ["thornwall-warden", "gravequill", "tide-cantor", "ley-cutter"], "They dig in where the ley bleeds."),
    f("camp-c3-wraith", "Wound-Wardens", ["wraithgale", "tide-cantor", "thornwall-warden"], "Wraiths and wardens, keeping the wound open."),
    f("camp-c4-pack", "Ash Pack", ["ash-hound", "ash-hound", "ash-hound", "ashenmaw"], "Three hounds and the thing they hunt for."),
    f("camp-c4-hoard", "Shard Caravan", ["shard-hoarder", "ash-hound", "ash-hound", "briarmaw"], "A hoarder with an escort. The crystal on its back is worth the fight."),
    f("camp-c4-cantors", "Cinder Court", ["ember-cantor", "shard-hoarder", "thornfen"], "Fire, crystal, and thorn."),
    f("camp-c5-void", "Crownless Vigil", ["void-cantor", "crownless-revenant", "ash-hound"], "They keep watch over a throne nobody sits on."),
    f("camp-c5-root", "Throne Roots", ["root-cantor", "ironroot", "void-cantor"], "Two songs, root and silence, and an iron thing between them."),
    f("camp-c5-court", "The Empty Court", ["ashen-regent", "void-cantor", "shard-hoarder", "mire-lantern"], "A regent, a singer, a treasurer and a lamp."),
    f("camp-c6-reavers", "Rift Reavers", ["hollow-reaver", "echo-stalker", "void-cantor"], "They come out of nothing, one wound at a time."),
    f("camp-c6-echo", "Echo Hunt", ["riftmnemon", "hollow-reaver", "root-cantor"], "Memory and knife and moss."),
    f("camp-c6-mixed", "The Torn Road", ["hollow-reaver", "hollow-reaver", "ley-glutton", "tide-cantor"], "Two reavers, a glutton and a singer on a road that isn't there."),
    f("camp-c7-verge", "Verge Watch", ["verge-chanter", "verge-warden", "hollow-reaver"], "A chanter holds the edge shut. A warden holds the chanter."),
    f("camp-c7-chant", "The Last Chant", ["verge-chanter", "mnemosyne-colossus", "void-cantor"], "A song, a silence and something huge that remembers."),
    f("camp-c7-last", "Last Root Guard", ["verge-chanter", "ash-hound", "ash-hound", "root-cantor"], "The last root's last guard."),
  ].map((x) => [x.id, x]),
)

// Battlefield features (tacticsCampaignOps.js builds them): one per chapter.
export const CHAPTER_FEATURES = {
  "root-hollows": { id: "root-hollows", name: "Root Hollows", icon: "🌳", text: "Rings of old trees around sunken hollows. Chop a tree and it falls on whoever stands beyond." },
  "gold-glade": { id: "gold-glade", name: "Gold-Light Glade", icon: "✨", text: "Mana Wells in tall grass. Start your turn on one for +12 mana - the enemy wants them too." },
  "ley-fault": { id: "ley-fault", name: "The Ley Fault", icon: "⚡", text: "A cracked ley line runs down the field: poison where it bleeds, a Mana Well where it pools." },
  "ash-quarry": { id: "ash-quarry", name: "Ash Quarry", icon: "⛏", text: "Quarry ledges (high ground), boulders to roll and powder barrels left by the miners." },
  "throne-steps": { id: "throne-steps", name: "Throne Steps", icon: "👑", text: "Tiered steps of high ground behind broken barricades. Take the steps, hold the steps." },
  "echo-mirrors": { id: "echo-mirrors", name: "Echo Mirrors", icon: "🪞", text: "A mirrored field of ice and ice pillars. Slide, shatter, and watch your footing." },
  "last-hollow": { id: "last-hollow", name: "The Last Hollow", icon: "🔥", text: "Smouldering ground ringed by dead trees, with one Mana Well at its heart." },
}

export const CHAPTER_CONTENT = {
  1: { name: "The Outer Grove", rosters: ["camp-c1-cutters", "camp-c1-marsh", "camp-c1-hollow"], feature: "root-hollows" },
  2: { name: "The Deepening", rosters: ["camp-c2-cantors", "camp-c2-gluttons", "camp-c2-mixed"], feature: "gold-glade" },
  3: { name: "The Wounded Ley", rosters: ["camp-c3-tide", "camp-c3-wall", "camp-c3-wraith"], feature: "ley-fault" },
  4: { name: "The Reckoning", rosters: ["camp-c4-pack", "camp-c4-hoard", "camp-c4-cantors"], feature: "ash-quarry" },
  5: { name: "The Crownless Reach", rosters: ["camp-c5-void", "camp-c5-root", "camp-c5-court"], feature: "throne-steps" },
  6: { name: "The Echo Rift", rosters: ["camp-c6-reavers", "camp-c6-echo", "camp-c6-mixed"], feature: "echo-mirrors" },
  7: { name: "The Last Root", rosters: ["camp-c7-verge", "camp-c7-chant", "camp-c7-last"], feature: "last-hollow" },
}

// ---------------------------------------------------------------------------
// Lasting effects (from events)
// ---------------------------------------------------------------------------

export const LASTING_KINDS = {
  overcharge: { icon: "✦", word: (e) => `Fights start +${e.amount} Overcharge` },
  essenceMult: { icon: "🌿", word: (e) => `Mission Essence x${e.mult}` },
  threatMult: { icon: "☾", word: (e) => `Threat grows x${e.mult}${e.region ? " in one region" : " everywhere"}` },
  enemyBonus: { icon: "⚔", word: (e) => (e.amount >= 0 ? `Enemies +${e.amount} threat` : `Enemies ${e.amount} threat`) },
  heal: { icon: "✚", word: (e) => `Heroes heal +${Math.round(e.amount * 100)}% a day` },
  ally: { icon: "🤝", word: (e) => `${e.name} fights beside you next mission` },
  rival: { icon: "🗡", word: (e) => `${e.name} hunts your next mission (bounty ${e.bounty})` },
}

// ---------------------------------------------------------------------------
// Chapter events - 2-3 per chapter, each turns up once
// ---------------------------------------------------------------------------

export const CHAPTER_EVENTS = {
  1: [
    {
      id: "c1-widow",
      icon: "🪓",
      title: "The Woodcutter's Widow",
      region: "live",
      days: 3,
      lines: [
        [null, "At the edge of the Grove a woman sits on a stump with her late husband's axe across her knees. A boy of fifteen stands behind her, trying very hard to look older."],
        ["The Widow", "The Rot took him in the spring. The boy wants to go after it. I want him to live. You choose - I can't."],
      ],
      options: [
        { id: "boy", label: "Take the boy into the Hearth", say: "\"We'll teach him to come home.\"", stakes: [["good", "A new hero joins the roster"], ["bad", "The widow's farm goes untended: threat +8 here"]], result: "The boy shoulders his father's axe and doesn't look back. His mother watches until the road bends.", effects: { recruit: "common", threatHere: 8 } },
        { id: "axe", label: "Take only the axe", say: "\"Keep the boy. We'll carry this for him.\"", stakes: [["good", "A piece of gear for the armoury"], ["good", "+1 day of rest for two heroes - they help on the farm"]], result: "The axe is older than the Hearth and sharper than it looks. The boy glares at you. He'll get over it. Probably.", effects: { item: "common", tire: 2 } },
        { id: "bread", label: "Leave them food and walk on", say: "\"Eat. Stay. We'll handle the Rot.\"", cost: { essence: 60 }, stakes: [["bad", "-60 Essence"], ["good", "The Grove folk rally: threat -12 here"]], result: "Word spreads up the Grove that the Hearth feeds people. Doors open. Eyes watch the treeline for you.", effects: { essence: -60, threatHere: -12 } },
      ],
    },
    {
      id: "c1-black-well",
      icon: "🪣",
      title: "Roots in the Well",
      region: "home",
      days: 3,
      lines: [
        [null, "The Hearthstead well comes up black. Thin roots have grown into the stones overnight, and they pulse when you touch them."],
        ["Old Tuuli", "It's Rot. Or it's the Grove asking for something. With roots it's hard to tell the difference."],
      ],
      options: [
        { id: "burn", label: "Burn the roots out", say: "\"Not in our water.\"", stakes: [["good", "The Hearthstead is safer: its threat -10"], ["bad", "Two heroes spend a day hauling and burning"]], result: "The roots scream when they burn - a high, thin sound, like wind in a keyhole. The water runs clear by evening.", effects: { threat: { hearthstead: -10 }, tire: 2 } },
        { id: "listen", label: "Let the roots speak", say: "\"If the Grove is asking, we'll listen.\"", stakes: [["good", "+1 Ley Shard: the roots give up a crystal"], ["bad", "The Outer Grove's roots grow bolder: its threat +10"]], result: "At midnight the roots draw back on their own and leave a ley crystal glowing at the bottom of the well. A gift. Or bait.", effects: { leyShards: 1, threat: { "outer-grove": 10 } } },
        { id: "dig", label: "Seal it and dig another", say: "\"We'll start fresh.\"", cost: { essence: 80 }, stakes: [["bad", "-80 Essence"], ["good", "Clean water: heroes heal +5% a day for 6 days"]], result: "The new well is deep and cold and tastes of stone. People drink from it like they've been thirsty for a year.", effects: { essence: -80, lasting: { kind: "heal", amount: 0.05, days: 6, label: "Clean Water" } } },
      ],
    },
    {
      id: "c1-rootkeeper-sapling",
      icon: "🌱",
      title: "The Rootkeeper's Sapling",
      region: "live",
      days: 3,
      minWins: 2,
      lines: [
        [null, "A sapling has pushed up through the road, glowing faintly gold. It's in your way, and it's very clearly on purpose."],
        ["The Rootkeeper (far off)", "...Plant it at the Hearth. Or don't. Old things ask; young things decide."],
      ],
      options: [
        { id: "plant", label: "Plant it at the Hearth", say: "\"Come home with us.\"", stakes: [["good", "Fights start +10 Overcharge for 6 days"], ["bad", "Carrying it home costs a day: two heroes rest"]], result: "It takes root in a single night. By morning the Hearth's flames lean toward it, the way flowers lean toward sun.", effects: { tire: 2, lasting: { kind: "overcharge", amount: 10, days: 6, label: "Rootkeeper's Sapling" } } },
        { id: "leave", label: "Leave it where it grew", say: "\"It knows where it wants to be.\"", stakes: [["good", "The road is watched: threat -10 here"]], result: "You step around it. Behind you, the Grove breathes out.", effects: { threatHere: -10 } },
      ],
    },
  ],
  2: [
    {
      id: "c2-gold-fox",
      icon: "🦊",
      title: "The Gold-Light Fox",
      region: "live",
      days: 2,
      lines: [
        [null, "A fox made of light trots out of the trees, stops, and looks back at you over its shoulder. It waits. It's clearly waiting."],
      ],
      options: [
        { id: "follow", label: "Follow it", say: "\"Lead on, little lamp.\"", stakes: [["good", "It leads to a hidden ley spring: fights start +12 Overcharge for 5 days"], ["bad", "One hero is gone a day following it"]], result: "The spring is no bigger than a washbasin and so bright you can read by it. The fox drinks, and is gone.", effects: { tire: 1, lasting: { kind: "overcharge", amount: 12, days: 5, label: "Fox's Spring" } } },
        { id: "trap", label: "Trap it", say: "\"Light like that is worth a lot.\"", stakes: [["good", "+2 Ley Shards"], ["bad", "The forest saw: enemies +4 threat for 5 days"]], result: "It doesn't fight the net. It just goes out, like a candle, and leaves two shards of crystal on the grass. The trees go very quiet.", effects: { leyShards: 2, lasting: { kind: "enemyBonus", amount: 4, days: 5, label: "The Forest Saw" } } },
        { id: "let", label: "Let it go", say: "\"Not today, friend.\"", stakes: [["story", "Nothing happens. The fox seems almost disappointed."]], result: "It sits down, looks at you for a long moment, and fades into the gold.", effects: {} },
      ],
    },
    {
      id: "c2-envoys",
      icon: "🏕",
      title: "Envoys at the Gate",
      region: "home",
      days: 3,
      lines: [
        [null, "Two envoys stand at the Hearthstead gate, pointedly not looking at each other: one smells of smoke, one of the tide."],
        ["Ember Envoy", "We need grain. We'll pay in blades."],
        ["Tide Envoy", "We need nothing. We came to see who you'd feed first."],
      ],
      options: [
        { id: "ember", label: "Feed the Ember envoy", say: "\"Grain for blades. Fair.\"", cost: { essence: 100 }, stakes: [["bad", "-100 Essence"], ["good", "An Ember-Clan Warrior fights beside you next mission"]], result: "The envoy grins and bangs a fist on her chest. Somewhere on the ridge a warrior is already sharpening something.", effects: { essence: -100, lasting: { kind: "ally", unit: "ashmaw", name: "Ember-Clan Warrior", title: "The Envoy's Blade", days: 10 } } },
        { id: "trade", label: "Sell grain to both", say: "\"Everyone eats. Everyone pays.\"", stakes: [["good", "+120 Essence"], ["bad", "Neither trusts you: Emberwrack and Mistfen threat +8"]], result: "They both pay. They both leave unhappy. You are richer, and somehow lonelier.", effects: { essence: 120, threat: { emberwrack: 8, mistfen: 8 } } },
        { id: "tide", label: "Feed the Tide envoy", say: "\"You asked for nothing. Have something anyway.\"", cost: { essence: 60 }, stakes: [["bad", "-60 Essence"], ["good", "A Tide-Singer fights beside you next mission"]], result: "The tide envoy blinks, slowly, and bows. \"Patience recognises patience,\" she says, and means it as praise.", effects: { essence: -60, lasting: { kind: "ally", unit: "brinecaller", name: "Tide-Singer", title: "The Envoy's Gift", days: 10 } } },
      ],
    },
  ],
  3: [
    {
      id: "c3-bleeding-line",
      icon: "🩸",
      title: "The Bleeding Line",
      region: "ley",
      days: 3,
      lines: [
        [null, "A ley line has split open under a stream. The water runs gold for a mile, and the fish swim in slow, dazzled circles."],
        ["Saarni (if she were here)", "Lines heal if someone gives them something to heal with."],
      ],
      options: [
        { id: "stitch", label: "Stitch it with your heroes' own mana", say: "\"Hold hands. Push.\"", stakes: [["good", "A cut ley line nearby is mended, +1 Ley Shard"], ["bad", "Every hero loses 15% HP"]], result: "It takes all afternoon. When it's done the stream runs clear, and every hero sleeps like the dead.", effects: { mendLine: true, leyShards: 1, hurtAll: 0.15 } },
        { id: "bottle", label: "Bottle the light", say: "\"Waste not.\"", stakes: [["good", "+2 Ley Shards"], ["bad", "The wound festers: threat +15 here"]], result: "You fill every flask you own. The stream dims. Something under the water notices.", effects: { leyShards: 2, threatHere: 15 } },
        { id: "bathe", label: "Let the heroes bathe in it", say: "\"Just for a moment.\"", stakes: [["good", "Fights start +15 Overcharge for 3 days"]], result: "Everyone comes out humming. Nobody can say what the tune is.", effects: { lasting: { kind: "overcharge", amount: 15, days: 3, label: "Gold Water" } } },
      ],
    },
    {
      id: "c3-ley-sick",
      icon: "🕯",
      title: "Ley-Sick Children",
      region: "live",
      days: 3,
      lines: [
        [null, "In a hamlet near the wound, three children glow faintly in the dark. They're not in pain. They're just bright, and getting brighter."],
        ["Their Grandmother", "They won't stop shining. They don't sleep. They don't eat. They just... shine."],
      ],
      options: [
        { id: "hearth", label: "Bring them to the Hearth", say: "\"The Hearth has room for light.\"", cost: { essence: 80 }, stakes: [["bad", "-80 Essence"], ["good", "Their light warms the Hearth: heroes heal +6% a day for 6 days"]], result: "They sit around the fire all night. The fire grows, and they dim, a little at a time, until they're just children again.", effects: { essence: -80, lasting: { kind: "heal", amount: 0.06, days: 6, label: "Children's Light" } } },
        { id: "draw", label: "Draw the ley out into your heroes", say: "\"Give it to us. We can carry it.\"", stakes: [["good", "Every hero +3 XP"], ["bad", "Every hero loses 20% HP"]], result: "The light pours into your heroes like water into sand. The children fall asleep at once. Your heroes don't, for two days.", effects: { xpAll: 3, hurtAll: 0.2 } },
        { id: "wardens", label: "Send them to the Ley Wardens", say: "\"The Wardens will know what to do.\"", stakes: [["good", "Mistfen's watch tightens: Mistfen threat -10"], ["story", "You may never learn what became of them"]], result: "A Warden comes for them at dusk, tall and kind and saying nothing at all.", effects: { threat: { mistfen: -10 } } },
      ],
    },
  ],
  4: [
    {
      id: "c4-ash-market",
      icon: "🏮",
      title: "The Ash Market",
      region: "live",
      days: 2,
      lines: [
        [null, "Under a quarry overhang, smugglers have laid out a market on black cloth. Relics, stolen crowns, ley-glass, things still warm from the Rot."],
        ["The Fence", "Everything's for sale. Everything. Even you, if you stand still long enough."],
      ],
      options: [
        { id: "buy", label: "Buy a relic", say: "\"Show me the good stuff.\"", cost: { essence: 200 }, stakes: [["bad", "-200 Essence"], ["good", "A random relic"]], result: "It's wrapped in three layers of cloth and still hums through all of them.", effects: { essence: -200, relic: "random" } },
        { id: "rob", label: "Rob them", say: "\"Everything's for sale. Including your stock, to us, for nothing.\"", stakes: [["good", "+160 Essence"], ["bad", "Their enforcer hunts your next mission (beat it: +120 bounty)"]], result: "The smugglers scatter. Their enforcer doesn't. It just watches you go, and starts walking.", effects: { essence: 160, lasting: { kind: "rival", enemyId: "ashenmaw", name: "the Ash-Market Enforcer", title: "The Fence's Grudge", bounty: 120, days: 10 } } },
        { id: "walk", label: "Walk away", say: "\"Not our kind of shopping.\"", stakes: [["story", "Nothing gained, nothing owed"]], result: "The Fence shrugs. \"Your loss. Literally.\"", effects: {} },
      ],
    },
    {
      id: "c4-guardian-bones",
      icon: "🦴",
      title: "The Guardian's Bones",
      region: "live",
      days: 3,
      lines: [
        [null, "The great guardian of the centre died here, long ago. Its bones lie in a half-ring like a fallen crown, white as frost."],
      ],
      options: [
        { id: "bury", label: "Bury them properly", say: "\"It kept this place. We'll keep it now.\"", cost: { essence: 50 }, stakes: [["bad", "-50 Essence"], ["good", "Doom -1"]], result: "It takes all of you, and all day. At the end there's a mound, and the wind goes still over it.", effects: { essence: -50, doom: -1 } },
        { id: "wards", label: "Carve them into wards", say: "\"Let it guard us now.\"", stakes: [["good", "Enemies -4 threat for 6 days"], ["bad", "Two heroes spend a day carving"]], result: "Every ward hums when the Rot comes near. You hope the guardian would approve. You think it might.", effects: { tire: 2, lasting: { kind: "enemyBonus", amount: -4, days: 6, label: "Guardian Wards" } } },
        { id: "grind", label: "Grind them into ley-dust", say: "\"Bones are bones.\"", stakes: [["good", "+2 Ley Shards"], ["bad", "Doom +1"]], result: "The dust glows. Something far underground turns over in its sleep and remembers your name.", effects: { leyShards: 2, doom: 1 } },
      ],
    },
  ],
  5: [
    {
      id: "c5-pretender",
      icon: "🎭",
      title: "A Pretender's Herald",
      region: "live",
      days: 3,
      lines: [
        [null, "A herald in a borrowed crown rides up under a white flag."],
        ["The Herald", "My lord claims the empty throne, and offers you a place at his side. Kneel, and his guard is yours."],
      ],
      options: [
        { id: "accept", label: "Take his guard, promise nothing", say: "\"Send the guard. We'll talk about kneeling later.\"", stakes: [["good", "A Pretender's Guard fights beside you next mission"], ["bad", "The Reach hears you deal with pretenders: Crownless threat +10"]], result: "The guard is a big, sad man who says he's never seen the pretender's face. He fights well.", effects: { threat: { crownless: 10 }, lasting: { kind: "ally", unit: "stoneward", name: "Pretender's Guard", title: "A Borrowed Sword", days: 10 } } },
        { id: "refuse", label: "Refuse", say: "\"The throne stays empty.\"", stakes: [["bad", "The pretender's riders raid: Crownless threat +15"], ["good", "+2 XP to every hero - they've earned some pride"]], result: "The herald rides off. That night you see torches on the ridge. Your heroes stand a little straighter.", effects: { threat: { crownless: 15 }, xpAll: 2 } },
        { id: "expose", label: "Unmask the herald", say: "\"Let's see who's under that crown.\"", stakes: [["good", "It's a Rot puppet: Crownless threat -12"], ["bad", "One hero is clawed: every hero -10% HP"]], result: "The crown comes off and the face beneath is bark and nothing else. It screams and comes apart in your hands.", effects: { threat: { crownless: -12 }, hurtAll: 0.1 } },
      ],
    },
    {
      id: "c5-crown-echo",
      icon: "👑",
      title: "The Crown's Echo",
      region: "live",
      days: 2,
      lines: [
        [null, "You find a crown of black thorn in the grass, humming. It is not the crown. It is an echo of it, and it is offering."],
      ],
      options: [
        { id: "listen", label: "Listen to it", say: "\"What do you want?\"", stakes: [["good", "Fights start +20 Overcharge for 4 days"], ["bad", "Enemies +5 threat for 4 days"]], result: "It sings power into your bones - and every Rot-thing for a mile turns its head toward the sound.", effects: { lasting: [{ kind: "overcharge", amount: 20, days: 4, label: "Crown's Song" }, { kind: "enemyBonus", amount: 5, days: 4, label: "Crown's Song" }] } },
        { id: "bury", label: "Bury it deep", say: "\"Not for us.\"", stakes: [["good", "Doom -1"], ["bad", "Two heroes dig all day"]], result: "It hums all the way down, and keeps humming under the dirt. Quieter, though. Quieter.", effects: { doom: -1, tire: 2 } },
      ],
    },
  ],
  6: [
    {
      id: "c6-footprints",
      icon: "👣",
      title: "Your Own Footprints",
      region: "live",
      days: 2,
      lines: [
        [null, "In the soft ground ahead: footprints. Your boots. Your heroes' boots. Fresh. Leading somewhere you haven't been yet."],
      ],
      options: [
        { id: "follow", label: "Follow them", say: "\"Let's see where we went.\"", stakes: [["good", "A rare piece of gear (you left it for yourselves)"], ["bad", "Two heroes are gone a day"]], result: "At the end of the trail: a cache, wrapped in your own cloth, tied with your own knots. You don't remember leaving it. You will.", effects: { item: "rare", tire: 2 } },
        { id: "erase", label: "Erase them", say: "\"Nobody follows us. Not even us.\"", stakes: [["good", "The Rift loses your trail: threat -15 here"]], result: "You scuff out every print. Somewhere, very faintly, someone sighs in your voice.", effects: { threatHere: -15 } },
        { id: "note", label: "Leave a note for yourselves", say: "\"Dear us: watch the left flank.\"", stakes: [["good", "Mission Essence x1.25 for 5 days"]], result: "You write it, fold it, leave it under a stone. The next morning the stone is warm and the note is gone.", effects: { lasting: { kind: "essenceMult", mult: 1.25, days: 5, label: "Note to Self" } } },
      ],
    },
    {
      id: "c6-memory-market",
      icon: "🗝",
      title: "The Memory Market",
      region: "live",
      days: 3,
      lines: [
        [null, "Pale stalls in the Rift sell memories in glass jars: a first snow, a lost dog found, a war won long ago."],
        ["A Stallkeeper with No Face", "Buy, sell, trade. Memory is the only coin the Rift takes."],
      ],
      options: [
        { id: "buy", label: "Buy an old victory", say: "\"One good day. Bottled.\"", cost: { essence: 120 }, stakes: [["bad", "-120 Essence"], ["good", "Every hero +5 XP"]], result: "Each hero drinks a sip and remembers a battle they never fought, and how they won it.", effects: { essence: -120, xpAll: 5 } },
        { id: "sell", label: "Sell a sorrow", say: "\"Take the worst one. We don't need it.\"", stakes: [["good", "+150 Essence"], ["bad", "Enemies +3 threat for 4 days - something in you is missing"]], result: "It comes out grey and heavy. You feel lighter. You also feel like you've forgotten someone's name.", effects: { essence: 150, lasting: { kind: "enemyBonus", amount: 3, days: 4, label: "A Sorrow Sold" } } },
        { id: "leave", label: "Leave", say: "\"We'll keep our memories, thank you.\"", stakes: [["story", "The stallkeeper bows. Memories are patient."]], result: "You walk out with everything you came in with. That, in the Rift, is rare.", effects: {} },
      ],
    },
  ],
  7: [
    {
      id: "c7-lantern-keepers",
      icon: "🏮",
      title: "The Last Lantern-Keepers",
      region: "live",
      days: 3,
      lines: [
        [null, "Three old keepers stand at a crossroads with lanterns that have never once gone out."],
        ["The Eldest Keeper", "The last road is dark. We can light it - if you've anything to burn."],
      ],
      options: [
        { id: "light", label: "Give them ley to burn", say: "\"Light the road.\"", cost: { leyShards: 2 }, stakes: [["bad", "-2 Ley Shards"], ["good", "Enemies -6 threat for 6 days"]], result: "The lanterns flare blue-white. All down the last road, the shadows pull back like a held breath.", effects: { leyShards: -2, lasting: { kind: "enemyBonus", amount: -6, days: 6, label: "The Road Is Lit" } } },
        { id: "fight", label: "Ask one to fight with you", say: "\"Carry your lantern into the dark with us.\"", stakes: [["good", "A Lantern-Keeper fights beside you next mission"]], result: "The youngest keeper - perhaps eighty - picks up her staff and says, \"I'd hoped someone would ask.\"", effects: { lasting: { kind: "ally", unit: "glimmerward", name: "Lantern-Keeper", title: "The Last Light", days: 10 } } },
        { id: "home", label: "Send them home", say: "\"You've kept enough. Go and rest.\"", stakes: [["good", "Doom -1"]], result: "They look at each other, and laugh, and blow out their lanterns for the first time in a hundred years.", effects: { doom: -1 } },
      ],
    },
    {
      id: "c7-letter",
      icon: "✉",
      title: "A Letter From Home",
      region: "home",
      days: 3,
      lines: [
        [null, "A rider brings a letter from the Hearthstead, written in a dozen children's hands. Most of it is drawings. One of the drawings is you."],
      ],
      options: [
        { id: "read", label: "Read it aloud to everyone", say: "\"Gather round.\"", stakes: [["good", "Every hero heals to full, +2 XP"]], result: "The drawing of the Commander has very large arms. Nobody says anything for a while after.", effects: { healAll: true, xpAll: 2 } },
        { id: "keep", label: "Keep it for after", say: "\"We'll read it when it's over.\"", stakes: [["good", "Fights start +15 Overcharge for 6 days"]], result: "You fold it into your coat. Every time you touch the pocket, something warm goes through you.", effects: { lasting: { kind: "overcharge", amount: 15, days: 6, label: "Folded Letter" } } },
        { id: "write", label: "Write back", say: "\"Tell them we're coming home.\"", cost: { essence: 50 }, stakes: [["bad", "-50 Essence for the rider"], ["good", "A grown child of the Hearth comes to join you"]], result: "Two days later someone walks into camp with your letter in hand. \"You said you were coming home. I came to make sure.\"", effects: { essence: -50, recruit: "uncommon" } },
      ],
    },
  ],
}

// ---------------------------------------------------------------------------
// World events - any chapter, any day
// ---------------------------------------------------------------------------

export const WORLD_EVENTS = [
  {
    id: "w-caravan",
    icon: "🐫",
    title: "A Merchant Caravan",
    region: "live",
    days: 2,
    lines: [[null, "A caravan of painted wagons creaks along the road, guarded by six tired spears. The trader waves."], ["The Trader", "Buying, selling, hiring out! Mind the mule, she bites."]],
    options: [
      { id: "buy", label: "Buy their best piece", say: "\"What's under the oilcloth?\"", cost: { essence: 140 }, stakes: [["bad", "-140 Essence"], ["good", "A rare piece of gear"]], result: "It's better than they know. You don't tell them.", effects: { essence: -140, item: "rare" } },
      { id: "hire", label: "Hire one of their spears", say: "\"We could use a steady hand.\"", cost: { essence: 80 }, stakes: [["bad", "-80 Essence"], ["good", "A Caravan Guard fights beside you next mission"]], result: "The guard is called Petra, and she has opinions about your formation.", effects: { essence: -80, lasting: { kind: "ally", unit: "stoneward", name: "Petra the Caravan Guard", title: "Hired Spear", days: 10 } } },
      { id: "sell", label: "Sell them a Ley Shard", say: "\"How much for real ley-glass?\"", cost: { leyShards: 1 }, stakes: [["bad", "-1 Ley Shard"], ["good", "+200 Essence"]], result: "The trader holds it to the light and whistles. You've been underpaid, but not by much.", effects: { leyShards: -1, essence: 200 } },
    ],
  },
  {
    id: "w-ley-storm",
    icon: "🌩",
    title: "Ley Storm",
    region: "ley",
    days: 2,
    lines: [[null, "The sky over the region turns violet. Lightning falls upward. Every hero's hair stands on end, and their mana prickles like pins."]],
    options: [
      { id: "shelter", label: "Shelter and wait", say: "\"Nobody goes out in this.\"", stakes: [["bad", "The Rot moves under cover of the storm: threat +10 here"]], result: "You wait it out. When it clears, the Rot is closer than it was.", effects: { threatHere: 10 } },
      { id: "ride", label: "Ride it out in the open", say: "\"Let it come.\"", stakes: [["good", "+2 Ley Shards"], ["bad", "Every hero loses 10% HP"]], result: "It's like standing in a waterfall of needles. Afterwards the ground is studded with crystal.", effects: { leyShards: 2, hurtAll: 0.1 } },
      { id: "bottle", label: "Bottle the lightning", say: "\"Jars. All the jars.\"", stakes: [["good", "Fights start +15 Overcharge for 4 days"]], result: "The jars glow on the shelf for days, and everyone who walks past them feels braver.", effects: { lasting: { kind: "overcharge", amount: 15, days: 4, label: "Bottled Lightning" } } },
    ],
  },
  {
    id: "w-refugees",
    icon: "🧺",
    title: "Refugees on the Road",
    region: "live",
    days: 2,
    lines: [[null, "Families on the road with everything they own on their backs. The Rot took their village two nights ago."], ["A Father", "We don't need much. Just somewhere the trees don't move."]],
    options: [
      { id: "take", label: "Take them in", say: "\"The Hearth has room.\"", cost: { essence: 80 }, stakes: [["bad", "-80 Essence"], ["good", "One of them picks up a spear: a new hero joins"]], result: "They fill the Hearthstead with noise and cooking smells. Within a day, one of them is asking where the training yard is.", effects: { essence: -80, recruit: "common" } },
      { id: "point", label: "Send them to your allies", say: "\"Follow the road east. Tell them we sent you.\"", stakes: [["good", "Their village is retaken by locals: threat -8 here"]], result: "They thank you and walk on. A week later you hear they've gone home - with friends.", effects: { threatHere: -8 } },
      { id: "nothing", label: "You can't help them", say: "\"I'm sorry.\"", stakes: [["bad", "Doom +1"]], result: "They walk on. You watch them go, and the Rot watches them too.", effects: { doom: 1 } },
    ],
  },
  {
    id: "w-crows",
    icon: "🐦",
    title: "An Omen of Crows",
    region: "live",
    days: 2,
    lines: [[null, "A thousand crows settle in the trees at once, all facing the same way. Nobody speaks. The crows don't either."]],
    options: [
      { id: "read", label: "Read the omen", say: "\"Which way are they looking?\"", stakes: [["good", "They point where the Rot is thin: enemies -4 threat for 3 days"]], result: "They're looking at the Rot's gaps. You note them all down before the crows lift away.", effects: { lasting: { kind: "enemyBonus", amount: -4, days: 3, label: "The Crows' Map" } } },
      { id: "scatter", label: "Scatter them", say: "\"Shoo.\"", stakes: [["good", "+40 Essence in dropped trinkets"], ["bad", "Bad luck: enemies +3 threat for 3 days"]], result: "They burst up shrieking. Shiny things rain down. Old Tuuli spits three times and won't say why.", effects: { essence: 40, lasting: { kind: "enemyBonus", amount: 3, days: 3, label: "Scattered Crows" } } },
    ],
  },
  {
    id: "w-plea",
    icon: "📯",
    title: "A Plea From the Woods",
    region: "live",
    days: 2,
    lines: [[null, "A runner falls through the Hearthstead gate, gasping."], ["The Runner", "The woodsmen at the old mill - the Rot's at their door. Anything. Anyone."]],
    options: [
      { id: "heroes", label: "Send two heroes", say: "\"Go. Fast.\"", stakes: [["good", "+150 Essence (the mill pays), threat -15 here"], ["bad", "Two heroes are away a day"]], result: "They're back by nightfall, muddy and grinning, with a mill-owner's purse.", effects: { tire: 2, essence: 150, threatHere: -15 } },
      { id: "supplies", label: "Send supplies and spears", say: "\"Arm them. They can hold.\"", cost: { essence: 100 }, stakes: [["bad", "-100 Essence"], ["good", "The woodsmen hold: threat -20 here"]], result: "The woodsmen hold the mill. They send back a carved spoon with your Hearth's mark on it.", effects: { essence: -100, threatHere: -20 } },
      { id: "no", label: "We can't spare anyone", say: "\"Not today.\"", stakes: [["bad", "The mill burns: threat +10 here"]], result: "Smoke on the horizon by evening. Nobody mentions it at supper.", effects: { threatHere: 10 } },
    ],
  },
  {
    id: "w-smith",
    icon: "⚒",
    title: "The Wandering Smith",
    region: "home",
    days: 3,
    lines: [[null, "A smith with a forge on a handcart rolls into the Hearthstead and starts work without asking anyone."], ["The Smith", "Your blades are a disgrace. Don't argue. I can hear them."]],
    options: [
      { id: "temper", label: "Pay him to temper your best", say: "\"Make them sing.\"", cost: { essence: 150 }, stakes: [["bad", "-150 Essence"], ["good", "A rare piece of gear"]], result: "He works through the night. In the morning there's a new blade on the anvil that rings like a bell.", effects: { essence: -150, item: "rare" } },
      { id: "rest", label: "Let him rest at the Hearth", say: "\"Stay a while. Eat something.\"", stakes: [["good", "He fixes everything that's broken: heroes heal +6% a day for 5 days"]], result: "He mends armour, splints, a chair, three pots and somebody's hip. He leaves without being thanked.", effects: { lasting: { kind: "heal", amount: 0.06, days: 5, label: "The Smith's Mending" } } },
      { id: "cheap", label: "Buy his offcuts", say: "\"Anything you're throwing out?\"", cost: { essence: 60 }, stakes: [["bad", "-60 Essence"], ["good", "A piece of gear"]], result: "His offcuts are better than most people's masterpieces.", effects: { essence: -60, item: "common" } },
    ],
  },
  {
    id: "w-pilgrims",
    icon: "🎐",
    title: "Ley Pilgrims",
    region: "ley",
    days: 3,
    lines: [[null, "Pilgrims walk the ley lines barefoot, singing a song with no end. Where they step, the ground glows for a moment."]],
    options: [
      { id: "walk", label: "Walk a stretch with them", say: "\"We'll keep you company.\"", stakes: [["good", "Their song mends a cut ley line nearby"], ["bad", "One hero walks with them for a day"]], result: "By the end of the day you know the song. You still don't know how it ends. Nobody does.", effects: { tire: 1, mendLine: true } },
      { id: "bless", label: "Ask for their blessing", say: "\"Sing for us.\"", stakes: [["good", "Fights start +10 Overcharge for 6 days"]], result: "They sing your names into the song. It feels like being remembered by the ground.", effects: { lasting: { kind: "overcharge", amount: 10, days: 6, label: "Pilgrims' Blessing" } } },
      { id: "toll", label: "Charge them a toll", say: "\"These lines are ours to guard.\"", stakes: [["good", "+100 Essence"], ["bad", "The ley sours: threat +8 here"]], result: "They pay without a word and walk on. The song sounds different after.", effects: { essence: 100, threatHere: 8 } },
    ],
  },
  {
    id: "w-deserter",
    icon: "🍂",
    title: "A Rot Deserter",
    region: "live",
    days: 2,
    lines: [[null, "A small Rot-thing, half bark and half moss, kneels in the road with its twig-hands up."], ["The Deserter", "...don't want... to be the Rot. Want to be... a tree. Just a tree."]],
    options: [
      { id: "hear", label: "Hear it out", say: "\"Tell us what you know, and you can be any tree you like.\"", stakes: [["good", "It tells you their plans: enemies -4 threat for 5 days"]], result: "It talks for an hour. Then it walks into the meadow, puts its roots down, and is very still and very happy.", effects: { lasting: { kind: "enemyBonus", amount: -4, days: 5, label: "The Deserter's Tale" } } },
      { id: "end", label: "End it quickly", say: "\"Rot is Rot.\"", stakes: [["good", "Every hero +2 XP"], ["bad", "Something in the Grove remembers: threat +5 here"]], result: "It doesn't resist. Your heroes are quiet on the walk back.", effects: { xpAll: 2, threatHere: 5 } },
      { id: "plant", label: "Plant it at the Hearth", say: "\"You can be our tree.\"", stakes: [["good", "Doom -1"], ["story", "The Hearth has a strange new tree"]], result: "It grows a single gold leaf the first night. The children name it Twig.", effects: { doom: -1 } },
    ],
  },
  {
    id: "w-festival",
    icon: "🎉",
    title: "The Harvest Festival",
    region: "home",
    days: 2,
    lines: [[null, "The Hearthstead wants a festival. Somebody has already hung lanterns. Somebody else has already started the music."]],
    options: [
      { id: "hold", label: "Hold the festival", say: "\"One night. We've earned one night.\"", cost: { essence: 80 }, stakes: [["bad", "-80 Essence"], ["good", "Every hero heals to full"]], result: "There's dancing. There's a pie contest. The Commander loses the pie contest and takes it badly.", effects: { essence: -80, healAll: true } },
      { id: "work", label: "Work through it", say: "\"After. When it's over.\"", stakes: [["good", "+100 Essence"], ["bad", "Two heroes are worn out: they rest a day"]], result: "The lanterns come down unlit. The work gets done. Nobody's smiling.", effects: { essence: 100, tire: 2 } },
    ],
  },
  {
    id: "w-star",
    icon: "🌠",
    title: "A Falling Star",
    region: "live",
    days: 2,
    lines: [[null, "A light falls out of the sky and lands somewhere past the treeline with a sound like a struck bell."]],
    options: [
      { id: "fetch", label: "Go and fetch it", say: "\"Before something else does.\"", stakes: [["good", "+2 Ley Shards"], ["bad", "You drew attention: threat +10 here"]], result: "It's a ley crystal the size of a fist, still ringing. Every Rot-thing in the area heard it land too.", effects: { leyShards: 2, threatHere: 10 } },
      { id: "leave", label: "Leave it for the land", say: "\"The forest needs it more than we do.\"", stakes: [["good", "The land drinks it in: threat -15 here"]], result: "By morning there's a ring of white flowers where it fell. The Rot gives it a wide berth.", effects: { threatHere: -15 } },
    ],
  },
  {
    id: "w-old-hunter",
    icon: "🏹",
    title: "The Old Hunter",
    region: "live",
    days: 3,
    lines: [[null, "An old hunter with one eye and a very long bow shares your fire."], ["The Old Hunter", "There's a beast in these woods been taking my traps for a year. Help me, and I'll pay. Or buy my maps and I'll go home."]],
    options: [
      { id: "hunt", label: "Hunt the beast with him", say: "\"Point us at it.\"", stakes: [["good", "Beat the beast in your next mission: +150 bounty"], ["bad", "It joins your next fight, angry"]], result: "He grins a gap-toothed grin. \"It'll find you. It always finds me.\"", effects: { lasting: { kind: "rival", enemyId: "moss-troll", name: "the Trap-Taker", title: "The Old Hunter's Quarry", bounty: 150, days: 10 } } },
      { id: "maps", label: "Buy his maps", say: "\"Where are the good roads?\"", cost: { essence: 60 }, stakes: [["bad", "-60 Essence"], ["good", "Mission Essence x1.2 for 4 days"]], result: "The maps are drawn on bark and smell of smoke, and every shortcut on them is real.", effects: { essence: -60, lasting: { kind: "essenceMult", mult: 1.2, days: 4, label: "The Hunter's Maps" } } },
      { id: "send", label: "Wish him luck", say: "\"Good hunting.\"", stakes: [["story", "He goes. You hear his bow once, far off, that night."]], result: "He nods, takes his bow, and is gone before the fire's out.", effects: {} },
    ],
  },
  {
    id: "w-fog",
    icon: "🌫",
    title: "The Long Fog",
    region: "live",
    days: 2,
    lines: [[null, "A fog rolls in that doesn't lift. Sounds come from the wrong directions. The sentries swear the trees have moved."]],
    options: [
      { id: "lanterns", label: "Send out lantern patrols", say: "\"Keep the lights moving.\"", cost: { essence: 60 }, stakes: [["bad", "-60 Essence"], ["good", "Every region's threat -5"]], result: "Lanterns bob through the fog all night. The Rot, for once, can't find its way.", effects: { essence: -60, threatAll: -5 } },
      { id: "hide", label: "Let it hide you too", say: "\"If they can't see us, good.\"", stakes: [["good", "Enemies -3 threat for 3 days"], ["bad", "Threat grows x1.3 everywhere for 3 days"]], result: "You move unseen. So does the Rot.", effects: { lasting: [{ kind: "enemyBonus", amount: -3, days: 3, label: "Fog Cover" }, { kind: "threatMult", mult: 1.3, days: 3, label: "Fog Cover" }] } },
    ],
  },
]

// Daily chances (separate seeded stream - never moves the mission rolls).
export const CHAPTER_EVENT_CHANCE = 0.4
export const WORLD_EVENT_CHANCE = 0.3
export const WORLD_EVENT_FIRST_DAY = 3
